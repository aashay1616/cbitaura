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

  function fillSportFilter(rows) {
    const sel = $("filter-sport");
    if (!sel || sel.dataset.ready === "1") return;
    const ids = [...new Set(rows.map((r) => r.sport).filter(Boolean))];
    ids.sort().forEach((id) => {
      const opt = document.createElement("option");
      opt.value = id;
      opt.textContent = sportName(id);
      sel.appendChild(opt);
    });
    sel.dataset.ready = "1";
  }

  function render(rows) {
    updateStats(rows);
    fillSportFilter(rows);

    const filter = $("filter-status") ? $("filter-status").value : "all";
    const sportF = $("filter-sport") ? $("filter-sport").value : "all";
    const q = ($("search-q") ? $("search-q").value : "").trim().toLowerCase();

    let list = rows;
    if (filter !== "all") list = list.filter((r) => (r.status || "pending") === filter);
    if (sportF !== "all") list = list.filter((r) => r.sport === sportF);
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

    if (!list.length) {
      body.innerHTML = `<tr><td colspan="6" style="color:var(--text-3)">No registrations in this filter.</td></tr>`;
      return;
    }

    body.innerHTML = list
      .map((r) => {
        const proof = r.payment_screenshot_data
          ? `<a href="${r.payment_screenshot_data}" target="_blank" rel="noopener">View screenshot</a>`
          : escapeHtml(r.payment_screenshot_path || "—");
        return `<tr>
          <td><code>${escapeHtml(r.ref_code)}</code><br><small style="color:var(--text-3)">${escapeHtml((r.created_at || "").slice(0, 16))}</small></td>
          <td><strong>${escapeHtml(r.college_name)}</strong><br>${escapeHtml(sportName(r.sport))} · ${escapeHtml(r.category)}
          <br><small>PD: ${escapeHtml(r.pd_name || "—")} · ${escapeHtml(r.pd_phone || "")}</small></td>
          <td>${escapeHtml(r.captain_name)}<br><small>${escapeHtml(r.captain_phone)}<br>${escapeHtml(r.captain_email)}</small></td>
          <td>Fee: ${r.fee_expected != null ? "₹" + escapeHtml(r.fee_expected) : "TBA"}<br>
          Paid: ${escapeHtml(r.payment_amount || "—")}<br>
          UTR: ${escapeHtml(r.payment_txn_id || "—")}<br>${proof}</td>
          <td><span class="status-pill ${r.status || "pending"}">${escapeHtml(r.status || "pending")}</span></td>
          <td>
            <button type="button" class="btn btn-primary act-verify" data-ref="${escapeHtml(r.ref_code)}" style="padding:0.4rem 0.7rem;font-size:0.75rem;margin:0.15rem">Verify + email</button>
            <button type="button" class="btn btn-ghost act-reject" data-ref="${escapeHtml(r.ref_code)}" style="padding:0.4rem 0.7rem;font-size:0.75rem;margin:0.15rem">Reject</button>
          </td>
        </tr>`;
      })
      .join("");

    body.querySelectorAll(".act-verify").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (
          !confirm(
            "Mark this team VERIFIED?\n\nLive mode: captain receives a confirmation email."
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
        const rows = mode() === "live" ? await loadLive() : loadDemo();
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
          "fee_expected",
          "payment_txn_id",
          "payment_amount",
          "created_at",
        ];
        const lines = [headers.join(",")];
        rows.forEach((r) => {
          lines.push(headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(","));
        });
        const blob = new Blob([lines.join("\n")], { type: "text/csv" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "aura2026-registrations.csv";
        a.click();
      } catch (e) {
        alert("Export failed: " + (e.message || e));
      }
    });

  refresh();
})();
