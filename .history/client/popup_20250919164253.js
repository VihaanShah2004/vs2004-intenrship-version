// VIDAVA AI Popup Manager
class PopupManager {
    constructor() {
        this.storage = new LocalStorageManager();
        this.mlModel = new CreditCardMLModel();
        this.currentUser = null;
        this.creditCards = [];
        this.currentWebsite = null;
        
        this.init();
    }

    async init() {
        try {
            // Initialize ML model
            await this.mlModel.loadSavedModel();
            if (!this.mlModel.isLoaded) {
                await this.mlModel.initializeWithSyntheticData();
            }

            // Load credit cards
            this.creditCards = this.storage.getAllCreditCards();
            
            // Get current user (create default if none exists)
            this.currentUser = this.getOrCreateDefaultUser();
            
            // Get current website info
            await this.getCurrentWebsiteInfo();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Show appropriate section
            this.showDashboard();
            
        } catch (error) {
            console.error('Error initializing popup:', error);
            this.showError('Failed to initialize VIDAVA AI');
        }
    }

    getOrCreateDefaultUser() {
        // Get existing user or create default
        const existingUsers = Object.values(this.storage.getData().users);
        if (existingUsers.length > 0) {
            return existingUsers[0];
        }

        // Create default user
        return this.storage.createUser({
            email: 'user@vidava.ai',
            password: 'default',
            firstName: 'User',
            lastName: 'User',
            monthlyIncome: 5000,
            creditScore: 'Good'
        });
    }

    async getCurrentWebsiteInfo() {
        try {
            // Get current tab info
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            this.currentWebsite = this.analyzeWebsite(tab.url, tab.title);
        } catch (error) {
            console.error('Error getting website info:', error);
            this.currentWebsite = {
                domain: 'unknown',
                category: 'general',
                name: 'Unknown Website',
                confidence: 0
            };
        }
    }

    analyzeWebsite(url, title) {
        const domain = new URL(url).hostname.toLowerCase();
        const titleLower = title.toLowerCase();
        
        // Website category detection
        const categories = {
            'dining': {
                keywords: ['restaurant', 'food', 'dining', 'eat', 'menu', 'order', 'delivery', 'pizza', 'burger', 'cafe', 'coffee', 'starbucks', 'mcdonalds', 'subway'],
                domains: ['ubereats.com', 'doordash.com', 'grubhub.com', 'postmates.com', 'seamless.com']
            },
            'groceries': {
                keywords: ['grocery', 'supermarket', 'food', 'fresh', 'organic', 'produce', 'meat', 'dairy', 'pantry'],
                domains: ['walmart.com', 'target.com', 'kroger.com', 'safeway.com', 'wholefoods.com', 'costco.com']
            },
            'travel': {
                keywords: ['hotel', 'flight', 'airline', 'travel', 'booking', 'vacation', 'trip', 'resort', 'airbnb'],
                domains: ['expedia.com', 'booking.com', 'airbnb.com', 'hotels.com', 'kayak.com', 'priceline.com', 'delta.com', 'united.com']
            },
            'gas': {
                keywords: ['gas', 'fuel', 'station', 'shell', 'exxon', 'bp', 'chevron', 'mobil'],
                domains: ['shell.com', 'exxon.com', 'bp.com', 'chevron.com']
            },
            'shopping': {
                keywords: ['shop', 'store', 'buy', 'purchase', 'cart', 'checkout', 'amazon', 'ebay', 'retail'],
                domains: ['amazon.com', 'ebay.com', 'walmart.com', 'target.com', 'bestbuy.com', 'homedepot.com']
            },
            'entertainment': {
                keywords: ['movie', 'streaming', 'netflix', 'hulu', 'disney', 'entertainment', 'game', 'music', 'spotify'],
                domains: ['netflix.com', 'hulu.com', 'disney.com', 'spotify.com', 'youtube.com', 'twitch.tv']
            },
            'utilities': {
                keywords: ['electric', 'water', 'internet', 'phone', 'cable', 'utility', 'bill', 'payment'],
                domains: ['comcast.com', 'verizon.com', 'att.com', 'tmobile.com']
            }
        };

        let bestCategory = 'general';
        let bestScore = 0;

        // Check domain matches
        for (const [category, data] of Object.entries(categories)) {
            let score = 0;
            
            // Domain match (highest priority)
            if (data.domains.some(d => domain.includes(d))) {
                score += 10;
            }
            
            // Keyword matches in title
            const keywordMatches = data.keywords.filter(keyword => 
                titleLower.includes(keyword) || domain.includes(keyword)
            ).length;
            score += keywordMatches * 2;
            
            if (score > bestScore) {
                bestScore = score;
                bestCategory = category;
            }
        }

        return {
            domain: domain,
            category: bestCategory,
            name: this.getWebsiteName(domain, title),
            confidence: Math.min(bestScore / 10, 1),
            url: url
        };
    }

