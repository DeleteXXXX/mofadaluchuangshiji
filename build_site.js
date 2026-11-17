const fs = require('fs');
const path = require('path');
const WD = __dirname;
const OUT = path.join(WD, 'site');

function escapeHtml(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function inline(s) {
  return s
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}
function mdToHtml(md) {
  const lines = md.split('\n');
  let out = [];
  let i = 0;
  let inCode = false;
  let codeLines = [];
  const FENCE = String.fromCharCode(96) + String.fromCharCode(96) + String.fromCharCode(96);
  function flushCode() { if (codeLines.length) { out.push('<pre><code>' + escapeHtml(codeLines.join('\n')) + '</code></pre>'); codeLines = []; } }
  while (i < lines.length) {
    let line = lines[i];
    if (line.trim().indexOf(FENCE) === 0) { flushCode(); inCode = !inCode; i++; continue; }
    if (inCode) { codeLines.push(line); i++; continue; }
    if (line.trim() === '') { i++; continue; }
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) { out.push('<h' + h[1].length + '>' + inline(escapeHtml(h[2].trim())) + '</h' + h[1].length + '>'); i++; continue; }
    if (/^\s*([-*]){3,}\s*$/.test(line)) { out.push('<hr>'); i++; continue; }
    if (line.trim().indexOf('>') === 0) {
      const q = [];
      while (i < lines.length && lines[i].trim().indexOf('>') === 0) { q.push(lines[i].trim().replace(/^>\s?/, '')); i++; }
      out.push('<blockquote>' + q.map(l => '<p>' + inline(escapeHtml(l)) + '</p>').join('') + '</blockquote>');
      continue;
    }
    if (line.trim().indexOf('|') === 0) {
      const tl = [];
      while (i < lines.length && lines[i].trim().indexOf('|') === 0) { tl.push(lines[i].trim()); i++; }
      out.push(parseTable(tl));
      continue;
    }
    if (/^\s*[-*+]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
      const ll = []; const ordered = /^\s*\d+\.\s+/.test(line);
      while (i < lines.length && (/^\s*[-*+]\s+/.test(lines[i]) || /^\s*\d+\.\s+/.test(lines[i]))) { ll.push(lines[i].trim()); i++; }
      const tag = ordered ? 'ol' : 'ul';
      out.push('<' + tag + '>' + ll.map(l => '<li>' + inline(escapeHtml(l.replace(/^([-*+]|\d+\.)\s+/, ''))) + '</li>').join('') + '</' + tag + '>');
      continue;
    }
    const pl = [];
    while (i < lines.length && lines[i].trim() !== '' && lines[i].trim().indexOf(FENCE) !== 0 && !lines[i].trim().match(/^#/) && lines[i].trim().indexOf('>') !== 0 && lines[i].trim().indexOf('|') !== 0 && !/^\s*[-*+]\s+/.test(lines[i]) && !/^\s*\d+\.\s+/.test(lines[i]) && !/^\s*([-*]){3,}\s*$/.test(lines[i])) { pl.push(lines[i].trim()); i++; }
    if (pl.length) out.push('<p>' + inline(escapeHtml(pl.join(' '))) + '</p>');
  }
  flushCode();
  return out.join('\n');
}
function parseTable(tl) {
  const rows = tl.map(l => l.replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim()));
  const data = rows.filter(r => !r.every(c => /^[-:]+$/.test(c)));
  if (!data.length) return '';
  const header = data[0];
  let html = '<table><thead><tr>' + header.map(c => '<th>' + inline(escapeHtml(c)) + '</th>').join('') + '</tr></thead><tbody>';
  for (let k = 1; k < data.length; k++) { html += '<tr>' + data[k].map(c => '<td>' + inline(escapeHtml(c)) + '</td>').join('') + '</tr>'; }
  return html + '</tbody></table>';
}
function txtToBody(text, dropFirstTitle) {
  const paras = [];
  let cur = null;
  for (const raw of text.split('\n')) {
    const t = raw.trim();
    if (t === '') { if (cur !== null) { paras.push(cur); cur = null; } continue; }
    if (cur === null) cur = t; else cur += t;
  }
  if (cur !== null) paras.push(cur);
  if (dropFirstTitle && paras.length && paras[0] === dropFirstTitle) paras.shift();
  return paras.map(p => '<p>' + escapeHtml(p) + '</p>').join('\n');
}

const CSS = [
'* { margin: 0; padding: 0; box-sizing: border-box; }',
'body { font-family: -apple-system, "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif; background: #f5f5f5; color: #2c2c2c; line-height: 1.8; }',
'a { color: #2563eb; text-decoration: none; }',
'a:hover { text-decoration: underline; }',
'.site-header { background: #1e293b; color: #fff; padding: 14px 20px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; }',
'.site-header .brand { font-size: 18px; font-weight: 700; color: #fff; }',
'.site-header .brand:hover { text-decoration: none; }',
'.site-header nav a { color: #cbd5e1; margin-left: 16px; font-size: 14px; }',
'.site-header nav a:hover { color: #fff; }',
'.container { max-width: 820px; margin: 0 auto; padding: 24px 20px 60px; }',
'.crumb { font-size: 13px; color: #888; margin-bottom: 14px; }',
'.crumb a { color: #2563eb; }',
'.chapter-title { font-size: 26px; font-weight: 700; margin: 8px 0 24px; line-height: 1.4; border-bottom: 2px solid #e5e7eb; padding-bottom: 12px; }',
'.content p { margin-bottom: 1em; text-indent: 2em; }',
'.content p:first-child { text-indent: 0; }',
'.pager { display: flex; justify-content: space-between; margin-top: 36px; padding-top: 16px; border-top: 1px solid #e5e7eb; flex-wrap: wrap; gap: 10px; }',
'.pager a { padding: 8px 14px; background: #fff; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 14px; }',
'.pager a:hover { background: #f0f7ff; text-decoration: none; }',
'.md-content h1 { font-size: 24px; margin: 16px 0; }',
'.md-content h2 { font-size: 20px; margin: 22px 0 10px; border-left: 4px solid #2563eb; padding-left: 10px; }',
'.md-content h3 { font-size: 17px; margin: 18px 0 8px; }',
'.md-content h4 { font-size: 15px; margin: 14px 0 6px; }',
'.md-content p { margin: 8px 0; }',
'.md-content ul, .md-content ol { margin: 8px 0 8px 24px; }',
'.md-content li { margin: 4px 0; }',
'.md-content blockquote { margin: 12px 0; padding: 10px 16px; background: #f8fafc; border-left: 4px solid #94a3b8; color: #555; }',
'.md-content table { border-collapse: collapse; width: 100%; margin: 12px 0; font-size: 14px; display: block; overflow-x: auto; }',
'.md-content th, .md-content td { border: 1px solid #d1d5db; padding: 8px 10px; text-align: left; }',
'.md-content th { background: #f1f5f9; }',
'.md-content hr { border: none; border-top: 1px solid #e5e7eb; margin: 20px 0; }',
'.md-content pre { background: #1e293b; color: #e2e8f0; padding: 14px; border-radius: 6px; overflow-x: auto; margin: 12px 0; }',
'.md-content code { background: #eef2f7; padding: 1px 5px; border-radius: 3px; font-size: 90%; }',
'.md-content strong { font-weight: 700; }',
'.home-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; margin-top: 20px; }',
'.home-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 24px; transition: box-shadow .2s; }',
'.home-card:hover { box-shadow: 0 6px 20px rgba(0,0,0,.08); }',
'.home-card h2 { font-size: 20px; margin-bottom: 8px; }',
'.home-card p { color: #666; font-size: 14px; margin-bottom: 12px; }',
'.home-card a.btn { display: inline-block; padding: 8px 18px; background: #2563eb; color: #fff; border-radius: 6px; font-size: 14px; }',
'.home-card a.btn:hover { background: #1d4ed8; text-decoration: none; }',
'.toc-list { list-style: none; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 20px; }',
'.toc-list li { padding: 6px 0; border-bottom: 1px dashed #eee; }',
'.toc-list li:last-child { border-bottom: none; }',
'.toc-list a { color: #2c2c2c; }',
'.toc-group-title { font-weight: 700; margin: 18px 0 6px; color: #1e293b; }',
'.site-footer { text-align: center; color: #999; font-size: 12px; padding: 20px; }',
].join('\n');

function pageShell(title, cssRel, bodyHtml) {
  return '<!DOCTYPE html>\n<html lang="zh-CN">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>' + escapeHtml(title) + '</title>\n<link rel="stylesheet" href="' + cssRel + '">\n</head>\n<body>\n' + bodyHtml + '\n</body>\n</html>';
}
function headerHtml() {
  return '<header class="site-header"><a class="brand" href="../index.html">魔法大陆创世记 · 日出亚里斯</a><nav><a href="../novel/index.html">小说正文</a> <a href="../zhengli/index.html">整理文档</a></nav></header>';
}

const novelDir = path.join(WD, '章节');
const novelFiles = fs.readdirSync(novelDir).filter(f => f.endsWith('.txt')).sort();
const novelOut = path.join(OUT, 'novel');
fs.mkdirSync(novelOut, { recursive: true });
const novelList = [];
novelFiles.forEach((f, idx) => {
  const base = f.replace(/\.txt$/, '');
  const title = base.replace(/^\d+_/, '').replace(/_/g, ' ');
  const text = fs.readFileSync(path.join(novelDir, f), 'utf8');
  const body = txtToBody(text, title);
  const prev = idx > 0 ? novelFiles[idx - 1].replace(/\.txt$/, '.html') : null;
  const next = idx < novelFiles.length - 1 ? novelFiles[idx + 1].replace(/\.txt$/, '.html') : null;
  let pager = '<div class="pager">';
  pager += prev ? '<a href="' + prev + '">← 上一章</a>' : '<span></span>';
  pager += '<a href="index.html">目录</a>';
  pager += next ? '<a href="' + next + '">下一章 →</a>' : '<span></span>';
  pager += '</div>';
  const bodyHtml = headerHtml() + '<div class="container"><div class="crumb"><a href="../index.html">首页</a> / <a href="index.html">小说正文</a> / ' + (idx + 1) + '</div><h1 class="chapter-title">' + escapeHtml(title) + '</h1><div class="content">' + body + '</div>' + pager + '</div>';
  fs.writeFileSync(path.join(novelOut, base + '.html'), pageShell(title + ' - 魔法大陆创世记', '../css/style.css', bodyHtml), 'utf8');
  novelList.push({ title, file: base + '.html' });
});

{
  const items = novelList.map(n => '<li><a href="' + n.file + '">' + escapeHtml(n.title) + '</a></li>').join('\n');
  const bodyHtml = headerHtml() + '<div class="container"><div class="crumb"><a href="../index.html">首页</a> / 小说正文</div><h1 class="chapter-title">小说正文 · 目录</h1><p style="color:#666;margin-bottom:16px;">共 ' + novelList.length + ' 章，按顺序排列。</p><ul class="toc-list">' + items + '</ul></div>';
  fs.writeFileSync(path.join(novelOut, 'index.html'), pageShell('小说正文目录 - 魔法大陆创世记', '../css/style.css', bodyHtml), 'utf8');
}

function walkMd(dir, acc) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walkMd(full, acc);
    else if (e.name.endsWith('.md')) acc.push(full);
  }
}
const zhengliDir = path.join(WD, '整理');
const mdFiles = [];
walkMd(zhengliDir, mdFiles);
const zhengliOut = path.join(OUT, 'zhengli');
fs.mkdirSync(zhengliOut, { recursive: true });
const zhengliList = [];
mdFiles.forEach(full => {
  const base = path.basename(full).replace(/\.md$/, '');
  const md = fs.readFileSync(full, 'utf8');
  const html = mdToHtml(md);
  const bodyHtml = headerHtml() + '<div class="container"><div class="crumb"><a href="../index.html">首页</a> / <a href="index.html">整理文档</a></div><div class="md-content">' + html + '</div></div>';
  fs.writeFileSync(path.join(zhengliOut, base + '.html'), pageShell(base + ' - 整理文档', '../css/style.css', bodyHtml), 'utf8');
  zhengliList.push({ title: base, file: base + '.html' });
});

