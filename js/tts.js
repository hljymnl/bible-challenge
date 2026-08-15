// 朗读模块
// 语音策略：
//  1. 若配置了 Edge/Azure 语音 key → 使用高质量的晓晓/云希神经语音
//  2. 否则回退到浏览器内置 TTS（保底可用）
// 预留 Edge 晓晓(XiaoxiaoNeural)/云希(YunxiNeural) 接入位。

const TTS = {
  voices: {
    xiaoxiao: { label: "晓晓(女)", edge: "zh-CN-XiaoxiaoNeural", browserHint: "zh-CN" },
    yunxi:    { label: "云希(男)", edge: "zh-CN-YunxiNeural",    browserHint: "zh-CN" }
  },

  // 用户选择的 voice key ("xiaoxiao" | "yunxi" | "auto")
  selectedVoice: "auto",

  // Azure/Edge 接入配置（留空则走浏览器 TTS）
  azure: {
    key: "",          // 填入 Azure Speech key 启用高质量神经语音
    region: ""        // 如 "eastasia"
  },

  // 判断是否已配置 Azure
  hasAzure() {
    return !!(this.azure.key && this.azure.region);
  },

  // 获取当前生效的声音对象
  getVoice() {
    const k = this.selectedVoice === "auto" ? "xiaoxiao" : this.selectedVoice;
    return this.voices[k] || this.voices.xiaoxiao;
  },

  // 朗读一段文本
  speak(text) {
    if (!text) return Promise.resolve();
    // 若已配置 Azure/Edge 神经语音 → 走高质量接口
    if (this.hasAzure()) {
      return this.speakAzure(text);
    }
    // 否则回退浏览器 TTS
    return this.speakBrowser(text);
  },

  stop() {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (this._playing && typeof this._playing.pause === "function") { try { this._playing.pause(); } catch(e){} }
  },

  // ---- 浏览器内置 TTS ----
  speakBrowser(text) {
    return new Promise((resolve) => {
      if (!("speechSynthesis" in window)) { resolve(false); return; }
      const u = new SpeechSynthesisUtterance(text);
      const voice = this.getVoice();
      const matched = speechSynthesis.getVoices().find(v => v.lang && v.lang.startsWith(voice.browserHint));
      if (matched) u.voice = matched;
      u.lang = "zh-CN";
      u.rate = 0.95;
      u.onend = () => resolve(true);
      u.onerror = () => resolve(false);
      speechSynthesis.speak(u);
    });
  },

  // ---- Azure/Edge 神经语音（晓晓/云希）----
  // 通过 Azure Speech REST/WebSocket 合成。此为实现骨架，
  // 填入 key+region 后即可启用高质量神经语音。
  async speakAzure(text) {
    try {
      const voice = this.getVoice().edge;
      const url = `https://${this.azure.region}.tts.speech.microsoft.com/cognitiveservices/v1`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": this.azure.key,
          "Content-Type": "application/ssml+xml",
          "X-Microsoft-OutputFormat": "audio-24khz-96kbitrate-mono-mp3"
        },
        body: `<speak version='1.0' xml:lang='zh-CN'><voice name='${voice}'>${escapeXml(text)}</voice></speak>`
      });
      if (!res.ok) throw new Error("Azure TTS failed: " + res.status);
      const blob = await res.blob();
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      this._playing = audio;
      await audio.play();
      await new Promise((r) => { audio.onended = r; audio.onerror = r; });
      URL.revokeObjectURL(audioUrl);
      return true;
    } catch (e) {
      console.warn("Azure TTS 失败，回退浏览器语音", e);
      return this.speakBrowser(text);
    }
  }
};

function escapeXml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

if (typeof module !== "undefined") module.exports = { TTS };
