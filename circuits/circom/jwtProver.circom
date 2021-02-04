include "../node_modules/circomlib/circuits/sha256/sha256.circom";
include "../node_modules/circomlib/circuits/bitify.circom";
include "./sha256Hasher.circom";
include "./emailDomainProver.circom";

template JwtProver(numBytes, numEmailSubstrBytes) {
    var numPaddedBits = (((numBytes * 8) + 64) \ 512) * 512;
    var numPaddedBytes = numPaddedBits / 8;

    signal private input plaintext[numPaddedBytes];
    signal private input expectedHash[2];

    component plaintextToBits[numPaddedBytes];
    for (var i = 0; i < numBytes; i ++) {
        plaintextToBits[i] = Num2Bits(8);
        plaintextToBits[i].in <== plaintext[i];
    }

    component sha256 = Sha256Hasher(numPaddedBits);
    for (var i = 0; i < numPaddedBytes; i ++) {
        for (var j = 0; j < 8; j ++) {
            sha256.paddedIn[i * 8 + j] <== plaintextToBits[i].out[7 - j];
        }
    }

    component ehToBits0 = Num2Bits(128);
    component ehToBits1 = Num2Bits(128);
    ehToBits0.in <== expectedHash[0];
    ehToBits1.in <== expectedHash[1];

    for (var i = 0; i < 128; i ++) {
        sha256.out[i] === ehToBits0.out[128 - i - 1];
        sha256.out[i + 128] === ehToBits1.out[128 - i - 1];
    }
    signal private input emailSubstr[numEmailSubstrBytes];

    signal input domainName[numEmailSubstrBytes];
    signal input numDomainBytes;

    signal private input emailNameStartPos;
    signal private input emailValueEndPos;

    signal input numSpacesBeforeColon;
    signal input numSpacesAfterColon;

    component emailDomainProver = EmailDomainProver(numPaddedBytes, numEmailSubstrBytes);
    for (var i = 0; i < numBytes; i ++) {
        emailDomainProver.plaintext[i] <== plaintext[i];
    }

    for (var i = 0; i < numEmailSubstrBytes; i ++) {
        emailDomainProver.emailSubstr[i] <== emailSubstr[i];
        emailDomainProver.domainName[i] <== domainName[i];
    }

    emailDomainProver.numDomainBytes <== numDomainBytes;
    emailDomainProver.emailNameStartPos <== emailNameStartPos;
    emailDomainProver.emailValueEndPos <== emailValueEndPos;
    emailDomainProver.numSpacesBeforeColon <== numSpacesBeforeColon;
    emailDomainProver.numSpacesAfterColon <== numSpacesAfterColon;
}

/*template JwtProver(numChunks) {*/
    /*var BITS_PER_CHUNK = 128;*/
    /*signal private input chunks[numChunks];*/
    /*signal output preImageBits[numChunks * BITS_PER_CHUNK];*/

    /*signal concatBits[numChunks * BITS_PER_CHUNK];*/

    /*component chunksToBits[numChunks];*/
    /*for (var i = 0; i < numChunks; i ++) {*/
        /*chunksToBits[i] = Num2Bits(BITS_PER_CHUNK);*/
        /*chunksToBits[i].in <== chunks[i];*/
    /*}*/


    /*for (var i = 0; i < numChunks; i ++) {*/
        /*for (var j = 0; j < BITS_PER_CHUNK; j++) {*/
            /*concatBits[i * BITS_PER_CHUNK + j] <== chunksToBits[i].out[BITS_PER_CHUNK - j - 1];*/
        /*}*/
    /*}*/

    /*component sha256 = Sha256(numChunks * BITS_PER_CHUNK);*/
    /*for (var i = 0; i < numChunks * BITS_PER_CHUNK; i ++) {*/
        /*preImageBits[i] <== concatBits[i];*/
        /*sha256.in[i] <== concatBits[i];*/
    /*}*/

    /*signal input expectedHash[2];*/
    /*component ehToBits0 = Num2Bits(BITS_PER_CHUNK);*/
    /*component ehToBits1 = Num2Bits(BITS_PER_CHUNK);*/
    /*ehToBits0.in <== expectedHash[0];*/
    /*ehToBits1.in <== expectedHash[1];*/

    /*for (var i = 0; i < 128; i ++) {*/
        /*sha256.out[i] === ehToBits0.out[BITS_PER_CHUNK - i - 1];*/
        /*sha256.out[i + 128] === ehToBits1.out[BITS_PER_CHUNK - i - 1];*/
    /*}*/

    /*signal output hash[256];*/

    /*for (var i = 0; i < 256; i ++) {*/
        /*hash[i] <== sha256.out[i];*/
    /*}*/
/*}*/
