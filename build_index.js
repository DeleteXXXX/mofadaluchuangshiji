// 生成紧凑情节索引：每章标题 + 首尾非空行 + 关键词命中
const fs = require('fs');
const path = require('path');
const WD = __dirname;
const DIR = path.join(WD, '章节');

const files = fs.readdirSync(DIR).filter(f => f.endsWith('.txt')).sort();

function lines(f) {
  return fs.readFileSync(path.join(DIR, f), 'utf8').replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
}

// 关键词（用于定位伏笔/设定/主线线索）
const KEYWORDS = ['灭世','神之眼','六圣女','创世','遗人','契约','身世','预言','神器','圣战','结局','终章','光明','黑暗','召唤','血咒','太古','术士','光明魔法','创世之战'];

let out = [];
out.push('# 魔法大陆创世记 — 情节索引（机械抽取，供整理用）');
out.push('');
out.push('说明：每章给出标题、开头非空行、结尾非空行，便于快速把握脉络。正文细节需按需精读对应章节文件。');
out.push('');

const kwHits = {};
for (const kw of KEYWORDS) kwHits[kw] = [];

for (const f of files) {
  const ls = lines(f);
  const nonEmpty = ls.filter(l => l.trim().length > 0);
  const title = (nonEmpty[0] || '').trim();
  const first = (nonEmpty[1] || nonEmpty[0] || '').trim().slice(0, 80);
  const last = (nonEmpty[nonEmpty.length-1] || '').trim().slice(0, 80);
  out.push('## ' + f);
  out.push('- 标题: ' + title);
  out.push('- 首: ' + (first || '(空)'));
  out.push('- 尾: ' + (last || '(空)'));
  // 关键词命中
  const hits = [];
  for (const kw of KEYWORDS) {
    if (ls.some(l => l.includes(kw))) hits.push(kw);
  }
  if (hits.length) out.push('- 关键词: ' + hits.join('、'));
  out.push('');
}

// 关键词总索引
out.push('# 关键词命中总索引');
out.push('');
for (const kw of KEYWORDS) {
  const filesHit = files.filter(f => lines(f).some(l => l.includes(kw)));
  out.push('- **' + kw + '**：出现在 ' + filesHit.length + ' 个文件 → ' + filesHit.map(f => f.replace(/\.txt$/, '')).join(', '));
}
out.push('');

fs.writeFileSync(path.join(WD, '整理', '情节索引.md'), out.join('\n'), 'utf8');
console.log('索引已生成，共 ' + files.length + ' 章，索引行数 ' + out.length);
console.log('关键词总索引条目 ' + KEYWORDS.length + ' 个');
