include "../node_modules/circomlib/circuits/sha256/sha256.circom";
include "../node_modules/circomlib/circuits/bitify.circom";
include "./sha256Hasher.circom";
include "./slicer.circom";
include "./email.circom";
include "./substringMatcher.circom";
include "./base64url.circom";
include "./byteHasher.circom";

template JwtHiddenEmailAddressProver(numPreimageB64PaddedBytes, numEmailSubstrB64Bytes) {
    var numEmailUtf8Bytes = numEmailSubstrB64Bytes * 6 / 8;
    signal private input preimageB64[numPreimageB64PaddedBytes];
    signal private input emailSubstrB64[numEmailSubstrB64Bytes];
    signal private input emailSubstrBitIndex;
    signal private input emailSubstrBitLength;
    signal private input expectedHash[2];
    signal private input emailNameStartPos;
    signal private input emailValueEndPos;
    signal private input numSpacesBeforeColon;
    signal private input numSpacesAfterColon;
    signal private input emailAddress[numEmailUtf8Bytes];
    signal private input numEmailAddressBytes;
    signal private input salt;
    signal private input emailAddressCommitment;

    // Hash the email address
    component hasher = ByteHasher(numEmailUtf8Bytes);
    hasher.salt <== salt;
    for (var i = 0; i < numEmailUtf8Bytes; i ++) {
        hasher.in[i] <== emailAddress[i];
    }
    emailAddressCommitment === hasher.hash;

    component jwtEAP = JwtEmailAddressProver(numPreimageB64PaddedBytes, numEmailSubstrB64Bytes);
    for (var i = 0; i < numPreimageB64PaddedBytes; i ++) {
        jwtEAP.preimageB64[i] <== preimageB64[i];
    }
    for (var i = 0; i < numEmailSubstrB64Bytes; i ++) {
        jwtEAP.emailSubstrB64[i] <== emailSubstrB64[i];
    }
    for (var i = 0; i < numEmailUtf8Bytes; i ++) {
        jwtEAP.emailAddress[i] <== emailAddress[i];
    }
    jwtEAP.emailSubstrBitIndex <== emailSubstrBitIndex;
    jwtEAP.emailSubstrBitLength <== emailSubstrBitLength;
    jwtEAP.expectedHash[0] <== expectedHash[0];
    jwtEAP.expectedHash[1] <== expectedHash[1];
    jwtEAP.emailNameStartPos <== emailNameStartPos;
    jwtEAP.emailValueEndPos <== emailValueEndPos;
    jwtEAP.numSpacesBeforeColon <== numSpacesBeforeColon;
    jwtEAP.numSpacesAfterColon <== numSpacesAfterColon;
    jwtEAP.numEmailAddressBytes <== numEmailAddressBytes;
}

template JwtEmailAddressProver(numPreimageB64PaddedBytes, numEmailSubstrB64Bytes) {
    signal private input preimageB64[numPreimageB64PaddedBytes];
    signal private input emailSubstrB64[numEmailSubstrB64Bytes];
    signal private input emailSubstrBitIndex;
    signal private input emailSubstrBitLength;
    signal private input expectedHash[2];
    signal private input emailNameStartPos;
    signal private input emailValueEndPos;
    signal private input numSpacesBeforeColon;
    signal private input numSpacesAfterColon;
    signal input emailAddress[numEmailSubstrB64Bytes * 6 / 8];
    signal input numEmailAddressBytes;

    component jwt = JwtProver(numPreimageB64PaddedBytes, numEmailSubstrB64Bytes);
    for (var i = 0; i < numPreimageB64PaddedBytes; i ++) {
        jwt.preimageB64[i] <== preimageB64[i];
    }
    for (var i = 0; i < numEmailSubstrB64Bytes; i ++) {
        jwt.emailSubstrB64[i] <== emailSubstrB64[i];
    }
    jwt.emailSubstrBitIndex <== emailSubstrBitIndex;
    jwt.emailSubstrBitLength <== emailSubstrBitLength;
    jwt.expectedHash[0] <== expectedHash[0];
    jwt.expectedHash[1] <== expectedHash[1];

    // ------------------------------------------------------------------------
    // Check the email address
    component emailAddressProver = EmailAddressProver(numEmailSubstrB64Bytes * 6 / 8);
    for (var i = 0; i < numEmailSubstrB64Bytes * 6 / 8; i ++) {
        emailAddressProver.emailSubstr[i] <== jwt.emailSubstrUtf8Bytes[i];
        emailAddressProver.emailAddress[i] <== emailAddress[i];
    }

    emailAddressProver.numEmailAddressBytes <== numEmailAddressBytes;
    emailAddressProver.emailNameStartPos <== emailNameStartPos;
    emailAddressProver.emailValueEndPos <== emailValueEndPos;
    emailAddressProver.numSpacesBeforeColon <== numSpacesBeforeColon;
    emailAddressProver.numSpacesAfterColon <== numSpacesAfterColon;
}

