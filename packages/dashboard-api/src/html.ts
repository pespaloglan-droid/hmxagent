export const DASHBOARD_HTML = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>HMX Agent Control Center</title>
<style>
  :root {
    --bg:#0a0e1a; --panel:#10152a; --panel2:#161c36; --border:#232b4d;
    --text:#e8ecf8; --muted:#8a93b8; --accent:#7c5cff; --accent2:#4f8cff;
    --ok:#22c55e; --err:#f85149; --warn:#f0b429;
  }
  * { box-sizing:border-box; margin:0; }
  body { background:var(--bg); color:var(--text); font-family:"Segoe UI",system-ui,sans-serif; display:flex; height:100vh; overflow:hidden; font-size:14px; }

  /* ---- sol menu ---- */
  aside { width:230px; min-width:230px; background:var(--panel); border-right:1px solid var(--border); display:flex; flex-direction:column; padding:16px 10px; }
  .logo { display:flex; align-items:center; gap:10px; padding:6px 10px 16px; border-bottom:1px solid var(--border); margin-bottom:12px; }
  .logo .mark { width:34px; height:34px; border-radius:10px; background:linear-gradient(135deg,var(--accent),var(--accent2)); display:flex; align-items:center; justify-content:center; font-weight:800; color:#fff; }
  .logo b { font-size:14px; } .logo span { display:block; font-size:11px; color:var(--muted); }
  .menu-label { font-size:10px; letter-spacing:1px; color:var(--muted); text-transform:uppercase; padding:10px 12px 4px; }
  .nav-btn { display:flex; align-items:center; gap:10px; width:100%; background:none; border:none; color:var(--muted); padding:9px 12px; border-radius:8px; cursor:pointer; font:inherit; font-size:13px; margin-bottom:2px; }
  .nav-btn:hover { background:var(--panel2); color:var(--text); }
  .nav-btn.active { background:linear-gradient(90deg,rgba(124,92,255,.25),rgba(79,140,255,.12)); color:#fff; border-left:3px solid var(--accent); }
  .nav-btn .badge { margin-left:auto; background:var(--accent); color:#fff; border-radius:10px; font-size:10px; padding:1px 7px; }
  .sys { margin-top:auto; padding:12px; border-top:1px solid var(--border); font-size:11px; color:var(--muted); }
  .sys .dot { color:var(--ok); }

  /* ---- ana alan ---- */
  main { flex:1; display:flex; flex-direction:column; overflow:hidden; }
  .topbar { height:54px; border-bottom:1px solid var(--border); display:flex; align-items:center; gap:14px; padding:0 20px; background:var(--panel); }
  .topbar .search { flex:1; max-width:480px; background:var(--bg); border:1px solid var(--border); border-radius:8px; padding:7px 12px; color:var(--muted); font-size:12px; }
  .topbar .status { margin-left:auto; font-size:12px; color:var(--ok); }
  .page { flex:1; overflow-y:auto; padding:20px; display:none; }
  .page.active { display:block; }

  /* ---- genel bilesenler ---- */
  .card { background:var(--panel); border:1px solid var(--border); border-radius:12px; padding:16px; margin-bottom:14px; }
  h2 { font-size:15px; margin-bottom:12px; } h3 { font-size:13px; margin-bottom:8px; color:var(--muted); }
  input, select, textarea { background:var(--bg); border:1px solid var(--border); color:var(--text); border-radius:8px; padding:8px 10px; width:100%; font:inherit; font-size:13px; margin-bottom:8px; }
  textarea { min-height:90px; resize:vertical; }
  .btn { background:linear-gradient(90deg,var(--accent),var(--accent2)); color:#fff; border:none; border-radius:8px; padding:9px 18px; cursor:pointer; font-weight:600; font-size:13px; }
  .btn.ghost { background:transparent; border:1px solid var(--border); color:var(--text); }
  .btn.danger { background:var(--err); }
  .btn:disabled { opacity:.5; cursor:not-allowed; }
  table { width:100%; border-collapse:collapse; font-size:12px; }
  th, td { text-align:left; padding:8px; border-bottom:1px solid var(--border); }
  th { color:var(--muted); font-weight:600; }
  .pill { padding:2px 9px; border-radius:10px; font-size:11px; font-weight:600; }
  .pill.ok { background:rgba(34,197,94,.15); color:var(--ok); }
  .pill.err { background:rgba(248,81,73,.15); color:var(--err); }
  .pill.unknown { background:rgba(138,147,184,.15); color:var(--muted); }
  .pill.warn { background:rgba(240,180,41,.15); color:var(--warn); }
  .muted { color:var(--muted); font-size:12px; }
  .row { display:flex; gap:8px; } .row > * { flex:1; }

  /* ---- chat sayfasi ---- */
  .chat-grid { display:grid; grid-template-columns:260px 1fr; gap:14px; height:100%; }
  .sess-item { padding:10px 12px; border-radius:8px; cursor:pointer; border:1px solid transparent; margin-bottom:6px; }
  .sess-item:hover { background:var(--panel2); }
  .sess-item.active { background:rgba(124,92,255,.15); border-color:var(--accent); }
  .sess-item b { font-size:12px; display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .sess-item span { font-size:11px; color:var(--muted); }
  .chat-area { display:flex; flex-direction:column; height:calc(100vh - 94px); }
  #chatlog { flex:1; overflow-y:auto; padding:6px 2px; }
  .msg { max-width:78%; padding:10px 14px; border-radius:12px; margin-bottom:10px; font-size:13px; white-space:pre-wrap; line-height:1.5; }
  .msg.user { margin-left:auto; background:rgba(124,92,255,.2); border:1px solid var(--accent); }
  .msg.agent { background:var(--panel2); border:1px solid var(--border); }
  .msg .who { font-size:10px; color:var(--muted); margin-bottom:4px; }
  .steps { margin-top:8px; }
  .step { display:flex; gap:10px; align-items:flex-start; padding:8px 0; border-bottom:1px dashed var(--border); font-size:12px; }
  .step .n { width:22px; height:22px; border-radius:50%; background:var(--panel); border:1px solid var(--accent); color:var(--accent); display:flex; align-items:center; justify-content:center; font-size:11px; flex-shrink:0; }
  .selectors { display:flex; gap:10px; flex-wrap:wrap; margin:10px 0; }
  .sel-box { flex:1; min-width:150px; }
  .sel-box label { font-size:10px; color:var(--muted); text-transform:uppercase; letter-spacing:.5px; display:block; margin-bottom:4px; }
  .badges { display:flex; gap:6px; flex-wrap:wrap; min-height:26px; margin-bottom:6px; }
  .mbadge { background:rgba(79,140,255,.15); border:1px solid var(--accent2); color:#bcd4ff; border-radius:14px; padding:3px 10px; font-size:11px; cursor:pointer; }
  .mbadge:hover { background:rgba(248,81,73,.2); border-color:var(--err); }
  .multi { position:relative; }
  .multi .drop { display:none; position:absolute; z-index:20; background:var(--panel2); border:1px solid var(--border); border-radius:8px; width:100%; max-height:180px; overflow-y:auto; }
  .multi.open .drop { display:block; }
  .multi .drop div { padding:8px 10px; font-size:12px; cursor:pointer; }
  .multi .drop div:hover { background:rgba(124,92,255,.2); }
  .multi .drop div.sel { color:var(--ok); }
  .route-preview { font-size:11px; color:var(--muted); background:var(--bg); border:1px dashed var(--border); border-radius:8px; padding:8px 10px; margin-bottom:8px; display:none; }

  /* ---- provider kartlari ---- */
  .prov-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:12px; }
  .prov-card { background:var(--panel); border:1px solid var(--border); border-radius:12px; padding:14px; }
  .prov-card .ic { width:38px; height:38px; border-radius:10px; background:linear-gradient(135deg,var(--accent),var(--accent2)); display:flex; align-items:center; justify-content:center; font-weight:800; margin-bottom:10px; }
  .prov-card b { font-size:13px; display:block; }
  .prov-card .kind { font-size:11px; color:var(--muted); }
  .tabs { display:flex; gap:6px; margin-bottom:14px; }
  .tab-btn { background:var(--panel); border:1px solid var(--border); color:var(--muted); border-radius:8px; padding:7px 16px; cursor:pointer; font-size:12px; }
  .tab-btn.active { background:rgba(124,92,255,.2); color:#fff; border-color:var(--accent); }
  .tabpane { display:none; } .tabpane.active { display:block; }
  .soon { border:1px dashed var(--border); border-radius:12px; padding:30px; text-align:center; color:var(--muted); }
</style>
</head>
<body>
<aside>
  <div class="logo"><div class="mark">H</div><div><b>HMX Agent</b><span>Control Center v2.0</span></div></div>
  <div class="menu-label">Ana Menu</div>
  <button class="nav-btn active" data-page="chat">&#128172; Chat</button>
  <button class="nav-btn" data-page="sessions">&#128193; Sessions <span class="badge" id="sess-count">0</span></button>
  <div class="menu-label">Server</div>
  <button class="nav-btn" data-page="servers">&#128421; Servers</button>
  <button class="nav-btn" data-page="providers">&#9881; Providers &amp; Accounts <span class="badge" id="prov-count">0</span></button>
  <button class="nav-btn" data-page="models">&#129518; Models</button>
  <div class="menu-label">Otomasyon</div>
  <button class="nav-btn" data-page="pipeline">&#9889; Pipeline</button>
  <button class="nav-btn" data-page="logs">&#128196; Logs</button>
  <button class="nav-btn" data-page="settings">&#128295; Ayarlar</button>
  <div class="sys"><span class="dot">&#9679;</span> Sistem durumu: <span id="sys-status">kontrol ediliyor...</span></div>
</aside>
<main>
  <div class="topbar">
    <input class="search" placeholder="Model, saglayici veya komut ara... (Ctrl+K)" disabled title="Yakinda">
    <span class="status" id="health-status"></span>
  </div>

  <!-- ============ CHAT ============ -->
  <div class="page active" id="page-chat">
    <div class="chat-grid">
      <div class="card" style="overflow-y:auto">
        <h2>Oturumlar</h2>
        <div id="chat-sessions"><span class="muted">Yukleniyor...</span></div>
      </div>
      <div class="card chat-area">
        <div id="chatlog">
          <div class="msg agent"><div class="who">HMX Agent</div>Merhaba! Gorevini yaz. Istersen prompt icinde yonlendirme kullan: <b>@image:flow-ai @video:flow-ai @audio:elevenlabs-web</b></div>
        </div>
        <div class="route-preview" id="route-preview"></div>
        <div class="badges" id="sel-badges"></div>
        <div class="selectors">
          <div class="sel-box"><label>Agent</label><select id="sel-agent"><option>HMX Agent (plan-onay)</option></select></div>
          <div class="sel-box"><label>LLM</label><select id="sel-llm"></select></div>
          <div class="sel-box"><label>Mod</label><select id="sel-mode"><option>High</option><option>Max</option><option>Low</option></select></div>
          <div class="sel-box"><label>Gorsel (coklu)</label><div class="multi" id="ms-image"><div class="badges" data-badges></div><input placeholder="Sec..." readonly onclick="this.parentElement.classList.toggle('open')"><div class="drop"></div></div></div>
          <div class="sel-box"><label>Video (coklu)</label><div class="multi" id="ms-video"><div class="badges" data-badges></div><input placeholder="Sec..." readonly onclick="this.parentElement.classList.toggle('open')"><div class="drop"></div></div></div>
          <div class="sel-box"><label>Ses (coklu)</label><div class="multi" id="ms-audio"><div class="badges" data-badges></div><input placeholder="Sec..." readonly onclick="this.parentElement.classList.toggle('open')"><div class="drop"></div></div></div>
        </div>
        <div class="row" style="align-items:flex-end">
          <textarea id="chatinput" placeholder="Mesajini yaz... (@image: @video: @audio: ile model sec)"></textarea>
          <button class="btn" style="flex:0 0 auto" onclick="sendChat()">Gonder</button>
        </div>
      </div>
    </div>
  </div>

  <!-- ============ SESSIONS ============ -->
  <div class="page" id="page-sessions">
    <h2>Oturumlar (Gorev Gunlukleri)</h2>
    <div class="card"><table><thead><tr><th>Oturum</th><th>Hedef</th><th>Adim</th><th>Hata</th><th>Son Aktivite</th></tr></thead><tbody id="sessions-body"></tbody></table></div>
    <div class="card"><h3>Oturum Detayi</h3><pre id="session-detail" class="muted" style="white-space:pre-wrap;font-size:11px;max-height:300px;overflow-y:auto">Soldan oturum sec.</pre></div>
  </div>

  <!-- ============ PROVIDERS & ACCOUNTS ============ -->
  <div class="page" id="page-providers">
    <div class="tabs">
      <button class="tab-btn active" data-tab="prov">Providers</button>
      <button class="tab-btn" data-tab="acc">Accounts</button>
      <button class="tab-btn" data-tab="route">Token Routing</button>
      <button class="tab-btn" data-tab="proxy">Proxies</button>
      <button class="tab-btn" data-tab="act">Activity &amp; Health</button>
    </div>

    <div class="tabpane active" id="tab-prov">
      <div class="prov-grid" id="prov-grid"></div>
      <div class="card">
        <h2>+ Yeni Saglayici Ekle</h2>
        <div class="row"><input id="p-id" placeholder="id (ornek: runway-web)">
        <select id="p-kind"><option value="video">video</option><option value="image">image</option><option value="audio">audio</option></select></div>
        <input id="p-url" placeholder="Base URL">
        <div class="row"><input id="p-prompt" placeholder="Prompt kutusu CSS selector"><input id="p-gen" placeholder="Uret butonu selector"></div>
        <div class="row"><input id="p-result" placeholder="Sonuc ogesi selector"><input id="p-dl" placeholder="Indir butonu selector"></div>
        <input id="p-fail" placeholder="Giris sayfasi URL parcasi (ornek: login)">
        <button class="btn" onclick="addProvider()">Ekle</button>
        <div class="muted" style="margin-top:6px">Ekledikten sonra terminalden giris yap: <b>hmx login &lt;id&gt;</b></div>
      </div>
    </div>

    <div class="tabpane" id="tab-acc">
      <div class="card"><h2>Hesap Havuzu</h2>
        <table><thead><tr><th>Hesap</th><th>Saglayici</th><th>Chrome Profili</th><th>Mod</th><th>Durum</th></tr></thead><tbody id="acc-body"></tbody></table>
        <div class="muted" style="margin-top:8px">Hesap eklemek icin: <b>hmx login &lt;saglayici&gt;</b> (her login bir hesap olusturur)</div>
      </div>
    </div>

    <div class="tabpane" id="tab-route">
      <div class="card"><h2>Yonlendirme Politikasi</h2><div id="routing-body" class="muted">Yukleniyor...</div></div>
    </div>

    <div class="tabpane" id="tab-proxy">
      <div class="soon"><h2>Proxy Yonetimi</h2><p>Bu modul sonraki sprintte planlaniyor. Su an proxy destegi yok; var gibi gosterilmiyor.</p></div>
    </div>

    <div class="tabpane" id="tab-act">
      <div class="card"><h2>Son Aktivite</h2><div id="activity-body" class="muted">Yukleniyor...</div></div>
    </div>
  </div>

  <!-- ============ MODELS ============ -->
  <div class="page" id="page-models">
    <h2>Kayitli Modeller</h2>
    <div class="card"><h3>LLM</h3><div id="models-llm"></div></div>
    <div class="card"><h3>Gorsel</h3><div id="models-image"></div></div>
    <div class="card"><h3>Video</h3><div id="models-video"></div></div>
    <div class="card"><h3>Ses</h3><div id="models-audio"></div></div>
  </div>

  <!-- ============ SERVERS ============ -->
  <div class="page" id="page-servers">
    <h2>Servers</h2>
    <div class="soon"><h2>Sunucu Yonetimi</h2><p>OpenCut MCP ve diger dis sunucu baglantilari sonraki sprintte. Su an yalnizca yerel HMX servisleri aktif.</p></div>
  </div>

  <!-- ============ PIPELINE ============ -->
  <div class="page" id="page-pipeline">
    <h2>Batch Pipeline</h2>
    <div class="soon"><h2>Pipeline Engine</h2><p>15-100 promptluk kuyruk motoru sonraki sprintte tasarlanacak (spec Bolum 7). Altyapi arayuzleri hazir, motor henuz yazilmadi.</p></div>
  </div>

  <!-- ============ LOGS ============ -->
  <div class="page" id="page-logs">
    <h2>Logs</h2>
    <div class="card"><table><thead><tr><th>Oturum</th><th>Adim</th><th>Hata</th><th>Son Aktivite</th></tr></thead><tbody id="logs-body"></tbody></table></div>
  </div>

  <!-- ============ SETTINGS ============ -->
  <div class="page" id="page-settings">
    <h2>Ayarlar</h2>
    <div class="card"><h3>Sistem</h3><div id="settings-body" class="muted">Yukleniyor...</div></div>
    <div class="card"><h3>Yapilandirma</h3>
      <p class="muted">Ayarlar proje klasorundeki <b>.env</b> dosyasindan okunur. Degisiklikten sonra paneli yeniden baslat.</p>
    </div>
  </div>
</main>
<script>
const api = (u, o) => fetch(u, o).then(r => r.json());
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

/* ---------- navigasyon ---------- */
document.querySelectorAll(".nav-btn").forEach(b => b.onclick = () => {
  document.querySelectorAll(".nav-btn").forEach(x => x.classList.remove("active"));
  document.querySelectorAll(".page").forEach(x => x.classList.remove("active"));
  b.classList.add("active");
  document.getElementById("page-" + b.dataset.page).classList.add("active");
  loadPage(b.dataset.page);
});
document.querySelectorAll(".tab-btn").forEach(b => b.onclick = () => {
  document.querySelectorAll(".tab-btn").forEach(x => x.classList.remove("active"));
  document.querySelectorAll(".tabpane").forEach(x => x.classList.remove("active"));
  b.classList.add("active");
  document.getElementById("tab-" + b.dataset.tab).classList.add("active");
  if (b.dataset.tab === "acc") loadAccounts();
  if (b.dataset.tab === "route") loadRouting();
  if (b.dataset.tab === "act") loadActivity();
});

function loadPage(p) {
  if (p === "providers") loadProviders();
  if (p === "models") loadModels();
  if (p === "sessions" || p === "logs") loadSessions(p);
  if (p === "settings") loadSettings();
  if (p === "chat") { loadChatSessions(); initSelectors(); }
}

/* ---------- saglik ---------- */
api("/api/health").then(h => {
  document.getElementById("health-status").textContent = "Sistem Aktif · " + h.llm.model;
  document.getElementById("sys-status").textContent = h.ffmpeg ? "Cevrimici (FFmpeg OK)" : "FFmpeg eksik!";
});

/* ---------- coklu model seciciler ---------- */
const multiState = { image: [], video: [], audio: [] };
let modelsCache = null;
function initSelectors() {
  if (modelsCache) return;
  api("/api/models").then(m => {
    modelsCache = m;
    const llmSel = document.getElementById("sel-llm");
    llmSel.innerHTML = m.llm.map(x => "<option>" + esc(x.id) + "</option>").join("");
    ["image", "video", "audio"].forEach(kind => {
      const box = document.getElementById("ms-" + kind);
      const drop = box.querySelector(".drop");
      drop.innerHTML = m[kind].map(x =>
        "<div data-id='" + esc(x.id) + "' onclick=toggleMulti('" + kind + "','" + esc(x.id) + "')>" + esc(x.id) + " <span class='muted'>(" + x.authMode + ")</span></div>"
      ).join("") || "<div class='muted' style='padding:8px'>Tanimli saglayici yok</div>";
    });
  });
}
function toggleMulti(kind, id) {
  const arr = multiState[kind];
  const i = arr.indexOf(id);
  i >= 0 ? arr.splice(i, 1) : arr.push(id);
  renderBadges(kind);
}
function renderBadges(kind) {
  const box = document.getElementById("ms-" + kind);
  const badges = box.querySelector("[data-badges]");
  badges.innerHTML = multiState[kind].map(id =>
    "<span class='mbadge' onclick=\\"toggleMulti('" + kind + "','" + id + "')\\">" + esc(id) + " &#10005;</span>"
  ).join("");
  box.querySelectorAll(".drop div[data-id]").forEach(d => d.classList.toggle("sel", multiState[kind].includes(d.dataset.id)));
}

/* ---------- chat ---------- */
function loadChatSessions() {
  api("/api/sessions").then(rows => {
    document.getElementById("sess-count").textContent = rows.length;
    document.getElementById("chat-sessions").innerHTML = rows.map(s =>
      "<div class='sess-item'><b>" + esc(s.title) + "</b><span>" + s.id + " · " + s.steps + " adim" + (s.errors ? " · " + s.errors + " hata" : "") + "</span></div>"
    ).join("") || "<span class='muted'>Henuz oturum yok</span>";
  });
}

async function sendChat() {
  const input = document.getElementById("chatinput");
  const log = document.getElementById("chatlog");
  const text = input.value.trim();
  if (!text) return;
  log.innerHTML += "<div class='msg user'><div class='who'>Siz</div>" + esc(text) + "</div>";
  input.value = "";

  // 1) yonlendirme onizleme (prompt parse)
  const route = await api("/api/route-preview", { method: "POST", headers: {"content-type":"application/json"},
    body: JSON.stringify({ prompt: text, uiSelection: multiState }) });
  const pv = document.getElementById("route-preview");
  const parts = Object.entries(route.effective).map(([k, v]) => k + " -> " + v.join(", "));
  pv.style.display = "block";
  pv.innerHTML = "Yonlendirme: " + (parts.join(" | ") || "varsayilan") +
    (route.unknown.length ? "<br><span style='color:var(--err)'>Taninmayan modeller: " + route.unknown.map(u => u.name).join(", ") + " (atlandi)</span>" : "");

  // 2) agent plan-onay dongusu
  log.innerHTML += "<div class='msg agent'><div class='who'>HMX Agent</div>Planlaniyor...</div>";
  log.scrollTop = log.scrollHeight;
  const d = await api("/api/chat", { method: "POST", headers: {"content-type":"application/json"}, body: JSON.stringify({ message: route.cleanPrompt }) });
  log.lastElementChild.remove();
  if (!d.ok) { log.innerHTML += "<div class='msg agent'><div class='who'>Hata</div>" + esc(d.error) + "</div>"; return; }
  const steps = d.plan.split("\\n").filter(l => l.trim()).slice(0, 8).map((l, i) =>
    "<div class='step'><div class='n'>" + (i + 1) + "</div><div>" + esc(l) + "</div></div>").join("");
  log.innerHTML += "<div class='msg agent'><div class='who'>HMX Agent · " + d.sessionId + "</div><b>Hedef:</b> " + esc(d.goal) +
    "<div class='steps'>" + steps + "</div><div class='muted' style='margin-top:6px'>Plan hazir. Uretim icin Medya bolumunu veya CLI'yi kullan: hmx generate ...</div></div>";
  log.scrollTop = log.scrollHeight;
  loadChatSessions();
}

/* ---------- providers ---------- */
function loadProviders() {
  api("/api/providers").then(rows => {
    document.getElementById("prov-count").textContent = rows.length;
    document.getElementById("prov-grid").innerHTML = rows.map(p =>
      "<div class='prov-card'><div class='ic'>" + esc(p.id[0].toUpperCase()) + "</div><b>" + esc(p.id) + "</b>" +
      "<div class='kind'>" + p.kind + " · " + p.authMode + "</div>" +
      "<div style='margin:8px 0'><span class='pill " + (p.circuitOpen ? "err" : "ok") + "'>" + (p.circuitOpen ? "Error (devre disi)" : "Configured") + "</span></div>" +
      "<div class='row'><button class='btn ghost' style='padding:5px 10px;font-size:11px' onclick=\\"testProvider('" + p.id + "',this)\\">Baglanti Testi</button>" +
      "<button class='btn danger' style='padding:5px 10px;font-size:11px' onclick=\\"delProvider('" + p.id + "')\\">Sil</button></div></div>"
    ).join("");
  });
}
async function testProvider(id, btn) {
  btn.disabled = true; btn.textContent = "Test ediliyor...";
  const d = await api("/api/providers/" + id + "/test", { method: "POST" });
  btn.textContent = d.ok ? "Connected" : "Error";
  btn.disabled = false;
}
async function addProvider() {
  const v = id => document.getElementById(id).value;
  const d = await api("/api/providers", { method: "POST", headers: {"content-type":"application/json"}, body: JSON.stringify({
    id: v("p-id"), kind: v("p-kind"), authMode: "browser-session", baseUrl: v("p-url"),
    loginCheck: { failUrlContains: v("p-fail") },
    selectors: { promptInput: v("p-prompt"), generateButton: v("p-gen"), resultItem: v("p-result"), downloadButton: v("p-dl") },
    timeouts: { generateMs: 300000 },
  })});
  if (d.ok) loadProviders(); else alert(d.error);
}
async function delProvider(id) {
  if (!confirm(id + " silinsin mi?")) return;
  await fetch("/api/providers/" + id, { method: "DELETE" });
  loadProviders();
}

/* ---------- accounts / routing / activity ---------- */
function loadAccounts() {
  api("/api/accounts").then(rows => {
    document.getElementById("acc-body").innerHTML = rows.map(a =>
      "<tr><td>" + esc(a.id) + "</td><td>" + esc(a.provider) + "</td><td>" + esc(a.profile) + "</td><td>" + esc(a.mode) + "</td><td><span class='pill ok'>" + a.status + "</span></td></tr>"
    ).join("") || "<tr><td colspan=5 class='muted'>Henuz hesap yok. hmx login ile ekle.</td></tr>";
  });
}
function loadRouting() {
  api("/api/routing").then(r => {
    document.getElementById("routing-body").innerHTML =
      "<p><b>Politika:</b> " + esc(r.policy) + "</p><br>" +
      Object.entries(r.order).map(([k, v]) => "<p><b>" + k + ":</b> " + v.map((x, i) => (i + 1) + ". " + esc(x)).join(" &rarr; ") + "</p>").join("") +
      "<br><p>Not: Kullanici promptta @kind:model belirtirse bu sira ezilir. Degistirmek icin .env: HMX_ORDER_VIDEO vb.</p>";
  });
}
function loadActivity() {
  api("/api/sessions").then(rows => {
    document.getElementById("activity-body").innerHTML = rows.slice(0, 10).map(s =>
      "<p>&#9679; <b>" + esc(s.title.slice(0, 60)) + "</b> · " + s.steps + " adim" + (s.errors ? " · <span style='color:var(--err)'>" + s.errors + " hata</span>" : "") + " · " + esc(String(s.lastTs ?? "").slice(0, 19).replace("T", " ")) + "</p>"
    ).join("") || "Aktivite yok.";
  });
}

/* ---------- sessions / logs ---------- */
function loadSessions(target) {
  api("/api/sessions").then(rows => {
    const html = rows.map(s =>
      "<tr style='cursor:pointer' onclick=\\"showSession('" + s.id + "')\\"><td>" + esc(s.id) + "</td><td>" + esc(s.title.slice(0, 50)) + "</td><td>" + s.steps + "</td><td>" +
      (s.errors ? "<span class='pill err'>" + s.errors + "</span>" : "<span class='pill ok'>0</span>") + "</td><td class='muted'>" + esc(String(s.lastTs ?? "").slice(0, 19).replace("T", " ")) + "</td></tr>"
    ).join("") || "<tr><td colspan=5 class='muted'>Kayit yok</td></tr>";
    const body = document.getElementById(target === "logs" ? "logs-body" : "sessions-body");
    if (body) body.innerHTML = html;
  });
}
async function showSession(id) {
  const evs = await api("/api/sessions/" + id);
  document.getElementById("session-detail").textContent = evs.map(e =>
    "[" + String(e.ts).slice(11, 19) + "] " + e.type.toUpperCase().padEnd(8) + " " + e.summary).join("\\n\\n");
  document.querySelector('[data-page="sessions"]').click();
}

/* ---------- models / settings ---------- */
function loadModels() {
  api("/api/models").then(m => {
    for (const k of ["llm", "image", "video", "audio"]) {
      document.getElementById("models-" + k).innerHTML = m[k].length
        ? m[k].map(x => "<span class='mbadge' style='cursor:default'>" + esc(x.id) + "</span>").join(" ")
        : "<span class='muted'>Tanimli yok</span>";
    }
  });
}
function loadSettings() {
  api("/api/health").then(h => {
    document.getElementById("settings-body").innerHTML =
      "<p><b>Veri dizini:</b> " + esc(h.home) + "</p><p><b>LLM:</b> " + esc(h.llm.baseUrl) + " · " + esc(h.llm.model) + "</p><p><b>FFmpeg:</b> " + (h.ffmpeg ? "OK" : "EKSIK") + "</p><p><b>Surum:</b> " + h.version + "</p>";
  });
}

/* ---------- baslangic ---------- */
initSelectors();
loadChatSessions();
loadProviders();
</script>
</body>
</html>`;
