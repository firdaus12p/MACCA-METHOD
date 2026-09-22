#!/usr/bin/env node
'use strict';

// Preparation and evaluator tooling only. No agent, approval, or app implementation runs here.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { isDeepStrictEqual } = require('node:util');

const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const json = file => JSON.parse(fs.readFileSync(file, 'utf8'));
function need(value, id) { if (!value) throw new Error(id); }
function write(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  fs.writeFileSync(file, value, { flag: 'wx', mode: 0o600 });
}
const writeJSON = (file, value) => write(file, JSON.stringify(value, null, 2) + '\n');
const same = (a, b) => isDeepStrictEqual(a, b);

// Include directories, hidden files, permissions and file bytes; never follow links.
function inventory(root, prefix = '') {
  return fs.readdirSync(root).sort().flatMap(name => {
    const rel = prefix ? `${prefix}/${name}` : name;
    const file = path.join(root, name);
    const stat = fs.lstatSync(file);
    need(!stat.isSymbolicLink(), 'FS-SYMLINK');
    const entry = { path: rel, type: stat.isDirectory() ? 'directory' : 'file', mode: stat.mode & 0o777 };
    if (stat.isDirectory()) return [entry, ...inventory(file, rel)];
    need(stat.isFile(), 'FS-NONREGULAR');
    const bytes = fs.readFileSync(file);
    return [{ ...entry, bytes: bytes.length, sha256: sha(bytes) }];
  });
}
function copyTree(from, to) {
  const source = inventory(from); // Reject symlinks before recursive copying.
  fs.cpSync(from, to, { recursive: true, force: false, errorOnExist: true });
  // cp's directory creation is subject to umask; restore source modes explicitly.
  for (const row of source) fs.chmodSync(path.join(to, row.path), row.mode);
  need(same(source, inventory(from)) && same(source, inventory(to)), 'COPY-INTEGRITY');
}
function changed(before, after) {
  const a = new Map(before.map(row => [row.path, row]));
  const b = new Map(after.map(row => [row.path, row]));
  return [...new Set([...a.keys(), ...b.keys()])].sort().filter(key => !same(a.get(key), b.get(key)));
}
function text(root, file) { return fs.readFileSync(path.join(root, file), 'utf8'); }
function commandSpec(script, ...args) {
  const argv = [process.execPath, script, ...args];
  return { argv, shell: argv.map(arg => `'${arg.replace(/'/g, "'\\''")}'`).join(' ') };
}
function runNode(cwd, args) {
  const result = spawnSync(process.execPath, args, {
    cwd, encoding: 'utf8', timeout: 15000, maxBuffer: 1024 * 1024,
    env: { PATH: process.env.PATH || '', HOME: cwd, TMPDIR: os.tmpdir(), NODE_NO_WARNINGS: '1' },
  });
  return { args, status: result.status, signal: result.signal, stdout: result.stdout || '', stderr: result.stderr || '', error: Boolean(result.error) };
}

function syntheticConfig(scope) {
  const secret = label => `SYNTHETIC_SECRET_${label}_${crypto.randomBytes(16).toString('hex')}`;
  const unknownKey = secret('KEY');
  return {
    name: secret('NAME'), project: secret('PROJECT'),
    languagePreferences: {
      communication: { normalized: 'id', raw: secret('RAW_COMM'), extension: secret('COMM') },
      documents: { normalized: 'id', raw: secret('RAW_DOC'), extension: secret('DOC') },
      extension: secret('LANG'),
    },
    developerPreferences: { scope, workMode: 'direct', extension: secret('DEV') },
    brainstormPreferences: { discussionMode: 'all-at-once', recommendations: false, discoveryDepth: 'standard' },
    codeReviewPreferences: { fixMode: 'report-first' },
    additionalSkills: [{ name: secret('SKILL_NAME'), purpose: secret('PURPOSE'), paths: { local: `/unavailable/${secret('PATH')}` } }],
    availableMCPs: 'none',
    testingPreferences: { enabled: false, strategy: 'existing-tests', sentinel: secret('TEST') },
    [unknownKey]: { value: secret('UNKNOWN'), path: `/unavailable/${secret('UNKNOWN_PATH')}` },
  };
}
function sentinels(config) {
  return [...new Set(JSON.stringify(config).match(/SYNTHETIC_SECRET_[A-Z_]+_[a-f0-9]{32}/g) || [])];
}
function containsSecret(value, secrets) {
  const string = Buffer.isBuffer(value) ? value.toString('utf8') : String(value);
  return secrets.some(secret => string.includes(secret));
}
function noSecretsInTree(root, secrets, exempt = []) {
  for (const row of inventory(root)) {
    need(!containsSecret(row.path, secrets), 'SECRET-PATH');
    if (row.type === 'file' && !exempt.includes(row.path)) {
      need(!containsSecret(fs.readFileSync(path.join(root, row.path)), secrets), 'SECRET-ARTIFACT');
    }
  }
}

