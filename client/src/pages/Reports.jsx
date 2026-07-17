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
  const [state, setState] = useState({ value: "all", genrate: false, visible: false })
  const { user } = useSelector(store => store.helper);

  const { data: reports, isFetching, isLoading: reportLoading } = useDailyServiceReportQuery(state.value, { skip: !state.genrate });
  const { data: client } = useGetSingleClientQuery(user?.client, { skip: !user?.client })

  console.log(reports)
  useEffect(() => {
    if (reports && !reportLoading) {
      setState(prev => ({ ...prev, genrate: false }))
      toast.success("Report generated successfully");
    }
  }, [reports, reportLoading]);

  const handleGenerate = () => {
    if (!isFetching) {
      setState(prev => ({ ...prev, genrate: true, visible: true }))
    }
  };

  const handleDownload = () => {
    if (!reports?.files?.length) return;

    reports.files.forEach(({ client, url }) => {
      if (url) {
        saveAs(url, `${client}_Daily_Report_${state.value}.xlsx`);
      }
    });
  };

  console.log(state.genrate, isFetching)
  return (
    <div className="flex flex-col justify-center items-center h-96">
      <div className="">
        <select
          name="date"
          id="date"
          className="outline selection:ring-0 px-4 py-1 rounded-lg mr-2"
          onChange={(e) => {
            setState(prev => ({ ...prev, value: e.target.value, genrate: false }))
          }}
        >
          <option value="all">All</option>
          <option value="weekly">Weekly</option>
          <option value="today">Today</option>
        </select>

        <Button
          onClick={handleGenerate}
          label={isFetching ? "Generating..." : "Generate"}
          disabled={isFetching}
        />
      </div>

      {reports?.msg && (
        <>
          <div className="text-center text-3xl font-bold mt-4">
            {reports.msg}
          </div>

          {reports.files?.length >= 1 ? (
            <div className="flex flex-col items-center gap-2 mt-3">
              {reports.files.map(({ client, url }) => (
                <button
                  key={client}
                  onClick={() => url && saveAs(url, `${client}_Daily_Report_${state.value}.xlsx`)}
                  disabled={!url}
                  className="text-blue-600 underline disabled:text-gray-400"
                >
                  {url ? `Download — ${client}` : `${client} (upload failed)`}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center mt-2">
              <Button
                onClick={handleDownload}
                label="Download"
                disabled={isFetching}
              />
            </div>
          )}

        </>
      )}
      {!state.visible && client?.reportURL !== "" &&
        <div className="text-center mt-2">
          <Button
            onClick={() => saveAs(client.reportURL, `${client?.name}_Daily_Report_${state.value}.xlsx`)}
            label="Download"
          />
        </div>
      }
    </div>
  );
};

export default Reports;