# -*- coding: utf-8 -*-
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
"""
app.py -- Flask REST API for Coronary Blockage Detection.
Endpoints:
  GET  /api/health   -> health check
  POST /api/predict  -> upload image -> prediction
  GET  /api/stats    -> model metrics & charts data
"""

import os
import json
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from groq import Groq

# API Key initialization
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")

_groq_client = None

from model.predict import predict_from_bytes

app = Flask(__name__)
CORS(app, origins="*", supports_credentials=False)

SAVE_DIR = os.path.join(os.path.dirname(__file__), "model", "saved")

# Groq client — reads GROQ_API_KEY from environment
def _get_groq():
    global _groq_client
    if _groq_client is None:
        if not GROQ_API_KEY:
            return None
        _groq_client = Groq(api_key=GROQ_API_KEY)
    return _groq_client

CARDIOLOGY_SYSTEM_PROMPT = """
You are a specialized AI clinical assistant embedded inside CoronaryAI, an angiogram
blockage detection system. Your ONLY role is to help interpret coronary angiogram
analysis results and guide next clinical steps.

Strict rules you MUST follow:
1. ONLY answer questions about coronary artery disease, angiogram results, vessel
   blockages, cardiovascular symptoms, cardiac procedures, and next clinical steps.
2. If the user asks about ANY other topic (weather, general knowledge, coding,
   cooking, politics, etc.), respond EXACTLY with:
   "I\'m sorry, I can only assist with coronary angiogram analysis and related
   cardiac clinical questions."
3. Always reference the patient\'s current diagnosis details if provided.
4. Be concise, professional, and use plain language a patient can understand.
5. Always remind users this is an AI aid and not a replacement for a cardiologist.
6. Do NOT hallucinate procedures or medications not supported by evidence.
7. Do NOT use markdown formatting (like **bolding** or *italics*). Respond in clean plain text only.
"""


# (Routes moved to the end for SPA compatibility)


# ─── Health ──────────────────────────────────────────────────────────────────
@app.route("/api/health", methods=["GET"])
def health():
    models_ready = all(
        os.path.exists(os.path.join(SAVE_DIR, f))
        for f in ["rf_model.pkl", "svm_model.pkl", "scaler.pkl"]
    )
    return jsonify({
        "status":       "ok",
        "models_ready": models_ready,
        "message":      "Models loaded ✅" if models_ready else "⚠️ Run `npm run train` first"
    })


# ─── Predict ─────────────────────────────────────────────────────────────────
@app.route("/api/predict", methods=["POST"])
def predict():
    if "image" not in request.files:
        return jsonify({"error": "No image file provided. Key must be 'image'."}), 400

    file = request.files["image"]
    if file.filename == "":
        return jsonify({"error": "Empty filename."}), 400

    allowed = {".pgm", ".png", ".jpg", ".jpeg", ".bmp", ".tif", ".tiff"}
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed:
        return jsonify({"error": f"Unsupported file type '{ext}'. Use: {allowed}"}), 400

    try:
        image_bytes = file.read()
        result      = predict_from_bytes(image_bytes)
        return jsonify({"success": True, "result": result})
    except FileNotFoundError as e:
        return jsonify({"error": str(e)}), 503
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500


# ─── Chat (Groq) ───────────────────────────────────────────────────────────────
@app.route("/api/chat", methods=["POST"])
def chat():
    body = request.get_json(force=True, silent=True) or {}
    user_message = (body.get("message") or "").strip()
    diagnosis    = body.get("diagnosis")   # optional dict with result context

    if not user_message:
        return jsonify({"error": "No message provided."}), 400

    client = _get_groq()
    if client is None:
        return jsonify({"error": "GROQ_API_KEY not set on server."}), 503

    # Build context from current prediction result if available
    context_block = ""
    if diagnosis:
        context_block = f"""
Current patient scan result:
  - Diagnosis  : {diagnosis.get('label', 'Unknown')}
  - Confidence : {diagnosis.get('confidence', '?')}%
  - Severity   : {diagnosis.get('severity', '?')}
  - RF model   : {diagnosis.get('rf_blockage', '?')}% blockage probability
  - SVM model  : {diagnosis.get('svm_blockage', '?')}% blockage probability
"""

    messages = [
        {"role": "system", "content": CARDIOLOGY_SYSTEM_PROMPT + context_block},
        {"role": "user",   "content": user_message},
    ]

    try:
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=messages,
            max_tokens=400,
            temperature=0.3,
        )
        reply = completion.choices[0].message.content
        return jsonify({"success": True, "reply": reply})
    except Exception as e:
        return jsonify({"error": f"Groq API error: {str(e)}"}), 500


# ─── Stats ───────────────────────────────────────────────────────────────────
@app.route("/api/stats", methods=["GET"])
def stats():
    stats_path = os.path.join(SAVE_DIR, "stats.json")
    if not os.path.exists(stats_path):
        return jsonify({
            "error": "Stats not found. Please run `npm run train` first."
        }), 503

    with open(stats_path, "r") as f:
        data = json.load(f)

    return jsonify({"success": True, "stats": data})


# ─── Static Files (CATCH-ALL) ──────────────────────────────────────────────────
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve(path):
    dist_dir = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
    if path != "" and os.path.exists(os.path.join(dist_dir, path)):
        return send_from_directory(dist_dir, path)
    else:
        if os.path.exists(os.path.join(dist_dir, "index.html")):
            return send_from_directory(dist_dir, "index.html")
        else:
            return jsonify({
                "app": "CoronaryAI Backend API",
                "status": "Running",
                "message": "Frontend not built yet. Run `npm run build` in 'frontend' folder.",
                "endpoints": ["/api/health", "/api/predict", "/api/stats", "/api/chat"]
            })

# ─── Entry point ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"\n[START] Coronary Blockage API running on http://localhost:{port}")
    print(f"  Endpoints:")
    print(f"    GET  /api/health")
    print(f"    POST /api/predict")
    print(f"    GET  /api/stats\n")
    app.run(debug=True, host="0.0.0.0", port=port)