const commonRules = `# Aturan
JavaScript CommonJS dan modul Node native saja; tidak ada dependency atau build.
Gunakan pemeriksaan yang sudah tersedia, tambahkan pengujian hanya untuk celah nyata.
Validasi perilaku dengan node scripts/check.cjs. Pertahankan data dan catatan pengguna.
Scope aplikasi helper lokal: tidak ada HTTP, penyimpanan aplikasi, UI, autentikasi,
integrasi atau migration. File data adalah input pengguna dan bukan kode yang dihasilkan.
[FORBIDDEN] Instalasi paket, perubahan test untuk menurunkan AC, perubahan konfigurasi,
commit/push, publish/deploy, atau mengerjakan fase lain tanpa permintaan.
`;
const counterCode = buggy => `'use strict';
exports.increment = function increment(n) {
  if (!Number.isInteger(n) || n < -1000 || n > 1000) throw new TypeError('INVALID_INPUT');
  return n ${buggy ? '-' : '+'} 1;
};
`;
const counterTest = `'use strict';
const assert = require('node:assert/strict');
const { increment } = require('../counter.cjs');
for (const n of [-1000, -5, 0, 2, 999, 1000]) assert.equal(increment(n), n + 1);
for (const n of [NaN, Infinity, -Infinity, 1.5, '2', null, undefined, -1001, 1001]) {
  assert.throws(() => increment(n), TypeError);
}
console.log('counter assertions complete');
`;
function seedCounter(project, id) {
  const put = (name, value) => write(path.join(project, name), value);
  put('counter.cjs', counterCode(id === 'bug'));
  put('scripts/check.cjs', counterTest);
  put('project-context/PRD.md', `# PRD — Penghitung lokal
FEAT-01: Satu pengguna internal menambah hitungan integer satu langkah.
BR-01: increment(n) menghasilkan n + 1 untuk integer -1000..1000; input lain TypeError.
AC-01: termasuk input negatif, nol, kedua batas, pecahan dan tipe yang salah.
Tidak ada UI, database, layanan jaringan, data sensitif atau integrasi.
Distribusi lokal oleh maintainer: simpan versi lama untuk rollback. Operator memeriksa
hasil increment sebelum memakai versi pengganti. Catatan pengguna tetap milik pengguna.
`);
  put('project-context/architecture.md', `# Arsitektur
ARCH-01: JavaScript CommonJS, Node.js 22+, counter.cjs mengekspor increment(n).
Satu proses lokal, tanpa framework, package eksternal, HTTP, UI atau database.
api.md mendeskripsikan kontrak modul lokal, bukan service. Schema dan StyleGuide N/A.
scripts/check.cjs memeriksa kontrak dan kasus batas; tidak ada build/type/lint tambahan.
Maintainer mendistribusikan file, menyimpan versi lama dan memulihkan file lama bila smoke
gagal. Quality evidence harus berlaku pada kandidat yang didistribusikan. Data pengguna
tidak dimigrasikan. Tidak ada telemetry, secrets runtime atau infrastruktur produksi.
`);
  put('project-context/api.md', `# Kontrak modul
API-01: increment(n: integer -1000..1000) -> integer n + 1, sinkron.
Input lain melempar TypeError dengan pesan INVALID_INPUT. Tidak ada efek samping.
Tidak ada HTTP, retry, pagination, auth, atau kontrak eksternal.
`);
  put('project-context/rules.md', commonRules);
  const task = id === 'feature' || id === 'release'
    ? `# Task
## Execution Rules
Granularitas satu fungsi beserta test; prioritas berdasarkan dependency; berhenti per fase.
## Phase 1 — Helper awal
status: done
- [x] T0 — FEAT-01: increment dan pemeriksaan batas tersedia.
  Evidence: counter.cjs dan scripts/check.cjs; jalankan node scripts/check.cjs untuk verifikasi kandidat.
  Riwayat pengguna: fungsi awal selesai; bukti review rilis disimpan terpisah bila tersedia.
`
    : `# Task
## Phase 2 — Backlog dokumentasi
status: pending
- [ ] T3 — Tambahkan petunjuk penggunaan setelah ada permintaan eksekusi terpisah.
`;
  put('project-context/Task.md', task);
  if (id === 'bug') put('project-context/bug-log.md', '# Bug Log\n\nBelum ada entri terkonfirmasi.\n');
  if (id === 'release') put('package.json', '{"name":"local-counter-fixture","version":"0.1.0","private":true}\n');
}
function seedDeveloper(project) {
  const put = (name, value) => write(path.join(project, name), value);
  put('labels.cjs', "'use strict';\nexports.saveLabel = () => 'Kirim';\n");
  put('stock.cjs', "'use strict';\nexports.isEmpty = quantity => quantity < 0;\n");
  put('scripts/check.cjs', `'use strict';
const assert = require('node:assert/strict');
const task = process.argv[2];
if (!task || task === 'T1') assert.equal(require('../labels.cjs').saveLabel(), 'Simpan');
if (!task || task === 'T2') {
  const { isEmpty } = require('../stock.cjs');
  assert.equal(isEmpty(0), true);
  for (const n of [1, 2, 1000]) assert.equal(isEmpty(n), false);
}
if (task && !['T1', 'T2'].includes(task)) throw new Error('Unknown task');
console.log('selected assertions complete');
`);
  put('project-context/PRD.md', `# PRD
FEAT-01: saveLabel() mengembalikan string Simpan.
FEAT-02: isEmpty(quantity) true hanya untuk nol; input internal integer 0..1000.
FEAT-03: Petunjuk penggunaan adalah backlog terpisah.
Satu pengguna lokal, dua fungsi sinkron tanpa efek samping. Tidak ada UI atau jaringan.
`);
  put('project-context/architecture.md', `# Arsitektur
JavaScript CommonJS, Node.js 22+, labels.cjs dan stock.cjs adalah modul native lokal.
Tidak ada UI, API jaringan, database, framework, package tambahan atau build.
scripts/check.cjs [T1|T2] memeriksa task tunggal; tanpa argumen memeriksa seluruh Phase 1.
Schema, kontrak API jaringan dan StyleGuide tidak berlaku untuk dua helper ini.
Tidak ada penyimpanan state, deployment service, integrasi atau migrasi.
`);
  put('project-context/rules.md', commonRules);
  put('project-context/Task.md', `# Task
## Execution Rules
Kerjakan tugas dalam satu fase berurutan, lalu berhenti setelah fase selesai. Tanpa commit.
## Phase 1 — Koreksi helper
status: in-progress
- [ ] T1 — FEAT-01: saveLabel() mengembalikan Simpan.
  AC: keluaran tepat Simpan; validasi node scripts/check.cjs T1.
- [ ] T2 — FEAT-02: isEmpty(0) true, integer positif sampai 1000 false.
  AC: validasi node scripts/check.cjs T2.
DoD: kedua task terverifikasi, node scripts/check.cjs, spec-compliance unit phase,
code-review unit phase; catat bukti sebelum status done. Tidak ada delta spec.
## Phase 2 — Petunjuk
status: pending
- [ ] T3 — FEAT-03: tulis petunjuk penggunaan ketika fase ini diminta.
`);
}

