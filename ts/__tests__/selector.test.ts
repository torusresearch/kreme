import { genWitness, getSignalByName } from './utils'
const ff = require('ffjavascript')
const stringifyBigInts: (obj: object) => any = ff.utils.stringifyBigInts
jest.setTimeout(90000)

const circuit = 'selector_test'

describe('The Selector circuit', () => {
    it('Should pick out the right field element', async () => {
        const input: BigInt[] = []
        const index = 2

        for (let i = 0; i < 32; i ++) {
            input.push(BigInt(i))
        }
        const circuitInputs = stringifyBigInts({
            'in': input,
            index,
        })

        const witness = await genWitness(circuit, circuitInputs)
        const out = await getSignalByName(circuit, witness, 'main.out')
        expect(out.toString()).toEqual(index.toString())
    })
})
