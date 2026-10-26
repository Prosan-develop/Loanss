import React, { useState, useMemo } from 'react';
import { LoanContract, Customer, PaymentTransaction, ShopSettings } from '../types';
import { formatMoney, getStatusBadge, getPaymentMethodName, getPaymentTypeName } from '../utils/formatters';
import { 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  Shield, 
  Calendar, 
  ArrowUpRight, 
  Calculator, 
  Clock, 
  Printer, 
  CheckCircle2,
  Users
} from 'lucide-react';

interface DashboardViewProps {
  contracts: LoanContract[];
  customers: Customer[];
  transactions: PaymentTransaction[];
  shopSettings: ShopSettings;
  onOpenNewContract: () => void;
  onOpenRepayment: (contract: LoanContract) => void;
  onPrintReceipt: (transaction: PaymentTransaction) => void;
  onSelectCustomerTab: () => void;
  onSelectContractsTab: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  contracts,
  customers,
  transactions,
  shopSettings,
  onOpenNewContract,
  onOpenRepayment,
  onPrintReceipt,
  onSelectCustomerTab,
  onSelectContractsTab,
}) => {
  // Quick calculator widget state
  const [calcPrincipal, setCalcPrincipal] = useState<number>(1000);
  const [calcRate, setCalcRate] = useState<number>(shopSettings.defaultInterestRate);
  const [calcMonths, setCalcMonths] = useState<number>(3);
  const [calcCurrency, setCalcCurrency] = useState<'USD' | 'KHR'>('USD');

  const calcMonthlyInterest = (calcPrincipal * calcRate) / 100;
  const calcTotalInterest = calcMonthlyInterest * calcMonths;

  // Financial calculations
  const stats = useMemo(() => {
    let activeUSD = 0;
    let activeKHR = 0;
    let overdueUSD = 0;
    let overdueKHR = 0;
    let totalInterestCollectedUSD = 0;
    let totalInterestCollectedKHR = 0;
    let activeVaultItems = 0;
    let overdueCount = 0;

    contracts.forEach((c) => {
      if (c.status === 'active' || c.status === 'overdue') {
        if (c.currency === 'USD') activeUSD += c.remainingPrincipal;
        if (c.currency === 'KHR') activeKHR += c.remainingPrincipal;
        if (c.collateral && c.collateral.status === 'in_vault') activeVaultItems++;
      }
      if (c.status === 'overdue') {
        overdueCount++;
        if (c.currency === 'USD') overdueUSD += c.remainingPrincipal;
        if (c.currency === 'KHR') overdueKHR += c.remainingPrincipal;
      }
    });

    transactions.forEach((tx) => {
      if (tx.currency === 'USD') totalInterestCollectedUSD += tx.interestPortion;
      if (tx.currency === 'KHR') totalInterestCollectedKHR += tx.interestPortion;
    });

    return {
      activeUSD,
      activeKHR,
      overdueUSD,
      overdueKHR,
      overdueCount,
      totalInterestCollectedUSD,
      totalInterestCollectedKHR,
      activeVaultItems,
    };
  }, [contracts, transactions]);

  // Upcoming collections due in next 7 days or overdue
  const upcomingPayments = useMemo(() => {
    const list: Array<{ contract: LoanContract; scheduleItem: any; isLate: boolean }> = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 14);

    contracts.forEach((cnt) => {
      if (cnt.status === 'active' || cnt.status === 'overdue') {
        cnt.schedule.forEach((s) => {
          if (s.status === 'pending' || s.status === 'late') {
            const dueDate = new Date(s.dueDate);
            const isLate = dueDate.getTime() < today.getTime();
            if (isLate || dueDate <= sevenDaysLater) {
              list.push({
                contract: cnt,
                scheduleItem: s,
                isLate,
              });
            }
          }
        });
      }
    });

    return list.slice(0, 6);
  }, [contracts]);

  return (
    <div className="space-y-6">
      {/* Top Welcome & Quick Actions */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">{shopSettings.shopNameKhmer}</h2>
            <span className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 font-semibold rounded border border-emerald-200">
              ប្រព័ន្ធដំណើរការធម្មតា
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            អត្រាប្តូរប្រាក់ថ្ងៃនេះ: <strong className="text-slate-800 tabular-nums">1 USD = {shopSettings.exchangeRateUsdToKhr.toLocaleString()} ៛</strong> · 
            អតិថិជនសរុប: <strong className="text-slate-800 tabular-nums">{customers.length} នាក់</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onSelectCustomerTab}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
          >
            មើលបញ្ជីអតិថិជន
          </button>
          <button
            onClick={onOpenNewContract}
            className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs whitespace-nowrap"
          >
            <span>+ បង្កើតកិច្ចសន្យាថ្មី</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Loan Capital */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">ដើមទុនកម្ចីកំពុងបញ្ចេញ (Active)</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums">
            {formatMoney(stats.activeUSD, 'USD')}
          </div>
          {stats.activeKHR > 0 && (
            <div className="text-xs text-slate-600 font-medium mt-1 tabular-nums">
              + {formatMoney(stats.activeKHR, 'KHR')}
            </div>
          )}
          <div className="text-[11px] text-slate-400 mt-1.5 flex items-center justify-between">
            <span>កិច្ចសន្យាសកម្មសរុប</span>
            <span className="font-semibold text-slate-700 tabular-nums">
              {contracts.filter((c) => c.status === 'active').length} កិច្ចសន្យា
            </span>
          </div>
        </div>

        {/* Total Interest Revenue */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">ចំណូលការប្រាក់ប្រមូលបាន</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 tabular-nums">
            {formatMoney(stats.totalInterestCollectedUSD, 'USD')}
          </div>
          {stats.totalInterestCollectedKHR > 0 && (
            <div className="text-xs text-emerald-600 font-medium mt-1 tabular-nums">
              + {formatMoney(stats.totalInterestCollectedKHR, 'KHR')}
            </div>
          )}
          <div className="text-[11px] text-slate-400 mt-1.5">
            ពីប្រតិបត្តិការទូទាត់ការប្រាក់
          </div>
        </div>

        {/* Overdue Loans */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">កម្ចីហួសកាលកំណត់ (Overdue)</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-600 tabular-nums">
            {stats.overdueCount} កិច្ចសន្យា
          </div>
          <div className="text-xs text-rose-500 font-medium mt-1 tabular-nums">
            ទំហំទឹកប្រាក់: {formatMoney(stats.overdueUSD, 'USD')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1.5">
            ត្រូវការទូរស័ព្ទរំលឹកទារប្រាក់
          </div>
        </div>

        {/* Collateral in Vault */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">ទ្រព្យបញ្ចាំក្នុងឃ្លាំង (Vault)</span>
            <Shield className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums">
            {stats.activeVaultItems} មុខ
          </div>
          <div className="text-xs text-amber-700 font-medium mt-1">
            មាស, ម៉ូតូ, ប្លង់ដី, ពេជ្រ
          </div>
          <div className="text-[11px] text-slate-400 mt-1.5">
            រក្សាទុកក្នុងទូសុវត្ថិភាព
          </div>
        </div>
      </div>

      {/* 2-Column Section: Due Soon Collections & Fast Loan Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Due Collections (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">កាលវិភាគត្រូវប្រមូលប្រាក់ឆាប់ៗ និងហួសកំណត់</h3>
              <p className="text-xs text-slate-500 mt-0.5">អតិថិជនត្រូវបង់ការប្រាក់ ឬប្រាក់ដើម</p>
            </div>
            <button
              onClick={onSelectContractsTab}
              className="text-xs font-medium text-emerald-700 hover:underline"
            >
              មើលកិច្ចសន្យាទាំងអស់ →
            </button>
          </div>

          {upcomingPayments.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
              មិនមានកាលវិភាគបង់ប្រាក់ហួសកំណត់ ឬដល់ថ្ងៃកំណត់ឡើយ
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingPayments.map(({ contract, scheduleItem, isLate }, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border transition-colors flex items-center justify-between gap-3 ${
                    isLate
                      ? 'bg-rose-50/50 border-rose-200'
                      : 'bg-slate-50/60 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs">{contract.customerName}</span>
                      <span className="font-mono text-[11px] text-slate-500">{contract.contractNumber}</span>
                      {isLate ? (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                          ហួសកំណត់
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-600 bg-slate-200 px-1.5 py-0.5 rounded">
                          ជិតដល់ថ្ងៃ
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>កាលបរិច្ឆេទ: <strong className="font-mono text-slate-700">{scheduleItem.dueDate}</strong></span>
                      <span aria-hidden="true">·</span>
                      <span>ទូរស័ព្ទ: <strong className="font-mono">{contract.customerPhone}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-900 tabular-nums">
                        {formatMoney(scheduleItem.totalDue, contract.currency)}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        (ការ: {formatMoney(scheduleItem.expectedInterest, contract.currency)})
                      </div>
                    </div>
                    <button
                      onClick={() => onOpenRepayment(contract)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs whitespace-nowrap"
                    >
                      ទទួលប្រាក់
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Fast Loan Calculator Widget (1 col) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Calculator className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">ម៉ាស៊ីនគណនាការប្រាក់រហ័ស</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              គណនាការប្រាក់ប្រចាំខែ និងសរុបជូនអតិថិជនសួរព័ត៌មាន
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 mb-1 font-medium">រូបិយប័ណ្ណ & ចំនួនប្រាក់ខ្ចី</label>
                <div className="flex gap-2">
                  <select
                    value={calcCurrency}
                    onChange={(e: any) => {
                      const newCurr = e.target.value;
                      setCalcCurrency(newCurr);
                      setCalcPrincipal(newCurr === 'USD' ? 1000 : 4000000);
                    }}
                    className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="KHR">KHR (៛)</option>
                  </select>
                  <input
                    type="number"
                    value={calcPrincipal}
                    onChange={(e) => setCalcPrincipal(Number(e.target.value))}
                    className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">ការប្រាក់ (% /ខែ)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={calcRate}
                    onChange={(e) => setCalcRate(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">រយៈពេល (ខែ)</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={calcMonths}
                    onChange={(e) => setCalcMonths(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold tabular-nums"
                  />
                </div>
              </div>

              {/* Result Preview */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2 mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">ការប្រាក់ក្នុង ១ខែ:</span>
                  <strong className="text-sm text-emerald-800 tabular-nums">
                    {formatMoney(calcMonthlyInterest, calcCurrency)}
                  </strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">ការប្រាក់សរុប ({calcMonths} ខែ):</span>
                  <strong className="text-sm text-emerald-800 tabular-nums">
                    {formatMoney(calcTotalInterest, calcCurrency)}
                  </strong>
                </div>
                <div className="pt-2 border-t border-emerald-200 flex items-center justify-between font-bold text-slate-900">
                  <span>ដើម + ការប្រាក់សរុប:</span>
                  <span className="text-base text-emerald-900 tabular-nums">
                    {formatMoney(calcPrincipal + calcTotalInterest, calcCurrency)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={onOpenNewContract}
            className="w-full mt-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
          >
            ចេញកិច្ចសន្យាពីការគណនានេះ
          </button>
        </div>
      </div>

      {/* Recent Repayment Transactions Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">ប្រតិបត្តិការទូទាត់ប្រាក់ថ្មីៗ (Recent Transactions)</h3>
            <p className="text-xs text-slate-500 mt-0.5">បង្កាន់ដៃ និងវិក្កយបត្រទទួលប្រាក់ចុងក្រោយ</p>
          </div>
          <span className="text-xs text-slate-500">សរុប {transactions.length} ប្រតិបត្តិការ</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-3 px-4">លេខបង្កាន់ដៃ</th>
                <th className="py-3 px-4">អតិថិជន</th>
                <th className="py-3 px-4">កិច្ចសន្យា</th>
                <th className="py-3 px-4">ប្រភេទបង់</th>
                <th className="py-3 px-4">វិធីទូទាត់</th>
                <th className="py-3 px-4">ចំនួនទឹកប្រាក់</th>
                <th className="py-3 px-4">កាលបរិច្ឆេទ</th>
                <th className="py-3 px-4 text-right">បង្កាន់ដៃ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-800">{tx.receiptNumber}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{tx.customerName}</td>
                  <td className="py-3 px-4 font-mono text-emerald-700 font-medium">{tx.contractNumber}</td>
                  <td className="py-3 px-4 text-slate-700">{getPaymentTypeName(tx.paymentType)}</td>
                  <td className="py-3 px-4 text-slate-600">{getPaymentMethodName(tx.paymentMethod)}</td>
                  <td className="py-3 px-4 font-bold text-slate-900 tabular-nums">
                    {formatMoney(tx.totalAmount, tx.currency)}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500">{tx.paymentDate}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onPrintReceipt(tx)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                      title="មើល និងបោះពុម្ពបង្កាន់ដៃ"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
