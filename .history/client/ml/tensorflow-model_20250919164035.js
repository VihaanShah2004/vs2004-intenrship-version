// TensorFlow.js Credit Card Recommendation Model
class CreditCardMLModel {
    constructor() {
        this.model = null;
        this.isLoaded = false;
        this.featureNames = [
            'transaction_amount',
            'merchant_category_dining',
            'merchant_category_groceries', 
            'merchant_category_travel',
            'merchant_category_gas',
            'merchant_category_shopping',
            'merchant_category_entertainment',
            'merchant_category_utilities',
            'merchant_category_general',
            'user_credit_score_poor',
            'user_credit_score_fair',
            'user_credit_score_good',
            'user_credit_score_very_good',
            'user_credit_score_excellent',
            'user_monthly_income',
            'card_annual_fee',
            'card_reward_rate',
            'card_credit_limit',
            'card_signup_bonus',
            'card_foreign_fee',
            'time_of_day_morning',
            'time_of_day_afternoon',
            'time_of_day_evening',
            'day_of_week_weekday',
            'day_of_week_weekend'
        ];
    }

    async loadModel() {
        try {
            // Create a simple neural network model
            this.model = tf.sequential({
                layers: [
                    tf.layers.dense({
                        inputShape: [this.featureNames.length],
                        units: 64,
                        activation: 'relu',
                        kernelRegularizer: tf.regularizers.l2({ l2: 0.01 })
                    }),
                    tf.layers.dropout({ rate: 0.3 }),
                    tf.layers.dense({
                        units: 32,
                        activation: 'relu',
                        kernelRegularizer: tf.regularizers.l2({ l2: 0.01 })
                    }),
                    tf.layers.dropout({ rate: 0.2 }),
                    tf.layers.dense({
                        units: 16,
                        activation: 'relu'
                    }),
                    tf.layers.dense({
                        units: 1,
                        activation: 'sigmoid'
                    })
                ]
            });

            // Compile the model
            this.model.compile({
                optimizer: tf.train.adam(0.001),
                loss: 'binaryCrossentropy',
                metrics: ['accuracy']
            });

            this.isLoaded = true;
            console.log('TensorFlow model loaded successfully');
            return true;
        } catch (error) {
            console.error('Error loading TensorFlow model:', error);
            return false;
        }
    }

    async trainModel(trainingData) {
        if (!this.model) {
            await this.loadModel();
        }

        try {
            const { features, labels } = this.prepareTrainingData(trainingData);
            
            // Train the model
            const history = await this.model.fit(features, labels, {
                epochs: 50,
                batchSize: 32,
                validationSplit: 0.2,
                shuffle: true,
                callbacks: {
                    onEpochEnd: (epoch, logs) => {
                        if (epoch % 10 === 0) {
                            console.log(`Epoch ${epoch}: loss = ${logs.loss.toFixed(4)}, accuracy = ${logs.acc.toFixed(4)}`);
                        }
                    }
                }
            });

            console.log('Model training completed');
            return history;
        } catch (error) {
            console.error('Error training model:', error);
            throw error;
        }
    }

    prepareTrainingData(rawData) {
        const features = [];
        const labels = [];

        rawData.forEach(record => {
            const featureVector = this.extractFeatures(record);
            features.push(featureVector);
            labels.push(record.recommended ? 1 : 0);
        });

        return {
            features: tf.tensor2d(features),
            labels: tf.tensor2d(labels, [labels.length, 1])
        };
    }

    extractFeatures(record) {
        const features = new Array(this.featureNames.length).fill(0);
        
        // Transaction amount (normalized)
        features[0] = Math.min(record.transaction_amount / 1000, 1);
        
        // Merchant category (one-hot encoding)
        const categoryIndex = this.getCategoryIndex(record.merchant_category);
        if (categoryIndex >= 0) {
            features[1 + categoryIndex] = 1;
        }
        
        // User credit score (one-hot encoding)
        const creditScoreIndex = this.getCreditScoreIndex(record.user_credit_score);
        if (creditScoreIndex >= 0) {
            features[9 + creditScoreIndex] = 1;
        }
        
        // User monthly income (normalized)
        features[14] = Math.min(record.user_monthly_income / 10000, 1);
        
        // Card features
        features[15] = record.card_annual_fee / 1000; // Normalized annual fee
        features[16] = record.card_reward_rate / 10; // Normalized reward rate
        features[17] = Math.min(record.card_credit_limit / 50000, 1); // Normalized credit limit
        features[18] = record.card_signup_bonus / 1000; // Normalized signup bonus
        features[19] = record.card_foreign_fee; // Foreign transaction fee
        
        // Time features
        if (record.time_of_day) {
            const timeIndex = this.getTimeOfDayIndex(record.time_of_day);
            if (timeIndex >= 0) {
                features[20 + timeIndex] = 1;
            }
        }
        
        if (record.day_of_week) {
            const dayIndex = this.getDayOfWeekIndex(record.day_of_week);
            if (dayIndex >= 0) {
                features[23 + dayIndex] = 1;
            }
        }
        
        return features;
    }

    getCategoryIndex(category) {
        const categories = ['dining', 'groceries', 'travel', 'gas', 'shopping', 'entertainment', 'utilities', 'general'];
        return categories.indexOf(category);
    }

    getCreditScoreIndex(creditScore) {
        const scores = ['poor', 'fair', 'good', 'very_good', 'excellent'];
        return scores.indexOf(creditScore.toLowerCase());
    }

    getTimeOfDayIndex(timeOfDay) {
        const times = ['morning', 'afternoon', 'evening'];
        return times.indexOf(timeOfDay.toLowerCase());
    }

    getDayOfWeekIndex(dayOfWeek) {
        const days = ['weekday', 'weekend'];
        return days.indexOf(dayOfWeek.toLowerCase());
    }

