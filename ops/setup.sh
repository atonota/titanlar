#!/usr/bin/env bash
# Statik site (Vite/React) yayını — bir veya birden çok alan adında. Proje ayarları: ops/project.env
# Akış: main'e push → GitHub Actions "build" → sunucu timer'ı 2 dk içinde CI'dan geçen commit'i
#        Node 24 konteynerinde npm ci + build eder → atomik olarak yayınlar. Başarısız build yayınlanmaz.
# Önkoşul: Docker, host Caddy. İki Caddy düzeni otomatik algılanır:
#   "sites"         → /etc/caddy/sites/*.caddy + common snippet + caddy.env (PUBLIC_IP, bind), UFW 443 açılır
#   "sites-enabled" → /etc/caddy/sites-enabled/* (ör. srv01): SADECE yeni site dosyası eklenir, mevcut dosyalara,
#                      firewall'a ve caddy.env'e dokunulmaz; doğrulama başarısızsa eklenen dosya geri alınır; reload (restart değil).
# Kullanım (root):
#   git clone https://github.com/<REPO>.git /opt/<NAME>/repo
#   bash /opt/<NAME>/repo/ops/setup.sh example.com www.example.com — alan adı ekle/güncelle
#                                     (www.X ve X birlikte verilirse www.X → X kalıcı yönlendirme olur)
#   bash /opt/<NAME>/repo/ops/setup.sh                          — kayıtlı (yoksa DEFAULT_DOMAINS) alan adlarını uygula
#   bash /opt/<NAME>/repo/ops/setup.sh --remove example.com     — alan adını kaldır
# Tekrar çalıştırılabilir. Tüm alan adları aynı build'i (/opt/<NAME>/current) ve aynı otomatik yayını paylaşır.
set -euo pipefail
OPS="$(cd "$(dirname "$0")" && pwd)"; . "$OPS/project.env"
BASE="${SITE_BASE:-/opt/$NAME}"; export SITE_BASE="$BASE"
MARK="github.com/$REPO"   # site dosyalarında sahiplik işareti
log()  { printf '\n\033[1;34m==> %s\033[0m\n' "$*"; }
warn() { printf '\033[1;33m[!] %s\033[0m\n' "$*"; }
die()  { printf '\033[1;31m[x] %s\033[0m\n' "$*"; exit 1; }
setenv() { touch "$1"; grep -q "^$2=" "$1" && sed -i "s|^$2=.*|$2=$3|" "$1" || echo "$2=$3" >> "$1"; }

[ "$(id -u)" -eq 0 ] || die "root olarak çalıştır"
for c in docker caddy git curl python3 flock dig; do command -v $c >/dev/null || die "$c yok"; done

# Caddy düzeni
if grep -qs 'import /etc/caddy/sites-enabled/' /etc/caddy/Caddyfile; then
  LAYOUT=sites-enabled; SITE_DIR=/etc/caddy/sites-enabled; TMPL="$OPS/caddy/site.sites-enabled.tmpl"; RTMPL="$OPS/caddy/redirect.sites-enabled.tmpl"
elif grep -qs 'import /etc/caddy/sites/' /etc/caddy/Caddyfile; then
  LAYOUT=sites; SITE_DIR=/etc/caddy/sites; TMPL="$OPS/caddy/site.caddy.tmpl"; RTMPL="$OPS/caddy/redirect.caddy.tmpl"
  command -v ufw >/dev/null || die "ufw yok"
else die "/etc/caddy/Caddyfile içinde sites/ veya sites-enabled/ import'u bulunamadı — Caddy düzeni tanınmadı"; fi
echo "Caddy düzeni: $LAYOUT ($SITE_DIR)"

