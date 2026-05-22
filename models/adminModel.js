import mongoose from "mongoose";

/* ---------------- CONSUMABLE ---------------- */

const consumableSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    calibration: { type: Object },

    // parent scope reference
    scope: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Scope",
    },
  },
  { timestamps: true },
);

/* ---------------- SCOPE ---------------- */

const scopeSchema = new mongoose.Schema(
  {
    scopeName: {
      type: String,
      required: true,
    },

    consumables: [consumableSchema],

    // parent service reference
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
    },
  },
  { timestamps: true },
);

/* ---------------- SERVICE ---------------- */

const serviceSchema = new mongoose.Schema(
  {
    serviceName: {
      type: String,
      required: true,
    },

    scopes: [scopeSchema],

    // parent admin reference
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "NewAdmin",
    },
  },
  { timestamps: true },
);

/* ---------------- ROOT ---------------- */

const adminSchema = new mongoose.Schema(
  {
    frequency: [String],
    service: [serviceSchema],
  },
  { timestamps: true },
);

const Admin = mongoose.model("Admin", adminSchema);

export default Admin;

