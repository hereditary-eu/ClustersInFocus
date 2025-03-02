import shap
import xgboost
import lightgbm as lgb
from typing import Union
import pandas as pd
import numpy as np

from core.config import CONFIG
from database import temp_database

if 'shap_values' not in temp_database:
    temp_database['shap_values'] = {}



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
        else:
            raise ValueError(f"Model {CONFIG.SHAP_MODEL} not supported")
        

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
    def get_shap_values(cls, target_column: str) -> pd.DataFrame:

        model = cls.get_shap_model()

        data = pd.DataFrame(temp_database['data'])

        X = data.drop(columns=[target_column])
        y = data[target_column]

        shap_importance = cls.compute_shap_values(model, X, y)
        temp_database['shap_values'][target_column] = shap_importance

        return shap_importance

