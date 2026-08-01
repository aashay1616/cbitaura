# AURA 2026 — Registration system

Built now, **opened later** when rules + entry fees + payment QR are final.

`REGISTRATION_OPEN` stays `false` until then. Demo mode still works end-to-end.

---

## Captain journey

```
1. register.html
2. Choose sport + category (men / women)
3. Details → name, phone, email, college name,
             Physical Director name + phone
4. Payment → fee from config (or “Fee TBA”),
             official QR, UTR, amount, screenshot
5. Submit → status = PENDING · ref code shown
6. Organiser verifies in admin.html
7. VERIFIED → confirmation email (when Edge Function is live)
   or REJECTED with optional note
```

---

## Files

| File | Role |
|------|------|
| `register.html` | 4-step form (Sport → Details → Payment → Done) |
| `admin.html` | Verify / reject / export CSV |
| `js/config.js` | Open switch, Supabase keys, sports + fees |
| `js/registration.js` | Form logic (demo + live) |
| `js/admin.js` | Desk + status actions + CSV |
| `supabase/schema.sql` | Table, RLS, storage bucket |
| `assets/payment-qr.png` | **You add** when ready |

Home `#register` shows the same 4-step path.

---

## Config: fees (set when decided)

In `js/config.js` per sport:

```js
{ id: "cricket", name: "Cricket", categories: ["men"], feeRupees: 2500 }
// or different by category:
{ id: "basketball", name: "Basketball", categories: ["men", "women"],
  feeRupees: null,
  feeByCategory: { men: 2000, women: 1500 } }
```

- `null` → UI shows **Fee TBA** (current state)
- number → payment step shows **Pay ₹X** and pre-fills amount

QR path: `PAYMENT_QR_PATH: "assets/payment-qr.png"`

---

## Demo mode (works today)

1. Open `register.html`
2. Walk through all steps and submit (payment fields optional in demo)
3. Open `admin.html` in the **same browser**
4. See **pending** → Verify / Reject / Export CSV

Data lives in `localStorage` key `aura2026_registrations` until Supabase is connected.

---

## Go-live checklist

### A. Content
1. Final rules (link or PDF later)
2. Entry fees per sport (and category if needed) in `config.js`
3. Official payment QR → `assets/payment-qr.png`

### B. Supabase
1. Create project at https://supabase.com  
2. SQL editor → run `supabase/schema.sql`  
3. Confirm storage bucket `payment-proofs`  
4. Auth → organiser login(s)  
5. Replace `admin@example.com` in policies with real emails  
6. In `js/config.js`:

```js
REGISTRATION_OPEN: true,
SUPABASE_URL: "https://xxxx.supabase.co",
SUPABASE_ANON_KEY: "eyJ...",
```

### C. Confirmation email
Deploy Edge Function `send-confirmation` (Resend / SendGrid / SMTP).  
`admin.js` already POSTs `/functions/v1/send-confirmation` on verify.

### D. Flip switch
- `REGISTRATION_OPEN: true`
- Push to GitHub

---

## Database fields (aligned with form)

| Field | Source |
|-------|--------|
| `sport`, `category` | Step 1 |
| `college_name` | Step 2 |
| `captain_name`, `captain_phone`, `captain_email` | Step 2 |
| `pd_name`, `pd_phone` | Step 2 (Physical Director) |
| `fee_expected` | From config at submit time |
| `payment_txn_id`, `payment_amount`, screenshot path | Step 3 |
| `status` | `pending` → `verified` / `rejected` |
| `ref_code` | Auto `AURA-XXXXXXXX` |

Optional `players` jsonb kept for a future roster step.

---

## Status model

| Status | Meaning |
|--------|---------|
| `pending` | Submitted; payment not checked |
| `verified` | Payment OK; email when wired |
| `rejected` | Invalid / incomplete payment |

---

## Security

- Public **insert** only (registrations)
- Authenticated admins **select / update**
- Payment screenshots in private `payment-proofs` bucket
- Never commit service-role keys

---

No hero changes required for any of this.
