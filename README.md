# Project Kreme

Project Kreme by Torus Labs is a means by which Torus Wallet users may prove to
any verifier, such as a Torus Node, that they own a valid JSON Web Token (JWT),
whose `email` field contains a particular domain name, **without revealing the
plaintext of the JWT**.

## System overview

The system consists of the following components:

- **A proving server** which generates Groth16 zk-SNARK proofs on behalf of
  users. While it would be ideal if users generate these proofs themselves, the
  computational resources required would make this unwieldy, especially for
  those who use mobile devices. Nevertheless, only the proving server
  controlled by Torus — not Torus Nodes — will be able to view the plaintext
  JWTs.

- **A verifer** which allow any Torus Node to verify a proof.

- **A Javascript library** which allows the Torus web wallet to generate the
  necessary inputs for the proving server.

## Requirements

You need the following, preferably on a Linux machine:

- NodeJS (preferably v11 or above)
- `gcc`, `g++`, `libgmp-dev`, `nlohmann-json3-dev`, and `libsodium-dev`:

```bash
sudo apt install build-essential libgmp-dev libsodium-dev nlohmann-json3-dev
```

## Quick start

First, clone this repository, install dependencies, and build the source code:

```bash
# TODO
git clone ..... &&
cd kreme &&
npm i &&
npm run bootstrap &&
npm run build
```

Run tests in the `circuits` directory. To do so, first run:

```bash
cd circuits &&
npm run circom-helper
```

Once `circom-helper` says that it has launched a JSON-RPC server, run the
following in another terminal:

```
cd circuits &&
npm run test
```

## Production deployment
