# from fastapi import APIRouter
# from utils import get_logger
# from database import temp_database

# logger = get_logger(__name__)
# debug_router = APIRouter(prefix="/debug", tags=["debug"])

# @debug_router.get("/ping")
# async def ping():
#     return {"message": "pong"}

# @debug_router.get("/temp_database")
# async def get_temp_database():
#     """Return the temp database. Could take a while to load."""
#     return temp_database


# @debug_router.get("/temp_database/structure")
# async def get_temp_database_structure():
#     """Return the structure of the temp database."""
#     return get_database_structure(temp_database)

# def get_database_structure(data):
#     """Extract the structure of the data without including all values."""
#     if isinstance(data, dict):
#         return {key: get_database_structure(value) for key, value in data.items()}
#     elif isinstance(data, list):
#         if not data:
#             return []
#         # Only show structure of first item and count
#         return [
#             get_database_structure(data[0]),
#             f"... ({len(data)} items total)"
#         ] if len(data) > 1 else [get_database_structure(data[0])]
#     else:
#         # For simple values, just return the type
#         return f"({type(data).__name__})"


# @debug_router.get("/temp_database/{key}")
# async def get_temp_database_item(key: str):
#     """Return a specific key from the temp database.

#     Args:
#         key: The key to retrieve from the temp database

#     Returns:
#         The value associated with the key, or an error if the key doesn't exist
#     """
#     if key in temp_database:
#         return temp_database[key]
#     else:
#         return {"error": f"Key '{key}' not found in temp database"}
