window.addEventListener("load", () => {
  const intro = document.getElementById("intro");
  const video = document.getElementById("launchVideo");
  const finishIntro = () => {
    intro?.classList.add("is-finished");
    intro?.setAttribute("aria-hidden", "true");
  };

  video?.addEventListener("ended", finishIntro, { once: true });
  video?.addEventListener("error", finishIntro, { once: true });
  video?.play?.().catch(() => {
    setTimeout(finishIntro, 1200);
  });
});
