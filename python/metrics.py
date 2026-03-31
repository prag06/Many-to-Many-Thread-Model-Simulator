"""
metrics.py — Fixed metrics calculation

Bugs fixed:
1. Missing "load" (CPU utilization) field — caused frontend crash on data.metrics.load
2. Added Response Time (RT) = start - arrival for completeness
"""

def calculate_metrics(threads):
    """
    Calculate scheduling metrics for all threads.

    Returns:
        details: per-thread CT, WT, TAT, RT
        avg_wt, avg_tat: averages
        load: CPU utilization % = (total burst / makespan) * 100
    """
    if not threads:
        return {
            "details": [],
            "avg_wt": 0,
            "avg_tat": 0,
            "load": 0
        }

    metrics = []
    total_wt = 0
    total_tat = 0
    total_burst = sum(t["burst"] for t in threads)

    # Makespan = max completion - min arrival
    max_ct = max(t["completion"] for t in threads)
    min_at = min(t["arrival"] for t in threads)
    makespan = max_ct - min_at if max_ct > min_at else 1

    # FIX: CPU utilization = total burst time / makespan
    load = round((total_burst / makespan) * 100, 2)

    for t in threads:
        tid = t["id"]
        ct = t["completion"]
        at = t["arrival"]
        bt = t["burst"]
        st = t.get("start", at)  # start time (first execution)

        tat = ct - at          # Turnaround Time
        wt = tat - bt          # Waiting Time
        rt = st - at           # Response Time

        # Clamp negatives (shouldn't happen but guard anyway)
        wt = max(0, wt)
        rt = max(0, rt)

        total_wt += wt
        total_tat += tat

        metrics.append({
            "id": tid,
            "AT": at,
            "BT": bt,
            "CT": ct,
            "TAT": round(tat, 2),
            "WT": round(wt, 2),
            "RT": round(rt, 2)
        })

    n = len(metrics)
    return {
        "details": metrics,
        "avg_wt": round(total_wt / n, 2),
        "avg_tat": round(total_tat / n, 2),
        "load": load  # FIX: was missing entirely
    }
