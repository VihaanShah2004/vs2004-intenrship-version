const creditCardData = require('../data/creditCards.json');

class MLRecommendationModel {
    constructor() {
        this.creditCards = creditCardData.creditCards;
        this.userProfiles = new Map(); // In-memory storage for demo
        this.transactionHistory = new Map(); // In-memory storage for demo
        this.modelWeights = this.initializeModelWeights();
    }

    /**
     * Initialize model weights for different factors
     */
    initializeModelWeights() {
        return {
            rewardRate: 0.4,        // 40% weight on reward rate
            annualFee: 0.2,         // 20% weight on annual fee
            userPreference: 0.2,    // 20% weight on user spending patterns
            signupBonus: 0.1,       // 10% weight on signup bonus
            creditScore: 0.1        // 10% weight on credit score compatibility
        };
    }

    /**
     * Train the model with user transaction data
     */
    trainModel(userId, transactions) {
        const userProfile = this.userProfiles.get(userId) || this.createUserProfile(userId);
        
        // Process transactions to update user profile
        transactions.forEach(transaction => {
            this.updateUserProfile(userProfile, transaction);
        });

        this.userProfiles.set(userId, userProfile);
        
        // Update model weights based on user behavior
        this.updateModelWeights(userProfile);
    }

    /**
     * Create initial user profile
     */
    createUserProfile(userId) {
        return {
            userId,
            categorySpending: {},
            averageTransactionAmount: 0,
            totalTransactions: 0,
            preferredMerchants: new Set(),
            timePatterns: {
                weekday: 0,
                weekend: 0,
                morning: 0,
                afternoon: 0,
                evening: 0
            },
            seasonalPatterns: {
                spring: 0,
                summer: 0,
                fall: 0,
                winter: 0
            }
        };
    }

    /**
     * Update user profile based on transaction
     */
    updateUserProfile(userProfile, transaction) {
        const { amount, category, merchant, timestamp } = transaction;
        
        // Update category spending
        if (!userProfile.categorySpending[category]) {
            userProfile.categorySpending[category] = { total: 0, count: 0 };
        }
        userProfile.categorySpending[category].total += amount;
        userProfile.categorySpending[category].count += 1;

        // Update average transaction amount
        userProfile.totalTransactions += 1;
        userProfile.averageTransactionAmount = 
            (userProfile.averageTransactionAmount * (userProfile.totalTransactions - 1) + amount) / 
            userProfile.totalTransactions;

        // Update preferred merchants
        if (merchant) {
            userProfile.preferredMerchants.add(merchant);
        }

        // Update time patterns
        if (timestamp) {
            const date = new Date(timestamp);
            const hour = date.getHours();
            const dayOfWeek = date.getDay();
            const month = date.getMonth();

            // Time of day
            if (hour >= 6 && hour < 12) userProfile.timePatterns.morning += amount;
            else if (hour >= 12 && hour < 18) userProfile.timePatterns.afternoon += amount;
            else userProfile.timePatterns.evening += amount;

            // Day of week
            if (dayOfWeek >= 1 && dayOfWeek <= 5) userProfile.timePatterns.weekday += amount;
            else userProfile.timePatterns.weekend += amount;

            // Season
            if (month >= 2 && month <= 4) userProfile.seasonalPatterns.spring += amount;
            else if (month >= 5 && month <= 7) userProfile.seasonalPatterns.summer += amount;
            else if (month >= 8 && month <= 10) userProfile.seasonalPatterns.fall += amount;
            else userProfile.seasonalPatterns.winter += amount;
        }
    }

    /**
     * Update model weights based on user behavior
     */
    updateModelWeights(userProfile) {
        // Analyze user behavior to adjust weights
        const totalSpending = Object.values(userProfile.categorySpending)
            .reduce((sum, cat) => sum + cat.total, 0);

        // If user has high spending, increase reward rate weight
        if (totalSpending > 5000) {
            this.modelWeights.rewardRate = Math.min(0.5, this.modelWeights.rewardRate + 0.05);
        }

        // If user has many transactions, increase preference weight
        if (userProfile.totalTransactions > 100) {
            this.modelWeights.userPreference = Math.min(0.3, this.modelWeights.userPreference + 0.05);
        }

        // Normalize weights
        const totalWeight = Object.values(this.modelWeights).reduce((sum, weight) => sum + weight, 0);
        Object.keys(this.modelWeights).forEach(key => {
            this.modelWeights[key] /= totalWeight;
        });
    }

