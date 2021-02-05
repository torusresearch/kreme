import { genWitness, getSignalByName } from './utils'
import base64url from 'base64url' 
const ff = require('ffjavascript')
const stringifyBigInts: (obj: object) => any = ff.utils.stringifyBigInts
jest.setTimeout(90000)


describe('The Base64Decoder circuit', () => {
    const circuit = 'base64url_test'
    it('Should return valid values for each possible input value (A-Za-z0-9-_)', async () => {
        const encodings: number[] = [
            0x41, 0x42, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4a, // A - J
            0x4b, 0x4c, 0x4d, 0x4e, 0x4f, 0x50, 0x51, 0x52, 0x53, 0x54, // K - T
            0x55, 0x56, 0x57, 0x58, 0x59, 0x5a, // U - Z
            0x61, 0x62, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6a, // a - j
            0x6b, 0x6c, 0x6d, 0x6e, 0x6f, 0x70, 0x71, 0x72, 0x73, 0x74, // k - t
            0x75, 0x76, 0x77, 0x78, 0x79, 0x7a, // u - z
            0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, // 0 - 9
            0x2d, // - (minus)
            0x5f  // _ (underscore)
        ];

        for (let i = 0; i < encodings.length; i ++) {
            const c = Buffer.from(encodings[i].toString(16), 'hex').toString()
            const expectedValue = base64url.decode(c + '=')

            const circuitInputs = stringifyBigInts({
                in: encodings[i]
            })
            const witness = await genWitness(circuit, circuitInputs)
            let outBits = '00'
            for (let j = 0; j < 6; j ++) {
                const out = await getSignalByName(circuit, witness, `main.out[${j}]`)
                outBits += out
            }
            expect(BigInt('0b' + outBits).toString()).toEqual(i.toString())
        }
    })
})
