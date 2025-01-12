from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# Pydantic model for creating and updating payments
class PaymentBase(BaseModel):
    payee_name: str
    amount: float
    due_date: datetime
    payment_status: Optional[str]
    discount: Optional[float] = 0
    tax: Optional[float] = 0
    due_amount: float
    evidence_file_id: Optional[str] = None

class PaymentCreate(PaymentBase):
    pass

class PaymentUpdate(BaseModel):
    due_date: Optional[str]
    due_amount: Optional[str]
    payment_status: Optional[str]
    evidence_file_id: Optional[str] = None

# Model for response
class PaymentResponse(PaymentBase):
    id: str
    total_due: float

    class Config:
        orm_mode = True

class PaginatedPaymentsResponse(BaseModel):
    totalCount: int
    data: List[PaymentResponse]

# Evidence file model
class EvidenceFile(BaseModel):
    file_id: str
    filename: str
    content_type: str
