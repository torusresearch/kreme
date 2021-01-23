import * as crypto from 'crypto'
import * as assert from 'assert'
import * as path from 'path'
import * as fs from 'fs'
import * as shelljs from 'shelljs'
import * as circom from 'circom'
const ff = require('ffjavascript')
const stringifyBigInts: (obj: object) => any = ff.utils.stringifyBigInts
const unstringifyBigInts: (obj: object) => any = ff.utils.unstringifyBigInts

const MAX_PLAINTEXT_BITS = 512
const CHUNK_LENGTH = 128

const strToSha256PaddedBitArr = (str: string): string => {
    const buf = Buffer.from(str, 'utf8')
    const bits: Number[] = buffer2bitArray(buf)

    let result: Number[] = []
    for (let i = 0; i < bits.length; i ++) {
        result.push(bits[i])
    }

    result[bits.length] = 1

    const nBlocks = Math.floor((bits.length + 64) / 512) + 1

    while (result.length < nBlocks * 512 - 64) {
        result.push(0)
    }

    let lengthInBits = BigInt(bits.length).toString(2)
    while (lengthInBits.length < 64) {
        lengthInBits = '0' + lengthInBits 
    }

    return result.join('') + lengthInBits
}

// Convert a string to an array of BigInts where each BigInt represents a byte
const strToByteArr = (str: string, len: number): BigInt[] => {
    const result: BigInt[] = []
    const buf = Buffer.from(str, 'utf8')
    assert(len >= buf.length)

    for (let i = 0; i < len - buf.length; i ++) {
        result.push(BigInt(0))
    }

    for (let i = 0; i < buf.length; i ++) {
        result.push(BigInt(buf[i]))
    }
    assert(result.length === len)
    return result
}

const bufToBigIntArr = (buf: Buffer): BigInt[] => {
    const result: BigInt[] = []
    for (let i = 0 ; i < buf.length; i ++) {
        result.push(BigInt(buf[i].toString()))
    }
    return result
}

const genSubstrByteArr = (
    plaintext: string,
    substr: string,
    numPlaintextBytes: number,
    numSubstrBytes: number,
): BigInt[] => {

    // substr must indeed be a substring of plaintext
    const pos = plaintext.indexOf(substr)
    assert(pos > -1)

    assert(numPlaintextBytes >= numSubstrBytes)
    
    const p = strToByteArr(plaintext, numPlaintextBytes)
    if (numPlaintextBytes === numSubstrBytes) {
        return p
    }

    const result = bufToBigIntArr(Buffer.from(substr))
    assert(numSubstrBytes >= result.length)

    if (result.length === numSubstrBytes) {
        return result
    }

    const post = plaintext.substr(pos + substr.length)
    const postBytes = bufToBigIntArr(Buffer.from(post))

    for (const b of postBytes) {
        result.push(b)
    }

    if (result.length >= numSubstrBytes) {
        return result.slice(0, numSubstrBytes)
    }

    const pre = plaintext.substr(0, pos)
    const preBytes = bufToBigIntArr(Buffer.from(pre))
    while (preBytes.length < numSubstrBytes) {
        preBytes.unshift(BigInt(0))
    }

    let i = preBytes.length - 1
    while (result.length < numSubstrBytes) {
        const b = preBytes[i]
        result.unshift(b)
        i --
    }
    return result
}

const buffer2bitArray = (b) => {
    const res: Number[] = []
    for (let i=0; i<b.length; i++) {
        for (let j=0; j<8; j++) {
            res.push((b[i] >> (7-j) &1))
        }
    }
    return res
}

const bitArray2buffer = (a) => {
    const len = Math.floor((a.length -1 )/8)+1
    const b = Buffer.alloc(len)

    for (let i=0; i<a.length; i++) {
        const p = Math.floor(i / 8)
        b[p] = b[p] | (Number(a[i]) << (7 - (i % 8)))
    }
    return b
}

const compileAndLoadCircuit = async (
    circuitPath: string
) => {

    const circuit = await circom.tester(
        path.join(
            __dirname,
            `../circom/${circuitPath}`,
        ),
    )

    await circuit.loadSymbols()

    return circuit
}

const executeCircuit = async (
    circuit: any,
    inputs: any,
) => {

    const witness = await circuit.calculateWitness(inputs, true)
    await circuit.checkConstraints(witness)
    await circuit.loadSymbols()

    return witness
}

const getSignalByName = (
    circuit: any,
    witness: any,
    signal: string,
) => {

    return witness[circuit.symbols[signal].varIdx]
}

const sha256BufferToHex = (b: Buffer) => {
    return crypto.createHash("sha256")
        .update(b)
        .digest('hex')
}

