from flask import Flask, request, jsonify
from flask_cors import CORS
from scheduler import fcfs, sjf, round_robin
from metrics import calculate_metrics
from mapping import map_threads

app = Flask(__name__)
CORS(app)

@app.route('/simulate', methods=['POST'])
def simulate():
    data = request.json
    algo = data.get("algorithm", "FCFS")
    quantum = int(data.get("quantum", 2))
    threads = data.get("threads", [])
    num_kernel_threads = int(data.get("num_kernel_threads", 2))

    if not threads:
        return jsonify({"error": "No threads provided"}), 400

    # Run selected algorithm
    if algo == "FCFS":
        schedule_result = fcfs(threads)
    elif algo == "SJF":
        schedule_result = sjf(threads)
    elif algo == "RR":
        schedule_result = round_robin(threads, quantum)
    else:
        schedule_result = fcfs(threads)

    metrics = calculate_metrics(schedule_result["threads"])
    mapping = map_threads(schedule_result["threads"], num_kernel_threads)

    return jsonify({
        # FIX: frontend app.js uses data.result for drawGantt — use "result" key
        "result": schedule_result["gantt"],
        # Also keep "gantt" for backward compatibility
        "gantt": schedule_result["gantt"],
        "metrics": metrics,
        "mapping": mapping,
        "threads": threads,
        "num_kernel_threads": num_kernel_threads,
        "quantum": quantum
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