{
  const groups = {};
  zhengliList.forEach(z => { const prefix = z.title.split('_')[0]; (groups[prefix] = groups[prefix] || []).push(z); });
  const order = ['01', '02', '03', '04', '05', '06', '情节索引'];
  let body = headerHtml() + '<div class="container"><div class="crumb"><a href="../index.html">首页</a> / 整理文档</div><h1 class="chapter-title">整理文档 · 目录</h1><p style="color:#666;margin-bottom:16px;">共 ' + zhengliList.length + ' 篇，按维度分组。</p>';
  for (const key of order) {
    if (!groups[key]) continue;
    body += '<div class="toc-group-title">' + escapeHtml(key) + '</div><ul class="toc-list">';
    groups[key].forEach(z => { body += '<li><a href="' + z.file + '">' + escapeHtml(z.title) + '</a></li>'; });
    body += '</ul>';
  }
  body += '</div>';
  fs.writeFileSync(path.join(zhengliOut, 'index.html'), pageShell('整理文档目录 - 魔法大陆创世记', '../css/style.css', body), 'utf8');
}

{
  const bodyHtml = '<header class="site-header"><a class="brand" href="index.html">魔法大陆创世记 · 日出亚里斯</a><nav><a href="novel/index.html">小说正文</a> <a href="zhengli/index.html">整理文档</a></nav></header>' +
    '<div class="container"><h1 class="chapter-title">魔法大陆创世记 · 日出亚里斯</h1>' +
    '<p style="color:#666;max-width:680px;">被父母从现代送回魔法大陆亚里斯、身负遗人血统的少年季天恒，走上与兄长逐鹿亚里斯、重振大陆的救世／创世之路。本站收录全书 ' + novelList.length + ' 章正文，及故事骨架、人物、时间线、世界观、伏笔、风格结构六个维度的整理文档。</p>' +
    '<div class="home-cards">' +
    '<div class="home-card"><h2>小说正文</h2><p>全书 ' + novelList.length + ' 章，按顺序阅读，支持上一章/下一章翻页。</p><a class="btn" href="novel/index.html">进入阅读</a></div>' +
    '<div class="home-card"><h2>整理文档</h2><p>六个维度的系统整理：骨架、人物、时间线、世界观、伏笔、风格，助力续写。</p><a class="btn" href="zhengli/index.html">查看整理</a></div>' +
    '<div class="home-card"><h2>下载全文</h2><p>下载《魔法大陆创世记—日出亚里斯（上中下）》完整 TXT 文件，方便离线阅读。</p><a class="btn" href="downloads/novel-full.txt" download="魔法大陆创世记—日出亚里斯（上中下）全文.txt">下载 TXT</a></div>' +
    '</div></div>' +
    '<footer class="site-footer">魔法大陆创世记 · 日出亚里斯 · 静态站点</footer>';
  fs.writeFileSync(path.join(OUT, 'index.html'), pageShell('魔法大陆创世记 · 日出亚里斯', 'css/style.css', bodyHtml), 'utf8');
}

const downloadsOut = path.join(OUT, 'downloads');
fs.mkdirSync(downloadsOut, { recursive: true });
fs.copyFileSync(
  path.join(WD, '魔法大陆创世记—日出亚里斯（上中下）全文.txt'),
  path.join(downloadsOut, 'novel-full.txt')
);

fs.mkdirSync(path.join(OUT, 'css'), { recursive: true });
fs.writeFileSync(path.join(OUT, 'css', 'style.css'), CSS, 'utf8');

console.log('站点生成完成：');
console.log('  小说正文：' + novelList.length + ' 章 + 目录页');
console.log('  整理文档：' + zhengliList.length + ' 篇 + 目录页');
console.log('  首页 + 样式');
console.log('输出目录：' + OUT);
