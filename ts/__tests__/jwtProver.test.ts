jest.setTimeout(90000)
import * as assert from 'assert'
import * as fs from 'fs'
import { 
    sha256BufferToHex,
    strToSha256PaddedBitArr,
    buffer2bitArray,
    bitArray2buffer,
    genSubstrByteArr,
    strToByteArr,
} from '../'

import * as crypto from 'crypto'
import { genWitness, getSignalByName } from './utils'
const ff = require('ffjavascript')
const stringifyBigInts: (obj: object) => any = ff.utils.stringifyBigInts

const circuit = 'jwtProver_test'
const NUM_BYTES = 320
const NUM_EMAIL_SUBSTR_BYTES = 64

describe('JWTProver circuit', () => {
    it('Should prove the existence of a domain name in the correct position and verify the hash', async () => {
        const domain = '@company.xyz"'
        const plaintext = `{"blah": 123, "email" : "alice${domain}, ` +
            `"foo": "bar bar bar bar bar bar bar bar barbar bar bar bar ` +
            `bar bar bar bar bar bar bar bar bar bar bar bar bar bar bar ` +
            `bar bar bar bar bar bar bar bar bar bar bar bar bar bar bar ` +
            `bar bar  bar bar bar bar bar bar bar bar bar "}`

        // Pads the plaintext using RFC4634, section 4.1
        const paddedBits = strToSha256PaddedBitArr(plaintext)
        expect(paddedBits.length).toEqual(320 * 8)

        const b = Buffer.from(plaintext, 'utf8')
        const expectedHash = crypto.createHash('sha256')
            .update(b)
            .digest('hex')
        const expectedHashBuf = Buffer.from(expectedHash, 'hex')

        const email = `"email" : "alice${domain}`
        const p: BigInt[] = []
        for (var i = 0; i < paddedBits.length / 8; i ++) {
            const b = BigInt('0b' + paddedBits.slice(i * 8, i * 8 + 8))
            p.push(b)
        }

        //const witness = await genWitness(circuit, circuitInputs)
        const domainName = strToByteArr(domain, NUM_EMAIL_SUBSTR_BYTES)
        const numDomainBytes = Buffer.from(domain).length
        const emailSubstr = genSubstrByteArr(
            plaintext,
            email,
            NUM_BYTES,
            NUM_EMAIL_SUBSTR_BYTES,
        )
        const emailNameStartPos = 0
        const numSpacesBeforeColon = 1
        const numSpacesAfterColon = 1
        const emailValueEndPos = emailNameStartPos + 7 + numSpacesBeforeColon + 1 +
            numSpacesAfterColon + numDomainBytes + 'alice@'.length - 1

        const byteArrAsHex = (s) => s.map((x) => x.toString(16)).join('')

        console.log(
            'plaintext:', byteArrAsHex(p), '\n',
            'emailSubstr:', byteArrAsHex(emailSubstr), '\n',
            'domainName:', byteArrAsHex(domainName),
        )

        expect(emailSubstr[emailNameStartPos].toString()).toEqual(Buffer.from('"')[0].toString())
        expect(emailSubstr[emailNameStartPos + 6].toString()).toEqual(Buffer.from('"')[0].toString())
        const circuitInputs = stringifyBigInts({
            plaintext: p,
            emailSubstr,
            domainName,
            emailNameStartPos,
            emailValueEndPos,
            numSpacesBeforeColon,
            numSpacesAfterColon,
            numDomainBytes,
            expectedHash: [
                BigInt('0x' + expectedHashBuf.slice(0, 16).toString('hex')),
                BigInt('0x' + expectedHashBuf.slice(16, 32).toString('hex')),
            ],
        })
        const start = Date.now()
        const witness = await genWitness(circuit, circuitInputs)
        const end = Date.now()
        const duration = (end - start) / 1000
        console.log('Witness generation took', duration, 'seconds')
        expect(witness.length > 0).toBeTruthy()

        fs.writeFileSync('jwt.witness.json', witness)
    })
})