template JwtEmailDomainProver(numPreimageB64PaddedBytes, numEmailSubstrB64Bytes) {
    signal private input preimageB64[numPreimageB64PaddedBytes];
    signal private input emailSubstrB64[numEmailSubstrB64Bytes];
    signal private input emailSubstrBitIndex;
    signal private input emailSubstrBitLength;
    signal private input expectedHash[2];
    signal private input emailNameStartPos;
    signal private input emailValueEndPos;
    signal private input numSpacesBeforeColon;
    signal private input numSpacesAfterColon;

    signal input domainName[numEmailSubstrB64Bytes * 6 / 8];
    signal input numDomainBytes;

    component jwt = JwtProver(numPreimageB64PaddedBytes, numEmailSubstrB64Bytes);
    for (var i = 0; i < numPreimageB64PaddedBytes; i ++) {
        jwt.preimageB64[i] <== preimageB64[i];
    }
    for (var i = 0; i < numEmailSubstrB64Bytes; i ++) {
        jwt.emailSubstrB64[i] <== emailSubstrB64[i];
    }
    jwt.emailSubstrBitIndex <== emailSubstrBitIndex;
    jwt.emailSubstrBitLength <== emailSubstrBitLength;
    jwt.expectedHash[0] <== expectedHash[0];
    jwt.expectedHash[1] <== expectedHash[1];

    // ------------------------------------------------------------------------
    // Check the domain name
    component emailDomainProver = EmailDomainProver(numEmailSubstrB64Bytes * 6 / 8);
    for (var i = 0; i < numEmailSubstrB64Bytes * 6 / 8; i ++) {
        emailDomainProver.emailSubstr[i] <== jwt.emailSubstrUtf8Bytes[i];
        emailDomainProver.domainName[i] <== domainName[i];
    }

    emailDomainProver.numDomainBytes <== numDomainBytes;
    emailDomainProver.emailNameStartPos <== emailNameStartPos;
    emailDomainProver.emailValueEndPos <== emailValueEndPos;
    emailDomainProver.numSpacesBeforeColon <== numSpacesBeforeColon;
    emailDomainProver.numSpacesAfterColon <== numSpacesAfterColon;
}

template JwtProver(numPreimageB64PaddedBytes, numEmailSubstrB64Bytes) {
    // - numPreimageB64PaddedBytes is the number of bytes of the
    // base64url-encoded preimage, as a multiple of 64.
    // - numEmailSubstrB64Bytes is the number of bytes of the substring of the
    //   UTF-8 encoded preimage which contains the string "email":"..@.."

    signal private input preimageB64[numPreimageB64PaddedBytes];
    signal private input emailSubstrB64[numEmailSubstrB64Bytes];
    signal private input emailSubstrBitIndex;
    signal private input emailSubstrBitLength;
    signal private input expectedHash[2];
    signal output emailSubstrUtf8Bytes[numEmailSubstrB64Bytes * 6 / 8];

    // TODO: check that the (base64) `.` character shows up before
    // emailSubStrB64

    // ------------------------------------------------------------------------
    // 1. Accept and check a shorter array of elements that represent the email
    // substring

    component ssm = SubstringMatcher(numPreimageB64PaddedBytes, numEmailSubstrB64Bytes);
    for (var i = 0; i < numPreimageB64PaddedBytes; i ++) {
        ssm.a[i] <== preimageB64[i];
    }

    for (var i = 0; i < numEmailSubstrB64Bytes; i ++) {
        ssm.b[i] <== emailSubstrB64[i];
    }

    ssm.out === 1;

    // ------------------------------------------------------------------------
    // 2. Convert emailSubstrB64 to bits 
    component emailDecoders[numEmailSubstrB64Bytes]; 
    for (var i = 0; i < numEmailSubstrB64Bytes; i ++) {
        emailDecoders[i] = Base64Decoder();
        emailDecoders[i].in <== emailSubstrB64[i];
    }

    signal emailSubstrBits[numEmailSubstrB64Bytes * 6];
    for (var i = 0; i < numEmailSubstrB64Bytes; i ++) {
        for (var j = 0; j < 6; j ++) {
            emailSubstrBits[j + i * 6] <== emailDecoders[i].out[j];
        }
    }

    // ------------------------------------------------------------------------
    // 3. Slice emailSubstrBits
    component emailSlicer = Slicer(numEmailSubstrB64Bytes * 6);
    emailSlicer.startIndex <== emailSubstrBitIndex;
    emailSlicer.len <== emailSubstrBitLength;
    for (var i = 0; i < numEmailSubstrB64Bytes * 6; i ++) {
        emailSlicer.in[i] <== emailSubstrBits[i];
    }

    // ------------------------------------------------------------------------
    // 4. Convert emailSubstrBits to bytes
    component emailB2n[numEmailSubstrB64Bytes * 6 / 8];
    for (var i = 0; i < numEmailSubstrB64Bytes * 6 / 8; i ++) {
        emailB2n[i] = Bits2Num(8);
        for (var j = 0; j < 8 ; j ++) {
            emailB2n[i].in[7 - j] <== emailSlicer.out[j + i * 8];
        }
    }

    for (var i = 0; i < numEmailSubstrB64Bytes * 6 / 8; i ++) {
        emailSubstrUtf8Bytes[i] <== emailB2n[i].out;
    }

    // ------------------------------------------------------------------------
    // 6. Check that the SHA256 hash of the base64url-encoded preimage is
    // correct
    component plaintextToBits[numPreimageB64PaddedBytes];
    for (var i = 0; i < numPreimageB64PaddedBytes; i ++) {
        plaintextToBits[i] = Num2Bits(8);
        plaintextToBits[i].in <== preimageB64[i];
    }

    component sha256 = Sha256Hasher(numPreimageB64PaddedBytes * 8);
    for (var i = 0; i < numPreimageB64PaddedBytes; i ++) {
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
}
