const mongoose = require("mongoose");

const creditCardSchema = new mongoose.Schema({
    cardId: { type: String, required: true },
    cardName: { type: String, required: true },
    bank: { type: String, required: true },
    lastFourDigits: { type: String },
    isActive: { type: Boolean, default: true },
    addedDate: { type: Date, default: Date.now }
});

const spendingPreferenceSchema = new mongoose.Schema({
    category: { type: String, required: true },
    monthlySpending: { type: Number, default: 0 },
    priority: { type: Number, default: 1 } // 1-5 scale
});

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    
    // Profile Information
    firstName: { type: String },
    lastName: { type: String },
    monthlyIncome: { type: Number },
    creditScore: { type: String, enum: ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'] },
    
    // Credit Cards
    creditCards: [creditCardSchema],
    
    // Spending Preferences
    spendingPreferences: [spendingPreferenceSchema],
    
    // AI Learning Data
    totalTransactions: { type: Number, default: 0 },
    averageTransactionAmount: { type: Number, default: 0 },
    preferredCategories: [String],
    
    // Settings
    notificationsEnabled: { type: Boolean, default: true },
    autoRecommendations: { type: Boolean, default: true },
    
    // Timestamps
    createdAt: { type: Date, default: Date.now },
    lastLogin: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", userSchema);
