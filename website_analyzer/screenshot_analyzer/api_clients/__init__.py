"""
API clients for screenshot analysis.
"""
from .openai_client import OpenAIClient
from .anthropic_client import AnthropicClient
from ...common.constants import (
    API_PROVIDER, 
    OPENAI_API_KEY, 
    OPENAI_API_ENDPOINT, 
    OPENAI_MODEL,
    ANTHROPIC_API_KEY,
    ANTHROPIC_API_ENDPOINT,
    ANTHROPIC_MODEL,
    ANTHROPIC_MAX_TOKENS
)

def get_api_client():
    """
    Get the appropriate API client based on configuration.
    
    Returns:
        The appropriate API client instance
    """
    provider = API_PROVIDER.lower()
    
    if provider == "openai":
        return OpenAIClient(
            api_key=OPENAI_API_KEY,
            api_endpoint=OPENAI_API_ENDPOINT,
            model=OPENAI_MODEL
        )
    elif provider == "anthropic":
        return AnthropicClient(
            api_key=ANTHROPIC_API_KEY,
            api_endpoint=ANTHROPIC_API_ENDPOINT,
            model=ANTHROPIC_MODEL,
            max_tokens=ANTHROPIC_MAX_TOKENS
        )
    else:
        print(f"Unknown API provider: {provider}. Defaulting to OpenAI.")
        return OpenAIClient(
            api_key=OPENAI_API_KEY,
            api_endpoint=OPENAI_API_ENDPOINT,
            model=OPENAI_MODEL
        )