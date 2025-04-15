from dotenv import load_dotenv
import os

load_dotenv()

class CONFIG:
    API_TITLE = 'Three Layered Visualization API'
    API_VERSION = '0.0.1'
    API_DESCRIPTION = 'API for three layered visualization operations'
    MAX_REQUEST_SIZE = 1024 * 1024 * 100  # 100MB

    SQLALCHEMY_DATABASE_URL = os.getenv('SQLALCHEMY_DATABASE_URL', 'sqlite:///./app.db')

    HOST = os.getenv('HOST', '0.0.0.0')
    PORT = int(os.getenv('PORT', 8000))

    # Logging settings
    LOG_LEVEL = "DEBUG"


    # SHAP settings
    SHAP_MODEL = 'xgboost'
    SHAP_MODEL_PARAMETERS = {
        'xgboost': {
            'n_estimators': 100,
            'learning_rate': 0.1,
            'max_depth': 6,
            'random_state': 42
        },
        'lightgbm': {
            'n_estimators': 100,
            'learning_rate': 0.1,
            'max_depth': 6,
            'random_state': 42
        }
    }