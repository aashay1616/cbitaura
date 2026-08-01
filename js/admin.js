/**
 * AURA 2026 admin desk — verify payment screenshots
 * Demo: localStorage   Live: Supabase REST when configured
 */
(function () {
  const CFG = window.AURA_CONFIG || {};
  const $ = (id) => document.getElementById(id);
  const body = $("admin-body");
  const modeLabel = $("admin-mode-label");

  function mode() {
    if (CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY) return "live";
    return "demo";
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
    const url = CFG.SUPABASE_URL;
    const key = CFG.SUPABASE_ANON_KEY;
    const res = await fetch(
      `${url}/rest/v1/registrations?select=*&order=created_at.desc`,
      {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
      }
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
      // Email is not sent in demo — wire Edge Function in live mode
      return;
    }
    // Live update + optional edge function for email
    const url = CFG.SUPABASE_URL;
    const key = CFG.SUPABASE_ANON_KEY;
    const res = await fetch(
      `${url}/rest/v1/registrations?ref_code=eq.${encodeURIComponent(ref)}`,
      {
        method: "PATCH",
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
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
    // Trigger confirmation email edge function when verified
    if (status === "verified") {
      try {
        await fetch(`${url}/functions/v1/send-confirmation`, {
          method: "POST",
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ref_code: ref }),
        });
      } catch (_) {
        /* optional until function deployed */
      }
    }
  }

  function sportName(id) {
    const s = (CFG.SPORTS || []).find((x) => x.id === id);
    return s ? s.name : id;
  }

  function render(rows) {
    const filter = $("filter-status").value;
    const list = filter === "all" ? rows : rows.filter((r) => r.status === filter);
    if (!list.length) {
      body.innerHTML = `<tr><td colspan="6" style="color:var(--text-3)">No registrations in this filter.</td></tr>`;
      return;
    }
    body.innerHTML = list
      .map((r) => {
        const proof = r.payment_screenshot_data
          ? `<a href="${r.payment_screenshot_data}" target="_blank" rel="noopener">View screenshot</a>`
          : r.payment_screenshot_path || r.payment_txn_id || "—";
        return `<tr data-ref="${r.ref_code}">
          <td><code>${r.ref_code || "—"}</code><br><small style="color:var(--text-3)">${(r.created_at || "").slice(0, 16)}</small></td>
          <td><strong>${escapeHtml(r.college_name || "")}</strong><br>${escapeHtml(sportName(r.sport))} · ${escapeHtml(r.category || "")}<br><small>${(r.players || []).length} players</small></td>
          <td>${escapeHtml(r.captain_name || "")}<br><small>${escapeHtml(r.captain_phone || "")}<br>${escapeHtml(r.captain_email || "")}</small></td>
          <td>${escapeHtml(r.payment_amount || "—")} · ${escapeHtml(r.payment_txn_id || "—")}<br>${proof}</td>
          <td><span class="status-pill ${r.status || "pending"}">${r.status || "pending"}</span></td>
          <td>
            <button type="button" class="btn btn-primary act-verify" data-ref="${r.ref_code}" style="padding:0.4rem 0.7rem;font-size:0.75rem;margin:0.15rem">Verify</button>
            <button type="button" class="btn btn-ghost act-reject" data-ref="${r.ref_code}" style="padding:0.4rem 0.7rem;font-size:0.75rem;margin:0.15rem">Reject</button>
          </td>
        </tr>`;
      })
      .join("");

    body.querySelectorAll(".act-verify").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!confirm("Mark verified and queue confirmation email?")) return;
        await updateStatus(btn.dataset.ref, "verified");
        refresh();
      });
    });
    body.querySelectorAll(".act-reject").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const note = prompt("Reason (optional)") || "";
        await updateStatus(btn.dataset.ref, "rejected", note);
        refresh();
      });
    });
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  async function refresh() {
    modeLabel.textContent =
      mode() === "live"
        ? "Mode: LIVE (Supabase)"
        : "Mode: DEMO (browser localStorage) — submissions from this device only";
    try {
      const rows = mode() === "live" ? await loadLive() : loadDemo();
      render(rows);
    } catch (e) {
      body.innerHTML = `<tr><td colspan="6" style="color:#ff8a8a">Error: ${escapeHtml(e.message || e)}</td></tr>`;
    }
  }

  $("refresh-list") && $("refresh-list").addEventListener("click", refresh);
  $("filter-status") && $("filter-status").addEventListener("change", refresh);
  $("export-csv") &&
    $("export-csv").addEventListener("click", async () => {
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
        "payment_txn_id",
        "payment_amount",
        "created_at",
      ];
      const lines = [headers.join(",")];
      rows.forEach((r) => {
        lines.push(
          headers
            .map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`)
            .join(",")
        );
      });
      const blob = new Blob([lines.join("\n")], { type: "text/csv" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "aura2026-registrations.csv";
      a.click();
    });

  refresh();
})();
