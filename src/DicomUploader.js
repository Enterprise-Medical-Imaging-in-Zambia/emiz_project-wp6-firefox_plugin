import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import './DicomUploader.css';

const DicomUploader = () => {
  const [dicomImage, setDicomImage] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [error, setError] = useState(null);
  const [showPanel, setShowPanel] = useState(false);
  const [loading, setLoading] = useState(false);

  const { getRootProps, getInputProps } = useDropzone({
    accept: '.dcm',
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      const formData = new FormData();
      formData.append('file', file);

      setLoading(true);

      fetch('http://localhost:5000/upload_dicom', {
        method: 'POST',
        body: formData,
      })
        .then((response) => response.json())
        .then((data) => {
          setDicomImage(`data:image/png;base64,${data.image}`);
          setMetadata(data.metadata);
          setLoading(false);
        })
        .catch((error) => {
          console.error('Error uploading DICOM file:', error);
          setError(`Failed to upload DICOM file. Error: ${error.message}`);
          setLoading(false);
        });
    },
  });

  const handleTogglePanel = () => {
    setShowPanel(!showPanel);
  };

  return (
    <div className="container">
      <div className="metadata-panel">
        <h3>Full Metadata</h3>
        {metadata && (
          <div>
            <p><strong>Patient Name:</strong> {metadata.patientName}</p>
            <p><strong>Birth Date:</strong> {metadata.patientBirthDate}</p>
            <p><strong>Sex:</strong> {metadata.patientSex}</p>
            <p><strong>Study Date:</strong> {metadata.studyDate}</p>
            <p><strong>Modality:</strong> {metadata.modality}</p>
            <p><strong>Institution:</strong> {metadata.institutionName}</p>
            <button className="toggle-extra-metadata" onClick={handleTogglePanel}>
              {showPanel ? 'Hide More Metadata' : 'Show More Metadata'}
            </button>
            {showPanel && (
              <div className="metadata-panel show">
                {/* Additional metadata details */}
                <p><strong>Patient Name:</strong> {metadata.patientName}</p>
          <p><strong>Patient ID:</strong> {metadata.patientID}</p>
          <p><strong>Study Date:</strong> {metadata.studyDate}</p>
          <p><strong>Modality:</strong> {metadata.modality}</p>
          <p><strong>Patient Birth Date:</strong> {metadata.patientBirthDate}</p>
          <p><strong>Patient Sex:</strong> {metadata.patientSex}</p>
          <p><strong>Institution Name:</strong> {metadata.institutionName}</p>
          <p><strong>Series Description:</strong> {metadata.seriesDescription}</p>
          <p><strong>Study Instance UID:</strong> {metadata.studyInstanceUID}</p>
          <p><strong>Series Instance UID:</strong> {metadata.seriesInstanceUID}</p>
          <p><strong>SOP Instance UID:</strong> {metadata.sopInstanceUID}</p>
          <p><strong>SOP Class UID:</strong> {metadata.sopClassUID}</p>
          <p><strong>Transfer Syntax UID:</strong> {metadata.transferSyntaxUID}</p>
          <p><strong>Instance Number:</strong> {metadata.instanceNumber}</p>
          <p><strong>Photometric Interpretation:</strong> {metadata.photometricInterpretation}</p>
          <p><strong>Samples per Pixel:</strong> {metadata.samplesPerPixel}</p>
          <p><strong>Pixel Representation:</strong> {metadata.pixelRepresentation}</p>
          <p><strong>Columns:</strong> {metadata.columns}</p>
          <p><strong>Rows:</strong> {metadata.rows}</p>
          <p><strong>Bits Allocated:</strong> {metadata.bitsAllocated}</p>
          <p><strong>Bits Stored:</strong> {metadata.bitsStored}</p>
          <p><strong>Pixel Spacing:</strong> {metadata.pixelSpacing}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="drop-viewer">
        <h2>Simple Testing Interface</h2>
        <div {...getRootProps({ className: 'dropzone' })}>
          <input {...getInputProps()} />
          <p>Drag & drop a DICOM file here, or click to select one</p>
        </div>
        {error && <p className="error">{error}</p>}
        {loading && <div className="loading-spinner"></div>}

        {dicomImage && !loading && (
          <div className="viewer">
            <div className="center-image">
              <h3>DICOM Rendered Image</h3>
              <img src={dicomImage} alt="DICOM Preview" className="dicom-image" />
            </div>
          </div>
        )}
      </div>

      <div className="right-results">
              <h3>Analysis Results</h3>
              <div className="model-card">
                <h4>Pneumonia</h4>
                <p>Result: <span className="suspicious">Suspicious</span></p>
                <p>Confidence: 87%</p>
              </div>
              <div className="model-card">
                <h4>Tuberculosis</h4>
                <p>Result: <span className="not-suspicious">Not Suspicious</span></p>
                <p>Confidence: 92%</p>
              </div>
              <div className="model-card">
                <h4>Lung Cancer</h4>
                <p>Result: <span className="not-suspicious">Not Suspicious</span></p>
                <p>Confidence: 95%</p>
              </div>
              <div className="model-card">
                <h4>Bronchitis</h4>
                <p>Result: <span className="suspicious">Suspicious</span></p>
                <p>Confidence: 78%</p>
              </div>
            </div>
    </div>
  );
};

export default DicomUploader;
