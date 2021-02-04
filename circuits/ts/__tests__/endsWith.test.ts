import { genWitness, getSignalByName } from './utils'
const ff = require('ffjavascript')
const stringifyBigInts: (obj: object) => any = ff.utils.stringifyBigInts
jest.setTimeout(90000)

const circuit = 'endsWith_test'

describe('The EndsWith circuit', () => {
    it('Should return 1 with valid inputs', async () => {
        const a: number[] = [0, 1, 2, 3, 4]
        const b: number[] = [0, 0, 0, 3, 4]

        const circuitInputs = stringifyBigInts({
            'in': a,
            target: b,
            targetLen: 2,
        })
        const witness = await genWitness(circuit, circuitInputs)
        expect(witness.length > 0).toBeTruthy()
        const out = await getSignalByName(circuit, witness, `main.out`)
        expect(out).toEqual('1')
    })

    it('Should return 0 with invalid inputs', async () => {
        const a: number[] = [0, 1, 2, 3, 4]
        const b: number[] = [0, 0, 0, 2, 4]

        const circuitInputs = stringifyBigInts({
            'in': a,
            target: b,
            targetLen: 2,
        })
        const witness = await genWitness(circuit, circuitInputs)
        expect(witness.length > 0).toBeTruthy()
        const out = await getSignalByName(circuit, witness, `main.out`)
        expect(out).toEqual('0')
    })
})
