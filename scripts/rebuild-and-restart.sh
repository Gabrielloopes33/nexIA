#!/bin/bash
# Rebuild and restart the application

echo "========================================"
echo "🔧 Rebuild NexIA Chat"
echo "========================================"

cd /var/www/nexIA

echo "📦 Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "🔄 Restarting PM2..."
pm2 restart nexiachat

echo "✅ Done!"
echo "📋 Checking status..."
pm2 status
