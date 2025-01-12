import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PaymentListComponent } from './payment-list/payment-list.component';
import { PaymentDetailsComponent } from './payment-details/payment-details.component';

const routes: Routes = [
  {path: '', redirectTo: 'payment-list', pathMatch: 'full'},
  {path: 'payment-list', component: PaymentListComponent},
  {path: 'payment-details/:id', component: PaymentDetailsComponent},
  {path: '**', redirectTo: 'payment-list', pathMatch: 'full'},

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {

}
