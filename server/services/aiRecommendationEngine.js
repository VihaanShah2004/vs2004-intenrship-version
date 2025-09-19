const creditCardData = require('../data/creditCards.json');

class AIRecommendationEngine {
    constructor() {
        this.creditCards = creditCardData.creditCards;
        this.merchantCategories = creditCardData.merchantCategories;
    }

    /**
     * Get the best credit card recommendation for a transaction
     * @param {Object} transaction - Transaction details
     * @param {Object} user - User profile with credit cards and preferences
     * @returns {Object} Recommendation with card and reasoning
     */
    getRecommendation(transaction, user) {
        const { amount, merchant, category, description } = transaction;
        const userCards = user.creditCards || [];
        
        if (userCards.length === 0) {
            return {
                recommendedCard: null,
                reasoning: "No credit cards added to profile",
                confidence: 0
            };
        }

        // Get available cards from user's profile
        const availableCards = this.getAvailableCards(userCards);
        
        // Calculate scores for each card
        const cardScores = availableCards.map(card => {
            const score = this.calculateCardScore(card, transaction, user);
            return {
                card,
                score,
                reasoning: this.generateReasoning(card, transaction, user)
            };
        });

        // Sort by score and get the best recommendation
        cardScores.sort((a, b) => b.score - a.score);
        const bestRecommendation = cardScores[0];

        return {
            recommendedCard: bestRecommendation.card,
            reasoning: bestRecommendation.reasoning,
            confidence: this.calculateConfidence(bestRecommendation.score, cardScores),
            alternatives: cardScores.slice(1, 3).map(item => ({
                card: item.card,
                score: item.score,
                reasoning: item.reasoning
            }))
        };
    }

    /**
     * Get available cards from user's profile
     */
    getAvailableCards(userCards) {
        return userCards
            .filter(userCard => userCard.isActive)
            .map(userCard => {
                const cardData = this.creditCards.find(card => card.id === userCard.cardId);
                return cardData ? { ...cardData, userCard } : null;
            })
            .filter(card => card !== null);
    }

    /**
     * Calculate score for a specific card based on transaction and user profile
     */
    calculateCardScore(card, transaction, user) {
        let score = 0;
        const { amount, category, merchant } = transaction;

        // Base reward rate scoring
        const rewardRate = this.getRewardRate(card, category, merchant);
        score += rewardRate * 100; // Convert to percentage

        // Annual fee consideration
        if (card.annualFee > 0) {
            const monthlyFee = card.annualFee / 12;
            const feeImpact = Math.max(0, 1 - (monthlyFee / (amount || 100)));
            score *= feeImpact;
        }

        // User spending pattern consideration
        const userSpendingPattern = this.getUserSpendingPattern(user, category);
        score *= (1 + userSpendingPattern * 0.2);

        // Signup bonus consideration (if applicable)
        if (this.isEligibleForSignupBonus(card, user)) {
            score += 50; // Bonus points for signup bonus eligibility
        }

        // Credit score compatibility
        const creditScoreCompatibility = this.getCreditScoreCompatibility(card, user);
        score *= creditScoreCompatibility;

        return Math.max(0, score);
    }

    /**
     * Get reward rate for a specific category and merchant
     */
    getRewardRate(card, category, merchant) {
        const normalizedCategory = this.normalizeCategory(category, merchant);
        
        // Check for specific category rewards
        if (card.rewards[normalizedCategory]) {
            return card.rewards[normalizedCategory];
        }

        // Check for rotating categories (simplified logic)
        if (card.rewards.rotating && this.isRotatingCategoryActive(normalizedCategory)) {
            return card.rewards.rotating;
        }

        // Default to general rewards
        return card.rewards.other || 1;
    }

    /**
     * Normalize category based on merchant and category
     */
    normalizeCategory(category, merchant) {
        const merchantLower = (merchant || '').toLowerCase();
        const categoryLower = (category || '').toLowerCase();

        // Check merchant categories
        for (const [mainCategory, subcategories] of Object.entries(this.merchantCategories)) {
            if (subcategories.some(sub => merchantLower.includes(sub) || categoryLower.includes(sub))) {
                return mainCategory;
            }
        }

        return 'other';
    }

