"""
Anthropic API client for screenshot analysis.
"""
import os
import base64
import requests
import time
from typing import List, Dict, Any
from datetime import datetime

from .base_client import BaseAPIClient
from ...common.logging_utils import (
    create_log_file_path,
    log_openai_request,  # We can reuse these logging functions
    log_openai_response
)


class AnthropicClient(BaseAPIClient):
    """
    Anthropic API client for screenshot analysis.
    """
    
    def __init__(self, api_key: str, api_endpoint: str, model: str, max_tokens: int = 4096, debug_dir: str = None):
        """
        Initialize the Anthropic API client.
        
        Args:
            api_key (str): Anthropic API key
            api_endpoint (str): Anthropic API endpoint
            model (str): Anthropic model name
            max_tokens (int): Maximum tokens for response
            debug_dir (str, optional): Directory to save debug information
        """
        self.api_key = api_key
        self.api_endpoint = api_endpoint
        self.model = model
        self.max_tokens = max_tokens
        self.debug_dir = debug_dir
    
    def analyze(self, screenshots: List[str], prompt: str) -> Dict[str, Any]:
        """
        Analyze screenshots using the Anthropic API.
        
        Args:
            screenshots (List[str]): List of screenshot paths
            prompt (str): Analysis prompt
            
        Returns:
            Dict[str, Any]: Analysis results
        """
        # Check if API key is valid
        if not self.api_key or self.api_key == "your_anthropic_api_key_here":
            print("Warning: Using default API key. Please update the API key in constants.py")
            return {
                "status": "error",
                "prompt": prompt,
                "screenshot_count": len(screenshots),
                "results": "Please set your Anthropic API key in constants.py before running analysis."
            }
        
        try:
            print(f"Processing {len(screenshots)} screenshots for Anthropic analysis")
            
            # Set up logging directory
            base_output_dir = os.getcwd()
            if self.debug_dir:
                base_output_dir = self.debug_dir
            elif screenshots:
                screenshot_dir = os.path.dirname(screenshots[0])
                if "screenshots" in screenshot_dir:
                    base_output_dir = os.path.dirname(screenshot_dir)
                    if os.path.basename(base_output_dir) == "screenshots":
                        base_output_dir = os.path.dirname(base_output_dir)
                else:
                    base_output_dir = screenshot_dir

            log_dir = os.path.join(base_output_dir, "logs")
            os.makedirs(log_dir, exist_ok=True)
            
            log_path = create_log_file_path(screenshots, log_dir)
            print(f"Logging Anthropic request and response to: {log_path}")
            
            # Prepare the content for the API request
            content = [{"type": "text", "text": prompt}]
            
            # Process and add each screenshot
            for i, screenshot_path in enumerate(screenshots):
                print(f"Processing screenshot {i+1}/{len(screenshots)}: {os.path.basename(screenshot_path)}")
                with open(screenshot_path, "rb") as img_file:
                    image_data = img_file.read()
                    encoded_image = base64.b64encode(image_data).decode('utf-8')
                    
                    # Get image type
                    image_type = "image/png" if screenshot_path.lower().endswith('.png') else "image/jpeg"
                    
                    # Add image in Anthropic's expected format
                    content.append({
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": image_type,
                            "data": encoded_image
                        }
                    })
            
            # Prepare the Anthropic API request
            payload = {
                "model": self.model,
                "max_tokens": self.max_tokens,
                "messages": [
                    {
                        "role": "user",
                        "content": content
                    }
                ]
            }
            
            # Set up headers
            headers = {
                "Content-Type": "application/json",
                "x-api-key": self.api_key,
                "anthropic-version": "2023-06-01"
            }
            
            # Create a copy of the payload for logging (without full images)
            logging_payload = {
                "model": self.model,
                "max_tokens": self.max_tokens,
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt}
                        ] + [
                            {"type": "image", "source": {"type": "base64", "media_type": "image/png", "data": "[IMAGE DATA REMOVED FOR LOGGING]"}} 
                            for _ in range(len(screenshots))
                        ]
                    }
                ]
            }
            
            # Log the request
            log_openai_request(log_path, prompt, screenshots, logging_payload)
            
            print("Sending request to Anthropic API...")
            
            # Record start time
            start_time = time.time()
            
            # Make the API request
            response = requests.post(
                self.api_endpoint,
                headers=headers,
                json=payload
            )
            
            # Calculate elapsed time
            elapsed_time = time.time() - start_time
            
            # Log the response
            try:
                response_data = response.json()
                log_openai_response(log_path, response_data, response.status_code, elapsed_time)
            except:
                with open(log_path, 'a') as f:
                    f.write("=" * 80 + "\n")
                    f.write(f"ANTHROPIC RESPONSE (ERROR) - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
                    f.write("=" * 80 + "\n\n")
                    f.write(f"Status Code: {response.status_code}\n")
                    f.write(f"Elapsed Time: {elapsed_time:.2f} seconds\n\n")
                    f.write("RESPONSE CONTENT (RAW):\n")
                    f.write(response.text)
                    f.write("\n\n")
            
            # Save debug information if debug_dir is provided
            if self.debug_dir:
                os.makedirs(self.debug_dir, exist_ok=True)
                
                with open(os.path.join(self.debug_dir, "anthropic_request.json"), "w") as f:
                    import json
                    json.dump(logging_payload, f, indent=2)
                
                with open(os.path.join(self.debug_dir, "anthropic_response.json"), "w") as f:
                    try:
                        json.dump(response.json(), f, indent=2)
                    except:
                        f.write(response.text)
            
            # Check if the request was successful
            if response.status_code == 200:
                response_data = response.json()
                
                # Extract the analysis text from the response
                try:
                    analysis_text = response_data["content"][0]["text"]
                    
                    return {
                        "status": "success",
                        "prompt": prompt,
                        "screenshot_count": len(screenshots),
                        "screenshots_analyzed": len(screenshots),
                        "results": analysis_text
                    }
                except (KeyError, IndexError) as e:
                    error_message = f"Could not extract analysis from response: {str(e)}"
                    print(error_message)
                    
                    return {
                        "status": "error",
                        "prompt": prompt,
                        "screenshot_count": len(screenshots),
                        "error": error_message,
                        "results": "Could not extract analysis from the API response."
                    }
            else:
                error_message = f"API request failed with status code {response.status_code}: {response.text}"
                print(error_message)
                
                return {
                    "status": "error",
                    "prompt": prompt,
                    "screenshot_count": len(screenshots),
                    "error": error_message,
                    "results": "Analysis failed. Please check your API key and try again."
                }
                
        except Exception as e:
            error_message = f"Error during API request: {str(e)}"
            print(error_message)
            
            return {
                "status": "error",
                "prompt": prompt,
                "screenshot_count": len(screenshots),
                "error": error_message,
                "results": "Analysis failed due to an exception. See error details."
            }