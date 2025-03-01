from typing import Dict, List, Literal, Optional
from pydantic import BaseModel, Field

class KMeansParams(BaseModel):
    k: int = Field(default=3, gt=0)
    max_iterations: int = Field(default=1000, gt=0)

class ClusteringRequest(BaseModel):
    data: List[Dict[str, float | str]]  # The CSV data
    columns: List[str]  # Selected columns for clustering
    algorithm: Literal["kmeans"] = "kmeans"
    params: KMeansParams

class ClusterGroup(BaseModel):
    cluster_id: int
    data_point_indices: List[int]

class ClusteringResult(BaseModel):
    feature1: str
    feature2: str
    clusters: Dict[int, List[int]]  # cluster_id -> list of data point indices

class ClusterSimilarity(BaseModel):
    feature1: str
    feature2: str
    cluster_id: int
    similarity: float

class SimilarityRequest(BaseModel):
    selected_feature1: str
    selected_feature2: str
    selected_cluster_id: int 