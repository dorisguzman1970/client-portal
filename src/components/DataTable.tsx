import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (row: T) => string | number | React.ReactNode;
}

interface DataTableProps<T extends { id: string }> {
  title: string;
  columns: Column<T>[];
  rows: T[];
  isAdmin: boolean;
  onAdd?: () => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  loading?: boolean;
  error?: string | null;
}

export default function DataTable<T extends { id: string }>({
  title,
  columns,
  rows,
  isAdmin,
  onAdd,
  onEdit,
  onDelete,
  loading,
  error,
}: DataTableProps<T>) {
  function exportPdf() {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(title, 14, 16);
    doc.setFontSize(9);
    doc.text(`Exported: ${new Date().toLocaleString()}`, 14, 22);

    const head = [columns.map((c) => c.label)];
    const body = rows.map((row) =>
      columns.map((col) => {
        if (col.render) {
          const val = col.render(row);
          return typeof val === 'object' ? '' : String(val ?? '');
        }
        return String((row as Record<string, unknown>)[col.key as string] ?? '');
      })
    );

    autoTable(doc, { head, body, startY: 28, styles: { fontSize: 9 } });
    doc.save(`${title.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
  }

  return (
    <div>
      <div className="table-toolbar">
        <h2>{title}</h2>
        <div className="table-actions">
          {isAdmin && onAdd && (
            <button className="btn btn-primary" onClick={onAdd}>+ Add</button>
          )}
          <button className="btn btn-secondary" onClick={exportPdf}>Export PDF</button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <div className="loading-text">Loading...</div>}

      {!loading && (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                {columns.map((c) => <th key={c.key as string}>{c.label}</th>)}
                {isAdmin && (onEdit || onDelete) && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={columns.length + (isAdmin ? 1 : 0)} className="empty-row">No records found.</td></tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id}>
                    {columns.map((col) => (
                      <td key={col.key as string}>
                        {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key as string] ?? '')}
                      </td>
                    ))}
                    {isAdmin && (onEdit || onDelete) && (
                      <td className="action-cell">
                        {onEdit && (
                          <button className="btn btn-sm btn-edit" onClick={() => onEdit(row)}>Edit</button>
                        )}
                        {onDelete && (
                          <button className="btn btn-sm btn-delete" onClick={() => onDelete(row)}>Delete</button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
