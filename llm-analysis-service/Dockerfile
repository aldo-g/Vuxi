FROM node:20-alpine

WORKDIR /app

# Install Python and AWS CLI for S3 operations
RUN apk add --no-cache \
    python3 \
    py3-pip \
    curl \
    bash \
    && python3 -m venv /opt/venv \
    && /opt/venv/bin/pip install awscli \
    && ln -sf /opt/venv/bin/aws /usr/local/bin/aws

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
RUN mkdir -p /app/data/screenshots/desktop /app/data/lighthouse/trimmed /app/data/analysis

# Use entrypoint for cleanup
ENTRYPOINT ["/entrypoint.sh"]

# Default command
CMD ["npm", "start"]