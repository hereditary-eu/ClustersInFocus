from sqlalchemy import Column, Integer, String, Float, ForeignKey, JSON
from sqlalchemy.orm import relationship
from database import Base

class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(String, primary_key=True, index=True)
    filename = Column(String)
    data = Column(JSON)  # Store the CSV data as JSON
    
    clusters = relationship("ClusterGroup", back_populates="dataset", cascade="all, delete-orphan")
    shapley_values = relationship("ShapleyValue", back_populates="dataset", cascade="all, delete-orphan")

class ClusterGroup(Base):
    __tablename__ = "cluster_groups"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    dataset_id = Column(String, ForeignKey("datasets.id"))
    feature1 = Column(String)
    feature2 = Column(String)
    algorithm = Column(String)  # "kmeans" or "dbscan"
    
    dataset = relationship("Dataset", back_populates="clusters")
    clusters = relationship("Cluster", back_populates="cluster_group", cascade="all, delete-orphan")

class Cluster(Base):
    __tablename__ = "clusters"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    cluster_group_id = Column(Integer, ForeignKey("cluster_groups.id"))
    cluster_id = Column(Integer)  # This is the actual cluster ID from KMeans/DBSCAN
    data_point_indices = Column(JSON)  # Store the list of indices as JSON
    
    cluster_group = relationship("ClusterGroup", back_populates="clusters")

class ShapleyValue(Base):
    __tablename__ = "shapley_values"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    dataset_id = Column(String, ForeignKey("datasets.id"))
    target_column = Column(String)
    feature = Column(String)
    value = Column(Float)
    
    dataset = relationship("Dataset", back_populates="shapley_values")