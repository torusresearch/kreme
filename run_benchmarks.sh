#!/usr/bin/env bash

echo "Installing dependencies"
npm i

echo "Building index.ts"
npm run build

echo "Compiling circuit"
npx circom ./circom/test/jwtProver.circom -r build/jwtProver.r1cs -w build/jwtProver.wasm

echo "Performing trusted setup"
zkutil setup -c build/jwtProver.r1cs -p build/jwtProver.params

echo "Running benchmarks"
node build/index.js

echo "Verifying proof"
zkutil verify -p build/jwtProver.params -r build/proof.json -i build/public_inputs.json
