FROM mcr.microsoft.com/playwright:v1.52.0-jammy

WORKDIR /app

# Install Node.js dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY src/ ./src/

# Add entrypoint script for cleanup
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Create output directory
RUN mkdir -p /app/output/screenshots

# Set environment variables
ENV NODE_ENV=production
ENV OUTPUT_DIR=/app/output

# Use entrypoint for cleanup
ENTRYPOINT ["/entrypoint.sh"]

# Default command
CMD ["npm", "start"]