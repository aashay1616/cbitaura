# Supabase setup — one shared CC login (step by step)

## PhonePe name on Scanner 1

**AASHAY RAJ GRANDHI** (PhonePe UPI QR)

---

## Shared admin login (simple for whole CC)

We use **one** email + password for everyone on Core Committee:

| Field | Value |
|-------|--------|
| Email | `aura.cbit.cc@gmail.com` |
| Password | *(you choose — share only with CC)* |

Create that Gmail first (or tell us a different shared email and we’ll swap it in config + schema).

**Security tip:** Don’t post the password in WhatsApp groups with outsiders. Change it after the fest.

---

## A. Create the Supabase project (5 min)

1. Go to **https://supabase.com** → Sign in (GitHub is fine)  
2. **New project**
   - Name: `aura-2026` (or similar)
   - Database password: save it in a notes app (you rarely need it day-to-day)
   - Region: Mumbai / closest to India  
3. Wait until the project is **Ready**

---

## B. Run the schema (database + storage rules)

1. In the left sidebar: **SQL** → **New query**  
2. Open this file on your PC:  
   `C:\Users\Dell\aura-2026\supabase\schema.sql`  
3. Select all → copy → paste into the Supabase SQL editor  
4. Click **Run**  
5. You should see success (green). If it errors, screenshot and send it.

This creates:
- `registrations` table (teams, UTR, status, etc.)
- Storage bucket `payment-proofs` (screenshots)
- Security so only the shared CC email can read/verify

---

## C. Create the shared Auth user

1. Sidebar: **Authentication** → **Users** → **Add user**  
2. Choose **Create new user**
   - Email: `aura.cbit.cc@gmail.com`
   - Password: strong password you’ll share with CC
   - Auto Confirm User: **ON** (so no email confirm delay)  
3. Save

---

## D. Copy keys into the website config

1. Sidebar: **Project Settings** (gear) → **API**  
2. Copy:
   - **Project URL** → looks like `https://xxxxx.supabase.co`
   - **anon public** key → long `eyJ...` string  
3. Open `js/config.js` on your PC and set:

```js
REGISTRATION_OPEN: true,   // only when you’re ready for real entries

SUPABASE_URL: "https://xxxxx.supabase.co",
SUPABASE_ANON_KEY: "eyJ...",

ADMIN_EMAILS: ["aura.cbit.cc@gmail.com"],
```

4. Commit + push (or ask me to paste the keys and push — **don’t paste keys in a public chat if possible**; you can paste here in this private session).

---

## E. Storage policy check (screenshots)

1. **Storage** → bucket **payment-proofs** should exist (created by schema)  
2. If uploads fail later, tell us — we’ll add/fix storage policies

---

## F. How CC uses admin every day

1. Open **https://cbitaura.in/admin.html**  
2. Sign in with:
   - Email: `aura.cbit.cc@gmail.com`
   - Password: *(the shared one)*  
3. Filter **Pending** → open screenshot → check UTR/amount  
4. **Verify + email** or **Reject**  
5. Export CSV when finance needs a sheet  

---

## G. Optional — emails (can do after first live tests)

Without Resend, verify/reject still works in the database; captains just won’t get auto email until Edge Functions are deployed. See `ADMIN-AND-EMAIL.md`.

---

## Quick test after keys are in

1. `register.html` → submit a fake team + fake screenshot  
2. `admin.html` → login → see Pending → Verify  
3. Confirm status flips to verified  

---

## Adding Scanner 2 later

Drop QR file in `assets/payment-qrs/` and add one object to `PAYMENT_QRS` in `config.js`. No Supabase change needed.
