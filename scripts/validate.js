const fs = require('fs');
const path = require('path');

const WISHLIST_FILE = path.join(__dirname, '..', 'godroll-list-dim.txt');
const DIMWISHLIST_REGEX = /^dimwishlist:item=(-?\d+)&perks=(\d+(?:,\d+)*)$/;
const BLOCK_NOTE_REGEX = /^\/\/notes:.+$/;
const WEAPON_COMMENT_REGEX = /^\/\/ .+$/;

function validate() {
  if (!fs.existsSync(WISHLIST_FILE)) {
    console.error(`Errore: file non trovato: ${WISHLIST_FILE}`);
    process.exit(1);
  }

  const content = fs.readFileSync(WISHLIST_FILE, 'utf-8').replace(/\r\n/g, '\n');
  const lines = content.split('\n').filter(line => line.trim() !== '');
  const errors = [];
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

    const [rollPart, notesPart] = line.split('#notes:');
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
      }
    });

    const rollKey = `${itemId}:${perksStr}`;
    if (rolls.has(rollKey)) {
      errors.push(`Riga ${lineNum}: roll duplicato (item=${itemId})`);
    }
    rolls.add(rollKey);

    if (!currentWeapon) {
      errors.push(`Riga ${lineNum}: roll senza commento arma precedente`);
    }
  });

  if (errors.length > 0) {
    console.error('Validazione fallita:');
    errors.forEach(err => console.error(`  - ${err}`));
    process.exit(1);
  }

  console.log(`Validazione completata: ${rolls.size} roll verificati`);
  process.exit(0);
}

validate();
