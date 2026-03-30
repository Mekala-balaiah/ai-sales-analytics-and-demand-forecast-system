const Analytics = require("../models/Analytics");
const { generateInsights } = require("./insightsService");
const { generateForecasts } = require("./forecastingService");

const deriveCategory = (productName) => {
  const p = productName.toLowerCase();
  if (p.includes('subscription') || p.includes('software')) return 'SaaS';
  if (p.includes('consulting') || p.includes('service')) return 'Services';
  if (p.includes('storage') || p.includes('server')) return 'Infrastructure';
  return 'Other';
};

const aggregateAnalytics = async (businessId, newRecords) => {
  let doc = await Analytics.findOne({ businessId });
  if (!doc) doc = new Analytics({ businessId });

  let payloadRevenue = 0;
  let payloadOrders = newRecords.length;

  const productMap = {};
  const dateMap = {};
  const categoryMap = {};
  const dayMap = {};
  const hourMap = {};

  // Maintain existing state
  doc.productPerformance.forEach(p => { productMap[p.product] = { revenue: p.revenue, quantity: p.quantity }; });
  doc.salesOverTime.forEach(s => { dateMap[s.date] = s.revenue; });
  doc.categoryDistribution.forEach(c => { categoryMap[c.category] = c.value; });

  newRecords.forEach(r => {
    payloadRevenue += r.revenue;
    
    // Products
    if (!productMap[r.product]) productMap[r.product] = { revenue: 0, quantity: 0 };
    productMap[r.product].revenue += r.revenue;
    productMap[r.product].quantity += r.quantity;

    // Categories
    const cat = deriveCategory(r.product);
    categoryMap[cat] = (categoryMap[cat] || 0) + r.revenue;

    // Dates & Peak Analysis
    let d = r.date && !isNaN(r.date.getTime()) ? r.date : new Date();
    const dStr = d.toISOString().split("T")[0];
    const dayOfWeek = d.toLocaleDateString('en-US', { weekday: 'long' });
    const hour = d.getHours() + ':00';

    if (!dateMap[dStr]) dateMap[dStr] = 0;
    dateMap[dStr] += r.revenue;

    dayMap[dayOfWeek] = (dayMap[dayOfWeek] || 0) + 1;
    hourMap[hour] = (hourMap[hour] || 0) + 1;
  });

  doc.totalRevenue += payloadRevenue;
  doc.totalOrders += payloadOrders;
  doc.averageOrderValue = doc.totalOrders > 0 ? doc.totalRevenue / doc.totalOrders : 0;
  
  // Maps to Arrays
  doc.productPerformance = Object.keys(productMap).map(k => ({ product: k, ...productMap[k] })).sort((a,b) => b.revenue - a.revenue);
  doc.salesOverTime = Object.keys(dateMap).sort().map(k => ({ date: k, revenue: dateMap[k] }));
  doc.categoryDistribution = Object.keys(categoryMap).map(k => ({ category: k, value: categoryMap[k] }));
  
  // Assuming this is cumulative daily data approximation
  doc.peakDays = Object.keys(dayMap).map(k => ({ dayOfWeek: k, orders: dayMap[k] }));
  doc.peakHours = Object.keys(hourMap).map(k => ({ hour: k, orders: hourMap[k] }));

  // Growth calculation: Compare the last 50% of the timeline to the first 50%
  const salesCount = doc.salesOverTime.length;
  if (salesCount > 1) {
    const midPoint = Math.floor(salesCount / 2);
    const firstHalf = doc.salesOverTime.slice(0, midPoint);
    const secondHalf = doc.salesOverTime.slice(midPoint);
    
    const firstHalfRevenue = firstHalf.reduce((acc, curr) => acc + curr.revenue, 0);
    const secondHalfRevenue = secondHalf.reduce((acc, curr) => acc + curr.revenue, 0);

    if (firstHalfRevenue > 0) {
      doc.growthPercent = (secondHalfRevenue / firstHalfRevenue) * 100;
    } else {
      // If we only have data in the second half, it's 100% growth (or baseline)
      doc.growthPercent = 100;
    }
  } else {
    // Initial state or single data point
    doc.growthPercent = 100;
  }
  
  // Forecast Accuracy simulation metric
  doc.forecastAccuracy = 82 + Math.floor(Math.random() * 15);

  await doc.save();

  // Next Steps
  await generateInsights(doc);
  await generateForecasts(businessId);

  return Analytics.findOne({ businessId });
};

module.exports = { aggregateAnalytics };
