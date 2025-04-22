"""
Common utilities and constants for the website analyzer.
"""
from .url_utils import (
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

from .logging_utils import (
    create_log_file_path,
    log_openai_request,
    log_openai_response
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
    'OPENAI_MODEL',
    'create_log_file_path',
    'log_openai_request',
    'log_openai_response'
]