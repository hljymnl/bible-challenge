// 主应用逻辑
(function () {
  "use strict";

  // ---- 状态 ----
  let state = Store.load() || Store.init();
  if (!state.checkins) state.checkins = {};
  if (!state.completedPasses) state.completedPasses = 0;

  // ---- DOM 引用 ----
  const $ = (id) => document.getElementById(id);
  const els = {
    pctText: $("pctText"), ringFg: $("ringFg"),
    dayNum: $("dayNum"), todayTask: $("todayTask"), totalReadCh: $("totalReadCh"),
    passNum: $("passNum"), streak: $("streak"),
    readingInfo: $("readingInfo"), btnSpeak: $("btnSpeak"), btnStop: $("btnStop"),
    btnCheckin: $("btnCheckin"), checkinNote: $("checkinNote"),
    voiceSelect: $("voiceSelect"), tipsArea: $("tipsArea"),
    startDate: $("startDate"), targetCh: $("targetCh"), btnReset: $("btnReset"),
    azureNote: $("azureNote")
  };

  // ---- 工具 ----
  function daysSince(startStr) {
    const start = new Date(startStr + "T00:00:00");
    const now = new Date();
    return Math.max(0, Math.floor((now - start) / 86400000));
  }

  // ---- 渲染 ----
  function render() {
    const dayIndex = daysSince(state.startDate); // 已过天数
    const todayNo = dayIndex + 1;

    // 每日目标章数
    const chaptersPerDay = parseInt(els.targetCh.value || CHALLENGE.chaptersPerDay, 10);

    // 累计已读 = 已打卡天数 * 每日目标
    const doneDays = Object.keys(state.checkins).length;
    const totalRead = doneDays * chaptersPerDay;
    const totalGoal = chaptersPerDay * CHALLENGE.daysPerYear;

    // 进度百分比
    const pct = Math.min(100, Math.round((totalRead / totalGoal) * 100));
    els.pctText.textContent = pct + "%";
    els.dayNum.textContent = todayNo;
    els.todayTask.textContent = chaptersPerDay;
    els.totalReadCh.textContent = totalRead;
    els.passNum.textContent = Math.min(7, state.completedPasses + Math.floor(dayIndex / CHALLENGE.daysPerYear) + 1);

    // 进度环
    const CIRC = 2 * Math.PI * 60;
    els.ringFg.style.strokeDasharray = CIRC;
    els.ringFg.style.strokeDashoffset = CIRC * (1 - pct / 100);

    // 今日必读范围
    const range = dayReadingRange(dayIndex, state);
    let readingTxt;
    if (range.cStart && range.cEnd) {
      readingTxt = `第 <b>${todayNo}</b> 天 · 第 <b>${range.passNumber}</b> 遍<br>` +
                   `今日读 <b>${range.cStart.book.name} ${range.cStart.chapter} 章</b>` +
                   (range.cEnd.globalIdx0 !== range.cStart.globalIdx0
                     ? ` ～ <b>${range.cEnd.book.name} ${range.cEnd.chapter} 章</b>`
                     : "") +
                   `（共约 ${chaptersPerDay} 章）`;
    } else {
      readingTxt = "🎉 本遍已完成，进入下一遍！";
    }
    els.readingInfo.innerHTML = readingTxt;

    // 打卡状态
    const todayKey = todayStr();
    const isChecked = !!state.checkins[todayKey];
    els.btnCheckin.classList.toggle("done", isChecked);
    els.btnCheckin.textContent = isChecked ? "✅ 今日已打卡" : "✅ 今日已读完，打卡！";
    els.checkinNote.textContent = isChecked ? "今天已完成，明天继续加油！" : "";

    // 连续打卡
    els.streak.textContent = calcStreak();

    renderTips(chaptersPerDay);
  }

  function calcStreak() {
    let streak = 0;
    const d = new Date();
    for (let i = 0; i < 3650; i++) {
      const key = fmtDate(d);
      if (state.checkins[key]) streak++;
      else if (i === 0) { /* 今天未打卡不计断，从昨天算 */
      } else break;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  }

  function fmtDate(d) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  }

  // ---- 高效方法 ----
  function renderTips(perDay) {
    const tips = [
      { b: "固定时段", t: `每天 ${Math.ceil(perDay*3)} 分钟，选一个固定的“读经时间”（如早起后/睡前），形成习惯比读多久更重要。` },
      { b: "碎片化拆分", t: "把每日目标拆成 2–3 段（早/午/晚），每段几分钟，更好坚持。" },
      { b: "番茄钟法", t: "用 25 分钟专注读经 + 5 分钟休息，效率比一口气读高很多。" },
      { b: "先读重点段", t: "时间不够时，优先读当天的《诗篇》《箴言》或新约，养成“每天必见主”的底线。" },
      { b: "朗读加深记忆", t: "点“朗读”听经文，耳朵+眼睛双通道，记得更牢。" },
      { b: "朋友圈打卡", t: "每天打卡截图分享，用外部监督推自己坚持。" },
      { b: "补卡机制", t: "偶尔落下别放弃——当天补上，或利用周末追平，别因为一天中断就放弃整遍。" },
      { b: "祷告开始", t: "读经前先一句话祷告：主啊，求你让今天的话进入我心里。" }
    ];
    els.tipsArea.innerHTML = tips.map(t =>
      `<div class="tip"><b>${t.b}：</b>${t.t}</div>`).join("");
  }

  // ---- 事件 ----
  els.btnSpeak.addEventListener("click", () => {
    const range = dayReadingRange(daysSince(state.startDate), state);
    const speakerText = range.cStart && range.cEnd
      ? `今天是读经第 ${range.passNumber} 遍。今日经文：${range.cStart.book.name}第 ${range.cStart.chapter} 章`
      : "今天的读经任务已完成，愿主的话成为你的力量。";
    TTS.selectedVoice = els.voiceSelect.value;
    TTS.speak(speakerText);
  });

  els.btnStop.addEventListener("click", () => TTS.stop());

  els.btnCheckin.addEventListener("click", () => {
    const todayKey = todayStr();
    if (state.checkins[todayKey]) {
      delete state.checkins[todayKey];
    } else {
      state.checkins[todayKey] = true;
    }
    Store.save(state);
    render();
  });

  els.voiceSelect.addEventListener("change", () => {
    TTS.selectedVoice = els.voiceSelect.value;
    // 自动提示 Azure 接入
    if (els.voiceSelect.value !== "auto" && !TTS.hasAzure()) {
      els.azureNote.textContent = "提示：当前使用浏览器默认语音。启用“晓晓/云希”神经语音需配置 Azure Speech Key（见 README）。";
    } else {
      els.azureNote.textContent = "✓ 已启用 Edge 神经语音（晓晓/云希）";
    }
  });

  els.todayNo = null;
  els.btnReset.addEventListener("click", () => {
    if (confirm("确定要重置所有进度吗？")) {
      state = Store.init();
      Store.save(state);
      render();
    }
  });

  els.startDate.value = state.startDate;
  els.startDate.addEventListener("change", () => {
    state.startDate = els.startDate.value || todayStr();
    Store.save(state);
    render();
  });
  els.targetCh.value = CHALLENGE.chaptersPerDay;
  els.targetCh.addEventListener("change", render);

  // 初始化语音可选项说明
  if (!TTS.hasAzure()) {
    els.azureNote.textContent = "语音说明：当前为浏览器内置语音。配置 Azure Speech Key 后可启用 Edge 晓晓/云希神经语音（见 README）。";
  }

  // 首次渲染
  render();

  // 语音列表异步加载（部分浏览器）
  if ("speechSynthesis" in window) {
    window.speechSynthesis.onvoiceschanged = () => {};
    speechSynthesis.getVoices();
  }
})();
