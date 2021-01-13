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

template Range(lengthInBits) {
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
    eq[0] <== lt.out + gte.out;
    eq[1] <== 0;

    out <== eq.out;
}

template Slicer(length) {
    var lengthInBits = 2;
    while(2 ** lengthInBits < length) {
        lengthInBits ++;
    }

    signal private input in[length];
    signal output out[length];
    // TODO: document the maximum slice length
    signal input len;

    signal input startIndex;

    // Ensure that len <= length
    component lenCheck = LessThan(lengthInBits);
    lenCheck.in[0] <== len;
    lenCheck.in[1] <== length;
    lenCheck.out === 1;

    // Ensure that startIndex + len < length
    component indexCheck = LessThan(lengthInBits);
    indexCheck.in[0] <== startIndex + len;
    indexCheck.in[1] <== length;
    indexCheck.out === 1;

    component muxes[length];
    component lts[length];
    component selectors[length];

    for (var i = 0; i < length; i ++) {
        selectors[i] = Selector(length);
        for (var j = 0; j < length; j++) {
            selectors[i].in[j] <== in[j];
        }
        selectors[i].index <== i - (length - startIndex - len);

        // if i < length - len, assign 0 to out[i]
        // otherwise, assign Selector(in, length - startIndex - len - 1 - i)
        lts[i] = LessThan(lengthInBits);
        lts[i].in[0] <== length - len - 1;
        lts[i].in[1] <== i;

        muxes[i] = Mux1();
        muxes[i].s <== lts[i].out;
        muxes[i].c[0] <== 0;
        muxes[i].c[1] <== selectors[i].out;

        out[i] <== muxes[i].out;
    }
}
