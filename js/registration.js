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
        updateRulesLink();
      });
    });
  }

  function updateRulesLink() {
    const wrap = $("sport-rules-link");
    const a = $("sport-rules-anchor");
    if (!wrap || !a) return;
    const sheets = CFG.RULES_SHEETS || {};
    const id = sportHidden && sportHidden.value;
    const entry = id && sheets[id];
    if (entry) {
      // Open inside site rules viewer (not raw PNG tab)
      a.href = "rules.html?sport=" + encodeURIComponent(id);
      a.textContent = "View " + (currentSport()?.name || "tournament") + " rules →";
      a.removeAttribute("target");
      wrap.hidden = false;
    } else {
      wrap.hidden = true;
      a.href = "rules.html";
    }
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

  function paymentScanners() {
    if (Array.isArray(CFG.PAYMENT_QRS) && CFG.PAYMENT_QRS.length) return CFG.PAYMENT_QRS;
    const legacy = CFG.PAYMENT_QR_PATH || "assets/payment-qr.png";
    return [{ id: "default", label: "Official scanner", file: legacy }];
  }

  let activeScannerId = null;

  function showScanner(sc) {
    const img = $("payment-qr");
    const label = $("payment-scanner-label");
    const note = $("payment-scan-note");
    if (!img || !sc) return;
    activeScannerId = sc.id;
    const path = sc.file || CFG.PAYMENT_QR_PATH || "assets/payment-qr.png";
    img.hidden = false;
    img.src = path + (path.includes("?") ? "&" : "?") + "v=saiteja-upi-v4";
    img.alt = "Scan to pay " + (sc.upiName || sc.label || "AURA");
    if (label) {
      label.hidden = false;
      label.textContent = sc.upiName || sc.label || "Official scanner";
    }
    if (note && CFG.PAYMENT_SCAN_NOTE) {
      note.innerHTML = CFG.PAYMENT_SCAN_NOTE;
    }
    const upiEl = $("payment-upi-id");
    if (upiEl) {
      if (sc.upiId) {
        upiEl.hidden = false;
        upiEl.innerHTML = `UPI ID: <strong>${sc.upiId}</strong>`;
      } else {
        upiEl.hidden = true;
      }
    }
    const tabs = $("payment-scanner-tabs");
    if (tabs) {
      tabs.querySelectorAll("button").forEach((b) => {
        b.classList.toggle("is-active", b.dataset.id === sc.id);
      });
    }
    const sel = $("payment_scanner_used");
    if (sel && sc.id) sel.value = sc.id;
  }

  function setupPaymentQr() {
    const scanners = paymentScanners();
    const tabs = $("payment-scanner-tabs");
    const sel = $("payment_scanner_used");
    if (sel) {
      sel.innerHTML = '<option value="">Select scanner…</option>';
      scanners.forEach((sc) => {
        const opt = document.createElement("option");
        opt.value = sc.id;
        opt.textContent = sc.label || sc.id;
        sel.appendChild(opt);
      });
    }
    if (tabs) {
      if (scanners.length > 1) {
        tabs.hidden = false;
        tabs.innerHTML = "";
        scanners.forEach((sc, i) => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.dataset.id = sc.id;
          btn.textContent = sc.label || `Scanner ${i + 1}`;
          btn.addEventListener("click", () => showScanner(sc));
          tabs.appendChild(btn);
        });
      } else {
        tabs.hidden = true;
        tabs.innerHTML = "";
      }
    }
    showScanner(scanners[0]);
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

  /**
   * Mobile galleries send HEIC / huge PNGs / odd MIME types.
   * Normalize everything to a JPEG blob browsers + Supabase accept.
   */
  async function normalizeProofImage(file) {
    if (!file) return null;

    const loadBitmap = async () => {
      if (typeof createImageBitmap === "function") {
        try {
          return await createImageBitmap(file);
        } catch (_) {
          /* fall through */
        }
      }
      return await new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
          URL.revokeObjectURL(url);
          resolve(img);
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error("Could not read this image. Try JPG/PNG from gallery."));
        };
        img.src = url;
      });
    };

    let bitmap;
    try {
      bitmap = await loadBitmap();
    } catch (err) {
      // Last resort: upload original if it's already a common type
      const t = (file.type || "").toLowerCase();
      if (t.includes("jpeg") || t.includes("jpg") || t.includes("png") || t.includes("webp")) {
        return { blob: file, filename: file.name.replace(/[^\w.\-]+/g, "_") || "payment.jpg" };
      }
      throw err;
    }

    const maxSide = 1920;
    let w = bitmap.width || bitmap.naturalWidth;
    let h = bitmap.height || bitmap.naturalHeight;
    if (!w || !h) {
      if (bitmap.close) bitmap.close();
      throw new Error("Invalid image dimensions.");
    }
    const scale = Math.min(1, maxSide / Math.max(w, h));
    w = Math.max(1, Math.round(w * scale));
    h = Math.max(1, Math.round(h * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bitmap, 0, 0, w, h);
    if (bitmap.close) bitmap.close();

    const toBlob = (q) =>
      new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/jpeg", q));

    let blob = await toBlob(0.85);
    if (blob && blob.size > 2.5 * 1024 * 1024) blob = await toBlob(0.72);
    if (blob && blob.size > 2.5 * 1024 * 1024) blob = await toBlob(0.58);
    if (!blob) throw new Error("Could not process screenshot. Try another photo.");

    return { blob, filename: `payment-${Date.now()}.jpg` };
  }

  async function submitLive(record, file) {
    const url = CFG.SUPABASE_URL;
    const key = CFG.SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error("Supabase not configured");

    let payment_screenshot_path = null;
    let payment_screenshot_url = null;
    if (file) {
      const normalized = await normalizeProofImage(file);
      const path = `payments/${record.ref_code}/${normalized.filename}`;
      const up = await fetch(
        `${url}/storage/v1/object/payment-proofs/${encodeURIComponent(path).replace(/%2F/g, "/")}`,
        {
          method: "POST",
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
            "Content-Type": "image/jpeg",
            Prefer: "return=minimal",
          },
          body: normalized.blob,
        }
      );
      if (!up.ok) {
        let detail = "";
        try {
          detail = await up.text();
        } catch (_) {}
        console.error("Storage upload failed", up.status, detail);
        // Fallback: keep compressed data-URL on the row so registration still works
        // while storage RLS is being fixed.
        if (record.payment_screenshot_data && String(record.payment_screenshot_data).length < 900000) {
          payment_screenshot_url = record.payment_screenshot_data;
          payment_screenshot_path = `inline:${normalized.filename}`;
          console.warn("Using inline screenshot fallback");
        } else {
          throw new Error(
            "Screenshot upload blocked by storage permissions. Ask organisers to run FIX-STORAGE-RLS.sql, then retry."
          );
        }
      } else {
        payment_screenshot_path = path;
      }
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
      payment_screenshot_url,
      status: "pending",
      ref_code: record.ref_code,
    };
    // Only send if present (older DBs may lack this column until FIX-ADD-SCANNER-COLUMN.sql)
    if (record.payment_scanner_id) {
      body.payment_scanner_id = record.payment_scanner_id;
    }

    const postHeaders = {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    };
    let res = await fetch(`${url}/rest/v1/registrations`, {
      method: "POST",
      headers: postHeaders,
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errText = (await res.text()) || "Submit failed";
      // Retry without scanner column if DB schema is behind
      if (/payment_scanner_id/i.test(errText) && body.payment_scanner_id) {
        delete body.payment_scanner_id;
        res = await fetch(`${url}/rest/v1/registrations`, {
          method: "POST",
          headers: postHeaders,
          body: JSON.stringify(body),
        });
      }
      if (!res.ok) {
        const err2 = res.bodyUsed ? errText : (await res.text()) || errText;
        throw new Error(err2 || "Submit failed");
      }
    }
    const saved = (await res.json())[0] || body;

    // Ping organisers (email alert) — non-blocking if function not deployed yet
    try {
      await fetch(`${url}/functions/v1/notify-organisers`, {
        method: "POST",
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ref_code: record.ref_code }),
      });
    } catch (_) {}

    return saved;
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
        payment_scanner_id:
          ($("payment_scanner_used") && $("payment_scanner_used").value) || activeScannerId || null,
        fee_expected: fee,
        payment_screenshot_name: file ? file.name : null,
        payment_screenshot_data: null,
        status: "pending",
      };

      if (status) status.textContent = "Submitting…";
      if (btn) btn.disabled = true;

      try {
        let uploadFile = file;
        if (file) {
          // Always normalize for demo preview + live upload (mobile-friendly)
          try {
            const normalized = await normalizeProofImage(file);
            uploadFile = new File([normalized.blob], normalized.filename, {
              type: "image/jpeg",
            });
            record.payment_screenshot_name = normalized.filename;
          } catch (normErr) {
            console.warn("normalizeProofImage", normErr);
            uploadFile = file;
          }
          record.payment_screenshot_data = await new Promise((resolve, reject) => {
            const r = new FileReader();
            r.onload = () => resolve(r.result);
            r.onerror = reject;
            r.readAsDataURL(uploadFile);
          });
        }

        if (CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY && open) {
          await submitLive(record, uploadFile);
        } else {
          demoStore(record);
        }

        $("final-ref").textContent = record.ref_code;
        if (status) {
          status.classList.add("is-ok");
          status.textContent = open
            ? "Submitted. Status: pending verification."
            : "Demo saved on this device. Organisers will verify shortly.";
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

  // Deep-link: register.html?sport=basketball
  const qs = new URLSearchParams(location.search);
  const pre = qs.get("sport");
  if (pre && sports.some((s) => s.id === pre) && sportHidden) {
    sportHidden.value = pre;
    const btn = grid && grid.querySelector(`.sport-pick[data-id="${pre}"]`);
    if (btn) {
      btn.classList.add("is-selected");
      btn.setAttribute("aria-selected", "true");
    }
    syncCategories();
    updateFeeUI();
    updateRulesLink();
  }
})();
