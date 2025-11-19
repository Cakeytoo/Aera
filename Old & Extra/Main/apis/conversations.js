from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List
from datetime import datetime
import asyncpg
import databutton as db
from app.auth import AuthorizedUser

router = APIRouter(prefix="/conversations")

# Pydantic Models for API requests and responses
class CreateConversationRequest(BaseModel):
    """Request model for creating a new conversation"""
    title: str = Field(..., min_length=1, max_length=200, description="Title of the conversation")

class ConversationResponse(BaseModel):
    """Response model for conversation data"""
    id: str = Field(..., description="Unique identifier for the conversation")
    user_id: str = Field(..., description="ID of the user who owns this conversation")
    title: str = Field(..., description="Title of the conversation")
    created_at: datetime = Field(..., description="When the conversation was created")
    updated_at: datetime = Field(..., description="When the conversation was last updated")

class MessageResponse(BaseModel):
    """Response model for message data"""
    id: str = Field(..., description="Unique identifier for the message")
    conversation_id: str = Field(..., description="ID of the conversation this message belongs to")
    role: str = Field(..., description="Role of the message sender (user, assistant, system)")
    content: str = Field(..., description="Content of the message")
    created_at: datetime = Field(..., description="When the message was created")

# Database connection helper
async def get_db_connection():
    """Get a connection to the database"""
    database_url = db.secrets.get("DATABASE_URL_DEV")
    return await asyncpg.connect(database_url)

@router.post("/", response_model=ConversationResponse)
async def create_conversation(request: CreateConversationRequest, user: AuthorizedUser):
    """Create a new conversation for the authenticated user"""
    conn = await get_db_connection()
    try:
        # Insert new conversation into database
        row = await conn.fetchrow(
            """
            INSERT INTO conversations (user_id, title)
            VALUES ($1, $2)
            RETURNING id, user_id, title, created_at, updated_at
            """,
            user.sub,  # user_id from auth token
            request.title
        )
        
        if not row:
            raise HTTPException(status_code=500, detail="Failed to create conversation")
        
        return ConversationResponse(
            id=str(row['id']),
            user_id=row['user_id'],
            title=row['title'],
            created_at=row['created_at'],
            updated_at=row['updated_at']
        )
    
    except Exception as e:
        print(f"Error creating conversation: {e}")
        raise HTTPException(status_code=500, detail="Failed to create conversation")
    finally:
        await conn.close()

@router.get("/", response_model=List[ConversationResponse])
async def list_conversations(user: AuthorizedUser):
    """List all conversations for the authenticated user"""
    conn = await get_db_connection()
    try:
        # Fetch conversations for the authenticated user only
        rows = await conn.fetch(
            """
            SELECT id, user_id, title, created_at, updated_at
            FROM conversations
            WHERE user_id = $1
            ORDER BY created_at DESC
            """,
            user.sub
        )
        
        return [
            ConversationResponse(
                id=str(row['id']),
                user_id=row['user_id'],
                title=row['title'],
                created_at=row['created_at'],
                updated_at=row['updated_at']
            )
            for row in rows
        ]
    
    except Exception as e:
        print(f"Error listing conversations: {e}")
        raise HTTPException(status_code=500, detail="Failed to list conversations")
    finally:
        await conn.close()

@router.get("/{conversation_id}/messages", response_model=List[MessageResponse])
async def list_messages(conversation_id: str, user: AuthorizedUser):
    """List all messages for a specific conversation owned by the authenticated user"""
    conn = await get_db_connection()
    try:
        # First verify that the conversation belongs to the authenticated user
        conversation = await conn.fetchrow(
            "SELECT id FROM conversations WHERE id = $1 AND user_id = $2",
            conversation_id,
            user.sub
        )
        
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found or access denied")
        
        # Fetch messages for the conversation
        rows = await conn.fetch(
            """
            SELECT id, conversation_id, role, content, created_at
            FROM messages
            WHERE conversation_id = $1
            ORDER BY created_at ASC
            """,
            conversation_id
        )
        
        return [
            MessageResponse(
                id=str(row['id']),
                conversation_id=str(row['conversation_id']),
                role=row['role'],
                content=row['content'],
                created_at=row['created_at']
            )
            for row in rows
        ]
    
    except HTTPException:
        raise  # Re-raise HTTP exceptions as-is
    except Exception as e:
        print(f"Error listing messages: {e}")
        raise HTTPException(status_code=500, detail="Failed to list messages")
    finally:
        await conn.close()
