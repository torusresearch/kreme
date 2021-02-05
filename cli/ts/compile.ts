import { ArgumentParser } from 'argparse'
import * as fs from 'fs'
import * as path from 'path'
import { compile as compileCircuit } from 'kreme-circuits'

const configureSubparsers = (subparsers: ArgumentParser) => {
    const compileCircuitsParser = subparsers.add_parser(
        'compile',
        { add_help: true },
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

    compileCircuitsParser.add_argument(
        '-o',
        '--output',
        {
            required: true,
            action: 'store',
            type: 'str',
            help: 'The directory in which to store compiled files.',
        }
    )

    compileCircuitsParser.add_argument(
        '-nc',
        '--no-clobber',
        {
            required: false,
            action: 'store_true',
            help: 'Skip compilation if compiled files exist',
        }
    )

}

const compile = async (config: any, outDir: string, noClobber: boolean) => {
    fs.mkdirSync(outDir, { recursive: true })
    
    const template = path.join(
        path.resolve('./'),
        config.circuits[0].template,
    )
    for (const c of config.circuits) {
        const circuitSrc = `include "${template}"; ` +
            `component main = ${c.component}(${c.params.join(', ')});`

        const filename = `${c.component}-${c.params.join('_')}.circom`
        const filepath = path.join(outDir, filename)
        fs.writeFileSync(filepath, circuitSrc)

        try {
            const out = compileCircuit(
                filepath,
                noClobber,
                config.circomRuntimePath,
                config.ffiasmPath,
            )
        } catch (e) {
            console.error(`Error: could not compile ${filename}\n${e.message}`)
            return 1
        }
    }

    return 0
}

export { compile, configureSubparsers }
