/**
 * AURA 2026 — in-site rules viewer
 * URL: rules.html?sport=basketball
 * Sheets configured in AURA_CONFIG.RULES_SHEETS
 */
(function () {
  const CFG = window.AURA_CONFIG || {};
  const sports = CFG.SPORTS || [];
  const sheets = CFG.RULES_SHEETS || {};
  const $ = (id) => document.getElementById(id);

  const params = new URLSearchParams(location.search);
  const sportId = (params.get("sport") || "").toLowerCase().trim();

  const sport = sports.find((s) => s.id === sportId);
  const entry = sheets[sportId];
  // Support string path or { file, title }
  const file = typeof entry === "string" ? entry : entry && entry.file;
  const titleExtra = typeof entry === "object" && entry ? entry.title : null;

  const name = sport ? sport.name : sportId ? sportId.replace(/-/g, " ") : "Unknown";
  document.title = `${sport ? sport.name : "Rules"} · AURA 2026`;

  if ($("rules-title")) {
    $("rules-title").textContent = sport ? `${sport.name} rules` : "Rules";
  }
  if ($("rules-lead")) {
    $("rules-lead").textContent = titleExtra
      ? titleExtra
      : sport
        ? `Men & women categories · Official AURA 2026 sheet for ${sport.name}.`
        : "Choose a sport from the sports section to view its rules.";
  }

  const regCta = $("rules-register-cta");
  if (regCta && sportId) {
    regCta.href = `register.html?sport=${encodeURIComponent(sportId)}`;
  }

  const frame = $("rules-frame");
  const empty = $("rules-empty");
  const img = $("rules-img");
  const pdf = $("rules-pdf");
  const meta = $("rules-meta");

  if (!file) {
    if (empty) empty.classList.remove("hidden-step");
    if (frame) frame.classList.add("hidden-step");
    if (meta) meta.textContent = sportId ? `No rules sheet uploaded for “${name}” yet.` : "";
    return;
  }

  const isPdf = /\.pdf($|\?)/i.test(file);

  if (frame) frame.classList.remove("hidden-step");
  if (empty) empty.classList.add("hidden-step");

  if (isPdf && pdf) {
    if (img) img.hidden = true;
    pdf.hidden = false;
    pdf.src = file;
  } else if (img) {
    if (pdf) {
      pdf.hidden = true;
      pdf.removeAttribute("src");
    }
    img.hidden = false;
    img.src = file;
    img.alt = `${name} — AURA 2026 tournament rules`;
  }

  if (meta) {
    meta.innerHTML =
      `Displayed inside AURA 2026 · ` +
      `<a href="index.html#sports" style="color:var(--blue-soft)">Back to sports</a>`;
  }
})();
