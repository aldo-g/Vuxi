# Add this to your Dockerfile in url-discovery-service
FROM mcr.microsoft.com/playwright:v1.52.0-jammy

WORKDIR /app

# Install Node.js dependencies
COPY package*.json ./
RUN npm install

# Install AWS CLI
RUN apt-get update && \
    apt-get install -y \
    curl \
    unzip \
    python3 \
    python3-pip && \
    pip3 install awscli && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy source code
COPY src/ ./src/

# Add entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Add S3 upload script
COPY s3-upload.sh /app/s3-upload.sh
RUN chmod +x /app/s3-upload.sh

# Set environment variables
ENV NODE_ENV=production
ENV ENVIRONMENT=aws

# Use entrypoint for cleanup
ENTRYPOINT ["/entrypoint.sh"]

# Default command
CMD ["npm", "start"]