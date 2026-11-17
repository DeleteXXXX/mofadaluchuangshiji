
const fs = require('fs');
const path = require('path');
const WORKDIR = __dirname;
const OUT_DIR = path.join(WORKDIR, '章节');

function readLines(file) {
  const buf = fs.readFileSync(path.join(WORKDIR, file));
  const text = new TextDecoder('gb18030').decode(buf);
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
}

// 1) 重建原始合并文本
const inputs = ['魔法大陆创世记—日出亚里斯（上中下）_1.txt','魔法大陆创世记—日出亚里斯（上中下）_2.txt'];
let original = '';
for (const f of inputs) original += readLines(f).join('\n') + '\n';

// 2) 读取所有拆分文件并拼接
const files = fs.readdirSync(OUT_DIR).filter(f => f.endsWith('.txt')).sort();
let rebuilt = '';
for (const f of files) rebuilt += fs.readFileSync(path.join(OUT_DIR, f), 'utf8') + '\n';

console.log('拆分文件数量: ' + files.length);
console.log('原始总长度: ' + original.length + ' 字符');
console.log('重建总长度: ' + rebuilt.length + ' 字符');
console.log('内容完全一致: ' + (original === rebuilt));

// 3) 抽查: 作者备注应落在 010_第八章 内，而不是被当成章节
const ch8 = fs.readFileSync(path.join(OUT_DIR, '010_第八章_纷乱的夜.txt'), 'utf8');
console.log('--- 010_第八章 是否包含作者备注: ' + ch8.includes('第八章其实按我的思路'));
console.log('--- 010_第八章 首行: ' + ch8.split('\n')[0]);

// 4) 抽查衔接: 064_第六十二章 应包含 file1 末尾的 4020 水印和 file2 开头的 ※※※
const ch62 = fs.readFileSync(path.join(OUT_DIR, '064_第六十二章_大闹罗素别馆(下).txt'), 'utf8');
console.log('--- 064_第六十二章 包含 file1 末尾水印: ' + ch62.includes('4020电子书'));
console.log('--- 064_第六十二章 包含 file2 开头 ※※※: ' + ch62.includes('※※※'));

// 5) 抽查: 065_第六十三章 首行
const ch63 = fs.readFileSync(path.join(OUT_DIR, '065_第六十三章_塔拉姆峡谷.txt'), 'utf8');
console.log('--- 065_第六十三章 首行: ' + ch63.split('\n')[0]);

// 6) 确认没有把"末完待续/未完待继/PS"误当章节
console.log('--- 是否误拆出含"末完待续"的独立文件: ' + files.some(f => fs.readFileSync(path.join(OUT_DIR,f),'utf8').startsWith('末完待续')));
