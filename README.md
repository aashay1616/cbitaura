# AURA 2026 — Official Fest Website

**https://cbitaura.in** · CBIT National Level Sports Fest · Organised by **Chaitanya Kreeda**

Static site on GitHub Pages. Registration pipeline fully scaffolded; **public registration stays closed** until payment QR + remaining rules/fees are ready.

---

## Live pages

| Page | URL path |
|------|----------|
| Home | `/` · `index.html` |
| Register | `register.html` |
| Rules viewer | `rules.html?sport=basketball` |
| Admin desk | `admin.html` (organisers only) |

---

## Pipeline status

| Area | Status |
|------|--------|
| Hero / sports / contact / coordinators | Live |
| Registration form (4 steps) | Ready (demo) |
| Admin verify / reject / CSV / stats | Ready (demo) |
| Basketball rules + fees | Live |
| Payment QR | **Waiting** → `assets/payment-qr.png` |
| Other sports rules + fees | **Waiting** |
| Supabase + Resend emails | **Waiting** (code ready) |
| `REGISTRATION_OPEN` | **false** |

**Master checklist:** [GO-LIVE.md](./GO-LIVE.md)  
**Admin + email explained:** [ADMIN-AND-EMAIL.md](./ADMIN-AND-EMAIL.md)  
**Registration technical notes:** [REGISTRATION-SYSTEM.md](./REGISTRATION-SYSTEM.md)

---

## Local preview

```powershell
cd C:\Users\Dell\aura-2026
python -m http.server 8765
```

→ http://localhost:8765

---

## Sports

| Outdoor | Indoor |
|--------|--------|
| Cricket (Men) | Badminton (Men / Women) |
| Basketball (Men / Women) | Table Tennis (Men / Women) |
| Football (Men) | Chess (Men / Women) |
| Volleyball (Men / Women) | Carroms (Men / Women) |
| Kabaddi (Men) | |
| Throwball (Women) | |

---

## Next step (when you have assets)

1. Official **payment QR** → `assets/payment-qr.png`  
2. **Rules** sheets for remaining sports → `assets/rules/`  
3. Confirm remaining **fees**  
4. Supabase + Resend (or walkthrough with us)  
5. Set `REGISTRATION_OPEN: true` and push  

Until then, demo the form + admin desk in the same browser without opening public reg.
