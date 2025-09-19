from flask import Flask, request, jsonify
from flask_cors import CORS
from ai_model import ai_model, initialize_model
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Initialize the AI model when the app starts
@app.before_first_request
def initialize():
    initialize_model()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_trained': ai_model.is_trained,
        'message': 'AI service is running'
    })

@app.route('/predict', methods=['POST'])
def predict():
    """Make a prediction for credit card recommendation"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['transaction', 'user_profile', 'card_data']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'error': f'Missing required field: {field}'
                }), 400
        
        # Make prediction
        result = ai_model.predict(
            data['transaction'],
            data['user_profile'],
            data['card_data']
        )
        
        return jsonify({
            'success': True,
            'prediction': result
        })
        
    except Exception as e:
        logger.error(f"Error in prediction: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/recommend', methods=['POST'])
def recommend():
    """Get recommendation for multiple cards"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['transaction', 'user_profile', 'available_cards']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'error': f'Missing required field: {field}'
                }), 400
        
        # Get recommendation
        result = ai_model.get_recommendation(
            data['transaction'],
            data['user_profile'],
            data['available_cards']
        )
        
        return jsonify({
            'success': True,
            'recommendation': result
        })
        
    except Exception as e:
        logger.error(f"Error in recommendation: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/model/info', methods=['GET'])
def model_info():
    """Get model information"""
    try:
        info = ai_model.get_model_info()
        return jsonify({
            'success': True,
            'model_info': info
        })
    except Exception as e:
        logger.error(f"Error getting model info: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/model/retrain', methods=['POST'])
def retrain_model():
    """Retrain the model with new data"""
    try:
        data = request.get_json()
        
        # If training data is provided, use it; otherwise generate synthetic data
        training_data = data.get('training_data')
        
        # Retrain model
        history = ai_model.train(df=training_data)
        
        # Save the retrained model
        ai_model.save_model()
        
        return jsonify({
            'success': True,
            'message': 'Model retrained successfully',
            'training_history': {
                'epochs': len(history.history['loss']),
                'final_loss': history.history['loss'][-1],
                'final_accuracy': history.history['accuracy'][-1]
            }
        })
        
    except Exception as e:
        logger.error(f"Error retraining model: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'error': 'Endpoint not found'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500

if __name__ == '__main__':
    # Initialize model before starting server
    initialize_model()
    
    # Start Flask server
    app.run(
        host='0.0.0.0',
        port=5001,
        debug=True
    )
