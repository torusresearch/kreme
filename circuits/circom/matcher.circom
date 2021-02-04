include "../node_modules/circomlib/circuits/comparators.circom";

// Given two input signal arrays, output 1 if they match, and 0 if they do not.
// Example 1:
// - in[0] = [1, 2, 3, 4, 5]
// - in[1] = [1, 2, 3, 4, 5]
// - out = 1

// Example 2:
// - in[0] = [5, 4, 3, 2, 1]
// - in[1] = [1, 2, 3, 4, 5]
// - out = 0

template Matcher(length) {
    signal input in[2][length];
    signal output out;

    signal runningTotal[length + 1];
    runningTotal[0] <== 1;
    component isEq[length];
    for (var i = 0; i < length; i ++) {
        isEq[i] = IsEqual();
        isEq[i].in[0] <== in[0][i];
        isEq[i].in[1] <== in[1][i];

        runningTotal[i+1] <== isEq[i].out * runningTotal[i];
    }
    out <== runningTotal[length];
}
