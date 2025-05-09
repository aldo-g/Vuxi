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
            # {"name": "mobile", "width": 375, "height": 667},
            # {"name": "tablet", "width": 768, "height": 1024},
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
            time.sleep(1.0)  # Increased wait time

            # Headers first, then videos (opposite of previous order)
            if fixed_elements:
                self._ensure_header_visibility(page, fixed_elements)
                print("✓ Final header visibility enforcement")
                # Give headers time to appear
                time.sleep(1.5)  # Add extra time specifically for headers

            if video_elements:
                self._force_youtube_video_visibility(page, video_elements)
                print("✓ Final YouTube video enforcement attempt")
                # Allow time for videos to display
                time.sleep(2)

            # STEP 22: Take the screenshot with all content loaded
            page.screenshot(path=filepath, full_page=True)
            print(f"--------------✓ Captured complete {viewport['name']} screenshot: {filepath}----------")

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
        """
        Enhanced method to ensure header visibility with more aggressive approach.
        """
        try:
            print("Applying strong enforcement for header visibility...")
            page.evaluate("window.scrollTo(0, 0)")
            time.sleep(0.5)
            
            # First apply generic header detection if no fixed elements were found
            if not fixed_elements:
                print("No fixed elements detected previously, trying generic header selectors...")
                page.evaluate("""
                    () => {
                        // Common header selectors
                        const headerSelectors = [
                            'header', '#header', '.header', '.site-header', 
                            'nav.navbar', '.navigation', '#navigation',
                            '.main-header', '.global-header', '.top-header',
                            '[class*="header-"]', '[id*="header-"]'
                        ];
                        
                        headerSelectors.forEach(selector => {
                            const element = document.querySelector(selector);
                            if (element) {
                                console.log("Found header with selector:", selector);
                                // Force strong visibility
                                element.style.cssText += `
                                    display: block !important;
                                    visibility: visible !important;
                                    opacity: 1 !important;
                                    position: fixed !important;
                                    top: 0 !important;
                                    left: 0 !important;
                                    width: 100% !important;
                                    z-index: 9999999 !important;
                                    transform: none !important;
                                    clip: auto !important;
                                    clip-path: none !important;
                                    max-height: none !important;
                                    overflow: visible !important;
                                `;
                            }
                        });
                    }
                """)
            
            # Now process any previously identified fixed elements
            for element_data in fixed_elements:
                if element_data.get("isHeader", False) or element_data.get("isNavigation", False):
                    selector = element_data["selector"]
                    print(f"Applying header visibility enforcement to: {selector}")
                    page.evaluate("""
                        (sel) => {
                            const elem = document.querySelector(sel);
                            if (elem) {
                                // Apply extremely strong visibility overrides
                                elem.style.cssText += `
                                    display: block !important;
                                    visibility: visible !important;
                                    opacity: 1 !important;
                                    position: fixed !important;
                                    top: 0 !important;
                                    left: 0 !important;
                                    width: 100% !important;
                                    z-index: 9999999 !important;
                                    transform: none !important;
                                    clip: auto !important;
                                    clip-path: none !important;
                                    max-height: none !important;
                                    overflow: visible !important;
                                `;
                                
                                // Also force visibility of all child elements
                                Array.from(elem.querySelectorAll('*')).forEach(child => {
                                    child.style.visibility = 'visible !important';
                                    child.style.opacity = '1 !important';
                                    child.style.display = child.style.display === 'none' ? 'block !important' : child.style.display;
                                });
                                
                                // Special handling for logos in headers
                                const logos = elem.querySelectorAll('img[src*="logo"], [class*="logo"] img, [id*="logo"] img');
                                logos.forEach(logo => {
                                    logo.style.cssText += `
                                        display: inline-block !important;
                                        visibility: visible !important;
                                        opacity: 1 !important;
                                        max-width: none !important;
                                        max-height: none !important;
                                    `;
                                });
                            }
                        }
                    """, selector)
            
            # Final extra attempt for Edinburgh Peace Institute specifically
            # (since we know this is the site giving trouble)
            page.evaluate("""
                () => {
                    // Try specific selectors for the Edinburgh Peace Institute site
                    const siteSpecificSelectors = [
                        '.site-header', 
                        '.main-header', 
                        '#masthead',
                        'header.header',
                        '.navigation-top',
                        '.navbar-fixed-top'
                    ];
                    
                    // Apply special handling for each potential header
                    siteSpecificSelectors.forEach(selector => {
                        const header = document.querySelector(selector);
                        if (header) {
                            console.log("Found Edinburgh Peace Institute specific header:", selector);
                            header.style.cssText += `
                                display: block !important;
                                visibility: visible !important;
                                opacity: 1 !important;
                                position: fixed !important;
                                top: 0 !important;
                                left: 0 !important;
                                width: 100% !important;
                                z-index: 9999999 !important;
                            `;
                            
                            // Deal with all nested elements
                            const allHeaderElements = header.querySelectorAll('*');
                            allHeaderElements.forEach(el => {
                                el.style.visibility = 'visible !important';
                                el.style.opacity = '1 !important';
                                if (el.style.display === 'none') {
                                    el.style.display = 'block !important';
                                }
                            });
                        }
                    });
                }
            """)
            
            # Make absolutely sure we're at the top of the page
            page.evaluate("window.scrollTo({top: 0, behavior: 'auto'})")
            time.sleep(1.0)  # Longer wait to ensure everything renders
            
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
                print(f"Attempting to force visibility for {len(youtube_videos)} YouTube videos...")
                
                # First approach - force CSS visibility on the parent container
                for video_data in youtube_videos:
                    video_selector = video_data["selector"]
                    print(f"Processing YouTube video: {video_selector}")
                    
                    # Apply stronger CSS overrides to ensure visibility
                    page.evaluate("""
                        (selector) => {
                            const iframe = document.querySelector(selector);
                            if (!iframe) return;
                            
                            console.log("Applying YouTube visibility fixes:", selector);
                            
                            // IMPORTANT: Multiple approaches to ensure something appears
                            
                            // 1. Strong CSS visibility fixes with !important
                            iframe.style.cssText += `
                                opacity: 1 !important;
                                visibility: visible !important; 
                                display: block !important;
                                position: relative !important;
                                z-index: 999999 !important;
                                min-width: 300px !important;
                                min-height: 200px !important;
                                background-color: #000 !important;
                            `;
                            
                            // 2. Also force visibility on all parent containers
                            let parent = iframe.parentElement;
                            let depth = 0;
                            while (parent && parent.tagName !== 'BODY' && depth < 10) {
                                parent.style.cssText += `
                                    opacity: 1 !important;
                                    visibility: visible !important;
                                    display: block !important;
                                    z-index: 9999 !important;
                                `;
                                parent = parent.parentElement;
                                depth++;
                            }
                            
                            // 3. Ensure src properly set with thumbnail display parameters
                            try {
                                // Get current src, working around potential edge cases
                                let currentSrc = iframe.src || iframe.getAttribute('src') || '';
                                if (!currentSrc || (!currentSrc.startsWith('http:') && !currentSrc.startsWith('https:'))) {
                                    return; // Can't process empty or invalid URLs
                                }
                                
                                // Extract video ID - this is crucial for showing at least thumbnail
                                let url = new URL(currentSrc);
                                let videoId = '';
                                
                                // Handle different YouTube URL formats
                                if (url.searchParams.has('v')) {
                                    videoId = url.searchParams.get('v');
                                } else if (url.pathname.includes('/embed/')) {
                                    videoId = url.pathname.split('/embed/')[1].split(/[?#/]/)[0];
                                } else if (url.hostname.includes('youtu.be')) {
                                    videoId = url.pathname.substring(1).split(/[?#/]/)[0];
                                }
                                
                                if (videoId) {
                                    // Create optimal thumbnail-showing URL to ensure something visible appears
                                    // This is more reliable than trying to play the video
                                    let thumbnailShowingUrl = `https://www.youtube.com/embed/${videoId}?autoplay=0&controls=1&showinfo=1&rel=0&iv_load_policy=3&modestbranding=1`;
                                    
                                    // Only update if needed
                                    if (iframe.src !== thumbnailShowingUrl) {
                                        console.log("Setting thumbnail-optimized YouTube URL:", thumbnailShowingUrl);
                                        iframe.src = thumbnailShowingUrl;
                                    }
                                    
                                    // Also set a fallback background image using video ID just in case
                                    // This provides double insurance something will show up
                                    iframe.style.backgroundImage = `url(https://img.youtube.com/vi/${videoId}/0.jpg)`;
                                    iframe.style.backgroundSize = 'cover';
                                    iframe.style.backgroundPosition = 'center';
                                }
                                
                            } catch(e) {
                                console.error("Error updating YouTube iframe:", e);
                            }
                            
                            // 4. Add attributes for maximum compatibility
                            iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
                            iframe.allowFullscreen = true;
                        }
                    """, video_selector)
                    
                    # Wait a moment for changes to take effect
                    page.wait_for_timeout(500)
                    
                    # Try to access the iframe content if possible
                    try:
                        iframe_element_handle = page.query_selector(video_selector)
                        if iframe_element_handle:
                            # Force scroll to make sure the video is in view
                            iframe_element_handle.scroll_into_view_if_needed()
                            
                            # Try sending YouTube iframe API messages
                            page.evaluate("""
                                (selector) => {
                                    const iframe = document.querySelector(selector);
                                    if (iframe) {
                                        // Try multiple methods of getting video to show
                                        try {
                                            // Try PostMessage for YouTube iframe API
                                            iframe.contentWindow.postMessage('{"event":"command","func":"stopVideo","args":""}', '*');
                                            
                                            // Add a play button overlay if none exists
                                            const hasOverlay = iframe.nextElementSibling && 
                                                            (iframe.nextElementSibling.classList.contains('play-button-overlay') ||
                                                            iframe.nextElementSibling.classList.contains('youtube-overlay'));
                                            
                                            if (!hasOverlay) {
                                                // Create a visual play button overlay
                                                const overlay = document.createElement('div');
                                                overlay.classList.add('youtube-overlay');
                                                overlay.style.cssText = `
                                                    position: absolute;
                                                    top: 0;
                                                    left: 0;
                                                    width: 100%;
                                                    height: 100%;
                                                    display: flex;
                                                    align-items: center;
                                                    justify-content: center;
                                                    pointer-events: none;
                                                    z-index: 999999;
                                                `;
                                                
                                                const playButton = document.createElement('div');
                                                playButton.style.cssText = `
                                                    width: 68px;
                                                    height: 48px;
                                                    background-color: rgba(0,0,0,0.7);
                                                    border-radius: 14px;
                                                    display: flex;
                                                    align-items: center;
                                                    justify-content: center;
                                                `;
                                                
                                                // Create triangle play icon
                                                const triangle = document.createElement('div');
                                                triangle.style.cssText = `
                                                    width: 0;
                                                    height: 0;
                                                    border-style: solid;
                                                    border-width: 12px 0 12px 20px;
                                                    border-color: transparent transparent transparent #fff;
                                                    margin-left: 4px;
                                                `;
                                                
                                                playButton.appendChild(triangle);
                                                overlay.appendChild(playButton);
                                                
                                                // Position the overlay correctly
                                                const parent = iframe.parentElement;
                                                if (parent && parent.style.position !== 'absolute' && parent.style.position !== 'relative') {
                                                    parent.style.position = 'relative';
                                                }
                                                
                                                // Insert overlay after the iframe
                                                if (iframe.nextSibling) {
                                                    iframe.parentNode.insertBefore(overlay, iframe.nextSibling);
                                                } else {
                                                    iframe.parentNode.appendChild(overlay);
                                                }
                                            }
                                        } catch(e) {
                                            console.log("Error during YouTube enhancement:", e);
                                        }
                                    }
                                }
                            """, video_selector)
                    except Exception as e:
                        print(f"  Error with additional YouTube handling for {video_selector}: {e}")
                
                # Wait for rendering to complete
                print(f"Waiting {self.video_play_time}s after YouTube processing...")
                time.sleep(self.video_play_time)
        except Exception as e_main:
            print(f"General error in _force_youtube_video_visibility: {e_main}")