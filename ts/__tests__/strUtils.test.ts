import { genSubstrByteArr, strToByteArr } from '../'
describe('String to BigInt array utilities', () => {
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

})
