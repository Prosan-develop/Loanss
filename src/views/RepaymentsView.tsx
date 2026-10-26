import React, { useState } from 'react';
import { usePawn } from '../context/PawnContext';
import { PaymentTransaction, LoanContract } from '../types';
import { formatMoney, getPaymentMethodName, getPaymentTypeName } from '../utils/formatters';
import { Search, Printer, Plus, CreditCard, Calendar, Filter } from 'lucide-react';

interface RepaymentsViewProps {
  onOpenPrintReceipt: (tx: PaymentTransaction) => void;
  onOpenNewPaymentSelector: () => void;
}

export const RepaymentsView: React.FC<RepaymentsViewProps> = ({
  onOpenPrintReceipt,
  onOpenNewPaymentSelector,
}) => {
  const { transactions } = usePawn();
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');

  const filteredTransactions = transactions.filter((tx) => {
    if (methodFilter !== 'all' && tx.paymentMethod !== methodFilter) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchReceipt = tx.receiptNumber.toLowerCase().includes(q);
      const matchContract = tx.contractNumber.toLowerCase().includes(q);
      const matchName = tx.customerName.toLowerCase().includes(q);
      const matchPhone = tx.customerPhone.includes(q);
      if (!matchReceipt && !matchContract && !matchName && !matchPhone) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-4 pb-12">
      {/* Top Filter and Actions */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ស្វែងរកលេខបង្កាន់ដៃ, ឈ្មោះ, លេខកិច្ចសន្យា..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Method Filter */}
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none text-slate-700"
          >
            <option value="all">គ្រប់វិធីទូទាត់</option>
            <option value="aba_khqr">KHQR / ABA Bank</option>
            <option value="cash">សាច់ប្រាក់សុទ្ធ</option>
            <option value="bank_transfer">ផ្ទេរប្រាក់ធនាគារ</option>
            <option value="wing">Wing</option>
          </select>

          {/* New Payment Button */}
          <button
            onClick={onOpenNewPaymentSelector}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer ml-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>កត់ត្រាការបង់ប្រាក់</span>
          </button>
        </div>
      </div>

      {/* Receipts Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-3 px-4">លេខបង្កាន់ដៃ</th>
                <th className="py-3 px-4">កាលបរិច្ឆេទ & ម៉ោង</th>
                <th className="py-3 px-4">លេខកិច្ចសន្យា</th>
                <th className="py-3 px-4">អតិថិជន</th>
                <th className="py-3 px-4">ប្រភេទនៃការបង់</th>
                <th className="py-3 px-4 text-right">ចំនួនទឹកប្រាក់</th>
                <th className="py-3 px-4">វិធីទូទាត់</th>
                <th className="py-3 px-4">បេឡា</th>
                <th className="py-3 px-4 text-center">បង្កាន់ដៃ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    មិនមានប្រតិបត្តិការណាត្រូវតាមការស្វែងរកទេ
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Receipt Number */}
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {tx.receiptNumber}
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 text-slate-600">
                      {tx.paymentDate}
                    </td>

                    {/* Contract Number */}
                    <td className="py-3 px-4 font-mono font-medium text-slate-800">
                      {tx.contractNumber}
                    </td>

                    {/* Customer */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{tx.customerName}</div>
                      <div className="text-[11px] font-mono text-slate-400">{tx.customerPhone}</div>
                    </td>

                    {/* Payment Type */}
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-700">
                        {getPaymentTypeName(tx.paymentType)}
                      </span>
                      {tx.interestPortion > 0 && tx.principalPortion > 0 && (
                        <div className="text-[10px] text-slate-400">
                          (ដើម: {formatMoney(tx.principalPortion, tx.currency)} / ការ: {formatMoney(tx.interestPortion, tx.currency)})
                        </div>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 text-sm">
                      {formatMoney(tx.totalAmount, tx.currency)}
                    </td>

                    {/* Method */}
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                        {getPaymentMethodName(tx.paymentMethod)}
                      </span>
                    </td>

                    {/* Cashier */}
                    <td className="py-3 px-4 text-slate-600 text-[11px]">
                      {tx.receivedBy}
                    </td>

                    {/* Print Button */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onOpenPrintReceipt(tx)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-medium cursor-pointer transition-colors shadow-2xs"
                        title="បោះពុម្ពបង្កាន់ដៃទទួលប្រាក់"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-500" />
                        <span>បោះពុម្ព</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
