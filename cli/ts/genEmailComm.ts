import { ArgumentParser } from 'argparse'
import * as fs from 'fs'
import * as path from 'path'
import * as shelljs from 'shelljs'
import base64url from 'base64url'
import * as crypto from 'crypto'
import {
    genEmailComm as genComm,
} from 'kreme-circuits'

const configureSubparsers = (subparsers: ArgumentParser) => {
    const compileCircuitsParser = subparsers.add_parser(
        'genEmailComm',
        { add_help: true },
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
        '-l',
        '--length',
        {
            required: true,
            action: 'store',
            type: Number,
            help: 'The email address substring length parameter of the circuit',
        }
    )

}

const genEmailComm = async (
    emailAddress: string,
    salt: string,
    length: number,
) => {
    let saltAsHex
    if (salt.toString().startsWith('0x')) {
        saltAsHex = BigInt(salt)
    } else {
        saltAsHex = BigInt('0x' + salt)
    }

    const comm = genComm(emailAddress, BigInt(saltAsHex), length)
    console.log(comm.toString(16))
}

export { genEmailComm, configureSubparsers }
