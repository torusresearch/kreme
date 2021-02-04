include "../node_modules/circomlib/circuits/bitify.circom";
include "../node_modules/circomlib/circuits/mux1.circom";
include "../node_modules/circomlib/circuits/comparators.circom";
include "./selector.circom";

// Given an input signal array, a starting index, and a length, output the
// elements of the input array starting from the index. The output array has
// the same length as the input array, but the slice will occupy the rightmost
// elements (aka the padding is 0).
// For example:
// - input = [1, 2, 3, 4, 5]
// - length = 2
// - startIndex = 1
// - output = [0, 0, 0, 2, 3]

template IsInRange(lengthInBits) {
    signal input in[2];
    signal input index;
    signal output out;

    component lt = LessThan(lengthInBits);
    lt.in[0] <== index;
    lt.in[1] <== in[0];
    
    component gte = GreaterEqThan(lengthInBits);
    gte.in[0] <== index;
    gte.in[1] <== in[1];

    component eq = IsEqual();
    eq.in[0] <== lt.out + gte.out;
    eq.in[1] <== 0;

    out <== eq.out;
}
