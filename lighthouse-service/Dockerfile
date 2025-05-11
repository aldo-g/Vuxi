FROM node:24-bullseye
# Install required dependencies for Lighthouse and Chromium
RUN apt-get update && \
    apt-get install -y \
    chromium \
    chromium-driver \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Node.js dependencies with optimizations
COPY package*.json ./

# Use npm cache and install with verbose output
RUN npm config set registry https://registry.npmjs.org/ && \
    npm install --verbose --no-audit --no-fund --maxsockets 1

# Copy source code
COPY src/ ./src/
COPY config/ ./config/

# Set environment variables for Chromium
ENV NODE_ENV=production
ENV CHROME_PATH=/usr/bin/chromium
ENV CHROME_BIN=/usr/bin/chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV DISPLAY=:99

# Default command
CMD ["npm", "start"]