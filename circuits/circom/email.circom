include "../node_modules/circomlib/circuits/bitify.circom";
include "../node_modules/circomlib/circuits/comparators.circom";
include "./slicer.circom";
include "./matcher.circom";
include "./range.circom";
include "./substringMatcher.circom";
include "./endsWith.circom";

template EmailJsonField(numBytes) {
    var numBytesInBits = 2;
    while(2 ** numBytesInBits < numBytes) {
        numBytesInBits ++;
    }
    // An array of bytes which represents the email substring
    signal private input emailSubstr[numBytes];

    signal private input emailNameStartPos;
    signal private input emailValueEndPos;

    signal private input numSpacesBeforeColon;
    signal private input numSpacesAfterColon;

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
    // 2. Check that the 7 bytes starting from emailSubstr[emailNameStartPos]
    // match the UTF-8 representation of `"email"`
    component emailName = EmailName(numBytes);
    emailName.emailNameStartPos <== emailNameStartPos;
    for (var i = 0; i < numBytes; i ++) {
        emailName.in[i] <== emailSubstr[i];
    }

    // 3. Check that there are numSpacesBeforeColon spaces starting from index
    // emailNameStartPos + 7
    component spacesBeforeColon = AreSpaces(numBytes);
    spacesBeforeColon.startPos <== emailNameStartPos;
    spacesBeforeColon.numSpaces <== numSpacesBeforeColon;
    for (var i = 0; i < numBytes; i ++) {
        spacesBeforeColon.in[i] <== emailSubstr[i];
    }

    // 4. Check that there is a colon at index emailNameStartPos + 6 +
    // numSpacesBeforeColon
    //"email"<numSpacesBeforeColon>:  ...
    component selectColon = Selector(numBytes);
    selectColon.index <== emailNameStartPos + 7 + numSpacesBeforeColon;
    for (var i = 0; i < numBytes; i ++) {
        selectColon.in[i] <== emailSubstr[i];
    }
    selectColon.out === 0x3a;

    // 5. Check that there are numSpacesAfterColon spaces starting from index
    // emailNameStartPos + 7 + numSpacesBeforeColon + 1
    component spacesAfterColon = AreSpaces(numBytes);
    spacesAfterColon.startPos <== emailNameStartPos + 7 + numSpacesBeforeColon + 1;
    spacesAfterColon.numSpaces <== numSpacesAfterColon;
    for (var i = 0; i < numBytes; i ++) {
        spacesAfterColon.in[i] <== emailSubstr[i];
    }

    // 6. Check that the byte at emailValueEndPos matches
    // the UTF-8 representation of ".
    component endQuote = Selector(numBytes);
    endQuote.index <== emailValueEndPos;
    for (var i = 0; i < numBytes; i ++) {
        endQuote.in[i] <== emailSubstr[i];
    }
    endQuote.out === 0x22;

    // 7. Check that the 2 bytes before emailValueEndPos are not the UTF-8
    // representation of \\.
    component beforeLastQuot1 = Selector(numBytes);
    component beforeLastQuot2 = Selector(numBytes);
    beforeLastQuot1.index <== emailValueEndPos - 1;
    beforeLastQuot2.index <== emailValueEndPos - 2;
    for (var i = 0; i < numBytes; i ++) {
        beforeLastQuot1.in[i] <== emailSubstr[i];
        beforeLastQuot2.in[i] <== emailSubstr[i];
    }
    component beforeLastQuot1Eq = IsEqual();
    component beforeLastQuot2Eq = IsEqual();
    beforeLastQuot1Eq.in[0] <== beforeLastQuot1.out;
    beforeLastQuot1Eq.in[1] <== 0x5c;

    beforeLastQuot2Eq.in[0] <== beforeLastQuot2.out;
    beforeLastQuot2Eq.in[1] <== 0x5c;
    beforeLastQuot1Eq.out === 0;
    beforeLastQuot2Eq.out === 0;
}

