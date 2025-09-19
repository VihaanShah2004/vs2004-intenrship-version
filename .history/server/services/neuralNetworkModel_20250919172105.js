const brain = require('brain.js');
const fs = require('fs').promises;
const path = require('path');

class NeuralNetworkCreditCardModel {
    constructor() {
        this.net = new brain.NeuralNetwork({
            hiddenLayers: [64, 32, 16],
            activation: 'sigmoid',
            learningRate: 0.3,
            iterations: 20000,
            errorThresh: 0.005
        });
        
        this.isTrained = false;
        this.modelPath = path.join(__dirname, '../data/neural-network-model.json');
        this.trainingDataPath = path.join(__dirname, '../data/training-data.json');
        
        // Feature mapping for normalization
        this.featureMap = {
            categories: ['dining', 'groceries', 'travel', 'gas', 'shopping', 'entertainment', 'utilities', 'general'],
            creditScores: ['poor', 'fair', 'good', 'very_good', 'excellent'],
            timesOfDay: ['morning', 'afternoon', 'evening'],
            daysOfWeek: ['weekday', 'weekend'],
            cardTypes: ['cashback', 'travel', 'premium', 'student', 'business']
        };
    }

    /**
     * Initialize the model - load existing model or train with synthetic data
     */
    async initialize() {
        try {
            // Try to load existing model
            const modelLoaded = await this.loadModel();
            if (modelLoaded) {
                console.log('✅ Neural network model loaded successfully');
                return true;
            }

            // If no model exists, train with synthetic data
            console.log('🔄 No existing model found. Training with synthetic data...');
            await this.trainWithSyntheticData();
            await this.saveModel();
            console.log('✅ Neural network model trained and saved successfully');
            return true;
        } catch (error) {
            console.error('❌ Error initializing neural network model:', error);
            return false;
        }
    }

    /**
     * Train the model with synthetic data
     */
    async trainWithSyntheticData() {
        const trainingData = this.generateSyntheticTrainingData();
        console.log(`📊 Training with ${trainingData.length} synthetic examples...`);
        
        const startTime = Date.now();
        const result = this.net.train(trainingData);
        const trainingTime = Date.now() - startTime;
        
        console.log(`⏱️ Training completed in ${trainingTime}ms`);
        console.log(`📈 Final error: ${result.error.toFixed(6)}`);
        console.log(`🔄 Iterations: ${result.iterations}`);
        
        this.isTrained = true;
        
        // Save training data for future reference
        await this.saveTrainingData(trainingData);
        
        return result;
    }

    /**
     * Generate comprehensive synthetic training data
     */
    generateSyntheticTrainingData() {
        const trainingData = [];
        const numExamples = 5000; // Increased for better training

        for (let i = 0; i < numExamples; i++) {
            const example = this.generateTrainingExample();
            trainingData.push(example);
        }

        return trainingData;
    }

    /**
     * Generate a single training example
     */
    generateTrainingExample() {
        // Random transaction data
        const transactionAmount = Math.random() * 2000 + 10;
        const category = this.featureMap.categories[Math.floor(Math.random() * this.featureMap.categories.length)];
        const creditScore = this.featureMap.creditScores[Math.floor(Math.random() * this.featureMap.creditScores.length)];
        const monthlyIncome = Math.random() * 20000 + 3000;
        const timeOfDay = this.featureMap.timesOfDay[Math.floor(Math.random() * this.featureMap.timesOfDay.length)];
        const dayOfWeek = this.featureMap.daysOfWeek[Math.floor(Math.random() * this.featureMap.daysOfWeek.length)];

        // Random card features
        const annualFee = Math.random() * 600;
        const rewardRate = Math.random() * 6 + 0.5;
        const creditLimit = Math.random() * 100000 + 5000;
        const signupBonus = Math.random() * 2000;
        const foreignFee = Math.random() * 0.05;
        const cardType = this.featureMap.cardTypes[Math.floor(Math.random() * this.featureMap.cardTypes.length)];

        // Create input features (normalized)
        const input = this.normalizeInput({
            transactionAmount,
            category,
            creditScore,
            monthlyIncome,
            annualFee,
            rewardRate,
            creditLimit,
            signupBonus,
            foreignFee,
            timeOfDay,
            dayOfWeek,
            cardType
        });

        // Calculate target output (recommendation score)
        const output = this.calculateTargetScore({
            transactionAmount,
            category,
            creditScore,
            monthlyIncome,
            annualFee,
            rewardRate,
            creditLimit,
            signupBonus,
            foreignFee,
            timeOfDay,
            dayOfWeek,
            cardType
        });

        return {
            input,
            output
        };
    }

