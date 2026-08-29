import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { useNavigate } from "react-router-dom";
import { useGetAuditReportQuery, useLazyGeneratePPTXQuery } from "@/redux/auditorSlice";
import { dateFormat } from "@/utils/helperFunctions";
import { Building2, FileChartLine, LoaderCircle, X } from "lucide-react";
import Pagination from "@/pages/Pagination";
import { useDispatch, useSelector } from "react-redux";
import { toggleModal } from "@/redux/helperSlice";
import { AlertMessage } from "..";
import { Skeleton } from "../ui/skeleton";
import { toast } from "react-toastify";


function AuditorDashboard() {
  const [page, setPage] = useState(1);
  const dispatch = useDispatch();
  const { isModalOpen } = useSelector((store) => store.helper);
  const [activeId, setActiveId] = useState(null);

  const limit = 15;
  const navigate = useNavigate();
  const { data, error, isLoading } = useGetAuditReportQuery({ limit, page });
  const [generatePPt, { isLoading: pptLoading, error: pptError }] = useLazyGeneratePPTXQuery()

  const handleGeneratePPT = async (e, auditId) => {
    e.preventDefault();
    e.stopPropagation();

    setActiveId(auditId);
    try {
      // 1. Unwrap the raw Blob response
      const blob = await toast.promise(
        generatePPt(auditId).unwrap(),
        {
          pending: "Generating presentation...",
          success: "PPT generated successfully!",
          error: "Failed to generate PPT presentation.",
        }
      );
      // 2. Create a download link for the Blob
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Audit_Report_${auditId}.pptx`);
      document.body.appendChild(link);
      link.click();
      // 3. Clean up memory
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PPT generation error:", error);
    } finally {
      setActiveId(null);
    }
  };

  if (error) {

    return (
      <AlertMessage>
        {error?.data?.msg || error?.msg || "Failed to fetch dashboard records"}
      </AlertMessage>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4 min-h-screen">
      {/* Dashboard Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
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
          className="bg-slate-900 hover:bg-slate-800 text-white shadow font-semibold"
        >
          + New Inspection
        </Button>
      </header>

      {/* Main Content Area */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Recent Audit Logs
        </h2>

        {isLoading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} className="h-14 w-full bg-slate-200 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="border border-slate-300 rounded-lg overflow-hidden bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-slate-900 text-white text-xs uppercase tracking-wider">
                  <tr>
                    <th className="p-3 font-semibold">Date</th>
                    <th className="p-3 font-semibold">Client Info</th>
                    <th className="p-3 font-semibold text-center">Compliance</th>
                    <th className="p-3 font-semibold">Auditor</th>
                    <th className="p-3 font-semibold text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800 font-medium">
                  {data?.success && data?.audits?.length > 0 ? (
                    data?.audits?.map((d) => {
                      if (!d) return null;
                      const modalKey = `audit_${d._id}`;
                      const clientDisplayName =
                        d?.clientType === "new"
                          ? d?.clientName
                          : d?.client?.name || d?.clientName || "N/A";
                      const passRate =
                        d?.sections[5]?.totalAchieved || 0

                      return (
                        <React.Fragment key={d._id}>
                          <tr className="hover:bg-slate-50 transition-colors" onClick={() =>
                            dispatch(
                              toggleModal({ name: modalKey, status: true })
                            )
                          }>
                            <td className="p-3 text-slate-600 whitespace-nowrap">
                              {dateFormat(d?.inspectionDate)}
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-2.5">
                                <div className="p-1.5 bg-slate-100 rounded text-slate-700">
                                  <Building2 className="w-4 h-4" />
                                </div>
                                <div className="text-sm">
                                  <span className="font-bold text-slate-900 block">
                                    {clientDisplayName}
                                  </span>
                                  <span className="text-xs text-slate-500">
                                    {d?.site || "N/A"}{" "}
                                    {d?.siteType && (
                                      <span className="ml-1.5 bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded uppercase font-semibold">
                                        {d?.siteType || ""}
                                      </span>
                                    )}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              <div className="w-24 bg-slate-200 h-3 rounded-full overflow-hidden mx-auto flex items-center">
                                <div
                                  className={`h-full ${passRate >= 75
                                    ? "bg-emerald-600"
                                    : passRate >= 50
                                      ? "bg-amber-500"
                                      : "bg-red-600"
                                    }`}
                                  style={{ width: `${passRate}%` }}
                                />
                              </div>
                              <span className="text-[11px] font-bold text-slate-600 mt-1 block">
                                {passRate}% Passed
                              </span>
                            </td>
                            <td className="p-3 font-semibold text-slate-700">
                              {d?.auditor?.name || "N/A"}
                            </td>
                            <td className="p-3 text-center">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={pptLoading && activeId === d._id}
                                onClick={(e) => handleGeneratePPT(e, d._id)}
                                className="border-slate-300 text-slate-700 hover:bg-slate-900 hover:text-white transition-colors gap-1 text-xs"
                              >
                                {activeId === d._id ? <LoaderCircle className="animate-spin" /> : <span className="flex items-center gap-2"><FileChartLine /> PPT</span>}
                              </Button>
                            </td>
                          </tr>

                          {/* Detail Modal Component */}
                          {isModalOpen?.[modalKey] && (
                            <AuditDetails
                              isOpen={Boolean(isModalOpen?.[modalKey])}
                              onClose={() =>
                                dispatch(
                                  toggleModal({ name: modalKey, status: false })
                                )
                              }
                              data={d}
                            />
                          )}
                        </React.Fragment>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan="5"
                        className="p-6 text-center text-slate-500 text-sm font-medium"
                      >
                        No audit reports available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Pagination Footer */}
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
                              className={`inline-block px-2 py-0.5 text-xs font-bold uppercase rounded ${que?.checks === "No"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-600"
                                : "bg-red-100 text-red-800 border border-red-600"
                                }`}
                            >
                              {que?.checks === "No" ? "Passed" : "Failed"}
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