import { dateFormat } from "./helperFunction.js";

export const generateHtmlReport = (regulars) => {
  // Map all rows dynamically into table body
  const rows = regulars
    .map((reg) => {
      const regs = reg.regularService?.[0];
      if (!regs) return "";
      const loc = reg.location || {};

      // Correct image mapping
      const imagesHtml = Array.isArray(regs.image)
        ? regs.image
            .map((imgUrl) => `<img style="height:60px; margin-right:5px;" src="${imgUrl}" alt="service-img" />`)
            .join("")
        : "";

      return `
      <tr>
        <td>${dateFormat(regs.serviceDate).withoutTime || ""}</td>
        <td>${regs.frequency || ""}</td>
        <td>${regs.userName || "N/A"}</td>
        <td>${regs.pestCount ?? 0}</td>
        <td>${loc.floor || ""}</td>
        <td>${loc.location || ""}</td>
        <td>${loc.subLocation || ""}</td>
        <td>${regs.serviceName || ""}</td>
        <td>${imagesHtml}</td>
      </tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    img { vertical-align: middle; }
  </style>
</head>
<body>
  <h2>Regular Service Report</h2>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Frequency</th>
        <th>Serviced By</th>
        <th>Pest Count</th>
        <th>Floor</th>
        <th>Location</th>
        <th>SubLocation</th>
        <th>Service Name</th>
        <th>Images</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
</body>
</html>`;
};