// Simplified Credit Card Recommendation Model (No external dependencies)
class CreditCardMLModel {
    constructor() {
        this.isLoaded = true; // Always loaded since we're using simple algorithms
        this.weights = {
            rewardRate: 0.4,
            annualFee: 0.2,
            userPreference: 0.2,
            signupBonus: 0.1,
            creditScore: 0.1
        };
    }

    async loadModel() {
        // No-op for simplified model
        console.log('Simple ML model loaded (no TensorFlow.js required)');
        return true;
    }

    async loadSavedModel() {
        // No-op for simplified model
        return true;
    }

    async initializeWithSyntheticData() {
        console.log('Simple model initialized with synthetic data');
    }

    async getRecommendation(transactionData, userProfile, availableCards) {
        if (!this.isLoaded) {
            await this.loadModel();
        }

        const recommendations = [];

        for (const card of availableCards) {
            try {
                const score = this.calculateSimpleScore(card, transactionData, userProfile);
                recommendations.push({
                    card: card,
                    score: score,
                    confidence: this.calculateConfidence(score)
                });
            } catch (error) {
                console.error(`Error calculating score for card ${card.name}:`, error);
                recommendations.push({
                    card: card,
                    score: 0.5,
                    confidence: 0.5
                });
            }
        }

        // Sort by score
        recommendations.sort((a, b) => b.score - a.score);

        return {
            recommended: recommendations[0],
            alternatives: recommendations.slice(1, 3),
            allRecommendations: recommendations
        };
    }

    calculateSimpleScore(card, transactionData, userProfile) {
        let score = 0;
        const { amount, category, merchant } = transactionData;

        // Reward rate factor (40% weight)
        const rewardRate = this.getRewardRate(card, category, merchant);
        score += rewardRate * 10 * this.weights.rewardRate;

        // Annual fee factor (20% weight)
        const annualFeeImpact = this.calculateAnnualFeeImpact(card, userProfile);
        score += annualFeeImpact * this.weights.annualFee;

        // User preference factor (20% weight)
        const preferenceScore = this.calculatePreferenceScore(card, userProfile, category);
        score += preferenceScore * this.weights.userPreference;

        // Signup bonus factor (10% weight)
        const signupBonusScore = this.calculateSignupBonusScore(card, userProfile);
        score += signupBonusScore * this.weights.signupBonus;

        // Credit score factor (10% weight)
        const creditScoreScore = this.calculateCreditScoreScore(card, userProfile);
        score += creditScoreScore * this.weights.creditScore;

        return Math.max(0, Math.min(100, score));
    }

    getRewardRate(card, category, merchant) {
        if (card.rewards && card.rewards[category]) {
            return card.rewards[category];
        }
        return card.rewards ? (card.rewards.other || 1) : 1;
    }

    calculateAnnualFeeImpact(card, userProfile) {
        if (card.annualFee === 0) return 100;

        const monthlySpending = userProfile.averageTransactionAmount * userProfile.totalTransactions / 12;
        const monthlyFee = card.annualFee / 12;
        
        if (monthlySpending === 0) return 50;
        
        const feeRatio = monthlyFee / monthlySpending;
        return Math.max(0, 100 - (feeRatio * 1000));
    }

    calculatePreferenceScore(card, userProfile, category) {
        const categorySpending = userProfile.spendingPreferences?.find(p => p.category === category);
        if (!categorySpending) return 50;

        const totalSpending = userProfile.spendingPreferences?.reduce((sum, p) => sum + p.monthlySpending, 0) || 1;
        const categoryRatio = categorySpending.monthlySpending / totalSpending;
        const rewardRate = this.getRewardRate(card, category, '');
        
        return categoryRatio * rewardRate * 100;
    }

    calculateSignupBonusScore(card, userProfile) {
        if (!card.signupBonus || card.signupBonus.amount === 0) return 0;
        
        const spendingCapacity = userProfile.monthlyIncome || 5000;
        const bonusValue = card.signupBonus.amount;
        
        return Math.min(100, (bonusValue / 100) * (spendingCapacity / 1000));
    }

    calculateCreditScoreScore(card, userProfile) {
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

    calculateConfidence(score) {
        // Convert score to confidence (0-1)
        return Math.abs(score - 50) / 50;
    }

    generateSyntheticTrainingData() {
        // Return empty array since we're not using ML training
        return [];
    }

    async trainModel(trainingData) {
        // No-op for simplified model
        console.log('Simple model - no training required');
    }

    async saveModel() {
        // No-op for simplified model
        return true;
    }

    getModelSummary() {
        return {
            isLoaded: this.isLoaded,
            type: 'Simple Algorithm Model',
            weights: this.weights
        };
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CreditCardMLModel;
} else {
    window.CreditCardMLModel = CreditCardMLModel;
}
