FROM node:22 AS node-base

WORKDIR /app

FROM node-base AS mindserver

COPY mindserver/package.json .
COPY mindserver/mind_server.js .
COPY mindserver/public/ ./public/
COPY mindserver/entrypoint.js .

RUN npm install

EXPOSE 8080

CMD ["npm", "start"]

FROM node-base AS agent

WORKDIR /mindcraft


RUN apt-get update && apt-get install -y \
    git \
    unzip \
    wget \
    apt-transport-https \
    gnupg \
    lsb-release \
    #    python3 \
#    python3-pip \
#    python3-boto3 \
#    python3-tqdm \
#    python3-tmux \
    && rm -rf /var/lib/apt/lists/*

# Add Adoptium repository key and repository
# Add Adoptium repository
RUN wget -O - https://packages.adoptium.net/artifactory/api/gpg/key/public | apt-key add - \
    && echo "deb https://packages.adoptium.net/artifactory/deb $(lsb_release -cs) main" > /etc/apt/sources.list.d/adoptium.list \
    && apt-get update && apt-get install -y \
    temurin-21-jdk \
    && rm -rf /var/lib/apt/lists/*

# Copy the rest of the application code to the working directory
# RUN apt update
# RUN apt install bash ca-certificates wget git -y # install first to avoid openjdk install bug
# RUN apt install openjdk-17-jre-headless -y
#RUN apt install -y wget apt-transport-https gnupg lsb-release


# Update package lists
# RUN apt update

# Install Temurin (Adoptium) Java 21
# RUN apt install temurin-21-jdk -y

# Install unzip


RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" \
    && unzip awscliv2.zip \
    && ./aws/install

#COPY package.json .
#RUN npm install --omit=dev
COPY patches/ ./patches/

RUN --mount=type=bind,source=package.json,target=package.json \
#    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm install \
    && npx patch-package


#RUN --mount=type=bind,source=requirements.txt,target=/tmp/requirements.txt \
#    pip install --break-system-packages --no-cache-dir --requirement /tmp/requirements.txt


COPY bots/ ./bots/
COPY profiles/ ./profiles/
COPY src/ ./src/
COPY settings.js .
COPY viewer.html .
COPY main.js .
COPY eslint.config.js .


EXPOSE 8000

CMD ["node", "main.js"]

FROM itzg/minecraft-server:latest AS world-base

ENV TZ="America/New_York"
ENV EULA="TRUE"
ENV VERSION="1.20.4"
ENV SEED="993690229419782480"
ENV MAX_PLAYERS="20"
ENV ONLINE_MODE="false"
ENV USE_AIKAR_FLAGS="true"
ENV SERVER_PORT=25565
ENV FORCE_GAME_MODE="false"

EXPOSE 25565

FROM world-base AS world-flat

ENV MODE="1"
ENV DIFFICULTY="1"
ENV LEVEL="flat world"
ENV LEVEL_TYPE="flat"
ENV ALLOW_FLIGHT="true"
ENV ENABLE_COMMAND_BLOCK="true"
ENV SPAWN_ANIMALS="false"
ENV SPAWN_MONSTERS="false"
ENV SPAWN_NPCS="true"

FROM world-base AS world-easy

ENV MODE="0"
ENV DIFFICULTY="1"
ENV LEVEL="easy world"
ENV SPAWN_ANIMALS="true"
ENV SPAWN_MONSTERS="false"
ENV SPAWN_NPCS="true"

FROM python:3.12-slim AS python-base

ENV TZ=America/New_York
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /app

RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

RUN curl https://install.duckdb.org | sh
RUN export PATH='/root/.duckdb/cli/latest':$PATH

RUN --mount=type=bind,source=requirements.txt,target=/tmp/requirements.txt \
    pip install --break-system-packages --no-cache-dir --requirement /tmp/requirements.txt

FROM python-base AS fastapi

RUN mkdir -p data

COPY fastapi/main.py .

EXPOSE 80

HEALTHCHECK --timeout=5s --retries=5 --interval=5m \
    CMD curl --fail http://localhost:80/health || exit 1

CMD ["fastapi", "run", "main.py", "--port", "80"]
