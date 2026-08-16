// 独立逻辑测试（模拟浏览器全局作用域：将 const 导出到 sandbox）
const fs = require("fs");
const vm = require("vm");
const sandbox = {};
vm.createContext(sandbox);
const code = fs.readFileSync("./data/bible-books.js","utf8")
  + "\n" + fs.readFileSync("./js/engine.js","utf8")
  + "\n;globalThis.__t = { BIBLE_BOOKS, CHALLENGE, dayReadingRange, dayReadingRangePP, todayStr, Store, goalForDay, generatePlan, daysBetween, fmtRange, dateAt };";
vm.runInContext(code, sandbox);
const T = sandbox.__t;

console.log("总章数:", T.BIBLE_BOOKS.totalChapters, "(应1189)");
console.log("每日目标:", T.CHALLENGE.chaptersPerDay, "章/天");
console.log("每遍天数:", T.CHALLENGE.dayPerPass, "(应52)");
console.log("一年遍数:", (365/T.CHALLENGE.dayPerPass).toFixed(2), "(应≥7)");

// dayReadingRange 兼容测试
const st = { completedPasses: 0 };
for (const d of [0, 1, 25, 51, 52, 104, 363, 364]) {
  const r = T.dayReadingRange(d, st);
  const s = r.cStart && r.cEnd ? `${r.cStart.book.name}${r.cStart.chapter}~${r.cEnd.book.name}${r.cEnd.chapter}` : "边界";
  console.log(`天${String(d+1).padStart(3)} 遍${r.passNumber}: ${s}`);
}
const last = T.dayReadingRange(51, st);
console.log("第52天(遍末)应到:", last.cEnd.book.name, last.cEnd.chapter, "(应启示录22章)");

// generatePlan 测试
console.log("\n=== generatePlan 测试 ===");
const plan = T.generatePlan("2026-08-16", null);
console.log("计划长度:", plan.length, "(应365)");
console.log("第1天:", plan[0].date, plan[0].text, "遍", plan[0].pass, "章数", plan[0].chapters);
console.log("第51天:", plan[50].date, plan[50].text, "遍", plan[50].pass);
console.log("第52天:", plan[51].date, plan[51].text, "遍", plan[51].pass);
console.log("第53天:", plan[52].date, plan[52].text, "遍", plan[52].pass);
console.log("第365天:", plan[364].date, plan[364].text, "遍", plan[364].pass);

// fmtRange 单章测试
console.log("\n=== fmtRange ===");
console.log("单章创世记1:", T.fmtRange({book:{name:"创世记"},chapter:1,globalIdx0:0},{book:{name:"创世记"},chapter:1,globalIdx0:0}));
console.log("同卷多章:", T.fmtRange({book:{name:"创世记"},chapter:1,globalIdx0:0},{book:{name:"创世记"},chapter:23,globalIdx0:22}));
console.log("跨卷:", T.fmtRange({book:{name:"创世记"},chapter:1,globalIdx0:0},{book:{name:"创世记"},chapter:50,globalIdx0:49}));

// daysBetween / dateAt 测试
console.log("\n=== 日期 ===");
console.log("2026-08-16到2026-09-16:", T.daysBetween("2026-08-16","2026-09-16"), "(应31)");
console.log("start后第10天:", T.dateAt("2026-08-16",10), "(应2026-08-26)");
