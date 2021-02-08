jest.setTimeout(90000)
import * as assert from 'assert'
import base64url from 'base64url'
import * as fs from 'fs'
import { 
    jwtBytesToBits,
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

// Number of bytes of the padded preimage.
const NUM_PREIMAGE_B64_BYTES = 256

// Number of bytes of the substring of the preimage. This substring should
// contain the base64url representation of the email address.
const NUM_EMAIL_SUBSTR_B64_BYTES = 48

const domain = '@company.xyz"'
const email = `"email" :  "alice${domain}`

const testCircuit = async (headerAndPayload: string) => {
    // The SHA256 algorithm pads the input to have a length of a multiple of 64
    // bytes.
    assert(NUM_PREIMAGE_B64_BYTES % 64 === 0)
    const preimagePaddedBytes = strToPaddedBytes(headerAndPayload)
    assert(preimagePaddedBytes.length === NUM_PREIMAGE_B64_BYTES)

    const emailAsBits = buffer2bitArray(Buffer.from(email))
    const emailAsBitStr = emailAsBits.join('')

    let emailSubstrB64StartIndex
    let emailSubstrB64
    
    for (var i = 0; i < NUM_PREIMAGE_B64_BYTES; i ++) {
        const substr = preimagePaddedBytes.slice(i, i + NUM_EMAIL_SUBSTR_B64_BYTES)
        const substrBits = jwtBytesToBits(substr)
        if (substrBits.join('').indexOf(emailAsBitStr) > -1) {
            emailSubstrB64 = substr
            emailSubstrB64StartIndex = i
            break
        }
    }

    const emailSubstrBits = jwtBytesToBits(emailSubstrB64)
    const emailSubstrBitIndex = emailSubstrBits.join('').indexOf(emailAsBitStr)

    const emailSubstrUtf8 = strToByteArr(email, NUM_EMAIL_SUBSTR_B64_BYTES * 6 / 8)

    const expectedHash = sha256ToFieldElements(headerAndPayload)
    const domainName = strToByteArr(domain, NUM_EMAIL_SUBSTR_B64_BYTES * 6 / 8)
    const numDomainBytes = Buffer.from(domain).length
    const regex = /\"email\"(\s*):(\s*)\".+\"$/
    const m = email.match(regex)
    if (m == null) {
        throw new Error('Invalid email address')
    }
    const numSpacesBeforeColon = m[1].length
    const numSpacesAfterColon = m[2].length

    const emailNameStartPos = emailSubstrUtf8.length - Buffer.from(email).length
    const emailValueEndPos = emailNameStartPos + Buffer.from(email).length - 1

    const circuitInputs = stringifyBigInts({
        preimageB64: preimagePaddedBytes,
        emailSubstrB64,
        emailSubstrBitIndex,
        emailSubstrBitLength: emailAsBitStr.length,
        domainName,
        numDomainBytes,
        emailNameStartPos,
        emailValueEndPos,
        numSpacesBeforeColon,
        numSpacesAfterColon,
        expectedHash,
    })

    const start = Date.now()
    const witness = await genWitness(circuit, circuitInputs)
    const end = Date.now()
    const duration = (end - start) / 1000
    console.log('Witness generation took', duration, 'seconds')
    expect(witness.length > 0).toBeTruthy()

    //const debug: string[] = []
    //for (let i = 0; i < NUM_EMAIL_SUBSTR_B64_BYTES * 6 / 8; i ++) {
        //const out = await getSignalByName(circuit, witness, `main.debug[${i}]`)
        //debug.push(out)
    //}
    //const debugStr = debug.join('')
    debugger
}

describe('JWTProver circuit', () => {
    it('Should prove the existence of a domain name in the correct position and verify the hash (1)', async () => {
        const headerAndPayload =
            base64url.encode(
                '{"alg":"RS256","kid":"03b2d22c2fecf873ed19e5b8cf704afb7e2ed4be",'
                + '"typ":"JWT"}'
            )
            + '.'
        + base64url.encode(
            `{"sub":"1234567890","name":"John Doe",${email},"iat":1516239022}`
        )

        await testCircuit(headerAndPayload)
    })

    it('Should prove the existence of a domain name in the correct position and verify the hash (2)', async () => {
        const headerAndPayload =
            base64url.encode(
                '{"alg":"RS256","kid":"03b2d22c2fecf873ed19e5b8cf704afb7e2ed4be",'
                + '"typ":"JWT"}'
            )
            + '.'
        + base64url.encode(
            `{${email},"sub":"1234567890","name":"John Doe","iat":1516239022}`
        )

        await testCircuit(headerAndPayload)
    })

    it('Should prove the existence of a domain name in the correct position and verify the hash (2)', async () => {
        const headerAndPayload =
            base64url.encode(
                '{"alg":"RS256","kid":"03b2d22c2fecf873ed19e5b8cf704afb7e2ed4be",'
                + '"typ":"JWT"}'
            )
            + '.'
        + base64url.encode(
            `{"sub":"1234567890","name":"John Doe Blah Blah Blah","iat":1516239022,${email}}`
        )

        await testCircuit(headerAndPayload)
    })
})
