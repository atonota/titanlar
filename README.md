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
