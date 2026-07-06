const fs = require('fs');
const path = require('path');

const WISHLIST_FILE = path.join(__dirname, '..', 'godroll-list-dim.txt');
const PERKS_REFERENCE_FILE = path.join(__dirname, '..', 'perks-reference.json');
const DIMWISHLIST_REGEX = /^dimwishlist:item=(-?\d+)&perks=(\d+(?:,\d+)*)$/;
const BLOCK_NOTE_REGEX = /^\/\/notes:.+$/;
const WEAPON_COMMENT_REGEX = /^\/\/ .+$/;

function loadPerksReference() {
  if (!fs.existsSync(PERKS_REFERENCE_FILE)) {
    console.log('WARNING: perks-reference.json non trovato, controlli perk saltati.');
    return null;
  }
  return JSON.parse(fs.readFileSync(PERKS_REFERENCE_FILE, 'utf-8'));
}

function buildNameIndex(reference) {
  const index = new Map();
  for (const [id, entry] of Object.entries(reference)) {
    const name = entry.name.toLowerCase();
    const ids = index.get(name) || [];
    ids.push(id);
    if (entry.enhancedId) ids.push(entry.enhancedId);
    if (entry.baseId) ids.push(entry.baseId);
    index.set(name, [...new Set(ids)]);
  }
  return index;
}

function findPerkNamesInNotes(notes, nameIndex) {
  const found = new Map();
  const lowerNotes = notes.toLowerCase();
  for (const [name, ids] of nameIndex) {
    if (lowerNotes.includes(name)) {
      found.set(name, ids);
    }
  }
  return found;
}

function validate() {
  const strict = process.argv.includes('--strict');

  if (!fs.existsSync(WISHLIST_FILE)) {
    console.error(`Errore: file non trovato: ${WISHLIST_FILE}`);
    process.exit(1);
  }

  const perksReference = loadPerksReference();
  const nameIndex = perksReference ? buildNameIndex(perksReference) : null;
  const content = fs.readFileSync(WISHLIST_FILE, 'utf-8').replace(/\r\n/g, '\n');
  const lines = content.split('\n').filter(line => line.trim() !== '');
  const errors = [];
  const warnings = [];
  const unknownPerks = new Set();
  const rolls = new Set();
  let currentWeapon = null;

  lines.forEach((line, index) => {
    const lineNum = index + 1;

    if (line.startsWith('//')) {
      if (!WEAPON_COMMENT_REGEX.test(line) && !BLOCK_NOTE_REGEX.test(line)) {
        errors.push(`Riga ${lineNum}: commento non valido: "${line}"`);
      } else if (WEAPON_COMMENT_REGEX.test(line)) {
        currentWeapon = line.replace(/^\/\/ /, '');
      }
      return;
    }

    if (!line.startsWith('dimwishlist:')) {
      errors.push(`Riga ${lineNum}: riga non riconosciuta: "${line}"`);
      return;
    }

    const [rollPart, notesPart = ''] = line.split('#notes:');
    const match = rollPart.match(DIMWISHLIST_REGEX);

    if (!match) {
      errors.push(`Riga ${lineNum}: sintassi non valida: "${rollPart}"`);
      return;
    }

    const [, itemId, perksStr] = match;
    const perks = perksStr.split(',');

    if (perks.length < 2) {
      errors.push(`Riga ${lineNum}: servono almeno 2 perk, trovati ${perks.length}`);
    }

    perks.forEach((perk, i) => {
      if (!/^\d+$/.test(perk)) {
        errors.push(`Riga ${lineNum}: perk ${i + 1} non valido: "${perk}"`);
      } else if (perksReference !== null && !perksReference[perk]) {
        warnings.push(
          `Riga ${lineNum}: perk ${i + 1} (${perk}) non presente in perks-reference.json`
        );
        unknownPerks.add(perk);
      }
    });

    if (nameIndex && notesPart) {
      const mentionedPerks = findPerkNamesInNotes(notesPart, nameIndex);
      const perkSet = new Set(perks);
      for (const [name, ids] of mentionedPerks) {
        const found = ids.some((id) => perkSet.has(id));
        if (!found) {
          warnings.push(
            `Riga ${lineNum}: la nota menziona "${name}" (ID: ${ids.join(', ')}) ma il perk non è nel roll`
          );
        }
      }
    }

    const rollKey = `${itemId}:${perksStr}`;
    if (rolls.has(rollKey)) {
      errors.push(`Riga ${lineNum}: roll duplicato (item=${itemId})`);
    }
    rolls.add(rollKey);

    if (!currentWeapon) {
      errors.push(`Riga ${lineNum}: roll senza commento arma precedente`);
    }
  });

  if (warnings.length > 0) {
    console.log('WARNING:');
    warnings.forEach(w => console.log(`  - ${w}`));
    if (unknownPerks.size > 0) {
      console.log(
        `  ${unknownPerks.size} perk ID sconosciuti: ${[...unknownPerks].join(', ')}`
      );
    }
    if (strict) {
      console.log('\nModalità strict: WARNING trasformati in ERROR.');
      process.exit(1);
    }
  }

  if (errors.length > 0) {
    console.error('Validazione fallita:');
    errors.forEach(err => console.error(`  - ${err}`));
    process.exit(1);
  }

  const status = warnings.length > 0
    ? `${rolls.size} roll verificati, ${warnings.length} warning`
    : `${rolls.size} roll verificati`;
  console.log(`Validazione completata: ${status}`);
  process.exit(0);
}

validate();
