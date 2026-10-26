import React, { useState } from 'react';
import { usePawn } from '../context/PawnContext';
import { LoanContract, ContractStatus, LoanType, PaymentTransaction } from '../types';
import { formatMoney, getStatusBadge, getCollateralCategoryName } from '../utils/formatters';
import { checkOverdueDays } from '../utils/loanCalculator';
import {
  Search,
  Filter,
  Plus,
  CreditCard,
  Printer,
  Eye,
  ShieldCheck,
  FileText,
  AlertCircle,
} from 'lucide-react';

interface ContractsViewProps {
  initialFilter?: string;
  onOpenContractDetail: (contract: LoanContract) => void;
  onOpenPaymentModal: (contract: LoanContract) => void;
  onOpenPrintAgreement: (contract: LoanContract) => void;
  onOpenNewContractModal: () => void;
}

export const ContractsView: React.FC<ContractsViewProps> = ({
  initialFilter = 'all',
  onOpenContractDetail,
  onOpenPaymentModal,
  onOpenPrintAgreement,
  onOpenNewContractModal,
}) => {
  const { contracts } = usePawn();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialFilter);
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filteredContracts = contracts.filter((c) => {
    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'overdue') {
        if (c.status !== 'overdue' && checkOverdueDays(c.dueDate) <= 0) return false;
      } else if (c.status !== statusFilter) {
        return false;
      }
    }

    // Type filter
    if (typeFilter !== 'all' && c.loanType !== typeFilter) {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchNumber = c.contractNumber.toLowerCase().includes(q);
      const matchName = c.customerName.toLowerCase().includes(q);
      const matchPhone = c.customerPhone.includes(q);
      const matchCollateral = c.collateral?.name.toLowerCase().includes(q) || false;
      if (!matchNumber && !matchName && !matchPhone && !matchCollateral) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="space-y-4 pb-12">
      {/* Top Action & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ស្វែងរកឈ្មោះ, លេខកិច្ចសន្យា, ទូរស័ព្ទ, ទ្រព្យ..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500 bg-slate-50/50"
          />
        </div>

        {/* Filter Controls (Segmented Tabs - Anti-pill discipline) */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 font-medium rounded-md transition-colors cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ទាំងអស់ ({contracts.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 font-medium rounded-md transition-colors cursor-pointer ${
                statusFilter === 'active'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              សកម្ម
            </button>
            <button
              onClick={() => setStatusFilter('overdue')}
              className={`px-3 py-1.5 font-medium rounded-md transition-colors cursor-pointer ${
                statusFilter === 'overdue'
                  ? 'bg-white text-rose-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-rose-600'
              }`}
            >
              ហួសកំណត់
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1.5 font-medium rounded-md transition-colors cursor-pointer ${
                statusFilter === 'completed'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              បង់ផ្តាច់
            </button>
          </div>

          {/* Type Selector */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none text-slate-700"
          >
            <option value="all">គ្រប់ប្រភេទកម្ចី</option>
            <option value="pawn">បញ្ចាំទ្រព្យ (Pawn)</option>
            <option value="microloan">កម្ចីបង់រំលស់ (Loan)</option>
          </select>

          {/* New Contract Button */}
          <button
            onClick={onOpenNewContractModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer ml-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>បង្កើតកិច្ចសន្យា</span>
          </button>
        </div>
      </div>

      {/* Contracts Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-3 px-4">លេខកិច្ចសន្យា</th>
                <th className="py-3 px-4">អតិថិជន (អ្នកខ្ចី)</th>
                <th className="py-3 px-4">ប្រភេទ & ទ្រព្យបញ្ចាំ</th>
                <th className="py-3 px-4 text-right">ប្រាក់ដើម & ការប្រាក់</th>
                <th className="py-3 px-4 text-right">ដើមនៅសល់</th>
                <th className="py-3 px-4">កាលបរិច្ឆេទ & ផុតកំណត់</th>
                <th className="py-3 px-4 text-center">ស្ថានភាព</th>
                <th className="py-3 px-4 text-center">សកម្មភាព</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredContracts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    មិនមានកិច្ចសន្យាណាត្រូវតាមការស្វែងរកទេ
                  </td>
                </tr>
              ) : (
                filteredContracts.map((contract) => {
                  const statusBadge = getStatusBadge(contract.status);
                  const isLate = checkOverdueDays(contract.dueDate) > 0 && contract.status !== 'completed' && contract.status !== 'foreclosed';

                  return (
                    <tr
                      key={contract.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      {/* Contract Number */}
                      <td className="py-3 px-4">
                        <button
                          onClick={() => onOpenContractDetail(contract)}
                          className="font-mono font-bold text-slate-900 hover:text-emerald-700 transition-colors cursor-pointer text-left block"
                        >
                          {contract.contractNumber}
                        </button>
                        <span className="text-[10px] text-slate-400">
                          {contract.loanType === 'pawn' ? 'បញ្ចាំទ្រព្យ' : 'កម្ចីបង់រំលស់'}
                        </span>
                      </td>

                      {/* Customer */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{contract.customerName}</div>
                        <div className="text-[11px] font-mono text-slate-500">{contract.customerPhone}</div>
                      </td>

                      {/* Collateral */}
                      <td className="py-3 px-4 max-w-xs">
                        {contract.collateral ? (
                          <div>
                            <div className="font-medium text-slate-800 truncate">
                              {contract.collateral.name}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {getCollateralCategoryName(contract.collateral.category)} · ទីតាំង: {contract.collateral.storageLocation}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">គ្មានទ្រព្យបញ្ចាំ</span>
                        )}
                      </td>

                      {/* Principal & Interest */}
                      <td className="py-3 px-4 text-right">
                        <div className="font-mono font-bold text-slate-900">
                          {formatMoney(contract.principalAmount, contract.currency)}
                        </div>
                        <div className="text-[11px] text-emerald-700 font-medium">
                          {contract.interestRateMonthly}% / ខែ ({contract.termMonths} ខែ)
                        </div>
                      </td>

                      {/* Remaining Principal */}
                      <td className="py-3 px-4 text-right">
                        <div className="font-mono font-bold text-slate-900">
                          {formatMoney(contract.remainingPrincipal, contract.currency)}
                        </div>
                        {contract.totalPrincipalPaid > 0 && (
                          <div className="text-[10px] text-slate-400">
                            បានសង {formatMoney(contract.totalPrincipalPaid, contract.currency)}
                          </div>
                        )}
                      </td>

                      {/* Dates */}
                      <td className="py-3 px-4">
                        <div className="text-slate-700 font-mono">{contract.dueDate}</div>
                        {isLate ? (
                          <span className="text-[10px] font-semibold text-rose-600 block">
                            ហួស {checkOverdueDays(contract.dueDate)} ថ្ងៃ!
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 block">
                            ចាប់ផ្តើម: {contract.startDate}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 text-[11px] font-medium rounded-full border ${statusBadge.bg}`}
                        >
                          {statusBadge.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {contract.status !== 'completed' && contract.status !== 'foreclosed' && (
                            <button
                              onClick={() => onOpenPaymentModal(contract)}
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors cursor-pointer"
                              title="ទទួលប្រាក់"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => onOpenContractDetail(contract)}
                            className="p-1.5 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors cursor-pointer"
                            title="មើលព័ត៌មានលម្អិត"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onOpenPrintAgreement(contract)}
                            className="p-1.5 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors cursor-pointer"
                            title="បោះពុម្ពកិច្ចសន្យា"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
