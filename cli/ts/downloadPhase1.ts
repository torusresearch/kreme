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

const URL = 'https://www.dropbox.com/sh/3dbajm52sch9b0k/AACVzdvBdvxuBtOobA4-5S_Ra?dl=1'
const SIZE = '1.2G'

const downloadPhase1 = async (filepath: string, noClobber: boolean) => {
    if (fs.existsSync(filepath) && noClobber) {
        console.log(`${filepath} exists. Skipping.`)
        return
    }

    const cmd = `wget --progress=bar:force:noscroll -O ${filepath} ${URL}`
    console.log(`Downloading the phase 1 file from ${URL} (${SIZE})`)
    shelljs.exec(cmd)
}

export { downloadPhase1, configureSubparsers }
