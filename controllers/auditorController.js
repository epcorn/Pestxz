import path from "path";
import PptxGenJS from "pptxgenjs";
import axios from "axios";
import ExcelJS from "exceljs";

import { Audit } from "../models/auditor/auditModal.js";
import { chunkArray, dateFormat } from "../utils/helperFunction.js";
import {
  infraFindings,
  operations,
  pestFindings,
  rootCause,
} from "../utils/constData.js";

const __dirname = import.meta.dirname;

export const createAuditReport = async (req, res) => {
  try {
    const { meta, sections, summary } = req.body;

    const auditPayload = {
      clientType: meta.clientType,
      site: meta.site,
      siteType: meta.siteType,
      auditor: req.user._id,
      meetUp: meta.meetUp,
      siteAddrss: meta.siteAddrss,
      inspectionDate: new Date(),
      sections,
      summary,
    };

    if (meta.clientType === "new") {
      auditPayload.clientName = meta.client;
      auditPayload.client = null;
    } else {
      auditPayload.client = meta.client;
      auditPayload.clientName = "";
    }

    const audit = await Audit.create(auditPayload);

    return res.status(201).json({
      msg: "Audit created successfully",
      audit,
    });
  } catch (error) {
    console.error("Create Audit Error:", error);
    return res.status(500).json({
      msg: "Failed to create audit report",
      error: error.message,
    });
  }
};

export const getAuditReports = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 15;
    const page = parseInt(req.query.page, 10) || 1;
    const skip = (page - 1) * limit;

    const [totalItems, audits] = await Promise.all([
      Audit.countDocuments({}),
      Audit.find({})
        .populate([
          { path: "auditor", select: "name" },
          { path: "client", select: "name" },
        ])
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const totalPage = Math.ceil(totalItems / limit);

    res.status(200).json({
      success: true,
      audits,
      totalPage,
      totalItems,
      page,
      limit,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      msg: "Failed to fetch audit reports",
      error: error.message,
    });
  }
};

export const createAuditXLSX = async (req, res) => {
  try {
    const { id } = req.params;
    const auditor_report_path = path.join(
      __dirname,
      "../tmp",
      "auditor_report",
    );

    const audit = await Audit.findById(id).populate([
      { path: "client", select: "name" },
      { path: "auditor", select: "name" },
    ]);

    if (!audit) {
      return res
        .status(404)
        .json({ success: false, msg: "Audit record not found" });
    }
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("audit data");

    worksheet.columns = [
      { header: "Client Name", key: "client" },
      { header: "auditor Name", key: "auditor" },
      { header: "Site", key: "site" },
      { header: "Site Type", key: "siteType" },
      { header: "Inspection Date", key: "inspectDate" },
    ];
    const rows = {
      client: audit?.clientName || audit?.client?.name,
      auditor: audit.auditor.name,
      site: audit.site,
      siteType: audit.siteType,
      inspectDate: dateFormat(audit.inspectionDate).withoutTime,
    };
    worksheet.addRow(rows);

    // await fs.mkdir(auditor_report_path, { recursive: true });
    const safeClientName = rows.client.replace(/[^a-zA-Z0-9\s-_]/g, "").trim();
    const filename = `audit-${safeClientName}.xlsx`;
    const filePath = path.join(auditor_report_path, filename);

    await workbook.xlsx.writeFile(filePath);

    res.status(200).json({ success: true, filename });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error, msg: "Internal Server error" });
  }
};

//with pizzip and docx templater,need to install if using this function ,,, (no images) uses exising pptx
// export const createAuditPPTX_OG = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const audit = await Audit.findById(id).populate([
//       { path: "client", select: "name" },
//       { path: "auditor", select: "name" },
//     ]);
//     if (!audit) return res.status(404).json({ msg: "Audit not found" });

//     const templatePath = path.join(__dirname, "..", "tmp/client.pptx");

