"""
Nova 2.0 — Flask Backend Server
=================================
Serves the website and provides API endpoints for local AI content generation.
Runs entirely on your laptop. No cloud dependencies.

Usage:
    python app.py

API Endpoints:
    GET  /                          → Serves the website
    GET  /api/status                → Engine status & stats
    GET  /api/content-types         → List available content types & tones
    POST /api/generate              → Generate content by type & tone
    POST /api/generate/custom       → Generate from custom prompt
    POST /api/generate/batch        → Generate multiple pieces at once
    GET  /api/history               → View generation history
    DELETE /api/history             → Clear generation history
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from datetime import datetime
import os
import json

from ai_engine import NovaAIEngine

# ==========================================
#  FLASK APP SETUP
# ==========================================

app = Flask(__name__, static_folder=".", static_url_path="")
CORS(app)

# Initialize AI Engine
engine = NovaAIEngine()

# Generation history (stored in memory, persisted to file)
HISTORY_FILE = "generation_history.json"
generation_history = []


def load_history():
    """Load generation history from file."""
    global generation_history
    if os.path.exists(HISTORY_FILE):
        try:
            with open(HISTORY_FILE, "r", encoding="utf-8") as f:
                generation_history = json.load(f)
        except (json.JSONDecodeError, IOError):
            generation_history = []


def save_history():
    """Save generation history to file."""
    try:
        with open(HISTORY_FILE, "w", encoding="utf-8") as f:
            json.dump(generation_history[-100:], f, indent=2, ensure_ascii=False)  # Keep last 100
    except IOError:
        pass


def add_to_history(result):
    """Add a generation result to history."""
    entry = {
        "id": len(generation_history) + 1,
        "timestamp": datetime.now().isoformat(),
        "type": result.get("metadata", {}).get("type", "unknown"),
        "tone": result.get("metadata", {}).get("tone", "unknown"),
        "content_preview": result.get("content", "")[:150] + "...",
        "word_count": result.get("metadata", {}).get("word_count", 0),
        "generation_time_ms": result.get("metadata", {}).get("generation_time_ms", 0),
    }
    generation_history.append(entry)
    save_history()


# Load existing history on startup
load_history()


# ==========================================
#  WEBSITE ROUTES
# ==========================================

@app.route("/")
def serve_index():
    """Serve the main website."""
    return send_from_directory(".", "index.html")


@app.route("/<path:path>")
def serve_static(path):
    """Serve static files (CSS, JS, images)."""
    return send_from_directory(".", path)


# ==========================================
#  API ROUTES
# ==========================================

@app.route("/api/status", methods=["GET"])
def api_status():
    """Get engine status and statistics."""
    stats = engine.get_stats()
    stats["server_time"] = datetime.now().isoformat()
    stats["history_count"] = len(generation_history)
    stats["uptime_status"] = "online"
    return jsonify(stats)


@app.route("/api/content-types", methods=["GET"])
def api_content_types():
    """List all available content types and tones."""
    return jsonify(engine.get_content_types())


@app.route("/api/generate", methods=["POST"])
def api_generate():
    """
    Generate content by type and tone.

    Request body:
    {
        "type": "product_intro",  (required)
        "tone": "professional",   (optional, default: professional)
        "params": {}              (optional, custom parameters)
    }
    """
    data = request.get_json()

    if not data or "type" not in data:
        return jsonify({
            "success": False,
            "error": "Missing required field: 'type'. Use GET /api/content-types for available types."
        }), 400

    content_type = data["type"]
    tone = data.get("tone", "professional")
    params = data.get("params", None)

    # Validate content type
    valid_types = list(engine.templates.keys())
    if content_type not in valid_types:
        return jsonify({
            "success": False,
            "error": f"Invalid content type: '{content_type}'. Valid types: {valid_types}"
        }), 400

    # Validate tone
    valid_tones = list(engine.tones.keys())
    if tone not in valid_tones:
        return jsonify({
            "success": False,
            "error": f"Invalid tone: '{tone}'. Valid tones: {valid_tones}"
        }), 400

    result = engine.generate(content_type, tone, params)
    add_to_history(result)

    return jsonify(result)


@app.route("/api/generate/custom", methods=["POST"])
def api_generate_custom():
    """
    Generate content from a custom prompt.

    Request body:
    {
        "prompt": "Write a social media post about Nova 2.0",  (required)
        "tone": "engaging",     (optional, default: professional)
        "max_length": 500       (optional, default: 500)
    }
    """
    data = request.get_json()

    if not data or "prompt" not in data:
        return jsonify({
            "success": False,
            "error": "Missing required field: 'prompt'."
        }), 400

    prompt = data["prompt"]
    tone = data.get("tone", "professional")
    max_length = data.get("max_length", 500)

    result = engine.generate_custom(prompt, tone, max_length)
    add_to_history(result)

    return jsonify(result)


@app.route("/api/generate/batch", methods=["POST"])
def api_generate_batch():
    """
    Generate multiple pieces of content.

    Request body:
    {
        "requests": [
            {"type": "product_intro", "tone": "futuristic"},
            {"type": "social_post", "tone": "engaging"},
            {"type": "tip", "tone": "casual"}
        ]
    }
    """
    data = request.get_json()

    if not data or "requests" not in data:
        return jsonify({
            "success": False,
            "error": "Missing required field: 'requests' (array of generation requests)."
        }), 400

    results = engine.generate_batch(data["requests"])

    for result in results.get("results", []):
        add_to_history(result)

    return jsonify(results)


@app.route("/api/history", methods=["GET"])
def api_history():
    """Get generation history."""
    limit = request.args.get("limit", 20, type=int)
    recent = generation_history[-limit:]
    recent.reverse()  # Most recent first
    return jsonify({
        "history": recent,
        "total": len(generation_history),
        "showing": len(recent),
    })


@app.route("/api/history", methods=["DELETE"])
def api_clear_history():
    """Clear generation history."""
    global generation_history
    generation_history = []
    save_history()
    return jsonify({"success": True, "message": "History cleared."})


# ==========================================
#  ERROR HANDLERS
# ==========================================

@app.errorhandler(404)
def not_found(e):
    return jsonify({"success": False, "error": "Endpoint not found."}), 404


@app.errorhandler(500)
def server_error(e):
    return jsonify({"success": False, "error": "Internal server error."}), 500


# ==========================================
#  MAIN
# ==========================================

if __name__ == "__main__":
    print()
    print("=" * 60)
    print("  🚀 Nova 2.0 — Local AI Content Generation Server")
    print("  💻 Running 100% on your laptop. No cloud. No API keys.")
    print("=" * 60)
    print()
    print("  🌐 Website:    http://localhost:5000")
    print("  📡 API Base:   http://localhost:5000/api")
    print()
    print("  API Endpoints:")
    print("  ─────────────────────────────────────────────────")
    print("  GET  /api/status          → Engine status")
    print("  GET  /api/content-types   → Available types & tones")
    print("  POST /api/generate        → Generate by type")
    print("  POST /api/generate/custom → Generate from prompt")
    print("  POST /api/generate/batch  → Batch generation")
    print("  GET  /api/history         → Generation history")
    print("  ─────────────────────────────────────────────────")
    print()
    print("  🔒 All processing happens locally on this device.")
    print("  🛑 Press Ctrl+C to stop the server.")
    print()

    app.run(host="0.0.0.0", port=5000, debug=True)