    /**
     * Get ML-powered recommendation
     */
    getMLRecommendation(userId, transaction, availableCards) {
        const userProfile = this.userProfiles.get(userId);
        if (!userProfile) {
            return this.getBasicRecommendation(transaction, availableCards);
        }

        const cardScores = availableCards.map(card => {
            const score = this.calculateMLScore(card, transaction, userProfile);
            return {
                card,
                score,
                factors: this.getScoreFactors(card, transaction, userProfile)
            };
        });

        cardScores.sort((a, b) => b.score - a.score);
        return cardScores[0];
    }

    /**
     * Calculate ML-based score for a card
     */
    calculateMLScore(card, transaction, userProfile) {
        let score = 0;
        const { amount, category, merchant } = transaction;

        // Reward rate factor
        const rewardRate = this.getRewardRate(card, category, merchant);
        score += rewardRate * 100 * this.modelWeights.rewardRate;

        // Annual fee factor
        const annualFeeImpact = this.calculateAnnualFeeImpact(card, userProfile);
        score += annualFeeImpact * this.modelWeights.annualFee;

        // User preference factor
        const preferenceScore = this.calculatePreferenceScore(card, userProfile, category);
        score += preferenceScore * this.modelWeights.userPreference;

        // Signup bonus factor
        const signupBonusScore = this.calculateSignupBonusScore(card, userProfile);
        score += signupBonusScore * this.modelWeights.signupBonus;

        // Credit score factor
        const creditScoreScore = this.calculateCreditScoreScore(card, userProfile);
        score += creditScoreScore * this.modelWeights.creditScore;

        return Math.max(0, score);
    }

    /**
     * Get reward rate for category and merchant
     */
    getRewardRate(card, category, merchant) {
        const normalizedCategory = this.normalizeCategory(category, merchant);
        
        if (card.rewards[normalizedCategory]) {
            return card.rewards[normalizedCategory];
        }

        if (card.rewards.rotating && this.isRotatingCategoryActive(normalizedCategory)) {
            return card.rewards.rotating;
        }

        return card.rewards.other || 1;
    }

    /**
     * Normalize category
     */
    normalizeCategory(category, merchant) {
        const merchantLower = (merchant || '').toLowerCase();
        const categoryLower = (category || '').toLowerCase();

        const merchantCategories = {
            "dining": ["restaurant", "food", "cafe", "bar"],
            "groceries": ["grocery", "supermarket", "food"],
            "travel": ["airline", "hotel", "travel", "gas"],
            "gas": ["gas", "fuel", "station"],
            "drugstores": ["pharmacy", "drug", "cvs", "walgreens"],
            "wholesale": ["costco", "sam's", "wholesale"],
            "entertainment": ["movie", "streaming", "entertainment"],
            "utilities": ["electric", "water", "internet", "phone"],
            "shopping": ["store", "shop", "retail"],
            "general": ["other", "miscellaneous"]
        };

        for (const [mainCategory, subcategories] of Object.entries(merchantCategories)) {
            if (subcategories.some(sub => merchantLower.includes(sub) || categoryLower.includes(sub))) {
                return mainCategory;
            }
        }

        return 'general';
    }

    /**
     * Check if rotating category is active
     */
    isRotatingCategoryActive(category) {
        const currentQuarter = Math.floor((new Date().getMonth() + 3) / 3);
        const rotatingCategories = {
            1: ['groceries', 'gas'],
            2: ['dining', 'entertainment'],
            3: ['travel', 'shopping'],
            4: ['wholesale', 'drugstores']
        };
        
        return rotatingCategories[currentQuarter]?.includes(category) || false;
    }

    /**
     * Calculate annual fee impact
     */
    calculateAnnualFeeImpact(card, userProfile) {
        if (card.annualFee === 0) return 100;

        const monthlySpending = userProfile.averageTransactionAmount * userProfile.totalTransactions / 12;
        const monthlyFee = card.annualFee / 12;
        
        if (monthlySpending === 0) return 50;
        
        const feeRatio = monthlyFee / monthlySpending;
        return Math.max(0, 100 - (feeRatio * 1000));
    }

