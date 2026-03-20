const mongoose = require("mongoose");

const analyticsSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: "Business", required: true },
  totalRevenue: { type: Number, default: 0 },
  totalOrders: { type: Number, default: 0 },
  growthPercent: { type: Number, default: 0 },
  averageOrderValue: { type: Number, default: 0 },
  forecastAccuracy: { type: Number, default: 85 },
  
  // Charts Data
  salesOverTime: [{ date: String, revenue: Number }],
  productPerformance: [{ product: String, revenue: Number, quantity: Number }],
  categoryDistribution: [{ category: String, value: Number }],
  peakDays: [{ dayOfWeek: String, orders: Number }],
  peakHours: [{ hour: String, orders: Number }],
  
  // Insights & Forecasts
  insights: [{ 
    id: String,
    type: { type: String }, // positive, warning, opportunity, prediction
    title: String,
    description: String,
    confidence: Number,
    timestamp: { type: Date, default: Date.now }
  }],
  predictions: [{ date: String, predictedRevenue: Number, confidenceScore: Number }],
  
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Analytics", analyticsSchema);
