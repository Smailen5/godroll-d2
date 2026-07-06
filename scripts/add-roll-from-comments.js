#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const WISHLIST_FILE = path.join(__dirname, '..', 'godroll-list-dim.txt');
const PERKS_REFERENCE_FILE = path.join(__dirname, '..', 'perks-reference.json');
const WEAPONS_REFERENCE_FILE = path.join(__dirname, '..', 'weapons-reference.json');

const WEAPON_COMMENT_REGEX = /^\/\/\* .+$/;
const ROLL_COMMENT_REGEX = /^\/\/\? Roll:\s*.+$/;

function loadPerksReference() {
  const data = {};
  if (!fs.existsSync(PERKS_REFERENCE_FILE)) {
    console.log('WARNING: perks-reference.json non trovato.');
    return data;
  }
  const ref = JSON.parse(fs.readFileSync(PERKS_REFERENCE_FILE, 'utf-8'));
  for (const [id, entry] of Object.entries(ref)) {
    const name = entry.name.toLowerCase();
    const ids = data[name] || [];
    ids.push(id);
    if (entry.enhancedId) ids.push(entry.enhancedId);
    if (entry.baseId) ids.push(entry.baseId);
    data[name] = [...new Set(ids)];
  }
  return data;
}

function loadWeaponsReference() {
  const data = {};
  if (!fs.existsSync(WEAPONS_REFERENCE_FILE)) {
    console.log('WARNING: weapons-reference.json non trovato.');
    return data;
  }
  const ref = JSON.parse(fs.readFileSync(WEAPONS_REFERENCE_FILE, 'utf-8'));
  for (const [id, entry] of Object.entries(ref)) {
    data[entry.name.toLowerCase()] = id;
  }
  return data;
}

function getNextNonCommentIndex(lines, start) {
  for (let i = start; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed && !trimmed.startsWith('//')) return i;
  }
  return -1;
}

function main() {
  if (!fs.existsSync(WISHLIST_FILE)) {
    console.log(`Errore: file non trovato: ${WISHLIST_FILE}`);
    process.exit(1);
  }

  const perksByName = loadPerksReference();
  const weaponsByName = loadWeaponsReference();
  const content = fs.readFileSync(WISHLIST_FILE, 'utf-8');
  const lines = content.split('\n');

  const result = [];
  let currentWeapon = null;
  let added = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (WEAPON_COMMENT_REGEX.test(trimmed)) {
      currentWeapon = trimmed.replace(/^\/\/\* /, '');
      result.push(line);
      continue;
    }

    if (ROLL_COMMENT_REGEX.test(trimmed)) {
      const nextIdx = getNextNonCommentIndex(lines, i + 1);
      const nextLine = nextIdx >= 0 ? lines[nextIdx].trim() : '';

      if (nextLine.startsWith('dimwishlist:')) {
        result.push(line);
        continue;
      }

      if (!currentWeapon) {
        console.log(
          `WARNING: "//? Roll:" senza "//*" arma precedente. Salto.`
        );
        result.push(line);
        continue;
      }

      const weaponId = weaponsByName[currentWeapon.toLowerCase()];
      if (!weaponId) {
        console.log(
          `WARNING: arma "${currentWeapon}" non trovata in weapons-reference.json. Salto.`
        );
        result.push(line);
        continue;
      }

      const perkNames = trimmed
        .replace(/^\/\/\? Roll:\s*/, '')
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);

      const perkIds = [];
      const missingPerks = [];

      for (const name of perkNames) {
        const ids = perksByName[name];
        if (!ids) {
          missingPerks.push(name);
        } else {
          perkIds.push(ids[0]);
        }
      }

      if (missingPerks.length > 0) {
        console.log(
          `WARNING: perk non trovati in perks-reference.json: ${missingPerks.join(', ')}. Salto.`
        );
        result.push(line);
        continue;
      }

      const rollLine = `dimwishlist:item=${weaponId}&perks=${perkIds.join(',')}`;
      result.push(line);
      result.push(rollLine);
      added++;
      continue;
    }

    result.push(line);
  }

  if (added === 0) {
    console.log('Nessun roll da generare.');
    process.exit(0);
  }

  fs.writeFileSync(WISHLIST_FILE, result.join('\n'));
  console.log(`Generati ${added} roll da commenti //? Roll:.`);
}

main();
