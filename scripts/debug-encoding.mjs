import { readFileSync, writeFileSync } from 'fs';

const path = 'd:/saastest/GEO/src/app/dashboard/reports/[id]/page.tsx';
const content = readFileSync(path, 'utf8');
const lines = content.split('\n');

// Print lines 530-605 with hex for debugging
for (let i = 529; i <= 604; i++) {
  const line = lines[i];
  // Check if line has non-ASCII
  const hasNonAscii = /[^\x00-\x7F]/.test(line);
  if (hasNonAscii) {
    console.log(`LINE ${i+1}:`, JSON.stringify(line));
  }
}
