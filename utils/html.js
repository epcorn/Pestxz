import { dateFormat } from "./helperFunction.js";
import ConvertAPI from "convertapi";
import dotenv from "dotenv";
import fs from "fs/promises";
dotenv.config();

const convertapi = new ConvertAPI(process.env.CONVERTAPI);

export const generateHtmlReport = async (regulars) => {
  const rows = regulars
    ?.map((reg) => {
      const regs = reg?.regularService?.[0];
      if (!regs) return "";
      const loc = reg?.location || {};

      // Correct image mapping
      // const imagesHtml = `<img style="height:60px; margin-right:5px;" src="${"https://res.cloudinary.com/djc8opvcg/image/upload/v1784525559/Pestxz/tmp-13-1784525553387_cdkq0g.jpg"}" alt="service-img" />`;
      const validImages = (regs?.image || []).filter(
        (img) => img && img.trim() !== "",
      );

      const imagesHtml =
        validImages.length > 0
          ? validImages
              .map(
                (img) => `
            <img
              src="${img}"
              alt="Service Image"
              style="height:60px;width:60px;object-fit:cover;margin:2px;border:1px solid #ddd;border-radius:4px;"
            />
          `,
              )
              .join("")
          : "-";

      return `
      <tr>
        <td>${dateFormat(regs?.serviceDate).withoutTime || ""}</td>
        <td>${regs?.frequency || "weekly"}</td>
        <td>${regs?.userName || "Mallu"}</td>
        <td>${regs?.pestCount ?? 0}</td>
        <td  style="white-space: pre-wrap;">${(loc?.floor, loc?.location, loc?.subLocation)}</td>
        <td>${regs?.serviceName || "GreenShield"}</td>
        <td>${imagesHtml}</td>
      </tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; font-size:12px; }
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
        <th>Location</th>
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
