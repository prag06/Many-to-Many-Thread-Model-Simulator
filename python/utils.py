def sort_by_arrival(threads):
    return sorted(threads, key=lambda x: x["arrival"])

def sort_by_burst(threads):
    return sorted(threads, key=lambda x: x["burst"])
