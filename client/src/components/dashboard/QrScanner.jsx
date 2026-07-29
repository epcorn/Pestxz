import React, { useEffect, useState } from 'react'
import { MdOutlineQrCodeScanner } from "react-icons/md";
import { useSelector } from 'react-redux';
import Headers from '../Headers';

import { Scanner } from "@yudiel/react-qr-scanner";
import { useNavigate } from 'react-router-dom';
import Button from '../Button';

function QrScanner() {
  const { user } = useSelector(store => store.helper)
  const navigate = useNavigate()
  return (
    <div>
      <Headers header={"Scanner"} user={user} />

      <QrScannerSimple Scanner={Scanner} />

    </div>
  )
}

export default QrScanner


function QrScannerSimple({ Scanner }) {
  const [startScan, setStartScan] = useState(true);
  const [scannedData, setScannedData] = useState(null);
  const [deniedError, setDeniedError] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const btnStyle = { padding: "10px 20px", background: "#007bff", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer" };

  const handleError = (error) => {
    if (error?.name === "NotAllowedError" || error?.type === "permission-denied") {
      setDeniedError(true);
      setStartScan(false);
    }
  };

  const handleScan = (data) => {
    if (data?.[0]?.rawValue) {
      setScannedData(data[0].rawValue);
      setStartScan(false); // Stop scanning once data is caught
      setShowModal(true);   // Open the confirmation modal
    }
  };
  if (scannedData) {
    window.location.href = scannedData;
  }

  const handleOpenLink = () => {
    if (scannedData) {
      window.location.href = scannedData;
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setScannedData(null);
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      {!startScan && !deniedError && (
        <button onClick={() => setStartScan(true)} style={btnStyle}>
          Enable Camera & Scan Qr Code
        </button>
      )}

      {startScan && (
        <div style={{ width: "300px", margin: "0 auto" }}>
          <Scanner
            onScan={handleScan}
            onError={handleError}
          />
        </div>
      )}

      {/* Modal renders securely based on showModal state */}
      {showModal && (
        <div className='fixed inset-0 bg-black/20 z-50 content-center h-dvh w-dvw '>
          <div className='p-5 rounded-lg mx-auto bg-white max-w-sm '>
            <h3 className='text-lg font-semibold '>Scanned Url</h3>
            <p className='wrap-break-word mb-3 text-cyan-600 underline'>{scannedData}</p>
            <Button label={"Open"} onClick={handleOpenLink} />
            <Button label={"Close"} onClick={handleCloseModal} />
          </div>
        </div>
      )}

      {deniedError && (
        <div style={{ color: "red", marginTop: "15px" }}>
          <p>⚠️ Camera access was blocked.</p>
          <p style={{ fontSize: "14px", color: "#555" }}>
            Please click the <strong>lock icon 🔒</strong> in your URL bar and change Camera permissions to <strong>Allow</strong>, then refresh.
          </p>
          <button onClick={() => setDeniedError(false)} style={btnStyle}>Try Again</button>
        </div>
      )}
    </div>
  );
}