    /**
     * Normalize input features for neural network
     */
    normalizeInput(data) {
        return {
            // Transaction features (0-1 normalized)
            transactionAmount: Math.min(data.transactionAmount / 2000, 1),
            monthlyIncome: Math.min(data.monthlyIncome / 20000, 1),
            
            // Categorical features (one-hot encoded)
            category_dining: data.category === 'dining' ? 1 : 0,
            category_groceries: data.category === 'groceries' ? 1 : 0,
            category_travel: data.category === 'travel' ? 1 : 0,
            category_gas: data.category === 'gas' ? 1 : 0,
            category_shopping: data.category === 'shopping' ? 1 : 0,
            category_entertainment: data.category === 'entertainment' ? 1 : 0,
            category_utilities: data.category === 'utilities' ? 1 : 0,
            category_general: data.category === 'general' ? 1 : 0,
            
            // Credit score (one-hot encoded)
            credit_poor: data.creditScore === 'poor' ? 1 : 0,
            credit_fair: data.creditScore === 'fair' ? 1 : 0,
            credit_good: data.creditScore === 'good' ? 1 : 0,
            credit_very_good: data.creditScore === 'very_good' ? 1 : 0,
            credit_excellent: data.creditScore === 'excellent' ? 1 : 0,
            
            // Card features (normalized)
            annualFee: Math.min(data.annualFee / 600, 1),
            rewardRate: Math.min(data.rewardRate / 6, 1),
            creditLimit: Math.min(data.creditLimit / 100000, 1),
            signupBonus: Math.min(data.signupBonus / 2000, 1),
            foreignFee: data.foreignFee / 0.05,
            
            // Time features (one-hot encoded)
            time_morning: data.timeOfDay === 'morning' ? 1 : 0,
            time_afternoon: data.timeOfDay === 'afternoon' ? 1 : 0,
            time_evening: data.timeOfDay === 'evening' ? 1 : 0,
            day_weekday: data.dayOfWeek === 'weekday' ? 1 : 0,
            day_weekend: data.dayOfWeek === 'weekend' ? 1 : 0,
            
            // Card type (one-hot encoded)
            card_cashback: data.cardType === 'cashback' ? 1 : 0,
            card_travel: data.cardType === 'travel' ? 1 : 0,
            card_premium: data.cardType === 'premium' ? 1 : 0,
            card_student: data.cardType === 'student' ? 1 : 0,
            card_business: data.cardType === 'business' ? 1 : 0
        };
    }

