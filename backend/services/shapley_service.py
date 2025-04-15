import shap
import xgboost
import lightgbm as lgb
from typing import Union
import pandas as pd
import numpy as np

from core.config import CONFIG

class ShapleyService:
    @classmethod
    def get_shap_model(cls):
        if CONFIG.SHAP_MODEL == 'xgboost':
            return xgboost.XGBRFRegressor(
                n_estimators=CONFIG.SHAP_MODEL_PARAMETERS['xgboost']['n_estimators'],
                learning_rate=CONFIG.SHAP_MODEL_PARAMETERS['xgboost']['learning_rate'],
                max_depth=CONFIG.SHAP_MODEL_PARAMETERS['xgboost']['max_depth'],
                random_state=CONFIG.SHAP_MODEL_PARAMETERS['xgboost']['random_state']
            )
        elif CONFIG.SHAP_MODEL == 'lightgbm':
            return lgb.LGBMRegressor(
                n_estimators=CONFIG.SHAP_MODEL_PARAMETERS['lightgbm']['n_estimators'],
                learning_rate=CONFIG.SHAP_MODEL_PARAMETERS['lightgbm']['learning_rate'],
                max_depth=CONFIG.SHAP_MODEL_PARAMETERS['lightgbm']['max_depth'],
                random_state=CONFIG.SHAP_MODEL_PARAMETERS['lightgbm']['random_state']
            )
        else:
            raise ValueError(f"Model {CONFIG.SHAP_MODEL} not supported")
    @classmethod
    def normalize_data(cls, data: pd.DataFrame) -> pd.DataFrame:
        numeric_data = data.select_dtypes(include=['number'])
        # z-score normalization
        normalized_data = (numeric_data - numeric_data.mean()) / numeric_data.std()
        normalized_data = normalized_data.fillna(0)
        
        # Preserve non-numeric columns
        for col in data.select_dtypes(exclude=['number']).columns:
            normalized_data[col] = data[col]
            
        return normalized_data

    @classmethod
    def compute_shap_values(cls, model: Union[xgboost.XGBRFRegressor, lgb.LGBMRegressor], X: pd.DataFrame, y: pd.Series) -> pd.DataFrame:
        X_numeric = X.select_dtypes(include=['number'])
        model.fit(X_numeric, y)
        explainer = shap.TreeExplainer(model)
        shap_values = explainer.shap_values(X_numeric)

        column_shap_values = np.abs(shap_values).mean(axis=0)

        shap_importance = pd.DataFrame({
            'feature': X_numeric.columns,
            'SHAP Value': column_shap_values
        })

        shap_importance = shap_importance.sort_values(by='SHAP Value', ascending=False)

        return shap_importance
    
    @classmethod
    def compute_shapley_values_from_df(cls, data_df: pd.DataFrame, target_column: str) -> pd.DataFrame:
        """Compute Shapley values from a DataFrame."""
        model = cls.get_shap_model()
        normalized_data = cls.normalize_data(data_df)

        X = normalized_data.drop(columns=[target_column])
        y = normalized_data[target_column]

        # check if X contains any numerical columns
        if X.select_dtypes(include=['number']).empty:
            raise ValueError("No numerical columns found in the dataset")

        return cls.compute_shap_values(model, X, y)

