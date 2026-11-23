# Güzelyalı Veteriner: site için gerekenler (2. sürüm)

Site çok sayfalı bir yapı: Anasayfa, Hakkımızda, Hizmetler, Blog (3 yazı), İletişim. Her sayfanın İngilizcesi de var (`/en/`).
Salim Bey'in portresi sitede kullanılıyor. Anasayfada masanın kenarından bakan, gözleriyle fareyi takip eden ve göz kırpan bir yavru kedi var.

## 1. Fotoğraflar

Sitedeki fotoğraflar artık **site panelinden** değiştiriliyor (bkz. `PANEL-KILAVUZU.md`). Dosyalar `assets/img/uploads/` klasöründe; kaynakları `Gorseller/` klasöründe. Boyut önemli değil, site her fotoğrafı otomatik küçültür.

| Dosya adı | Sitede nerede | Şu an içinde |
|---|---|---|
| `hizmet-muayene.jpg` | Muayene ve Teşhis | Kulağı muayene edilen kedi (yapay zekâ görseli) |
| `hizmet-tedavi-cerrahi.jpg` | Tedavi ve Cerrahi | Ameliyat masası (yapay zekâ görseli) |
| `hizmet-koruyucu-saglik.jpg` | Koruyucu Sağlık | Muayene masasında yakalıklı köpek (Gorseller/Preventive Care.jpg) |
| `hizmet-dis.jpg` | Ağız ve Diş Sağlığı | Diş kontrolü (yapay zekâ görseli) |
| `hizmet-bakim-beslenme.jpg` | Bakım ve Beslenme | Tıraş edilen corgi (Gorseller/Grooming.jpg) |
| `petshop.jpg` | Pet Shop ve Ürünler | Mama ve aksesuarlar (yapay zekâ görseli) |
| `klinik.jpg` | Hakkımızda | Kliniğin dış cephesi (DSCF0879) |
| `randevu.jpg` | Anasayfa, "Randevu üç adımda" | Kliniğin muayene odası (DSCF0886) |
| `iletisim.jpg` | İletişim, haritanın yanı | Kliniğin dış cephesi, diğer açı (DSCF0880) |
| `blog-asi-takvimi.jpg` | Blog: aşı takvimi | Battaniyedeki yavru beagle (yapay zekâ görseli) |
| `blog-kene-pire.jpg` | Blog: kene ve pire | Sokakta mama yiyen köpek (yapay zekâ görseli) |
| `blog-dis-tasi.jpg` | Blog: diş taşı | Diş kontrolü, yandan (yapay zekâ görseli) |

Başka kliniklere ait geçici fotoğrafların hiçbiri artık sitede yok. Kullanılmayan görseller `Gorseller/` klasöründe duruyor.

Salim Bey'in portresi (`assets/img/salim-960.jpg`) kliniğin kendi fotoğrafı, kullanılıyor.

**Anasayfadaki kedi:** Klinik için yapay zekâ ile üretilen turuncu tekir yavru (`kedi.png` ve göz kırpma için `kedi-goz-kapali.png`). Arka planı `src/kedi.swift` ile kaldırıldı. Göz bebekleri fareyi takip ediyor, kedi birkaç saniyede bir göz kırpıyor.
- [ ] Görselin hangi araçla üretildiği not edilsin; aracın ticari kullanım koşulu kontrol edilsin.

## 2. Salim Bey'den gereken bilgiler

- [ ] Mezun olduğu üniversite ve yıl
- [ ] Kaç yıldır hekimlik yapıyor (kliniğin 2020'de açıldığı sitede yazıyor)
- [ ] Özel ilgi alanları (ör. kedi hastalıkları, diş, cerrahi)
- [ ] Ekipte başka kimler var (isim ve görev); "Hakkımızda"ya ekip bölümü eklenebilir

## 3. Sitede yazan ve doğrulanması gereken bilgiler

- [ ] **KVKK Aydınlatma Metni ve Çerez Politikası** hazırlandı (altbilgide "Yasal" sütunu). İşletmenin vergi levhasındaki **resmî unvanı** panelde "İletişim ve çalışma saatleri → İşletmenin resmî unvanı" alanına yazılmalı (şu an "Güzelyalı Veteriner Kliniği – Veteriner Hekim Salim Hakveren" yazıyor). Metinlerin yayından önce bir hukukçuya ya da mali müşavire gösterilmesi önerilir.
- [x] Hizmetler kliniğin verdiği 6 gruba göre düzenlendi; Pet Shop ürün grupları da eklendi.
- [ ] Aşılar karneye işleniyor ve sonraki tarih bildiriliyor mu?
- [ ] Yoğun bakımda hasta gece de kalabiliyor mu? Sitede "gözetim altında" diye genel yazıyor.
- [ ] Girişin ve otoparkın tekerlekli sandalyeye uygun olduğu (Google'da öyle yazıyor) doğru mu?
- [ ] 0541 916 20 53 numarasında WhatsApp açık mı? Tüm randevu butonları ve iletişim formu bu numaraya gidiyor.
- [x] Çalışma saatleri: pazartesi–cumartesi 09:30–20:00, pazar kapalı (klinikten onaylandı). Google profilindeki saat de buna göre güncellenmeli.
- [ ] Mesai dışında acil hasta kabul ediliyor mu? Ediliyorsa siteye "Acil durumlar" satırı eklenir.
- [ ] Sitede alıntılanan 4 Google yorumu (ad ve soyadın baş harfiyle) yayında kalsın mı?
- [ ] Sıkça sorulan 5 sorunun cevapları (Hizmetler sayfasının altında) doğru mu?

## 4. Blog yazıları

Üç yazı genel bilgilendirme olarak yazıldı: aşı takvimi, kene ve pire koruması, köpeklerde diş taşı. **Yayından önce Salim Bey'in okuyup onaylaması gerekiyor.** Kliniğin uygulamasına uymayan bir nokta varsa düzeltirim. Yeni yazı konuları da önerebilir; her ay 1–2 yazı Google'da görünürlüğü artırır.

## 5. Yayına almak için

- [x] Alan adı: **www.adanaguzelyaliveteriner.com**, e-posta: **destek@adanaguzelyaliveteriner.com** (sitede altbilgide ve İletişim sayfasında).
- [ ] Barındırma ücretsiz olabilir (Netlify, Vercel ya da Cloudflare Pages). Kurulumu ben yaparım.
- [ ] Yayına alınca: Google Search Console'a site haritasını gönder, Google profilinde ve Instagram'da web sitesi adresini güncelle (adımlar `YAYINA-ALMA.md`).

## Teknik not

İçerikler `content/` klasöründe ve site panelinden (`/admin`) düzenleniyor. Kurulum ve yayına alma adımları `YAYINA-ALMA.md`, işletmeci için kullanım kılavuzu `PANEL-KILAVUZU.md` dosyasında. Eski sürümler `arsiv/` klasöründe.
