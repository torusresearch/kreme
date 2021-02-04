import * as fs from 'fs'
import * as argparse from 'argparse'
import {
    compile,
    configureSubparsers as configureSubparsersForCompile,
} from './compile'

import {
    downloadPhase1,
    configureSubparsers as configureSubparsersForDownloadPhase1,
} from './downloadPhase1'

import {
    genZkeys,
    configureSubparsers as configureSubparsersForGenZkeys,
} from './genZkeys'

const main = async () => {
    const parser = new argparse.ArgumentParser({ 
        description: 'Kreme - ZKP proof on JWTs'
    })

    const subparsers = parser.add_subparsers({
        title: 'Subcommands',
        dest: 'subcommand',
        required: true,
    })

    configureSubparsersForCompile(subparsers)
    configureSubparsersForDownloadPhase1(subparsers)
    configureSubparsersForGenZkeys(subparsers)

    const args = parser.parse_args()
    
    const loadConfig = (configFile: string) => {
        try {
            return JSON.parse(fs.readFileSync(args.config).toString())
        } catch {
            console.error('Error: could not read', args.config)
            return
        }
    }

    if (args.subcommand === 'compile') {
        const config = loadConfig(args.config)
        const outDir = args.output 
        await compile(config, outDir, args.no_clobber)
    } else if (args.subcommand === 'downloadPhase1') {
        await downloadPhase1(args.output, args.no_clobber)
    } else if (args.subcommand === 'genZkeys') {
        await genZkeys(args.ptau, args.r1cs, args.output, args.no_clobber)
    }
}

if (require.main === module) {
    main()
}
