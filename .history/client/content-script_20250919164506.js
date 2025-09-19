// VIDAVA AI Content Script - Demo Version
class WebsiteDetector {
    constructor() {
        this.websiteInfo = null;
        this.recommendationOverlay = null;
        this.isOverlayVisible = false;
        
        // Only initialize in demo mode
        if (this.isDemoMode()) {
            this.init();
        }
    }

    isDemoMode() {
        // Only run on demo/test pages to avoid any issues
        return window.location.hostname.includes('localhost') || 
               window.location.hostname.includes('demo') ||
               window.location.hostname.includes('test');
    }

    init() {
        this.analyzeCurrentPage();
        this.createRecommendationButton();
    }

    analyzeCurrentPage() {
        // Demo-only analysis
        const title = document.title;
        
        this.websiteInfo = {
            domain: 'demo-site.com',
            category: 'general',
            name: 'Demo Site',
            confidence: 0.8,
            url: 'https://demo-site.com',
            title: title,
            detectedAt: new Date().toISOString()
        };
        
        // Send demo data to background script
        chrome.runtime.sendMessage({
            type: 'WEBSITE_DETECTED',
            data: this.websiteInfo
        });
    }

    categorizeWebsite(url, title, domain) {
        const categories = {
            'dining': {
                keywords: ['restaurant', 'food', 'dining', 'eat', 'menu', 'order', 'delivery', 'pizza', 'burger', 'cafe', 'coffee', 'starbucks', 'mcdonalds', 'subway', 'kfc', 'dominos', 'chipotle'],
                domains: ['ubereats.com', 'doordash.com', 'grubhub.com', 'postmates.com', 'seamless.com', 'starbucks.com', 'mcdonalds.com', 'subway.com'],
                selectors: ['.menu', '.food-item', '.restaurant', '.order', '.delivery']
            },
            'groceries': {
                keywords: ['grocery', 'supermarket', 'food', 'fresh', 'organic', 'produce', 'meat', 'dairy', 'pantry', 'grocery', 'supermarket'],
                domains: ['walmart.com', 'target.com', 'kroger.com', 'safeway.com', 'wholefoods.com', 'costco.com', 'samsclub.com'],
                selectors: ['.grocery', '.produce', '.meat', '.dairy', '.pantry']
            },
            'travel': {
                keywords: ['hotel', 'flight', 'airline', 'travel', 'booking', 'vacation', 'trip', 'resort', 'airbnb', 'car rental', 'cruise'],
                domains: ['expedia.com', 'booking.com', 'airbnb.com', 'hotels.com', 'kayak.com', 'priceline.com', 'delta.com', 'united.com', 'american.com'],
                selectors: ['.hotel', '.flight', '.booking', '.travel', '.vacation']
            },
            'gas': {
                keywords: ['gas', 'fuel', 'station', 'shell', 'exxon', 'bp', 'chevron', 'mobil', 'gas station'],
                domains: ['shell.com', 'exxon.com', 'bp.com', 'chevron.com', 'mobil.com'],
                selectors: ['.gas', '.fuel', '.station']
            },
            'shopping': {
                keywords: ['shop', 'store', 'buy', 'purchase', 'cart', 'checkout', 'amazon', 'ebay', 'retail', 'clothing', 'electronics'],
                domains: ['amazon.com', 'ebay.com', 'walmart.com', 'target.com', 'bestbuy.com', 'homedepot.com', 'macys.com', 'nordstrom.com'],
                selectors: ['.product', '.item', '.cart', '.checkout', '.buy', '.purchase']
            },
            'entertainment': {
                keywords: ['movie', 'streaming', 'netflix', 'hulu', 'disney', 'entertainment', 'game', 'music', 'spotify', 'youtube', 'twitch'],
                domains: ['netflix.com', 'hulu.com', 'disney.com', 'spotify.com', 'youtube.com', 'twitch.tv', 'hbo.com', 'paramount.com'],
                selectors: ['.movie', '.streaming', '.entertainment', '.game', '.music']
            },
            'utilities': {
                keywords: ['electric', 'water', 'internet', 'phone', 'cable', 'utility', 'bill', 'payment', 'service'],
                domains: ['comcast.com', 'verizon.com', 'att.com', 'tmobile.com', 'sprint.com', 'spectrum.com'],
                selectors: ['.bill', '.payment', '.utility', '.service']
            }
        };

        let bestCategory = 'general';
        let bestScore = 0;
        let confidence = 0;

        // Check domain matches (highest priority)
        for (const [category, data] of Object.entries(categories)) {
            let score = 0;
            
            // Domain match
            if (data.domains.some(d => domain.includes(d))) {
                score += 20;
                confidence = 0.9;
            }
            
            // URL keyword matches
            const urlKeywords = data.keywords.filter(keyword => url.toLowerCase().includes(keyword));
            score += urlKeywords.length * 3;
            
            // Title keyword matches
            const titleKeywords = data.keywords.filter(keyword => title.toLowerCase().includes(keyword));
            score += titleKeywords.length * 2;
            
            // Page content analysis
            const contentScore = this.analyzePageContent(data.selectors, data.keywords);
            score += contentScore;
            
            if (score > bestScore) {
                bestScore = score;
                bestCategory = category;
                confidence = Math.min(score / 25, 0.95);
            }
        }

        return {
            domain: domain,
            category: bestCategory,
            name: this.getWebsiteName(domain, title),
            confidence: confidence,
            url: url,
            title: title,
            detectedAt: new Date().toISOString()
        };
    }

