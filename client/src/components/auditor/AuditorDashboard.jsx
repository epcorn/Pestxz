import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { useNavigate } from "react-router-dom";
import { useGetAuditReportQuery } from "@/redux/auditorSlice";
import { Card } from "../ui/card";
import { dateFormat } from "@/utils/helperFunctions";
import {
  Calendar,
  User,
  CheckSquare,
  MapPin,
  Building2,
  X,
} from "lucide-react";
import Pagination from "@/pages/Pagination";
import { useDispatch, useSelector } from "react-redux";
import { toggleModal } from "@/redux/helperSlice";
import { AlertMessage } from "..";
import { Skeleton } from "../ui/skeleton";

function AuditorDashboard() {
  const [page, setPage] = useState(1);
  const dispatch = useDispatch();
  const { isModalOpen } = useSelector((store) => store.helper);

  const limit = 15;
  const navigate = useNavigate();
  const { data, error, isLoading } = useGetAuditReportQuery({ limit, page });

  console.log(data)
  if (error) return <AlertMessage>{error.data.msg || error.msg}</AlertMessage>



  return (
    <div className="max-w-7xl h-full mx-auto space-y-6 p-4">
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
          onClick={() => navigate("/auditor/form")}
          className="bg-slate-900 hover:bg-slate-800 text-white shadow">
          New Inspection
        </Button>
      </header>

      <div className="space-y-3 h-full">
        <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">
          Recent Audit Logs
        </h2>

        {isLoading ?
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} className="h-32 bg-black" />
            ))}
          </div> :
          data.success && data?.audits?.map((d) => {
            const modalKey = `audit_${d._id}`;

            return (
              <React.Fragment key={d?._id}>
                <Card
                  onClick={() =>
                    dispatch(toggleModal({ name: modalKey, status: true }))
                  }
                  className="bg-neutral-900 border border-slate-200 hover:border-slate-300 shadow-sm group transition-all duration-200 overflow-hidden hover:bg-neutral-800">

                  <div className="p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center transition-all">
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
                        <h3 className="font-semibold text-white text-sm transition-all">
                          {d?.clientName || d?.client?.name}
                        </h3>
                      </div>
                      <div className="flex flex-col items-start gap-2 text-xs text-slate-500">
                        <p className="capitalize flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          {d?.site || "N/A"}
                        </p>
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
                      <span>{d?.auditor?.name || ""}</span>
                    </div>

                    {/* 4. Checkpoints Stat Badge */}
                    <div className="md:col-span-2 flex justify-start md:justify-end">
                      <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                        <div className="text-right">
                          <div className="text-xs font-bold text-slate-800">
                            {d.summary.total} Checkpoints
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {d.summary.yes} Issues / {d.summary.no} Passes
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
                {/* Modal sibling to Card */}
                {isModalOpen?.[modalKey] && (
                  <AuditDetails
                    isOpen={Boolean(isModalOpen?.[modalKey])}
                    onClose={() => dispatch(toggleModal({ name: modalKey, status: false }))}
                    data={d}
                  />
                )}
              </React.Fragment>
            );
          })}
      </div>
      <Pagination
        page={page}
        setPage={setPage}
        totalPages={data?.totalPage}
        sessionKey="auditor"
      />
    </div>
  );
}

export default AuditorDashboard;

