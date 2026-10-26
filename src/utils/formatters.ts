import { Currency, ContractStatus, CollateralCategory, PaymentMethod, PaymentType } from '../types';

export function formatMoney(amount: number, currency: Currency): string {
  if (currency === 'KHR') {
    return new Intl.NumberFormat('km-KH', {
      maximumFractionDigits: 0,
    }).format(Math.round(amount)) + ' ៛';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumberOnly(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
  }).format(amount);
}

export function convertCurrency(
  amount: number,
  from: Currency,
  to: Currency,
  rate: number
): number {
  if (from === to) return amount;
  if (from === 'USD' && to === 'KHR') {
    return amount * rate;
  }
  return amount / rate;
}

export function getStatusBadge(status: ContractStatus): { label: string; bg: string; text: string } {
  switch (status) {
    case 'active':
      return { label: 'កំពុងដំណើរការ', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'text-emerald-700' };
    case 'overdue':
      return { label: 'ហួសកំណត់', bg: 'bg-rose-50 text-rose-700 border-rose-200', text: 'text-rose-700' };
    case 'completed':
      return { label: 'បង់ផ្តាច់រួចរាល់', bg: 'bg-slate-100 text-slate-700 border-slate-200', text: 'text-slate-600' };
    case 'foreclosed':
      return { label: 'បានរឹបអូស', bg: 'bg-amber-50 text-amber-700 border-amber-200', text: 'text-amber-700' };
    case 'extended':
      return { label: 'បានពន្យារពេល', bg: 'bg-sky-50 text-sky-700 border-sky-200', text: 'text-sky-700' };
    default:
      return { label: status, bg: 'bg-slate-100 text-slate-700 border-slate-200', text: 'text-slate-600' };
  }
}

export function getCollateralCategoryName(cat: CollateralCategory): string {
  switch (cat) {
    case 'gold': return 'មាស / ផ្លាកទីន';
    case 'vehicle': return 'យានយន្ត / ម៉ូតូ / ឡាន';
    case 'land_title': return 'ប្លង់ដី / ផ្ទះ';
    case 'electronics': return 'គ្រឿងអេឡិចត្រូនិក';
    case 'jewelry': return 'គ្រឿងអលង្ការ / ពេជ្រ';
    case 'other': return 'ទ្រព្យផ្សេងៗ';
  }
}

export function getPaymentMethodName(method: PaymentMethod): string {
  switch (method) {
    case 'cash': return 'សាច់ប្រាក់សុទ្ធ';
    case 'aba_khqr': return 'KHQR / ABA Bank';
    case 'bank_transfer': return 'ផ្ទេរប្រាក់តាមធនាគារ';
    case 'wing': return 'Wing / វីង';
  }
}

export function getPaymentTypeName(type: PaymentType): string {
  switch (type) {
    case 'interest_only': return 'បង់តែការប្រាក់';
    case 'principal_only': return 'បង់កាត់ប្រាក់ដើម';
    case 'installment': return 'បង់រំលស់ (ដើម+ការ)';
    case 'full_payoff': return 'បង់ផ្តាច់បញ្ចប់កិច្ចសន្យា';
  }
}
