# Circuit setup

Before you can deploy Kreme, you need to prepare the
`JwtHiddenEmailAddressProver` circuits, an run a multi-party trusted setup.

Each circuit should have a unique combination of hardcoded parameters. There
are two parameters for each circuit:

1. `numPreimageB64PaddedBytes`: the number of padded base64url bytes
which will be hashed using SHA256. Due to the SHA256 padding algorithm, this
value should be a multiple of 64.

2. `numEmailSubstrB64Bytes`: the number of bytes which contains the
base64url encoded substring `"email":"user@domain.tld"`.

Note that there may be spaces before and after the colon `:`, and this will
reduce the number of bytes that the actual email address may have. Without any
spaces, the email address may be `numEmailSubstrB64Bytes * 0.75 - 11` bytes
long:

| `numEmailSubstrB64Bytes` | Email address bytes | Example |
|-|-|-|
| 48 | 25 | `username1234567@gmail.com` |
| 64 | 47 | `username12345679012345678901234567890@gmail.com` |

## Build circuits

1. On a fast machine, install Kreme using [non-Docker
instructions](./nondockersetup.html).

2. Navigate to the `cli` directory and view `compile_config.example.json`. Copy
   it to `compile_config.json`.

3. Edit `compile_config.json`. It should contain circuit definitions for the
   following parameters:

| `numPreimageB64PaddedBytes` | `numEmailSubstrB64Bytes` |
|-|-|
| 1024 | 48 |
| 1024 | 64 |

You should generate as many circuts as you need, depending on the possible JSON
and email address lengths your use case will encounter.

4. Compile the circuits. Note that `build/prodCircuits` should be empty or the
   `-nc` flag will tell the `compile` subcommand not to overwrite existing
   files.

```bash
node build/index.js compile -c compile_config.json -o build/prodCircuits/ -nc
```

5. Download the `ptau` file.

```bash
npm run downloadPhase1
```

6. Generate the `.zkey` files.

```bash
npm run genZkeys
```

If you encounter an error that the `.ptau` file is too small, you have to
manually download a larger one. The URL provided in the Kreme repository is for
a `.ptau` file which supports up to \\( 2^{21} \\) constraints. You can
download larger `.ptau` files from a Dropbox link [provided by iden3 in their
`snarkjs` repository](https://github.com/iden3/snarkjs).

To determine how many constraints a circuit has, use `npx snarkjs r1cs info
<.r1cs file>`:

```bash
# In circuits/
~/kreme/circuits$ npx snarkjs r1cs info ../cli/build/prodCircuits/JwtHiddenEmailAddressProver-1024_64.r1cs                                                        
[INFO]  snarkJS: Curve: bn-128
[INFO]  snarkJS: # of Wires: 1071794
[INFO]  snarkJS: # of Constraints: 1077580
[INFO]  snarkJS: # of Private Inputs: 1144
[INFO]  snarkJS: # of Public Inputs: 3
[INFO]  snarkJS: # of Labels: 5029260
[INFO]  snarkJS: # of Outputs: 0
```

## Run trusted setups

Use [`multisetups`](http://github.com/appliedzkp/multisetups) to run a trusted
setup.
