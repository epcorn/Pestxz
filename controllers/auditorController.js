import { Audit } from "../models/auditor/auditModal.js";
import ExcelJS from "exceljs";
import { dateFormat } from "../utils/helperFunction.js";
import path from "path";
import fs from "fs/promises";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

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

export const createAuditPPTX = async (req, res) => {
  try {
    const { id } = req.params;
    const audit = await Audit.findById(id).populate([
      { path: "client", select: "name" },
      { path: "auditor", select: "name" },
    ]);
    if (!audit) return res.status(404).json({ msg: "Audit not found" });

    const templatePath = path.join(__dirname, "..", "tmp/client.pptx");

    const file = await fs.readFile(templatePath);
    const zip = new PizZip(file);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });
    const clientName =
      audit.clientType === "new"
        ? audit?.clientName
        : audit?.client?.name || audit?.clientName;
    console.log(clientName);
    const getSectionScore = (sections, sectionId, maxScore) => {
      const section = sections?.find((f) => f?.sectionId === sectionId);
      const yesCount = section?.summary?.yes;

      return yesCount !== undefined && yesCount !== null
        ? `${yesCount}/${maxScore}`
        : "";
    };

    doc.render({
      CLIENT: clientName || "",
      SITETYPE: audit?.siteType || "",
      INSPECTIONDATE: dateFormat(audit?.inspectionDate).withTime || "",
      AUDITOR: audit?.auditor?.name || "",
      MEETUP: audit?.meetUp || "",
      ADDRESS: audit?.siteAddrss || "",
      Oscore: audit?.summary?.total ?? "",
      Pscore: getSectionScore(audit?.sections, "arsm2", 30),
      Iscore: getSectionScore(audit?.sections, "arsm3", 20),
      Sscore: getSectionScore(audit?.sections, "arsm4", 20),
    });

    const buffer = doc
      .getZip()
      .generate({ type: "nodebuffer", compression: "DEFLATE" });

    const outputDir = path.resolve("./tmp/auditor_report");
    await fs.mkdir(outputDir, { recursive: true });
    const cleanClientName = clientName.replace(/[^a-zA-Z0-9_-]/g, "_");
    const filePath = path.join(outputDir, `Audit_${cleanClientName}.pptx`);

    await fs.writeFile(filePath, buffer);

    console.log(filePath, outputDir, "templatePath " + templatePath);
    res.status(200).json({ msg: "file saved" });
  } catch (error) {
    console.error("error:", error);
    res.status(500).json({ msg: "Internal server error" });
  }
};
