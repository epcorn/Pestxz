import React, { useEffect, useState } from 'react';
import { useRunnerDataQuery } from '../redux/adminSlice';

function TickerTape() {
  const [stats, setStats] = useState({ lat: null, lon: null });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setStats({ lat, lon });
      });
    }
  }, []);

  const { data: runnerData, isLoading: runnerLoading } = useRunnerDataQuery(
    { lon: stats.lon, lat: stats.lat },
    { skip: !stats.lon || !stats.lat,refetchOnReconnect:true }
  );

  const temp = runnerData?.data?.environment?.temp;
  const humidity = runnerData?.data?.environment?.humidity;
  const pestData = runnerData?.data?.pests || [];

  if (runnerLoading || !runnerData) {
    return (
      <div className="flex items-center h-7 bg-slate-950 px-3 text-[10px] text-slate-400 font-mono w-full rounded-md border border-slate-800/60">
        <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping mr-2 shrink-0"></span>
        Loading live pest metrics...
      </div>
    );
  }

  return (
    <div className="flex items-center w-full h-7 bg-slate-950 border border-slate-800/80 rounded-lg overflow-hidden shadow-lg shadow-black/20">
      {/* Weather Info Section */}
      <div className="flex items-center gap-3 bg-slate-800 text-slate-200 h-full px-3 text-[10px] font-semibold border-r border-slate-700/60 shrink-0 tracking-wide font-mono">
        <p className="whitespace-nowrap flex items-center gap-1">
          <img src="/rain.gif" className='h-full w-4 rounded-full overflow-hidden' alt="" />
          <span className="text-amber-400 hidden">☀️</span> {Math.round(temp)}°C
        </p>
        <p className="whitespace-nowrap flex items-center gap-1">
          <span className="text-sky-400">💧</span> {humidity}%
        </p>
      </div>

      {/* Marquee Banner Slider */}
      <div className="flex-1 w-full text-slate-300 overflow-hidden select-none text-[11px] font-mono flex items-center">
        <div className="flex w-full overflow-hidden">
          <div className="flex flex-nowrap items-center whitespace-nowrap animate-marquee py-0.5">

            {/* First sequence pass */}
            {pestData.map((p, index) => (
              <span key={`p1-${index}`} className="flex items-center lowercase">
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${getAlertStyle(p.score)}`}>
                  <span className='capitalize'>{p.name}</span>: {p.score} - {p.level}
                </span>
                <span className="mx-3 text-slate-700 font-bold">•</span>
              </span>
            ))}

            {/* Second sequence pass for seamless infinite wrapping */}
            {pestData.map((p, index) => (
              <span key={`p2-${index}`} className="flex items-center lowercase">
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${getAlertStyle(p.score)}`}>
                  <span className='capitalize'>{p.name}</span>: {p.score} - {p.level}
                </span>
                <span className="mx-3 text-slate-700 font-bold">•</span>
              </span>
            ))}

          </div>
        </div>
      </div>
    </div>
  );
}

export default TickerTape;

// Enhanced Color Utility Functions
function getAlertStyle(score) {
  if (score >= 85) {
    // Very High: Balanced Premium Crimson Red
    return `bg-rose-950/60 text-rose-100 border-rose-800/80 shadow-sm shadow-rose-950/50 animate-pulse`;
  }
  if (score >= 65) {
    // High: Smooth Muted Orange/Amber
    return `bg-amber-950/40 text-amber-200 border-amber-800/60`;
  }
  if (score >= 40) {
    // Moderate: Calm Yellow/Slate Neutral
    return `bg-slate-900 text-slate-300 border-slate-700/50`;
  }
  // Low Risk: Healthy Emerald Green
  return `bg-emerald-950/40 text-emerald-400 border-emerald-900/40`;
}