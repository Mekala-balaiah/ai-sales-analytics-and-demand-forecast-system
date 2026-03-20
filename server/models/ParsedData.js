const mongoose = require("mongoose");

const parsedDataSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: "Business", required: true },
  fileName: { type: String },
  fileType: { type: String }, // csv, xlsx, json, txt
  records: [{
    date: Date,
    product: String,
    quantity: Number,
    revenue: Number,
    customer: String,
    raw: mongoose.Schema.Types.Mixed // any unstructured data
  }],
  uploadedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("ParsedData", parsedDataSchema);