# Alan adları: argümanlar → yoksa kayıtlı liste → yoksa varsayılan
DOMAINS_FILE="$BASE/state/domains"; mkdir -p "$BASE/state"
# Önceki (tek alan adlı) kurulumdan geçiş: mevcut site dosyalarını listeye al
if [ ! -s "$DOMAINS_FILE" ]; then
  for f in "$SITE_DIR"/*.caddy; do grep -qs "$MARK" "$f" && basename "$f" .caddy >> "$DOMAINS_FILE"; done
fi
valid() { [[ "$1" =~ ^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$ ]]; }
if [ "${1:-}" = "--remove" ]; then
  D="${2:?kullanım: setup.sh --remove <domain>}"; valid "$D" || die "geçersiz alan adı: $D"
  rm -f "$SITE_DIR/$D.caddy"; sed -i "/^$D\$/d" "$DOMAINS_FILE" 2>/dev/null || true
  systemctl reload caddy && echo "kaldırıldı: $D"; exit 0
fi
if [ "$#" -gt 0 ]; then DOMAINS=("$@")
elif [ -s "$DOMAINS_FILE" ]; then mapfile -t DOMAINS < "$DOMAINS_FILE"
else read -r -a DOMAINS <<< "$DEFAULT_DOMAINS"; fi
for D in "${DOMAINS[@]}"; do valid "$D" || die "geçersiz alan adı: $D"; done
for D in "${DOMAINS[@]}"; do grep -qx "$D" "$DOMAINS_FILE" 2>/dev/null || echo "$D" >> "$DOMAINS_FILE"; done
echo "Alan adları: ${DOMAINS[*]}"

log "1/5 Public erişim"
CENV=/etc/caddy/caddy.env
if [ "$LAYOUT" = sites ]; then
  PUB=$(grep -s '^PUBLIC_IP=' "$CENV" | cut -d= -f2-)
  [ -n "$PUB" ] || { PUB=$(curl -fsS -4 https://ifconfig.me); setenv "$CENV" PUBLIC_IP "$PUB"; chown root:caddy "$CENV"; chmod 640 "$CENV"; }
  ufw allow 443/tcp comment 'public https' >/dev/null && echo "UFW 443 açık"
else
  PUB=$(curl -fsS -4 https://ifconfig.me)   # firewall ve caddy.env'e dokunulmaz (mevcut siteler zaten 443'te)
fi
echo "PUBLIC_IP=$PUB"
for D in "${DOMAINS[@]}"; do
  r=$(dig +short "$D" A | tail -1); [ "$r" = "$PUB" ] || warn "$D → '$r'; beklenen $PUB (A kaydı, Cloudflare ise DNS only / gri bulut)"
done

log "2/5 Yayın (CI'dan geçen son commit; ilk kurulumda npm ci + build birkaç dakika sürebilir)"
bash "$OPS/update.sh" || true
[ -L "$BASE/current" ] || die "yayın oluşmadı — yukarıdaki çıktıya bakın (CI bitmemiş olabilir; birkaç dakika sonra tekrar çalıştırın)"
echo "Yayında: $(cut -c1-12 "$BASE/state/deployed")"

log "3/5 Caddy: ${DOMAINS[*]} ($LAYOUT)"
chmod o+x "$BASE" 2>/dev/null || true
NEW=()
for D in "${DOMAINS[@]}"; do
  F="$SITE_DIR/$D.caddy"
  if [ -e "$F" ] && ! grep -qs "$MARK" "$F"; then die "$F zaten var ve bu projeye ait değil — dokunulmadı"; fi
  [ -e "$F" ] || NEW+=("$F")
  APEX="${D#www.}"; T="$TMPL"
  if [ "$APEX" != "$D" ] && printf '%s\n' "${DOMAINS[@]}" | grep -qx "$APEX"; then T="$RTMPL"; fi   # www.X → X
  sed -e "s|__BASE__|$BASE|g" -e "s|__DOMAIN__|$D|g" -e "s|__TARGET__|$APEX|g" -e "s|__REPO__|$REPO|g" "$T" > "$F.tmp" && mv "$F.tmp" "$F"
  chmod 644 "$F"
  if [ "$LAYOUT" = sites-enabled ]; then
    install -d -o caddy -g caddy /var/log/caddy/access_log /var/log/caddy/byte_log
    for L in access_log byte_log; do install -o caddy -g caddy -m 640 /dev/null "/var/log/caddy/$L/$D.log" 2>/dev/null || true; done
  else
    install -o caddy -g caddy -m 640 /dev/null "/var/log/caddy/$D.log" 2>/dev/null || true
  fi
done
rollback() { for F in "${NEW[@]}"; do rm -f "$F"; done; die "Caddy doğrulaması başarısız — eklenen dosyalar geri alındı, Caddy'ye dokunulmadı"; }
if [ "$LAYOUT" = sites ]; then
  runuser -u caddy -- env HOME=/var/lib/caddy $(grep -v '^#' "$CENV" | xargs) caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile || rollback
  chown -R caddy:caddy /var/log/caddy
  systemctl restart caddy
else
  caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile >/dev/null 2>&1 || { caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile 2>&1 | tail -5; rollback; }
  systemctl reload caddy && echo "Caddy reload edildi (diğer sitelerde kesinti yok)"
fi

log "4/5 Otomatik yayın zamanlayıcısı (2 dk)"
for u in service timer; do sed -e "s|__OPS__|$OPS|g" -e "s|__BASE__|$BASE|g" -e "s|__NAME__|$NAME|g" -e "s|__REPO__|$REPO|g" "$OPS/systemd/update.$u" > "/etc/systemd/system/$NAME-update.$u"; done
systemctl daemon-reload && systemctl enable --now "$NAME-update.timer" >/dev/null
systemctl list-timers "$NAME-update.timer" --no-pager | head -2

log "5/5 Doğrulama (yeni alan adının SSL sertifikası birkaç saniye sürebilir)"
code() { curl -s -o /dev/null -w '%{http_code}' --resolve "$1:443:$PUB" "https://$1$2"; }
for D in "${DOMAINS[@]}"; do
  if grep -qs "permanent" "$SITE_DIR/$D.caddy"; then
    for i in $(seq 1 12); do c=$(code "$D" /); [[ "$c" =~ ^30[18]$ ]] && break; sleep 5; done
    [[ "$c" =~ ^30[18]$ ]] && echo "OK  https://$D/ → $c (${D#www.} adresine yönlendirme)" || warn "https://$D/ yönlendirme değil ($c)"
    continue
  fi
  for i in $(seq 1 12); do [ "$(code "$D" /)" = 200 ] && break; sleep 5; done
  [ "$(code "$D" /)" = 200 ] && echo "OK  https://$D/ → 200" || warn "https://$D/ 200 değil (sertifika: journalctl -u caddy | grep -i $D)"
  [ "$(code "$D" /assets/app.js)" = 200 ] && echo "OK  https://$D/assets/app.js → 200" || warn "https://$D/assets/app.js 200 değil"
done

cat <<MSG

Alan adları: $(tr '\n' ' ' < "$DOMAINS_FILE")
Yayındaki sürüm:   cat $BASE/state/deployed
Güncelleme kaydı:  journalctl -u $NAME-update --since today
Hemen güncelle:    systemctl start $NAME-update.service
Geri al/sabitle:   echo <commit-sha> > $BASE/state/pin && systemctl start $NAME-update.service
MSG
