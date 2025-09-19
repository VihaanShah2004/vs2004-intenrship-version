// VIDAVA AI Background Service Worker
class BackgroundService {
    constructor() {
        this.setupMessageHandlers();
        this.setupInstallHandler();
    }

    setupMessageHandlers() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            switch (request.type) {
                case 'WEBSITE_DETECTED':
                    this.handleWebsiteDetection(request.data, sender);
                    break;
                
                case 'GET_RECOMMENDATION':
                    this.handleRecommendationRequest(request.data, sendResponse);
                    return true; // Keep message channel open for async response
                
                case 'OPEN_POPUP':
                    this.openPopup();
                    break;
                
                case 'SAVE_TRANSACTION':
                    this.saveTransaction(request.data);
                    break;
                
                default:
                    console.log('Unknown message type:', request.type);
            }
        });
    }

    setupInstallHandler() {
        chrome.runtime.onInstalled.addListener((details) => {
            if (details.reason === 'install') {
                // First time installation
                this.initializeExtension();
            } else if (details.reason === 'update') {
                // Extension update
                this.handleUpdate(details.previousVersion);
            }
        });
    }

    initializeExtension() {
        // Set default settings
        chrome.storage.local.set({
            'vidava_settings': {
                version: '1.0.0',
                installedAt: new Date().toISOString(),
                autoRecommendations: true,
                notifications: true,
                privacyMode: false
            }
        });

        // Open welcome page
        chrome.tabs.create({
            url: chrome.runtime.getURL('dashboard.html')
        });
    }

    handleUpdate(previousVersion) {
        console.log(`VIDAVA AI updated from ${previousVersion} to 1.0.0`);
        
        // Update settings if needed
        chrome.storage.local.get(['vidava_settings'], (result) => {
            if (result.vidava_settings) {
                result.vidava_settings.version = '1.0.0';
                result.vidava_settings.updatedAt = new Date().toISOString();
                chrome.storage.local.set({ 'vidava_settings': result.vidava_settings });
            }
        });
    }

    handleWebsiteDetection(websiteData, sender) {
        // Store website detection data
        chrome.storage.local.get(['website_history'], (result) => {
            const history = result.website_history || [];
            
            // Add new detection
            history.push({
                ...websiteData,
                tabId: sender.tab.id,
                timestamp: new Date().toISOString()
            });
            
            // Keep only last 100 entries
            if (history.length > 100) {
                history.splice(0, history.length - 100);
            }
            
            chrome.storage.local.set({ 'website_history': history });
        });
    }

    async handleRecommendationRequest(data, sendResponse) {
        try {
            // Get user data from storage
            const result = await chrome.storage.local.get(['vidava_user_data']);
            const userData = result.vidava_user_data || this.getDefaultUserData();
            
            // Get credit cards
            const creditCards = await this.getCreditCards();
            
            // Simple recommendation logic (in real app, this would use ML model)
            const recommendation = this.generateRecommendation(data, userData, creditCards);
            
            sendResponse({
                success: true,
                recommendation: recommendation
            });
        } catch (error) {
            console.error('Error generating recommendation:', error);
            sendResponse({
                success: false,
                error: error.message
            });
        }
    }

    getDefaultUserData() {
        return {
            id: 'default_user',
            creditCards: [],
            spendingPreferences: [],
            monthlyIncome: 5000,
            creditScore: 'Good'
        };
    }

    async getCreditCards() {
        // Return sample credit cards (in real app, this would be from storage)
        return [
            {
                id: 'chase_sapphire_preferred',
                name: 'Chase Sapphire Preferred',
                bank: 'Chase',
                rewards: {
                    travel: 2,
                    dining: 2,
                    other: 1
                },
                annualFee: 95
            },
            {
                id: 'chase_freedom_unlimited',
                name: 'Chase Freedom Unlimited',
                bank: 'Chase',
                rewards: {
                    other: 1.5
                },
                annualFee: 0
            }
        ];
    }

    generateRecommendation(data, userData, creditCards) {
        if (!userData.creditCards || userData.creditCards.length === 0) {
            return null;
        }

        const { website, amount } = data;
        const category = website.category;
        
        // Find best card for category
        let bestCard = null;
        let bestReward = 0;
        
        userData.creditCards.forEach(userCard => {
            const card = creditCards.find(c => c.id === userCard.cardId);
            if (card) {
                const rewardRate = card.rewards[category] || card.rewards.other || 1;
                if (rewardRate > bestReward) {
                    bestReward = rewardRate;
                    bestCard = card;
                }
            }
        });
        
        if (bestCard) {
            return {
                card: bestCard,
                reasoning: `Earns ${bestReward}% cashback on ${category} purchases`,
                confidence: 0.85
            };
        }
        
        return null;
    }

    openPopup() {
        chrome.action.openPopup();
    }

    saveTransaction(transactionData) {
        chrome.storage.local.get(['transaction_history'], (result) => {
            const history = result.transaction_history || [];
            history.push({
                ...transactionData,
                timestamp: new Date().toISOString()
            });
            
            // Keep only last 500 transactions
            if (history.length > 500) {
                history.splice(0, history.length - 500);
            }
            
            chrome.storage.local.set({ 'transaction_history': history });
        });
    }
}

// Initialize background service
new BackgroundService();
