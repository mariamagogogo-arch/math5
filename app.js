'use strict';
/* =========================================================
 *  每日5题 · 五年级上册数学计算练习（人教版）
 *  纯静态网站：index.html + style.css + app.js
 *  做题记录只保存在本机浏览器（localStorage）
 * ========================================================= */

/* ---------- 1. 配置：家长可以改这里 ----------
 * 改完后重新上传 app.js 即可。
 * 也可以在"统计 → 家长查看"里直接开关单元（只对这台手机生效）。 */
var CONFIG = {
  units: {
    decimalMul: true,    // 小数乘法
    decimalDiv: true,    // 小数除法
    algebra: false,      // 用字母表示数 / 简易方程（学到了改成 true，应用题里会出现列方程）
    polygonArea: false   // 多边形的面积（学到了改成 true，应用题里会出现求面积）
  },
  retries: 1,            // 每题答错后可以重做几次
  reviewPass: 2          // 错题回炉：连续"一次做对"几次后移出错题本
};

/* ---------- 2. 名称 ---------- */
var SLOTS = ['竖式计算', '简便计算', '估算判断', '近似数与循环小数', '应用题'];
var VNAME = {
  mul: '小数乘小数', div: '除数是小数的除法', divRound: '除法·保留两位小数',
  assoc: '交换律、结合律', dist1: '拆数用分配律', dist2: '提出相同因数', split: '拆数凑整', paren: '括号与分配律',
  e1: '积的大小判断', e2: '商的大小判断', e3: '积和商比大小', e4: '估算',
  r1: '计算后取近似数', r2: '四舍五入保留小数', c1: '找循环节', c2: '循环小数取近似数',
  buy: '购物找零', travel: '行程问题', avg: '平均分', bag: '除数是小数的应用题',
  ceil: '进一法', floor: '去尾法', eq: '列方程解应用题', area: '多边形的面积'
};
var CATS = {
  dp:       { name: '小数点位置错了', tip: '数字算对了，小数点的位置不对。再数一数小数位数。' },
  zero:     { name: '商中间漏写了0', tip: '除到某一位不够商1时，要在这一位上商0占位。' },
  round:    { name: '四舍五入错了', tip: '看要保留的那一位的下一位：满5向前一位进1，不满5就舍去。' },
  trailing: { name: '末尾的0漏写了', tip: '要求保留几位小数，小数点后就要写满几位，末尾的0不能省略。' },
  method:   { name: '简便方法没用对', tip: '先观察数的特点，想想用哪个运算律能凑成整数、整十、整百。' },
  judge:    { name: '积、商大小判断错了', tip: '乘小于1的数，积变小；除以小于1的数，商变大。' },
  digits:   { name: '小数位数或扩大倍数数错了', tip: '数清楚每个数有几位小数。' },
  step:     { name: '应用题少算了一步', tip: '再读一遍问题，看看最后要求的是什么。' },
  carry:    { name: '进一法、去尾法用错了', tip: '剩下的也要装 → 进一法；剩下的不够做一个 → 去尾法。' },
  cycle:    { name: '循环节找错了', tip: '循环节是小数部分依次不断重复出现的那一组数字。' },
  formula:  { name: '面积公式用错了', tip: '三角形和梯形的面积都要除以2。' },
  calc:     { name: '计算出错了', tip: '检查竖式里的每一步，特别是进位和退位。' }
};
var NAMES = ['小明', '小红', '乐乐', '朵朵', '阳阳', '天天', '小宇', '甜甜'];

