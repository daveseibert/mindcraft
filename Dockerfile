FROM node:18 AS agent
# Specify a base image
# Specify a base image
# FROM ubuntu:22.04
# FROM ubuntu:22.04

#Install some dependencies

RUN apt-get -y update
RUN apt-get -y install git
RUN apt-get -y install unzip
RUN apt-get -y install python3
RUN apt-get -y install python3-pip
RUN apt-get -y install python3-boto3
RUN apt-get -y install python3-tqdm
RUN apt-get -y install tmux

# RUN git clone https://github.com/kolbytn/mindcraft.git /mindcraft
WORKDIR /mindcraft
# COPY ./server_data.zip /mindcraft
# RUN #unzip server_data.zip


# Copy the rest of the application code to the working directory
# RUN apt update
# RUN apt install bash ca-certificates wget git -y # install first to avoid openjdk install bug
# RUN apt install openjdk-17-jre-headless -y
RUN apt install -y wget apt-transport-https gnupg lsb-release

# Add Adoptium repository key
RUN wget -O - https://packages.adoptium.net/artifactory/api/gpg/key/public | apt-key add -

# Add Adoptium repository
RUN echo "deb https://packages.adoptium.net/artifactory/deb $(lsb_release -cs) main" > /etc/apt/sources.list.d/adoptium.list

# Update package lists
RUN apt update

# Install Temurin (Adoptium) Java 21
RUN apt install temurin-21-jdk -y

# Install unzip


RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
RUN unzip awscliv2.zip
RUN ./aws/install

COPY package.json .
RUN npm install
RUN --mount=type=bind,source=requirements.txt,target=/tmp/requirements.txt \
    pip install --break-system-packages --no-cache-dir --requirement /tmp/requirements.txt

COPY bots/ ./bots/
COPY patches/ ./patches/
COPY profiles/ ./profiles/
COPY services/ ./services/
COPY src/ ./src/
COPY tasks/ ./tasks/
COPY andy.json .
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
ENV MAX_PLAYERS="4"
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