const plaintext2paddedBitArray = (plaintext: string, chunkLength: number) => {
    const b = Buffer.from(plaintext, "utf8")
    const p = BigInt('0x' + b.toString('hex'))
    let bits = p.toString(2)

    while (bits.length % chunkLength > 0) {
        bits = '0' + bits
    }

    return bits
}

const plaintextToChunks = (plaintext: string, chunkLength: number) => {
    const bits = plaintext2paddedBitArray(plaintext, chunkLength)
    const chunks: BigInt[] = []
    for (let i = 0; i < bits.length; i += chunkLength) {
        const chunk = BigInt(
            '0b' +
            bits.slice(i, i + CHUNK_LENGTH)
        )
        chunks.push(chunk)
    }

    return chunks
}

const main = async () => {
    const snarkjsCmd = 'npx snarkjs'

    const plaintext = 
        '{"email": "alice@company.xyz"}xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' +   
        'yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy' +
        'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz' +
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' +
        'yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy' +
        'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz' +
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' +
        'yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy' +
        'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz' +
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'

    const chunks = plaintextToChunks(plaintext, CHUNK_LENGTH)

    console.log('Number of bytes:', chunks.length * 128 / 8)

    const expectedHash = sha256BufferToHex(
        bitArray2buffer(plaintext2paddedBitArray(plaintext, CHUNK_LENGTH))
    )

    const expectedHashBuf = Buffer.from(expectedHash, 'hex')

    const start = Date.now()
    //const circuit = await compileAndLoadCircuit('test/jwtProver.circom')
    const compiled = Date.now()
    console.log(
        'compileAndLoadCircuit() took:',
        (compiled - start) / 1000,
        '(only needs to be done once)',
    )

    const circuitInputs = {
        chunks,
        expectedHash: [
            BigInt('0x' + expectedHashBuf.slice(0, 16).toString('hex')),
            BigInt('0x' + expectedHashBuf.slice(16, 32).toString('hex')),
        ].map((x) => x.toString())
    }

    // Save input.json
    fs.writeFileSync(
        path.join(__dirname, '..', 'build', 'input.json'),
        JSON.stringify(stringifyBigInts(circuitInputs))
    )

    const startWitnessGen = Date.now()
    // Generate the witness
    const witnessCmd =
        `${snarkjsCmd} wc ./build/jwtProver.wasm ./build/input.json ./build/witness.wtns`
    console.log(witnessCmd)
    shelljs.exec(witnessCmd)
    const endWitnessGen = Date.now()
    console.log(
        'Witness generation time (in total):',
        (endWitnessGen - startWitnessGen) / 1000,
    )

    const startWitnessConversion = Date.now()
    const witnessConvertCmd =
        `${snarkjsCmd} wej ./build/witness.wtns ./build/witness.json`
    shelljs.exec(witnessConvertCmd)
    const endWitnessConversion = Date.now()
    console.log(
        'Witness conversion took:',
        (endWitnessConversion - startWitnessConversion) / 1000,
    )

    const witness = unstringifyBigInts(
            JSON.parse(fs.readFileSync('./build/witness.json').toString())
        )

    // Generate proof
    const proofStart = Date.now()
    shelljs.exec(`zkutil prove -c ./build/jwtProver.r1cs -p ./build/jwtProver.params -r ./build/proof.json -o ./build/public_inputs.json -w ./build/witness.json`)
    const proofEnd = Date.now()

    console.log('Proving time:', (proofEnd - proofStart) / 1000, '(can be optimised)')

    //const concatBits: Number[] = []
    //for (let i = 0; i < chunks.length * 128; i ++) {
        //const bit = Number(getSignalByName(circuit, witness, `main.concatBits[${i}]`).toString())
        //concatBits.push(bit)
    //}

    //const bitStr = concatBits.join('')
    //const bitBigInt = BigInt('0b' + bitStr)
    //const bitBuf = Buffer.from(bitBigInt.toString(16), 'hex')
    //console.log(bitBuf.toString('utf-8'))

    //console.log('Native hash:', expectedHash)
    
    //const hashBits: Number[] = []
    //for (let i = 0; i < 256; i ++) {
        //const bit = Number(getSignalByName(circuit, witness, `main.hash[${i}]`).toString())
        //hashBits.push(bit)
    //}

    //const hashBitStr = hashBits.join('')
    //const hashBitBigInt = BigInt('0b' + hashBitStr)
    //const hashBitBuf = bitArray2buffer(hashBits)
    //console.log('Circuit hash:', hashBitBuf.toString('hex'))
}


if (require.main === module) {
    try {
        main()
    } catch (e) {
        console.error(e)
    }
}

export {
    plaintextToChunks,
    plaintext2paddedBitArray,
    genSubstrByteArr,
    strToByteArr,
    buffer2bitArray,
    bitArray2buffer,
    strToSha256PaddedBitArr,
    sha256BufferToHex,
}
