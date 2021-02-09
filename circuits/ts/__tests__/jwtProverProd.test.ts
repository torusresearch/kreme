jest.setTimeout(90000)
import * as assert from 'assert'
import base64url from 'base64url'
import * as fs from 'fs'
import { 
    genJwtProverCircuitInputs,
    jwtBytesToBits,
    sha256BufferToHex,
    buffer2bitArray,
    bitArray2buffer,
    genSubstrByteArr,
    strToByteArr,
    strToPaddedBytes,
    numArrToBuf,
} from '../'

import * as crypto from 'crypto'
import { genWitness, getSignalByName } from './utils'
const ff = require('ffjavascript')
const stringifyBigInts: (obj: object) => any = ff.utils.stringifyBigInts
import {
    sha256ToFieldElements,
} from 'kreme-crypto'

const circuit = 'jwtProver_1344'

const domain = '@company.xyz"'
const email = `"email" :  "alice${domain}`

const testCircuit = async (headerAndPayload: string) => {
    const circuitInputs = genJwtProverCircuitInputs(headerAndPayload, domain)

    const start = Date.now()
    const witness = await genWitness(circuit, circuitInputs)
    const end = Date.now()
    const duration = (end - start) / 1000
    console.log('Witness generation took', duration, 'seconds')
    expect(witness.length > 0).toBeTruthy()

    //const debug: string[] = []
    //for (let i = 0; i < NUM_EMAIL_SUBSTR_B64_BYTES * 6 / 8; i ++) {
        //const out = await getSignalByName(circuit, witness, `main.debug[${i}]`)
        //debug.push(out)
    //}
    //const debugStr = debug.join('')
}

describe('JWTProver circuit', () => {
    it('Should prove the existence of a domain name in the correct position and verify the hash (1)', async () => {
        const headerAndPayload =
            'eyJhbGciOiJSUzI1NiIsImtpZCI6IjAzYjJkMjJjMmZlY2Y4NzNlZDE5ZTViOGNmNzA0YWZiN2UyZWQ0YmUiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiI4NzY3MzMxMDUxMTYtaTBoajNzNTNxaWlvNWs5NXBycGZtajBocDBnbWd0b3IuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI4NzY3MzMxMDUxMTYtaTBoajNzNTNxaWlvNWs5NXBycGZtajBocDBnbWd0b3IuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMDEyMTIxMjA2MTg2NTM3MzIzNTciLCJlbWFpbCI6InRyb25za3l0YWRwb2xlQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJhdF9oYXNoIjoiY3doLWp4Z0VmUWtuamlmczkwRUV6dyIsIm5vbmNlIjoiVDVzUWJyaUpTd3dIMUM0U2RQeEprTGJ1Mm9yNGs4IiwibmFtZSI6IlRyb25za3kgVGFkcG9sZSIsInBpY3R1cmUiOiJodHRwczovL2xoNi5nb29nbGV1c2VyY29udGVudC5jb20vLW5sSTJ3S0hRZGZJL0FBQUFBQUFBQUFJL0FBQUFBQUFBQUFBL0FNWnV1Y21OUHZNeS1BMVNoajVGcHBfckhPTGlzcGY2Smcvczk2LWMvcGhvdG8uanBnIiwiZ2l2ZW5fbmFtZSI6IlRyb25za3kiLCJmYW1pbHlfbmFtZSI6IlRhZHBvbGUiLCJsb2NhbGUiOiJlbiIsImlhdCI6MTYxMjI1ODU4MiwiZXhwIjoxNjEyMjYyMTgyLCJqdGkiOiIwNDEzODAzZWM5YzNiMDk4ZTgwNmFiM2VhNjBmZTM2OGJmZjRkNzJkIn0.L4q2xZL1WYDrZ_OiRs5q1FmzB8Q-A3ZavHC138wxcNb-Ig5KAIO7soSAPAJU4eB9Vz4WypZgxJtxD2kyuhbFpysVp6j-1LcouDSRgLKruu7-FmQadWbsQv48Ps6TrG9psXP9eo3Ud7sfTQqSiHS49IokBqjPbOwL5GglJ5pCTjAnn6-yU2zZpFg_QJtitZMiyq_ylS-i_4VIgS82AKqHpqNM3V8x3QueVoMu0CrszVujbFO6oE-r9-lUxB6VLM9EpLq-VWcieCit-lDGaKAQka-dk4ij-krLysD-OGT56usOn32r101px6kL1hlpL9GaQMrHa5GSmshAMqUTBl5vrw'
        await testCircuit(headerAndPayload)
    })
})
