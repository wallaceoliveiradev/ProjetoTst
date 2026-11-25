import { DOCUMENT } from '@angular/common';
import { Directive, ElementRef, afterNextRender, inject, output } from '@angular/core';

@Directive({
  selector: '[appDialog]',
  standalone: true,
  host: { role: 'dialog', 'aria-modal': 'true', tabindex: '-1', '(keydown)': 'onKeydown($event)' },
})
export class Dialog {
  readonly dialogClose = output<void>();
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly document = inject(DOCUMENT);
  private previousFocus: HTMLElement | null = null;

  constructor() {
    afterNextRender(() => {
      this.previousFocus = this.document.activeElement as HTMLElement | null;
      (this.focusable()[0] ?? this.host.nativeElement).focus();
    });
  }

  ngOnDestroy(): void {
    if (this.previousFocus?.isConnected) this.previousFocus.focus();
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.dialogClose.emit();
    }
    if (event.key !== 'Tab') return;
    const elements = this.focusable();
    const first = elements[0];
    const last = elements.at(-1);
    if (!first) {
      event.preventDefault();
      this.host.nativeElement.focus();
    } else if (
      event.shiftKey &&
      (this.document.activeElement === first ||
        this.document.activeElement === this.host.nativeElement)
    ) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && this.document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  private focusable(): HTMLElement[] {
    return Array.from(
      this.host.nativeElement.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((element) => element.getClientRects().length > 0);
  }
}
