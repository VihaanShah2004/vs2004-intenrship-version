// Dashboard JavaScript
class DashboardManager {
    constructor() {
        this.token = localStorage.getItem('token');
        this.userProfile = null;
        this.availableCards = [];
        this.userCards = [];
        
        this.init();
    }

    async init() {
        if (!this.token) {
            this.redirectToLogin();
            return;
        }

        try {
            await this.loadUserProfile();
            await this.loadAvailableCards();
            await this.loadUserCards();
            await this.loadSpendingAnalysis();
            this.setupEventListeners();
        } catch (error) {
            console.error('Error initializing dashboard:', error);
            this.showError('Failed to load dashboard data');
        }
    }

    async loadUserProfile() {
        try {
            const response = await fetch('http://localhost:3000/api/profile', {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.userProfile = data.profile;
                this.populateProfileForm();
            } else {
                throw new Error('Failed to load profile');
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            throw error;
        }
    }

    async loadAvailableCards() {
        try {
            const response = await fetch('http://localhost:3000/api/cards');
            if (response.ok) {
                const data = await response.json();
                this.availableCards = data.cards;
                this.renderAvailableCards();
                this.populateCardSelect();
            } else {
                throw new Error('Failed to load available cards');
            }
        } catch (error) {
            console.error('Error loading available cards:', error);
            throw error;
        }
    }

    async loadUserCards() {
        try {
            const response = await fetch('http://localhost:3000/api/cards/user', {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.userCards = data.cards;
                this.renderUserCards();
            } else {
                throw new Error('Failed to load user cards');
            }
        } catch (error) {
            console.error('Error loading user cards:', error);
            throw error;
        }
    }

    async loadSpendingAnalysis() {
        try {
            const response = await fetch('http://localhost:3000/api/analysis', {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.renderSpendingAnalysis(data.analysis);
            } else {
                throw new Error('Failed to load spending analysis');
            }
        } catch (error) {
            console.error('Error loading spending analysis:', error);
            // Don't throw error for analysis as it's not critical
        }
    }

    setupEventListeners() {
        // Get recommendation button
        document.getElementById('getRecommendationBtn').addEventListener('click', () => {
            this.getRecommendation();
        });

        // Add card button
        document.getElementById('addCardBtn').addEventListener('click', () => {
            this.showAddCardModal();
        });

        // Save card button
        document.getElementById('saveCardBtn').addEventListener('click', () => {
            this.saveCard();
        });

        // Profile link
        document.getElementById('profileLink').addEventListener('click', (e) => {
            e.preventDefault();
            this.showProfileModal();
        });

        // Save profile button
        document.getElementById('saveProfileBtn').addEventListener('click', () => {
            this.saveProfile();
        });

        // Logout link
        document.getElementById('logoutLink').addEventListener('click', (e) => {
            e.preventDefault();
            this.logout();
        });

        // Enter key for recommendation
        document.getElementById('transactionAmount').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.getRecommendation();
            }
        });
    }

    async getRecommendation() {
        const amount = parseFloat(document.getElementById('transactionAmount').value);
        const category = document.getElementById('merchantCategory').value;
        const merchant = document.getElementById('merchantName').value;

        if (!amount || amount <= 0) {
            this.showError('Please enter a valid transaction amount');
            return;
        }

        const recommendationResult = document.getElementById('recommendationResult');
        recommendationResult.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Getting AI recommendation...</p>
            </div>
        `;

        try {
            const response = await fetch('http://localhost:3000/api/recommend', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    amount: amount,
                    category: category,
                    merchant: merchant
                })
            });

            if (response.ok) {
                const data = await response.json();
                this.renderRecommendation(data.recommendation, amount, category, merchant);
            } else {
                const error = await response.json();
                throw new Error(error.message || 'Failed to get recommendation');
            }
        } catch (error) {
            console.error('Error getting recommendation:', error);
            recommendationResult.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    Error: ${error.message}
                </div>
            `;
        }
    }

