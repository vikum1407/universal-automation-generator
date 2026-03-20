(function () {
  const events = [];

  function record(event) {
    events.push({ ...event, timestamp: Date.now() });
  }

  window.__qlitzCapture = {
    recordNavigation(url) {
      record({ type: "navigation", url });
    },

    recordAction(action, selector, value) {
      record({ type: "action", action, selector, value });
    },

    recordDomSnapshot(selector) {
      const el = document.querySelector(selector);
      if (!el) return;

      record({
        type: "dom-snapshot",
        selector,
        html: el.outerHTML,
        attributes: Object.fromEntries(
          [...el.attributes].map((a) => [a.name, a.value])
        ),
        text: el.innerText,
      });
    },

    recordAssertion(selector, assertion, expected) {
      record({ type: "assertion", selector, assertion, expected });
    },

    recordError(message, selector) {
      record({ type: "error", message, selector });
    },

    flush() {
      const copy = [...events];
      events.length = 0;
      return copy;
    },
  };
})();
