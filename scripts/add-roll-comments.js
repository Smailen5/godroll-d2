#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const WISHLIST_FILE = path.join(__dirname, '..', 'godroll-list-dim.txt');
const PERKS_REFERENCE_FILE = path.join(__dirname, '..', 'perks-reference.json');

const DIMWISHLIST_REGEX = /^dimwishlist:item=(-?\d+)&perks=(\d+(?:,\d+)*)/;
const ROLL_COMMENT_REGEX = /^\/\/\? Roll:\s*.+$/;

function loadPerksReference() {
  if (!fs.existsSync(PERKS_REFERENCE_FILE)) {
    console.log('Errore: perks-reference.json non trovato.');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(PERKS_REFERENCE_FILE, 'utf-8'));
}

function getPerkName(id, reference) {
  const entry = reference[id];
  if (entry) return entry.name;
  return `(sconosciuto: ${id})`;
}

function main() {
  if (!fs.existsSync(WISHLIST_FILE)) {
    console.log(`Errore: file non trovato: ${WISHLIST_FILE}`);
    process.exit(1);
  }

  const perksReference = loadPerksReference();
  const content = fs.readFileSync(WISHLIST_FILE, 'utf-8');
  const lines = content.split('\n');

  const result = [];
  let added = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('dimwishlist:')) {
      const prevLine = i > 0 ? lines[i - 1].trim() : '';

      if (!ROLL_COMMENT_REGEX.test(prevLine)) {
        const [rollPart] = trimmed.split('#notes:');
        const match = rollPart.match(DIMWISHLIST_REGEX);

        if (match) {
          const [, , perksStr] = match;
          const perkIds = perksStr.split(',');
          const perkNames = perkIds.map((id) => id === '0' ? '-' : getPerkName(id, perksReference).toLowerCase());
          const comment = `//? Roll: ${perkNames.join(', ')}`;

          result.push(comment);
          added++;
        }
      }
    }

    result.push(line);
  }

  if (added === 0) {
    console.log('Nessun commento //? Roll: da aggiungere.');
    process.exit(0);
  }

  fs.writeFileSync(WISHLIST_FILE, result.join('\n'));
  console.log(`Aggiunti ${added} commenti //? Roll:.`);
}

main();
