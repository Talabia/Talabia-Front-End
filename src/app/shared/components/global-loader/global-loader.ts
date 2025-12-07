import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GlobalLoaderService, LoaderState } from '../../services/global-loader.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-global-loader',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './global-loader.html',
  styleUrl: './global-loader.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlobalLoaderComponent implements OnInit, OnDestroy {
  loaderState: LoaderState = {
    isVisible: false,
    message: 'common.loading'
  };

  private destroy$ = new Subject<void>();

  constructor(
    private globalLoaderService: GlobalLoaderService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.globalLoaderService
      .getLoaderState()
      .pipe(takeUntil(this.destroy$))
      .subscribe((state: LoaderState) => {
        this.loaderState = state;
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
