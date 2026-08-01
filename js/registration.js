/**
 * AURA 2026 registration
 * Flow: Sport → Details (name, phone, email, college, PD) → Pay (fee + QR + proof) → Pending
 * Live mode only when REGISTRATION_OPEN + Supabase keys; otherwise demo via localStorage.
 */
(function () {
  const CFG = window.AURA_CONFIG || {};
  const open = !!CFG.REGISTRATION_OPEN;
  const sports = CFG.SPORTS || [];
  const $ = (id) => document.getElementById(id);

  const gate = $("gate-closed");
  if (gate) gate.classList.toggle("hidden-step", open);

  const grid = $("sport-pick-grid");
  const sportHidden = $("sport");
  const categorySel = $("category");

  function feeFor(sport, category) {
    if (!sport) return null;
    if (sport.feeByCategory && category && sport.feeByCategory[category] != null) {
      return Number(sport.feeByCategory[category]);
    }
    if (sport.feeRupees == null || sport.feeRupees === "") return null;
    return Number(sport.feeRupees);
  }

  function currentSport() {
    return sports.find((s) => s.id === (sportHidden && sportHidden.value)) || null;
  }

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

  function clearFieldError(el) {
    if (!el) return;
    const wrap = el.closest(".field");
    if (wrap) wrap.classList.remove("has-error");
  }

  function setFieldError(el, msg) {
    if (!el) return false;
    const wrap = el.closest(".field");
    if (wrap) {
      wrap.classList.add("has-error");
      let err = wrap.querySelector(".field-error");
      if (!err) {
        err = document.createElement("p");
        err.className = "field-error";
        wrap.appendChild(err);
      }
      err.textContent = msg || "Required";
    }
    el.focus();
    return false;
  }

  function digitsPhone(v) {
    return String(v || "").replace(/\D/g, "");
  }

  function isValidPhone(v) {
    const d = digitsPhone(v);
    // India: 10 digits, or with country code 91 + 10
    return d.length === 10 || (d.length === 12 && d.startsWith("91"));
  }

  function renderSportGrid() {
    if (!grid) return;
    grid.innerHTML = sports
      .map(
        (s) => `
      <button type="button" class="sport-pick" role="option" data-id="${s.id}" aria-selected="false">
        <span class="sport-pick-name">${s.name}</span>
        <span class="sport-pick-meta">${s.categories.join(" · ")}</span>
      </button>`
      )
      .join("");

    grid.querySelectorAll(".sport-pick").forEach((btn) => {
      btn.addEventListener("click", () => {
        grid.querySelectorAll(".sport-pick").forEach((b) => {
          b.classList.remove("is-selected");
          b.setAttribute("aria-selected", "false");
        });
        btn.classList.add("is-selected");
        btn.setAttribute("aria-selected", "true");
        sportHidden.value = btn.dataset.id;
        syncCategories();
        updateFeeUI();
      });
    });
  }

  function syncCategories() {
    const s = currentSport();
    if (!categorySel) return;
    const allowed = s ? s.categories : ["men", "women"];
    [...categorySel.options].forEach((opt) => {
      if (!opt.value) return;
      opt.hidden = !allowed.includes(opt.value);
      opt.disabled = !allowed.includes(opt.value);
    });
    if (categorySel.value && !allowed.includes(categorySel.value)) categorySel.value = "";
    if (allowed.length === 1) categorySel.value = allowed[0];
  }

  function updateFeeUI() {
    const s = currentSport();
    const cat = categorySel ? categorySel.value : "";
    const fee = feeFor(s, cat);
    const amountEl = $("fee-amount");
    const subEl = $("fee-sub");
    const payAmt = $("payment_amount");
    const banner = $("fee-banner");

    if (fee == null || Number.isNaN(fee)) {
      if (amountEl) amountEl.textContent = "Fee TBA";
      if (subEl)
        subEl.textContent =
          "Entry fee will appear here once costs are finalised for this sport.";
      if (payAmt) {
        payAmt.value = "";
        payAmt.placeholder = "As per published fee";
      }
      if (banner) banner.classList.add("is-tba");
    } else {
      if (amountEl) amountEl.textContent = "₹" + fee.toLocaleString("en-IN");
      if (subEl)
        subEl.textContent = `Pay exactly ₹${fee.toLocaleString("en-IN")} for ${s.name}${
          cat ? " · " + cat : ""
        }. Use the official QR only.`;
      if (payAmt) {
        payAmt.value = String(fee);
        payAmt.placeholder = String(fee);
      }
      if (banner) banner.classList.remove("is-tba");
    }
  }

  function setupPaymentQr() {
    const img = $("payment-qr");
    const ph = $("payment-qr-ph");
    if (!img) return;
    const path = CFG.PAYMENT_QR_PATH || "assets/payment-qr.png";
    img.onload = () => {
      img.hidden = false;
      if (ph) ph.hidden = true;
    };
    img.onerror = () => {
      img.hidden = true;
      if (ph) ph.hidden = false;
    };
    img.src = path + (path.includes("?") ? "&" : "?") + "v=1";
  }

  function fillReview() {
    const s = currentSport();
    const el = $("reg-review-body");
    if (!el || !s) return;
    el.innerHTML = `
      <strong>${s.name}</strong> · ${categorySel.value}<br>
      ${$("college").value.trim()}<br>
      ${$("captain_name").value.trim()} · ${$("captain_phone").value.trim()} · ${$("captain_email").value.trim()}<br>
      PD: ${$("pd_name").value.trim()} · ${$("pd_phone").value.trim()}
    `;
  }

  function validateStep1() {
    if (!sportHidden || !sportHidden.value) {
      alert("Please select a sport.");
      return false;
    }
    if (!categorySel || !categorySel.value) {
      alert("Please select Men or Women category.");
      return false;
    }
    const s = currentSport();
    if (s && !s.categories.includes(categorySel.value)) {
      alert("That category is not available for this sport.");
      return false;
    }
    return true;
  }

  function validateStep2() {
    const checks = [
      ["college", "College name is required"],
      ["captain_name", "Your name is required"],
      ["captain_phone", "Phone number is required"],
      ["captain_email", "Email ID is required"],
      ["pd_name", "Physical director name is required"],
      ["pd_phone", "Physical director phone is required"],
    ];
    for (const [id] of checks) clearFieldError($(id));

    for (const [id, msg] of checks) {
      const el = $(id);
      if (!el || !el.value.trim()) return setFieldError(el, msg);
    }

    const emailEl = $("captain_email");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value.trim())) {
      return setFieldError(emailEl, "Enter a valid email address");
    }

    const phoneEl = $("captain_phone");
    if (!isValidPhone(phoneEl.value)) {
      return setFieldError(phoneEl, "Enter a valid 10-digit mobile number");
    }

    const pdPhone = $("pd_phone");
    if (!isValidPhone(pdPhone.value)) {
      return setFieldError(pdPhone, "Enter a valid 10-digit mobile number");
    }

    return true;
  }

  function genRef() {
    return "AURA-" + Math.random().toString(36).slice(2, 10).toUpperCase();
  }

  function demoStore(record) {
    const key = "aura2026_registrations";
    const arr = JSON.parse(localStorage.getItem(key) || "[]");
    arr.unshift(record);
    localStorage.setItem(key, JSON.stringify(arr));
  }

  async function submitLive(record, file) {
    const url = CFG.SUPABASE_URL;
    const key = CFG.SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error("Supabase not configured");

    let payment_screenshot_path = null;
    if (file) {
      const safeName = file.name.replace(/[^\w.\-]+/g, "_");
      const path = `payments/${record.ref_code}/${Date.now()}-${safeName}`;
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
      if (!up.ok) throw new Error("Screenshot upload failed — try a smaller image");
      payment_screenshot_path = path;
    }

    const body = {
      college_name: record.college_name,
      sport: record.sport,
      category: record.category,
      captain_name: record.captain_name,
      captain_phone: record.captain_phone,
      captain_email: record.captain_email,
      pd_name: record.pd_name,
      pd_phone: record.pd_phone,
      players: [],
      payment_txn_id: record.payment_txn_id,
      payment_amount: record.payment_amount,
      fee_expected: record.fee_expected,
      payment_screenshot_path,
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
    if (!res.ok) throw new Error((await res.text()) || "Submit failed");
    return (await res.json())[0] || body;
  }

  // --- Events ---
  $("to-step-2") &&
    $("to-step-2").addEventListener("click", () => {
      if (!validateStep1()) return;
      const s = currentSport();
      if ($("summary-sport")) {
        $("summary-sport").textContent = `${s.name} · ${categorySel.value}`;
      }
      goStep(2);
    });

  $("back-1") && $("back-1").addEventListener("click", () => goStep(1));

  $("to-step-3") &&
    $("to-step-3").addEventListener("click", () => {
      if (!validateStep2()) return;
      fillReview();
      updateFeeUI();
      setupPaymentQr();
      goStep(3);
    });

  $("back-2") && $("back-2").addEventListener("click", () => goStep(2));
  categorySel && categorySel.addEventListener("change", updateFeeUI);

  // Clear errors on input
  ["college", "captain_name", "captain_phone", "captain_email", "pd_name", "pd_phone"].forEach((id) => {
    const el = $(id);
    if (el) el.addEventListener("input", () => clearFieldError(el));
  });

  $("submit-reg") &&
    $("submit-reg").addEventListener("click", async () => {
      const status = $("submit-status");
      const fileInput = $("payment_file");
      const file = fileInput && fileInput.files && fileInput.files[0];
      const s = currentSport();
      const fee = feeFor(s, categorySel.value);
      const btn = $("submit-reg");

      if (status) {
        status.classList.remove("is-error", "is-ok");
        status.textContent = "";
      }

      if (open) {
        if (fee != null && !$("payment_amount").value.trim()) {
          if (status) {
            status.classList.add("is-error");
            status.textContent = "Enter the amount you paid.";
          }
          return;
        }
        if (!file) {
          if (status) {
            status.classList.add("is-error");
            status.textContent = "Please upload a payment screenshot.";
          }
          return;
        }
        if (!$("payment_txn").value.trim()) {
          if (status) {
            status.classList.add("is-error");
            status.textContent = "Please enter the transaction / UTR ID.";
          }
          return;
        }
      }

      const record = {
        ref_code: genRef(),
        created_at: new Date().toISOString(),
        college_name: $("college").value.trim(),
        sport: sportHidden.value,
        category: categorySel.value,
        captain_name: $("captain_name").value.trim(),
        captain_phone: $("captain_phone").value.trim(),
        captain_email: $("captain_email").value.trim(),
        pd_name: $("pd_name").value.trim(),
        pd_phone: $("pd_phone").value.trim(),
        payment_txn_id: $("payment_txn").value.trim(),
        payment_amount: $("payment_amount").value.trim(),
        fee_expected: fee,
        payment_screenshot_name: file ? file.name : null,
        payment_screenshot_data: null,
        status: "pending",
      };

      if (status) status.textContent = "Submitting…";
      if (btn) btn.disabled = true;

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
        if (status) {
          status.classList.add("is-ok");
          status.textContent = open
            ? "Submitted. Status: pending verification."
            : "Demo saved on this device. Open admin.html to verify.";
        }
        goStep(4);
      } catch (err) {
        console.error(err);
        if (status) {
          status.classList.add("is-error");
          status.textContent = "Error: " + (err.message || err);
        }
      } finally {
        if (btn) btn.disabled = false;
      }
    });

  renderSportGrid();
})();
