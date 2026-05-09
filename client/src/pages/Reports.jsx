import { useDailyServiceReportQuery } from "../redux/serviceSlice";

const Reports = () => {
  const { data } = useDailyServiceReportQuery()
  return <div>
    report
  </div>;
};
export default Reports;
