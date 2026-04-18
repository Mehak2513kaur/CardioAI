# 🫀 CardioAI: Advanced Cardiac Diagnostic Intelligence

[![React](https://img.shields.io/badge/Frontend-React%2018-blue?logo=react)](https://reactjs.org/)
[![Flask](https://img.shields.io/badge/Backend-Flask%203.0-lightgrey?logo=flask)](https://flask.palletsprojects.com/)
[![Scikit-Learn](https://img.shields.io/badge/ML-Scikit--Learn-orange?logo=scikit-learn)](https://scikit-learn.org/)
[![Vite](https://img.shields.io/badge/Build-Vite-646CFF?logo=vite)](https://vitejs.dev/)

CoronaryAI is a medical-grade computer vision platform designed to detect blockages in coronary angiograms. It combines an optimized **RF+SVM Ensemble** machine learning pipeline with clinical-grade **Explainable AI (XAI)** visualizations and automated medical reporting.

---

## ✨ Key Features

### 🔍 Explainable AI (XAI) Heatmaps
Uses **Frangi Vesselness Filters** to reconstruct arterial paths. The system overlays a high-contrast **INFERNO heatmap** that visualizes vessel density and highlights structural deviations in real-time.

### 🎯 Targeted Blockage Pinpointing
Utilizes a **Gaussian Centrality Ranking** algorithm to identify the primary site of occlusion. It places an **Electric Blue Clinical Marker** on the most critical segment, ensuring radiologists stay focused on relevant pathology.

### 📄 Automated Clinical PDF Reports
Generate formal, hospital-ready diagnostic reports with a single click. Includes:
- High-fidelity scans with marked highlights.
- Comparative model confidence gauges.
- AI-generated **Clinical Interpretation** and Action Plans.

### 🤖 Integrated AI Assistant
A built-in **Diagnostic Assistant** (powered by Groq/LLaMA 3) fuzes the model's raw 15-dimensional probability space into human-readable medical insights.

---

## 🧠 Technical Architecture

### 🛡️ Hybrid ML Ensemble
The system uses a weighted voting ensemble for maximum reliability on medical datasets:
- **Random Forest (RF)**: Selected for its robustness against noisy texture data in angiograms.
- **Support Vector Machine (SVM)**: Uses a Radial Basis Function (RBF) kernel to separate high-dimensional GLCM and LBP feature vectors.
- **Benchmark Performance**: **70.4% Accuracy** on cross-validation sets.

### 📊 Feature Engineering (15-D Vector)
1. **Reconstructed Vessel Area**: Extracted via Bilateral Blur + CLAHE + Frangi.
2. **GLCM Textures (4)**: Contrast, Energy, Homogeneity, and Correlation (captures plaque density).
3. **LBP Histograms (10)**: 10-bin Local Binary Patterns for pixel-level micro-texture analysis.

---

## 🛠️ Installation & Setup

### Option 1: One-Click Startup (Recommended)
We have provided professional startup scripts that launch both the Backend and Frontend with a single command.

**For Mac/Linux:**
```bash
./start.sh
```

**For Windows:**
```batch
Start_CoronaryAI.bat
```

### Option 2: Manual Setup
If you prefer to run the services individually:

**1. Backend:**
```bash
cd backend
source venv/bin/activate  # (or venv\Scripts\activate on Windows)
PORT=5001 python3 app.py
```

**2. Frontend:**
```bash
cd frontend
npm run dev
```
Navigate to **http://localhost:5173** in your browser.

---

## 📂 Project Structure
```text
├── backend/
│   ├── model/           # ML Core (RF, SVM, Feature extraction)
│   │   ├── saved/       # Persisted .pkl models & scalers
│   │   ├── predict.py   # Synthesis & XAI Logic
│   │   └── train.py     # Training Ensemble pipeline
│   └── app.py           # Flask REST API
├── frontend/
│   ├── src/
│   │   ├── components/  # Dashboard & Chat components
│   │   ├── pages/       # Predict, Home, Statistics
│   │   └── index.css    # Premium Glassmorphic Design System
│   └── package.json     # Node Dependencies (jsPDF, html2canvas)
```

---

## ⚠️ Medical Disclaimer
This tool is for **research and educational purposes only**. It is not a substitute for professional medical diagnosis. Always consult a qualified cardiologist for clinical decisions.

---
---
**Developed with ❤️ by arpit for Modern Cardiology**
