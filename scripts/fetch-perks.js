#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const REFERENCE_FILE = path.join(__dirname, '..', 'perks-reference.json');
const CACHE_DIR = path.join(__dirname, '..', '.cache');
const PERKS_CACHE_FILE = path.join(CACHE_DIR, 'perks-it.json');

const MANIFEST_INDEX_URL = 'https://www.bungie.net/Platform/Destiny2/Manifest/';
const BUNGIE_BASE = 'https://www.bungie.net';
const LOCALE = 'it';

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

async function downloadFile(url, dest, label) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  let received = 0;

  const writeStream = fs.createWriteStream(dest);
  const reader = response.body.getReader();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.length;
    writeStream.write(Buffer.from(value));
    process.stdout.write(`\r  ${label}: ${(received / 1024 / 1024).toFixed(1)} MB`);
  }
  writeStream.end();
  console.log('');
}

async function getPerksData() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }

  if (fs.existsSync(PERKS_CACHE_FILE)) {
    const stat = fs.statSync(PERKS_CACHE_FILE);
    const ageHours = (Date.now() - stat.mtimeMs) / (1000 * 60 * 60);
    if (ageHours < 24) {
      console.log(`Usando cache (${ageHours.toFixed(1)} ore fa).`);
      return JSON.parse(fs.readFileSync(PERKS_CACHE_FILE, 'utf-8'));
    }
    console.log('Cache scaduta (>24 ore). Riscarico...');
  }

  console.log('Recupero indice manifest...');
  const manifestIndex = await fetchJson(MANIFEST_INDEX_URL);

  const defs = manifestIndex?.Response?.jsonWorldComponentContentPaths?.[LOCALE];
  if (!defs) {
    throw new Error(`Locale "${LOCALE}" non trovato nel manifest.`);
  }

  const litePath = defs.DestinyInventoryItemLiteDefinition;
  if (!litePath) {
    throw new Error('DestinyInventoryItemLiteDefinition non trovata nel manifest.');
  }

  const liteUrl = BUNGIE_BASE + litePath;
  console.log(`Scaricamento DestinyInventoryItemLiteDefinition (${LOCALE})...`);
  await downloadFile(liteUrl, PERKS_CACHE_FILE, 'Scaricamento');

  console.log('Lettura file...');
  return JSON.parse(fs.readFileSync(PERKS_CACHE_FILE, 'utf-8'));
}

function readReference() {
  if (!fs.existsSync(REFERENCE_FILE)) {
    return {};
  }
  return JSON.parse(fs.readFileSync(REFERENCE_FILE, 'utf-8'));
}

function resolveIds(id, ref) {
  const ids = [id];
  const entry = ref[id];
  if (entry) {
    if (entry.enhancedId) ids.push(entry.enhancedId);
    if (entry.baseId) ids.push(entry.baseId);
  }
  return ids;
}

async function main() {
  const args = process.argv.slice(2);
  const reference = readReference();
  const referenceIds = Object.keys(reference);

  const allIds = [
    ...new Set([...referenceIds, ...args.filter((a) => /^\d+$/.test(a))]),
  ];

  if (allIds.length === 0) {
    console.log('Uso: node scripts/fetch-perks.js [id1 id2 ...]');
    console.log(
      '  Verifica gli ID in perks-reference.json e opzionalmente cerca nuovi ID.'
    );
    process.exit(0);
  }

  console.log(`Verifica di ${allIds.length} ID...\n`);
  const data = await getPerksData();

  let ok = 0;
  let notFound = 0;
  let mismatches = 0;

  for (const id of allIds) {
    const entry = reference[id];
    const def = data[id];
    const inRef = entry ? ' (in reference)' : ' (nuovo)';

    if (!def) {
      console.log(`  ${id}${inRef}: NON TROVATO`);
      notFound++;
      continue;
    }

    const manifestName = def.displayProperties?.name || '(nome assente)';
    const manifestDesc = def.displayProperties?.description || '';
    const refName = entry ? entry.name : null;

    if (refName) {
      if (manifestName.toLowerCase() === refName.toLowerCase()) {
        console.log(`  ${id}: OK - "${manifestName}"`);
        ok++;
      } else {
        console.log(
          `  ${id}: DISCREPANZA - reference="${refName}" | manifest="${manifestName}"`
        );
        mismatches++;
      }
    } else {
      console.log(
        `  ${id}${inRef}: "${manifestName}"${manifestDesc ? ' - ' + manifestDesc.slice(0, 80) : ''}`
      );
    }
  }

  console.log(
    `\nOK: ${ok} | Non trovati: ${notFound} | Discrepanze: ${mismatches}`
  );

  if (mismatches > 0) {
    console.log(
      'DISCREPANZE trovate: verifica i nomi in perks-reference.json e correggi.'
    );
  }
  if (notFound > 0) {
    console.log(
      'NOTA: alcuni ID non sono stati trovati. Potrebbero non essere item di Destiny 2.'
    );
  }
}

main().catch((err) => {
  console.error(`Errore: ${err.message}`);
  process.exit(1);
});
