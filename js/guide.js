// Guide pages: click-to-play clips and the chapter menu.
const icon = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
const PLAY = icon("M7.5 5 L18.5 12 L7.5 19 Z");
const PAUSE = icon("M8 5.5 V18.5 M16 5.5 V18.5");
const REPLAY = icon("M5 12 a7 7 0 1 0 2.2-5.1 M5.2 4 v3.6 h3.6");
const FULL = icon("M4.5 9 V4.5 H9 M15 4.5 H19.5 V9 M19.5 15 V19.5 H15 M9 19.5 H4.5 V15");

const live = new Set();

function pauseOthers(video) {
  live.forEach((v) => { if (v !== video) v.pause(); });
}

function mountClip(link) {
  const img = link.querySelector("img");
  const label = link.getAttribute("aria-label").replace(/^Play clip: /, "");
  const box = document.createElement("div");
  box.className = "clip-frame";

  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.setAttribute("playsinline", "");
  video.preload = "auto";
  video.poster = img.currentSrc || img.src;
  video.src = link.href;
  video.setAttribute("aria-label", label);

  const again = document.createElement("button");
  again.type = "button";
  again.className = "clip-again";
  again.hidden = true;
  again.innerHTML = `${REPLAY}<span>watch again</span>`;

  const bar = document.createElement("div");
  bar.className = "clip-bar";
  bar.innerHTML = `<button type="button" data-act="toggle" aria-label="Pause">${PAUSE}</button>`
    + `<button type="button" data-act="replay" aria-label="Replay">${REPLAY}</button>`
    + `<span class="clip-track" aria-hidden="true"><i></i></span>`
    + `<button type="button" data-act="full" aria-label="Full screen">${FULL}</button>`;
  const toggle = bar.querySelector("[data-act=toggle]");
  const fill = bar.querySelector(".clip-track i");
  const full = bar.querySelector("[data-act=full]");
  if (!box.requestFullscreen && !video.webkitEnterFullscreen) full.remove();

  box.append(video, again, bar);
  link.replaceWith(box);
  live.add(video);

  const play = () => { pauseOthers(video); again.hidden = true; video.play().catch(() => {}); };
  const restart = () => { video.currentTime = 0; play(); };
  let raf = 0;
  const tick = () => {
    if (video.duration) fill.style.width = `${(video.currentTime / video.duration) * 100}%`;
    if (!video.paused) raf = requestAnimationFrame(tick);
  };

  video.addEventListener("play", () => {
    toggle.innerHTML = PAUSE;
    toggle.setAttribute("aria-label", "Pause");
    cancelAnimationFrame(raf);
    tick();
  });
  video.addEventListener("pause", () => {
    toggle.innerHTML = PLAY;
    toggle.setAttribute("aria-label", "Play");
    tick();
  });
  video.addEventListener("ended", () => { again.hidden = false; again.focus({ preventScroll: true }); });
  video.addEventListener("click", () => (video.paused ? play() : video.pause()));
  again.addEventListener("click", restart);
  toggle.addEventListener("click", () => {
    if (video.ended) restart();
    else if (video.paused) play();
    else video.pause();
  });
  bar.querySelector("[data-act=replay]").addEventListener("click", restart);
  full.addEventListener("click", () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (box.requestFullscreen) box.requestFullscreen();
    else video.webkitEnterFullscreen();
  });

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting && !document.fullscreenElement) video.pause();
    }, { threshold: 0.2 }).observe(box);
  }

  play();
  toggle.focus({ preventScroll: true });
}

document.querySelectorAll("a[data-clip]").forEach((link) => {
  link.addEventListener("click", (e) => {
    if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    mountClip(link);
  });
});

// Chapter menu: a sticky list on wide screens, a fold-out bar on phones.
const toc = document.querySelector(".toc");
if (toc) {
  const box = toc.querySelector("details");
  const now = toc.querySelector("[data-toc-now]");
  const links = [...toc.querySelectorAll("a[href^='#']")];
  const targets = links.map((a) => document.getElementById(a.hash.slice(1)));
  const narrow = window.matchMedia("(max-width: 980px)");

  const fit = () => { box.open = !narrow.matches; };
  fit();
  if (narrow.addEventListener) narrow.addEventListener("change", fit);
  else narrow.addListener(fit);

  toc.querySelector("summary").addEventListener("click", (e) => {
    if (!narrow.matches) e.preventDefault();
  });
  toc.addEventListener("click", (e) => {
    if (e.target.closest("a") && narrow.matches) box.open = false;
  });

  let current = -1;
  const spy = () => {
    const line = window.innerHeight * 0.3;
    let index = -1;
    targets.forEach((el, i) => { if (el && el.getBoundingClientRect().top < line) index = i; });
    if (index === current) return;
    current = index;
    links.forEach((a, i) => {
      if (i === index) a.setAttribute("aria-current", "step");
      else a.removeAttribute("aria-current");
    });
    if (now) now.textContent = index >= 0 ? links[index].textContent.trim() : "";
  };
  let queued = false;
  window.addEventListener("scroll", () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; spy(); });
  }, { passive: true });
  spy();
}
