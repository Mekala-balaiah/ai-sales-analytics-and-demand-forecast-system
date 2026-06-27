const fs = require("fs");
const csv = require("csv-parser");
const xlsx = require("xlsx");
const ParsedData = require("../models/ParsedData");
const { aggregateAnalytics } = require("./analyticsService");

const parseRobustDate = (val) => {
  if (!val) return new Date();

  if (val instanceof Date) {
    return isNaN(val.getTime()) ? new Date() : val;
  }

  if (typeof val === "number") {
    // Excel numeric date code. Excel base date is Dec 30, 1899
    return new Date((val - 25569) * 86400 * 1000);
  }

  if (typeof val === "string") {
    const trimmed = val.trim();
    if (!trimmed) return new Date();

    // Check for DD-MM-YY(YY) or DD/MM/YY(YY) formats
    const dmyRegex = /^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})(?:\s*,\s*|\s+)?(?:\s*(\d{1,2}):(\d{2})(?::(\d{2}))?)?/;
    const dmyMatch = trimmed.match(dmyRegex);
    if (dmyMatch) {
      const day = parseInt(dmyMatch[1], 10);
      const month = parseInt(dmyMatch[2], 10) - 1; // 0-indexed month
      let year = parseInt(dmyMatch[3], 10);
      if (year < 100) {
        year = year < 50 ? 2000 + year : 1900 + year;
      }
      const hour = dmyMatch[4] ? parseInt(dmyMatch[4], 10) : 0;
      const minute = dmyMatch[5] ? parseInt(dmyMatch[5], 10) : 0;
      const second = dmyMatch[6] ? parseInt(dmyMatch[6], 10) : 0;

      const d = new Date(year, month, day, hour, minute, second);
      if (!isNaN(d.getTime())) return d;
    }

    // Check for YYYY-MM-DD or YYYY/MM/DD formats
    const ymdRegex = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:\s*,\s*|\s+)?(?:\s*(\d{1,2}):(\d{2})(?::(\d{2}))?)?/;
    const ymdMatch = trimmed.match(ymdRegex);
    if (ymdMatch) {
      const year = parseInt(ymdMatch[1], 10);
      const month = parseInt(ymdMatch[2], 10) - 1;
      const day = parseInt(ymdMatch[3], 10);
      const hour = ymdMatch[4] ? parseInt(ymdMatch[4], 10) : 0;
      const minute = ymdMatch[5] ? parseInt(ymdMatch[5], 10) : 0;
      const second = ymdMatch[6] ? parseInt(ymdMatch[6], 10) : 0;

      const d = new Date(year, month, day, hour, minute, second);
      if (!isNaN(d.getTime())) return d;
    }

    // Fall back to standard Date parsing
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) return d;
  }

  return new Date();
};

const findBestKey = (keys, includeWords, excludeWords = []) => {
  const keysLower = keys.map(k => ({ original: k, lower: k.toLowerCase() }));
  
  // 1. Look for exact matches in order of preference
  for (const word of includeWords) {
    const match = keysLower.find(k => k.lower === word || k.lower === word.replace(/_/g, ' ') || k.lower === word.replace(/_/g, ''));
    if (match) return match.original;
  }
  
  // 2. Look for partial matches in order of preference
  for (const word of includeWords) {
    const match = keysLower.find(k => {
      const hasInclude = k.lower.includes(word);
      const hasExclude = excludeWords.some(exclude => k.lower.includes(exclude));
      return hasInclude && !hasExclude;
    });
    if (match) return match.original;
  }
  
  return null;
};

const standardizeRecord = (record) => {
  const keys = Object.keys(record);

  const dateKey = findBestKey(keys, 
    ["purchase_date", "order_date", "sales_date", "transaction_date", "date", "time", "timestamp", "created"],
    ["birth", "delivery", "ship", "end", "expiry", "due"]
  );

  const productKey = findBestKey(keys,
    ["product", "item", "service", "description", "desc", "package", "plan", "membership", "course", "sku"],
    ["id", "code", "price", "cost", "amount", "tax", "rep", "trainer", "member", "customer", "client", "buyer"]
  );

  const revenueKey = findBestKey(keys,
    ["final_amount", "net_amount", "grand_total", "total_revenue", "total_amount", "total", "revenue", "amount", "price", "sales", "paid"],
    ["rep", "name", "person", "agent", "id", "code", "date", "by", "tax", "tds", "fee", "discount", "pending", "due", "refund", "method", "mode"]
  );

  const quantityKey = findBestKey(keys,
    ["quantity", "qty", "number_of_items", "count", "units", "volume"],
    ["price", "amount", "revenue", "rate", "id", "code", "phone", "contact", "number"]
  );

  const customerKey = findBestKey(keys,
    ["customer_name", "client_name", "member_name", "buyer_name", "customer", "client", "member", "buyer", "name"],
    ["rep", "agent", "trainer", "by", "id", "code", "manager", "staff", "user"]
  );

  const categoryKey = findBestKey(keys,
    ["category", "product_category", "item_category", "type", "class", "group", "department", "segment"],
    ["pay", "card", "cash", "payment", "trainer", "member", "customer", "client", "user", "id", "code"]
  );

  const sourceKey = findBestKey(keys,
    ["source", "channel", "lead_source", "medium", "campaign", "referral", "referrer"],
    ["code", "id"]
  );

  return {
    date: dateKey && record[dateKey] !== undefined ? parseRobustDate(record[dateKey]) : new Date(),
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
             product: (() => {
               let pName = msg.trim();
               // Remove "Ordered 5 " prefix
               const orderPrefix = /ordered\s+\d+\s+/i;
               if (orderPrefix.test(pName)) {
                 pName = pName.replace(orderPrefix, "");
               }
               // Remove suffix like " - ₹1052" or " for 300"
               pName = pName.split(/[\-\:]|for|at/i)[0].trim();
               return pName.substring(0, 50);
             })(),
             quantity,
             revenue,
             source: "WhatsApp"
           });
        }
      }
    });
  }

  const standardRecords = rawRecords
    .map(standardizeRecord)
    .filter(r => {
      // Filter out rows that are completely empty or contain only fallbacks and zero revenue
      if (r.product === "Unknown Product" && r.revenue === 0 && r.customer === "Guest") {
        return false;
      }
      return !isNaN(r.revenue);
    });

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
