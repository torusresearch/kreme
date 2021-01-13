import { plaintextToChunks, plaintext2paddedBitArray } from '../'
import { genWitness, getSignalByName } from './utils'
const ff = require('ffjavascript')
const stringifyBigInts: (obj: object) => any = ff.utils.stringifyBigInts
jest.setTimeout(90000)

const circuit = 'emailDomainProver'
const domain = 'company.xyz'
const plaintext = `{"email": "alice@${domain}"}`
const CHUNK_LENGTH = 248

describe('JSON field prover for an email domain name', () => {
    it('Should prove the existence of a domain name in the correct position', async () => {
        let p = BigInt(
            '0x' + Buffer.from(plaintext, 'utf-8').toString('hex'),
        ).toString(2)
        while (p.length % 8 !== 0) {
            p = '0' + p
        }
        const paddingBitsLength = 254 - p.length 

        const circuitInputs = stringifyBigInts({
            plaintext: p,
            numSpacesBeforeColon: 0,
            numSpacesAfterColon: 0,
            numDomainNameBytes: domain.length,
            emailNameEndPos: 28,
            emailNameStartPos: 1,
            paddingBitsLength,
        })

        const witness = await genWitness(circuit, circuitInputs)
    })
})
