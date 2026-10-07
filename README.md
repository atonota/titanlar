# Titanlar

[atonota/agency](https://github.com/atonota/agency) reposunun Git geçmişi korunarak oluşturulan bağımsız kopyasıdır. Bu reponun değişiklikleri ve yayınları `agency` reposunu etkilemez.

Ajans sitesi taslağı. Çalışma footer'dan başladı: kurumsal bir footer'da ve Güven Merkezi'nde bulunan her öğenin hangi olgunluk aşamasında (Gün 1, Büyüme, Kurumsal olgunluk) gerektiğini gösteren, JSON içerikten beslenen bir motor.

Yayın: https://atonota.github.io/titanlar/

Ana sayfa ve tüm alt sayfalar yalnızca GitHub Pages üzerinde yayınlanır. Özel alan adı bağlantısı kaldırılmıştır.

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

## Lisans

Proje lisansı henüz belirlenmedi. `src/components/reactbits/` altındaki bileşenler React Bits'ten alınmıştır ve `REACT-BITS-LICENSE.md` koşullarına tabidir.

## Archived landing prototypes

The recovered local Titanlar v3 and v4 landing prototypes are published at
[https://atonota.github.io/titanlar/v3/](https://atonota.github.io/titanlar/v3/) and
[https://atonota.github.io/titanlar/v4/](https://atonota.github.io/titanlar/v4/).
Their recovered standalone HTML is kept in `public/v3/index.html` and
`public/v4/index.html`; Vite copies these files into the Pages build.
These historical previews retain their CDN scripts and prototype interactions, with shared minimum text size, visible keyboard focus and reduced-motion handling.

## Selected historical homepage

The homepage and [https://atonota.github.io/titanlar/izometrik/](https://atonota.github.io/titanlar/izometrik/)
serve the isometric MARKA snapshot recovered from the 26 September 2026 local
file history (the 13:38 build). `public/izometrik/index.html` contains its
recovered compiled CSS and JavaScript. The document wrapper adds UTF-8, Turkish
language metadata and a responsive viewport. Accessibility repairs normalize small
font declarations to the shared 1rem minimum, preserve the user root text size,
fix narrow-screen hero/navigation wrapping and provide visible keyboard focus.
The v4 testimonial region also supports native keyboard scrolling; the landing
animations respect reduced-motion preferences. The historical original remains
recoverable in commit `3a54d24` before these repairs.

The existing React source remains available in `src/`. After the normal Vite
build, `scripts/select-homepage.mjs` selects the recovered snapshot for the
root URL. The same GitHub Actions workflow publishes the homepage and all
three archive routes on every push to `main`. The original local backups
remain intact.

## Archive regression checks

`npm run test:ui` checks published routes, minimum computed text size, navigation
width, visible keyboard focus and v4 keyboard scrolling against the production
build in Chromium, Firefox and WebKit. GitHub Actions runs these checks before
Pages deployment and saves screenshots/traces for review. WebKit is an emulation
check and does not replace real macOS/iOS Safari verification.
