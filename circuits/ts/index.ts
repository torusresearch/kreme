import * as crypto from 'crypto'
import * as assert from 'assert'
import * as path from 'path'
import * as fs from 'fs'
import * as shelljs from 'shelljs'
import * as circom from 'circom'
import { base64urlChars } from './base64url'
const ff = require('ffjavascript')
const stringifyBigInts: (obj: object) => any = ff.utils.stringifyBigInts
const unstringifyBigInts: (obj: object) => any = ff.utils.unstringifyBigInts
import base64url from 'base64url'
import { sha256ToFieldElements, hashBytes } from 'kreme-crypto'

const extractEmailSubstr = (headerAndPayload: string) => {
    const s = headerAndPayload.split('.')
    const payload = base64url.decode(s[1])
    const addr = JSON.parse(payload).email
    const startIndex = payload.indexOf('"email"')
    const endIndex = payload.indexOf(addr) + addr.length + 1
    const email = payload.slice(startIndex, endIndex)
    return email
}

const calcNumEmailSubstrB64Bytes = (headerAndPayload: string) => {
    const email = extractEmailSubstr(headerAndPayload)
    return Buffer.from(email).length
}

const calcNumPreimageB64PaddedBytes = (headerAndPayload: string) => {
    // Convert the input string to a buffer
    const buf = Buffer.from(headerAndPayload, 'utf8')
    const len = 1 + (buf.length * 8)
    const nBlocks = Math.floor((len + 64) / 512) + 1
    return (nBlocks * 512) / 8
}

const genJwtHiddenEmailAddressProverCircuitInputs = (
    headerAndPayload: string,
    e: string,
    salt: BigInt,
    supportedEmailB64Lengths: number[],
) => {
    const r = genJwtEmailAddressProverCircuitInputs(
        headerAndPayload,
        e,
        supportedEmailB64Lengths,
    )
    const circuitInputs = r.circuitInputs

    const emailAddressCommitment = hashBytes(
        circuitInputs.emailAddress.map((x) => BigInt(x)),
        salt,
    )
    circuitInputs.emailAddressCommitment = emailAddressCommitment.toString()
    circuitInputs.salt = salt.toString()

    return {
        numEmailSubstrB64Bytes: r.numEmailSubstrB64Bytes,
        numPreimageB64Bytes: r.numPreimageB64Bytes,
        circuitInputs: r.circuitInputs,
    }
}

const genJwtEmailAddressProverCircuitInputs = (
    headerAndPayload: string,
    e: string,
    supportedEmailB64LengthsUnsorted: number[],
) => {
    const supportedEmailB64Lengths = supportedEmailB64LengthsUnsorted
    supportedEmailB64Lengths.sort()

    const preimagePaddedBytes = strToPaddedBytes(headerAndPayload)
    const NUM_PREIMAGE_B64_BYTES = preimagePaddedBytes.length
    const email = extractEmailSubstr(headerAndPayload)

    let utf8Len
    for (const len of supportedEmailB64Lengths) {
        utf8Len = len * 6 / 8
        if (utf8Len >= Buffer.from(email).length) {
            break
        }
    }

    if (utf8Len == undefined) {
        throw new Error('Unsupported email length')
    }

    const NUM_EMAIL_SUBSTR_B64_BYTES = utf8Len * 8 / 6

    const emailAsBits = buffer2bitArray(Buffer.from(email))
    const emailAsBitStr = emailAsBits.join('')

    let emailSubstrB64StartIndex
    let emailSubstrB64
    
    for (var i = 0; i < NUM_PREIMAGE_B64_BYTES; i ++) {
        const substr = preimagePaddedBytes.slice(i, i + NUM_EMAIL_SUBSTR_B64_BYTES)
        const substrBits = jwtBytesToBits(substr)
        if (substrBits.join('').indexOf(emailAsBitStr) > -1) {
            emailSubstrB64 = substr
            emailSubstrB64StartIndex = i
            break
        }
    }

    const emailSubstrBits = jwtBytesToBits(emailSubstrB64)
    const emailSubstrBitIndex = emailSubstrBits.join('').indexOf(emailAsBitStr)

    const emailSubstrUtf8 = strToByteArr(email, NUM_EMAIL_SUBSTR_B64_BYTES * 6 / 8)

    const expectedHash = sha256ToFieldElements(headerAndPayload)
    const emailAddress = strToByteArr(e, NUM_EMAIL_SUBSTR_B64_BYTES * 6 / 8)
    const numEmailAddressBytes = Buffer.from(e).length
    const regex = /\"email\"(\s*):(\s*)\".+\"$/
    const m = email.match(regex)
    if (m == null) {
        throw new Error('Invalid email address')
    }
    const numSpacesBeforeColon = m[1].length
    const numSpacesAfterColon = m[2].length

    const emailNameStartPos = emailSubstrUtf8.length - Buffer.from(email).length
    const emailValueEndPos = emailNameStartPos + Buffer.from(email).length - 1

    const circuitInputs = stringifyBigInts({
        preimageB64: preimagePaddedBytes,
        emailSubstrB64,
        emailSubstrBitIndex,
        emailSubstrBitLength: emailAsBitStr.length,
        emailAddress,
        numEmailAddressBytes,
        emailNameStartPos,
        emailValueEndPos,
        numSpacesBeforeColon,
        numSpacesAfterColon,
        expectedHash,
    })

    return {
        numEmailSubstrB64Bytes: NUM_EMAIL_SUBSTR_B64_BYTES,
        numPreimageB64Bytes: NUM_PREIMAGE_B64_BYTES,
        circuitInputs
    }
}

