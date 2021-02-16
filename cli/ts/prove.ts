import { ArgumentParser } from 'argparse'
import * as fs from 'fs'
import * as path from 'path'
import * as shelljs from 'shelljs'
import base64url from 'base64url'
import * as crypto from 'crypto'
import {
    calcNumEmailSubstrB64Bytes,
    calcNumPreimageB64PaddedBytes,
    genJwtHiddenEmailAddressProverCircuitInputs,
} from 'kreme-circuits'

const configureSubparsers = (subparsers: ArgumentParser) => {
    const compileCircuitsParser = subparsers.add_parser(
        'prove',
        { add_help: true },
    )

    compileCircuitsParser.add_argument(
        '-j',
        '--jwt',
        {
            required: true,
            action: 'store',
            type: 'str',
            help: 'The JWT (base64 encoded)',
        }
    )

    compileCircuitsParser.add_argument(
        '-e',
        '--email',
        {
            required: true,
            action: 'store',
            type: 'str',
            help: 'The secret email address',
        }
    )

    compileCircuitsParser.add_argument(
        '-s',
        '--salt',
        {
            required: true,
            action: 'store',
            type: 'str',
            help: 'The secret salt to the commitment to the email address',
        }
    )

    compileCircuitsParser.add_argument(
        '-r',
        '--rapidsnark',
        {
            required: true,
            action: 'store',
            type: 'str',
            help: 'The path to the rapidsnark binary',
        }
    )

    compileCircuitsParser.add_argument(
        '-k',
        '--keep',
        {
            required: false,
            action: 'store_true',
            help: 'Do not delete witness and input files',
        }
    )

    compileCircuitsParser.add_argument(
        '-t',
        '--type',
        {
            required: true,
            action: 'store',
            choices: ['test', 'prod'],
            help: 'The type of .zkey file: for testing (test) or production (prod)',
        }
    )

    compileCircuitsParser.add_argument(
        '-c',
        '--compiled-dir',
        {
            required: true,
            action: 'store',
            type: 'str',
            help: 'The path to the directory which stores the compiled circuits',
        }
    )

    compileCircuitsParser.add_argument(
        '-o',
        '--output',
        {
            required: true,
            action: 'store',
            type: 'str',
            help: 'The path to the proof.json output file',
        }
    )

    compileCircuitsParser.add_argument(
        '-p',
        '--public',
        {
            required: true,
            action: 'store',
            type: 'str',
            help: 'The path to the public.json output file',
        }
    )
}

const prove = async (
    jwt: string,
    emailAddress: string,
    salt: string,
    compiledDir: string,
    rapidsnarkPath: string,
    outputPath: string,
    publicJsonPath: string,
    keepFiles: boolean,
    zkeyType: string,
) => {
    const dirname = path.resolve(path.dirname(outputPath))
    const temp = Date.now().toString() + '.' + (Math.random().toString().slice(3, 8)) 
    const inputFilepath = path.join(
        dirname,
        `input.${temp}.json`
    )
    const wtnsFilepath = path.join(
        dirname,
        `witness.${temp}.wtns`
    )

    const s = jwt.split('.')
    const header = base64url.decode(s[0])
    const payload = base64url.decode(s[1])
    const headerAndPayload = s[0] + '.' + s[1]

    // TODO: calculate the circuit parameters
    // numPreimageB64PaddedBytes strictly depends on the length of
    // headerAndPayload, while numEmailSubstrB64Bytes should be the smallest
    // value that fits from the available circuits
    const params: any[] = []

    for (const f of fs.readdirSync(compiledDir)) {
        const regex = /.+-(\d+)_(\d+).+\.zkey$/
        const match = f.match(regex)
        if (match) {
            params.push(match.slice(1, 3).map((x) => Number(x)))
        }
    }
    const numPreimageB64PaddedBytes = calcNumPreimageB64PaddedBytes(headerAndPayload)
    const numEmailSubstrB64Bytes = calcNumEmailSubstrB64Bytes(headerAndPayload)
    const supportedEmailB64Lengths: number[] = []
    for (const p of params) {
        if (p[0] === numPreimageB64PaddedBytes && numEmailSubstrB64Bytes <= p[1]) {
            supportedEmailB64Lengths.push(p[1])
        }
    }

    const r = genJwtHiddenEmailAddressProverCircuitInputs(
        headerAndPayload,
        emailAddress,
        BigInt(salt),
        supportedEmailB64Lengths,
    )

    const witnessGenExe = path.join(
        path.resolve(compiledDir),
        `JwtHiddenEmailAddressProver-${r.numPreimageB64Bytes}_${r.numEmailSubstrB64Bytes}`
    )

    const zkeyPath = path.join(
        path.resolve(compiledDir),
        `JwtHiddenEmailAddressProver-${r.numPreimageB64Bytes}_${r.numEmailSubstrB64Bytes}.${zkeyType}.zkey`
    )

    fs.writeFileSync(
        inputFilepath,
        JSON.stringify(r.circuitInputs),
    )

    const witnessGenCmd = `${witnessGenExe} ${inputFilepath} ${wtnsFilepath}`
    const witnessGenOut = shelljs.exec(witnessGenCmd)
    if (witnessGenOut.code !== 0 || witnessGenOut.stderr) {
        console.error('Error: could not generate witness.')
        console.error(witnessGenOut)
        return 1
    }

    const proveCmd = `${rapidsnarkPath} ${zkeyPath} ${wtnsFilepath} ${outputPath} ${publicJsonPath}`
    console.log(proveCmd)
    const proveOut = shelljs.exec(proveCmd)
    if (proveOut.code !== 0 || proveOut.stderr) {
        console.error('Error: could not generate proof.')
        console.error(proveOut)
        return 1
    }

    // Delete witness and input files
    if (!keepFiles) {
        const delCmd = `rm -f ${inputFilepath} ${wtnsFilepath}`
        shelljs.exec(delCmd)
    }
    
     return 0
}

export { prove, configureSubparsers }
