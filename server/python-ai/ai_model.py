import tensorflow as tf
import numpy as np
import pandas as pd
import json
import os
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
import joblib
from datetime import datetime
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CreditCardRecommendationModel:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.is_trained = False
        self.model_path = 'models/credit_card_model.h5'
        self.scaler_path = 'models/scaler.pkl'
        self.encoders_path = 'models/encoders.pkl'
        
        # Feature configuration
        self.categorical_features = ['category', 'credit_score', 'time_of_day', 'day_of_week', 'card_type']
        self.numerical_features = [
            'transaction_amount', 'monthly_income', 'annual_fee', 
            'reward_rate', 'credit_limit', 'signup_bonus', 'foreign_fee'
        ]
        
        # Create models directory
        os.makedirs('models', exist_ok=True)
        
        # Initialize model architecture
        self._build_model()
    
    def _build_model(self):
        """Build the neural network architecture"""
        model = tf.keras.Sequential([
            # Input layer
            tf.keras.layers.Dense(128, activation='relu', input_shape=(None,)),
            tf.keras.layers.Dropout(0.3),
            
            # Hidden layers
            tf.keras.layers.Dense(64, activation='relu'),
            tf.keras.layers.Dropout(0.2),
            tf.keras.layers.Dense(32, activation='relu'),
            tf.keras.layers.Dropout(0.1),
            tf.keras.layers.Dense(16, activation='relu'),
            
            # Output layer
            tf.keras.layers.Dense(1, activation='sigmoid')
        ])
        
        # Compile model
        model.compile(
            optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
            loss='binary_crossentropy',
            metrics=['accuracy', 'precision', 'recall']
        )
        
        self.model = model
        logger.info("Neural network model architecture created")
    
    def generate_synthetic_data(self, num_samples=10000):
        """Generate synthetic training data"""
        logger.info(f"Generating {num_samples} synthetic training samples...")
        
        np.random.seed(42)
        
        # Define possible values
        categories = ['dining', 'groceries', 'travel', 'gas', 'shopping', 'entertainment', 'utilities', 'general']
        credit_scores = ['poor', 'fair', 'good', 'very_good', 'excellent']
        times_of_day = ['morning', 'afternoon', 'evening']
        days_of_week = ['weekday', 'weekend']
        card_types = ['cashback', 'travel', 'premium', 'student', 'business']
        
        data = []
        
        for i in range(num_samples):
            # Generate random features
            transaction_amount = np.random.exponential(50) + 10  # Exponential distribution for realistic amounts
            monthly_income = np.random.normal(5000, 2000) + 2000  # Normal distribution
            annual_fee = np.random.choice([0, 95, 195, 295, 495, 695], p=[0.3, 0.2, 0.2, 0.15, 0.1, 0.05])
            reward_rate = np.random.beta(2, 5) * 5 + 0.5  # Beta distribution for reward rates
            credit_limit = np.random.lognormal(10, 0.5)  # Log-normal for credit limits
            signup_bonus = np.random.exponential(200) if np.random.random() > 0.3 else 0
            foreign_fee = np.random.choice([0, 0.03], p=[0.7, 0.3])
            
            category = np.random.choice(categories)
            credit_score = np.random.choice(credit_scores, p=[0.1, 0.2, 0.3, 0.25, 0.15])
            time_of_day = np.random.choice(times_of_day)
            day_of_week = np.random.choice(days_of_week)
            card_type = np.random.choice(card_types)
            
            # Calculate target (recommendation score)
            target = self._calculate_target_score({
                'transaction_amount': transaction_amount,
                'monthly_income': monthly_income,
                'annual_fee': annual_fee,
                'reward_rate': reward_rate,
                'credit_limit': credit_limit,
                'signup_bonus': signup_bonus,
                'foreign_fee': foreign_fee,
                'category': category,
                'credit_score': credit_score,
                'time_of_day': time_of_day,
                'day_of_week': day_of_week,
                'card_type': card_type
            })
            
            data.append({
                'transaction_amount': transaction_amount,
                'monthly_income': monthly_income,
                'annual_fee': annual_fee,
                'reward_rate': reward_rate,
                'credit_limit': credit_limit,
                'signup_bonus': signup_bonus,
                'foreign_fee': foreign_fee,
                'category': category,
                'credit_score': credit_score,
                'time_of_day': time_of_day,
                'day_of_week': day_of_week,
                'card_type': card_type,
                'recommendation_score': target
            })
        
        return pd.DataFrame(data)
    
    def _calculate_target_score(self, features):
        """Calculate target recommendation score"""
        score = 0.0
        
        # Reward rate factor (40% weight)
        score += (features['reward_rate'] / 5.0) * 0.4
        
        # Annual fee factor (20% weight) - lower fee = higher score
        if features['annual_fee'] == 0:
            score += 0.2
        else:
            score += max(0, (1 - features['annual_fee'] / 695) * 0.2)
        
        # Credit score compatibility (15% weight)
        credit_score_map = {'poor': 0.2, 'fair': 0.4, 'good': 0.6, 'very_good': 0.8, 'excellent': 1.0}
        score += credit_score_map[features['credit_score']] * 0.15
        
        # Signup bonus factor (10% weight)
        score += min(features['signup_bonus'] / 1000, 1) * 0.1
        
        # Income compatibility (10% weight)
        score += min(features['monthly_income'] / 10000, 1) * 0.1
        
        # Category-specific bonuses (5% weight)
        category_bonuses = {
            'travel': 0.05, 'dining': 0.03, 'groceries': 0.02, 'gas': 0.02
        }
        score += category_bonuses.get(features['category'], 0)
        
        # Add some noise for realistic training
        score += np.random.normal(0, 0.05)
        
        return max(0, min(1, score))
    
    def prepare_data(self, df):
        """Prepare data for training"""
        logger.info("Preparing data for training...")
        
        # Separate features and target
        X = df.drop('recommendation_score', axis=1)
        y = df['recommendation_score']
        
        # Encode categorical variables
        X_encoded = X.copy()
        for feature in self.categorical_features:
            if feature in X_encoded.columns:
                le = LabelEncoder()
                X_encoded[feature] = le.fit_transform(X_encoded[feature])
                self.label_encoders[feature] = le
        
        # Scale numerical features
        X_scaled = X_encoded.copy()
        X_scaled[self.numerical_features] = self.scaler.fit_transform(X_encoded[self.numerical_features])
        
        return X_scaled, y
    
    def train(self, df=None, epochs=100, batch_size=32, validation_split=0.2):
        """Train the model"""
        logger.info("Starting model training...")
        
        # Generate synthetic data if none provided
        if df is None:
            df = self.generate_synthetic_data()
        
        # Prepare data
        X, y = self.prepare_data(df)
        
        # Split data
        X_train, X_val, y_train, y_val = train_test_split(
            X, y, test_size=validation_split, random_state=42
        )
        
        # Train model
        history = self.model.fit(
            X_train, y_train,
            epochs=epochs,
            batch_size=batch_size,
            validation_data=(X_val, y_val),
            verbose=1,
            callbacks=[
                tf.keras.callbacks.EarlyStopping(patience=10, restore_best_weights=True),
                tf.keras.callbacks.ReduceLROnPlateau(factor=0.5, patience=5)
            ]
        )
        
        self.is_trained = True
        logger.info("Model training completed successfully")
        
        return history
    
    def predict(self, transaction_data, user_profile, card_data):
        """Make a prediction for credit card recommendation"""
        if not self.is_trained:
            raise ValueError("Model not trained. Please train the model first.")
        
        # Prepare input data
        input_data = self._prepare_prediction_input(transaction_data, user_profile, card_data)
        
        # Make prediction
        prediction = self.model.predict(input_data, verbose=0)
        score = float(prediction[0][0])
        confidence = self._calculate_confidence(score)
        
        return {
            'score': score,
            'confidence': confidence,
            'factors': self._analyze_prediction_factors(transaction_data, user_profile, card_data)
        }
    
    def _prepare_prediction_input(self, transaction_data, user_profile, card_data):
        """Prepare input data for prediction"""
        # Create feature vector
        features = {
            'transaction_amount': transaction_data.get('amount', 100),
            'monthly_income': user_profile.get('monthlyIncome', 5000),
            'annual_fee': card_data.get('annualFee', 0),
            'reward_rate': self._get_reward_rate(card_data, transaction_data.get('category', 'general')),
            'credit_limit': card_data.get('creditLimitRange', {}).get('typical', 10000),
            'signup_bonus': card_data.get('signupBonus', {}).get('amount', 0),
            'foreign_fee': card_data.get('features', {}).get('foreignTransactionFee', 0),
            'category': transaction_data.get('category', 'general'),
            'credit_score': user_profile.get('creditScore', 'good'),
            'time_of_day': self._get_time_of_day(),
            'day_of_week': self._get_day_of_week(),
            'card_type': card_data.get('type', 'cashback')
        }
        
        # Convert to DataFrame
        df = pd.DataFrame([features])
        
        # Encode categorical variables
        for feature in self.categorical_features:
            if feature in df.columns and feature in self.label_encoders:
                df[feature] = self.label_encoders[feature].transform(df[feature])
        
        # Scale numerical features
        df[self.numerical_features] = self.scaler.transform(df[self.numerical_features])
        
        return df.values
    
    def _get_reward_rate(self, card_data, category):
        """Get reward rate for a card and category"""
        if 'rewards' in card_data and category in card_data['rewards']:
            return card_data['rewards'][category]
        return card_data.get('rewards', {}).get('other', 1)
    
    def _get_time_of_day(self):
        """Get current time of day"""
        hour = datetime.now().hour
        if 6 <= hour < 12:
            return 'morning'
        elif 12 <= hour < 18:
            return 'afternoon'
        else:
            return 'evening'
    
    def _get_day_of_week(self):
        """Get current day of week"""
        return 'weekday' if datetime.now().weekday() < 5 else 'weekend'
    
    def _calculate_confidence(self, score):
        """Calculate confidence based on prediction score"""
        return abs(score - 0.5) * 2
    
    def _analyze_prediction_factors(self, transaction_data, user_profile, card_data):
        """Analyze factors that influenced the prediction"""
        return {
            'reward_rate': self._get_reward_rate(card_data, transaction_data.get('category', 'general')),
            'annual_fee': card_data.get('annualFee', 0),
            'credit_score': user_profile.get('creditScore', 'good'),
            'category': transaction_data.get('category', 'general'),
            'transaction_amount': transaction_data.get('amount', 100)
        }
    
    def get_recommendation(self, transaction_data, user_profile, available_cards):
        """Get recommendation for multiple cards"""
        recommendations = []
        
        for card in available_cards:
            try:
                prediction = self.predict(transaction_data, user_profile, card)
                recommendations.append({
                    'card': card,
                    'score': prediction['score'],
                    'confidence': prediction['confidence'],
                    'factors': prediction['factors']
                })
            except Exception as e:
                logger.error(f"Error predicting for card {card.get('name', 'Unknown')}: {e}")
                recommendations.append({
                    'card': card,
                    'score': 0.5,
                    'confidence': 0.5,
                    'factors': {'error': 'Prediction failed'}
                })
        
        # Sort by score
        recommendations.sort(key=lambda x: x['score'], reverse=True)
        
        return {
            'recommended': recommendations[0] if recommendations else None,
            'alternatives': recommendations[1:3] if len(recommendations) > 1 else [],
            'all_recommendations': recommendations
        }
    
    def save_model(self):
        """Save the trained model and preprocessors"""
        if not self.is_trained:
            raise ValueError("No trained model to save")
        
        # Save model
        self.model.save(self.model_path)
        
        # Save scaler
        joblib.dump(self.scaler, self.scaler_path)
        
        # Save encoders
        joblib.dump(self.label_encoders, self.encoders_path)
        
        logger.info("Model saved successfully")
    
    def load_model(self):
        """Load a previously trained model"""
        try:
            # Load model
            self.model = tf.keras.models.load_model(self.model_path)
            
            # Load scaler
            self.scaler = joblib.load(self.scaler_path)
            
            # Load encoders
            self.label_encoders = joblib.load(self.encoders_path)
            
            self.is_trained = True
            logger.info("Model loaded successfully")
            return True
        except Exception as e:
            logger.warning(f"Could not load existing model: {e}")
            return False
    
    def get_model_info(self):
        """Get model information"""
        return {
            'is_trained': self.is_trained,
            'architecture': {
                'layers': len(self.model.layers) if self.model else 0,
                'total_params': self.model.count_params() if self.model else 0
            },
            'features': {
                'categorical': self.categorical_features,
                'numerical': self.numerical_features,
                'total': len(self.categorical_features) + len(self.numerical_features)
            }
        }

# Global model instance
ai_model = CreditCardRecommendationModel()

# Initialize model on import
def initialize_model():
    """Initialize the AI model"""
    logger.info("Initializing AI model...")
    
    # Try to load existing model
    if not ai_model.load_model():
        # Train new model if none exists
        logger.info("Training new model...")
        ai_model.train()
        ai_model.save_model()
    
    logger.info("AI model initialized successfully")

if __name__ == "__main__":
    # Initialize and train model
    initialize_model()
    
    # Test prediction
    test_transaction = {
        'amount': 50,
        'category': 'dining'
    }
    
    test_user = {
        'monthlyIncome': 5000,
        'creditScore': 'good'
    }
    
    test_card = {
        'name': 'Test Card',
        'annualFee': 95,
        'rewards': {'dining': 3, 'other': 1},
        'type': 'cashback'
    }
    
    result = ai_model.predict(test_transaction, test_user, test_card)
    print(f"Test prediction: {result}")

