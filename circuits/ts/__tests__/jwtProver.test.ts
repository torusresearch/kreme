jest.setTimeout(90000)
import * as assert from 'assert'
import * as fs from 'fs'
import { 
    sha256BufferToHex,
    buffer2bitArray,
    bitArray2buffer,
    genSubstrByteArr,
    strToByteArr,
    strToPaddedBytes,
    numArrToBuf,
} from '../'

import * as crypto from 'crypto'
import { genWitness, getSignalByName } from './utils'
const ff = require('ffjavascript')
const stringifyBigInts: (obj: object) => any = ff.utils.stringifyBigInts
import {
    sha256ToFieldElements,
} from 'kreme-crypto'

const circuit = 'jwtProver_test'
const NUM_BYTES = 320
const NUM_EMAIL_SUBSTR_BYTES = 64
const domain = '@company.xyz"'
const email = `"email" : "alice${domain}`

const testCircuit = async (plaintext: string) => {
    const expectedHash = sha256ToFieldElements(plaintext)

    // Pads the plaintext using RFC4634, section 4.1
    const p = strToPaddedBytes(plaintext)

    //const witness = await genWitness(circuit, circuitInputs)
    const domainName = strToByteArr(domain, NUM_EMAIL_SUBSTR_BYTES)
    const numDomainBytes = Buffer.from(domain).length
    const r = genSubstrByteArr(
        plaintext,
        email,
        NUM_BYTES,
        NUM_EMAIL_SUBSTR_BYTES,
    )
    const emailSubstr = r.byteArr
    const emailNameStartPos = r.pos 
    const numSpacesBeforeColon = 1
    const numSpacesAfterColon = 1
    const emailValueEndPos = emailNameStartPos + 7 + numSpacesBeforeColon + 1 +
        numSpacesAfterColon + numDomainBytes + 'alice@'.length - 1

    const byteArrAsHex = (s) => s.map((x) => x.toString(16)).join('')

    //console.log(
        //'plaintext:', byteArrAsHex(p), '\n',
        //'emailSubstr:', byteArrAsHex(emailSubstr), '\n',
        //'domainName:', byteArrAsHex(domainName),
    //)

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
        expectedHash,
    })

    const start = Date.now()
    const witness = await genWitness(circuit, circuitInputs)
    const end = Date.now()
    const duration = (end - start) / 1000
    console.log('Witness generation took', duration, 'seconds')
    expect(witness.length > 0).toBeTruthy()

    //fs.writeFileSync('input.json', JSON.stringify(circuitInputs))
    //fs.writeFileSync('jwt.witness.json', witness)
}

describe('JWTProver circuit', () => {
    it('Should prove the existence of a domain name in the correct position and verify the hash (1)', async () => {
        const plaintext = `{"blah": 123, ${email}, ` +
            `"foo": "bar bar bar bar bar bar bar bar barbar bar bar bar ` +
            `bar bar bar bar bar bar bar bar bar bar bar bar bar bar bar ` +
            `bar bar bar bar bar bar bar bar bar bar bar bar bar bar bar ` +
            `bar bar  bar bar bar bar bar bar bar bar bar "}`
        await testCircuit(plaintext)
    })

    it('Should prove the existence of a domain name in the correct position and verify the hash (2)', async () => {
        const plaintext = `{"blah": 123, ${email}, ` +
            `"foo": "bar bar bar bar bar bar bar bar barbar bar bar bar ` +
            `bar bar bar bar bar bar bar bar bar bar bar bar bar bar bar ` +
            `bar bar bar bar bar bar bar bar bar bar bar bar bar bar bar ` +
            `bar bar  bar bar bar bar bar bar bar bar bar "}`

        await testCircuit(plaintext)
    })
})
