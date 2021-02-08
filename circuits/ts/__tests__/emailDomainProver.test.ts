import * as assert from 'assert'
import { genSubstrByteArr, strToByteArr } from '../'
import { genWitness, getSignalByName } from './utils'
const ff = require('ffjavascript')
const stringifyBigInts: (obj: object) => any = ff.utils.stringifyBigInts
jest.setTimeout(90000)

const circuit = 'emailDomainProver_test'
const NUM_BYTES = 320
const NUM_EMAIL_SUBSTR_BYTES = 64


describe('JSON field prover for an email domain name', () => {
    it('Should prove the existence of a domain name in the correct position', async () => {
        const domain = '@company.xyz"'
        const plaintext = `{"blah": 123, "email" : "alice${domain}, "foo": "bar"}`
        const email = `"email" : "alice${domain}`
        const p = strToByteArr(plaintext, NUM_BYTES)
        const domainName = strToByteArr(domain, NUM_EMAIL_SUBSTR_BYTES)
        const numDomainBytes = Buffer.from(domain).length
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
            numSpacesAfterColon + numDomainBytes + 'alice@'.length - 1

        const byteArrAsHex = (s) => s.map((x) => x.toString(16)).join('')

        console.log(
            'plaintext:', byteArrAsHex(p), '\n',
            'emailSubstr:', byteArrAsHex(emailSubstr.byteArr), '\n',
            'domainName:', byteArrAsHex(domainName),
        )

        expect(emailSubstr.byteArr[emailNameStartPos].toString()).toEqual(Buffer.from('"')[0].toString())
        expect(emailSubstr.byteArr[emailNameStartPos + 6].toString()).toEqual(Buffer.from('"')[0].toString())
        const circuitInputs = stringifyBigInts({
            //plaintext: p,
            emailSubstr: emailSubstr.byteArr,
            domainName,
            emailNameStartPos,
            emailValueEndPos,
            numSpacesBeforeColon,
            numSpacesAfterColon,
            numDomainBytes,
        })
        const witness = await genWitness(circuit, circuitInputs)
        expect(witness.length > 0).toBeTruthy()
    })

    it('Should fail to generate a witness if the domain name does not match', async () => {
        expect.assertions(3)
        const domain = '@company.xyz"'
        const plaintext = `{"blah": 123, "email" : "alice${domain}, "foo": "bar"}`
        const email = `"email" : "alice${domain}`
        const p = strToByteArr(plaintext, NUM_BYTES)
        const domainName = strToByteArr('@company.abc', NUM_EMAIL_SUBSTR_BYTES)
        const numDomainBytes = Buffer.from(domain).length
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
            numSpacesAfterColon + numDomainBytes + 'alice@'.length - 1

        const byteArrAsHex = (s) => s.map((x) => x.toString(16)).join('')

        console.log(
            'plaintext:', byteArrAsHex(p), '\n',
            'emailSubstr:', byteArrAsHex(emailSubstr.byteArr), '\n',
            'domainName:', byteArrAsHex(domainName),
        )

        expect(emailSubstr.byteArr[emailNameStartPos].toString()).toEqual(Buffer.from('"')[0].toString())
        expect(emailSubstr.byteArr[emailNameStartPos + 6].toString()).toEqual(Buffer.from('"')[0].toString())
        const circuitInputs = stringifyBigInts({
            //plaintext: p,
            emailSubstr: emailSubstr.byteArr,
            domainName,
            emailNameStartPos,
            emailValueEndPos,
            numSpacesBeforeColon,
            numSpacesAfterColon,
            numDomainBytes,
        })

        try {
            await genWitness(circuit, circuitInputs)
        } catch {
            expect(true).toBeTruthy()
        }
    })
})
