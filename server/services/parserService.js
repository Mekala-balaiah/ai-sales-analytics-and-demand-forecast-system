const fs = require("fs");
const csv = require("csv-parser");
const xlsx = require("xlsx");
const ParsedData = require("../models/ParsedData");
const { aggregateAnalytics } = require("./analyticsService");

const standardizeRecord = (record) => {
  // Try to find Date, Revenue, Quantity, Product names from various headers
  const dateKey = Object.keys(record).find(k => k.toLowerCase().includes("date") || k.toLowerCase() === "t") || null;
  const productKey = Object.keys(record).find(k => k.toLowerCase().includes("product") || k.toLowerCase().includes("item")) || null;
  const revenueKey = Object.keys(record).find(k => k.toLowerCase().includes("revenue") || k.toLowerCase().includes("total") || k.toLowerCase().includes("price") || k.toLowerCase().includes("amount") || k.toLowerCase().includes("sales")) || null;
  const quantityKey = Object.keys(record).find(k => k.toLowerCase().includes("qty") || k.toLowerCase().includes("quantity")) || null;
  const customerKey = Object.keys(record).find(k => k.toLowerCase().includes("customer") || k.toLowerCase().includes("client") || k.toLowerCase().includes("name") || k.toLowerCase().includes("buyer")) || null;
  const categoryKey = Object.keys(record).find(k => k.toLowerCase().includes("category") || k.toLowerCase().includes("type")) || null;
  const sourceKey = Object.keys(record).find(k => k.toLowerCase().includes("source") || k.toLowerCase().includes("channel")) || null;

  return {
    date: dateKey && record[dateKey] ? new Date(record[dateKey]) : new Date(),
    product: productKey ? String(record[productKey]) : "Unknown Product",
    category: categoryKey ? String(record[categoryKey]) : "Uncategorized",
    quantity: quantityKey ? parseInt(record[quantityKey]) || 1 : 1,
    revenue: revenueKey ? parseFloat(record[revenueKey]) || 0 : 0,
    customer: customerKey ? String(record[customerKey]) : "Guest",
    source: sourceKey ? String(record[sourceKey]) : "Direct",
    raw: record
  };
};

const parseFileAndDeriveAnalytics = async (uploadFile, businessId, fileType) => {
  const filePath = uploadFile.path;
  let rawRecords = [];

  if (fileType === "csv") {
    rawRecords = await new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream(filePath)
        .pipe(csv())
        .on("data", (data) => results.push(data))
        .on("end", () => resolve(results))
        .on("error", reject);
    });
  } else if (fileType === "xlsx") {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    rawRecords = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
  } else if (fileType === "json") {
    const data = fs.readFileSync(filePath, "utf-8");
    rawRecords = JSON.parse(data);
    if (!Array.isArray(rawRecords)) rawRecords = [rawRecords];
  } else if (fileType === "txt") {
    // WhatsApp dump parser
    const data = fs.readFileSync(filePath, "utf-8");
    const lines = data.split("\n");
    // Example line: "12/05/23, 14:30 - CustomerA: Ordered 2 Mango Pickles for 300"
    const dateRegex = /^\[?(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}[, ]*\d{1,2}:\d{2}(?::\d{2})?(?: [AP]M)?)\]?[ \-]*([^:]+):\s*(.*)/i;
    
    lines.forEach(line => {
      const match = line.match(dateRegex);
      if (match) {
        let [ , dateStr, sender, msg ] = match;
        const qtyMatch = msg.match(/(\d+)\s*(?:x|pcs|pieces|items|pack)/i);
        const revMatch = msg.match(/(?:\$|₹|rs\.?|amount|for)\s*(\d+(?:[.,]\d{2})?)/i);
        
        let quantity = qtyMatch ? parseInt(qtyMatch[1]) : 1;
        let revenue = revMatch ? parseFloat(revMatch[1].replace(/,/g, '')) : 0;
        
        if (revenue > 0) {
           rawRecords.push({
             date: dateStr,
             customer: sender.trim(),
             product: msg.substring(0, 40) + (msg.length > 40 ? "..." : ""),
             quantity,
             revenue,
             source: "WhatsApp"
           });
        }
      }
    });
  }

  const standardRecords = rawRecords.map(standardizeRecord).filter(r => !isNaN(r.revenue));

  const parsedDoc = new ParsedData({
    businessId,
    fileName: uploadFile.originalname,
    fileType,
    records: standardRecords
  });
  await parsedDoc.save();

  // Trigger Analytics Aggregation
  const result = await aggregateAnalytics(businessId, standardRecords);
  return result;
};

module.exports = { parseFileAndDeriveAnalytics };
