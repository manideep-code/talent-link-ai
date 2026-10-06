const DEFAULT_FILENAME = 'export.csv';

const sanitizeFilename = (name) => {
  if (!name || typeof name !== 'string') return DEFAULT_FILENAME;
  const trimmed = name.trim();
  if (!trimmed) return DEFAULT_FILENAME;
  return trimmed.toLowerCase().endsWith('.csv') ? trimmed : `${trimmed}.csv`;
};

const escapeCell = (value) => {
  if (value == null) return '';
  const text = value instanceof Date ? value.toISOString() : String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

const buildHeader = (columns, sampleRow) => {
  if (Array.isArray(columns) && columns.length > 0) {
    return columns.map((col) => col.label || col.header || col.key || '').map(escapeCell);
  }
  return Object.keys(sampleRow || {}).map(escapeCell);
};

const buildRow = (row, columns) => {
  if (Array.isArray(columns) && columns.length > 0) {
    return columns.map((col) => {
      const key = col.key;
      if (!key) return '';
      const raw = typeof col.transform === 'function' ? col.transform(row[key], row) : row[key];
      return escapeCell(raw);
    });
  }
  return Object.values(row).map(escapeCell);
};

export const exportToCSV = ({ data, filename, columns }) => {
  if (!Array.isArray(data) || data.length === 0) {
    console.warn('exportToCSV: no data provided');
    return;
  }

  const effectiveName = sanitizeFilename(filename || DEFAULT_FILENAME);
  const header = buildHeader(columns, data[0]);
  const body = data.map((row) => buildRow(row, columns));
  const csvLines = [header, ...body].map((line) => line.join(','));
  const csvContent = csvLines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', effectiveName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export default exportToCSV;
