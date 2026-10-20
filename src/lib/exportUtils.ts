/**
 * Utilities for Excel & PDF report generation and file downloads
 */

/**
 * Escapes untrusted text to prevent spreadsheet formula injection.
 * If a string begins with '=', '+', '-', or '@', prefixes with an apostrophe.
 */
export function sanitizeCellString(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value).trim();
  if (str.startsWith("=") || str.startsWith("+") || str.startsWith("-") || str.startsWith("@")) {
    return `'${str}`;
  }
  return str;
}

/**
 * Triggers a client-side file download for a given Blob.
 */
export function triggerFileDownload(blob: Blob, filename: string): void {
  if (typeof window === "undefined") return;

  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();

  // Cleanup
  setTimeout(() => {
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);
  }, 200);
}

/**
 * Returns formatted filename with report prefix and current date YYYY-MM-DD
 */
export function getReportFilename(reportType: "Orders" | "Master_Purchase" | "Supplier_Purchase", extension: "xlsx" | "pdf"): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `BillSync_${reportType}_${yyyy}-${mm}-${dd}.${extension}`;
}
