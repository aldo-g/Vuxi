"""
Common utilities and constants for the website analyzer.
"""
from .utils import (
    is_same_domain,
    normalize_url,
    is_downloadable_file,
    create_filename_from_url,
    get_score_class
)
from .constants import (
    API_PROVIDER,
    OPENAI_API_KEY,
    OPENAI_API_ENDPOINT,
    OPENAI_MODEL
)

__all__ = [
    'is_same_domain',
    'normalize_url',
    'is_downloadable_file',
    'create_filename_from_url',
    'get_score_class',
    'API_PROVIDER',
    'OPENAI_API_KEY',
    'OPENAI_API_ENDPOINT',
    'OPENAI_MODEL'
]