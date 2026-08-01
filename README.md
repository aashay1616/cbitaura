# AURA 2026 — Official Fest Website

Standalone static website for **CBIT’s National Level Sports Fest — AURA 2026**  
(7–9 October 2026, CBIT Campus · Organised by **Chaitanya Kreeda**).

This project is **only** for AURA / CBIT sports. It is **not** connected to Curling AI, Qord, or any other product.

---

## What’s built now

- Aesthetic dark navy + steel-blue theme (from sponsorship deck)
- About CBIT / Chaitanya Kreeda / AURA
- Full sports catalogue (men / women · indoor / outdoor) with filters
- Tentative 3-day schedule
- **Registrations opening soon** panel (forms deferred)
- Website QR (points to `https://cbitaura.in` once live)
- Contact block for PE dept & Kreeda team

### Deferred (on purpose)

- Per-sport rule books  
- Online registration form (player list, captain phone/email, college, CBIT payment QR)

---

## Sports (AURA lineup)

| Outdoor | Indoor |
|--------|--------|
| Cricket (Men) | Badminton (Men / Women) |
| Basketball (Men / Women) | Table Tennis (Men / Women) |
| Football (Men) | Chess (Men / Women) |
| Volleyball (Men / Women) | Carroms (Men / Women) |
| Kabaddi (Men) | |
| Throwball (Women) | |

---

## Preview locally

Open in a browser:

```text
C:\Users\Dell\aura-2026\index.html
```

Or from this folder:

```powershell
cd C:\Users\Dell\aura-2026
python -m http.server 8080
```

Then visit `http://localhost:8080`

---

## Git — how this is handled

| Question | Answer |
|----------|--------|
| Using Curling AI / Piyush repos? | **No.** |
| Using existing Qord git credentials automatically? | **No.** |
| Where is the code right now? | **Only on your PC:** `C:\Users\Dell\aura-2026` |
| GitHub repo created yet? | **Not yet** — only if you ask |

When you want a repo:

1. Create a **new** GitHub repo (e.g. `aura-2026` or `cbitaura-website`) under **your** account.
2. Do **not** put this inside any Curling/Qord folder.
3. Then we can run something like:

```powershell
cd C:\Users\Dell\aura-2026
git init
git add index.html css js assets README.md
git commit -m "Initial AURA 2026 website"
git remote add origin https://github.com/YOUR_USERNAME/aura-2026.git
git push -u origin main
```

---

## Domain & launch (₹1 .in domains)

You looked at:

- **cbitaura.in** (recommended brand match)
- **aura2026.in**

Typical flow:

### 1. Buy the domain
Buy **one** of the above from the registrar showing ₹1.x first year (Hostinger / GoDaddy / etc.).  
**Tip:** check renewal price — first year is often cheap, year 2+ is higher.

### 2. Host the website (free options that work well)

| Option | Cost | Fit |
|--------|------|-----|
| **GitHub Pages** | Free | Perfect for this static site |
| **Netlify** | Free tier | Drag-and-drop or git deploy |
| **Cloudflare Pages** | Free | Fast + easy custom domain |
| **Vercel** | Free tier | Also fine for static |

**Easiest path:** GitHub Pages + custom domain `cbitaura.in`.

### 3. Connect domain → hosting

After hosting is live (e.g. `youruser.github.io/aura-2026` or `aura-2026.netlify.app`):

1. In the host (GitHub/Netlify), set custom domain = `cbitaura.in`
2. In the domain registrar DNS, add what they ask for, usually:
   - **A records** (GitHub Pages IPs), or  
   - a **CNAME** to the host’s URL  
3. Wait for DNS (can take a few minutes to a few hours)
4. Turn on HTTPS (usually automatic)

### 4. Update the QR
QR currently encodes `https://cbitaura.in`.  
If you buy `aura2026.in` instead, regenerate the QR to that URL before printing posters.

---

## Folder structure

```text
aura-2026/
  index.html
  css/styles.css
  js/main.js
  assets/
    logo-kreeda.png
    photo-*.png
    website-qr.png
    sports/*.jpg
  README.md
```

---

## Next steps (when you’re ready)

1. Buy domain (`cbitaura.in` recommended)
2. Say the word and we’ll init a **new** git repo + push (your GitHub only)
3. Deploy + wire domain
4. Later: rule books + registration + payment QR
