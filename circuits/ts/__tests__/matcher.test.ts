import { genWitness, getSignalByName } from './utils'
const ff = require('ffjavascript')
const stringifyBigInts: (obj: object) => any = ff.utils.stringifyBigInts
jest.setTimeout(90000)

const circuit = 'matcher_test'

describe('The Matcher circuit', () => {
    it('Should output 0 if the input arrays do not match', async () => {
        const input: BigInt[] = [0, 1, 2, 3, 4, 5, 6, 7].map((x) => BigInt(x))
        const input2: BigInt[] = [7, 6, 5, 3, 2, 2, 1, 0].map((x) => BigInt(x))
        const circuitInputs = stringifyBigInts({
            in: [input, input2],
        })

        const witness = await genWitness(circuit, circuitInputs)
        const out = await getSignalByName(circuit, witness, 'main.out')
        expect(out.toString()).toEqual('0')
    })

    it('Should output 1 if the input arrays match', async () => {
        const input: BigInt[] = [0, 1, 2, 3, 4, 5, 6, 7].map((x) => BigInt(x))
        const circuitInputs = stringifyBigInts({
            in: [input, input],
        })

        const witness = await genWitness(circuit, circuitInputs)
        const out = await getSignalByName(circuit, witness, 'main.out')
        expect(out.toString()).toEqual('1')
    })
})
