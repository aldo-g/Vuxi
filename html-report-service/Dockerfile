FROM node:20-alpine

WORKDIR /app

# Install Node.js dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY src/ ./src/

# Add entrypoint script for cleanup
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Set environment variables
ENV NODE_ENV=production

# Use entrypoint for cleanup
ENTRYPOINT ["/entrypoint.sh"]

# Default command
CMD ["npm", "start"]