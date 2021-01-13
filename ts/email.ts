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
const CHUNK_LENGTH = 248

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

    const plaintext = '{"email": "alice@company.xyz"}'

    const chunks = plaintextToChunks(plaintext, CHUNK_LENGTH)

    const circuit = await compileAndLoadCircuit('test/emailDomainProver.circom')

    const circuitInputs = {
        json: chunks[0]
    }

    // Save input.json
    fs.writeFileSync(
        path.join(__dirname, '..', 'build', 'input.json'),
        JSON.stringify(stringifyBigInts(circuitInputs))
    )

    // Generate the witness
    const witnessCmd =
        `${snarkjsCmd} wc ./build/test/emailDomainProver.wasm ./build/input.json ./build/witness.wtns`
    console.log(witnessCmd)
    shelljs.exec(witnessCmd)

    const witnessConvertCmd =
        `${snarkjsCmd} wej ./build/witness.wtns ./build/witness.json`
    shelljs.exec(witnessConvertCmd)

    const witness = unstringifyBigInts(
            JSON.parse(fs.readFileSync('./build/witness.json').toString())
        )

    let bits = ''
    for (let i = 0; i < CHUNK_LENGTH; i ++) {
        const bit = Number(getSignalByName(circuit, witness, `main.plaintextBits[${i}]`).toString())
        bits = bit + bits
    }
    console.log(bits)
}


if (require.main === module) {
    try {
        main()
    } catch (e) {
        console.error(e)
    }
}

export { plaintextToChunks, plaintext2paddedBitArray }
