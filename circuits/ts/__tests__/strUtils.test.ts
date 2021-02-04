import { genSubstrByteArr, strToByteArr } from '../'

const NUM_BYTES = 320
const NUM_EMAIL_SUBSTR_BYTES = 64
const domain = '@company.xyz"'
const email = `"email" : "alice${domain}`

describe('String to BigInt array utilities', () => {
    it('genSubstrByteArr should work correctly', () => {
        const plaintext = `{"blah": 123, "email" : "alice${domain}, ` +
            `"foo": "bar bar bar bar bar bar bar bar barbar bar bar bar ` +
            `bar bar bar bar bar bar bar bar bar bar bar bar bar bar bar ` +
            `bar bar bar bar bar bar bar bar bar bar bar bar bar bar bar ` +
            `bar bar  bar bar bar bar bar bar bar bar bar "}`
        const r = genSubstrByteArr(
            plaintext,
            email,
            NUM_BYTES,
            NUM_EMAIL_SUBSTR_BYTES,
        )
        expect(r.pos).toEqual(0)
    })

    it('genSubstrByteArr should work correctly', () => {
        const plaintext = `{"blah": 123, ` +
            `"foo": "bar bar bar bar bar bar bar bar bar bar bar bar bar ` +
            `bar bar bar bar bar bar bar bar bar bar bar bar bar bar bar ` +
            `bar bar bar bar bar bar bar bar bar bar bar bar bar bar bar ` +
            `bar bar bar bar bar bar bar bar bar bar bar", ${email}}`
        const r = genSubstrByteArr(
            plaintext,
            email,
            NUM_BYTES,
            NUM_EMAIL_SUBSTR_BYTES,
        )
        expect(r.pos).toEqual(256)
    })

    it('genSubstrByteArr should work correctly', () => {
        const p = "0123456789"
        const e = "56789"
        const r = genSubstrByteArr(p, e, 15, 12)
        const emailSubstrByteArr = r.byteArr
        const s = emailSubstrByteArr.map((x) => Buffer.from(x.toString(16), 'hex').toString('utf-8'))
        expect(s).toEqual(
            ['',  '',  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
        )
    })

    it('genSubstrByteArr should work correctly', () => {
        const p = "0123456789"
        const e = "0123"
        const r = genSubstrByteArr(p, e, 15, 5)
        const emailSubstrByteArr = r.byteArr
        const s = emailSubstrByteArr.map((x) => Buffer.from(x.toString(16), 'hex').toString('utf-8'))
        expect(s).toEqual([ '0', '1', '2', '3', '4' ])
    })

    it('genSubstrByteArr should work correctly', () => {
        const p = '用户@例子.广告'
        const e = '例子.广告'
        const r = genSubstrByteArr(p, e, 50, 20)
        const emailSubstrByteArr = r.byteArr
        expect(emailSubstrByteArr).toEqual(
            [
                231, 148, 168, 230,
                136, 183,  64, 228,
                190, 139, 229, 173,
                144,  46, 229, 185,
                191, 229, 145, 138,
            ]
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

})
