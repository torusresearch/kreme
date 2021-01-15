include "../node_modules/circomlib/circuits/bitify.circom";
include "../node_modules/circomlib/circuits/comparators.circom";
include "./slicer.circom";
include "./matcher.circom";
include "./substringMatcher.circom";

// Proves the presence of a domain name in the `email` field of a secret JSON
// string.
template EmailDomainProver(numBytes, numEmailSubstrBytes) {
    var numBytesInBits = 2;
    while(2 ** numBytesInBits < numBytes) {
        numBytesInBits ++;
    }
    // numBytes is the maximum supported number of bytes of the plaintext.

    // An array of bytes which represents the plaintext
    signal private input plaintext[numBytes];
    signal private input emailSubstr[numEmailSubstrBytes];

    signal input domainName[numEmailSubstrBytes];

    signal private input emailNameStartPos;
    signal private input emailValueEndPos;

    signal input numSpacesBeforeColon;
    signal input numSpacesAfterColon;

    // ------------------------------------------------------------------------
    // 1. Check that emailValueEndPos is greater than at least
    // numSpacesBeforeColon + numSpacesAfterColon + 12
    // i.e. "email" : "foo@bar.com"
    //      ^                     ^
    //       6    n 1 n 1 1 1 1 1
    component posChecker = GreaterThan(numBytesInBits);
    posChecker.in[0] <== emailValueEndPos;
    posChecker.in[1] <== numSpacesBeforeColon + numSpacesAfterColon + 12;
    posChecker.out === 1;

    // ------------------------------------------------------------------------
    // 2. Check that `emailSubstr` is a substring of `plaintext`
    component substrChecker = SubstringMatcher(numBytes, numEmailSubstrBytes);
    for (var i = 0; i < numBytes; i ++) {
        substrChecker.a[i] <== plaintext[i];
    }

    for (var i = 0; i < numEmailSubstrBytes; i ++) {
        substrChecker.b[i] <== emailSubstr[i];
    }
    substrChecker.out === 1;

    // ------------------------------------------------------------------------
    // 3. Check that the 7 bytes starting from emailSubstr[0]
    // match the UTF-8 representation of `"email"`
    // TODO: use indices
    component emailName = EmailName(numEmailSubstrBytes);
    emailName.emailNameStartPos <== emailNameStartPos;
    for (var i = 0; i < numEmailSubstrBytes; i ++) {
        emailName.in[i] <== emailSubstr[i];
    }
}

template EmailName(numEmailSubstrBytes) {
    signal input in[numEmailSubstrBytes];
    signal input emailNameStartPos;

    component selectorQ0 = Selector(numEmailSubstrBytes);
    component selectorE = Selector(numEmailSubstrBytes);
    component selectorM = Selector(numEmailSubstrBytes);
    component selectorA = Selector(numEmailSubstrBytes);
    component selectorI = Selector(numEmailSubstrBytes);
    component selectorL = Selector(numEmailSubstrBytes);
    component selectorQ1 = Selector(numEmailSubstrBytes);
    for (var i = 0; i < numEmailSubstrBytes; i ++) {
        selectorQ0.in[i] <== in[i];
        selectorE.in[i] <== in[i];
        selectorM.in[i] <== in[i];
        selectorA.in[i] <== in[i];
        selectorI.in[i] <== in[i];
        selectorL.in[i] <== in[i];
        selectorQ1.in[i] <== in[i];
    }
    selectorQ0.index <== emailNameStartPos;
    selectorE.index <== emailNameStartPos + 1;
    selectorM.index <== emailNameStartPos + 2;
    selectorA.index <== emailNameStartPos + 3;
    selectorI.index <== emailNameStartPos + 4;
    selectorL.index <== emailNameStartPos + 5;
    selectorQ1.index <== emailNameStartPos + 6;

    selectorQ0.out === 0x22;
    selectorE.out === 0x65;
    selectorM.out === 0x6d;
    selectorA.out === 0x61;
    selectorI.out === 0x69;
    selectorL.out === 0x6c;
    selectorQ1.out === 0x22;
}
