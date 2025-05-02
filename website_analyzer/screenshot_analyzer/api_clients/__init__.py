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
    ANTHROPIC_HIGH_TIER_MODEL,
    ANTHROPIC_STD_TIER_MODEL
)

def get_api_client(provider=None, tier="high", debug_dir=None):
    """
    Get the appropriate API client based on configuration.
    
    Args:
        provider (str): API provider (openai or anthropic)
        tier (str): Model tier (high or standard)
        debug_dir (str): Debug directory
    
    Returns:
        The appropriate API client instance
    """
    provider = provider or API_PROVIDER.lower()
    
    if provider == "openai":
        return OpenAIClient(
            api_key=OPENAI_API_KEY,
            api_endpoint=OPENAI_API_ENDPOINT,
            model=OPENAI_MODEL,
            debug_dir=debug_dir
        )
    elif provider == "anthropic":
        model = ANTHROPIC_HIGH_TIER_MODEL if tier == "high" else ANTHROPIC_STD_TIER_MODEL
        return AnthropicClient(
            api_key=ANTHROPIC_API_KEY,
            api_endpoint=ANTHROPIC_API_ENDPOINT,
            model=model,
            debug_dir=debug_dir,
            tier=tier
        )
    else:
        print(f"Unknown API provider: {provider}. Defaulting to Anthropic.")
        model = ANTHROPIC_HIGH_TIER_MODEL if tier == "high" else ANTHROPIC_STD_TIER_MODEL
        return AnthropicClient(
            api_key=ANTHROPIC_API_KEY,
            api_endpoint=ANTHROPIC_API_ENDPOINT,
            model=model,
            debug_dir=debug_dir,
            tier=tier
        )