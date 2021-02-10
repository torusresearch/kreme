include "../node_modules/circomlib/circuits/sha256/sha256.circom";
include "../node_modules/circomlib/circuits/bitify.circom";
include "./sha256Hasher.circom";
include "./slicer.circom";
include "./emailDomainProver.circom";
include "./substringMatcher.circom";
include "./base64url.circom";

template JwtProver(numPreimageB64PaddedBytes, numEmailSubstrB64Bytes) {
    // - numPreimageB64PaddedBytes is the number of bytes of the
    // base64url-encoded preimage, as a multiple of 64.
    // - numEmailSubstrB64Bytes is the number of bytes of the substring of the
    //   UTF-8 encoded preimage which contains the string "email":"..@.."

    signal private input preimageB64[numPreimageB64PaddedBytes];

    // TODO: check that the (base64) `.` character shows up before
    // emailSubStrB64

    // ------------------------------------------------------------------------
    // 1. Accept and check a shorter array of elements that represent the email
    // substring

    signal private input emailSubstrB64[numEmailSubstrB64Bytes];
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
    signal private input emailSubstrBitIndex;
    signal private input emailSubstrBitLength;
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

    /*signal output debug[numEmailSubstrB64Bytes * 6 / 8];*/
    /*for (var i = 0; i < numEmailSubstrB64Bytes * 6 / 8; i ++) {*/
        /*debug[i] <== emailB2n[i].out;*/
    /*}*/

    // ------------------------------------------------------------------------
    // 5. Check the domain name
    signal input domainName[numEmailSubstrB64Bytes * 6 / 8];
    signal input numDomainBytes;
    signal private input emailNameStartPos;
    signal private input emailValueEndPos;
    signal input numSpacesBeforeColon;
    signal input numSpacesAfterColon;

    component emailDomainProver = EmailDomainProver(numEmailSubstrB64Bytes * 6 / 8);
    for (var i = 0; i < numEmailSubstrB64Bytes * 6 / 8; i ++) {
        emailDomainProver.emailSubstr[i] <== emailB2n[i].out;
        emailDomainProver.domainName[i] <== domainName[i];
    }

    emailDomainProver.numDomainBytes <== numDomainBytes;
    emailDomainProver.emailNameStartPos <== emailNameStartPos;
    emailDomainProver.emailValueEndPos <== emailValueEndPos;
    emailDomainProver.numSpacesBeforeColon <== numSpacesBeforeColon;
    emailDomainProver.numSpacesAfterColon <== numSpacesAfterColon;

    // ------------------------------------------------------------------------
    // 6. Check that the SHA256 hash of the base64url-encoded preimage is
    // correct
    signal private input expectedHash[2];
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
