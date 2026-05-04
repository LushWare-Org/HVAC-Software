FROM nginx:1.25-alpine

# Install envsubst for environment variable substitution at startup
RUN apk add --no-cache gettext

COPY nginx.cloud.conf /etc/nginx/nginx.conf.template
COPY docker-entrypoint-nginx.sh /docker-entrypoint-nginx.sh
RUN chmod +x /docker-entrypoint-nginx.sh

EXPOSE 8080

ENTRYPOINT ["/docker-entrypoint-nginx.sh"]
