# Usage

## Generate a proof

Note that in this example, the `-r` flag specifies the location of the
`rapidsnark` prover binary.

```
node build/index.js prove -j eyJhbGciOiJSUzI1NiIsImtpZCI6IjAzYjJkMjJjMmZlY2Y4NzNlZDE5ZTViOGNmNzA0YWZiN2UyZWQ0YmUiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiI4NzY3MzMxMDUxMTYtaTBoajNzNTNxaWlvNWs5NXBycGZtajBocDBnbWd0b3IuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI4NzY3MzMxMDUxMTYtaTBoajNzNTNxaWlvNWs5NXBycGZtajBocDBnbWd0b3IuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMDEyMTIxMjA2MTg2NTM3MzIzNTciLCJlbWFpbCI6InRyb25za3l0YWRwb2xlQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJhdF9oYXNoIjoiY3doLWp4Z0VmUWtuamlmczkwRUV6dyIsIm5vbmNlIjoiVDVzUWJyaUpTd3dIMUM0U2RQeEprTGJ1Mm9yNGs4IiwibmFtZSI6IlRyb25za3kgVGFkcG9sZSIsInBpY3R1cmUiOiJodHRwczovL2xoNi5nb29nbGV1c2VyY29udGVudC5jb20vLW5sSTJ3S0hRZGZJL0FBQUFBQUFBQUFJL0FBQUFBQUFBQUFBL0FNWnV1Y21OUHZNeS1BMVNoajVGcHBfckhPTGlzcGY2Smcvczk2LWMvcGhvdG8uanBnIiwiZ2l2ZW5fbmFtZSI6IlRyb25za3kiLCJmYW1pbHlfbmFtZSI6IlRhZHBvbGUiLCJsb2NhbGUiOiJlbiIsImlhdCI6MTYxMjI1ODU4MiwiZXhwIjoxNjEyMjYyMTgyLCJqdGkiOiIwNDEzODAzZWM5YzNiMDk4ZTgwNmFiM2VhNjBmZTM2OGJmZjRkNzJkIn0 -e tronskytadpole@gmail.com -s 0 -r ~/rapidsnark/build/prover -c ./build/prodCircuits/ -o proof.json -p public.json -t test
```

## Generate an email address commitment

First, generate the commitment to the email address you wish to verify for:

```bash
node build/index.js genEmailComm -e tronskytadpole@gmail.com -s 0 -l 48
```

In this case, the salt is `0` and the length is 48, which is a hardcoded
parameter to the circuit to generate the proof above. The commitment is:

```
1fc5f1ed6f4cef708c2301f56df91d84ae25b531319cd4b7d9d8a760fc983041
```

## Verify a proof

To verify the proof, run:

```bash
node build/index.js verify -j 79b7b9ac9a06284502bceb80d2b3ec0481f6ed1f14ddcb787a2cb84435b4c8f9 \
    -p ./proof.json \
    -z ./build/prodCircuits/JwtHiddenEmailAddressProver-1024_48.test.zkey \
    -e 0x1fc5f1ed6f4cef708c2301f56df91d84ae25b531319cd4b7d9d8a760fc983041
```

Note that `79b7b9ac9a06284502bceb80d2b3ec0481f6ed1f14ddcb787a2cb84435b4c8f9` is
the SHA256 hash of the JWT header and payload `eyJhbGci...`. You can use [this
online tool](https://emn178.github.io/online-tools/sha256.html) to generate such
hashes.