    async predict(transactionData, userProfile, cardData) {
        if (!this.model) {
            await this.loadModel();
        }

        try {
            const features = this.extractFeatures({
                transaction_amount: transactionData.amount,
                merchant_category: transactionData.category,
                user_credit_score: userProfile.creditScore,
                user_monthly_income: userProfile.monthlyIncome,
                card_annual_fee: cardData.annualFee,
                card_reward_rate: this.getRewardRate(cardData, transactionData.category),
                card_credit_limit: cardData.creditLimitRange.typical,
                card_signup_bonus: cardData.signupBonus.amount,
                card_foreign_fee: cardData.features.foreignTransactionFee,
                time_of_day: this.getTimeOfDay(),
                day_of_week: this.getDayOfWeek()
            });

            const prediction = this.model.predict(tf.tensor2d([features]));
            const score = await prediction.data();
            prediction.dispose();
            
            return score[0];
        } catch (error) {
            console.error('Error making prediction:', error);
            return 0.5; // Default score
        }
    }

    getRewardRate(cardData, category) {
        if (cardData.rewards[category]) {
            return cardData.rewards[category];
        }
        return cardData.rewards.other || 1;
    }

    getTimeOfDay() {
        const hour = new Date().getHours();
        if (hour >= 6 && hour < 12) return 'morning';
        if (hour >= 12 && hour < 18) return 'afternoon';
        return 'evening';
    }

    getDayOfWeek() {
        const day = new Date().getDay();
        return (day >= 1 && day <= 5) ? 'weekday' : 'weekend';
    }

    async getRecommendation(transactionData, userProfile, availableCards) {
        if (!this.isLoaded) {
            await this.loadModel();
        }

        const recommendations = [];

        for (const card of availableCards) {
            try {
                const score = await this.predict(transactionData, userProfile, card);
                recommendations.push({
                    card: card,
                    score: score,
                    confidence: this.calculateConfidence(score)
                });
            } catch (error) {
                console.error(`Error predicting for card ${card.name}:`, error);
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

    calculateConfidence(score) {
        // Convert score to confidence (0-1)
        return Math.abs(score - 0.5) * 2;
    }

    generateSyntheticTrainingData() {
        const trainingData = [];
        const categories = ['dining', 'groceries', 'travel', 'gas', 'shopping', 'entertainment', 'utilities', 'general'];
        const creditScores = ['poor', 'fair', 'good', 'very_good', 'excellent'];
        const timesOfDay = ['morning', 'afternoon', 'evening'];
        const daysOfWeek = ['weekday', 'weekend'];

        // Generate 1000 synthetic training examples
        for (let i = 0; i < 1000; i++) {
            const category = categories[Math.floor(Math.random() * categories.length)];
            const creditScore = creditScores[Math.floor(Math.random() * creditScores.length)];
            const timeOfDay = timesOfDay[Math.floor(Math.random() * timesOfDay.length)];
            const dayOfWeek = daysOfWeek[Math.floor(Math.random() * daysOfWeek.length)];

            // Generate transaction data
            const transactionAmount = Math.random() * 1000 + 10;
            const monthlyIncome = Math.random() * 15000 + 3000;
            const annualFee = Math.random() * 500;
            const rewardRate = Math.random() * 5 + 1;
            const creditLimit = Math.random() * 50000 + 5000;
            const signupBonus = Math.random() * 1000;
            const foreignFee = Math.random() * 0.05;

            // Simple heuristic for recommendation
            let recommended = false;
            
            // Higher reward rate increases recommendation probability
            if (rewardRate > 2) recommended = true;
            
            // Lower annual fee increases recommendation probability
            if (annualFee < 100) recommended = true;
            
            // Higher credit score increases recommendation probability
            if (creditScore === 'excellent' || creditScore === 'very_good') recommended = true;
            
            // Add some randomness
            if (Math.random() > 0.7) recommended = !recommended;

            trainingData.push({
                transaction_amount: transactionAmount,
                merchant_category: category,
                user_credit_score: creditScore,
                user_monthly_income: monthlyIncome,
                card_annual_fee: annualFee,
                card_reward_rate: rewardRate,
                card_credit_limit: creditLimit,
                card_signup_bonus: signupBonus,
                card_foreign_fee: foreignFee,
                time_of_day: timeOfDay,
                day_of_week: dayOfWeek,
                recommended: recommended
            });
        }

        return trainingData;
    }

    async initializeWithSyntheticData() {
        console.log('Initializing model with synthetic training data...');
        const syntheticData = this.generateSyntheticTrainingData();
        await this.trainModel(syntheticData);
        console.log('Model initialized and trained with synthetic data');
    }

    // Save model to localStorage
    async saveModel() {
        if (!this.model) return false;

        try {
            const modelData = await this.model.save('localstorage://vidava-credit-card-model');
            console.log('Model saved to localStorage');
            return true;
        } catch (error) {
            console.error('Error saving model:', error);
            return false;
        }
    }

    // Load model from localStorage
    async loadSavedModel() {
        try {
            this.model = await tf.loadLayersModel('localstorage://vidava-credit-card-model');
            this.isLoaded = true;
            console.log('Model loaded from localStorage');
            return true;
        } catch (error) {
            console.log('No saved model found, will create new one');
            return false;
        }
    }

    // Get model summary
    getModelSummary() {
        if (!this.model) return null;
        
        return {
            isLoaded: this.isLoaded,
            totalParams: this.model.countParams(),
            layers: this.model.layers.length,
            inputShape: this.model.inputShape,
            outputShape: this.model.outputShape
        };
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CreditCardMLModel;
} else {
    window.CreditCardMLModel = CreditCardMLModel;
}
