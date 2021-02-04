import { genWitness, getSignalByName } from './utils'
const ff = require('ffjavascript')
const stringifyBigInts: (obj: object) => any = ff.utils.stringifyBigInts
jest.setTimeout(90000)

const circuit = 'range_test'

describe('The IsInrange circuit', () => {
    it('Should output 1 if a value is in range', async () => {
        const input: BigInt[] = [BigInt(2), BigInt(3)]
        const index = 2

        const circuitInputs = stringifyBigInts({
            'in': input,
            index,
        })

        const witness = await genWitness(circuit, circuitInputs)
        const out = await getSignalByName(circuit, witness, 'main.out')
        expect(out.toString()).toEqual('1')
    })
    it('Should output 1 if a value is in range', async () => {
        const input: BigInt[] = [BigInt(2), BigInt(5)]
        const index = 2

        const circuitInputs = stringifyBigInts({
            'in': input,
            index,
        })

        const witness = await genWitness(circuit, circuitInputs)
        const out = await getSignalByName(circuit, witness, 'main.out')
        expect(out.toString()).toEqual('1')
    })

    it('Should output 1 if a value is in range', async () => {
        const input: BigInt[] = [BigInt(2), BigInt(5)]
        const index = 3

        const circuitInputs = stringifyBigInts({
            'in': input,
            index,
        })

        const witness = await genWitness(circuit, circuitInputs)
        const out = await getSignalByName(circuit, witness, 'main.out')
        expect(out.toString()).toEqual('1')
    })

    it('Should output 0 if a value is not in range', async () => {
        const input: BigInt[] = [BigInt(2), BigInt(5)]
        const index = 1

        const circuitInputs = stringifyBigInts({
            'in': input,
            index,
        })

        const witness = await genWitness(circuit, circuitInputs)
        const out = await getSignalByName(circuit, witness, 'main.out')
        expect(out.toString()).toEqual('0')
    })

    it('Should output 0 if a value is not in range', async () => {
        const input: BigInt[] = [BigInt(2), BigInt(5)]
        const index = 5

        const circuitInputs = stringifyBigInts({
            'in': input,
            index,
        })

        const witness = await genWitness(circuit, circuitInputs)
        const out = await getSignalByName(circuit, witness, 'main.out')
        expect(out.toString()).toEqual('0')
    })
})