//     const file = await fs.readFile(templatePath);
//     const zip = new PizZip(file);
//     const doc = new Docxtemplater(zip, {
//       paragraphLoop: true,
//       linebreaks: true,
//     });
//     const clientName =
//       audit.clientType === "new"
//         ? audit?.clientName
//         : audit?.client?.name || audit?.clientName;
//     console.log(clientName);
//     const getSectionScore = (sections, sectionId, maxScore) => {
//       const section = sections?.find((f) => f?.sectionId === sectionId);
//       const yesCount = section?.summary?.yes;

//       return yesCount !== undefined && yesCount !== null
//         ? `${yesCount}/${maxScore}`
//         : "";
//     };

//     doc.render({
//       CLIENT: clientName || "",
//       SITETYPE: audit?.siteType || "",
//       INSPECTIONDATE: dateFormat(audit?.inspectionDate).withTime || "",
//       AUDITOR: audit?.auditor?.name || "",
//       MEETUP: audit?.meetUp || "",
//       ADDRESS: audit?.siteAddrss || "",
//       Oscore: audit?.sections?.[5]?.totalAchieved || 0,
//       Pscore: getSectionScore(audit?.sections, "arsm2", 30),
//       Iscore: getSectionScore(audit?.sections, "arsm3", 20),
//       Sscore: getSectionScore(audit?.sections, "arsm4", 20),
//     });

//     const buffer = doc
//       .getZip()
//       .generate({ type: "nodebuffer", compression: "DEFLATE" });

//     const outputDir = path.resolve("./tmp/auditor_report");
//     await fs.mkdir(outputDir, { recursive: true });
//     const cleanClientName = clientName.replace(/[^a-zA-Z0-9_-]/g, "_");
//     const filePath = path.join(outputDir, `Audit_${cleanClientName}.pptx`);

//     await fs.writeFile(filePath, buffer);

//     console.log(filePath, outputDir, "templatePath " + templatePath);
//     res.status(200).json({ msg: "file saved" });
//   } catch (error) {
//     console.error("error:", error);
//     res.status(500).json({ msg: "Internal server error" });
//   }
// };

// export const createAuditPPTX_n = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const audit = await Audit.findById(id).populate([
//       { path: "client", select: "name" },
//       { path: "auditor", select: "name" },
//     ]);

//     if (!audit) return res.status(404).json({ msg: "Audit not found" });

//     const templatePath = path.join(__dirname, "..", "tmp/client.pptx");
//     const file = await fs.readFile(templatePath);
//     const zip = new PizZip(file);
//     const doc = new Docxtemplater(zip, {
//       paragraphLoop: true,
//       linebreaks: true,
//     });

//     const clientName =
//       audit.clientType === "new"
//         ? audit?.clientName
//         : audit?.client?.name || audit?.clientName || "Report";

//     const getSectionScore = (sections, sectionId, maxScore) => {
//       const section = sections?.find((f) => f?.sectionId === sectionId);
//       const yesCount = section?.summary?.yes;
//       return yesCount !== undefined && yesCount !== null
//         ? `${yesCount}/${maxScore}`
//         : "";
//     };
//     const pestdata = audit?.sections?.find((f) => f.sectionId === "arsm2");
//     const infradata = audit?.sections?.find((f) => f.sectionId === "arsm3");

//     const pestsActivity =
//       pestdata?.questions?.reduce((acc, q, i) => {
//         acc[`COMMENT${i}`] = q.comment || "No activity found";
//         acc[`SPECIFICATION${i}`] = q.recommendation || "All Ok";
//         return acc;
//       }, {}) || {};

//     const infraActivity = infradata?.questions?.reduce((acc, q, i) => {
//       acc[`INFRACOM${i}`] = q?.comment || "";
//       acc[`INFRASP${i}`] = q?.recommendation || "";
//       return acc;
//     }, {} || {});

//     const images = "";

