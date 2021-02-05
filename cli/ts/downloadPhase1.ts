import { ArgumentParser } from 'argparse'
import * as fs from 'fs'
import * as path from 'path'
import * as shelljs from 'shelljs'

const configureSubparsers = (subparsers: ArgumentParser) => {
    const compileCircuitsParser = subparsers.add_parser(
        'downloadPhase1',
        { add_help: true },
    )

    compileCircuitsParser.add_argument(
        '-o',
        '--output',
        {
            required: true,
            action: 'store',
            type: 'str',
            help: 'The filepath of the Phase 1 .ptau file',
        }
    )

    compileCircuitsParser.add_argument(
        '-nc',
        '--no-clobber',
        {
            required: false,
            action: 'store_true',
            help: 'Do nothing if the file exists',
        }
    )
}

const URL = 'https://www.dropbox.com/s/02xi5ygo59o33oh/powersOfTau28_hez_final_20.ptau?dl=1'
const SIZE = '1.13G'

const downloadPhase1 = async (filepath: string, noClobber: boolean) => {
    const checksumFile = path.join(
        __dirname,
        '..',
        'ptau.checksum',
    )

    const verify = () => {
        const checksumCmd = `b2sum -c ${checksumFile}`
        const out = shelljs.exec(checksumCmd)
        if (out.code !== 0) {
            console.error('Error: invalid .ptau file')
            return 1
        }
        return 0
    }

    const exists = fs.existsSync(filepath)
    if (exists && verify() === 1) {
        return 1
    }

    if (exists && noClobber) {
        console.log(`${filepath} exists. Skipping.`)
        return 0
    } else {
        const cmd = `wget --progress=bar:force:noscroll -O ${filepath} ${URL}`
        console.log(`Downloading the phase 1 file from ${URL} (${SIZE})`)
        shelljs.exec(cmd)

        if (verify() === 1) {
            return 1
        }
    }
    return 0
}

export { downloadPhase1, configureSubparsers }
