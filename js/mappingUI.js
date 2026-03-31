/**
 * mappingUI.js — Thread mapping visualization
 *
 * Fixes:
 * 1. Old version just showed plain text "T1 → K0 → CPU-0"
 *    Now shows styled node → arrow → node → arrow → node diagram
 * 2. Consistent with updated mapping.py which returns KT-0 format
 */

export function showMapping(mapping) {
  const container = document.getElementById('mapping');

  if (!mapping || mapping.length === 0) {
    container.innerHTML = '<div class="mapping-empty">No mapping data</div>';
    return;
  }

  const diagram = document.createElement('div');
  diagram.className = 'mapping-diagram';

  mapping.forEach((m, i) => {
    const row = document.createElement('div');
    row.className = 'mapping-row';
    row.style.animationDelay = `${i * 0.07}s`;

    row.innerHTML = `
      <div class="mapping-node node-user">${m.thread}</div>
      <span class="mapping-arrow">→</span>
      <div class="mapping-node node-kernel">${m.kernel}</div>
      <span class="mapping-arrow">→</span>
      <div class="mapping-node node-cpu">${m.cpu}</div>
    `;
    diagram.appendChild(row);
  });

  // Add legend
  const legend = document.createElement('div');
  legend.style.cssText = 'margin-top:0.75rem; display:flex; gap:0.75rem; flex-wrap:wrap;';
  legend.innerHTML = `
    <span style="font-size:0.65rem; color:#8892a4;">
      <span style="color:#00d4ff">■</span> User Thread &nbsp;
      <span style="color:#00ff88">■</span> Kernel Thread &nbsp;
      <span style="color:#ff9500">■</span> CPU
    </span>
  `;

  container.innerHTML = '';
  container.appendChild(diagram);
  container.appendChild(legend);
}