const genJwtEmailDomainProverCircuitInputs = (
    headerAndPayload: string,
    d: string,
    supportedEmailB64Lengths: number[],
) => {
    const domain = `@${d}"`
    const preimagePaddedBytes = strToPaddedBytes(headerAndPayload)
    const NUM_PREIMAGE_B64_BYTES = preimagePaddedBytes.length
    const email = extractEmailSubstr(headerAndPayload)

    let utf8Len
    for (const len of supportedEmailB64Lengths) {
        utf8Len = len * 6 / 8
        if (utf8Len >= Buffer.from(email).length) {
            break
        }
    }
    if (utf8Len == undefined) {
        throw new Error('Unsupported email length')
    }

    const NUM_EMAIL_SUBSTR_B64_BYTES = utf8Len * 8 / 6

    const emailAsBits = buffer2bitArray(Buffer.from(email))
    const emailAsBitStr = emailAsBits.join('')

    let emailSubstrB64StartIndex
    let emailSubstrB64
    
    for (var i = 0; i < NUM_PREIMAGE_B64_BYTES; i ++) {
        const substr = preimagePaddedBytes.slice(i, i + NUM_EMAIL_SUBSTR_B64_BYTES)
        const substrBits = jwtBytesToBits(substr)
        if (substrBits.join('').indexOf(emailAsBitStr) > -1) {
            emailSubstrB64 = substr
            emailSubstrB64StartIndex = i
            break
        }
    }

    const emailSubstrBits = jwtBytesToBits(emailSubstrB64)
    const emailSubstrBitIndex = emailSubstrBits.join('').indexOf(emailAsBitStr)

    const emailSubstrUtf8 = strToByteArr(email, NUM_EMAIL_SUBSTR_B64_BYTES * 6 / 8)

    const expectedHash = sha256ToFieldElements(headerAndPayload)
    const domainName = strToByteArr(domain, NUM_EMAIL_SUBSTR_B64_BYTES * 6 / 8)
    const numDomainBytes = Buffer.from(domain).length
    const regex = /\"email\"(\s*):(\s*)\".+\"$/
    const m = email.match(regex)
    if (m == null) {
        throw new Error('Invalid email address')
    }
    const numSpacesBeforeColon = m[1].length
    const numSpacesAfterColon = m[2].length

    const emailNameStartPos = emailSubstrUtf8.length - Buffer.from(email).length
    const emailValueEndPos = emailNameStartPos + Buffer.from(email).length - 1

    const circuitInputs = stringifyBigInts({
        preimageB64: preimagePaddedBytes,
        emailSubstrB64,
        emailSubstrBitIndex,
        emailSubstrBitLength: emailAsBitStr.length,
        domainName,
        numDomainBytes,
        emailNameStartPos,
        emailValueEndPos,
        numSpacesBeforeColon,
        numSpacesAfterColon,
        expectedHash,
    })

    return {
        numEmailSubstrB64Bytes: NUM_EMAIL_SUBSTR_B64_BYTES,
        numPreimageB64Bytes: NUM_PREIMAGE_B64_BYTES,
        circuitInputs
    }
}

