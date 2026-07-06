#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const REFERENCE_FILE = path.join(__dirname, '..', 'weapons-reference.json');
const CACHE_DIR = path.join(__dirname, '..', '.cache');
const ITEMS_CACHE_FILE = path.join(CACHE_DIR, 'items-it.json');
const WISHLIST_FILE = path.join(__dirname, '..', 'godroll-list-dim.txt');

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

async function downloadFile(url, dest) {
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
    process.stdout.write(`\r  ${(received / 1024 / 1024).toFixed(1)} MB`);
  }
  writeStream.end();
  console.log('');
}

async function getItemsData() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }

  if (fs.existsSync(ITEMS_CACHE_FILE)) {
    const stat = fs.statSync(ITEMS_CACHE_FILE);
    const ageHours = (Date.now() - stat.mtimeMs) / (1000 * 60 * 60);
    if (ageHours < 24) {
      console.log(`Usando cache (${ageHours.toFixed(1)} ore fa).`);
      return JSON.parse(fs.readFileSync(ITEMS_CACHE_FILE, 'utf-8'));
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
    throw new Error('DestinyInventoryItemLiteDefinition non trovata.');
  }

  const liteUrl = BUNGIE_BASE + litePath;
  console.log(`Scaricamento...`);
  await downloadFile(liteUrl, ITEMS_CACHE_FILE);

  console.log('Lettura file...');
  return JSON.parse(fs.readFileSync(ITEMS_CACHE_FILE, 'utf-8'));
}

function readReference() {
  if (!fs.existsSync(REFERENCE_FILE)) {
    return {};
  }
  return JSON.parse(fs.readFileSync(REFERENCE_FILE, 'utf-8'));
}

function readWeaponIdsFromWishlist() {
  if (!fs.existsSync(WISHLIST_FILE)) return [];
  const content = fs.readFileSync(WISHLIST_FILE, 'utf-8').replace(/\r\n/g, '\n');
  const ids = new Set();
  const regex = /^dimwishlist:item=(-?\d+)&perks=/;
  for (const line of content.split('\n')) {
    const match = line.trim().match(regex);
    if (match) ids.add(match[1]);
  }
  return [...ids];
}

async function main() {
  const args = process.argv.slice(2);
  const wishlistIds = readWeaponIdsFromWishlist();
  const reference = readReference();
  const referenceIds = Object.keys(reference);

  const allIds = [
    ...new Set([...referenceIds, ...wishlistIds, ...args.filter((a) => /^-?\d+$/.test(a))]),
  ];

  if (allIds.length === 0) {
    console.log('Nessuna arma da verificare.');
    console.log('Uso: node scripts/fetch-weapons.js [id1 id2 ...]');
    process.exit(0);
  }

  console.log(`Verifica di ${allIds.length} armi...\n`);
  const data = await getItemsData();

  let ok = 0;
  let notFound = 0;
  let mismatches = 0;

  for (const id of allIds) {
    const entry = reference[id];
    const def = data[id];
    const inRef = entry ? ' (in reference)' : ' (nuova)';

    if (!def) {
      const fallback = inRef ? entry.name : '(sconosciuta)';
      console.log(`  ${id}${inRef}: NON TROVATA nel manifest (nome wishlist: ${fallback})`);
      notFound++;
      continue;
    }

    const manifestName = def.displayProperties?.name || '(nome assente)';
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
      console.log(`  ${id}${inRef}: "${manifestName}"`);
    }
  }

  console.log(
    `\nOK: ${ok} | Non trovati: ${notFound} | Discrepanze: ${mismatches}`
  );
}

main().catch((err) => {
  console.error(`Errore: ${err.message}`);
  process.exit(1);
});
