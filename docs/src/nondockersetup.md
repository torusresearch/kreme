# Non-Docker setup

You need the following, preferably on an Ubuntu Linux machine:

- NodeJS (preferably v11 or above)
- `gcc`, `g++`, `libgmp-dev`, `nlohmann-json3-dev`, and `libsodium-dev`:
- `git`

```bash
sudo apt install build-essential libgmp-dev libsodium-dev nlohmann-json3-dev nasm
```

You also need to download and build
[`rapidsnark`](https://github.com/iden3/rapidsnark):

```
git clone https://github.com/iden3/rapidsnark.git &&
cd rapidsnark &&
git checkout 1c13721de4a316b0b254c310ccec9341f5e2208e && \
npm i &&
git submodule init &&
git submodule update &&
npx task createFieldSources &&
npx task buildProver
```

Take note of the location of the `rapidsnark/build/prover` binary.

Next, clone this repository, install dependencies, and build the source code:

```bash
git clone https://github.com/weijiekoh/kreme &&
cd kreme &&
npm i &&
npm run bootstrap &&
npm run build
```
