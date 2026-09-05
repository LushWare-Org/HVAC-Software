#!/bin/bash
set -e

REGISTRY="us-central1-docker.pkg.dev/${GCP_PROJECT:-hvactor}/tscrm-images"
REGION="us-central1"

CHAT_URL=$(gcloud run services describe chat-service --region=$REGION --format="value(status.url)")
echo "Chat service URL: $CHAT_URL"

echo "Building nginx-gateway image..."
docker build --platform linux/amd64 \
  -f infrastructure/nginx/Dockerfile \
  -t $REGISTRY/nginx-gateway:latest \
  ./infrastructure/nginx
docker push $REGISTRY/nginx-gateway:latest
echo "✅ nginx-gateway image pushed"

echo "Adding CHAT_SERVICE_URL to gateway..."
gcloud run services update nginx-gateway \
  --region=$REGION \
  --update-env-vars="CHAT_SERVICE_URL=${CHAT_URL}"

echo "Redeploying nginx-gateway with new image..."
gcloud run deploy nginx-gateway \
  --image=$REGISTRY/nginx-gateway:latest \
  --region=$REGION \
  --allow-unauthenticated \
  --port=8080 \
  --memory=256Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=5

GATEWAY=$(gcloud run services describe nginx-gateway --region=$REGION --format="value(status.url)")
echo "✅ nginx-gateway redeployed: $GATEWAY"

echo ""
echo "Running health checks..."
curl -s $GATEWAY/health
echo ""
for SVC in crm jobs finance comms analytics inventory; do
  echo -n "$SVC: "
  curl -s --max-time 5 "$GATEWAY/api/$SVC/health" | head -c 80
  echo ""
done
echo -n "chat: "
curl -s --max-time 5 "$GATEWAY/api/chat/health" | head -c 80
echo ""
