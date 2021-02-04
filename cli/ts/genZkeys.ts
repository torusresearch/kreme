import { ArgumentParser } from 'argparse'
import * as fs from 'fs'
import * as path from 'path'
import * as shelljs from 'shelljs'
import { genZkey } from 'kreme-circuits'

const configureSubparsers = (subparsers: ArgumentParser) => {
    const compileCircuitsParser = subparsers.add_parser(
        'genZkeys',
        { add_help: true },
    )

    compileCircuitsParser.add_argument(
        '-p',
        '--ptau',
        {
            required: true,
            action: 'store',
            type: 'str',
            help: 'The filepath of the Phase 1 .ptau file',
        }
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

    //compileCircuitsParser.add_argument(
        //'-c',
        //'--config',
        //{
            //required: true,
            //action: 'store',
            //type: 'str',
            //help: 'The config file that specifies the circuit parameters. ' +
                  //'See compile_config.example.json.',
        //}
    //)

    compileCircuitsParser.add_argument(
        '-r',
        '--r1cs',
        {
            required: true,
            action: 'store',
            type: 'str',
            help: 'The directory containing the .r1cs files',
        }
    )
}

const genZkeys = async (
    ptauFile: string,
    r1csDir: string,
    outDir: string,
    noClobber: boolean,
) => {
    if (!fs.existsSync(ptauFile)) {
        throw new Error(`Error: ${ptauFile} does not exist`)
        return
    }
    const ptauFilepath = path.join(
        __dirname,
        '..',
        ptauFile,
    )

    for (const c of fs.readdirSync(r1csDir)) {
        if (c && c.endsWith('.r1cs')) {
            const r1csFile = path.join(
                __dirname,
                '..',
                r1csDir,
                c,
            )
            genZkey(r1csFile, ptauFilepath, noClobber)
        }
    }
}

export { genZkeys, configureSubparsers }
