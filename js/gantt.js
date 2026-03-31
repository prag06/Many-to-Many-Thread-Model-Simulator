/**
 * gantt.js — Gantt chart renderer
 *
 * Fixes:
 * 1. All blocks were same color — now each thread gets a unique color
 * 2. Width scaling was arbitrary (15px/unit) — now proportional to timeline
 * 3. Added timeline tick marks showing start/end times
 * 4. Added animation stagger for visual polish
 */

const THREAD_COLORS = [
  '#00d4ff', '#00ff88', '#ff9500', '#ff4757',
  '#bf5af2', '#ffd60a', '#ff6b9d', '#00e5cc',
  '#a78bfa', '#fb923c'
];

// Map thread IDs to consistent colors
const colorCache = {};
let colorIndex = 0;

function getThreadColor(threadId) {
  if (!colorCache[threadId]) {
    colorCache[threadId] = THREAD_COLORS[colorIndex % THREAD_COLORS.length];
    colorIndex++;
  }
  return colorCache[threadId];
}

export function drawGantt(data) {
  // Reset color cache for fresh simulation
  Object.keys(colorCache).forEach(k => delete colorCache[k]);
  colorIndex = 0;

  const container = document.getElementById('gantt');
  const timeline  = document.getElementById('ganttTimeline');
  container.innerHTML = '';
  if (timeline) timeline.innerHTML = '';

  if (!data || data.length === 0) {
    container.innerHTML = '<div class="gantt-empty">No schedule data</div>';
    return;
  }

  const totalTime = data[data.length - 1].end;
  const minTime   = data[0].start;

  // Scale: each unit = pixels, min 30px, max 80px
  const span       = totalTime - minTime || 1;
  const unitPx     = Math.max(30, Math.min(80, Math.floor(900 / span)));

  data.forEach((block, i) => {
    const color    = getThreadColor(block.id);
    const duration = block.end - block.start;
    const width    = Math.max(50, duration * unitPx);

    const div = document.createElement('div');
    div.className = 'gantt-block';
    div.style.cssText = `
      background: ${color};
      width: ${width}px;
      animation-delay: ${i * 0.06}s;
      box-shadow: 0 0 12px ${color}44;
    `;
    div.innerHTML = `
      <span class="block-id">${block.id}</span>
      <span class="block-time">${block.start}–${block.end}</span>
    `;
    div.title = `${block.id}: t=${block.start} → t=${block.end} (${duration} units)`;
    container.appendChild(div);

    // Timeline tick
    if (timeline) {
      const tick = document.createElement('div');
      tick.className = 'timeline-tick';
      tick.style.width = `${width}px`;
      tick.textContent = block.start;
      timeline.appendChild(tick);

      // Add final end time after last block
      if (i === data.length - 1) {
        const endTick = document.createElement('div');
        endTick.className = 'timeline-tick';
        endTick.style.width = '30px';
        endTick.style.borderTop = '1px solid #4a5568';
        endTick.textContent = block.end;
        timeline.appendChild(endTick);
      }
    }
  });
}
