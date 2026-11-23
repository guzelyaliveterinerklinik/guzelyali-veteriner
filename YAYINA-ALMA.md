# Yayına alma ve panel kurulumu

Site artık iki parçadan oluşuyor:
- **İçerik:** `content/` klasörü ve `assets/img/uploads/`. Panel yalnızca bunları değiştirir.
- **Kod:** `src/`, `assets/css`, `assets/js`, `admin/`.

`npm run build` komutu siteyi `dist/` klasörüne üretir. Yayına alınan klasör `dist/`'tir.

## Bilgisayarda çalıştırmak

```bash
npm install
npm run dev
```

- Site: http://127.0.0.1:5180
- Panel: http://127.0.0.1:5180/admin/

Bilgisayardaki panelde giriş gerekmez; kaydedilen her şey doğrudan `content/` klasörüne yazılır ve site kendiliğinden yeniden üretilir.

## Canlıya alma adımları

Bütün hesaplar **kliniğin e-postasıyla** açılmalı. Böylece site, siz olmadan da kliniğin elinde kalır.

1. **GitHub:** Kliniğin e-postasıyla ücretsiz bir hesap açın, boş ve gizli (private) bir depo oluşturun. Proje klasörünü bu depoya yükleyin. `.gitignore`, büyük kaynak görselleri ve arşivi dışarıda bırakır.
2. **Netlify** (ya da Cloudflare Pages): Kliniğin e-postasıyla açın, **Add new site → Import from Git** ile depoyu seçin. Derleme ayarları `netlify.toml` dosyasından otomatik okunur: komut `npm run build`, yayın klasörü `dist`.
3. **Alan adı:** `adanaguzelyaliveteriner.com` alındı. Ana adres **www.adanaguzelyaliveteriner.com**.
   1. Netlify'da **Domain management → Add a domain** ile `www.adanaguzelyaliveteriner.com` adresini ekleyin ve ana adres (primary) yapın. `www` olmadan yazılan adres otomatik olarak buraya yönlenir. SSL sertifikası da otomatik kurulur.
   2. Alan adını aldığınız firmanın DNS panelinde yalnızca site kayıtlarını ekleyin. Netlify kendi panelinde tam değerleri gösterir:
      - `www` için Netlify'ın verdiği `.netlify.app` adresine bir CNAME kaydı
      - Kök alan adı (`@`) için Netlify'ın verdiği A ya da ALIAS kaydı
   3. **Dikkat, e-posta:** `destek@adanaguzelyaliveteriner.com` adresinin MX, SPF, DKIM ve DMARC kayıtlarına dokunmayın. Ad sunucularını (nameserver) Netlify'a taşımayın; taşınırsa bu kayıtlar elle kopyalanmazsa e-posta çalışmayı durdurur.
4. **Panel girişi:** İki yol var.
   - **Decap Turbo (önerilen):** İşletmeci e-postayla davet edilir ve kendi şifresiyle girer; GitHub hesabı gerekmez. [decapcms.org/turbo](https://decapcms.org/turbo/) üzerinden siteyi oluşturup GitHub deposunu bağlayın. Sonra `admin/config.yml` dosyasında `backend` → `name: turbo-github` yapın ve [bağlama rehberindeki](https://decapcms.org/docs/turbo-connecting-a-site/) site kimliğini ekleyin. Ücretlendirmeyi kurulum sırasında kontrol edin.
   - **GitHub girişi (ücretsiz):** İşletmeci ücretsiz bir GitHub hesabı açar ve depoya ortak çalışan (collaborator) olarak eklenir. `admin/config.yml` dosyasında `repo: KULLANICI/DEPO` alanını doldurun; Netlify'da **Site configuration → Access & security → OAuth** bölümünden GitHub sağlayıcısını kurun.
5. **Alan adı bağlandıktan sonra:**
   - Hazır olanlar: Sitedeki canonical ve dil (hreflang) etiketleri, `sitemap.xml` ve `robots.txt` zaten bu alan adına göre üretiliyor. Adres `src/data.mjs` dosyasındaki `SITE_URL` alanında.
   - **Google Search Console:** `https://www.adanaguzelyaliveteriner.com` adresini ekleyin, DNS TXT kaydıyla doğrulayın ve `sitemap.xml` dosyasını gönderin.
   - **Bing Webmaster Tools:** Search Console'dan içe aktarın. ChatGPT'nin araması Bing'i kullandığı için bu da önemli.
   - **Google İşletme Profili:** "Web sitesi" alanına `https://www.adanaguzelyaliveteriner.com` yazın.
   - **Instagram:** Profildeki bağlantıyı aynı adresle güncelleyin.

## Panel nasıl çalışıyor

1. İşletmeci panelde **Yayınla**'ya bastığında, değişiklik GitHub deposuna kaydedilir.
2. Netlify bunu görür, `npm run build` komutunu çalıştırır ve yeni siteyi 1-2 dakika içinde yayına alır.
3. Yüklenen fotoğraflar derleme sırasında 480, 800 ve 1200 piksel genişliğinde WebP kopyalara dönüştürülür. Telefon fotoğrafları siteyi yavaşlatmaz.

## Dosya haritası

| Ne | Nerede |
|---|---|
| Blog yazıları | `content/blog/*.md` |
| Anasayfa ve Hakkımızda metinleri | `content/anasayfa.yml`, `content/hakkimizda.yml` |
| Hizmetler, SSS, yorumlar | `content/hizmetler.yml`, `content/sss.yml`, `content/yorumlar.yml` |
| Telefon, adres, saatler, puan | `content/ayarlar.yml` |
| Panelden yüklenen fotoğraflar | `assets/img/uploads/` |
| Panel ayarları (alanlar, etiketler) | `admin/config.yml` |
| Sabit arayüz metinleri (menü, butonlar) | `src/data.mjs` |
| Sayfa şablonları | `src/build.mjs` |
| İçeriği okuyan ve fotoğrafları küçülten kod | `src/content.mjs` |
| Hero'daki kedi | `assets/img/kedi-*.webp`, göz konumları `src/build.mjs` içindeki `CAT` |
| Link paylaşım görseli (WhatsApp, Instagram önizlemesi) | `share.jpg` (1200×630). Tasarımı `src/paylasim/share.html`; değiştirdikten sonra sayfanın 1200×630 ekran görüntüsünü alıp `share.jpg` olarak kaydedin. Blog yazıları kendi kapak fotoğrafını kullanır. |
