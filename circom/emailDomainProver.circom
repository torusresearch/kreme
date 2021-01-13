include "../node_modules/circomlib/circuits/bitify.circom";
include "../node_modules/circomlib/circuits/comparators.circom";
include "./slicer.circom";
include "./matcher.circom";

// Proves the presence of a domain name in the `email` field of a secret JSON
// string.
template EmailDomainProver(maxLength) {
    var maxLengthInBits = 2;
    while(2 ** maxLengthInBits < maxLength) {
        maxLengthInBits ++;
    }
    // maxLength is the maximum supported number of bytes of the plaintext.

    // An array of bytes which represents the plaintext
    signal private input plaintext[maxLength];

    signal input domainName[maxLength];

    signal private input emailValueEndPos;

    signal input numSpacesBeforeColon;
    signal input numSpacesAfterColon;
    signal input emailNameStartPos;

    // ------------------------------------------------------------------------
    // 1. Check that emailValueEndPos is greater than emailNameStartPos by at
    // least numSpacesBeforeColon + numSpacesAfterColon + 12
    // i.e. "email" : "foo@bar.com"
    //      ^                     ^
    //       6    n 1 n 1 1 1 1 1
    component posChecker = GreaterThan(maxLengthInBits);
    posChecker.in[0] <== emailValueEndPos;
    posChecker.in[1] <== emailNameStartPos + numSpacesBeforeColon + numSpacesAfterColon + 12;
    posChecker.out === 1;

    // ------------------------------------------------------------------------
    // 2. Check that the 7 bytes starting from plaintext[emailNameStartPos]
    // match the UTF-8 representation of "email".
    component emailNameSlice = Slicer(maxLength);

    // Check that the 7 bytes starting from plaintext[emailNameStartPos] match
    // the UTF-8 representation of "email".
    /*var EMAIL = 435626797420;*/
    /*var check2n2b = Num2Bits(54);*/
    /*for (var i = 0; i < 54; i ++) {*/
    /*}*/
}
