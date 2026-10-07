"""
Main orchestration pipeline for the Helmet Violation Detection & E-Challan system.
"""
import os
import json
import argparse
from datetime import datetime
import cv2
import numpy as np

from .config import VIOLATIONS_FILE, EVIDENCE_DIR, ABSTENTION_THRESHOLD
from .detect import CascadeDetector
from .tracker import VehicleTracker
from .ocr import PlateReader

class ViolationPipeline:
    """Orchestrates the detection, tracking, and OCR components."""

    def __init__(self):
        self.detector = CascadeDetector()
        self.tracker = VehicleTracker(self.detector)
        self.ocr = PlateReader()

    def process_image(self, image_path: str) -> None:
        """Process a single image for violations."""
        print(f"Processing image: {image_path}")
        frame = cv2.imread(image_path)
        if frame is None:
            print(f"Error: Could not read image {image_path}")
            return

        detections = self.detector.detect_frame(frame)
        
        # Simple extraction for single image:
        # If we see a without helmet class and a plate class
        has_violation = any(d.class_name == "WithoutHelmet" for d in detections)
        plates = [d for d in detections if d.class_name == "Plate"]

        if has_violation and plates:
            best_plate = max(plates, key=lambda p: p.confidence)
            plate_text = self.ocr.read_plate(best_plate.crop)
            
            self._record_violation(
                plate_text=plate_text,
                plate_confidence=best_plate.confidence,
                evidence_image=frame,
                violation_type="no_helmet",
                timestamp=datetime.now().isoformat()
            )

    def process_video(self, video_path: str) -> None:
        """Process a video file for violations using tracking."""
        print(f"Processing video: {video_path}")
        violations = self.tracker.process_video(video_path)
        
        for v in violations:
            plate_text = ""
            conf = v["plate_confidence"]
            
            if v["best_plate_crop"] is not None:
                plate_text = self.ocr.read_plate(v["best_plate_crop"])
                
            for v_type in v["violation_types"]:
                self._record_violation(
                    plate_text=plate_text,
                    plate_confidence=conf,
                    evidence_image=v["best_plate_crop"], # Could save full frame if available
                    violation_type=v_type,
                    timestamp=f"Video timestamp: {v['timestamp']:.2f}s"
                )

    def _record_violation(self, plate_text: str, plate_confidence: float, 
                          evidence_image: np.ndarray, violation_type: str, timestamp: str) -> None:
        """Save the violation record and evidence image."""
        
        status = "human_review" if plate_confidence < ABSTENTION_THRESHOLD else "auto_fine"
        
        evidence_filename = f"evidence_{datetime.now().strftime('%Y%m%d_%H%M%S_%f')}.jpg"
        evidence_path = EVIDENCE_DIR / evidence_filename
        
        if evidence_image is not None and evidence_image.size > 0:
            cv2.imwrite(str(evidence_path), evidence_image)
        else:
            evidence_path = None

        record = {
            "timestamp": timestamp,
            "plate_text": plate_text,
            "confidence": plate_confidence,
            "evidence_image_path": str(evidence_path) if evidence_path else None,
            "status": status,
            "violation_type": violation_type,
            "valid_plate_format": self.ocr.validate_indian_plate(plate_text)
        }

        print(f"Violation Detected: {violation_type} | Plate: {plate_text} | Status: {status}")

        # Append to JSON
        data = []
        if VIOLATIONS_FILE.exists():
            with open(VIOLATIONS_FILE, 'r') as f:
                try:
                    data = json.load(f)
                except json.JSONDecodeError:
                    data = []
                    
        data.append(record)
        
        with open(VIOLATIONS_FILE, 'w') as f:
            json.dump(data, f, indent=4)

def main():
    parser = argparse.ArgumentParser(description="Helmet Violation Detection Pipeline")
    parser.add_argument("--image", type=str, help="Path to input image")
    parser.add_argument("--video", type=str, help="Path to input video")
    
    args = parser.parse_args()
    
    if not args.image and not args.video:
        print("Please provide an --image or --video argument.")
        return
        
    pipeline = ViolationPipeline()
    
    if args.image:
        pipeline.process_image(args.image)
    if args.video:
        pipeline.process_video(args.video)

if __name__ == "__main__":
    main()
