import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import * as dicomParser from 'dicom-parser';
import './DicomUploader.css';

const DicomUploader = () => {
  const [dicomImage, setDicomImage] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [error, setError] = useState(null);
  const [showPanel, setShowPanel] = useState(false);

  const { getRootProps, getInputProps } = useDropzone({
    accept: '.dcm',
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const arrayBuffer = reader.result;
          const byteArray = new Uint8Array(arrayBuffer);
          const dataSet = dicomParser.parseDicom(byteArray);

          // Extract metadata
          const metadata = {
            patientName: dataSet.string('x00100010') || 'N/A',
            patientID: dataSet.string('x00100020') || 'N/A',
            studyDate: dataSet.string('x00080020') || 'N/A',
            modality: dataSet.string('x00080060') || 'N/A',
            patientBirthDate: dataSet.string('x00100030') || 'N/A',
            patientSex: dataSet.string('x00100040') || 'N/A',
            institutionName: dataSet.string('x00080080') || 'N/A',
          };
          setMetadata(metadata);

          // Extract and render image
          const pixelDataElement = dataSet.elements.x7fe00010;

          if (!pixelDataElement) {
            throw new Error('Pixel data element not found');
          }

          const pixelData = new Uint8Array(arrayBuffer, pixelDataElement.dataOffset, pixelDataElement.length);
          const width = dataSet.uint16('x00280011'); // Columns
          const height = dataSet.uint16('x00280010'); // Rows
          const bitsAllocated = dataSet.uint16('x00280100'); // Bits allocated
          const samplesPerPixel = dataSet.uint16('x00280002'); // Samples per pixel

          const dicomUrl = handlePixelDataProcessing(pixelData, width, height, bitsAllocated, samplesPerPixel);
          setDicomImage(dicomUrl);
        } catch (error) {
          console.error('Error processing DICOM file:', error);
          setError(`Failed to process DICOM file. Error: ${error.message}`);
        }
      };
      reader.readAsArrayBuffer(file);
    },
  });

  // Define handlePixelDataProcessing function
  const handlePixelDataProcessing = (pixelData, width, height, bitsAllocated, samplesPerPixel) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(width, height);

    try {
      if (samplesPerPixel === 1) {
        if (bitsAllocated === 8) {
          // 8-bit grayscale image
          for (let i = 0; i < pixelData.length; i++) {
            const value = pixelData[i];
            imageData.data[i * 4] = value; // Red
            imageData.data[i * 4 + 1] = value; // Green
            imageData.data[i * 4 + 2] = value; // Blue
            imageData.data[i * 4 + 3] = 255; // Alpha
          }
        } else if (bitsAllocated === 16) {
          // 16-bit grayscale image
          for (let i = 0; i < pixelData.length / 2; i++) {
            const value = (pixelData[i * 2] << 8) | pixelData[i * 2 + 1];
            const normalizedValue = Math.round((value / 65535) * 255); // Scale to 8-bit range
            imageData.data[i * 4] = normalizedValue; // Red
            imageData.data[i * 4 + 1] = normalizedValue; // Green
            imageData.data[i * 4 + 2] = normalizedValue; // Blue
            imageData.data[i * 4 + 3] = 255; // Alpha
          }
        } else {
          throw new Error('Unsupported bit depth');
        }
      } else if (samplesPerPixel === 3 && bitsAllocated === 8) {
        // 24-bit RGB image
        for (let i = 0; i < pixelData.length / 3; i++) {
          const r = pixelData[i * 3];
          const g = pixelData[i * 3 + 1];
          const b = pixelData[i * 3 + 2];
          imageData.data[i * 4] = r;
          imageData.data[i * 4 + 1] = g;
          imageData.data[i * 4 + 2] = b;
          imageData.data[i * 4 + 3] = 255;
        }
      } else {
        throw new Error('Unsupported DICOM pixel format');
      }

      ctx.putImageData(imageData, 0, 0);
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Error processing pixel data:', error);
      setError(`Failed to process pixel data. Error: ${error.message}`);
      return null;
    }
  };

  const handleTogglePanel = () => {
    setShowPanel(!showPanel);
  };

  return (
    <div className="container">
      <h2>Simple Testing Interface</h2>
      <div {...getRootProps({ className: 'dropzone' })}>
        <input {...getInputProps()} />
        <p>Drag & drop a DICOM file here, or click to select one</p>
      </div>
      {error && <p className="error">{error}</p>}
      {metadata && (
        <div className="metadata-summary">
          <p><strong>Patient Name:</strong> {metadata.patientName}</p>
          <p><strong>Patient Birth Date:</strong> {metadata.patientBirthDate}</p>
          <p><strong>Patient Sex:</strong> {metadata.patientSex}</p>
          <p><strong>Study Date:</strong> {metadata.studyDate}</p>
          <p><strong>Modality:</strong> {metadata.modality}</p>
          <p><strong>Institution Name:</strong> {metadata.institutionName}</p>
          <button className="toggle-panel-button" onClick={handleTogglePanel}>
            {showPanel ? 'Hide' : 'Show'} More Metadata
          </button>
        </div>
      )}
      {dicomImage && (
        <div className="preview-container">
          <h3>DICOM Rendered Image</h3>
          <img src={dicomImage} alt="DICOM Preview" className="dicom-image" />
        </div>
      )}
      {showPanel && (
        <div className="metadata-panel show">
          <h3>Full Metadata</h3>
          <p><strong>Patient Name:</strong> {metadata.patientName}</p>
          <p><strong>Patient ID:</strong> {metadata.patientID}</p>
          <p><strong>Study Date:</strong> {metadata.studyDate}</p>
          <p><strong>Modality:</strong> {metadata.modality}</p>
          <p><strong>Patient Birth Date:</strong> {metadata.patientBirthDate}</p>
          <p><strong>Patient Sex:</strong> {metadata.patientSex}</p>
          <p><strong>Institution Name:</strong> {metadata.institutionName}</p>
        </div>
      )}
    </div>
  );
};

export default DicomUploader;