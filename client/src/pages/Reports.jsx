import { useState } from "react";
import { Button } from "../components";
import { useDailyServiceReportQuery } from "../redux/serviceSlice";
import { useEffect } from "react";
import { toast } from "react-toastify";
import { saveAs } from "file-saver";
import { useGetSingleUserQuery } from "../redux/userSlice";
import { useSelector } from "react-redux";
import { useGetSingleClientQuery } from "../redux/clientSlice";

const Reports = () => {
  const [genrate, setGenrate] = useState(false);
  const [visible, setVisible] = useState(false)
  const [value, setValue] = useState("all");
  const { user } = useSelector(store => store.helper);

  const { data: reports, isLoading: reportLoading } = useDailyServiceReportQuery(value, { skip: !genrate });
  const { data: client } = useGetSingleClientQuery(user?.client, { skip: !user?.client })

  useEffect(() => {
    if (reports && !reportLoading) {
      setGenrate(false);
      toast.success("Report generated successfully");
    }
  }, [reports, reportLoading]);
  console.log(client)
  const handleGenerate = () => {
    setGenrate(true);
    setVisible(true)
  };

  const handleDownload = () => {
    if (!reports?.files?.length) return;

    reports.files.forEach(({ client, url }) => {
      if (url) {
        saveAs(url, `${client}_Daily_Report_${value}.xlsx`);
      }
    });
  };

  return (
    <div className="flex flex-col justify-center items-center h-96">
      <div className="">
        <select
          name="date"
          id="date"
          className="outline selection:ring-0 px-4 py-1 rounded-lg mr-2"
          onChange={(e) => {
            setValue(e.target.value);
            setGenrate(false); // ✅ reset when filter changes
          }}
        >
          <option value="all">All</option>
          <option value="today">Today</option>
        </select>

        <Button
          onClick={handleGenerate}
          label={reportLoading ? "Generating..." : "Generate"}
          disabled={reportLoading}
        />
      </div>

      {reports?.msg && (
        <>
          <div className="text-center text-3xl font-bold mt-4">
            {reports.msg}
          </div>

          {/* ✅ Show per-client download links if admin (multiple files) */}
          {reports.files?.length > 1 ? (
            <div className="flex flex-col items-center gap-2 mt-3">
              {reports.files.map(({ client, url }) => (
                <button
                  key={client}
                  onClick={() => url && saveAs(url, `${client}_Daily_Report_${value}.xlsx`)}
                  disabled={!url}
                  className="text-blue-600 underline disabled:text-gray-400"
                >
                  {url ? `Download — ${client}` : `${client} (upload failed)`}
                </button>
              ))}
            </div>
          ) : (
            // ✅ Single file for ClientAdmin
            <div className="text-center mt-2">
              <Button
                onClick={handleDownload}
                label="Download"
                disabled={reportLoading || !reports?.files?.[0]?.url}
              />
            </div>
          )}

        </>
      )}
      {!visible && client?.reportURL !== "" &&
        <div className="text-center mt-2">
          <Button
            onClick={() => saveAs(client.reportURL, `${client?.name}_Daily_Report_${value}.xlsx`)}
            label="Download"
          />
        </div>
      }
    </div>
  );
};

export default Reports;