    /**
     * Calculate target score for training
     */
    calculateTargetScore(data) {
        let score = 0;

        // Reward rate factor (40% weight)
        const rewardScore = (data.rewardRate / 6) * 0.4;
        score += rewardScore;

        // Annual fee factor (20% weight) - lower fee = higher score
        const feeScore = (1 - Math.min(data.annualFee / 600, 1)) * 0.2;
        score += feeScore;

        // Credit score compatibility (15% weight)
        const creditScoreMap = { poor: 0.2, fair: 0.4, good: 0.6, very_good: 0.8, excellent: 1.0 };
        const creditScore = creditScoreMap[data.creditScore] * 0.15;
        score += creditScore;

        // Signup bonus factor (10% weight)
        const bonusScore = Math.min(data.signupBonus / 2000, 1) * 0.1;
        score += bonusScore;

        // Income compatibility (10% weight)
        const incomeScore = Math.min(data.monthlyIncome / 20000, 1) * 0.1;
        score += incomeScore;

        // Category-specific bonuses (5% weight)
        const categoryBonuses = {
            travel: 0.05,
            dining: 0.03,
            groceries: 0.02,
            gas: 0.02
        };
        score += categoryBonuses[data.category] || 0;

        // Add some randomness for realistic training
        score += (Math.random() - 0.5) * 0.1;

        return { recommendation: Math.max(0, Math.min(1, score)) };
    }

    /**
     * Make a prediction for credit card recommendation
     */
    async predict(transactionData, userProfile, cardData) {
        if (!this.isTrained) {
            throw new Error('Model not trained. Please initialize the model first.');
        }

        try {
            // Prepare input data
            const input = this.normalizeInput({
                transactionAmount: transactionData.amount || 100,
                category: transactionData.category || 'general',
                creditScore: userProfile.creditScore || 'good',
                monthlyIncome: userProfile.monthlyIncome || 5000,
                annualFee: cardData.annualFee || 0,
                rewardRate: this.getRewardRate(cardData, transactionData.category),
                creditLimit: cardData.creditLimitRange?.typical || 10000,
                signupBonus: cardData.signupBonus?.amount || 0,
                foreignFee: cardData.features?.foreignTransactionFee || 0,
                timeOfDay: this.getTimeOfDay(),
                dayOfWeek: this.getDayOfWeek(),
                cardType: cardData.type || 'cashback'
            });

            // Make prediction
            const prediction = this.net.run(input);
            const confidence = this.calculateConfidence(prediction.recommendation);

            return {
                score: prediction.recommendation,
                confidence: confidence,
                factors: this.analyzePrediction(input, prediction)
            };
        } catch (error) {
            console.error('Error making prediction:', error);
            return {
                score: 0.5,
                confidence: 0.5,
                factors: { error: 'Prediction failed' }
            };
        }
    }

    /**
     * Get reward rate for a card and category
     */
    getRewardRate(cardData, category) {
        if (cardData.rewards && cardData.rewards[category]) {
            return cardData.rewards[category];
        }
        return cardData.rewards?.other || 1;
    }

    /**
     * Get current time of day
     */
    getTimeOfDay() {
        const hour = new Date().getHours();
        if (hour >= 6 && hour < 12) return 'morning';
        if (hour >= 12 && hour < 18) return 'afternoon';
        return 'evening';
    }

    /**
     * Get current day of week
     */
    getDayOfWeek() {
        const day = new Date().getDay();
        return (day >= 1 && day <= 5) ? 'weekday' : 'weekend';
    }

    /**
     * Calculate confidence based on prediction score
     */
    calculateConfidence(score) {
        // Higher confidence for scores closer to 0 or 1
        return Math.abs(score - 0.5) * 2;
    }

    /**
     * Analyze prediction factors
     */
    analyzePrediction(input, prediction) {
        return {
            rewardRate: input.rewardRate,
            annualFee: input.annualFee,
            creditScore: this.getCreditScoreFromInput(input),
            category: this.getCategoryFromInput(input),
            timeOfDay: this.getTimeFromInput(input),
            prediction: prediction.recommendation
        };
    }

    /**
     * Helper methods to extract categorical data from normalized input
     */
    getCreditScoreFromInput(input) {
        if (input.credit_excellent) return 'excellent';
        if (input.credit_very_good) return 'very_good';
        if (input.credit_good) return 'good';
        if (input.credit_fair) return 'fair';
        return 'poor';
    }

