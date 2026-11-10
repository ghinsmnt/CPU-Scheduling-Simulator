// ===== LOGIKA PENJADWALAN (tanpa urusan tampilan) =====
// Dipakai oleh app.js. Bisa juga dites di Node: node -e "..."
//
// procs     : [{id, at, bt, pr, i}]  (at = arrival, bt = burst, pr = prioritas, i = urutan input)
// algo      : "sjf" atau "pri"
// preemptive: true / false
// return    : { segs, procs }
//   segs  : blok Gantt Chart [{k, id, s, e}]  (k = nomor proses, null = CPU idle)
//   procs : proses lengkap dengan ct (completion), tat (turnaround), wt (waiting)

function schedule(procs, algo, preemptive) {
  const P = procs.map(p => ({ ...p, rem: p.bt, ct: 0 }));
  const segs = [];
  let t = 0;      // waktu sekarang
  let done = 0;   // jumlah proses yang sudah selesai

  // Kunci pemilihan: makin kecil makin diutamakan
  const key = p => (algo === "sjf" ? (preemptive ? p.rem : p.bt) : p.pr);

  // Tambah blok Gantt; gabung dengan blok sebelumnya jika proses sama dan menyambung
  const push = (k, id, s, e) => {
    const last = segs[segs.length - 1];
    if (last && last.k === k && last.e === s) last.e = e;
    else segs.push({ k, id, s, e });
  };

  while (done < P.length) {
    // 1. Proses yang sudah datang dan belum selesai
    const ready = P.filter(p => p.rem > 0 && p.at <= t);

    // 2. Tidak ada yang siap -> CPU idle sampai kedatangan berikutnya
    if (ready.length === 0) {
      const next = Math.min(...P.filter(p => p.rem > 0).map(p => p.at));
      push(null, null, t, next);
      t = next;
      continue;
    }

    // 3. Pilih yang terbaik (seri -> yang datang lebih dulu -> urutan input)
    ready.sort((a, b) => key(a) - key(b) || a.at - b.at || a.i - b.i);
    const c = ready[0];

    // 4. Berapa lama berjalan sebelum dipilih ulang?
    let run = c.rem;
    if (preemptive) {
      // berhenti saat ada proses baru datang
      const arrivals = P.filter(p => p.rem > 0 && p.at > t).map(p => p.at - t);
      if (arrivals.length) run = Math.min(run, Math.min(...arrivals));
    }

    push(c.i, c.id, t, t + run);
    t += run;
    c.rem -= run;
    if (c.rem === 0) { c.ct = t; done++; }
  }

  // 5. Hitung TAT dan WT
  P.forEach(p => {
    p.tat = p.ct - p.at;   // Turnaround = Completion - Arrival
    p.wt = p.tat - p.bt;   // Waiting    = Turnaround - Burst
  });
  return { segs, procs: P };
}

function rata(procs, field) {
  return procs.reduce((sum, p) => sum + p[field], 0) / procs.length;
}

if (typeof module !== "undefined") module.exports = { schedule, rata };
