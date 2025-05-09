# website_analyzer/crawler/screenshot_capturer.py
"""
Screenshot capture module with built-in robust content detection.
"""

import os
import time
import math
import random
from typing import Dict, List, Any, Optional
# Assuming url_utils is in the same parent directory or installed package
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
        self.video_play_time = 3  # Seconds to play videos before capture (can be overridden by specific methods)

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
        Includes special handling for fixed headers and embedded videos.
        """
        # Set the viewport
        page.set_viewport_size({"width": viewport["width"], "height": viewport["height"]})

        filename = create_filename_from_url(url, page_number)
        filepath = os.path.join(self.screenshots_dir, viewport["name"], f"{filename}.png")

        try:
            print(f"---------Starting robust content capture for {viewport['name']} view of {url}---------------")

            # STEP 1: Reset scroll position to ensure we start from the top
            page.evaluate("window.scrollTo(0, 0)")

            # STEP 2: Ensure DOM content is fully loaded
            page.wait_for_load_state("domcontentloaded", timeout=300000)
            print("✓ DOM Content loaded")

            # STEP 3: Wait for network to be completely idle
            page.wait_for_load_state("networkidle", timeout=300000)
            print("✓ Network idle")

            # STEP 4: Identify headers, navigation bars, and fixed elements first
            fixed_elements = self._identify_fixed_elements(page)
            if fixed_elements:
                print(f"✓ Identified {len(fixed_elements)} fixed elements (headers, navigation bars)")

            # STEP 5: Identify and prepare video elements
            video_elements = self._identify_video_elements(page)
            if video_elements:
                print(f"✓ Identified {len(video_elements)} video elements (YouTube, Vimeo, etc.)")
                # First aggressively force YouTube videos to be visible
                self._force_youtube_video_visibility(page, video_elements) # Enhanced
                print("✓ Attempted to force YouTube video visibility and play")

            # STEP 6: Initial complete scroll to trigger all lazy loading
            self._initial_full_page_scroll(page)
            print("✓ Initial full-page scroll completed")

            # STEP 7: Engage with video elements to ensure they display properly
            if video_elements:
                self._prepare_video_elements(page, video_elements)
                print("✓ Videos prepared for display (general preparation)")

            # STEP 8: Return to the top and wait for fixed elements to stabilize
            page.evaluate("window.scrollTo(0, 0)")
            time.sleep(1)  # Give fixed elements time to render

            # STEP 9: Verify fixed elements (headers/navigation) are rendered
            self._ensure_fixed_elements_loaded(page, fixed_elements)
            print("✓ Fixed elements verified")

            # STEP 10: Identify content boxes
            content_boxes = self._identify_content_boxes(page)
            print(f"✓ Identified {len(content_boxes)} potential content boxes")

            # STEP 11: Perform detailed scroll with focus on content areas
            self._smart_scroll_with_content_focus(page, content_boxes)
            print("✓ Smart scroll with content focus completed")

            # STEP 12: Interact with video elements - play videos and wait
            if video_elements:
                self._play_videos(page, video_elements) # General video play
                print(f"✓ Videos played attempt completed (waited {self.video_play_time} seconds for primary)")

            # STEP 13: Return to the top of the page
            page.evaluate("window.scrollTo(0, 0)")
            time.sleep(1.0)  # Longer wait at top

            # STEP 14: Wait for any animations and transitions
            self._wait_for_animations_complete(page)
            print("✓ Animations and transitions complete")

            # STEP 15: Verify content has been loaded in content boxes
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

            # STEP 16: Force header/navigation visibility
            if fixed_elements:
                self._ensure_header_visibility(page, fixed_elements)
                print("✓ Header visibility enforced")

            # STEP 17: Final video check (general visibility, YouTube is handled in step 21)
            if video_elements:
                self._ensure_videos_visible(page, video_elements)
                print("✓ General video visibility enforced (pre-final)")

            # STEP 18: Apply a variable final delay with randomization for unpredictable loading patterns
            final_delay = random.uniform(self.min_delay, self.max_delay)
            print(f"Applying generous final delay of {final_delay:.1f} seconds to ensure all content is fully formed...")
            time.sleep(final_delay)
            print("✓ Final delay completed")

            # STEP 19: Final interaction jiggle to trigger any last dynamic content
            self._final_interaction_jiggle(page)

            # STEP 20: Verify no loading indicators remain
            self._verify_no_loading_indicators(page)

            # STEP 21: Final header and video check - ensure everything is visible
            page.evaluate("window.scrollTo(0, 0)")
            time.sleep(0.5)

            if video_elements:
                self._force_youtube_video_visibility(page, video_elements) # Final comprehensive YouTube check
                print("✓ Final YouTube video enforcement attempt")
                # Allow time for the videos to display after final enforcement
                time.sleep(3) # Crucial wait after final YouTube interaction

            # STEP 22: Take the screenshot with all content loaded
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

    def _identify_video_elements(self, page) -> List[Dict[str, Any]]:
        """
        Identify embedded video elements with enhanced detection for YouTube floor plans.
        """
        try:
            return page.evaluate("""
                () => {
                    const videoElements = [];
                    const allIframes = Array.from(document.querySelectorAll('iframe'));

                    allIframes.forEach((iframe, index) => {
                        const rect = iframe.getBoundingClientRect();
                        if (rect.width > 100 && rect.height > 100 && rect.width > 0 && rect.height > 0) {
                            const style = window.getComputedStyle(iframe);
                            if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
                                return;
                            }
                            let videoType = 'unknown';
                            if (iframe.src) {
                                if (iframe.src.includes('youtube.com/') || iframe.src.includes('youtu.be/') || 
                                    iframe.src.includes('youtube-nocookie.com/')) {
                                    videoType = 'youtube';
                                } else if (iframe.src.includes('vimeo.com/')) {
                                    videoType = 'vimeo';
                                } else {
                                    videoType = 'iframe';
                                }
                            } else {
                                videoType = 'dynamic-iframe';
                            }
                            videoElements.push({
                                type: videoType,
                                selector: iframe.id ? `#${iframe.id}` : `iframe:nth-of-type(${index + 1})`,
                                src: iframe.src || '',
                                rect: { top: rect.top + window.scrollY, left: rect.left + window.scrollX, width: rect.width, height: rect.height },
                                id: iframe.id || `iframe-${index}`,
                                allow: iframe.allow || '',
                                allowFullscreen: iframe.allowFullscreen || false
                            });
                        }
                    });

                    const html5Videos = document.querySelectorAll('video');
                    html5Videos.forEach((video, index) => {
                        const rect = video.getBoundingClientRect();
                        if (rect.width > 0 && rect.height > 0) {
                            const style = window.getComputedStyle(video);
                            if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
                                return;
                            }
                            videoElements.push({
                                type: 'html5',
                                selector: video.id ? `#${video.id}` : `video:nth-of-type(${index + 1})`,
                                rect: { top: rect.top + window.scrollY, left: rect.left + window.scrollX, width: rect.width, height: rect.height },
                                id: video.id || `video-${index}`
                            });
                        }
                    });

                    const potentialContainers = document.querySelectorAll(
                        '.video-container, .video-wrapper, .video-player, .embed-container, ' +
                        '[class*="video"], [class*="player"], [id*="video"], [id*="player"]'
                    );
                    potentialContainers.forEach((container, index) => {
                        if (container.querySelector('iframe') || container.querySelector('video')) {
                            const hasProcessedChild = videoElements.some(ve => {
                                const el = document.querySelector(ve.selector);
                                return el && container.contains(el);
                            });
                            if (hasProcessedChild) return;
                        }
                        const rect = container.getBoundingClientRect();
                        if (rect.width > 200 && rect.height > 200 && rect.width > 0 && rect.height > 0) {
                            const style = window.getComputedStyle(container);
                            if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
                                return;
                            }
                            videoElements.push({
                                type: 'container',
                                selector: container.id ? `#${container.id}` : (container.className && typeof container.className === 'string' ? `.${container.className.split(' ')[0]}` : `div:nth-of-type(${index + 1})`),
                                rect: { top: rect.top + window.scrollY, left: rect.left + window.scrollX, width: rect.width, height: rect.height },
                                id: container.id || `container-${index}`
                            });
                        }
                    });
                    return videoElements;
                }
            """)
        except Exception as e:
            print(f"Error identifying video elements: {e}")
            return []

    def _prepare_video_elements(self, page, video_elements: List[Dict[str, Any]]):
        if not video_elements:
            return
        try:
            print("Preparing video elements for display (general settings)...")
            for video in video_elements:
                try:
                    scroll_y = max(0, video["rect"]["top"] - 100)
                    page.evaluate(f"window.scrollTo(0, {scroll_y})") # f-string is fine here
                    time.sleep(0.5)

                    video_type = video.get("type", "unknown")
                    video_src = video.get("src", "")

                    if video["type"] == "youtube" or video["src"].find("youtube") >= 0:
                        # Get the current iframe src
                        current_src = page.evaluate("""
                            (selector) => {
                                const iframe = document.querySelector(selector);
                                return iframe ? iframe.src : null;
                            }
                        """, video["selector"])
                        
                        if current_src:
                            # Create a fully-enabled YouTube URL with all parameters for maximum compatibility
                            page.evaluate("""
                                (selector, originalSrc) => {
                                    const iframe = document.querySelector(selector);
                                    if (iframe) {
                                        try {
                                            // Start with the original URL
                                            let url = new URL(originalSrc);
                                            
                                            // Set parameters for autoplay and visibility
                                            url.searchParams.set('autoplay', '1');
                                            url.searchParams.set('mute', '1');
                                            url.searchParams.set('controls', '1');
                                            url.searchParams.set('rel', '0');
                                            url.searchParams.set('loop', '1');
                                            
                                            // Get the video ID to set up playlist for looping
                                            let videoId = '';
                                            
                                            // Extract from standard YouTube URL
                                            if (url.searchParams.has('v')) {
                                                videoId = url.searchParams.get('v');
                                            } 
                                            // Extract from /embed/ URL format
                                            else if (url.pathname.includes('/embed/')) {
                                                videoId = url.pathname.split('/embed/')[1].split('?')[0];
                                            }
                                            // Extract from youtu.be URL
                                            else if (url.hostname.includes('youtu.be')) {
                                                videoId = url.pathname.substring(1);
                                            }
                                            
                                            // If we have a video ID, set up playlist for proper looping
                                            if (videoId) {
                                                url.searchParams.set('playlist', videoId);
                                            }
                                            
                                            // Update iframe attributes
                                            iframe.src = url.toString();
                                            iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
                                            iframe.allowFullscreen = true;
                                            
                                            // Force iframe to be visible
                                            iframe.style.opacity = '1';
                                            iframe.style.visibility = 'visible';
                                            iframe.style.display = 'block';
                                            
                                            // Make its parent containers visible too
                                            let parent = iframe.parentElement;
                                            while (parent && parent.tagName !== 'BODY') {
                                                parent.style.opacity = '1';
                                                parent.style.visibility = 'visible';
                                                parent.style.display = parent.style.display === 'none' ? 'block' : parent.style.display;
                                                parent = parent.parentElement;
                                            }
                                            
                                            console.log("Enhanced YouTube iframe:", iframe.src);
                                        } catch(e) {
                                            console.error("Error enhancing YouTube iframe:", e);
                                        }
                                    }
                                }
                            """, video["selector"], current_src)
                    elif video_type == "vimeo":
                        page.evaluate("""
                            (selector) => {
                                const iframe = document.querySelector(selector);
                                if (iframe && iframe.src) {
                                    try {
                                        const url = new URL(iframe.src);
                                        url.searchParams.set('autoplay', '1');
                                        url.searchParams.set('muted', '1');
                                        url.searchParams.set('background', '1');
                                        url.searchParams.set('loop', '1');
                                        iframe.src = url.toString();
                                        iframe.allow = "autoplay; fullscreen; picture-in-picture";
                                    } catch(e) { console.error("Error enhancing Vimeo iframe:", e); }
                                }
                            }
                        """, video["selector"])
                    elif video_type == "html5":
                        page.evaluate("""
                            (selector) => {
                                const videoEl = document.querySelector(selector); // Renamed to avoid conflict
                                if (videoEl) {
                                    videoEl.muted = true;
                                    videoEl.autoplay = true;
                                    videoEl.loop = true;
                                    videoEl.controls = true; 
                                    try { videoEl.play(); } catch(e) { console.error("Error playing HTML5 video:", e); }
                                }
                            }
                        """, video["selector"])
                    elif video_type in ["iframe", "dynamic-iframe", "container"]:
                        page.evaluate("""
                            (selector) => {
                                const element = document.querySelector(selector);
                                if (element) {
                                    element.style.opacity = '1';
                                    element.style.visibility = 'visible';
                                    element.style.display = 'block';
                                    if (element.tagName === 'IFRAME') {
                                        element.allowFullscreen = true;
                                        element.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
                                    }
                                }
                            }
                        """, video["selector"])
                    time.sleep(0.3)
                except Exception as video_error:
                    print(f"Error preparing video {video.get('selector', 'unknown_selector')}: {video_error}")
                    continue
            time.sleep(2)
        except Exception as e:
            print(f"Error preparing videos for display: {e}")

    def _play_videos(self, page, video_elements: List[Dict[str, Any]]):
        if not video_elements: return
        try:
            primary_video = None
            max_size = 0
            for video in video_elements:
                area = video["rect"]["width"] * video["rect"]["height"]
                if area > max_size:
                    max_size = area
                    primary_video = video

            if primary_video:
                print(f"Playing primary {primary_video['type']} video: {primary_video['selector']}...")
                scroll_y = max(0, primary_video["rect"]["top"] - 150)
                page.evaluate(f"window.scrollTo(0, {scroll_y})") # f-string fine

                video_type = primary_video.get("type", "unknown")
                if video_type == "youtube":
                     print(f"  Primary video is YouTube; specific play logic is in _force_youtube_video_visibility.")
                elif video_type in ["vimeo", "iframe", "dynamic-iframe"]:
                    try:
                        video_element = page.query_selector(primary_video["selector"])
                        if video_element:
                            video_element.click(position={"x": primary_video["rect"]["width"]/2, "y": primary_video["rect"]["height"]/2}, timeout=3000, force=True)
                            print(f"  Clicked primary {video_type} iframe.")
                    except Exception as e:
                        print(f"  Could not click primary {video_type} iframe {primary_video['selector']}: {e}")
                        page.evaluate("""
                            (selector) => {
                                const iframe = document.querySelector(selector);
                                if (iframe) iframe.focus();
                            }
                        """, primary_video["selector"])
                elif primary_video["type"] == "html5":
                    page.evaluate("""
                        (selector) => {
                            const video = document.querySelector(selector);
                            if (video) {
                                video.controls = true;
                                video.muted = true; 
                                video.play().catch(e => console.log("Error playing HTML5 video:", e));
                            }
                        }
                    """, primary_video["selector"])
                print(f"Waiting {self.video_play_time} seconds for primary video to display frames...")
                time.sleep(self.video_play_time)
        except Exception as e:
            print(f"Error playing videos: {e}")

    def _ensure_videos_visible(self, page, video_elements: List[Dict[str, Any]]):
        if not video_elements: return
        try:
            print("Ensuring all videos are generally visible...")
            for video in video_elements:
                try:
                    video_type = video.get("type", "unknown")
                    if video_type == "youtube" and "youtube" in video.get("src", ""):
                        continue 
                    page.evaluate("""
                        (selector) => {
                            const element = document.querySelector(selector);
                            if (element) {
                                element.style.opacity = '1';
                                element.style.visibility = 'visible';
                                element.style.display = 'block';
                                let parent = element.parentElement;
                                while (parent && parent.tagName !== 'BODY' && parent.tagName !== 'HTML') {
                                    const parentStyle = window.getComputedStyle(parent);
                                    if (parentStyle.opacity === '0' || parentStyle.visibility === 'hidden' || parentStyle.display === 'none') {
                                        parent.style.opacity = '1';
                                        parent.style.visibility = 'visible';
                                        if (parentStyle.display === 'none') parent.style.display = 'block';
                                    }
                                    parent = parent.parentElement;
                                }
                                if (element.tagName === 'IFRAME' && 
                                    (element.src.includes('youtube') || element.src.includes('vimeo'))) {
                                    element.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
                                }
                            }
                        }
                    """, video["selector"])
                except Exception as element_error:
                    print(f"Error ensuring video visibility for {video.get('selector', 'unknown_selector')}: {element_error}")
                    continue
            time.sleep(0.5)
        except Exception as e:
            print(f"Error ensuring video visibility: {e}")

    def _identify_fixed_elements(self, page) -> List[Dict[str, Any]]:
        try:
            return page.evaluate("""
                () => {
                    const fixedElements = [];
                    const headerSelectors = [
                        'header', '#header', '.header', 'nav', '#nav', '.nav', '.navbar', '.navigation',
                        '#menu', '.menu', '.main-menu', '.fixed-top', '.sticky-top', '.site-header',
                        'div[class*="header"]', 'div[id*="header"]', 'div[class*="navbar"]', 'div[id*="navbar"]', '[role="navigation"]'
                    ];
                    for (const selector of headerSelectors) {
                        try {
                            const elements = document.querySelectorAll(selector);
                            for (const element of elements) {
                                if (element.dataset._processed) continue;
                                const style = window.getComputedStyle(element);
                                const rect = element.getBoundingClientRect();
                                if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0' || rect.width === 0 || rect.height === 0) continue;
                                const isHeader = element.tagName.toLowerCase() === 'header' || element.id.toLowerCase().includes('header') || Array.from(element.classList).some(c => c.toLowerCase().includes('header'));
                                const isNavigation = element.tagName.toLowerCase() === 'nav' || element.id.toLowerCase().includes('nav') || Array.from(element.classList).some(c => c.toLowerCase().includes('nav'));
                                const isFixed = style.position === 'fixed' || style.position === 'sticky' || element.classList.contains('fixed-top') || element.classList.contains('sticky-top');
                                if (isFixed || ((isHeader || isNavigation) && rect.top < 100)) {
                                    let selectorPath = '';
                                    if (element.id) selectorPath = `#${element.id}`;
                                    else {
                                        const classList = Array.from(element.classList).slice(0, 3);
                                        if (classList.length > 0) selectorPath = `${element.tagName.toLowerCase()}.${classList.join('.')}`;
                                        else {
                                            selectorPath = element.tagName.toLowerCase();
                                            if (element.parentElement && element.parentElement.id) selectorPath = `#${element.parentElement.id} > ${selectorPath}`;
                                        }
                                    }
                                    fixedElements.push({ selector: selectorPath, rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height }, position: style.position, isHeader: isHeader, isNavigation: isNavigation });
                                    element.dataset._processed = 'true';
                                }
                            }
                        } catch (selectorError) { continue; }
                    }
                    const allElements = document.querySelectorAll('*');
                    for (const element of allElements) {
                        if (element.dataset._processed) continue;
                        try {
                            const style = window.getComputedStyle(element);
                            if (style.position !== 'fixed' && style.position !== 'sticky') continue;
                            const rect = element.getBoundingClientRect();
                            if (rect.top > 100 || rect.width < window.innerWidth * 0.5 || rect.height < 30) continue;
                            let selectorPath = '';
                            if (element.id) selectorPath = `#${element.id}`;
                            else {
                                const classList = Array.from(element.classList).slice(0, 3);
                                if (classList.length > 0) selectorPath = `${element.tagName.toLowerCase()}.${classList.join('.')}`;
                                else {
                                    const index = Array.from(element.parentNode.children).indexOf(element);
                                    selectorPath = `${element.tagName.toLowerCase()}:nth-child(${index + 1})`;
                                }
                            }
                            fixedElements.push({ selector: selectorPath, rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height }, position: style.position, isHeader: rect.top < 20, isNavigation: element.querySelectorAll('a').length > 2 });
                            element.dataset._processed = 'true';
                        } catch (elementError) { continue; }
                    }
                    document.querySelectorAll('[data-_processed]').forEach(el => { delete el.dataset._processed; });
                    return fixedElements;
                }
            """)
        except Exception as e:
            print(f"Error identifying fixed elements: {e}")
            return []

    def _initial_full_page_scroll(self, page):
        try:
            page_height = page.evaluate("document.body.scrollHeight")
            viewport_height = page.viewport_size["height"]
            print("Scrolling to bottom to trigger all lazy loading...")
            page.evaluate(f"window.scrollTo({{top: {page_height}, behavior: 'smooth'}})") # f-string fine
            time.sleep(3)
            new_height = page.evaluate("document.body.scrollHeight")
            if new_height > page_height:
                print(f"Page height increased from {page_height} to {new_height} after scrolling")
                page_height = new_height
                page.evaluate(f"window.scrollTo({{top: {page_height}, behavior: 'smooth'}})") # f-string fine
                time.sleep(2)
            step_size = viewport_height // 2
            for pos in range(page_height, 0, -step_size):
                page.evaluate(f"window.scrollTo({{top: {pos}, behavior: 'smooth'}})") # f-string fine
                time.sleep(0.3)
            page.evaluate("window.scrollTo({top: 0, behavior: 'smooth'})")
            time.sleep(1)
        except Exception as e:
            print(f"Error during initial page scroll: {e}")

    def _ensure_fixed_elements_loaded(self, page, fixed_elements: List[Dict[str, Any]]):
        if not fixed_elements: return
        try:
            print("Ensuring headers and navigation elements are loaded...")
            for element_data in fixed_elements:
                selector = element_data["selector"]
                try:
                    page.evaluate("window.scrollTo(0, 0)")
                    time.sleep(0.5)
                    el_handle = page.query_selector(selector)
                    if el_handle:
                        rect = element_data["rect"] # Use rect from identified data
                        # Check if rect is valid before using its values
                        if rect and isinstance(rect, dict) and all(k in rect for k in ['left', 'width', 'top', 'height']):
                            center_x = rect["left"] + rect["width"] / 2
                            center_y = rect["top"] + rect["height"] / 2
                            page.mouse.move(center_x, center_y) # rect.top might be relative to viewport at time of capture
                            time.sleep(0.3)
                        page.evaluate("""
                            (sel) => {
                                const elem = document.querySelector(sel);
                                if (elem) {
                                    const links = elem.querySelectorAll('a');
                                    if (links.length > 0) {
                                        links[0].dispatchEvent(new MouseEvent('mouseover', { bubbles: true, cancelable: true, view: window }));
                                    }
                                }
                            }
                        """, selector)
                        time.sleep(0.5)
                except Exception as element_error:
                    print(f"Error interacting with fixed element {selector}: {element_error}")
                    continue
            time.sleep(1)
        except Exception as e:
            print(f"Error ensuring fixed elements are loaded: {e}")

    def _ensure_header_visibility(self, page, fixed_elements: List[Dict[str, Any]]):
        if not fixed_elements: return
        try:
            print("Ensuring header visibility for screenshot...")
            page.evaluate("window.scrollTo(0, 0)")
            time.sleep(0.5)
            for element_data in fixed_elements:
                if element_data["isHeader"] or element_data["isNavigation"]:
                    selector = element_data["selector"]
                    page.evaluate("""
                        (sel) => {
                            const elem = document.querySelector(sel);
                            if (elem) {
                                elem.style.opacity = '1';
                                elem.style.visibility = 'visible';
                                elem.style.display = elem.style.display === 'none' ? 'block' : elem.style.display;
                                if (elem.style.position === 'fixed' || elem.style.position === 'sticky') {
                                    elem.style.top = '0px';
                                }
                                if (!elem.style.zIndex || parseInt(elem.style.zIndex) < 1000) {
                                    elem.style.zIndex = '1000';
                                }
                            }
                        }
                    """, selector)
                    try:
                        el_handle = page.query_selector(selector)
                        if el_handle: el_handle.scroll_into_view_if_needed()
                    except: pass
            page.evaluate("window.scrollTo(0, 0)")
            time.sleep(0.5)
        except Exception as e:
            print(f"Error ensuring header visibility: {e}")

    def _identify_content_boxes(self, page) -> List[Dict[str, Any]]:
        try:
            return page.evaluate("""
                () => {
                    const contentSelectors = [
                        '.card', '.box', '.section', '.container', '.content', '.service', '.feature', '.benefit', '.advantage',
                        '.row > div', '.grid > div', '.col', '.flex > div', '.testimonial', '.review', '.quote',
                        '.info-box', '.callout', '.highlight', '.cta', '.features li', '.benefits li', '.list-item',
                        'article', 'section', '.text-container', 'div[style*="width"][style*="height"]', 
                        'div[class*="box"]', 'div[class*="card"]', 'div[class*="container"]', 'div[class*="wrapper"]'
                    ];
                    const contentBoxes = [];
                    for (const selector of contentSelectors) {
                        try {
                            const elements = document.querySelectorAll(selector);
                            for (const element of elements) {
                                if (element.dataset._processed_cb) continue; // Use unique dataset key
                                const rect = element.getBoundingClientRect();
                                if (rect.width < 100 || rect.height < 80 || rect.width === 0 || rect.height === 0) continue;
                                const style = window.getComputedStyle(element);
                                if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;
                                let selectorPath = '';
                                if (element.id) selectorPath = `#${element.id}`;
                                else {
                                    const classList = Array.from(element.classList).slice(0, 3);
                                    if (classList.length > 0) selectorPath = `${element.tagName.toLowerCase()}.${classList.join('.')}`;
                                    else {
                                        const index = Array.from(element.parentNode.children).indexOf(element);
                                        selectorPath = `${element.tagName.toLowerCase()}:nth-child(${index + 1})`;
                                    }
                                }
                                const textContent = element.textContent.trim();
                                contentBoxes.push({
                                    selector: selectorPath,
                                    rect: { top: rect.top + window.scrollY, left: rect.left + window.scrollX, width: rect.width, height: rect.height },
                                    currentTextLength: textContent.length,
                                    hasDescendantImages: element.querySelectorAll('img').length > 0,
                                    isEmpty: textContent.length < 20 || (textContent.length < 100 && !element.querySelector('img'))
                                });
                                element.dataset._processed_cb = 'true';
                            }
                        } catch (selectorError) { continue; }
                    }
                    document.querySelectorAll('[data-_processed_cb]').forEach(el => { delete el.dataset._processed_cb; });
                    return contentBoxes;
                }
            """)
        except Exception as e:
            print(f"Error identifying content boxes: {e}")
            return []

    def _smart_scroll_with_content_focus(self, page, content_boxes: List[Dict[str, Any]]):
        try:
            page_height = page.evaluate("document.body.scrollHeight")
            viewport_height = page.viewport_size["height"]
            scroll_positions = list(range(0, page_height, viewport_height // 2))
            if content_boxes:
                for box in content_boxes:
                    box_top = box["rect"]["top"]
                    scroll_positions.append(max(0, box_top - (viewport_height // 4)))
                    scroll_positions.append(max(0, box_top - (viewport_height // 2) + (box["rect"]["height"] // 2)))
                scroll_positions = sorted(list(set([int(pos) for pos in scroll_positions if pos < page_height]))) # Ensure positions are within current height

            last_height = page_height
            for i, position in enumerate(scroll_positions):
                if position >= last_height: # Check against potentially updated height
                    # If list was not updated yet, ensure we don't scroll beyond current known bottom
                    current_eval_height = page.evaluate("document.body.scrollHeight")
                    if position >= current_eval_height:
                        continue
                
                page.evaluate(f"window.scrollTo({{top: {position}, behavior: 'smooth'}})") # f-string fine
                progress = position / last_height if last_height > 0 else 0
                wait_time = 0.3 + 0.5 * (1 - abs(2 * progress - 1))
                time.sleep(wait_time)
                
                if i % 5 == 0 or random.random() < 0.2: # Check height change more frequently or randomly
                    new_height = page.evaluate("document.body.scrollHeight")
                    if new_height > last_height:
                        print(f"Page height changed during smart scroll: {last_height} -> {new_height}")
                        # Add new scroll points for the new content area
                        additional_positions = list(range(last_height, new_height, viewport_height // 2))
                        # Insert new positions into the remaining scroll_positions and re-sort
                        remaining_positions = scroll_positions[i+1:]
                        new_scroll_suffix = sorted(list(set(remaining_positions + additional_positions)))
                        scroll_positions = scroll_positions[:i+1] + [p for p in new_scroll_suffix if p >= position and p < new_height] # Filter to avoid going back and ensure within new bounds
                        last_height = new_height
            
            page.evaluate("window.scrollTo({top: document.body.scrollHeight, behavior: 'smooth'})")
            time.sleep(0.7)
            page.evaluate("window.scrollTo({top: 0, behavior: 'smooth'})")
            time.sleep(0.7)
        except Exception as e:
            print(f"Error during smart scrolling: {e}")

    def _verify_content_boxes(self, page, content_boxes: List[Dict[str, Any]]) -> Dict[str, Any]:
        try:
            if not content_boxes:
                return {"filled": 0, "empty": []}
            results = page.evaluate("""
                (boxes) => {
                    const res = { filled: 0, empty: [] };
                    for (const box of boxes) {
                        try {
                            const element = document.querySelector(box.selector);
                            if (!element) {
                                res.empty.push(box.selector); continue;
                            }
                            const currentText = element.textContent.trim();
                            const hasMoreContent = currentText.length > box.currentTextLength + 20;
                            const hasImages = element.querySelectorAll('img').length > 0;
                            const imagesLoaded = Array.from(element.querySelectorAll('img')).every(img => img.complete && img.naturalWidth > 0);
                            if (hasMoreContent || (hasImages && imagesLoaded && currentText.length > 30) || currentText.length > 100) {
                                res.filled++;
                            } else if (box.isEmpty && (currentText.length < 50 && !hasImages)) {
                                res.empty.push(box.selector);
                            } else { res.filled++; }
                        } catch (e) { res.empty.push(box.selector); }
                    }
                    return res;
                }
            """, content_boxes)
            return results
        except Exception as e:
            print(f"Error verifying content boxes: {e}")
            return {"filled": 0, "empty": [cb['selector'] for cb in content_boxes]}

    def _trigger_content_loading(self, page, empty_selectors: List[str]):
        try:
            if not empty_selectors: return
            for selector in empty_selectors:
                try:
                    page.evaluate("""
                        (sel) => {
                            const elem = document.querySelector(sel);
                            if (elem) elem.scrollIntoView({behavior: 'smooth', block: 'center'});
                        }
                    """, selector)
                    time.sleep(0.5)
                    element_handle = page.query_selector(selector)
                    if element_handle:
                        element_handle.hover(timeout=1000)
                        time.sleep(0.3)
                        element_box = page.evaluate("""
                            (sel) => {
                                const elem = document.querySelector(sel);
                                if (elem) {
                                    const rect = elem.getBoundingClientRect();
                                    return { x: rect.left + (rect.width / 2), y: rect.top + (rect.height / 2), width: rect.width, height: rect.height };
                                }
                                return null;
                            }
                        """, selector)
                        if element_box:
                            center_x, center_y = element_box["x"], element_box["y"]
                            page.mouse.move(center_x, center_y)
                            time.sleep(0.2)
                            radius = min(element_box["width"], element_box["height"]) / 4 if element_box["width"] > 0 and element_box["height"] > 0 else 10
                            steps = 4
                            for i in range(steps):
                                angle = 2 * math.pi * (i / steps)
                                x = center_x + radius * 0.8 * math.cos(angle)
                                y = center_y + radius * 0.8 * math.sin(angle)
                                page.mouse.move(x, y)
                                time.sleep(0.1)
                            page.mouse.move(center_x, center_y)
                except Exception as element_error:
                    print(f"Error triggering load for {selector}: {element_error}")
                    continue
            time.sleep(1)
        except Exception as e:
            print(f"Error triggering content loading: {e}")

    def _wait_for_animations_complete(self, page):
        try:
            animations_present = page.evaluate("""
                () => {
                    const hasCSS3 = !!document.querySelector('[class*="animate"], [class*="animation"], [class*="motion"], [style*="animation"]');
                    const hasGSAP = typeof window.gsap !== 'undefined' && typeof window.gsap.globalTimeline !== 'undefined' && window.gsap.globalTimeline.getChildren(true, true, true).length > 0;
                    const hasAnime = typeof window.anime !== 'undefined' && typeof window.anime.running !== 'undefined' && window.anime.running.length > 0;
                    const hasJQuery = typeof window.jQuery !== 'undefined' && typeof window.jQuery.timers !== 'undefined' && window.jQuery.timers.length > 0; // jQuery(':animated') is better
                    return { hasAnimations: hasCSS3 || hasGSAP || hasAnime || hasJQuery, types: { css3: hasCSS3, gsap: hasGSAP, anime: hasAnime, jquery: hasJQuery }};
                }
            """)
            if animations_present["hasAnimations"]:
                animation_types_str = ", ".join([k for k, v in animations_present["types"].items() if v])
                print(f"Detected animations: {animation_types_str}. Waiting for completion...")
                time.sleep(3) 
        except Exception as e:
            print(f"Error waiting for animations: {e}")

    def _final_interaction_jiggle(self, page):
        try:
            width = page.viewport_size["width"]
            height = page.viewport_size["height"]
            page.mouse.move(width / 2, height / 2)
            time.sleep(0.2)
            for _ in range(3):
                x = width / 2 + random.randint(-100, 100)
                y = height / 2 + random.randint(-100, 100)
                page.mouse.move(x, y)
                time.sleep(0.1)
            page.mouse.move(width / 2, height / 2)
            time.sleep(0.2)
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
        try:
            loading_indicators = page.evaluate("""
                () => {
                    const spinnerSelectors = ['[class*="loading"]', '[class*="spinner"]', '[class*="loader"]', '[id*="loading"]', '[id*="spinner"]', '[id*="loader"]', '.fa-spinner', '.fa-circle-notch', '.fa-sync', '.fa-refresh'].join(',');
                    const loadingElements = document.querySelectorAll(spinnerSelectors);
                    const visibleLoaders = Array.from(loadingElements).filter(el => {
                        const style = window.getComputedStyle(el); const rect = el.getBoundingClientRect();
                        return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0' && rect.width > 0 && rect.height > 0;
                    });
                    return { count: visibleLoaders.length, selectors: visibleLoaders.map(el => {
                        let selector = el.tagName.toLowerCase(); if (el.id) selector += `#${el.id}`;
                        if (el.className && typeof el.className === 'string') selector += `.${el.className.replace(/\s+/g, '.')}`; return selector;
                    })};
                }
            """)
            if loading_indicators["count"] > 0:
                print(f"Still found {loading_indicators['count']} loading indicators ({loading_indicators['selectors']}). Waiting longer...")
                time.sleep(3)
        except Exception as e:
            print(f"Error verifying loading indicators: {e}")

    def capture(self, page, url, page_number):
        screenshots = []
        for viewport in self.viewports:
            screenshot = self.capture_screenshot(page, url, viewport, page_number)
            if screenshot: screenshots.append(screenshot)
        return screenshots

    def get_screenshot_paths(self, device_type):
        device_dir = os.path.join(self.screenshots_dir, device_type)
        if not os.path.exists(device_dir): return []
        return [os.path.join(device_dir, f) for f in os.listdir(device_dir) if f.endswith('.png')]

    def _force_youtube_video_visibility(self, page, video_elements: List[Dict[str, Any]]):
        if not video_elements: return
        try:
            youtube_videos = [v for v in video_elements if v.get("type") == "youtube" or (v.get("src") and ("youtube.com/" in v["src"] or "youtu.be/" in v["src"] or "youtube-nocookie.com/" in v["src"]))]
            if youtube_videos:
                print(f"Attempting to force visibility and play for {len(youtube_videos)} YouTube videos...")
                for video_data in youtube_videos:
                    video_selector = video_data["selector"]
                    print(f"Processing YouTube video: {video_selector}")
                    iframe_element_handle = page.query_selector(video_selector)
                    if not iframe_element_handle:
                        print(f"  YouTube iframe {video_selector} not found.")
                        continue
                    page.evaluate("""
                        (selector) => {
                            // Find the iframe
                            const iframe = document.querySelector(selector);
                            if (iframe) {
                                console.log("Forcing YouTube video visibility:", selector);
                                
                                // Make the YouTube iframe absolutely visible 
                                iframe.style.opacity = '1 !important';
                                iframe.style.visibility = 'visible !important';
                                iframe.style.display = 'block !important';
                                
                                // If iframe is inside a relative/absolute positioned container, ensure z-index
                                iframe.style.zIndex = '999999';
                                
                                // If it has a width/height of 0, force dimensions
                                if (iframe.offsetWidth === 0 || iframe.offsetHeight === 0) {
                                    iframe.style.width = '100%';
                                    iframe.style.height = '100%';
                                    iframe.style.minWidth = '300px';
                                    iframe.style.minHeight = '200px';
                                }
                                
                                // Modify src if needed to force autoplay
                                if (iframe.src) {
                                    try {
                                        let url = new URL(iframe.src);
                                        
                                        // Clear any previous params then set our needed ones
                                        // to avoid any conflicting parameters
                                        url.searchParams.delete('autoplay');
                                        url.searchParams.delete('mute');
                                        url.searchParams.delete('controls');
                                        url.searchParams.delete('loop');
                                        
                                        // Now set our parameters
                                        url.searchParams.set('autoplay', '1');
                                        url.searchParams.set('mute', '1');
                                        url.searchParams.set('controls', '0');  // Hide controls for floorplans
                                        url.searchParams.set('rel', '0');
                                        url.searchParams.set('showinfo', '0');
                                        url.searchParams.set('loop', '1');
                                        
                                        // Get video ID for playlist parameter
                                        let videoId = '';
                                        if (url.searchParams.has('v')) {
                                            videoId = url.searchParams.get('v');
                                        } else if (url.pathname.includes('/embed/')) {
                                            videoId = url.pathname.split('/embed/')[1].split('?')[0];
                                        }
                                        
                                        if (videoId) {
                                            url.searchParams.set('playlist', videoId);
                                        }
                                        
                                        // Update source with all our parameters
                                        iframe.src = url.toString();
                                    } catch(e) {
                                        console.error("Error updating YouTube URL:", e);
                                    }
                                }
                                
                                // Set iframe attributes
                                iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
                                iframe.allowFullscreen = true;
                                
                                // Make all parent elements visible
                                let parent = iframe.parentElement;
                                let depth = 0;
                                
                                while (parent && parent.tagName !== 'BODY' && depth < 10) {
                                    // Force parent visibility
                                    parent.style.opacity = '1 !important';
                                    parent.style.visibility = 'visible !important';
                                    parent.style.display = parent.style.display === 'none' ? 'block' : parent.style.display;
                                    
                                    // Handle potential stacking contexts
                                    const parentStyle = window.getComputedStyle(parent);
                                    if (parentStyle.position === 'relative' || 
                                        parentStyle.position === 'absolute' || 
                                        parentStyle.position === 'fixed') {
                                        parent.style.zIndex = '999998';  // Just below the iframe
                                    }
                                    
                                    parent = parent.parentElement;
                                    depth++;
                                }
                                
                                // Get the document element of the iframe if possible
                                setTimeout(() => {
                                    try {
                                        // Try to reach into the iframe to force play
                                        if (iframe.contentWindow) {
                                            iframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
                                        }
                                    } catch(e) {}
                                }, 1000);
                            }
                        }
                    """, video["selector"])
                    page.wait_for_timeout(500)
                    iframe_content_frame = iframe_element_handle.content_frame()
                    if iframe_content_frame:
                        print(f"  Got content_frame for {video_selector}")
                        cookie_selectors_internal = [
                            'button[aria-label*="Accept"]', 'button[aria-label*="Agree"]', 'button:has-text("Accept all")', 
                            'button:has-text("Agree to all")', 'div[role="dialog"] button:has-text("Accept")', 
                            'form[action*="consent"] button[type="submit"]', 'button.ytp-button[title*="Accept"]', 
                            'div#dialog button.yt-spec-button-shape-next--filled', 'button[data-idom-class*="dismiss"]'
                        ]
                        for cs_selector_internal in cookie_selectors_internal:
                            try:
                                cookie_button_internal = iframe_content_frame.query_selector(cs_selector_internal)
                                if cookie_button_internal and cookie_button_internal.is_visible():
                                    print(f"    Attempting to click cookie button within iframe: {cs_selector_internal}")
                                    cookie_button_internal.click(timeout=3000)
                                    print(f"    Clicked cookie button {cs_selector_internal} within iframe.")
                                    page.wait_for_timeout(1500)
                                    break 
                            except Exception: pass # Silently continue if cookie button fails
                        
                        current_iframe_src_attr = iframe_element_handle.get_attribute('src')
                        if not current_iframe_src_attr:
                             print(f"  YouTube iframe {video_selector} has no initial src. Cannot modify.")
                        else:
                            print(f"  Current iframe src (attribute): {current_iframe_src_attr}")
                            page.evaluate("""
                                (args) => {
                                    const selector = args.selector; let originalSrc = args.originalSrc;
                                    const iframe = document.querySelector(selector);
                                    if (iframe) {
                                        try {
                                            if (!originalSrc || (!originalSrc.startsWith('http:') && !originalSrc.startsWith('https:'))) {
                                                if (iframe.src && (iframe.src.startsWith('http:') || iframe.src.startsWith('https:'))) originalSrc = iframe.src;
                                                else return;
                                            }
                                            let url = new URL(originalSrc);
                                            url.searchParams.set('autoplay', '1'); url.searchParams.set('mute', '1');
                                            url.searchParams.set('controls', '0'); url.searchParams.set('showinfo', '0');
                                            url.searchParams.set('rel', '0'); url.searchParams.set('iv_load_policy', '3');
                                            url.searchParams.set('playsinline', '1'); url.searchParams.set('enablejsapi', '1');
                                            let videoId = '';
                                            if (url.searchParams.has('v')) videoId = url.searchParams.get('v');
                                            else if (url.pathname.includes('/embed/')) {
                                                const pathParts = url.pathname.split('/embed/');
                                                if (pathParts.length > 1) videoId = pathParts[1].split(/[?\/]/)[0];
                                            } else if (url.hostname.includes('youtube.com') && url.pathname.startsWith('/v/')) { // for some old /v/ type URLs
                                                videoId = url.pathname.substring(3).split(/[?\/]/)[0];
                                            }
                                            if (videoId) {
                                                url.searchParams.set('loop', '1'); url.searchParams.set('playlist', videoId);
                                            } else { url.searchParams.delete('loop'); url.searchParams.delete('playlist'); }
                                            const newSrc = url.toString();
                                            if (iframe.getAttribute('src') !== newSrc) iframe.setAttribute('src', newSrc);
                                            iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
                                            iframe.allowFullscreen = true;
                                        } catch(e) { console.error("  Error updating YouTube iframe src in JS:", e, "Original src was:", originalSrc); }
                                    }
                                }
                                """, {"selector": video_selector, "originalSrc": current_iframe_src_attr }
                            )
                            page.wait_for_timeout(3000)
                        iframe_content_frame = iframe_element_handle.content_frame() # Re-acquire
                        if iframe_content_frame:
                            try:
                                play_button_selectors_internal = ['.ytp-large-play-button', 'button[aria-label="Play"]', '.ytp-play-button[title="Play"]', 'div.ytp-cued-thumbnail-overlay-image']
                                play_clicked = False
                                for pb_selector in play_button_selectors_internal:
                                    play_button_handle = iframe_content_frame.query_selector(pb_selector)
                                    if play_button_handle and play_button_handle.is_visible():
                                        print(f"    Found play button/overlay ({pb_selector}) in iframe, attempting to click.")
                                        play_button_handle.click(timeout=3000)
                                        print(f"    Clicked play button/overlay ({pb_selector}) in iframe.")
                                        page.wait_for_timeout(2000)
                                        play_clicked = True; break 
                                if not play_clicked:
                                    iframe_content_frame.evaluateHandle('() => { window.postMessage(\'{"event":"command","func":"playVideo","args":""}\', "*") }')
                                    print("    Sent 'playVideo' postMessage as a fallback.")
                                    page.wait_for_timeout(1000)
                            except Exception as e_play: print(f"    Error clicking play button or sending postMessage in iframe {video_selector}: {e_play}")
                        else: print(f"  Could not re-acquire content_frame for {video_selector} after src modification for play click.")
                    else: print(f"  Could not get content_frame for {video_selector} to interact internally.")
                    print(f"  Finished processing YouTube video: {video_selector}")
                    page.wait_for_timeout(500)
                print(f"Waiting {self.video_play_time}s after all YouTube video processing attempts...")
                time.sleep(self.video_play_time)
        except Exception as e_main:
            print(f"General error in _force_youtube_video_visibility: {e_main}")