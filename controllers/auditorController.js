import { Audit } from "../models/auditor/auditModal.js";

export const createAuditReport = async (req, res) => {
  const data = req.body;
  try {
    console.log(data);
    const { meta, sections } = data;
    // const 
    const audit = await Audit.create({
      ...meta,
      auditor: req.user._id,
      inspectionDate: new Date(),
      sections: [...sections],
    });

    res.status(200).json(audit);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: error.message, msg: "Internal server error" });
  }
};

export const getAuditReports = async (req, res) => {
  try {
    const limit = req.query.limit || 15;
    const skip = req.query.skip || 15;
    const page = req.query.page || 1;

    const audits = await Audit.find({})
      .populate([
        { path: "auditor", select: "name" },
        { path: "client", select: "name" },
      ])
      .lean();
    res.status(200).json(audits);
  } catch (error) {
    res.status(500).json(error);
  }
};