    analyzePageContent(selectors, keywords) {
        let score = 0;
        
        // Check for category-specific elements
        selectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
                score += Math.min(elements.length, 5);
            }
        });
        
        // Check page text for keywords
        const pageText = document.body.innerText.toLowerCase();
        const keywordMatches = keywords.filter(keyword => pageText.includes(keyword));
        score += keywordMatches.length;
        
        return score;
    }

    getWebsiteName(domain, title) {
        // Extract clean website name
        const cleanDomain = domain.replace('www.', '').split('.')[0];
        const cleanTitle = title.split(' - ')[0].split(' | ')[0];
        
        // Use shorter of domain or title
        return cleanDomain.length < cleanTitle.length ? 
            cleanDomain.charAt(0).toUpperCase() + cleanDomain.slice(1) :
            cleanTitle;
    }

    setupPageObserver() {
        // Watch for page changes (SPA navigation)
        const observer = new MutationObserver((mutations) => {
            let shouldReanalyze = false;
            
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // Check if URL changed (for SPAs)
                    if (window.location.href !== this.lastUrl) {
                        shouldReanalyze = true;
                        this.lastUrl = window.location.href;
                    }
                }
            });
            
            if (shouldReanalyze) {
                setTimeout(() => this.analyzeCurrentPage(), 1000);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        // Also listen for popstate events
        window.addEventListener('popstate', () => {
            setTimeout(() => this.analyzeCurrentPage(), 500);
        });
    }

    createRecommendationButton() {
        // Create floating recommendation button
        this.recommendationButton = document.createElement('div');
        this.recommendationButton.id = 'vidava-recommendation-btn';
        this.recommendationButton.innerHTML = `
            <div class="vidava-btn-content">
                <i class="fas fa-credit-card"></i>
                <span>VIDAVA AI</span>
            </div>
        `;
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            #vidava-recommendation-btn {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 60px;
                height: 60px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 50%;
                cursor: pointer;
                z-index: 10000;
                box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            }
            
            #vidava-recommendation-btn:hover {
                transform: scale(1.1);
                box-shadow: 0 6px 25px rgba(102, 126, 234, 0.6);
            }
            
            .vidava-btn-content {
                display: flex;
                flex-direction: column;
                align-items: center;
                font-size: 10px;
                font-weight: bold;
            }
            
            .vidava-btn-content i {
                font-size: 18px;
                margin-bottom: 2px;
            }
            
            .vidava-btn-content span {
                font-size: 8px;
                line-height: 1;
            }
            
            .vidava-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                z-index: 10001;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .vidava-recommendation-panel {
                background: white;
                border-radius: 12px;
                padding: 30px;
                max-width: 400px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            }
            
            .vidava-panel-header {
                text-align: center;
                margin-bottom: 20px;
            }
            
            .vidava-panel-header h2 {
                margin: 0 0 10px 0;
                color: #333;
                font-size: 24px;
            }
            
            .vidava-website-info {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 20px;
                font-size: 14px;
            }
            
            .vidava-recommendation-card {
                background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
                color: white;
                padding: 20px;
                border-radius: 10px;
                margin-bottom: 15px;
            }
            
            .vidava-card-name {
                font-weight: bold;
                font-size: 18px;
                margin-bottom: 5px;
            }
            
            .vidava-bank-name {
                font-size: 14px;
                opacity: 0.9;
                margin-bottom: 10px;
            }
            
            .vidava-reward-info {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
            }
            
            .vidava-reward-rate {
                font-size: 24px;
                font-weight: bold;
                color: #ffd700;
            }
            
            .vidava-close-btn {
                position: absolute;
                top: 15px;
                right: 15px;
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #666;
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(this.recommendationButton);
        
        // Add click event
        this.recommendationButton.addEventListener('click', () => {
            this.showRecommendationOverlay();
        });
    }

    async showRecommendationOverlay() {
        if (this.isOverlayVisible) return;
        
        this.isOverlayVisible = true;
        
        // Create overlay
        this.recommendationOverlay = document.createElement('div');
        this.recommendationOverlay.className = 'vidava-overlay';
        
        // Get recommendation from popup
        try {
            const response = await chrome.runtime.sendMessage({
                type: 'GET_RECOMMENDATION',
                data: {
                    website: this.websiteInfo,
                    amount: 100 // Default amount, user can adjust
                }
            });
            
            this.recommendationOverlay.innerHTML = `
                <div class="vidava-recommendation-panel">
                    <button class="vidava-close-btn" onclick="this.closest('.vidava-overlay').remove(); window.vidavaDetector.isOverlayVisible = false;">&times;</button>
                    
                    <div class="vidava-panel-header">
                        <h2>VIDAVA AI Recommendation</h2>
                    </div>
                    
                    <div class="vidava-website-info">
                        <strong>Website:</strong> ${this.websiteInfo.name}<br>
                        <strong>Category:</strong> ${this.websiteInfo.category}<br>
                        <strong>Confidence:</strong> ${Math.round(this.websiteInfo.confidence * 100)}%
                    </div>
                    
                    ${response && response.recommendation ? `
                        <div class="vidava-recommendation-card">
                            <div class="vidava-card-name">${response.recommendation.card.name}</div>
                            <div class="vidava-bank-name">${response.recommendation.card.bank}</div>
                            <div class="vidava-reward-info">
                                <span class="vidava-reward-rate">${this.getRewardRate(response.recommendation.card, this.websiteInfo.category)}% Cashback</span>
                                <span>Estimated: $${(100 * this.getRewardRate(response.recommendation.card, this.websiteInfo.category) / 100).toFixed(2)}</span>
                            </div>
                            <div style="font-size: 12px; opacity: 0.9;">
                                ${response.recommendation.reasoning}
                            </div>
                        </div>
                    ` : `
                        <div style="text-align: center; color: #666;">
                            <p>No recommendation available</p>
                            <p style="font-size: 12px;">Add credit cards to your profile to get recommendations</p>
                        </div>
                    `}
                    
                    <div style="text-align: center; margin-top: 20px;">
                        <button onclick="chrome.runtime.sendMessage({type: 'OPEN_POPUP'}); this.closest('.vidava-overlay').remove(); window.vidavaDetector.isOverlayVisible = false;" 
                                style="background: #667eea; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">
                            Open VIDAVA AI
                        </button>
                    </div>
                </div>
            `;
            
        } catch (error) {
            console.error('Error getting recommendation:', error);
            this.recommendationOverlay.innerHTML = `
                <div class="vidava-recommendation-panel">
                    <button class="vidava-close-btn" onclick="this.closest('.vidava-overlay').remove(); window.vidavaDetector.isOverlayVisible = false;">&times;</button>
                    <div class="vidava-panel-header">
                        <h2>VIDAVA AI</h2>
                    </div>
                    <div style="text-align: center; color: #666;">
                        <p>Error getting recommendation</p>
                        <button onclick="chrome.runtime.sendMessage({type: 'OPEN_POPUP'}); this.closest('.vidava-overlay').remove(); window.vidavaDetector.isOverlayVisible = false;" 
                                style="background: #667eea; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">
                            Open VIDAVA AI
                        </button>
                    </div>
                </div>
            `;
        }
        
        document.body.appendChild(this.recommendationOverlay);
        
        // Close on overlay click
        this.recommendationOverlay.addEventListener('click', (e) => {
            if (e.target === this.recommendationOverlay) {
                this.recommendationOverlay.remove();
                this.isOverlayVisible = false;
            }
        });
    }

    getRewardRate(card, category) {
        if (card.rewards && card.rewards[category]) {
            return card.rewards[category];
        }
        return card.rewards ? (card.rewards.other || 1) : 1;
    }
}

// Initialize website detector
window.vidavaDetector = new WebsiteDetector();
