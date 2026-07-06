#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const WISHLIST_FILE = path.join(__dirname, '..', 'godroll-list-dim.txt');
const PERKS_REFERENCE_FILE = path.join(__dirname, '..', 'perks-reference.json');
const WEAPONS_REFERENCE_FILE = path.join(__dirname, '..', 'weapons-reference.json');
const CACHE_DIR = path.join(__dirname, '..', '.cache');

const WEAPON_COMMENT_REGEX = /^\/\/\* .+$/;
const ROLL_COMMENT_REGEX = /^\/\/\? Roll:\s*.+$/;

function loadManifestCache() {
  for (const name of ['items-it.json', 'perks-it.json']) {
    const file = path.join(CACHE_DIR, name);
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf-8'));
    }
  }
  return null;
}

function buildManifestNameIndex(manifest) {
  const index = new Map();
  for (const [id, entry] of Object.entries(manifest)) {
    const name = (entry.displayProperties?.name || '').toLowerCase();
    if (name) {
      const ids = index.get(name) || [];
      ids.push(id);
      index.set(name, ids);
    }
  }
  return index;
}

function loadPerksReference() {
  const data = {};
  if (!fs.existsSync(PERKS_REFERENCE_FILE)) return data;
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

function savePerksReference(data, manifest) {
  const existing = {};
  if (fs.existsSync(PERKS_REFERENCE_FILE)) {
    Object.assign(existing, JSON.parse(fs.readFileSync(PERKS_REFERENCE_FILE, 'utf-8')));
  }
  const ref = { ...existing };
  for (const [nameLower, ids] of Object.entries(data)) {
    for (const id of ids) {
      if (ref[id]) continue;
      const def = manifest ? manifest[id] : null;
      const manifestName = def?.displayProperties?.name;
      let finalName = manifestName || nameLower;
      for (const other of Object.values(ref)) {
        if (other.name.toLowerCase() === nameLower) {
          finalName = other.name;
          break;
        }
      }
      ref[id] = { name: finalName };
    }
  }
  fs.writeFileSync(PERKS_REFERENCE_FILE, JSON.stringify(ref, null, 2) + '\n');
}

function loadWeaponsReference() {
  const data = {};
  if (!fs.existsSync(WEAPONS_REFERENCE_FILE)) return data;
  const ref = JSON.parse(fs.readFileSync(WEAPONS_REFERENCE_FILE, 'utf-8'));
  for (const [id, entry] of Object.entries(ref)) {
    data[entry.name.toLowerCase()] = id;
  }
  return data;
}

function saveWeaponsReference(data, manifest) {
  const existing = {};
  if (fs.existsSync(WEAPONS_REFERENCE_FILE)) {
    Object.assign(existing, JSON.parse(fs.readFileSync(WEAPONS_REFERENCE_FILE, 'utf-8')));
  }
  const ref = {};
  for (const [nameLower, id] of Object.entries(data)) {
    if (existing[id]) {
      ref[id] = existing[id];
      if (manifest && manifest[id]) {
        const correctName = manifest[id].displayProperties?.name;
        if (correctName && existing[id].name !== correctName) {
          ref[id] = { ...existing[id], name: correctName };
        }
      }
    } else {
      const def = manifest ? manifest[id] : null;
      ref[id] = {
        name: (def && def.displayProperties && def.displayProperties.name) || nameLower,
      };
    }
  }
  fs.writeFileSync(WEAPONS_REFERENCE_FILE, JSON.stringify(ref, null, 2) + '\n');
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
  const manifest = loadManifestCache();
  const manifestIndex = manifest ? buildManifestNameIndex(manifest) : new Map();

  let perksChanged = false;
  let weaponsChanged = false;

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

      const weaponNameLower = currentWeapon.toLowerCase();
      let weaponId = weaponsByName[weaponNameLower];

      if (!weaponId && manifestIndex.size > 0) {
        const ids = manifestIndex.get(weaponNameLower);
        if (ids && ids.length > 0) {
          weaponId = ids[0];
          weaponsByName[weaponNameLower] = weaponId;
          weaponsChanged = true;
          console.log(`  Aggiunta arma "${currentWeapon}" (ID: ${weaponId}) a weapons-reference.json`);
        }
      }

      if (!weaponId) {
        console.log(
          `WARNING: arma "${currentWeapon}" non trovata. Esegui "npm run fetch-weapons" per aggiornare la cache e riprova.`
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
      let hasMissing = false;

      for (const name of perkNames) {
        let ids = perksByName[name];

        if (!ids && manifestIndex.size > 0) {
          const manifestIds = manifestIndex.get(name);
          if (manifestIds && manifestIds.length > 0) {
            perksByName[name] = [...new Set([...manifestIds])];
            perksChanged = true;
            ids = perksByName[name];
            console.log(`  Aggiunto perk "${name}" (ID: ${manifestIds[0]}) a perks-reference.json`);
          }
        }

        if (!ids) {
          console.log(
            `WARNING: perk "${name}" non trovato. Esegui "npm run fetch-perks" per aggiornare la cache.`
          );
          hasMissing = true;
        } else {
          perkIds.push(ids[0]);
        }
      }

      if (hasMissing) {
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

  if (weaponsChanged) saveWeaponsReference(weaponsByName, manifest);
  if (perksChanged) savePerksReference(perksByName, manifest);

  if (added === 0) {
    console.log('Nessun roll da generare.');
    process.exit(0);
  }

  fs.writeFileSync(WISHLIST_FILE, result.join('\n'));
  console.log(`Generati ${added} roll da commenti //? Roll:.`);
}

main();
