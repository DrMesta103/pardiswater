'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const Scanner = dynamic(() => import('@yudiel/react-qr-scanner').then(mod => mod.Scanner), { ssr: false });

export default function ZoomableScanner({ onScan, onError, formats }) {
  const [zoom, setZoom] = useState(1);
  const [maxZoom, setMaxZoom] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      const video = document.querySelector('video');
      if (video && video.srcObject) {
        const track = video.srcObject.getVideoTracks()[0];
        if (track && track.getCapabilities) {
          const capabilities = track.getCapabilities();
          if (capabilities.zoom) {
            setMaxZoom(capabilities.zoom.max || 5);
          }
        }
        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const handleZoomChange = (e) => {
    const val = Number(e.target.value);
    setZoom(val);
    const video = document.querySelector('video');
    if (video && video.srcObject) {
      const track = video.srcObject.getVideoTracks()[0];
      if (track) {
        track.applyConstraints({ advanced: [{ zoom: val }] }).catch(err => {
          console.error("Zoom constraint failed:", err);
        });
      }
    }
  };

  return (
    <div className="w-full h-full relative">
      <Scanner 
        onScan={onScan}
        onError={onError}
        formats={formats}
      />
      {maxZoom > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-3/4 max-w-[200px] pointer-events-auto bg-black/60 backdrop-blur-md rounded-2xl px-4 py-3 flex items-center gap-3 z-50 shadow-xl">
          <span className="text-white text-[10px] font-bold shrink-0">1x</span>
          <input 
            type="range" 
            min="1" 
            max={maxZoom} 
            step="0.1" 
            value={zoom} 
            onChange={handleZoomChange}
            className="w-full accent-indigo-500 h-1.5 bg-gray-600 rounded-lg appearance-none outline-none" 
          />
          <span className="text-white text-[10px] font-bold shrink-0">{Math.round(maxZoom)}x</span>
        </div>
      )}
    </div>
  );
}
