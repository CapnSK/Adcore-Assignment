import { Component, OnInit, ViewChild } from '@angular/core';
import { PaymentService } from '../payment.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { Router } from '@angular/router';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-payment-list',
  templateUrl: './payment-list.component.html',
  styleUrls: ['./payment-list.component.scss'],
  standalone: false
})
export class PaymentListComponent implements OnInit {

  @ViewChild('paginatorRef', {read: MatPaginator}) private readonly paginatorRef?: MatPaginator;

  payments: any[] = [];
  displayedColumns: string[] = ['id', 'name', 'amount', "totalDue", 'status', 'dueDate', 'actions'];
  dataSource = new MatTableDataSource(this.payments);
  paginationProps = {
    pageSize: 10,
    activePage: 0,
    totalCount: 0
  };
  filter = '';

  constructor(private readonly paymentService: PaymentService, private _router: Router) { }

  ngOnInit() {
    this.loadPayments();
  }

  loadPayments(refresh = false) {

    this.paymentService.getPayments(this.paginationProps.activePage * this.paginationProps.pageSize, this.filter, this.paginationProps.pageSize).subscribe(response => {
      this.payments = this._transform(response.data);
      this.dataSource.data = this.payments;
      this.paginationProps.totalCount = response.totalCount;

      if(refresh){
        this.paginatorRef?.firstPage();
      }
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.filter = filterValue;
    this.loadPayments(true);
  }

  deletePayment(paymentId: string, payeeName: string) {
    if (confirm(`Are you sure you want to delete this payment?: ${paymentId} by ${payeeName}`)) {
      this.paymentService.deletePayment(paymentId).subscribe(() => {
        this.loadPayments();
      });
    }
  }

  viewDetails(id: string) {
    this._router.navigate(['/payment-details', id])
  }

  pageChanged(event: PageEvent){
    this.paginationProps = {
      ...this.paginationProps,
      activePage: event.pageIndex,
    }
    this.loadPayments();
  }

  public downloadEvidence(paymentId: string){
    window.open(`${'http://ec2-3-86-29-68.compute-1.amazonaws.com:8000'}/download_evidence/${paymentId}`, "*")
    this.paymentService.downloadEvidence(paymentId).pipe(take(1)).subscribe()
  }

  private _transform(paymentsDTO: Array<any>) {
    return paymentsDTO?.map((row) => {
      return {
        id: row.id,
        name: row.payee_name,
        amount: row.amount,
        totalDue: row.total_due?.toFixed(2),
        status: row.payment_status,
        dueDate: row.due_date,
        evidenceUploaded: !!(row.evidence_file_id ?? '')
      }
    });
  }
}
