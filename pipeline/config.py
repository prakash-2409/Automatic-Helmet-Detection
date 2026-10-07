"""
Configuration settings for the Helmet Violation Detection & E-Challan pipeline.
"""
from pathlib import Path

# Base paths
BASE_DIR = Path(__file__).resolve().parent.parent
WEIGHTS_DIR = BASE_DIR / "weights"
OUTPUT_DIR = BASE_DIR / "output"

# Model weights paths
WEIGHTS_TWOWHEELER = WEIGHTS_DIR / "twowheeler_best.pt"
WEIGHTS_RIDER = WEIGHTS_DIR / "rider_best.pt"
WEIGHTS_HELMET = WEIGHTS_DIR / "helmet_best.pt"
WEIGHTS_PLATE = WEIGHTS_DIR / "plate_best.pt"

# Confidence thresholds
CONF_TWOWHEELER = 0.5
CONF_RIDER = 0.5
CONF_HELMET = 0.5
CONF_PLATE = 0.5

# Abstention threshold for human review
ABSTENTION_THRESHOLD = 0.45

# Regex pattern for Tamil Nadu (TN) plate validation
# Supports formats like TN 01 AB 1234, TN01AB1234, etc.
TN_PLATE_REGEX = r"^[A-Z]{2}\s?\d{2}\s?[A-Z]{1,3}\s?\d{4}$"

# Output directories for pipeline results
VIOLATIONS_FILE = OUTPUT_DIR / "violations.json"
EVIDENCE_DIR = OUTPUT_DIR / "evidence"

# Ensure output directories exist
EVIDENCE_DIR.mkdir(parents=True, exist_ok=True)
