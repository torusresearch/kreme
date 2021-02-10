jest.setTimeout(90000)
import { hashBytes, genRandomSalt } from 'kreme-crypto'
import { genWitness, getSignalByName } from './utils'
const ff = require('ffjavascript')
const stringifyBigInts: (obj: object) => any = ff.utils.stringifyBigInts

const LEN = 64
describe('ByteHasher', () => {
    const circuit = 'byteHasher_test'

    it('Should generate the correct hash', async () => {
        const bytes: BigInt[] = []

        for (let i = 0; i < LEN; i ++) {
            bytes.push(BigInt(i))
        }
        const salt = BigInt(1234)
        const expectedHash = hashBytes(bytes, salt)

        const circuitInputs = stringifyBigInts({
            'in': bytes,
            salt
        })

        const witness = await genWitness(circuit, circuitInputs)
        const hash = await getSignalByName(circuit, witness, `main.hash`)

        expect(hash).toEqual(expectedHash.toString())
    })

    it('Should generate the correct hash (random inputs)', async () => {
        const bytes: BigInt[] = []

        for (let i = 0; i < LEN; i ++) {
            bytes.push(genRandomSalt() % BigInt(256))
        }
        const salt = genRandomSalt()
        const expectedHash = hashBytes(bytes, salt)

        const circuitInputs = stringifyBigInts({
            'in': bytes,
            salt
        })

        const witness = await genWitness(circuit, circuitInputs)
        const hash = await getSignalByName(circuit, witness, `main.hash`)

        expect(hash).toEqual(expectedHash.toString())
    })
})
