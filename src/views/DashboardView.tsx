import React from 'react';
import { usePawn } from '../context/PawnContext';
import { LoanContract, PaymentTransaction } from '../types';
import { formatMoney, getStatusBadge, getCollateralCategoryName } from '../utils/formatters';
import { checkOverdueDays } from '../utils/loanCalculator';
import {
  Wallet,
  Coins,
  AlertTriangle,
  ShieldCheck,
  Calendar,
  CreditCard,
  ArrowUpRight,
  Printer,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

interface DashboardViewProps {
  onOpenContractDetail: (contract: LoanContract) => void;
  onOpenPaymentModal: (contract: LoanContract) => void;
  onOpenPrintReceipt: (tx: PaymentTransaction) => void;
  onNavigateToContracts: (filter?: string) => void;
  onOpenNewContractModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenContractDetail,
  onOpenPaymentModal,
  onOpenPrintReceipt,
  onNavigateToContracts,
  onOpenNewContractModal,
}) => {
  const { contracts, transactions, settings } = usePawn();

  // Active contracts
  const activeContracts = contracts.filter((c) => c.status === 'active' || c.status === 'extended');
  const overdueContracts = contracts.filter((c) => {
    if (c.status === 'completed' || c.status === 'foreclosed') return false;
    return checkOverdueDays(c.dueDate) > 0 || c.status === 'overdue';
  });

  // Calculate totals in USD & KHR
  const totalPrincipalUSD = activeContracts
    .filter((c) => c.currency === 'USD')
    .reduce((sum, c) => sum + c.remainingPrincipal, 0);

  const totalPrincipalKHR = activeContracts
    .filter((c) => c.currency === 'KHR')
    .reduce((sum, c) => sum + c.remainingPrincipal, 0);

  const totalInterestCollectedUSD = transactions
    .filter((t) => t.currency === 'USD')
    .reduce((sum, t) => sum + t.interestPortion, 0);

  const totalInterestCollectedKHR = transactions
    .filter((t) => t.currency === 'KHR')
    .reduce((sum, t) => sum + t.interestPortion, 0);

  // Vault count
  const itemsInVault = contracts.filter(
    (c) => c.collateral && c.collateral.status === 'in_vault'
  );

  const vaultValueUSD = itemsInVault
    .filter((c) => c.collateral?.currency === 'USD')
    .reduce((sum, c) => sum + (c.collateral?.estimatedValue || 0), 0);

  // Upcoming collections due in next 7 days
  const today = new Date();
  const next7Days = new Date();
  next7Days.setDate(today.getDate() + 7);

  const upcomingDueItems: { contract: LoanContract; dueDate: string; amountDue: number }[] = [];

  contracts.forEach((c) => {
    if (c.status === 'completed' || c.status === 'foreclosed') return;
    c.schedule.forEach((item) => {
      if (item.status === 'pending') {
        const itemDue = new Date(item.dueDate);
        if (itemDue <= next7Days) {
          upcomingDueItems.push({
            contract: c,
            dueDate: item.dueDate,
            amountDue: item.totalDue,
          });
        }
      }
    });
  });

  // Sort upcoming due by date
  upcomingDueItems.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  return (
    <div className="space-y-6 pb-12">
      {/* 4 Primary Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Loan Principal */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-medium">ដើមទុនកម្ចីកំពុងបញ្ចេញ</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
              {formatMoney(totalPrincipalUSD, 'USD')}
            </div>
            {totalPrincipalKHR > 0 && (
              <div className="text-xs font-mono text-slate-500">
                + {formatMoney(totalPrincipalKHR, 'KHR')}
              </div>
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>សរុប {activeContracts.length} កិច្ចសន្យាសកម្ម</span>
            <button
              onClick={() => onNavigateToContracts('active')}
              className="text-emerald-700 hover:text-emerald-800 font-medium flex items-center gap-0.5 cursor-pointer"
            >
              <span>មើលទាំងអស់</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Card 2: Total Collected Interest */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-medium">ចំណូលការប្រាក់បានប្រមូល</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold font-mono text-emerald-700 tracking-tight">
              {formatMoney(totalInterestCollectedUSD, 'USD')}
            </div>
            {totalInterestCollectedKHR > 0 && (
              <div className="text-xs font-mono text-slate-500">
                + {formatMoney(totalInterestCollectedKHR, 'KHR')}
              </div>
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>ពី {transactions.length} ប្រតិបត្តិការទទួលប្រាក់</span>
            <span className="text-emerald-600 font-medium">ចំណូលជាក់ស្តែង</span>
          </div>
        </div>

        {/* Card 3: Overdue Loans */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-medium">កិច្ចសន្យាហួសកាលកំណត់</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold font-mono text-rose-600 tracking-tight">
              {overdueContracts.length} <span className="text-sm font-normal text-slate-500">កិច្ចសន្យា</span>
            </div>
            <div className="text-xs text-rose-700 font-medium">
              ទាមទារការតាមដានបន្ទាន់
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>មានហានិភ័យខកខាន</span>
            {overdueContracts.length > 0 && (
              <button
                onClick={() => onNavigateToContracts('overdue')}
                className="text-rose-600 hover:text-rose-700 font-medium flex items-center gap-0.5 cursor-pointer"
              >
                <span>ដោះស្រាយ</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Card 4: Vault Items */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-medium">ទ្រព្យបញ្ចាំក្នុងឃ្លាំង</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
              {itemsInVault.length} <span className="text-sm font-normal text-slate-500">មុខទ្រព្យ</span>
            </div>
            <div className="text-xs font-mono text-slate-500">
              តម្លៃប៉ាន់ស្មាន: ~{formatMoney(vaultValueUSD, 'USD')}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>រក្សាទុកក្នុងទូសុវត្ថិភាព</span>
            <span className="text-amber-700 font-medium">មានការធានា</span>
          </div>
        </div>
      </div>

      {/* Overdue Urgent Alert Box (If any exist) */}
      {overdueContracts.length > 0 && (
        <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              <h3 className="font-bold text-sm text-rose-900">
                កិច្ចសន្យាហួសកាលកំណត់បន្ទាន់ ({overdueContracts.length})
              </h3>
            </div>
            <span className="text-xs text-rose-700">សូមទាក់ទងទារប្រាក់ ឬរៀបចំរឹបអូសតាមនីតិវិធី</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {overdueContracts.map((c) => {
              const daysLate = checkOverdueDays(c.dueDate);
              return (
                <div
                  key={c.id}
                  className="bg-white p-3.5 rounded-lg border border-rose-200 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-800">{c.contractNumber}</span>
                      <span className="text-rose-600 font-semibold">យឺត {daysLate} ថ្ងៃ</span>
                    </div>
                    <p className="font-medium text-slate-900 mt-1">{c.customerName}</p>
                    <p className="text-slate-500 font-mono text-[11px]">ទូរស័ព្ទ: {c.customerPhone}</p>
                    {c.collateral && (
                      <p className="text-slate-600 text-[11px] mt-0.5 truncate max-w-xs">
                        ទ្រព្យ: {c.collateral.name}
                      </p>
                    )}
                  </div>

                  <div className="text-right space-y-2">
                    <div>
                      <span className="text-slate-500 text-[10px] block">ដើមនៅជំពាក់</span>
                      <span className="font-bold text-rose-700 font-mono text-sm">
                        {formatMoney(c.remainingPrincipal, c.currency)}
                      </span>
                    </div>
                    <div className="flex gap-1.5 justify-end">
                      <button
                        onClick={() => onOpenPaymentModal(c)}
                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-medium cursor-pointer"
                      >
                        ទទួលប្រាក់
                      </button>
                      <button
                        onClick={() => onOpenContractDetail(c)}
                        className="px-2 py-1 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded text-[11px] cursor-pointer"
                      >
                        លម្អិត
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2-Column Split: Upcoming Collections + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Upcoming Collections */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <h3 className="font-semibold text-sm text-slate-800">
                កាលវិភាគត្រូវប្រមូលប្រាក់ ៧ថ្ងៃខាងមុខ
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              {upcomingDueItems.length} លើកត្រូវបង់
            </span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {upcomingDueItems.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                មិនមានកាលវិភាគត្រូវប្រមូលប្រាក់ក្នុង ៧ថ្ងៃនេះទេ
              </div>
            ) : (
              upcomingDueItems.slice(0, 5).map((item, idx) => (
                <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-800">
                        {item.contract.contractNumber}
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="font-medium text-slate-700">{item.contract.customerName}</span>
                    </div>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      ថ្ងៃត្រូវបង់: <strong className="text-slate-800 font-mono">{item.dueDate}</strong> · {item.contract.customerPhone}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="font-bold text-slate-900 font-mono block">
                        {formatMoney(item.amountDue, item.contract.currency)}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {item.contract.interestType === 'interest_only' ? 'ការប្រាក់' : 'រំលស់'}
                      </span>
                    </div>
                    <button
                      onClick={() => onOpenPaymentModal(item.contract)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium cursor-pointer transition-colors shadow-xs"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>ទទួល</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Recent Payment Transactions */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-emerald-600" />
              <h3 className="font-semibold text-sm text-slate-800">
                ប្រតិបត្តិការទទួលប្រាក់ថ្មីៗ
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              {transactions.length} បង្កាន់ដៃ
            </span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {transactions.slice(0, 5).map((tx) => (
              <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-800">{tx.receiptNumber}</span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-600">{tx.customerName}</span>
                  </div>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    {tx.paymentDate} · {tx.contractNumber}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="font-bold text-emerald-700 font-mono block text-sm">
                      {formatMoney(tx.totalAmount, tx.currency)}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {tx.paymentMethod === 'aba_khqr' ? 'KHQR' : 'សាច់ប្រាក់'}
                    </span>
                  </div>
                  <button
                    onClick={() => onOpenPrintReceipt(tx)}
                    className="p-1.5 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg cursor-pointer transition-colors"
                    title="បោះពុម្ពបង្កាន់ដៃ"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