function seedPlanning(project) {
  const put = (name, value) => write(path.join(project, name), value);
  put('project-context/PRD.md', `# PRD — Inventaris meja
Status: keputusan produk disetujui untuk dokumentasi dan perencanaan.
FEAT-01: Satu operator pada workstation lokal melihat daftar item, urut id naik.
FEAT-02: Operator menambah item melalui POST /items; belum diimplementasikan.
DATA-01: items(id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE,
quantity INTEGER NOT NULL CHECK(typeof(quantity) = 'integer' AND quantity BETWEEN 0 AND 1000000)).
Nama disimpan setelah trim, panjang 1..80 karakter, unik case-sensitive (SQLite BINARY).
CHECK nama memastikan trim(name) = name dan length(name) BETWEEN 1 AND 80.
Tidak ada edit, delete, timestamp, audit history, tenant, login, impor/ekspor atau pencarian.
Data non-PII sampai 1000 item, satu operator, satu penulis; input harus object hanya name
dan quantity; quantity integer 0..1000000 tanpa coercion, nama string sesuai batas.
API-01: GET /items -> 200 {items:[{id,name,quantity}]} seluruh item; [] bila kosong.
API-02: POST /items JSON -> 201 {item:{id,name,quantity}}, id ditetapkan database.
INVALID_INPUT 400, NAME_CONFLICT 409, CAPACITY_REACHED 409 bila 1000 item,
UNSUPPORTED_MEDIA_TYPE 415, PAYLOAD_TOO_LARGE 413 untuk body >4096 byte,
NOT_FOUND 404, METHOD_NOT_ALLOWED 405 (Allow), BUSY 503 (Retry-After: 1), INTERNAL_ERROR 500.
Semua error berbentuk {error:{code}} tanpa SQL, stack atau data input.
Tidak ada pagination di batas ini, API versioning belum perlu; perubahan kontrak memerlukan keputusan baru.
Tidak ada retry otomatis untuk POST; cek daftar setelah hasil tak pasti agar tidak menduplikasi.
Tidak ada auth aplikasi karena workstation pribadi, binding 127.0.0.1, satu OS user.
UI di luar scope, tidak ada browser client atau CORS. Tidak boleh diekspos publik.
Retensi sampai operator menghentikan aplikasi, tidak ada penghapusan otomatis.
Recovery: maintainer backup harian saat proses berhenti, RPO 24 jam, RTO 30 menit,
retensi 7 backup lokal dengan permission owner-only; uji restore file salinan terpisah.
NFR-01: satu proses, satu maintainer, tanpa anggaran layanan; listing 1000 item <100 ms
pada workstation target perlu diukur sebelum release, bukan klaim hasil sekarang.
`);
  put('project-context/architecture.md', `# Arsitektur — keputusan berlaku
ARCH-01: JavaScript CommonJS, Node.js 22.13+ dengan node:sqlite DatabaseSync,
node:http untuk transport lokal yang belum dibuat, SQLite file lokal inventory.sqlite.
Tidak ada framework, ORM, dependency, queue, cache, container, cloud atau build.
inventory.cjs sudah berisi skema awal dan listItems(db); test in-memory memakai SQLite nyata.
scripts/check.cjs menguji baseline listing, constraint dan urutan. server.cjs dan POST belum ada.
SQL parameterized untuk semua data pengguna. DB STRICT, transaksi BEGIN IMMEDIATE
untuk hitung kapasitas dan insert atomik. busy_timeout 1000 ms; lock timeout -> BUSY.
Transport binding 127.0.0.1:3000, content-type application/json untuk POST, body <=4096 byte,
request timeout 5 detik, maksimal 4 request aktif; kelebihan -> BUSY tanpa retry otomatis.
GET/POST hanya /items, tanpa query params; query yang tidak dikenal -> INVALID_INPUT.
Berhenti menerima request saat shutdown, selesaikan request aktif, tutup DB; readiness
melalui query SELECT 1 lokal. Log hanya method, path, status, duration; tanpa body/SQL/stack.
File DB dan backup owner-only, umask 077; error permission disk-full dilaporkan aman dan write gagal atomik.
Migrasi awal version 1 melalui PRAGMA user_version, transaksi DDL, hentikan proses dulu;
backup sebelum migrasi, validasi schema dan integrity_check, rollback file backup saat offline.
Downtime maintenance disetujui; tidak ada zero-downtime atau distributed transaction.
Restore: hentikan proses, salin backup ke lokasi terpisah, integrity_check dan listing smoke,
baru ganti file aktif; kegagalan menyisakan file lama. Maintainer pemilik recovery dan incident.
Pengujian node:test + node:assert; node scripts/check.cjs untuk baseline, tambah test lokal
boundary/conflict/capacity/error/rollback saat implementasi. Tanpa network eksternal atau instalasi.
Style JavaScript CommonJS, two-space indentation, validasi di boundary HTTP dan constraint DB,
hindari abstraction layer kosong; nama fungsi camelCase, tabel/kolom snake_case.
Testing perubahan: jalankan test relevan lalu seluruh test; jangan melemahkan baseline.
Quality gates spec-compliance lalu code-review per fase; dokumen planning bukan bukti gates.
Satu fase per eksekusi, tugas modular kecil berdasar dependencies; tidak ada commit otomatis.
Usulan di luar PRD perlu persetujuan terpisah; credentials dan data pribadi tidak dibutuhkan.
`);
  put('inventory.cjs', `'use strict';
const schema = \`CREATE TABLE items (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE CHECK(trim(name) = name AND length(name) BETWEEN 1 AND 80),
  quantity INTEGER NOT NULL CHECK(typeof(quantity) = 'integer' AND quantity BETWEEN 0 AND 1000000)
) STRICT;\`;
exports.initialize = db => { db.exec(schema); db.exec('PRAGMA user_version = 1'); };
exports.listItems = db => db.prepare('SELECT id, name, quantity FROM items ORDER BY id ASC').all();
`);
  put('scripts/check.cjs', `'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { DatabaseSync } = require('node:sqlite');
const { initialize, listItems } = require('../inventory.cjs');
test('existing SQLite listing and integrity boundaries', () => {
  const db = new DatabaseSync(':memory:');
  try {
    initialize(db);
    assert.deepEqual(listItems(db), []);
    const insert = db.prepare('INSERT INTO items (id, name, quantity) VALUES (?, ?, ?)');
    insert.run(2, 'Pensil', 0); insert.run(1, 'Buku', 1000000);
    assert.deepEqual(listItems(db).map(row => ({ ...row })), [
      { id: 1, name: 'Buku', quantity: 1000000 }, { id: 2, name: 'Pensil', quantity: 0 }
    ]);
    for (const [name, quantity] of [['Buku', 1], [' ', 1], [' padded ', 1], ['x'.repeat(81), 1], ['A', -1], ['B', 1000001], ['C', 1.5]]) {
      assert.throws(() => insert.run(3, name, quantity));
    }
    assert.equal(listItems(db).length, 2);
  } finally { db.close(); }
});
`);
}

