const now = Date.now();

document.querySelectorAll("[data-until]").forEach((el) => {
  const left = Date.parse(el.dataset.until) - now;
  if (!(left > 0)) return;
  const hours = Math.ceil(left / 3600000);
  const out = el.querySelector("[data-left]");
  if (out) {
    out.textContent = hours > 48 ? `${Math.floor(hours / 24)} days left`
      : hours > 1 ? `${hours} hours left`
      : "last hour";
  }
  el.hidden = false;
});

document.querySelectorAll("a[data-yt]").forEach((link) => {
  link.addEventListener("click", (e) => {
    if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    const frame = document.createElement("iframe");
    frame.src = `https://www.youtube-nocookie.com/embed/${link.dataset.yt}?autoplay=1&rel=0`;
    frame.title = link.title;
    frame.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    frame.allowFullscreen = true;
    link.replaceWith(frame);
    frame.focus();
  });
});
