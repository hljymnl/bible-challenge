// 一年7遍圣经挑战 - 进度引擎
// 核心算法：一年365天读完7遍 → 每遍约52.1天 → 每天需要读 总1189章×7/365 ≈ 22.8章/天

// 挑战参数
const CHALLENGE = {
  daysPerYear: 365,
  timesPerYear: 7,
  totalChaptersPerPass: BIBLE_BOOKS.totalChapters, // 1189
  // 每天应读的章数（按一年7遍推算）
  get chaptersPerDay() {
    return Math.ceil((this.totalChaptersPerPass * this.timesPerYear) / this.daysPerYear);
  },
  // 每天应读的章数（单独一遍内）
  get chaptersPerDayPerPass() {
    return Math.ceil(this.totalChaptersPerPass / Math.ceil(this.daysPerYear / this.timesPerYear));
  },
  // 读完整本需要的天数（1189章 ÷ 23章/天 = 52天）
  get dayPerPass() {
    return Math.ceil(this.totalChaptersPerPass / this.chaptersPerDayPerPass);
  }
};

// 存储键
const STORE_KEY = "bible-challenge-v1";

// 本地状态管理
const Store = {
  // state: { startDate, checkins: { "YYYY-MM-DD": true }, voice, completedPasses }
  load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  },
  save(state) {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  },
  // 默认状态：今天开始
  init() {
    return {
      startDate: todayStr(),
      checkins: {},       // 打卡记录
      voice: null,        // 语音偏好
      completedPasses: 0  // 已完成遍数
    };
  }
};

// 工具：今天日期 YYYY-MM-DD
function todayStr() {
  const d = new Date();
  const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,"0"), dd = String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${dd}`;
}

// 目标：从某天开始的第 dayIndex 天（0起）要读到哪个位置
// 返回: { globalIdx0, passNumber, dayOfPass }
function goalForDay(dayIndex, state) {
  const pass = state.completedPasses;
  const daysInto = dayIndex; // 连续第几天
  // 每遍固定 dayPerPass 天
  const dayPerPass = CHALLENGE.dayPerPass;
  const passDay = daysInto % dayPerPass;
  const passNum = pass + Math.floor(daysInto / dayPerPass) + 1;
  // 当前遍从第0章开始，每天读 chaptersPerDayPerPass 章
  const g = passDay * CHALLENGE.chaptersPerDayPerPass;
  return { globalIdx0: g, passNumber: passNum, dayOfPass: passDay + 1 };
}

// 计算某天该读的章节范围（连续）
function dayReadingRange(dayIndex, state) {
  const dayPerPass = CHALLENGE.dayPerPass;
  const passDay = dayIndex % dayPerPass;
  const start = passDay * CHALLENGE.chaptersPerDayPerPass;
  const end = Math.min(start + CHALLENGE.chaptersPerDayPerPass, CHALLENGE.totalChaptersPerPass) - 1;
  const cStart = chapterFromGlobal(start);
  const cEnd = chapterFromGlobal(end);
  return { start, end, cStart, cEnd, passNumber: Math.floor(dayIndex / dayPerPass) + 1 + state.completedPasses };
}

if (typeof module !== "undefined") module.exports = { CHALLENGE, Store, todayStr, goalForDay, dayReadingRange };