    /**
     * Check if rotating category is active (simplified - in real app, this would be dynamic)
     */
    isRotatingCategoryActive(category) {
        // Simplified logic - in a real app, this would check current quarter's categories
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
     * Get user spending pattern for a category
     */
    getUserSpendingPattern(user, category) {
        const preference = user.spendingPreferences?.find(p => p.category === category);
        if (!preference) return 0;

        // Normalize spending pattern (0-1 scale)
        const maxSpending = Math.max(...(user.spendingPreferences?.map(p => p.monthlySpending) || [0]));
        return maxSpending > 0 ? preference.monthlySpending / maxSpending : 0;
    }

    /**
     * Check if user is eligible for signup bonus
     */
    isEligibleForSignupBonus(card, user) {
        // Simplified logic - in real app, this would check if user already has the card
        const userHasCard = user.creditCards?.some(userCard => userCard.cardId === card.id);
        return !userHasCard && card.signupBonus.amount > 0;
    }

    /**
     * Get credit score compatibility
     */
    getCreditScoreCompatibility(card, user) {
        const userScore = user.creditScore;
        const requiredScore = card.creditScoreRequired;

        const scoreMap = {
            'Poor': 1,
            'Fair': 2,
            'Good': 3,
            'Very Good': 4,
            'Excellent': 5
        };

        const userScoreNum = scoreMap[userScore] || 3;
        const requiredScoreNum = scoreMap[requiredScore] || 3;

        if (userScoreNum >= requiredScoreNum) {
            return 1.0;
        } else if (userScoreNum >= requiredScoreNum - 1) {
            return 0.8;
        } else {
            return 0.5;
        }
    }

    /**
     * Generate human-readable reasoning for recommendation
     */
    generateReasoning(card, transaction, user) {
        const { amount, category, merchant } = transaction;
        const rewardRate = this.getRewardRate(card, category, merchant);
        const reasoning = [];

        // Reward rate reasoning
        if (rewardRate > 1) {
            reasoning.push(`Earns ${rewardRate}% cashback on ${category || 'this purchase'}`);
        } else {
            reasoning.push(`Earns ${rewardRate}% cashback on all purchases`);
        }

        // Annual fee reasoning
        if (card.annualFee > 0) {
            reasoning.push(`Annual fee: $${card.annualFee}`);
        } else {
            reasoning.push(`No annual fee`);
        }

        // Signup bonus reasoning
        if (this.isEligibleForSignupBonus(card, user)) {
            reasoning.push(`Eligible for signup bonus: ${card.signupBonus.amount} ${card.signupBonus.currency}`);
        }

        // User pattern reasoning
        const userSpendingPattern = this.getUserSpendingPattern(user, category);
        if (userSpendingPattern > 0.5) {
            reasoning.push(`Matches your high spending in ${category}`);
        }

        return reasoning.join('. ');
    }

    /**
     * Calculate confidence score
     */
    calculateConfidence(bestScore, allScores) {
        if (allScores.length === 1) return 0.8;
        
        const secondBestScore = allScores[1]?.score || 0;
        const scoreDifference = bestScore - secondBestScore;
        const maxScore = Math.max(...allScores.map(s => s.score));
        
        return Math.min(0.95, Math.max(0.5, scoreDifference / maxScore + 0.5));
    }

    /**
     * Get all available credit cards for user to add
     */
    getAllAvailableCards() {
        return this.creditCards.map(card => ({
            id: card.id,
            name: card.name,
            bank: card.bank,
            type: card.type,
            annualFee: card.annualFee,
            creditScoreRequired: card.creditScoreRequired,
            rewards: card.rewards,
            signupBonus: card.signupBonus,
            benefits: card.benefits
        }));
    }

    /**
     * Analyze user's spending patterns and suggest new cards
     */
    analyzeSpendingPatterns(user) {
        const userCards = user.creditCards || [];
        const spendingPreferences = user.spendingPreferences || [];
        
        const suggestions = [];
        
        // Find categories where user spends most but doesn't have optimal cards
        spendingPreferences.forEach(preference => {
            if (preference.monthlySpending > 500) { // High spending threshold
                const bestCardForCategory = this.findBestCardForCategory(preference.category, userCards);
                if (bestCardForCategory) {
                    suggestions.push({
                        category: preference.category,
                        currentSpending: preference.monthlySpending,
                        suggestedCard: bestCardForCategory,
                        potentialSavings: this.calculatePotentialSavings(preference, bestCardForCategory)
                    });
                }
            }
        });

        return suggestions;
    }

    /**
     * Find best card for a specific category that user doesn't have
     */
    findBestCardForCategory(category, userCards) {
        const userCardIds = userCards.map(card => card.cardId);
        
        return this.creditCards
            .filter(card => !userCardIds.includes(card.id))
            .sort((a, b) => {
                const aReward = a.rewards[category] || a.rewards.other || 1;
                const bReward = b.rewards[category] || b.rewards.other || 1;
                return bReward - aReward;
            })[0];
    }

    /**
     * Calculate potential savings from using a different card
     */
    calculatePotentialSavings(preference, card) {
        const currentReward = 1; // Assume 1% current reward
        const newReward = card.rewards[preference.category] || card.rewards.other || 1;
        const monthlySpending = preference.monthlySpending;
        
        return (newReward - currentReward) * monthlySpending / 100;
    }
}

module.exports = new AIRecommendationEngine();
