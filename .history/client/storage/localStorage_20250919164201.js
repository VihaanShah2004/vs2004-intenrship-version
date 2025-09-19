// Local Storage Manager for VIDAVA AI
class LocalStorageManager {
    constructor() {
        this.storageKey = 'vidava_ai_data';
        this.initializeStorage();
    }

    initializeStorage() {
        if (!this.getData()) {
            this.setData({
                users: {},
                transactions: {},
                creditCards: {},
                settings: {
                    version: '1.0.0',
                    lastUpdated: new Date().toISOString()
                }
            });
        }
    }

    getData() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return null;
        }
    }

    setData(data) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error writing to localStorage:', error);
            return false;
        }
    }

    // User Management
    createUser(userData) {
        const data = this.getData();
        const userId = this.generateUserId();
        
        const user = {
            id: userId,
            email: userData.email,
            password: userData.password, // In real app, this should be hashed
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            monthlyIncome: userData.monthlyIncome || 0,
            creditScore: userData.creditScore || 'Good',
            creditCards: [],
            spendingPreferences: [],
            totalTransactions: 0,
            averageTransactionAmount: 0,
            preferredCategories: [],
            notificationsEnabled: true,
            autoRecommendations: true,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
        };

        data.users[userId] = user;
        this.setData(data);
        return user;
    }

    getUserByEmail(email) {
        const data = this.getData();
        return Object.values(data.users).find(user => user.email === email);
    }

    getUserById(userId) {
        const data = this.getData();
        return data.users[userId] || null;
    }

    updateUser(userId, updates) {
        const data = this.getData();
        if (data.users[userId]) {
            data.users[userId] = { ...data.users[userId], ...updates };
            this.setData(data);
            return data.users[userId];
        }
        return null;
    }

    // Credit Card Management
    addCreditCardToUser(userId, cardData) {
        const data = this.getData();
        if (data.users[userId]) {
            const user = data.users[userId];
            
            // Check if card already exists
            const existingCard = user.creditCards.find(card => card.cardId === cardData.cardId);
            if (existingCard) {
                return { success: false, message: 'Card already added to profile' };
            }

            const userCard = {
                cardId: cardData.cardId,
                cardName: cardData.cardName,
                bank: cardData.bank,
                lastFourDigits: cardData.lastFourDigits || '',
                isActive: true,
                addedDate: new Date().toISOString(),
                creditLimit: cardData.creditLimit || 0,
                currentBalance: 0
            };

            user.creditCards.push(userCard);
            this.setData(data);
            return { success: true, card: userCard };
        }
        return { success: false, message: 'User not found' };
    }

    removeCreditCardFromUser(userId, cardId) {
        const data = this.getData();
        if (data.users[userId]) {
            const user = data.users[userId];
            user.creditCards = user.creditCards.filter(card => card.cardId !== cardId);
            this.setData(data);
            return { success: true };
        }
        return { success: false, message: 'User not found' };
    }

    updateUserCreditCard(userId, cardId, updates) {
        const data = this.getData();
        if (data.users[userId]) {
            const user = data.users[userId];
            const cardIndex = user.creditCards.findIndex(card => card.cardId === cardId);
            if (cardIndex !== -1) {
                user.creditCards[cardIndex] = { ...user.creditCards[cardIndex], ...updates };
                this.setData(data);
                return { success: true, card: user.creditCards[cardIndex] };
            }
        }
        return { success: false, message: 'Card not found' };
    }

    // Transaction Management
    addTransaction(userId, transactionData) {
        const data = this.getData();
        if (!data.transactions[userId]) {
            data.transactions[userId] = [];
        }

        const transaction = {
            id: this.generateTransactionId(),
            userId: userId,
            amount: transactionData.amount,
            merchant: transactionData.merchant || '',
            category: transactionData.category || 'general',
            description: transactionData.description || '',
            cardId: transactionData.cardId || null,
            recommendedCardId: transactionData.recommendedCardId || null,
            timestamp: new Date().toISOString(),
            location: transactionData.location || null
        };

        data.transactions[userId].push(transaction);

        // Update user statistics
        if (data.users[userId]) {
            const user = data.users[userId];
            user.totalTransactions += 1;
            user.averageTransactionAmount = 
                (user.averageTransactionAmount * (user.totalTransactions - 1) + transaction.amount) / 
                user.totalTransactions;
        }

        this.setData(data);
        return transaction;
    }

    getTransactions(userId, limit = 50) {
        const data = this.getData();
        const transactions = data.transactions[userId] || [];
        return transactions.slice(-limit).reverse(); // Most recent first
    }

    // Spending Preferences
    updateSpendingPreferences(userId, preferences) {
        const data = this.getData();
        if (data.users[userId]) {
            data.users[userId].spendingPreferences = preferences;
            this.setData(data);
            return { success: true };
        }
        return { success: false, message: 'User not found' };
    }

    // Credit Card Database
    loadCreditCards() {
        const data = this.getData();
        if (!data.creditCards || Object.keys(data.creditCards).length === 0) {
            // Load from the JSON file if not in storage
            this.initializeCreditCards();
        }
        return data.creditCards;
    }

    initializeCreditCards() {
        // This would typically load from the creditCards.json file
        // For now, we'll create a simplified version
        const creditCards = {
            "chase_sapphire_preferred": {
                "id": "chase_sapphire_preferred",
                "name": "Chase Sapphire Preferred",
                "bank": "Chase",
                "type": "Travel",
                "annualFee": 95,
                "creditScoreRequired": "Good to Excellent",
                "creditLimitRange": {
                    "min": 5000,
                    "max": 50000,
                    "typical": 15000
                },
                "rewards": {
                    "travel": 2,
                    "dining": 2,
                    "other": 1
                },
                "signupBonus": {
                    "amount": 60000,
                    "currency": "points",
                    "spendingRequirement": 4000,
                    "timeframe": "3 months"
                },
                "benefits": [
                    "Travel insurance",
                    "No foreign transaction fees",
                    "Transfer partners",
                    "Primary rental car insurance"
                ],
                "categories": ["travel", "dining", "general"],
                "features": {
                    "foreignTransactionFee": 0,
                    "balanceTransferFee": 0.05,
                    "cashAdvanceFee": 0.05,
                    "latePaymentFee": 40,
                    "aprRange": "21.49-28.49"
                }
            },
            "chase_freedom_unlimited": {
                "id": "chase_freedom_unlimited",
                "name": "Chase Freedom Unlimited",
                "bank": "Chase",
                "type": "Cashback",
                "annualFee": 0,
                "creditScoreRequired": "Good",
                "creditLimitRange": {
                    "min": 2000,
                    "max": 25000,
                    "typical": 8000
                },
                "rewards": {
                    "other": 1.5
                },
                "signupBonus": {
                    "amount": 200,
                    "currency": "cashback",
                    "spendingRequirement": 500,
                    "timeframe": "3 months"
                },
                "benefits": [
                    "No annual fee",
                    "5% on travel through Chase Ultimate Rewards",
                    "3% on dining and drugstores"
                ],
                "categories": ["general", "dining", "travel"],
                "features": {
                    "foreignTransactionFee": 0.03,
                    "balanceTransferFee": 0.05,
                    "cashAdvanceFee": 0.05,
                    "latePaymentFee": 40,
                    "aprRange": "20.49-29.24"
                }
            }
        };

        const data = this.getData();
        data.creditCards = creditCards;
        this.setData(data);
    }

    getCreditCard(cardId) {
        const data = this.getData();
        return data.creditCards[cardId] || null;
    }

    getAllCreditCards() {
        const data = this.getData();
        return Object.values(data.creditCards);
    }

    // Analytics and Insights
    getUserSpendingAnalysis(userId) {
        const transactions = this.getTransactions(userId);
        const user = this.getUserById(userId);
        
        if (!user || transactions.length === 0) {
            return {
                totalSpending: 0,
                averageTransaction: 0,
                categoryBreakdown: {},
                monthlyTrend: [],
                topMerchants: []
            };
        }

        const categoryBreakdown = {};
        const merchantBreakdown = {};
        let totalSpending = 0;

        transactions.forEach(transaction => {
            totalSpending += transaction.amount;
            
            // Category breakdown
            if (!categoryBreakdown[transaction.category]) {
                categoryBreakdown[transaction.category] = { total: 0, count: 0 };
            }
            categoryBreakdown[transaction.category].total += transaction.amount;
            categoryBreakdown[transaction.category].count += 1;

            // Merchant breakdown
            if (transaction.merchant) {
                if (!merchantBreakdown[transaction.merchant]) {
                    merchantBreakdown[transaction.merchant] = { total: 0, count: 0 };
                }
                merchantBreakdown[transaction.merchant].total += transaction.amount;
                merchantBreakdown[transaction.merchant].count += 1;
            }
        });

        // Get top merchants
        const topMerchants = Object.entries(merchantBreakdown)
            .sort((a, b) => b[1].total - a[1].total)
            .slice(0, 5)
            .map(([merchant, data]) => ({ merchant, ...data }));

        return {
            totalSpending,
            averageTransaction: totalSpending / transactions.length,
            categoryBreakdown,
            topMerchants,
            totalTransactions: transactions.length
        };
    }

    // Utility Methods
    generateUserId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateTransactionId() {
        return 'txn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Data Export/Import
    exportData() {
        return this.getData();
    }

    importData(data) {
        try {
            this.setData(data);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Clear all data
    clearAllData() {
        localStorage.removeItem(this.storageKey);
        this.initializeStorage();
    }

    // Get storage statistics
    getStorageStats() {
        const data = this.getData();
        const userCount = Object.keys(data.users).length;
        const totalTransactions = Object.values(data.transactions).reduce((sum, txns) => sum + txns.length, 0);
        const creditCardCount = Object.keys(data.creditCards).length;

        return {
            userCount,
            totalTransactions,
            creditCardCount,
            storageSize: JSON.stringify(data).length,
            lastUpdated: data.settings.lastUpdated
        };
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LocalStorageManager;
} else {
    window.LocalStorageManager = LocalStorageManager;
}
