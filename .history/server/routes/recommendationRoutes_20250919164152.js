const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const aiEngine = require('../services/aiRecommendationEngine');
const authMiddleware = require('../middleware/authMiddleware');

// Get recommendation for a transaction
router.post('/recommend', authMiddleware, async (req, res) => {
    try {
        const { amount, merchant, category, description } = req.body;
        const userId = req.user.userId;

        // Get user profile
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Create transaction object
        const transaction = {
            amount: parseFloat(amount) || 0,
            merchant: merchant || '',
            category: category || 'other',
            description: description || ''
        };

        // Get AI recommendation
        const recommendation = aiEngine.getRecommendation(transaction, user);

        // Log the transaction for learning (optional)
        user.totalTransactions += 1;
        user.averageTransactionAmount = 
            (user.averageTransactionAmount * (user.totalTransactions - 1) + transaction.amount) / user.totalTransactions;
        
        await user.save();

        res.json({
            success: true,
            recommendation,
            transaction
        });

    } catch (error) {
        console.error('Error getting recommendation:', error);
        res.status(500).json({ message: 'Error getting recommendation' });
    }
});

// Get all available credit cards
router.get('/cards', async (req, res) => {
    try {
        const cards = aiEngine.getAllAvailableCards();
        res.json({
            success: true,
            cards
        });
    } catch (error) {
        console.error('Error getting cards:', error);
        res.status(500).json({ message: 'Error getting credit cards' });
    }
});

// Add a credit card to user's profile
router.post('/cards/add', authMiddleware, async (req, res) => {
    try {
        const { cardId, lastFourDigits } = req.body;
        const userId = req.user.userId;

        // Get user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if card exists in our database
        const availableCards = aiEngine.getAllAvailableCards();
        const cardData = availableCards.find(card => card.id === cardId);
        
        if (!cardData) {
            return res.status(400).json({ message: 'Invalid card ID' });
        }

        // Check if user already has this card
        const existingCard = user.creditCards.find(card => card.cardId === cardId);
        if (existingCard) {
            return res.status(400).json({ message: 'Card already added to profile' });
        }

        // Add card to user's profile
        user.creditCards.push({
            cardId: cardId,
            cardName: cardData.name,
            bank: cardData.bank,
            lastFourDigits: lastFourDigits || '',
            isActive: true
        });

        await user.save();

        res.json({
            success: true,
            message: 'Card added successfully',
            card: {
                cardId: cardId,
                cardName: cardData.name,
                bank: cardData.bank,
                lastFourDigits: lastFourDigits || ''
            }
        });

    } catch (error) {
        console.error('Error adding card:', error);
        res.status(500).json({ message: 'Error adding card' });
    }
});

// Remove a credit card from user's profile
router.delete('/cards/:cardId', authMiddleware, async (req, res) => {
    try {
        const { cardId } = req.params;
        const userId = req.user.userId;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Remove card from user's profile
        user.creditCards = user.creditCards.filter(card => card.cardId !== cardId);
        await user.save();

        res.json({
            success: true,
            message: 'Card removed successfully'
        });

    } catch (error) {
        console.error('Error removing card:', error);
        res.status(500).json({ message: 'Error removing card' });
    }
});

// Get user's credit cards
router.get('/cards/user', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            success: true,
            cards: user.creditCards
        });

    } catch (error) {
        console.error('Error getting user cards:', error);
        res.status(500).json({ message: 'Error getting user cards' });
    }
});

// Update user spending preferences
router.post('/preferences', authMiddleware, async (req, res) => {
    try {
        const { spendingPreferences } = req.body;
        const userId = req.user.userId;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.spendingPreferences = spendingPreferences;
        await user.save();

        res.json({
            success: true,
            message: 'Spending preferences updated successfully'
        });

    } catch (error) {
        console.error('Error updating preferences:', error);
        res.status(500).json({ message: 'Error updating preferences' });
    }
});

// Get spending analysis and suggestions
router.get('/analysis', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const suggestions = aiEngine.analyzeSpendingPatterns(user);

        res.json({
            success: true,
            analysis: {
                totalTransactions: user.totalTransactions,
                averageTransactionAmount: user.averageTransactionAmount,
                totalCards: user.creditCards.length,
                suggestions
            }
        });

    } catch (error) {
        console.error('Error getting analysis:', error);
        res.status(500).json({ message: 'Error getting analysis' });
    }
});

// Update user profile
router.put('/profile', authMiddleware, async (req, res) => {
    try {
        const { firstName, lastName, monthlyIncome, creditScore } = req.body;
        const userId = req.user.userId;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update profile fields
        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (monthlyIncome) user.monthlyIncome = monthlyIncome;
        if (creditScore) user.creditScore = creditScore;

        await user.save();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            profile: {
                firstName: user.firstName,
                lastName: user.lastName,
                monthlyIncome: user.monthlyIncome,
                creditScore: user.creditScore
            }
        });

    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: 'Error updating profile' });
    }
});

// Get user profile
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            success: true,
            profile: {
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                monthlyIncome: user.monthlyIncome,
                creditScore: user.creditScore,
                creditCards: user.creditCards,
                spendingPreferences: user.spendingPreferences,
                totalTransactions: user.totalTransactions,
                averageTransactionAmount: user.averageTransactionAmount,
                createdAt: user.createdAt,
                lastLogin: user.lastLogin
            }
        });

    } catch (error) {
        console.error('Error getting profile:', error);
        res.status(500).json({ message: 'Error getting profile' });
    }
});

module.exports = router;
