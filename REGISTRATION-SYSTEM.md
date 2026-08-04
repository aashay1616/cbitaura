# AURA 2026 — Registration system (full pipeline)

**Status:** Fully built end-to-end. **Not open to public** until fees + payment QR + rules are final.

`REGISTRATION_OPEN` remains `false` in `js/config.js`.

---

## What captains do

1. `register.html` → choose sport + category  
2. Details → name, phone, email, college, Physical Director name + phone  
3. Payment → fee from config, scan official QR, UTR, amount, screenshot  
4. Submit → **pending** + reference code  
5. Organiser verifies in `admin.html`  
6. **verified** → confirmation email (when Edge Function + Resend live)  
   or **rejected** with optional note  

---

## Admin portal (how it works)

| Mode | When | Data |
|------|------|------|
| **DEMO** | No Supabase keys | Browser `localStorage` (`aura2026_registrations`) |
| **LIVE** | Keys set + schema run | Supabase table `registrations` |

### Demo today
1. Open `register.html` → submit a test entry  
2. Open `admin.html` **in the same browser**  
3. See stats · filter · search · Verify / Reject · Export CSV  

### Live later
1. Create free Supabase project  
2. Run `supabase/schema.sql` (replace `admin@example.com` with real organiser emails)  
3. Auth → invite organiser logins matching those emails  
4. Put `SUPABASE_URL` + `SUPABASE_ANON_KEY` in `js/config.js`  
5. `ADMIN_EMAILS: ["you@…"]`  
6. `REGISTRATION_OPEN: true`  

**Portal URL:** `https://cbitaura.in/admin.html` (don’t link it publicly; only share with organisers).

---

## Confirmation email — which address?

Emails are **not** sent from Gmail directly in the browser. Flow:

1. Admin clicks **Verify + email**  
2. Site calls Supabase Edge Function `send-confirmation`  
3. Function uses **Resend** (or similar) to email the captain  

### Sender address you choose

| Option | Address | Notes |
|--------|---------|--------|
| **Recommended** | `noreply@cbitaura.in` | Professional; needs Resend domain DNS on Hostinger |
| Temporary | Your Gmail via Resend | Works for testing; less “official” |

Set in Edge Function secret:

```
CONFIRMATION_FROM=AURA 2026 · Chaitanya Kreeda <noreply@cbitaura.in>
RESEND_API_KEY=re_xxxx
```

Template lives at: `supabase/functions/send-confirmation/index.ts`

**You still need to:** create a Resend account, verify domain or test domain, deploy the function, set secrets. Until then Verify works but email is skipped.

---

## What’s already done vs still yours

### Built (pipeline complete)
- Multi-step registration UI  
- Fees from config (basketball men ₹3500 / women ₹2000 already set)  
- Payment step + QR path + UTR + screenshot  
- Demo storage + live Supabase hooks  
- Admin desk: list, filter, search, stats, verify, reject, CSV  
- Schema + RLS + payment-proofs bucket  
- Edge Function template for confirmation email  
- Student coordinators on contact page  

### You provide later (only blockers for “go live”)
1. **Official payment QR** → save as `assets/payment-qr.png`  
2. **Rules PDFs** (optional links) → e.g. `assets/rules/basketball.pdf`  
3. Remaining sports **fees** in `config.js`  
4. **Supabase project** + run schema + organiser Auth  
5. **Resend** + `CONFIRMATION_FROM` email  
6. Flip `REGISTRATION_OPEN: true`  

### Poster website QR (not on site UI)
Saved for print/posters (removed from homepage):

- `assets/print/website-qr.png`  
- `C:\Users\Dell\Downloads\AURA-2026-website-qr.png`  

---

## Files map

| File | Role |
|------|------|
| `register.html` + `js/registration.js` | Captain form |
| `admin.html` + `js/admin.js` | Organiser desk |
| `js/config.js` | Switches, fees, keys, coordinators |
| `supabase/schema.sql` | DB + storage + RLS |
| `supabase/functions/send-confirmation/` | Email on verify |
| `assets/payment-qr.png` | **You add** payment QR |
| `assets/print/website-qr.png` | Poster QR to cbitaura.in |

---

## Security notes

- Public can **insert** registrations only  
- Admins (Auth email allow-list) **select / update**  
- Payment screenshots in private storage  
- Never commit service-role keys or Resend secret to the repo  
