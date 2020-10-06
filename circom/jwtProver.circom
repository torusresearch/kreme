include "../node_modules/circomlib/circuits/sha256/sha256.circom";
include "../node_modules/circomlib/circuits/bitify.circom";

template JwtProver(numChunks) {
    var BITS_PER_CHUNK = 128;
    signal private input chunks[numChunks];
    signal output preImageBits[numChunks * BITS_PER_CHUNK];

    signal concatBits[numChunks * BITS_PER_CHUNK];

    component chunksToBits[numChunks];
    for (var i = 0; i < numChunks; i ++) {
        chunksToBits[i] = Num2Bits(BITS_PER_CHUNK);
        chunksToBits[i].in <== chunks[i];
    }


    for (var i = 0; i < numChunks; i ++) {
        for (var j = 0; j < BITS_PER_CHUNK; j++) {
            concatBits[i * BITS_PER_CHUNK + j] <== chunksToBits[i].out[BITS_PER_CHUNK - j - 1];
        }
    }

    component sha256 = Sha256(numChunks * BITS_PER_CHUNK);
    for (var i = 0; i < numChunks * BITS_PER_CHUNK; i ++) {
        preImageBits[i] <== concatBits[i];
        sha256.in[i] <== concatBits[i];
    }

    signal input expectedHash[2];
    component ehToBits0 = Num2Bits(BITS_PER_CHUNK);
    component ehToBits1 = Num2Bits(BITS_PER_CHUNK);
    ehToBits0.in <== expectedHash[0];
    ehToBits1.in <== expectedHash[1];

    for (var i = 0; i < 128; i ++) {
        sha256.out[i] === ehToBits0.out[BITS_PER_CHUNK - i - 1];
        sha256.out[i + 128] === ehToBits1.out[BITS_PER_CHUNK - i - 1];
    }

    signal output hash[256];

    for (var i = 0; i < 256; i ++) {
        hash[i] <== sha256.out[i];
    }
}
