#!/bin/bash
# Script to generate Nginx configuration from template using environment variables

set -e

# Check if .env.deploy exists
if [ ! -f "/opt/interclub/app/backend/.env.deploy" ]; then
    echo "Error: /opt/interclub/app/backend/.env.deploy not found"
    echo "Please copy .env.deploy.example to .env.deploy and configure it"
    exit 1
fi

# Load environment variables from .env.deploy
set -a
source /opt/interclub/app/backend/.env.deploy
set +a

# Check required variables
if [ -z "$DOMAIN" ] || [ -z "$BACKEND_HOST" ] || [ -z "$BACKEND_PORT" ]; then
    echo "Error: Required environment variables not set"
    echo "Please check DOMAIN, BACKEND_HOST, and BACKEND_PORT in .env.deploy"
    exit 1
fi

# Generate nginx configuration from template
echo "Generating Nginx configuration..."
envsubst '${DOMAIN} ${DOMAIN_WWW} ${BACKEND_HOST} ${BACKEND_PORT} ${SSL_CERT_PATH} ${SSL_KEY_PATH}' \
    < /opt/interclub/app/deployment/nginx.conf.template \
    > /opt/interclub/app/deployment/nginx.conf

echo "Nginx configuration generated at: /opt/interclub/app/deployment/nginx.conf"
echo ""
echo "To install it, run:"
echo "  sudo cp /opt/interclub/app/deployment/nginx.conf /etc/nginx/sites-available/interclub"
echo "  sudo ln -sf /etc/nginx/sites-available/interclub /etc/nginx/sites-enabled/interclub"
echo "  sudo nginx -t && sudo systemctl reload nginx"
