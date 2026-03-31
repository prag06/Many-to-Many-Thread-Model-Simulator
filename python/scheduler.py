"""
scheduler.py — Fixed scheduling algorithms

Bugs fixed:
1. RR: thread_details was only storing the last gantt slice as start/completion.
   Fixed by tracking first_start and always using the final time as completion.
2. SJF: heap used (burst, id, thread) — string IDs like "T10" break numeric sort.
   Fixed by using enumerate index as tie-breaker.
3. RR: when thread preempted, new arrivals must be added BEFORE re-queuing the
   preempted thread (to match standard RR semantics).
"""

def fcfs(threads):
    """First Come First Served — sort by arrival, no preemption."""
    sorted_threads = sorted(threads, key=lambda x: (x["arrival"], x["id"]))
    time = 0
    gantt = []
    thread_details = []

    for t in sorted_threads:
        start = max(time, t["arrival"])
        end = start + t["burst"]
        gantt.append({"id": t["id"], "start": start, "end": end})
        thread_details.append({
            **t,
            "start": start,
            "completion": end
        })
        time = end

    return {"gantt": gantt, "threads": thread_details}


def sjf(threads):
    """
    Non-preemptive SJF (Shortest Job First) with correct arrival handling.
    Uses a min-heap on (burst, index) — index prevents string-ID comparison errors.
    """
    from heapq import heappush, heappop

    time = 0
    gantt = []
    thread_details = []
    completed = set()
    ready_queue = []
    remaining = list(threads)  # copy

    while len(completed) < len(threads):
        # Push all threads that have arrived and aren't done
        for idx, t in enumerate(threads):
            if t["arrival"] <= time and t["id"] not in completed:
                # Check not already in heap
                in_heap = any(item[2]["id"] == t["id"] for item in ready_queue)
                if not in_heap:
                    heappush(ready_queue, (t["burst"], idx, t))

        if ready_queue:
            _, _, t = heappop(ready_queue)
            if t["id"] in completed:
                continue
            start = max(time, t["arrival"])
            end = start + t["burst"]
            gantt.append({"id": t["id"], "start": start, "end": end})
            thread_details.append({**t, "start": start, "completion": end})
            time = end
            completed.add(t["id"])
        else:
            # CPU idle — jump to next arrival
            future = [t["arrival"] for t in threads if t["id"] not in completed]
            if future:
                time = min(future)

    return {"gantt": gantt, "threads": thread_details}


def round_robin(threads, quantum=2):
    """
    Round Robin with correct arrival tracking.

    Bugs fixed:
    - thread_details now stores first_start (when thread first got CPU) and
      final completion time — not the last gantt slice's start.
    - New arrivals are enqueued AFTER the current slice executes but BEFORE
      re-queuing the preempted thread, matching standard RR.
    """
    from collections import deque

    time = 0
    queue = deque()
    gantt = []
    thread_details = []

    remaining = {t["id"]: t["burst"] for t in threads}
    first_start = {}   # FIX: track when thread first ran
    completed = set()

    arrived_sorted = sorted(threads, key=lambda x: x["arrival"])
    thread_map = {t["id"]: t for t in threads}

    i = 0  # pointer into arrived_sorted

    # Seed queue with threads arriving at time 0
    while i < len(arrived_sorted) and arrived_sorted[i]["arrival"] <= time:
        queue.append(arrived_sorted[i])
        i += 1

    while len(completed) < len(threads):
        if not queue:
            # CPU idle — advance to next arrival
            if i < len(arrived_sorted):
                time = arrived_sorted[i]["arrival"]
                while i < len(arrived_sorted) and arrived_sorted[i]["arrival"] <= time:
                    queue.append(arrived_sorted[i])
                    i += 1
            continue

        t = queue.popleft()
        tid = t["id"]

        if tid in completed:
            continue

        exec_time = min(quantum, remaining[tid])
        start = time

        # Record first start time
        if tid not in first_start:
            first_start[tid] = start

        time += exec_time
        remaining[tid] -= exec_time

        gantt.append({"id": tid, "start": start, "end": time})

        # Enqueue newly arrived threads BEFORE re-queuing preempted thread
        while i < len(arrived_sorted) and arrived_sorted[i]["arrival"] <= time:
            queue.append(arrived_sorted[i])
            i += 1

        if remaining[tid] == 0:
            # FIX: use first_start and current time as completion
            thread_details.append({
                **t,
                "start": first_start[tid],
                "completion": time
            })
            completed.add(tid)
        else:
            queue.append(t)  # re-queue after new arrivals

    return {"gantt": gantt, "threads": thread_details}
