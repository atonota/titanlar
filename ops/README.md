# ops — titanlar.com sunucu yayını (Hetzner) · çoklu alan adı

Bu klasör sitenin **sunucudaki** yayınını tanımlar. Uygulama kodu, build ve GitHub Pages yayını
(`.github/workflows/pages.yml`) bu klasörden etkilenmez. Proje ayarları tek dosyada: **`ops/project.env`**
(`NAME=titanlar`, `REPO=atonota/titanlar`, `CHECK_NAME=build`, `DEFAULT_DOMAINS`). Script'ler proje adından
bağımsızdır; aynı sunucuda başka bir kopya (ör. agency) ile çakışmaz: `/opt/titanlar`, `titanlar-update.timer`,
`titanlar-npm-cache`.

```
git push main → GitHub Actions "build" (npm ci + tsc + vite build)
Sunucu: titanlar-update.timer (2 dk) → "build" job'ı success olan son commit
        → node:24-alpine konteynerinde npm ci + build → /opt/titanlar/releases/<sha> → current (atomik symlink)
Caddy:  titanlar.com (public, TLS) → current/   ·   www.titanlar.com → titanlar.com (301, yol ve sorgu korunur)
```
- CI'dan geçmeyen commit yayınlanmaz; sunucudaki build başarısızsa mevcut sürüm kalır. Son 3 sürüm saklanır.
- TLS: Let's Encrypt TLS-ALPN-01 (443); DNS token gerekmez. Cloudflare kayıtları **DNS only** olmalı.
- Build dosya adları hash'siz (`assets/app.js`) → `Cache-Control: no-cache` (ETag ile doğrulanır).
- Sunucuya gelen bağlantı yok; GitHub'a sadece dışarı doğru (public repo + public API).

## Desteklenen Caddy düzenleri (otomatik algılanır)
| Düzen | Algılama | Ne yapılır |
|---|---|---|
| `sites` | Caddyfile `import /etc/caddy/sites/*` | `/etc/caddy/sites/<domain>.caddy` (`common` snippet, `bind PUBLIC_IP`), UFW 443, Caddy restart |
| `sites-enabled` (ör. srv01) | Caddyfile `import /etc/caddy/sites-enabled/*` | **Sadece** `/etc/caddy/sites-enabled/<domain>.caddy` eklenir (sunucunun log biçimi). Mevcut dosyalara, firewall'a, caddy.env'e dokunulmaz. Doğrulama başarısızsa eklenen dosya geri alınır. Caddy **reload** |

Aynı adda bu projeye ait olmayan bir site dosyası varsa script durur, dosyaya dokunmaz.

## GitHub Pages'ten sunucuya geçiş (titanlar.com)
1. Sunucuda kur (DNS değişmeden önce yapılabilir; site dosyası eklenir, SSL DNS gelince alınır):
   ```bash
   git clone https://iwyz0@github.com/atonota/titanlar.git /opt/titanlar/repo
   ```
2. Cloudflare DNS (DNS only / gri bulut) — mevcut GitHub Pages kayıtları değiştirilir:
   | Tür | Ad | Önce (GitHub Pages) | Sonra |
   |---|---|---|---|
   | A | `@` | 185.199.108–111.153 (4 kayıt) | **tek kayıt: sunucu IP'si** |
   | CNAME → A | `www` | atonota.github.io | **A: sunucu IP'si** |
3. DNS yayıldıktan sonra (`dig +short titanlar.com` sunucu IP'sini gösterince):
   ```bash
   bash /opt/titanlar/repo/ops/setup.sh titanlar.com www.titanlar.com
   ```
4. GitHub → repo Settings → Pages → Custom domain alanını boşaltın (Pages yayını `atonota.github.io/titanlar/`
   adresinde demo olarak sürebilir veya kapatılabilir).

## İşletim
| İş | Komut |
|---|---|
| Yayındaki sürüm | `cat /opt/titanlar/state/deployed` |
| Güncelleme kaydı | `journalctl -u titanlar-update --since today` |
| Hemen güncelle | `systemctl start titanlar-update.service` |
| Geri al / sabitle | `echo <sha> > /opt/titanlar/state/pin` → hemen güncelle |
| Sabitlemeyi kaldır | `rm /opt/titanlar/state/pin` |
| Başarısız sürümü yeniden dene | `rm /opt/titanlar/state/failed` → hemen güncelle |
| Kayıtlı alan adları | `cat /opt/titanlar/state/domains` |
| Caddy ayarı değişince | `cd /opt/titanlar/repo && git pull && bash ops/setup.sh` |
