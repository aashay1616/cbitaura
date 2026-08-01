/**
 * AURA 2026 registration flow
 * Demo mode: localStorage when Supabase keys empty
 * Live mode: Supabase insert + storage upload (when configured)
 */
(function () {
  const CFG = window.AURA_CONFIG || {};
  const open = !!CFG.REGISTRATION_OPEN;
  const sports = CFG.SPORTS || [];

  const $ = (id) => document.getElementById(id);
  const gate = $("gate-closed");
  if (open && gate) gate.classList.add("hidden-step");
  if (!open && gate) gate.classList.remove("hidden-step");

  // Populate sports
  const sportSel = $("sport");
  if (sportSel) {
    sportSel.innerHTML =
      '<option value="">Select sport</option>' +
      sports.map((s) => `<option value="${s.id}">${s.name}</option>`).join("");
  }

  function currentSport() {
    return sports.find((s) => s.id === sportSel.value) || null;
  }

  function syncCategories() {
    const s = currentSport();
    const cat = $("category");
    if (!cat) return;
    const allowed = s ? s.categories : ["men", "women"];
    [...cat.options].forEach((opt) => {
      if (!opt.value) return;
      opt.hidden = !allowed.includes(opt.value);
    });
    if (cat.value && !allowed.includes(cat.value)) cat.value = "";
    updateRosterHint();
  }

  sportSel && sportSel.addEventListener("change", syncCategories);

  function updateRosterHint() {
    const s = currentSport();
    const el = $("roster-hint");
    if (!el) return;
    if (!s) {
      el.textContent = "";
      return;
    }
    el.textContent = ` · ${s.name}: ${s.teamMin}–${s.teamMax} players`;
  }

  // Players
  const list = $("players-list");
  function addPlayerRow(name = "", phone = "") {
    if (!list) return;
    const row = document.createElement("div");
    row.className = "player-row";
    row.innerHTML = `
      <input type="text" class="p-name" placeholder="Player name" value="${name.replace(/"/g, "&quot;")}" />
      <input type="tel" class="p-phone" placeholder="Phone (optional)" value="${phone.replace(/"/g, "&quot;")}" />
      <button type="button" class="p-remove" aria-label="Remove">×</button>
    `;
    row.querySelector(".p-remove").addEventListener("click", () => {
      row.remove();
    });
    list.appendChild(row);
  }

  $("add-player") &&
    $("add-player").addEventListener("click", () => addPlayerRow());

  // start with 1 row
  addPlayerRow();

  function collectPlayers() {
    return [...document.querySelectorAll(".player-row")]
      .map((row) => ({
        name: row.querySelector(".p-name").value.trim(),
        phone: row.querySelector(".p-phone").value.trim(),
      }))
      .filter((p) => p.name);
  }

  // Steps
  function goStep(n) {
    [1, 2, 3, 4].forEach((i) => {
      const el = $("step-" + i);
      if (el) el.classList.toggle("hidden-step", i !== n);
    });
    document.querySelectorAll("#steps-bar .s").forEach((s) => {
      const sn = Number(s.dataset.step);
      s.classList.toggle("active", sn === n);
      s.classList.toggle("done", sn < n);
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function validateStep1() {
    const college = $("college").value.trim();
    const sport = $("sport").value;
    const category = $("category").value;
    const captain_name = $("captain_name").value.trim();
    const captain_phone = $("captain_phone").value.trim();
    const captain_email = $("captain_email").value.trim();
    if (!college || !sport || !category || !captain_name || !captain_phone || !captain_email) {
      alert("Please fill all required team / captain fields.");
      return false;
    }
    const s = currentSport();
    if (s && !s.categories.includes(category)) {
      alert("That category is not available for this sport.");
      return false;
    }
    return true;
  }

  function validateStep2() {
    const s = currentSport();
    const players = collectPlayers();
    if (!s) {
      alert("Select a sport first.");
      return false;
    }
    if (players.length < s.teamMin || players.length > s.teamMax) {
      alert(`Roster must be ${s.teamMin}–${s.teamMax} players for ${s.name}. You have ${players.length}.`);
      return false;
    }
    return true;
  }

  $("to-step-2") &&
    $("to-step-2").addEventListener("click", () => {
      if (validateStep1()) {
        // seed empty rows to min
        const s = currentSport();
        while (list.children.length < (s ? s.teamMin : 1)) addPlayerRow();
        updateRosterHint();
        goStep(2);
      }
    });
  $("back-1") && $("back-1").addEventListener("click", () => goStep(1));
  $("to-step-3") &&
    $("to-step-3").addEventListener("click", () => {
      if (validateStep2()) {
        setupPaymentQr();
        goStep(3);
      }
    });
  $("back-2") && $("back-2").addEventListener("click", () => goStep(2));

  function setupPaymentQr() {
    const img = $("payment-qr");
    const ph = $("payment-qr-ph");
    if (!img) return;
    const path = CFG.PAYMENT_QR_PATH || "assets/payment-qr.png";
    img.src = path;
    img.onload = () => {
      img.hidden = false;
      if (ph) ph.hidden = true;
    };
    img.onerror = () => {
      img.hidden = true;
      if (ph) ph.hidden = false;
    };
    // force check
    img.src = path + "?t=" + Date.now();
  }

  function genRef() {
    const a = Math.random().toString(36).slice(2, 6).toUpperCase();
    const b = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `AURA-${a}${b}`;
  }

  function demoStore(record) {
    const key = "aura2026_registrations";
    const arr = JSON.parse(localStorage.getItem(key) || "[]");
    arr.unshift(record);
    localStorage.setItem(key, JSON.stringify(arr));
  }

  async function submitLive(record, file) {
    // Placeholder for Supabase — plugged in when keys exist
    const url = CFG.SUPABASE_URL;
    const key = CFG.SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error("Supabase not configured");

    // Dynamic import not available offline; use fetch REST
    let screenshot_path = null;
    let screenshot_url = null;
    if (file) {
      const path = `payments/${record.ref_code}/${Date.now()}-${file.name.replace(/[^\w.\-]+/g, "_")}`;
      const up = await fetch(`${url}/storage/v1/object/payment-proofs/${path}`, {
        method: "POST",
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          "Content-Type": file.type || "image/jpeg",
          "x-upsert": "true",
        },
        body: file,
      });
      if (!up.ok) throw new Error("Screenshot upload failed");
      screenshot_path = path;
    }

    const body = {
      college_name: record.college_name,
      sport: record.sport,
      category: record.category,
      team_name: record.team_name,
      captain_name: record.captain_name,
      captain_phone: record.captain_phone,
      captain_email: record.captain_email,
      players: record.players,
      payment_txn_id: record.payment_txn_id,
      payment_amount: record.payment_amount,
      payment_screenshot_path: screenshot_path,
      payment_screenshot_url: screenshot_url,
      status: "pending",
      ref_code: record.ref_code,
    };

    const res = await fetch(`${url}/rest/v1/registrations`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(t || "Submit failed");
    }
    return (await res.json())[0] || body;
  }

  $("submit-reg") &&
    $("submit-reg").addEventListener("click", async () => {
      const status = $("submit-status");
      const fileInput = $("payment_file");
      const file = fileInput && fileInput.files && fileInput.files[0];

      if (open && !file) {
        alert("Please upload a payment screenshot.");
        return;
      }

      const record = {
        ref_code: genRef(),
        created_at: new Date().toISOString(),
        college_name: $("college").value.trim(),
        team_name: $("team_name").value.trim(),
        sport: $("sport").value,
        category: $("category").value,
        captain_name: $("captain_name").value.trim(),
        captain_phone: $("captain_phone").value.trim(),
        captain_email: $("captain_email").value.trim(),
        players: collectPlayers(),
        payment_txn_id: $("payment_txn").value.trim(),
        payment_amount: $("payment_amount").value.trim(),
        payment_screenshot_name: file ? file.name : null,
        // demo only: store as data URL for admin preview
        payment_screenshot_data: null,
        status: "pending",
      };

      status.textContent = "Submitting…";

      try {
        if (file) {
          record.payment_screenshot_data = await new Promise((resolve, reject) => {
            const r = new FileReader();
            r.onload = () => resolve(r.result);
            r.onerror = reject;
            r.readAsDataURL(file);
          });
        }

        if (CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY && open) {
          await submitLive(record, file);
        } else {
          demoStore(record);
        }

        $("final-ref").textContent = record.ref_code;
        $("final-status").textContent = "Pending verification";
        $("final-status").className = "status-pill pending";
        status.textContent = open
          ? "Submitted. Status: pending."
          : "Demo saved in this browser. Status: pending. (Flip REGISTRATION_OPEN + Supabase when ready.)";
        goStep(4);
      } catch (err) {
        console.error(err);
        status.textContent = "Error: " + (err.message || err);
      }
    });

  // deep-link demo mode message
  syncCategories();
})();
