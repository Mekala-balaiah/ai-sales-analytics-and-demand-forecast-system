const Analytics = require("../models/Analytics");
const { generateInsights } = require("./insightsService");
const { generateForecasts } = require("./forecastingService");

const deriveCategory = (productName) => {
  const p = productName.toLowerCase();
  
  // Gym / Fitness Categories
  if (p.includes('annual') || p.includes('yearly') || p.includes('12 month') || p.includes('12month')) return 'Annual Membership';
  if (p.includes('quarterly') || p.includes('3 month') || p.includes('3month')) return 'Quarterly Membership';
  if (p.includes('6 month') || p.includes('6month') || p.includes('half year')) return 'Semi-Annual Membership';
  if (p.includes('monthly') || p.includes('1 month') || p.includes('1month') || p.includes('2 month') || p.includes('2month')) return 'Monthly Membership';
  if (p.includes('membership') || p.includes('workout') || p.includes('gym')) return 'Gym Membership';
  if (p.includes('personal training') || p.includes('pt') || p.includes('trainer')) return 'Personal Training';
  
  // SaaS / Tech Categories
  if (p.includes('subscription') || p.includes('software') || p.includes('saas')) return 'SaaS';
  if (p.includes('storage') || p.includes('server') || p.includes('cloud') || p.includes('hosting')) return 'Infrastructure';
  
  // Retail / Goods
  if (p.includes('clothing') || p.includes('shirt') || p.includes('wear') || p.includes('apparel')) return 'Apparel';
  if (p.includes('food') || p.includes('pickle') || p.includes('spice') || p.includes('sauce') || p.includes('drink') || p.includes('beverage')) return 'Food & Beverage';
  
  // Services
  if (p.includes('consulting') || p.includes('service') || p.includes('advice') || p.includes('course') || p.includes('training')) return 'Services';
  
  return 'General Retail';
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

  // Calendar-based Month-over-Month (MoM) or Period-over-Period growth rate
  const salesCount = doc.salesOverTime.length;
  if (salesCount > 1) {
    const monthMap = {};
    doc.salesOverTime.forEach(s => {
      const monthStr = s.date.substring(0, 7); // "YYYY-MM"
      monthMap[monthStr] = (monthMap[monthStr] || 0) + s.revenue;
    });
    
    const sortedMonths = Object.keys(monthMap).sort();
    if (sortedMonths.length > 1) {
      const currentMonthStr = sortedMonths[sortedMonths.length - 1];
      const previousMonthStr = sortedMonths[sortedMonths.length - 2];
      
      const currentRevenue = monthMap[currentMonthStr];
      const previousRevenue = monthMap[previousMonthStr];
      
      if (previousRevenue > 0) {
        doc.growthPercent = (currentRevenue / previousRevenue) * 100;
      } else {
        doc.growthPercent = 100;
      }
    } else {
      const midPoint = Math.floor(salesCount / 2);
      const firstHalf = doc.salesOverTime.slice(0, midPoint);
      const secondHalf = doc.salesOverTime.slice(midPoint);
      
      const firstHalfRevenue = firstHalf.reduce((acc, curr) => acc + curr.revenue, 0);
      const secondHalfRevenue = secondHalf.reduce((acc, curr) => acc + curr.revenue, 0);
      
      if (firstHalfRevenue > 0) {
        doc.growthPercent = (secondHalfRevenue / firstHalfRevenue) * 100;
      } else {
        doc.growthPercent = 100;
      }
    }
  } else {
    doc.growthPercent = 100;
  }
  
  // Forecast Accuracy default fallback (will be recalculated by forecasting service)
  if (!doc.forecastAccuracy) {
    doc.forecastAccuracy = 85;
  }

  await doc.save();

  // Next Steps
  await generateInsights(doc);
  await generateForecasts(businessId);

  return Analytics.findOne({ businessId });
};

const recalculateAnalyticsFromScratch = async (businessId) => {
  const ParsedData = require("../models/ParsedData");
  
  // Find all remaining uploads
  const uploads = await ParsedData.find({ businessId });
  const allRecords = uploads.flatMap(u => u.records);

  let doc = await Analytics.findOne({ businessId });
  if (!doc) {
    doc = new Analytics({ businessId });
  } else {
    // Reset all aggregated fields to clean slate
    doc.totalRevenue = 0;
    doc.totalOrders = 0;
    doc.averageOrderValue = 0;
    doc.growthPercent = 0;
    doc.salesOverTime = [];
    doc.productPerformance = [];
    doc.categoryDistribution = [];
    doc.peakDays = [];
    doc.peakHours = [];
    doc.insights = [];
    doc.predictions = [];
  }

  await doc.save();

  if (allRecords.length === 0) {
    return doc;
  }

  // Aggregate all remaining records from scratch
  return await aggregateAnalytics(businessId, allRecords);
};

module.exports = { aggregateAnalytics, recalculateAnalyticsFromScratch };
