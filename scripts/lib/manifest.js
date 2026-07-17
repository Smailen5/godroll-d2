'use strict';

const fs = require('node:fs');
const path = require('node:path');

const CACHE_DIR = path.join(__dirname, '..', '..', '.cache');
const CACHE_FILE = path.join(CACHE_DIR, 'manifest-it.json');
const CACHE_MAX_AGE_HOURS = 24;

const MANIFEST_INDEX_URL = 'https://www.bungie.net/Platform/Destiny2/Manifest/';
const BUNGIE_BASE = 'https://www.bungie.net';
const LOCALE = 'it';

const ITEM_TYPE_WEAPON = 3;

// Socket categories that hold wishlist-relevant perks.
const SOCKET_CATEGORY_INTRINSIC = 3956125808;
const SOCKET_CATEGORY_WEAPON_PERKS = 4241085061;

const FETCH_RETRIES = 3;

async function fetchJson(url) {
  let lastError;
  for (let attempt = 1; attempt <= FETCH_RETRIES; attempt++) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} su ${url}`);
      }
      return await response.json();
    } catch (err) {
      lastError = err;
      if (attempt < FETCH_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, attempt * 2000));
      }
    }
  }
  throw lastError;
}

function readCache() {
  if (!fs.existsSync(CACHE_FILE)) return null;
  try {
    return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
  } catch {
    return null;
  }
}

function cacheAgeHours() {
  const stat = fs.statSync(CACHE_FILE);
  return (Date.now() - stat.mtimeMs) / (1000 * 60 * 60);
}

/**
 * Builds the slim cache from the full Bungie manifest definitions.
 *
 * Shape:
 * {
 *   version:  manifest version string,
 *   weapons:  { <hash>: { name, type, plugSets: [<plugSetHash>, ...], perks: [<perkHash>, ...] } },
 *   perks:    { <hash>: { name, tier } },
 *   plugSets: { <plugSetHash>: [<perkHash>, ...] }
 * }
 *
 * `perks` holds plug hashes wired directly on the socket (e.g. origin
 * traits use singleInitialItemHash/reusablePlugItems instead of plug sets).
 */
function buildSlimCache(version, items, plugSetDefs) {
  const weapons = {};
  const usedPlugSets = new Set();
  const directPerkHashes = new Set();

  for (const [hash, item] of Object.entries(items)) {
    if (item.itemType !== ITEM_TYPE_WEAPON) continue;
    const name = item.displayProperties?.name;
    if (!name) continue;

    const entries = item.sockets?.socketEntries || [];

    // Restrict to intrinsic + weapon perk sockets (skips shaders, mods,
    // mementos...). Falls back to every socket if categories are missing.
    let perkIndexes = null;
    const categories = item.sockets?.socketCategories || [];
    for (const category of categories) {
      if (
        category.socketCategoryHash === SOCKET_CATEGORY_INTRINSIC ||
        category.socketCategoryHash === SOCKET_CATEGORY_WEAPON_PERKS
      ) {
        if (!perkIndexes) perkIndexes = new Set();
        for (const index of category.socketIndexes) perkIndexes.add(index);
      }
    }

    const plugSets = new Set();
    const perks = new Set();
    const columns = [];
    const columnPlugSets = [];
    for (let i = 0; i < entries.length; i++) {
      if (perkIndexes && !perkIndexes.has(i)) continue;
      const socket = entries[i];
      const columnPerks = [];
      const columnPlugSetHashes = [];
      if (socket.randomizedPlugSetHash) {
        plugSets.add(socket.randomizedPlugSetHash);
        columnPlugSetHashes.push(socket.randomizedPlugSetHash);
      }
      if (socket.reusablePlugSetHash) {
        plugSets.add(socket.reusablePlugSetHash);
        columnPlugSetHashes.push(socket.reusablePlugSetHash);
      }
      if (socket.singleInitialItemHash) {
        perks.add(socket.singleInitialItemHash);
        columnPerks.push(socket.singleInitialItemHash);
      }
      for (const plug of socket.reusablePlugItems || []) {
        if (plug.plugItemHash) {
          perks.add(plug.plugItemHash);
          columnPerks.push(plug.plugItemHash);
        }
      }
      if (columnPerks.length > 0 || columnPlugSetHashes.length > 0) {
        columns.push(columnPerks);
        columnPlugSets.push(columnPlugSetHashes);
      }
    }

    for (const ps of plugSets) usedPlugSets.add(ps);
    for (const p of perks) directPerkHashes.add(p);
    weapons[hash] = {
      name,
      type: item.itemTypeDisplayName || '',
      plugSets: [...plugSets],
      perks: [...perks],
      columns,
      columnPlugSets,
    };
  }

  const plugSets = {};
  const usedPerkHashes = new Set(directPerkHashes);
  for (const psHash of usedPlugSets) {
    const def = plugSetDefs[psHash];
    if (!def) continue;
    const perkHashes = new Set();
    for (const plug of def.reusablePlugItems || []) {
      if (plug.plugItemHash) {
        perkHashes.add(plug.plugItemHash);
        usedPerkHashes.add(plug.plugItemHash);
      }
    }
    plugSets[psHash] = [...perkHashes];
  }

  for (const [hash, weapon] of Object.entries(weapons)) {
    const expandedColumns = [];
    for (let i = 0; i < weapon.columns.length; i++) {
      const columnPerks = new Set(weapon.columns[i]);
      const colPlugSets = weapon.columnPlugSets[i] || [];
      for (const psHash of colPlugSets) {
        for (const perkHash of plugSets[psHash] || []) {
          columnPerks.add(perkHash);
        }
      }
      expandedColumns.push([...columnPerks]);
    }
    weapon.columns = expandedColumns;
    delete weapon.columnPlugSets;
  }

  const perks = {};
  for (const perkHash of usedPerkHashes) {
    const item = items[perkHash];
    if (!item) continue;
    const name = item.displayProperties?.name;
    if (!name) continue;
    perks[perkHash] = {
      name,
      tier: item.inventory?.tierType ?? 0,
    };
  }

  return { version, weapons, perks, plugSets };
}

async function downloadAndBuild(manifestIndex) {
  const defs = manifestIndex?.Response?.jsonWorldComponentContentPaths?.[LOCALE];
  if (!defs) {
    throw new Error(`Locale "${LOCALE}" non trovato nel manifest.`);
  }
  const itemsPath = defs.DestinyInventoryItemDefinition;
  const plugSetsPath = defs.DestinyPlugSetDefinition;
  if (!itemsPath || !plugSetsPath) {
    throw new Error('Definizioni necessarie non trovate nel manifest.');
  }

  console.log('Scaricamento definizioni oggetti (puo richiedere qualche minuto)...');
  const items = await fetchJson(BUNGIE_BASE + itemsPath);
  console.log('Scaricamento definizioni plug set...');
  const plugSetDefs = await fetchJson(BUNGIE_BASE + plugSetsPath);

  console.log('Costruzione cache...');
  const slim = buildSlimCache(manifestIndex.Response.version, items, plugSetDefs);

  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
  fs.writeFileSync(CACHE_FILE, JSON.stringify(slim));
  console.log(`Cache salvata: ${CACHE_FILE}`);
  return slim;
}

/**
 * Loads the slim manifest cache, downloading/refreshing it when needed.
 * - cache younger than 24h: used as-is (no network).
 * - cache older than 24h: manifest version is checked online; if unchanged
 *   the cache is reused, otherwise it is rebuilt.
 */
async function loadManifest() {
  const cached = readCache();

  if (cached && cacheAgeHours() < CACHE_MAX_AGE_HOURS) {
    return cached;
  }

  let manifestIndex;
  try {
    manifestIndex = await fetchJson(MANIFEST_INDEX_URL);
  } catch (err) {
    if (cached) {
      console.log(`WARNING: impossibile contattare Bungie (${err.message}), uso la cache esistente.`);
      return cached;
    }
    throw new Error(`Impossibile scaricare il manifest Bungie: ${err.message}`);
  }

  const version = manifestIndex?.Response?.version;
  if (cached && version && cached.version === version) {
    // Manifest unchanged: refresh mtime so we skip the check for another 24h.
    const now = new Date();
    fs.utimesSync(CACHE_FILE, now, now);
    return cached;
  }

  return downloadAndBuild(manifestIndex);
}

module.exports = { loadManifest, CACHE_FILE };
