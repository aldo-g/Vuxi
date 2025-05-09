shot-scraper https://www.scienceofpeople.com/social-hobbies/ -o screenshot.png \
  --wait-for "document.readyState === 'complete'" \
  --javascript "
    new Promise(takeShot => {
      // Function to extract YouTube video ID
      const getYouTubeVideoId = (url) => {
        if (!url) return null;
        
        try {
          if (url.includes('youtu.be/')) {
            const match = url.match(/youtu\\.be\\/([^\\/?&]+)/);
            if (match && match[1]) return match[1];
          }
          
          if (url.includes('youtube.com/embed/')) {
            const match = url.match(/youtube\\.com\\/embed\\/([^\\/?&]+)/);
            if (match && match[1]) return match[1];
          }
          
          if (url.includes('youtube.com/v/')) {
            const match = url.match(/youtube\\.com\\/v\\/([^\\/?&]+)/);
            if (match && match[1]) return match[1];
          }
          
          const match = url.match(/[?&]v=([^&#]+)/);
          if (match && match[1]) return match[1];
        } catch (e) {
          console.error('Error extracting YouTube ID:', e);
        }
        
        return null;
      };
      
      // Replace YouTube iframes with clean thumbnails
      const replaceWithCleanThumbnails = () => {
        document.querySelectorAll('iframe').forEach((iframe, index) => {
          try {
            const src = iframe.src || '';
            if (!src.includes('youtube') && !src.includes('youtu.be')) {
              return; // Not a YouTube iframe
            }
            
            console.log('Processing YouTube iframe #' + index + ':', iframe.src);
            
            // Get dimensions
            const width = iframe.width || iframe.clientWidth || 480;
            const height = iframe.height || iframe.clientHeight || 270;
            
            // Extract video ID
            const videoId = getYouTubeVideoId(iframe.src);
            
            if (!videoId) {
              console.log('Could not extract video ID from:', iframe.src);
              return;
            }
            
            console.log('Found YouTube video ID:', videoId);
            
            // Create wrapper div (to preserve sizing)
            const wrapper = document.createElement('div');
            wrapper.style.width = width + 'px';
            wrapper.style.height = height + 'px';
            wrapper.style.position = 'relative';
            wrapper.style.backgroundColor = '#000';
            wrapper.style.overflow = 'hidden';
            
            // Create image element with maximum quality thumbnail
            const img = document.createElement('img');
            
            // Handle fallbacks for different thumbnail qualities
            img.onerror = function() {
              if (this.src.includes('maxresdefault')) {
                this.src = 'https://img.youtube.com/vi/' + videoId + '/sddefault.jpg';
              } else if (this.src.includes('sddefault')) {
                this.src = 'https://img.youtube.com/vi/' + videoId + '/hqdefault.jpg';
              } else if (this.src.includes('hqdefault')) {
                this.src = 'https://img.youtube.com/vi/' + videoId + '/mqdefault.jpg';
              } else if (this.src.includes('mqdefault')) {
                this.src = 'https://img.youtube.com/vi/' + videoId + '/default.jpg';
              }
            };
            
            // Start with highest quality and let onerror handle fallbacks
            img.src = 'https://img.youtube.com/vi/' + videoId + '/maxresdefault.jpg';
            img.alt = 'Video Thumbnail';
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            wrapper.appendChild(img);
            
            // FIXED: Correctly replace the iframe with our wrapper
            if (iframe.parentNode) {
              console.log('Replacing YouTube iframe with clean thumbnail');
              iframe.parentNode.replaceChild(wrapper, iframe);
            }
          } catch (e) {
            console.error('Error replacing YouTube iframe:', e);
          }
        });
      };
      
      // Scroll through the page to trigger lazy loading
      const triggerLazyLoading = async () => {
        const maxScroll = Math.max(
          document.body.scrollHeight, 
          document.documentElement.scrollHeight
        );
        
        let currentScroll = 0;
        const step = window.innerHeight / 2;
        
        while (currentScroll <= maxScroll) {
          window.scrollTo(0, currentScroll);
          await new Promise(r => setTimeout(r, 100));
          currentScroll += step;
        }
        
        window.scrollTo(0, 0);
        await new Promise(r => setTimeout(r, 500));
      };
      
      // Function to remove YouTube branding and play buttons
      const cleanupYouTubeElements = () => {
        // Remove any play button overlays that might exist on the page
        document.querySelectorAll('.ytp-large-play-button, [class*=\"play-button\"], [class*=\"ytp-\"]').forEach(el => {
          if (el && el.parentNode) {
            el.style.display = 'none';
            try {
              el.parentNode.removeChild(el);
            } catch (e) {}
          }
        });
        
        // Also look for YouTube text elements
        document.querySelectorAll('*').forEach(el => {
          if (el.textContent && el.textContent.trim() === 'YouTube' && 
              el.childNodes.length <= 3 && 
              el.getBoundingClientRect().width < 100) {
            el.style.display = 'none';
          }
        });
      };
      
      // Main execution
      const main = async () => {
        console.log('Starting YouTube thumbnail replacement process (clean version)');
        
        // Scroll to trigger lazy loading
        await triggerLazyLoading();
        
        // Wait a moment to ensure all content has loaded
        await new Promise(r => setTimeout(r, 1000));
        
        // Replace YouTube iframes with clean thumbnails
        replaceWithCleanThumbnails();
        
        // Wait for images to load 
        await new Promise(r => setTimeout(r, 2500));
        
        // Clean up any YouTube branding that might still be visible
        cleanupYouTubeElements();
        
        // Take screenshot
        console.log('Taking screenshot with clean YouTube thumbnails');
        takeShot();
      };
      
      // Start the process
      main();
    });
  " \
  --log-console