import { Component, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormBuilder, FormGroup, UntypedFormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, finalize, retry, switchMap } from 'rxjs';
import { PaymentService } from '../payment.service';

@Component({
  selector: 'app-payment-details',
  standalone: false,

  templateUrl: './payment-details.component.html',
  styleUrl: './payment-details.component.scss'
})
export class PaymentDetailsComponent {
  paymentId?: string;
  paymentForm!: FormGroup;
  loading?: boolean = false;
  paymentData?: any;
  file?: File | null = null;
  showFileInput = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly paymentService: PaymentService,
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly destroyRef: DestroyRef
  ) { }

  ngOnInit(): void {
    this.paymentId = this.route.snapshot.paramMap.get('id') ?? '';
    this.initForm();
    this.paymentForm.get('payment_status')?.valueChanges.pipe(
      debounceTime(50),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((value) => {
      value === "completed" ? this.paymentForm.addControl('evidence_file', new UntypedFormControl(null, [Validators.required]))
        : this.paymentForm.removeControl('evidence_file')
      this.showFileInput = value === "completed" || false;
    });
    this.loadPaymentDetails();
  }

  initForm(): void {
    this.paymentForm = this.fb.group({
      due_date: ['', Validators.required],
      due_amount: ['', [Validators.required, Validators.min(0)]],
      payment_status: ['', Validators.required],
      evidence_file: [null]  // To handle file uploads
    });
  }

  loadPaymentDetails(): void {
    this.loading = true;
    this.paymentService.getPaymentDetails(this.paymentId ?? '').pipe(
      finalize(() => {
        this.loading = false;
      })
    ).subscribe((response) => {

      this.paymentForm?.patchValue({
        due_date: this._formatDateToYYYYMMDD(response.due_date),
        due_amount: response.total_due?.toFixed(2),
        payment_status: response.payment_status
      });
    });
  }

  onFileChange(event: any): void {
    this.file = event.target.files[0];
  }

  onSubmit(): void {
    if (this.paymentForm?.invalid) {
      return;
    }

    const updatedPayment = this.paymentForm?.value;
    if (updatedPayment.status === 'completed' && !this.file) {
      alert('Evidence file is required when marking payment as completed');
      return;
    }

    this.paymentService.uploadEvidence(this.paymentId ?? '', this.file!).pipe(
      retry(2),
      switchMap((response) => {
        return this.paymentService.updatePayment(this.paymentId ?? '', { ...updatedPayment, 'evidence_file_id': response.file_id })
      })
    ).subscribe({
        next: (response) => {
          alert('Payment updated successfully');
          this.router.navigate(['/payment-list']);  // Redirect to payment list page
        },
        error: (error) => {
          alert('Failed to update payment');
        }
      });
  }

  private _formatDateToYYYYMMDD(dateStr: string): string {
    const date = new Date(dateStr); // Create a Date object
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Add leading zero
    const day = date.getDate().toString().padStart(2, '0'); // Add leading zero
    return `${year}-${month}-${day}`;
  }
}
