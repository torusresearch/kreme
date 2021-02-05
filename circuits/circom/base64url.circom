include "../node_modules/circomlib/circuits/mux1.circom";
include "../node_modules/circomlib/circuits/bitify.circom";
include "../node_modules/circomlib/circuits/comparators.circom";

/*
 * Given an input field element, which should be within the base64url character
 * set, return its 6-bit representation
 */
template Base64Decoder() {
    signal input in;
    signal output out[6];

    var values[64] = [
        0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
        10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
        20, 21, 22, 23, 24, 25, 26, 27, 28, 29,
        30, 31, 32, 33, 34, 35, 36, 37, 38, 39,
        40, 41, 42, 43, 44, 45, 46, 47, 48, 49,
        50, 51, 52, 53, 54, 55, 56, 57, 58, 59,
        60, 61, 62, 63
    ];

    var encodings[64] = [
        0x41, 0x42, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4a, // A - J
        0x4b, 0x4c, 0x4d, 0x4e, 0x4f, 0x50, 0x51, 0x52, 0x53, 0x54, // K - T
        0x55, 0x56, 0x57, 0x58, 0x59, 0x5a, // U - Z
        0x61, 0x62, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6a, // a - j
        0x6b, 0x6c, 0x6d, 0x6e, 0x6f, 0x70, 0x71, 0x72, 0x73, 0x74, // k - t
        0x75, 0x76, 0x77, 0x78, 0x79, 0x7a, // u - z
        0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, // 0 - 9
        0x2d, // - (minus)
        0x5f  // _ (underscore)
    ];

    component eq[64];
    component mux[64];
    component n2b[64];
    signal results[65][6];

    for (var i = 0; i < 6; i++) {
        results[0][i] <== 0;
    }

    for (var i = 0; i < 64; i ++) {
        eq[i] = IsEqual();
        eq[i].in[0] <== in;
        eq[i].in[1] <== encodings[i];

        mux[i] = Mux1();
        mux[i].s <== eq[i].out;
        mux[i].c[0] <== 0;
        mux[i].c[1] <== values[i];

        n2b[i] = Num2Bits(6);
        n2b[i].in <== mux[i].out;

        for (var j = 0; j < 6; j++) {
            results[i + 1][5 - j] <== results[i][5 - j] + n2b[i].out[j];
        }
    }

    for (var i = 0; i < 6; i ++) {
        out[i] <== results[64][i];
    }
}
