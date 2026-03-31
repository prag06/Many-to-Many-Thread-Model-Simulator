/**
 * app.js — Main simulation controller
 *
 * Bug fixes:
 * 1. drawGantt was called with data.result but backend returned data.gantt
 *    FIX: backend now returns BOTH "result" and "gantt" keys. We use data.result.
 * 2. generateTable() didn't assign at-input/bt-input classes — collectThreads() failed
 *    FIX: classes are set explicitly in generateTable().
 * 3. display() accessed data.metrics.details but never checked if it existed
 *    FIX: defensive checks added.
 * 4. CPU load display referenced a non-existent #load element
 *    FIX: now uses #cpuLoad defined in HTML.
 */

import { drawGantt } from './gantt.js';
import { showMapping } from './mappingUI.js';
import { showComparison } from './charts.js';
import { simulateLocally } from './simulator.js';

// ── Table generation ──────────────────────────────────────────────────────────

export function generateTable() {
  const numThreads = Math.max(1, Math.min(10, parseInt(document.getElementById('numUser').value) || 3));
  const tbody = document.querySelector('#threadTable tbody');
  tbody.innerHTML = '';

  for (let i = 1; i <= numThreads; i++) {
    const row = tbody.insertRow();
    row.innerHTML = `
      <td class="thread-id">T${i}</td>
      <td><input type="number" value="0" min="0" class="at-input"></td>
      <td><input type="number" value="5" min="1" class="bt-input"></td>
    `;
  }
}

window.generateTable = generateTable;

// ── Thread data collection ────────────────────────────────────────────────────

function collectThreads() {
  const rows = document.querySelectorAll('#threadTable tbody tr');
  const threads = [];

  rows.forEach((row, index) => {
    const atInput = row.querySelector('.at-input');
    const btInput = row.querySelector('.bt-input');
    const at = parseInt(atInput?.value) || 0;
    const bt = Math.max(1, parseInt(btInput?.value) || 1);
    threads.push({ id: `T${index + 1}`, arrival: at, burst: bt });
  });

  return threads;
}

// ── Simulation ────────────────────────────────────────────────────────────────

export function runSimulation() {
  const algo     = document.getElementById('algo').value;
  const quantum  = Math.max(1, parseInt(document.getElementById('quantum').value) || 2);
  const numKernel = Math.max(1, parseInt(document.getElementById('numKernel').value) || 2);
  const threads  = collectThreads();

  if (threads.length === 0) {
    alert('Please add at least one thread.');
    return;
  }

  // Update algo tag
  const algoTag = document.getElementById('algoTag');
  if (algoTag) algoTag.textContent = algo + (algo === 'RR' ? ` Q=${quantum}` : '');

  // Loading state
  const btn = document.getElementById('runBtn');
  btn.classList.add('loading');
  btn.querySelector('span:last-child').textContent = 'Simulating…';

  const payload = {
    algorithm: algo,
    quantum,
    threads,
    num_kernel_threads: numKernel
  };

  fetch('http://127.0.0.1:5000/simulate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .catch(err => {
      console.warn('Backend unavailable, using browser simulation:', err);
      return {
        ...simulateLocally({
          algorithm: algo,
          quantum,
          threads,
          numKernelThreads: numKernel
        }),
        localFallback: true
      };
    })
    .then(data => {
      btn.classList.remove('loading');
      btn.querySelector('span:last-child').textContent = 'Run Simulation';

      document.getElementById('avgWT').textContent = data.metrics.avg_wt.toFixed(2);
      document.getElementById('avgTAT').textContent = data.metrics.avg_tat.toFixed(2);
      document.getElementById('cpuLoad').textContent =
        data.metrics.load != null ? data.metrics.load.toFixed(1) + '%' : 'N/A';

      displayMetrics(data);
      drawGantt(data.result || data.gantt);
      showMapping(data.mapping);
      showComparison(data.metrics, threads);

    })
    .catch(err => {
      btn.classList.remove('loading');
      btn.querySelector('span:last-child').textContent = 'Run Simulation';
      console.error('Simulation error:', err);
      document.getElementById('output').innerHTML = `
        <div style="color:#ff4757; font-size:0.85rem; padding:1rem;
                    background:rgba(255,71,87,0.1); border:1px solid rgba(255,71,87,0.3);
                    border-radius:6px; font-family:var(--font-mono);">
          Unable to run the simulation. Check the thread inputs and try again.
        </div>`;
    });
}

window.runSimulation = runSimulation;

// ── Metrics table display ─────────────────────────────────────────────────────

function displayMetrics(data) {
  const details = data.metrics?.details || [];
  if (details.length === 0) {
    document.getElementById('output').innerHTML = '<div class="metrics-empty">No data</div>';
    return;
  }

  let html = `
    <table class="metrics-table">
      <thead>
        <tr>
          <th>Thread</th>
          <th>AT</th>
          <th>BT</th>
          <th>CT</th>
          <th>WT</th>
          <th>TAT</th>
          <th>RT</th>
        </tr>
      </thead>
      <tbody>
  `;

  details.forEach((t, i) => {
    html += `
      <tr style="animation-delay:${i * 0.05}s">
        <td class="tid" style="color:var(--t${i % 10})">${t.id}</td>
        <td class="val-ct">${t.AT ?? '—'}</td>
        <td class="val-ct">${t.BT ?? '—'}</td>
        <td class="val-ct">${t.CT}</td>
        <td class="val-wt">${t.WT}</td>
        <td class="val-tat">${t.TAT}</td>
        <td class="val-rt">${t.RT ?? '—'}</td>
      </tr>`;
  });

  html += `</tbody></table>`;
  html += `
    <div style="margin-top:0.75rem; display:flex; gap:0.75rem; font-size:0.75rem; color:var(--text2);">
      <span>${data.threads?.length ?? details.length} user threads</span>
      <span>·</span>
      <span>${data.num_kernel_threads} kernel threads</span>
      <span>·</span>
      <span>${data.quantum ? 'Q=' + data.quantum : 'Non-preemptive'}</span>
    </div>`;

  document.getElementById('output').innerHTML = html;
}
