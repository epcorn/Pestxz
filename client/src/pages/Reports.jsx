import { useState } from "react";
import { Button, LoadingSpinner } from "../components";
import { useDailyServiceReportQuery } from "../redux/serviceSlice";
import { saveAs } from "file-saver";

const Reports = () => {
  const [value, setValue] = useState("monthly");
  const [date, setDate] = useState("");
  const [shouldGenerate, setShouldGenerate] = useState(false);

  const { data: reports, isFetching } = useDailyServiceReportQuery(
    { value, today: date },
    { skip: !shouldGenerate }
  );

  const handleGenerate = () => {
    if (!isFetching) {
      setShouldGenerate(true);
    }
  };

  const handleDownload = (client, url) => {
    if (url) {
      saveAs(url, `${client}_Daily_Report_${value}.xlsx`);
    }
  };

  const handleSelectChange = (e) => {
    setValue(e.target.value);
    setShouldGenerate(false);
  };

  const handleDateChange = (e) => {
    setDate(e.target.value);
    setShouldGenerate(false);
  };

  return (
    <div className="flex flex-col gap-5 justify-center items-center h-96">
      <div className="flex flex-col items-center gap-3">
        {/* Report Type Select */}
        <select
          name="reportType"
          id="reportType"
          className="outline px-4 py-1 rounded-lg"
          value={value}
          onChange={handleSelectChange}
        >
          <option value="monthly">Monthly</option>
          <option value="weekly">Weekly</option>
          <option value="fortnightly">Fortnightly</option>
          <option value="custom">Custom Date</option>
        </select>

        {/* Date Select */}
        <div className="flex flex-col p-2 gap-1">
          <label htmlFor="select-date">Select Date</label>
          <input
            type="date"
            id="select-date"
            className="outline px-2 py-1 rounded"
            value={date}
            onChange={handleDateChange}
          />
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          label={isFetching ? "Generating..." : "Generate"}
          disabled={isFetching}
        />
      </div>

      {/* Loading Overlay */}
      {isFetching && (
        <div className="w-full h-full bg-black/30 fixed inset-0 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      )}

      {/* Generated Reports & Download Links */}
      {!isFetching && reports?.msg && (
        <div className="flex flex-col items-center gap-3 mt-4">
          <div className="text-center text-2xl font-bold">{reports.msg}</div>

          {reports.files?.length > 0 ? (
            <div className="flex flex-col items-center gap-2 mt-2">
              {reports.files.map(({ client, url }) => (
                <button
                  key={client}
                  onClick={() => handleDownload(client, url)}
                  disabled={!url}
                  className="text-blue-600 underline disabled:text-gray-400 cursor-pointer"
                >
                  {url ? `Download — ${client}` : `${client} (Upload failed)`}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No report files generated.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;