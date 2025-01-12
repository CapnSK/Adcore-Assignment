import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RestClientService } from '../lib/rest-client/rest-client.service';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = `http://127.0.0.1:8000`; // Replace with your backend URL

  constructor(private readonly restClient: RestClientService) { }

  // Get payments with pagination and filters
  getPayments(skip: number, filter: string, pageSize: number): Observable<any> {
    let params = new HttpParams().set('skip', skip.toString()).set('search', filter).set('limit', pageSize.toString());
    return this.restClient.get<any>(`${this.apiUrl}/get_payments/`, params);
  }

  // Add new payment
  addPayment(payment: any): Observable<any> {
    return this.restClient.postJson<any>(this.apiUrl, payment);
  }

  // Update payment
  updatePayment(paymentId: string, payment: any): Observable<any> {
    return this.restClient.postJson<any>(`${this.apiUrl}/${paymentId}`, payment);
  }

  // Delete payment
  deletePayment(paymentId: string): Observable<any> {
    return this.restClient.delete<any>(`${this.apiUrl}/delete_payment/${paymentId}`);
  }

  // Fetch payment details
  getPaymentDetails(paymentId: string): Observable<any> {
    return this.restClient.get<any>(`${this.apiUrl}/${paymentId}/`);
  }
}
