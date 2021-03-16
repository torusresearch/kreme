# Development and testing

Follow the instructions in [Non-Docker Setup](./nondockersetup.html).

Note that you should only run `npm i` in the root directory. To install NPM
dependencies for the submodules like `circuits` and `crypto`, run `npm run
bootstrap` in the root directory.

Run `npm run build` in the root directory to build all submodules.

Run `npm run build` in a submodule to build just that submodule.

Run `npm run watch` in a submodule to build just that submodule in watch mode
(`tsc --watch`). This makes development easier.

## Tests

To run tests in the `circuits` directory, first run `circom-helper` in a
separate terminal:

```bash
cd circuits &&
npm run circom-helper
```

Once `circom-helper` says that it has launched a JSON-RPC server, run the
following in another terminal:

```
cd circuits &&
npm run test
```
