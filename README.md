# WA Mod Bot

Bot WhatsApp khusus moderasi grup (bukan bot game). Dibuat pakai [Baileys](https://github.com/WhiskeySockets/Baileys) v7 (ESM, masih *release candidate*) + database [Turso](https://turso.tech) (SQLite terdistribusi, gratis, persisten).

## Soal tombol interaktif (quick reply, list "Pilih Menu", cta_url)

**Update:** ternyata masih bisa. Investigasi lanjutan nemu akar masalah sebenarnya: WhiskeySockets/Baileys resmi sengaja tidak menyertakan 3 *binary node* pembungkus (`biz`, `interactive`/`native_flow`, `bot`) yang dibutuhkan WhatsApp untuk merender pesan interaktif — bukan karena fiturnya benar-benar mati total.

**Yang sudah diterapkan di project ini:**
- Migrasi ke **Baileys v7** (`7.0.0-rc13`) — versi ini ESM-only, jadi seluruh project (28 file) sudah dikonversi dari CommonJS (`require`) ke ESM (`import`/`export`)
- Modul `src/features/buttons.js` menambahkan sendiri binary node yang hilang tadi lewat `sock.relayMessage()` + `additionalNodes` — **ditulis sendiri di kode kita**, bukan pakai paket npm pihak ketiga yang kecil/tidak teraudit (ingat obrolan kita soal resiko privasi — saya tetap gak mau masukin dependency yang gak jelas ke bot kamu)
- Menu, `.mcpatch`, dan alur `.shaders` sekarang kirim tombol native (quick reply / list "Pilih Menu" / tombol buka link) kalau berhasil, **otomatis fallback ke teks biasa** kalau native flow gagal — jadi bot tidak akan pernah macet/gagal kirim pesan hanya karena tombolnya bermasalah

**Yang perlu kamu tahu sebelum pakai:**
- Ini **status eksperimental**. Struktur binary node yang saya pakai disusun dari pola yang didokumentasikan komunitas (paket-paket kecil seperti `flow-buttons`, `@ryuu-reinzz/button-helper`), bukan dari source resmi WhatsApp — jadi ada kemungkinan tidak 100% render di semua versi app WhatsApp, dan bisa berhenti berfungsi kapan saja kalau WhatsApp mengubah validasinya lagi (sama seperti nasib fitur ini di 2023)
- Baileys v7 masih **release candidate**, belum versi stabil resmi — ada kemungkinan bug yang belum ketemu
- Kalau setelah testing ternyata tombol tetap tidak muncul atau malah bikin bot error, set `ENABLE_NATIVE_BUTTONS=false` di `.env` — bot otomatis balik ke menu teks yang sudah pasti stabil, tanpa perlu ubah kode apapun

**Coba dulu, kabari saya hasilnya** — kalau tombolnya muncul, mantap. Kalau tidak, kita tahu persis di mana perlu di-tweak lagi (struktur node-nya kemungkinan besar yang perlu disesuaikan).

## Fitur

**Owner bot (bukan lagi dicocokkan lewat nomor)**
- Nomor tempat bot ini **login (scan QR) otomatis jadi owner**. Chat bot lewat fitur **"Message Yourself"** di WhatsApp (chat ke akun sendiri) untuk kontrol penuh — ini cara paling akurat karena tidak bergantung ke format nomor sama sekali.
- Owner bisa menambah owner lain (misal admin kepercayaan) lewat `.setowner @user` (tag atau reply pesan orangnya) — JID orang itu disimpan persis apa adanya, jadi tetap akurat walau WhatsApp menampilkannya sebagai `@lid` (ID privasi, bukan nomor asli).
- `OWNER_NUMBERS` di `.env` masih ada sebagai fallback opsional, tapi **tidak wajib diisi** dan tidak selalu akurat karena masalah `@lid` di atas.
- **Admin grup biasa TIDAK otomatis dapat akses lewat DM** — mereka cuma bisa pakai command moderasi *di dalam grup* tempat mereka jadi admin. Yang bisa chat bot di mana saja (termasuk DM) hanya owner.

**Moderasi grup**
- Antilink (dengan whitelist link/domain tertentu)
- Anti-tag admin, anti-tag semua (threshold diatur), anti-tag status
- Antiflood (spam chat beruntun) & antibadword (filter kata custom)
- Sistem warn **per nomor WA (JID)**, bukan per nama, jadi tidak ketuker
- Auto-kick setelah limit warn tercapai (limit per jenis pelanggaran bisa diatur)
- **Kick selalu 2 tahap**: bot tag & sebutkan alasan dulu → jeda beberapa detik (`KICK_DELAY_SECONDS`, default 5 detik) → baru benar-benar dikeluarkan
- `.close` / `.open` — kunci/buka grup (cuma admin bisa chat vs semua member bisa chat). Alias: `.mute` / `.unmute`
- `.kick`, `.warn`, `.resetwarn`, `.promote`, `.demote`

**Game standar**
- `.ping`, `.random <min> <max>`

**`.mcpatch` — info Minecraft Patch Update Terbaru**
- Kartu: versi Minecraft terbaru saat ini + link resmi `mcpatch.me`
- Versi & link **disimpan di database**, diatur owner lewat `.mcpatch set version <v>` / `.mcpatch set link <url>`

**`.shaders` — alur pencarian shaders (terpisah dari `.mcpatch`)**
- `.shaders` → pilih varian: ✨ Vibrant Visuals / 🎮 Non-Vibrant
- Lalu pilih versi Minecraft dari list teks yang ditampilkan
- Link dikelola owner lewat `.mcset add|del|list <vibrant|nonvibrant> <versi> <link>`

**`.user` / `.profil` — cek profil WhatsApp**
- Nama, bio/status WA, foto profil (kalau ada), dan **total warn di grup ini** (nomor telepon sengaja tidak ditampilkan karena sering bukan nomor asli akibat `@lid`)

**Welcome & leave message — dwibahasa otomatis**
- Bahasa dipilih otomatis dari kode negara nomor yang join/keluar: **+62 (Indonesia) → Bahasa Indonesia**, selain itu (atau tidak diketahui, mis. `@lid`) → **default English**
- Admin atur teks per bahasa: `.setwelcome en <teks>` / `.setwelcome id <teks>` (begitu juga `.setleavemsg`), pakai placeholder `@user` dan `@group`
- On/off: `.welcome on/off`, `.leavemsg on/off`

**Menu & tombol interaktif (eksperimental, dengan fallback teks — lihat penjelasan di atas)**
- Menu, `.mcpatch`, dan `.shaders` mencoba kirim tombol native WhatsApp (quick reply, list "Pilih Menu", tombol buka link)
- Kalau gagal render, otomatis fallback ke teks rapi format `` `.command` `` yang tetap gampang di-tap-hold-copy
- Footer kecil di tiap pesan pakai branding (atur lewat `FOOTER_TEXT` di `.env`, default `© MCPATCH.ME 2026`)
- Matikan sepenuhnya lewat `ENABLE_NATIVE_BUTTONS=false` kalau mau balik ke mode teks stabil

**Polling**
- `.poll <pertanyaan> | <opsi1> | <opsi2> | ...` — bikin polling asli WhatsApp langsung dari grup (admin only)

**Chat pribadi (DM)**
- Member biasa yang chat pribadi ke bot hanya menerima: link join grup + pricelist (`Rp. 10.000/bulan`, hubungi `contact@juuone.me`). Ketik `.group` untuk link grup, `.price` untuk pricelist
- Command khusus owner lewat DM: `.listgroups`, `.broadcast <pesan>`, `.mcset`, `.setowner`, `.delowner`, `.listowners`, plus command umum (`.menu .ping .random .mcpatch .shaders .user .profil`)

## Database (Turso)

Semua data (pengaturan grup, warn per user, link shaders, owner tambahan, info mcpatch) disimpan di **Turso** — jadi **tidak hilang** walau Render redeploy dari nol.

### Setup lewat Web Dashboard (tanpa CLI)

1. Buka **https://turso.tech** → **Sign In** (bisa pakai GitHub)
2. **Create Database** → kasih nama (misal `wa-mod-bot`) → pilih region terdekat (misal Singapore) → **Create**
3. Masuk ke database itu → copy **Database URL** (`libsql://...`) → isi ke `TURSO_DATABASE_URL`
4. Di halaman yang sama, cari **Create Token** / **Tokens** → generate → copy tokennya (cuma tampil sekali) → isi ke `TURSO_AUTH_TOKEN`

Tabel (`group_settings`, `warns`, `shaders`, `bot_meta`, `owners`) dibuat otomatis saat bot pertama kali jalan.

> Sesi login WhatsApp (`data/auth/`) tetap di filesystem lokal, bukan di Turso — jadi tetap ephemeral di Render free plan. Kalau di-redeploy dari nol, tetap perlu scan ulang QR walau data lain di Turso aman.

## Instalasi Lokal (untuk testing)

**Butuh Node.js 20 ke atas** (Baileys v7 + ESM tidak jalan di Node versi lama). Cek versi kamu dulu:
```bash
node -v
```

```bash
npm install
cp .env.example .env
# edit .env: TURSO_DATABASE_URL, TURSO_AUTH_TOKEN, GROUP_INVITE_LINK, dll
npm start
```

Buka **`http://localhost:3000/qr`** di browser untuk scan QR. Setelah connect:
1. Tambahkan bot ke grup dan **jadikan admin grup** (wajib, supaya bisa hapus pesan & kick)
2. Buka WhatsApp kamu → cari chat **"Message Yourself"** dengan nomor bot itu sendiri (fitur bawaan WA untuk chat ke diri sendiri) → ketik `.menu` untuk pastikan akses owner jalan

## Daftar Command

Ketik `.menu` untuk lihat semua command (coba tombol list "Pilih Menu", fallback teks tap-hold-copy kalau tidak render). Ringkasan:

### Umum
| Command | Fungsi |
|---|---|
| `.menu` | Daftar semua command |
| `.ping` | Cek respon bot |
| `.random <min> <max>` | Angka acak |
| `.mcpatch` | Versi Minecraft terbaru + link mcpatch.me |
| `.shaders` | Mulai alur cari shaders (pilih varian → versi) |
| `.user` / `.profil [@user]` | Lihat profil WhatsApp + total warn di grup ini |

### Moderasi (khusus admin grup, dijalankan di dalam grup)
| Command | Fungsi |
|---|---|
| `.kick @user [alasan]` | Tag + sebutkan alasan → kick otomatis setelah jeda |
| `.warn @user [alasan]` | Warn manual (auto-kick kalau capai limit) |
| `.resetwarn @user` | Reset warn |
| `.warnlist` | Lihat semua warn di grup |
| `.promote` / `.demote @user` | Naik/turunkan admin |
| `.close` / `.open` | Kunci/buka grup (alias: `.mute` / `.unmute`) |
| `.poll <pertanyaan>\|<opsi1>\|<opsi2>` | Bikin polling WhatsApp |

### Pengaturan (khusus admin grup)
| Command | Fungsi |
|---|---|
| `.antilink on/off` | Aktif/nonaktifkan antilink |
| `.whitelist add\|del\|list <link>` | Kelola whitelist link |
| `.antitagadmin on/off` | Anti tag admin |
| `.antitagall on/off` \| `threshold <n>` | Anti tag semua + ambang batas |
| `.antitagstatus on/off` | Anti tag lewat status |
| `.antiflood on/off` | Anti spam beruntun |
| `.antibadword on/off` | Filter kata terlarang |
| `.badword add\|del\|list <kata>` | Kelola daftar kata terlarang |
| `.setwarnlimit <tipe> <n>` | Limit warn per jenis pelanggaran |
| `.setautokick <n>` | Warn ke berapa auto-kick aktif |
| `.welcome on/off` \| `.setwelcome <en\|id> <teks>` | Pesan welcome per bahasa |
| `.leavemsg on/off` \| `.setleavemsg <en\|id> <teks>` | Pesan keluar per bahasa |
| `.settings` | Lihat semua pengaturan grup |

### Khusus owner bot (bisa lewat DM / "Message Yourself")
| Command | Fungsi |
|---|---|
| `.setowner @user` | Jadikan seseorang owner tambahan |
| `.delowner @user` | Cabut status owner |
| `.listowners` | Lihat daftar owner tambahan |
| `.listgroups` | Daftar grup tempat bot berada |
| `.broadcast <pesan>` | Kirim pengumuman ke semua grup |
| `.mcpatch set version\|link ...` | Atur versi Minecraft terbaru & link mcpatch.me |
| `.mcset add\|del\|list ...` | Kelola link shaders |

---

## Deploy ke Render (Web Service, gratis)

1. Push folder ini ke repo GitHub kamu.
2. Buka [render.com](https://render.com) → **New +** → **Web Service** → hubungkan repo.
3. Setting: **Build Command** `npm install`, **Start Command** `npm start`, **Environment** Node.
4. Tambahkan environment variable `NODE_VERSION=20` (atau lebih baru) di Render supaya runtime-nya cocok — default Render kadang masih Node lama yang tidak support ESM/Baileys v7.
5. Tambahkan semua **Environment Variables** dari `.env.example` (termasuk `TURSO_DATABASE_URL` & `TURSO_AUTH_TOKEN`). Isi `SELF_URL` dengan URL Render kamu setelah deploy pertama.
6. Deploy, lalu buka `https://nama-app-kamu.onrender.com/qr` di browser untuk scan QR.

### Supaya bot tidak "tidur" (Render free service sleep setelah idle)

Render free web service sleep kalau tidak ada trafik HTTP ±15 menit. Bot ini punya endpoint `GET /ping` untuk keep-alive.

**Pakai cron-job.org (gratis):**
1. Daftar di [cron-job.org](https://cron-job.org)
2. Buat cron job: URL `https://<nama-app-kamu>.onrender.com/ping`, interval **5 menit**

### Menambahkan Cloudflare (keamanan tambahan)

1. Punya domain sendiri, tambahkan ke [Cloudflare](https://cloudflare.com) (gratis)
2. Di Render, tambahkan **Custom Domain** di *Settings → Custom Domains*, ikuti instruksi CNAME
3. Di Cloudflare DNS, buat record **CNAME** ke `<nama-app>.onrender.com` dengan proxy **"Proxied" (awan oranye)** aktif
4. Aktifkan **SSL/TLS: Full**, **Bot Fight Mode: ON**

---

## Catatan Penting

- Bot **wajib jadi admin grup** supaya bisa hapus pesan pelanggar dan kick member.
- Tombol interaktif bersifat eksperimental (lihat penjelasan di bagian atas README). Kalau bermasalah, set `ENABLE_NATIVE_BUTTONS=false` di `.env` untuk balik ke menu teks yang stabil, tanpa perlu ubah kode.
- Project ini pakai **ESM** (`"type": "module"` di `package.json`) karena Baileys v7 mewajibkannya. Semua import pakai sintaks `import`/`export`, bukan `require()` lagi.
- Fitur "anti tag status" dideteksi dari pesan yang berasal dari mention lewat Status WhatsApp — kalau perilaku WA berubah, cek/sesuaikan logic di `src/features/antitag.js`.
- Deteksi bahasa welcome/leave berdasar kode negara nomor (+62 = ID). Kalau JID member berbentuk `@lid` (privasi WA aktif), bot tidak bisa membaca kode negaranya dan otomatis pakai English.
- Delay kick bisa diatur lewat `KICK_DELAY_SECONDS` di `.env` (default 5 detik).
- Free plan Render tidak menjamin uptime 100% — untuk kebutuhan produksi serius, pertimbangkan paid plan.
