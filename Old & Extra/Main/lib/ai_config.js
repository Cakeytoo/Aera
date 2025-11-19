
"""Configuration for AI service endpoints"""

import databutton as db
from typing import Optional

def get_ai_endpoint() -> str:
    """Get the AI service endpoint URL"""
    # Check if a custom AI endpoint is configured in secrets
    try:
        custom_endpoint = db.secrets.get("AI_ENDPOINT_URL")
        if custom_endpoint:
            return custom_endpoint
    except Exception:
        # Secret doesn't exist, use default
        pass
    
    # Default to localhost:3000 for development
    return "http://localhost:3000"

def get_ai_timeout() -> int:
    """Get the timeout for AI service calls"""
    # Check if a custom timeout is configured
    try:
        timeout_str = db.secrets.get("AI_TIMEOUT_SECONDS")
        if timeout_str:
            try:
                return int(timeout_str)
            except ValueError:
                pass
    except Exception:
        # Secret doesn't exist, use default
        pass
    
    # Default timeout of 60 seconds
    return 60
