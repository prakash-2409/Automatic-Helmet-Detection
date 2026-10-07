"""
OCR module utilizing EasyOCR for reading license plates with specific validations.
"""
import re
from typing import List
import numpy as np
import easyocr

from .config import TN_PLATE_REGEX

class PlateReader:
    """OCR reader for license plates using EasyOCR."""

    def __init__(self):
        """Initialize EasyOCR reader."""
        print("Loading EasyOCR...")
        # Only loading English as requested by the format, can add more if needed
        self.reader = easyocr.Reader(['en'], gpu=False)
        self.tn_pattern = re.compile(TN_PLATE_REGEX)
        print("EasyOCR loaded successfully.")

    def _correct_characters(self, text: str) -> str:
        """
        Apply common character corrections for Indian license plates.
        For example: O->0, B->8, I->1, etc., in digit positions.
        """
        text = text.upper().replace(" ", "")
        chars = list(text)
        
        # Simple global replacements for common OCR errors in digits
        digit_corrections = {'O': '0', 'I': '1', 'B': '8', 'S': '5', 'Z': '2'}
        
        for i, char in enumerate(chars):
            # Try to correct digits based on standard position
            # Standard positions for numbers in TN plates (ignoring spaces):
            # Pos 2,3 (numbers), Pos -4,-3,-2,-1 (numbers)
            if (i == 2 or i == 3) or (len(chars) - i <= 4):
                if char in digit_corrections:
                    chars[i] = digit_corrections[char]

        return "".join(chars)

    def read_plate(self, plate_crop_image: np.ndarray) -> str:
        """
        Read text from a plate crop image.
        
        Args:
            plate_crop_image: The image of the plate.
            
        Returns:
            The cleaned OCR text.
        """
        if plate_crop_image is None or plate_crop_image.size == 0:
            return ""

        results = self.reader.readtext(plate_crop_image)
        text = " ".join([res[1] for res in results])
        return self._correct_characters(text)

    def validate_indian_plate(self, text: str) -> bool:
        """
        Validate text against TN/Indian plate pattern.
        
        Args:
            text: The text to validate.
            
        Returns:
            True if it matches the pattern, False otherwise.
        """
        return bool(self.tn_pattern.match(text))

    def vote_plate(self, list_of_readings: List[str]) -> str:
        """
        Multi-frame voting to find the consensus text.
        
        Args:
            list_of_readings: List of OCR readings from multiple frames.
            
        Returns:
            The most common reading, preferably one that validates.
        """
        if not list_of_readings:
            return ""
            
        # Count occurrences
        counts = {}
        for r in list_of_readings:
            if r:
                counts[r] = counts.get(r, 0) + 1
                
        if not counts:
            return ""
            
        # Sort by count descending
        sorted_readings = sorted(counts.items(), key=lambda x: x[1], reverse=True)
        
        # Try to find the most frequent one that validates
        for r, _ in sorted_readings:
            if self.validate_indian_plate(r):
                return r
                
        # Fallback to the most frequent one even if invalid
        return sorted_readings[0][0]
