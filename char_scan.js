const fs = require('fs');
const path = require('path');
const DIR = path.join(__dirname, '章节');
const files = fs.readdirSync(DIR).filter(f => f.endsWith('.txt')).sort();
const cache = {};
for (const f of files) cache[f] = fs.readFileSync(path.join(DIR, f), 'utf8');
const names = ['季天恒','季天翔','扎克','修达','撒哈尔','馨','里特','风小六','凯丽','依丽娜','希鲁达','涛','华梅','里奇','嘟嘟儿','约多','基德','朱丽安娜','季天凌','沃尔夫','阿伦','塞维尔','塞约尔'];
const out = [];
for (const n of names) {
  const hits = [];
  for (const f of files) {
    const c = (cache[f].match(new RegExp(n, 'g')) || []).length;
    if (c > 0) hits.push(f.replace(/\.txt$/, '') + '(' + c + ')');
  }
  out.push(n + '：' + (hits.length ? hits.join(' ') : '(正文未出现)'));
}
fs.writeFileSync(path.join(__dirname, 'char_scan_result.txt'), out.join('\n'), 'utf8');
console.log('done, wrote ' + out.length + ' lines');
