FROM nginx:latest

COPY nginx.conf /etc/nginx/nginx.conf
COPY cert/nginx.crt /etc/nginx/nginx.crt
COPY cert/nginx.key /etc/nginx/nginx.key
COPY cert/dhparam.pem /etc/nginx/ssl/dhparam.pem

EXPOSE 80
EXPOSE 443