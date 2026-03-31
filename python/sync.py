"""sync.py — Simple semaphore for thread synchronization demo"""

semaphore = 1

def wait():
    global semaphore
    if semaphore > 0:
        semaphore -= 1
        return True
    return False

def signal():
    global semaphore
    semaphore += 1