    /**
     * Calculate preference score based on user spending patterns
     */
    calculatePreferenceScore(card, userProfile, category) {
        const categorySpending = userProfile.categorySpending[category];
        if (!categorySpending) return 50;

        const totalSpending = Object.values(userProfile.categorySpending)
            .reduce((sum, cat) => sum + cat.total, 0);
        
        const categoryRatio = categorySpending.total / totalSpending;
        const rewardRate = this.getRewardRate(card, category, '');
        
        return categoryRatio * rewardRate * 100;
    }

    /**
     * Calculate signup bonus score
     */
    calculateSignupBonusScore(card, userProfile) {
        if (!card.signupBonus || card.signupBonus.amount === 0) return 0;
        
        // Higher score for users with more spending capacity
        const spendingCapacity = userProfile.averageTransactionAmount * userProfile.totalTransactions;
        const bonusValue = card.signupBonus.amount;
        
        return Math.min(100, (bonusValue / 100) * (spendingCapacity / 1000));
    }

    /**
     * Calculate credit score compatibility score
     */
    calculateCreditScoreScore(card, userProfile) {
        // Simplified - in real app, this would use actual credit score
        const userCreditScore = userProfile.creditScore || 'Good';
        const requiredScore = card.creditScoreRequired;

        const scoreMap = {
            'Poor': 1,
            'Fair': 2,
            'Good': 3,
            'Very Good': 4,
            'Excellent': 5
        };

        const userScoreNum = scoreMap[userCreditScore] || 3;
        const requiredScoreNum = scoreMap[requiredScore] || 3;

        if (userScoreNum >= requiredScoreNum) {
            return 100;
        } else if (userScoreNum >= requiredScoreNum - 1) {
            return 80;
        } else {
            return 50;
        }
    }

    /**
     * Get score factors for explanation
     */
    getScoreFactors(card, transaction, userProfile) {
        return {
            rewardRate: this.getRewardRate(card, transaction.category, transaction.merchant),
            annualFeeImpact: this.calculateAnnualFeeImpact(card, userProfile),
            preferenceScore: this.calculatePreferenceScore(card, userProfile, transaction.category),
            signupBonusScore: this.calculateSignupBonusScore(card, userProfile),
            creditScoreScore: this.calculateCreditScoreScore(card, userProfile)
        };
    }

    /**
     * Get basic recommendation when no user profile exists
     */
    getBasicRecommendation(transaction, availableCards) {
        const cardScores = availableCards.map(card => {
            const rewardRate = this.getRewardRate(card, transaction.category, transaction.merchant);
            const score = rewardRate * 100;
            return {
                card,
                score,
                factors: { rewardRate, annualFeeImpact: 50, preferenceScore: 50, signupBonusScore: 0, creditScoreScore: 50 }
            };
        });

        cardScores.sort((a, b) => b.score - a.score);
        return cardScores[0];
    }

    /**
     * Predict user's next spending category
     */
    predictNextCategory(userId) {
        const userProfile = this.userProfiles.get(userId);
        if (!userProfile) return 'general';

        const categorySpending = userProfile.categorySpending;
        const totalSpending = Object.values(categorySpending)
            .reduce((sum, cat) => sum + cat.total, 0);

        let maxCategory = 'general';
        let maxRatio = 0;

        Object.entries(categorySpending).forEach(([category, data]) => {
            const ratio = data.total / totalSpending;
            if (ratio > maxRatio) {
                maxRatio = ratio;
                maxCategory = category;
            }
        });

        return maxCategory;
    }

    /**
     * Get model insights
     */
    getModelInsights(userId) {
        const userProfile = this.userProfiles.get(userId);
        if (!userProfile) return null;

        return {
            totalSpending: Object.values(userProfile.categorySpending)
                .reduce((sum, cat) => sum + cat.total, 0),
            topCategories: Object.entries(userProfile.categorySpending)
                .sort((a, b) => b[1].total - a[1].total)
                .slice(0, 3)
                .map(([category, data]) => ({ category, total: data.total, count: data.count })),
            spendingPatterns: {
                averageTransaction: userProfile.averageTransactionAmount,
                totalTransactions: userProfile.totalTransactions,
                timePatterns: userProfile.timePatterns,
                seasonalPatterns: userProfile.seasonalPatterns
            },
            modelWeights: this.modelWeights
        };
    }
}

module.exports = new MLRecommendationModel();
