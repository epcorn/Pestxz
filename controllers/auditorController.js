import { Audit } from "../models/auditor/auditModal.js";

export const createAuditReport = async (req, res) => {
  const data = req.body;
  try {
    console.log(data);
    const { meta, sections } = data;
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
