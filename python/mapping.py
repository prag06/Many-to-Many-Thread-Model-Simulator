"""
mapping.py — Many-to-Many thread mapping

Maps user threads → kernel threads → CPUs using deterministic round-robin.
"""

def map_threads(threads, kernel_threads=2):
    """
    Deterministic Many-to-Many mapping:
      - Multiple user threads can share a kernel thread
      - Kernel threads are assigned to CPUs round-robin

    Args:
        threads: list of thread dicts with "id"
        kernel_threads: number of kernel threads (KTs)

    Returns:
        list of { thread, kernel, cpu } mappings
    """
    mapping = []
    num_cpus = max(1, kernel_threads)  # CPUs = kernel thread count

    for index, t in enumerate(threads):
        kt_id = index % kernel_threads          # which kernel thread
        cpu_id = kt_id % num_cpus               # which CPU
        mapping.append({
            "thread": t["id"],
            "kernel": f"KT-{kt_id}",
            "cpu": f"CPU-{cpu_id}"
        })
    return mapping
