import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-mat-modal',
    imports: [
    MatDialogModule,
    MatButtonModule,
    RouterModule
],
    templateUrl: './mat-modal.component.html',
    styleUrl: './mat-modal.component.css'
})
export class MatModalComponent {
  data = inject(MAT_DIALOG_DATA);
  dialogRef = inject(MatDialogRef<MatModalComponent>);

  onConfirm() {
    this.dialogRef.close(true);
  }

  onPurchaseCredits(amount: number) {
    // Placeholder for purchase logic - would integrate with payment system
    this.dialogRef.close({ purchased: true, amount });
  }
}