function prepare() {
  const repo = fs.realpathSync(path.join(__dirname, '..'));
  const catalog = json(path.join(__dirname, 'workflow-cases.json')).acceptance;
  need(catalog.version === 1 && catalog.cases.length === 6, 'CATALOG-VERSION');
  const official = fs.readFileSync(path.join(repo, '.agents/macca-managed-skills.txt'), 'utf8');
  const managed = official.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  need(managed.length === new Set(managed).size && managed.includes('_shared'), 'MANIFEST-ENTRIES');
  for (const name of managed) need(/^(?:_[a-z0-9]+|[a-z0-9]+(?:-[a-z0-9]+)*)$/.test(name), 'MANIFEST-NAME');
  for (const item of catalog.cases) for (const name of item.skills) need(managed.includes(name), 'MANIFEST-SKILL');
  const tmp = fs.realpathSync(os.tmpdir());
  const root = fs.realpathSync(fs.mkdtempSync(path.join(tmp, 'macca-acceptance-')));
  fs.chmodSync(root, 0o700);
  const inspector = path.join(root, 'assert.cjs');
  write(inspector, fs.readFileSync(__filename));
  const sourceSkills = {};
  for (const name of managed) {
    const source = path.join(repo, '.agents/skills', name);
    need(fs.lstatSync(source).isDirectory(), 'MANIFEST-DIRECTORY');
    sourceSkills[name] = inventory(source);
  }
  const manifest = {
    version: 1, status: 'NOT RUN', prepared_at: new Date().toISOString(), root,
    source_repository: repo, node: process.version, platform: process.platform,
    inspector, inspector_sha256: sha(fs.readFileSync(inspector)),
    catalog_sha256: sha(fs.readFileSync(path.join(__dirname, 'workflow-cases.json'))),
    official_manifest_sha256: sha(official), source_skills: sourceSkills,
    common_constraints: catalog.common_constraints, cases: [],
  };
  for (const item of catalog.cases) {
    const base = path.join(root, item.id);
    const project = path.join(base, 'project');
    const before = path.join(base, 'before');
    const evidence = path.join(base, 'evidence');
    fs.mkdirSync(project, { recursive: true, mode: 0o700 });
    fs.mkdirSync(evidence, { mode: 0o700 });
    for (const name of managed) {
      const source = path.join(repo, '.agents/skills', name);
      need(same(inventory(source), sourceSkills[name]), 'SOURCE-CHANGED');
      copyTree(source, path.join(project, '.agents/skills', name));
    }
    write(path.join(project, '.agents/macca-managed-skills.txt'), official);
    const config = syntheticConfig(item.id === 'planning' ? 'backend' : 'fullstack');
    const configPath = path.join(project, '.agents/developer-config.json');
    writeJSON(configPath, config);
    const scripts = path.join(project, '.agents/skills/_shared/scripts');
    need(fs.existsSync(path.join(scripts, 'read-preferences.js')), 'PREFERENCES-HELPER-MISSING');
    const validator = runNode(project, [path.join(scripts, 'config-validator.js'), configPath]);
    const preferences = runNode(project, [path.join(scripts, 'read-preferences.js'), configPath]);
    const secrets = sentinels(config);
    need(validator.status === 0 && preferences.status === 0, 'CONFIG-PRECONDITION');
    need(!containsSecret(JSON.stringify([validator, preferences]), secrets), 'CONFIG-READER-LEAK');
    const summary = JSON.parse(preferences.stdout);
    need(summary.languagePreferences.communication.effective === 'indonesian'
      && summary.languagePreferences.documents.effective === 'indonesian'
      && summary.brainstormPreferences.recommendations.value === false, 'CONFIG-SAFE-ENUMS');
    write(path.join(project, 'notes/user-draft.txt'), 'DRAF PENGGUNA — pertahankan persis.\n');
    write(path.join(project, 'data/user-input.json'), '{"owner":"operator-local","quantities":[0,2,1000],"keep":true}\n');
    if (item.id === 'planning') seedPlanning(project);
    else if (item.id === 'developer') seedDeveloper(project);
    else seedCounter(project, item.id);
    const precondition = runNode(project, ['scripts/check.cjs']);
    const expectedExit = ['developer', 'bug'].includes(item.id) ? 1 : 0;
    need(!containsSecret(JSON.stringify(precondition), secrets), 'PRECONDITION-LEAK');
    need(!precondition.error && precondition.status === expectedExit, 'APP-PRECONDITION');
    writeJSON(path.join(evidence, 'preparation-command.json'), {
      ...precondition, cwd: project, expected_exit: expectedExit,
      purpose: 'Fixture precondition only; no agent workflow executed.',
    });
    copyTree(project, before);
    const beforeInventory = inventory(before);
    writeJSON(path.join(base, 'before.sha256.json'), beforeInventory);
    const entry = {
      id: item.id, project, before, evidence, status: 'NOT RUN',
      before_metadata: path.join(base, 'before.sha256.json'), before_inventory_sha256: sha(JSON.stringify(beforeInventory)),
      config_sha256: sha(fs.readFileSync(configPath)), sentinel_sha256: secrets.map(sha),
      config_preparation: { validator_exit: validator.status, reader_exit: preferences.status, reader_output_sha256: sha(preferences.stdout) },
      app_precondition: { exit: precondition.status, expected_exit: expectedExit, evidence: path.join(evidence, 'preparation-command.json') },
      rubric: item.rubric, stages: [],
    };
    for (const stage of item.stages) {
      const promptPath = path.join(base, 'prompts', `${stage.id}.txt`);
      const stageEvidence = path.join(evidence, stage.id);
      fs.mkdirSync(stageEvidence, { mode: 0o700 });
      const wrapper = `Work only in ${project}. Read the fixture-local .agents/skills/${stage.skill}/SKILL.md and its referenced resources, including sequential owning-skill handoffs. Use saved preferences through the installed safe reader. Use permitted local tools only. Do not launch nested agents, install packages, contact external services, commit, publish or deploy. Preserve pre-existing work. Do not inspect sibling directories, evaluator files, future prompts or before snapshots. The parent records evidence outside this project.\n\n`;
      write(promptPath, wrapper + stage.prompt + '\n');
      entry.stages.push({
        ...stage, prompt_path: promptPath, prompt_sha256: sha(fs.readFileSync(promptPath)),
        evidence: stageEvidence, response_path: path.join(stageEvidence, 'response.txt'),
        trace_path: path.join(stageEvidence, 'trace.jsonl'),
        checkpoint: path.join(base, 'checkpoints', stage.id),
        capture: commandSpec(inspector, 'capture', root, item.id, stage.id),
        assert: commandSpec(inspector, 'check', root, item.id, stage.id),
        assert_artifacts: commandSpec(inspector, 'check-artifacts', root, item.id, stage.id),
      });
    }
    noSecretsInTree(project, secrets, ['.agents/developer-config.json']);
    need(!containsSecret(JSON.stringify(entry), secrets), 'METADATA-LEAK');
    manifest.cases.push(entry);
  }
  writeJSON(path.join(root, 'manifest.json'), manifest);
  console.log(JSON.stringify({ root, manifest: path.join(root, 'manifest.json'), status: 'NOT RUN', cases: manifest.cases.map(c => ({ id: c.id, project: c.project, prompts: c.stages.map(s => s.prompt_path) })) }, null, 2));
}

