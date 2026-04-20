import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface StepSelectorItem {
  value: string;
  label: string;
  sublabel?: string;
}

@Component({
  selector: 'rp-tour-step-dropdown',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tour-dropdown" style="position: relative">
      <!-- Trigger -->
      <button
        type="button"
        class="tour-dropdown-trigger"
        (click)="toggleOpen()"
        [attr.aria-expanded]="open"
      >
        <span class="tour-dropdown-trigger-text">
          {{ selectedLabel }}
        </span>
        <span class="tour-dropdown-caret">&#x2303;</span>
      </button>

      <!-- Panel -->
      <div *ngIf="open" class="tour-dropdown-panel">
        <div class="tour-dropdown-search-wrap">
          <span class="tour-dropdown-search-icon">&#x2315;</span>
          <input
            #searchInput
            type="text"
            class="tour-dropdown-search"
            placeholder="Search..."
            [(ngModel)]="search"
          />
        </div>

        <div #listEl class="tour-dropdown-list">
          <div
            *ngIf="filteredItems.length === 0"
            class="tour-dropdown-empty"
          >
            No steps found
          </div>
          <button
            *ngFor="let item of filteredItems"
            type="button"
            class="tour-dropdown-item"
            [class.tour-dropdown-item-active]="item.value === value"
            (click)="selectItem(item.value)"
          >
            <span class="tour-dropdown-item-label">{{ item.label }}</span>
            <span
              *ngIf="item.sublabel"
              class="tour-dropdown-item-sublabel"
            >
              {{ item.sublabel }}
            </span>
            <span
              *ngIf="item.value === value"
              class="tour-dropdown-item-check"
            >
              &#x2713;
            </span>
          </button>
        </div>
      </div>
    </div>
  `,
})
export class TourStepDropdownComponent {
  @Input() items: StepSelectorItem[] = [];
  @Input() value = '';
  @Output() valueChange = new EventEmitter<string | undefined>();

  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;
  @ViewChild('listEl') listEl?: ElementRef<HTMLDivElement>;

  open = false;
  search = '';

  get selectedLabel(): string {
    return this.items.find((i) => i.value === this.value)?.label ?? 'Select step...';
  }

  get filteredItems(): StepSelectorItem[] {
    if (!this.search) return this.items;
    const q = this.search.toLowerCase();
    return this.items.filter(
      (i) =>
        i.label.toLowerCase().includes(q) ||
        (i.sublabel?.toLowerCase().includes(q) ?? false),
    );
  }

  toggleOpen(): void {
    this.open = !this.open;
    if (this.open) {
      setTimeout(() => {
        this.searchInput?.nativeElement.focus();
        const active = this.listEl?.nativeElement.querySelector(
          '.tour-dropdown-item-active',
        );
        active?.scrollIntoView({ block: 'nearest' });
      });
    }
  }

  selectItem(itemValue: string): void {
    this.valueChange.emit(itemValue);
    this.open = false;
    this.search = '';
  }
}
