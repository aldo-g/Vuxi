FROM mcr.microsoft.com/playwright:v1.52.0-jammy

WORKDIR /app

# Install Node.js dependencies
COPY package*.json ./
RUN npm install

# Install AWS CLI and jq for JSON processing
RUN apt-get update && \
    apt-get install -y \
    curl \
    unzip \
    python3 \
    python3-pip \
    jq && \
    pip3 install awscli && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy source code
COPY src/ ./src/

# Add scripts
COPY entrypoint.sh /entrypoint.sh
COPY s3-download.sh /app/s3-download.sh
COPY s3-upload.sh /app/s3-upload.sh
RUN chmod +x /entrypoint.sh /app/s3-download.sh /app/s3-upload.sh

# Create output directory
RUN mkdir -p /app/data/screenshots/desktop

# Set environment variables
ENV NODE_ENV=production
ENV ENVIRONMENT=aws

# Use entrypoint for cleanup
ENTRYPOINT ["/entrypoint.sh"]

# Default command
CMD ["npm", "start"]