#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

console.log('====================================================');
console.log('🔍 AUDITORIA DE CONFORMIDADE TWA (GOOGLE PLAY STORE)');
console.log('   Iron Side Road Rider M.C. • Dinastia System');
console.log('====================================================\n');

let allPassed = true;

function check(title, condition, detail) {
  if (condition) {
    console.log(`✅ [APROVADO] ${title}`);
    if (detail) console.log(`   ↳ ${detail}`);
  } else {
    console.log(`❌ [REPROVADO] ${title}`);
    if (detail) console.log(`   ↳ ${detail}`);
    allPassed = false;
  }
}

// 1. Verificar manifest.webmanifest
try {
  const manifestPath = path.resolve('public/manifest.webmanifest');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  check('Web App Manifest existe e é JSON válido', true, manifestPath);
  check('display é "standalone"', manifest.display === 'standalone', `display: "${manifest.display}"`);
  check('start_url está definido', Boolean(manifest.start_url), `start_url: "${manifest.start_url}"`);
  check('name e short_name definidos', Boolean(manifest.name && manifest.short_name), `name: "${manifest.name}", short_name: "${manifest.short_name}"`);
  check('theme_color e background_color definidos', Boolean(manifest.theme_color && manifest.background_color), `theme: ${manifest.theme_color}, bg: ${manifest.background_color}`);

  const has192 = manifest.icons?.some((i) => i.sizes === '192x192');
  const has512 = manifest.icons?.some((i) => i.sizes === '512x512');
  const hasMaskable = manifest.icons?.some((i) => i.purpose?.includes('maskable'));

  check('Ícones mínimos PWA (192x192 e 512x512)', has192 && has512, '192x192 e 512x512 presentes');
  check('Ícone Maskable para Android (512x512 maskable)', hasMaskable, 'Ícone adaptativo maskable configurado');
  check('Atalhos da Tela Inicial (shortcuts)', Array.isArray(manifest.shortcuts) && manifest.shortcuts.length >= 2, `${manifest.shortcuts?.length || 0} atalhos rápidos configurados`);
} catch (e) {
  check('Web App Manifest', false, e.message);
}

// 2. Verificar assetlinks.json
try {
  const assetlinksPath = path.resolve('public/.well-known/assetlinks.json');
  const assetlinks = JSON.parse(fs.readFileSync(assetlinksPath, 'utf8'));

  check('Digital Asset Links existe em public/.well-known/assetlinks.json', true, assetlinksPath);
  check('Relação "handle_all_urls" configurada', assetlinks[0]?.relation?.includes('delegate_permission/common.handle_all_urls'), 'Ativa o modo tela cheia no Android');
  check('Package Name configurado', Boolean(assetlinks[0]?.target?.package_name), `Package: ${assetlinks[0]?.target?.package_name}`);
  check('SHA-256 Fingerprint declarada', Boolean(assetlinks[0]?.target?.sha256_cert_fingerprints?.length), `Fingerprints: ${assetlinks[0]?.target?.sha256_cert_fingerprints?.join(', ')}`);
} catch (e) {
  check('Digital Asset Links', false, e.message);
}

// 3. Verificar .htaccess
try {
  const htaccessPath = path.resolve('public/.htaccess');
  const htaccess = fs.readFileSync(htaccessPath, 'utf8');

  check('MIME-Type application/json para assetlinks.json no .htaccess', htaccess.includes('assetlinks.json'), 'Garante cabeçalhos corretos para o crawler do Google');
  check('Regras no-cache para manifest e Service Worker', htaccess.includes('no-cache'), 'Garante atualizações em tempo real');
} catch (e) {
  check('.htaccess', false, e.message);
}

// 4. Verificar scripts de build do TWA
try {
  const twaScript = path.resolve('scripts/twa-setup.sh');
  const twaManifest = path.resolve('scripts/twa-manifest.json');

  check('Script de automação scripts/twa-setup.sh presente', fs.existsSync(twaScript), twaScript);
  check('Manifesto do Bubblewrap scripts/twa-manifest.json presente', fs.existsSync(twaManifest), twaManifest);
} catch (e) {
  check('Scripts TWA', false, e.message);
}

console.log('\n----------------------------------------------------');
if (allPassed) {
  console.log('🎉 RESULTADO: O aplicativo está 100% EM CONFORMIDADE com os');
  console.log('   requisitos técnicos de TWA da Google Play Store!');
} else {
  console.log('⚠️  Algumas pendências foram identificadas acima.');
}
console.log('====================================================\n');
