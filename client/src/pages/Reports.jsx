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
  const [state, setState] = useState({
    value: "all",
    genrate: false,
    visible: false,
  });
  const [dates, setDates] = useState({ todays: "" })
  const { user } = useSelector((store) => store.helper);
  console.log(dates)
  const {
    data: reports,
    isFetching,
    isLoading: reportLoading,
  } = useDailyServiceReportQuery({ value: state.value, dates }, { skip: !state.genrate });
  const { data: client } = useGetSingleClientQuery(user?.client, {
    skip: !user?.client,
  });

  // console.log(reports);
  useEffect(() => {
    if (reports && !reportLoading) {
      setState((prev) => ({ ...prev, genrate: false }));
      toast.success("Report generated successfully");
    }
  }, [reports, reportLoading]);

  const handleGenerate = () => {
    if (!isFetching) {
      setState((prev) => ({ ...prev, genrate: true, visible: true }));
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
  const handleChangedates = (e) => {
    const value = e.target.value;
    setDates({ todays: value })

  }

  return (
    <div className="flex flex-col gap-5 justify-center items-center h-96">
      {state.value === "weekly" &&
        <>
          <p>choosen date: {dates?.enddate}</p>
          <p>choosen date: {dates?.startdate}</p>
        </>
      }
      {state.value === "today" &&
        <p className="text-center outline ">choosen date: {dates?.todays}</p>
      }
      <div className="">
        <select
          name="date"
          id="date"
          className="outline selection:ring-0 px-4 py-1 rounded-lg mr-2"
          onChange={(e) => {
            setState((prev) => ({
              ...prev,
              value: e.target.value,
              genrate: false,
            }));
          }}>
          <option value="all">All</option>
          <option value="weekly">Weekly</option>
          <option value="today">Todays</option>
        </select>

        {state.value === "weekly" ? (
          <div className="space-y-2">
            <div className="space-x-2">
              <label htmlFor="startdate">choose start date</label>
              <input className="outline" onChange={handleChangedates} type="date" name="startdate" id="startdate" />
            </div>
            <div className="space-x-2">
              <label htmlFor="end">choose end date</label>
              <input className="outline" onChange={handleChangedates} type="date" name="enddate" id="enddate" />
            </div>
          </div>
        ) : (
          ""
        )}
        {state.value === "today" ? (
          <div className="font-bold space-x-2">
            <label htmlFor="date">choose today date:</label>
            <input type="date" onChange={handleChangedates} name="todays" id="date" />
          </div>
        ) : (
          ""
        )}

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
                  onClick={() =>
                    url &&
                    saveAs(url, `${client}_Daily_Report_${state.value}.xlsx`)
                  }
                  disabled={!url}
                  className="text-blue-600 underline disabled:text-gray-400">
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
      {!state.visible && client?.reportURL !== "" && (
        <div className="text-center mt-2 hidden">
          <Button
            onClick={() =>
              saveAs(
                client.reportURL,
                `${client?.name}_Daily_Report_${state.value}.xlsx`,
              )
            }
            label="Download"
          />
        </div>
      )}
    </div>
  );
};

export default Reports;
