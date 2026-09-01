(() => {
  "use strict";
  const key = "forgeui-theme";
  const root = document.documentElement;
  const controls = () => document.querySelectorAll("[data-forge-theme]");
  const main = () => document.querySelector("#forge-main");
  const csrf = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || "";
  const stateSnapshot = () => {
    try {
      const value = JSON.parse(main()?.dataset.forgeState || "{}");
      return value && typeof value === "object" && !Array.isArray(value) ? value : {};
    } catch (_) {
      return {};
    }
  };
  const toast = (message, level = "error") => {
    const region = document.querySelector(".forge-toast-region");
    if (!region) return;
    const item = document.createElement("div");
    item.className = `forge-toast forge-toast--${level}`;
    item.setAttribute("role", "status");
    item.textContent = message;
    region.replaceChildren(item);
  };
  const setTheme = (theme) => {
    const value = ["light", "dark", "system"].includes(theme) ? theme : "system";
    root.dataset.theme = value;
    try { localStorage.setItem(key, value); } catch (_) { /* storage is optional */ }
    controls().forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.forgeTheme === value)));
  };
  const applyTriggers = (triggers) => {
    if (!triggers || typeof triggers !== "object") return;
    try {
      const dialog = triggers["forgeui:dialog"];
      if (dialog) {
        const target = document.getElementById(`forge-element-${dialog.target}`);
        if (dialog.mode === "open") target?.showModal();
        else target?.close();
      }
      const notice = triggers["forgeui:toast"];
      if (notice) toast(notice.message, notice.level);
      const navigation = triggers["forgeui:navigate"];
      if (navigation) window.location.hash = navigation.destination;
    } catch (_) {
      toast("The dashboard response could not be applied.");
    }
  };
  const processTriggers = (response) => {
    const raw = response.headers.get("HX-Trigger");
    if (!raw) return;
    try { applyTriggers(JSON.parse(raw)); }
    catch (_) { toast("The dashboard response could not be applied."); }
  };
  const swapDashboard = async (response) => {
    const target = main();
    if (!target) return;
    if (!response.ok) {
      let message = "The dashboard action could not be completed.";
      try { message = (await response.json()).detail || message; } catch (_) { /* HTML error */ }
      toast(message);
      return;
    }
    const isJson = response.headers.get("content-type")?.includes("application/json");
    if (isJson) {
      const payload = await response.json();
      target.innerHTML = payload.html || "";
      target.dataset.forgeState = JSON.stringify(payload.state || {});
      applyTriggers(payload.triggers || {});
    } else {
      target.innerHTML = await response.text();
      const version = response.headers.get("X-Forge-State-Version");
      if (version) target.dataset.forgeStateVersion = version;
      processTriggers(response);
    }
    if (window.htmx) window.htmx.process(target);
  };
  const postDashboard = async (url, payload) => {
    const target = main();
    if (!target || !url) return;
    const body = {...payload};
    if (target.dataset.forgePersistence === "stateless") {
      delete body.version;
      body.state = stateSnapshot();
    }
    target.setAttribute("aria-busy", "true");
    try {
      const response = await fetch(url, {
        method: "POST",
        credentials: "same-origin",
        headers: {"Content-Type": "application/json", "X-CSRF-Token": csrf()},
        body: JSON.stringify(body),
      });
      await swapDashboard(response);
    } catch (_) {
      toast("The dashboard is temporarily unreachable.");
    } finally {
      target.removeAttribute("aria-busy");
    }
  };
  const stateValue = (control) => {
    if (control.type === "checkbox") return control.checked;
    if (control.type === "number") return control.value === "" ? null : Number(control.value);
    return control.value;
  };
  const updateState = async (path, value) => {
    const target = main();
    if (!target || !path?.startsWith("state.")) return;
    const template = target.dataset.forgeStateUrl;
    if (!template) return;
    const stateKey = path.slice(6);
    const url = template.replace("__STATE_KEY__", encodeURIComponent(stateKey));
    await postDashboard(url, {value, version: Number(target.dataset.forgeStateVersion || "0")});
  };
  const processJobFragment = async (section) => {
    if (window.htmx || !section?.getAttribute("hx-get")) return;
    window.setTimeout(async () => {
      if (!section.isConnected || window.htmx) return;
      try {
        const response = await fetch(section.getAttribute("hx-get"), {credentials: "same-origin"});
        if (!response.ok) throw new Error("poll failed");
        const template = document.createElement("template");
        template.innerHTML = await response.text();
        const replacement = template.content.firstElementChild;
        if (replacement) {
          section.replaceWith(replacement);
          processJobFragment(replacement);
        }
      } catch (_) {
        toast("Generation status is temporarily unavailable.");
      }
    }, 1000);
  };
  const startLocalPolling = () => {
    if (!window.htmx) document.querySelectorAll("[id^='forge-job-'][hx-get]").forEach(processJobFragment);
  };
  let resizeFrame = 0;
  const notifyParentSize = () => {
    if (window.parent === window || !["embed", "chat"].includes(root.dataset.forgeSurface)) return;
    window.cancelAnimationFrame(resizeFrame);
    resizeFrame = window.requestAnimationFrame(() => {
      const height = Math.ceil(document.documentElement.scrollHeight);
      window.parent.postMessage({type: "forgeui:resize", height}, "*");
    });
  };
  if ("ResizeObserver" in window) new ResizeObserver(notifyParentSize).observe(document.body);
  window.addEventListener("load", notifyParentSize);
  window.addEventListener("message", (event) => {
    if (event.source === window.parent && event.data?.type === "forgeui:measure") notifyParentSize();
  });
  try { setTheme(localStorage.getItem(key) || root.dataset.theme || "system"); } catch (_) { setTheme(root.dataset.theme || "system"); }
  document.addEventListener("click", (event) => {
    const theme = event.target.closest("[data-forge-theme]");
    if (theme) { setTheme(theme.dataset.forgeTheme); return; }
    const close = event.target.closest("[data-forge-dialog-close]");
    if (close) { close.closest("dialog")?.close(); return; }
    const pager = event.target.closest("[data-forge-state-delta]");
    if (pager) {
      const delta = Number(pager.dataset.forgeStateDelta);
      const pageLabel = pager.parentElement?.querySelector("span")?.textContent || "";
      const current = Number(pageLabel.match(/Page\s+(\d+)\s+of\s+\d+/i)?.[1] || "1");
      updateState(pager.dataset.forgeStatePath, Math.max(1, current + delta));
      return;
    }
    const htmxFallback = event.target.closest("[hx-post]");
    if (htmxFallback && !window.htmx) {
      const selector = htmxFallback.getAttribute("hx-target");
      const target = selector ? document.querySelector(selector) : null;
      fetch(htmxFallback.getAttribute("hx-post"), {
        method: "POST",
        credentials: "same-origin",
        headers: {"X-CSRF-Token": csrf()},
      }).then(async (response) => {
        if (!response.ok) throw new Error("request failed");
        const template = document.createElement("template");
        template.innerHTML = await response.text();
        const replacement = template.content.firstElementChild;
        if (target && replacement) target.replaceWith(replacement);
      }).catch(() => toast("The generation could not be cancelled."));
      return;
    }
    const action = event.target.closest("[data-forge-action]");
    if (action && action.tagName !== "FORM") {
      const target = main();
      const template = target?.dataset.forgeActionUrl;
      if (!template) return;
      const url = template.replace("__ACTION_ID__", encodeURIComponent(action.dataset.forgeAction));
      postDashboard(url, {version: Number(target.dataset.forgeStateVersion || "0"), event: {}});
    }
  });
  document.addEventListener("change", (event) => {
    const control = event.target.closest("[name^='state.']");
    if (!control || control.closest("form[data-forge-action]")) return;
    if (control.type === "file") {
      const file = control.files?.[0];
      if (!file) return;
      if (file.size > 65536) { toast("Files used as session input must be 64 KiB or smaller."); return; }
      file.text().then((value) => updateState(control.name, value)).catch(() => toast("The file could not be read."));
      return;
    }
    updateState(control.name, stateValue(control));
  });
  document.addEventListener("submit", (event) => {
    const form = event.target.closest("form[data-forge-action]");
    if (!form) return;
    event.preventDefault();
    const target = main();
    const template = target?.dataset.forgeActionUrl;
    if (!template) return;
    const values = {};
    for (const [name, value] of new FormData(form).entries()) {
      if (!(value instanceof File)) values[name] = value;
    }
    const url = template.replace("__ACTION_ID__", encodeURIComponent(form.dataset.forgeAction));
    postDashboard(url, {version: Number(target.dataset.forgeStateVersion || "0"), event: {value: values}});
  });
  document.addEventListener("htmx:configRequest", (event) => {
    const token = csrf();
    if (token) event.detail.headers["X-CSRF-Token"] = token;
  });
  document.addEventListener("htmx:afterSwap", () => {
    controls().forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.forgeTheme === root.dataset.theme)));
    notifyParentSize();
  });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", startLocalPolling);
  else startLocalPolling();
})();