    renderRecommendation(recommendation, amount, category, merchant) {
        const recommendationResult = document.getElementById('recommendationResult');
        
        if (!recommendation.recommendedCard) {
            recommendationResult.innerHTML = `
                <div class="text-center text-muted">
                    <i class="fas fa-exclamation-circle fa-3x mb-3"></i>
                    <p>${recommendation.reasoning}</p>
                </div>
            `;
            return;
        }

        const card = recommendation.recommendedCard;
        const rewardRate = this.getRewardRate(card, category);
        const estimatedReward = (amount * rewardRate / 100).toFixed(2);

        recommendationResult.innerHTML = `
            <div class="recommendation-item fade-in">
                <div class="card-name">${card.name}</div>
                <div class="bank-name">${card.bank}</div>
                <div class="reward-rate">${rewardRate}% Cashback</div>
                <div class="reasoning">${recommendation.reasoning}</div>
                <div class="confidence-badge">
                    Confidence: ${Math.round(recommendation.confidence * 100)}%
                </div>
                <div class="mt-2">
                    <small>Estimated reward: $${estimatedReward}</small>
                </div>
            </div>
            ${recommendation.alternatives && recommendation.alternatives.length > 0 ? `
                <div class="mt-3">
                    <h6>Alternative Options:</h6>
                    ${recommendation.alternatives.map(alt => `
                        <div class="card-item">
                            <div class="card-name">${alt.card.name}</div>
                            <div class="bank-name">${alt.bank}</div>
                            <div class="reasoning">${alt.reasoning}</div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        `;
    }

    getRewardRate(card, category) {
        if (card.rewards[category]) {
            return card.rewards[category];
        }
        return card.rewards.other || 1;
    }

    renderUserCards() {
        const myCardsList = document.getElementById('myCardsList');
        
        if (this.userCards.length === 0) {
            myCardsList.innerHTML = `
                <div class="text-center text-muted">
                    <i class="fas fa-plus-circle fa-2x mb-2"></i>
                    <p>No cards added yet</p>
                    <button class="btn btn-primary btn-sm" id="addCardBtn">
                        <i class="fas fa-plus"></i> Add Card
                    </button>
                </div>
            `;
            return;
        }

        myCardsList.innerHTML = this.userCards.map(card => `
            <div class="card-item fade-in">
                <div class="card-name">${card.cardName}</div>
                <div class="bank-name">${card.bank}</div>
                <div class="card-details">
                    ${card.lastFourDigits ? `**** **** **** ${card.lastFourDigits}` : 'Card added'}
                    <span class="float-end">
                        <button class="remove-btn" onclick="dashboard.removeCard('${card.cardId}')">
                            <i class="fas fa-trash"></i> Remove
                        </button>
                    </span>
                </div>
            </div>
        `).join('');
    }

    renderAvailableCards() {
        const availableCardsList = document.getElementById('availableCardsList');
        
        availableCardsList.innerHTML = this.availableCards.map(card => {
            const userHasCard = this.userCards.some(userCard => userCard.cardId === card.id);
            
            return `
                <div class="available-card fade-in">
                    <div class="card-header-info">
                        <div>
                            <div class="card-name">${card.name}</div>
                            <div class="bank-name">${card.bank}</div>
                        </div>
                        <div class="annual-fee">
                            ${card.annualFee === 0 ? 'No Annual Fee' : `$${card.annualFee}/year`}
                        </div>
                    </div>
                    
                    <div class="rewards-section">
                        <strong>Rewards:</strong><br>
                        ${Object.entries(card.rewards).map(([category, rate]) => `
                            <span class="reward-category">${category}: ${rate}%</span>
                        `).join('')}
                    </div>
                    
                    ${card.signupBonus.amount > 0 ? `
                        <div class="signup-bonus">
                            <div class="bonus-amount">${card.signupBonus.amount} ${card.signupBonus.currency}</div>
                            <small>Signup bonus after spending $${card.signupBonus.spendingRequirement} in ${card.signupBonus.timeframe}</small>
                        </div>
                    ` : ''}
                    
                    <div class="benefits">
                        <strong>Benefits:</strong><br>
                        ${card.benefits.slice(0, 3).map(benefit => `
                            <div class="benefit-item">${benefit}</div>
                        `).join('')}
                    </div>
                    
                    <button class="add-card-btn" ${userHasCard ? 'disabled' : ''} 
                            onclick="dashboard.addCardFromList('${card.id}')">
                        ${userHasCard ? 'Already Added' : 'Add to Profile'}
                    </button>
                </div>
            `;
        }).join('');
    }

    renderSpendingAnalysis(analysis) {
        const spendingAnalysis = document.getElementById('spendingAnalysis');
        
        if (!analysis || analysis.totalTransactions === 0) {
            spendingAnalysis.innerHTML = `
                <div class="text-center text-muted">
                    <i class="fas fa-chart-line fa-2x mb-2"></i>
                    <p>Analysis will appear here as you use the app</p>
                </div>
            `;
            return;
        }

        spendingAnalysis.innerHTML = `
            <div class="spending-analysis-item">
                <div class="category">Total Transactions</div>
                <div class="amount">${analysis.totalTransactions}</div>
            </div>
            <div class="spending-analysis-item">
                <div class="category">Average Transaction</div>
                <div class="amount">$${analysis.averageTransactionAmount.toFixed(2)}</div>
            </div>
            <div class="spending-analysis-item">
                <div class="category">Cards in Profile</div>
                <div class="amount">${analysis.totalCards}</div>
            </div>
            ${analysis.suggestions && analysis.suggestions.length > 0 ? `
                <div class="mt-3">
                    <strong>Suggestions:</strong>
                    ${analysis.suggestions.map(suggestion => `
                        <div class="spending-analysis-item">
                            <div class="category">${suggestion.category}</div>
                            <div class="amount">Potential savings: $${suggestion.potentialSavings.toFixed(2)}/month</div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        `;
    }

    populateCardSelect() {
        const cardSelect = document.getElementById('cardSelect');
        cardSelect.innerHTML = '<option value="">Choose a card...</option>' +
            this.availableCards.map(card => `
                <option value="${card.id}">${card.name} - ${card.bank}</option>
            `).join('');
    }

    populateProfileForm() {
        if (this.userProfile) {
            document.getElementById('firstName').value = this.userProfile.firstName || '';
            document.getElementById('lastName').value = this.userProfile.lastName || '';
            document.getElementById('monthlyIncome').value = this.userProfile.monthlyIncome || '';
            document.getElementById('creditScore').value = this.userProfile.creditScore || 'Good';
        }
    }

    showAddCardModal() {
        const modal = new bootstrap.Modal(document.getElementById('addCardModal'));
        modal.show();
    }

    showProfileModal() {
        const modal = new bootstrap.Modal(document.getElementById('profileModal'));
        modal.show();
    }

    async saveCard() {
        const cardId = document.getElementById('cardSelect').value;
        const lastFourDigits = document.getElementById('lastFourDigits').value;

        if (!cardId) {
            this.showError('Please select a card');
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/api/cards/add', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    cardId: cardId,
                    lastFourDigits: lastFourDigits
                })
            });

            if (response.ok) {
                this.showSuccess('Card added successfully!');
                await this.loadUserCards();
                await this.loadAvailableCards();
                bootstrap.Modal.getInstance(document.getElementById('addCardModal')).hide();
                document.getElementById('addCardForm').reset();
            } else {
                const error = await response.json();
                throw new Error(error.message || 'Failed to add card');
            }
        } catch (error) {
            console.error('Error saving card:', error);
            this.showError(error.message);
        }
    }

