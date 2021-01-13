import * as assert from 'assert'
import { plaintextToChunks, plaintext2paddedBitArray } from '../'
import { genWitness, getSignalByName } from './utils'
const ff = require('ffjavascript')
const stringifyBigInts: (obj: object) => any = ff.utils.stringifyBigInts
jest.setTimeout(90000)

const circuit = 'emailDomainProver_test'
const domain = 'company.xyz'
const plaintext = `{"email": "alice@${domain}"}`

const strToByteArr = (str: string, len: number): BigInt[] => {
    assert(len >= str.length)
    const result: BigInt[] = []
    for (let i = 0; i < len; i ++) {
        result.push(BigInt(0))
    }
    for (let i = 0; i < str.length; i ++) {
        const c = str[i]
        const b = BigInt('0x' + Buffer.from(c).toString('hex'))
        result[len - i - 1] = b
    }
    return result
}

describe('JSON field prover for an email domain name', () => {
    let circuitInputs
    beforeAll(() => {
        const p = strToByteArr(plaintext, 64)
        const domainName = strToByteArr(domain, 64)

        circuitInputs = stringifyBigInts({
            plaintext: p,
            domainName,
            emailValueEndPos: 28,
            emailNameStartPos: 1,
            numSpacesBeforeColon: 0,
            numSpacesAfterColon: 0,
        })
    })

    it('Should prove the existence of a domain name in the correct position', async () => {
        const witness = await genWitness(circuit, circuitInputs)
        expect(witness.length > 0).toBeTruthy()
    })
})
