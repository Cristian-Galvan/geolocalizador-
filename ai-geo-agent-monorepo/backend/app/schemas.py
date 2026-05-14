from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional, List

class PlaceModel(BaseModel):
    name: str
    description: Optional[str] = ""
    category: Optional[str] = None
    url: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    distance: Optional[float] = None
    duration: Optional[int] = None

class QueryRequest(BaseModel):
    prompt: str = Field(..., min_length=3, max_length=500)
    latitude: float
    longitude: float

class QueryResponse(BaseModel):
    id: int
    prompt: str
    response: str
    places: List[PlaceModel] = []
    latitude: float
    longitude: float
    address: Optional[str] = None 
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)

class VisitedPlaceCreate(BaseModel):
    name: str
    address: str
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None

class VisitedPlaceResponse(BaseModel):
    id: int
    name: str
    address: str
    rating: int
    comment: Optional[str] = None
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)