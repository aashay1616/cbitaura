# AURA 2026 — Registration system (ready to switch on)

Built now, **activated later** when you add **rules + payment QR**.

---

## Team journey (what captains do)

```
1. Open register.html
2. Team details  → college, sport, men/women, captain name / phone / email
3. Player roster → full list (min/max by sport)
4. Payment       → scan CBIT QR, enter UTR, upload screenshot
5. Submit        → status = PENDING
6. Organiser verifies screenshot in admin.html
7. Status = VERIFIED → confirmation email to captain
   (or REJECTED with optional note)
```

---

## Files already in the project

| File | Role |
|------|------|
| `register.html` | Multi-step team form |
| `admin.html` | Organiser desk (verify / reject / export CSV) |
| `js/config.js` | Switches + Supabase keys + sports list |
| `js/registration.js` | Form logic (demo + live hooks) |
| `js/admin.js` | Admin list + status actions |
| `supabase/schema.sql` | Database + storage + RLS |
| `assets/payment-qr.png` | **You add** when ready |

Home page `#register` shows the 4-step path and links to the form.

---

## Demo mode (works today, no backend)

1. Open `register.html` (local or GitHub Pages)
2. Walk through steps and submit
3. Open `admin.html` on the **same browser**
4. See row as **pending** → Verify / Reject

Data is stored in **localStorage** until Supabase is connected.

---

## Go-live checklist (when rules + QR are ready)

### A. Payment QR
1. Export official CBIT payment QR image  
2. Save as: `assets/payment-qr.png`  
3. Commit + push  

### B. Supabase (free)
1. Create project at https://supabase.com  
2. SQL editor → paste + run `supabase/schema.sql`  
3. Storage → confirm bucket `payment-proofs`  
4. Auth → create organiser login(s)  
5. In `schema.sql` policies, replace `admin@example.com` with real organiser emails  
6. In `js/config.js`:

```js
REGISTRATION_OPEN: true,
SUPABASE_URL: "https://xxxx.supabase.co",
SUPABASE_ANON_KEY: "eyJ...",
```

### C. Confirmation email
Deploy a Supabase Edge Function `send-confirmation` that:
- loads registration by `ref_code`
- emails captain via Resend / SendGrid / SMTP  
`admin.js` already calls `/functions/v1/send-confirmation` on verify.

### D. Flip the switch
- `REGISTRATION_OPEN: true`
- Push to GitHub
- Link “Register” CTAs on the home page to `register.html` (already linked)

---

## Status model

| Status | Meaning |
|--------|---------|
| `pending` | Submitted; screenshot not yet checked |
| `verified` | Payment OK; confirmation email sent |
| `rejected` | Payment invalid / incomplete |

---

## Security notes

- Public can **insert** registrations only  
- Only authenticated admins **list/update**  
- Payment screenshots in private storage bucket  
- Don’t commit service-role keys to the repo  

---

## Later (with rules)

- Attach rule PDFs per sport on `register.html`  
- Show fee amount per sport from config  
- Auto-fill amount field  

No hero changes required for any of this.
