include "../node_modules/circomlib/circuits/bitify.circom";
include "../node_modules/circomlib/circuits/comparators.circom";
include "../node_modules/circomlib/circuits/mux1.circom";
include "./calculateTotal.circom";

// Given an input signal array and a target signal array, output 1 if the
// latter matches the former at its tail end, and 0 otherwise.

// For example:
// - input  = [1, 2, 3, 4, 5]
// - target = [0, 0, 0, 4, 5]
// - targetLen = 2
// - output = 1

// Another example:
// - input  = [1, 2, 3, 4, 5]
// - target = [0, 0, 0, 3, 5]
// - targetLen = 2
// - output = 0

template EndsWith(length) {
    var lengthInBits = 2;
    while(2 ** lengthInBits < length) {
        lengthInBits ++;
    }

    signal input in[length];
    signal input target[length];
    signal input targetLen;
    signal output out;

    // Ensure that targetLen <= length
    component lengthChecker = LessEqThan(32);
    lengthChecker.in[0] <== targetLen;
    lengthChecker.in[1] <== length;
    lengthChecker.out === 1;

    component lt[length];
    component muxes[length];
    component eqs[length];

    component total = CalculateTotal(length);

    for (var i = 0; i < length; i ++) {
        lt[i] = LessThan(lengthInBits);
        lt[i].in[0] <== i;
        lt[i].in[1] <== length - targetLen;

        eqs[i] = IsEqual();
        eqs[i].in[0] <== in[i];
        eqs[i].in[1] <== target[i];

        muxes[i] = Mux1();
        muxes[i].s <== lt[i].out;
        muxes[i].c[0] <== eqs[i].out;
        muxes[i].c[1] <== 0;

        total.nums[i] <== muxes[i].out;
    }

    component res = IsEqual();
    res.in[0] <== total.sum;
    res.in[1] <== targetLen;
    out <== res.out;
}
