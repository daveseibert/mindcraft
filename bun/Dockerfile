FROM oven/bun:1

WORKDIR /app

COPY package.json .
RUN bun install

COPY ./src ./src/

EXPOSE 3003
EXPOSE 3030

CMD ["bun", "run", "src/index.ts"]
