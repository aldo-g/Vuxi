const URLDiscoveryService = require('./url-discovery');
const ScreenshotService = require('./screenshot');

async function capture(baseUrl) {
  console.log('Inspecting URLDiscoveryService:', URLDiscoveryService);
  const discoveredUrls = await URLDiscoveryService.discover(baseUrl);
  const screenshots = await ScreenshotService.capture(discoveredUrls);
  return {
    urls: discoveredUrls,
    screenshots: screenshots
  };
}

module.exports = { capture };