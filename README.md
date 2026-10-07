# Titanlar

[atonota/agency](https://github.com/atonota/agency) reposunun Git geçmişi korunarak oluşturulan bağımsız kopyasıdır. Bu reponun değişiklikleri ve yayınları `agency` reposunu etkilemez.

Ajans sitesi taslağı. Çalışma footer'dan başladı: kurumsal bir footer'da ve Güven Merkezi'nde bulunan her öğenin hangi olgunluk aşamasında (Gün 1, Büyüme, Kurumsal olgunluk) gerektiğini gösteren, JSON içerikten beslenen bir motor.

Yayın: https://titanlar.com/

GitHub Pages adresi: https://atonota.github.io/titanlar/ (özel alan adına yönlenir).

## Yığın

- Vite, React 19, TypeScript
- Mantine 9, Phosphor ikonları, ECharts 6
- Hareket: React Bits bileşenleri (`src/components/reactbits/`), GSAP, motion, ogl

## Yapı

- `src/content/<bölge>/<sıra>-<ad>.json`: içerik. Her dosya `{ id, type, order, label, data }` taşır.
- `src/engine.tsx`, `src/engine/core.tsx`: içerik dosyalarını toplayıp `type` alanına göre renderer'a bağlayan motor.
- `src/renderers/`: bölüm bileşenleri.
- `src/styles/`: tasarım token'ları (`global.css`) ve bölüm stilleri.
- `DESIGN-BRIEF.md`: görsel dil ve motor sözleşmesi.
- `research/`: footer bağlantı etiketleri araştırması (`build_menu.py`, `menu-items.json`).

## Komutlar

```bash
npm ci
npm run dev
npm run lint
npm run build
```

## Yayınlama

`main` dalına her push'ta `.github/workflows/pages.yml` projeyi derler ve GitHub Pages'e yayınlar.

Bu proje statik bir frontend olarak GitHub Pages'te yayınlanır. Sunucu veya Tailscale bağlantısı gerekmez. `ops/` kaynak projeden korunan Hetzner yayın referansıdır; bu reponun GitHub Pages yayını onu çalıştırmaz.

Alan adının DNS sağlayıcısı Cloudflare'dır. GitHub Pages özel alan adı `titanlar.com` olarak kaydedilmiş ve aşağıdaki kayıtlar uygulanmıştır:

| Tür | Ad | Değer |
|---|---|---|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | atonota.github.io |

Kayıtlar DNS only durumundadır. GitHub Pages'te HTTPS zorunludur; `http://titanlar.com` ve `www.titanlar.com` ana HTTPS adresine yönlenir. `agency.titanlar.com` ayrı yayın olarak korunmuştur.

DNS kaydı kaynağı: [GitHub Pages özel alan adı rehberi](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).

## Lisans

Proje lisansı henüz belirlenmedi. `src/components/reactbits/` altındaki bileşenler React Bits'ten alınmıştır ve `REACT-BITS-LICENSE.md` koşullarına tabidir.

## Archived landing prototypes

The recovered local Titanlar v3 and v4 landing prototypes are published at
[https://titanlar.com/v3/](https://titanlar.com/v3/) and
[https://titanlar.com/v4/](https://titanlar.com/v4/).
Their original standalone HTML is kept in `public/v3/index.html` and
`public/v4/index.html`; Vite copies these files into the Pages build.
These historical previews retain their original CDN scripts and prototype interactions.

## Selected historical homepage

The homepage and [https://titanlar.com/izometrik/](https://titanlar.com/izometrik/)
serve the isometric MARKA snapshot recovered from the 26 September 2026 local
file history (the 13:38 build). `public/izometrik/index.html` contains its
original compiled CSS and JavaScript. The document wrapper adds UTF-8, Turkish
language metadata and a responsive viewport without changing the snapshot.

The existing React source remains available in `src/`. After the normal Vite
build, `scripts/select-homepage.mjs` selects the recovered snapshot for the
root URL. The same GitHub Actions workflow publishes the homepage and all
three archive routes on every push to `main`. The original local backups
remain intact.
