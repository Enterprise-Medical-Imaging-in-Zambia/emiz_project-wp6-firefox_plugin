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

      // Start loading and clear existing data
      setLoading(true);
      setError(null);
      setDicomImage(null);
      setMetadata(null);

      fetch('http://localhost:5000/upload_dicom', {
        method: 'POST',
        body: formData,
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
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
      {/* Loading spinner while data is being fetched */}


      {/* Display metadata and image only when not loading */}
      {!loading && dicomImage && metadata && (
        <div className="metadata-panel">
          <h3>Basic Metadata</h3>
          <p><strong>Patient Name:</strong> {metadata.patientName}</p>
          <p><strong>Birth Date:</strong> {metadata.patientBirthDate}</p>
          <p><strong>Sex:</strong> {metadata.patientSex}</p>
          <p><strong>Modality:</strong> {metadata.modality}</p>
          <button className="toggle-extra-metadata" onClick={handleTogglePanel}>
            {showPanel ? 'Hide More Metadata' : 'Show More Metadata'}
          </button>

          {showPanel && (
            <div className="extra-metadata">
              <p><strong>Patient ID:</strong> {metadata.patientID}</p>
              {/* Additional metadata fields */}
              <p><strong>Patient ID:</strong> {metadata.patientID}</p>
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

      <div className="drop-viewer">
        <h2>Sample Testing Interface</h2>
        <div {...getRootProps({ className: 'dropzone' })}>
          <input {...getInputProps()} />
          <p>Drag & drop a DICOM file here, or click to select one</p>
          
        </div>
        {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
        </div>
      )}
        {error && <p className="error">{error}</p>}

        {!loading && dicomImage && (
          <div className="viewer">
            <div className="center-image">
              <h3>DICOM Rendered Image</h3>
              <img src={dicomImage} alt="DICOM Preview" className="dicom-image" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DicomUploader;
