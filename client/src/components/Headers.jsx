import React, { useEffect, useState } from 'react'

function Headers({ header, user }) {
  
  return (
    <header className="w-full border-b mb-2 px-6 py-2 sm:px-5">
       <div className="flex gap-4 items-center justify-between">

        {/* Left Column: Title & Description */}
        <div className="space-y-1">
          <h1 className="h3 font-bold tracking-tight text-slate-900 h">
            {header || ""}
          </h1>
        </div>

        {/* Right Column: User Profile Badge */}
        <div className="flex border-t border-slate-100 sm:border-t-0 sm:pt-0 text-right flex-col items-end">
          <h2 className="text-lg font-normal text-slate-700 sm:text-xl">
            Hello, <span className="font-semibold capitalize text-sky-600">{user?.name || ""}</span>
          </h2>
          <span className="inline-flex items-center rounded-md bg-sky-50/50 px-2.5 py-1 text-xs font-medium tracking-wide text-sky-700 ring-1 ring-inset ring-sky-700/10 capitalize">
            {user?.role === "ClientAdmin" ? "Admin" : user?.role || ""}
          </span>
        </div>

      </div>

      
    </header>

  )
}

export default Headers