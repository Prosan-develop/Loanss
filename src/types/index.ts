export type Currency = 'USD' | 'KHR';

export type LoanType = 'pawn' | 'microloan'; // pawn: បញ្ចាំទ្រព្យ, microloan: កម្ចីបង់រំលស់/ផ្ទាល់ខ្លួន

export type CollateralCategory = 
  | 'gold' 
  | 'vehicle' 
  | 'land_title' 
  | 'electronics' 
  | 'jewelry' 
  | 'other';

export type CollateralStatus = 'in_vault' | 'returned' | 'foreclosed';

export interface Collateral {
  id: string;
  category: CollateralCategory;
  name: string;
  estimatedValue: number;
  currency: Currency;
  description: string;
  serialOrPlateNumber?: string;
  storageLocation: string; // e.g., "ទូដែក A-01"
  status: CollateralStatus;
  weightChi?: number; // សម្រាប់មាស (ចំនួនជី)
  releasedDate?: string;
  foreclosedDate?: string;
}

export type PaymentFrequency = 'monthly' | 'weekly' | 'daily' | 'one_time';

export type InterestType = 
  | 'interest_only' // បង់តែការប្រាក់រាល់ខែ សងដើមចុងគ្រា
  | 'equal_installment' // បង់រំលស់ដើម + ការប្រាក់ស្មើគ្នារាល់ខែ
  | 'fixed_end'; // សងទាំងដើមនិងការប្រាក់ពេលចប់កិច្ចសន្យា

export type ContractStatus = 
  | 'active' // កំពុងដំណើរការ
  | 'overdue' // ហួសកាលកំណត់
  | 'completed' // បង់ផ្តាច់រួចរាល់
  | 'foreclosed' // បានរឹបអូសទ្រព្យ
  | 'extended'; // បានពន្យារពេល

export interface RepaymentScheduleItem {
  periodNumber: number;
  dueDate: string;
  expectedPrincipal: number;
  expectedInterest: number;
  totalDue: number;
  paidAmount: number;
  paidDate?: string;
  status: 'pending' | 'paid' | 'partial' | 'late';
  penaltyFee: number;
}

export interface LoanContract {
  id: string;
  contractNumber: string; // e.g. "LN-2026-001"
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerNationalId: string;
  loanType: LoanType;
  collateral?: Collateral;
  principalAmount: number;
  currency: Currency;
  interestRateMonthly: number; // % ក្នុង១ខែ (e.g. 2.5)
  termMonths: number;
  startDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  paymentFrequency: PaymentFrequency;
  interestType: InterestType;
  status: ContractStatus;
  totalInterestPaid: number;
  totalPrincipalPaid: number;
  remainingPrincipal: number;
  latePenaltyFee: number;
  schedule: RepaymentScheduleItem[];
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export type PaymentMethod = 'cash' | 'aba_khqr' | 'bank_transfer' | 'wing';

export type PaymentType = 'interest_only' | 'principal_only' | 'installment' | 'full_payoff';

export interface PaymentTransaction {
  id: string;
  receiptNumber: string; // e.g. "RCP-2026-0089"
  contractId: string;
  contractNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  paymentDate: string;
  paymentType: PaymentType;
  totalAmount: number;
  currency: Currency;
  principalPortion: number;
  interestPortion: number;
  penaltyPortion: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  receivedBy: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  code: string; // "CUST-001"
  nameKhmer: string;
  nameLatin: string;
  phone: string;
  nationalId: string;
  address: string;
  occupation?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relation: string;
  };
  status: 'reliable' | 'normal' | 'watchlist' | 'blocked';
  joinedDate: string;
  notes?: string;
}

export type CashflowType = 'income' | 'expense' | 'disbursement' | 'payoff';

export interface CashflowEntry {
  id: string;
  date: string;
  type: CashflowType;
  category: string;
  description: string;
  amount: number;
  currency: Currency;
  referenceId?: string;
  createdBy: string;
}

export interface ShopSettings {
  shopNameKhmer: string;
  shopNameLatin: string;
  businessLicense: string;
  taxNumber: string;
  phone: string;
  email: string;
  addressKhmer: string;
  addressLatin: string;
  exchangeRateUsdToKhr: number; // e.g. 4100
  defaultInterestRate: number; // e.g. 2.5%
  defaultLatePenaltyDailyRate: number; // e.g. 0.1%
  gracePeriodDays: number; // e.g. 3 days before penalty
  termsAndConditionsKhmer: string;
}
