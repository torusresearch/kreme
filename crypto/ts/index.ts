import * as crypto from 'crypto'
import * as assert from 'assert'
import { poseidon } from 'circomlib'
import { strToByteArr } from 

const hashLeftRight = (left: BigInt, right: BigInt) => {
    return poseidon([left, right])
}

const hashBytes = (bytes: BigInt[], salt: BigInt) => {
    const numBytes = bytes.length
    // numBytes may not be a multiple of 31. Calculate numPaddedBytes which is
    // a multiple of 31 where numPaddedBytes > numBytes.
    let numElements = 1
    while (numElements * 31 < numBytes) {
        numElements ++
    }
    const numPaddedBytes = numElements * 31
    const paddedIn: BigInt[] = []
    for (let i = 0; i < numPaddedBytes - numBytes; i ++) {
        paddedIn.push(BigInt(0))
    }
    let j = 0
    for (let i = numPaddedBytes - numBytes; i < numPaddedBytes; i ++) {
        paddedIn.push(bytes[j])
        j ++
    }

    let bits = ''
    for (const b of paddedIn) {
        let bitStr = BigInt(b).toString(2)
        while (bitStr.length < 8) {
            bitStr = '0' + bitStr
        }
        bits += bitStr
    }

    assert(bits.length === numElements * 248)

    const inputs: BigInt[] = []
    for (let i = 0; i < bits.length; i += 248) {
        const elementBits = bits.slice(i, i + 248)
        inputs.push(BigInt('0b' + elementBits))
    }

    const hashes: BigInt[] = []
    hashes[0] = hashLeftRight(salt, inputs[0])
    for (let i = 1; i < inputs.length; i ++) {
        hashes.push(hashLeftRight(hashes[i - 1], inputs[i]))
    }
    const result = hashes[hashes.length - 1]

    return result
}

// The BN254 group order p
const SNARK_FIELD_SIZE = BigInt(
    '21888242871839275222246405745257275088548364400416034343698204186575808495617'
)
const genRandomSalt = (): BigInt => {

    // Prevent modulo bias
    //const lim = BigInt('0x10000000000000000000000000000000000000000000000000000000000000000')
    //const min = (lim - SNARK_FIELD_SIZE) % SNARK_FIELD_SIZE
    const min = BigInt('6350874878119819312338956282401532410528162663560392320966563075034087161851')

    let rand
    while (true) {
        rand = BigInt('0x' + crypto.randomBytes(32).toString('hex'))

        if (rand >= min) {
            break
        }
    }

    const salt: BigInt = rand % SNARK_FIELD_SIZE
    return salt
}

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
    return sha256HashToFieldElements(expectedHash)
}

const sha256HashToFieldElements = (hash: string): BigInt[] => {
    const expectedHashBuf = Buffer.from(hash, 'hex')
    return [
        BigInt('0x' + expectedHashBuf.slice(0, 16).toString('hex')),
        BigInt('0x' + expectedHashBuf.slice(16, 32).toString('hex')),
    ]
}

export {
    sha256ToFieldElements,
    sha256HashToFieldElements,
    sha256ToBigInt,
    hashBytes,
    genRandomSalt,
}
