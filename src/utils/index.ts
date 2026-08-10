export * from './sanitizer';

export function formatDate(dateString: string): string {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatCurrency(amount: number, currency = 'UGX'): string {
  return `${currency} ${amount.toLocaleString()}`;
}