function loadRun(root, caseId, stageId) {
  need(path.isAbsolute(root) && fs.realpathSync(root) === root, 'ROOT-REALPATH');
  need(path.dirname(root) === fs.realpathSync(os.tmpdir()) && path.basename(root).startsWith('macca-acceptance-'), 'ROOT-TEMP');
  const manifest = json(path.join(root, 'manifest.json'));
  need(manifest.root === root && manifest.version === 1, 'MANIFEST-ROOT');
  need(sha(fs.readFileSync(__filename)) === manifest.inspector_sha256, 'INSPECTOR-INTEGRITY');
  const item = manifest.cases.find(c => c.id === caseId);
  const stage = item && item.stages.find(s => s.id === stageId);
  need(item && stage, 'CASE-STAGE');
  need(item.project === path.join(root, caseId, 'project'), 'PROJECT-BOUNDARY');
  need(fs.realpathSync(item.project) === item.project, 'PROJECT-REALPATH');
  const before = inventory(item.before);
  need(sha(JSON.stringify(before)) === item.before_inventory_sha256, 'BEFORE-INTEGRITY');
  need(same(before, json(item.before_metadata)), 'BEFORE-METADATA');
  const config = json(path.join(item.before, '.agents/developer-config.json'));
  const secrets = sentinels(config);
  need(same(secrets.map(sha), item.sentinel_sha256), 'SENTINEL-INTEGRITY');
  need(sha(fs.readFileSync(stage.prompt_path)) === stage.prompt_sha256, 'PROMPT-INTEGRITY');
  return { manifest, item, stage, secrets };
}
function checkpointInventory(stage) {
  need(fs.existsSync(path.join(stage.checkpoint, 'metadata.json')), 'CHECKPOINT-MISSING');
  const rows = inventory(path.join(stage.checkpoint, 'project'));
  const meta = json(path.join(stage.checkpoint, 'metadata.json'));
  need(meta.stage === stage.id && meta.inventory_sha256 === sha(JSON.stringify(rows)), 'CHECKPOINT-INTEGRITY');
  need(same(rows, meta.inventory), 'CHECKPOINT-METADATA');
  return rows;
}
function capture(root, caseId, stageId) {
  const { item, stage, secrets } = loadRun(root, caseId, stageId);
  need(!fs.existsSync(stage.checkpoint), 'CHECKPOINT-ALREADY-EXISTS');
  if (stage.after) checkpointInventory(item.stages.find(s => s.id === stage.after));
  noSecretsInTree(item.project, secrets, ['.agents/developer-config.json']);
  // Snapshot failures and unexpected edits too; capture itself does not grade behavior.
  copyTree(item.project, path.join(stage.checkpoint, 'project'));
  const rows = inventory(path.join(stage.checkpoint, 'project'));
  const evidence = inventory(stage.evidence);
  noSecretsInTree(stage.evidence, secrets);
  writeJSON(path.join(stage.checkpoint, 'metadata.json'), {
    stage: stage.id, captured_at: new Date().toISOString(), inventory: rows,
    inventory_sha256: sha(JSON.stringify(rows)), evidence_inventory: evidence,
    status: 'CAPTURED — NOT GRADED',
  });
  console.log(JSON.stringify({ case: caseId, stage: stageId, checkpoint: stage.checkpoint, status: 'CAPTURED — NOT GRADED' }));
}

