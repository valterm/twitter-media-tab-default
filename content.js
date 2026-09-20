(() => {
  "use strict";

  const marker = Symbol.for("x-media-photos-default.installed");
  if (window[marker]) return;
  window[marker] = true;

  const hosts = new Set([
    "x.com", "www.x.com", "twitter.com", "www.twitter.com", "mobile.twitter.com"
  ]);
  const reserved = new Set([
    "i", "home", "explore", "search", "notifications", "messages",
    "settings", "compose", "intent", "login", "logout", "signup"
  ]);

  function mediaPath(url) {
    if (url.protocol !== "https:" || !hosts.has(url.hostname)) return null;
    const match = /^\/([a-zA-Z0-9_]{1,15})\/media\/?$/.exec(url.pathname);
    if (!match || reserved.has(match[1].toLowerCase())) return null;
    return `/${match[1].toLowerCase()}/media`;
  }

  let previous = new URL(location.href);
  const replaceState = history.replaceState;
  let notification = 0;

  function defaultToPhotos(entering) {
    const current = new URL(location.href);
    const path = mediaPath(current);
    const changedProfile = current.origin !== previous.origin || path !== mediaPath(previous);
    previous = current;

    if (!path || (!entering && !changedProfile) || current.searchParams.has("filter")) return;
    current.searchParams.set("filter", "photo");

    
    Reflect.apply(replaceState, history, [history.state, "", current.href]);
    previous = current;
    const pending = ++notification;

    
    queueMicrotask(() => {
      if (pending !== notification || location.href !== current.href) return;
      window.dispatchEvent(new PopStateEvent("popstate", { state: history.state }));
    });
  }

  for (const method of ["pushState", "replaceState"]) {
    const original = history[method];
    history[method] = function (...args) {
      const result = Reflect.apply(original, this, args);
      notification++;
      defaultToPhotos(false);
      return result;
    };
  }

  window.addEventListener("popstate", () => {
    notification++;
    defaultToPhotos(true);
  });
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
      defaultToPhotos(true);
    }
  });
  defaultToPhotos(true);
})();
