"""
Logging utilities for the website analyzer.
"""
import os
import json
from datetime import datetime
from typing import Dict, Any, List

def create_log_file_path(file_paths: List[str], output_dir: str, provider: str = "api") -> str:
    """
    Create a log file path based on the input file path.
    
    Args:
        file_paths (List[str]): Paths to the files being analyzed
        output_dir (str): Directory to save the log file
        provider (str): API provider name
        
    Returns:
        str: Path to the log file
    """
    if not file_paths:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        return os.path.join(output_dir, f"{provider}_log_{timestamp}.log")
    
    # Use the basename of the first file as the identifier
    file_name = os.path.basename(file_paths[0])
    file_base = os.path.splitext(file_name)[0]
    
    # Ensure the output directory exists
    os.makedirs(output_dir, exist_ok=True)
    
    return os.path.join(output_dir, f"{provider}_log_{file_base}.log")

def log_request(log_path: str, provider: str, prompt: str, file_paths: List[str], payload: Dict[str, Any]) -> None:
    """
    Log the request to API.
    
    Args:
        log_path (str): Path to the log file
        provider (str): API provider name
        prompt (str): The prompt sent to API
        file_paths (List[str]): Paths to the files being analyzed
        payload (Dict[str, Any]): The payload sent to API (without full image data)
    """
    with open(log_path, 'w') as f:
        f.write("=" * 80 + "\n")
        f.write(f"{provider.upper()} REQUEST - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write("=" * 80 + "\n\n")
        
        # Log files being processed
        f.write("FILES PROCESSED:\n")
        for i, file_path in enumerate(file_paths):
            f.write(f"{i+1}. {file_path}\n")
        f.write("\n")
        
        # Log prompt
        f.write("PROMPT:\n")
        f.write(f"{prompt}\n\n")
        
        # Log request payload (without full image data)
        f.write("REQUEST PAYLOAD:\n")
        f.write(json.dumps(payload, indent=2))
        f.write("\n\n")

def log_response(log_path: str, provider: str, response_data: Dict[str, Any], status_code: int, elapsed_time: float) -> None:
    """
    Log the response from API.
    
    Args:
        log_path (str): Path to the log file
        provider (str): API provider name
        response_data (Dict[str, Any]): The response data from API
        status_code (int): HTTP status code
        elapsed_time (float): Time taken for the request in seconds
    """
    with open(log_path, 'a') as f:
        f.write("=" * 80 + "\n")
        f.write(f"{provider.upper()} RESPONSE - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write("=" * 80 + "\n\n")
        
        # Log status code and time
        f.write(f"Status Code: {status_code}\n")
        f.write(f"Elapsed Time: {elapsed_time:.2f} seconds\n\n")
        
        # Log response content
        f.write("RESPONSE CONTENT:\n")
        f.write(json.dumps(response_data, indent=2))
        f.write("\n\n")
        
        # Extract and log the content separately for readability based on provider
        if provider.lower() == "openai":
            if 'choices' in response_data and response_data['choices']:
                try:
                    content = response_data['choices'][0]['message']['content']
                    f.write("RESPONSE CONTENT (EXTRACTED):\n")
                    f.write(content)
                    f.write("\n\n")
                except (KeyError, IndexError):
                    pass
        elif provider.lower() == "anthropic":
            if 'content' in response_data and response_data['content']:
                try:
                    content = response_data['content'][0]['text']
                    f.write("RESPONSE CONTENT (EXTRACTED):\n")
                    f.write(content)
                    f.write("\n\n")
                except (KeyError, IndexError):
                    pass

# For backward compatibility
log_openai_request = lambda log_path, prompt, file_paths, payload: log_request(log_path, "openai", prompt, file_paths, payload)
log_openai_response = lambda log_path, response_data, status_code, elapsed_time: log_response(log_path, "openai", response_data, status_code, elapsed_time)