// Slightly modified base64url algorithm. The . character is converted to
// 000000 in binary.
const jwtBytesToBits = (jwtBytes: number[]): number[] => {
    const values: number[] = []
    for (const j of jwtBytes) {
        const c = Buffer.from(j.toString(16), 'hex').toString()
        const r = base64urlChars[c]

        if (j === 0x2e || j === 0) { // the dot character or 0
            values.push(0)
        } else if (r == undefined) {
            values.push(0)
        } else {
            values.push(r)
        }
    }

    const bits: number[] = []

    for (const v of values) {
        let b = v.toString(2)
        while (b.length < 6) {
            b = '0' + b
        }
        for (let i = 0; i < 6; i ++) {
            bits.push(Number(b[i]))
        }
    }

    return bits
}

const replaceExt = (fp: string, ext: string, originalExt: string) => {
    return path.join(
        path.dirname(fp),
        path.basename(fp, originalExt) + ext
    )
}

const exec = (cmd: string) => {
    const out = shelljs.exec(cmd)

    if (out.code !== 0 || out.stderr) {
        throw new Error(out.stderr)
    }
    return out
}

const copyWitnessGenSrcs = (
    buildDir: string,
    circomRuntimePath: string,
    ffiasmPath: string,
    cFile: string,
    witnessGenFile: string
) => {
    const cppPath = path.join(
        circomRuntimePath,
        'c',
        '*.cpp'
    )
    const hppPath = path.join(
        circomRuntimePath,
        'c',
        '*.hpp'
    )

    let cmd = `cp ${hppPath} ${buildDir}`
    let out = exec(cmd)

    cmd = `cp ${cppPath} ${buildDir}`
    out = exec(cmd)

    const buildZqFieldPath = path.join(
        ffiasmPath,
        'src',
        'buildzqfield.js',
    )
    cmd = `node ${buildZqFieldPath} -q 21888242871839275222246405745257275088548364400416034343698204186575808495617 -n Fr`
    out = exec(cmd)

    cmd = `mv fr.asm fr.cpp fr.hpp ${buildDir}`
    out = exec(cmd)

    const frAsmPath = path.join(
        buildDir,
        'fr.asm',
    )
    cmd = `nasm -felf64 ${frAsmPath}`
    out = exec(cmd)
}

/*
 * Compile a circuit file
 */
const compile = (
    filepath: string,
    noClobber: boolean,
    circomRuntimePath: string,
    ffiasmPath: string,
) => {
    const buildDir = path.dirname(filepath)
    const witnessGenFile = replaceExt(filepath, '', '.circom')
    const r1csFile = replaceExt(filepath, '.r1cs', '.circom')
    const wasmFile = replaceExt(filepath, '.wasm', '.circom')
    const watFile = replaceExt(filepath, '.wat', '.circom')
    const cFile = replaceExt(filepath, '.c', '.circom')
    const symFile = replaceExt(filepath, '.sym', '.circom')

    const pathToCircom = path.join(
        __dirname,
        '..',
        'node_modules',
        'circom',
        'cli.js',
    )

    let exists = true
    for (const f of [r1csFile, wasmFile, watFile, cFile, symFile, witnessGenFile]) {
        if (!fs.existsSync(f)) {
            exists = false
            break
        }
    }
    if (exists && noClobber) {
        console.log('Skipped', filepath)
        return
    }

    copyWitnessGenSrcs(
        buildDir,
        circomRuntimePath,
        ffiasmPath,
        cFile,
        witnessGenFile
    )

    console.log('Compiling', filepath)
    let cmd = `${NODE_CMD} ` +
        `${pathToCircom} ${filepath} ` +
        `-r ${r1csFile} ` +
        `-c ${cFile} ` +
        `-w ${wasmFile} ` +
        `-t ${watFile} ` +
        `-s ${symFile} `

    let out = exec(cmd)

    const srcs = 
        path.join(path.resolve(buildDir), 'main.cpp') + ' ' +
        path.join(path.resolve(buildDir), 'calcwit.cpp') + ' ' +
        path.join(path.resolve(buildDir), 'utils.cpp') + ' ' +
        path.join(path.resolve(buildDir), 'fr.cpp') + ' ' +
        path.join(path.resolve(buildDir), 'fr.o')

    cmd = `g++ -pthread ${srcs} ` +
        `${cFile} -o ${witnessGenFile} ` + 
        `-lgmp -std=c++11 -O3 -fopenmp -DSANITY_CHECK`
    out = exec(cmd)

    return out
}

