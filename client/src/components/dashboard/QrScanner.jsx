import React, { useEffect, useState } from 'react'
import { MdOutlineQrCodeScanner } from "react-icons/md";
import { Html5QrcodeScanner } from 'html5-qrcode';
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


const btnStyle = { padding: "10px 20px", background: "#007bff", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer" };


function HTML5Qrscnanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState('');

  useEffect(() => {
    if (scanResult) {
      window.location.replace(scanResult)
    }
  }, [scanResult])
  useEffect(() => {
    // Only initialize the scanner if the user opens the modal layout
    if (!isScanning) return;

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0
    };

    const scanner = new Html5QrcodeScanner("reader", config, false);

    const onSuccess = (decodedText) => {
      setScanResult(decodedText);
      setIsScanning(false); // Auto-close camera UI on successful parse
      scanner.clear().catch(err => console.error("Scanner clear failed", err));
    };


    const onFailure = (error) => {
      // Quietly handle frame evaluation misses
    };

    scanner.render(onSuccess, onFailure);

    return () => {
      scanner.clear().catch(err => console.error("Clean up failure", err));
    };
  }, [isScanning]);
  return (
    <div>
      <div className='mt-10 text-center'>
        <p className='text-gray-700 font-medium mb-2'>Scan QR Code</p>

        {/* Interactive Icon Button to trigger camera access */}
        <button
          onClick={() => setIsScanning(true)}
          className='text-[10rem] text-blue-600 hover:text-blue-700 transition-colors mx-auto flex justify-center focus:outline-none'
          title="Open Scanner"
        >
          <MdOutlineQrCodeScanner />
        </button>
      </div>

      {/* Camera Scanning Overlay Screen */}
      {isScanning && (
        <div className='fixed inset-0 bg-black bg-opacity-80 z-50 flex flex-col justify-center p-4 animate-fadeIn'>
          <div className='bg-white rounded-xl p-5 shadow-2xl relative w-full max-w-sm mx-auto'>

            <div className='flex justify-between items-center mb-4'>
              <h3 className='font-bold text-lg text-gray-800'>Align QR Code</h3>
              <button
                onClick={() => setIsScanning(false)}
                className='text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-1 px-3 rounded-md transition-colors'
              >
                Close
              </button>
            </div>

            {/* Target anchor container where html5-qrcode framework attaches native canvas feed */}
            <div id="reader" className='w-full overflow-hidden rounded-lg'></div>
          </div>
        </div>
      )}

      {/* Render Scan Results Output View */}
      {scanResult && (
        <div className='mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-center animate-slideUp'>
          <p className='text-green-700 font-bold mb-1'>Scanned Code Output:</p>
          <p className='text-gray-800 break-all bg-white p-2 rounded border text-sm shadow-inner font-mono'>
            {scanResult}
          </p>
          <button
            onClick={() => setScanResult('')}
            className='mt-3 text-xs text-blue-600 underline font-semibold hover:text-blue-800'
          >
            Clear Result
          </button>
        </div>
      )}
    </div>
  )
}