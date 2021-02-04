jest.setTimeout(90000)
import * as crypto from 'crypto'
import { genWitness, getSignalByName } from './utils'
import { strToSha256PaddedBitArr, buffer2bitArray, genSubstrByteArr, strToByteArr } from '../'
const ff = require('ffjavascript')
const stringifyBigInts: (obj: object) => any = ff.utils.stringifyBigInts

describe('SHA256', () => {
    describe('Sha256Padder', () => {
        const circuit = 'sha256Padder_test'

        it('Should generate the correct padded input', async () => {
            const plaintext = 'abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq'

            const paddedBits = strToSha256PaddedBitArr(plaintext)

            const input = buffer2bitArray(Buffer.from(plaintext, 'utf8'))
            const circuitInputs = stringifyBigInts({
                'in': input,
            })
            const witness = await genWitness(circuit, circuitInputs)

            const outLen = await getSignalByName(circuit, witness, `main.outLen`)
            let result = ''
            for (let i = 0; i < outLen; i ++) {
                const out = await getSignalByName(circuit, witness, `main.out[${i}]`)
                result += out
            }

            expect(result).toEqual(paddedBits)
        })
    })

    describe('Sha256Hasher', () => {
        const circuit = 'sha256Hasher_test'

        it('Should generate the correct hash', async () => {
            const plaintext = 'abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq'

            const paddedBits = strToSha256PaddedBitArr(plaintext)

            const circuitInputs = stringifyBigInts({
                'paddedIn': paddedBits.split(''),
            })
            const witness = await genWitness(circuit, circuitInputs)
            let result = ''
            for (let i = 0; i < 256; i ++) {
                const out = await getSignalByName(circuit, witness, `main.out[${i}]`)
                result += out
            }
        
            const resultHex = BigInt('0b' + result).toString(16)
            const hash = crypto.createHash("sha256")
                .update(Buffer.from(plaintext, "utf8"))
                .digest("hex");
            expect(resultHex).toEqual(hash)
        })
    })
})