/* ---------- 3. 随机数（按日期生成，同一天题目相同） ---------- */
function seedOf(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function makeRng(key) {
  var a = seedOf(key);
  function f() { a = (a + 0x6D2B79F5) | 0; var t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
  return {
    int: function (lo, hi) { return lo + Math.floor(f() * (hi - lo + 1)); },
    pick: function (arr) { return arr[Math.floor(f() * arr.length)]; },
    chance: function (p) { return f() < p; },
    shuffle: function (arr) { arr = arr.slice(); for (var i = arr.length - 1; i > 0; i--) { var j = Math.floor(f() * (i + 1)); var t = arr[i]; arr[i] = arr[j]; arr[j] = t; } return arr; }
  };
}

/* ---------- 4. 小数工具：全部用整数运算，避免 0.1+0.2 的误差 ----------
 * 一个小数记作 {n, s}，表示 n ÷ 10^s，例如 3.05 = {n:305, s:2} */
function P10(k) { return Math.pow(10, k); }
function D(n, s) { s = s || 0; while (s > 0 && n % 10 === 0) { n = n / 10; s--; } return { n: n, s: s }; }
function I(n) { return { n: n, s: 0 }; }
function dn(str) { var p = parseNum(str); return D(p.n, p.s); }
function mulD(a, b) { return D(a.n * b.n, a.s + b.s); }
function addD(a, b) { var s = Math.max(a.s, b.s); return D(a.n * P10(s - a.s) + b.n * P10(s - b.s), s); }
function subD(a, b) { return addD(a, { n: -b.n, s: b.s }); }
function cmpD(a, b) { var s = Math.max(a.s, b.s), x = a.n * P10(s - a.s), y = b.n * P10(s - b.s); return x < y ? -1 : x > y ? 1 : 0; }
function eqD(a, b) { return cmpD(a, b) === 0; }
function val(a) { return a.n / P10(a.s); }
function fmt(a) { var b = D(a.n, a.s); return fmtF(b, b.s); }
function fmtF(a, k) {          // 固定 k 位小数（末尾的0保留）
  var n = a.n, s = a.s; if (k > s) { n *= P10(k - s); s = k; }
  var neg = n < 0, t = String(Math.abs(n)); while (t.length < s + 1) t = '0' + t;
  return (neg ? '-' : '') + (s ? t.slice(0, t.length - s) + '.' + t.slice(t.length - s) : t);
}
function ratio(a, b) { return { num: a.n * P10(b.s), den: b.n * P10(a.s) }; }
function divD(a, b, maxS) {    // 能在 maxS 位小数内除尽就返回商，否则 null
  var r = ratio(a, b); for (var k = 0; k <= (maxS == null ? 3 : maxS); k++) { var x = r.num * P10(k); if (x % r.den === 0) return D(x / r.den, k); } return null;
}
function roundR(r, k) { var q = Math.floor(r.num * P10(k + 1) / r.den), last = q % 10; q = Math.floor(q / 10); if (last >= 5) q++; return { n: q, s: k }; }
function truncR(r, k) { return { n: Math.floor(r.num * P10(k) / r.den), s: k }; }
function rdec(R, lo, hi, s) { var n; do { n = R.int(Math.round(lo * P10(s)), Math.round(hi * P10(s))); } while (s > 0 && n % 10 === 0); return { n: n, s: s }; }
function parseNum(str) {
  str = String(str == null ? '' : str).trim();
  if (str === '' || str === '.' || !/^\d*\.?\d*$/.test(str)) return null;
  var p = str.split('.'), s = p.length > 1 ? p[1].length : 0;
  return { n: parseInt((p[0] || '0') + (p[1] || ''), 10), s: s };
}
function digitsOf(a) { return fmt(a).replace('.', '').replace(/^0+/, ''); }
function sig(a) { return digitsOf(a).replace(/0+$/, ''); }
function longDiv(num, den) {   // 竖式除法，找出循环节
  var ip = Math.floor(num / den), r = num % den, digits = '', seen = {}, i = 0;
  while (r !== 0 && seen[r] === undefined && i < 40) { seen[r] = i; r *= 10; digits += Math.floor(r / den); r %= den; i++; }
  if (r === 0) return { ip: ip, non: digits, rep: '' };
  var st = seen[r]; return { ip: ip, non: digits.slice(0, st), rep: digits.slice(st) };
}
function cn(k) { return ['零', '一', '两', '三'][k]; }
function dotted(c) {           // 循环小数的简便写法（循环节首尾加点）
  var r = c.rep, h = r.length === 1 ? '<span class="rd">' + r + '</span>' : '<span class="rd">' + r[0] + '</span>' + r.slice(1, -1) + '<span class="rd">' + r[r.length - 1] + '</span>';
  return c.ip + '.' + c.non + h;
}
function longForm(c) { return c.ip + '.' + c.non + c.rep + c.rep + (c.rep.length < 3 ? c.rep : '') + '…'; }

/* ---------- 5. 判分与错误归类 ---------- */
var OK = { ok: true };
var INVALID = { ok: false, invalid: true, msg: '先填好答案再提交哦' };
function bad(cat, msg) { return { ok: false, cat: cat, msg: msg || CATS[cat].tip }; }
function missingZero(u, ans) {
  var a = digitsOf(ans), ud = digitsOf(u);
  for (var i = 1; i < a.length - 1; i++) if (a[i] === '0' && a.slice(0, i) + a.slice(i + 1) === ud) return true;
  return false;
}
/* o: {fixed: 必须保留几位小数, exact: 精确值(分数), traps: 常见错误答案, isDiv, cat: 默认错误类型, msgs: 自定义提示} */
function checkNum(str, ans, o) {
  o = o || {}; var M = o.msgs || {}, u = parseNum(str);
  if (!u) return INVALID;
  if (o.fixed != null) {
    if (eqD(u, ans)) return u.s === o.fixed ? OK : bad('trailing', '要求保留' + cn(o.fixed) + '位小数，小数点后面要正好写' + cn(o.fixed) + '位，末尾的0不能省略。');
  } else if (eqD(u, ans)) return OK;
  var traps = o.traps || [];
  for (var i = 0; i < traps.length; i++) if (eqD(u, traps[i].v)) return bad(traps[i].cat, traps[i].msg);
  if (sig(u) === sig(ans)) return bad('dp', M.dp);
  if (o.isDiv && missingZero(u, ans)) return bad('zero', M.zero);
  if (o.fixed != null && o.exact) {
    var t = truncR(o.exact, o.fixed);
    if (eqD(u, t) && !eqD(t, ans)) return bad('round', '要保留的那一位的下一位满5，要向前一位进1。');
    if (eqD(u, { n: t.n + 1, s: o.fixed }) && eqD(t, ans)) return bad('round', '下一位不满5，应该舍去，不用进1。');
    if (u.s !== o.fixed) return bad('round', '题目要求保留' + cn(o.fixed) + '位小数，你写了' + u.s + '位。');
  }
  var c = o.cat || 'calc'; return bad(c, M[c]);
}
function checkInt(str, ans, cat, msg) { var u = parseNum(str); if (!u) return INVALID; return eqD(u, I(ans)) ? OK : bad(cat, msg); }
function checkCycle(str, rep, non) {
  var s = String(str || '').replace(/\D/g, ''); if (!s) return INVALID;
  if (s === rep) return OK;
  if (s === rep + rep || s === rep + rep + rep) return bad('cycle', '循环节只写重复出现的“一组”数字，写一遍就够了。');
  if (non && s === non + rep) return bad('cycle', '前面的 ' + non + ' 没有重复出现，不属于循环节。');
  if (s.length === rep.length && (rep + rep).indexOf(s) >= 0) return bad('cycle', '循环节要从小数部分第一次开始重复的那一位算起。');
  return bad('cycle', '把商多算几位，看看是哪几个数字在不断重复。');
}
function numPart(label, unit, ans, opts, nudge) {
  opts = opts || {};
  return { kind: 'num', label: label, unit: unit || '', answer: opts.fixed != null ? fmtF(ans, opts.fixed) : fmt(ans), nudge: nudge,
    check: function (s) { return checkNum(s, ans, opts); } };
}
function intPart(label, unit, ans, cat, msg, opts) {
  opts = opts || {};
  return { kind: 'num', intOnly: true, label: label, unit: unit || '', answer: String(ans), nudge: opts.nudge,
    check: opts.check || function (s) { return checkInt(s, ans, cat, msg); } };
}
function choicePart(label, options, answer, cat, msg) { return { kind: 'choice', label: label, options: options, answer: answer, cat: cat, msg: msg }; }

/* ---------- 6. 出题器 ---------- */
function units() {
  var u = {}, k; for (k in CONFIG.units) u[k] = CONFIG.units[k];
  if (typeof S !== 'undefined' && S && S.cfg) for (k in S.cfg) if (k in u) u[k] = !!S.cfg[k];
  return u;
}
function variantsFor(slot, u) {
  u = u || units(); var mul = u.decimalMul, div = u.decimalDiv; if (!mul && !div) mul = div = true;
  switch (slot) {
    case 0: return (mul ? ['mul', 'mul'] : []).concat(div ? ['div', 'div', 'divRound'] : []);
    case 1: return ['assoc', 'dist1', 'dist2', 'split', 'paren'];
    case 2: return (mul ? ['e1', 'e3', 'e4'] : []).concat(div ? ['e2', 'e3', 'e4'] : []);
    case 3: return ['r1', 'r2'].concat(div ? ['c1', 'c2'] : []);
    default:
      var a = [];
      if (mul) a.push('buy', 'travel');
      if (div) a.push('avg', 'bag', 'ceil', 'floor');
      if (u.algebra) a.push('eq', 'eq');
      if (u.polygonArea) a.push('area', 'area');
      return a;
  }
}
function scaleUp(a, k) { return a.s >= k ? D(a.n, a.s - k) : I(a.n * P10(k - a.s)); }
function genQuot(R) {          // 生成商，40% 的商中间有 0（练"商中间漏写0"）
  if (R.chance(0.4)) { var n = R.int(1, 9) * 100 + R.int(1, 9); return D(n, R.pick([1, 2, 2])); }
  return R.chance(0.5) ? rdec(R, 1.2, 9.8, 1) : rdec(R, 0.12, 9.8, 2);
}

function genCalc(R, v) {
  var a, b, q, lines;
  if (v === 'mul') {
    do {
      var sa = R.pick([1, 1, 2]), sb = sa === 2 ? 1 : R.pick([1, 2]);
      a = sa === 1 ? rdec(R, 0.3, 36, 1) : rdec(R, 0.12, 4.8, 2);
      b = sb === 1 ? rdec(R, 0.2, 9.6, 1) : rdec(R, 0.05, 2.4, 2);
    } while ((a.n < 10 && b.n < 10) || a.n === 1 || b.n === 1);
    var p = mulD(a, b), cnt = a.s + b.s, prod = a.n * b.n, raw = fmtF({ n: prod, s: cnt }, cnt);
    lines = ['先按整数乘法算：' + a.n + ' × ' + b.n + ' = ' + prod + '。',
      '因数中一共有 ' + a.s + ' + ' + b.s + ' = ' + cnt + ' 位小数，从积的右边起数出 ' + cnt + ' 位，点上小数点' + (String(prod).length <= cnt ? '（位数不够，在前面用0补足）' : '') + '：' + raw + '。'];
    if (raw !== fmt(p)) lines.push('小数末尾的0可以去掉：' + raw + ' = ' + fmt(p) + '。');
    return { expr: fmt(a) + ' × ' + fmt(b) + ' =', note: '请先在草稿纸上列竖式，再分步填写。', ans: fmt(p), sol: lines,
      parts: [
        intPart('因数中一共有几位小数？', '位', cnt, 'digits', '把两个因数的小数位数加起来。'),
        numPart('积是多少？', '', p, { msgs: { dp: '因数中一共有几位小数，积就要有几位小数（位数不够时前面补0）。' } }, '积的小数位数对吗？位数不够时前面补0了吗？')
      ] };
  }
  var round = v === 'divRound', r, ans;
  if (round) {
    do { b = rdec(R, 0.3, 9.7, 1); a = R.chance(0.5) ? rdec(R, 1.2, 40, 1) : rdec(R, 0.5, 20, 2); } while (b.n === 1 || divD(a, b, 3) !== null);
    r = ratio(a, b); ans = roundR(r, 2);
  } else {
    do { b = R.chance(0.6) ? rdec(R, 0.2, 9.6, 1) : rdec(R, 0.04, 2.5, 2); q = genQuot(R); a = mulD(b, q); }
    while (a.s > 3 || a.n > 99999 || b.n === 1 || val(q) < 0.1);
    ans = q;
  }
  var k = b.s, m = P10(k), A = scaleUp(a, k), B = I(b.n);
  lines = ['除数 ' + fmt(b) + ' 是' + cn(k) + '位小数，被除数和除数同时扩大到原来的 ' + m + ' 倍：' + fmt(a) + ' ÷ ' + fmt(b) + ' → ' + fmt(A) + ' ÷ ' + fmt(B) + '。'];
  if (round) {
    var t3 = truncR(r, 3), d3 = t3.n % 10;
    lines.push('按除数是整数的除法计算，算到小数点后第三位：' + fmt(A) + ' ÷ ' + fmt(B) + ' = ' + fmtF(t3, 3) + '…');
    lines.push('保留两位小数，看第三位 ' + d3 + '：' + (d3 >= 5 ? '满5，向前一位进1' : '不满5，舍去') + '，所以商约是 ' + fmtF(ans, 2) + '。');
  } else {
    lines.push('按除数是整数的除法计算：' + fmt(A) + ' ÷ ' + fmt(B) + ' = ' + fmt(ans) + '。商的小数点要和被除数的小数点对齐。');
    if (/\d0\d/.test(fmt(ans).replace('.', ''))) lines.push('注意：除到某一位不够商1时，要在这一位上商0。');
  }
  return { expr: fmt(a) + ' ÷ ' + fmt(b) + (round ? ' ≈' : ' ='), text: round ? '计算，得数保留两位小数。' : '', note: '请先在草稿纸上列竖式，再分步填写。',
    ans: round ? fmtF(ans, 2) : fmt(ans), sol: lines,
    parts: [
      intPart('除数变成整数，被除数和除数要同时扩大到原来的几倍？', '倍', m, 'digits', '除数是一位小数就扩大到原来的10倍，两位小数就扩大到原来的100倍。'),
      numPart(round ? '商约是多少？（保留两位小数）' : '商是多少？', '', ans,
        round ? { fixed: 2, exact: r, isDiv: true } : { isDiv: true, msgs: { dp: '商的小数点要和扩大后的被除数的小数点对齐。' } },
        round ? '保留两位小数了吗？第三位四舍五入了吗？' : '商的小数点和被除数对齐了吗？中间有没有漏写0？')
    ] };
}

function genSimple(R, v) {
  var a, b, c, ans, lines, expr, traps = [], pr, plus, op;
  if (v === 'assoc') {
    pr = R.pick([['0.25', '4'], ['1.25', '8'], ['2.5', '4'], ['0.125', '8'], ['2.5', '0.4'], ['1.25', '0.8']]);
    a = dn(pr[0]); c = dn(pr[1]); b = R.chance(0.6) ? rdec(R, 1.2, 9.8, 1) : rdec(R, 0.12, 0.98, 2);
    var ac = mulD(a, c); ans = mulD(ac, b);
    expr = R.pick([[a, b, c], [c, b, a], [b, a, c]]).map(function (x) { return fmt(x); }).join(' × ') + ' =';
    lines = ['观察：' + fmt(a) + ' × ' + fmt(c) + ' = ' + fmt(ac) + '，可以先算这两个数。', '用乘法交换律和结合律：= ' + fmt(b) + ' × (' + fmt(a) + ' × ' + fmt(c) + ')', '= ' + fmt(b) + ' × ' + fmt(ac), '= ' + fmt(ans)];
  } else if (v === 'dist1') {
    var o = R.pick([['10', '+', '0.2'], ['10', '+', '0.1'], ['10', '-', '0.1'], ['10', '-', '0.2'], ['100', '+', '1'], ['100', '-', '1'], ['1', '+', '0.01'], ['1', '-', '0.01']]);
    var Bd = dn(o[0]), dd = dn(o[2]); plus = o[1] === '+'; op = plus ? ' + ' : ' − ';
    b = plus ? addD(Bd, dd) : subD(Bd, dd);
    do { a = R.chance(0.5) ? rdec(R, 1.2, 9.8, 1) : (R.chance(0.5) ? rdec(R, 12, 98, 0) : rdec(R, 0.12, 0.98, 2)); } while (a.s + dd.s > 3 || a.n === 1);
    ans = mulD(a, b); var aB = mulD(a, Bd), ad = mulD(a, dd);
    expr = (R.chance(0.5) ? fmt(a) + ' × ' + fmt(b) : fmt(b) + ' × ' + fmt(a)) + ' =';
    var tr = plus ? addD(aB, dd) : subD(aB, dd);
    if (!eqD(tr, ans)) traps.push({ v: tr, cat: 'method', msg: '把 ' + fmt(b) + ' 看成 ' + fmt(Bd) + op + fmt(dd) + ' 以后，' + fmt(dd) + ' 也要和 ' + fmt(a) + ' 相乘（乘法分配律）。' });
    lines = ['把 ' + fmt(b) + ' 看成 ' + fmt(Bd) + op + fmt(dd) + '，用乘法分配律：', '= ' + fmt(a) + ' × (' + fmt(Bd) + op + fmt(dd) + ')', '= ' + fmt(a) + ' × ' + fmt(Bd) + op + fmt(a) + ' × ' + fmt(dd), '= ' + fmt(aB) + op + fmt(ad), '= ' + fmt(ans)];
  } else if (v === 'dist2') {
    var T, Td; plus = R.chance(0.7); op = plus ? ' + ' : ' − ';
    if (plus) {
      T = R.pick(['10', '10', '1', '100']); Td = dn(T);
      b = T === '1' ? rdec(R, 0.12, 0.88, 2) : T === '10' ? rdec(R, 1.1, 8.9, 1) : rdec(R, 12.5, 87.5, 1);
      c = subD(Td, b);
    } else { T = R.pick(['1', '10']); Td = dn(T); c = rdec(R, 0.2, 4.8, 1); b = addD(Td, c); }
    a = b.s === 2 ? rdec(R, 1.2, 9.8, 1) : (R.chance(0.5) ? rdec(R, 1.2, 9.8, 1) : rdec(R, 0.12, 4.8, 2));
    ans = mulD(a, Td);
    var fa = fmt(a), fb = fmt(b), fc = fmt(c), form = R.int(0, 2);
    expr = (form === 0 ? fa + ' × ' + fb + op + fa + ' × ' + fc : form === 1 ? fb + ' × ' + fa + op + fc + ' × ' + fa : fa + ' × ' + fb + op + fc + ' × ' + fa) + ' =';
    lines = ['两个乘法算式里都有 ' + fa + '，用乘法分配律把它提出来：', '= ' + fa + ' × (' + fb + op + fc + ')', '= ' + fa + ' × ' + T, '= ' + fmt(ans)];
  } else if (v === 'split') {
    pr = R.pick([['1.25', '8'], ['0.25', '4'], ['2.5', '4'], ['0.125', '8']]); a = dn(pr[0]); c = dn(pr[1]);
    var m = R.chance(0.75) ? I(R.pick([3, 4, 5, 6, 7, 9, 11, 12])) : dn(R.pick(['1.1', '1.2', '0.3', '0.6']));
    var N = mulD(c, m), ac2 = mulD(a, c); ans = mulD(a, N);
    expr = (R.chance(0.5) ? fmt(a) + ' × ' + fmt(N) : fmt(N) + ' × ' + fmt(a)) + ' =';
    var tr2 = addD(ac2, mulD(a, m));
    if (!eqD(tr2, ans)) traps.push({ v: tr2, cat: 'method', msg: fmt(N) + ' = ' + fmt(c) + ' × ' + fmt(m) + '，是相乘的关系，不能拆成 ' + fmt(c) + ' + ' + fmt(m) + '。' });
    lines = ['把 ' + fmt(N) + ' 拆成 ' + fmt(c) + ' × ' + fmt(m) + '，先和 ' + fmt(a) + ' 凑成整数：', '= ' + fmt(a) + ' × ' + fmt(c) + ' × ' + fmt(m), '= ' + fmt(ac2) + ' × ' + fmt(m), '= ' + fmt(ans)];
  } else {  // paren
    pr = R.pick([['4', '2.5'], ['4', '0.25'], ['8', '1.25'], ['8', '0.125']]); var p = dn(pr[0]); c = dn(pr[1]);
    var x = mulD(p, I(R.pick([1, 2, 3, 10]))), y = mulD(p, dn(R.pick(['0.1', '0.2', '0.3', '0.5'])));
    plus = R.chance(0.7); op = plus ? ' + ' : ' − ';
    ans = mulD(plus ? addD(x, y) : subD(x, y), c);
    var xc = mulD(x, c), yc = mulD(y, c), inner = '(' + fmt(x) + op + fmt(y) + ')';
    expr = (R.chance(0.6) ? inner + ' × ' + fmt(c) : fmt(c) + ' × ' + inner) + ' =';
    var tr3 = plus ? addD(xc, y) : subD(xc, y);
    if (tr3.n > 0 && !eqD(tr3, ans)) traps.push({ v: tr3, cat: 'method', msg: '括号里的每个数都要和 ' + fmt(c) + ' 相乘，' + fmt(y) + ' 也要乘。' });
    lines = ['用乘法分配律，括号里的两个数分别乘 ' + fmt(c) + '：', '= ' + fmt(x) + ' × ' + fmt(c) + op + fmt(y) + ' × ' + fmt(c), '= ' + fmt(xc) + op + fmt(yc), '= ' + fmt(ans)];
  }
  return { text: '用简便方法计算。', expr: expr, ans: fmt(ans), sol: lines,
    parts: [numPart('结果是多少？', '', ans, { traps: traps, cat: 'method' }, '用简便方法了吗？小数点点对了吗？')] };
}

function genJudge(R, v) {
  if (v === 'e4') {
    var A, Bn, a, b, base, opts, lines, expr, isMul = R.chance(0.5);
    if (isMul) {
      A = R.int(2, 9); Bn = R.int(2, 9); a = D(A * 10 + R.pick([-2, -1, 1, 2]), 1); b = D(Bn * 10 + R.pick([-1, 1]), 1);
      base = I(A * Bn); expr = fmt(a) + ' × ' + fmt(b);
      lines = ['把 ' + fmt(a) + ' 看作 ' + A + '，' + fmt(b) + ' 看作 ' + Bn + '。', A + ' × ' + Bn + ' = ' + (A * Bn) + '，所以积大约是 ' + (A * Bn) + '。'];
    } else {
      A = R.int(2, 9); Bn = R.int(2, 9); a = D(A * Bn * 10 + R.pick([-2, -1, 1, 2]), 2); b = D(Bn, 1);
      base = I(A); expr = fmt(a) + ' ÷ ' + fmt(b);
      lines = ['除数 ' + fmt(b) + ' 是一位小数，被除数和除数同时扩大到原来的10倍：' + fmt(a) + ' ÷ ' + fmt(b) + ' → ' + fmt(mulD(a, I(10))) + ' ÷ ' + Bn + '。',
        '把 ' + fmt(mulD(a, I(10))) + ' 看作 ' + (A * Bn) + '，' + (A * Bn) + ' ÷ ' + Bn + ' = ' + A + '，所以商大约是 ' + A + '。'];
    }
    opts = R.shuffle([mulD(base, D(1, 1)), base, mulD(base, I(10)), mulD(base, I(100))]);
    var strs = opts.map(function (x) { return fmt(x); });
    return { text: '估一估，下面哪个数最接近', expr: expr + ' 的' + (isMul ? '积' : '商') + '？', ans: fmt(base), sol: lines,
      parts: [choicePart('选一选', strs, strs.indexOf(fmt(base)), 'dp', '先把数看成接近的整数估一估，再看看小数点的位置。')] };
  }
  var a2 = rdec(R, 1.2, 96, 1), small = R.chance(0.5);
  var b2 = small ? (R.chance(0.5) ? rdec(R, 0.12, 0.98, 2) : rdec(R, 0.2, 0.9, 1)) : (R.chance(0.5) ? rdec(R, 1.01, 1.99, 2) : rdec(R, 1.1, 4.8, 1));
  var fa = fmt(a2), fb = fmt(b2), rel = small ? '小于 1' : '大于 1', hint = '想一想：' + fb + ' 比 1 大还是比 1 小？';
  if (v === 'e3') {
    var right = small ? '<' : '>';
    return { text: '不计算，在 ○ 里填“>”“<”或“=”。', expr: fa + ' × ' + fb + ' ○ ' + fa + ' ÷ ' + fb, ans: right,
      sol: [fb + ' ' + rel + '：乘 ' + fb + '，积比 ' + fa + (small ? '小' : '大') + '；除以 ' + fb + '，商比 ' + fa + (small ? '大' : '小') + '。', '所以 ' + fa + ' × ' + fb + ' ' + right + ' ' + fa + ' ÷ ' + fb + '。'],
      parts: [choicePart('○ 里应该填什么？', ['>', '<', '='], small ? 1 : 0, 'judge', hint)] };
  }
  var mul = v === 'e1', word = mul ? '积' : '商', bigger = mul ? !small : small;
  return { text: '不计算，判断：', expr: fa + (mul ? ' × ' : ' ÷ ') + fb, ans: '比 ' + fa + (bigger ? ' 大' : ' 小'),
    sol: [mul ? '一个数（0除外）乘大于1的数，积比原数大；乘小于1的数，积比原数小。' : '一个数（0除外）除以大于1的数，商比原数小；除以小于1的数，商比原数大。',
      fb + ' ' + rel + '，所以' + word + '比 ' + fa + (bigger ? ' 大' : ' 小') + '。'],
    parts: [choicePart(word + '比 ' + fa + ' 大还是小？', ['比 ' + fa + ' 大', '比 ' + fa + ' 小', '和 ' + fa + ' 相等'], bigger ? 0 : 1, 'judge', hint)] };
}

function genRound(R, v) {
  var k = R.pick([1, 2]), x, ex, ans, lines;
  if (v === 'r1' || v === 'r2') {
    if (v === 'r1') {
      var a, b; do { a = rdec(R, 1.2, 9.8, 1); b = rdec(R, 0.12, 4.8, 2); x = mulD(a, b); } while (x.s < 3);
    } else {
      var Ip = R.int(0, 19);
      if (R.chance(0.6)) {
        if (k === 2) x = R.chance(0.5) ? D((Ip * 100 + 99) * 10 + R.int(5, 9), 3) : D((Ip * 100 + R.int(0, 8) * 10 + 9) * 10 + R.int(5, 9), 3);
        else x = D((Ip * 10 + 9) * 100 + R.int(5, 9) * 10 + R.int(1, 9), 3);
      } else x = rdec(R, Ip + 0.001, Ip + 0.999, R.pick([3, 4]));
      if (x.s <= k) x = D(x.n * 10 + 7, x.s + 1);
    }
    ex = { num: x.n, den: P10(x.s) }; ans = roundR(ex, k);
    var nd = Math.floor(x.n / P10(x.s - k - 1)) % 10;
    lines = ['保留' + cn(k) + '位小数，要看小数点后第' + cn(k + 1) + '位：是 ' + nd + '，' + (nd >= 5 ? '满5，向前一位进1' : '不满5，舍去') + '。', fmt(x) + ' ≈ ' + fmtF(ans, k) + (/0$/.test(fmtF(ans, k)) ? '（末尾的0表示精确到这一位，不能去掉）' : '')];
    if (v === 'r1') lines.unshift(fmt(a) + ' × ' + fmt(b) + ' = ' + fmt(x) + '。');
    return { text: v === 'r1' ? '计算，结果保留' + cn(k) + '位小数。' : '用四舍五入法，把下面的数保留' + cn(k) + '位小数。',
      expr: v === 'r1' ? fmt(a) + ' × ' + fmt(b) + ' ≈' : fmt(x) + ' ≈', ans: fmtF(ans, k), sol: lines,
      parts: [numPart('近似数是多少？', '', ans, { fixed: k, exact: ex }, '保留了' + cn(k) + '位小数吗？末尾的0写了吗？')] };
  }
  var dv, dd2, c, r;
  do {
    dv = R.chance(0.75) ? I(R.pick([3, 6, 9, 11, 12, 15, 18, 22, 33, 36, 45])) : dn(R.pick(['0.3', '0.6', '0.9', '1.1', '1.2']));
    dd2 = R.chance(0.6) ? I(R.int(1, 50)) : rdec(R, 1.1, 30, 1);
    r = ratio(dd2, dv); c = longDiv(r.num, r.den);
  } while (!c.rep || c.rep.length > 2 || /^0+$/.test(c.rep));
  var e = fmt(dd2) + ' ÷ ' + fmt(dv);
  if (v === 'c1') {
    return { text: '计算下面的除法，商是一个循环小数。', expr: e + ' =', ans: c.rep,
      sol: [e + ' = ' + longForm(c), '小数部分从第 ' + (c.non.length + 1) + ' 位起，' + c.rep + ' 依次不断重复出现，所以循环节是 ' + c.rep + '。', '简便写法：' + dotted(c)],
      parts: [intPart('它的循环节是什么？（只填数字）', '', c.rep, 'cycle', '', { check: function (s) { return checkCycle(s, c.rep, c.non); }, nudge: '' })] };
  }
  ans = roundR(r, k); var t = truncR(r, k + 1), nd2 = t.n % 10;
  return { text: '下面除法的商是循环小数，把商保留' + cn(k) + '位小数。', expr: e + ' = ' + dotted(c) + ' ≈', ans: fmtF(ans, k),
    sol: ['把循环小数多写几位：' + longForm(c), '保留' + cn(k) + '位小数，看第' + cn(k + 1) + '位 ' + nd2 + '：' + (nd2 >= 5 ? '满5，向前一位进1' : '不满5，舍去') + '，所以约是 ' + fmtF(ans, k) + '。'],
    parts: [numPart('近似数是多少？', '', ans, { fixed: k, exact: r }, '保留了' + cn(k) + '位小数吗？下一位四舍五入了吗？')] };
}

function payFor(x) { var opts = [20, 50, 100, 200]; for (var i = 0; i < opts.length; i++) if (opts[i] > val(x)) return opts[i]; return 500; }
function genWord(R, v) {
  var who = R.pick(NAMES), text, ans, lines, traps = [], unit, opts = {}, nudge = '单位和问题看清楚了吗？小数点对吗？';
  if (v === 'buy') {
    var it = R.pick([['慈溪杨梅', 18, 36], ['宁波年糕', 4, 9], ['草莓', 12, 30], ['苹果', 5, 12], ['橘子', 3, 9], ['猪肉', 18, 32]]);
    var p = rdec(R, it[1], it[2], 1), q = rdec(R, 1.2, 4.8, 1), tot = mulD(p, q), pay = payFor(tot);
    ans = subD(I(pay), tot); unit = '元';
    text = who + '买了 ' + fmt(q) + ' 千克' + it[0] + '，每千克 ' + fmt(p) + ' 元。付了 ' + pay + ' 元，应找回多少元？';
    traps.push({ v: tot, cat: 'step', msg: '你算出的是买' + it[0] + '花的钱，题目问的是找回多少元，还要再算一步。' });
    lines = ['先算买' + it[0] + '花了多少钱：' + fmt(p) + ' × ' + fmt(q) + ' = ' + fmt(tot) + '（元）', '再算找回多少钱：' + pay + ' − ' + fmt(tot) + ' = ' + fmt(ans) + '（元）'];
  } else if (v === 'travel') {
    var sp = D(R.int(90, 190) * 5, 1), t1 = rdec(R, 1.2, 3.6, 1), t2; do { t2 = rdec(R, 1.5, 4.8, 1); } while (eqD(t1, t2));
    var dist = mulD(sp, t1); ans = mulD(sp, t2); unit = '千米';
    text = R.pick(['一辆汽车从宁波开往杭州', '一辆大巴从宁波开往舟山', '一辆货车从宁波开往上海']) + '，' + fmt(t1) + ' 小时行驶了 ' + fmt(dist) + ' 千米。照这样的速度，' + fmt(t2) + ' 小时能行驶多少千米？';
    traps.push({ v: sp, cat: 'step', msg: '你算出的是每小时行驶的路程，还要再乘 ' + fmt(t2) + ' 小时。' });
    lines = ['先算每小时行驶多少千米：' + fmt(dist) + ' ÷ ' + fmt(t1) + ' = ' + fmt(sp) + '（千米）', '再算 ' + fmt(t2) + ' 小时行驶多少千米：' + fmt(sp) + ' × ' + fmt(t2) + ' = ' + fmt(ans) + '（千米）'];
  } else if (v === 'avg') {
    var n = R.int(3, 9), qq = R.chance(0.6) ? D(R.int(1, 9) * 100 + R.int(1, 9), R.pick([1, 2, 2])) : rdec(R, 0.35, 4.8, 2), L = mulD(qq, I(n));
    var ctx = R.pick([['一根彩带长 ', ' 米，平均剪成 ', ' 段，每段长多少米？', '米'], ['一袋宁波汤圆重 ', ' 千克，平均分给 ', ' 个小朋友，每人分到多少千克？', '千克'], ['修一条长 ', ' 千米的小路，计划 ', ' 天修完，平均每天修多少千米？', '千米']]);
    ans = qq; unit = ctx[3]; opts.isDiv = true;
    text = ctx[0] + fmt(L) + ctx[1] + n + ctx[2];
    lines = [fmt(L) + ' ÷ ' + n + ' = ' + fmt(ans) + '（' + unit + '）'];
    if (/\d0\d/.test(fmt(ans).replace('.', ''))) lines.push('注意：除到某一位不够商1时，要在这一位上商0。');
  } else if (v === 'bag') {
    var ctx2 = R.pick([['每袋汤圆装 ', ' 千克，', ' 千克汤圆可以装多少袋？', '袋', '千克'], ['每瓶装 ', ' 升果汁，', ' 升果汁可以装多少瓶？', '瓶', '升'], ['做一面小旗用布 ', ' 平方米，', ' 平方米的布可以做多少面小旗？', '面', '平方米']]);
    var cs = dn(R.pick(['0.45', '0.25', '1.5', '2.5', '0.75', '1.2', '0.8', '0.35'])), kk = R.int(6, 48), T = mulD(cs, I(kk));
    ans = I(kk); unit = ctx2[3]; opts.isDiv = true; opts.msgs = { dp: '除数是小数，先把除数和被除数同时扩大相同的倍数，再看商的小数点。' };
    text = ctx2[0] + fmt(cs) + ctx2[1] + fmt(T) + ctx2[2];
    lines = [fmt(T) + ' ÷ ' + fmt(cs) + '：除数是' + cn(cs.s) + '位小数，同时扩大到原来的 ' + P10(cs.s) + ' 倍 → ' + fmt(scaleUp(T, cs.s)) + ' ÷ ' + cs.n + ' = ' + kk + '（' + unit + '）'];
  } else if (v === 'ceil' || v === 'floor') {
    var C = dn(R.pick(['2.5', '1.5', '4.5', '0.8', '1.2', '3.5', '2.4'])), k = R.int(5, 30), rem;
    do { rem = rdec(R, 0.1, val(C) - 0.1, 1); } while (cmpD(rem, C) >= 0);
    var Tt = addD(mulD(C, I(k)), rem), up = v === 'ceil';
    ans = I(up ? k + 1 : k); unit = '个';
    text = up ? '每个油桶最多装 ' + fmt(C) + ' 千克油，现在有 ' + fmt(Tt) + ' 千克油，至少需要几个油桶？' : '做一个中国结要用 ' + fmt(C) + ' 米彩绳，' + fmt(Tt) + ' 米彩绳最多能做几个中国结？';
    traps.push({ v: I(up ? k : k + 1), cat: 'carry', msg: up ? '剩下的油也要用一个油桶装，要用“进一法”。' : '剩下的彩绳不够做一个中国结，要用“去尾法”。' });
    lines = [fmt(Tt) + ' ÷ ' + fmt(C) + ' = ' + k + '（个）……' + fmt(rem) + '（' + (up ? '千克' : '米') + '）',
      up ? '装满 ' + k + ' 个油桶后，还剩 ' + fmt(rem) + ' 千克油，还要再用 1 个油桶（进一法）：' + k + ' + 1 = ' + (k + 1) + '（个）' : '剩下的 ' + fmt(rem) + ' 米不够做一个（去尾法），所以最多能做 ' + k + ' 个。'];
  } else if (v === 'eq') {
    if (R.chance(0.5)) {
      var kq = R.int(2, 6), x = rdec(R, 2.5, 12.8, 1), cost = mulD(x, I(kq)), pay2 = payFor(cost), back = subD(I(pay2), cost);
      ans = x; unit = '元';
      text = who + '买了 ' + kq + ' 支同样的钢笔，付了 ' + pay2 + ' 元，找回 ' + fmt(back) + ' 元。每支钢笔多少元？（可以设每支 x 元，列方程解答）';
      traps.push({ v: cost, cat: 'step', msg: '你算出的是 ' + kq + ' 支钢笔一共的钱，还要再除以 ' + kq + '。' });
      lines = ['解：设每支钢笔 x 元。', kq + 'x + ' + fmt(back) + ' = ' + pay2, kq + 'x = ' + fmt(cost), 'x = ' + fmt(x), '答：每支钢笔 ' + fmt(x) + ' 元。'];
    } else {
      var len = rdec(R, 6.5, 18.5, 1), wid; do { wid = rdec(R, 2.5, 6.5, 1); } while (cmpD(wid, len) >= 0);
      var per = mulD(addD(len, wid), I(2)); ans = wid; unit = '米';
      text = '一个长方形花坛的周长是 ' + fmt(per) + ' 米，长是 ' + fmt(len) + ' 米。宽是多少米？（可以设宽为 x 米，列方程解答）';
      traps.push({ v: mulD(per, D(5, 1)), cat: 'step', msg: '周长 ÷ 2 得到的是长与宽的和，还要再减去长。' });
      lines = ['解：设宽为 x 米。', '2 × (' + fmt(len) + ' + x) = ' + fmt(per), fmt(len) + ' + x = ' + fmt(mulD(per, D(5, 1))), 'x = ' + fmt(wid), '答：宽是 ' + fmt(wid) + ' 米。'];
    }
  } else {  // area
    var shape = R.pick(['para', 'tri', 'trap']), bb = rdec(R, 2.4, 12.8, 1), hh = rdec(R, 1.5, 9.6, 1); unit = '平方米';
    if (shape === 'para') {
      ans = mulD(bb, hh); text = '一块平行四边形菜地，底是 ' + fmt(bb) + ' 米，高是 ' + fmt(hh) + ' 米。这块菜地的面积是多少平方米？';
      lines = ['平行四边形的面积 = 底 × 高', fmt(bb) + ' × ' + fmt(hh) + ' = ' + fmt(ans) + '（平方米）'];
    } else if (shape === 'tri') {
      ans = mulD(mulD(bb, hh), D(5, 1)); text = '一块三角形的广告牌，底是 ' + fmt(bb) + ' 米，高是 ' + fmt(hh) + ' 米。它的面积是多少平方米？';
      traps.push({ v: mulD(bb, hh), cat: 'formula', msg: '三角形的面积 = 底 × 高 ÷ 2，别忘了除以2。' });
      lines = ['三角形的面积 = 底 × 高 ÷ 2', fmt(bb) + ' × ' + fmt(hh) + ' ÷ 2 = ' + fmt(ans) + '（平方米）'];
    } else {
      var top; do { top = rdec(R, 1.5, 9.6, 1); } while (cmpD(top, bb) >= 0);
      ans = mulD(mulD(addD(top, bb), hh), D(5, 1));
      text = '一块梯形花坛，上底是 ' + fmt(top) + ' 米，下底是 ' + fmt(bb) + ' 米，高是 ' + fmt(hh) + ' 米。它的面积是多少平方米？';
      traps.push({ v: mulD(addD(top, bb), hh), cat: 'formula', msg: '梯形的面积 =（上底 + 下底）× 高 ÷ 2，别忘了除以2。' });
      lines = ['梯形的面积 =（上底 + 下底）× 高 ÷ 2', '(' + fmt(top) + ' + ' + fmt(bb) + ') × ' + fmt(hh) + ' ÷ 2 = ' + fmt(ans) + '（平方米）'];
    }
  }
  opts.traps = traps;
  var whole = ans.s === 0 && (v === 'ceil' || v === 'floor' || v === 'bag');
  var part = whole ? intPart('答案是多少？', unit, ans.n, 'calc', '', { check: function (s) { return checkNum(s, ans, opts); }, nudge: nudge })
    : numPart('答案是多少？', unit, ans, opts, nudge);
  return { text: text, ans: fmt(ans) + ' ' + unit, sol: lines, parts: [part] };
}

var GEN = [genCalc, genSimple, genJudge, genRound, genWord];
function strip(h) { return String(h || '').replace(/<[^>]+>/g, ''); }
function build(spec) {
  var p = GEN[spec.slot](makeRng(spec.seed), spec.variant);
  p.slot = spec.slot; p.variant = spec.variant;
  p.plain = ((p.text ? strip(p.text) + ' ' : '') + strip(p.expr || '')).trim();
  return p;
}

/* ---------- 7. 记录、每日出题、错题回炉 ---------- */
var KEY = 'mathDaily5-v1';
var S = { days: {}, wb: {}, cfg: null };
function pad(n) { return n < 10 ? '0' + n : '' + n; }
function ymd(t) { return t.getFullYear() + '-' + pad(t.getMonth() + 1) + '-' + pad(t.getDate()); }
function parseYmd(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2], 12); }
function addDays(s, k) { var t = parseYmd(s); t.setDate(t.getDate() + k); return ymd(t); }
function isFinal(r) { return !!(r && r.st && r.st !== 'doing'); }

