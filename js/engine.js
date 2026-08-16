// 一年7遍圣经挑战 - 进度引擎
// 核心算法：一年365天读完7遍 → 每天需要读 总1189章×7/365 ≈ 22.8章/天 → 23章/天
// 每天23章 → 1189/23 ≈ 52天一遍 → 一年365/52 ≈ 7.02 遍

// 挑战参数
const CHALLENGE = {
  daysPerYear: 365,
  timesPerYear: 7,
  totalChaptersPerPass: BIBLE_BOOKS.totalChapters, // 1189
  // 每天应读的章数（按一年7遍推算）
  get chaptersPerDay() {
    return Math.ceil((this.totalChaptersPerPass * this.timesPerYear) / this.daysPerYear); // 23
  },
  // 读完整本需要的天数（1189章 ÷ 23章/天 = 52天）
  get dayPerPass() {
    return Math.ceil(this.totalChaptersPerPass / this.chaptersPerDay);
  }
};

// 存储键（v2：升级打卡记录为对象，含已读章节）
const STORE_KEY = "bible-challenge-v2";

// 本地状态管理
const Store = {
  // state: { startDate, checkins: {"YYYY-MM-DD": {chapters, range, pass}}, voice, completedPasses, perDayOverride }
  load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      return raw ? Store.migrate(JSON.parse(raw)) : null;
    } catch (e) { return null; }
  },
  save(state) {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  },
  // 默认状态：今天开始
  init() {
    return {
      startDate: todayStr(),
      checkins: {},       // 打卡记录（含已读章节）
      voice: null,        // 语音偏好
      completedPasses: 0, // 已完成遍数（保留兼容）
      perDayOverride: null // 用户自定义每日目标章数
    };
  },
  // 兼容旧版本数据（v1 布尔打卡 → 升级为对象，记录章节）
  migrate(old) {
    if (!old) return null;
    // 已是 v2 格式，直接返回
    if (old.checkins && Object.keys(old.checkins).length &&
        typeof Object.values(old.checkins)[0] === "object") {
      return {
        startDate: old.startDate || todayStr(),
        checkins: old.checkins,
        voice: old.voice || null,
        completedPasses: old.completedPasses || 0,
        perDayOverride: old.perDayOverride || null
      };
    }
    const st = this.init();
    st.startDate = old.startDate || todayStr();
    st.voice = old.voice || null;
    st.completedPasses = old.completedPasses || 0;
    // 旧打卡只有 true → 重新计算该日章节
    for (const d in (old.checkins || {})) {
      const v = old.checkins[d];
      if (v === true) {
        const idx = daysBetween(st.startDate, d);
        const r = dayReadingRangePP(idx, st.perDayOverride);
        st.checkins[d] = { chapters: r.chapters, range: fmtRange(r.cStart, r.cEnd), pass: r.passNumber };
      } else {
        st.checkins[d] = v;
      }
    }
    return st;
  }
};

// 工具：今天日期 YYYY-MM-DD
function todayStr() {
  const d = new Date();
  const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,"0"), dd = String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${dd}`;
}

// 两个日期相差天数
function daysBetween(startStr, endStr) {
  const a = new Date(startStr + "T00:00:00");
  const b = new Date(endStr + "T00:00:00");
  return Math.max(0, Math.round((b - a) / 86400000));
}

// 从 startStr 起第 dayIndex 天的日期字符串
function dateAt(startStr, dayIndex) {
  const d = new Date(startStr + "T00:00:00");
  d.setDate(d.getDate() + dayIndex);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

// 格式化章节范围文本（"创世记1-23" / "马太福音1~启示录3" / 单章"创世记1"）
function fmtRange(cStart, cEnd) {
  if (!cStart || !cEnd) return "";
  if (cStart.globalIdx0 === cEnd.globalIdx0) return `${cStart.book.name}${cStart.chapter}`;
  if (cStart.book.id === cEnd.book.id) return `${cStart.book.name}${cStart.chapter}-${cEnd.chapter}`;
  return `${cStart.book.name}${cStart.chapter}~${cEnd.book.name}${cEnd.chapter}`;
}

// 目标：从某天开始的第 dayIndex 天（0起）要读到哪个位置（保留兼容）
function goalForDay(dayIndex, state) {
  return dayReadingRangePP(dayIndex, state.perDayOverride);
}

// 计算某天该读的章节范围（基于每日目标章数 perDayOverride）
function dayReadingRangePP(dayIndex, perDayOverride) {
  const perDay = perDayOverride || CHALLENGE.chaptersPerDay;
  const dpp = Math.ceil(BIBLE_BOOKS.totalChapters / perDay); // 每遍天数
  const passDay = dayIndex % dpp;
  const start = passDay * perDay;
  const end = Math.min(start + perDay, CHALLENGE.totalChaptersPerPass) - 1;
  const cStart = chapterFromGlobal(start);
  const cEnd = chapterFromGlobal(end);
  if (cStart) cStart.globalIdx0 = start;
  if (cEnd) cEnd.globalIdx0 = end;
  return {
    start, end, cStart, cEnd,
    chapters: Math.max(0, Math.min(perDay, CHALLENGE.totalChaptersPerPass - start)),
    passNumber: Math.floor(dayIndex / dpp) + 1
  };
}

// 兼容旧函数签名（接受 state）
function dayReadingRange(dayIndex, state) {
  return dayReadingRangePP(dayIndex, state && state.perDayOverride);
}

// 生成整年读经计划表
// 返回数组 [{dayIndex, date, text, pass, chapters, range}]
function generatePlan(startStr, perDayOverride) {
  const perDay = perDayOverride || CHALLENGE.chaptersPerDay;
  const dpp = Math.ceil(BIBLE_BOOKS.totalChapters / perDay);
  const plan = [];
  for (let dayIndex = 0; dayIndex < CHALLENGE.daysPerYear; dayIndex++) {
    const r = dayReadingRangePP(dayIndex, perDayOverride);
    plan.push({
      dayIndex,
      date: dateAt(startStr, dayIndex),
      text: fmtRange(r.cStart, r.cEnd),
      pass: r.passNumber,
      chapters: r.chapters,
      range: r
    });
  }
  return plan;
}

// 按月度分组计划（用于计划表展示），返回 [{month, days:[planEntry]}]
function groupPlanByMonth(plan) {
  const groups = {};
  for (const p of plan) {
    const m = p.date.slice(0, 7); // YYYY-MM
    if (!groups[m]) groups[m] = [];
    groups[m].push(p);
  }
  return Object.keys(groups).sort().map(k => ({ month: k, days: groups[k] }));
}

if (typeof module !== "undefined") module.exports = {
  CHALLENGE, Store, todayStr, dateAt, daysBetween, fmtRange,
  goalForDay, dayReadingRange, dayReadingRangePP, generatePlan, groupPlanByMonth
};
