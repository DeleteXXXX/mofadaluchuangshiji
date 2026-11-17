// 分章脚本：把合并后的小说按章节拆分成独立 txt 文件
// 用法: node split_chapters.js
// 输入: 魔法大陆创世记—日出亚里斯（上中下）_1.txt / _2.txt (GBK 编码)
// 输出: 章节/ 目录下，每个章节一个 UTF-8 txt 文件

const fs = require('fs');
const path = require('path');

const WORKDIR = __dirname;
const INPUT_FILES = [
  '魔法大陆创世记—日出亚里斯（上中下）_1.txt',
  '魔法大陆创世记—日出亚里斯（上中下）_2.txt',
];
const OUT_DIR = path.join(WORKDIR, '章节');

// 章节标记正则（对 trim 后的行匹配）
// 注意: 真正的章节标题在"第X章"后必有一个空格；作者备注"第八章其实按我的思路..."没有空格，会被排除
const RE_SECOND_PART = /^第二部\s.*第[一二三四五六七八九十百零两\d]+章\s/;
const RE_PREFACE2 = /^序章二\s/;
const RE_PREFACE1 = /^序章(?!二)\s/;
const RE_CHAPTER = /^第[一二三四五六七八九十百零两\d]+章\s/;

function detectSection(line) {
  const t = line.trim();
  if (RE_PREFACE2.test(t)) return t;
  if (RE_PREFACE1.test(t)) return t;
  if (RE_SECOND_PART.test(t)) return t;
  if (RE_CHAPTER.test(t)) return t;
  return null;
}

// Windows 文件名非法字符
function sanitize(name) {
  return name
    .replace(/\s+/g, '_')
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/[. ]+$/g, '');
}

// 读取并解码 GB18030，归一化为 \n 行
function readLines(file) {
  const buf = fs.readFileSync(path.join(WORKDIR, file));
  const text = new TextDecoder('gb18030').decode(buf);
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // 合并两个文件为一个连续文本流（文件2开头是第六十二章的延续，直接拼接即可）
  const all = [];
  for (const f of INPUT_FILES) all.push(...readLines(f));

  const sections = [];
  let cur = null;
  const suspicious = []; // 疑似章节但未被识别的行，用于排查

  for (const line of all) {
    const title = detectSection(line);
    if (title) {
      if (cur) sections.push(cur);
      cur = { title, lines: [line] };
    } else {
      if (!cur) {
        // 第一个章节标记之前的前言内容
        cur = { title: '前言', lines: [line] };
      } else {
        cur.lines.push(line);
      }
    }
  }
  if (cur) sections.push(cur);

  // 写出
  const written = [];
  for (let i = 0; i < sections.length; i++) {
    const s = sections[i];
    const fname = String(i).padStart(3, '0') + '_' + sanitize(s.title) + '.txt';
    const content = s.lines.join('\n');
    fs.writeFileSync(path.join(OUT_DIR, fname), content, 'utf8');
    written.push({ index: i, title: s.title, file: fname, lines: s.lines.length });
  }

  // 输出汇总
  console.log('拆分完成，共 ' + written.length + ' 个文件，输出目录: ' + OUT_DIR);
  console.log('---');
  for (const w of written) {
    console.log(w.file + '  [' + w.lines + ' 行]  ' + w.title);
  }
}

main();
