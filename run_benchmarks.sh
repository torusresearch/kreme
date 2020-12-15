#!/usr/bin/env bash

echo "Installing dependencies"
npm i
echo

echo "Building index.ts"
npm run build
echo

echo "Compiling circuit"
npx circom ./circom/test/jwtProver.circom -r build/jwtProver.r1cs -w build/jwtProver.wasm
echo

echo "Performing trusted setup"
zkutil setup -c build/jwtProver.r1cs -p build/jwtProver.params
echo

echo "Running benchmarks"
node build/index.js
echo

echo "Verifying proof"
zkutil verify -p build/jwtProver.params -r build/proof.json -i build/public_inputs.json
