/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function resolveFilename(request, parent, isMain, options) {
  try {
    return originalResolveFilename.call(this, request, parent, isMain, options);
  } catch (error) {
    if (
      error.code === 'MODULE_NOT_FOUND' &&
      (request.startsWith('./') || request.startsWith('../'))
    ) {
      const parentDir = parent?.filename
        ? path.dirname(parent.filename)
        : process.cwd();
      const candidate = path.resolve(parentDir, request);
      const indexTs = path.join(candidate, 'index.ts');

      if (fs.existsSync(indexTs)) {
        return indexTs;
      }
    }

    throw error;
  }
};

require.extensions['.ts'] = function registerTypeScript(module, filename) {
  const source = fs.readFileSync(filename, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
    fileName: filename,
  });

  module._compile(outputText, filename);
};

require('./game-engine.test.ts');
require('./setup.test.ts');
require('./game-session.test.ts');
