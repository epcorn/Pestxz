import React from 'react'

function TickerTape() {
  const pestData = [
    { name: "Mosquito", risk: "60%" }, 
    { name: "Termite", risk: "70%" }, 
    { name: "Ant", risk: "40%" }
  ]
  const upcoming = [{ name: "Wasp" }]

  // Create a clean, flat array of text strings
  const tickerItems = [
    ...pestData.map(p => `${p.name}: ${p.risk} Risk`),
    ...upcoming.map(u => `Upcoming: ${u.name}`)
  ]

  return (
    <div className='w-full bg-slate-900 text-slate-300 py-1 overflow-hidden select-none border-y border-slate-800 text-[11px] font-mono'>
      <div className='flex w-full overflow-hidden'>
        
        {/* Animated conveyor row */}
        <div className='flex flex-nowrap items-center whitespace-nowrap animate-marquee'>
          
          {/* First sequence pass */}
          {tickerItems.map((text, index) => (
            <span key={`p1-${index}`} className="flex items-center">
              {text}
              <span className="mx-4 text-slate-600">•</span>
            </span>
          ))}
          
          {/* Second sequence pass for seamless infinite wrapping */}
          {tickerItems.map((text, index) => (
            <span key={`p2-${index}`} className="flex items-center">
              {text}
              <span className="mx-4 text-slate-600">•</span>
            </span>
          ))}

        </div>

      </div>
    </div>
  )
}

export default TickerTape
