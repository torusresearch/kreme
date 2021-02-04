include "../node_modules/circomlib/circuits/mux1.circom";
include "../node_modules/circomlib/circuits/comparators.circom";
include "./calculateTotal.circom";

// Given an input signal array A and another input signal array B where len(B)
// < len(A) output 1 if B is a substring of A, and 0 otherwise.
// For example:
// - A = [1, 2, 3, 4, 5]
// - B = [2, 3]
// - out = 1

template SubstringMatcher(lengthA, lengthB) {
    var lengthInBits = 2;
    while(2 ** lengthInBits < (lengthA - lengthB)) {
        lengthInBits ++;
    }

    signal input a[lengthA];
    signal input b[lengthB];
    signal output out;

    component lenCheck = LessEqThan(32);
    lenCheck.in[0] <== lengthB;
    lenCheck.in[1] <== lengthA;
    lenCheck.out === 1;

    var c = lengthA - lengthB + 1;

    component eqs[c][lengthB];
    component subtotals[c];

    for (var i = 0; i < c; i ++) {
        subtotals[i] = CalculateTotal(lengthB);
        for (var j = 0; j < lengthB; j ++) {
            eqs[i][j] = IsEqual();
            eqs[i][j].in[0] <== a[i + j];
            eqs[i][j].in[1] <== b[j];
            subtotals[i].nums[j] <== eqs[i][j].out;
        }
    }

    component total = CalculateTotal(c);
    component eq2[c];

    for (var i = 0; i < c; i ++) {
        eq2[i] = IsEqual();
        eq2[i].in[0] <== subtotals[i].sum;
        eq2[i].in[1] <== lengthB;
        total.nums[i] <== eq2[i].out;
    }

    component eq3 = GreaterEqThan(lengthInBits);
    eq3.in[0] <== total.sum;
    eq3.in[1] <== 1;
    out <== eq3.out;
}