const NODE_CMD = 'NODE_OPTIONS=--max-old-space-size=16384 node --stack-size=1048576'

/*
 * Generate a .zkey file from the .r1cs and .ptau files provided
 */
const genZkey = (
    r1csFile: string,
    ptauFile: string,
    noClobber: boolean,
) => {
    const outFile = replaceExt(r1csFile, '.zkey', '.r1cs')
    if (fs.existsSync(outFile) && noClobber) {
        console.log(`Skipped ${outFile}`)
        return
    }

    const pathToSnarkjs = path.join(
        __dirname,
        '..',
        'node_modules',
        'snarkjs',
        'build',
        'cli.cjs',
    )
    const cmd = `${NODE_CMD} ${pathToSnarkjs} zkey new ${r1csFile} ${ptauFile} ${outFile}`
    console.log('Generating', outFile)
    exec(cmd)
}

/*
 * The SHA256 hash function accepts a plaintext (`str`) and its first operation
 * is to pad it. RFC4634, section 4.1 describes how this is done.
 */
const strToPaddedBytes = (str: string): number[] => {
    // Convert the input string to a buffer
    const buf = Buffer.from(str, 'utf8')

    // Convert the buffer to bits
    const result: number[] = buffer2bitArray(buf)
    const len = result.length

    result.push(1)

    const nBlocks = Math.floor((len + 64) / 512) + 1

    while (result.length < nBlocks * 512 - 64) {
        result.push(0)
    }

    const lenBitArr: number[] = []
    let lengthInBits = BigInt(len).toString(2)
    for (let i = 0; i < lengthInBits.length; i ++) {
        lenBitArr.push(Number(lengthInBits[i]))
    }

    while (lenBitArr.length < 64) {
        lenBitArr.unshift(0)
    }
    
    for (let i = 0; i < 64; i ++) {
        result.push(lenBitArr[i])
    }

    const p: number[] = []

    for (var i = 0; i < result.length / 8; i ++) {
        const b = Number('0b' + result.slice(i * 8, i * 8 + 8).join(''))
        p.push(b)
    }
    return p
}

/*
 * The SHA256 hash function accepts a plaintext (`str`) and its first operation
 * is to pad it. RFC4634, section 4.1 describes how this is done.
 */