//     doc.render({
//       CLIENT: clientName || "",
//       SITETYPE: audit?.siteType || "",
//       INSPECTIONDATE: dateFormat(audit?.inspectionDate).withTime || "",
//       AUDITOR: audit?.auditor?.name || "",
//       MEETUP: audit?.meetUp || "",
//       ADDRESS: audit?.siteAddrss || "",
//       Oscore: audit?.sections?.[5]?.totalAchieved || 0,
//       Pscore: getSectionScore(audit?.sections, "arsm2", 30),
//       Iscore: getSectionScore(audit?.sections, "arsm3", 20),
//       Sscore: getSectionScore(audit?.sections, "arsm4", 20),
//       ...pestsActivity,
//       ...infraActivity,
//     });

//     const buffer = doc
//       .getZip()
//       .generate({ type: "nodebuffer", compression: "DEFLATE" });

//     const cleanClientName = clientName.replace(/[^a-zA-Z0-9_-]/g, "_");
//     const fileName = `Audit_${cleanClientName}.pptx`;

//     // 1. Set HTTP response headers for binary file download
//     res.setHeader(
//       "Content-Type",
//       "application/vnd.openxmlformats-officedocument.presentationml.presentation",
//     );
//     res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

//     // 2. Return buffer directly
//     return res.send(buffer);
//   } catch (error) {
//     console.error("PPT Generation Error:", error);
//     return res.status(500).json({ msg: "Internal server error" });
//   }
// };

const addDynamicFindingsSlides = (
  pptx,
  title,
  questions,
  isInfra = false,
  itemsPerSlide = 3,
) => {
  if (!questions || questions.length === 0) return;

  const toggler = title.toString().startsWith("Pest")
    ? pestFindings
    : infraFindings;

  const validQuestions = questions.filter(
    (q) =>
      (q?.comment && q.comment.trim() !== "") ||
      (q?.recommendation && q.recommendation.trim() !== ""),
  );

  if (validQuestions.length === 0) return;

  const chunks = chunkArray(validQuestions, itemsPerSlide);

  chunks.forEach((chunk, pageIndex) => {
    const slide = pptx.addSlide();

    // Title with Slide Page Counter
    const slideTitle =
      chunks.length > 1
        ? `${title.toUpperCase()} (${pageIndex + 1}/${chunks.length})`
        : title.toUpperCase();

    slide.addText(slideTitle, {
      x: 0.5,
      y: 0.5,
      w: "9.0",
      fontSize: 15,
      bold: true,
      color: "1E293B",
    });

    const startY = 0.8;
    const cardHeight = 1.3;
    const gap = 0.1;

    chunk.forEach((item, index) => {
      const globalIndex = pageIndex * itemsPerSlide + index + 1;
      const currentY = startY + index * (cardHeight + gap);

      const comment = item?.comment || (isInfra ? "N/A" : "No activity found");
      const recommendation = item?.recommendation || "All Ok";

      // Card Box Container
      slide.addShape(pptx.shapes.RECTANGLE, {
        x: 0.5,
        y: currentY,
        w: 9.0,
        h: cardHeight,
        fill: { color: "F8FAFC" },
        line: { color: "CBD5E1", width: 1 },
        rectRadius: 0.4,
      });

      // Colored Accent Strip
      slide.addShape(pptx.shapes.RECTANGLE, {
        x: 0.5,
        y: currentY,
        w: 0.15,
        h: cardHeight,
        fill: { color: isInfra ? "D97706" : "0284C7" },
        line: { color: isInfra ? "D97706" : "0284C7" },
      });

      // Text Overlay Content
      const cardContent = [
        {
          text: toggler[globalIndex] + ": ",
          options: { bold: true, fontSize: 11, color: "1E293B" },
        },
        { text: `${comment}\n`, options: { fontSize: 10, color: "334155" } },
        {
          text: "Recommendation: ",
          options: { bold: true, fontSize: 10, color: "059669" },
        },
        {
          text: `${recommendation}`,
          options: { fontSize: 10, color: "334155" },
        },
      ];

      slide.addText(cardContent, {
        x: 0.8,
        y: currentY + 0.1,
        w: 8.5,
        h: cardHeight - 0.2,
        valign: "top",
        lineSpacing: 16,
      });
    });
  });
};

