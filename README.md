# 🚨 Automated Helmet Violation Detection & E-Challan Generation System

> A robust, confidence-aware two-wheeler violation detection system with multi-frame tracking for degraded CCTV footage — designed for Tamil Nadu traffic enforcement.

## 🎯 Project Highlights (Novelty)

| Feature | Description |
|---|---|
| **Degradation-Robust Training** | Trained with night/blur/rain augmentation. Benchmarked on synthetically degraded images |
| **Multi-Frame Tracking** | ByteTrack follows each vehicle across video frames → one fine per vehicle |
| **Confidence-Based Abstention** | Uncertain detections go to human review queue instead of auto-fining |
| **Indian Plate Validation** | OCR output validated against TN plate regex with O→0, B→8 correction |
| **Triple-Riding Detection** | Counts riders per tracked vehicle → separate ₹1000 fine |

## 🏗️ Architecture

```
CCTV Frame → Two-Wheeler Detector → Rider Detector → Helmet Classifier
                                                          ↓
                                              [No Helmet?] → Plate Detector → EasyOCR → Dashboard
                                              [Triple Riding?] ↗
```

### 4-Stage Pipeline
1. **Computer Vision (YOLOv8)**: 4 cascade detectors — two-wheeler, rider, helmet, plate
2. **Logic & Cropping**: If no helmet → crop plate region
3. **OCR (EasyOCR)**: Extract plate text (e.g., "TN 07 AB 1234")
4. **SaaS Dashboard (Next.js + Express + MongoDB)**: Review violations, issue e-challans

## 📂 Project Structure

```
Automatic-Helmet-Detection/
├── weights/                     # YOLOv8 trained weights (download from Kaggle)
├── pipeline/                    # Python inference pipeline
│   ├── config.py                # Paths, thresholds, regex
│   ├── detect.py                # Multi-model cascade detector
│   ├── tracker.py               # ByteTrack video tracking
│   ├── ocr.py                   # EasyOCR + TN plate validation
│   └── pipeline.py              # Full pipeline orchestrator
├── dashboard/
│   ├── backend/                 # Node.js + Express + MongoDB
│   └── frontend/                # Next.js (App Router)
├── notebooks/                   # Kaggle training notebooks
│   └── version-3-*.ipynb        # All 4 models + benchmark
├── benchmark/                   # Degradation benchmark results
├── Study papers/                # Reference papers
├── requirements.txt             # Python dependencies
└── README.md
```

## 🚀 Quick Start

### 1. Train Models (Kaggle)
Upload `notebooks/version-3-all-models-with-benchmark.ipynb` to Kaggle and run all cells.
Download the 4 `best.pt` files to `weights/`.

### 2. Run Inference Pipeline (Local)
```bash
pip install -r requirements.txt
python -m pipeline.pipeline --source path/to/video.mp4
```

### 3. Start Dashboard
```bash
# Terminal 1: Backend
cd dashboard/backend
npm install
npm run seed    # populate sample data
npm start       # http://localhost:5000

# Terminal 2: Frontend
cd dashboard/frontend
npm install
npm run dev     # http://localhost:3000
```

## 📊 Model Performance

| Detector | Classes | mAP@50 | Precision | Recall |
|---|---|---|---|---|
| Rider | rider | 0.746 | 0.804 | 0.642 |
| Helmet | WithHelmet, WithoutHelmet | TBD | TBD | TBD |
| Plate | Plate | TBD | TBD | TBD |
| Two-Wheeler | twowheeler | TBD | TBD | TBD |

### Degradation Benchmark (Rider Model)

| Condition | Baseline mAP50 | Augmented mAP50 | Δ |
|---|---|---|---|
| Clean | ~0.75 | ~0.76 | — |
| Night | TBD | TBD | TBD |
| Blur | TBD | TBD | TBD |
| Rain | TBD | TBD | TBD |

*(Fill in after running Cell J in the notebook)*

## 🛠️ Technology Stack

- **Detection**: YOLOv8s (Ultralytics)
- **Tracking**: ByteTrack
- **OCR**: EasyOCR
- **Backend**: Node.js, Express, MongoDB
- **Frontend**: Next.js (React)
- **Training**: Kaggle (Tesla T4 GPU)
- **Inference**: ThinkPad T480 (CPU)

## 📜 Tamil Nadu Traffic Fines

| Violation | Fine (₹) | Section |
|---|---|---|
| Riding without helmet | ₹1,000 | MV Act Sec 129 |
| Triple riding | ₹1,000 | MV Act Sec 128 |

## 📚 Dataset

- **Primary**: [Two-Wheeler Violation and License Detection](https://www.kaggle.com/datasets/irfanmohammad1729/two-wheeler-violation-and-license-detection)
- **Supplementary**: CCTV Helmet Detection (Roboflow), ExDark (Kaggle)

## 📄 License

MIT