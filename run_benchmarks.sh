#!/usr/bin/env bash

npm i

# Compile circuit
if [ ! -e "./build/test/jwtProver_test.r1cs" ]; then
    NODE_OPTIONS=--max-old-space-size=4096 node --stack-size=1073741 ./node_modules/circom/cli.js ../circom/benchmark/jwtProver_test.circom -r ./build/test/jwtProver_test.r1cs -c ./build/test/jwtProver_test.c -s ./build/test/jwtProver_test.sym
fi

# Benchmark witness generation
echo "########## Witness generation ##########"
mkdir -p benchmarks
cd benchmarks
npx circom-helper -c ../benchmarkConfig.json -nc -b ../build/test/ -p 9001 &
sleep 5 && npm run test-jwtProver

echo "Running circom-server"
git clone git@github.com:weijiekoh/circom-server.git
cd circom-server
rm -f jwt.witness.json
git pull origin master
npm i
wget -O jwt.witness.json --quiet https://www.dropbox.com/s/5oehw36hywo2jdk/jwt.witness.json?dl=1
mkdir compiled
cp ../../build/test/jwtProver_test.* ./compiled/
rm -f example/mainFiles/*.circom

echo "Running zkutil-server"
cd ../
git clone git@github.com:weijiekoh/zkutil-server.git
cd zkutil-server
git pull origin master
cargo build --release
mkdir -p compiled
cp ../circom-server/compiled/jwtProver_test.r1cs ./compiled/

if [ ! -e "compiled/jwtProver_test.params" ]; then
    zkutil setup -c compiled/jwtProver_test.r1cs -p compiled/jwtProver_test.params
fi

echo In separate terminals, run:

echo "cd ./benchmarks/zkutil-server && ./target/release/zkutil-server -n -c ./compiled/ -p 9003"

echo "cd ./benchmarks/circom-server && node build/index.js -c ./config.example.json -nc -b ./compiled/ -p 9000"

echo "cd ./benchmarks/circom-server/ && npm run test-jwt"
