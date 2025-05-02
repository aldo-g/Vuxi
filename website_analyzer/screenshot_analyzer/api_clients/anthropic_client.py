"""
Anthropic API client for screenshot analysis.
"""
import os
import json
import base64
import requests
import time
from typing import List, Dict, Any, Optional
from datetime import datetime

from .base_client import BaseAPIClient
from ...common.logging_utils import (
    create_log_file_path,
    log_request,
    log_response
)


class AnthropicClient(BaseAPIClient):
    """
    Anthropic API client for screenshot analysis.
    """
    
    def __init__(self, api_key: str, api_endpoint: str, model: str, debug_dir: str = None, tier: str = "high"):
        """
        Initialize the Anthropic API client.
        
        Args:
            api_key (str): Anthropic API key
            api_endpoint (str): Anthropic API endpoint
            model (str): Anthropic model name
            debug_dir (str, optional): Directory to save debug information
            tier (str): Model tier (high or standard)
        """
        self.api_key = api_key
        self.api_endpoint = api_endpoint
        self.model = model
        self.debug_dir = debug_dir
        self.tier = tier
    
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
            base_output_dir = os.getcwd()  # Default to current directory

            if self.debug_dir:
                # If a debug directory is specified, use it as the base
                base_output_dir = self.debug_dir
            elif screenshots:
                # Otherwise, use a directory based on the screenshot path
                screenshot_dir = os.path.dirname(screenshots[0])
                
                # If the screenshots are in a screenshots directory, go up one level
                if "screenshots" in screenshot_dir:
                    # Go up to the parent directory of screenshots
                    base_output_dir = os.path.dirname(screenshot_dir)
                    
                    # If it's in a subdirectory of screenshots, go up one more level
                    if os.path.basename(base_output_dir) == "screenshots":
                        base_output_dir = os.path.dirname(base_output_dir)
                else:
                    # If not in a screenshots directory, use the directory containing the screenshot
                    base_output_dir = screenshot_dir

            log_dir = os.path.join(base_output_dir, "logs")
            os.makedirs(log_dir, exist_ok=True)
            
            # Create log file path based on input files
            log_path = create_log_file_path(screenshots, log_dir, "anthropic")
            print(f"Logging Anthropic request and response to: {log_path}")
            
            # Process and add each screenshot
            image_parts = []
            for i, screenshot_path in enumerate(screenshots):
                print(f"Processing screenshot {i+1}/{len(screenshots)}: {os.path.basename(screenshot_path)}")
                with open(screenshot_path, "rb") as img_file:
                    encoded_image = base64.b64encode(img_file.read()).decode('utf-8')
                    
                    # Add image in Anthropic's expected format
                    image_parts.append({
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": "image/png",
                            "data": encoded_image
                        }
                    })
            
            # Combine text and images
            content = [
                {"type": "text", "text": prompt},
                *image_parts
            ]
            
            # Prepare the Anthropic API request
            payload = {
                "model": self.model,
                "max_tokens": 4000,
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
                "max_tokens": 4000,
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            *[{"type": "image", "source": {"type": "base64", "data": "[IMAGE DATA REMOVED FOR LOGGING]"}} for _ in range(len(screenshots))]
                        ]
                    }
                ]
            }
            
            # Log the request using the simplified payload
            log_request(log_path, "anthropic", prompt, screenshots, logging_payload)
            
            print("Sending request to Anthropic API...")
            
            # Record start time for timing the request
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
                log_response(log_path, "anthropic", response_data, response.status_code, elapsed_time)
            except:
                # If response isn't valid JSON, log the text
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
                
                # Save a simplified version of the payload (without the full base64 images)
                with open(os.path.join(self.debug_dir, "anthropic_request.json"), "w") as f:
                    json.dump(logging_payload, f, indent=2)
                
                # Save the response
                with open(os.path.join(self.debug_dir, "anthropic_response.json"), "w") as f:
                    try:
                        json.dump(response.json(), f, indent=2)
                    except:
                        f.write(response.text)
            
            # Check if the request was successful
            if response.status_code == 200:
                # Parse the response
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
                # Handle error
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
    
    def format(self, analysis_text: str, prompt: str) -> Dict[str, Any]:
        """
        Format analysis text using the Anthropic API.
        
        Args:
            analysis_text (str): Raw analysis text to format
            prompt (str): Formatting prompt
            
        Returns:
            Dict[str, Any]: Formatted results
        """
        # Similar to analyze, but without screenshots
        try:
            print("Formatting analysis text with Anthropic")
            
            # Set up logging directory
            log_dir = os.path.join(os.getcwd(), "logs") if not self.debug_dir else os.path.join(self.debug_dir, "logs")
            os.makedirs(log_dir, exist_ok=True)
            
            # Create log file path
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            log_path = os.path.join(log_dir, f"anthropic_format_{timestamp}.log")
            
            # Prepare the Anthropic API request
            full_prompt = f"{prompt}\n\nANALYSIS TEXT TO FORMAT:\n\n{analysis_text}"
            
            payload = {
                "model": self.model,
                "max_tokens": 4000,
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": full_prompt}
                        ]
                    }
                ]
            }
            
            # Set up headers
            headers = {
                "Content-Type": "application/json",
                "x-api-key": self.api_key,
                "anthropic-version": "2023-06-01"
            }
            
            # Log the request
            with open(log_path, 'w') as f:
                f.write("=" * 80 + "\n")
                f.write(f"ANTHROPIC FORMAT REQUEST - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
                f.write("=" * 80 + "\n\n")
                f.write("PROMPT:\n")
                f.write(f"{prompt}\n\n")
                f.write("ANALYSIS TEXT (FIRST 500 CHARS):\n")
                f.write(f"{analysis_text[:500]}...\n\n")
            
            print("Sending format request to Anthropic API...")
            start_time = time.time()
            
            # Make the API request
            response = requests.post(
                self.api_endpoint,
                headers=headers,
                json=payload
            )
            
            elapsed_time = time.time() - start_time
            
            # Log the response
            try:
                response_data = response.json()
                with open(log_path, 'a') as f:
                    f.write("=" * 80 + "\n")
                    f.write(f"ANTHROPIC FORMAT RESPONSE - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
                    f.write("=" * 80 + "\n\n")
                    f.write(f"Status Code: {response.status_code}\n")
                    f.write(f"Elapsed Time: {elapsed_time:.2f} seconds\n\n")
                    f.write("RESPONSE CONTENT:\n")
                    f.write(json.dumps(response_data, indent=2))
                    f.write("\n\n")
            except:
                with open(log_path, 'a') as f:
                    f.write("=" * 80 + "\n")
                    f.write(f"ANTHROPIC FORMAT RESPONSE (ERROR) - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
                    f.write("=" * 80 + "\n\n")
                    f.write(f"Status Code: {response.status_code}\n")
                    f.write(f"Elapsed Time: {elapsed_time:.2f} seconds\n\n")
                    f.write("RESPONSE CONTENT (RAW):\n")
                    f.write(response.text)
                    f.write("\n\n")
            
            # Check if the request was successful
            if response.status_code == 200:
                # Parse the response
                response_data = response.json()
                
                # Extract the formatted text from the response
                try:
                    formatted_text = response_data["content"][0]["text"]
                    
                    # Try to extract JSON from the response if the formatted text contains JSON
                    try:
                        if "```json" in formatted_text:
                            json_start = formatted_text.find("```json") + 7
                            json_end = formatted_text.find("```", json_start)
                            json_text = formatted_text[json_start:json_end].strip()
                            formatted_data = json.loads(json_text)
                            
                            return {
                                "status": "success",
                                "text": formatted_text,
                                "data": formatted_data
                            }
                    except json.JSONDecodeError:
                        pass
                    
                    return {
                        "status": "success",
                        "text": formatted_text
                    }
                except (KeyError, IndexError) as e:
                    error_message = f"Could not extract formatted text from response: {str(e)}"
                    print(error_message)
                    
                    return {
                        "status": "error",
                        "error": error_message,
                        "text": "Could not extract formatted text from the API response."
                    }
            else:
                # Handle error
                error_message = f"Format API request failed with status code {response.status_code}: {response.text}"
                print(error_message)
                
                return {
                    "status": "error",
                    "error": error_message,
                    "text": "Formatting failed. Please check your API key and try again."
                }
                
        except Exception as e:
            error_message = f"Error during format API request: {str(e)}"
            print(error_message)
            
            return {
                "status": "error",
                "error": error_message,
                "text": "Formatting failed due to an exception. See error details."
            }