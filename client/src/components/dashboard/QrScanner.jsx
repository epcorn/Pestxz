import React, { useEffect, useState } from 'react'
import { MdOutlineQrCodeScanner } from "react-icons/md";
import { Html5QrcodeScanner } from 'html5-qrcode';

function QrScanner() {

  // State to manage scanner visibility and the final result
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

    // Turn off camera tracking if the user manually hits close / back steps
    return () => {
      scanner.clear().catch(err => console.error("Clean up failure", err));
    };
  }, [isScanning]);
  return (
    <div>
      <div className='mt-10 text-center'>
        <p className='text-gray-600 font-medium mb-2'>Scan QR Code</p>

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

export default QrScanner