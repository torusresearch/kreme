# Docker setup

The following have been tested with `docker-compose` 1.28.2 and Docker 19.03.6.

After performing a [multi-party trusted setup](./circuitsetup.html), place the
final `.zkey` files in `build/prodCircuits`.

Build the Docker container:

```bash
./scripts/buildImages.sh
```

In `kreme/`, run the container. This will create a container `kreme_kreme`
which sleeps indefinitely. This allows you to run `docker-compose exec` to
generate proofs with slightly less startup overhead. (Alternatively, use
`docker-compose run`.)

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

To verify the proof in the container:

```bash
docker-compose exec -w /kreme/cli/ kreme node build/index.js verify \
    -j 79b7b9ac9a06284502bceb80d2b3ec0481f6ed1f14ddcb787a2cb84435b4c8f9 \
    -p /proofs/proof.json \
    -z /zkeys/JwtHiddenEmailAddressProver-1024_48.test.zkey \
    -e 0x1fc5f1ed6f4cef708c2301f56df91d84ae25b531319cd4b7d9d8a760fc983041
```
