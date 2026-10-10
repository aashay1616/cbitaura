/**
 * AURA 2026 admin desk
 * Demo: localStorage · Live: Supabase (+ optional Auth token for RLS)
 */
(function () {
  const CFG = window.AURA_CONFIG || {};
  const $ = (id) => document.getElementById(id);
  const body = $("admin-body");
  const modeLabel = $("admin-mode-label");

  const AUTH_KEY = "aura2026_admin_session";

  function mode() {
    return CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY ? "live" : "demo";
  }

  function getSession() {
    try {
      return JSON.parse(localStorage.getItem(AUTH_KEY) || "null");
    } catch {
      return null;
    }
  }

  function setSession(s) {
    if (s) localStorage.setItem(AUTH_KEY, JSON.stringify(s));
    else localStorage.removeItem(AUTH_KEY);
  }

  function authHeaders() {
    const key = CFG.SUPABASE_ANON_KEY;
    const session = getSession();
    const bearer = (session && session.access_token) || key;
    return {
      apikey: key,
      Authorization: `Bearer ${bearer}`,
    };
  }

  function rosterNames(r) {
    const p = r && r.players;
    if (!Array.isArray(p) || !p.length) return [];
    return p
      .map((x) => (typeof x === "string" ? x : x && x.name))
      .map((s) => String(s || "").trim())
      .filter(Boolean);
  }

  function rosterSummary(r) {
    const names = rosterNames(r);
    if (!names.length) return `<small style="color:var(--text-3)">No squad listed</small>`;
    return `<button type="button" class="btn btn-ghost act-roster" data-ref="${escapeHtml(
      r.ref_code || ""
    )}" style="padding:0.3rem 0.55rem;font-size:0.72rem;margin-top:0.25rem">View squad (${names.length})</button>`;
  }

  function loadDemo() {
    try {
      return JSON.parse(localStorage.getItem("aura2026_registrations") || "[]");
    } catch {
      return [];
    }
  }

  function saveDemo(arr) {
    localStorage.setItem("aura2026_registrations", JSON.stringify(arr));
  }

  async function loadLive() {
    const res = await fetch(
      `${CFG.SUPABASE_URL}/rest/v1/registrations?select=*&order=created_at.desc`,
      { headers: authHeaders() }
    );
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  async function updateStatus(ref, status, note) {
    if (mode() === "demo") {
      const arr = loadDemo();
      const i = arr.findIndex((r) => r.ref_code === ref);
      if (i >= 0) {
        arr[i].status = status;
        arr[i].admin_note = note || "";
        arr[i].verified_at = new Date().toISOString();
        saveDemo(arr);
      }
      return;
    }
    const res = await fetch(
      `${CFG.SUPABASE_URL}/rest/v1/registrations?ref_code=eq.${encodeURIComponent(ref)}`,
      {
        method: "PATCH",
        headers: {
          ...authHeaders(),
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          status,
          admin_note: note || null,
          verified_at: new Date().toISOString(),
        }),
      }
    );
    if (!res.ok) throw new Error(await res.text());
    if (status === "verified") {
      try {
        await fetch(`${CFG.SUPABASE_URL}/functions/v1/send-confirmation`, {
          method: "POST",
          headers: {
            ...authHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ref_code: ref }),
        });
      } catch (_) {}
    }
  }

  async function login(email, password) {
    const res = await fetch(`${CFG.SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        apikey: CFG.SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error((await res.text()) || "Login failed");
    const data = await res.json();
    setSession({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      email: data.user && data.user.email,
    });
    return data;
  }

  function sportName(id) {
    const s = (CFG.SPORTS || []).find((x) => x.id === id);
    return s ? s.name : id;
  }

  function escapeHtml(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function updateStats(rows) {
    const c = { pending: 0, verified: 0, rejected: 0 };
    rows.forEach((r) => {
      const st = r.status || "pending";
      if (c[st] != null) c[st]++;
    });
    if ($("stat-pending")) $("stat-pending").textContent = String(c.pending);
    if ($("stat-verified")) $("stat-verified").textContent = String(c.verified);
    if ($("stat-rejected")) $("stat-rejected").textContent = String(c.rejected);
    if ($("stat-total")) $("stat-total").textContent = String(rows.length);
  }

  // ---- sports split by category: every sport is listed as Men and/or Women ----
  const catLabel = (c) => (c === "women" ? "Women" : c === "men" ? "Men" : String(c || ""));

  function allGroups(rows) {
    const groups = [];
    const seen = new Set();
    (CFG.SPORTS || []).forEach((s) => {
      (s.categories || []).forEach((c) => {
        const key = `${s.id}|${c}`;
        seen.add(key);
        groups.push({ key, sport: s.id, category: c, label: `${s.name} · ${catLabel(c)}` });
      });
    });
    rows.forEach((r) => {
      const key = `${r.sport}|${r.category}`;
      if (r.sport && !seen.has(key)) {
        seen.add(key);
        groups.push({ key, sport: r.sport, category: r.category, label: `${sportName(r.sport)} · ${catLabel(r.category)}` });
      }
    });
    return groups;
  }

  // ---- standard teams (CBIT, MGIT): listed, but never counted or payment-checked ----
  const normName = (s) => " " + String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim() + " ";

  function standardTeamFor(r) {
    const n = normName(r.college_name);
    return (
      (CFG.STANDARD_TEAMS || []).find(
        (t) =>
          (t.match || [t.name]).some((m) => n.includes(" " + String(m).toLowerCase().trim() + " ")) &&
          (!t.sports || t.sports.includes(r.sport))
      ) || null
    );
  }
  const isStandard = (r) => !!standardTeamFor(r);

  // ---- payment check ----
  const utrOf = (r) => String(r.payment_txn_id || "").trim().toLowerCase();

  function buildUtrIndex(rows) {
    const m = {};
    rows.forEach((r) => {
      const u = utrOf(r);
      if (u) (m[u] = m[u] || []).push(r.ref_code);
    });
    return m;
  }

  function paymentCheck(r, utrIndex) {
    if (isStandard(r)) return { ok: true, standard: true, text: "Standard — not checked", issues: [] };
    const issues = [];
    const fee = r.fee_expected != null && r.fee_expected !== "" ? Number(r.fee_expected) : null;
    const paid = parseFloat(String(r.payment_amount ?? "").replace(/[^0-9.]/g, ""));
    if (!utrOf(r)) issues.push("No UTR");
    if (!(r.payment_screenshot_data || r.payment_screenshot_url || r.payment_screenshot_path)) {
      issues.push("No screenshot");
    }
    if (!Number.isFinite(paid)) issues.push("No amount entered");
    else if (fee != null && Number.isFinite(fee) && paid !== fee) {
      const due = fee - paid;
      if (due > 0) issues.push(`Paid ₹${paid} · fee ₹${fee} · ₹${due} pending`);
      else issues.push(`Paid ₹${paid} but fee is ₹${fee}`);
    }
    const dups = (utrIndex[utrOf(r)] || []).filter((x) => x !== r.ref_code);
    if (utrOf(r) && dups.length) issues.push(`Duplicate UTR (also ${dups.join(", ")})`);
    return { ok: !issues.length, standard: false, text: issues.length ? issues.join(" · ") : "Payment OK", issues };
  }

  function payBadge(r, utrIndex) {
    const c = paymentCheck(r, utrIndex);
    const cls = c.standard ? "pay-std" : c.ok ? "pay-ok" : "pay-warn";
    const icon = c.standard ? "" : c.ok ? "✓ " : "⚠ ";
    return `<span class="pay-badge ${cls}">${icon}${escapeHtml(c.text)}</span>`;
  }

  function rebuildSportFilter(rows) {
    const sel = $("filter-sport");
    if (!sel) return;
    const prev = sel.value || "all";
    const counts = {};
    rows.forEach((r) => {
      const k = `${r.sport}|${r.category}`;
      counts[k] = (counts[k] || 0) + (isStandard(r) ? 0 : 1);
    });
    sel.innerHTML =
      '<option value="all">All sports</option>' +
      allGroups(rows)
        .map((g) => `<option value="${escapeHtml(g.key)}">${escapeHtml(g.label)} (${counts[g.key] || 0})</option>`)
        .join("");
    sel.value = [...sel.options].some((o) => o.value === prev) ? prev : "all";
  }

  // ---- colleges: group every spelling of a college so all its sports show together ----
  const tidyName = (t) => {
    const x = String(t || "").trim().replace(/\s+/g, " ");
    return x && (x === x.toLowerCase() || x === x.toUpperCase()) && x.length > 5
      ? x.toLowerCase().replace(/(^|[\s(-])([a-z])/g, (m, a, b) => a + b.toUpperCase())
      : x;
  };

  function collegeOf(r) {
    const n = normName(r.college_name);
    const hit = (CFG.COLLEGE_ALIASES || []).find((a) =>
      (a.match || [a.name]).some((m) => n.includes(" " + String(m).toLowerCase().trim() + " "))
    );
    if (hit) return { key: hit.name, label: hit.name };
    return { key: n.trim() || "unknown", label: tidyName(r.college_name) || "Unknown college" };
  }

  function rebuildCollegeFilter(rows) {
    const sel = $("filter-college");
    if (!sel) return;
    const prev = sel.value || "all";
    const m = new Map();
    rows.forEach((r) => {
      const c = collegeOf(r);
      const e = m.get(c.key) || { label: c.label, n: 0 };
      e.n++;
      m.set(c.key, e);
    });
    const opts = [...m.entries()].sort((a, b) => a[1].label.localeCompare(b[1].label));
    sel.innerHTML =
      `<option value="all">All colleges (${opts.length})</option>` +
      opts.map(([k, e]) => `<option value="${escapeHtml(k)}">${escapeHtml(e.label)} (${e.n})</option>`).join("");
    sel.value = [...sel.options].some((o) => o.value === prev) ? prev : "all";
  }

  // ---- fee receipts ----
  const money = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");
  const paidOf = (r) => {
    const v = parseFloat(String(r.payment_amount ?? "").replace(/[^0-9.]/g, ""));
    return Number.isFinite(v) ? v : 0;
  };
  const feeOf = (r) => (r.fee_expected != null && r.fee_expected !== "" ? Number(r.fee_expected) || 0 : 0);

  // Direct image source when the proof is stored inline; otherwise "" (needs a storage fetch).
  function inlineProof(r) {
    if (r.payment_screenshot_data) return r.payment_screenshot_data;
    if (r.payment_screenshot_url) return r.payment_screenshot_url;
    return "";
  }

  const proofCache = new Map();
  async function proofSrc(r) {
    const direct = inlineProof(r);
    if (direct) return direct;
    const path = r.payment_screenshot_path;
    if (!path || String(path).startsWith("inline:") || !CFG.SUPABASE_URL) return "";
    if (proofCache.has(r.ref_code)) return proofCache.get(r.ref_code);
    const res = await fetch(`${CFG.SUPABASE_URL}/storage/v1/object/payment-proofs/${path}`, { headers: authHeaders() });
    if (!res.ok) throw new Error(await res.text());
    const url = URL.createObjectURL(await res.blob());
    proofCache.set(r.ref_code, url);
    return url;
  }

  function collegeRows(rows, key) {
    return rows
      .filter((r) => collegeOf(r).key === key)
      .sort((a, b) => `${a.sport}${a.category}`.localeCompare(`${b.sport}${b.category}`));
  }

  function collegeTotals(list) {
    const reg = list.filter((r) => !isStandard(r));
    const fee = reg.reduce((t, r) => t + feeOf(r), 0);
    const paid = reg.reduce((t, r) => t + paidOf(r), 0);
    return { teams: list.length, fee, paid, balance: fee - paid };
  }

  function renderCollegeSummary(rows) {
    const box = $("college-summary");
    if (!box) return;
    const key = $("filter-college") ? $("filter-college").value : "all";
    if (key === "all") {
      box.hidden = true;
      box.innerHTML = "";
      return;
    }
    const list = collegeRows(rows, key);
    if (!list.length) {
      box.hidden = true;
      return;
    }
    const utrIndex = buildUtrIndex(rows);
    const t = collegeTotals(list);
    const label = collegeOf(list[0]).label;
    const sportsPlayed = list.map((r) => `${sportName(r.sport)} · ${catLabel(r.category)}`);
    box.hidden = false;
    box.innerHTML = `
      <div class="college-head">
        <div>
          <p class="eyebrow" style="margin:0 0 0.2rem">College view</p>
          <h2 class="step-title" style="margin:0">${escapeHtml(label)}</h2>
          <p class="form-note" style="margin:0.25rem 0 0">${list.length} registration${list.length === 1 ? "" : "s"}: ${escapeHtml(
            sportsPlayed.join(" · ")
          )}</p>
        </div>
        <div class="form-actions" style="margin:0">
          <button type="button" class="btn btn-primary" id="college-receipt">Fee receipt (print / PDF)</button>
        </div>
      </div>
      <div class="admin-stats college-stats">
        <div class="admin-stat"><span class="n">${list.length}</span><span class="l">Teams</span></div>
        <div class="admin-stat"><span class="n">${money(t.fee)}</span><span class="l">Fee due</span></div>
        <div class="admin-stat"><span class="n">${money(t.paid)}</span><span class="l">Paid</span></div>
        <div class="admin-stat"><span class="n">${t.balance > 0 ? money(t.balance) : t.balance < 0 ? "+" + money(-t.balance) : "—"}</span><span class="l">${
          t.balance > 0 ? "Pending" : t.balance < 0 ? "Extra paid" : "Settled"
        }</span></div>
      </div>
      <div class="college-grid">
        ${list
          .map(
            (r) => `
          <div class="college-item">
            <div class="college-item-top">
              <strong>${escapeHtml(sportName(r.sport))} · ${escapeHtml(catLabel(r.category))}</strong>
              <span class="status-pill ${r.status || "pending"}">${escapeHtml(r.status || "pending")}</span>
            </div>
            <div class="college-item-meta"><code>${escapeHtml(r.ref_code)}</code> · ${escapeHtml(r.captain_name || "")} ${escapeHtml(r.captain_phone || "")}</div>
            <div class="college-item-fee">${
              isStandard(r)
                ? '<span class="pay-badge pay-std">Standard — no payment</span>'
                : `Fee ${money(feeOf(r))} · Paid ${money(paidOf(r))} · UTR ${escapeHtml(r.payment_txn_id || "—")}<br>${payBadge(r, utrIndex)}`
            }</div>
            ${
              isStandard(r)
                ? ""
                : `<div class="college-receipt" data-ref="${escapeHtml(r.ref_code)}"><span class="form-note">Loading receipt…</span></div>`
            }
          </div>`
          )
          .join("")}
      </div>`;

    // load each receipt image (inline proofs show instantly; storage proofs are fetched with the admin login)
    box.querySelectorAll(".college-receipt").forEach(async (holder) => {
      const r = list.find((x) => x.ref_code === holder.dataset.ref);
      try {
        const src = await proofSrc(r);
        holder.innerHTML = src
          ? `<a href="${escapeHtml(src)}" target="_blank" rel="noopener"><img src="${escapeHtml(src)}" alt="Payment receipt ${escapeHtml(r.ref_code)}" /></a>`
          : '<span class="pay-badge pay-warn">⚠ No receipt uploaded</span>';
      } catch (e) {
        holder.innerHTML = '<span class="pay-badge pay-warn">⚠ Could not load receipt</span>';
      }
    });
    const btn = $("college-receipt");
    if (btn) btn.addEventListener("click", () => openReceipt(label, list));
  }

  // Printable fee receipt for a college: every sport, amounts, UTRs and the uploaded payment screenshots.
  async function openReceipt(label, list) {
    const w = window.open("", "_blank");
    if (!w) {
      alert("Allow pop-ups for this page to open the receipt.");
      return;
    }
    w.document.write("<p style='font-family:sans-serif'>Preparing receipt…</p>");
    const t = collegeTotals(list);
    const shots = [];
    for (const r of list) {
      if (isStandard(r)) continue;
      let src = "";
      try {
        src = await proofSrc(r);
      } catch (_) {}
      shots.push({ r, src });
    }
    const rowsHtml = list
      .map(
        (r) =>
          `<tr><td>${escapeHtml(sportName(r.sport))} · ${escapeHtml(catLabel(r.category))}</td><td>${escapeHtml(r.ref_code)}</td><td>${escapeHtml(
            r.payment_txn_id || "—"
          )}</td><td class="n">${isStandard(r) ? "—" : money(feeOf(r))}</td><td class="n">${isStandard(r) ? "—" : money(paidOf(r))}</td><td>${escapeHtml(
            isStandard(r) ? "Standard" : r.status || "pending"
          )}</td></tr>`
      )
      .join("");
    const shotsHtml = shots
      .map(
        ({ r, src }) =>
          `<figure><figcaption>${escapeHtml(sportName(r.sport))} · ${escapeHtml(catLabel(r.category))} · ${escapeHtml(r.ref_code)} · UTR ${escapeHtml(
            r.payment_txn_id || "—"
          )}</figcaption>${src ? `<img src="${escapeHtml(src)}" />` : "<em>No receipt uploaded</em>"}</figure>`
      )
      .join("");
    const balanceTxt = t.balance > 0 ? money(t.balance) + " pending" : t.balance < 0 ? money(-t.balance) + " extra" : "Settled";
    w.document.open();
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>AURA 2026 fee receipt · ${escapeHtml(label)}</title>
<style>
 body{font-family:Arial,Helvetica,sans-serif;color:#111;margin:32px;max-width:900px}
 h1{margin:0;font-size:22px} .sub{color:#555;margin:2px 0 18px;font-size:13px}
 .brand{border-bottom:3px solid #2f5bff;padding-bottom:10px;margin-bottom:16px}
 table{width:100%;border-collapse:collapse;font-size:13px;margin:10px 0}
 th,td{border:1px solid #ccd3e3;padding:7px 9px;text-align:left} th{background:#0b1220;color:#fff;font-size:11px;letter-spacing:.05em;text-transform:uppercase}
 td.n,th.n{text-align:right} tfoot td{font-weight:700;background:#eef2ff}
 figure{margin:14px 0;page-break-inside:avoid} figcaption{font-size:12px;color:#444;margin-bottom:4px} figure img{max-width:340px;border:1px solid #ccd3e3}
 .note{font-size:11px;color:#777;margin-top:18px} button{padding:8px 14px;margin-bottom:14px}
 @media print{button{display:none} body{margin:14px}}
</style></head><body>
<button onclick="window.print()">Print / Save as PDF</button>
<div class="brand"><h1>AURA 2026 · Fee receipt</h1><div class="sub">Chaitanya Kreeda · CBIT · 7–9 October 2026</div></div>
<p><strong>College:</strong> ${escapeHtml(label)}<br><strong>Generated:</strong> ${new Date().toLocaleString("en-IN")}</p>
<table><thead><tr><th>Sport · category</th><th>Ref</th><th>UTR</th><th class="n">Fee</th><th class="n">Paid</th><th>Status</th></tr></thead><tbody>${rowsHtml}</tbody>
<tfoot><tr><td colspan="3">Total</td><td class="n">${money(t.fee)}</td><td class="n">${money(t.paid)}</td><td>${balanceTxt}</td></tr></tfoot></table>
<h3 style="font-size:14px;margin-top:22px">Payment screenshots</h3>${shotsHtml || "<em>None</em>"}
<p class="note">Generated from the AURA 2026 admin desk. Amounts are as entered by the team and checked against the sport fee.</p>
</body></html>`);
    w.document.close();
  }

  // ---- confirmed teams & money collected (verified teams only; CBIT / MGIT standard teams not counted) ----
  function renderConfirmed(rows) {
    const card = $("confirmed-card");
    const bodyEl = $("confirmed-body");
    if (!card || !bodyEl) return;
    const verified = rows.filter((r) => r.status === "verified" && !isStandard(r));
    if (!verified.length) {
      card.hidden = true;
      return;
    }
    card.hidden = false;
    const utrIndex = buildUtrIndex(rows);
    const adj = CFG.REVENUE_ADJUST || {};
    const totals = adj.sportTotals || {};

    const groups = allGroups(verified).filter((g) => verified.some((r) => `${r.sport}|${r.category}` === g.key));
    const sportsOrder = [...new Set(groups.map((g) => g.sport))];
    const moneyRows = [];
    let totalMoney = 0;
    let html = "";

    sportsOrder.forEach((sp) => {
      const cats = groups.filter((g) => g.sport === sp);
      const sportTeams = verified.filter((r) => r.sport === sp);
      html += `<h3 class="confirmed-sport">${escapeHtml(sportName(sp))} <small style="color:var(--text-3)">· ${sportTeams.length} confirmed</small></h3><div class="confirmed-cats">`;
      cats.forEach((g) => {
        const teams = verified
          .filter((r) => `${r.sport}|${r.category}` === g.key)
          .sort((a, b) => collegeOf(a).label.localeCompare(collegeOf(b).label));
        const fee = teams.reduce((t, r) => t + feeOf(r), 0);
        const agreed = totals[sp] != null;
        if (!agreed || cats[0] === g) {
          // agreed sport totals are shown once, on the sport's first row
        }
        moneyRows.push({ sport: sp, label: g.label, n: teams.length, fee, teams });
        html += `<div class="confirmed-cat"><h4><span>${escapeHtml(catLabel(g.category))}</span><span style="color:var(--blue-soft)">${teams.length} team${teams.length === 1 ? "" : "s"}</span></h4><ol>${teams
          .map((r) => {
            const c = paymentCheck(r, utrIndex);
            const warn = c.ok ? "" : ` <span class="confirmed-warn" title="${escapeHtml(c.text)}">⚠ ${escapeHtml(c.text)}</span>`;
            return `<li>${escapeHtml(collegeOf(r).label)}${warn}<br><small class="confirmed-meta">UTR ${escapeHtml(r.payment_txn_id || "—")} · Paid ${money(paidOf(r))} of ${money(feeOf(r))} · ${escapeHtml(r.captain_name || "")} ${escapeHtml(r.captain_phone || "")} · <code>${escapeHtml(r.ref_code)}</code></small></li>`;
          })
          .join("")}</ol></div>`;
      });
      html += "</div>";
    });

    // money table: per sport/category, with an agreed total replacing a sport's sum when configured
    const doneAgreed = new Set();
    let tableRows = "";
    moneyRows.forEach((m) => {
      let amount = m.fee;
      let feeCell = money(feeOfFirst(m.teams));
      if (totals[m.sport] != null) {
        const sportSum = moneyRows.filter((x) => x.sport === m.sport).reduce((t, x) => t + x.n, 0);
        feeCell = "agreed total";
        if (!doneAgreed.has(m.sport)) {
          amount = totals[m.sport];
          doneAgreed.add(m.sport);
        } else amount = 0;
        void sportSum;
      }
      totalMoney += amount;
      tableRows += `<tr><td>${escapeHtml(m.label)}</td><td>${m.n}</td><td>${feeCell}</td><td>${amount ? money(amount) : "included above"}</td></tr>`;
    });
    (adj.extras || []).forEach((x) => {
      totalMoney += Number(x.amount) || 0;
      tableRows += `<tr><td>${escapeHtml(x.label)}</td><td></td><td></td><td>${money(x.amount)}</td></tr>`;
    });

    $("confirmed-headline").textContent = `${verified.length} teams · ${money(totalMoney)} collected`;
    const stats = `
      <div class="admin-stats" style="margin:0.9rem 0 0.4rem">
        <div class="admin-stat"><span class="n">${verified.length}</span><span class="l">Confirmed teams</span></div>
        <div class="admin-stat"><span class="n">${sportsOrder.length}</span><span class="l">Sports</span></div>
        <div class="admin-stat"><span class="n">${groups.length}</span><span class="l">Categories</span></div>
        <div class="admin-stat"><span class="n">${money(totalMoney)}</span><span class="l">Money collected</span></div>
      </div>
      <p class="form-note" style="margin:0 0 0.4rem">Every verified team counted at the fee it was charged, as if paid in full. CBIT &amp; MGIT (standard teams) are not counted. ⚠ marks a verified team whose payment check needs a look.</p>`;
    const table = `<h3 class="confirmed-sport">Money collected</h3>
      <table class="money-table"><thead><tr><th>Sport · category</th><th>Teams</th><th>Fee</th><th>Amount</th></tr></thead><tbody>${tableRows}</tbody>
      <tfoot><tr><td>Total</td><td>${verified.length}</td><td></td><td>${money(totalMoney)}</td></tr></tfoot></table>`;
    // college-wise: every sport a college is confirmed in, with UTR, amounts and contacts
    const byCollege = new Map();
    verified.forEach((r) => {
      const c = collegeOf(r);
      const e = byCollege.get(c.key) || { label: c.label, list: [] };
      e.list.push(r);
      byCollege.set(c.key, e);
    });
    const collegeRowsHtml = [...byCollege.values()]
      .sort((a, b) => a.label.localeCompare(b.label))
      .map((e) => {
        const tt = collegeTotals(e.list);
        const head = `<tr class="college-row"><td colspan="7"><strong>${escapeHtml(e.label)}</strong> · ${e.list.length} team${
          e.list.length === 1 ? "" : "s"
        } · Fee ${money(tt.fee)} · Paid ${money(tt.paid)}${
          tt.balance > 0 ? ` · <span class="confirmed-warn">${money(tt.balance)} pending</span>` : tt.balance < 0 ? ` · ${money(-tt.balance)} extra` : ""
        }</td></tr>`;
        const lines = e.list
          .sort((a, b) => `${a.sport}${a.category}`.localeCompare(`${b.sport}${b.category}`))
          .map(
            (r) => `<tr><td>${escapeHtml(sportName(r.sport))} · ${escapeHtml(catLabel(r.category))}</td><td><code>${escapeHtml(r.ref_code)}</code></td><td>${escapeHtml(
              r.payment_txn_id || "—"
            )}</td><td>${money(feeOf(r))}</td><td>${money(paidOf(r))}</td><td>${escapeHtml(r.captain_name || "")}<br><small>${escapeHtml(
              r.captain_phone || ""
            )}<br>${escapeHtml(r.captain_email || "")}</small></td><td>${escapeHtml(r.pd_name || "—")}<br><small>${escapeHtml(r.pd_phone || "")}</small></td></tr>`
          )
          .join("");
        return head + lines;
      })
      .join("");
    const collegeTable = `<h3 class="confirmed-sport">College-wise details</h3>
      <div style="overflow-x:auto"><table class="money-table college-detail"><thead><tr><th>Sport · category</th><th>Ref</th><th>UTR</th><th>Fee</th><th>Paid</th><th>Captain</th><th>PD / contact</th></tr></thead><tbody>${collegeRowsHtml}</tbody></table></div>`;
    bodyEl.innerHTML = stats + html + table + collegeTable;
  }

  const feeOfFirst = (teams) => (teams.length ? feeOf(teams[0]) : 0);

  // Applies the status / sport·category / search filters currently set in the UI.
  // Shared by render() and the CSV export so "export" always matches what's on screen.
  function filteredRows(rows) {
    const filter = $("filter-status") ? $("filter-status").value : "all";
    const sportF = $("filter-sport") ? $("filter-sport").value : "all";
    const q = ($("search-q") ? $("search-q").value : "").trim().toLowerCase();
    const collegeF = $("filter-college") ? $("filter-college").value : "all";

    let list = rows;
    if (collegeF !== "all") list = list.filter((r) => collegeOf(r).key === collegeF);
    if (filter !== "all") list = list.filter((r) => (r.status || "pending") === filter);
    if (sportF !== "all") {
      const [sp, cat] = sportF.split("|");
      list = list.filter((r) => r.sport === sp && (!cat || r.category === cat));
    }
    if (q) {
      list = list.filter((r) => {
        const blob = [
          r.ref_code,
          r.college_name,
          r.captain_name,
          r.captain_email,
          r.captain_phone,
          r.pd_name,
          sportName(r.sport),
        ]
          .join(" ")
          .toLowerCase();
        return blob.includes(q);
      });
    }
    return list;
  }

  function render(rows) {
    updateStats(rows.filter((r) => !isStandard(r)));
    rebuildSportFilter(rows);
    rebuildCollegeFilter(rows);
    renderCollegeSummary(rows);
    renderConfirmed(rows);

    const list = filteredRows(rows);
    const utrIndex = buildUtrIndex(rows);

    if (!list.length) {
      body.innerHTML = `<tr><td colspan="6" style="color:var(--text-3)">No registrations in this filter.</td></tr>`;
      return;
    }

    body.innerHTML = list
      .map((r) => {
        let proof = "—";
        if (r.payment_screenshot_data) {
          proof = `<a href="${r.payment_screenshot_data}" target="_blank" rel="noopener">View screenshot</a>`;
        } else if (r.payment_screenshot_url && String(r.payment_screenshot_url).startsWith("data:")) {
          proof = `<a href="${r.payment_screenshot_url}" target="_blank" rel="noopener">View screenshot</a>`;
        } else if (r.payment_screenshot_path && !String(r.payment_screenshot_path).startsWith("inline:")) {
          proof = `<button type="button" class="btn btn-ghost act-proof" data-path="${escapeHtml(
            r.payment_screenshot_path
          )}" style="padding:0.35rem 0.6rem;font-size:0.75rem">View screenshot</button>`;
        } else if (r.payment_screenshot_path) {
          proof = escapeHtml(r.payment_screenshot_path);
        }
        return `<tr>
          <td><code>${escapeHtml(r.ref_code)}</code><br><small style="color:var(--text-3)">${escapeHtml((r.created_at || "").slice(0, 16))}</small></td>
          <td><a href="#" class="act-college" data-key="${escapeHtml(collegeOf(r).key)}" title="Show every sport and the fee receipt for this college"><strong>${escapeHtml(r.college_name)}</strong></a>${isStandard(r) ? ' <span class="pay-badge pay-std">Standard</span>' : ""}<br>${escapeHtml(sportName(r.sport))} · ${escapeHtml(catLabel(r.category))}
          <br><small>PD: ${escapeHtml(r.pd_name || "—")} · ${escapeHtml(r.pd_phone || "")}</small></td>
          <td>${escapeHtml(r.captain_name)}<br><small>${escapeHtml(r.captain_phone)}<br>${escapeHtml(r.captain_email)}</small>
          <br>${rosterSummary(r)}</td>
          <td>Fee: ${r.fee_expected != null ? "₹" + escapeHtml(r.fee_expected) : "TBA"}<br>
          Paid: ${escapeHtml(r.payment_amount || "—")}<br>
          UTR: ${escapeHtml(r.payment_txn_id || "—")}<br>
          Scanner: ${escapeHtml(r.payment_scanner_id || "—")}<br>${proof}<br>${payBadge(r, utrIndex)}</td>
          <td><span class="status-pill ${r.status || "pending"}">${escapeHtml(r.status || "pending")}</span></td>
          <td>
            <button type="button" class="btn btn-primary act-verify" data-ref="${escapeHtml(r.ref_code)}" style="padding:0.4rem 0.7rem;font-size:0.75rem;margin:0.15rem">Verify</button>
            <button type="button" class="btn btn-ghost act-reject" data-ref="${escapeHtml(r.ref_code)}" style="padding:0.4rem 0.7rem;font-size:0.75rem;margin:0.15rem">Reject</button>
          </td>
        </tr>`;
      })
      .join("");

    body.querySelectorAll(".act-college").forEach((a) => {
      a.addEventListener("click", (ev) => {
        ev.preventDefault();
        selectCollege(a.dataset.key);
      });
    });
    body.querySelectorAll(".act-verify").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (
          !confirm(
            "Mark this team VERIFIED?\n\nRemember to message the captain on Instagram / WhatsApp (no auto-email yet)."
          )
        )
          return;
        try {
          await updateStatus(btn.dataset.ref, "verified");
          refresh();
        } catch (e) {
          alert("Error: " + (e.message || e));
        }
      });
    });
    body.querySelectorAll(".act-reject").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const note = prompt("Reason for rejection (optional)") || "";
        try {
          await updateStatus(btn.dataset.ref, "rejected", note);
          refresh();
        } catch (e) {
          alert("Error: " + (e.message || e));
        }
      });
    });
    body.querySelectorAll(".act-proof").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const path = btn.dataset.path;
        if (!path || !CFG.SUPABASE_URL) return;
        try {
          const res = await fetch(
            `${CFG.SUPABASE_URL}/storage/v1/object/payment-proofs/${path}`,
            { headers: authHeaders() }
          );
          if (!res.ok) throw new Error(await res.text());
          const blob = await res.blob();
          const obj = URL.createObjectURL(blob);
          window.open(obj, "_blank", "noopener");
        } catch (e) {
          alert("Could not open screenshot: " + (e.message || e));
        }
      });
    });
    body.querySelectorAll(".act-roster").forEach((btn) => {
      btn.addEventListener("click", () => {
        const ref = btn.dataset.ref;
        const row = (cache || []).find((x) => x.ref_code === ref);
        const names = rosterNames(row || {});
        const title = row
          ? `${row.college_name || ""} · ${sportName(row.sport)} · ${row.category || ""}`
          : ref;
        alert(
          `Squad (${names.length}) — ${title}\nRef: ${ref}\n\n` +
            (names.length ? names.map((n, i) => `${i + 1}. ${n}`).join("\n") : "No names saved.")
        );
      });
    });
  }

  let cache = [];

  function syncLoginUI() {
    const card = $("admin-login-card");
    const logout = $("admin-logout-btn");
    const session = getSession();
    if (mode() === "live" && card) {
      card.classList.remove("hidden-step");
      if (logout) logout.hidden = !session;
      if (session && $("login-status")) {
        $("login-status").textContent = "Signed in as " + (session.email || "organiser");
        $("login-status").classList.add("is-ok");
      }
    } else if (card) {
      card.classList.add("hidden-step");
    }
  }

  async function refresh() {
    syncLoginUI();
    if (mode() === "live") {
      const session = getSession();
      modeLabel.textContent = session
        ? "Mode: LIVE · signed in · data from Supabase"
        : "Mode: LIVE · sign in above to load/verify teams (RLS)";
    } else {
      modeLabel.textContent =
        "Mode: DEMO · data only in this browser (submit on register.html first, same device)";
    }
    try {
      if (mode() === "live" && !getSession()) {
        cache = [];
        body.innerHTML = `<tr><td colspan="6" style="color:var(--text-3)">Sign in as an organiser to load live registrations.</td></tr>`;
        updateStats([]);
        return;
      }
      cache = mode() === "live" ? await loadLive() : loadDemo();
      render(cache);
    } catch (e) {
      body.innerHTML = `<tr><td colspan="6" style="color:#ff8a8a">Error: ${escapeHtml(e.message || e)}</td></tr>`;
    }
  }

  $("refresh-list") && $("refresh-list").addEventListener("click", refresh);
  $("filter-status") && $("filter-status").addEventListener("change", () => render(cache));
  $("filter-sport") && $("filter-sport").addEventListener("change", () => render(cache));

  // Picking a college shows ALL its sports, so the status filter steps aside (and comes back on clear).
  let statusBeforeCollege = null;
  function selectCollege(key) {
    const sel = $("filter-college"), st = $("filter-status");
    if (!sel) return;
    if (key !== "all" && sel.value === "all" && st) {
      statusBeforeCollege = st.value;
      st.value = "all";
      if ($("filter-sport")) $("filter-sport").value = "all";
    }
    if (key === "all" && st && statusBeforeCollege != null) {
      st.value = statusBeforeCollege;
      statusBeforeCollege = null;
    }
    sel.value = key;
    render(cache);
    if (key !== "all") {
      const box = $("college-summary");
      if (box && box.scrollIntoView) box.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }
  $("filter-college") && $("filter-college").addEventListener("change", () => selectCollege($("filter-college").value));
  $("search-q") && $("search-q").addEventListener("input", () => render(cache));

  $("admin-login-btn") &&
    $("admin-login-btn").addEventListener("click", async () => {
      const email = ($("login-email") && $("login-email").value.trim()) || "";
      const password = ($("login-password") && $("login-password").value) || "";
      const st = $("login-status");
      if (!email || !password) {
        if (st) st.textContent = "Enter email and password.";
        return;
      }
      if (st) st.textContent = "Signing in…";
      try {
        await login(email, password);
        if (st) {
          st.textContent = "Signed in.";
          st.classList.add("is-ok");
        }
        refresh();
      } catch (e) {
        if (st) {
          st.textContent = "Login failed: " + (e.message || e);
          st.classList.add("is-error");
        }
      }
    });

  $("admin-logout-btn") &&
    $("admin-logout-btn").addEventListener("click", () => {
      setSession(null);
      if ($("login-status")) $("login-status").textContent = "Signed out.";
      refresh();
    });

  $("export-csv") &&
    $("export-csv").addEventListener("click", async () => {
      try {
        // Export exactly what's filtered/visible on screen right now, not every
        // registration — re-apply the current status/sport/search filters to the
        // already-loaded cache instead of re-fetching everything unfiltered.
        const rows = filteredRows(cache);
        if (!rows.length) {
          alert("No registrations match the current filter — nothing to export.");
          return;
        }
        const headers = [
          "ref_code",
          "status",
          "college_name",
          "sport",
          "category",
          "captain_name",
          "captain_phone",
          "captain_email",
          "pd_name",
          "pd_phone",
          "squad_names",
          "squad_count",
          "fee_expected",
          "payment_txn_id",
          "payment_amount",
          "created_at",
          "team_type",
          "payment_check",
        ];
        const utrIndex = buildUtrIndex(cache);
        const lines = [headers.join(",")];
        rows.forEach((r) => {
          const names = rosterNames(r);
          const row = {
            ...r,
            squad_names: names.join(" | "),
            squad_count: names.length,
            team_type: isStandard(r) ? "Standard" : "Registered",
            payment_check: paymentCheck(r, utrIndex).text,
          };
          lines.push(headers.map((h) => `"${String(row[h] ?? "").replace(/"/g, '""')}"`).join(","));
        });
        const blob = new Blob([lines.join("\n")], { type: "text/csv" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        const sportF = $("filter-sport") ? $("filter-sport").value : "all";
        const statusF = $("filter-status") ? $("filter-status").value : "all";
        const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const collegeF = $("filter-college") ? $("filter-college").value : "all";
        const tag = [collegeF !== "all" ? slug(collegeF) : null, sportF !== "all" ? slug(sportF) : null, statusF !== "all" ? slug(statusF) : null]
          .filter(Boolean)
          .join("-");
        a.download = `aura2026-registrations${tag ? "-" + tag : ""}.csv`;
        a.click();
      } catch (e) {
        alert("Export failed: " + (e.message || e));
      }
    });

  refresh();
})();
