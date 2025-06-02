FROM node:22

WORKDIR /app

COPY package.json .

RUN npm install

COPY src/server.js .
COPY src/public/ ./public/
COPY src/entrypoint.js .


EXPOSE 8080

CMD ["node", "entrypoint.js"]
