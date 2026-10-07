"""
Video tracker module utilizing ByteTrack for deduplication and best-frame selection.
"""
import cv2
from typing import Dict, Any, List
from collections import defaultdict

from .detect import CascadeDetector

class VehicleTracker:
    """Wrapper for Ultralytics tracking with ByteTrack to track vehicles and count riders."""
    
    def __init__(self, detector: CascadeDetector):
        """Initialize the tracker with the given detector."""
        self.detector = detector
        # We use the twowheeler model for primary tracking
        self.track_model = detector.twowheeler_model
        
    def process_video(self, video_path: str) -> List[Dict[str, Any]]:
        """
        Process a video, tracking vehicles to collect violations and find the best frame
        for plate recognition.
        
        Args:
            video_path: Path to the video file.
            
        Returns:
            List of violation track data.
        """
        if not self.track_model:
            print("Error: Tracking model not loaded.")
            return []

        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            print(f"Error: Could not open video {video_path}")
            return []

        fps = cap.get(cv2.CAP_PROP_FPS)
        
        # Track history data
        # track_id -> dict of data
        tracks_data = defaultdict(lambda: {
            "best_plate_crop": None,
            "best_plate_area": 0,
            "plate_confidence": 0.0,
            "rider_count_max": 0,
            "without_helmet_count": 0,
            "total_frames": 0,
            "timestamp": 0.0
        })

        frame_idx = 0
        while True:
            ret, frame = cap.read()
            if not ret:
                break
                
            frame_idx += 1
            timestamp = frame_idx / fps
            
            # Run tracking on two-wheelers
            results = self.track_model.track(frame, persist=True, tracker="bytetrack.yaml", verbose=False)
            
            if results and results[0].boxes and results[0].boxes.id is not None:
                boxes = results[0].boxes
                for box, track_id in zip(boxes, boxes.id):
                    t_id = int(track_id.item())
                    tw_coords = [int(c) for c in box.xyxy[0]]
                    tw_crop = frame[tw_coords[1]:tw_coords[3], tw_coords[0]:tw_coords[2]]
                    
                    if tw_crop.size == 0:
                        continue
                        
                    t_data = tracks_data[t_id]
                    t_data["total_frames"] += 1
                    t_data["timestamp"] = timestamp  # Last seen timestamp
                    
                    # Run cascade on the two-wheeler crop
                    if self.detector.rider_model:
                        r_results = self.detector.rider_model(tw_crop, verbose=False)
                        riders = [b for r in r_results for b in r.boxes]
                        t_data["rider_count_max"] = max(t_data["rider_count_max"], len(riders))
                        
                        for r_box in riders:
                            r_coords = [int(c) for c in r_box.xyxy[0]]
                            r_crop = tw_crop[r_coords[1]:r_coords[3], r_coords[0]:r_coords[2]]
                            
                            if r_crop.size > 0 and self.detector.helmet_model:
                                h_results = self.detector.helmet_model(r_crop, verbose=False)
                                for h_res in h_results:
                                    for h_box in h_res.boxes:
                                        h_cls = int(h_box.cls[0])
                                        h_name = self.detector.helmet_model.names[h_cls]
                                        if h_name.lower() in ['withouthelmet', 'no_helmet', 'nohelmet']:
                                            t_data["without_helmet_count"] += 1
                                            
                    # Look for best plate frame
                    if self.detector.plate_model:
                        p_results = self.detector.plate_model(tw_crop, verbose=False)
                        for p_res in p_results:
                            for p_box in p_res.boxes:
                                p_coords = [int(c) for c in p_box.xyxy[0]]
                                p_w = p_coords[2] - p_coords[0]
                                p_h = p_coords[3] - p_coords[1]
                                p_area = p_w * p_h
                                
                                # Best-frame selection based on largest plate bounding box
                                if p_area > t_data["best_plate_area"]:
                                    t_data["best_plate_area"] = p_area
                                    t_data["best_plate_crop"] = tw_crop[p_coords[1]:p_coords[3], p_coords[0]:p_coords[2]]
                                    t_data["plate_confidence"] = float(p_box.conf[0])

        cap.release()
        
        # Filter tracks that are violations
        violations = []
        for t_id, data in tracks_data.items():
            is_triple = data["rider_count_max"] >= 3
            is_no_helmet = data["without_helmet_count"] > 0
            
            if is_triple or is_no_helmet:
                violations.append({
                    "track_id": t_id,
                    "violation_types": [v for v, cond in [("triple_riding", is_triple), ("no_helmet", is_no_helmet)] if cond],
                    "best_plate_crop": data["best_plate_crop"],
                    "plate_confidence": data["plate_confidence"],
                    "timestamp": data["timestamp"]
                })
                
        return violations
