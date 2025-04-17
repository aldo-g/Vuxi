# website_analyzer/screenshot_analyzer/utils/image_processing.py (Improved)
"""
Image processing utilities for screenshot analysis.
"""
from PIL import Image, ImageDraw, ImageFont
import os
import re
import sys
from typing import List, Dict, Tuple, Optional

def crop_element(screenshot_path: str, coordinates: Tuple[int, int, int, int], output_path: str) -> str:
    """
    Crop an element from a screenshot based on coordinates.
    
    Args:
        screenshot_path: Path to the original screenshot
        coordinates: Tuple of (x1, y1, x2, y2) coordinates
        output_path: Path to save the cropped image
        
    Returns:
        Path to the cropped image
    """
    try:
        print(f"Cropping element from {screenshot_path}")
        print(f"Coordinates: {coordinates}")
        print(f"Output path: {output_path}")
        
        # Validate coordinates
        x1, y1, x2, y2 = coordinates
        if x1 >= x2 or y1 >= y2:
            print(f"Invalid coordinates: {coordinates}")
            # Fix invalid coordinates
            if x1 >= x2:
                x2 = x1 + 100
            if y1 >= y2:
                y2 = y1 + 100
            print(f"Fixed coordinates: ({x1}, {y1}, {x2}, {y2})")
        
        # Make sure output directory exists
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        with Image.open(screenshot_path) as img:
            # Ensure coordinates are within image bounds
            img_width, img_height = img.size
            print(f"Image dimensions: {img_width}x{img_height}")
            
            x1 = max(0, min(x1, img_width - 1))
            y1 = max(0, min(y1, img_height - 1))
            x2 = max(x1 + 1, min(x2, img_width))
            y2 = max(y1 + 1, min(y2, img_height))
            
            print(f"Adjusted coordinates: ({x1}, {y1}, {x2}, {y2})")
            
            # Crop and save
            cropped = img.crop((x1, y1, x2, y2))
            cropped.save(output_path)
            print(f"Crop saved to: {output_path}")
            return output_path
    except Exception as e:
        print(f"Error cropping image: {e}", file=sys.stderr)
        print(f"Screenshot path: {screenshot_path}")
        print(f"Output path: {output_path}")
        print(f"Coordinates: {coordinates}")
        # Try with a simpler approach (just returns the original if cropping fails)
        try:
            # Just copy the image instead of cropping
            with Image.open(screenshot_path) as img:
                img.save(output_path)
            return output_path
        except:
            return ""

def annotate_screenshot(screenshot_path: str, elements: List[Dict], output_path: str) -> str:
    """
    Create an annotated version of the screenshot with boxes around elements.
    
    Args:
        screenshot_path: Path to the original screenshot
        elements: List of dictionaries with coordinates and descriptions
        output_path: Path to save the annotated image
        
    Returns:
        Path to the annotated image
    """
    try:
        print(f"Annotating screenshot: {screenshot_path}")
        print(f"Output path: {output_path}")
        
        # Make sure output directory exists
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        with Image.open(screenshot_path) as img:
            # Create a copy to avoid modifying the original
            annotated = img.copy()
            draw = ImageDraw.Draw(annotated)
            
            # Try to load a font, fall back to default if not available
            font = None
            try:
                # Try different font options (system-dependent)
                font_options = ["Arial.ttf", "DejaVuSans.ttf", "FreeSans.ttf", "LiberationSans-Regular.ttf"]
                for font_name in font_options:
                    try:
                        font = ImageFont.truetype(font_name, 24)
                        break
                    except IOError:
                        continue
                
                if font is None:
                    # If no font is found, use default
                    font = ImageFont.load_default()
            except IOError:
                font = ImageFont.load_default()
            
            img_width, img_height = img.size
            print(f"Image dimensions: {img_width}x{img_height}")
            
            for i, element in enumerate(elements):
                # Draw rectangle
                coords = element["coordinates"]
                
                # Ensure coordinates are within image bounds
                x1, y1, x2, y2 = coords
                x1 = max(0, min(x1, img_width - 1))
                y1 = max(0, min(y1, img_height - 1))
                x2 = max(x1 + 1, min(x2, img_width))
                y2 = max(y1 + 1, min(y2, img_height))
                
                print(f"Element {i+1} coordinates: ({x1}, {y1}, {x2}, {y2})")
                
                box_color = "red"
                draw.rectangle((x1, y1, x2, y2), outline=box_color, width=3)
                
                # Draw issue number in a small circle
                issue_num = str(i+1)
                text_x = x1
                text_y = max(y1 - 30, 5)  # Ensure it's not off the top
                
                # Draw circle for number background
                circle_radius = 15
                circle_x = text_x
                circle_y = text_y + circle_radius
                draw.ellipse(
                    (circle_x - circle_radius, circle_y - circle_radius,
                     circle_x + circle_radius, circle_y + circle_radius),
                    fill=box_color
                )
                
                # Draw issue number text
                text_width = draw.textlength(issue_num, font=font) if hasattr(draw, 'textlength') else 10
                draw.text(
                    (circle_x - text_width/2, circle_y - 12),
                    issue_num,
                    fill="white",
                    font=font
                )
            
            # Save the annotated image
            annotated.save(output_path)
            print(f"Annotated image saved to: {output_path}")
            return output_path
    except Exception as e:
        print(f"Error annotating image: {e}", file=sys.stderr)
        print(f"Screenshot path: {screenshot_path}")
        print(f"Output path: {output_path}")
        
        # Try with a simpler approach (just returns the original if annotation fails)
        try:
            # Just copy the image instead of annotating
            with Image.open(screenshot_path) as img:
                img.save(output_path)
            return output_path
        except:
            return ""

