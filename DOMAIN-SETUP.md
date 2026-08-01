# cbitaura.in — connect domain to the live site

## Already done for you
- Site code pushed: https://github.com/aashay1616/cbitaura
- GitHub Pages enabled from `main` branch
- `CNAME` file set to **cbitaura.in**
- Site QR updated to `https://cbitaura.in`

Temporary GitHub URL (works even before DNS):
**https://aashay1616.github.io/cbitaura/**

---

## What you must do (5 minutes) — DNS at your registrar

Log into wherever you bought **cbitaura.in** (Hostinger / GoDaddy / Namecheap / etc.)  
Open **DNS** / **Manage DNS** for `cbitaura.in`.

### Option A — Apex domain `cbitaura.in` (recommended)

Delete any conflicting A / CNAME / parking records for `@`, then add **four A records**:

| Type | Name / Host | Value | TTL |
|------|-------------|-------|-----|
| A | `@` | `185.199.108.153` | 3600 or Auto |
| A | `@` | `185.199.109.153` | 3600 or Auto |
| A | `@` | `185.199.110.153` | 3600 or Auto |
| A | `@` | `185.199.111.153` | 3600 or Auto |

Optional www:

| Type | Name | Value |
|------|------|-------|
| CNAME | `www` | `aashay1616.github.io` |

### Option B — only if your panel supports ALIAS / ANAME
Point `@` → `aashay1616.github.io`

---

## After DNS
1. Wait 10 minutes–a few hours (sometimes up to 24h).
2. Open https://github.com/aashay1616/cbitaura/settings/pages  
3. Confirm custom domain shows **cbitaura.in** and DNS check is green.  
4. Turn on **Enforce HTTPS** when GitHub allows it.

Test:
- http://cbitaura.in  
- https://cbitaura.in (after HTTPS is ready)

---

## Local preview (still works)
```
cd C:\Users\Dell\aura-2026
python -m http.server 8765
```
→ http://localhost:8765
