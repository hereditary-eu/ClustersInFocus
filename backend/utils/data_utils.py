import json
from typing import Any, Dict, List

import numpy as np
import pandas as pd

from utils.logger import get_logger

logger = get_logger(__name__)


def sanitize_and_parse_dataset(data: List[Dict[str, Any]]) -> pd.DataFrame:
    """
    Convert raw JSON data to a pandas DataFrame and sanitize it by:
    1. Converting to appropriate data types
    2. Handling null/missing values
    3. Replacing invalid numeric values

    Parameters
    ----------
    data : List[Dict[str, Any]]
        List of dictionaries containing the dataset

    Returns
    -------
    pd.DataFrame
        Sanitized pandas DataFrame
    """
    try:
        df = pd.DataFrame(data)

        numeric_cols = []
        string_cols = []

        for col in df.columns:
            if df[col].isna().all():
                continue
            # try to convert to numeric and see if it works
            try:
                non_null_values = df[col].dropna()
                if len(non_null_values) > 0:
                    # Try converting a sample
                    pd.to_numeric(non_null_values.iloc[0])
                    numeric_cols.append(col)
                else:
                    string_cols.append(col)
            except (ValueError, TypeError):
                string_cols.append(col)

        # Handle numeric columns - convert to float and fill NaN
        for col in numeric_cols:
            df[col] = pd.to_numeric(df[col], errors="coerce")  # Convert non-numeric values to NaN

            # Replace NaN with column mean or 0 if all NaN
            if df[col].isna().any():
                mean_val = df[col].mean()
                if pd.isna(mean_val):  # All values are NaN
                    df[col] = df[col].fillna(0)
                else:
                    df[col] = df[col].fillna(mean_val)

        # Handle string columns - fill NaN with empty string
        for col in string_cols:
            df[col] = df[col].fillna("")
            df[col] = df[col].astype(str)

        logger.info(f"Successfully sanitized dataset with {len(df)} rows and {len(df.columns)} columns")
        return df

    except Exception as e:
        logger.error(f"Error sanitizing dataset: {str(e)}")
        raise RuntimeError(f"Failed to sanitize dataset: {str(e)}")


def dataframe_to_dict_list(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """
    Convert a pandas DataFrame back to a list of dictionaries,
    ensuring all values are JSON serializable.

    Parameters
    ----------
    df : pd.DataFrame
        Pandas DataFrame to convert

    Returns
    -------
    List[Dict[str, Any]]
        List of dictionaries with all values JSON serializable
    """
    # Convert to dict and handle any remaining NaN values
    dict_list = json.loads(df.replace({np.nan: None}).to_json(orient="records"))
    return dict_list


def get_numeric_columns(df: pd.DataFrame) -> List[str]:
    """
    Get list of numeric columns in DataFrame

    Parameters
    ----------
    df : pd.DataFrame
        DataFrame to analyze

    Returns
    -------
    List[str]
        List of column names with numeric data
    """
    return df.select_dtypes(include=["number"]).columns.tolist()
