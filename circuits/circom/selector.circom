include "../node_modules/circomlib/circuits/bitify.circom";
include "../node_modules/circomlib/circuits/comparators.circom";

// Given an input signal array and an index, output the element at the index
// For example:
// - input = [1, 2, 3, 4, 5]
// - index = 1
// - output = 2

template Selector(length) {
    signal input in[length];
    signal output out;

    // Assumes that index < length
    signal input index;

    signal runningTotal[length + 1];
    runningTotal[0] <== 0;

    component eqs[length];
    for (var i = 0; i < length; i ++) {
        eqs[i] = IsEqual();
        eqs[i].in[0] <== i;
        eqs[i].in[1] <== index;
        runningTotal[i + 1] <== eqs[i].out * in[i] + runningTotal[i];
    }
    out <== runningTotal[length];
}
