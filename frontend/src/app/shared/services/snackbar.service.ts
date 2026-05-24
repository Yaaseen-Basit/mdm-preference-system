import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class SnackbarService {
  constructor(private snack: MatSnackBar) {}

  success(msg: string): void {
    this.snack.open(msg, '✕', {
      duration: 3500,
      panelClass: ['snack-success'],
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }

  error(msg: string): void {
    this.snack.open(msg, '✕', {
      duration: 5000,
      panelClass: ['snack-error'],
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }

  info(msg: string): void {
    this.snack.open(msg, '✕', {
      duration: 3000,
      panelClass: ['snack-info'],
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }

  warn(msg: string): void {
    this.snack.open(msg, '✕', {
      duration: 4000,
      panelClass: ['snack-warn'],
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }
}
