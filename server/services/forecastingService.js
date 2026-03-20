const simpleStatistics = require("simple-statistics");
const Analytics = require("../models/Analytics");

const generateForecasts = async (businessId) => {
  const analytics = await Analytics.findOne({ businessId });
  if (!analytics || analytics.salesOverTime.length < 3) return analytics;

  const revenues = analytics.salesOverTime.map(item => item.revenue);
  const dataPoints = revenues.map((r, index) => [index, r]);
  
  // Regression
  const regressionLine = simpleStatistics.linearRegressionLine(simpleStatistics.linearRegression(dataPoints));
  
  // Moving Average Simulation (Window = 3)
  const movingAvg = revenues.length >= 3 ? (revenues[revenues.length-1] + revenues[revenues.length-2] + revenues[revenues.length-3]) / 3 : revenues[revenues.length-1];

  const lastIndex = dataPoints.length - 1;
  const newPredictions = [];
  
  for (let i = 1; i <= 7; i++) {
    let projected = regressionLine(lastIndex + i);
    // Blend Moving Average and Trend Projection
    let blended = (projected * 0.6) + (movingAvg * 0.4);
    
    // Simulate Seasonality (e.g. slight bump on weekends if peak days indicate so, but we randomize slight variance)
    const seasonalityMultiplier = 1 + (Math.random() * 0.1 - 0.05); 
    const finalExpected = Math.max(0, blended * seasonalityMultiplier);

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + i);
    const dateStr = futureDate.toISOString().split("T")[0];

    newPredictions.push({
      date: dateStr,
      predictedRevenue: parseFloat(finalExpected.toFixed(2)),
      confidenceScore: 85 - i // Reduces confidence further out
    });
  }

  analytics.predictions = newPredictions;
  await analytics.save();
  return analytics;
};

module.exports = { generateForecasts };
