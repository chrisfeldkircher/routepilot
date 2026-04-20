import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GuidedTourService } from '@routepilot/angular';
import {
  importState,
  computeErrorSummary,
  type ImportStateShape,
  type ColumnMapping,
} from '../state/importState';
import { errorRecoveryTour } from '../tours/error-recovery.tour';

const IMPORT_EVENT = 'import-tour:state-changed';

const ERROR_TYPE_LABELS: Record<string, string> = {
  'missing-mapping': 'Missing mapping',
  'type-mismatch': 'Type mismatch',
  'duplicate-key': 'Duplicate key',
};

const TARGET_OPTIONS: Record<string, string[]> = {
  email: ['email_address', 'contact_email', 'primary_email'],
  name: ['full_name', 'display_name'],
  age: ['age', 'years'],
  department: ['dept_code', 'department_name'],
  employee_id: ['employee_id', 'emp_id'],
  start_date: ['hire_date', 'start_date'],
};

@Component({
  selector: 'app-import',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="import-page">
      <div class="import-file-header" data-tour="import-header">
        <div class="import-file-icon">CSV</div>
        <div class="import-file-info">
          <div class="import-file-name">{{ state.fileName }}</div>
          <div class="import-file-meta">
            {{ state.rowCount }} rows · 6 columns · <code>UTF-8</code>
          </div>
        </div>
        <span class="import-status-badge" [class]="'import-status-' + state.status">
          {{ statusLabel }}
        </span>
      </div>

      <div
        *ngIf="state.status === 'errors'"
        class="import-error-banner"
        data-tour="error-banner"
      >
        <div class="import-error-banner-icon">!</div>
        <div class="import-error-banner-content">
          <strong>{{ errorSummary.unresolved }} validation error{{ errorSummary.unresolved !== 1 ? 's' : '' }} found</strong>
          <p>
            <ng-container *ngIf="errorSummary.resolved > 0">
              {{ errorSummary.resolved }} of {{ errorSummary.total }} resolved.
            </ng-container>
            Fix the remaining issues before importing.
          </p>
        </div>
        <button class="btn btn-sm import-help-btn" (click)="launchRecovery()">
          Help me fix these →
        </button>
      </div>

      <div
        *ngIf="state.status === 'valid'"
        class="import-success-banner"
        data-tour="success-banner"
      >
        <div class="import-success-banner-icon">✓</div>
        <div class="import-success-banner-content">
          <strong>All validations passed</strong>
          <p>Ready to import {{ state.rowCount }} rows.</p>
        </div>
      </div>

      <div
        *ngIf="state.status === 'imported'"
        class="import-success-banner"
        data-tour="success-banner"
      >
        <div class="import-success-banner-icon">✓</div>
        <div class="import-success-banner-content">
          <strong>Import complete</strong>
          <p>{{ state.rowCount }} rows imported successfully.</p>
        </div>
      </div>

      <div class="import-grid">
        <div class="import-main">
          <section class="card import-section" data-tour="error-list">
            <header class="import-section-header">
              <h3>Validation results</h3>
              <span class="import-section-hint">
                {{ errorSummary.unresolved === 0 ? 'All clear' : errorSummary.unresolved + ' issue' + (errorSummary.unresolved !== 1 ? 's' : '') + ' remaining' }}
              </span>
            </header>
            <div class="import-error-table">
              <div class="import-error-table-header">
                <span>Row</span>
                <span>Column</span>
                <span>Type</span>
                <span>Message</span>
                <span>Status</span>
              </div>
              <div
                *ngFor="let err of state.errors; let i = index"
                class="import-error-row"
                [class.import-error-row-resolved]="err.resolved"
                [attr.data-tour]="'error-row-' + (i + 1)"
              >
                <span class="import-error-row-num">{{ err.row ?? '—' }}</span>
                <span class="import-error-col"><code>{{ err.column }}</code></span>
                <span class="import-error-type">
                  <span class="import-error-badge" [class]="'import-error-badge-' + err.type">
                    {{ errorTypeLabel(err.type) }}
                  </span>
                </span>
                <span class="import-error-msg">{{ err.message }}</span>
                <span
                  class="import-error-status"
                  [class.import-error-status-ok]="err.resolved"
                  [class.import-error-status-err]="!err.resolved"
                >
                  {{ err.resolved ? '✓ Resolved' : '⚠ Open' }}
                </span>
              </div>
            </div>
          </section>

          <section class="card import-section" data-tour="preview-section">
            <header class="import-section-header">
              <h3>Data preview</h3>
              <span class="import-section-hint">First 5 rows</span>
            </header>
            <div class="import-preview-table">
              <div class="import-preview-header">
                <span>#</span>
                <span *ngFor="let m of state.mappings">{{ m.source }}</span>
              </div>
              <div
                *ngFor="let row of state.previewRows"
                class="import-preview-row"
                [class.import-preview-row-error]="row.hasError"
                [attr.data-tour]="'preview-row-' + row.rowNum"
              >
                <span class="import-preview-rownum">{{ row.rowNum }}</span>
                <span
                  *ngFor="let m of state.mappings"
                  [class.import-preview-cell-error]="isErrorCell(row, m.source)"
                >
                  {{ row.data[m.source] || '' }}
                </span>
              </div>
            </div>
          </section>
        </div>

        <aside class="import-sidebar">
          <section class="card import-section" data-tour="mapper-section">
            <header class="import-section-header">
              <h3>Column mapper</h3>
            </header>
            <div class="import-mapper-list">
              <div
                *ngFor="let m of state.mappings"
                class="import-mapping-row"
                [class.import-mapping-row-error]="m.required && !m.target"
                [attr.data-tour]="'mapping-' + m.source"
              >
                <div class="import-mapping-source">
                  <code>{{ m.source }}</code>
                  <span *ngIf="m.required" class="import-mapping-req">req</span>
                </div>
                <span class="import-mapping-arrow">→</span>
                <select
                  class="import-mapping-select"
                  [value]="m.target ?? ''"
                  (change)="onMappingChange(m.source, $event)"
                >
                  <option value="">— not mapped —</option>
                  <option *ngFor="let opt of targetOptionsFor(m.source)" [value]="opt">
                    {{ opt }}
                  </option>
                </select>
                <span class="import-mapping-type">{{ m.type }}</span>
              </div>
            </div>
          </section>

          <section class="card import-section" data-tour="dedup-section">
            <header class="import-section-header">
              <h3>Duplicate handling</h3>
            </header>
            <div class="import-dedup-options">
              <button
                *ngFor="let opt of dedupOptions"
                class="import-dedup-btn"
                [class.import-dedup-btn-active]="state.dedupStrategy === opt"
                [attr.data-tour]="'dedup-' + opt"
                (click)="onDedupChange(opt)"
              >
                <span class="import-dedup-label">
                  {{ opt === 'skip' ? 'Skip duplicates' : 'Overwrite existing' }}
                </span>
                <span class="import-dedup-hint">
                  {{ opt === 'skip' ? 'Drop rows with duplicate keys' : 'Replace existing records on conflict' }}
                </span>
              </button>
            </div>
          </section>

          <div class="import-action-bar" data-tour="action-bar">
            <button
              class="btn import-revalidate-btn"
              data-tour="revalidate-btn"
              (click)="onRevalidate()"
            >
              Re-validate
            </button>
            <button
              class="btn btn-primary import-import-btn"
              data-tour="import-btn"
              [disabled]="state.status === 'errors'"
              (click)="onImport()"
            >
              {{ state.status === 'imported' ? 'Imported ✓' : 'Import ' + state.rowCount + ' rows' }}
            </button>
          </div>
        </aside>
      </div>
    </div>
  `,
})
export class ImportComponent implements OnInit, OnDestroy {
  state: ImportStateShape = importState.get();
  errorSummary = computeErrorSummary(this.state);

  readonly dedupOptions: Array<'skip' | 'overwrite'> = ['skip', 'overwrite'];

  private listener = () => this.sync();

  constructor(
    private cdr: ChangeDetectorRef,
    private tour: GuidedTourService,
  ) {}

  ngOnInit(): void {
    importState.init();
    this.sync();
    window.addEventListener(IMPORT_EVENT, this.listener);
  }

  ngOnDestroy(): void {
    window.removeEventListener(IMPORT_EVENT, this.listener);
    importState.reset();
  }

  get statusLabel(): string {
    return this.state.status === 'imported'
      ? 'Imported'
      : this.state.status === 'valid'
        ? 'Valid'
        : 'Errors';
  }

  errorTypeLabel(type: string): string {
    return ERROR_TYPE_LABELS[type] ?? type;
  }

  targetOptionsFor(source: string): string[] {
    return TARGET_OPTIONS[source] ?? [];
  }

  isErrorCell(row: { rowNum: number; hasError?: boolean }, column: string): boolean {
    if (!row.hasError) return false;
    return this.state.errors.some(
      (e) => !e.resolved && e.row === row.rowNum && e.column === column,
    );
  }

  launchRecovery(): void {
    void this.tour.actions.startWithDefinition(errorRecoveryTour, {
      startNodeId: errorRecoveryTour.steps[0]?.id,
    });
  }

  onMappingChange(source: string, ev: Event): void {
    const target = (ev.target as HTMLSelectElement).value || null;
    importState.setMapping(source, target);
    if (target) {
      const err = this.state.errors.find((e) => e.column === source && e.type === 'missing-mapping');
      if (err && !err.resolved) importState.resolveError(err.id);
    }
    this.notify();
  }

  onDedupChange(strategy: 'skip' | 'overwrite'): void {
    importState.setDedupStrategy(strategy);
    const err = this.state.errors.find((e) => e.type === 'duplicate-key');
    if (err && !err.resolved) importState.resolveError(err.id);
    this.notify();
  }

  onRevalidate(): void {
    importState.revalidate();
    this.notify();
  }

  onImport(): void {
    importState.setStatus('imported');
    this.notify();
  }

  private notify(): void {
    window.dispatchEvent(new CustomEvent(IMPORT_EVENT));
  }

  private sync(): void {
    this.state = importState.get();
    this.errorSummary = computeErrorSummary(this.state);
    this.cdr.markForCheck();
  }
}
