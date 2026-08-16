// 浏览器环境模拟集成测试：加载所有脚本，检查运行时错误
const fs = require("fs");
const vm = require("vm");

// 最小 DOM/localStorage 模拟
function makeSandbox() {
  const listeners = {};
  const els = {};
  function makeEl(id) {
    return {
      id, value: "", textContent: "", innerHTML: "",
      style: {}, dataset: {},
      classList: { add(){}, remove(){}, toggle(){} },
      addEventListener(){}, appendChild(){}
    };
  }
  const sb = {
    console,
    localStorage: {
      _d: {},
      getItem(k){ return this._d[k] || null; },
      setItem(k,v){ this._d[k]=String(v); },
      removeItem(k){ delete this._d[k]; }
    },
    document: {
      getElementById(id){ if(!els[id]) els[id]=makeEl(id); return els[id]; },
      querySelectorAll(sel){ 
        // 仅 data-plan-view 按钮
        if (sel.includes("data-plan-view")) {
          const btns = [];
          ["date","book"].forEach(v => {
            const b = makeEl("planview-"+v);
            b.dataset.planView = v;
            b.addEventListener("click", function(){});
            btns.push(b);
          });
          return btns;
        }
        return [];
      },
      createElement(){ return { style:{}, addEventListener(){} }; }
    },
    window: { speechSynthesis: null },
    speechSynthesis: null,
    SpeechSynthesisUtterance: function(){},
    Audio: function(){ return { play(){}, pause(){}, addEventListener(){} }; },
    URL: { createObjectURL(){ return "blob:x"; }, revokeObjectURL(){} },
    confirm: () => true,
    fetch: () => Promise.reject(new Error("no network in test"))
  };
  sb.globalThis = sb;
  sb.window = { speechSynthesis: { speak(){}, cancel(){}, getVoices(){ return []; }, onvoiceschanged:null } };
  sb.speechSynthesis = sb.window.speechSynthesis;
  return sb;
}

const sb = makeSandbox();
vm.createContext(sb);
const code =
  fs.readFileSync("./data/bible-books.js","utf8") +
  "\n" + fs.readFileSync("./js/engine.js","utf8") +
  "\n" + fs.readFileSync("./js/tts.js","utf8") +
  "\n" + fs.readFileSync("./js/app.js","utf8");

try {
  vm.runInContext(code, sb, { timeout: 3000 });
  console.log("✅ 全部脚本加载并运行无错误");
  // 检查渲染结果
  const els = sb.document;
  console.log("dayNum:", els.getElementById("dayNum").textContent, "(=1)");
  console.log("todayTask:", els.getElementById("todayTask").textContent, "(=23)");
  console.log("pctText:", els.getElementById("pctText").textContent);
  console.log("historyList 有内容:", els.getElementById("historyList").innerHTML.length > 10);
  console.log("readingInfo:", els.getElementById("readingInfo").innerHTML);
  console.log("totalReadCh:", els.getElementById("totalReadCh").textContent);
} catch (e) {
  console.error("❌ 运行时错误:", e.message);
  process.exit(1);
}