// Proves the presence of an email address in the `email` field of a secret JSON
// string.
template EmailAddressProver(numBytes) {
    var numBytesInBits = 2;
    while(2 ** numBytesInBits < numBytes) {
        numBytesInBits ++;
    }
    // An array of bytes which represents the email substring
    signal private input emailSubstr[numBytes];

    signal input emailAddress[numBytes];
    signal input numEmailAddressBytes;

    signal private input emailNameStartPos;
    signal private input emailValueEndPos;

    signal input numSpacesBeforeColon;
    signal input numSpacesAfterColon;

    component emailJsonField = EmailJsonField(numBytes);
    for (var i = 0; i < numBytes; i ++) {
        emailJsonField.emailSubstr[i] <== emailSubstr[i];
    }
    emailJsonField.emailNameStartPos <== emailNameStartPos;
    emailJsonField.emailValueEndPos <== emailValueEndPos;
    emailJsonField.numSpacesBeforeColon <== numSpacesBeforeColon;
    emailJsonField.numSpacesAfterColon <== numSpacesAfterColon;

    // 2. Check that emailSubstr contains emailAddress
    component slice = Slicer(numBytes);
    slice.startIndex <== emailValueEndPos - numEmailAddressBytes + 1;
    slice.len <== numEmailAddressBytes;
    for (var i = 0; i < numBytes; i ++) {
        slice.in[i] <== emailSubstr[i];
    }

    component endsWith = EndsWith(numBytes);
    endsWith.targetLen <== numEmailAddressBytes;
    for (var i = 0; i < numBytes; i ++) {
        endsWith.in[i] <== slice.out[i];
        endsWith.target[i] <== emailAddress[i];
    }
    endsWith.out === 1;
}

// Proves the presence of a domain name in the `email` field of a secret JSON
// string.
template EmailDomainProver(numBytes) {
    var numBytesInBits = 2;
    while(2 ** numBytesInBits < numBytes) {
        numBytesInBits ++;
    }
    // An array of bytes which represents the email substring
    signal private input emailSubstr[numBytes];
    signal input domainName[numBytes];
    signal input numDomainBytes;
    signal private input emailNameStartPos;
    signal private input emailValueEndPos;
    signal private input numSpacesBeforeColon;
    signal private input numSpacesAfterColon;

    component emailJsonField = EmailJsonField(numBytes);
    for (var i = 0; i < numBytes; i ++) {
        emailJsonField.emailSubstr[i] <== emailSubstr[i];
    }
    emailJsonField.emailNameStartPos <== emailNameStartPos;
    emailJsonField.emailValueEndPos <== emailValueEndPos;
    emailJsonField.numSpacesBeforeColon <== numSpacesBeforeColon;
    emailJsonField.numSpacesAfterColon <== numSpacesAfterColon;

    // 2. Check that emailSubstr contains domainName
    component domainSlice = Slicer(numBytes);
    domainSlice.startIndex <== emailValueEndPos - numDomainBytes + 1;
    domainSlice.len <== numDomainBytes;
    for (var i = 0; i < numBytes; i ++) {
        domainSlice.in[i] <== emailSubstr[i];
    }

    component endsWith = EndsWith(numBytes);
    endsWith.targetLen <== numDomainBytes;
    for (var i = 0; i < numBytes; i ++) {
        endsWith.in[i] <== domainSlice.out[i];
        endsWith.target[i] <== domainName[i];
    }
    endsWith.out === 1;
}

template AreSpaces(numBytes) {
    signal input in[numBytes];
    signal input startPos;
    signal input numSpaces;

    var lengthInBits = 2;
    while(2 ** lengthInBits < numBytes) {
        lengthInBits ++;
    }

    component range[numBytes];
    component eqs[numBytes];
    component correct[numBytes];
    component total = CalculateTotal(numBytes);
    //"email"<numSpaces>:  ...
    for (var i = 0; i < numBytes; i ++) {
        range[i] = IsInRange(lengthInBits);
        range[i].in[0] <== startPos;
        range[i].in[1] <== startPos + 7 + numSpaces;
        range[i].index <== i;

        eqs[i] = IsEqual();
        eqs[i].in[0] <== 0x20; // space
        eqs[i].in[1] <== in[i];

        correct[i] = IsEqual();
        correct[i].in[0] <== 2;
        correct[i].in[1] <== eqs[i].out + range[i].out;

        total.nums[i] <== correct[i].out;
        // byte = in[i]
        // if byte == 0x20 and i in range(7, 7 + numSpaces):
        //     total += 1
        // else
        //     total += 0
    }
    total.sum === numSpaces;
}

template EmailName(numBytes) {
    signal input in[numBytes];
    signal input emailNameStartPos;

    component selectorQ0 = Selector(numBytes);
    component selectorE = Selector(numBytes);
    component selectorM = Selector(numBytes);
    component selectorA = Selector(numBytes);
    component selectorI = Selector(numBytes);
    component selectorL = Selector(numBytes);
    component selectorQ1 = Selector(numBytes);
    for (var i = 0; i < numBytes; i ++) {
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

    // "email"
    selectorQ0.out === 0x22;
    selectorE.out === 0x65;
    selectorM.out === 0x6d;
    selectorA.out === 0x61;
    selectorI.out === 0x69;
    selectorL.out === 0x6c;
    selectorQ1.out === 0x22;
}
