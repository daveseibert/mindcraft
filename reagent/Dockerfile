FROM oven/bun:1

WORKDIR /app

COPY package.json .
RUN bun install

COPY ./src ./src/

EXPOSE 3004
#EXPOSE 3040

CMD ["bun", "run", "src/index.ts"]
