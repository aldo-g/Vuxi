# lighthouse-service/s3-download.sh
#!/bin/bash
# s3-download.sh - Downloads URL list from S3

# Check if environment is AWS
if [ "$ENVIRONMENT" = "aws" ]; then
  echo "🔄 Running in AWS environment, downloading from S3..."
  
  # Create directories
  mkdir -p /app/data
  
  # Get job ID from environment variable or find the most recent one
  if [ -z "$JOB_ID" ]; then
    echo "🔍 No JOB_ID provided, looking for the most recent job..."
    
    # Get the most recent job based on the last modified time of urls.json files
    LATEST_JOB=$(aws s3 ls s3://${S3_BUCKET:-website-analyzer-data}/jobs/ --recursive | grep "urls.json" | sort -k1,2 | tail -n1 | awk '{print $4}' | cut -d'/' -f2)
    
    if [ -z "$LATEST_JOB" ]; then
      echo "❌ No jobs found with URLs"
      exit 1
    fi
    
    JOB_ID="$LATEST_JOB"
    echo "📋 Found latest job: $JOB_ID"
  else
    echo "📋 Using provided JOB_ID: $JOB_ID"
  fi
  
  # S3 path for URLs
  S3_URLS_PATH="s3://${S3_BUCKET:-website-analyzer-data}/jobs/${JOB_ID}/urls/urls_simple.json"
  
  # Download the URL list
  echo "📥 Downloading URLs from $S3_URLS_PATH"
  if aws s3 cp "$S3_URLS_PATH" /app/data/urls_simple.json; then
    echo "✅ Successfully downloaded URLs"
    echo "📋 Downloaded $(cat /app/data/urls_simple.json | wc -l) URLs"
  else
    echo "❌ Failed to download URLs, checking for urls.json instead"
    
    # Try downloading the full URL file instead
    S3_URLS_FULL_PATH="s3://${S3_BUCKET:-website-analyzer-data}/jobs/${JOB_ID}/urls/urls.json"
    if aws s3 cp "$S3_URLS_FULL_PATH" /app/data/urls.json; then
      echo "✅ Downloaded full URLs file, extracting simple list"
      # Extract the URL array using jq if available
      if command -v jq >/dev/null 2>&1; then
        cat /app/data/urls.json | jq -r '.urls[]' > /app/data/urls_simple.json
      else
        # Fallback without jq
        grep -o '"https://[^"]*"' /app/data/urls.json | sed 's/"//g' > /app/data/urls_simple.json
      fi
      echo "📋 Extracted $(cat /app/data/urls_simple.json | wc -l) URLs"
    else
      echo "❌ Failed to download URLs"
      exit 1
    fi
  fi
else
  echo "🖥️ Running in local environment, skipping S3 download"
fi