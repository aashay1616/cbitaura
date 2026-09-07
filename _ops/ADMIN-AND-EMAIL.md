# Admin portal + emails — plain English

## Access (bookmark this)

**Admin desk:** https://cbitaura.in/admin.html  

- **Not** shown in the public website menu  
- Share only with organisers (Aashay, Parin, Sohan, PD if needed)  

---

## The full loop

```
Captain registers + pays + uploads screenshot
        ↓
Status = PENDING
        ↓
YOU get an email: “New registration · pending”
        ↓
Open admin desk → open screenshot → check UTR/amount
        ↓
    ┌─────────────┬──────────────┐
    │  VERIFY     │   REJECT     │
    └─────────────┴──────────────┘
          ↓                ↓
 Captain gets         Team not
 confirmation email   accepted
```

---

## Two kinds of email

| Email | Who receives it | When |
|-------|-----------------|------|
| **Organiser alert** | Your Gmail(s) | The second a team submits |
| **Captain confirmation** | Team captain’s email | When you click **Verify + email** |

Both go through **Resend** (or similar) + Supabase Edge Functions — not from your personal “Send” button.

**From address (recommended):**  
`AURA 2026 · Chaitanya Kreeda <noreply@cbitaura.in>`  
(after you verify the domain in Resend)

Until domain mail is ready, Resend can send from their test domain for development.

---

## What you do day-to-day

1. Phone/email notification: new pending team  
2. Open https://cbitaura.in/admin.html  
3. **Live:** sign in with organiser email + password  
4. Filter **Pending**  
5. Open **View screenshot** · match UTR and amount  
6. **Verify + email** or **Reject** (optional reason)  
7. Export CSV anytime for records  

---

## Demo mode (works today, no cloud)

1. Open `register.html` → walk through form → submit  
2. Open `admin.html` **in the same browser**  
3. See the row · verify / reject  

Data stays only on that device until Supabase is connected.  
**No real emails** in demo.

---

## Live mode setup (one-time)

### A. Supabase (database + login)
1. Create project at https://supabase.com  
2. SQL editor → run `supabase/schema.sql`  
3. Auth → create users for organisers (email + password)  
4. Put emails in schema RLS + `js/config.js` → `ADMIN_EMAILS`  
5. Copy project URL + anon key into `js/config.js`  

### B. Resend (emails)
1. Account at https://resend.com  
2. Verify domain `cbitaura.in` (or use test sender first)  
3. Deploy Edge Functions:
   - `notify-organisers` — alerts you  
   - `send-confirmation` — emails captain on verify  
4. Secrets:
   ```
   RESEND_API_KEY=re_...
   CONFIRMATION_FROM=AURA 2026 <noreply@cbitaura.in>
   NOTIFY_EMAILS=aashay@gmail.com,parin@gmail.com,sohan@gmail.com
   ```

### C. Open registrations
```js
REGISTRATION_OPEN: true,
SUPABASE_URL: "https://xxxx.supabase.co",
SUPABASE_ANON_KEY: "eyJ...",
NOTIFY_ORGANISER_EMAILS: ["…"],  // documentation mirror of NOTIFY_EMAILS
```

Also need: **payment QR** at `assets/payment-qr.png`.

---

## FAQ

**Can random people open admin.html?**  
They can open the URL, but in live mode they can’t load/verify data without organiser login.

**Do we get WhatsApp alerts?**  
Not built-in. Email is the notification. You can forward Resend alerts to WhatsApp later if you want.

**Who is the “from” mail for captains?**  
`noreply@cbitaura.in` (or your chosen Resend sender) — not Aashay’s personal Gmail in the From field (Reply-To can be a real contact).

**Where do we approve teams?**  
Only in the admin desk (or Supabase Table Editor as a backup for power users).
