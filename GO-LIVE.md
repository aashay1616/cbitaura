# AURA 2026 — Go-live pipeline (complete scaffold)

Everything below is **built in the repo**. Public registration stays **closed** until you drop in the last content pieces.

```
REGISTRATION_OPEN = false   ← flip to true only after checklist is green
```

---

## End-to-end flow (already coded)

```
Captain → register.html
   1. Sport + category
   2. Name, phone, email, college, PD name/phone
   3. Fee (from config) + payment QR + UTR + screenshot
   4. Submit → status PENDING + ref code
        ↓
   [live] notify-organisers Edge Function
        → email to organisers: “New registration”
        ↓
Organiser → admin.html (login)
   · filter Pending · view screenshot · check UTR
   · VERIFY  → send-confirmation → email captain
   · REJECT  → optional note
        ↓
Captain receives “You’re in” email
```

| Piece | Path | Status |
|-------|------|--------|
| Public form | `register.html` + `js/registration.js` | Ready |
| Config / fees / rules map | `js/config.js` | Ready (fees TBA except basketball) |
| Admin desk + login | `admin.html` + `js/admin.js` | Ready |
| In-site rules viewer | `rules.html` + `js/rules.js` | Ready |
| DB + storage + RLS | `supabase/schema.sql` | Ready to run |
| Email: new reg → you | `supabase/functions/notify-organisers/` | Ready to deploy |
| Email: verify → captain | `supabase/functions/send-confirmation/` | Ready to deploy |
| Payment QR | `assets/payment-qr.png` | **Waiting on you** |
| Rules sheets (all sports) | `assets/rules/*` | Basketball done; **rest waiting** |
| Website poster QR | `assets/print/website-qr.png` | Saved (not on homepage) |

---

## What YOU still hand over (then we flip live)

### 1. Payment QR
- Official UPI / bank QR image  
- Save as: **`assets/payment-qr.png`**  
- (See `assets/PAYMENT-QR.README.txt`)

### 2. Rules for remaining sports
Drop files under `assets/rules/` and tell us sport id:

| Sport id | File example | On site when ready |
|----------|--------------|--------------------|
| cricket | `cricket-rules.png` | `rules.html?sport=cricket` |
| football | `football-rules.png` | … |
| volleyball | … | … |
| kabaddi | … | … |
| throwball | … | … |
| badminton | … | … |
| table-tennis | … | … |
| chess | … | … |
| carroms | … | … |
| **basketball** | `basketball-rules.png` | **Already live** |

Pipeline: file → `js/config.js` `RULES_SHEETS` → sport card link → register form link.

### 3. Fees for other sports
In `js/config.js` per sport: `feeRupees` or `feeByCategory`.  
Basketball already: men ₹3500 / women ₹2000.

### 4. Cloud (one-time, free tiers ok)

**Supabase**
1. Create project  
2. Run `supabase/schema.sql` (set organiser emails in RLS)  
3. Auth → create organiser users (email + password)  
4. Paste `SUPABASE_URL` + `SUPABASE_ANON_KEY` into `js/config.js`  
5. `ADMIN_EMAILS: ["you@…"]`

**Resend**
1. Account + API key  
2. Preferred from: `noreply@cbitaura.in` (domain DNS later)  
3. Deploy both Edge Functions  
4. Secrets:
   ```
   RESEND_API_KEY=…
   CONFIRMATION_FROM=AURA 2026 <noreply@cbitaura.in>
   NOTIFY_EMAILS=aashay@…,parin@…,sohan@…
   ```

### 5. Flip switch
```js
REGISTRATION_OPEN: true,
```
Commit + push. Public form accepts real submissions.

---

## Admin access (bookmark)

https://cbitaura.in/admin.html  

- Demo now: same browser as test register form  
- Live: organiser email + password  
- Details: `ADMIN-AND-EMAIL.md`

---

## Email summary

| Event | Who gets mail | Function |
|-------|----------------|----------|
| Team submits | Organisers | `notify-organisers` |
| You click Verify | Captain | `send-confirmation` |

---

## Demo without cloud (right now)

1. `register.html` → complete a fake entry  
2. `admin.html` same browser → Pending → Verify / Reject / CSV  

No real email until Resend is connected.

---

## After you send QR + rules

Next step with us:
1. Drop payment QR + rules files into the repo  
2. Fill fees / config  
3. Create Supabase + Resend (or walk through together)  
4. `REGISTRATION_OPEN: true` → live  

**Do not open registrations until payment QR is the real one.**
