FROM node:latest

WORKDIR /usr/src/app
COPY package.json .
RUN ["npm", "install"]
COPY . .

EXPOSE 443

CMD ["npm", "run", "dev"]
