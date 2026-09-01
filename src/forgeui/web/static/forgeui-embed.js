(() => {
  "use strict";
  const selector = "iframe[data-forgeui-embed]";
  const frameFor = (source) =>
    Array.from(document.querySelectorAll(selector)).find((frame) => frame.contentWindow === source);
  const targetOrigin = (frame) => {
    try {
      return new URL(frame.src, document.baseURI).origin;
    } catch (_) {
      return "";
    }
  };
  const requestMeasurement = (frame) => {
    const origin = targetOrigin(frame);
    if (origin) frame.contentWindow?.postMessage({type: "forgeui:measure"}, origin);
  };
  window.addEventListener("message", (event) => {
    const frame = frameFor(event.source);
    if (!frame || event.origin !== targetOrigin(frame)) return;
    if (event.data?.type === "forgeui:navigate") {
      const destination = event.data.destination;
      if (typeof destination !== "string" || !/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/.test(destination)) return;
      frame.dispatchEvent(new CustomEvent("forgeui:navigate", {detail: {destination}}));
      return;
    }
    if (event.data?.type !== "forgeui:resize") return;
    const height = Math.ceil(Number(event.data.height));
    if (!Number.isFinite(height) || height < 48 || height > 10000) return;
    frame.style.height = `${height}px`;
  });
  const initialize = () =>
    document.querySelectorAll(selector).forEach((frame) => {
      frame.addEventListener("load", () => requestMeasurement(frame));
      requestMeasurement(frame);
    });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize);
  else initialize();
})();
