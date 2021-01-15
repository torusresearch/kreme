include "../node_modules/circomlib/circuits/bitify.circom";
include "../node_modules/circomlib/circuits/mux1.circom";
include "../node_modules/circomlib/circuits/comparators.circom";
include "./selector.circom";

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
