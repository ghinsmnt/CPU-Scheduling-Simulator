// ===== TAMPILAN & INPUT =====
const COLORS = ["#0f766e", "#c2410c", "#4f46e5", "#b45309", "#be185d", "#15803d", "#7c3aed", "#0369a1"];
const $ = s => document.querySelector(s);
const CONTOH = [["P1", 0, 6, 3], ["P2", 0, 8, 1], ["P3", 0, 7, 4], ["P4", 0, 3, 2]];

function tambahBaris(nama, arrival, burst, prioritas) {
  const no = $("#inp tbody").children.length + 1;
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td><input type="text" value="${nama || "P" + no}"></td>
    <td><input type="number" min="0" value="${arrival ?? 0}"></td>
    <td><input type="number" min="1" value="${burst ?? 1}"></td>
    <td class="colp"><input type="number" min="0" value="${prioritas ?? 1}"></td>
    <td><button type="button" aria-label="Hapus proses">Hapus</button></td>`;
  tr.querySelector("button").onclick = () => tr.remove();
  $("#inp tbody").appendChild(tr);
  aturKolomPrioritas();
}

function muatContoh() {
  $("#inp tbody").innerHTML = "";
  CONTOH.forEach(r => tambahBaris(...r));
}

// Baca dan validasi tabel input
function bacaProses() {
  const rows = [...$("#inp tbody").children];
  if (!rows.length) throw "Tambahkan minimal satu proses.";
  const pakaiPrioritas = $("#algo").value === "pri";
  const dipakai = new Set();

  return rows.map((tr, i) => {
    const v = [...tr.querySelectorAll("input")].map(x => x.value.trim());
    const p = { id: v[0] || "P" + (i + 1), at: +v[1], bt: +v[2], pr: +v[3], i };

    if (dipakai.has(p.id)) throw `Nama proses "${p.id}" dipakai dua kali. Gunakan nama yang berbeda.`;
    dipakai.add(p.id);

    if (v[1] === "" || !Number.isFinite(p.at) || p.at < 0) throw `Arrival ${p.id} harus angka >= 0.`;
    if (v[2] === "" || !Number.isFinite(p.bt) || p.bt <= 0) throw `Burst ${p.id} harus angka > 0.`;
    if (pakaiPrioritas && (v[3] === "" || !Number.isFinite(p.pr))) throw `Prioritas ${p.id} harus diisi angka.`;
    return p;
  });
}

function tampilkan() {
  const msg = $("#msg");
  msg.textContent = "";
  let procs;
  try { procs = bacaProses(); } catch (e) { msg.textContent = e; return; }

  const algo = $("#algo").value;
  const preemptive = $("#mode").value === "p";
  const { segs, procs: R } = schedule(procs, algo, preemptive);

  // --- Gantt Chart ---
  const total = segs[segs.length - 1].e - segs[0].s;
  const g = $("#gantt");
  g.innerHTML = "";
  segs.forEach((sg, n) => {
    const d = document.createElement("div");
    const idle = sg.k === null;
    d.className = "blk" + (idle ? " idle" : "");
    d.style.flex = (sg.e - sg.s) + " 0 0";
    if (!idle) d.style.background = COLORS[sg.k % COLORS.length];
    d.textContent = idle ? "idle" : sg.id;
    d.innerHTML += `<span class="t">${sg.s}</span>`;
    if (n === segs.length - 1) d.innerHTML += `<span class="t te">${sg.e}</span>`;
    g.appendChild(d);
  });
  g.style.minWidth = Math.max(total * 28, 300) + "px";

  // --- Tabel hasil ---
  const tb = $("#res tbody");
  tb.innerHTML = "";
  R.forEach(p => {
    tb.innerHTML += `<tr><td>${p.id}</td><td>${p.at}</td><td>${p.bt}</td>
      <td class="colp">${p.pr}</td><td>${p.ct}</td><td>${p.tat}</td><td>${p.wt}</td></tr>`;
  });
  $("#awt").textContent = rata(R, "wt").toFixed(2);
  $("#atat").textContent = rata(R, "tat").toFixed(2);

  $("#out").classList.remove("hide");
  aturKolomPrioritas();
}

// Kolom prioritas hanya tampil untuk algoritma Priority
function aturKolomPrioritas() {
  const pri = $("#algo").value === "pri";
  document.querySelectorAll(".colp").forEach(e => e.classList.toggle("hide", !pri));
}

function aturPetunjuk() {
  aturKolomPrioritas();
  $("#hint").textContent = $("#algo").value === "sjf"
    ? "SJF: proses dengan burst time terkecil dijalankan lebih dulu. Mode preemptive (SRTF) memakai sisa waktu terkecil."
    : "Priority: angka prioritas lebih kecil berarti prioritas lebih tinggi. Mode preemptive mengganti proses yang berjalan jika datang proses berprioritas lebih tinggi.";
}

$("#algo").onchange = aturPetunjuk;
$("#add").onclick = () => tambahBaris();
$("#ex").onclick = muatContoh;
$("#hitung").onclick = tampilkan;
muatContoh();
aturPetunjuk();
