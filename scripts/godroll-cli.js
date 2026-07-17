#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');
const { loadManifest } = require('./lib/manifest');

const WILDCARD_PERK_ID = '0';

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function colorize(text, ...styles) {
  return styles.map(s => colors[s]).join('') + text + colors.reset;
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

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
      curr[j] = Math.min(curr[j - 1] + 1, prev[j - 1] + cost);
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

async function selectTxtFile() {
  const godrollDir = path.join(__dirname, '..', 'godroll', 'smailen');
  const txtFiles = fs.readdirSync(godrollDir).filter(f => f.endsWith('.txt'));

  if (txtFiles.length === 0) {
    console.log(`${colorize('✗', 'red')} Nessun file .txt trovato in godroll/smailen/`);
    process.exit(1);
  }

  console.log(`\n${colorize('Seleziona il file .txt target:', 'cyan')}`);
  txtFiles.forEach((f, i) => console.log(`  ${colorize(String(i + 1), 'yellow')}. ${f}`));

  const choice = await ask(`\n${colorize('Numero', 'cyan')} (o invia per annullare): `);
  const idx = parseInt(choice) - 1;

  if (isNaN(idx) || idx < 0 || idx >= txtFiles.length) {
    console.log('Selezione annullata.');
    process.exit(0);
  }

  return path.join(godrollDir, txtFiles[idx]);
}

async function searchWeapon(manifest) {
  const weaponNames = Object.values(manifest.weapons).map(w => w.name);

  while (true) {
    const input = await ask(`\n${colorize('Nome dell\'arma', 'cyan')} (o "q" per uscire): `);

    if (input.toLowerCase() === 'q') {
      console.log('Ricerca annullata.');
      process.exit(0);
    }

    const lower = input.toLowerCase();
    const matches = Object.entries(manifest.weapons).filter(([hash, w]) =>
      w.name.toLowerCase() === lower
    );

    if (matches.length > 0) {
      const [hash, weapon] = matches[0];
      console.log(`\n${colorize('✓', 'green')} Arma trovata: ${colorize(weapon.name, 'bold')} (${weapon.type})`);
      return { hash, weapon };
    }

    const suggestion = suggest(input, weaponNames);
    if (suggestion) {
      const confirm = await ask(`\nForse intendevi "${colorize(suggestion, 'yellow')}"? (s/n): `);
      if (confirm.toLowerCase() === 's') {
        const match = Object.entries(manifest.weapons).find(([h, w]) => w.name === suggestion);
        if (match) {
          const [hash, weapon] = match;
          console.log(`\n${colorize('✓', 'green')} Arma selezionata: ${colorize(weapon.name, 'bold')} (${weapon.type})`);
          return { hash, weapon };
        }
      }
    } else {
      console.log(`\n${colorize('✗', 'red')} Arma "${input}" non trovata.`);
    }
  }
}

async function selectPerks(manifest, weapon) {
  const perks = [];

  const randomizableColumns = (weapon.columns || []).filter(col => col.length > 1);

  if (randomizableColumns.length === 0) {
    console.log(`\n${colorize('⚠', 'yellow')} Nessuna colonna randomizzabile trovata per quest'arma.`);
    console.log('  L\'arma potrebbe avere solo perk fissi (intrinsic/origin trait).');
    const confirm = await ask('  Vuoi comunque procedere con 5 colonne vuote? (s/n): ');
    if (confirm.toLowerCase() !== 's') {
      console.log('Operazione annullata.');
      process.exit(0);
    }
    for (let i = 0; i < 5; i++) perks.push(WILDCARD_PERK_ID);
    return perks;
  }

  for (let col = 0; col < 5; col++) {
    console.log(`\n${colorize(`--- Colonna ${col + 1} ---`, 'cyan', 'bold')}`);

    const columnPerkHashes = randomizableColumns[col] || [];

    if (columnPerkHashes.length === 0) {
      console.log('Nessun perk disponibile per questa colonna.');
      perks.push(WILDCARD_PERK_ID);
      continue;
    }

    const perkMap = new Map();
    for (const hash of columnPerkHashes) {
      const perk = manifest.perks[hash];
      if (!perk) continue;
      const name = perk.name;
      if (!perkMap.has(name)) {
        perkMap.set(name, { hash, tier: perk.tier });
      } else {
        const existing = perkMap.get(name);
        if (perk.tier < existing.tier) {
          perkMap.set(name, { hash, tier: perk.tier });
        }
      }
    }

    const perkOptions = Array.from(perkMap.entries()).map(([name, data]) => ({
      hash: data.hash,
      name,
    }));

    perkOptions.sort((a, b) => a.name.localeCompare(b.name));

    console.log('\nPerk disponibili:');
    perkOptions.forEach((p, i) => console.log(`  ${i + 1}. ${p.name}`));
    console.log(`  ${colorize('0. Qualsiasi (nessun perk specifico)', 'yellow', 'bold')}`);

    while (true) {
      const choice = await ask('\nNumero del perk (o 0 per "qualsiasi"): ');
      const idx = parseInt(choice);

      if (idx === 0) {
        perks.push(WILDCARD_PERK_ID);
        console.log(`${colorize('✓', 'green')} Selezionato: ${colorize('Qualsiasi', 'yellow', 'bold')}`);
        break;
      }

      if (idx > 0 && idx <= perkOptions.length) {
        const selected = perkOptions[idx - 1];
        perks.push(selected.hash);
        console.log(`${colorize('✓', 'green')} Selezionato: ${selected.name}`);
        break;
      }

      console.log(`${colorize('✗', 'red')} Selezione non valida. Riprova.`);
    }
  }

  return perks;
}

async function askNote() {
  while (true) {
    const noteType = await ask(`\n${colorize('Vuoi aggiungere una nota?', 'cyan')} (${colorize('i', 'yellow')}=inline, ${colorize('b', 'yellow')}=block, ${colorize('n', 'yellow')}=nessuna): `);
    const type = noteType.toLowerCase().trim();

    if (type === 'n') {
      return null;
    }

    if (type === 'i' || type === 'b') {
      const noteText = await ask('Testo della nota: ');

      if (!noteText.trim()) {
        return null;
      }

      return {
        type: type === 'i' ? 'inline' : 'block',
        text: noteText.trim(),
      };
    }

    console.log(`${colorize('✗', 'red')} Input non valido. Usa 'i', 'b' o 'n'.`);
  }
}

function checkDuplicates(txtContent, weaponHash, perkIds) {
  const lines = txtContent.split('\n');
  const targetPerkStr = perkIds.join(',');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith(`dimwishlist:item=${weaponHash}&perks=`)) {
      const perkMatch = line.match(/perks=([0-9,]+)/);
      if (perkMatch) {
        const existingPerks = perkMatch[1];
        if (existingPerks === targetPerkStr) {
          return { duplicate: true, line: i + 1 };
        }
      }
    }
  }

  return { duplicate: false };
}

