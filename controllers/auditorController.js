import { Audit } from "../models/auditor/auditModal.js";

export const createAuditReport = async (req, res) => {
  try {
    const { meta, sections, summary } = req.body;

    const auditPayload = {
      clientType: meta.clientType,
      site: meta.site,
      siteType: meta.siteType,
      auditor: req.user._id,
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