    getWebsiteName(domain, title) {
        // Extract clean website name
        const cleanDomain = domain.replace('www.', '').split('.')[0];
        return cleanDomain.charAt(0).toUpperCase() + cleanDomain.slice(1);
    }

    setupEventListeners() {
        // Tab switching
        document.getElementById('loginTab').addEventListener('click', () => this.switchTab('login'));
        document.getElementById('registerTab').addEventListener('click', () => this.switchTab('register'));
        
        // Auth buttons
        document.getElementById('loginBtn').addEventListener('click', () => this.handleLogin());
        document.getElementById('registerBtn').addEventListener('click', () => this.handleRegister());
        
        // Password toggles
        document.getElementById('toggleLoginPassword').addEventListener('click', () => this.togglePassword('loginPassword'));
        document.getElementById('toggleRegisterPassword').addEventListener('click', () => this.togglePassword('registerPassword'));
        
        // Dashboard actions
        document.getElementById('getQuickRecommendation').addEventListener('click', () => this.getQuickRecommendation());
        document.getElementById('addCardBtn').addEventListener('click', () => this.showAddCardModal());
        document.getElementById('openDashboard').addEventListener('click', () => this.openFullDashboard());
        document.getElementById('viewProfile').addEventListener('click', () => this.showProfile());
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
        
        // Enter key for quick recommendation
        document.getElementById('quickAmount').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.getQuickRecommendation();
        });
    }

    switchTab(tab) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(tab + 'Tab').classList.add('active');
        
        // Update forms
        document.querySelectorAll('.auth-form').forEach(form => form.classList.add('hidden'));
        document.getElementById(tab + 'Form').classList.remove('hidden');
    }

    togglePassword(inputId) {
        const input = document.getElementById(inputId);
        const icon = document.getElementById('toggle' + inputId.charAt(0).toUpperCase() + inputId.slice(1));
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    }

    handleLogin() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        if (!email || !password) {
            this.showError('Please fill in all fields');
            return;
        }
        
        // For demo purposes, accept any login
        this.showSuccess('Login successful!');
        setTimeout(() => this.showDashboard(), 1000);
    }

    handleRegister() {
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        
        if (!email || !password) {
            this.showError('Please fill in all fields');
            return;
        }
        
        // Create new user
        const newUser = this.storage.createUser({
            email: email,
            password: password,
            firstName: 'New',
            lastName: 'User',
            monthlyIncome: 5000,
            creditScore: 'Good'
        });
        
        this.currentUser = newUser;
        this.showSuccess('Registration successful!');
        setTimeout(() => this.showDashboard(), 1000);
    }

    showDashboard() {
        document.getElementById('authSection').classList.add('hidden');
        document.getElementById('dashboardSection').classList.remove('hidden');
        this.loadUserCards();
        this.updateWebsiteInfo();
    }

    updateWebsiteInfo() {
        if (this.currentWebsite) {
            const websiteInfo = document.createElement('div');
            websiteInfo.className = 'website-info';
            websiteInfo.innerHTML = `
                <div style="background: rgba(255,255,255,0.1); padding: 10px; border-radius: 8px; margin-bottom: 15px; font-size: 12px;">
                    <strong>Detected:</strong> ${this.currentWebsite.name}<br>
                    <strong>Category:</strong> ${this.currentWebsite.category}<br>
                    <strong>Confidence:</strong> ${Math.round(this.currentWebsite.confidence * 100)}%
                </div>
            `;
            
            const quickRec = document.querySelector('.quick-recommendation');
            quickRec.insertBefore(websiteInfo, quickRec.firstChild);
        }
    }

    async getQuickRecommendation() {
        const amount = parseFloat(document.getElementById('quickAmount').value);
        const category = document.getElementById('quickCategory').value;
        
        if (!amount || amount <= 0) {
            this.showError('Please enter a valid amount');
            return;
        }

        this.showLoading(true);
        
        try {
            // Use website category if available, otherwise use selected category
            const finalCategory = this.currentWebsite ? this.currentWebsite.category : category;
            
            const transactionData = {
                amount: amount,
                category: finalCategory,
                merchant: this.currentWebsite ? this.currentWebsite.name : 'Manual Entry'
            };

            const recommendation = await this.mlModel.getRecommendation(
                transactionData,
                this.currentUser,
                this.creditCards
            );

            this.displayRecommendation(recommendation, amount, finalCategory);
            
            // Save transaction for learning
            this.storage.addTransaction(this.currentUser.id, {
                ...transactionData,
                recommendedCardId: recommendation.recommended.card.id
            });

        } catch (error) {
            console.error('Error getting recommendation:', error);
            this.showError('Failed to get recommendation');
        } finally {
            this.showLoading(false);
        }
    }

    displayRecommendation(recommendation, amount, category) {
        const resultDiv = document.getElementById('quickRecommendationResult');
        
        if (!recommendation.recommended) {
            resultDiv.innerHTML = `
                <div class="placeholder">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>No recommendation available</p>
                </div>
            `;
            return;
        }

        const card = recommendation.recommended.card;
        const rewardRate = this.getRewardRate(card, category);
        const estimatedReward = (amount * rewardRate / 100).toFixed(2);
        const confidence = Math.round(recommendation.recommended.confidence * 100);

        resultDiv.innerHTML = `
            <div class="recommendation-card">
                <div class="card-name">${card.name}</div>
                <div class="bank-name">${card.bank}</div>
                <div class="reward-info">
                    <span class="reward-rate">${rewardRate}% Cashback</span>
                    <span class="estimated-reward">$${estimatedReward}</span>
                </div>
                <div class="confidence">Confidence: ${confidence}%</div>
            </div>
        `;
    }

    getRewardRate(card, category) {
        if (card.rewards[category]) {
            return card.rewards[category];
        }
        return card.rewards.other || 1;
    }

    loadUserCards() {
        const cardsList = document.getElementById('myCardsList');
        const userCards = this.currentUser.creditCards || [];
        
        if (userCards.length === 0) {
            cardsList.innerHTML = `
                <div class="no-cards">
                    <i class="fas fa-plus-circle"></i>
                    <p>No cards added</p>
                    <button class="btn secondary-btn" id="addCardBtn">Add Card</button>
                </div>
            `;
            return;
        }

        cardsList.innerHTML = userCards.map(card => `
            <div class="card-item">
                <div class="card-info">
                    <div class="card-name">${card.cardName}</div>
                    <div class="bank-name">${card.bank}</div>
                </div>
                <button class="remove-btn" onclick="popupManager.removeCard('${card.cardId}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
    }

    showAddCardModal() {
        // Simple card selection
        const availableCards = this.creditCards.filter(card => 
            !this.currentUser.creditCards.some(userCard => userCard.cardId === card.id)
        );

        if (availableCards.length === 0) {
            this.showError('No new cards available to add');
            return;
        }

        const cardOptions = availableCards.map(card => 
            `${card.name} - ${card.bank} (${card.annualFee === 0 ? 'No Fee' : '$' + card.annualFee + '/year'})`
        ).join('\n');

        const selectedIndex = prompt(`Select a card to add:\n\n${cardOptions}\n\nEnter number (1-${availableCards.length}):`);
        
        if (selectedIndex && selectedIndex >= 1 && selectedIndex <= availableCards.length) {
            const selectedCard = availableCards[selectedIndex - 1];
            this.addCard(selectedCard);
        }
    }

    addCard(card) {
        const result = this.storage.addCreditCardToUser(this.currentUser.id, {
            cardId: card.id,
            cardName: card.name,
            bank: card.bank
        });

        if (result.success) {
            this.currentUser = this.storage.getUserById(this.currentUser.id);
            this.loadUserCards();
            this.showSuccess('Card added successfully!');
        } else {
            this.showError(result.message);
        }
    }

    removeCard(cardId) {
        if (confirm('Are you sure you want to remove this card?')) {
            const result = this.storage.removeCreditCardFromUser(this.currentUser.id, cardId);
            if (result.success) {
                this.currentUser = this.storage.getUserById(this.currentUser.id);
                this.loadUserCards();
                this.showSuccess('Card removed successfully!');
            } else {
                this.showError(result.message);
            }
        }
    }

    openFullDashboard() {
        // Open full dashboard in new tab
        chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
    }

    showProfile() {
        const profile = `
Name: ${this.currentUser.firstName} ${this.currentUser.lastName}
Email: ${this.currentUser.email}
Monthly Income: $${this.currentUser.monthlyIncome}
Credit Score: ${this.currentUser.creditScore}
Cards: ${this.currentUser.creditCards.length}
        `;
        alert(profile);
    }

    logout() {
        this.currentUser = null;
        document.getElementById('dashboardSection').classList.add('hidden');
        document.getElementById('authSection').classList.remove('hidden');
    }

    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (show) {
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    }

    showMessage(text, type = 'success') {
        const messageDiv = document.getElementById('message');
        messageDiv.textContent = text;
        messageDiv.className = `message ${type}`;
        
        setTimeout(() => {
            messageDiv.textContent = '';
            messageDiv.className = 'message';
        }, 3000);
    }

    showSuccess(text) {
        this.showMessage(text, 'success');
    }

    showError(text) {
        this.showMessage(text, 'error');
    }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.popupManager = new PopupManager();
});
