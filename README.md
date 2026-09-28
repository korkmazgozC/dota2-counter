# Dota 2 Counter

Dota 2 için **counter pick**, **meta tier listesi** ve **yetenek özelliklerine göre filtrelenebilir hero rehberi**. Mevcut patch verileriyle her gün otomatik güncellenir. Web'de, iOS'ta ve Android'de çalışır; ana ekrana eklenip uygulama gibi kullanılabilir (PWA, çevrimdışı da açılır).

## Özellikler

- **Counter pick**: Rakibin seçtiği 1–5 heroyu ekle; tüm rakiplere karşı toplam avantaja göre sıralı öneriler al. Her öneride rakip bazında avantaj dökümü var.
- **Meta ağırlığı**: Önerilerde seçili ligdeki win rate'in ne kadar etkili olacağını seç (Yok / Düşük / Orta / Yüksek).
- **Takım analizi**: Kendi takımını ekle; stun, kurtarma, iyileştirme, alan kontrolü gibi eksikleri ve melee/ranged dengesini gör.
- **Takımına karşı tehlikeli herolar**: Ban veya dikkat önerileri.
- **Rakip tehditleri & item önerileri**: Görünmezlik, illüzyon, iyileştirme, BKB delen disable vb. tehditlere karşı itemler (Dust, BKB, Spirit Vessel, Linken's…).
- **Meta**: Herald'dan Divine'a, Turbo ve Pro dahil her lig için win rate, pick rate, 7 günlük trend, Pro ban ve S/A/B/C/D tier.
- **Filtreler**: Stun, root, slow, silence, hex, disarm, taunt/fear, itme/çekme, alan kontrolü, BKB delen, break, dispel, görünmezlik, mobilite, iyileştirme, kurtarma, illüzyon, summon, zırh azaltma, mana yakma, pure hasar, global. Ayrıca özellik (Güç/Çeviklik/Zeka/Evrensel), saldırı tipi, roller ve favoriler. Filtreler VE/VEYA modunda birleştirilebilir.
- **Hero sayfası**: Liglere göre win rate, son 7 gün grafiği, bu heroya karşı güçlü olanlar / iyi olduğu rakipler, yetenekler (etiketli), Aghanim's Scepter & Shard, temel değerler.
- **Paylaş**: Draft'ı veya hero sayfasını link olarak paylaş (link açan kişi aynı draft'ı görür).
- **Türkçe / English**, favoriler, çevrimdışı çalışma.

## Telefona yükleme

- **iPhone / iPad (Safari)**: Siteyi aç → alttaki **Paylaş** butonu → **Ana Ekrana Ekle**.
- **Android (Chrome)**: Siteyi aç → menü ⋮ → **Ana ekrana ekle** / **Uygulamayı yükle**.
- **Masaüstü (Chrome/Edge)**: Adres çubuğundaki yükle simgesi.

## Yayınlama (GitHub Pages)

1. Repo → **Settings → Pages** → *Source*: **Deploy from a branch**, *Branch*: `main` / `(root)` → Save.
2. Birkaç dakika sonra site `https://<kullanıcı-adı>.github.io/<repo-adı>/` adresinde yayında olur.
3. **Actions** sekmesinde *Update hero data* workflow'u her gün verileri yeniler. İlk seferde *Run workflow* ile elle de çalıştırabilirsin.
   - İsteğe bağlı: daha hızlı güncelleme için `OPENDOTA_API_KEY` adında bir repo secret'ı ekleyebilirsin.

## Veri

- Kaynak: [OpenDota API](https://docs.opendota.com/) — `heroStats` (son 7 günün pub maçları, lig bazında), `heroes/{id}/matchups` (yüksek seviye maçlardan eşleşmeler), yetenek sabitleri.
- **Avantaj** hesabı: Bir heronun rakibe karşı win rate'i, iki heronun genel güçlerinden beklenen win rate ile karşılaştırılır. Az maçlı eşleşmeler Bayes yumuşatması ile beklenen değere çekilir (az veri olanlar `*` ile işaretlenir).
- **Yetenek etiketleri** (stun/root/slow…) `data/overrides.json` içinde her hero için elle doğrulanmıştır; yetenek bazındaki etiketler açıklamalardan otomatik çıkarılıp bu listeyle sınırlandırılır. Yeni hero geldiğinde bu dosyaya bir satır eklemek yeterli.

## Yerel geliştirme

Bağımlılık yok, derleme adımı yok.

```bash
node scripts/build-data.mjs   # verileri OpenDota'dan çek (~2.5 dk)
node scripts/serve.mjs        # http://localhost:5173
node scripts/make-icons.mjs   # ikonları yeniden üret
```

## Yapı

```
index.html, css/, js/          Uygulama (vanilla JS, ES modules)
data/heroes.json               Hero istatistikleri + yetenekler + etiketler
data/matchups.json             Hero-hero eşleşmeleri
data/overrides.json            Elle doğrulanmış etiketler
sw.js, manifest.webmanifest    PWA (çevrimdışı + ana ekrana ekleme)
scripts/                       Veri, ikon ve geliştirme sunucusu scriptleri
.github/workflows/             Günlük veri güncelleme
```

Dota 2, Valve Corporation'ın tescilli markasıdır. Bu proje Valve ile bağlantılı değildir.
