/**
 * Task Bot Hub — paywall, 4-bot picker, Overseer fleet card,
 * optional AI chat, Task Bot deep-link handoff.
 * No tracking. Never hardcode API keys.
 */
(function () {
  "use strict";

  const cfg = window.TASK_BOT_CONFIG || {};
  const TASK_BOTS = Array.isArray(cfg.TASK_BOTS) ? cfg.TASK_BOTS : [];
  const OVERSEER = cfg.OVERSEER || null;

  const STORAGE_CHAT = "task-bot-site-chat-v2";
  const STORAGE_UNLOCK = "task-bot-site-unlocked";
  const STORAGE_UNLOCK_AT = "task-bot-site-unlocked-at";
  const STORAGE_BOT = "task-bot-site-selected-bot";

  const els = {
    year: document.getElementById("year"),
    unlockStatus: document.getElementById("unlockStatus"),
    headerUnlockBtn: document.getElementById("headerUnlockBtn"),
    heroUnlockBtn: document.getElementById("heroUnlockBtn"),
    paywall: document.getElementById("paywall"),
    paywallCta: document.getElementById("paywallCta"),
    paywallNote: document.getElementById("paywallNote"),
    workspace: document.getElementById("workspacePanel"),
    overseerCard: document.getElementById("overseerCard"),
    botGrid: document.getElementById("botGrid"),
    messages: document.getElementById("messages"),
    form: document.getElementById("chatForm"),
    input: document.getElementById("taskInput"),
    clearBtn: document.getElementById("clearChat"),
    alsoHandoff: document.getElementById("alsoHandoff"),
    chatBotName: document.getElementById("chatBotName"),
    chatModeLabel: document.getElementById("chatModeLabel"),
    quickActions: document.getElementById("quickActions"),
    sendBtn: document.getElementById("sendBtn"),
  };

  if (els.year) els.year.textContent = String(new Date().getFullYear());

  let selectedBotId = loadSelectedBotId();
  let unlocked = computeUnlocked();
  /** @type {{role: string, text: string, at: number, request?: string}[]} */
  let history = loadHistory();

  renderOverseer();
  renderBotPicker();
  applyUnlockUI();
  ensureWelcome();
  renderAll();
  updateChatLabels();
  wireEvents();
  maybeHandlePaidQuery();

  function computeUnlocked() {
    if (cfg.DEMO_UNLOCK === true) return true;
    try {
      if (localStorage.getItem(STORAGE_UNLOCK) === "1") return true;
    } catch (_) {}
    const params = new URLSearchParams(window.location.search);
    if (params.get("paid") === "1") {
      setUnlocked(true);
      return true;
    }
    return false;
  }

  function setUnlocked(on) {
    unlocked = !!on;
    try {
      if (on) {
        localStorage.setItem(STORAGE_UNLOCK, "1");
        localStorage.setItem(STORAGE_UNLOCK_AT, String(Date.now()));
      } else {
        localStorage.removeItem(STORAGE_UNLOCK);
        localStorage.removeItem(STORAGE_UNLOCK_AT);
      }
    } catch (_) {}
  }

  function maybeHandlePaidQuery() {
    const params = new URLSearchParams(window.location.search);
    if (params.get("paid") === "1") {
      setUnlocked(true);
      applyUnlockUI();
      // Clean URL without reload
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete("paid");
        window.history.replaceState({}, "", url.pathname + url.search + url.hash);
      } catch (_) {}
    }
  }

  function stripeUrl() {
    return (cfg.STRIPE_PAYMENT_LINK || "").trim();
  }

  function aiReady() {
    return !!(cfg.AI_ENDPOINT || "").trim();
  }

  function selectedBot() {
    return (
      TASK_BOTS.find(function (b) {
        return b.id === selectedBotId;
      }) || TASK_BOTS[0] || null
    );
  }

  function loadSelectedBotId() {
    try {
      const id = localStorage.getItem(STORAGE_BOT);
      if (id && TASK_BOTS.some(function (b) { return b.id === id; })) return id;
    } catch (_) {}
    return TASK_BOTS[0] ? TASK_BOTS[0].id : "";
  }

  function saveSelectedBotId(id) {
    selectedBotId = id;
    try {
      localStorage.setItem(STORAGE_BOT, id);
    } catch (_) {}
    updateChatLabels();
  }

  function paymentCtaHref() {
    const link = stripeUrl();
    return link || "#workspace";
  }

  function applyUnlockUI() {
    const link = stripeUrl();
    const ctaLabel = "Unlock for $0.99";

    [els.headerUnlockBtn, els.heroUnlockBtn].forEach(function (btn) {
      if (!btn) return;
      if (unlocked) {
        btn.textContent = "Unlocked";
        btn.disabled = true;
        btn.classList.add("is-unlocked");
      } else {
        btn.textContent = btn === els.headerUnlockBtn ? "Unlock $0.99" : ctaLabel;
        btn.disabled = false;
        btn.classList.remove("is-unlocked");
      }
    });

    if (els.paywallCta) {
      els.paywallCta.textContent = ctaLabel;
      els.paywallCta.href = paymentCtaHref();
      if (link) {
        els.paywallCta.setAttribute("target", "_blank");
        els.paywallCta.setAttribute("rel", "noopener noreferrer");
      } else {
        els.paywallCta.removeAttribute("target");
      }
    }

    if (els.paywallNote) {
      els.paywallNote.textContent = link
        ? "Stripe checkout opens in a new tab. You’ll return here unlocked."
        : "Owner setup needed: paste your Stripe Payment Link into config.js → STRIPE_PAYMENT_LINK.";
    }

    if (els.unlockStatus) {
      if (unlocked) {
        els.unlockStatus.textContent = cfg.DEMO_UNLOCK
          ? "Demo unlock is on (DEMO_UNLOCK=true). Chat & tools are available."
          : "This browser is unlocked. Chat, quick actions, and Task Bot handoff are available.";
      } else {
        els.unlockStatus.textContent =
          "Chat and AI tools stay locked until you unlock for $0.99. Overseer (fleet) stays free to open.";
      }
    }

    if (els.workspace) {
      els.workspace.classList.toggle("is-locked", !unlocked);
    }
    if (els.paywall) {
      els.paywall.hidden = unlocked;
    }

    updateChatLabels();
  }

  function updateChatLabels() {
    const bot = selectedBot();
    if (els.chatBotName) {
      els.chatBotName.textContent = bot ? bot.name + " handoff" : "Task Bot Hub";
    }
    if (els.chatModeLabel) {
      els.chatModeLabel.textContent = aiReady()
        ? "On-page AI + handoff"
        : "Collect + handoff (AI endpoint not configured)";
    }
  }

  function renderOverseer() {
    if (!els.overseerCard || !OVERSEER) return;
    els.overseerCard.innerHTML = "";

    const info = document.createElement("div");
    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = "Always free · not behind paywall";
    const title = document.createElement("h3");
    title.textContent = OVERSEER.name + " — " + (OVERSEER.blurb || "Efficiencies & revenue");
    const desc = document.createElement("p");
    desc.textContent =
      "Marketing & ops contact for efficiencies and revenue. Open anytime — separate from the paid Task Bot handoff picker.";
    info.appendChild(badge);
    info.appendChild(title);
    info.appendChild(desc);

    const open = document.createElement("a");
    open.className = "btn btn-overseer";
    open.href = OVERSEER.url;
    open.textContent = "Open Overseer";

    els.overseerCard.appendChild(info);
    els.overseerCard.appendChild(open);
  }

  function renderBotPicker() {
    if (!els.botGrid) return;
    els.botGrid.innerHTML = "";
    TASK_BOTS.forEach(function (bot, index) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "bot-option";
      btn.setAttribute("role", "radio");
      btn.setAttribute("aria-checked", bot.id === selectedBotId ? "true" : "false");
      btn.dataset.botId = bot.id;

      const radio = document.createElement("span");
      radio.className = "bot-radio";
      radio.setAttribute("aria-hidden", "true");

      const body = document.createElement("div");
      const name = document.createElement("strong");
      name.textContent = bot.name;
      const blurb = document.createElement("span");
      blurb.textContent = bot.blurb || "";
      body.appendChild(name);
      body.appendChild(blurb);

      btn.appendChild(radio);
      btn.appendChild(body);

      btn.addEventListener("click", function () {
        saveSelectedBotId(bot.id);
        Array.prototype.forEach.call(els.botGrid.querySelectorAll(".bot-option"), function (el) {
          el.setAttribute("aria-checked", el.dataset.botId === bot.id ? "true" : "false");
        });
      });

      // Allow picking before unlock so choice is ready after pay
      els.botGrid.appendChild(btn);
      if (!selectedBotId && index === 0) saveSelectedBotId(bot.id);
    });
  }

  function welcomeText() {
    return (
      "Welcome to Task Bot Hub.\n\n" +
      "• Unlock once for $0.99 to use this chat and quick AI tools.\n" +
      "• Pick Task Bot 1–4 above for handoffs into the Grok Bot / Cursor app.\n" +
      "• Overseer (efficiencies & revenue) is free in the Fleet section — not a paid handoff option.\n\n" +
      (aiReady()
        ? "On-page AI endpoint is configured — quick tasks can run here."
        : "No AI endpoint is set yet — after unlock I’ll still collect your request and can open the selected Task Bot.")
    );
  }

  function ensureWelcome() {
    if (!history.length) {
      history = [{ role: "bot", text: welcomeText(), at: Date.now() }];
      saveHistory();
    }
  }

  function wireEvents() {
    function goPay(event) {
      if (unlocked) return;
      const link = stripeUrl();
      if (!link) {
        if (event) event.preventDefault();
        if (els.paywallNote) {
          els.paywallNote.textContent =
            "Add STRIPE_PAYMENT_LINK in config.js (Stripe Payment Link for a $0.99 product). Set after-payment redirect to success.html.";
        }
        document.getElementById("workspace")?.scrollIntoView({ behavior: "smooth" });
        return;
      }
      if (event && event.currentTarget && event.currentTarget.tagName === "BUTTON") {
        event.preventDefault();
        window.open(link, "_blank", "noopener,noreferrer");
      }
    }

    if (els.headerUnlockBtn) els.headerUnlockBtn.addEventListener("click", goPay);
    if (els.heroUnlockBtn) els.heroUnlockBtn.addEventListener("click", goPay);
    if (els.paywallCta) {
      els.paywallCta.addEventListener("click", function (event) {
        if (!stripeUrl()) {
          event.preventDefault();
          goPay(event);
        }
      });
    }

    if (els.form) {
      els.form.addEventListener("submit", function (event) {
        event.preventDefault();
        if (!unlocked) {
          document.getElementById("workspace")?.scrollIntoView({ behavior: "smooth" });
          return;
        }
        const text = (els.input.value || "").trim();
        if (!text) return;
        handleUserMessage(text);
        els.input.value = "";
        els.input.focus();
      });
    }

    if (els.input) {
      els.input.addEventListener("keydown", function (event) {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          els.form.requestSubmit();
        }
      });
    }

    if (els.clearBtn) {
      els.clearBtn.addEventListener("click", function () {
        history = [{ role: "bot", text: welcomeText(), at: Date.now() }];
        saveHistory();
        renderAll();
      });
    }

    if (els.quickActions) {
      els.quickActions.addEventListener("click", function (event) {
        const t = event.target;
        if (!(t instanceof HTMLElement)) return;
        if (!t.classList.contains("chip")) return;
        if (!unlocked) {
          document.getElementById("workspace")?.scrollIntoView({ behavior: "smooth" });
          return;
        }
        const prompt = t.getAttribute("data-prompt") || "";
        els.input.value = prompt;
        els.input.focus();
        // Place caret at end
        try {
          els.input.selectionStart = els.input.selectionEnd = els.input.value.length;
        } catch (_) {}
      });
    }

    if (els.messages) {
      els.messages.addEventListener("click", function (event) {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        const action = target.getAttribute("data-action");
        if (!action) return;
        const request = target.getAttribute("data-request") || "";
        if (action === "copy") {
          copyText(request).then(
            function () {
              const original = target.textContent;
              target.textContent = "Copied!";
              setTimeout(function () {
                target.textContent = original;
              }, 1400);
            },
            function () {
              target.textContent = "Copy failed";
            }
          );
        }
        if (action === "open") {
          openSelectedBot();
        }
      });
    }
  }

  async function handleUserMessage(text) {
    appendMessage({ role: "user", text: text, at: Date.now() });

    const wantHandoff = !!(els.alsoHandoff && els.alsoHandoff.checked);
    let replied = false;

    if (aiReady()) {
      const thinking = { role: "bot", text: "Thinking…", at: Date.now(), ephemeral: true };
      appendMessage(thinking);
      try {
        const answer = await callAi(text);
        // Replace ephemeral thinking
        history = history.filter(function (m) {
          return !m.ephemeral;
        });
        appendMessage({
          role: "bot",
          text: answer,
          at: Date.now(),
          request: text,
        });
        replied = true;
      } catch (err) {
        history = history.filter(function (m) {
          return !m.ephemeral;
        });
        appendMessage({
          role: "bot",
          text:
            "On-page AI call failed (" +
            (err && err.message ? err.message : "error") +
            ").\n\n" +
            "I’ll keep your request for Task Bot handoff instead. " +
            "For production, put the API key in a Cloudflare Worker proxy — never in this public page.",
          at: Date.now(),
          request: text,
        });
        replied = true;
      }
      renderAll();
    }

    if (!replied) {
      const bot = selectedBot();
      appendMessage({
        role: "bot",
        text:
          "Got it. On-page AI isn’t configured yet (AI_ENDPOINT empty), so I’m collecting this for handoff.\n\n" +
          "Selected: " +
          (bot ? bot.name : "Task Bot") +
          ".\n" +
          "Use Copy request + Open Task Bot, or check “Also open selected Task Bot” next time.",
        at: Date.now(),
        request: text,
      });
    }

    if (wantHandoff) {
      openSelectedBot();
    }
  }

  async function callAi(userText) {
    const endpoint = (cfg.AI_ENDPOINT || "").trim();
    const key = (cfg.AI_API_KEY || "").trim();
    const model = cfg.AI_MODEL || "grok-4-fast";

    const headers = {
      "Content-Type": "application/json",
    };
    // Only send Authorization if a key is present (local/dev). Prefer a proxy with no browser key.
    if (key) {
      headers.Authorization = "Bearer " + key;
    }

    const body = {
      model: model,
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant on Task Bot Hub. Keep answers clear and concise. " +
            "For large or multi-step work, suggest handing off to a Task Bot in the Grok Bot app.",
        },
        { role: "user", content: userText },
      ],
      temperature: 0.7,
    };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const detail = await res.text().catch(function () {
        return "";
      });
      throw new Error("HTTP " + res.status + (detail ? ": " + detail.slice(0, 180) : ""));
    }

    const data = await res.json();
    const content =
      data &&
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content;
    if (!content) throw new Error("Empty model response");
    return String(content);
  }

  function openSelectedBot() {
    const bot = selectedBot();
    if (!bot || !bot.url) return;
    try {
      const opener = window.open(bot.url, "_blank");
      if (!opener) window.location.href = bot.url;
    } catch (_) {
      window.location.href = bot.url;
    }
  }

  function appendMessage(msg) {
    history.push(msg);
    if (!msg.ephemeral) saveHistory();
    renderMessage(msg);
    scrollToBottom();
  }

  function renderAll() {
    if (!els.messages) return;
    els.messages.innerHTML = "";
    history.forEach(renderMessage);
    scrollToBottom();
  }

  function renderMessage(msg) {
    if (!els.messages) return;
    const wrap = document.createElement("article");
    wrap.className = "msg msg-" + (msg.role === "user" ? "user" : "bot");

    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.textContent = msg.text;
    wrap.appendChild(bubble);

    const meta = document.createElement("div");
    meta.className = "msg-meta";
    meta.textContent =
      (msg.role === "user" ? "You" : "Hub") + " · " + formatTime(msg.at);
    wrap.appendChild(meta);

    if (msg.role === "bot" && msg.request) {
      const actions = document.createElement("div");
      actions.className = "msg-actions";

      const copyBtn = document.createElement("button");
      copyBtn.type = "button";
      copyBtn.className = "btn btn-sm btn-secondary";
      copyBtn.setAttribute("data-action", "copy");
      copyBtn.setAttribute("data-request", msg.request);
      copyBtn.textContent = "Copy request";

      const openBtn = document.createElement("button");
      openBtn.type = "button";
      openBtn.className = "btn btn-sm btn-primary";
      openBtn.setAttribute("data-action", "open");
      openBtn.textContent = "Open Task Bot";

      actions.appendChild(copyBtn);
      actions.appendChild(openBtn);
      wrap.appendChild(actions);
    }

    els.messages.appendChild(wrap);
  }

  function scrollToBottom() {
    if (els.messages) els.messages.scrollTop = els.messages.scrollHeight;
  }

  function formatTime(ts) {
    try {
      return new Date(ts).toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
      });
    } catch (_) {
      return "";
    }
  }

  function loadHistory() {
    try {
      const raw = localStorage.getItem(STORAGE_CHAT);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function saveHistory() {
    try {
      const durable = history.filter(function (m) {
        return !m.ephemeral;
      });
      localStorage.setItem(STORAGE_CHAT, JSON.stringify(durable));
    } catch (_) {}
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      try {
        const ok = document.execCommand("copy");
        document.body.removeChild(ta);
        ok ? resolve() : reject(new Error("copy failed"));
      } catch (err) {
        document.body.removeChild(ta);
        reject(err);
      }
    });
  }
})();
