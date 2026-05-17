import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('[Post-Build] Creating itch.io-compatible single-file build...');

const distDir = './dist';
const indexPath = path.join(distDir, 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error('[Post-Build] dist/index.html not found!');
  process.exit(1);
}

let html = fs.readFileSync(indexPath, 'utf8');

// 1. Find the compiled JS bundle
const assetsDir = path.join(distDir, 'assets');
let jsFile = '';
if (fs.existsSync(assetsDir)) {
  const files = fs.readdirSync(assetsDir);
  jsFile = files.find(f => f.startsWith('index-') && f.endsWith('.js')) || '';
}

if (!jsFile) {
  console.error('[Post-Build] Could not find the compiled JS bundle in dist/assets/!');
  process.exit(1);
}

const jsPath = path.join(assetsDir, jsFile);
let jsCode = fs.readFileSync(jsPath, 'utf8');
console.log(`[Post-Build] Found JS bundle: ${jsFile} (${(jsCode.length / 1024).toFixed(0)} KB)`);

// 2. Strip Vite's modulepreload polyfill — it tries to fetch() external files
//    which triggers 403 on itch.io. The polyfill is the IIFE at the very start.
jsCode = jsCode.replace(
  /^\(function\(\)\{const \w+=document\.createElement\("link"\)\.relList;.*?\}\)\(\);/s,
  '/* modulepreload polyfill removed for itch.io compatibility */'
);
console.log('[Post-Build] Stripped modulepreload polyfill.');

// 3. Escape </script> inside JS to prevent premature HTML tag closure
jsCode = jsCode.replace(/<\/script>/gi, '<\\/script>');
console.log('[Post-Build] Escaped </script> sequences in JS bundle.');

// 4. Remove the external <script type="module" src="..."> tag
const scriptTagRegex = /<script\s+type="module"\s+[^>]*\bsrc="[^"]+"\s*><\/script>/i;

// 5. Remove any <link rel="modulepreload" ...> tags
html = html.replace(/<link\s+rel="modulepreload"[^>]*>/gi, '');

// 6. Replace the script tag with inlined code wrapped in a plain <script>
//    CRITICAL: Use a callback function for .replace() to avoid $& substitution bugs
//    in Phaser's minified bitwise operations like x&y
if (scriptTagRegex.test(html)) {
  html = html.replace(scriptTagRegex, () => `<script>\n${jsCode}\n</script>`);
  console.log('[Post-Build] Replaced external script tag with inlined code.');
} else {
  console.warn('[Post-Build] External script tag not found — injecting before </head>...');
  html = html.replace('</head>', () => `<script>\n${jsCode}\n</script>\n</head>`);
}

// 7. Write the self-contained HTML
fs.writeFileSync(indexPath, html, 'utf8');
console.log('[Post-Build] Saved self-contained index.html.');

// 8. Delete assets directory — everything is inlined, no external files needed
if (fs.existsSync(assetsDir)) {
  fs.rmSync(assetsDir, { recursive: true, force: true });
  console.log('[Post-Build] Deleted assets/ directory (no longer needed).');
}

// 9. Create ZIP with only index.html
const zipName = 'ChronosGuardian_itch.zip';
if (fs.existsSync(zipName)) fs.unlinkSync(zipName);

console.log('[Post-Build] Creating ZIP archive...');
try {
  if (process.platform === 'win32') {
    execSync(`powershell -Command "Compress-Archive -Path 'dist\\index.html' -DestinationPath '${zipName}' -Force"`);
  } else {
    execSync(`cd dist && zip -r ../${zipName} index.html`);
  }
  
  const zipSize = fs.statSync(zipName).size;
  console.log(`[Post-Build] Created ${zipName} (${(zipSize / 1024 / 1024).toFixed(1)} MB)`);
  console.log('[Post-Build] Upload this ZIP to itch.io as an HTML game.');
} catch (error) {
  console.error('[Post-Build] ZIP creation failed:', error.message);
  console.log('[Post-Build] Manually zip dist/index.html and upload to itch.io.');
}
