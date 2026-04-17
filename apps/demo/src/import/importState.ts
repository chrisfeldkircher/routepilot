export type ErrorType = 'missing-mapping' | 'type-mismatch' | 'duplicate-key';
export type ImportStatus = 'errors' | 'valid' | 'imported';
export type PackageSize = 'S' | 'M' | 'L';

export interface ValidationError {
  id: number;
  row: number | null;
  column: string;
  type: ErrorType;
  message: string;
  value?: string;
  resolved: boolean;
}

export interface ColumnMapping {
  source: string;
  target: string | null;
  type: 'string' | 'number' | 'email' | 'date';
  required: boolean;
}

export interface PreviewRow {
  rowNum: number;
  data: Record<string, string>;
  hasError?: boolean;
}

export interface ImportStateShape {
  fileName: string;
  rowCount: number;
  status: ImportStatus;
  errors: ValidationError[];
  mappings: ColumnMapping[];
  dedupStrategy: 'skip' | 'overwrite' | null;
  previewRows: PreviewRow[];
}

function defaultState(): ImportStateShape {
  return {
    fileName: 'employees_q1_2026.csv',
    rowCount: 847,
    status: 'errors',
    errors: [
      {
        id: 1,
        row: null,
        column: 'email',
        type: 'missing-mapping',
        message: 'Required column "email" is not mapped to any target field',
        resolved: false,
      },
      {
        id: 2,
        row: 14,
        column: 'age',
        type: 'type-mismatch',
        message: 'Expected number, got "twenty-three"',
        value: 'twenty-three',
        resolved: false,
      },
      {
        id: 3,
        row: 42,
        column: 'employee_id',
        type: 'duplicate-key',
        message: 'Duplicate key "E-1047" — also in row 7',
        value: 'E-1047',
        resolved: false,
      },
    ],
    mappings: [
      { source: 'name', target: 'full_name', type: 'string', required: true },
      { source: 'email', target: null, type: 'email', required: true },
      { source: 'age', target: 'age', type: 'number', required: false },
      { source: 'department', target: 'dept_code', type: 'string', required: false },
      { source: 'employee_id', target: 'employee_id', type: 'string', required: true },
      { source: 'start_date', target: 'hire_date', type: 'date', required: false },
    ],
    dedupStrategy: null,
    previewRows: [
      { rowNum: 1, data: { name: 'Alice Chen', email: 'a.chen@corp.io', age: '29', department: 'Engineering', employee_id: 'E-1001', start_date: '2024-03-15' } },
      { rowNum: 7, data: { name: 'Bob Martinez', email: 'b.martinez@corp.io', age: '34', department: 'Design', employee_id: 'E-1047', start_date: '2023-11-02' } },
      { rowNum: 14, data: { name: 'Carol Osei', email: 'c.osei@corp.io', age: 'twenty-three', department: 'Marketing', employee_id: 'E-1088', start_date: '2025-01-10' }, hasError: true },
      { rowNum: 42, data: { name: 'David Kim', email: 'd.kim@corp.io', age: '41', department: 'Sales', employee_id: 'E-1047', start_date: '2024-08-22' }, hasError: true },
      { rowNum: 43, data: { name: 'Eva Johansson', email: 'e.johansson@corp.io', age: '27', department: 'Engineering', employee_id: 'E-1102', start_date: '2025-06-01' } },
    ],
  };
}

class ImportStateManager {
  private state: ImportStateShape | null = null;

  init(): ImportStateShape {
    if (!this.state) this.state = defaultState();
    return this.state;
  }

  get(): ImportStateShape {
    return this.init();
  }

  reset(): void {
    this.state = null;
  }

  resolveError(id: number): void {
    const err = this.init().errors.find((e) => e.id === id);
    if (err) err.resolved = true;
  }

  unresolveError(id: number): void {
    const err = this.init().errors.find((e) => e.id === id);
    if (err) err.resolved = false;
  }

  setMapping(source: string, target: string | null): void {
    const m = this.init().mappings.find((m) => m.source === source);
    if (m) m.target = target;
  }

  fixPreviewValue(rowNum: number, column: string, value: string): void {
    const row = this.init().previewRows.find((r) => r.rowNum === rowNum);
    if (row) {
      row.data[column] = value;
      row.hasError = false;
    }
  }

  unfixPreviewValue(rowNum: number, column: string, value: string): void {
    const row = this.init().previewRows.find((r) => r.rowNum === rowNum);
    if (row) {
      row.data[column] = value;
      row.hasError = true;
    }
  }

  setDedupStrategy(strategy: 'skip' | 'overwrite' | null): void {
    this.init().dedupStrategy = strategy;
  }

  setStatus(status: ImportStatus): void {
    this.init().status = status;
  }

  revalidate(): void {
    const s = this.init();
    const unresolved = s.errors.filter((e) => !e.resolved).length;
    s.status = unresolved === 0 ? 'valid' : 'errors';
  }
}

export const importState = new ImportStateManager();

export function computeErrorSummary(state: ImportStateShape) {
  const total = state.errors.length;
  const resolved = state.errors.filter((e) => e.resolved).length;
  return { total, resolved, unresolved: total - resolved };
}
