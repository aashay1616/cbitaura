# AURA 2026 — how registration, payments & admin work

## Bookmark these

| What | Link |
|------|------|
| Public site | https://cbitaura.in |
| Register form | https://cbitaura.in/register.html |
| **Admin desk** | https://cbitaura.in/admin.html |
| Rules example | https://cbitaura.in/rules.html?sport=basketball |

Admin is **not** in the public menu. Share `admin.html` only with organisers.

---

## How the pipeline works

```
Captain opens register.html
  → picks sport + category (fee shows)
  → fills college, captain, PD details
  → scans QR (Scanner 1 / later Scanner 2…)
  → pays · uploads screenshot · enters UTR
  → Submit
        ↓
Status = PENDING
  · Live: row in Supabase + screenshot in Storage
  · Demo: saved in that browser only (localStorage)
        ↓
Organisers open admin.html
  → filter Pending
  → View screenshot · check UTR / amount / scanner
  → Verify (+ captain email)  or  Reject
```

---

## Where data is stored

### Demo mode (works today — no cloud keys)
- Data lives in the **browser localStorage** on the device that submitted
- Admin must open **the same browser** to see / verify
- No emails sent
- Good for testing the form + admin UI

### Live mode (production — needs Supabase)
| Data | Where |
|------|--------|
| Team details, UTR, fee, status | Supabase table `registrations` |
| Payment screenshots | Supabase Storage bucket `payment-proofs` |
| Organiser login | Supabase Auth (email + password) |
| Alert email to you | Edge Function `notify-organisers` (Resend) |
| Confirm email to captain | Edge Function `send-confirmation` (Resend) |

Schema file: `supabase/schema.sql`  
Setup steps: `ADMIN-AND-EMAIL.md` + `GO-LIVE.md`

---

## Payment scanners

Configured in `js/config.js` → `PAYMENT_QRS` (array — ready for multiple).

**Scanner 1 (live now):** Aashay · PhonePe · `assets/payment-qr.png`

To add Scanner 2 later:
1. Drop image at `assets/payment-qrs/qr-2-….png`
2. Append another object in `PAYMENT_QRS`
3. Captains can switch tabs / pick “Scanner used” on the form

**Note on the form:** if fee **> ₹2,000**, scan from **another device** (same-phone UPI QR scan often blocked).

---

## Admin procedure (daily)

1. Open https://cbitaura.in/admin.html  
2. **Live:** sign in with organiser email  
3. Filter **Pending**  
4. Open **View screenshot** · match UTR + amount + scanner  
5. **Verify + email** or **Reject**  
6. Export CSV anytime for finance records  

---

## What’s still needed to “go fully live”

1. **Supabase project** — run `schema.sql`, create Auth users, paste URL + anon key into `config.js`  
2. **ADMIN_EMAILS** + RLS emails in schema (Aashay / Parin / Sohan)  
3. **Resend** + deploy Edge Functions (optional but needed for emails)  
4. Set `REGISTRATION_OPEN: true` in `config.js`  
5. Optional: more payment QRs in `PAYMENT_QRS`  

Until Supabase is connected, use **demo mode** to practice the flow.

---

## Team roles (suggested)

| Person | Access |
|--------|--------|
| Aashay / Parin / Sohan | Admin desk · verify payments |
| Sport captains | Rules content only (not admin) |
| Finance | CSV export + UTR cross-check |
