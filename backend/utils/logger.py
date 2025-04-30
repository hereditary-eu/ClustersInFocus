import logging
import logging.handlers
from core.config import CONFIG


class ColoredFormatter(logging.Formatter):
    """
    Custom formatter that adds color to log level names
    """

    # Define color mappings for each log level
    COLOR_MAPPINGS = {
        "CRITICAL": "\033[1;36m",
        "ERROR": "\033[1;31m",
        "WARNING": "\033[1;33m",
        "INFO": "\033[1;32m",
        "DEBUG": "\033[1;30m",
    }

    def format(self, record: logging.LogRecord) -> str:
        # Apply color to log level name
        level_name = record.levelname
        if level_name in self.COLOR_MAPPINGS:
            color_code = self.COLOR_MAPPINGS[level_name]
            level_name = f"{color_code}{level_name:<8}\033[0m"

        record.levelname = level_name
        return super().format(record)


class CustomLogger(logging.Logger):
    """
    Custom logger class that adds color-coded log levels and a specific log message format
    """

    def __init__(self, name: str) -> None:
        """
        Initialize the logger with CONFIGuration from CONFIG class

        Parameters
        ----------
        name : str
            Logger name (usually __name__)
        """
        super().__init__(name, CONFIG.LOG_LEVEL)

        # Add handlers
        self.add_stream_handler()

    def add_stream_handler(self) -> None:
        """
        Add console handler with colored output
        """
        console_handler = logging.StreamHandler()
        color_formatter = ColoredFormatter(
            "[%(asctime)s] [%(levelname)-8s] --- %(message)s (%(filename)s:%(lineno)d)", datefmt="%Y-%m-%d %H:%M:%S"
        )
        console_handler.setFormatter(color_formatter)
        self.addHandler(console_handler)


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
        CONFIGured logger instance
    """
    return CustomLogger(name)
