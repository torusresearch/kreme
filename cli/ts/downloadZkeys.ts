import { ArgumentParser } from 'argparse'
import * as fs from 'fs'
import * as path from 'path'
import * as shelljs from 'shelljs'
import { genCircuitFilePrefix } from './utils'

const configureSubparsers = (subparsers: ArgumentParser) => {
    const compileCircuitsParser = subparsers.add_parser(
        'downloadZkeys',
        { add_help: true },
    )

    compileCircuitsParser.add_argument(
        '-o',
        '--output',
        {
            required: true,
            action: 'store',
            type: 'str',
            help: 'The directory in which to store the .zkey files',
        }
    )

    compileCircuitsParser.add_argument(
        '-nc',
        '--no-clobber',
        {
            required: false,
            action: 'store_true',
            help: 'Skip existing .zkey files',
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
        '--config',
        {
            required: true,
            action: 'store',
            type: 'str',
            help: 'The config file that specifies the circuit parameters. ' +
                  'See compile_config.example.json.',
        }
    )
}

const downloadZkeys = async (
    config: any,
    outDir: string,
    zkeyType: string,
    noClobber: boolean,
) => {
    for (const circuit of config.circuits) {
        const url = circuit.zkeyUrls[zkeyType]
        const zkeyPath = path.join(
            path.resolve(outDir),
            `${genCircuitFilePrefix(circuit.component, circuit.params)}.${zkeyType}.zkey`
        )
        const exists = fs.existsSync(zkeyPath)
        if (exists && noClobber) {
            console.log(`${zkeyPath} exists. Skipping.`)
            continue
        }
        const cmd = `wget --progress=bar:force:noscroll -O ${zkeyPath} ${url}`
        shelljs.exec(cmd)
    }
}

export { downloadZkeys, configureSubparsers }
