from flask import Flask, request, jsonify
import pydicom
from flask_cors import CORS
from PIL import Image, ImageOps
import io
import base64
import numpy as np

app = Flask(__name__)
CORS(app)  # This will allow all origins. You can customize it as needed.

@app.route('/upload_dicom', methods=['POST'])
def upload_dicom():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    try:
        # Read DICOM file
        dicom_data = pydicom.dcmread(file)

        # Extract metadata
        def safe_get(tag, default='N/A'):
            return dicom_data.get(tag, default)

        metadata = {
            'patientName': str(safe_get('PatientName')),
            'patientID': str(safe_get('PatientID')),
            'patientSex': str(safe_get('PatientSex')),
            'studyInstanceUID': str(safe_get('StudyInstanceUID')),
            'studyDate': str(safe_get('StudyDate')),
            'studyTime': str(safe_get('StudyTime')),
            'seriesInstanceUID': str(safe_get('SeriesInstanceUID')),
            'seriesNumber': str(safe_get('SeriesNumber')),
            'modality': str(safe_get('Modality')),
            'seriesDescription': str(safe_get('SeriesDescription')),
            'bodyPartExamined': str(safe_get('BodyPartExamined')),
            'sopInstanceUID': str(safe_get('SOPInstanceUID')),
            'sopClassUID': str(safe_get('SOPClassUID')),
            'transferSyntaxUID': str(safe_get('TransferSyntaxUID')),
            'instanceNumber': str(safe_get('InstanceNumber')),
            'photometricInterpretation': str(safe_get('PhotometricInterpretation')),
            'samplesPerPixel': str(safe_get('SamplesPerPixel')),
            'pixelRepresentation': str(safe_get('PixelRepresentation')),
            'columns': str(safe_get('Columns')),
            'rows': str(safe_get('Rows')),
            'bitsAllocated': str(safe_get('BitsAllocated')),
            'bitsStored': str(safe_get('BitsStored')),
            'pixelSpacing': str(safe_get('PixelSpacing'))
        }

        # Convert DICOM pixel data to an image
        pixel_array = dicom_data.pixel_array

        # Normalize pixel values
        pixel_array = np.interp(pixel_array, (pixel_array.min(), pixel_array.max()), (0, 255)).astype(np.uint8)

        # Handle different photometric interpretations
        if dicom_data.PhotometricInterpretation == "MONOCHROME1": 
            pixel_array = np.invert(pixel_array)  # Invert the pixel array if MONOCHROME1

        image = Image.fromarray(pixel_array)
        if image.mode != 'RGB':
            image = image.convert('RGB')  # Convert to RGB if necessary

        buffer = io.BytesIO()
        image.save(buffer, format="PNG")
        buffer.seek(0)
        image_base64 = base64.b64encode(buffer.read()).decode()

        return jsonify({"metadata": metadata, "image": image_base64}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("Starting Python server on http://localhost:5000")
    app.run(debug=True)
