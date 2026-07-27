# MACCA — Method

**MACCA** adalah sistem pengembangan perangkat lunak berbasis AI yang bekerja dari **spesifikasi tertulis**, bukan tebakan. Sebelum ada satu baris kode pun, semua keputusan penting sudah didokumentasikan. AI membaca dokumen itu sebelum coding, lalu memverifikasi hasilnya setelah coding.

> **Macca** berasal dari bahasa Bugis yang berarti *pintar, cerdas, pandai*. Dalam falsafah Bugis-Makassar, kepintaran selalu disandingkan dengan sifat-sifat luhur — identitas moral yang dibawa ke mana saja.

![MACCA Method](image-macca-method.webp)

---

## Daftar Isi

1. [Masalah yang Diselesaikan](#1-masalah-yang-diselesaikan)
2. [Cara Kerja](#2-cara-kerja)
3. [Skill Perencanaan](#3-skill-perencanaan)
4. [Skill Eksekusi](#4-skill-eksekusi)
5. [Skill Utilitas](#5-skill-utilitas)
6. [Tim AI MACCA](#6-tim-ai-macca)
7. [Workflow](#7-workflow)
8. [Instalasi & Cara Menggunakan](#8-instalasi--cara-menggunakan)
9. [Konfigurasi](#9-konfigurasi)
10. [Pertanyaan Umum](#10-pertanyaan-umum)
11. [Lisensi](#11-lisensi)

---

## 1. Masalah yang Diselesaikan

Ketika menggunakan AI untuk coding tanpa panduan yang jelas, sering terjadi:

- AI membuat kode yang tidak sesuai kebutuhan bisnis
- Setiap sesi AI seolah "lupa" konteks project sebelumnya
- Tidak ada standar kode — setiap file ditulis dengan gaya berbeda
- Sulit tahu kapan fitur benar-benar selesai
- Bug yang sama muncul berulang kali

**MACCA menyelesaikan ini** dengan cara: semua keputusan (fitur, database, API, tampilan, standar kode) ditulis dalam dokumen spec terlebih dahulu. AI membaca dokumen itu sebelum coding, dan memverifikasi hasilnya setelah coding.

---

## 2. Cara Kerja

MACCA menggunakan **skill** — instruksi terstruktur yang diberikan ke AI untuk menjalankan tugas spesifik. Setiap skill punya tanggung jawab yang jelas dan tidak tumpang tindih.

```
┌──────────────────────────────────────────────────────┐
│                   FASE PERENCANAAN                   │
│                                                      │
│  brainstorm-prd → brainstorm-architecture            │
│                            ↓                         │
│                       brainstorm-schema              │
│                            ↓                         │
│                       brainstorm-api                 │
│                            ↓                         │
│                 brainstorm-styleguide (opsional)     │
│                            ↓                         │
│                       brainstorm-rules               │
│                            ↓                         │
│                       brainstorm-task                │
└──────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────┐
│                    FASE EKSEKUSI                     │
│                                                      │
│             developer (per fase Task.md)             │
│                 ↓ (setelah tiap fase)                │
│          spec-compliance → code-review               │
└──────────────────────────────────────────────────────┘
```

Semua dokumen hasil perencanaan disimpan di folder `project-context/` dalam project kamu.

> **Kapan saja:** kamu bisa memanggil `help` untuk melihat kondisi project dan langkah yang disarankan, atau `rapat` jika butuh diskusi multi-persona sebelum lanjut.

---

## 3. Skill Perencanaan

Skill perencanaan dijalankan melalui sesi wawancara. Di awal setiap sesi, AI mengumumkan jumlah topik, lalu menanyakan dua hal (jika belum tersimpan di config):
1. **Pacing**: (A) satu per satu · (B) tiga sekaligus · (C) semua sekaligus
2. **Rekomendasi**: apakah AI memberikan saran jawaban di setiap pertanyaan?

Pilihan ini disimpan dan dipakai terus di sesi berikutnya.

---

<details>
<summary><strong>brainstorm-prd</strong> — Membuat PRD.md (Product Requirements Document)</summary>

**Persona:** @Galbi — Project Manager

**Dipanggil saat:** Pertama kali memulai project baru. Jika `PRD.md` sudah ada, AI akan bertanya sebelum menimpa.

**Output:** `project-context/PRD.md`

**Jumlah topik:** 15 topik

**Topik yang dibahas:**
1. Tujuan Project — visi jangka panjang dan keunikan project
2. Target User — persona pengguna, demografi, pain points
3. Masalah yang Diselesaikan — masalah nyata, bukan asumsi
4. Fitur Utama (MVP) — fitur minimal yang harus ada di versi pertama
5. Business Rules — aturan bisnis yang tidak boleh dilanggar (misal: stok tidak boleh negatif)
6. Non-Goals — apa yang *tidak* akan dibangun di versi ini
7. User Stories — alur kerja nyata dari perspektif pengguna
8. Acceptance Criteria — kondisi konkret agar fitur dianggap selesai
9. Non-Functional Requirements — performa, keamanan, aksesibilitas
10. Platform & Constraints — web, mobile, atau keduanya; batasan teknis
11. Integrasi Eksternal — payment gateway, email, OAuth, dll
12. Monetisasi — model bisnis dan sumber pendapatan
13. Analitik & Logging — data apa yang perlu dipantau
14. Roadmap — prioritas rilis dan fase setelah MVP
15. Open Questions — hal yang belum diputuskan

**Perilaku penting:**
- Menggunakan `Traceability ID` (`FEAT-*`, `BR-*`, `AC-*`, `NFR-*`, `US-*`) agar setiap requirement bisa ditelusuri ke task dan kode
- Tidak menimpa file yang sudah ada tanpa konfirmasi

</details>

---

<details>
<summary><strong>brainstorm-architecture</strong> — Membuat architecture.md (Arsitektur Sistem)</summary>

**Persona:** @Fachri — Tech Lead

**Dipanggil saat:** Setelah `PRD.md` selesai. **Wajib** sebelum brainstorm-schema dan brainstorm-api.

**Dibaca sebelum mulai:** `project-context/PRD.md`

**Output:** `project-context/architecture.md`

**Jumlah topik:** 10 topik

**Topik yang dibahas:**
1. System Context — sistem dan layanan eksternal yang berinteraksi
2. Tech Stack — frontend, backend, database, hosting, CI/CD
3. Folder Structure — organisasi file dan direktori project
4. Design Patterns — pola arsitektur (MVC, Clean Architecture, Feature-based, Hexagonal)
5. Authentication & Authorization — metode login, JWT/session, RBAC
6. API Style — REST, GraphQL, atau tRPC
7. State Management — Zustand, Redux, Context API, dll
8. Deployment — environment dev/staging/prod, strategi deploy, cloud provider
9. Observability — logging, monitoring, error tracking
10. Architecture Decision Records — keputusan penting dengan alasannya

**Perilaku penting:**
- Setiap keputusan harus bisa dipertahankan dengan alasan
- Field `Tech Stack` dan `Folder Structure` menjadi referensi wajib bagi `spec-compliance` (SC-02) dan `developer` (Step 2)

</details>

---

<details>
<summary><strong>brainstorm-schema</strong> — Membuat schema.md (Desain Database)</summary>

**Persona:** @Fachri — Tech Lead

**Dipanggil saat:** Setelah `architecture.md` selesai.

**Dibaca sebelum mulai:** `project-context/PRD.md`, `project-context/architecture.md`

**Output:** `project-context/schema.md`

**Jumlah topik:** 5 topik

**Topik yang dibahas:**
1. Database Conventions — ID strategy (UUID/auto-increment/CUID), naming convention, audit fields, soft delete, timezone
2. Table List — semua tabel/koleksi yang dibutuhkan
3. Detail per Tabel — kolom, tipe data, constraint, dan index
4. Relasi — foreign key, one-to-many, many-to-many, cascade rules
5. Sensitive Data & Compliance — PII, kebijakan retensi, anonimisasi

**Perilaku penting:**
- Setiap tabel diberi `Traceability ID` (`DATA-*`) yang bisa dilacak ke requirement di `PRD.md`
- Nama tabel dan kolom yang disepakati adalah **kontrak** — `spec-compliance` (SC-03) memverifikasi kode mengikuti nama persis seperti di dokumen ini

</details>

---

<details>
<summary><strong>brainstorm-api</strong> — Membuat api.md (Kontrak Endpoint API)</summary>

**Persona:** @Fachri — Tech Lead

**Dipanggil saat:** Setelah `schema.md` selesai.

**Dibaca sebelum mulai:** `project-context/PRD.md`, `project-context/architecture.md`, `project-context/schema.md`

**Output:** `project-context/api.md`

**Jumlah topik:** 5 topik

**Topik yang dibahas:**
1. Base URL, Versioning & Auth — base URL dev/prod, versioning, metode autentikasi, format response standar
2. Error Catalog — semua kode error yang mungkin terjadi beserta artinya
3. Core Endpoints — endpoint utama berdasarkan fitur di `PRD.md`
4. Pagination, Filter & Sorting — pola standar untuk list endpoint
5. Rate Limiting & Security — batas request per menit, CORS policy, CSRF protection

**Perilaku penting:**
- Setiap endpoint diberi `Traceability ID` (`API-*`)
- Format request dan response yang disepakati adalah **kontrak** yang diverifikasi `spec-compliance` (SC-04) saat coding

</details>

---

<details>
<summary><strong>brainstorm-styleguide</strong> — Membuat StyleGuide.md (Panduan Desain UI/UX)</summary>

**Persona:** @Akram — UI/UX Designer

**Dipanggil saat:** Setelah `PRD.md` dan `architecture.md` jelas. **Opsional** — skip jika project tidak punya UI.

**Dibaca sebelum mulai:** `project-context/PRD.md`, `project-context/architecture.md`

**Output:** `project-context/StyleGuide.md`

**Jumlah topik:** 7 topik

**Topik yang dibahas:**
1. CSS Framework — Tailwind CSS (v3/v4), Bootstrap, CSS Modules, atau custom
2. Color Palette — warna primer, sekunder, aksen, status (error/success/warning/info), dark mode
3. Typography — font family, ukuran heading dan body, line height, font weight
4. Spacing System — skala spacing yang dipakai (4px, 8px, 16px, 24px, dll)
5. Component Styles — button, card, form input, modal, table — styling dan state
6. Responsive & Breakpoints — breakpoint sm/md/lg/xl dan perubahan layout
7. Icons & Assets — library icon, format gambar, konvensi penamaan aset

**Perilaku penting:**
- Warna dan spacing yang disepakati adalah **kontrak** — `spec-compliance` (SC-06) menandai penggunaan nilai arbitrary di luar daftar ini

</details>

---

<details>
<summary><strong>brainstorm-rules</strong> — Membuat rules.md (Standar Kode / Code Constitution)</summary>

**Persona:** @Fachri — Tech Lead

**Dipanggil saat:** Kapan saja, tapi sebaiknya sebelum coding dimulai.

**Dibaca sebelum mulai:** `project-context/architecture.md`, `project-context/PRD.md`, `project-context/schema.md`, `project-context/api.md`

**Output:** `project-context/rules.md`

**Jumlah topik:** 7 topik

**Topik yang dibahas:**
1. AI Persona & Tech Stack — teknologi utama, library yang diprioritaskan, pola yang disukai dan dihindari
2. Naming Conventions — variabel, fungsi, komponen, file, folder, konstanta
3. Code Style — format (Prettier/ESLint), panjang fungsi maksimal, aturan `console.log`, early return
4. Testing Strategy — coverage minimum, testing tools, pendekatan TDD
5. Security Rules — penyimpanan token, validasi input, secret management
6. Git Workflow — konvensi commit message, branching strategy
7. `[FORBIDDEN]` Section — daftar larangan teknis yang **wajib dipindai** AI sebelum menulis kode

**Perilaku penting:**
- Seksi `[FORBIDDEN]` adalah yang pertama dibaca `developer` sebelum coding
- Jika seksi `[FORBIDDEN]` tidak ada, `spec-compliance` mencatatnya sebagai MINOR finding

</details>

---

<details>
<summary><strong>brainstorm-task</strong> — Membuat Task.md (Rencana Kerja Bertahap)</summary>

**Persona:** @Galbi — Project Manager

**Dipanggil saat:** Setelah semua dokumen spec selesai. Juga dipanggil otomatis oleh `add-feature` untuk menambah fase baru.

**Dibaca sebelum mulai:** Semua dokumen di `project-context/` (PRD, architecture, schema, api, rules, StyleGuide)

**Output:** `project-context/Task.md`

**Jumlah topik klarifikasi:** 4 topik

**Topik klarifikasi:**
1. Phase Priority Order — urutan pengerjaan, fitur mana yang harus selesai duluan
2. Task Granularity — seberapa kecil task? Satu file, satu endpoint, atau satu fitur lengkap?
3. Execution Rules — berhenti konfirmasi setelah tiap task, atau lanjut otomatis per fase?
4. Testing Approach — unit, integrasi, atau E2E? Coverage minimum?

**Dua mode operasi:**
- **Generate New** — membuat `Task.md` dari nol berdasarkan semua spec yang ada
- **Add Phase Mode** — menambah fase baru di bawah konten `Task.md` yang ada (dipanggil dari `add-feature`, tidak menimpa konten lama)

**Perilaku penting:**
- Task **tidak dibuat dari tebakan** — semuanya diturunkan dari dokumen spec
- Setiap task punya `Acceptance Criteria` yang konkret dan bisa diverifikasi
- Task test selalu hadir *sebelum* task implementasi (urutan TDD)
- Setiap task punya `Traceability ID` yang menghubungkannya ke requirement di spec

</details>

---

## 4. Skill Eksekusi

---

<details>
<summary><strong>developer</strong> — Mengerjakan task dari Task.md fase per fase</summary>

**Persona:** @Firdaus — Expert Developer

**Dipanggil saat:** Setelah `Task.md` ada dan siap dikerjakan.

**Alur kerja lengkap:**

**Step 0 — Identifikasi nama & project**
Membaca `.agents/developer-config.json`. Jika `name` atau `project` belum ada, AI bertanya sekali dan menyimpan jawabannya.

**Step 0b — Setup additional skills & MCP**

*Additional Skills:*
- Jika `additionalSkills` sudah ada di config → langsung digunakan
- Jika belum → AI bertanya sekali: *"Apakah ada skills tambahan untuk project ini?"*
- Untuk setiap skill yang disebutkan, AI **mencari sendiri** di workspace dulu (`.agents/skills/`, `.github/skills/`, `.opencode/skill/`). Baru menanyakan path ke kamu jika tidak ditemukan.
- Saat mengerjakan task yang relevan, AI **wajib membaca** SKILL.md dari skill tersebut sebelum menulis kode.

*MCP (Model Context Protocol):*
- Jika `availableMCPs` sudah ada di config → langsung digunakan
- Jika belum → AI bertanya sekali: *"MCP apa yang tersedia di workspace kamu?"*
- Hanya MCP yang terdaftar yang akan digunakan.

**Step 0c — Set developer scope**
- Jika `developerPreferences.scope` sudah ada → langsung digunakan
- Jika belum → AI bertanya sekali:
  ```
  Apa scope pekerjaan kamu di project ini?
  A) Frontend only — tidak menyentuh backend/API/database
  B) Backend only  — tidak menyentuh UI/frontend
  C) Fullstack     — mengerjakan seluruh stack
  ```
- Scope ini di-enforce di setiap fase: AI tidak akan membuat/mengubah file di luar scope.

**Step 1b — Pilih mode kerja**
- Jika `developerPreferences.workMode` sudah ada → langsung digunakan
- Jika belum → AI bertanya sekali:
  ```
  A) Code now   — mulai langsung
  B) Plan first — tulis plan dulu untuk review kamu
  ```
- **Mode plan-first:** AI membuat file rencana di `project-context/plans/phase-[N]-[slug].md` dengan header status di bagian atas. Status plan berubah mengikuti lifecycle:
  ```
  status: review      ← saat plan baru dibuat (kamu review dulu)
  status: in-progress ← saat kamu ketik "start"
  status: code-review ← saat semua task fase selesai
  status: done        ← saat code-review selesai
  ```

**Step 2 — Pilih spec yang relevan + terapkan scope**

| Kondisi | Dibaca |
|---------|--------|
| Semua task (selalu) | `rules.md`, `architecture.md` |
| Task menyentuh database/model | + `schema.md` |
| Task menyentuh API/endpoint | + `api.md` |
| Task menyentuh UI/komponen | + `StyleGuide.md` |
| Requirement belum jelas | + `PRD.md` |

Scope enforcement: jika `scope=frontend`, AI tidak menyentuh file backend. Jika `scope=backend`, tidak menyentuh file frontend.

**Step 3 — Kerjakan task satu per satu**

Untuk setiap task:
1. Pahami task dan acceptance criteria
2. Cek ladder: perlu dibangun? Ada di codebase? Ada di stdlib? (YAGNI)
3. Tulis I/O contract untuk fungsi non-trivial
4. Tulis test dahulu, baru implementasi (TDD)
5. Setelah selesai, tulis `[SELF-REVIEW]`:
   ```
   1. Security risk: [1 potensi — atau "none identified"]
   2. Performance bottleneck: [1 area — atau "none identified"]
   3. Spec assumption: [1 asumsi — atau "none"]
   ```
6. Jalankan validasi, update `Task.md` (`[ ]` → `[x]`)

**Step 4 — Setelah semua task fase selesai**
1. Tampilkan ringkasan fase
2. Jika ada plan file untuk fase ini → update status plan: `in-progress` → `code-review`
3. Jalankan `spec-compliance` otomatis
4. Jika bersih, jalankan `code-review` otomatis
5. Tawarkan fase berikutnya

**MCP yang digunakan (jika terdaftar di `availableMCPs`):**
- `context7` — fetch dokumentasi library versi yang diinstall sebelum coding
- `sequential-thinking` — untuk masalah kompleks/arsitektur
- `grep-app` — cari contoh implementasi nyata di repo publik
- `exa` — changelog, breaking changes, verifikasi maintenance aktif

</details>

---

<details>
<summary><strong>spec-compliance</strong> — Verifikasi kode terhadap semua dokumen spec</summary>

**Persona:** @Fachri — Tech Lead

**Dipanggil saat:** Otomatis setelah setiap fase selesai oleh `developer`. Dijalankan **sebelum** `code-review`.

**Checklist (8 item):**

| ID | Aspek | Dokumen yang Dibaca |
|----|-------|---------------------|
| SC-01 | PRD Compliance | `PRD.md` — fitur, business rules, acceptance criteria, non-goals |
| SC-02 | Architecture Compliance | `architecture.md` — tech stack, folder structure, design patterns, auth method |
| SC-03 | Schema Compliance | `schema.md` — nama tabel/kolom exact, relasi, soft delete, audit fields, PII |
| SC-04 | API Compliance | `api.md` — path endpoint, HTTP method, request/response format, error codes |
| SC-05 | Rules Compliance | `rules.md` — seksi `[FORBIDDEN]`, naming convention, TypeScript rules |
| SC-06 | StyleGuide Compliance | `StyleGuide.md` — CSS framework, color tokens, spacing system |
| SC-07 | Task Completion | `Task.md` — semua acceptance criteria terpenuhi, tidak ada task setengah jadi |
| SC-08 | Scope Compliance | `developer-config.json` — scope frontend/backend dihormati, tidak ada file di luar scope |

**Severity:** `💥 BLOCKER` → fix sekarang, re-run | `🔴 MAJOR` → fix sebelum fase berikutnya | `⚠️ MINOR` → diskusikan | `✅ PASS` → lanjut ke `code-review`

**Catatan:** SC-07 adalah N/A jika dijalankan dari `bug-fix`.

</details>

---

<details>
<summary><strong>code-review</strong> — Pemeriksaan kualitas dan keamanan kode</summary>

**Persona:** @Fachri — Tech Lead

**Dipanggil saat:** Otomatis setelah `spec-compliance` bersih. Bisa juga dipanggil manual kapan saja.

**Fix mode (ditanya sekali, disimpan ke config):**
```
A) Laporkan dulu — tampilkan semua temuan, tunggu konfirmasi sebelum fixing
B) Fix langsung  — fix BLOCKER/MAJOR otomatis, laporan lengkap di akhir
```
Disimpan sebagai `codeReviewPreferences.fixMode` di `developer-config.json`.

**Phase 1 — 27-Item Code Quality:**

| Tier | Item |
|------|------|
| 💥 BLOCKER | CR-01 Wrong imports · CR-02 Runtime errors · CR-03 Null/undefined · CR-04 SQL injection · CR-05 Deprecated methods |
| 🔴 MAJOR | CR-06 Duplicate function · CR-07 Unused code · CR-08 Duplicate logic · CR-09 Obsolete code · CR-10 Inconsistent naming · CR-11 Ignoring existing code · CR-12 Missing dependency · CR-13 Dependency conflict · CR-14 Memory leaks · CR-15 Security ignored · CR-16 No rate limit handling · CR-17 No tests |
| ⚠️ MINOR | CR-18 Edge cases · CR-19 Happy path only · CR-20 Performance · CR-21 Outdated pattern · CR-22 Under-engineering · CR-23 Over-engineering · CR-24 Environment assumptions |
| ℹ️ INFO | CR-25 Missing comments · CR-26 Jargon · CR-27 Comment quality |

**Phase 2 — 10 Security Essentials:**

| ID | Aspek |
|----|-------|
| SEC-01 | Injection Prevention — SQL, shell, eval |
| SEC-02 | Authentication — password hashing, cookie attributes |
| SEC-03 | Authorization — deny-by-default, ownership checks, mass assignment |
| SEC-04 | XSS Prevention — innerHTML, dangerouslySetInnerHTML |
| SEC-05 | API Security — rate limiting, CORS, JWT verification |
| SEC-06 | Data Protection & Logging — no sensitive logs, no hardcoded secrets |
| SEC-07 | Error Handling Security — fail-closed, no swallowed exceptions |
| SEC-08 | Input Validation — body/params/query/headers/cookies |
| SEC-09 | Framework-Specific Security — AI baca `architecture.md` untuk deteksi framework: **Next.js** (NEXT_PUBLIC_*, Server Actions, middleware, wildcard image domains), **Laravel** (CSRF, Eloquent, .env), **Django** (ALLOWED_HOSTS, DEBUG, SECRET_KEY), **Express/NestJS** (helmet, CORS, body limits), **Rails** (strong params) |
| SEC-10 | Dependency Vulnerabilities — packages dengan CVE critical/high (`npm audit`, `pip audit`, `composer audit`, dll) |

**Format setiap temuan:** Di mana? → Kenapa terjadi? → Jika tidak diperbaiki? → Jika diperbaiki? → Rekomendasi fix → Kenapa fix ini?

**Update plan setelah review selesai** (jika plan file ada untuk fase ini):
- **Ada plan-level deviation** (library salah, pattern tidak diikuti, scope berubah, approach berbeda dari plan) → tambahkan catatan ke plan + ubah status: `code-review` → `done`
- **Tidak ada plan deviation** (hanya masalah kualitas kode: naming, formatting, security hardening) → ubah status saja: `code-review` → `done`, tanpa catatan

</details>

---

## 5. Skill Utilitas

---

<details>
<summary><strong>help</strong> — Dashboard kondisi project dan panduan langkah berikutnya</summary>

**Persona:** @Galbi — Project Manager

**Dipanggil saat:** Kapan saja, terutama jika bingung harus mulai dari mana.

**Yang dicek:**

- Dokumen spec di `project-context/` — PRD.md, StyleGuide.md, architecture.md, schema.md, api.md, rules.md, Task.md (hitung `[ ]` vs `[x]`)
- Developer config di `.agents/developer-config.json` — name, project, scope, workMode, additionalSkills, availableMCPs
- Plans di `project-context/plans/` — list semua file plan beserta statusnya (`review` / `in-progress` / `code-review` / `done`)

**Format output:**
```
Checking your project now...

Spec Documents
  [✓] PRD.md           — Product requirements
  [✓] architecture.md  — System architecture
  [ ] schema.md        — Not yet created
  ...

Developer Config
  [✓] name: Firdaus
  [✓] scope: fullstack
  [✓] workMode: plan-first
  [✓] additionalSkills: 2 skills
  [ ] availableMCPs: not configured

Plans
  [✓] phase-1-setup.md       (status: done)
  [✓] phase-2-auth.md        (status: in-progress)

Status: [ringkasan kondisi]
Recommended next steps: ...
```

</details>

---

<details>
<summary><strong>bug-fix</strong> — Diagnosis, perbaikan, dan dokumentasi bug</summary>

**Persona:** @Ikhsan — Debugger

**Dipanggil saat:** Ada bug yang perlu diperbaiki.

**Alur kerja:**
1. Kamu deskripsikan bug (gejala, lokasi, cara reproduksi, pesan error)
2. AI cek `bug-log.md` — pernah terjadi?
   - **Identik** → terapkan fix yang sama (konfirmasi dulu)
   - **Mirip tapi berbeda** → diagnosis ulang
   - **Baru** → lanjut ke diagnosis
3. AI baca file yang bermasalah + semua caller dari shared code — satu fix di root cause lebih baik dari banyak guard di tiap caller
4. AI rumuskan root cause dan jelaskan → tunggu konfirmasi sebelum fix
5. Fix diterapkan → `spec-compliance` + `code-review` dijalankan
6. Kamu konfirmasi bug teratasi
7. AI tambah regression prevention (test, rule/spec update)
8. AI catat ke `project-context/bug-log.md` ← **hanya setelah konfirmasi kamu, tidak otomatis**

</details>

---

<details>
<summary><strong>add-feature</strong> — Menambah fitur baru ke project yang sudah berjalan</summary>

**Persona:** @Galbi — Project Manager

**Dipanggil saat:** Ada fitur baru yang ingin ditambahkan ke project yang sudah berjalan.

**Alur kerja:**
1. Kamu deskripsikan fitur baru (nama, fungsi, pengguna, alasan)
2. AI baca semua spec yang ada di `project-context/`
3. AI tunjukkan impact analysis — dokumen mana yang terdampak (termasuk `plans/`)
4. Kamu konfirmasi analisis
5. AI update **semua** dokumen yang terdampak:
   - `PRD.md` → `architecture.md` → `schema.md` → `api.md` → `StyleGuide.md` → `rules.md`
   - `project-context/plans/` — jika ada file plan untuk fase terdampak, tambahkan seksi `## Feature Addition: [nama]` tanpa menimpa konten lama
6. AI panggil `brainstorm-task` (Add Phase Mode) untuk tambah fase & task baru di `Task.md`
7. Lanjut dengan `developer`

**Aturan mutlak:** setiap dokumen yang terdampak wajib diupdate — tidak ada yang dilewati.

</details>

---

<details>
<summary><strong>spec-audit</strong> — Cek konsistensi antar dokumen</summary>

**Persona:** @Fachri — Tech Lead

**Dua mode:**

**Mode Project** — audit `project-context/`
Memeriksa konsistensi *antar* dokumen: tabel di schema tidak punya endpoint di api? Fitur di PRD tidak punya task di Task.md? Tech stack architecture bertentangan rules? Traceability ID dirujuk tapi tidak ada di sumbernya?

**Mode Framework** — audit MACCA itu sendiri
Memeriksa konsistensi *antar* instruksi skill: README, skill docs, dan workflow tidak bertentangan?

**Yang dicek:** konflik langsung → workflow drift → inkonsistensi → ambiguitas

**Format temuan:** Di mana? → Mengapa masalah? → Fix spesifik yang disarankan + alasannya

</details>

---

<details>
<summary><strong>spec-init</strong> — Generate semua spec dari codebase yang sudah ada</summary>

**Persona:** @Fachri — Tech Lead

**Dipanggil saat:** Project sudah berjalan tapi belum punya dokumen spec.

**Dua mode:**
```
Mode A — Batch Generate: scan seluruh codebase, generate semua sekaligus.
Mode B — Guided Generate: satu dokumen → kamu review → konfirmasi → lanjut.
```

**Urutan generate:** `architecture.md` → `rules.md` → `schema.md` → `api.md` → `StyleGuide.md` → `PRD.md`

PRD dibuat terakhir karena isinya disimpulkan dari kode yang ada, bukan asumsi.

**Setiap dokumen yang dihasilkan memiliki:**
- **Evidence Inputs** — file/sumber yang dipakai sebagai dasar klaim
- **Confidence Level** per klaim: *High* (terlihat langsung di kode) / *Medium* (inferensi kuat) / *Low* (tebakan, perlu verifikasi)
- **Confidence Summary** — ringkasan fakta kuat, inferensi, dan yang perlu verifikasi manual

</details>

---

<details>
<summary><strong>rapat</strong> — Diskusi tim multi-persona</summary>

**Persona:** @Galbi (fasilitator)

**Dipanggil saat:** Kapan saja, saat butuh perspektif dari beberapa keahlian sekaligus.

**Cara kerja:** @Galbi memfasilitasi, kamu bisa memanggil persona mana pun by name untuk meminta pendapatnya. Setiap persona merespons sesuai keahlian dan role-nya.

**Persona yang tersedia:**
- `@Galbi` — Project Manager: scope, prioritas, dampak bisnis
- `@Fachri` — Tech Lead: keputusan teknis, trade-offs, keamanan
- `@Akram` — UI/UX Designer: usability, konsistensi visual, aksesibilitas
- `@Firdaus` — Developer: feasibility, estimasi kompleksitas
- `@Ikhsan` — Debugger: risiko, edge cases, potensi bug

</details>

---

## 6. Tim AI MACCA

| Persona | Role | Skills |
|---------|------|--------|
| **@Galbi** | Project Manager | `brainstorm-prd`, `brainstorm-task`, `add-feature`, `help`, `rapat` |
| **@Fachri** | Tech Lead | `brainstorm-architecture`, `brainstorm-api`, `brainstorm-schema`, `brainstorm-rules`, `spec-init`, `spec-audit`, `spec-compliance`, `code-review` |
| **@Akram** | UI/UX Designer | `brainstorm-styleguide` |
| **@Firdaus** | Expert Developer | `developer` |
| **@Ikhsan** | Debugger | `bug-fix` |

> **Aturan Persona:** Jangan tukar persona pemilik skill. Instruksi, nada, dan tanggung jawabnya sudah dirancang untuk role tersebut.

---

## 7. Workflow

<details>
<summary><strong>Project Baru</strong> — Mulai dari nol</summary>

```
Langkah 1: Tentukan kebutuhan produk
  → Panggil: brainstorm-prd
  → Hasil: project-context/PRD.md

Langkah 2: Definisikan arsitektur
  → Panggil: brainstorm-architecture   ← WAJIB sebelum lanjut
  → Hasil: project-context/architecture.md

Langkah 3a: Desain database (jika ada)
  → Panggil: brainstorm-schema
  → Hasil: project-context/schema.md

Langkah 3b: Definisikan API (jika ada)
  → Panggil: brainstorm-api
  → Hasil: project-context/api.md

Langkah 3c: Definisikan tampilan UI (opsional)
  → Panggil: brainstorm-styleguide
  → Hasil: project-context/StyleGuide.md

Langkah 4: Tetapkan standar kode
  → Panggil: brainstorm-rules
  → Hasil: project-context/rules.md

Langkah 5: Cek konsistensi (disarankan)
  → Panggil: spec-audit (mode project)

Langkah 6: Buat rencana kerja
  → Panggil: brainstorm-task
  → Hasil: project-context/Task.md

Langkah 7: Mulai coding
  → Panggil: developer
  → Per task: kode → validasi → [SELF-REVIEW]
  → Per fase: spec-compliance → code-review → fase berikutnya
```

> Bingung harus mulai dari mana? Panggil `help`.

</details>

---

<details>
<summary><strong>Project yang Sudah Berjalan / Boilerplate</strong> — Ada codebase, belum ada spec</summary>

```
Langkah 1: Generate spec dari codebase yang ada
  → Panggil: spec-init
  → Mode A (Batch): semua dokumen dibuat sekaligus
  → Mode B (Guided): satu dokumen → review → lanjut

  Urutan generate: architecture.md → rules.md → schema.md → api.md → StyleGuide.md → PRD.md

Langkah 2: Review & koreksi
  → Perhatikan item dengan Confidence: Low dan bagian asumsi

Langkah 3: Cek konsistensi
  → Panggil: spec-audit (mode project)

Langkah 4: Buat rencana kerja
  → Panggil: brainstorm-task

Langkah 5: Mulai coding
  → Panggil: developer
```

</details>

---

<details>
<summary><strong>Menambah Fitur Baru</strong></summary>

```
→ Panggil: add-feature

Yang terjadi:
  1. Kamu deskripsikan fitur baru
  2. AI baca semua spec yang ada
  3. AI tunjukkan impact analysis (dokumen + plans yang terdampak)
  4. Kamu konfirmasi analisis
  5. AI update SEMUA dokumen yang terdampak (tidak ada yang dilewati)
  6. AI panggil brainstorm-task untuk tambahkan fase & task baru
  7. Lanjut dengan developer
```

</details>

---

<details>
<summary><strong>Memperbaiki Bug</strong></summary>

```
→ Panggil: bug-fix

Yang terjadi:
  1. Kamu deskripsikan bug
  2. AI cek bug-log.md — pernah terjadi sebelumnya?
  3. AI cek semua caller dari kode yang bermasalah
  4. AI jelaskan root cause → tunggu konfirmasi sebelum fix
  5. Fix diterapkan → spec-compliance + code-review
  6. Kamu konfirmasi bug teratasi
  7. AI tambah regression prevention
  8. AI catat ke bug-log.md ← hanya setelah konfirmasi kamu
```

</details>

---

## 8. Instalasi & Cara Menggunakan

**Prasyarat:** GitHub Copilot aktif di VS Code (atau AI tool lain yang didukung).

### Instalasi

**Linux / Mac**
```bash
curl -fsSL https://raw.githubusercontent.com/firdaus12p/MACCA-METHOD/main/install.sh | bash
```

**Windows (PowerShell)**
```powershell
irm https://raw.githubusercontent.com/firdaus12p/MACCA-METHOD/main/install.ps1 | iex
```

Installer menampilkan selektor interaktif untuk memilih AI tool, menanyakan nama developer, nama project, dan preferensi bahasa.

### Update ke Versi Terbaru

**Linux / Mac**
```bash
curl -fsSL https://raw.githubusercontent.com/firdaus12p/MACCA-METHOD/main/upgrade.sh | bash
```

**Windows (PowerShell)**
```powershell
irm https://raw.githubusercontent.com/firdaus12p/MACCA-METHOD/main/upgrade.ps1 | iex
```

> `project-context/` dan `developer-config.json` **tidak disentuh** saat upgrade.

### Cara Memanggil Skill

```
Gunakan skill brainstorm-prd
Gunakan skill developer
Gunakan skill help
```

### Struktur Folder

```
your-project/
├── .agents/
│   ├── developer-config.json    ← konfigurasi bersama lintas skill
│   └── macca-tools.txt          ← tools yang dipilih saat install
│
├── .github/skills/              ← jika GitHub Copilot dipilih
│   ├── add-feature/
│   ├── brainstorm-api/
│   ├── brainstorm-architecture/
│   ├── brainstorm-prd/
│   ├── brainstorm-rules/
│   ├── brainstorm-schema/
│   ├── brainstorm-styleguide/
│   ├── brainstorm-task/
│   ├── bug-fix/
│   ├── code-review/
│   ├── developer/
│   ├── help/
│   ├── rapat/
│   ├── spec-audit/
│   ├── spec-compliance/
│   └── spec-init/
│
├── project-context/
│   ├── PRD.md
│   ├── architecture.md
│   ├── schema.md
│   ├── api.md
│   ├── rules.md
│   ├── StyleGuide.md
│   ├── Task.md
│   ├── bug-log.md               ← dibuat saat ada bug pertama
│   └── plans/                   ← rencana per fase (mode plan-first)
│       └── phase-1-setup.md
│
└── ... (kode project kamu)
```

| AI Tool | Folder Skills |
|---------|---------------|
| GitHub Copilot | `.github/skills/` |
| Cursor | `.cursor/skills/` |
| Claude Code | `.claude/skills/` |
| Windsurf | `.windsurf/skills/` |
| Gemini CLI | `.gemini/skills/` |
| OpenCode | `.opencode/skill/` |
| Kilo Code | `.kilo/skills/` |
| Codex (OpenAI) | `.agents/skills/` |
| Kimi CLI | `~/.config/agents/skills/` (global) |

---

## 9. Konfigurasi

<details>
<summary><strong>developer-config.json — Schema Lengkap</strong></summary>

File `.agents/developer-config.json` adalah konfigurasi bersama lintas skill. Semua skill membaca dan memperbarui file ini dengan cara **merge** — tidak pernah menimpa seluruh isi.

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
    "workMode": "direct",
    "scope": "fullstack"
  },
  "brainstormPreferences": {
    "discussionMode": "one-by-one",
    "recommendations": true
  },
  "codeReviewPreferences": {
    "fixMode": "report-first"
  },
  "additionalSkills": [
    {
      "name": "laravel-best-practices",
      "purpose": "Gunakan saat menulis kode Laravel",
      "paths": {
        "copilot": ".github/skills/laravel-best-practices/SKILL.md",
        "opencode": ".opencode/skill/laravel-best-practices/SKILL.md",
        "codex": ".agents/skills/laravel-best-practices/SKILL.md"
      }
    }
  ],
  "availableMCPs": ["context7", "supabase"]
}
```

| Field | Siapa yang mengisi | Keterangan |
|-------|--------------------|------------|
| `name` | `developer` (Step 0) | Ditanya sekali |
| `project` | `developer` (Step 0) | Ditanya sekali |
| `languagePreferences` | installer / skill pertama | Bahasa komunikasi dan bahasa dokumen |
| `developerPreferences.workMode` | `developer` (Step 1b) | `"direct"` atau `"plan-first"` |
| `developerPreferences.scope` | `developer` (Step 0c) | `"frontend"`, `"backend"`, atau `"fullstack"` |
| `brainstormPreferences.discussionMode` | brainstorm-* skills | `"one-by-one"`, `"three-at-a-time"`, atau `"all-at-once"` |
| `brainstormPreferences.recommendations` | brainstorm-* skills | `true` = AI berikan saran jawaban di tiap pertanyaan |
| `codeReviewPreferences.fixMode` | `code-review` | `"report-first"` atau `"fix-then-report"` |
| `additionalSkills` | `developer` (Step 0b) | AI cari path sendiri di workspace dulu, baru tanya jika tidak ditemukan |
| `availableMCPs` | `developer` (Step 0b) | MCP yang tersedia; hanya yang terdaftar yang digunakan |

**Aturan:** semua skill harus **merge**, tidak boleh menimpa file. Field yang tidak dikenali tetap dipertahankan.

</details>

---

<details>
<summary><strong>Glosarium & Traceability ID</strong></summary>

| Istilah | Penjelasan |
|---------|------------|
| **Skill** | Instruksi lengkap untuk AI — seperti SOP untuk AI |
| **Spec** | Dokumen perencanaan berisi semua keputusan sebelum coding |
| **Subagent** | Agen bantu untuk eksplorasi/analisis terfokus |
| **project-context/** | Folder tempat semua dokumen spec disimpan |
| **[FORBIDDEN]** | Seksi di `rules.md` — larangan teknis yang dipindai AI sebelum coding |
| **[SELF-REVIEW]** | Refleksi singkat developer setelah tiap task: security risk, performance, spec assumption |
| **Traceability ID** | Label stabil (`FEAT-01`, `API-03`) untuk melacak requirement dari PRD ke implementasi |
| **Acceptance Criteria** | Kondisi konkret agar task dianggap selesai |
| **scope** | Batas pekerjaan developer: frontend-only, backend-only, atau fullstack |
| **fixMode** | Preferensi code-review: lapor dulu atau fix langsung |
| **availableMCPs** | MCP yang terdaftar dan bisa digunakan di project ini |
| **Confidence Level** | Di `spec-init`: High/Medium/Low untuk klaim dari analisis codebase |
| **Evidence Inputs** | Di `spec-init`: file/sumber yang dipakai sebagai dasar klaim |
| **Plan status** | Status lifecycle plan file: `review` → `in-progress` → `code-review` → `done` |
| **Plan deviation** | Penyimpangan implementasi dari keputusan yang ada di plan (library, pattern, scope) — dicatat oleh `code-review` jika ditemukan |

**Traceability ID Scheme:**

| Prefix | Digunakan untuk |
|--------|----------------|
| `FEAT-01` | Fitur utama di `PRD.md` |
| `BR-01` | Business rule di `PRD.md` |
| `NFR-01` | Non-functional requirement di `PRD.md` |
| `AC-01` | Acceptance Criteria di `PRD.md` |
| `US-01` | User story di `PRD.md` |
| `DATA-01` | Tabel atau entitas data di `schema.md` |
| `API-01` | Endpoint di `api.md` |
| `RULE-01` | Aturan di `rules.md` yang dirujuk lintas dokumen |

</details>

---

## 10. Pertanyaan Umum

<details>
<summary>Harus isi semua dokumen spec dulu sebelum coding?</summary>

Tidak harus sempurna. Minimal yang harus ada sebelum `developer` bisa jalan: `PRD.md` dan `architecture.md`. Semakin lengkap spec, semakin akurat AI bekerja.

</details>

<details>
<summary>Apakah bisa dipakai untuk project yang sudah berjalan?</summary>

Bisa. Gunakan `spec-init` — AI membaca codebase dan menghasilkan semua dokumen spec. Setiap klaim diberi tingkat kepercayaan (High/Medium/Low) dan sumber buktinya.

</details>

<details>
<summary>Apakah AI bisa membuat kesalahan?</summary>

Bisa. Itulah kenapa ada `spec-compliance` dan `code-review` yang dijalankan otomatis setelah setiap fase. Jika ada yang tidak sesuai, AI memperbaikinya sebelum lanjut.

</details>

<details>
<summary>Apa itu [SELF-REVIEW]?</summary>

Setelah setiap task selesai, developer menulis refleksi singkat: 1 potensi security risk, 1 performance bottleneck, dan 1 asumsi dari spec. Tujuannya mengekspos tebakan tersembunyi sebelum verifikasi formal.

</details>

<details>
<summary>Kenapa developer menulis test sebelum implementasi?</summary>

Pendekatan TDD. Dengan menulis test dulu, AI mendefinisikan perilaku fungsi secara pasti sebelum implementasi — mencegah perubahan struktur di tengah jalan. Task test selalu hadir sebelum task implementasi di `Task.md`.

</details>

<details>
<summary>Apakah bug-log otomatis diupdate?</summary>

Tidak. Bug hanya dicatat setelah **kamu mengonfirmasi** bahwa bug sudah teratasi. AI tidak mencatat ke bug-log tanpa izin.

</details>

<details>
<summary>Harus memilih preferensi di developer setiap sesi?</summary>

Tidak. Semua preferensi (scope, workMode, additional skills, MCP, code review mode) ditanya sekali dan disimpan. Di sesi berikutnya langsung digunakan.

</details>

<details>
<summary>Apa itu mode plan-first dan di mana plan disimpan?</summary>

Saat memilih `plan-first`, AI membuat file rencana di `project-context/plans/phase-[N]-[slug].md` sebelum mulai coding. Plan punya header status yang diperbarui otomatis mengikuti lifecycle:

| Status | Artinya |
|--------|---------|
| `review` | Plan baru dibuat — kamu baca dan review dulu. Ketik `start` jika setuju. |
| `in-progress` | Coding dimulai setelah kamu ketik `start`. |
| `code-review` | Semua task fase selesai, sedang direview oleh `code-review`. |
| `done` | Code-review selesai. Jika ada implementasi yang menyimpang dari plan (library salah, pattern berbeda), AI menambahkan catatan ke plan. Jika tidak ada penyimpangan, status berubah ke `done` tanpa catatan. |

Plan juga diakui oleh `help` (ditampilkan beserta statusnya) dan `add-feature` (update jika fase terdampak).

</details>

<details>
<summary>Apa itu scope di developer?</summary>

Scope menentukan batas pekerjaan AI: **Frontend only** (tidak menyentuh routes/, controllers/, migrations/), **Backend only** (tidak menyentuh components/, pages/, styles/), atau **Fullstack** (tidak ada batasan). Di-enforce di `developer` sebelum coding dan `spec-compliance` (SC-08) setelah coding.

</details>

<details>
<summary>Bagaimana additional skills bekerja?</summary>

Skill project-specific (misal `laravel-best-practices`). Ditanya sekali oleh `developer`. AI mencari sendiri di workspace dulu; baru tanya kamu jika tidak ditemukan. Saat mengerjakan task yang relevan, AI wajib membaca SKILL.md dari skill tersebut sebelum menulis kode.

</details>

<details>
<summary>Bagaimana spec-audit berbeda dari spec-compliance?</summary>

- `spec-compliance` — kode vs spec. Dijalankan setelah coding.
- `spec-audit` — antar dokumen spec. Dijalankan sebelum coding atau kapan saja saat curiga ada inkonsistensi.

Analoginya: spec-compliance adalah inspeksi hasil konstruksi terhadap blueprint. Spec-audit adalah cek silang antar blueprint itu sendiri.

</details>

<details>
<summary>Mengapa security review ada di code-review, bukan hanya di developer?</summary>

Developer punya tanggung jawab keamanan dasar: `[FORBIDDEN]` di rules.md dan `[SELF-REVIEW]` yang mencatat potensi security risk. Tapi `code-review` adalah checkpoint formal dengan 10 item security yang lebih dalam (SEC-01–SEC-10), termasuk framework-specific checks dan dependency CVE. Dua lapis ini saling melengkapi.

</details>

---

## 11. Lisensi

MIT License — bebas digunakan, dimodifikasi, dan didistribusikan.