function appendRoll(txtContent, weaponHash, perkIds, note) {
  const paddedPerkIds = [...perkIds];
  while (paddedPerkIds.length < 5) {
    paddedPerkIds.push(WILDCARD_PERK_ID);
  }

  let dimLine = `dimwishlist:item=${weaponHash}&perks=${paddedPerkIds.join(',')}`;

  if (note && note.type === 'inline') {
    dimLine += `#notes:${note.text}`;
  }

  let newContent = txtContent.trimEnd();

  if (note && note.type === 'block') {
    newContent += `\n//notes:${note.text}`;
  }

  newContent += `\n${dimLine}\n`;

  return newContent;
}

async function main() {
  console.log(`\n${colorize('=== Godroll CLI ===', 'cyan', 'bold')}\n`);
  console.log(`${colorize('Cosa vuoi fare?', 'cyan')}`);
  console.log(`  ${colorize('1', 'yellow')}. Aggiungi un nuovo roll`);
  console.log(`  ${colorize('q', 'yellow')}. Esci\n`);

  const choice = await ask(`${colorize('Scelta', 'cyan')}: `);

  if (choice.toLowerCase() === 'q' || choice.trim() === '') {
    console.log('Arrivederci!');
    process.exit(0);
  }

  if (choice !== '1') {
    console.log(`${colorize('✗', 'red')} Scelta non valida.`);
    process.exit(1);
  }

  console.log(`\n${colorize('--- Aggiungi Roll ---', 'cyan', 'bold')}\n`);

  let manifest;
  try {
    manifest = await loadManifest();
  } catch (err) {
    console.log(`${colorize('✗', 'red')} Errore caricamento manifest: ${err.message}`);
    process.exit(1);
  }

  const targetFile = await selectTxtFile();
  console.log(`\n${colorize('✓', 'green')} File selezionato: ${colorize(path.basename(targetFile), 'bold')}`);

  const { hash: weaponHash, weapon } = await searchWeapon(manifest);

  const perkIds = await selectPerks(manifest, weapon);

  console.log(`\n${colorize('=== Recap ===', 'cyan', 'bold')}`);
  console.log(`Arma: ${colorize(weapon.name, 'bold')}`);
  console.log(`Perk:`);
  perkIds.forEach((perkHash, i) => {
    if (perkHash === WILDCARD_PERK_ID) {
      console.log(`  Colonna ${i + 1}: ${colorize('Qualsiasi', 'yellow', 'bold')}`);
    } else {
      const perk = manifest.perks[perkHash];
      console.log(`  Colonna ${i + 1}: ${perk?.name || 'Sconosciuto'}`);
    }
  });

  const note = await askNote();

  const txtContent = fs.readFileSync(targetFile, 'utf-8');
  const { duplicate, line } = checkDuplicates(txtContent, weaponHash, perkIds);

  if (duplicate) {
    console.log(`\n${colorize('⚠ ATTENZIONE:', 'yellow', 'bold')} Questo roll esiste già alla riga ${colorize(String(line), 'yellow')}!`);
    const confirm = await ask('Vuoi comunque aggiungerlo? (s/n): ');
    if (confirm.toLowerCase() !== 's') {
      console.log('Operazione annullata.');
      process.exit(0);
    }
  }

  const newContent = appendRoll(txtContent, weaponHash, perkIds, note);

  const outputFile = targetFile.replace(/\.txt$/, '-new.txt');
  fs.writeFileSync(outputFile, newContent);

  console.log(`\n${colorize('✓', 'green')} Roll aggiunto a: ${colorize(path.basename(outputFile), 'bold')}`);
  console.log(`  (copia di ${colorize(path.basename(targetFile), 'dim')})`);

  rl.close();
}

main().catch(err => {
  console.error(`\nErrore: ${err.message}`);
  rl.close();
  process.exit(1);
});
