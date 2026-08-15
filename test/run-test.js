// 独立逻辑测试（模拟浏览器全局作用域：将 const 导出到 sandbox）
const fs = require("fs");
const vm = require("vm");
const sandbox = {};
vm.createContext(sandbox);
const code = fs.readFileSync("./data/bible-books.js","utf8")
  + "\n" + fs.readFileSync("./js/engine.js","utf8")
  // 把浏览器全局的 const 暴露到 sandbox 供测试读取
  + "\n;globalThis.__t = { BIBLE_BOOKS, CHALLENGE, dayReadingRange, todayStr, Store, goalForDay };";
vm.runInContext(code, sandbox);
const T = sandbox.__t;

console.log("总章数:", T.BIBLE_BOOKS.totalChapters, "(应1189)");
console.log("每日目标:", T.CHALLENGE.chaptersPerDay, "章/天");
console.log("每遍天数:", T.CHALLENGE.dayPerPass, "(应52)");
console.log("一年遍数:", (365/T.CHALLENGE.dayPerPass).toFixed(2), "(应≥7)");

const st = { completedPasses: 0 };
for (const d of [0, 1, 25, 51, 52, 104, 363, 364]) {
  const r = T.dayReadingRange(d, st);
  const s = r.cStart && r.cEnd ? `${r.cStart.book.name}${r.cStart.chapter}~${r.cEnd.book.name}${r.cEnd.chapter}` : "边界";
  console.log(`天${String(d+1).padStart(3)} 遍${r.passNumber}: ${s}`);
}
const last = T.dayReadingRange(51, st);
console.log("第52天(遍末)应到:", last.cEnd.book.name, last.cEnd.chapter, "(应启示录22章)");
console.log("todayStr:", T.todayStr());
