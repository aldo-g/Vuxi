cat > s3-upload.sh << 'EOF'
#!/bin/bash
# s3-upload.sh - Uploads lighthouse reports to S3

# Check if environment is AWS
if [ "$ENVIRONMENT" = "aws" ]; then
  echo "🔄 Running in AWS environment, uploading to S3..."
  
  # Check if the directory exists
  if [ -d "$1" ]; then
    # Create directory structure in S3
    JOB_ID=${JOB_ID:-$(date +%Y%m%d%H%M%S)}
    S3_PATH="s3://${S3_BUCKET:-website-analyzer-data}/jobs/${JOB_ID}/lighthouse/"
    
    # Upload reports to S3
    echo "📤 Uploading reports from $1 to $S3_PATH"
    aws s3 cp "$1/reports" "${S3_PATH}reports" --recursive
    aws s3 cp "$1/trimmed" "${S3_PATH}trimmed" --recursive
    
    # Upload metadata if it exists
    if [ -f "$1/lighthouse-summary.json" ]; then
      echo "📤 Uploading lighthouse-summary.json to $S3_PATH"
      aws s3 cp "$1/lighthouse-summary.json" "${S3_PATH}lighthouse-summary.json"
    fi
    
    # Check if upload was successful
    if [ $? -eq 0 ]; then
      echo "✅ Successfully uploaded to S3"
    else
      echo "❌ Failed to upload to S3"
      exit 1
    fi
  else
    echo "❌ Directory $1 does not exist"
    exit 1
  fi
else
  echo "🖥️ Running in local environment, skipping S3 upload"
fi
EOF

chmod +x s3-upload.sh