import React, { useState } from 'react';
import { LoanContract, ShopSettings, PaymentTransaction } from '../types';
import { formatMoney, getStatusBadge, getCollateralCategoryName } from '../utils/formatters';
import { checkOverdueDays } from '../utils/loanCalculator';
import {
  X,
  CreditCard,
  Printer,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  Clock,
  ArrowRight,
  Archive,
  AlertOctagon,
} from 'lucide-react';

interface ContractDetailModalProps {
  contract: LoanContract;
  settings: ShopSettings;
  transactions: PaymentTransaction[];
  onClose: () => void;
  onOpenPaymentModal: (contract: LoanContract) => void;
  onOpenPrintAgreement: (contract: LoanContract) => void;
  onOpenPrintReceipt: (tx: PaymentTransaction) => void;
  onReleaseCollateral: (contractId: string) => void;
  onForecloseCollateral: (contractId: string, notes?: string) => void;
  onExtendContract: (contractId: string, months: number) => void;
}

export const ContractDetailModal: React.FC<ContractDetailModalProps> = ({
  contract,
  settings,
  transactions,
  onClose,
  onOpenPaymentModal,
  onOpenPrintAgreement,
  onOpenPrintReceipt,
  onReleaseCollateral,
  onForecloseCollateral,
  onExtendContract,
}) => {
  const [extensionMonths, setExtensionMonths] = useState(1);
  const [showExtensionInput, setShowExtensionInput] = useState(false);
  const [forecloseNote, setForecloseNote] = useState('');
  const [showForecloseConfirm, setShowForecloseConfirm] = useState(false);

  const statusBadge = getStatusBadge(contract.status);
  const overdueDays = checkOverdueDays(contract.dueDate);
  const relatedTransactions = transactions.filter((t) => t.contractId === contract.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-8 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <span className="font-bold text-lg font-mono text-slate-800">{contract.contractNumber}</span>
            <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full border ${statusBadge.bg}`}>
              {statusBadge.label}
            </span>
            <span className="text-xs text-slate-500">
              {contract.loanType === 'pawn' ? 'បញ្ចាំទ្រព្យ' : 'កម្ចីបង់រំលស់'} · ចុះថ្ងៃទី {contract.startDate}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenPrintAgreement(contract)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 text-xs font-medium cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>បោះពុម្ពកិច្ចសន្យា</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Scrollable */}
        <div className="p-6 text-xs max-h-[75vh] overflow-y-auto space-y-6">
          {/* Overdue Alert banner if late */}
          {overdueDays > 0 && contract.status !== 'completed' && contract.status !== 'foreclosed' && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-rose-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                <div>
                  <span className="font-bold">ហួសកាលកំណត់ចំនួន {overdueDays} ថ្ងៃ!</span>
                  <p className="text-[11px] text-rose-700 mt-0.5">
                    ថ្ងៃកំណត់បង់: {contract.dueDate} · ប្រាក់ផាកពិន័យបច្ចុប្បន្ន: {formatMoney(contract.latePenaltyFee, contract.currency)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onOpenPaymentModal(contract)}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium cursor-pointer"
              >
                ប្រមូលប្រាក់បន្ទាន់
              </button>
            </div>
          )}

          {/* Key Metric 4-Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-slate-500 block">ប្រាក់ដើមដំបូង</span>
              <span className="text-base font-bold text-slate-900 font-mono">
                {formatMoney(contract.principalAmount, contract.currency)}
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                ការប្រាក់: {contract.interestRateMonthly}% / ខែ
              </span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-slate-500 block">ប្រាក់ដើមនៅសល់</span>
              <span className="text-base font-bold text-emerald-700 font-mono">
                {formatMoney(contract.remainingPrincipal, contract.currency)}
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                បានសងដើម: {formatMoney(contract.totalPrincipalPaid, contract.currency)}
              </span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-slate-500 block">ការប្រាក់បានប្រមូល</span>
              <span className="text-base font-bold text-slate-800 font-mono">
                {formatMoney(contract.totalInterestPaid, contract.currency)}
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                ផាកពិន័យ: {formatMoney(contract.latePenaltyFee, contract.currency)}
              </span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-slate-500 block">ថ្ងៃផុតកំណត់កិច្ចសន្យា</span>
              <span className="text-base font-bold text-slate-900 font-mono">{contract.dueDate}</span>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                រយៈពេលសរុប: {contract.termMonths} ខែ
              </span>
            </div>
          </div>

          {/* Borrower & Collateral Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Borrower Info */}
            <div className="p-4 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-semibold text-slate-800">ព័ត៌មានអតិថិជន (Borrower)</span>
                <span className="text-emerald-700 font-medium">#{contract.customerId}</span>
              </div>
              <div className="space-y-1 text-slate-600">
                <p>
                  ឈ្មោះ: <strong className="text-slate-900">{contract.customerName}</strong>
                </p>
                <p>
                  ទូរស័ព្ទ: <strong className="text-slate-800 font-mono">{contract.customerPhone}</strong>
                </p>
                <p>
                  អត្តសញ្ញាណប័ណ្ណ: <span className="font-mono">{contract.customerNationalId || 'N/A'}</span>
                </p>
              </div>
            </div>

            {/* Collateral Info */}
            {contract.collateral ? (
              <div className="p-4 border border-slate-200 rounded-xl space-y-2 bg-emerald-50/20">
                <div className="flex items-center justify-between pb-2 border-b border-emerald-100">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>ទ្រព្យបញ្ចាំ (Collateral)</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                    contract.collateral.status === 'in_vault'
                      ? 'bg-amber-100 text-amber-800'
                      : contract.collateral.status === 'returned'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    {contract.collateral.status === 'in_vault'
                      ? 'នៅក្នុងឃ្លាំង'
                      : contract.collateral.status === 'returned'
                      ? 'បានប្រគល់ជូនវិញ'
                      : 'បានរឹបអូស'}
                  </span>
                </div>
                <div className="space-y-1 text-slate-600">
                  <p>
                    ឈ្មោះទ្រព្យ: <strong className="text-slate-900">{contract.collateral.name}</strong>
                  </p>
                  <p>
                    ប្រភេទ: <span>{getCollateralCategoryName(contract.collateral.category)}</span>
                    {contract.collateral.weightChi ? ` (${contract.collateral.weightChi} ជី)` : ''}
                  </p>
                  {contract.collateral.serialOrPlateNumber && (
                    <p>
                      ស្លាកលេខ/IMEI: <span className="font-mono text-slate-800">{contract.collateral.serialOrPlateNumber}</span>
                    </p>
                  )}
                  <p>
                    ទីតាំងស្តុក: <strong className="text-emerald-800">{contract.collateral.storageLocation}</strong>
                  </p>
                  <p className="text-slate-500 text-[11px] italic">{contract.collateral.description}</p>
                </div>
              </div>
            ) : (
              <div className="p-4 border border-slate-200 rounded-xl flex items-center justify-center text-slate-400">
                កម្ចីបង់រំលស់ធម្មតា (គ្មានទ្រព្យបញ្ចាំ)
              </div>
            )}
          </div>

          {/* Repayment Schedule Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-100 px-4 py-2.5 font-semibold text-slate-800 flex justify-between items-center">
              <span>តារាងកាលវិភាគបង់ប្រាក់ (Repayment Schedule)</span>
              <span className="text-[11px] text-slate-500 font-normal">
                {contract.interestType === 'interest_only'
                  ? 'បង់ការប្រាក់រាល់ខែ សងដើមចុងគ្រា'
                  : 'បង់រំលស់ដើម + ការប្រាក់'}
              </span>
            </div>
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="py-2.5 px-3 text-center">លើកទី</th>
                  <th className="py-2.5 px-3">ថ្ងៃត្រូវបង់</th>
                  <th className="py-2.5 px-3 text-right">ប្រាក់ដើម</th>
                  <th className="py-2.5 px-3 text-right">ការប្រាក់</th>
                  <th className="py-2.5 px-3 text-right">សរុបត្រូវបង់</th>
                  <th className="py-2.5 px-3 text-center">ស្ថានភាព</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {contract.schedule.map((item) => (
                  <tr key={item.periodNumber} className="hover:bg-slate-50/50">
                    <td className="py-2 px-3 text-center text-slate-600">{item.periodNumber}</td>
                    <td className="py-2 px-3 text-slate-800 font-sans">{item.dueDate}</td>
                    <td className="py-2 px-3 text-right text-slate-600">
                      {formatMoney(item.expectedPrincipal, contract.currency)}
                    </td>
                    <td className="py-2 px-3 text-right text-emerald-700 font-medium">
                      {formatMoney(item.expectedInterest, contract.currency)}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-slate-900">
                      {formatMoney(item.totalDue, contract.currency)}
                    </td>
                    <td className="py-2 px-3 text-center font-sans">
                      {item.status === 'paid' ? (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-medium">
                          បង់រួច ({item.paidDate})
                        </span>
                      ) : item.status === 'late' ? (
                        <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-md text-[10px] font-medium">
                          ហួសកំណត់
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px]">
                          រង់ចាំ
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Payment Transactions History */}
          {relatedTransactions.length > 0 && (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-100 px-4 py-2.5 font-semibold text-slate-800">
                ប្រវត្តិទទួលប្រាក់ ({relatedTransactions.length} លើក)
              </div>
              <div className="divide-y divide-slate-100">
                {relatedTransactions.map((tx) => (
                  <div key={tx.id} className="p-3 flex items-center justify-between hover:bg-slate-50/60">
                    <div>
                      <span className="font-mono font-bold text-slate-800 mr-2">{tx.receiptNumber}</span>
                      <span className="text-slate-500 font-sans">{tx.paymentDate}</span>
                      <p className="text-[11px] text-slate-600 mt-0.5">{tx.notes || 'បង់ប្រាក់'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="font-bold text-emerald-700 font-mono text-sm block">
                          {formatMoney(tx.totalAmount, tx.currency)}
                        </span>
                        <span className="text-[10px] text-slate-500">អ្នកទទួល: {tx.receivedBy}</span>
                      </div>
                      <button
                        onClick={() => onOpenPrintReceipt(tx)}
                        className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-600 cursor-pointer"
                        title="បោះពុម្ពបង្កាន់ដៃ"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Operations & Foreclosure / Extension Panel */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <span className="font-semibold text-slate-800 block text-xs">ប្រតិបត្តិការកិច្ចសន្យា</span>
            <div className="flex flex-wrap gap-2">
              {/* Release Collateral Button */}
              {contract.collateral && contract.collateral.status === 'in_vault' && (
                <button
                  type="button"
                  onClick={() => onReleaseCollateral(contract.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium cursor-pointer"
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>ដោះលែងទ្រព្យបញ្ចាំជូនអតិថិជន</span>
                </button>
              )}

              {/* Extension Toggle */}
              <button
                type="button"
                onClick={() => setShowExtensionInput(!showExtensionInput)}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 hover:bg-slate-200/60 text-slate-700 rounded-lg text-xs font-medium cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>ពន្យារពេលកិច្ចសន្យា</span>
              </button>

              {/* Foreclose Button */}
              {contract.status !== 'completed' && contract.status !== 'foreclosed' && (
                <button
                  type="button"
                  onClick={() => setShowForecloseConfirm(!showForecloseConfirm)}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-rose-300 hover:bg-rose-50 text-rose-700 rounded-lg text-xs font-medium cursor-pointer"
                >
                  <AlertOctagon className="w-3.5 h-3.5" />
                  <span>រឹបអូសទ្រព្យ (Foreclose)</span>
                </button>
              )}
            </div>

            {/* Extension Input Drawer */}
            {showExtensionInput && (
              <div className="p-3 bg-white border border-slate-200 rounded-lg flex items-center gap-3 mt-2">
                <span className="text-slate-600">បន្ថែមរយៈពេល:</span>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={extensionMonths}
                  onChange={(e) => setExtensionMonths(parseInt(e.target.value) || 1)}
                  className="w-16 px-2 py-1 border border-slate-300 rounded font-mono"
                />
                <span className="text-slate-600">ខែ</span>
                <button
                  type="button"
                  onClick={() => {
                    onExtendContract(contract.id, extensionMonths);
                    setShowExtensionInput(false);
                  }}
                  className="px-3 py-1 bg-emerald-600 text-white rounded font-medium cursor-pointer"
                >
                  យល់ព្រមពន្យារ
                </button>
              </div>
            )}

            {/* Foreclose Confirmation Drawer */}
            {showForecloseConfirm && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg space-y-2 mt-2">
                <p className="font-bold text-rose-800">
                  តើអ្នកពិតជាចង់រឹបអូសទ្រព្យបញ្ចាំនេះមែនទេ? (សកម្មភាពនេះមិនអាចត្រឡប់ក្រោយវិញបានទេ)
                </p>
                <input
                  type="text"
                  value={forecloseNote}
                  onChange={(e) => setForecloseNote(e.target.value)}
                  placeholder="មូលហេតុរឹបអូស (ឧ. អតិថិជនខកខានបង់លើសពី ៣០ ថ្ងៃ)"
                  className="w-full px-2.5 py-1.5 border border-rose-300 rounded bg-white text-xs"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onForecloseCollateral(contract.id, forecloseNote);
                      setShowForecloseConfirm(false);
                    }}
                    className="px-3 py-1 bg-rose-600 text-white rounded font-medium cursor-pointer"
                  >
                    បញ្ជាក់ការរឹបអូស
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForecloseConfirm(false)}
                    className="px-3 py-1 bg-slate-200 text-slate-700 rounded font-medium cursor-pointer"
                  >
                    បោះបង់
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 font-medium cursor-pointer"
          >
            បិទ
          </button>
          {contract.status !== 'completed' && contract.status !== 'foreclosed' && (
            <button
              onClick={() => onOpenPaymentModal(contract)}
              className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium shadow-xs cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              <span>ទទួលប្រាក់ (Receive Payment)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
