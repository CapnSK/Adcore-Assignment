# Function to convert Unix timestamp to datetime
import datetime

from models import PaymentBase


# def convert_unix_to_datetime(unix_timestamp):
#     return datetime.utcfromtimestamp(unix_timestamp)

def transform(csv_data):
    payment_records = []
    for index, row in csv_data.iterrows():
        # Construct the data based on the CSV and model requirements
        payee_name = f"{row['payee_first_name']} {row['payee_last_name']}"
        amount = row['due_amount']
        due_date = row['payee_due_date']  # This is already in a date format
        payment_status = row['payee_payment_status']
        discount = row['discount_percent']
        tax = row['tax_percent']
        due_amount = row['due_amount']
        # Convert the due_date from string to datetime object
        due_date = datetime.datetime.strptime(due_date, '%Y-%m-%d')
        #create payment object
        payment = PaymentBase(
            payee_name=payee_name,
            amount=amount,
            due_date=due_date,
            payment_status=payment_status,
            discount=discount,
            tax=tax,
            due_amount=due_amount
        )
        payment_records.append(payment.model_dump())
    return payment_records

def calculate_total(amt: int, discount: int = 0, tax: int = 0):
    return amt - (amt * discount / 100) + (amt * tax / 100)