# Project Kreme

Project Kreme by Torus Labs is a method of protecting the privacy of Torus
Wallet users. Currently, when a Torus Wallet user submits a JSON Web Token to
the Torus Network, Torus Nodes will check whether the JWT token is valid before
replying with the user's appropriate keyshares. This means that Torus Nodes
can link keyshares to personally identifying email addresses, which is a
potential privacy issue.

The solution is for users to prove to Torus Nodes, in zero knowledge, that

1. Given a publicly known SHA256 hash of a JWT, and a publicly known commitment
   to an email address, the user knows the JWT plaintext;
2. The JWT contains said email address in its payload's `email` field;

The Torus Nodes should not be able to find out the plaintext JWT or the email
address.

To prevent bruteforce attacks, the commitment to the email address should be a
salted hash of the email address. The salt should be unique to the user and
should be stored by either Torus or the user.

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
sudo apt install build-essential libgmp-dev libsodium-dev nlohmann-json3-dev nasm
```

You also need to download and build
[`rapidsnark`](https://github.com/iden3/rapidsnark):

```
git clone https://github.com/iden3/rapidsnark.git &&
cd rapidsnark &&
npm i &&
git submodule init &&
git submodule update &&
npx task createFieldSources &&
npx task buildProver
```

Take note of the location of the `rapidsnark/build/prover` binary.

## Quick start

First, clone this repository, install dependencies, and build the source code:

```bash
# TODO
git clone https://github.com/weijiekoh/kreme &&
cd kreme &&
npm i &&
npm run bootstrap &&
npm run build
```

### Configure circuits

The file `config.example.json` contains the definition of one `JwtProver`
circuit with one set of predefined parameters:

```
{
    "template": "../circuits/circom/jwtProver.circom",
    "component": "JwtProver",
    "params": [1024, 48],
    "zkeyUrls": {
        "test": "https://www.dropbox.com/s/tnom6l07bbw46ft/JwtProver-1024_48.zkey?dl=1"
    }
}
```

This `JwtProver(1024, 48)` circuit supports proofs on JWT tokens with length
between ______ and ______ **(TODO: calculate these values)** bytes, and an
email address of up to `___` bytes.

### Compile test circuits

```
npm run compile-example
```

### Download test `.zkey` files

Each `.zkey` file contain the proving and verification key for a particular
circuit. They should be produced by a multi-party trusted setup. For testing
purposes, we can download test files from a Dropbox folder:

```
node build/index.js downloadZkeys -o build/prodCircuits/ -t test -c compile_config.example.json
```

### Generate a proof

Note that in this example, the `-r` flag specifies the location of the
`rapidsnark` prover binary.

```
node build/index.js prove -j eyJhbGciOiJSUzI1NiIsImtpZCI6IjAzYjJkMjJjMmZlY2Y4NzNlZDE5ZTViOGNmNzA0YWZiN2UyZWQ0YmUiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiI4NzY3MzMxMDUxMTYtaTBoajNzNTNxaWlvNWs5NXBycGZtajBocDBnbWd0b3IuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI4NzY3MzMxMDUxMTYtaTBoajNzNTNxaWlvNWs5NXBycGZtajBocDBnbWd0b3IuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMDEyMTIxMjA2MTg2NTM3MzIzNTciLCJlbWFpbCI6InRyb25za3l0YWRwb2xlQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJhdF9oYXNoIjoiYWJRb0h1RVRKQTk3dGEyT3QxcU94ZyIsIm5vbmNlIjoiWFJlTlV6M25sT0I3Vnd2ekdrd2JVZkJQWnNOUTVCIiwibmFtZSI6IlRyb25za3kgVGFkcG9sZSIsInBpY3R1cmUiOiJodHRwczovL2xoNi5nb29nbGV1c2VyY29udGVudC5jb20vLW5sSTJ3S0hRZGZJL0FBQUFBQUFBQUFJL0FBQUFBQUFBQUFBL0FNWnV1Y21OUHZNeS1BMVNoajVGcHBfckhPTGlzcGY2Smcvczk2LWMvcGhvdG8uanBnIiwiZ2l2ZW5fbmFtZSI6IlRyb25za3kiLCJmYW1pbHlfbmFtZSI6IlRhZHBvbGUiLCJsb2NhbGUiOiJlbiIsImlhdCI6MTYxMjI1ODc5NCwiZXhwIjoxNjEyMjYyMzk0LCJqdGkiOiIyMGViZmI5MmQ5NjRjMzZlMmEyYjg0NGM0MjEzOTI0MzNkMmY3NzZhIn0.OxzE6cGRvlALxcRPyL7sUDELGJ9fxcTkkqamQDvxPKqakTyU1Kz6BY71cdXp7wB2HnDep9qOBTdb55BLoMZ6NzxVvs5cReVMlJi6j3hqJecnyWag9fG9wwdi2Y_boLFeNcPcn4ZCGHMwJnuHuZEuXIdQT7xTTydYpK3oLJ2JvLk8fIEJqlPlvvyJpftwsnjXAuVef4aVKNZQLar4miMBL7YT6eaUHZQudCf30-QaQsxLnhgZr7G6J-TPhxE1nMnxAC2lRyVUtGpWFyVwdx0-nw3_LUs2npm388vQHjQgQxDhg6E_uEYy-vr4cchkB1jyJ1EfU0bEtFytyQdU3t7YuQ -d gmail.com -r ~/rapidsnark/build/prover -c ./build/prodCircuits/ -o proof.json -p public.json -t test

