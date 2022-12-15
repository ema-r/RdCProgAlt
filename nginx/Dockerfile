FROM nginx:latest

COPY nginx.conf /etc/nginx/nginx.conf
COPY cert/nginx-selfsigned.crt /etc/nginx/nginx-selfsigned.crt
COPY cert/nginx-selfsigned.key /etc/nginx/nginx-selfsigned.key

EXPOSE 80
EXPOSE 443
