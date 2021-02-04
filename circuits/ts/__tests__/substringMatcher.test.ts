import { genWitness, getSignalByName } from './utils'
const ff = require('ffjavascript')
const stringifyBigInts: (obj: object) => any = ff.utils.stringifyBigInts
jest.setTimeout(90000)

const circuit = 'substringMatcher_test'

describe('The SubstringMatcher circuit', () => {
    it('Should return 1 with valid inputs', async () => {
        const a: number[] = [0, 1, 2, 3, 4]
        const b: number[] = [0, 1]

        const circuitInputs = stringifyBigInts({
            a,
            b,
        })
        const witness = await genWitness(circuit, circuitInputs)
        expect(witness.length > 0).toBeTruthy()
        const out = await getSignalByName(circuit, witness, `main.out`)
        expect(out).toEqual('1')
    })

    it('Should return 1 with valid inputs', async () => {
        const a: number[] = [0, 1, 2, 3, 4]
        const b: number[] = [1, 2]

        const circuitInputs = stringifyBigInts({
            a,
            b,
        })
        const witness = await genWitness(circuit, circuitInputs)
        expect(witness.length > 0).toBeTruthy()
        const out = await getSignalByName(circuit, witness, `main.out`)
        expect(out).toEqual('1')
    })

    it('Should return 1 with valid inputs', async () => {
        const a: number[] = [0, 1, 2, 3, 4]
        const b: number[] = [2, 3]

        const circuitInputs = stringifyBigInts({
            a,
            b,
        })
        const witness = await genWitness(circuit, circuitInputs)
        expect(witness.length > 0).toBeTruthy()
        const out = await getSignalByName(circuit, witness, `main.out`)
        expect(out).toEqual('1')
    })

    it('Should return 1 with valid inputs', async () => {
        const a: number[] = [0, 1, 2, 3, 4]
        const b: number[] = [3, 4]

        const circuitInputs = stringifyBigInts({
            a,
            b,
        })
        const witness = await genWitness(circuit, circuitInputs)
        expect(witness.length > 0).toBeTruthy()
        const out = await getSignalByName(circuit, witness, `main.out`)
        expect(out).toEqual('1')
    })

    it('Should return 1 with valid inputs', async () => {
        const a: number[] = [1, 1, 2, 3, 4]
        const b: number[] = [1, 1]

        const circuitInputs = stringifyBigInts({
            a,
            b,
        })
        const witness = await genWitness(circuit, circuitInputs)
        expect(witness.length > 0).toBeTruthy()
        const out = await getSignalByName(circuit, witness, `main.out`)
        expect(out).toEqual('1')
    })

    it('Should return 1 with valid inputs', async () => {
        const a: number[] = [1, 2, 1, 2, 4]
        const b: number[] = [1, 2]

        const circuitInputs = stringifyBigInts({
            a,
            b,
        })
        const witness = await genWitness(circuit, circuitInputs)
        expect(witness.length > 0).toBeTruthy()
        const out = await getSignalByName(circuit, witness, `main.out`)
        expect(out).toEqual('1')
    })

    it('Should return 0 with invalid inputs', async () => {
        const a: number[] = [0, 1, 2, 3, 4]
        const b: number[] = [4, 0]

        const circuitInputs = stringifyBigInts({
            a,
            b,
        })
        const witness = await genWitness(circuit, circuitInputs)
        expect(witness.length > 0).toBeTruthy()
        const out = await getSignalByName(circuit, witness, `main.out`)
        expect(out).toEqual('0')
    })

    it('Should return 0 with invalid inputs', async () => {
        const a: number[] = [0, 1, 2, 3, 4]
        const b: number[] = [2, 1]

        const circuitInputs = stringifyBigInts({
            a,
            b,
        })
        const witness = await genWitness(circuit, circuitInputs)
        expect(witness.length > 0).toBeTruthy()
        const out = await getSignalByName(circuit, witness, `main.out`)
        expect(out).toEqual('0')
    })
})
