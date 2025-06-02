FROM node:22

WORKDIR /app

COPY package.json .
COPY mind_server.js .
COPY public/ ./public/
COPY entrypoint.js .

RUN npm install

EXPOSE 8080

CMD ["npm", "start"]
