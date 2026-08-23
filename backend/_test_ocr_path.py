"""Quick check that Tesseract is found and can OCR a real image."""
import os, sys
os.environ.setdefault("PYTHONIOENCODING", "utf-8")
sys.path.insert(0, ".")

import ocr
import pytesseract
from PIL import Image, ImageDraw, ImageFont
import io

print("Tesseract cmd:", pytesseract.pytesseract.tesseract_cmd)
print("Tesseract available:", ocr._TESSERACT_AVAILABLE)
ver = pytesseract.get_tesseract_version()
print("Tesseract version:", ver)

# Create a simple white image with black text
img = Image.new("RGB", (400, 100), color="white")
d = ImageDraw.Draw(img)
d.text((10, 30), "URGENT: Click here to verify", fill="black")
buf = io.BytesIO()
img.save(buf, format="PNG")
png_bytes = buf.getvalue()

text = ocr.extract_text(png_bytes, "image/png")
print("OCR result:", repr(text[:80]))
assert "URGENT" in text or "urgent" in text.lower(), f"Expected URGENT in: {text!r}"
print("OCR test PASSED")
