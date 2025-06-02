FROM ubuntu AS ubuntu-base

WORKDIR /mindcraft

RUN apt-get update && apt-get install -y \
    git \
    curl \
    tmux \
    wget \
    bash \
    unzip \
    ca-certificates \
    gnupg \
    lsb-release \
    apt-transport-https \
    && rm -rf /var/lib/apt/lists/*

RUN wget -O - https://packages.adoptium.net/artifactory/api/gpg/key/public | apt-key add - \
    && echo "deb https://packages.adoptium.net/artifactory/deb $(lsb_release -cs) main" > /etc/apt/sources.list.d/adoptium.list \
    && apt-get update && apt-get install -y \
    temurin-21-jdk \
    && rm -rf /var/lib/apt/lists/*

RUN apt-get update && apt-get install -y \
    openjdk-17-jre-headless \
    && rm -rf /var/lib/apt/lists/*

RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" \
    && unzip awscliv2.zip \
    && ./aws/install

FROM node:22 AS node-base

WORKDIR /mindcraft

RUN apt-get update && apt-get install -y \
    git \
    curl \
    tmux \
    wget \
    bash \
    unzip \
    ca-certificates \
    gnupg \
    lsb-release \
    apt-transport-https \
    && rm -rf /var/lib/apt/lists/*

RUN wget -O - https://packages.adoptium.net/artifactory/api/gpg/key/public | apt-key add - \
    && echo "deb https://packages.adoptium.net/artifactory/deb $(lsb_release -cs) main" > /etc/apt/sources.list.d/adoptium.list \
    && apt-get update && apt-get install -y \
    temurin-21-jdk \
    && rm -rf /var/lib/apt/lists/*

RUN apt-get update && apt-get install -y \
    openjdk-17-jre-headless \
    && rm -rf /var/lib/apt/lists/*

RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" \
    && unzip awscliv2.zip \
    && ./aws/install

FROM node-base AS node-python-base

RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/* \
    && ln -sf python3 /usr/bin/python \
    && ln -sf pip3 /usr/bin/pip

#RUN apt-get update && apt-get install -y \
#    nodejs \
#    npm \
#    && rm -rf /var/lib/apt/lists/*

#RUN apt-get update && apt-get install -y \
#    build-essential \
#    libxi-dev \
#    libglu1-mesa-dev \
#    libglew-dev \
#    pkg-config \
#    && rm -rf /var/lib/apt/lists/*

FROM node-python-base

RUN --mount=type=bind,source=requirements.txt,target=/tmp/requirements.txt \
    pip install --break-system-packages --no-cache-dir --requirement /tmp/requirements.txt

COPY patches/ ./patches/

RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=cache,target=/root/.npm \
    npm install

COPY ./server_data.zip /mindcraft
RUN unzip server_data.zip

COPY bots/ ./bots/
COPY patches/ ./patches/
COPY profiles/ ./profiles/
COPY services/ ./services/
COPY src/ ./src/
COPY tasks/ ./tasks/
COPY andy.json .
COPY main.js .
COPY settings.js .
COPY viewer.html .
COPY package.json .

EXPOSE 8000

