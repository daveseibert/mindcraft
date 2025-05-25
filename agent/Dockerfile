FROM node:22

WORKDIR /app

RUN apt-get update && apt-get install -y \
    git \
    unzip \
    wget \
    apt-transport-https \
    gnupg \
    lsb-release \
    && rm -rf /var/lib/apt/lists/*

RUN wget -O - https://packages.adoptium.net/artifactory/api/gpg/key/public | apt-key add - \
    && echo "deb https://packages.adoptium.net/artifactory/deb $(lsb_release -cs) main" > /etc/apt/sources.list.d/adoptium.list \
    && apt-get update && apt-get install -y \
    temurin-21-jdk \
    && rm -rf /var/lib/apt/lists/*

RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" \
    && unzip awscliv2.zip \
    && ./aws/install

COPY patches/ ./patches/

RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=cache,target=/root/.npm \
    npm install \
    && npx patch-package


COPY bots/ ./bots/
COPY profiles/ ./profiles/
COPY src/ ./src/
COPY settings.js .
COPY viewer.html .
COPY main.js .
COPY eslint.config.js .


EXPOSE 8000

CMD ["node", "main.js"]