```

### Verify a proof

First, generate the commitment to the email address you wish to verify for:

```bash
node build/index.js genEmailComm -e tronskytadpole@gmail.com -s 0 -l 48
```

In this case, the salt is `0` and the length is 48, which is a hardcoded
parameter to the circuit to generate the proof above. The commitment is:

```
29fe2bffec5df2bf054d01cad71a1a388a34906fba15ce8610961cc59271e63a
```

To verify the proof, run:

```bash
node build/index.js verify -j 79b7b9ac9a06284502bceb80d2b3ec0481f6ed1f14ddcb787a2cb84435b4c8f9 \
    -p /proofs/proof.json \
    -z /zkeys/JwtHiddenEmailAddressProver-1024_48.test.zkey \
    -e 0x29fe2bffec5df2bf054d01cad71a1a388a34906fba15ce8610961cc59271e63a
```

Note that `79b7b9ac9a06284502bceb80d2b3ec0481f6ed1f14ddcb787a2cb84435b4c8f9` is
the SHA256 hash of the JWT header and payload `eyJhbGci...`. You can use [this
online tool](https://emn178.github.io/online-tools/sha256.html) to generate such
hashes.

## Tests

To run tests in the `circuits` directory:

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

The following have been tested with `docker-compose` 1.28.2 and Docker 19.03.6.

First, clone this repository, install dependencies, and build the source code:

```bash
git clone https://github.com/weijiekoh/kreme &&
cd kreme &&
npm i &&
npm run bootstrap &&
npm run build
```

Next, compile the circuits:

```
cd cli &&
node build/index.js compile -c <CONFIG FILE> -o build/prodCircuits/ -nc
```

Note that `CONFIG_FILE` should follow the format of
`compile_config.example.json`.

Download the production `.zkey` file for each circuit and place them in
`build/prodCircuits`.

Build the container:

```bash
./scripts/buildImages.sh
```

In `kreme/`, run the container. This will create a container `kreme_kreme`
which sleeps indefinitely. This allows you to run `docker-compose exec` to
generate proofs with less startup overhead.

```
docker-compose up
```

To generate a proof, run:

```
docker-compose exec -w /kreme/cli/ kreme node build/index.js prove \
    -j <JWT HEADER AND PAYLOAD> \
    -e <EMAIL ADDDRESS> \
    -s <SALT> \
    -r /rapidsnark/build/prover \
    -t prod \
    -c /zkeys \
    -o /proofs/proof.json \
    -p /proofs/public.json
```

Note that the Docker container is configured to have bind-mount volumes at
`/zkeys` and `/proofs`. This allows the CLI to access the `.zkey` files on the
host machine and to write the `proof.json` and `public.json` files to the host
machine.

An example using a test `JwtHiddenEmailAddressProver-1024_48.test.zkey` file in
`cli/build/prodCircuits`:

```bash
docker-compose exec -w /kreme/cli/ kreme node build/index.js prove -j eyJhbGciOiJSUzI1NiIsImtpZCI6IjAzYjJkMjJjMmZlY2Y4NzNlZDE5ZTViOGNmNzA0YWZiN2UyZWQ0YmUiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiI4NzY3MzMxMDUxMTYtaTBoajNzNTNxaWlvNWs5NXBycGZtajBocDBnbWd0b3IuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI4NzY3MzMxMDUxMTYtaTBoajNzNTNxaWlvNWs5NXBycGZtajBocDBnbWd0b3IuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMDEyMTIxMjA2MTg2NTM3MzIzNTciLCJlbWFpbCI6InRyb25za3l0YWRwb2xlQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJhdF9oYXNoIjoiY3doLWp4Z0VmUWtuamlmczkwRUV6dyIsIm5vbmNlIjoiVDVzUWJyaUpTd3dIMUM0U2RQeEprTGJ1Mm9yNGs4IiwibmFtZSI6IlRyb25za3kgVGFkcG9sZSIsInBpY3R1cmUiOiJodHRwczovL2xoNi5nb29nbGV1c2VyY29udGVudC5jb20vLW5sSTJ3S0hRZGZJL0FBQUFBQUFBQUFJL0FBQUFBQUFBQUFBL0FNWnV1Y21OUHZNeS1BMVNoajVGcHBfckhPTGlzcGY2Smcvczk2LWMvcGhvdG8uanBnIiwiZ2l2ZW5fbmFtZSI6IlRyb25za3kiLCJmYW1pbHlfbmFtZSI6IlRhZHBvbGUiLCJsb2NhbGUiOiJlbiIsImlhdCI6MTYxMjI1ODU4MiwiZXhwIjoxNjEyMjYyMTgyLCJqdGkiOiIwNDEzODAzZWM5YzNiMDk4ZTgwNmFiM2VhNjBmZTM2OGJmZjRkNzJkIn0 -e tronskytadpole@gmail.com -s 0 -r /rapidsnark/build/prover -t test -c /zkeys -o /proofs/proof.json -p /proofs/public.json
```
