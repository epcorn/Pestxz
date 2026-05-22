import React from 'react'

function RightsIcon({ initialRights }) {
  const permissionsList = [
    { key: 'raise', label: 'Raise', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { key: 'close', label: 'Close', color: 'bg-rose-50 text-rose-700 border-rose-200' },
    { key: 'scan_Scheduled', label: 'Sched. Scan', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    { key: 'scan_Unscheduled', label: 'Unsched. Scan', color: 'bg-sky-50 text-sky-700 border-sky-200' },
  ];

  const activePermissions = permissionsList.filter(p => initialRights?.[p.key]);

  return (
    <div className="w-full flex justify-center py-1">
      <div className="grid grid-cols-2 gap-1 w-3xs text-center">
        {activePermissions.length > 0 ? (
          activePermissions.map((permission) => (
            <span
              key={permission.key}
              className={`px-1.5 py-0.5 text-xs font-bold border rounded-md ${permission.color}`}
              title={permission.label}
            >
              {permission.label}
            </span>
          ))
        ) : (
          <span className="col-span-2 text-[11px] text-neutral-400 italic text-center block w-full">
            None
          </span>
        )}
      </div>
    </div>
  )
}

export default RightsIcon
