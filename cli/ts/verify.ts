import { ArgumentParser } from 'argparse'
import * as fs from 'fs'
import * as path from 'path'
import * as shelljs from 'shelljs'

import {
    sha256HashToFieldElements,
} from 'kreme-crypto'

const configureSubparsers = (subparsers: ArgumentParser) => {
    const compileCircuitsParser = subparsers.add_parser(
        'verify',
        { add_help: true },
    )

    compileCircuitsParser.add_argument(
        '-p',
        '--proof',
        {
            required: true,
            action: 'store',
            type: 'str',
            help: 'The filepath to the JSON file containing the proof',
        }
    )

    compileCircuitsParser.add_argument(
        '-e',
        '--email-address-commitment',
        {
            required: true,
            action: 'store',
            type: 'str',
            help: 'The commitment to the email address',
        }
    )

    compileCircuitsParser.add_argument(
        '-j',
        '--jwt-hash',
        {
            required: true,
            action: 'store',
            type: 'str',
            help: 'The SHA256 hash of the JWT token (in hexadecimal)',
        }
    )

    compileCircuitsParser.add_argument(
        '-z',
        '--zkey',
        {
            required: true,
            action: 'store',
            type: 'str',
            help: 'The path to zkey file',
        }
    )
}

const verify = async (
    zkey: string,
    proof: string,
    emailAddressCommitment: string,
    jwtHash: string,
) => {
    // Check that jwtHash is valid
    let jwtHashAsHex
    try {
        if (jwtHash.startsWith('0x')) {
            jwtHashAsHex = BigInt(jwtHash).toString(16)
        } else {
            jwtHashAsHex = BigInt('0x' + jwtHash).toString(16)
        }
    } catch {
        console.error('Error: invalid --jwt-hash value')
        return 1
    }
    // Convert jwtHash to expectedHash
    const expectedHash = sha256HashToFieldElements(jwtHashAsHex)

    // Convert emailAddressCommitment
    let comm
    try {
        if (emailAddressCommitment.startsWith('0x')) {
            comm = BigInt(emailAddressCommitment).toString(16)
        } else {
            comm = BigInt('0x' + emailAddressCommitment).toString(16)
        }
    } catch {
        console.error('Error: invalid --email-address-commitment value')
        return 1
    }

    // Construct public.json
    const publicInputs = [
        ...expectedHash.map((x) => x.toString()),
        comm,
    ]

    const temp = Date.now().toString() + '.' + (Math.random().toString().slice(3, 8)) 
    const publicInputsFile = `input.${temp}.json`
    fs.writeFileSync(publicInputsFile, JSON.stringify(publicInputs))

    const snarkjsPath = path.join(
        __dirname,
        '..',
        '..',
        'circuits',
        'node_modules',
        'snarkjs',
        'build',
        'cli.cjs',
    )

    const vkFile = `vk.${temp}.json`
    const exportCmd = `node ${snarkjsPath} zkev ${zkey} ${vkFile}`
    shelljs.exec(exportCmd)

    const verifyCmd = `node ${snarkjsPath} g16v ${vkFile} ${publicInputsFile} ${proof}`
    const verifyOut = shelljs.exec(verifyCmd, { silent: true })
    const isValid = verifyOut.stdout.indexOf('OK!') > -1

    // Delete the json files
    const delCmd = `rm -f ${vkFile} ${publicInputsFile}`
    shelljs.exec(delCmd)

    // Verify the proof
    if (isValid) {
        console.log('Valid proof')
        return 0
    } else {
        console.log('Invalid proof')
        return 1
    }
}

export { verify, configureSubparsers }
