FROM node:20-alpine

WORKDIR /app

# Install Node.js dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY src/ ./src/

# Set environment variables
ENV NODE_ENV=production

# Default command
CMD ["npm", "start"]