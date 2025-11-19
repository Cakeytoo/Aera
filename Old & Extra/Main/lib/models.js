"""Database models for the application"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

class ConversationModel(BaseModel):
    """Model representing a conversation in the database"""
    id: str
    user_id: str
    title: str
    created_at: datetime
    updated_at: datetime

class MessageModel(BaseModel):
    """Model representing a message in the database"""
    id: str
    conversation_id: str
    role: str  # 'user', 'assistant', or 'system'
    content: str
    created_at: datetime

class ChatMessageInput(BaseModel):
    """Input model for chat messages"""
    role: str = Field(..., pattern="^(user|assistant|system)$")
    content: str = Field(..., min_length=1, max_length=10000)

class ChatRequest(BaseModel):
    """Request model for chat operations"""
    conversation_id: Optional[str] = None
    messages: List[ChatMessageInput] = Field(..., min_items=1)

class AIServiceConfig(BaseModel):
    """Configuration for AI service"""
    endpoint_url: str
    timeout_seconds: int = 60
    max_tokens: Optional[int] = None
    temperature: Optional[float] = None
