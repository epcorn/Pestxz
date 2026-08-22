import React from 'react';
import { Button } from '../ui/button';
import { useNavigate } from 'react-router-dom';
import { useGetAuditReportQuery } from '@/redux/auditorSlice';
import { Card } from '../ui/card';
import { dateFormat } from '@/utils/helperFunctions';
import { Calendar, User, CheckSquare, MapPin, Building2 } from 'lucide-react';

function AuditorDashboard() {
  const navigate = useNavigate();
  const { data } = useGetAuditReportQuery();

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4">
      <header className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            AUDIT DASHBOARD
          </h1>
          <p className="text-sm text-slate-500">
            Overview of recent site inspection records and compliance reports.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => navigate('/auditor/form')}
          className="bg-slate-900 hover:bg-slate-800 text-white shadow"
        >
          New Inspection
        </Button>
      </header>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">
          Recent Audit Logs
        </h2>

        {data?.map((d) => {
          // Calculate summary per record dynamically
          const recordSummary = d?.sections?.reduce(
            (acc, val) => {
              acc.yes += val.summary?.yes || 0;
              acc.no += val.summary?.no || 0;
              acc.total += val.summary?.total || 0;
              return acc;
            },
            { yes: 0, no: 0, total: 0 }
          ) || { yes: 0, no: 0, total: 0 };

          return (
            <Card
              key={d?._id}
              className="bg-black border border-slate-200 hover:border-slate-300 shadow-sm group transition-all duration-200 overflow-hidden"
            >
              <div className="p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                
                {/* 1. Date & Time */}
                <div className="md:col-span-3 flex items-center gap-2 text-white">
                  <Calendar className="w-4 h-4 text-white shrink-0" />
                  <span className="text-sm font-medium">
                    {dateFormat(d?.inspectionDate) || "N/A"}
                  </span>
                </div>

                {/* 2. Client & Site Info */}
                <div className="md:col-span-4 space-y-1">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-white shrink-0" />
                    <h3 className="font-semibold text-white text-sm truncate hover:whitespace-normal hover:overflow-visible transition-all">
                      {d?.client?.name || "Unassigned Client"}
                    </h3>
                  </div>
                  <div className="flex flex-col items-start gap-2 text-xs text-slate-500">
                    <p className="capitalize flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {d?.site || "N/A"}</p>
                    {d?.siteType && (
                      <p className="bg-slate-100 text-slate-600 border px-1.5 py-0.5 rounded text-[0.7rem] uppercase font-mono">
                        {d?.siteType}
                      </p>
                    )}
                  </div>
                </div>

                {/* 3. Auditor Name */}
                <div className="md:col-span-3 flex items-center gap-2 text-white font-semibold text-center">
                  <User className="w-4 h-4 text-white shrink-0" />
                  <span>{d?.auditor?.name || "System"}</span>
                </div>

                {/* 4. Checkpoints Stat Badge */}
                <div className="md:col-span-2 flex justify-start md:justify-end">
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
                    <CheckSquare className="w-4 h-4 text-emerald-600" />
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-800">
                        {recordSummary.total} Checkpoints
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {recordSummary.yes} Issues / {recordSummary.no} Passes
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default AuditorDashboard;