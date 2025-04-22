"""
Logging utilities for the website analyzer.
"""
import os
import json
from datetime import datetime
from typing import Dict, Any, List

def create_log_file_path(file_paths: List[str], output_dir: str) -> str:
    """
    Create a log file path based on the input file path.
    
    Args:
        file_paths (List[str]): Paths to the files being analyzed
        output_dir (str): Directory to save the log file
        
    Returns:
        str: Path to the log file
    """
    if not file_paths:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        return os.path.join(output_dir, f"openai_log_{timestamp}.log")
    
    # Use the basename of the first file as the identifier
    file_name = os.path.basename(file_paths[0])
    file_base = os.path.splitext(file_name)[0]
    
    # Ensure the output directory exists
    os.makedirs(output_dir, exist_ok=True)
    
    return os.path.join(output_dir, f"openai_log_{file_base}.log")

def log_openai_request(log_path: str, prompt: str, file_paths: List[str], payload: Dict[str, Any]) -> None:
    """
    Log the request to OpenAI API.
    
    Args:
        log_path (str): Path to the log file
        prompt (str): The prompt sent to OpenAI
        file_paths (List[str]): Paths to the files being analyzed
        payload (Dict[str, Any]): The payload sent to OpenAI (without full image data)
    """
    with open(log_path, 'w') as f:
        f.write("=" * 80 + "\n")
        f.write(f"OPENAI REQUEST - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
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

def log_openai_response(log_path: str, response_data: Dict[str, Any], status_code: int, elapsed_time: float) -> None:
    """
    Log the response from OpenAI API.
    
    Args:
        log_path (str): Path to the log file
        response_data (Dict[str, Any]): The response data from OpenAI
        status_code (int): HTTP status code
        elapsed_time (float): Time taken for the request in seconds
    """
    with open(log_path, 'a') as f:
        f.write("=" * 80 + "\n")
        f.write(f"OPENAI RESPONSE - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write("=" * 80 + "\n\n")
        
        # Log status code and time
        f.write(f"Status Code: {status_code}\n")
        f.write(f"Elapsed Time: {elapsed_time:.2f} seconds\n\n")
        
        # Log response content
        f.write("RESPONSE CONTENT:\n")
        f.write(json.dumps(response_data, indent=2))
        f.write("\n\n")
        
        # If there are response choices, extract and log the content separately for readability
        if 'choices' in response_data and response_data['choices']:
            try:
                content = response_data['choices'][0]['message']['content']
                f.write("RESPONSE CONTENT (EXTRACTED):\n")
                f.write(content)
                f.write("\n\n")
            except (KeyError, IndexError):
                pass