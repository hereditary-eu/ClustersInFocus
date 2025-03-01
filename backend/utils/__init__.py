from utils.logger import CustomLogger

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