const strToSha256PaddedBitArr = (str: string): string => {
    // Convert the input string to a buffer
    const buf = Buffer.from(str, 'utf8')

    // Convert the buffer to bits
    const bits: number[] = buffer2bitArray(buf)

    let result: number[] = []
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
const strToByteArr = (str: string, len: number): number[] => {
    const result: number[] = []
    const buf = Buffer.from(str, 'utf8')
    assert(len >= buf.length)

    for (let i = 0; i < len - buf.length; i ++) {
        result.push(0)
    }

    for (let i = 0; i < buf.length; i ++) {
        result.push(Number(buf[i]))
    }
    assert(result.length === len)
    return result
}

/*
 * Converts a Buffer to an array of numbers where each number represents a
 * byte.
 */
const bufToNumArr = (buf: Buffer): number[] => {
    const result: number[] = []
    for (let i = 0 ; i < buf.length; i ++) {
        result.push(Number(buf[i].toString()))
    }
    return result
}

const numArrToBuf = (numArr: number[]): Buffer => {
    const buf = Buffer.alloc(numArr.length)
    for (let i = 0; i < numArr.length; i ++) {
        buf[i] = numArr[i]
    }
    return buf
}

/*
 * Given a string and a substring, return:
 *   - an array of numbers where each number represents a byte and the array
 *     (nuSubstrBytes long) is a slice of the original string, padded to
 *     numPlaintextBytes.
 *   - The index at which the slice begins relative to the padded plaintext.
 * @param plaintext The full string
 * @param substr
 * @param numPlaintextBytes
 * @param numSubstrBytes
 */
const genSubstrByteArr = (
    plaintext: string,
    substr: string,
    numPlaintextBytes: number,
    numSubstrBytes: number,
): { byteArr: number[], pos: number } => {
    // substr must indeed be a substring of plaintext
    const substrIndex = plaintext.indexOf(substr)
    assert(plaintext.indexOf(substr) > -1)

    assert(numPlaintextBytes >= numSubstrBytes)
    
    // Convert plaintext to a byte array numPlaintextBytes long
    const p = strToByteArr(plaintext, numPlaintextBytes)

    assert(p.length <= numPlaintextBytes)

    if (numPlaintextBytes === numSubstrBytes) {
        return { byteArr: p, pos: 0 }
    }

    const result = bufToNumArr(Buffer.from(substr))
    assert(numSubstrBytes >= result.length)

    if (result.length === numSubstrBytes) {
        return { byteArr: result, pos: 0 }
    }

    const post = plaintext.substr(substrIndex + substr.length)
    const postBytes = bufToNumArr(Buffer.from(post))

    for (const b of postBytes) {
        result.push(b)
    }

    if (result.length >= numSubstrBytes) {
        return {
            byteArr: result.slice(0, numSubstrBytes),
            pos: 0,
        }
    }

    const pre = plaintext.substr(0, substrIndex)
    const preBytes = bufToNumArr(Buffer.from(pre))
    while (preBytes.length < numSubstrBytes) {
        preBytes.unshift(0)
    }

    let i = preBytes.length - 1
    while (result.length < numSubstrBytes) {
        const b = preBytes[i]
        result.unshift(b)
        i --
    }

    const diff = numPlaintextBytes - Buffer.from(plaintext).length
    let pos = 0
    while (pos < numPlaintextBytes - numSubstrBytes) {
        if (p.slice(pos, pos + numSubstrBytes) === result) {
            break
        }
        pos ++
    }

    return {
        byteArr: result,
        pos,
    }
}

/*
 * Converts a buffer into an array of bits. Each bit is represented by a Number
 * (1 or 0). E.g. <Buffer 61 62> will be converted to
 * [ 0, 1, 1, 0, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 1, 0 ]
 */
const buffer2bitArray = (b: Buffer): number[] => {
    const res: number[] = []
    for (let i = 0; i < b.length; i ++) {
        for (let j = 0; j < 8; j ++) {
            res.push((b[i] >> (7 - j) & 1))
        }
    }
    return res
}

/*
 * Converts a an array of bits into a Buffer. Each bit should be represented by a Number
 * (1 or 0). E.g. bit array 
 * [ 0, 1, 1, 0, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 1, 0 ]
 * will be converted to <Buffer 61 62>.
 */
const bitArray2buffer = (a): Buffer => {
    const len = Math.floor((a.length - 1) / 8) + 1
    const b = Buffer.alloc(len)

    for (let i = 0; i < a.length; i ++) {
        const p = Math.floor(i / 8)
        b[p] = b[p] | (Number(a[i]) << (7 - (i % 8)))
    }
    return b
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

const genEmailComm = (email: string, salt: BigInt, length: number): BigInt => {
    const ba = strToByteArr(email + '"', length)
    const comm = hashBytes(
        ba.map((x) => BigInt(x)),
        salt,
    )
    return comm
}

export {
    genEmailComm,
    jwtBytesToBits,
    plaintext2paddedBitArray,
    genSubstrByteArr,
    strToByteArr,
    buffer2bitArray,
    bitArray2buffer,
    strToSha256PaddedBitArr,
    sha256BufferToHex,
    strToPaddedBytes,
    numArrToBuf,
    compile,
    genZkey,
    genJwtEmailDomainProverCircuitInputs,
    genJwtEmailAddressProverCircuitInputs,
    genJwtHiddenEmailAddressProverCircuitInputs,
    calcNumPreimageB64PaddedBytes,
    calcNumEmailSubstrB64Bytes,
}
