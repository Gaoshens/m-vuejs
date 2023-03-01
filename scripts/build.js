const fs = require('fs');
const path = require('path');
const execa = require('execa');

// 获取packages文件夹
const packagesDir = path.resolve(__dirname, '../packages');

// 获取packages下所有的文件
const packages = fs.readdirSync(packagesDir).filter(f => {
  return fs.statSync(path.resolve(packagesDir, f)).isDirectory();
});

async function build(target) {
  return await execa('rollup', ['-c', '--bundleConfigAsCjs', '--environment', `TARGET:${target}`], {
    stdio: 'inherit',
  });
}

async function buildAll(targets) {
  const result = [];
  for (const item of targets) {
    result.push(build(item));
  }
  return result;
}

// 执行rollup打包
buildAll(packages)
  .then(() => {
    console.log('打包成功');
  })
  .catch(() => {
    console.log('打包失败');
  });
