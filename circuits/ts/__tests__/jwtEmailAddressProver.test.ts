jest.setTimeout(90000)
import * as assert from 'assert'
import base64url from 'base64url'
import * as fs from 'fs'
import { 
    genJwtEmailAddressProverCircuitInputs,
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

const testCircuit = async (
    headerAndPayload: string,
    emailAddress: string,
) => {
    const { circuitInputs } = genJwtEmailAddressProverCircuitInputs(
        headerAndPayload,
        emailAddress,
        [48],
    )

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
}

const circuit = 'jwtEmailAddressProver_test'
const emailAddress = 'alice@company.xyz"'
const email = `"email":"${emailAddress}`

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

        await testCircuit(headerAndPayload, emailAddress)
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

        await testCircuit(headerAndPayload, emailAddress)
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

        await testCircuit(headerAndPayload, emailAddress)
    })
})