    getCategoryFromInput(input) {
        const categories = ['dining', 'groceries', 'travel', 'gas', 'shopping', 'entertainment', 'utilities', 'general'];
        for (const category of categories) {
            if (input[`category_${category}`] === 1) {
                return category;
            }
        }
        return 'general';
    }

    getTimeFromInput(input) {
        if (input.time_morning) return 'morning';
        if (input.time_afternoon) return 'afternoon';
        return 'evening';
    }

    /**
     * Get recommendation for multiple cards
     */
    async getRecommendation(transactionData, userProfile, availableCards) {
        const recommendations = [];

        for (const card of availableCards) {
            try {
                const prediction = await this.predict(transactionData, userProfile, card);
                recommendations.push({
                    card: card,
                    score: prediction.score,
                    confidence: prediction.confidence,
                    factors: prediction.factors
                });
            } catch (error) {
                console.error(`Error predicting for card ${card.name}:`, error);
                recommendations.push({
                    card: card,
                    score: 0.5,
                    confidence: 0.5,
                    factors: { error: 'Prediction failed' }
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

    /**
     * Save model to file
     */
    async saveModel() {
        try {
            const modelData = this.net.toJSON();
            await fs.writeFile(this.modelPath, JSON.stringify(modelData, null, 2));
            console.log('✅ Model saved successfully');
            return true;
        } catch (error) {
            console.error('❌ Error saving model:', error);
            return false;
        }
    }

    /**
     * Load model from file
     */
    async loadModel() {
        try {
            const modelData = await fs.readFile(this.modelPath, 'utf8');
            this.net.fromJSON(JSON.parse(modelData));
            this.isTrained = true;
            console.log('✅ Model loaded successfully');
            return true;
        } catch (error) {
            console.log('ℹ️ No existing model found');
            return false;
        }
    }

    /**
     * Save training data for reference
     */
    async saveTrainingData(trainingData) {
        try {
            await fs.writeFile(this.trainingDataPath, JSON.stringify(trainingData, null, 2));
            console.log('✅ Training data saved');
        } catch (error) {
            console.error('❌ Error saving training data:', error);
        }
    }

    /**
     * Get model statistics
     */
    getModelStats() {
        return {
            isTrained: this.isTrained,
            architecture: {
                hiddenLayers: [64, 32, 16],
                activation: 'sigmoid',
                learningRate: 0.3
            },
            features: {
                total: Object.keys(this.normalizeInput({
                    transactionAmount: 100,
                    category: 'general',
                    creditScore: 'good',
                    monthlyIncome: 5000,
                    annualFee: 0,
                    rewardRate: 1,
                    creditLimit: 10000,
                    signupBonus: 0,
                    foreignFee: 0,
                    timeOfDay: 'morning',
                    dayOfWeek: 'weekday',
                    cardType: 'cashback'
                })).length,
                categories: this.featureMap.categories.length,
                creditScores: this.featureMap.creditScores.length
            }
        };
    }

    /**
     * Retrain model with new data
     */
    async retrainWithNewData(newTrainingData) {
        try {
            console.log(`🔄 Retraining model with ${newTrainingData.length} new examples...`);
            
            // Combine with existing training data if available
            let allTrainingData = newTrainingData;
            try {
                const existingData = await fs.readFile(this.trainingDataPath, 'utf8');
                const parsedData = JSON.parse(existingData);
                allTrainingData = [...parsedData, ...newTrainingData];
            } catch (error) {
                console.log('ℹ️ No existing training data found, using new data only');
            }

            // Retrain the model
            const result = this.net.train(allTrainingData);
            this.isTrained = true;
            
            // Save updated model and training data
            await this.saveModel();
            await this.saveTrainingData(allTrainingData);
            
            console.log('✅ Model retrained successfully');
            return result;
        } catch (error) {
            console.error('❌ Error retraining model:', error);
            throw error;
        }
    }
}

module.exports = new NeuralNetworkCreditCardModel();
