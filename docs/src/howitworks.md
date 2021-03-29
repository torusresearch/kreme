# How it works

## Structure of a JWT token

An RS256 JWT token consists of three parts:

`<header>.<payload>.<signature>`

The values between the full stops (`.`) are encoded with base64url.

The signature is computed on the hash of the header and payload.

```
eyJhbGciOiJSUzI1NiIsImtpZCI6IjAzYjJkMjJjMmZlY2Y4NzNlZDE5ZTViOGNmNzA0YWZiN2UyZWQ0YmUiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiI4NzY3MzMxMDUxMTYtaTBoajNzNTNxaWlvNWs5NXBycGZtajBocDBnbWd0b3IuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI4NzY3MzMxMDUxMTYtaTBoajNzNTNxaWlvNWs5NXBycGZtajBocDBnbWd0b3IuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMDEyMTIxMjA2MTg2NTM3MzIzNTciLCJlbWFpbCI6InRyb25za3l0YWRwb2xlQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJhdF9oYXNoIjoiY3doLWp4Z0VmUWtuamlmczkwRUV6dyIsIm5vbmNlIjoiVDVzUWJyaUpTd3dIMUM0U2RQeEprTGJ1Mm9yNGs4IiwibmFtZSI6IlRyb25za3kgVGFkcG9sZSIsInBpY3R1cmUiOiJodHRwczovL2xoNi5nb29nbGV1c2VyY29udGVudC5jb20vLW5sSTJ3S0hRZGZJL0FBQUFBQUFBQUFJL0FBQUFBQUFBQUFBL0FNWnV1Y21OUHZNeS1BMVNoajVGcHBfckhPTGlzcGY2Smcvczk2LWMvcGhvdG8uanBnIiwiZ2l2ZW5fbmFtZSI6IlRyb25za3kiLCJmYW1pbHlfbmFtZSI6IlRhZHBvbGUiLCJsb2NhbGUiOiJlbiIsImlhdCI6MTYxMjI1ODU4MiwiZXhwIjoxNjEyMjYyMTgyLCJqdGkiOiIwNDEzODAzZWM5YzNiMDk4ZTgwNmFiM2VhNjBmZTM2OGJmZjRkNzJkIn0.L4q2xZL1WYDrZ_OiRs5q1FmzB8Q-A3ZavHC138wxcNb-Ig5KAIO7soSAPAJU4eB9Vz4WypZgxJtxD2kyuhbFpysVp6j-1LcouDSRgLKruu7-FmQadWbsQv48Ps6TrG9psXP9eo3Ud7sfTQqSiHS49IokBqjPbOwL5GglJ5pCTjAnn6-yU2zZpFg_QJtitZMiyq_ylS-i_4VIgS82AKqHpqNM3V8x3QueVoMu0CrszVujbFO6oE-r9-lUxB6VLM9EpLq-VWcieCit-lDGaKAQka-dk4ij-krLysD-OGT56usOn32r101px6kL1hlpL9GaQMrHa5GSmshAMqUTBl5vrw
```

The header decodes to:

```
{"alg":"RS256","kid":"03b2d22c2fecf873ed19e5b8cf704afb7e2ed4be","typ":"JWT"}
```

The payload decodes to:

```
{"iss":"https://accounts.google.com","azp":"876733105116-i0hj3s53qiio5k95prpfmj0hp0gmgtor.apps.googleusercontent.com","aud":"876733105116-i0hj3s53qiio5k95prpfmj0hp0gmgtor.apps.googleusercontent.com","sub":"101212120618653732357","email":"tronskytadpole@gmail.com","email_verified":true,"at_hash":"cwh-jxgEfQknjifs90EEzw","nonce":"T5sQbriJSwwH1C4SdPxJkLbu2or4k8","name":"Tronsky Tadpole","picture":"https://lh6.googleusercontent.com/-nlI2wKHQdfI/AAAAAAAAAAI/AAAAAAAAAAA/AMZuucmNPvMy-A1Shj5Fpp_rHOLispf6Jg/s96-c/photo.jpg","given_name":"Tronsky","family_name":"Tadpole","locale":"en","iat":1612258582,"exp":1612262182,"jti":"0413803ec9c3b098e806ab3ea60fe368bff4d72d"}
```

The goal of Kreme is to generate and verify proofs of knowledge of the value of
the `email` JSON field, without revealing the preimage of the hash of the
header and payload.

Note that Kreme does not verify the RSA signature.

## The `JwtHiddenEmailAddressProver` circuit

The `JwtHiddenEmailAddressProver` circuit accepts the following inputs:

| Input | Type | Description|
|-|-|-|
| preimageB64[numPreimageB64PaddedBytes] | Private | The base64url-encoded padded SHA256 hash preimage |
| emailSubstrB64[numEmailSubstrB64Bytes] | Private | The base64url-encoded substring of `preimageB64` which contains the `"email":"..."` substring |
| emailSubstrBitIndex | Private | The index of the bit at which the `"email":"..."` substring begins in the UTF-8-converted `emailSubstrB64` |
| emailSubstrBitLength | Private | The number of bits in the UTF-8-converted `emailSubstrB64` substring |
| expectedHash[2] | Public | The SHA256 hash represented as two 128-bit values. |
| emailNameStartPos | Private | The byte position of the first quotation mark `"email":"..."` in the UTF-8 encoded email substring |
| emailValueEndPos | Private |  The byte position of the last quotation mark `"email":"..."` in the UTF-8 encoded email substring|
| numSpacesBeforeColon | Private input | The number of spaces before the colon |
| numSpacesAfterColon | Private input | The number of spaces after the colon |
| emailAddress[numEmailUtf8Bytes] | Private | The email address as a UTF-8 byte array |
| numEmailAddressBytes | Private | The number of bytes  |
| salt | Private |  |
| emailAddressCommitment | Public |  |

The `JwtHiddenEmailAddressProver` circuit is parameterised as such:

- `numPreimageB64PaddedBytes`: the length in bytes of the SHA256 hash preimage.
- `numEmailSubstrB64Bytes`

The variable `numEmailUtf8Bytes` is computed as such:
    - `var numEmailUtf8Bytes = numEmailSubstrB64Bytes * 6 / 8;`

### sub-circuits

The `JwtHiddenEmailAddressProver` circuit is comprised of several sub-circuits.

#### `ByteHasher`


