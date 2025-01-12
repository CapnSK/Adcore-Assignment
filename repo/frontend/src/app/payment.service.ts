import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RestClientService } from '../lib/rest-client/rest-client.service';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private readonly apiUrl = `http://ec2-3-86-29-68.compute-1.amazonaws.com:8000`; // Replace with your backend URL

  constructor(private readonly restClient: RestClientService) { }

  // Get payments with pagination and filters
  getPayments(skip: number, filter: string, pageSize: number): Observable<any> {
    let params = new HttpParams().set('skip', skip.toString()).set('search', filter).set('limit', pageSize.toString());
    return this.restClient.get<any>(`${this.apiUrl}/get_payments/`, params);
  }

  // Add new payment
  addPayment(payment: any): Observable<any> {
    return this.restClient.postJson<any>(`${this.apiUrl}/create_payment/`, payment);
  }

  // Update payment
  updatePayment(paymentId: string, payment: any): Observable<any> {
    return this.restClient.put<any>(`${this.apiUrl}/update_payment/${paymentId}`, payment);
  }

  //upload evidence
  uploadEvidence(paymentId: string, file: File): Observable<any> {
    const formData = new FormData();
    if (file) {
      formData.append('file', file);
    }
    return this.restClient.postMultipart(`${this.apiUrl}/upload_evidence/${paymentId}`, formData);
  }

  //download evidence
  downloadEvidence(paymentId: string): Observable<any> {
    return this.restClient.get(`${this.apiUrl}/download_evidence/${paymentId}`);
  }


  // Delete payment
  deletePayment(paymentId: string): Observable<any> {
    return this.restClient.delete<any>(`${this.apiUrl}/delete_payment/${paymentId}`);
  }

  // Fetch payment details
  getPaymentDetails(paymentId: string): Observable<any> {
    return this.restClient.get<any>(`${this.apiUrl}/get_payment/${paymentId}/`);
  }
}
