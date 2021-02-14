FROM node:15.8.0-buster

RUN rm /bin/sh && ln -s /bin/bash /bin/sh
RUN apt-get update -qq --fix-missing && \
    apt-get install -qq -y curl build-essential libssl-dev libgmp-dev \
                       libsodium-dev nlohmann-json3-dev git nasm

# Install rapidsnark
RUN git clone https://github.com/iden3/rapidsnark.git && \
    cd rapidsnark && \
    npm i && \
    git submodule init && \
    git submodule update && \
    npx task createFieldSources && \
    npx task buildProver

WORKDIR /kreme
COPY . /kreme/
RUN npm i && \
    npm run bootstrap && \
    npm run build
