from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.responses import StreamingResponse
from pymongo import MongoClient
from gridfs import GridFS
from bson import ObjectId
from pydantic import BaseModel
from typing import List, Optional
import datetime
import os

from models import PaymentCreate, PaymentResponse, PaymentUpdate

# MongoDB connection setup
client = MongoClient("mongodb://localhost:27017")  # Your MongoDB URI
db = client["payment_db"]  # Database name
fs = GridFS(db)  # For storing evidence files

app = FastAPI()


@app.get("/")
def root():
    return "Server is Up"


@app.post("/create_payment/", response_model=PaymentResponse)
async def create_payment(payment: PaymentCreate):
    total_due = payment.due_amount - (payment.due_amount * payment.discount / 100) + (payment.due_amount * payment.tax / 100)
    
    payment_data = {
        "payee_name": payment.payee_name,
        "amount": payment.amount,
        "due_date": payment.due_date,
        "payment_status": "due_now",  # Default status is "due_now"
        "discount": payment.discount,
        "tax": payment.tax,
        "due_amount": payment.due_amount,
    }

    result = db.payments.insert_one(payment_data)
    payment_data["id"] = str(result.inserted_id)
    payment_data["total_due"] = total_due

    return payment_data

@app.get("/get_payments/", response_model=List[PaymentResponse])
async def get_payments(
    filter: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 10
):
    # Query MongoDB for payments
    query = {}
    if search:
        query["payee_name"] = {"$regex": search, "$options": "i"}

    payments = db.payments.find(query).skip(skip).limit(limit)

    results = []
    for payment in payments:
        # Calculate total_due
        total_due = payment["due_amount"] - (payment["due_amount"] * payment.get("discount", 0) / 100) + (payment["due_amount"] * payment.get("tax", 0) / 100)
        
        # Adjust payment status
        due_date = payment["due_date"]
        today = datetime.datetime.today()
        if due_date == today:
            payment["payment_status"] = "due_now"
        elif due_date < today:
            payment["payment_status"] = "overdue"

        payment["total_due"] = total_due
        payment["id"] = str(payment["_id"])
        results.append(payment)

    return results


@app.put("/update_payment/{payment_id}/", response_model=PaymentResponse)
async def update_payment(payment_id: str, payment: PaymentUpdate):
    payment_data = db.payments.find_one({"_id": ObjectId(payment_id)})
    if not payment_data:
        raise HTTPException(status_code=404, detail="Payment not found")

    if payment.payment_status == "completed" and not payment.evidence_file_id:
        raise HTTPException(status_code=400, detail="Evidence file is required when marking payment as completed")

    # Update payment status and evidence file ID if provided
    db.payments.update_one(
        {"_id": ObjectId(payment_id)},
        {"$set": {"payment_status": payment.payment_status, "evidence_file_id": payment.evidence_file_id}}
    )

    payment_data["payment_status"] = payment.payment_status
    payment_data["evidence_file_id"] = payment.evidence_file_id
    payment_data["id"] = str(payment_data["_id"])

    total_due = payment_data["due_amount"] - (payment_data["due_amount"] * payment_data["discount"] / 100) + (payment_data["due_amount"] * payment_data["tax"] / 100)
    payment_data["total_due"] = total_due
    return payment_data


@app.delete("/delete_payment/{payment_id}/", status_code=204)
async def delete_payment(payment_id: str):
    result = db.payments.delete_one({"_id": ObjectId(payment_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Payment not found")
    return {"detail": "Payment deleted successfully"}


@app.post("/upload_evidence/{payment_id}/")
async def upload_evidence(payment_id: str, file: UploadFile = File(...)):
    payment_data = db.payments.find_one({"_id": ObjectId(payment_id)})
    if not payment_data:
        raise HTTPException(status_code=404, detail="Payment not found")

    # if payment_data["payment_status"] != "completed":
    #     payment_data["payment_status"] = "completed"
        # raise HTTPException(status_code=400, detail="Payment must be marked as completed to upload evidence")

    # Store file in GridFS
    file_id = fs.put(await file.read(), filename=file.filename, content_type=file.content_type)

    # Update payment record with the file ID
    db.payments.update_one(
        {"_id": ObjectId(payment_id)},
        {"$set": {"evidence_file_id": str(file_id), "payment_status": "completed"}}
    )

    return {"file_id": str(file_id), "filename": file.filename}


@app.get("/download_evidence/{payment_id}/")
async def download_evidence(payment_id: str):
    payment_data = db.payments.find_one({"_id": ObjectId(payment_id)})
    if not payment_data:
        raise HTTPException(status_code=404, detail="Payment not found")

    file_id = payment_data.get("evidence_file_id")
    if not file_id:
        raise HTTPException(status_code=404, detail="No evidence file found for this payment")

    # Retrieve file from GridFS
    file = fs.get(ObjectId(file_id))

    return StreamingResponse(file, media_type=file.content_type, headers={"Content-Disposition":"attachment;"})
