

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import List, Optional, AsyncGenerator
import asyncpg
import databutton as db
import requests
import json
import uuid
from datetime import datetime
from app.auth import AuthorizedUser
from app.libs.ai_config import get_ai_endpoint, get_ai_timeout

router = APIRouter(prefix="/chat")

# Pydantic Models
class ChatMessage(BaseModel):
    """Individual message in a chat conversation"""
    role: str = Field(..., pattern="^(user|assistant|system)$", description="Role of the message sender")
    content: str = Field(..., min_length=1, description="Content of the message")

class ChatStreamRequest(BaseModel):
    """Request model for streaming chat completion"""
    conversation_id: Optional[str] = Field(None, description="Optional conversation ID. If not provided, a new conversation will be created")
    messages: List[ChatMessage] = Field(..., min_items=1, description="List of messages in the conversation")

# Database connection helper
async def get_db_connection():
    """Get a connection to the database"""
    database_url = db.secrets.get("DATABASE_URL_DEV")
    return await asyncpg.connect(database_url)

def is_valid_uuid(uuid_string: str) -> bool:
    """Check if a string is a valid UUID"""
    try:
        uuid.UUID(uuid_string)
        return True
    except (ValueError, TypeError):
        return False

async def verify_conversation_access(conversation_id: str, user_id: str) -> bool:
    """Verify that the user has access to the conversation"""
    if not is_valid_uuid(conversation_id):
        return False
        
    conn = await get_db_connection()
    try:
        row = await conn.fetchrow(
            "SELECT id FROM conversations WHERE id = $1 AND user_id = $2",
            conversation_id, user_id
        )
        return row is not None
    finally:
        await conn.close()

async def create_conversation_if_needed(conversation_id: Optional[str], user_id: str) -> str:
    """Create a new conversation if conversation_id is not provided"""
    if conversation_id:
        # Verify it's a valid UUID format first
        if not is_valid_uuid(conversation_id):
            raise HTTPException(status_code=400, detail="Invalid conversation_id format. Must be a valid UUID.")
            
        # Verify access to existing conversation
        if not await verify_conversation_access(conversation_id, user_id):
            raise HTTPException(status_code=404, detail="Conversation not found or access denied")
        return conversation_id
    
    # Create new conversation
    conn = await get_db_connection()
    try:
        row = await conn.fetchrow(
            """
            INSERT INTO conversations (user_id, title)
            VALUES ($1, $2)
            RETURNING id
            """,
            user_id,
            "New Chat"  # Default title, could be improved later
        )
        return str(row['id'])
    finally:
        await conn.close()

async def save_message(conversation_id: str, role: str, content: str) -> str:
    """Save a message to the database"""
    conn = await get_db_connection()
    try:
        row = await conn.fetchrow(
            """
            INSERT INTO messages (conversation_id, role, content)
            VALUES ($1, $2, $3)
            RETURNING id
            """,
            conversation_id, role, content
        )
        return str(row['id'])
    finally:
        await conn.close()

async def update_conversation_timestamp(conversation_id: str):
    """Update the conversation's updated_at timestamp"""
    conn = await get_db_connection()
    try:
        await conn.execute(
            "UPDATE conversations SET updated_at = NOW() WHERE id = $1",
            conversation_id
        )
    finally:
        await conn.close()

async def call_external_ai_stream(messages: List[dict]) -> AsyncGenerator[str, None]:
    """Call the external AI API and yield streaming response chunks"""
    ai_endpoint = get_ai_endpoint()
    ai_timeout = get_ai_timeout()
    
    try:
        # Prepare the request to external AI service
        payload = {
            "messages": messages,
            "stream": True
        }
        
        print(f"Calling external AI at {ai_endpoint}/chat/completions")
        
        # Make streaming request to external AI service
        response = requests.post(
            f"{ai_endpoint}/chat/completions",
            json=payload,
            stream=True,
            timeout=ai_timeout
        )
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=502, 
                detail=f"External AI service error: {response.status_code}"
            )
        
        # Stream the response
        for line in response.iter_lines():
            if line:
                line_str = line.decode('utf-8')
                if line_str.startswith('data: '):
                    data_str = line_str[6:]  # Remove 'data: ' prefix
                    if data_str.strip() == '[DONE]':
                        break
                    try:
                        data = json.loads(data_str)
                        if 'choices' in data and len(data['choices']) > 0:
                            delta = data['choices'][0].get('delta', {})
                            content = delta.get('content', '')
                            if content:
                                yield content
                    except json.JSONDecodeError:
                        continue  # Skip malformed JSON
                        
    except requests.exceptions.RequestException as e:
        print(f"Error calling external AI service: {e}")
        raise HTTPException(
            status_code=502,
            detail=f"Failed to connect to AI service at {ai_endpoint}. Please ensure the AI service is running."
        ) from None

@router.post("/stream", tags=["stream"])
async def chat_stream(request: ChatStreamRequest, user: AuthorizedUser):
    """Stream chat completion with message persistence"""
    
    try:
        print(f"Starting chat stream for user {user.sub}")
        
        # Validate and sanitize input
        if not request.messages:
            raise HTTPException(status_code=400, detail="At least one message is required")
        
        # Ensure the last message is from the user
        last_message = request.messages[-1]
        if last_message.role != "user":
            raise HTTPException(status_code=400, detail="Last message must be from user")
        
        # Create or verify conversation
        conversation_id = await create_conversation_if_needed(request.conversation_id, user.sub)
        print(f"Using conversation: {conversation_id}")
        
        # Save the user's message
        user_message_content = last_message.content
        await save_message(conversation_id, "user", user_message_content)
        print("Saved user message")
        
        # Prepare messages for AI service (convert to dict format)
        ai_messages = [{
            "role": msg.role,
            "content": msg.content
        } for msg in request.messages]
        
        # Generator function for streaming response
        async def generate_response():
            assistant_response = ""
            
            try:
                async for chunk in call_external_ai_stream(ai_messages):
                    assistant_response += chunk
                    yield chunk
                
                # Save the complete assistant response
                if assistant_response:
                    await save_message(conversation_id, "assistant", assistant_response)
                    await update_conversation_timestamp(conversation_id)
                    print("Saved assistant response and updated conversation timestamp")
                
            except Exception as e:
                print(f"Error in streaming response: {e}")
                # Still try to save partial response if any
                if assistant_response:
                    await save_message(conversation_id, "assistant", assistant_response)
                    await update_conversation_timestamp(conversation_id)
                raise
        
        return StreamingResponse(generate_response(), media_type="text/plain")
        
    except HTTPException:
        raise  # Re-raise HTTP exceptions as-is
    except Exception as e:
        print(f"Unexpected error in chat stream: {e}")
        raise HTTPException(status_code=500, detail="Internal server error occurred") from None
