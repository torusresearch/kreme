import { ArgumentParser } from 'argparse'
import jwt_decode from 'jwt-decode'
import * as fs from 'fs'
import * as path from 'path'
import * as shelljs from 'shelljs'
import base64url from 'base64url'
import * as crypto from 'crypto'

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
        '-o',
        '--output',
        {
            required: true,
            action: 'store',
            type: 'str',
            help: 'The path to the proof.json output file',
        }
    )
}


const prove = async (jwt: string, output: string) => {
    const s = jwt.split('.')
    const header = base64url.decode(s[0])
    const payload = base64url.decode(s[1])
    const b64Plaintext = s[0] + '.' + s[1]
    const b = Buffer.from(b64Plaintext, 'utf8')
    const hash = crypto.createHash('sha256')
        .update(b)
        .digest('hex')
    const hashBuf = Buffer.from(hash, 'hex')
    const expectedHash = [
        BigInt('0x' + hashBuf.slice(0, 16).toString('hex')),
        BigInt('0x' + hashBuf.slice(16, 32).toString('hex')),
    ]

    const plaintext = header + '.' + payload

    console.log(plaintext)
}

export { prove, configureSubparsers }