function ensureDay(date) {
  if (S.days[date]) return S.days[date];
  var specs = [];
  for (var slot = 0; slot < 5; slot++) {
    var due = null;
    for (var k in S.wb) { var e = S.wb[k]; if (e.slot === slot && e.since < date && (!due || e.since < S.wb[due].since)) due = k; }
    if (due) specs.push({ slot: slot, variant: S.wb[due].variant, seed: date + '#r' + slot, review: true, wbKey: due });
    else { var v = makeRng(date + '#' + slot).pick(variantsFor(slot)); specs.push({ slot: slot, variant: v, seed: date + '#' + slot + v }); }
  }
  S.days[date] = { specs: specs, res: [null, null, null, null, null], done: false };
  save(); return S.days[date];
}
/* 做错（不是一次做对）的题型进错题本；之后每天在同一位置换数字再出，连续一次做对 reviewPass 次后移出 */
function updateWB(spec, st, date) {
  if (spec.review) {
    var e = S.wb[spec.wbKey]; if (!e) return false;
    e.last = date;
    if (st === 'right1') { e.streak++; if (e.streak >= CONFIG.reviewPass) { delete S.wb[spec.wbKey]; return true; } }
    else e.streak = 0;
    return false;
  }
  if (st !== 'right1') {
    var key = spec.slot + ':' + spec.variant;
    if (S.wb[key]) S.wb[key].streak = 0;
    else S.wb[key] = { slot: spec.slot, variant: spec.variant, since: date, streak: 0 };
  }
  return false;
}
function allFinals() {
  var out = [];
  Object.keys(S.days).sort().forEach(function (dt) {
    var day = S.days[dt];
    day.res.forEach(function (r, i) { if (isFinal(r)) out.push({ date: dt, i: i, spec: day.specs[i], r: r }); });
  });
  return out;
}
function streak(today) {
  var n = 0, dt = today;
  if (!(S.days[dt] && S.days[dt].done)) dt = addDays(dt, -1);
  while (S.days[dt] && S.days[dt].done) { n++; dt = addDays(dt, -1); }
  return n;
}
function load() { try { var t = localStorage.getItem(KEY); if (t) { var o = JSON.parse(t); if (o && o.days) { o.wb = o.wb || {}; return o; } } } catch (e) {} return null; }
function save() { try { if (typeof localStorage !== 'undefined') localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

/* ---------- 8. 界面 ---------- */
var TODAY, view = 'home', cur = null, $app, parentConfirm = false;
var WEEK = '日一二三四五六', STEP = ['①', '②', '③'];
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function showVal(v) { return esc(v).replace('.', '<span class="pt">.</span>'); }
function stName(st) { return { right1: '一次做对', right2: '改对了', wrong: '做错了' }[st] || '未做'; }
function go(v) { view = v; parentConfirm = false; render(); window.scrollTo(0, 0); }

function render() {
  var h = view === 'practice' ? renderPractice() : view === 'summary' ? renderSummary() : view === 'stats' ? renderStats() : view === 'parent' ? renderParent() : renderHome();
  $app.innerHTML = h;
}

function renderHome() {
  var day = ensureDay(TODAY), nDone = 0, n1 = 0, dt = parseYmd(TODAY);
  day.res.forEach(function (r) { if (isFinal(r)) { nDone++; if (r.st === 'right1') n1++; } });
  var rows = day.specs.map(function (s, i) {
    var r = day.res[i], st = isFinal(r) ? r.st : '';
    return '<li class="slot ' + st + '"><span class="no">' + (i + 1) + '</span><span class="nm">' + SLOTS[i] + (s.review ? '<em class="badge">回炉</em>' : '') + '</span><span class="stt">' + stName(st) + '</span></li>';
  }).join('');
  var btn = nDone === 0 ? '开始今天的 5 题' : nDone < 5 ? '继续做题（已做 ' + nDone + '/5）' : '查看今天的成绩';
  var wbN = Object.keys(S.wb).length;
  return '<div class="topbar"><a class="back" href="../">‹ 学习首页</a></div><header class="hello"><div class="date">' + (dt.getMonth() + 1) + '月' + dt.getDate() + '日 星期' + WEEK[dt.getDay()] + '</div>' +
    '<h1>每日<b>5</b>题</h1><p class="sub">五年级上册 · 计算不粗心</p></header>' +
    '<section class="card today"><ul class="slots">' + rows + '</ul>' +
    '<button class="btn primary" data-act="start">' + btn + '</button>' +
    (nDone === 5 ? '<p class="doneline">今天完成啦！一次做对 ' + n1 + ' 题</p>' : '') + '</section>' +
    '<section class="tiles"><div class="tile"><b>' + streak(TODAY) + '</b><span>连续打卡（天）</span></div>' +
    '<div class="tile"><b>' + wbN + '</b><span>错题本里的题型</span></div></section>' +
    '<button class="btn ghost" data-act="stats">学习统计 · 家长查看</button>' +
    '<p class="motto">每天 5 道，慢一点、算仔细，比做得快更重要。</p>';
}

function start() {
  var day = ensureDay(TODAY);
  for (var i = 0; i < 5; i++) if (!isFinal(day.res[i])) return openProblem(i);
  go('summary');
}
function openProblem(i) {
  var day = ensureDay(TODAY), spec = day.specs[i], r = day.res[i], p = build(spec);
  cur = { i: i, spec: spec, p: p, part: 0, left: 1 + CONFIG.retries, cats: [], inputs: p.parts.map(function () { return ''; }), fb: null, final: false, st: null, confirm: false };
  if (r) {
    cur.part = r.part || 0; cur.left = r.left; cur.cats = (r.cats || []).slice(); if (r.ans) cur.inputs = r.ans.slice();
    if (isFinal(r)) { cur.final = true; cur.st = r.st; cur.part = p.parts.length - 1; if (r.st === 'wrong') { var c = cur.cats[cur.cats.length - 1] || 'calc'; cur.fb = { cat: c, msg: r.msg || CATS[c].tip }; } }
    else if (r.fb) cur.fb = r.fb;
  }
  clearFx(); view = 'practice'; render(); window.scrollTo(0, 0);
}
function clearFx() { var fx = document.getElementById('fx'); clearTimeout(celebrate.t); fx.className = ''; fx.innerHTML = ''; }

function solHtml(p) { return '<ol class="sol">' + p.sol.map(function (l) { return '<li>' + l + '</li>'; }).join('') + '</ol>'; }
function renderPractice() {
  var p = cur.p, day = S.days[TODAY], n = p.parts.length;
  var dots = day.specs.map(function (s, i) { var r = day.res[i]; return '<span class="dot ' + (isFinal(r) ? r.st : '') + (i === cur.i ? ' cur' : '') + '"></span>'; }).join('');
  var parts = p.parts.map(function (pt, k) {
    if (k > cur.part) return '';
    var active = !cur.final && k === cur.part, done = k < cur.part || (cur.final && cur.st !== 'wrong');
    var head = '<div class="plabel">' + (n > 1 ? '<i>' + STEP[k] + '</i>' : '') + esc(pt.label) + '</div>';
    if (pt.kind === 'choice') {
      var sel = cur.inputs[k];
      return '<div class="part">' + head + '<div class="opts">' + pt.options.map(function (o, j) {
        var cls = String(j) === sel ? ' sel' : '';
        if (cur.final) { if (j === pt.answer) cls = ' ok'; else if (String(j) === sel) cls = ' bad'; }
        return '<button class="opt' + cls + '" data-act="pick" data-v="' + j + '"' + (cur.final ? ' disabled' : '') + '>' + esc(o) + '</button>';
      }).join('') + '</div></div>';
    }
    var v = cur.inputs[k];
    return '<div class="part' + (active ? ' on' : '') + '">' + head + '<div class="arow"><div class="abox' + (active ? ' on' : '') + (cur.final && cur.st === 'wrong' && k === cur.part ? ' wrong' : '') + '" id="abox' + k + '">' +
      (v ? showVal(v) : '<span class="ph">' + (active ? '用下面的键盘填写' : '') + '</span>') + (active ? '<span class="caret"></span>' : '') + '</div>' +
      (pt.unit ? '<span class="unit">' + esc(pt.unit) + '</span>' : '') + (done ? '<span class="tick">✓</span>' : '') + '</div></div>';
  }).join('');
  var fb = '';
  if (cur.final) {
    if (cur.st === 'wrong') fb = '<div class="fb bad"><div class="fbh">可能原因：' + CATS[cur.fb.cat].name + '</div><p>' + esc(cur.fb.msg) + '</p>' +
      '<div class="right">正确答案：<b>' + esc(p.ans) + '</b></div><div class="solh">一步一步看</div>' + solHtml(p) +
      '<p class="mini">这个题型放进了错题本，接下来几天会换数字再练，连续一次做对 ' + CONFIG.reviewPass + ' 次就能移出。</p></div>';
    else fb = '<div class="fb ok"><div class="fbh">' + (cur.st === 'right1' ? '一次做对，真棒！' : '改对了！下次争取一次做对。') + '</div>' +
      (cur.cleared ? '<p>这个题型已经连续做对 ' + CONFIG.reviewPass + ' 次，移出错题本啦！</p>' : '') +
      (cur.st === 'right2' ? '<p class="mini">这次没有一次做对，这个题型会放进错题本再练几天。</p>' : '') +
      '<details><summary>看看解题过程</summary>' + solHtml(p) + '</details></div>';
  } else if (cur.fb) {
    fb = '<div class="fb warn" id="fbw"><div class="fbh">可能原因：' + CATS[cur.fb.cat].name + '</div><p>' + esc(cur.fb.msg) + '</p><p class="mini">还有 ' + cur.left + ' 次重做机会，改一改再提交。</p></div>';
  }
  var pt = p.parts[cur.part], dock;
  if (cur.final) dock = '<button class="btn primary" data-act="next">' + (nextIndex() < 0 ? '看今天的成绩' : '下一题 →') + '</button>';
  else {
    var last = cur.part === n - 1, label = last ? '提交' : '下一步';
    dock = pt.kind === 'num' ? keypad(pt) + '<button class="btn primary" data-act="submit">' + label + '</button>' : '<button class="btn primary" data-act="submit">' + label + '</button>';
  }
  var sheet = '';
  if (cur.confirm) sheet = '<div class="mask"><div class="sheet" role="dialog" aria-label="提交前检查"><div class="sh-t">检查一下小数点了吗？</div>' +
    '<div class="sh-v">' + showVal(cur.inputs[cur.part]) + (pt.unit ? '<small>' + esc(pt.unit) + '</small>' : '') + '</div><p>' + esc(pt.nudge || '') + '</p>' +
    '<div class="sh-b"><button class="btn ghost" data-act="confirm-no">再看看</button><button class="btn primary" data-act="confirm-yes">检查好了，提交</button></div></div></div>';
  return '<div class="topbar"><button class="back" data-act="home">‹ 首页</button><div class="dots">' + dots + '</div></div>' +
    '<article class="card prob" id="prob"><div class="tagrow"><span class="qno">第 ' + (cur.i + 1) + ' 题</span><span class="qtype">' + SLOTS[p.slot] + ' · ' + VNAME[p.variant] + '</span>' +
    (cur.spec.review ? '<span class="badge">回炉题</span>' : '') + '</div>' +
    (p.text ? '<p class="ptext">' + p.text + '</p>' : '') + (p.expr ? '<div class="expr">' + p.expr + '</div>' : '') +
    (p.note && !cur.final ? '<p class="note">' + p.note + '</p>' : '') + parts + fb + '</article>' +
    '<div class="dock">' + dock + '</div>' + sheet;
}
function keypad(pt) {
  var keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del'];
  return '<div class="keypad">' + keys.map(function (k) {
    if (k === '.') return '<button class="key pt-key" data-act="key" data-k="."' + (pt.intOnly ? ' disabled' : '') + '>.</button>';
    if (k === 'del') return '<button class="key fn" data-act="key" data-k="del" aria-label="删除">⌫</button>';
    return '<button class="key" data-act="key" data-k="' + k + '">' + k + '</button>';
  }).join('') + '</div>';
}
function press(k) {
  if (!cur || cur.final || cur.confirm) return;
  var pt = cur.p.parts[cur.part]; if (pt.kind !== 'num') return;
  var v = cur.inputs[cur.part] || '';
  if (k === 'del') v = v.slice(0, -1);
  else if (k === '.') { if (pt.intOnly || v.indexOf('.') >= 0) return; v = v === '' ? '0.' : v + '.'; }
  else { if (v.length >= 10) return; v = (v === '0' && !pt.intOnly) ? k : v + k; }
  cur.inputs[cur.part] = v;
  var box = document.getElementById('abox' + cur.part);
  if (box) box.innerHTML = (v ? showVal(v) : '<span class="ph">用下面的键盘填写</span>') + '<span class="caret"></span>';
}
function pick(j) { if (!cur || cur.final) return; cur.inputs[cur.part] = String(j); render(); }
function saveProgress() {
  var day = S.days[TODAY];
  day.res[cur.i] = { st: 'doing', part: cur.part, left: cur.left, cats: cur.cats.slice(), ans: cur.inputs.slice(), fb: cur.fb };
  save();
}
function submit(confirmed) {
  var pt = cur.p.parts[cur.part], v = cur.inputs[cur.part], last = cur.part === cur.p.parts.length - 1;
  if (v === '' || v == null) { toast(pt.kind === 'choice' ? '先选一个答案哦' : '先填好答案再提交哦'); return; }
  if (pt.kind === 'num' && last && !pt.intOnly && !confirmed) { cur.confirm = true; render(); return; }
  var r = pt.kind === 'choice' ? (Number(v) === pt.answer ? OK : bad(pt.cat, pt.msg)) : pt.check(v);
  if (r.invalid) { toast(r.msg); return; }
  if (r.ok) {
    if (!last) { cur.part++; cur.fb = null; saveProgress(); render(); return; }
    return finish(cur.cats.length ? 'right2' : 'right1');
  }
  if (cur.cats.indexOf(r.cat) < 0) cur.cats.push(r.cat);
  cur.left--;
  cur.fb = { cat: r.cat, msg: r.msg };
  if (cur.left > 0) { saveProgress(); render(); shake(); return; }
  finish('wrong');
}
function finish(st) {
  var day = S.days[TODAY];
  cur.final = true; cur.st = st;
  cur.cleared = updateWB(cur.spec, st, TODAY);
  day.res[cur.i] = { st: st, cats: cur.cats.slice(), ans: cur.inputs.slice(), part: cur.part, left: cur.left, q: cur.p.plain, a: cur.p.ans, msg: cur.fb ? cur.fb.msg : '' };
  day.done = day.res.every(isFinal);
  save(); render();
  if (st === 'wrong') { clearFx(); shake(); } else celebrate(st === 'right1' ? '一次做对！' : '改对了！');
}
function nextIndex() { var day = S.days[TODAY]; for (var k = 1; k <= 5; k++) { var j = (cur.i + k) % 5; if (!isFinal(day.res[j]) && j !== cur.i) return j; } return -1; }
function next() { var j = nextIndex(); if (j < 0) { go('summary'); if (S.days[TODAY].done) celebrate('今天的 5 题完成！'); } else openProblem(j); }

function answerText(p, r) {
  if (!r || !r.ans) return '';
  return p.parts.map(function (pt, k) { var a = r.ans[k]; if (a === '' || a == null) return ''; return pt.kind === 'choice' ? pt.options[+a] : a; }).filter(Boolean).join(' → ');
}
function renderSummary() {
  var day = ensureDay(TODAY), n1 = 0, nr = 0;
  day.res.forEach(function (r) { if (r && r.st === 'right1') n1++; if (r && (r.st === 'right1' || r.st === 'right2')) nr++; });
  var stars = day.res.map(function (r) { return '<span class="star' + (r && r.st === 'right1' ? ' on' : '') + '">★</span>'; }).join('');
  var msg = !day.done ? '还有题没做完哦。' : n1 === 5 ? '5 题全部一次做对，太厉害了！' : n1 >= 3 ? '不错！把做错的题再看一遍。' : '慢慢来，先看懂解题过程，明天继续。';
  var list = day.specs.map(function (s, i) {
    var r = day.res[i], p = build(s), st = isFinal(r) ? r.st : '';
    return '<details class="ritem ' + st + '"><summary><span class="no">' + (i + 1) + '</span><span class="nm">' + SLOTS[i] + '</span><span class="stt">' + stName(st) + '</span></summary>' +
      '<div class="rbody"><p class="rq">' + esc(p.plain) + '</p>' + (st ? '<p>你的答案：<b>' + esc(answerText(p, r)) + '</b></p><p>正确答案：<b>' + esc(p.ans) + '</b></p>' + solHtml(p) : '<button class="btn small" data-act="goto" data-i="' + i + '">去做这题</button>') + '</div></details>';
  }).join('');
  return '<div class="topbar"><button class="back" data-act="home">‹ 首页</button><span class="ttl">今天的成绩</span></div>' +
    '<section class="card sumcard"><div class="stars">' + stars + '</div><div class="score">一次做对 <b>' + n1 + '</b> / 5</div><p class="smsg">' + msg + '</p>' +
    '<p class="mini">最终做对 ' + nr + ' 题。★ 表示一次做对。</p></section><div class="rlist">' + list + '</div>' +
    '<button class="btn ghost" data-act="stats">学习统计</button>';
}

function pct(a, b) { return b ? Math.round(a / b * 100) : 0; }
function computeStats() {
  var F = allFinals(), dt = parseYmd(TODAY), mon = addDays(TODAY, -((dt.getDay() + 6) % 7));
  var wk = { n: 0, r1: 0, r: 0 }, slot = [0, 1, 2, 3, 4].map(function () { return { n: 0, r1: 0 }; }), cats = {};
  F.forEach(function (f) {
    if (f.date >= mon && f.date <= TODAY) { wk.n++; if (f.r.st === 'right1') wk.r1++; if (f.r.st !== 'wrong') wk.r++; }
    slot[f.spec.slot].n++; if (f.r.st === 'right1') slot[f.spec.slot].r1++;
    (f.r.cats || []).forEach(function (c) { cats[c] = (cats[c] || 0) + 1; });
  });
  var top = Object.keys(cats).sort(function (a, b) { return cats[b] - cats[a]; }).slice(0, 3).map(function (c) { return { c: c, n: cats[c] }; });
  var daysDone = Object.keys(S.days).filter(function (k) { return S.days[k].done; }).length;
  return { F: F, wk: wk, slot: slot, top: top, daysDone: daysDone, streak: streak(TODAY) };
}
function renderStats() {
  var st = computeStats();
  var week = '';
  for (var k = 6; k >= 0; k--) {
    var dd = addDays(TODAY, -k), day = S.days[dd], cls = day && day.done ? 'done' : day && day.res.some(isFinal) ? 'half' : '';
    week += '<div class="wd ' + cls + '"><span>' + WEEK[parseYmd(dd).getDay()] + '</span><i>' + (cls === 'done' ? '✓' : '') + '</i></div>';
  }
  var bars = st.slot.map(function (s, i) {
    var p = pct(s.r1, s.n);
    return '<div class="bar"><div class="bl"><span>' + SLOTS[i] + '</span><b>' + (s.n ? p + '%' : '—') + '</b><small>' + s.r1 + '/' + s.n + '</small></div>' +
      '<div class="bt"><i style="width:' + p + '%" class="' + (p < 60 ? 'low' : p < 85 ? 'mid' : '') + '"></i></div></div>';
  }).join('');
  var top = st.top.length ? st.top.map(function (t, i) { return '<li><span class="rk">' + (i + 1) + '</span><div><b>' + CATS[t.c].name + '</b><small>' + CATS[t.c].tip + '</small></div><em>' + t.n + ' 次</em></li>'; }).join('')
    : '<li class="empty">还没有错误记录。</li>';
  var wb = Object.keys(S.wb).map(function (k) { var e = S.wb[k]; return '<li><span>' + SLOTS[e.slot] + ' · ' + VNAME[e.variant] + '</span><em>已连对 ' + e.streak + '/' + CONFIG.reviewPass + '</em></li>'; }).join('') || '<li class="empty">错题本是空的。</li>';
  return '<div class="topbar"><button class="back" data-act="home">‹ 首页</button><span class="ttl">学习统计</span></div>' +
    '<section class="tiles three"><div class="tile"><b>' + st.streak + '</b><span>连续打卡（天）</span></div><div class="tile"><b>' + (st.wk.n ? pct(st.wk.r1, st.wk.n) + '%' : '—') + '</b><span>本周一次做对率</span></div>' +
    '<div class="tile"><b>' + st.daysDone + '</b><span>累计完成（天）</span></div></section>' +
    '<section class="card"><h2>最近 7 天</h2><div class="week">' + week + '</div><p class="mini">本周做了 ' + st.wk.n + ' 题：一次做对 ' + st.wk.r1 + ' 题，最终做对 ' + st.wk.r + ' 题（正确率 ' + pct(st.wk.r, st.wk.n) + '%）。</p></section>' +
    '<section class="card"><h2>各题型一次做对率</h2>' + bars + '</section>' +
    '<section class="card"><h2>最常见的错误</h2><ol class="top">' + top + '</ol></section>' +
    '<section class="card"><h2>错题本</h2><ul class="wb">' + wb + '</ul></section>' +
    '<button class="btn ghost" data-act="parent">家长查看</button>';
}
function reportText() {
  var st = computeStats(), lines = ['【每日5题 学习报告】' + TODAY, '连续打卡：' + st.streak + ' 天；累计完成：' + st.daysDone + ' 天',
    '本周一次做对率：' + pct(st.wk.r1, st.wk.n) + '%（' + st.wk.r1 + '/' + st.wk.n + '）', '各题型一次做对率：'];
  st.slot.forEach(function (s, i) { lines.push('  ' + SLOTS[i] + '：' + (s.n ? pct(s.r1, s.n) + '%（' + s.r1 + '/' + s.n + '）' : '暂无')); });
  lines.push('最常见错误：' + (st.top.map(function (t, i) { return (i + 1) + '. ' + CATS[t.c].name + '（' + t.n + '次）'; }).join('；') || '暂无'));
  var wb = Object.keys(S.wb).map(function (k) { return VNAME[S.wb[k].variant]; });
  lines.push('错题本：' + (wb.join('、') || '空'));
  return lines.join('\n');
}
function renderParent() {
  var u = units(), names = { decimalMul: '小数乘法', decimalDiv: '小数除法', algebra: '用字母表示数（简易方程）', polygonArea: '多边形的面积' };
  var toggles = Object.keys(names).map(function (k) { return '<label class="tg"><input type="checkbox" id="u-' + k + '" data-unit="' + k + '"' + (u[k] ? ' checked' : '') + '><span>' + names[k] + '</span></label>'; }).join('');
  var miss = computeStats().F.filter(function (f) { return f.r.st !== 'right1'; }).reverse().slice(0, 15).map(function (f) {
    var p = build(f.spec);
    return '<li><div class="mh"><span>' + f.date.slice(5) + ' · ' + SLOTS[f.spec.slot] + '</span><em class="' + f.r.st + '">' + stName(f.r.st) + '</em></div><p>' + esc(p.plain) + '</p>' +
      '<p class="mini">孩子的答案：' + esc(answerText(p, f.r)) + '　正确答案：' + esc(p.ans) + '<br>错误类型：' + (f.r.cats || []).map(function (c) { return CATS[c] ? CATS[c].name : c; }).join('、') + '</p></li>';
  }).join('') || '<li class="empty">还没有错题。</li>';
  return '<div class="topbar"><button class="back" data-act="stats">‹ 统计</button><span class="ttl">家长查看</span></div>' +
    '<section class="card"><h2>学习报告</h2><textarea id="report" readonly rows="9">' + esc(reportText()) + '</textarea><button class="btn small" data-act="copy" data-t="report">复制报告（可发微信）</button></section>' +
    '<section class="card"><h2>单元开关</h2><p class="mini">学到哪个单元就打开，从明天的题目开始生效（只对这台手机生效）。</p>' + toggles + '</section>' +
    '<section class="card"><h2>最近的错题</h2><ul class="miss">' + miss + '</ul></section>' +
    '<section class="card"><h2>导出 / 导入记录</h2><p class="mini">换手机前，复制下面的备份数据发给自己；在新手机打开本页，粘贴到导入框里即可恢复。</p>' +
    '<textarea id="backup" readonly rows="3">' + esc(JSON.stringify(S)) + '</textarea><button class="btn small" data-act="copy" data-t="backup">复制备份数据</button>' +
    '<textarea id="importbox" rows="3" placeholder="把备份数据粘贴到这里"></textarea><button class="btn small" data-act="import">导入备份</button></section>' +
    '<section class="card danger"><h2>清空记录</h2>' + (parentConfirm ? '<p>确定清空所有做题记录和错题本吗？清空后不能恢复。</p><div class="sh-b"><button class="btn ghost" data-act="clear-no">取消</button><button class="btn red" data-act="clear-yes">确定清空</button></div>'
      : '<button class="btn red" data-act="clear">清空所有记录</button>') + '</section>';
}
function copyFrom(id) {
  var el = document.getElementById(id);
  function fallback() { el.removeAttribute('readonly'); el.select(); var ok = false; try { ok = document.execCommand('copy'); } catch (e) {} el.setAttribute('readonly', ''); toast(ok ? '已复制' : '已选中，长按选择“复制”'); }
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(el.value).then(function () { toast('已复制'); }, fallback); else fallback();
}

/* ---------- 9. 动画与提示 ---------- */
function celebrate(text) {
  var fx = document.getElementById('fx'), cols = ['#ffbf2f', '#0f9d86', '#ff7a59', '#3d7be0', '#b06ad9'], s = '';
  for (var i = 0; i < 16; i++) { var ang = i / 16 * 360, dist = 90 + (i % 3) * 30; s += '<i style="--a:' + ang + 'deg;--d:' + dist + 'px;background:' + cols[i % 5] + '"></i>'; }
  fx.innerHTML = '<div class="burst">' + s + '</div><div class="cheer">' + text + '</div>';
  fx.className = ''; void fx.offsetWidth; fx.className = 'show';
  clearTimeout(celebrate.t); celebrate.t = setTimeout(function () { fx.className = ''; fx.innerHTML = ''; }, 1400);
}
function shake() { var el = document.getElementById('prob'); if (!el) return; el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }
function toast(msg) {
  var t = document.getElementById('toast'); t.textContent = msg; t.className = 'show';
  clearTimeout(toast.t); toast.t = setTimeout(function () { t.className = ''; }, 1600);
}

/* ---------- 10. 启动 ---------- */
function boot() {
  $app = document.getElementById('app');
  var m = /[?&]date=(\d{4}-\d{2}-\d{2})/.exec(location.search);   // 测试用：?date=2026-11-01
  TODAY = m ? m[1] : ymd(new Date());
  S = load() || { days: {}, wb: {}, cfg: null };
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-act]'); if (!t || t.disabled) return;
    var a = t.getAttribute('data-act');
    switch (a) {
      case 'home': go('home'); break;
      case 'start': start(); break;
      case 'stats': go('stats'); break;
      case 'parent': go('parent'); break;
      case 'goto': openProblem(+t.getAttribute('data-i')); break;
      case 'key': press(t.getAttribute('data-k')); break;
      case 'pick': pick(+t.getAttribute('data-v')); break;
      case 'submit': submit(false); break;
      case 'confirm-yes': cur.confirm = false; submit(true); break;
      case 'confirm-no': cur.confirm = false; render(); break;
      case 'next': next(); break;
      case 'copy': copyFrom(t.getAttribute('data-t')); break;
      case 'import':
        try { var o = JSON.parse(document.getElementById('importbox').value); if (!o || !o.days) throw 0; o.wb = o.wb || {}; S = o; save(); toast('导入成功'); go('home'); }
        catch (err) { toast('数据格式不对，请粘贴完整的备份数据'); }
        break;
      case 'clear': parentConfirm = true; render(); break;
      case 'clear-no': parentConfirm = false; render(); break;
      case 'clear-yes': S = { days: {}, wb: {}, cfg: S.cfg }; save(); toast('记录已清空'); go('home'); break;
    }
  });
  document.addEventListener('change', function (e) {
    var k = e.target.getAttribute && e.target.getAttribute('data-unit'); if (!k) return;
    S.cfg = S.cfg || {}; S.cfg[k] = e.target.checked; save(); toast('已保存，明天的题目开始生效');
  });
  document.addEventListener('keydown', function (e) {
    if (view !== 'practice' || !cur) return;
    if (/^[0-9.]$/.test(e.key)) press(e.key); else if (e.key === 'Backspace') press('del');
    else if (e.key === 'Enter') { if (cur.final) next(); else if (cur.confirm) { cur.confirm = false; submit(true); } else submit(false); }
  });
  var mo = /[?&]open=(\d)/.exec(location.search);                   // 测试用：?open=0 直接打开第1题
  if (mo) openProblem(+mo[1]); else render();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CONFIG: CONFIG, GEN: GEN, build: build, variantsFor: variantsFor, parseNum: parseNum, fmt: fmt, fmtF: fmtF, checkNum: checkNum, dn: dn, CATS: CATS, VNAME: VNAME };
} else boot();
