const makeInsight = (type, title, description, confidence) => ({
  id: "ins_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
  type, // positive, warning, opportunity, prediction
  title,
  description,
  confidence,
  timestamp: new Date()
});

const generateInsights = async (analyticsDoc) => {
  const insights = [];

  // Growth Analysis
  if (analyticsDoc.growthPercent > 10) {
    insights.push(makeInsight(
      "positive", 
      "Strong Growth Trend", 
      `Sales are up ${Math.round(analyticsDoc.growthPercent)}% recently. The positive trend projection is remarkably robust.`,
      92
    ));
  } else if (analyticsDoc.growthPercent < 0) {
    insights.push(makeInsight(
      "warning",
      "Sales Declining",
      `Caution: Sales have declined by ${Math.abs(Math.round(analyticsDoc.growthPercent))}%. Consider targeted promotional outreach.`,
      85
    ));
  }

  // Inventory/Product recommendations & Concentration Risk
  if (analyticsDoc.productPerformance && analyticsDoc.productPerformance.length > 0) {
    const topProd = analyticsDoc.productPerformance[0];
    
    // Growth/Stock recommendation
    insights.push(makeInsight(
      "opportunity",
      "Top Performer Scalability",
      `Increase ad spend or stock for fast-growing items like '${topProd.product}'. They are moving very quickly.`,
      88
    ));
    
    // Revenue Concentration Risk
    if (analyticsDoc.totalRevenue > 0) {
      const topProdPercentage = (topProd.revenue / analyticsDoc.totalRevenue) * 100;
      if (topProdPercentage > 40) {
        insights.push(makeInsight(
          "warning",
          "Revenue Concentration Risk",
          `'${topProd.product}' accounts for ${Math.round(topProdPercentage)}% of total revenue. Diversify your marketing to promote other items to avoid over-reliance.`,
          95
        ));
      }
    }

    if (analyticsDoc.productPerformance.length > 2) {
      const bottomProd = analyticsDoc.productPerformance[analyticsDoc.productPerformance.length - 1];
      insights.push(makeInsight(
        "opportunity",
        "Liquidate Slow Stock",
        `Consider discounting the low-performing item: '${bottomProd.product}' to free up capital.`,
        78
      ));
    }
  }

  // AOV Optimization
  if (analyticsDoc.averageOrderValue && analyticsDoc.averageOrderValue > 0) {
    if (analyticsDoc.averageOrderValue < 50) {
      insights.push(makeInsight(
        "opportunity",
        "AOV Expansion",
        `Your Average Order Value is relatively low (${Math.round(analyticsDoc.averageOrderValue)}). Consider product bundling or free shipping thresholds to increase basket size.`,
        82
      ));
    } else {
      insights.push(makeInsight(
        "positive",
        "High Value Customers",
        `Strong Average Order Value of ${Math.round(analyticsDoc.averageOrderValue)}. Introduce a premium tier or loyalty program to capitalize further.`,
        89
      ));
    }
  }

  // Peak Hours / Weekend optimization
  if (analyticsDoc.peakDays && analyticsDoc.peakDays.length > 0) {
     const topDay = [...analyticsDoc.peakDays].sort((a,b) => b.orders - a.orders)[0];
     if (['Saturday', 'Sunday'].includes(topDay.dayOfWeek)) {
       insights.push(makeInsight(
         "opportunity",
         "Weekend Staffing",
         `Weekend sales optimization required. Ensure support is heavily staffed on ${topDay.dayOfWeek}.`,
         91
       ));
     } else {
       insights.push(makeInsight(
         "prediction",
         "Demand Spikes",
         `Expected demand spike routinely happens on ${topDay.dayOfWeek}s. Prepare resources accordingly.`,
         87
       ));
     }
  }

  if (insights.length === 0) {
    insights.push({ type: "info", message: "Upload more historical data for deeper AI recommendations." });
  }

  analyticsDoc.insights = insights;
};

module.exports = { generateInsights };
