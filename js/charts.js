/**
 * charts.js — Performance visualization
 *
 * Fixes:
 * 1. Old version only showed two plain <p> tags — no real charts
 * 2. Now renders proportional bar charts for WT, TAT, and CPU utilization
 * 3. Bars animate in with CSS transitions
 */

export function showComparison(metrics, threads) {
  const container = document.getElementById('charts');
  container.innerHTML = '';

  if (!metrics || !metrics.details || metrics.details.length === 0) {
    container.innerHTML = '<div class="chart-empty">No data</div>';
    return;
  }

  const details = metrics.details;
  const maxWT  = Math.max(...details.map(t => t.WT),  0.1);
  const maxTAT = Math.max(...details.map(t => t.TAT), 0.1);

  // ── Waiting Time Chart ──────────────────────────────────────────
  container.appendChild(buildBarChart(
    'Waiting Time (WT)',
    details.map((t, i) => ({
      label: t.id,
      value: t.WT,
      max: maxWT,
      color: '#ff9500',
      cls: 'wt-bar',
      delay: i * 0.05
    }))
  ));

  // ── Turnaround Time Chart ───────────────────────────────────────
  container.appendChild(buildBarChart(
    'Turnaround Time (TAT)',
    details.map((t, i) => ({
      label: t.id,
      value: t.TAT,
      max: maxTAT,
      color: '#00ff88',
      cls: 'tat-bar',
      delay: i * 0.05
    }))
  ));

  // ── CPU Utilization ─────────────────────────────────────────────
  if (metrics.load != null) {
    const util = document.createElement('div');
    util.className = 'chart-container';
    util.innerHTML = `
      <div class="chart-title">CPU Utilization</div>
      <div class="bar-row" style="animation-delay:0.1s">
        <span class="bar-label" style="min-width:4rem">Load</span>
        <div class="bar-track">
          <div class="bar-fill util-bar" 
               style="width:0%" 
               data-target="${metrics.load}"
               data-val="${metrics.load.toFixed(1)}%">
          </div>
        </div>
        <span class="bar-val">${metrics.load.toFixed(1)}%</span>
      </div>
    `;
    container.appendChild(util);
  }

  // Animate bar widths after DOM insertion
  requestAnimationFrame(() => {
    container.querySelectorAll('.bar-fill').forEach(bar => {
      const pct = parseFloat(bar.dataset.target);
      const max = parseFloat(bar.dataset.max || 100);
      const width = bar.dataset.max
        ? Math.min(100, (pct / max) * 100)
        : Math.min(100, pct);
      setTimeout(() => { bar.style.width = width + '%'; }, 50);
    });
  });
}

function buildBarChart(title, rows) {
  const wrap = document.createElement('div');
  wrap.className = 'chart-container';

  let html = `<div class="chart-title">${title}</div><div class="bar-chart">`;

  rows.forEach(r => {
    const pct = Math.min(100, (r.value / r.max) * 100);
    html += `
      <div class="bar-row" style="animation-delay:${r.delay}s; animation:fadeIn 0.4s ease ${r.delay}s forwards; opacity:0;">
        <span class="bar-label">${r.label}</span>
        <div class="bar-track">
          <div class="bar-fill ${r.cls}" 
               style="width:0%" 
               data-target="${pct}" 
               data-max="100"
               data-val="${r.value}">
          </div>
        </div>
        <span class="bar-val">${r.value}</span>
      </div>`;
  });

  html += `</div>`;
  wrap.innerHTML = html;
  return wrap;
}
