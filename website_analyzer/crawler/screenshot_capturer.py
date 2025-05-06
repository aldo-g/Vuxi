# website_analyzer/crawler/screenshot_capturer.py
"""
Screenshot capture module with built-in robust content detection.
"""

import os
import time
import math
import random
from typing import Dict, List, Any, Optional
from ..common.url_utils import create_filename_from_url


class ScreenshotCapturer:
    """
    Captures screenshots at multiple viewport sizes with enhanced content verification.
    """
    
    def __init__(self, output_dir):
        """
        Initialize the ScreenshotCapturer with configuration options.
        
        Args:
            output_dir (str): Directory to save screenshots
        """
        self.output_dir = output_dir
        
        # Default robust settings - no need for CLI parameters
        self.min_delay = 5  # Minimum final delay in seconds
        self.max_delay = 10  # Maximum final delay in seconds
        self.content_retry = 3  # Number of content verification retries
        
        # Create viewports for different device types
        self.viewports = [
            {"name": "mobile", "width": 375, "height": 667},
            {"name": "tablet", "width": 768, "height": 1024},
            {"name": "desktop", "width": 1440, "height": 900}
        ]
        
        # Directory for screenshots
        self.screenshots_dir = os.path.join(self.output_dir, "screenshots")
        os.makedirs(self.screenshots_dir, exist_ok=True)
        for viewport in self.viewports:
            os.makedirs(os.path.join(self.screenshots_dir, viewport["name"]), exist_ok=True)
    
    def capture_screenshot(self, page, url, viewport, page_number):
        """
        Capture a complete screenshot with thorough content verification.
        """
        # Set the viewport
        page.set_viewport_size({"width": viewport["width"], "height": viewport["height"]})
        
        filename = create_filename_from_url(url, page_number)
        filepath = os.path.join(self.screenshots_dir, viewport["name"], f"{filename}.png")
        
        try:
            print(f"Starting robust content capture for {viewport['name']} view of {url}")
            
            # STEP 1: Ensure DOM content is fully loaded
            page.wait_for_load_state("domcontentloaded", timeout=300000)
            print("✓ DOM Content loaded")
            
            # STEP 2: Wait for network to be completely idle
            page.wait_for_load_state("networkidle", timeout=300000)
            print("✓ Network idle")
            
            # STEP 3: Initial content scan and verification
            content_boxes = self._identify_content_boxes(page)
            print(f"✓ Identified {len(content_boxes)} potential content boxes")
            
            # STEP 4: Perform full-page scroll with extra attention to content areas
            self._smart_scroll_with_content_focus(page, content_boxes)
            print("✓ Smart scroll with content focus completed")
            
            # STEP 5: Return to the top of the page
            page.evaluate("window.scrollTo(0, 0)")
            time.sleep(0.7)
            
            # STEP 6: Wait for any animations and transitions
            self._wait_for_animations_complete(page)
            print("✓ Animations and transitions complete")
            
            # STEP 7: Verify content has been loaded in content boxes
            filled_boxes = 0
            empty_boxes = []
            
            for retry in range(self.content_retry):
                result = self._verify_content_boxes(page, content_boxes)
                filled_boxes = result["filled"]
                empty_boxes = result["empty"]
                
                if len(empty_boxes) == 0:
                    print(f"✓ All {filled_boxes} content boxes verified as filled")
                    break
                else:
                    print(f"! Found {len(empty_boxes)} potentially empty content boxes, retry {retry+1}/{self.content_retry}")
                    # Try to trigger loading of empty boxes
                    self._trigger_content_loading(page, empty_boxes)
                    # Wait a bit longer for content to appear
                    time.sleep(3)
            
            if empty_boxes:
                print(f"⚠ Still found {len(empty_boxes)} potentially empty content boxes after {self.content_retry} retries")
                print(f"⚠ Empty box selectors: {empty_boxes}")
            
            # STEP 8: Apply a variable final delay with randomization for unpredictable loading patterns
            final_delay = random.uniform(self.min_delay, self.max_delay)
            print(f"Applying generous final delay of {final_delay:.1f} seconds to ensure all content is fully formed...")
            time.sleep(final_delay)
            print("✓ Final delay completed")
            
            # STEP 9: Final interaction jiggle to trigger any last dynamic content
            self._final_interaction_jiggle(page)
            
            # STEP 10: Verify no loading indicators remain
            self._verify_no_loading_indicators(page)
            
            # STEP 11: Take the screenshot with all content loaded
            page.screenshot(path=filepath, full_page=True)
            print(f"✓ Captured complete {viewport['name']} screenshot: {filepath}")
            
            return {
                'viewport': viewport["name"],
                'file': os.path.join("screenshots", viewport["name"], f"{filename}.png"),
                'filename': f"{filename}.png"
            }
            
        except Exception as e:
            print(f"Error capturing screenshot for {url} ({viewport['name']}): {e}")
            
            # Attempt a fallback screenshot if the enhanced approach fails
            try:
                # Wait a bit longer to ensure at least some content loads
                time.sleep(5)
                page.screenshot(path=filepath, full_page=True)
                print(f"Captured fallback screenshot for {viewport['name']}")
                
                return {
                    'viewport': viewport["name"],
                    'file': os.path.join("screenshots", viewport["name"], f"{filename}.png"),
                    'filename': f"{filename}.png",
                    'warning': 'Fallback screenshot due to error in content verification process'
                }
            except Exception as fallback_error:
                print(f"Failed to capture fallback screenshot: {fallback_error}")
                return None
    
    def _identify_content_boxes(self, page) -> List[Dict[str, Any]]:
        """
        Identify potential content boxes that need to be verified.
        
        Args:
            page: Playwright page object
            
        Returns:
            List of potential content boxes with their details
        """
        try:
            # Use detailed selector patterns to identify content boxes
            return page.evaluate("""
                () => {
                    // Common content box patterns
                    const contentSelectors = [
                        // Cards, boxes, and sections
                        '.card', '.box', '.section', '.container', '.content',
                        // Service, feature, and benefit boxes
                        '.service', '.feature', '.benefit', '.advantage',
                        // Common grid and flex containers
                        '.row > div', '.grid > div', '.col', '.flex > div',
                        // Testimonials and reviews
                        '.testimonial', '.review', '.quote',
                        // Info boxes and callouts
                        '.info-box', '.callout', '.highlight', '.cta',
                        // List items for feature lists
                        '.features li', '.benefits li', '.list-item',
                        // Articles and text containers
                        'article', 'section', '.text-container',
                        // Generic divs with specific dimensions
                        'div[style*="width"][style*="height"]', 'div[class*="box"]', 'div[class*="card"]', 
                        'div[class*="container"]', 'div[class*="wrapper"]'
                    ];
                    
                    // Results array
                    const contentBoxes = [];
                    
                    // For each selector pattern
                    for (const selector of contentSelectors) {
                        try {
                            // Find elements matching this pattern
                            const elements = document.querySelectorAll(selector);
                            
                            // Process each element
                            for (const element of elements) {
                                // Skip if already processed (avoid duplicates)
                                if (element.dataset._processed) continue;
                                
                                // Skip tiny elements or hidden elements
                                const rect = element.getBoundingClientRect();
                                if (rect.width < 100 || rect.height < 80) continue;
                                if (rect.width === 0 || rect.height === 0) continue;
                                
                                const style = window.getComputedStyle(element);
                                if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;
                                
                                // Create a selector path for this element
                                let selectorPath = '';
                                if (element.id) {
                                    selectorPath = `#${element.id}`;
                                } else {
                                    // Build a selector using classes, limiting to first 3 classes
                                    const classList = Array.from(element.classList).slice(0, 3);
                                    if (classList.length > 0) {
                                        selectorPath = `${element.tagName.toLowerCase()}.${classList.join('.')}`;
                                    } else {
                                        // Use nth-child if no ID or classes
                                        const index = Array.from(element.parentNode.children).indexOf(element);
                                        selectorPath = `${element.tagName.toLowerCase()}:nth-child(${index + 1})`;
                                    }
                                }
                                
                                // Check current text content length
                                const textContent = element.textContent.trim();
                                
                                // Add to result array
                                contentBoxes.push({
                                    selector: selectorPath,
                                    rect: {
                                        top: rect.top + window.scrollY,
                                        left: rect.left + window.scrollX,
                                        width: rect.width,
                                        height: rect.height
                                    },
                                    currentTextLength: textContent.length,
                                    hasDescendantImages: element.querySelectorAll('img').length > 0,
                                    isEmpty: textContent.length < 20 || 
                                             (textContent.length < 100 && !element.querySelector('img'))
                                });
                                
                                // Mark as processed
                                element.dataset._processed = 'true';
                            }
                        } catch (selectorError) {
                            // Skip errors for individual selectors
                            continue;
                        }
                    }
                    
                    // Clean up our temporary marking attributes
                    document.querySelectorAll('[data-_processed]').forEach(el => {
                        delete el.dataset._processed;
                    });
                    
                    return contentBoxes;
                }
            """)
        except Exception as e:
            print(f"Error identifying content boxes: {e}")
            return []
    
    def _smart_scroll_with_content_focus(self, page, content_boxes: List[Dict[str, Any]]):
        """
        Perform smart scrolling with focus on content box positions.
        
        Args:
            page: Playwright page object
            content_boxes: List of content box details
        """
        try:
            # Get page height
            page_height = page.evaluate("document.body.scrollHeight")
            viewport_height = page.viewport_size["height"]
            
            # Standard scroll positions (every half viewport)
            scroll_positions = list(range(0, page_height, viewport_height // 2))
            
            # Add specific positions of content boxes
            if content_boxes:
                for box in content_boxes:
                    box_top = box["rect"]["top"]
                    # Add position to scroll to just before the box comes into view
                    scroll_positions.append(max(0, box_top - (viewport_height // 4)))
                    # Add position to center the box in viewport
                    scroll_positions.append(max(0, box_top - (viewport_height // 2) + (box["rect"]["height"] // 2)))
                
                # Sort and remove duplicates
                scroll_positions = sorted(list(set([int(pos) for pos in scroll_positions])))
            
            # Perform the scrolling with pauses
            for position in scroll_positions:
                if position >= page_height:
                    continue
                    
                # Scroll to position with smooth behavior
                page.evaluate(f"window.scrollTo({{top: {position}, behavior: 'smooth'}})")
                
                # Adjust wait time based on position (longer wait in middle sections)
                progress = position / page_height
                wait_time = 0.3 + 0.5 * (1 - abs(2 * progress - 1))  # Peaks in the middle
                time.sleep(wait_time)
                
                # Every few scrolls, check if page height changed and update our list
                if random.random() < 0.3:  # 30% chance to check
                    new_height = page.evaluate("document.body.scrollHeight")
                    if new_height > page_height:
                        # Add new scroll positions for the expanded content
                        additional_positions = list(range(page_height, new_height, viewport_height // 2))
                        scroll_positions.extend(additional_positions)
                        page_height = new_height
            
            # Final scroll to bottom to ensure we trigger everything
            page.evaluate("window.scrollTo({top: document.body.scrollHeight, behavior: 'smooth'})")
            time.sleep(0.7)
            
            # Scroll back to top smoothly
            page.evaluate("window.scrollTo({top: 0, behavior: 'smooth'})")
            time.sleep(0.7)
            
        except Exception as e:
            print(f"Error during smart scrolling: {e}")
    
    def _verify_content_boxes(self, page, content_boxes: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Verify that content boxes have been filled with content.
        
        Args:
            page: Playwright page object
            content_boxes: List of content box details
            
        Returns:
            Dict with counts of filled and empty boxes
        """
        try:
            if not content_boxes:
                return {"filled": 0, "empty": []}
                
            results = page.evaluate("""
                (contentBoxes) => {
                    const results = {
                        filled: 0,
                        empty: []
                    };
                    
                    // Check each content box
                    for (const box of contentBoxes) {
                        try {
                            const element = document.querySelector(box.selector);
                            if (!element) {
                                // Element not found, consider it empty
                                results.empty.push(box.selector);
                                continue;
                            }
                            
                            // Get current text content
                            const currentText = element.textContent.trim();
                            
                            // Check if content has loaded
                            const hasMoreContent = currentText.length > box.currentTextLength + 20; // At least 20 more chars
                            const hasImages = element.querySelectorAll('img').length > 0;
                            const imagesLoaded = Array.from(element.querySelectorAll('img')).every(img => img.complete);
                            
                            // Consider filled if:
                            // 1. It now has significantly more text than before
                            // 2. It has images and they're loaded + some text
                            // 3. It has substantial text content (> 100 chars)
                            if (hasMoreContent || 
                                (hasImages && imagesLoaded && currentText.length > 30) || 
                                currentText.length > 100) {
                                results.filled++;
                            } else if (box.isEmpty && (currentText.length < 50 && !hasImages)) {
                                // Still empty
                                results.empty.push(box.selector);
                            } else {
                                // Not clearly empty or filled
                                results.filled++;
                            }
                        } catch (e) {
                            // Skip errors for individual elements
                            results.empty.push(box.selector);
                        }
                    }
                    
                    return results;
                }
            """, content_boxes)
            
            return results
            
        except Exception as e:
            print(f"Error verifying content boxes: {e}")
            return {"filled": 0, "empty": []}
    
    def _trigger_content_loading(self, page, empty_selectors: List[str]):
        """
        Try to trigger content loading for empty boxes.
        
        Args:
            page: Playwright page object
            empty_selectors: List of selectors for empty content boxes
        """
        try:
            if not empty_selectors:
                return
                
            # Try multiple strategies to trigger content loading
            for selector in empty_selectors:
                try:
                    # Strategy 1: Scroll the element into view
                    page.evaluate(f"""
                        (selector) => {{
                            const element = document.querySelector(selector);
                            if (element) {{
                                element.scrollIntoView({{behavior: 'smooth', block: 'center'}});
                            }}
                        }}
                    """, selector)
                    time.sleep(0.5)
                    
                    # Strategy 2: Mouse over the element
                    element = page.query_selector(selector)
                    if element:
                        element.hover()
                        time.sleep(0.3)
                    
                    # Strategy 3: Mouse movement around the element area
                    element_box = page.evaluate(f"""
                        (selector) => {{
                            const element = document.querySelector(selector);
                            if (element) {{
                                const rect = element.getBoundingClientRect();
                                return {{
                                    x: rect.left + (rect.width / 2),
                                    y: rect.top + (rect.height / 2),
                                    width: rect.width,
                                    height: rect.height
                                }};
                            }}
                            return null;
                        }}
                    """, selector)
                    
                    if element_box:
                        # Move mouse around the element
                        center_x = element_box["x"]
                        center_y = element_box["y"]
                        
                        page.mouse.move(center_x, center_y)
                        time.sleep(0.2)
                        
                        # Move in a small circle around the center
                        radius = min(element_box["width"], element_box["height"]) / 4
                        steps = 4
                        for i in range(steps):
                            angle = 2 * 3.14159 * (i / steps)
                            x = center_x + radius * 0.8 * math.cos(angle)
                            y = center_y + radius * 0.8 * math.sin(angle)
                            page.mouse.move(x, y)
                            time.sleep(0.1)
                        
                        # Return to center
                        page.mouse.move(center_x, center_y)
                    
                except Exception as element_error:
                    # Continue with next selector if one fails
                    continue
            
            # Wait a bit after all triggers
            time.sleep(1)
            
        except Exception as e:
            print(f"Error triggering content loading: {e}")
    
    def _wait_for_animations_complete(self, page):
        """Wait for animations to complete."""
        try:
            # Check for common animation libraries and wait accordingly
            animations_present = page.evaluate("""
                () => {
                    // Check for various animation libraries/techniques
                    const hasCSS3Animations = document.querySelectorAll(
                        '[class*="animate"], [class*="animation"], [class*="motion"], [style*="animation"]'
                    ).length > 0;
                    
                    const hasGSAP = typeof window.gsap !== 'undefined';
                    const hasAnime = typeof window.anime !== 'undefined';
                    const hasJQueryAnimation = typeof window.jQuery !== 'undefined' && 
                                           jQuery(':animated').length > 0;
                    
                    return {
                        hasAnimations: hasCSS3Animations || hasGSAP || hasAnime || hasJQueryAnimation,
                        types: {
                            css3: hasCSS3Animations,
                            gsap: hasGSAP,
                            anime: hasAnime,
                            jquery: hasJQueryAnimation
                        }
                    };
                }
            """)
            
            # If animations are present, wait for them to finish
            if animations_present["hasAnimations"]:
                # Wait longer for animations to complete
                animation_types = animations_present["types"]
                animation_types_str = ", ".join([k for k, v in animation_types.items() if v])
                print(f"Detected animations: {animation_types_str}. Waiting for completion...")
                
                # Different wait times based on animation type
                if animation_types["css3"]:
                    # CSS animations typically complete within a few seconds
                    time.sleep(3)
                    
                if animation_types["gsap"] or animation_types["anime"] or animation_types["jquery"]:
                    # JavaScript animation libraries can have longer sequences
                    time.sleep(4)
                    
        except Exception as e:
            print(f"Error waiting for animations: {e}")
    
    def _final_interaction_jiggle(self, page):
        """
        Perform a final interaction 'jiggle' to trigger any last dynamic content.
        
        Args:
            page: Playwright page object
        """
        try:
            # Small mouse movements to potentially trigger hover effects
            width = page.viewport_size["width"]
            height = page.viewport_size["height"]
            
            # Move mouse to center
            page.mouse.move(width / 2, height / 2)
            time.sleep(0.2)
            
            # Small mouse jiggle in the center area
            for _ in range(3):
                x = width / 2 + random.randint(-100, 100)
                y = height / 2 + random.randint(-100, 100)
                page.mouse.move(x, y)
                time.sleep(0.1)
                
            # Return to center
            page.mouse.move(width / 2, height / 2)
            time.sleep(0.2)
            
            # Trigger a small scroll up and down (helps with some lazy loading)
            page.evaluate("""
                () => {
                    const currentY = window.scrollY;
                    window.scrollBy(0, 10);
                    setTimeout(() => { window.scrollBy(0, -10); }, 100);
                }
            """)
            time.sleep(0.5)
            
        except Exception as e:
            print(f"Error during final interaction jiggle: {e}")
    
    def _verify_no_loading_indicators(self, page):
        """
        Verify no loading indicators remain visible.
        
        Args:
            page: Playwright page object
        """
        try:
            # Check for common loading indicators
            loading_indicators = page.evaluate("""
                () => {
                    // Common loading indicator selectors
                    const spinnerSelectors = [
                        '[class*="loading"]', '[class*="spinner"]', '[class*="loader"]',
                        '[id*="loading"]', '[id*="spinner"]', '[id*="loader"]',
                        '.fa-spinner', '.fa-circle-notch', '.fa-sync', '.fa-refresh'
                    ].join(',');
                    
                    const loadingElements = document.querySelectorAll(spinnerSelectors);
                    
                    // Check if any are visible
                    const visibleLoaders = Array.from(loadingElements).filter(el => {
                        // Check if the element is visible
                        const style = window.getComputedStyle(el);
                        const rect = el.getBoundingClientRect();
                        return style.display !== 'none' && 
                               style.visibility !== 'hidden' && 
                               style.opacity !== '0' &&
                               rect.width > 0 &&
                               rect.height > 0;
                    });
                    
                    return {
                        count: visibleLoaders.length,
                        selectors: visibleLoaders.map(el => {
                            // Get a selector for this element
                            let selector = el.tagName.toLowerCase();
                            if (el.id) selector += `#${el.id}`;
                            if (el.className) selector += `.${el.className.replace(/\s+/g, '.')}`;
                            return selector;
                        })
                    };
                }
            """)
            
            # If loading indicators are visible, wait a bit longer
            if loading_indicators["count"] > 0:
                print(f"Still found {loading_indicators['count']} loading indicators. Waiting longer...")
                time.sleep(3)
            
        except Exception as e:
            print(f"Error verifying loading indicators: {e}")
    
    def capture(self, page, url, page_number):
        """Capture screenshots for all viewports."""
        screenshots = []
        
        for viewport in self.viewports:
            screenshot = self.capture_screenshot(page, url, viewport, page_number)
            if screenshot:
                screenshots.append(screenshot)
        
        return screenshots
    
    def get_screenshot_paths(self, device_type):
        """Get all screenshot paths for a specific device type."""
        device_dir = os.path.join(self.screenshots_dir, device_type)
        if not os.path.exists(device_dir):
            return []
        
        return [os.path.join(device_dir, f) for f in os.listdir(device_dir) if f.endswith('.png')]