import * as assert from 'assert'
import { genSubstrByteArr, strToByteArr } from '../'
import { genWitness, getSignalByName } from './utils'
const ff = require('ffjavascript')
const stringifyBigInts: (obj: object) => any = ff.utils.stringifyBigInts
jest.setTimeout(90000)

const circuit = 'emailDomainProver_test'
const domain = '@company.xyz"'
const plaintext = `{"blah": 123, "email" : "alice${domain}, "foo": "bar"}`
const email = `"email" : "alice${domain}`
const NUM_BYTES = 320
const NUM_EMAIL_SUBSTR_BYTES = 64

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

describe('JSON field prover for an email domain name', () => {
    it('genSubstrByteArr should work correctly', () => {
        const p = "0123456789"
        const e = "56789"
        const emailSubstrByteArr = genSubstrByteArr(p, e, 15, 12)
        const s = emailSubstrByteArr.map((x) => Buffer.from(x.toString(16), 'hex').toString('utf-8'))
        expect(s).toEqual(
            ['',  '',  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
        )
    })

    it('genSubstrByteArr should work correctly', () => {
        const p = "0123456789"
        const e = "0123"
        const emailSubstrByteArr = genSubstrByteArr(p, e, 15, 5)
        const s = emailSubstrByteArr.map((x) => Buffer.from(x.toString(16), 'hex').toString('utf-8'))
        expect(s).toEqual([ '0', '1', '2', '3', '4' ])
    })

    it('genSubstrByteArr should work correctly', () => {
        const p = '用户@例子.广告'
        const e = '例子.广告'
        const emailSubstrByteArr = genSubstrByteArr(p, e, 50, 20)
        //const s = emailSubstrByteArr.map((x) => Buffer.from(x.toString(16), 'hex').toString('utf-8'))
        //console.log(emailSubstrByteArr)
        //console.log(strToByteArr(e, 20))
        expect(emailSubstrByteArr).toEqual(
            [
                231, 148, 168, 230,
                136, 183,  64, 228,
                190, 139, 229, 173,
                144,  46, 229, 185,
                191, 229, 145, 138,
            ].map((x) => BigInt(x))
        )
    })

    it('genSubstrByteArr should work correctly (failure cases)', () => {
        expect.assertions(2)
        const p = "0123456789"
        const e = "0123"
        expect(() => {
            genSubstrByteArr(p, e, 15, 2)
        }).toThrow()

        expect(() => {
            genSubstrByteArr(p, e, 15, 20)
        }).toThrow()
    })

    it('strToByteArr should work correctly', () => {
        const text = '用户@例子.广告'
        const buf = Buffer.from(text)
        const byteArr = strToByteArr(text, buf.length)
        expect(byteArr.length).toEqual(buf.length)
        expect(byteArr.length).toEqual(20)
    })

    it('Should prove the existence of a domain name in the correct position', async () => {
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
        })
        const witness = await genWitness(circuit, circuitInputs)
        expect(witness.length > 0).toBeTruthy()
    })
})
