function fcfs(threads) {
  const sortedThreads = [...threads].sort((a, b) => {
    if (a.arrival !== b.arrival) return a.arrival - b.arrival;
    return a.id.localeCompare(b.id, undefined, { numeric: true });
  });

  let time = 0;
  const gantt = [];
  const scheduledThreads = [];

  sortedThreads.forEach((thread) => {
    const start = Math.max(time, thread.arrival);
    const end = start + thread.burst;

    gantt.push({ id: thread.id, start, end });
    scheduledThreads.push({ ...thread, start, completion: end });
    time = end;
  });

  return { gantt, threads: scheduledThreads };
}

function sjf(threads) {
  let time = 0;
  const gantt = [];
  const scheduledThreads = [];
  const completed = new Set();

  while (completed.size < threads.length) {
    const readyQueue = threads
      .map((thread, index) => ({ thread, index }))
      .filter(({ thread }) => thread.arrival <= time && !completed.has(thread.id))
      .sort((a, b) => {
        if (a.thread.burst !== b.thread.burst) return a.thread.burst - b.thread.burst;
        return a.index - b.index;
      });

    if (readyQueue.length === 0) {
      const nextArrival = threads
        .filter((thread) => !completed.has(thread.id))
        .reduce((min, thread) => Math.min(min, thread.arrival), Infinity);
      time = nextArrival;
      continue;
    }

    const { thread } = readyQueue[0];
    const start = Math.max(time, thread.arrival);
    const end = start + thread.burst;

    gantt.push({ id: thread.id, start, end });
    scheduledThreads.push({ ...thread, start, completion: end });
    completed.add(thread.id);
    time = end;
  }

  return { gantt, threads: scheduledThreads };
}

function roundRobin(threads, quantum) {
  const sortedThreads = [...threads].sort((a, b) => a.arrival - b.arrival);
  const queue = [];
  const gantt = [];
  const scheduledThreads = [];
  const remaining = Object.fromEntries(threads.map((thread) => [thread.id, thread.burst]));
  const firstStart = {};
  const completed = new Set();

  let time = 0;
  let arrivalIndex = 0;

  while (arrivalIndex < sortedThreads.length && sortedThreads[arrivalIndex].arrival <= time) {
    queue.push(sortedThreads[arrivalIndex]);
    arrivalIndex += 1;
  }

  while (completed.size < threads.length) {
    if (queue.length === 0) {
      if (arrivalIndex < sortedThreads.length) {
        time = sortedThreads[arrivalIndex].arrival;
        while (arrivalIndex < sortedThreads.length && sortedThreads[arrivalIndex].arrival <= time) {
          queue.push(sortedThreads[arrivalIndex]);
          arrivalIndex += 1;
        }
      }
      continue;
    }

    const thread = queue.shift();
    const execTime = Math.min(quantum, remaining[thread.id]);
    const start = time;

    if (firstStart[thread.id] == null) {
      firstStart[thread.id] = start;
    }

    time += execTime;
    remaining[thread.id] -= execTime;
    gantt.push({ id: thread.id, start, end: time });

    while (arrivalIndex < sortedThreads.length && sortedThreads[arrivalIndex].arrival <= time) {
      queue.push(sortedThreads[arrivalIndex]);
      arrivalIndex += 1;
    }

    if (remaining[thread.id] === 0) {
      scheduledThreads.push({
        ...thread,
        start: firstStart[thread.id],
        completion: time
      });
      completed.add(thread.id);
    } else {
      queue.push(thread);
    }
  }

  return { gantt, threads: scheduledThreads };
}

function calculateMetrics(threads) {
  if (threads.length === 0) {
    return {
      details: [],
      avg_wt: 0,
      avg_tat: 0,
      load: 0
    };
  }

  const totalBurst = threads.reduce((sum, thread) => sum + thread.burst, 0);
  const maxCompletion = Math.max(...threads.map((thread) => thread.completion));
  const minArrival = Math.min(...threads.map((thread) => thread.arrival));
  const makespan = Math.max(1, maxCompletion - minArrival);
  const details = threads.map((thread) => {
    const tat = thread.completion - thread.arrival;
    const wt = Math.max(0, tat - thread.burst);
    const rt = Math.max(0, thread.start - thread.arrival);

    return {
      id: thread.id,
      AT: thread.arrival,
      BT: thread.burst,
      CT: thread.completion,
      WT: Number(wt.toFixed(2)),
      TAT: Number(tat.toFixed(2)),
      RT: Number(rt.toFixed(2))
    };
  });

  const totalWT = details.reduce((sum, thread) => sum + thread.WT, 0);
  const totalTAT = details.reduce((sum, thread) => sum + thread.TAT, 0);

  return {
    details,
    avg_wt: Number((totalWT / details.length).toFixed(2)),
    avg_tat: Number((totalTAT / details.length).toFixed(2)),
    load: Number(((totalBurst / makespan) * 100).toFixed(2))
  };
}

function mapThreads(threads, kernelThreads) {
  const count = Math.max(1, kernelThreads);

  return threads.map((thread, index) => {
    const kernelId = index % count;
    return {
      thread: thread.id,
      kernel: `KT-${kernelId}`,
      cpu: `CPU-${kernelId % count}`
    };
  });
}

export function simulateLocally({ algorithm, quantum, threads, numKernelThreads }) {
  let result;

  if (algorithm === 'SJF') {
    result = sjf(threads);
  } else if (algorithm === 'RR') {
    result = roundRobin(threads, quantum);
  } else {
    result = fcfs(threads);
  }

  return {
    result: result.gantt,
    gantt: result.gantt,
    metrics: calculateMetrics(result.threads),
    mapping: mapThreads(result.threads, numKernelThreads),
    threads,
    num_kernel_threads: numKernelThreads,
    quantum
  };
}
