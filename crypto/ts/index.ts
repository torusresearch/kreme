import * as crypto from 'crypto'

const sha256ToBigInt = (plaintext: string): BigInt => {
    const b = Buffer.from(plaintext, 'utf8')
    const hash = crypto.createHash('sha256')
        .update(b)
        .digest('hex')

    return BigInt('0x' + hash)
}

const sha256ToFieldElements = (plaintext: string): BigInt[] => {
    const b = Buffer.from(plaintext, 'utf8')
    const expectedHash = crypto.createHash('sha256')
        .update(b)
        .digest('hex')
    const expectedHashBuf = Buffer.from(expectedHash, 'hex')
    return [
        BigInt('0x' + expectedHashBuf.slice(0, 16).toString('hex')),
        BigInt('0x' + expectedHashBuf.slice(16, 32).toString('hex')),
    ]
}

export {
    sha256ToFieldElements,
    sha256ToBigInt,
}
