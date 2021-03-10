FROM node:15.8.0-buster

RUN rm /bin/sh && ln -s /bin/bash /bin/sh
RUN apt-get update -qq --fix-missing && \
    apt-get install -qq -y curl build-essential libssl-dev libgmp-dev \
                       libsodium-dev nlohmann-json3-dev git nasm

# Install rapidsnark
RUN git clone https://github.com/iden3/rapidsnark.git && \
    cd rapidsnark && \
    git checkout 1c13721de4a316b0b254c310ccec9341f5e2208e && \
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

CMD exec /bin/bash -c "trap : TERM INT; sleep infinity & wait"
