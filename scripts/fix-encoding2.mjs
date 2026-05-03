import { readFileSync, writeFileSync } from 'fs';

const path = 'd:/saastest/GEO/src/app/dashboard/reports/[id]/page.tsx';
const content = readFileSync(path, 'utf8');
const lines = content.split('\n');

// Fix specific lines by index (0-based)
lines[531] = '                  <p className="text-sm text-[#787774]">\u0414\u0430\u043d\u043d\u044b\u0445 \u043e\u0431 \u0443\u043f\u043e\u043c\u0438\u043d\u0430\u043d\u0438\u044f\u0445 \u043f\u043e\u043a\u0430 \u043d\u0435\u0442</p>\r';
lines[540] = '                  "2gis.ru": "2\u0413\u0418\u0421", "reddit.com": "Reddit", "quora.com": "Quora",\r';
lines[546] = '                    return mentioned ? `\u0411\u0440\u0435\u043d\u0434 \u0443\u043f\u043e\u043c\u0438\u043d\u0430\u0435\u0442\u0441\u044f \u043d\u0430 ${lbl}` : `\u0423\u043f\u043e\u043c\u0438\u043d\u0430\u043d\u0438\u044f \u043d\u0430 ${lbl} \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u044b`;\r';
lines[548] = '                  const cyrillicCount = (ctx.match(/[\u0430-\u044f\u0410-\u042f\u0451\u0401]/g) || []).length;\r';
lines[553] = '                  return mentioned ? `\u0411\u0440\u0435\u043d\u0434 \u0443\u043f\u043e\u043c\u0438\u043d\u0430\u0435\u0442\u0441\u044f \u043d\u0430 ${lbl}` : `\u041e\u0440\u0433\u0430\u043d\u0438\u0447\u0435\u0441\u043a\u0438\u0435 \u0443\u043f\u043e\u043c\u0438\u043d\u0430\u043d\u0438\u044f \u043d\u0430 ${lbl} \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u044b`;\r';
lines[560] = '                      <p className="text-[13px] font-semibold text-[#1a1a1a]">Digital PR \u2014 \u0433\u0434\u0435 \u043e \u0432\u0430\u0441 \u0433\u043e\u0432\u043e\u0440\u044f\u0442</p>\r';
lines[579] = '                              \u041e\u0442\u043a\u0440\u044b\u0442\u044c \u2192\r';
lines[601] = '                TAB 3 \u2014 \u041f\u043b\u0430\u043d \u0440\u0430\u0431\u043e\u0442\r';
lines[602] = '                Friendly intro \u00b7 Recommendations \u00b7 SiteChecklist \u00b7 Tools\r';

writeFileSync(path, lines.join('\n'), 'utf8');
console.log('Done. Checking remaining issues...');

// Verify
const fixed = readFileSync(path, 'utf8');
const fixedLines = fixed.split('\n');
[531, 540, 546, 548, 553, 560, 579, 601, 602].forEach(i => {
  console.log(`Line ${i+1}:`, fixedLines[i].trim());
});
