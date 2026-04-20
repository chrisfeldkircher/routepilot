import { useEffect, useState } from 'react';
import { useGuidedTourActions } from '@routepilot/react';
import {
  importState,
  computeErrorSummary,
  type ImportStateShape,
  type ColumnMapping,
} from './importState';
import { errorRecoveryTour } from './importTour';

const IMPORT_EVENT = 'import-tour:state-changed';

const notify = () => {
  window.dispatchEvent(new CustomEvent(IMPORT_EVENT));
};

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

export default function ImportPage() {
  const tourActions = useGuidedTourActions();
  const [, setTick] = useState(0);

  useEffect(() => {
    const handler = () => setTick((t) => t + 1);
    window.addEventListener(IMPORT_EVENT, handler);
    return () => window.removeEventListener(IMPORT_EVENT, handler);
  }, []);

  useEffect(() => {
    importState.init();
    notify();
    return () => {
      importState.reset();
    };
  }, []);

  const state = importState.get();
  const { total, resolved, unresolved } = computeErrorSummary(state);

  const launchRecovery = () => {
    void tourActions.startWithDefinition(errorRecoveryTour, {
      startNodeId: errorRecoveryTour.steps[0]?.id,
    });
  };

  const handleMappingChange = (source: string, target: string) => {
    importState.setMapping(source, target || null);
    if (target) {
      const err = state.errors.find((e) => e.column === source && e.type === 'missing-mapping');
      if (err && !err.resolved) {
        importState.resolveError(err.id);
      }
    }
    notify();
  };

  const handleDedupChange = (strategy: 'skip' | 'overwrite') => {
    importState.setDedupStrategy(strategy);
    const err = state.errors.find((e) => e.type === 'duplicate-key');
    if (err && !err.resolved) {
      importState.resolveError(err.id);
    }
    notify();
  };

  const handleRevalidate = () => {
    importState.revalidate();
    notify();
  };

  const handleImport = () => {
    importState.setStatus('imported');
    notify();
  };

  return (
    <div className="import-page">
      <ImportHeader state={state} />

      {state.status === 'errors' && (
        <div className="import-error-banner" data-tour="error-banner">
          <div className="import-error-banner-icon">!</div>
          <div className="import-error-banner-content">
            <strong>{unresolved} validation error{unresolved !== 1 ? 's' : ''} found</strong>
            <p>
              {resolved > 0 && <>{resolved} of {total} resolved. </>}
              Fix the remaining issues before importing.
            </p>
          </div>
          <button className="btn btn-sm import-help-btn" onClick={launchRecovery}>
            Help me fix these →
          </button>
        </div>
      )}

      {state.status === 'valid' && (
        <div className="import-success-banner" data-tour="success-banner">
          <div className="import-success-banner-icon">✓</div>
          <div className="import-success-banner-content">
            <strong>All validations passed</strong>
            <p>Ready to import {state.rowCount} rows.</p>
          </div>
        </div>
      )}

      {state.status === 'imported' && (
        <div className="import-success-banner" data-tour="success-banner">
          <div className="import-success-banner-icon">✓</div>
          <div className="import-success-banner-content">
            <strong>Import complete</strong>
            <p>{state.rowCount} rows imported successfully.</p>
          </div>
        </div>
      )}

      <div className="import-grid">
        <div className="import-main">
          <section className="card import-section" data-tour="error-list">
            <header className="import-section-header">
              <h3>Validation results</h3>
              <span className="import-section-hint">
                {unresolved === 0 ? 'All clear' : `${unresolved} issue${unresolved !== 1 ? 's' : ''} remaining`}
              </span>
            </header>
            <div className="import-error-table">
              <div className="import-error-table-header">
                <span>Row</span>
                <span>Column</span>
                <span>Type</span>
                <span>Message</span>
                <span>Status</span>
              </div>
              {state.errors.map((err, idx) => (
                <div
                  key={err.id}
                  className={`import-error-row ${err.resolved ? 'import-error-row-resolved' : ''}`}
                  data-tour={`error-row-${idx + 1}`}
                >
                  <span className="import-error-row-num">
                    {err.row ?? '—'}
                  </span>
                  <span className="import-error-col">
                    <code>{err.column}</code>
                  </span>
                  <span className="import-error-type">
                    <span className={`import-error-badge import-error-badge-${err.type}`}>
                      {ERROR_TYPE_LABELS[err.type]}
                    </span>
                  </span>
                  <span className="import-error-msg">{err.message}</span>
                  <span className={`import-error-status ${err.resolved ? 'import-error-status-ok' : 'import-error-status-err'}`}>
                    {err.resolved ? '✓ Resolved' : '⚠ Open'}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="card import-section" data-tour="preview-section">
            <header className="import-section-header">
              <h3>Data preview</h3>
              <span className="import-section-hint">First 5 rows</span>
            </header>
            <div className="import-preview-table">
              <div className="import-preview-header">
                <span>#</span>
                {state.mappings.map((m) => (
                  <span key={m.source}>{m.source}</span>
                ))}
              </div>
              {state.previewRows.map((row) => (
                <div
                  key={row.rowNum}
                  className={`import-preview-row ${row.hasError ? 'import-preview-row-error' : ''}`}
                  data-tour={`preview-row-${row.rowNum}`}
                >
                  <span className="import-preview-rownum">{row.rowNum}</span>
                  {state.mappings.map((m) => {
                    const val = row.data[m.source] ?? '';
                    const isErrorCell =
                      row.hasError &&
                      state.errors.some(
                        (e) => !e.resolved && e.row === row.rowNum && e.column === m.source,
                      );
                    return (
                      <span
                        key={m.source}
                        className={isErrorCell ? 'import-preview-cell-error' : ''}
                      >
                        {val}
                      </span>
                    );
                  })}
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="import-sidebar">
          <section className="card import-section" data-tour="mapper-section">
            <header className="import-section-header">
              <h3>Column mapper</h3>
            </header>
            <div className="import-mapper-list">
              {state.mappings.map((m) => (
                <MappingRow
                  key={m.source}
                  mapping={m}
                  onTargetChange={(target) => handleMappingChange(m.source, target)}
                />
              ))}
            </div>
          </section>

          <section className="card import-section" data-tour="dedup-section">
            <header className="import-section-header">
              <h3>Duplicate handling</h3>
            </header>
            <div className="import-dedup-options">
              {(['skip', 'overwrite'] as const).map((opt) => (
                <button
                  key={opt}
                  className={`import-dedup-btn ${state.dedupStrategy === opt ? 'import-dedup-btn-active' : ''}`}
                  data-tour={`dedup-${opt}`}
                  onClick={() => handleDedupChange(opt)}
                >
                  <span className="import-dedup-label">
                    {opt === 'skip' ? 'Skip duplicates' : 'Overwrite existing'}
                  </span>
                  <span className="import-dedup-hint">
                    {opt === 'skip'
                      ? 'Drop rows with duplicate keys'
                      : 'Replace existing records on conflict'}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <div className="import-action-bar" data-tour="action-bar">
            <button
              className="btn import-revalidate-btn"
              data-tour="revalidate-btn"
              onClick={handleRevalidate}
            >
              Re-validate
            </button>
            <button
              className="btn btn-primary import-import-btn"
              data-tour="import-btn"
              disabled={state.status === 'errors'}
              onClick={handleImport}
            >
              {state.status === 'imported'
                ? 'Imported ✓'
                : `Import ${state.rowCount} rows`}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function ImportHeader({ state }: { state: ImportStateShape }) {
  const statusLabel =
    state.status === 'imported' ? 'Imported' : state.status === 'valid' ? 'Valid' : 'Errors';
  return (
    <div className="import-file-header" data-tour="import-header">
      <div className="import-file-icon">CSV</div>
      <div className="import-file-info">
        <div className="import-file-name">{state.fileName}</div>
        <div className="import-file-meta">
          {state.rowCount} rows · 6 columns · <code>UTF-8</code>
        </div>
      </div>
      <span className={`import-status-badge import-status-${state.status}`}>
        {statusLabel}
      </span>
    </div>
  );
}

function MappingRow({
  mapping,
  onTargetChange,
}: {
  mapping: ColumnMapping;
  onTargetChange: (target: string) => void;
}) {
  const options = TARGET_OPTIONS[mapping.source] ?? [];
  const isMissing = mapping.required && !mapping.target;

  return (
    <div
      className={`import-mapping-row ${isMissing ? 'import-mapping-row-error' : ''}`}
      data-tour={`mapping-${mapping.source}`}
    >
      <div className="import-mapping-source">
        <code>{mapping.source}</code>
        {mapping.required && <span className="import-mapping-req">req</span>}
      </div>
      <span className="import-mapping-arrow">→</span>
      <select
        className="import-mapping-select"
        value={mapping.target ?? ''}
        onChange={(e) => onTargetChange(e.target.value)}
      >
        <option value="">— not mapped —</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <span className="import-mapping-type">{mapping.type}</span>
    </div>
  );
}