async function fetchImageAsBase64(url) {
  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    const buffer = Buffer.from(response.data, "binary");
    const mimeType = response.headers["content-type"] || "image/png";
    return `data:${mimeType};base64,${buffer.toString("base64")}`;
  } catch (err) {
    console.error(`Failed to fetch Cloudinary image from ${url}:`, err);
    return null;
  }
}

export const createAuditPPTX = async (req, res) => {
  try {
    const { id } = req.params;
    const audit = await Audit.findById(id).populate([
      { path: "client", select: "name" },
      { path: "auditor", select: "name" },
    ]);
    if (!audit) return res.status(404).json({ msg: "Audit not found" });

    const clientName =
      audit.clientType === "new"
        ? audit?.clientName
        : audit?.client?.name || audit?.clientName;

    const getSectionScore = (sections, sectionId, maxScore) => {
      const section = sections?.find((f) => f?.sectionId === sectionId);
      const yesCount = section?.summary?.yes;

      return yesCount !== undefined && yesCount !== null
        ? `${yesCount}/${maxScore}`
        : "";
    };

    const CLIENT = clientName || "";
    const SITETYPE = audit?.siteType || "";
    const INSPECTIONDATE = dateFormat(audit?.inspectionDate).withTime || "";
    const AUDITOR = audit?.auditor?.name || "";
    const MEETUP = audit?.meetUp || "";
    const ADDRESS = audit?.siteAddrss || "";
    const Oscore = audit?.sections?.[5]?.totalAchieved || 0;
    const Pscore = getSectionScore(audit?.sections, "arsm2", 30);
    const Iscore = getSectionScore(audit?.sections, "arsm3", 20);
    const Sscore = getSectionScore(audit?.sections, "arsm4", 20);
    const rawImages = audit.sections
      ?.map((s) => s?.questions?.map((q) => q?.images))
      ?.flat(Infinity);

    const images = (rawImages || []).filter(Boolean);

    const pptx = new PptxGenJS();
    pptx.layout = "LAYOUT_16x9";

    // Header image setup
    const headerImageUrl =
      "https://res.cloudinary.com/djc8opvcg/image/upload/v1789205486/Pestxz/auditor%20report%20imgs/2734fa26-71c5-43b8-ae00-3b56884a3848.png";
    const headerBase64 = await fetchImageAsBase64(headerImageUrl);

    // -------------------------------------------------------------
    // STEP 1: Slide 1 - Title & Summary Info
    // -------------------------------------------------------------
    const slide1 = pptx.addSlide();

    if (headerBase64) {
      slide1.addImage({
        data: headerBase64,
        x: "10%",
        y: 0.2,
        w: "60%",
        h: 1.3,
      });
    }

    slide1.addText("Audit Findings & Summary Report", {
      x: 0.5,
      y: 2.1,
      w: "90%",
      fontSize: 22,
      bold: true,
      color: "363636",
    });

    const metaDetails = [
      { text: "Client: ", options: { bold: true } },
      { text: `${CLIENT}\n` },
      { text: "Site Type: ", options: { bold: true } },
      { text: `${SITETYPE}\n` },
      { text: "Inspection Date: ", options: { bold: true } },
      { text: `${INSPECTIONDATE}\n` },
      { text: "Auditor: ", options: { bold: true } },
      { text: `${AUDITOR}\n` },
      { text: "Meetup: ", options: { bold: true } },
      { text: `${MEETUP}\n` },
      { text: "Address: ", options: { bold: true } },
      { text: `${ADDRESS}` },
    ];

    slide1.addText(metaDetails, {
      x: "5%",
      y: "50%",
      w: "42%",
      h: 2.5,
      fontSize: 11,
      fill: { color: "F8FAFC" },
      margin: 0.1,
      lineSpacing: 18,
    });

    const scoreRows = [
      [
        {
          text: "Section / Category",
          options: { bold: true, fill: { color: "1E293B" }, color: "FFFFFF" },
        },
        {
          text: "Achieved Score",
          options: { bold: true, fill: { color: "1E293B" }, color: "FFFFFF" },
        },
      ],
      ["Overall Score", `${Oscore}`],
      ["Pest Score", `${Pscore}`],
      ["Inspection Score", `${Iscore}`],
      ["Sanitation Score", `${Sscore}`],
    ];

    slide1.addTable(scoreRows, {
      x: "53%",
      y: "65%",
      w: "42%",
      fontSize: 11,
      border: { pt: 1, color: "CBD5E1" },
    });

    // -------------------------------------------------------------
    // STEP 2: Slide 2 - Horizontal Score Cards & Key Observations
    // -------------------------------------------------------------
    const slide2 = pptx.addSlide();

    const scoreData = [
      { label: "Overall Score", score: `${Oscore}%`, color: "1E293B" },
      { label: "Pest Score", score: `${Pscore}`, color: "0284C7" },
      { label: "Inspection Score", score: `${Iscore}`, color: "D97706" },
      { label: "Sanitation Score", score: `${Sscore}`, color: "059669" },
    ];
    slide2.addText("EXECUTIVE SUMMARY", {
      x: 2,
      y: 0.3,
      w: "9.0",
      fontSize: 16,
      bold: true,
      color: "1E293B",
    });
    const startX = 0.5;
    const topY = 0.8;
    const cardWidth = 2.0;
    const cardHeight = 0.85;
    const gap = 0.25; // Correct horizontal gap spacing

    scoreData.forEach((item, index) => {
      const currentX = startX + index * (cardWidth + gap); // Corrected formula

      slide2.addShape(pptx.shapes.RECTANGLE, {
        x: currentX,
        y: topY,
        w: cardWidth,
        h: cardHeight,
        fill: { color: "F8FAFC" },
        line: { color: "CBD5E1", width: 1 },
        rectRadius: 0.1,
      });

      slide2.addText(
        [
          {
            text: `${item.label}\n`,
            options: { fontSize: 10, color: "64748B", bold: true },
          },
          {
            text: `${item.score}`,
            options: { fontSize: 16, color: item.color, bold: true },
          },
        ],
        {
          x: currentX,
          y: topY,
          w: cardWidth,
          h: cardHeight,
          align: "center",
          valign: "middle",
        },
      );
    });

    // Key Observations under Score Cards
    slide2.addText("KEY OBSERVATIONS & FINDINGS", {
      x: 0.5,
      y: 2,
      w: "9.0",
      fontSize: 12,
      bold: true,
      color: "1E293B",
    });

    const scoreSumm = [
      "• Live cockroach activity was recorded in Nushara Kitchen under platforms.",
      "Bed bug activity was reported/observed in guest rooms.",
      "• Fresh rodent droppings were noted within shafts; rodent footprints were observed on a glueboard.",
      "• Wall/ceiling gaps and open service shafts were identified as potential pest access/harbourage points.",
      "• Waste holding area requires better housekeeping and sanitation.",
      "• Hotel operations section records pest activity concerns in guest rooms, kitchen, restaurant, banquet area and garbage holding area.",
    ];

    const formattedSummary = scoreSumm.map((line) => {
      const cleanLine = line.replace(/^•\s*/, "");
      return {
        text: `• ${cleanLine}\n`,
        options: { fontSize: 11, color: "334155" },
      };
    });

    slide2.addText(formattedSummary, {
      x: 0.5,
      y: 2.5,
      w: 9.0,
      h: 2.2,
      fill: { color: "F8FAFC" },
      margin: 0.15,
      lineSpacing: 18,
      valign: "top",
    });

    // -------------------------------------------------------------
    // STEP 3: Dynamic Paginated Observations (Pest & Infra)
    // -------------------------------------------------------------
    const pestQuestions =
      audit?.sections?.find((f) => f.sectionId === "arsm2")?.questions || [];
    const infraQuestions =
      audit?.sections?.find((f) => f.sectionId === "arsm3")?.questions || [];

    // Dynamically generates 1, 2, or more slides based on question array length
    addDynamicFindingsSlides(
      pptx,
      "Pest Activity Observations",
      pestQuestions,
      false,
      3,
    );
    addDynamicFindingsSlides(
      pptx,
      "Infrastructure & Facility Observations",
      infraQuestions,
      true,
      3,
    );

    const slide7 = pptx.addSlide();
    const slideWidth = 9.5;
    const marginX = 0.5;
    const card7Width = slideWidth - marginX * 2; // 12.33 inches full width
    const card7Height = 0.6; // Adjust height for a single inline row
    const gap7 = 0.15;
    const top7Y = 1.2;
    // Slide Header
    slide7.addText("HYGIENE, HOUSEKEEPING & HOTEL OPERATIONS", {
      x: marginX,
      y: 0.4,
      w: card7Width,
      h: 0.5,
      fontSize: 18,
      bold: true,
      color: "0052CC",
    });

    operations.forEach((el, index) => {
      const currentY = top7Y + index * (card7Height + gap7);

      // Full-width background container
      slide7.addShape(pptx.shapes.RECTANGLE, {
        x: marginX,
        y: currentY,
        w: card7Width,
        h: card7Height,
        fill: { color: "F8FAFC" },
        line: { color: "CBD5E1", width: 1 },
        rectRadius: 0.05,
      });

      // Single inline text: LABEL – VALUE
      slide7.addText(
        [
          {
            text: `${el.label.toUpperCase()} – `,
            options: { bold: true, fontSize: 11, color: "64748B" },
          },
          {
            text: el.value,
            options: { fontSize: 11, color: "1E293B" },
          },
        ],
        {
          x: marginX + 0.2,
          y: currentY,
          w: card7Width - 0.4,
          h: card7Height,
          align: "left",
          valign: "middle",
        },
      );
    });

    // const slide8 = pptx.addSlide();

    const imageBatches = chunkArray(images, 6);

    const columns = 4; // Number of images per row
    const imgWidth = 2.3; // Width in inches
    const imgHeight = 2; // Height in inches
    const gapX = 0.2;
    const gapY = 0.2;
    const imgStartX = 0.5;
    const startY = 1.0;

    imageBatches.forEach((batch, pageIndex) => {
      const currentSlide = pptx.addSlide();

      // Add Section Header
      currentSlide.addText(
        `AUDIT IMAGES ${imageBatches.length > 1 ? `(Page ${pageIndex + 1})` : ""}`,
        {
          x: imgStartX,
          y: 0.2,
          w: 9,
          h: 0.5,
          fontSize: 18,
          bold: true,
          color: "0052CC",
        },
      );

      // Render up to 6 images per slide
      batch.forEach((img, index) => {
        const col = index % columns; // 0, 1, 2
        const row = Math.floor(index / columns); // 0 or 1

        const xPos = imgStartX + col * (imgWidth + gapX);
        const yPos = startY + row * (imgHeight + gapY);

        const imagePath = typeof img === "string" ? img : img?.url || img?.path;

        // Add image reset to 0 degrees to override default orientation
        currentSlide.addImage({
          path: imagePath,
          x: xPos,
          y: yPos,
          w: imgWidth,
          h: imgHeight,
          rotate: 0, // Prevents unwanted landscape/portrait flipping
          sizing: { type: "contain" }, // Preserves original aspect ratio
        });
      });
    });

    const slide9 = pptx.addSlide();
    slide9.addText("Root-cause focus for sustained pest prevention", {
      x: 1.5,
      y: 0.2,
      w: 9,
      h: 0.5,
      fontSize: 18,
      bold: true,
      align: "center",
      color: "0052CC",
    });

    slide9.addText(
      "THE KEY RISK IS NOT ONLY PEST ACTIVITY — IT IS THE CONDITIONS SUPPORTING IT.",
      {
        x: 1.5,
        y: 0.4,
        w: 9,
        h: 0.5,
        fontSize: 18,
        bold: true,
        align: "center",
        color: "0052CC",
      },
    );
    const bulletItems = rootCause.map((text) => ({
      text: `${text}\n`,
      options: {
        bullet: true,
        fontSize: 11,
        color: "334155",
        lineSpacing: 18,
      },
    }));
    slide9.addText(bulletItems, {
      x: 0.5,
      y: 1,
      w: 9.0,
      h: 3.8,
      fill: { color: "F8FAFC" },
      line: { color: "CBD5E1", width: 1 },
      margin: 0.2,
      valign: "center",
    });
    // -------------------------------------------------------------
    // STEP 4: Append Full-Page Evidence Image Slides
    // -------------------------------------------------------------
    const dynamicSlideUrls = req.body.images || [
      "https://res.cloudinary.com/djc8opvcg/image/upload/v1790053832/Pestxz/auditor%20report%20imgs/28cd0647-3326-40dc-87cd-07230b2c6098.png",
      "https://res.cloudinary.com/djc8opvcg/image/upload/v1790053911/Pestxz/auditor%20report%20imgs/95c6356d-40a2-40ef-bc4e-ce0904a286f1.png",
      "https://res.cloudinary.com/djc8opvcg/image/upload/v1789205722/Pestxz/auditor%20report%20imgs/2460b019-c81e-471f-9bec-4fb559c86ae2.png",
      "https://res.cloudinary.com/djc8opvcg/image/upload/v1790053508/Pestxz/auditor%20report%20imgs/f5679f9a-7955-4383-8558-5138f1685c94.png",
    ];

    const base64Slides = await Promise.all(
      dynamicSlideUrls.map((url) => fetchImageAsBase64(url)),
    );

    base64Slides.forEach((base64Data) => {
      if (!base64Data) return;

      const slide = pptx.addSlide();
      slide.addImage({
        data: base64Data,
        x: 0,
        y: 0,
        w: "100%",
        h: "100%",
      });
    });

    // -------------------------------------------------------------
    // STEP 5: Write Stream Buffer to Client Response
    // -------------------------------------------------------------
    const buffer = await pptx.write({ outputType: "nodebuffer" });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Audit_Report.pptx"`,
    );

    return res.send(buffer);
  } catch (error) {
    console.error("PPT Generation Error:", error);
    return res.status(500).json({ msg: "Internal server error" });
  }
};

