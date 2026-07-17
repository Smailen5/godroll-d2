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

function clearScreen() {
  process.stdout.write('\x1b[2J\x1b[H');
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

async function selectFromList(options, prompt = 'Seleziona') {
  return new Promise((resolve) => {
    let selectedIndex = 0;
    let linesPrinted = 0;
    const stdin = process.stdin;

    if (!stdin.isTTY) {
      console.error('Errore: la CLI richiede un terminale interattivo.');
      process.exit(1);
    }

    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');

    const hintLine = `${colorize('↑↓', 'dim')} naviga  ${colorize('↵', 'dim')} conferma  ${colorize('q', 'dim')} annulla`;

    function render() {
      if (linesPrinted > 0) {
        process.stdout.write(`\x1b[${linesPrinted}A\x1b[J`);
      }

      console.log(`${colorize(prompt, 'cyan')}:`);
      options.forEach((opt, i) => {
        const marker = i === selectedIndex ? colorize('▶', 'cyan') : ' ';
        const text = i === selectedIndex ? colorize(opt, 'bold') : opt;
        console.log(`  ${marker} ${text}`);
      });
      console.log(hintLine);

      linesPrinted = options.length + 2;
    }

    render();

    const onData = (key) => {
      if (key === '\u0003' || key === 'q') {
        cleanup();
        resolve(null);
        return;
      }

      if (key === '\r' || key === '\n') {
        cleanup();
        resolve(selectedIndex);
        return;
      }

      if (key === '\x1b[A') {
        selectedIndex = (selectedIndex - 1 + options.length) % options.length;
        render();
      } else if (key === '\x1b[B') {
        selectedIndex = (selectedIndex + 1) % options.length;
        render();
      }
    };

    function cleanup() {
      stdin.setRawMode(false);
      stdin.removeListener('data', onData);
      process.stdout.write('\n');
    }

    stdin.on('data', onData);
  });
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
    const candidateLower = candidate.toLowerCase();
    if (candidateLower.includes(lower) || lower.includes(candidateLower)) {
      const score = Math.abs(candidateLower.length - lower.length);
      if (score < bestContainedScore) {
        bestContainedScore = score;
        bestContained = candidate;
      }
      continue;
    }
    const distance = levenshtein(lower, candidateLower);
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

  const selected = await selectFromList(txtFiles, 'Seleziona il file .txt target');

  if (selected === null) {
    console.log('Selezione annullata.');
    process.exit(0);
  }

  return path.join(godrollDir, txtFiles[selected]);
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
      const suggestedWeapon = Object.values(manifest.weapons).find(w => w.name === suggestion);
      const typeInfo = suggestedWeapon ? ` (${suggestedWeapon.type})` : '';
      console.log(`\n${colorize('💡', 'yellow')} Forse intendevi ${colorize(suggestion + typeInfo, 'yellow', 'bold')}?`);
      const confirm = await ask(`Confermi? (s/n): `);
      if (confirm.toLowerCase() === 's') {
        const match = Object.entries(manifest.weapons).find(([h, w]) => w.name === suggestion);
        if (match) {
          const [hash, weapon] = match;
          console.log(`${colorize('✓', 'green')} Arma selezionata: ${colorize(weapon.name, 'bold')} (${weapon.type})`);
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
    clearScreen();
    console.log(`${colorize(`--- Colonna ${col + 1} di 5 ---`, 'cyan', 'bold')}\n`);

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

    const listOptions = perkOptions.map(p => p.name);
    listOptions.push(colorize('Qualsiasi (nessun perk specifico)', 'yellow'));

    const selected = await selectFromList(listOptions, 'Perk disponibili');

    if (selected === null) {
      console.log('Selezione annullata.');
      process.exit(0);
    }

    if (selected === listOptions.length - 1) {
      perks.push(WILDCARD_PERK_ID);
      console.log(`${colorize('✓', 'green')} Selezionato: ${colorize('Qualsiasi', 'yellow', 'bold')}`);
    } else {
      const selPerk = perkOptions[selected];
      perks.push(selPerk.hash);
      console.log(`${colorize('✓', 'green')} Selezionato: ${selPerk.name}`);
    }

    await ask(`${colorize('Premi invio per continuare...', 'dim')}`);
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
  clearScreen();
  console.log(`${colorize('=== Godroll CLI ===', 'cyan', 'bold')}\n`);

  const menuOptions = ['Aggiungi un nuovo roll', 'Esci'];
  const selected = await selectFromList(menuOptions, 'Cosa vuoi fare');

  if (selected === null || selected === 1) {
    console.log('Arrivederci!');
    process.exit(0);
  }

  clearScreen();
  console.log(`${colorize('--- Aggiungi Roll ---', 'cyan', 'bold')}\n`);

  let manifest;
  try {
    manifest = await loadManifest();
  } catch (err) {
    console.log(`${colorize('✗', 'red')} Errore caricamento manifest: ${err.message}`);
    process.exit(1);
  }

  const targetFile = await selectTxtFile();
  clearScreen();
  console.log(`${colorize('✓', 'green')} File selezionato: ${colorize(path.basename(targetFile), 'bold')}\n`);

  const { hash: weaponHash, weapon } = await searchWeapon(manifest);

  const perkIds = await selectPerks(manifest, weapon);

  clearScreen();
  console.log(`${colorize('=== Recap ===', 'cyan', 'bold')}`);
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

  const outputFile = targetFile.replace(/\.txt$/, '-new.txt');
  const fileExisted = fs.existsSync(outputFile);
  
  let txtContent;
  if (fileExisted) {
    txtContent = fs.readFileSync(outputFile, 'utf-8');
  } else {
    txtContent = fs.readFileSync(targetFile, 'utf-8');
  }

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

  fs.writeFileSync(outputFile, newContent);

  console.log(`\n${colorize('✓', 'green')} Roll aggiunto a: ${colorize(path.basename(outputFile), 'bold')}`);
  if (fileExisted) {
    console.log(`  (aggiornato)`);
  } else {
    console.log(`  (copia di ${colorize(path.basename(targetFile), 'dim')})`);
  }

  rl.close();
}

main().catch(err => {
  console.error(`\nErrore: ${err.message}`);
  rl.close();
  process.exit(1);
});
