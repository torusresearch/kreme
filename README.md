# SHA256 Benchmark

Clone this repository and install dependencies:

```
npm i
```

Install `zkutil`:

```bash
cargo install zkutil --version 0.3.2
```

Compile the circuit:

```
npx circom ./circom/test/jwtProver.circom -r build/jwtProver.r1cs -w build/jwtProver.wasm
```

Run a trusted setup:

```
zkutil setup -c build/jwtProver.r1cs -p build/jwtProver.params
```

To run the benchmarks:

```
NODE_OPTIONS=--max-old-space-size=4096 node build/index.js
```

Verify the proof:

```
zkutil verify -p build/jwtProver.params -r build/proof.json -i build/input.json
```
