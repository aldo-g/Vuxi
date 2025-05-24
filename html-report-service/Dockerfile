FROM node:20-alpine

WORKDIR /app

# Install AWS CLI and other dependencies
RUN apk add --no-cache \
    aws-cli \
    curl \
    bash

# Install Node.js dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY src/ ./src/

# Add entrypoint and S3 scripts
COPY entrypoint.sh /entrypoint.sh
COPY s3-download.sh /app/s3-download.sh
COPY s3-upload.sh /app/s3-upload.sh
RUN chmod +x /entrypoint.sh /app/s3-download.sh /app/s3-upload.sh

# Set environment variables
ENV NODE_ENV=production
ENV ENVIRONMENT=aws

# Create data directories
RUN mkdir -p /app/data/analysis /app/data/screenshots/desktop /app/data/reports

# Use entrypoint for cleanup
ENTRYPOINT ["/entrypoint.sh"]

# Default command
CMD ["npm", "start"]