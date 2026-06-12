import React from 'react'

function RightsIcon({ initialRights }) {
  const permissionsList = [
    { key: 'raise', label: 'Raise', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { key: 'close', label: 'Close', color: 'bg-rose-50 text-rose-700 border-rose-200' },
    { key: 'scan_Scheduled', label: 'Sched. Scan', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    { key: 'scan_Unscheduled', label: 'Unsched. Scan', color: 'bg-sky-50 text-sky-700 border-sky-200' },
    { key: 'delete', label: 'Delete', color: 'bg-red-50 text-red-700 border-red-200' },
    { key: 'addData', label: 'Add Data', color: 'bg-red-50 text-red-700 border-red-200' },
  ];

  const activePermissions = permissionsList.filter(p => initialRights?.[p.key]);

  return (
    <div className="w-full flex justify-center py-1">
      <div className="flex flex-wrap gap-1 justify-center">
        {activePermissions.length > 0 ? (
          activePermissions.map((permission) => (
            <span
              key={permission.key}
              className={`px-1.5 py-0.5 text-xs font-bold border rounded-md whitespace-nowrap ${permission.color}`}
              title={permission.label}
            >
              {permission.label}
            </span>
          ))
        ) : (
          <span className="text-[11px] text-neutral-400 italic">
            None
          </span>
        )}
      </div>
    </div>
  )
}

export default RightsIcon