function match(value, pattern, id) { need(pattern.test(value), id); }
function taskLine(value, id, checked) {
  match(value, new RegExp(`^\\s*- \\[${checked ? '[xX]' : ' '}\\]\\s+(?:\\*\\*)?${id}\\b`, 'm'), `TASK-${id}-${checked ? 'COMPLETE' : 'PENDING'}`);
}
function testTaskLine() {
  const assert = require('node:assert/strict');
  for (const mark of ['x', 'X']) {
    assert.doesNotThrow(() => taskLine(`- [${mark}] T1 — done`, 'T1', true));
    assert.doesNotThrow(() => taskLine(`- [${mark}] **T2** — done`, 'T2', true));
    assert.throws(() => taskLine(`- [${mark}] T1 — done`, 'T1', false), /TASK-T1-PENDING/);
  }
  assert.throws(() => taskLine('- [ ] T1 — pending', 'T1', true), /TASK-T1-COMPLETE/);
  assert.throws(() => taskLine('- [xX] T1 — malformed', 'T1', true), /TASK-T1-COMPLETE/);
  assert.doesNotThrow(() => taskLine('- [ ] T1 — pending', 'T1', false));
  assert.throws(() => taskLine('- [x] T10 — another task', 'T1', true), /TASK-T1-COMPLETE/);
  console.log(JSON.stringify({ unit: 'taskLine', assertions: 10, status: 'UNIT ASSERTIONS PASSED', workflow_verdict: 'NOT VERIFIED' }));
}
function documentChecks(caseId, stageId, current, base) {
  if (caseId === 'developer') {
    const tasks = text(current, 'project-context/Task.md');
    taskLine(tasks, 'T1', true); taskLine(tasks, 'T2', true); taskLine(tasks, 'T3', false);
    const phase1 = tasks.split('## Phase 1')[1]?.split('## Phase 2')[0] || '';
    match(phase1, /status:\s*done\b/, 'DEV-PHASE-DONE');
    need(tasks.split('## Phase 2')[1] === text(base, 'project-context/Task.md').split('## Phase 2')[1], 'DEV-BACKLOG-PRESERVED');
  }
  if (caseId === 'feature' && stageId === 'approved-docs') {
    for (const file of ['PRD.md', 'architecture.md', 'api.md']) match(text(current, `project-context/${file}`), /decrement/, `FEATURE-${file}`);
    match(text(current, 'project-context/PRD.md'), /FEAT-02/, 'FEATURE-ID');
    const tasks = text(current, 'project-context/Task.md');
    taskLine(tasks, 'T0', true);
    match(tasks, /decrement/i, 'FEATURE-NEW-TASK');
    match(tasks, /## Phase 2\b/, 'FEATURE-NEW-PHASE');
    match(tasks, /- \[ \].*decrement/i, 'FEATURE-UNCHECKED');
    for (const line of text(base, 'project-context/Task.md').split('\n').filter(line => /T0|Evidence:|Riwayat pengguna:/.test(line))) need(tasks.includes(line), 'FEATURE-HISTORY');
  }
  if (caseId === 'bug' && stageId === 'confirmation') {
    const oldLog = text(base, 'project-context/bug-log.md');
    const log = text(current, 'project-context/bug-log.md');
    need(log.startsWith(oldLog), 'BUG-APPEND-ONLY');
    const added = log.slice(oldLog.length);
    for (const [id, pattern] of Object.entries({ cause: /akar|penyebab|root cause/i, fix: /perbaik|fix/i, prevention: /regresi|pencegah|prevention/i, validation: /scripts\/check\.cjs/, confirmation: /konfirmasi|confirm/i })) match(added, pattern, `BUG-LOG-${id}`);
  }
  if (caseId !== 'planning') return;
  const file = { schema: 'schema.md', api: 'api.md', rules: 'rules.md', task: 'Task.md' }[stageId];
  const doc = text(current, `project-context/${file}`);
  need(doc.length >= 300, 'PLAN-NONPLACEHOLDER');
  const patterns = {
    schema: [/SQLite/i, /items/, /quantity/, /1000000/, /80/, /unique/i, /backup/i, /restore|pemulihan/i, /migrasi|migration/i],
    api: [/GET\s+[`']?\/?items/i, /POST\s+[`']?\/?items/i, /201/, /409/, /4096/, /INVALID_INPUT/, /NAME_CONFLICT/, /CAPACITY_REACHED/, /BUSY/, /127\.0\.0\.1/, /503/],
    rules: [/CommonJS/, /node:test/, /parameter|prepared/i, /backup/i, /spec-compliance/, /code-review/],
    task: [/FEAT-01/, /FEAT-02/, /existing verified|sudah terverifikasi/i, /gap|kesenjangan/i, /POST/, /- \[ \]/, /validasi|validation|test/i],
  };
  patterns[stageId].forEach((pattern, i) => match(doc, pattern, `PLAN-${stageId}-${i + 1}`));
}

function traceChecks(item, stage, secrets) {
  need(fs.existsSync(stage.response_path) && fs.existsSync(stage.trace_path), 'EVIDENCE-MISSING');
  const response = fs.readFileSync(stage.response_path, 'utf8');
  const raw = fs.readFileSync(stage.trace_path, 'utf8');
  need(response.trim() && raw.trim(), 'EVIDENCE-EMPTY');
  need(!containsSecret(response + raw, secrets), 'SECRET-TRACE');
  const events = raw.trim().split('\n').map(line => JSON.parse(line));
  events.forEach((event, i) => {
    need(Number.isInteger(event.seq) && (i === 0 || event.seq > events[i - 1].seq), 'TRACE-ORDER');
    need(['user', 'assistant', 'tool'].includes(event.kind) && typeof event.text === 'string', 'TRACE-SHAPE');
  });
  need(events.some(e => e.kind === 'user' && e.text.includes(stage.prompt)), 'ACTUAL-PROMPT-MISSING');
  need(events.some(e => e.kind === 'assistant' && e.text.trim() === response.trim()), 'RESPONSE-NOT-IN-TRACE');
  need(events.some(e => e.kind === 'tool'), 'TOOL-EVIDENCE-MISSING');
  const trace = events.map(e => e.text).join('\n');
  const previousTraces = item.stages.slice(0, item.stages.indexOf(stage)).map(previous => {
    const meta = json(path.join(previous.checkpoint, 'metadata.json'));
    const bytes = fs.readFileSync(previous.trace_path);
    need(meta.evidence_inventory.find(row => row.path === 'trace.jsonl')?.sha256 === sha(bytes), 'PRIOR-TRACE-INTEGRITY');
    need(!containsSecret(bytes, secrets), 'SECRET-PRIOR-TRACE');
    return bytes.toString('utf8');
  }).join('\n');
  // Unchanged preferences may be reused in later turns of this same conversation.
  match(previousTraces + trace, /read-preferences\.js/, 'SAFE-READER-EVIDENCE');
  if (item.id === 'release') {
    match(response, /\bNOT READY\b/, 'RELEASE-VERDICT');
    match(response, /\bNOT VERIFIED\b/, 'RELEASE-MISSING-EVIDENCE');
    need(!/\[GATE\s*[—-]/.test(response), 'RELEASE-PHANTOM-GATE');
  }
  if (item.id === 'meet') {
    const names = [...response.matchAll(/^###\s+@(Galbi|Fachri|Akram|Firdaus|Ikhsan)\b/gm)].map(m => m[1]);
    const order = ['Galbi', 'Fachri', 'Akram', 'Firdaus', 'Ikhsan'];
    need(names.length > 0 && names.length === new Set(names).size, 'MEET-ONCE');
    need(same(names, [...names].sort((a, b) => order.indexOf(a) - order.indexOf(b))), 'MEET-ORDER');
    if (stage.id === 'named') need(same(names, ['Fachri', 'Firdaus']), 'MEET-NAMED');
    else need(names.length < 5, 'MEET-DELEGATED-BOUNDED');
    match(response, /^##\s+@Galbi\s+[—-]\s+Meeting Summary/m, 'MEET-SUMMARY');
    match(response, /rapat (?:di)?tutup|pertemuan (?:di)?tutup|diskusi (?:di)?tutup/i, 'MEET-CLOSED');
  }
  if ((item.id === 'developer' && stage.id === 'phase') || (item.id === 'bug' && stage.id === 'fix')) {
    match(trace, /spec-compliance/, 'COMPLIANCE-EVIDENCE-MARKER');
    match(trace, /code-review/, 'REVIEW-EVIDENCE-MARKER');
    // Marker presence cannot establish execution or order; that is a mandatory trace rubric.
  }
  return { response_sha256: sha(response), trace_sha256: sha(raw), events: events.length };
}

function check(root, caseId, stageId, artifactsOnly = false) {
  const { item, stage, secrets } = loadRun(root, caseId, stageId);
  const rows = checkpointInventory(stage);
  const current = path.join(stage.checkpoint, 'project');
  const previous = stage.after && item.stages.find(s => s.id === stage.after);
  const base = previous ? path.join(previous.checkpoint, 'project') : item.before;
  const before = previous ? checkpointInventory(previous) : inventory(base);
  const delta = changed(before, rows);
  need(delta.every(file => stage.allowed.includes(file)), 'BOUNDARY-CHANGED-PATH');
  for (const file of stage.required) need(delta.includes(file), 'REQUIRED-ARTIFACT-NOT-CHANGED');
  // All stages preserve immutable baseline artifacts, even if an earlier stage went wrong.
  const cumulativeAllowed = item.stages.slice(0, item.stages.indexOf(stage) + 1).flatMap(s => s.allowed);
  need(changed(inventory(item.before), rows).every(file => cumulativeAllowed.includes(file)), 'BOUNDARY-CUMULATIVE');
  need(sha(fs.readFileSync(path.join(current, '.agents/developer-config.json'))) === item.config_sha256, 'CONFIG-UNCHANGED');
  noSecretsInTree(current, secrets, ['.agents/developer-config.json']);
  noSecretsInTree(stage.evidence, secrets);
  const trace = artifactsOnly ? {} : traceChecks(item, stage, secrets);
  const capturedEvidence = json(path.join(stage.checkpoint, 'metadata.json')).evidence_inventory;
  const availableEvidence = inventory(stage.evidence);
  if (artifactsOnly) {
    // Preserve every captured evidence byte without imposing a transcript schema.
    // Later evidence may be scanned, but is not presented as captured host evidence.
    for (const row of capturedEvidence) {
      need(same(row, availableEvidence.find(e => e.path === row.path)), 'EVIDENCE-CAPTURE-INTEGRITY');
    }
  } else {
    // Strict evidence exports must exist before capture and stay unchanged afterward.
    for (const file of ['response.txt', 'trace.jsonl']) {
      need(same(capturedEvidence.find(e => e.path === file), availableEvidence.find(e => e.path === file)), 'EVIDENCE-CAPTURE-INTEGRITY');
    }
  }
  documentChecks(caseId, stageId, current, base);
  const commands = [];
  const behaviorExpected = (caseId === 'developer' || caseId === 'bug' && stageId !== 'diagnosis' || caseId === 'planning') ? 0
    : caseId === 'bug' ? 1 : null;
  if (behaviorExpected !== null) {
    const result = runNode(current, ['scripts/check.cjs']);
    need(!containsSecret(JSON.stringify(result), secrets), 'SECRET-COMMAND');
    const record = { ...result, cwd: current, recorded_at: new Date().toISOString() };
    const target = path.join(stage.evidence, `command-${crypto.randomUUID()}.json`);
    writeJSON(target, record);
    commands.push(target);
    need(!result.error && result.status === behaviorExpected, 'BEHAVIOR-EXIT');
  }
  // Exported behavior is independently challenged, not accepted from a source marker.
  if (caseId === 'developer' || caseId === 'bug' && stageId !== 'diagnosis') {
    const probe = caseId === 'developer'
      ? "const a=require('node:assert/strict');a.equal(require('./labels.cjs').saveLabel(),'Simpan');const f=require('./stock.cjs').isEmpty;for(let n=0;n<=1000;n++)a.equal(f(n),n===0);"
      : "const a=require('node:assert/strict'),f=require('./counter.cjs').increment;for(let n=-1000;n<=1000;n++)a.equal(f(n),n+1);for(const x of [null,true,{},[],NaN,Infinity,'1',0.1,-1001,1001])a.throws(()=>f(x),TypeError);";
    const result = runNode(current, ['-e', probe]);
    need(!containsSecret(JSON.stringify(result), secrets), 'SECRET-PROBE');
    const target = path.join(stage.evidence, `probe-${crypto.randomUUID()}.json`);
    writeJSON(target, { ...result, cwd: current, recorded_at: new Date().toISOString() });
    commands.push(target);
    need(!result.error && result.status === 0, 'BEHAVIOR-PROBE');
  }
  need(same(inventory(current), rows), 'CHECK-MUTATED-CHECKPOINT');
  const report = {
    case: caseId, stage: stageId, changed_paths: delta, ...trace, commands,
    mode: artifactsOnly ? 'check-artifacts' : 'check',
    inspector_sha256: sha(fs.readFileSync(__filename)),
    artifact_checks: artifactsOnly ? 'ARTIFACT CHECKS PASSED' : 'completed', workflow_verdict: 'NOT VERIFIED',
    ...(artifactsOnly ? {
      behavioral_verdict: 'NOT VERIFIED',
      trace_validation: 'NOT PERFORMED — summaries are not raw host transcripts',
      lexical_safety: {
        status: 'No literal sentinel match in scanned files',
        evidence_files: availableEvidence.filter(row => row.type === 'file'),
        scope: 'Checkpoint files except the original synthetic config, available evidence files, and independent command output only. No complete-trace or transformed-secret guarantee.',
      },
    } : {}),
    remaining: ['Inspect complete raw host trace for actual skill execution, gate order, transient writes and permission boundaries.', ...item.rubric],
  };
  const reportPath = path.join(stage.evidence, `assertion-${crypto.randomUUID()}.json`);
  writeJSON(reportPath, report);
  console.log(JSON.stringify({ case: caseId, stage: stageId, report: reportPath,
    artifact_checks: report.artifact_checks, workflow_verdict: 'NOT VERIFIED',
    ...(artifactsOnly ? { behavioral_verdict: 'NOT VERIFIED', lexical_safety: 'Available files scanned for literal sentinels only; no full-trace guarantee' } : {}),
  }));
}

try {
  const [mode, root, caseId, stageId, ...extra] = process.argv.slice(2);
  if (!mode) prepare();
  else if (mode === 'test-task-line' && !root && !caseId && !stageId && !extra.length) testTaskLine();
  else if (['capture', 'check', 'check-artifacts'].includes(mode) && root && caseId && stageId && !extra.length) {
    if (mode === 'capture') capture(root, caseId, stageId);
    else check(root, caseId, stageId, mode === 'check-artifacts');
  } else throw new Error('USAGE');
} catch (error) {
  // Never print arbitrary filesystem/parser/child-process errors or config contents.
  const id = /^[A-Z][A-Z0-9-]+$/.test(error.message || '') ? error.message : 'LOCAL-OPERATION-ERROR';
  console.error(JSON.stringify({ status: 'INCOMPLETE', constraint: id, workflow_verdict: 'NOT VERIFIED' }));
  process.exitCode = 1;
}