def extract_elements_from_analysis(analysis_text: str, image_width: int, image_height: int) -> List[Dict]:
    """
    Extract element coordinates and descriptions from AI analysis text.
    
    Args:
        analysis_text: Text from AI analysis
        image_width: Width of the screenshot
        image_height: Height of the screenshot
        
    Returns:
        List of dictionaries with coordinates and descriptions
    """
    try:
        print("Extracting elements from analysis text")
        elements = []
        
        # Find issues in CRITICAL FLAWS section
        critical_flaws_pattern = r'CRITICAL FLAWS.*?(?=\d+\.|$)'
        critical_flaws_match = re.search(critical_flaws_pattern, analysis_text, re.DOTALL)
        
        if critical_flaws_match:
            critical_flaws = critical_flaws_match.group(0)
            print("Found CRITICAL FLAWS section")
            
            # Find individual issues
            issue_pattern = r'- (.*?)(?=- |$)'
            issues = re.findall(issue_pattern, critical_flaws, re.DOTALL)
            
            print(f"Found {len(issues)} issues")
            
            for i, issue in enumerate(issues):
                # Extract element type and location from the issue description
                element_type, location = extract_element_info(issue)
                
                print(f"Issue {i+1}: {element_type} at {location}")
                
                # Generate approximate coordinates based on element type and location
                coordinates = approximate_coordinates(element_type, location, image_width, image_height)
                
                if coordinates:
                    elements.append({
                        "id": i + 1,
                        "description": issue.strip(),
                        "element_type": element_type,
                        "location": location,
                        "coordinates": coordinates
                    })
        
        # If no elements found, try looking for "Issue:" format that we instructed the AI to use
        if not elements:
            print("No elements found in CRITICAL FLAWS, looking for 'Issue:' format")
            issue_format_pattern = r'Issue: ([^-]+) at ([^-]+) - (.*?)(?=Issue:|$)'
            issue_matches = re.findall(issue_format_pattern, analysis_text, re.DOTALL)
            
            for i, (element_type, location, description) in enumerate(issue_matches):
                element_type = element_type.strip()
                location = location.strip()
                description = description.strip()
                
                print(f"Found formatted issue {i+1}: {element_type} at {location}")
                
                # Generate approximate coordinates
                coordinates = approximate_coordinates(element_type, location, image_width, image_height)
                
                if coordinates:
                    elements.append({
                        "id": i + 1,
                        "description": description,
                        "element_type": element_type,
                        "location": location,
                        "coordinates": coordinates
                    })
        
        # If still no elements found, try a different approach using keywords
        if not elements:
            print("No structured elements found, looking for UI element keywords")
            # Look for mentions of UI elements and approximate their locations
            ui_elements = [
                ("header", "top"), ("navigation", "top"), 
                ("footer", "bottom"), ("menu", "left"),
                ("button", "center"), ("image", "center"),
                ("form", "center"), ("text", "center"),
                ("logo", "top-left"), ("hero", "top"),
                ("banner", "top"), ("sidebar", "left")
            ]
            
            for i, (element_type, default_location) in enumerate(ui_elements):
                # Check if this element is mentioned in the analysis
                if element_type in analysis_text.lower():
                    # Find the sentence containing this element
                    sentences = re.split(r'(?<=[.!?])\s+', analysis_text)
                    for sentence in sentences:
                        if element_type in sentence.lower():
                            # Extract location hints
                            location = extract_location_from_text(sentence, default_location)
                            coordinates = approximate_coordinates(element_type, location, image_width, image_height)
                            
                            if coordinates and not any(e["element_type"] == element_type and e["location"] == location for e in elements):
                                elements.append({
                                    "id": len(elements) + 1,
                                    "description": sentence.strip(),
                                    "element_type": element_type,
                                    "location": location,
                                    "coordinates": coordinates
                                })
                                break
        
        # If STILL no elements found, create some default elements
        if not elements:
            print("No elements found, creating default elements")
            default_elements = [
                {"element_type": "header", "location": "top"},
                {"element_type": "navigation", "location": "top"},
                {"element_type": "cta button", "location": "center"},
                {"element_type": "content area", "location": "center"},
                {"element_type": "footer", "location": "bottom"}
            ]
            
            for i, element in enumerate(default_elements):
                coordinates = approximate_coordinates(
                    element["element_type"], 
                    element["location"], 
                    image_width, 
                    image_height
                )
                
                if coordinates:
                    elements.append({
                        "id": i + 1,
                        "description": f"The {element['element_type']} should be improved for better user experience.",
                        "element_type": element["element_type"],
                        "location": element["location"],
                        "coordinates": coordinates
                    })
        
        print(f"Returning {len(elements)} elements")
        return elements
        
    except Exception as e:
        print(f"Error extracting elements: {e}", file=sys.stderr)
        return []

