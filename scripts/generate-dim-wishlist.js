#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const { loadManifest } = require('./lib/manifest');

const DIM_ALL_WEAPONS_ID = '-69420';
const WILDCARD_PERK_ID = '0';

// ---------------------------------------------------------------------------
// Manifest indexes
// ---------------------------------------------------------------------------

function buildWeaponIndex(manifest) {
  const index = {};
  for (const [hash, weapon] of Object.entries(manifest.weapons)) {
    const name = weapon.name.toLowerCase();
    if (!index[name]) index[name] = [];
    index[name].push(hash);
  }
  // Sort numerically so output is deterministic across runs.
  for (const hashes of Object.values(index)) {
    hashes.sort((a, b) => Number(a) - Number(b));
  }
  return index;
}

function buildGlobalPerkIndex(manifest) {
  const index = {};
  for (const [hash, perk] of Object.entries(manifest.perks)) {
    const name = perk.name.toLowerCase();
    if (!index[name]) index[name] = [];
    index[name].push({ hash, tier: perk.tier });
  }
  return index;
}

/**
 * Returns the perk index for a single weapon hash, built from the plug sets
 * the weapon can actually roll: name -> [{ hash, tier }]
 */
function getWeaponPerkIndex(weaponHash, manifest, memo) {
  if (memo.has(weaponHash)) return memo.get(weaponHash);

  const index = {};
  const weapon = manifest.weapons[weaponHash];
  const addPerk = (perkHash) => {
    const perk = manifest.perks[perkHash];
    if (!perk) return;
    const name = perk.name.toLowerCase();
    if (!index[name]) index[name] = [];
    if (!index[name].some(c => c.hash === perkHash)) {
      index[name].push({ hash: perkHash, tier: perk.tier });
    }
  };

  for (const plugSetHash of weapon.plugSets) {
    for (const perkHash of manifest.plugSets[plugSetHash] || []) {
      addPerk(perkHash);
    }
  }
  for (const perkHash of weapon.perks || []) {
    addPerk(perkHash);
  }

  memo.set(weaponHash, index);
  return index;
}

/**
 * Picks a single perk hash deterministically: lowest tier first (base perk
 * over enhanced), then lowest hash.
 */
function pickPerk(candidates) {
  let best = candidates[0];
  for (const c of candidates) {
    if (c.tier < best.tier || (c.tier === best.tier && Number(c.hash) < Number(best.hash))) {
      best = c;
    }
  }
  return best.hash;
}

// ---------------------------------------------------------------------------
// Fuzzy suggestions
// ---------------------------------------------------------------------------

function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const curr = [i];
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    prev = curr;
  }
  return prev[n];
}

function suggest(name, candidateNames) {
  const lower = name.toLowerCase();
  let bestContained = null;
  let bestContainedScore = Infinity;
  let bestDistant = null;
  let bestDistantScore = Infinity;

  for (const candidate of candidateNames) {
    // Containment ("la rosa" vs "rosa") is a strong signal.
    if (candidate.includes(lower) || lower.includes(candidate)) {
      const score = Math.abs(candidate.length - lower.length);
      if (score < bestContainedScore) {
        bestContainedScore = score;
        bestContained = candidate;
      }
      continue;
    }
    const distance = levenshtein(lower, candidate);
    if (distance < bestDistantScore) {
      bestDistantScore = distance;
      bestDistant = candidate;
    }
  }

  if (bestContained !== null && bestContainedScore <= 10) {
    return bestContained;
  }
  const threshold = Math.max(2, Math.floor(lower.length / 3));
  return bestDistant !== null && bestDistantScore <= threshold ? bestDistant : null;
}

function notFoundMessage(label, name, candidateNames) {
  const suggestion = suggest(name, candidateNames);
  let message = `${label}: "${name}"`;
  if (suggestion) {
    message += `. Forse intendevi "${suggestion}"?`;
  }
  return message;
}

// ---------------------------------------------------------------------------
// Markdown parsing
// ---------------------------------------------------------------------------

