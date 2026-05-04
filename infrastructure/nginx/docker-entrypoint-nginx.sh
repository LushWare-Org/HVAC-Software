#!/bin/sh
# Substitute all ${VAR} placeholders in the nginx config template with
# actual environment variable values, then start nginx.
envsubst '${CRM_SERVICE_URL} ${JOBS_SERVICE_URL} ${SCHEDULING_SERVICE_URL} ${FINANCE_SERVICE_URL} ${COMMS_SERVICE_URL} ${ANALYTICS_SERVICE_URL} ${INVENTORY_SERVICE_URL} ${CHURN_SERVICE_URL} ${AGENT_SERVICE_URL}' \
  < /etc/nginx/nginx.conf.template \
  > /etc/nginx/nginx.conf

nginx -g 'daemon off;'
