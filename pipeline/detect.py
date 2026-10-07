"""
Cascade detection module for detecting two-wheelers, riders, helmets, and plates.
"""
from dataclasses import dataclass
from typing import List, Tuple, Optional
import numpy as np
from ultralytics import YOLO

from .config import (
    WEIGHTS_TWOWHEELER, WEIGHTS_RIDER, WEIGHTS_HELMET, WEIGHTS_PLATE,
    CONF_TWOWHEELER, CONF_RIDER, CONF_HELMET, CONF_PLATE
)

@dataclass
class Detection:
    """Dataclass to represent a single detection."""
    bbox: Tuple[int, int, int, int]  # x1, y1, x2, y2
    class_name: str
    confidence: float
    crop: np.ndarray

class CascadeDetector:
    """Cascade detector loading 4 YOLO models for the pipeline."""

    def __init__(self):
        """Initialize and load all YOLO models."""
        print("Loading models...")
        self.twowheeler_model = self._load_model(WEIGHTS_TWOWHEELER, "Two-wheeler")
        self.rider_model = self._load_model(WEIGHTS_RIDER, "Rider")
        self.helmet_model = self._load_model(WEIGHTS_HELMET, "Helmet")
        self.plate_model = self._load_model(WEIGHTS_PLATE, "Plate")
        print("Models loaded successfully.")

    def _load_model(self, path, name) -> Optional[YOLO]:
        """Helper to load a YOLO model with error handling."""
        try:
            return YOLO(str(path))
        except Exception as e:
            print(f"Warning: Could not load {name} model from {path}: {e}")
            return None

    def detect_frame(self, frame: np.ndarray) -> List[Detection]:
        """
        Run the cascade detection on a single frame.
        
        Args:
            frame: The input image as a NumPy array (BGR format).
            
        Returns:
            A list of Detection objects.
        """
        detections = []
        if not self.twowheeler_model:
            return detections

        # 1. Detect two-wheelers
        tw_results = self.twowheeler_model(frame, conf=CONF_TWOWHEELER, verbose=False)
        for tw_result in tw_results:
            for tw_box in tw_result.boxes:
                tw_coords = [int(c) for c in tw_box.xyxy[0]]
                tw_crop = frame[tw_coords[1]:tw_coords[3], tw_coords[0]:tw_coords[2]]
                
                # We can store the two-wheeler detection as well
                detections.append(Detection(
                    bbox=tuple(tw_coords),
                    class_name="TwoWheeler",
                    confidence=float(tw_box.conf[0]),
                    crop=tw_crop
                ))
                
                if tw_crop.size == 0 or not self.rider_model:
                    continue

                # 2. Detect riders in the two-wheeler crop
                rider_results = self.rider_model(tw_crop, conf=CONF_RIDER, verbose=False)
                for r_result in rider_results:
                    for r_box in r_result.boxes:
                        r_coords_local = [int(c) for c in r_box.xyxy[0]]
                        # Convert to global coordinates
                        rx1 = tw_coords[0] + r_coords_local[0]
                        ry1 = tw_coords[1] + r_coords_local[1]
                        rx2 = tw_coords[0] + r_coords_local[2]
                        ry2 = tw_coords[1] + r_coords_local[3]
                        
                        r_crop = frame[ry1:ry2, rx1:rx2]
                        detections.append(Detection(
                            bbox=(rx1, ry1, rx2, ry2),
                            class_name="Rider",
                            confidence=float(r_box.conf[0]),
                            crop=r_crop
                        ))

                        if r_crop.size == 0 or not self.helmet_model:
                            continue

                        # 3. Classify helmet/no-helmet for the rider
                        helmet_results = self.helmet_model(r_crop, conf=CONF_HELMET, verbose=False)
                        has_helmet = False
                        helmet_conf = 0.0
                        
                        for h_result in helmet_results:
                            for h_box in h_result.boxes:
                                h_cls = int(h_box.cls[0])
                                h_name = self.helmet_model.names[h_cls]
                                if h_name.lower() in ['withhelmet', 'helmet']:
                                    has_helmet = True
                                    helmet_conf = float(h_box.conf[0])
                                    break
                                elif h_name.lower() in ['withouthelmet', 'no_helmet', 'nohelmet']:
                                    has_helmet = False
                                    helmet_conf = float(h_box.conf[0])
                                    break

                        status_class = "WithHelmet" if has_helmet else "WithoutHelmet"
                        detections.append(Detection(
                            bbox=(rx1, ry1, rx2, ry2),
                            class_name=status_class,
                            confidence=helmet_conf,
                            crop=r_crop
                        ))

                        # 4. If no helmet, look for plate in the two-wheeler crop
                        if not has_helmet and self.plate_model:
                            plate_results = self.plate_model(tw_crop, conf=CONF_PLATE, verbose=False)
                            for p_result in plate_results:
                                for p_box in p_result.boxes:
                                    p_coords_local = [int(c) for c in p_box.xyxy[0]]
                                    # Convert to global coordinates
                                    px1 = tw_coords[0] + p_coords_local[0]
                                    py1 = tw_coords[1] + p_coords_local[1]
                                    px2 = tw_coords[0] + p_coords_local[2]
                                    py2 = tw_coords[1] + p_coords_local[3]
                                    
                                    p_crop = frame[py1:py2, px1:px2]
                                    detections.append(Detection(
                                        bbox=(px1, py1, px2, py2),
                                        class_name="Plate",
                                        confidence=float(p_box.conf[0]),
                                        crop=p_crop
                                    ))

        return detections
