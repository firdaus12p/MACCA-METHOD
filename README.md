# MACCA - METHOD

**MACCA** adalah sistem pengembangan perangkat lunak berbasis AI yang bekerja dari **spesifikasi tertulis**, bukan tebakan. Sebelum ada satu baris kode pun, semua keputusan penting sudah didokumentasikan. AI bekerja sesuai dokumen itu — bukan asumsi.

> **Macca** berasal dari bahasa Bugis yang berarti *pintar, cerdas, pandai*. Dalam falsafah Bugis-Makassar, kepintaran selalu disandingkan dengan sifat-sifat luhur — identitas moral yang dibawa ke mana saja.

![MACCA Method](image-macca-method.webp)

---

## Daftar Isi

1. [Masalah yang Diselesaikan](#1-masalah-yang-diselesaikan)
2. [Cara Kerja](#2-cara-kerja)
3. [Glosarium Istilah](#3-glosarium-istilah)
4. [Daftar Skill](#4-daftar-skill)
5. [Workflow: Project Baru](#5-workflow-project-baru)
6. [Workflow: Project yang Sudah Berjalan / Boilerplate](#6-workflow-project-yang-sudah-berjalan--boilerplate)
7. [Workflow: Menambah Fitur Baru](#7-workflow-menambah-fitur-baru)
8. [Workflow: Memperbaiki Bug](#8-workflow-memperbaiki-bug)
9. [Instalasi & Cara Menggunakan](#9-instalasi--cara-menggunakan)
10. [Struktur Folder](#10-struktur-folder)

---

## 1. Masalah yang Diselesaikan

Ketika menggunakan AI untuk coding tanpa panduan yang jelas, sering terjadi:

- AI membuat kode yang tidak sesuai dengan kebutuhan bisnis
- Setiap sesi AI seolah "lupa" konteks project sebelumnya
- Tidak ada standar kode — setiap file ditulis dengan gaya berbeda
- Sulit tahu kapan fitur benar-benar selesai
- Bug yang sama muncul berulang kali

**MACCA menyelesaikan ini** dengan cara: semua keputusan (fitur, database, API, tampilan, standar kode) ditulis dalam dokumen spec terlebih dahulu. AI membaca dokumen itu sebelum coding, dan memverifikasi hasilnya setelah coding.

---

## 2. Cara Kerja

MACCA menggunakan **skill** — instruksi terstruktur yang diberikan ke AI untuk menjalankan tugas spesifik. Setiap skill punya tanggung jawab yang jelas dan tidak tumpang tindih.

```
┌─────────────────────────────────────────────────────┐
│                    FASE PERENCANAAN                  │
│                                                     │
│  brainstorm-prd → brainstorm-architecture           │
│                             ↓                       │
│                         brainstorm-schema           │
│                             ↓                       │
│                         brainstorm-api              │
│                             ↓                       │
│                  brainstorm-styleguide (opsional)   │
│                             ↓                       │
│                         brainstorm-rules            │
│                             ↓                       │
│                         brainstorm-task             │
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│                    FASE EKSEKUSI                     │
│                                                     │
│            developer (per fase Task.md)             │
│                ↓ (setelah tiap fase)                │
│         spec-compliance → code-review               │
└─────────────────────────────────────────────────────┘
```

Semua dokumen hasil perencanaan disimpan di folder `project-context/` di dalam project kamu.

> **Kapan saja:** kamu bisa memanggil `rapat` di fase perencanaan maupun eksekusi jika butuh diskusi multi-persona sebelum lanjut.

Jika diringkas, alurnya sederhana:
- Tentukan kebutuhan produk lewat dokumen spec.
- Turunkan spec menjadi task yang kecil dan bisa diverifikasi.
- Kerjakan task secara bertahap.
- Verifikasi hasilnya terhadap spec dan kualitas kode.

Mulai dari requirement utama, spec sebaiknya memakai `Traceability ID` agar coverage ke schema, API, task, dan implementasi bisa diaudit dengan cepat.
Untuk data yang bisa dibuat terstruktur, utamakan tabel, heading tetap, dan field eksplisit. Jangan kembali ke paragraf bebas jika informasi itu perlu dipindai mesin maupun diaudit manusia.

---

## 3. Glosarium Istilah

| Istilah | Penjelasan Sederhana |
|---|---|
| **Skill** | Instruksi lengkap untuk AI agar melakukan tugas tertentu. Seperti "SOP" untuk AI. |
| **Spec** / **Dokumen Spec** | Dokumen perencanaan project — berisi semua keputusan sebelum coding dimulai. |
| **Subagent** | Agen bantu yang dipakai AI untuk eksplorasi, riset, atau analisis terfokus, lalu kembali dengan ringkasan singkat. |
| **project-context/** | Folder tempat semua dokumen spec disimpan, di dalam project kamu. |
| **PRD.md** | *Product Requirements Document* — daftar fitur, aturan bisnis, dan kriteria selesai. |
| **architecture.md** | Keputusan teknis: bahasa pemrograman, framework, struktur folder, pola desain. |
| **schema.md** | Desain database: tabel apa yang ada, kolom-kolomnya, dan relasinya. |
| **api.md** | Daftar endpoint API: URL, method (GET/POST/dll), format request dan response. |
| **rules.md** | Standar penulisan kode: penamaan variabel, format, dan aturan yang tidak boleh dilanggar. Mengandung seksi `[FORBIDDEN]` — daftar larangan teknis yang wajib dipindai AI sebelum menulis kode. |
| **StyleGuide.md** | Panduan tampilan: warna, font, komponen UI, framework CSS yang digunakan. |
| **Task.md** | Rencana kerja bertahap: daftar semua tugas yang harus dikerjakan, dikelompokkan per fase. |
| **Fase** | Kelompok task yang saling berkaitan, diselesaikan bersama. Contoh: "Fase 1: Setup Database". |
| **Task** | Satuan pekerjaan terkecil yang bisa diselesaikan dalam satu sesi. |
| **Traceability ID** | Label stabil seperti `FEAT-01`, `BR-02`, `API-03`, `DATA-01` yang dipakai untuk melacak requirement dari PRD sampai task dan implementasi. |
| **Acceptance Criteria** | Kondisi yang harus terpenuhi agar sebuah task dianggap selesai. Bisa dicek secara konkret. |
| **Boilerplate** | Template atau starter code project yang sudah ada sebelum mulai coding dari nol. |
| **spec-compliance** | Verifikasi bahwa kode sudah sesuai dengan dokumen spec. |
| **code-review** | Pemeriksaan kualitas, keamanan, dan over-engineering kode — bukan soal spec, tapi soal kualitas implementasi dan peluang simplifikasi yang aman. |
| **bug-log.md** | Catatan semua bug yang pernah ditemukan dan diperbaiki — supaya AI belajar dari sejarah. |
| **[FORBIDDEN]** | Seksi di `rules.md` berisi daftar larangan teknis (hardcode, `any`, console.log, dll). AI memindainya sebelum menulis kode. |
| **[SELF-REVIEW]** | Output singkat dari `developer` setelah tiap task selesai: 1 potensi security risk, 1 performance bottleneck, 1 asumsi yang dibuat dari spec. |

### 3b. Traceability ID Scheme

Gunakan prefix berikut secara konsisten di dokumen spec:

| Prefix | Digunakan Untuk |
|---|---|
| `FEAT-01` | Fitur utama di `PRD.md` |
| `BR-01` | Business rule di `PRD.md` |
| `NFR-01` | Non-functional requirement di `PRD.md` |
| `AC-01` | Acceptance Criteria di `PRD.md` |
| `US-01` | User story di `PRD.md` |
| `DATA-01` | Tabel atau entitas data di `schema.md` |
| `API-01` | Endpoint atau kontrak API di `api.md` |
| `RULE-01` | Aturan spesifik di `rules.md` jika perlu dirujuk lintas dokumen |

Aturan:
- Nomor dimulai dari `01` untuk setiap prefix.
- Jangan ubah ID lama hanya karena urutan konten berubah.
- Item baru menambah ID baru; item lama mempertahankan ID lama.

### 3c. Istilah Mode

MACCA memakai istilah `mode` untuk konteks yang berbeda. Bedakan seperti ini:

- **Mode pembahasan**: dipakai di skill `brainstorm-*` untuk memilih cara wawancara, misalnya `satu per satu` atau `tiga topik sekaligus`.
- **Mode audit**: dipakai di `spec-audit`, yaitu `Project Audit` atau `Framework Audit`.
- **Mode generate**: dipakai di `spec-init`, yaitu `Batch Generate` atau `Guided Generate`.

### 3d. developer-config.json Schema

File `.agents/developer-config.json` adalah konfigurasi bersama lintas skill. Field-field ini **boleh hidup berdampingan** dalam satu file:

```json
{
  "name": "Nama user",
  "project": "Nama project",
  "languagePreferences": {
    "communication": {
      "raw": "Bahasa Indonesia",
      "normalized": "indonesian"
    },
    "documents": {
      "raw": "Bahasa Indonesia",
      "normalized": "indonesian"
    }
  },
  "developerPreferences": {
    "workMode": "direct"
  },
  "brainstormPreferences": {
    "discussionMode": "one-by-one",
    "recommendations": true
  },
  "additionalSkills": [
    {
      "name": "nama-skill",
      "purpose": "fungsi singkat",
      "paths": {
        "copilot": ".github/skills/nama-skill/SKILL.md",
        "opencode": ".opencode/skill/nama-skill/SKILL.md",
        "codex": ".agents/skills/nama-skill/SKILL.md"
      }
    }
  ]
}
```

Aturan penulisan:
- Semua skill yang mengubah file ini harus **merge dengan isi yang sudah ada**, bukan menimpa seluruh file.
- Field yang tidak dikenali skill tetap harus dipertahankan.
- `languagePreferences.*.raw` menyimpan input asli/effective choice dari user.
- `languagePreferences.*.normalized` menyimpan bentuk stabil yang dipakai skill untuk routing bahasa output.
- Untuk kompatibilitas, reader skill harus menerima bentuk lama seperti `path`, `githubPath`, `opencodePath`, atau nilai bahasa singkat seperti `id` / `en` jika ditemukan pada project lama.

Catatan:
- Saat install pertama, installer menanyakan **bahasa komunikasi** dan **bahasa dokumen yang dihasilkan** lalu menyimpannya di file ini.
- Untuk project lama yang belum punya `languagePreferences`, skill pertama yang dijalankan harus **bertanya sekali**, menyimpan hasilnya, lalu memakai preferensi itu untuk sesi berikutnya.
- Semua **instruksi sistem skill** boleh ditulis dalam bahasa Inggris demi hemat token dan presisi, tetapi **output ke user** dan **dokumen yang dihasilkan** wajib mengikuti `languagePreferences`.
- Literal sistem/teknis seperti nama file (`PRD.md`, `Task.md`), ID (`FEAT-01`, `API-01`), field (`ai_enabled`), atau simbol kode (`fromMe: true`) **tidak diterjemahkan**.
- `developerPreferences.workMode` dipakai oleh skill `developer` untuk mengingat pilihan mode kerja (`direct` atau `plan-first`).
- Begitu dipilih sekali, mode ini dipakai terus di sesi berikutnya sampai kamu meminta perubahan.

---

## 4. Daftar Skill

### Skill Perencanaan (Brainstorm)

| Skill | Persona | Fungsi | Kapan Digunakan |
|---|---|---|---|
| `brainstorm-prd` | @Galbi | Membuat PRD.md melalui sesi wawancara interaktif | Pertama kali, saat memulai project baru |
| `brainstorm-architecture` | @Fachri | Membuat architecture.md — keputusan tech stack dan struktur | Setelah PRD selesai (**wajib sebelum schema & api**) |
| `brainstorm-schema` | @Fachri | Membuat schema.md — desain database | Setelah architecture selesai |
| `brainstorm-api` | @Fachri | Membuat api.md — kontrak endpoint API | Setelah schema selesai |
| `brainstorm-rules` | @Fachri | Membuat rules.md — standar kode dan daftar larangan `[FORBIDDEN]` | Kapan saja, tapi sebelum coding dimulai |
| `brainstorm-styleguide` | @Akram | Membuat StyleGuide.md — panduan desain UI/UX | Setelah PRD dan architecture jelas, jika project punya UI (**opsional, bisa diskip**) |
| `brainstorm-task` | @Galbi | Membuat Task.md — rencana kerja bertahap dengan urutan TDD (task test sebelum task implementasi) | Setelah semua spec di atas selesai |

### Skill Eksekusi

| Skill | Persona | Fungsi | Kapan Digunakan |
|---|---|---|---|
| `developer` | @Firdaus | Mengerjakan task dari Task.md dengan pendekatan TDD — test ditulis sebelum implementasi, solusi dipilih dari opsi paling kecil yang tetap aman, tiap task divalidasi sempit, `[SELF-REVIEW]` ditulis setelah tiap task, dan mode kerja bisa diingat antar sesi | Setelah Task.md ada dan siap dikerjakan |
| `spec-compliance` | @Fachri | Verifikasi kode terhadap semua dokumen spec | Otomatis setelah setiap fase di developer |
| `code-review` | @Fachri | Cek kualitas, keamanan, dan over-engineering kode (27 item + security essentials + peluang simplifikasi) | Setelah spec-compliance bersih |

### Skill Utilitas

| Skill | Persona | Fungsi | Kapan Digunakan |
|---|---|---|---|
| `help` | @Galbi | Deteksi kondisi project, rekomendasikan langkah berikutnya, dan merujuk ke README/skill yang relevan saat butuh penjelasan lebih dalam | Kapan saja, terutama jika bingung harus mulai dari mana |
| `bug-fix` | @Ikhsan | Diagnosis, perbaikan, dokumentasi bug, dan regression prevention | Saat ada bug yang perlu diperbaiki |
| `add-feature` | @Galbi | Tambah fitur baru ke project yang sudah berjalan | Setelah project berjalan dan ada fitur baru |
| `spec-audit` | @Fachri | Cek konsistensi antar dokumen spec project atau antar instruksi framework MACCA itu sendiri | Setelah beberapa/semua spec selesai, sebelum coding, atau saat ingin merapikan MACCA |
| `spec-init` | @Fachri | Buat semua spec dari codebase yang sudah ada, lengkap dengan `Evidence Inputs` dan `Confidence Summary` per dokumen | Untuk project yang sudah berjalan tapi belum punya spec |
| `rapat` | @Galbi | Diskusi tim multi-persona dalam satu sesi, dengan handoff keputusan ke artefak spec | Kapan saja, saat butuh perspektif dari beberapa keahlian sekaligus |

> `spec-audit` punya dua mode: **mode project** untuk audit `project-context/`, dan **mode framework** untuk audit README + skill docs MACCA.
> Gunakan **mode framework** terutama setelah perubahan besar di beberapa skill, sebelum rilis versi MACCA baru, saat ada skill baru, atau saat kamu curiga ada drift instruksi antar skill.

### Tim AI MACCA

Setiap skill dijalankan oleh satu **persona** — karakter AI dengan keahlian spesifik. Kamu bisa memanggil mereka by name selama sesi.

| Persona | Role | Skills |
|---|---|---|
| **@Galbi** | Project Manager | `brainstorm-prd`, `brainstorm-task`, `add-feature`, `help`, `rapat` |
| **@Fachri** | Tech Lead | `brainstorm-architecture`, `brainstorm-api`, `brainstorm-schema`, `brainstorm-rules`, `spec-init`, `spec-audit`, `spec-compliance`, `code-review` |
| **@Akram** | UI/UX Designer | `brainstorm-styleguide` |
| **@Firdaus** | Expert Developer | `developer` |
| **@Ikhsan** | Debugger | `bug-fix` |

**Aturan Persona:** Setiap skill dirancang untuk satu persona spesifik. Jangan tukar persona pemilik skill, karena instruksi, nada, dan tanggung jawabnya sudah dibentuk untuk role tersebut.

---

## 5. Workflow: Project Baru

Gunakan alur ini jika kamu memulai project dari nol.

```
Langkah 1: Mulai dari ide
  → Panggil: brainstorm-prd
  → Hasil: project-context/PRD.md

Langkah 2: Definisikan arsitektur
  → Panggil: brainstorm-architecture   ← WAJIB sebelum lanjut
  → Hasil: project-context/architecture.md

Langkah 3a: Desain database (jika ada)
  → Panggil: brainstorm-schema
  → Hasil: project-context/schema.md

Langkah 3b: Definisikan API (jika ada)
  → Panggil: brainstorm-api            ← harus setelah schema
  → Hasil: project-context/api.md

Langkah 3c: Definisikan tampilan (jika ada UI)
  → Panggil: brainstorm-styleguide   ← setelah PRD + architecture jelas
  → Hasil: project-context/StyleGuide.md

Langkah 4: Tetapkan standar kode
  → Panggil: brainstorm-rules
  → Hasil: project-context/rules.md

Langkah 5: Cek konsistensi (opsional tapi disarankan)
  → Panggil: spec-audit (mode project)
  → Hasil: Laporan konflik antar dokumen

Langkah 6: Buat rencana kerja
  → Panggil: brainstorm-task
  → Hasil: project-context/Task.md

Langkah 7: Mulai coding
  → Panggil: developer
  → Per task: kode → validasi task
  → Per fase: spec-compliance → code-review → fase berikutnya
  → Hingga: semua task selesai
```

> **Tips:** Jika bingung harus mulai dari mana, panggil `help` — skill ini akan mendeteksi kondisi project kamu dan merekomendasikan langkah berikutnya.

---

## 6. Workflow: Project yang Sudah Berjalan / Boilerplate

Gunakan alur ini jika kamu punya codebase yang sudah ada tapi belum punya dokumen spec.

```
Langkah 1: Generate spec dari codebase yang ada
  → Panggil: spec-init
  → AI akan baca codebase kamu dan generate semua dokumen spec secara otomatis.
  
  Ada dua mode:
  ┌─────────────────────────────────────────────────────┐
  │ Mode Batch Generate  : Semua dokumen dibuat         │
  │                       sekaligus.                    │
  │                Cocok untuk project kecil.           │
  │                                                     │
  │ Mode Guided Generate : Satu dokumen dibuat,         │
  │                        kamu review, konfirmasi,     │
  │                        lalu lanjut ke berikutnya    │
  │                Cocok untuk project besar.           │
  └─────────────────────────────────────────────────────┘
  
  Urutan generate (otomatis):
  architecture.md → rules.md → schema.md → api.md → StyleGuide.md → PRD.md
  
  Catatan: PRD dibuat terakhir karena isinya disimpulkan dari kode yang ada,
  bukan dari asumsi.

Langkah 2: Review & koreksi dokumen spec
  → Baca setiap file di project-context/ dan pastikan isinya akurat.
  → Perhatikan terutama item dengan `Evidence Inputs`, confidence Sedang / Rendah, dan bagian asumsi yang masih perlu verifikasi.
  → Koreksi jika ada yang tidak sesuai dengan kenyataan project.

Langkah 3: Cek konsistensi
  → Panggil: spec-audit (mode project)
  → Pastikan tidak ada konflik antar dokumen.

Langkah 4: Buat rencana kerja untuk fitur-fitur baru
  → Panggil: brainstorm-task
  → Hasil: project-context/Task.md

Langkah 5: Lanjut seperti biasa
  → Panggil: developer untuk mulai mengerjakan task.
```

---

## 7. Workflow: Menambah Fitur Baru

Gunakan alur ini ketika semua task sudah selesai tapi ada fitur baru yang ingin ditambahkan.

```
→ Panggil: add-feature

Apa yang terjadi:
  1. AI membaca semua spec yang ada
  2. Kamu mendeskripsikan fitur baru
  3. AI mengidentifikasi dokumen mana yang perlu diupdate
  4. AI mengupdate SEMUA dokumen yang terdampak (wajib, tidak ada yang dilewati)
  5. AI memanggil brainstorm-task untuk menambahkan fase dan task baru
  6. Kamu melanjutkan dengan developer seperti biasa
```

---

## 8. Workflow: Memperbaiki Bug

Gunakan alur ini ketika ada bug yang perlu diperbaiki.

```
→ Panggil: bug-fix

Apa yang terjadi:
  1. Kamu mendeskripsikan bug (gejala, lokasi, cara reproduksi)
  2. AI cek bug-log.md — apakah bug ini pernah terjadi sebelumnya?
     - Jika identik dengan bug lama → terapkan fix yang sama
     - Jika mirip tapi berbeda → diagnosis ulang, tambah log baru
     - Jika baru → diagnosis dari awal
  3. AI merumuskan root cause (penyebab utama) dan menjelaskan ke kamu
  4. Kamu konfirmasi sebelum fix diterapkan
  5. Fix diterapkan, lalu spec-compliance + code-review dijalankan
  6. Kamu konfirmasi bahwa bug sudah teratasi
  7. AI menambahkan regression prevention (test, rule/spec update, atau checklist manual)
  8. AI mencatat bug + solusi ke project-context/bug-log.md
    (baru dicatat setelah kamu konfirmasi — tidak otomatis)
```

---

## 9. Instalasi & Cara Menggunakan

**Prasyarat:** GitHub Copilot aktif di VS Code.

### Instalasi

Masuk ke folder project kamu, lalu jalankan **satu perintah** berikut:

**Linux / Mac**

```bash
curl -fsSL https://raw.githubusercontent.com/firdaus12p/MACCA-METHOD/main/install.sh | bash
```

**Windows (PowerShell)**

```powershell
irm https://raw.githubusercontent.com/firdaus12p/MACCA-METHOD/main/install.ps1 | iex
```

Installer akan menampilkan daftar AI tool dengan selektor interaktif:

```
  Pilih AI provider yang kamu gunakan:

  [ ]  GitHub Copilot    → .github/skills/
  [ ]  Cursor            → .cursor/skills/
  [ ]  Claude Code       → .claude/skills/
  [ ]  Windsurf          → .windsurf/skills/
  [ ]  Gemini CLI        → .gemini/skills/
  [ ]  OpenCode          → .opencode/skill/
  [ ]  Kilo Code         → .kilo/skills/
  [ ]  Codex / OpenAI   → .agents/skills/  (native)
  [ ]  Kimi CLI          → ~/.config/agents/skills/

  ↑/↓ navigasi  ·  Spasi pilih  ·  Enter konfirmasi
```

Gunakan ↑/↓ untuk navigasi, Spasi untuk centang/hapus pilihan, dan Enter untuk konfirmasi. Kamu bisa memilih lebih dari satu tool. Installer juga menanyakan nama developer dan nama project (keduanya opsional).

### Update ke Versi Terbaru

Dari dalam folder project kamu:

**Linux / Mac**

```bash
curl -fsSL https://raw.githubusercontent.com/firdaus12p/MACCA-METHOD/main/upgrade.sh | bash
```

**Windows (PowerShell)**

```powershell
irm https://raw.githubusercontent.com/firdaus12p/MACCA-METHOD/main/upgrade.ps1 | iex
```

> `project-context/` dan `developer-config.json` kamu **tidak akan tersentuh** saat upgrade. Skills di semua folder tool **diperbarui otomatis** sesuai pilihan saat install.

### Cara Memanggil Skill

Ketik nama skill di chat tool AI kamu. Semua tool yang didukung mengenali skill secara native.

Pola paling aman dan paling konsisten adalah:

```
Gunakan skill brainstorm-prd untuk mulai project baru saya.
```

Contoh lain:

```
Gunakan skill developer
```

Kalau belum yakin harus mulai dari mana, panggil `help`:

```
Gunakan skill help
```

Kalau ingin konsisten, cukup gunakan frasa **"Gunakan skill [nama-skill]"** untuk semua skill.

---

## 10. Struktur Folder

Contoh struktur setelah install dengan GitHub Copilot dipilih:

```
your-project/
├── .agents/
│   ├── developer-config.json    ← nama developer, nama project, dan preferensi brainstorm (opsional)
│   │                              juga menyimpan mode kerja developer jika dipilih
│   └── macca-tools.txt          ← tools yang dipilih saat install
│
├── .agents/skills/              ← hanya jika Codex / OpenAI dipilih
│   ├── _shared/
│   │   └── references/          ← source of truth bersama (config, ownership, persona, dll)
│   ├── developer/
│   │   └── references/          ← detail workflow yang diekstrak dari SKILL.md utama
│   ├── code-review/
│   │   └── references/          ← checklist review yang diekstrak dari SKILL.md utama
│   └── ...
│
├── .github/
│   └── skills/                  ← folder skills untuk GitHub Copilot
│       ├── add-feature/
│       ├── brainstorm-api/
│       ├── brainstorm-architecture/
│       ├── brainstorm-prd/
│       ├── brainstorm-rules/
│       ├── brainstorm-schema/
│       ├── brainstorm-styleguide/
│       ├── brainstorm-task/
│       ├── bug-fix/
│       ├── code-review/
│       ├── developer/
│       ├── help/
│       ├── rapat/
│       ├── spec-audit/
│       ├── spec-compliance/
│       └── spec-init/
│
├── project-context/             ← dibuat otomatis oleh skill
│   ├── PRD.md
│   ├── architecture.md
│   ├── schema.md
│   ├── api.md
│   ├── rules.md
│   ├── StyleGuide.md
│   ├── Task.md
│   ├── bug-log.md               ← dibuat otomatis saat ada bug pertama
│   └── plans/                   ← rencana kerja per fase (opsional)
│       └── fase-1-setup-database.md
│
├── skills-lock.json
└── ... (kode project kamu)
```

Folder skills dibuat sesuai AI tool yang dipilih saat install:

| AI Tool | Folder Skills |
|---|---|
| GitHub Copilot | `.github/skills/` |
| Cursor | `.cursor/skills/` |
| Claude Code | `.claude/skills/` |
| Windsurf | `.windsurf/skills/` |
| Gemini CLI | `.gemini/skills/` |
| OpenCode | `.opencode/skill/` |
| Kilo Code | `.kilo/skills/` |
| Codex (OpenAI) | `.agents/skills/` |
| Kimi CLI | `~/.config/agents/skills/` (global, di luar project) |

> Jika Codex dipilih, skills berada di `.agents/skills/` — folder `.agents/` akan memiliki subfolder `skills/` tambahan di samping `developer-config.json` dan `macca-tools.txt`. Kamu bisa memilih lebih dari satu tool; setiap tool mendapat salinan skills-nya sendiri.

---

## Pertanyaan Umum

**Q: Harus isi semua dokumen spec dulu sebelum coding?**

Tidak harus sempurna. Minimal yang harus ada sebelum `developer` bisa jalan: `PRD.md`, `architecture.md`. Semakin lengkap spec, semakin akurat AI bekerja — tapi tidak harus sempurna di awal.

**Q: Apakah bisa dipakai untuk project yang sudah berjalan?**

Bisa. Gunakan skill `spec-init` — AI akan membaca kodebase yang ada dan menghasilkan semua dokumen spec secara otomatis.

**Q: Apakah AI bisa membuat kesalahan?**

Bisa. Itulah kenapa ada `spec-compliance` (cek kode vs spec) dan `code-review` (cek kualitas kode) yang dijalankan otomatis setelah setiap fase selesai. Jika ada yang tidak sesuai, AI memperbaikinya sebelum lanjut.

**Q: Apakah semua dokumen punya `Confidence Summary`?**

Tidak. `Confidence Summary` adalah output default dari `spec-init`, karena skill itu mengekstrak fakta dan inferensi dari codebase yang sudah ada. Skill `brainstorm-*` biasanya tidak memerlukannya karena isinya dibangun langsung lewat wawancara dan konfirmasi user.

Namun untuk dokumen hasil `spec-init`, AI sekarang sebaiknya mengandalkan dua penanda sekaligus:
- `Evidence Inputs` → file/sumber apa yang dipakai untuk menyusun dokumen
- `Confidence Summary` → mana fakta kuat, mana inferensi, mana yang masih perlu verifikasi

Kalau project banyak ditulis dengan AI, dua section ini sangat membantu agent berikutnya agar tidak salah menganggap inferensi sebagai fakta.

**Q: Kenapa ada section seperti `Document Role`, `Canonical Terminology`, atau `Assumptions & Open Questions` di beberapa template output?**

Karena AI sering membaca `project-context/` berulang kali saat coding. Section seperti ini membuat dokumen lebih mudah dipindai mesin:
- `Document Role` → dokumen ini source of truth untuk apa
- `Canonical Terminology` → istilah yang harus dipakai konsisten
- `Assumptions & Open Questions` → area yang belum final, supaya AI tidak overbuild

Tujuannya bukan menambah formalitas, tapi mengurangi tebakan agent saat bekerja lintas sesi.

**Q: Apakah saya harus memilih mode kerja `developer` setiap sesi?**

Tidak. Setelah kamu memilih sekali antara mode `direct` atau `plan-first`, pilihan itu disimpan di `.agents/developer-config.json` dan akan dipakai terus di sesi berikutnya. Jika ingin ganti, cukup bilang saat memulai sesi dan AI akan memperbarui preferensinya.

**Q: Bagaimana jika saya tidak mengerti istilah teknis?**

Skill `developer` dirancang untuk menjelaskan keputusan teknis menggunakan **analogi** dari kehidupan sehari-hari. Jika ada yang tidak jelas, AI akan berhenti dan bertanya sebelum melanjutkan.

**Q: Apakah bug-log otomatis diupdate?**

Tidak. Bug hanya dicatat setelah **kamu mengonfirmasi** bahwa bug sudah benar-benar teratasi. AI tidak akan mencatat ke bug-log tanpa izin kamu.

---

**Q: Kenapa developer menulis test sebelum kode implementasi?**

Ini adalah pendekatan TDD (Test-Driven Development). Dengan menulis test dulu, AI dipaksa mendefinisikan signature dan perilaku fungsi secara pasti sebelum implementasi dimulai — mencegah perubahan struktur di tengah jalan. Kamu akan melihat task test (`Task N.1`) selalu hadir sebelum task implementasi (`Task N.2`) di Task.md.

---

**Q: Apa itu `[SELF-REVIEW]` yang muncul setelah developer coding?**

Setelah setiap task selesai, developer menulis refleksi singkat: 1 potensi security risk, 1 potensi performance bottleneck, dan 1 asumsi yang dibuat dari spec. Tujuannya adalah mengekspos tebakan tersembunyi sebelum masuk ke fase verifikasi (`spec-compliance` + `code-review`).

---

## Lisensi

MIT License — bebas digunakan, dimodifikasi, dan didistribusikan.
