// 主应用逻辑
(function () {
  "use strict";

  // ---- 状态（load 时自动 migrate 旧数据）----
  let state = Store.load() || Store.init();
  if (!state.checkins) state.checkins = {};
  if (!state.perDayOverride) state.perDayOverride = null;

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
    azureNote: $("azureNote"),
    historyList: $("historyList"), doneCount: $("doneCount"), doneChaptersTotal: $("doneChaptersTotal")
  };

  // ---- 视图状态 ----
  let planView = "date"; // "date" | "book"
  let cachedPlan = null;

  // ---- 工具 ----
  function daysSince(startStr) {
    return daysBetween(startStr, todayStr());
  }
  function currentPerDay() {
    // 优先级：设置输入框 > state.perDayOverride > 默认
    const v = parseInt(els.targetCh.value, 10);
    if (v && v > 0) return v;
    return state.perDayOverride || CHALLENGE.chaptersPerDay;
  }
  function saveState() {
    Store.save(state);
  }
  function weekdayCN(dateStr) {
    const d = new Date(dateStr + "T00:00:00");
    return "日一二三四五六"[d.getDay()];
  }

  // ---- 渲染主界面 ----
  function render() {
    const dayIndex = daysSince(state.startDate);
    const todayNo = dayIndex + 1;
    const chaptersPerDay = currentPerDay();
    const passNumber = Math.floor(dayIndex / CHALLENGE.dayPerPass) + 1;

    // 今日必读范围
    const range = dayReadingRange(dayIndex, state);
    if (range.cStart && range.cEnd) {
      els.readingInfo.innerHTML =
        `第 <b>${todayNo}</b> 天 · 第 <b>${passNumber}</b> 遍<br>` +
        `今日读 <b>${range.cStart.book.name} ${range.cStart.chapter} 章</b>` +
        (range.cStart.globalIdx0 !== range.cEnd.globalIdx0
          ? ` ～ <b>${range.cEnd.book.name} ${range.cEnd.chapter} 章</b>` : "") +
        `（共约 ${range.chapters} 章）`;
    } else {
      els.readingInfo.innerHTML = "🎉 已完成一年目标！";
    }
    els.dayNum.textContent = todayNo;
    els.todayTask.textContent = chaptersPerDay;
    els.passNum.textContent = Math.min(7, passNumber);

    // 累计已读（按打卡记录，不乘目标）
    let totalRead = 0;
    for (const d in state.checkins) {
      const c = state.checkins[d];
      totalRead += (typeof c === "object" && c.chapters) ? c.chapters : chaptersPerDay;
    }
    els.totalReadCh.textContent = totalRead;
    const totalGoal = chaptersPerDay * CHALLENGE.daysPerYear;
    const pct = Math.min(100, Math.round((totalRead / totalGoal) * 100));
    els.pctText.textContent = pct + "%";

    // 进度环
    const CIRC = 2 * Math.PI * 60;
    els.ringFg.style.strokeDasharray = CIRC;
    els.ringFg.style.strokeDashoffset = CIRC * (1 - pct / 100);

    // 打卡状态
    const todayKey = todayStr();
    const isChecked = !!state.checkins[todayKey];
    els.btnCheckin.classList.toggle("done", isChecked);
    els.btnCheckin.textContent = isChecked ? "✅ 今日已打卡" : "✅ 今日已读完，打卡！";
    els.checkinNote.textContent = isChecked
      ? `已完成：${state.checkins[todayKey].range || ""}`
      : `今日目标：${range.text}`;

    // 连续打卡
    els.streak.textContent = calcStreak();

    renderTips(chaptersPerDay);
    renderHistory();
  }

  function calcStreak() {
    let streak = 0;
    const d = new Date();
    for (let i = 0; i < 3650; i++) {
      const key = fmtDate(d);
      if (state.checkins[key]) streak++;
      else if (i === 0) { /* 今天未打卡，从昨天开始算 */ }
      else break;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  }
  function fmtDate(d) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  }

  // ---- 高效方法 ----
  function renderTips(perDay) {
    const minutes = Math.ceil(perDay * 3);
    const tips = [
      { b: "固定时段", t: `每天约 ${minutes} 分钟，选一个固定的“读经时间”（如早起后/睡前），形成习惯比读多久更重要。` },
      { b: "碎片化拆分", t: "把每日 ${perDay} 章目标拆成 2–3 段（早/午/晚），每段几分钟，更好坚持。" },
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

  // ---- 计划表 / 已读记录 ----
  function renderHistory() {
    if (!cachedPlan) cachedPlan = generatePlan(state.startDate, currentPerDay());
    const plan = cachedPlan;
    const todayKey = todayStr();
    const doneCount = Object.keys(state.checkins).length;

    // 统计累计章数
    let doneCh = 0;
    for (const d in state.checkins) {
      const c = state.checkins[d];
      doneCh += (typeof c === "object" && c.chapters) ? c.chapters : currentPerDay();
    }
    els.doneCount.textContent = doneCount;
    els.doneChaptersTotal.textContent = doneCh;

    if (planView === "book") {
      renderHistoryByBook(plan, todayKey);
    } else {
      renderHistoryByDate(plan, todayKey);
    }
  }

  // 按日期分组（每月一组）
  function renderHistoryByDate(plan, todayKey) {
    const h = els.historyList;
    // 分组按月份
    const months = groupPlanByMonth(plan);
    let html = "";
    // 只显示到今天为止的计划，但保留整个月便于回看
    for (const g of months) {
      const passed = g.days.filter(d => d.date <= todayKey);
      if (passed.length === 0) continue;
      html += `<div class="hist-month">${g.month}</div>`;
      for (const p of passed) {
        const rec = state.checkins[p.date];
        const done = !!rec;
        const isToday = p.date === todayKey;
        html += `<div class="hist-row ${isToday ? "hist-today" : ""}">` +
          `<span class="hist-date">${p.date.slice(5)}</span>` +
          `<span class="hist-day">第${p.dayIndex + 1}天</span>` +
          `<span class="hist-ref ${done ? "done" : "todo"}">${p.text}</span>` +
          `<span class="hist-pass">${p.pass}遍</span>` +
          `<span class="hist-check ${done ? "done" : "todo"}">${done ? "✓" : "·"}</span>` +
          `</div>`;
      }
    }
    h.innerHTML = html || "<div style='padding:14px;color:var(--muted)'>暂无计划，请先设置开始日期</div>";
  }

  // 按卷分类显示：只显示已完成打卡、且从未读完整卷的概览
  function renderHistoryByBook(plan, todayKey) {
    // 统计每卷已读章数
    const bookRead = {};
    for (const d in state.checkins) {
      const rec = state.checkins[d];
      if (typeof rec === "object" && rec.range) {
        // 从 range 文本粗略定位：这里用 plan 找当天范围
      }
    }
    // 更精确：对每个打卡日，用 plan 里当天的范围累加
    for (const p of plan) {
      if (p.date > todayKey) break;
      const rec = state.checkins[p.date];
      if (!rec) continue;
      const b = p.range.cStart.book;
      const book = b.name;
      if (!bookRead[book]) bookRead[book] = { read: 0, total: 0, book: b };
      bookRead[book].total = b.chapters;
      // 该天覆盖此卷多少章
      if (p.range.cStart.book.id === p.range.cEnd.book.id) {
        bookRead[book].read += p.range.cEnd.chapter - p.range.cStart.chapter + 1;
      } else {
        // 跨卷：累加当前卷剩余
        bookRead[book].read += b.chapters - p.range.cStart.chapter + 1;
      }
    }
    let rows = "";
    const passedChapters = Object.values(bookRead).sort((a, b) => a.book.index - b.book.index);
    for (const br of passedChapters) {
      const pct = Math.min(100, Math.round((br.read / br.total) * 100));
      rows += `<div class="hist-row">` +
        `<span class="hist-day" style="min-width:110px">${br.book.name}</span>` +
        `<span class="hist-ref">已读 ${br.read}/${br.total} 章</span>` +
        `<span class="hist-pass" style="min-width:0">${pct}%</span>` +
        `</div>`;
    }
    els.historyList.innerHTML = rows || "<div style='padding:14px;color:var(--muted)'>还没有打卡记录</div>";
  }

  // ---- 事件 ----
  els.btnSpeak.addEventListener("click", () => {
    const range = dayReadingRange(daysSince(state.startDate), state);
    const speakerText = range.cStart && range.cEnd
      ? `今天是读经第 ${range.passNumber} 遍。今日经文：${fmtRange(range.cStart, range.cEnd)}`
      : "今天的读经任务已完成，愿主的话成为你的力量。";
    TTS.selectedVoice = els.voiceSelect.value;
    TTS.speak(speakerText);
  });

  els.btnStop.addEventListener("click", () => TTS.stop());

  // 打卡：记录实际已读章节
  els.btnCheckin.addEventListener("click", () => {
    const todayKey = todayStr();
    if (state.checkins[todayKey]) {
      delete state.checkins[todayKey];
    } else {
      const range = dayReadingRange(daysSince(state.startDate), state);
      state.checkins[todayKey] = {
        chapters: range.chapters,
        range: fmtRange(range.cStart, range.cEnd),
        pass: range.passNumber
      };
    }
    cachedPlan = null; // 强制重算
    saveState();
    render();
  });

  // 计划表视图切换
  document.querySelectorAll("[data-plan-view]").forEach(btn => {
    btn.addEventListener("click", () => {
      planView = btn.dataset.planView;
      document.querySelectorAll("[data-plan-view]").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderHistory();
    });
  });

  els.voiceSelect.addEventListener("change", () => {
    TTS.selectedVoice = els.voiceSelect.value;
    if (els.voiceSelect.value !== "auto" && !TTS.hasAzure()) {
      els.azureNote.textContent = "提示：当前使用浏览器默认语音。启用“晓晓/云希”神经语音需配置 Azure Speech Key（见 README）。";
    } else {
      els.azureNote.textContent = "✓ 已启用 Edge 神经语音（晓晓/云希）";
    }
  });

  els.btnReset.addEventListener("click", () => {
    if (confirm("确定要重置所有进度吗？")) {
      state = Store.init();
      localStorage.removeItem("bible-challenge-v1"); // 清旧数据
      cachedPlan = null;
      els.targetCh.value = CHALLENGE.chaptersPerDay;
      saveState();
      render();
    }
  });

  // 开始日期
  els.startDate.value = state.startDate;
  els.startDate.addEventListener("change", () => {
    state.startDate = els.startDate.value || todayStr();
    cachedPlan = null;
    saveState();
    render();
  });

  // 每日目标章数
  els.targetCh.value = state.perDayOverride || CHALLENGE.chaptersPerDay;
  els.targetCh.addEventListener("change", () => {
    const v = parseInt(els.targetCh.value, 10);
    if (v && v > 0) state.perDayOverride = v;
    cachedPlan = null;
    saveState();
    render();
  });

  // 语音说明
  if (!TTS.hasAzure()) {
    els.azureNote.textContent = "语音说明：当前为浏览器内置语音。配置 Azure Speech Key 后可启用 Edge 晓晓/云希神经语音（见 README）。";
  }

  // 默认激活"按日期"视图
  document.querySelectorAll("[data-plan-view]")[0].classList.add("active");

  // 首次渲染
  render();

  // 语音列表异步加载
  if ("speechSynthesis" in window) {
    window.speechSynthesis.onvoiceschanged = () => {};
    speechSynthesis.getVoices();
  }
})();