// Development Helper: Overlays a 1-inch visual grid across the slide
function drawDebugGrid(slide, pptx) {
  const SLIDE_WIDTH = 10; // Standard 16:9 width in inches
  const SLIDE_HEIGHT = 5.625; // Standard 16:9 height in inches

  // Draw Vertical Inch Lines
  for (let x = 1; x < SLIDE_WIDTH; x++) {
    slide.addShape(pptx.shapes.LINE, {
      x: x,
      y: 0,
      w: 0,
      h: SLIDE_HEIGHT,
      line: { color: "FF0000", width: 0.5, dashType: "dash" },
    });
    slide.addText(`x:${x}"`, {
      x: x - 0.2,
      y: 0.1,
      w: 0.5,
      h: 0.2,
      fontSize: 8,
      color: "FF0000",
    });
  }

  // Draw Horizontal Inch Lines
  for (let y = 1; y < SLIDE_HEIGHT; y++) {
    slide.addShape(pptx.shapes.LINE, {
      x: 0,
      y: y,
      w: SLIDE_WIDTH,
      h: 0,
      line: { color: "FF0000", width: 0.5, dashType: "dash" },
    });
    slide.addText(`y:${y}"`, {
      x: 0.1,
      y: y - 0.1,
      w: 0.5,
      h: 0.2,
      fontSize: 8,
      color: "FF0000",
    });
  }
}
