FROM mcr.microsoft.com/playwright:v1.52.0-jammy

WORKDIR /app

# Install Node.js dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY src/ ./src/

# Create output directory
RUN mkdir -p /app/output/screenshots

# Set environment variables
ENV NODE_ENV=production
ENV OUTPUT_DIR=/app/output

# Default command
CMD ["npm", "start"]