function AuditDetails({ isOpen, onClose, data }) {
  useEffect(() => {
    const handleClose = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      document.documentElement.style.overflow = "hidden";
      window.addEventListener("keydown", handleClose);
    }

    return () => {
      window.removeEventListener("keydown", handleClose);
      document.documentElement.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const renderImages = (images) => {
    if (!images || (Array.isArray(images) && images.length === 0)) {
      return <span className="text-slate-500 text-xs font-semibold">No media</span>;
    }

    const imgList = Array.isArray(images) ? images : [images];

    return (
      <div className="flex flex-wrap gap-1.5 items-center">
        {imgList.map((url, i) => (
          <a
            key={i}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-block border-2 border-slate-900 rounded overflow-hidden hover:opacity-90"
          >
            <img
              src={url}
              alt={`Evidence ${i + 1}`}
              className="h-10 w-10 object-cover"
            />
          </a>
        ))}
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Main Modal Container */}
      <div
        className="bg-white w-full max-w-5xl h-[85vh] flex flex-col rounded-lg border-2 border-slate-900 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Dark Primary Modal Header */}
        <header className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white shrink-0">
          <h2 className="text-lg font-bold">
            {data?.clientName || data?.client?.name} —{" "}
            <span className="text-slate-300 font-medium">{data?.site}</span>
          </h2>
          <button
            onClick={onClose}
            type="button"
            className="text-slate-300 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto p-5 space-y-8 bg-white">
          {data?.sections?.map((sec) =>
            sec.section === "Audit Risk Scoring Matrix" || sec.sectionId === "arsm6" ? (
              <div key={sec?._id || "arsm"} className="space-y">
                <h3 className="text-md font-bold text-white bg-slate-900 px-4 py-2 rounded-t-md uppercase tracking-wide">
                  {sec?.section || sec?.title}
                </h3>
                <div className="overflow-x-auto rounded-b-md border-2 border-slate-900 bg-white">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-slate-800 text-white text-xs font-bold uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3 border-r border-slate-700">Categories</th>
                        <th className="px-4 py-3 border-r border-slate-700">Points</th>
                        <th className="px-4 py-3">Achieved</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300 font-medium text-slate-900">
                      {sec?.categories?.map((cat) => (
                        <tr key={cat?._id} className="hover:bg-slate-100">
                          <td className="px-4 py-3 font-semibold border-r border-slate-200">
                            {cat?.category}
                          </td>
                          <td className="px-4 py-3 border-r border-slate-200">{cat?.points}</td>
                          <td className="px-4 py-3 font-bold">{cat?.achieved}</td>
                        </tr>
                      ))}
                      <tr className="bg-slate-200 font-bold text-slate-900 border-t-2 border-slate-900">
                        <td className="px-4 py-3 border-r border-slate-300">Total</td>
                        <td className="px-4 py-3 border-r border-slate-300">{sec?.totalPoints}</td>
                        <td className="px-4 py-3">{sec?.totalAchieved}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div key={sec?._id || sec?.section} className="space-y- bg-white">
                {/* Section Header */}
                <div className="flex items-center justify-between bg-slate-900 text-white px-4 py-2.5 rounded-t-md sticky top-0 z-10 ">
                  <h3 className="text-md font-bold uppercase tracking-wide">
                    {sec?.section}
                  </h3>
                  {sec?.questions && (
                    <span className="bg-white text-slate-900 text-xs px-2.5 py-0.5 rounded font-bold">
                      {sec?.questions?.length} Items
                    </span>
                  )}
                </div>

                {/* Table Component */}
                <div className="border-2 border-slate-900 rounded-b-md overflow-x-auto bg-white">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-slate-800 text-white border-b-2 border-slate-900 sticky top-0 z-5">
                      <tr>
                        <th className="p-3 w-12 text-center font-bold border-r border-slate-700">
                          Sr.
                        </th>
                        <th className="p-3 w-[30%] font-bold border-r border-slate-700">
                          Questions
                        </th>
                        <th className="p-3 w-28 font-bold border-r border-slate-700">
                          Observation
                        </th>
                        <th className="p-3 w-28 font-bold border-r border-slate-700">
                          Images
                        </th>
                        <th className="p-3 font-bold border-r border-slate-700">
                          Comments
                        </th>
                        <th className="p-3 font-bold">Suggestions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300 text-slate-900 font-medium">
                      {sec?.questions?.map((que, idx) => (
                        <tr key={que.id || idx} className="hover:bg-slate-100">
                          <td className="p-3 text-center align-top border-r border-slate-200">
                            {idx + 1}
                          </td>
                          <td className="p-3 align-top font-semibold border-r border-slate-200">
                            {que?.question}
                          </td>
                          <td className="p-3 align-top border-r border-slate-200">
                            <span
                              className={`inline-block px-2 py-0.5 text-xs font-bold uppercase rounded ${que?.checks === "yes"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-600"
                                : "bg-red-100 text-red-800 border border-red-600"
                                }`}
                            >
                              {que?.checks === "yes" ? "Passed" : "Failed"}
                            </span>
                          </td>
                          <td className="p-3 align-top border-r border-slate-200">
                            {renderImages(que?.images)}
                          </td>
                          <td className="p-3 align-top text-xs border-r border-slate-200 text-slate-800">
                            {que?.comment || "-"}
                          </td>
                          <td className="p-3 align-top text-xs text-slate-800">
                            {que?.recommendation || que?.suggetions || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Section Footer Summary Bar */}
                <div className="bg-slate-100 border border-slate-900 px-4 py-2 rounded-md font-bold text-xs text-slate-900 flex gap-4 items-center">
                  <span>
                    Passed:{" "}
                    <strong className="text-emerald-700 text-sm">
                      {sec?.summary?.yes || 0}
                    </strong>
                  </span>
                  <span>
                    Failed:{" "}
                    <strong className="text-red-700 text-sm">
                      {sec?.summary?.no || 0}
                    </strong>
                  </span>
                  <span>
                    Total Checkpoints:{" "}
                    <strong className="text-slate-900 text-sm">
                      {sec?.summary?.total || 0}
                    </strong>
                  </span>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}