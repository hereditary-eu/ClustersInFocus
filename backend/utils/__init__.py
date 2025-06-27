import hashlib

from utils.logger import CustomLogger


def hash_file(csv_data_json_dump: str) -> str:
    return hashlib.sha256(csv_data_json_dump.encode()).hexdigest()


def get_logger(name: str) -> CustomLogger:
    """
    Get a logger instance for the given name

    Parameters
    ----------
    name : str
        Logger name (usually __name__)

    Returns
    -------
    CustomLogger
        Configured logger instance
    """
    return CustomLogger(name)
