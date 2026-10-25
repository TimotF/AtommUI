import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const tarball = resolve(process.argv[2] ?? '');
if (!process.argv[2] || !existsSync(tarball)) throw new Error('Pass the npm .tgz archive to verify.');

const files = new Set(execFileSync('tar', ['-tzf', tarball], { encoding: 'utf8' }).trim().split('\n'));
const manifest = JSON.parse(execFileSync('tar', ['-xOzf', tarball, 'package/package.json'], { encoding: 'utf8' }));
if (manifest.name !== '@timotf/atomm-ui' || !/^\d+\.\d+\.\d+$/.test(manifest.version) || manifest.private) {
  throw new Error('Unexpected package identity, version or private flag.');
}
for (const name of [
  'package/package.json', 'package/LICENSE', 'package/README.md',
  'package/dist/atomm-ui.js', 'package/dist/index.d.ts',
  'package/dist/atomm-ui.css', 'package/dist/compact.css',
  'package/dist/theme.js', 'package/dist/theme.d.ts',
  'package/dist/three.js', 'package/dist/three.d.ts',
]) {
  if (!files.has(name)) throw new Error(`Missing from npm archive: ${name}`);
}
for(const name of ['pine-color.webp','walnut-color.webp','pine-normal.jpg','pine-roughness.jpg','walnut-normal.jpg','walnut-roughness.jpg'])if(!files.has('package/dist/'+name))throw new Error('Missing external preview texture: '+name);
const previewCode=execFileSync('tar',['-xOzf',tarball,'package/dist/three.js'],{encoding:'utf8'});
if(previewCode.includes('data:image/')||/"\/(?:pine|walnut)-/.test(previewCode)||!previewCode.includes('import.meta.url'))throw new Error('Preview textures must be relative module assets, not embedded or root-relative URLs.');
if ([...files].some((name) => !name.startsWith('package/') || name.includes('.DS_Store') || name.startsWith('package/src/'))) {
  throw new Error('The npm archive contains local or source-only files.');
}

// Licensing is part of the published package contract, including its boundary.
if (manifest.license !== 'SEE LICENSE IN LICENSE') throw new Error('Missing proprietary package license metadata.');
for (const name of ['package/THIRD_PARTY_NOTICES.md', 'package/ASSET_LICENSES.md', 'package/licenses/AtommUI-MIT-through-0.15.8.txt', 'package/licenses/@xmldom-xmldom/LICENSE', 'package/licenses/vue/LICENSE', 'package/licenses/vuetify/LICENSE.md', 'package/licenses/three/LICENSE']) {
  if (!files.has(name)) throw new Error(`Missing licensing notice: ${name}`);
}
const license = execFileSync('tar', ['-xOzf', tarball, 'package/LICENSE'], {encoding:'utf8'});
const legacy = execFileSync('tar', ['-xOzf', tarball, 'package/licenses/AtommUI-MIT-through-0.15.8.txt'], {encoding:'utf8'});
if (!license.startsWith('PROPRIETARY SOFTWARE') || !license.includes('0.15.8') || !legacy.startsWith('MIT License')) throw new Error('Invalid prospective licensing boundary.');

for (const [name, file] of [['@xmldom/xmldom','LICENSE'], ['vue','LICENSE'], ['vuetify','LICENSE.md'], ['three','LICENSE']]) {
  const archived = execFileSync('tar', ['-xOzf', tarball, 'package/licenses/' + name.replaceAll('/','-') + '/' + file]);
  if (!archived.equals(readFileSync(new URL('../node_modules/' + name + '/' + file, import.meta.url)))) throw new Error('Dependency notice changed or stale: ' + name);
}

const consumer = mkdtempSync(join(tmpdir(), 'atomm-ui-consumer-'));
try {
  writeFileSync(join(consumer, 'package.json'), JSON.stringify({
    name: 'atomm-ui-package-smoke', version: '1.0.0', private: true, type: 'module',
    dependencies: {
      '@timotf/atomm-ui': `file:${tarball}`,
      vue: '3.5.43', vuetify: '4.2.3',
    },
  }, null, 2));
  const npmFlags = ['--ignore-scripts', '--no-audit', '--no-fund'];
  execFileSync('npm', ['install', '--package-lock-only', ...npmFlags], { cwd: consumer, stdio: 'inherit' });
  execFileSync('npm', ['ci', ...npmFlags], { cwd: consumer, stdio: 'inherit' });
  execFileSync(process.execPath, ['--input-type=module', '-e', `
    const theme = await import('@timotf/atomm-ui/theme');
    if (!theme.atommTheme) throw new Error('Theme subpath is unavailable without a CSS loader');
  `], { cwd: consumer, stdio: 'inherit' });
  writeFileSync(join(consumer, 'register-css-loader.mjs'), `
    import { register } from 'node:module';
    register('./css-loader.mjs', import.meta.url);
  `);
  writeFileSync(join(consumer, 'css-loader.mjs'), `
    export async function resolve(specifier, context, nextResolve) {
      if (specifier.endsWith('.css')) return { url: 'data:text/javascript,export default {}', shortCircuit: true };
      return nextResolve(specifier, context);
    }
    export async function load(url, context, nextLoad) {
      if (url.endsWith('.css')) return { format: 'module', source: 'export default {}', shortCircuit: true };
      return nextLoad(url, context);
    }
  `);
  execFileSync(process.execPath, ['--import', join(consumer, 'register-css-loader.mjs'), '--input-type=module', '-e', `
    import { createRequire } from 'node:module';
    import { readFileSync } from 'node:fs';
    const pkg = await import('@timotf/atomm-ui');
    const require = createRequire(import.meta.url);
    if (!pkg.AuDialog || !pkg.AuMaterialPicker || !pkg.AuMaterialThumbnail || !pkg.AuTextField || !pkg.AuSwitch || !pkg.AuSvgViewport || !pkg.AuColorField || !pkg.AuZoomControls || !pkg.AuTooltip || !pkg.AuFieldGroup || !pkg.AuFieldGroups || !pkg.AuSceneControls || !pkg.AuHistoryControls || !pkg.AuOnboarding || !pkg.AuOnboardingCard || typeof pkg.useOnboarding !== 'function') throw new Error('Missing shared controls');
    if (typeof pkg.createAtommVuetify !== 'function') throw new Error('Invalid JS exports');
    for (const name of ['style.css', 'compact.css']) {
      if (!readFileSync(require.resolve('@timotf/atomm-ui/' + name), 'utf8').trim()) throw new Error('Empty CSS export: ' + name);
    }
  `], { cwd: consumer, stdio: 'inherit' });
  execFileSync('npm', ['install', 'three@0.186.1', ...npmFlags], { cwd: consumer, stdio: 'inherit' });
  execFileSync(process.execPath, ['--input-type=module', '-e', `
    const {previewMeshes,PreviewStage,PreviewMaterialLibrary,plywoodEdgeTexture,materialSurfaces}=await import('@timotf/atomm-ui/three');
    const meshes=previewMeshes({path:'M0 0H10V10H0Z',thickness:3});
    if(typeof PreviewStage!=='function'||meshes.length!==1||!meshes[0].position.every(Number.isFinite)) throw new Error('Optional 3D entry is invalid');
    if(typeof PreviewMaterialLibrary!=='function'||typeof plywoodEdgeTexture!=='function'||Object.keys(materialSurfaces).join(',')!=='pine,walnut') throw new Error('Missing public wood materials');
  `], { cwd: consumer, stdio: 'inherit' });
  const lock = JSON.parse(readFileSync(join(consumer, 'package-lock.json'), 'utf8'));
  if (!lock.packages['node_modules/@timotf/atomm-ui']?.integrity) throw new Error('Consumer lockfile lacks archive integrity.');
  console.log('npm archive and clean consumer: OK');
} finally {
  rmSync(consumer, { recursive: true, force: true });
}