    async addCardFromList(cardId) {
        try {
            const response = await fetch('http://localhost:3000/api/cards/add', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    cardId: cardId
                })
            });

            if (response.ok) {
                this.showSuccess('Card added successfully!');
                await this.loadUserCards();
                await this.loadAvailableCards();
            } else {
                const error = await response.json();
                throw new Error(error.message || 'Failed to add card');
            }
        } catch (error) {
            console.error('Error adding card:', error);
            this.showError(error.message);
        }
    }

    async removeCard(cardId) {
        if (!confirm('Are you sure you want to remove this card?')) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:3000/api/cards/${cardId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                this.showSuccess('Card removed successfully!');
                await this.loadUserCards();
                await this.loadAvailableCards();
            } else {
                const error = await response.json();
                throw new Error(error.message || 'Failed to remove card');
            }
        } catch (error) {
            console.error('Error removing card:', error);
            this.showError(error.message);
        }
    }

    async saveProfile() {
        const firstName = document.getElementById('firstName').value;
        const lastName = document.getElementById('lastName').value;
        const monthlyIncome = parseFloat(document.getElementById('monthlyIncome').value);
        const creditScore = document.getElementById('creditScore').value;

        try {
            const response = await fetch('http://localhost:3000/api/profile', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    firstName: firstName,
                    lastName: lastName,
                    monthlyIncome: monthlyIncome,
                    creditScore: creditScore
                })
            });

            if (response.ok) {
                this.showSuccess('Profile updated successfully!');
                await this.loadUserProfile();
                bootstrap.Modal.getInstance(document.getElementById('profileModal')).hide();
            } else {
                const error = await response.json();
                throw new Error(error.message || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Error saving profile:', error);
            this.showError(error.message);
        }
    }

    logout() {
        localStorage.removeItem('token');
        this.redirectToLogin();
    }

    redirectToLogin() {
        window.location.href = 'Login.html';
    }

    showError(message) {
        // Create a temporary error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;
        
        // Insert at the top of the container
        const container = document.querySelector('.container');
        container.insertBefore(errorDiv, container.firstChild);
        
        // Remove after 5 seconds
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    showSuccess(message) {
        // Create a temporary success message
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
        
        // Insert at the top of the container
        const container = document.querySelector('.container');
        container.insertBefore(successDiv, container.firstChild);
        
        // Remove after 3 seconds
        setTimeout(() => {
            successDiv.remove();
        }, 3000);
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new DashboardManager();
});
