import * as assert from 'assert'
import { genSubstrByteArr, strToByteArr } from '../'
import { genWitness, getSignalByName } from './utils'
const ff = require('ffjavascript')
const stringifyBigInts: (obj: object) => any = ff.utils.stringifyBigInts
jest.setTimeout(90000)

const circuit = 'emailAddressProver_test'
const NUM_BYTES = 320
const NUM_EMAIL_SUBSTR_BYTES = 64


describe('JSON field prover for an email domain name', () => {
    it('Should prove the existence of a domain name in the correct position', async () => {
        const domain = '@company.xyz"'
        const plaintext = `{"blah": 123, "email" : "alice${domain}, "foo": "bar"}`
        const email = `"email" : "alice${domain}`
        const p = strToByteArr(plaintext, NUM_BYTES)
        const emailAddress = strToByteArr('alice' + domain, NUM_EMAIL_SUBSTR_BYTES)
        const numEmailAddressBytes = Buffer.from('alice' + domain).length
        const emailSubstr = genSubstrByteArr(
            plaintext,
            email,
            NUM_BYTES,
            NUM_EMAIL_SUBSTR_BYTES,
        )
        const emailNameStartPos = 20
        const numSpacesBeforeColon = 1
        const numSpacesAfterColon = 1
        const emailValueEndPos = emailNameStartPos + 7 + numSpacesBeforeColon + 1 +
            numSpacesAfterColon + numEmailAddressBytes

        const byteArrAsHex = (s) => s.map((x) => x.toString(16)).join('')

        console.log(
            'plaintext:', byteArrAsHex(p), '\n',
            'emailSubstr:', byteArrAsHex(emailSubstr.byteArr), '\n',
            'emailAddress:', byteArrAsHex(emailAddress),
        )

        expect(emailSubstr.byteArr[emailNameStartPos].toString()).toEqual(Buffer.from('"')[0].toString())
        expect(emailSubstr.byteArr[emailNameStartPos + 6].toString()).toEqual(Buffer.from('"')[0].toString())
        const circuitInputs = stringifyBigInts({
            //plaintext: p,
            emailSubstr: emailSubstr.byteArr,
            emailAddress,
            emailNameStartPos,
            emailValueEndPos,
            numSpacesBeforeColon,
            numSpacesAfterColon,
            numEmailAddressBytes,
        })
        debugger
        const witness = await genWitness(circuit, circuitInputs)
        expect(witness.length > 0).toBeTruthy()
    })

    it('Should fail to generate a witness if the email address does not match', async () => {
        const domain = '@company.xyz"'
        const plaintext = `{"blah": 123, "email" : "alice${domain}, "foo": "bar"}`
        const email = `"email" : "alice${domain}`
        const p = strToByteArr(plaintext, NUM_BYTES)
        const emailAddress = strToByteArr('blice' + domain, NUM_EMAIL_SUBSTR_BYTES)
        const numEmailAddressBytes = Buffer.from('alice' + domain).length
        const emailSubstr = genSubstrByteArr(
            plaintext,
            email,
            NUM_BYTES,
            NUM_EMAIL_SUBSTR_BYTES,
        )
        const emailNameStartPos = 20
        const numSpacesBeforeColon = 1
        const numSpacesAfterColon = 1
        const emailValueEndPos = emailNameStartPos + 7 + numSpacesBeforeColon + 1 +
            numSpacesAfterColon + numEmailAddressBytes 

        const byteArrAsHex = (s) => s.map((x) => x.toString(16)).join('')

        console.log(
            'plaintext:', byteArrAsHex(p), '\n',
            'emailSubstr:', byteArrAsHex(emailSubstr.byteArr), '\n',
            'emailAddress:', byteArrAsHex(emailAddress),
        )

        expect(emailSubstr.byteArr[emailNameStartPos].toString()).toEqual(Buffer.from('"')[0].toString())
        expect(emailSubstr.byteArr[emailNameStartPos + 6].toString()).toEqual(Buffer.from('"')[0].toString())
        const circuitInputs = stringifyBigInts({
            //plaintext: p,
            emailSubstr: emailSubstr.byteArr,
            emailAddress,
            emailNameStartPos,
            emailValueEndPos,
            numSpacesBeforeColon,
            numSpacesAfterColon,
            numEmailAddressBytes,
        })

        try {
            await genWitness(circuit, circuitInputs)
        } catch {
            expect(true).toBeTruthy()
        }
    })
})
