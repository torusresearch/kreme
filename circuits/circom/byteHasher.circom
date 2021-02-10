include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/bitify.circom";

/*
 * Hash an array of bytes with a salt using Poseidon.
 */
template ByteHasher(numBytes) {
    signal private input in[numBytes];
    signal private input salt;
    signal output hash;

    assert(numBytes > 0);

    // numBytes may not be a multiple of 31. Calculate numPaddedBytes which is
    // a multiple of 31 where numPaddedBytes > numBytes.
    var numElements = 1;
    while (numElements * 31 < numBytes) {
        numElements ++;
    }
    var numPaddedBytes = numElements * 31;

    signal paddedIn[numPaddedBytes];
    for (var i = 0; i < numPaddedBytes - numBytes; i ++) {
        paddedIn[i] <== 0;
    }

    for (var i = 0; i < numBytes; i ++) {
        paddedIn[i + numPaddedBytes - numBytes] <== in[i];
    }

    // Convert the input array to bits
    signal bitsToHash[numPaddedBytes * 8];
    component n2b[numPaddedBytes];
    for (var i = 0; i < numPaddedBytes; i ++) {
        n2b[i] = Num2Bits(8);
        n2b[i].in <== paddedIn[i];
        for (var j = 0; j < 8; j ++) {
            bitsToHash[j + i * 8] <== n2b[i].out[7 - j];
        }
    }

    signal elementsToHash[numElements];
    component b2n[numElements];
    for (var i = 0; i < numElements; i ++) {
        b2n[i] = Bits2Num(248);
        for (var j = 0; j < 248; j ++) {
            b2n[i].in[247 - j] <== bitsToHash[j + i * 248];
        }
        elementsToHash[i] <== b2n[i].out;
    }

    component hashers[numElements];
    hashers[0] = Poseidon(2);
    hashers[0].inputs[0] <== salt;
    hashers[0].inputs[1] <== elementsToHash[0];

    for (var i = 1; i < numElements; i ++) {
        hashers[i] = Poseidon(2);
        hashers[i].inputs[0] <== hashers[i - 1].out;
        hashers[i].inputs[1] <== elementsToHash[i];
    }
    hash <== hashers[numElements - 1].out;
}
