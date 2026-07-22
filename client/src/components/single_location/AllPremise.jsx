import React from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { List } from 'react-window';
import { useAllLocationsQuery } from '../../redux/locationSlice';

const ROW_HEIGHT = 60; // adjust to match your padding/line-height

function AllPremise({ today }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: locations = {}, isLoading } = useAllLocationsQuery({ id }, { skip: !id });

  const day = (val) => {
    return val !== null && val !== undefined ? new Date(val).toISOString().split("T")[0] : "";
  };

  const targetToday = day(today);

  const allPremiseSchedules = locations?.locations?.filter(l =>
    l?.service?.some(ser =>
      ser?.schedule?.some(sc => day(sc?.date) === targetToday)
    )
  ) || [];
  // Precompute row data once, instead of recalculating inside every row render
  const rows = allPremiseSchedules?.map((p, index) => {
    const servicesToday = p?.service?.filter(ser =>
      ser?.schedule?.some(sc => day(sc.date) === targetToday)
    ) || [];

    const todaySchedules = p?.service?.flatMap(ser =>
      ser.schedule?.filter(sc => day(sc.date) === targetToday) || []
    ) || [];

    const totalCount = todaySchedules?.length;
    const completedCount = todaySchedules?.filter(sc => sc?.completed)?.length;
    const allDone = totalCount > 0 && completedCount === totalCount;
    const partialDone = completedCount > 0 && completedCount < totalCount;

    let rowBg = "";
    if (allDone) rowBg = "bg-green-300 font-semibold text-green-800";
    else if (partialDone) rowBg = "bg-yellow-300 text-yellow-800";

    return {
      key: p._id,
      id: p._id,
      index: index + 1,
      location: `${p.floor ? `${p.floor}, ` : ""}${p.location}${p.subLocation ? `, ${p.subLocation}` : ""}`,
      serviceNames: servicesToday.map(s => s.serviceName).join(", "),
      completedCount,
      totalCount,
      allDone,
      partialDone,
      rowBg,
    };
  });

  // Row renderer for react-window v2 — receives style + index directly
  const Row = ({ index, style, rows }) => {
    const r = rows[index];
    return (
      <Link to={`/location/${r.id}`} replace>
        <div
          style={style}
          // onClick={() => navigate(`/location/${r.id}`, { replace: true })}
          className={`flex items-center border-b border-slate-300 ${r.rowBg} hover:opacity-80 transition-colors text-sm text-slate-700`}
        >
          <div className="py-3 px-2 text-center font-medium w-[8%]">{r.index}</div>
          <div className="py-3 px-2 w-[30%]">{r.location}</div>
          <div className="py-3 px-2 font-medium w-[32%]">{r.serviceNames}</div>
          <div className="text-center py-3 px-2 w-[30%]">
            <div className="flex flex-col gap-0.5">
              <span className={`text-xs font-bold uppercase tracking-wider ${r.allDone ? "text-green-600" : r.partialDone ? "text-gray-600" : "text-red-600"}`}>
                {r.allDone ? "Completed" : r.partialDone ? "Partially Done" : "Pending"}
              </span>
              <span className="text-xs text-slate-500 font-semibold">
                {r.completedCount} / {r.totalCount} services
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  };

  if (isLoading) {
    return <div className="py-10 text-center text-sm text-slate-500">Loading schedules...</div>;
  }

  return (
    <section className="bg-white rounded-md overflow-auto select-none min-w-[600px]">
      {/* Header stays a plain flex row, outside the virtualized list */}
      <div className="flex items-center border-b bg-gray-200 font-semibold text-slate-900 text-sm ">
        <div className="py-3 px-2 text-center w-[8%]">No.</div>
        <div className="py-3 px-2 w-[30%]">Location</div>
        <div className="py-3 px-2 w-[32%]">Service name</div>
        <div className="text-center py-3 px-2 w-[30%]">Status</div>
      </div>

      {rows.length === 0 ? (
        <div className="py-10 text-center text-slate-500 font-medium">
          No Service Due for today
        </div>
      ) : (
        <List
          rowComponent={Row}
          rowCount={rows.length}
          rowHeight={ROW_HEIGHT}
          rowProps={{ rows }}
          style={{ height: Math.min(384, rows.length * ROW_HEIGHT) }} // 384px ≈ max-h-96
        />
      )}
    </section>
  );
}

export default AllPremise;