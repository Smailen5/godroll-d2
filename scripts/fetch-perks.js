#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const REFERENCE_FILE = path.join(__dirname, '..', 'perks-reference.json');
const CACHE_DIR = path.join(__dirname, '..', '.cache');
const MANIFEST_FILE = path.join(CACHE_DIR, 'manifest.sqlite3');

const MANIFEST_URLS = [
  'https://destinysets.com/data/manifest_it.sqlite3',
  'https://destinysets.com/data/manifest_en.sqlite3',
];

async function downloadManifest(url) {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }

  console.log(`Scaricamento manifest da ${url}...`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const total = parseInt(response.headers.get('content-length'), 10);
  let received = 0;

  const dest = fs.createWriteStream(MANIFEST_FILE);
  const reader = response.body.getReader();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.length;
    dest.write(Buffer.from(value));
    if (total) {
      process.stdout.write(`\r  ${((received / total) * 100).toFixed(1)}%`);
    }
  }
  dest.end();
  console.log('\nManifest scaricato.');
}

function getManifest() {
  if (!fs.existsSync(MANIFEST_FILE)) {
    return null;
  }
  return new DatabaseSync(MANIFEST_FILE, { readOnly: true });
}

function lookupPerk(db, id) {
  const numId = Number(id);
  if (!Number.isInteger(numId)) {
    return null;
  }

  const stmt = db.prepare(
    'SELECT json FROM DestinySandboxPerkDefinition WHERE id = ?'
  );
  const row = stmt.get(numId);
  if (!row) return null;

  try {
    const def = JSON.parse(row.json);
    return {
      name: def.displayProperties?.name || null,
      description: def.displayProperties?.description || null,
    };
  } catch {
    return null;
  }
}

function readReference() {
  if (!fs.existsSync(REFERENCE_FILE)) {
    return {};
  }
  return JSON.parse(fs.readFileSync(REFERENCE_FILE, 'utf-8'));
}

function writeReference(ref) {
  const sorted = {};
  Object.keys(ref)
    .sort()
    .forEach((key) => {
      sorted[key] = ref[key];
    });
  fs.writeFileSync(REFERENCE_FILE, JSON.stringify(sorted, null, 2) + '\n');
}

async function main() {
  const args = process.argv.slice(2);
  const reference = readReference();
  const referenceIds = Object.keys(reference);

  if (referenceIds.length === 0) {
    console.log('Nessun ID in perks-reference.json.');
  }

  const allIds = [
    ...new Set([...referenceIds, ...args.filter((a) => /^\d+$/.test(a))]),
  ];

  if (allIds.length === 0) {
    console.log('Uso: node scripts/fetch-perks.js [id1 id2 ...]');
    process.exit(0);
  }

  let db = getManifest();
  if (!db) {
    for (const url of MANIFEST_URLS) {
      try {
        await downloadManifest(url);
        db = getManifest();
        break;
      } catch (err) {
        console.log(`  Fallito: ${err.message}`);
      }
    }
    if (!db) {
      console.error('Impossibile scaricare il manifest da nessun URL.');
      console.log(
        'Prova a impostare MANIFEST_URL con un URL alternativo.'
      );
      process.exit(1);
    }
  }

  console.log('\nRisultati ricerca:\n');

  let ok = 0;
  let notFound = 0;
  let mismatches = 0;

  for (const id of allIds) {
    const entry = reference[id];
    const manifest = lookupPerk(db, id);
    const inRef = entry ? ' (in reference)' : ' (nuovo)';

    if (!manifest) {
      console.log(`  ${id}${inRef}: NON TROVATO nel manifest`);
      notFound++;
      continue;
    }

    const engName = manifest.name || '(nome assente)';
    const refName = entry ? entry.name : null;

    if (refName) {
      console.log(`  ${id}: reference="${refName}"  |  manifest="${engName}"`);
    } else {
      console.log(`  ${id}${inRef}: manifest="${engName}"`);
      ok++;
      continue;
    }

    if (engName !== refName) {
      console.log(`    -> DISCREPANZA: il nome italiano potrebbe essere corretto ma va verificato a mano`);
      mismatches++;
    } else {
      ok++;
    }
  }

  console.log(
    `\nOK: ${ok} | Non trovati: ${notFound} | Discrepanze: ${mismatches}`
  );

  if (notFound > 0) {
    console.log(
      'NOTA: alcuni ID non sono stati trovati nel manifest. Potrebbero non essere perk.'
    );
  }

  db.close();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