function parseMarkdown(content) {
  const lines = content.split('\n');
  const rolls = [];
  let title = '';
  let description = '';
  let currentWeapon = null;
  let currentWeaponId = null;
  let currentFonte = '';
  let currentAttivita = '';
  let currentNotes = '';
  let currentBlockNote = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) continue;

    if (line.startsWith('# title:')) {
      title = line.replace(/^# title:\s*/, '').trim();
      continue;
    }

    if (line.startsWith('## description:')) {
      description = line.replace(/^## description:\s*/, '').trim();
      continue;
    }

    if (line.startsWith('### ')) {
      const heading = line.replace(/^###\s+/, '').trim();

      if (heading.includes(`(${DIM_ALL_WEAPONS_ID})`)) {
        currentWeapon = heading.replace(/\s*\(-69420\)/, '').trim();
        currentWeaponId = DIM_ALL_WEAPONS_ID;
      } else {
        currentWeapon = heading;
        currentWeaponId = null;
      }

      currentFonte = '';
      currentAttivita = '';
      currentNotes = '';
      currentBlockNote = null;
      continue;
    }

    if (line.startsWith('- fonte:')) {
      currentFonte = line.replace(/^- fonte:\s*/, '').trim();
      continue;
    }

    if (line.startsWith('- attivita:')) {
      currentAttivita = line.replace(/^- attivita:\s*/, '').trim();
      continue;
    }

    if (line.startsWith('- notes:')) {
      currentNotes = line.replace(/^- notes:\s*/, '').trim();
      if (currentFonte && currentAttivita) {
        currentBlockNote = `${currentFonte} (${currentAttivita}): ${currentNotes}`;
      }
      continue;
    }

    if (line.startsWith('#### Roll')) {
      continue;
    }

    if (line.startsWith('#notes:') && !line.startsWith('- ')) {
      currentBlockNote = line.replace(/^#notes:/, '').trim();
      continue;
    }

    if (line.startsWith('- ') && currentWeapon) {
      let rollLine = line.replace(/^- /, '').trim();
      let inlineNote = null;

      const notesMatch = rollLine.match(/\s+#notes:(.+)$/);
      if (notesMatch) {
        inlineNote = notesMatch[1].trim();
        rollLine = rollLine.replace(/\s+#notes:.+$/, '').trim();
      }

      rollLine = rollLine.replace(/\.$/, '');

      const perks = rollLine.split(',').map(p => p.trim()).filter(Boolean);

      if (perks.length === 0) {
        throw new Error(`Roll vuoto per arma: ${currentWeapon}`);
      }

      if (perks.length > 5) {
        throw new Error(`Roll con più di 5 colonne per arma: ${currentWeapon}`);
      }

      rolls.push({
        weapon: currentWeapon,
        weaponId: currentWeaponId,
        perks: perks,
        blockNote: currentBlockNote,
        inlineNote: inlineNote
      });
    }
  }

  return { title, description, rolls };
}

// ---------------------------------------------------------------------------
// Roll resolution
// ---------------------------------------------------------------------------

function isWildcardPerk(name) {
  const lower = name.toLowerCase();
  return lower === 'qualsiasi' || lower === '-';
}

/**
 * Resolves a single roll into one or more dimwishlist perk-id arrays,
 * one per weapon hash that can actually roll every requested perk.
 *
 * Returns { entries: [{ weaponHash, perkIds }], warnings: [...] }
 * Throws on unresolvable rolls.
 */
function resolveRoll(roll, ctx) {
  const { manifest, weaponIndex, globalPerkIndex, weaponPerkMemo } = ctx;

  // "-69420" special item: perks are resolved against the global perk pool.
  if (roll.weaponId === DIM_ALL_WEAPONS_ID) {
    const perkIds = roll.perks.map(perkName => {
      if (isWildcardPerk(perkName)) return WILDCARD_PERK_ID;
      const candidates = globalPerkIndex[perkName.toLowerCase()];
      if (!candidates) {
        throw new Error(notFoundMessage('Perk non trovato', perkName, Object.keys(globalPerkIndex)));
      }
      return pickPerk(candidates);
    });
    return { entries: [{ weaponHash: DIM_ALL_WEAPONS_ID, perkIds }], warnings: [] };
  }

  const weaponHashes = weaponIndex[roll.weapon.toLowerCase()];
  if (!weaponHashes) {
    throw new Error(notFoundMessage('Arma non trovata', roll.weapon, Object.keys(weaponIndex)));
  }

  const entries = [];
  const warnings = [];
  const failures = [];

  for (const weaponHash of weaponHashes) {
    const perkIndex = getWeaponPerkIndex(weaponHash, manifest, weaponPerkMemo);
    const perkIds = [];
    let missingPerk = null;

    for (const perkName of roll.perks) {
      if (isWildcardPerk(perkName)) {
        perkIds.push(WILDCARD_PERK_ID);
        continue;
      }
      const candidates = perkIndex[perkName.toLowerCase()];
      if (!candidates) {
        missingPerk = perkName;
        break;
      }
      perkIds.push(pickPerk(candidates));
    }

    if (missingPerk !== null) {
      failures.push({ weaponHash, missingPerk });
      continue;
    }

    entries.push({ weaponHash, perkIds });
  }

  if (entries.length === 0) {
    const failure = failures[0];
    const perkIndex = getWeaponPerkIndex(failure.weaponHash, manifest, weaponPerkMemo);
    throw new Error(
      `${notFoundMessage('Perk non trovato', failure.missingPerk, Object.keys(perkIndex))} (arma: ${roll.weapon})`
    );
  }

  for (const failure of failures) {
    warnings.push(
      `Arma "${roll.weapon}" (hash ${failure.weaponHash}): perk "${failure.missingPerk}" non disponibile su questa versione, riga omessa`
    );
  }

  return { entries, warnings };
}

function resolveAll(parsed, manifest) {
  const ctx = {
    manifest,
    weaponIndex: buildWeaponIndex(manifest),
    globalPerkIndex: buildGlobalPerkIndex(manifest),
    weaponPerkMemo: new Map(),
  };

  const resolvedRolls = [];
  const errors = [];
  const warnings = [];
  const rollKeys = new Set();

  for (let i = 0; i < parsed.rolls.length; i++) {
    const roll = parsed.rolls[i];
    const rollNum = i + 1;

    const normalizedPerks = roll.perks.map(p =>
      isWildcardPerk(p) ? WILDCARD_PERK_ID : p.toLowerCase()
    );
    while (normalizedPerks.length < 5) normalizedPerks.push(WILDCARD_PERK_ID);
    const rollKey = `${roll.weapon.toLowerCase()}|${normalizedPerks.join(',')}`;
    if (rollKeys.has(rollKey)) {
      errors.push(`Roll ${rollNum}: duplicato (arma=${roll.weapon})`);
      continue;
    }
    rollKeys.add(rollKey);

    try {
      const { entries, warnings: rollWarnings } = resolveRoll(roll, ctx);
      warnings.push(...rollWarnings.map(w => `Roll ${rollNum}: ${w}`));
      resolvedRolls.push({ roll, entries });
    } catch (err) {
      errors.push(`Roll ${rollNum}: ${err.message}`);
    }
  }

  return { resolvedRolls, errors, warnings };
}

// ---------------------------------------------------------------------------
// Output generation
// ---------------------------------------------------------------------------

function generateDimFile(parsed, resolvedRolls) {
  const output = [];

  if (parsed.title) {
    output.push(`title:${parsed.title}`);
  }
  if (parsed.description) {
    output.push(`description:${parsed.description}`);
  }
  if (parsed.title || parsed.description) {
    output.push('');
  }

  let lastBlockNote = null;
  let lastWeapon = null;

  for (const { roll, entries } of resolvedRolls) {
    if (roll.weapon !== lastWeapon) {
      lastWeapon = roll.weapon;
      lastBlockNote = null;
    }

    if (roll.blockNote && roll.blockNote !== lastBlockNote) {
      output.push(`//notes:${roll.blockNote}`);
      lastBlockNote = roll.blockNote;
    }

    for (const { weaponHash, perkIds } of entries) {
      const paddedPerkIds = [...perkIds];
      while (paddedPerkIds.length < 5) {
        paddedPerkIds.push(WILDCARD_PERK_ID);
      }

      let dimLine = `dimwishlist:item=${weaponHash}&perks=${paddedPerkIds.join(',')}`;

      if (roll.inlineNote) {
        dimLine += `#notes:${roll.inlineNote}`;
      }

      output.push(dimLine);
    }
  }

  return output.join('\n');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const checkOnly = args.includes('--check');
  const inputFile = args.find(arg => !arg.startsWith('--'));

  if (!inputFile) {
    console.log('Uso: node generate-dim-wishlist.js [--check] <input.md>');
    process.exit(1);
  }

  if (!fs.existsSync(inputFile)) {
    console.log(`Errore: file non trovato: ${inputFile}`);
    process.exit(1);
  }

  const content = fs.readFileSync(inputFile, 'utf-8');

  let parsed;
  try {
    parsed = parseMarkdown(content);
  } catch (err) {
    console.log(`Errore parsing: ${err.message}`);
    process.exit(1);
  }

  let manifest;
  try {
    manifest = await loadManifest();
  } catch (err) {
    console.log(`Errore: ${err.message}`);
    process.exit(1);
  }

  const { resolvedRolls, errors, warnings } = resolveAll(parsed, manifest);

  if (warnings.length > 0) {
    console.log('WARNING:');
    warnings.forEach(w => console.log(`  - ${w}`));
  }

  if (errors.length > 0) {
    console.log('ERRORI:');
    errors.forEach(e => console.log(`  - ${e}`));
    process.exit(1);
  }

  if (checkOnly) {
    console.log(`Validazione completata: ${parsed.rolls.length} roll verificati`);
    process.exit(0);
  }

  const output = generateDimFile(parsed, resolvedRolls);

  const outputFile = inputFile.replace(/\.md$/, '.txt');
  fs.writeFileSync(outputFile, output + '\n');

  const lineCount = resolvedRolls.reduce((sum, r) => sum + r.entries.length, 0);
  console.log(`Generato: ${outputFile} (${parsed.rolls.length} roll, ${lineCount} righe dimwishlist)`);
}

main().catch(err => {
  console.error(`Errore: ${err.message}`);
  process.exit(1);
});
