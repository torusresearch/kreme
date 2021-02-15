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

import {
    downloadZkeys,
    configureSubparsers as configureSubparsersForDownloadZkeys,
} from './downloadZkeys'

import {
    prove,
    configureSubparsers as configureSubparsersForProve,
} from './prove'

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
    configureSubparsersForDownloadZkeys(subparsers)
    configureSubparsersForProve(subparsers)

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
        try {
            const config = loadConfig(args.config)
            const outDir = args.output 
            return (await compile(config, outDir, args.no_clobber))
        } catch {
            return 1
        }
    } else if (args.subcommand === 'downloadPhase1') {
        return (await downloadPhase1(args.output, args.no_clobber))
    } else if (args.subcommand === 'genZkeys') {
        return (await genZkeys(args.ptau, args.r1cs, args.output, args.no_clobber))
    } else if (args.subcommand === 'downloadZkeys') {
        try {
            const config = loadConfig(args.config)
            const outDir = args.output 
            return (await downloadZkeys(config, outDir, args['type'], args.no_clobber))
        } catch {
            return 1
        }
    } else if (args.subcommand === 'prove') {
        return (await prove(
            args.jwt,
            args.email,
            args.salt,
            args.compiled_dir,
            args.rapidsnark,
            args.output,
            args['public'],
            args.keep,
            args['type'],
        ))
    }
}

if (require.main === module) {
    main()
}
