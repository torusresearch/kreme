include "../node_modules/circomlib/circuits/bitify.circom";
include "../node_modules/circomlib/circuits/comparators.circom";

// Proves the presence of a domain name in the `email` field of a secret JSON
// string.

// For now, only supports one field element as input (max 253 bits) and a
// domain name of a maximum of 17 bytes long.
template EmailDomainProver() {
    signal input plaintext;
    signal private input numSpacesBeforeColon;
    signal private input numSpacesAfterColon;
    signal private input numDomainNameBytes;
    signal private input emailNameEndPos;
    signal input emailNameStartPos;
    signal private input paddingBitsLength;

    component plaintextBits = Num2Bits_strict();
    plaintextBits.in <== plaintext;

    // 1. Check that emailNameEndPos is greater than emailNameStartPos by at least
    // 6 + numSpacesBeforeColon + 1 + numSpacesAfterColon + 1 +
    // NUM_DOMAIN_NAME_BYTES.

    component check1LessThan = LessThan(248);
    check1LessThan.in[0] <== emailNameStartPos + numSpacesBeforeColon + numSpacesAfterColon + numDomainNameBytes + 8;
    check1LessThan.in[1] <== emailNameEndPos;
    check1LessThan.out === 1;

    // Check that the 7 bytes starting from plaintext[emailNameStartPos] match
    // the UTF-8 representation of "email".
    /*var EMAIL = 435626797420;*/
    /*var check2n2b = Num2Bits(54);*/
    /*for (var i = 0; i < 54; i ++) {*/
    /*}*/
}
