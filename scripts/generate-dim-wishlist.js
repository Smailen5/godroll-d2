#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const WEAPONS_REFERENCE_FILE = path.join(__dirname, '..', 'weapons-reference.json');
const PERKS_REFERENCE_FILE = path.join(__dirname, '..', 'perks-reference.json');

function loadWeaponsReference() {
  if (!fs.existsSync(WEAPONS_REFERENCE_FILE)) {
    console.log('WARNING: weapons-reference.json non trovato.');
    return {};
  }
  const ref = JSON.parse(fs.readFileSync(WEAPONS_REFERENCE_FILE, 'utf-8'));
  const index = {};
  for (const [id, entry] of Object.entries(ref)) {
    index[entry.name.toLowerCase()] = id;
  }
  return index;
}

function loadPerksReference() {
  if (!fs.existsSync(PERKS_REFERENCE_FILE)) {
    console.log('WARNING: perks-reference.json non trovato.');
    return {};
  }
  const ref = JSON.parse(fs.readFileSync(PERKS_REFERENCE_FILE, 'utf-8'));
  const index = {};
  for (const [id, entry] of Object.entries(ref)) {
    const name = entry.name.toLowerCase();
    if (!index[name]) index[name] = [];
    index[name].push(id);
  }
  return index;
}

function resolveWeaponId(heading, weaponsIndex) {
  if (heading === '-69420') return '-69420';
  
  const lower = heading.toLowerCase();
  if (weaponsIndex[lower]) return weaponsIndex[lower];
  
  throw new Error(`Arma non trovata: ${heading}`);
}

function resolvePerkId(name, perksIndex) {
  if (name === 'qualsiasi' || name === '-') return '0';
  
  const lower = name.toLowerCase();
  if (perksIndex[lower] && perksIndex[lower].length > 0) {
    return perksIndex[lower][0];
  }
  
  throw new Error(`Perk non trovato: ${name}`);
}

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
      
      if (heading.includes('(-69420)')) {
        currentWeapon = heading.replace(/\s*\(-69420\)/, '').trim();
        currentWeaponId = '-69420';
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

function generateDimFile(parsed, weaponsIndex, perksIndex) {
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
  
  for (const roll of parsed.rolls) {
    if (roll.weapon !== lastWeapon) {
      lastWeapon = roll.weapon;
      lastBlockNote = null;
    }
    
    if (roll.blockNote && roll.blockNote !== lastBlockNote) {
      output.push(`//notes:${roll.blockNote}`);
      lastBlockNote = roll.blockNote;
    }
    
    const weaponId = roll.weaponId || resolveWeaponId(roll.weapon, weaponsIndex);
    
    const perkIds = roll.perks.map(perk => resolvePerkId(perk, perksIndex));
    
    while (perkIds.length < 5) {
      perkIds.push('0');
    }
    
    let dimLine = `dimwishlist:item=${weaponId}&perks=${perkIds.join(',')}`;
    
    if (roll.inlineNote) {
      dimLine += `#notes:${roll.inlineNote}`;
    }
    
    output.push(dimLine);
  }
  
  return output.join('\n');
}

function validate(parsed, weaponsIndex, perksIndex) {
  const errors = [];
  const warnings = [];
  const rollSet = new Set();
  
  for (let i = 0; i < parsed.rolls.length; i++) {
    const roll = parsed.rolls[i];
    const rollNum = i + 1;
    
    try {
      const weaponId = roll.weaponId || resolveWeaponId(roll.weapon, weaponsIndex);
      
      const perkIds = [];
      for (const perk of roll.perks) {
        const perkId = resolvePerkId(perk, perksIndex);
        perkIds.push(perkId);
      }
      
      while (perkIds.length < 5) {
        perkIds.push('0');
      }
      
      const rollKey = `${weaponId}:${perkIds.join(',')}`;
      if (rollSet.has(rollKey)) {
        errors.push(`Roll ${rollNum}: duplicato (arma=${roll.weapon})`);
      }
      rollSet.add(rollKey);
      
    } catch (err) {
      errors.push(`Roll ${rollNum}: ${err.message}`);
    }
  }
  
  return { errors, warnings };
}

function main() {
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
  
  const weaponsIndex = loadWeaponsReference();
  const perksIndex = loadPerksReference();
  
  const content = fs.readFileSync(inputFile, 'utf-8');
  
  let parsed;
  try {
    parsed = parseMarkdown(content);
  } catch (err) {
    console.log(`Errore parsing: ${err.message}`);
    process.exit(1);
  }
  
  const validation = validate(parsed, weaponsIndex, perksIndex);
  
  if (validation.warnings.length > 0) {
    console.log('WARNING:');
    validation.warnings.forEach(w => console.log(`  - ${w}`));
  }
  
  if (validation.errors.length > 0) {
    console.log('ERRORI:');
    validation.errors.forEach(e => console.log(`  - ${e}`));
    process.exit(1);
  }
  
  if (checkOnly) {
    console.log(`Validazione completata: ${parsed.rolls.length} roll verificati`);
    process.exit(0);
  }
  
  try {
    const output = generateDimFile(parsed, weaponsIndex, perksIndex);
    
    const outputFile = inputFile.replace(/\.md$/, '.txt');
    fs.writeFileSync(outputFile, output + '\n');
    
    console.log(`Generato: ${outputFile} (${parsed.rolls.length} roll)`);
  } catch (err) {
    console.log(`Errore generazione: ${err.message}`);
    process.exit(1);
  }
}

main();
