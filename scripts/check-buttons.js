const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const isDetail = args.includes('--detail') || (args.length > 0 && !args[0].includes('('));
const targets = args.filter(a => a !== '--detail');
if (targets.length === 0) {
  targets.push('frontend/src/app/(dashboard)/landlord');
}

const summary = {};
let totalViolations = 0;

function checkFile(p) {
  if (!fs.existsSync(p)) return;
  const c = fs.readFileSync(p, 'utf8');
  const lines = c.split('\n');
  let fileViolations = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('<Button')) {
      const window = lines.slice(i, Math.min(lines.length, i + 10)).join(' ');
      const tagMatch = window.match(/<Button[\s\S]*?>/);
      if (tagMatch) {
        const b = tagMatch[0];
        const issues = [];
        if (/size\s*=\s*['"]sm['"]/.test(b)) issues.push('size="sm"');
        if (/variant\s*=\s*['"]primary['"]/.test(b)) issues.push('variant="primary"');
        if (/type\s*=\s*['"]button['"]/.test(b)) issues.push('type="button"');
        if (issues.length > 0) {
          fileViolations++;
          if (isDetail) console.log(`[VIOLATION] ${p}:${i + 1}\n  Issues: ${issues.join(', ')}\n  ${b.replace(/\s+/g, ' ')}\n`);
        }
      }
      const iconPropMatch = window.match(/(?:leftIcon|rightIcon)=\{<[A-Z]\w+[^>]*className=['"][^'"]*\b(?:w-|h-|size-)\d+[^'"]*['"][^>]*>\}/);
      if (iconPropMatch) {
        fileViolations++;
        if (isDetail) console.log(`[VIOLATION ICON] ${p}:${i + 1}\n  ${iconPropMatch[0]}\n`);
      }
    }
    if (lines[i].includes('<TableActionButton')) {
      const window = lines.slice(i, Math.min(lines.length, i + 8)).join(' ');
      const tagMatch = window.match(/<TableActionButton[\s\S]*?>/);
      if (tagMatch) {
        const b = tagMatch[0];
        const issues = [];
        if (/size\s*=\s*['"]icon-sm['"]/.test(b)) issues.push('size="icon-sm"');
        if (/variant\s*=\s*['"]ghost['"]/.test(b)) issues.push('variant="ghost"');
        if (/type\s*=\s*['"]button['"]/.test(b)) issues.push('type="button"');
        if (issues.length > 0) {
          fileViolations++;
          if (isDetail) console.log(`[VIOLATION TAB] ${p}:${i + 1}\n  Issues: ${issues.join(', ')}\n  ${b.replace(/\s+/g, ' ')}\n`);
        }
      }
      const iconPropMatch = window.match(/icon=\{<[A-Z]\w+[^>]*className=['"][^'"]*\b(?:w-|h-|size-)\d+[^'"]*['"][^>]*>\}/);
      if (iconPropMatch) {
        fileViolations++;
        if (isDetail) console.log(`[VIOLATION TAB ICON] ${p}:${i + 1}\n  ${iconPropMatch[0]}\n`);
      }
    }
  }
  if (fileViolations > 0) {
    summary[p] = fileViolations;
    totalViolations += fileViolations;
  }
}

function check(item) {
  if (fs.statSync(item).isDirectory()) {
    for (const f of fs.readdirSync(item)) {
      check(path.join(item, f));
    }
  } else if (item.endsWith('.tsx')) {
    checkFile(item);
  }
}

for (const t of targets) {
  check(t);
}

if (!isDetail) {
  console.log('Violations per file:');
  for (const [f, c] of Object.entries(summary).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${c.toString().padStart(3)} : ${f}`);
  }
}
console.log(`\nTotal violations: ${totalViolations}`);
