import { genWitness, getSignalByName } from './utils'
const ff = require('ffjavascript')
const stringifyBigInts: (obj: object) => any = ff.utils.stringifyBigInts
jest.setTimeout(90000)

const circuit = 'slicer_test'

describe('The Slicer circuit', () => {
    it('Should reject an invalid startIndex', async () => {
        expect.assertions(1)
        const input: BigInt[] = []
        const len = 2

        for (let i = 0; i < 8; i ++) {
            input.push(BigInt(i))
        }
        const circuitInputs = stringifyBigInts({
            'in': input,
            startIndex: input.length,
            len,
        })

        try {
            await genWitness(circuit, circuitInputs)
        } catch {
            expect(true).toBeTruthy()
        }
    })

    it('Should reject an invalid len', async () => {
        expect.assertions(1)
        const input: BigInt[] = []
        const len = 2

        for (let i = 0; i < 8; i ++) {
            input.push(BigInt(i))
        }
        const circuitInputs = stringifyBigInts({
            'in': input,
            startIndex: 1,
            len: input.length,
        })

        try {
            await genWitness(circuit, circuitInputs)
        } catch {
            expect(true).toBeTruthy()
        }
    })

    it('Should pick out the right field elements', async () => {
        const input: BigInt[] = [0, 1, 2, 3, 4, 5, 6, 7].map((x) => BigInt(x))
        const startIndex = 1
        const len = 2

        const circuitInputs = stringifyBigInts({
            'in': input,
            startIndex,
            len,
        })

        const witness = await genWitness(circuit, circuitInputs)
        expect(witness.length > 0).toBeTruthy()

        let outAsStr = ''
        for (let i = 0; i < input.length; i ++) {
            const out = await getSignalByName(circuit, witness, `main.out[${i}]`)
            outAsStr += out + ', '
        }
        expect(outAsStr).toEqual('0, 0, 0, 0, 0, 0, 1, 2, ')
    })
})
