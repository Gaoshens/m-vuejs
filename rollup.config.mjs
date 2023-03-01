import path from 'path';
import ts from 'rollup-plugin-typescript2';
import json from '@rollup/plugin-json';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import { terser } from 'rollup-plugin-terser';
import { nodeResolve } from '@rollup/plugin-node-resolve';

const resolvePath = p => path.resolve(__dirname, p);

const target = process.env.TARGET;

// 获取packages文件夹
const packagesDir = path.resolve(__dirname, './packages');
const resolve = p => path.resolve(packagesDir, target, p);

// 加载package.json文件
const packageJson = require(resolve('package.json'));

const buildOptions = packageJson?.buildOptions || {};

const name = buildOptions?.name || '';
const formats = buildOptions.formats || [];

const formatConfigs = {
  esm: {
    file: resolve(`dist/${name}.esm.js`),
    format: 'esm',
  },
  cjs: {
    file: resolve(`dist/${name}.cjs.js`),
    format: 'cjs',
  },
  global: {
    file: resolve(`dist/${name}.mjs.js`),
    format: 'iife',
  },
};

const createConfig = format => {
  const { file, format: _format } = formatConfigs[format];
  return {
    input: resolve('src/index.ts'),
    output: {
      file,
      format: _format,
      name,
    },
    plugins: [
      nodeResolve(),
      commonjs(),
      babel({
        exclude: 'node_modules/**',
      }),
      ts({
        config: resolvePath('../tsconfig.json'),
      }),
      json(),
      terser(),
    ],
  };
};

export default formats.map(format => createConfig(format));