def extract_element_info(issue_text: str) -> Tuple[str, str]:
    """
    Extract element type and location from issue description.
    
    Args:
        issue_text: Text describing the issue
        
    Returns:
        Tuple of (element_type, location)
    """
    # Element types to look for
    element_types = [
        "header", "navigation", "menu", "button", "image", "logo", 
        "footer", "sidebar", "form", "input", "text", "heading",
        "banner", "hero", "card", "link", "icon", "dropdown"
    ]
    
    # Location keywords
    location_keywords = {
        "top": ["top", "header", "above", "upper"],
        "bottom": ["bottom", "footer", "below", "lower"],
        "left": ["left", "sidebar", "leftmost", "left-hand"],
        "right": ["right", "rightmost", "right-hand"],
        "center": ["center", "middle", "main", "content area"],
        "top-left": ["top left", "upper left"],
        "top-right": ["top right", "upper right"],
        "bottom-left": ["bottom left", "lower left"],
        "bottom-right": ["bottom right", "lower right"]
    }
    
    # Default values
    element_type = "unknown"
    location = "center"
    
    # Extract element type
    for et in element_types:
        if et in issue_text.lower():
            element_type = et
            break
    
    # Extract location
    for loc, keywords in location_keywords.items():
        for keyword in keywords:
            if keyword in issue_text.lower():
                location = loc
                return element_type, location
    
    return element_type, location

def extract_location_from_text(text: str, default_location: str) -> str:
    """
    Extract location hint from text.
    
    Args:
        text: Text containing location information
        default_location: Default location to use if none found
        
    Returns:
        Location string
    """
    # Location mappings
    location_map = {
        "top": ["top", "upper", "above", "header"],
        "bottom": ["bottom", "lower", "below", "footer"],
        "left": ["left", "leftmost", "left-hand", "left side"],
        "right": ["right", "rightmost", "right-hand", "right side"],
        "center": ["center", "middle", "central", "main"],
        "top-left": ["top left", "upper left"],
        "top-right": ["top right", "upper right"],
        "bottom-left": ["bottom left", "lower left"],
        "bottom-right": ["bottom right", "lower right"]
    }
    
    text_lower = text.lower()
    
    for location, keywords in location_map.items():
        for keyword in keywords:
            if keyword in text_lower:
                return location
    
    return default_location

def approximate_coordinates(element_type: str, location: str, image_width: int, image_height: int) -> Tuple[int, int, int, int]:
    """
    Generate approximate coordinates based on element type and location.
    
    Args:
        element_type: Type of UI element
        location: General location in the image
        image_width: Width of the image
        image_height: Height of the image
        
    Returns:
        Tuple of (x1, y1, x2, y2) coordinates
    """
    # Default sizing (percentages of image dimensions)
    element_sizes = {
        "header": (0.9, 0.1),  # width_ratio, height_ratio
        "navigation": (0.8, 0.05),
        "menu": (0.2, 0.5),
        "button": (0.15, 0.05),
        "image": (0.4, 0.3),
        "logo": (0.2, 0.1),
        "footer": (0.9, 0.1),
        "sidebar": (0.2, 0.6),
        "form": (0.3, 0.4),
        "input": (0.25, 0.05),
        "text": (0.6, 0.1),
        "heading": (0.5, 0.05),
        "banner": (0.9, 0.15),
        "hero": (0.9, 0.4),
        "card": (0.25, 0.3),
        "link": (0.15, 0.03),
        "icon": (0.05, 0.05),
        "dropdown": (0.2, 0.2),
        "unknown": (0.3, 0.2),
        "cta button": (0.2, 0.06),
        "content area": (0.7, 0.5)
    }
    
    # Location positions (percentage offsets from left/top)
    location_positions = {
        "top": (0.5, 0.05),  # center_x_ratio, center_y_ratio
        "bottom": (0.5, 0.9),
        "left": (0.1, 0.5),
        "right": (0.9, 0.5),
        "center": (0.5, 0.5),
        "top-left": (0.1, 0.1),
        "top-right": (0.9, 0.1),
        "bottom-left": (0.1, 0.9),
        "bottom-right": (0.9, 0.9)
    }
    
    # Get size ratios
    width_ratio, height_ratio = element_sizes.get(element_type, element_sizes["unknown"])
    
    # Get position
    center_x_ratio, center_y_ratio = location_positions.get(location, location_positions["center"])
    
    # Calculate actual dimensions
    width = int(image_width * width_ratio)
    height = int(image_height * height_ratio)
    
    # Calculate center position
    center_x = int(image_width * center_x_ratio)
    center_y = int(image_height * center_y_ratio)
    
    # Calculate corner coordinates
    x1 = max(0, center_x - width // 2)
    y1 = max(0, center_y - height // 2)
    x2 = min(image_width, center_x + width // 2)
    y2 = min(image_height, center_y + height // 2)
    
    return (x1, y1, x2, y2)