import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RestClientService {

  constructor(private http: HttpClient) {

  }

  postJson<T>(url: string, body: any, headers?: HttpHeaders | { [header: string]: string | string[] }): Observable<T> {
    const httpHeaders = headers || new HttpHeaders().set('Content-Type', 'application/json');
    return this.http.post<T>(url, body, { headers: httpHeaders });
  }

  postMultipart<T>(url: string, formData: FormData, headers?: HttpHeaders | { [header: string]: string | string[] }): Observable<T> {
    const httpHeaders = headers || new HttpHeaders();
    return this.http.post<T>(url, formData, { headers: httpHeaders });
  }

  get<T>(url: string, params?: HttpParams | { [param: string]: string | string[] }): Observable<T> {
    return this.http.get<T>(url, { params });
  }
}
