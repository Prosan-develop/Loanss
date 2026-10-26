import React, { useState, useMemo } from 'react';
import { LoanContract, Customer } from '../types';
import { formatMoney, getStatusBadge, getCollateralCategoryName } from '../utils/formatters';
import { 
  Search, 
  FileText, 
  Plus, 
  AlertCircle, 
  Clock, 
  DollarSign, 
  Printer, 
  X, 
  Calendar, 
  ShieldCheck,
  CheckCircle,
  ExternalLink
} from 'lucide-react';

interface ContractListProps {
  contracts: LoanContract[];
  onOpenNewContractModal: () => void;
  onOpenRepaymentModal: (contract: LoanContract) => void;
  onPrintContract: (contract: LoanContract) => void;
  onForecloseContract?: (contractId: string) => void;
  onReleaseCollateral?: (contractId: string) => void;
  selectedContractIdFromOutside?: string | null;
}

export const ContractList: React.FC<ContractListProps> = ({
  contracts,
  onOpenNewContractModal,
  onOpenRepaymentModal,
  onPrintContract,
  onForecloseContract,
  onReleaseCollateral,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'overdue' | 'completed' | 'foreclosed'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'pawn' | 'microloan'>('all');
  const [selectedContract, setSelectedContract] = useState<LoanContract | null>(null);

  // Filtered contracts
  const filteredContracts = useMemo(() => {
    return contracts.filter((c) => {
      const matchSearch =
        c.contractNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.customerPhone.includes(searchTerm) ||
        (c.collateral?.name.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);

      if (!matchSearch) return false;
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (typeFilter !== 'all' && c.loanType !== typeFilter) return false;

      return true;
    });
  }, [contracts, searchTerm, statusFilter, typeFilter]);

  // Aggregate stats
  const activeCount = contracts.filter((c) => c.status === 'active').length;
  const overdueCount = contracts.filter((c) => c.status === 'overdue').length;
  const completedCount = contracts.filter((c) => c.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ស្វែងរកតាមលេខកិច្ចសន្យា, ឈ្មោះអតិថិជន, លេខទូរស័ព្ទ, ទ្រព្យ..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        {/* Filter Badges & Create Action */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Loan Type Filter */}
          <select
            value={typeFilter}
            onChange={(e: any) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
          >
            <option value="all">គ្រប់ប្រភេទ (បញ្ចាំ & កម្ចី)</option>
            <option value="pawn">បញ្ចាំទ្រព្យ (Pawn)</option>
            <option value="microloan">កម្ចីបង់រំលស់ (Loan)</option>
          </select>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ទាំងអស់ ({contracts.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                statusFilter === 'active'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              សកម្ម ({activeCount})
            </button>
            <button
              onClick={() => setStatusFilter('overdue')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                statusFilter === 'overdue'
                  ? 'bg-white text-rose-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ហួសកំណត់ ({overdueCount})
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                statusFilter === 'completed'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              បង់ដាច់ ({completedCount})
            </button>
          </div>

          <button
            onClick={onOpenNewContractModal}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-xs whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>+ បង្កើតកិច្ចសន្យាថ្មី</span>
          </button>
        </div>
      </div>

      {/* Contracts Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <th className="py-3.5 px-4">លេខកិច្ចសន្យា & ប្រភេទ</th>
                <th className="py-3.5 px-4">អតិថិជន</th>
                <th className="py-3.5 px-4">ទ្រព្យបញ្ចាំ / វត្ថុធានា</th>
                <th className="py-3.5 px-4">ប្រាក់ដើម / ការប្រាក់</th>
                <th className="py-3.5 px-4">កាលបរិច្ឆេទ</th>
                <th className="py-3.5 px-4">ស្ថានភាព</th>
                <th className="py-3.5 px-4 text-right">សកម្មភាព</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredContracts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-medium">មិនមានកិច្ចសន្យាត្រូវនឹងលក្ខខណ្ឌស្វែងរកទេ</p>
                  </td>
                </tr>
              ) : (
                filteredContracts.map((cnt) => {
                  const badge = getStatusBadge(cnt.status);
                  const isLate = cnt.status === 'overdue';

                  return (
                    <tr
                      key={cnt.id}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      onClick={() => setSelectedContract(cnt)}
                    >
                      {/* Contract Number & Type */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold font-mono text-slate-900 group-hover:text-emerald-700 transition-colors">
                          {cnt.contractNumber}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {cnt.loanType === 'pawn' ? 'បញ្ចាំទ្រព្យ' : 'កម្ចីបង់រំលស់'}
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{cnt.customerName}</div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">{cnt.customerPhone}</div>
                      </td>

                      {/* Collateral */}
                      <td className="py-3.5 px-4 max-w-xs">
                        {cnt.collateral ? (
                          <div>
                            <div className="text-slate-800 font-medium text-xs truncate" title={cnt.collateral.name}>
                              {cnt.collateral.name}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                              <span>{getCollateralCategoryName(cnt.collateral.category)}</span>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono">{cnt.collateral.storageLocation}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">គ្មានទ្រព្យបញ្ចាំ (កម្ចីផ្ទាល់)</span>
                        )}
                      </td>

                      {/* Financials */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 tabular-nums">
                          {formatMoney(cnt.principalAmount, cnt.currency)}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          ការប្រាក់: <span className="font-medium text-emerald-700">{cnt.interestRateMonthly}% /ខែ</span>
                        </div>
                      </td>

                      {/* Dates */}
                      <td className="py-3.5 px-4">
                        <div className="text-xs text-slate-700">
                          ផុតកំណត់: <strong className={`font-mono ${isLate ? 'text-rose-600' : 'text-slate-900'}`}>{cnt.dueDate}</strong>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                          កិច្ចសន្យា {cnt.termMonths} ខែ
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium border ${badge.bg}`}>
                          {isLate ? <AlertCircle className="w-3 h-3" /> : null}
                          {badge.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onPrintContract(cnt)}
                            title="បោះពុម្ពកិច្ចសន្យាផ្លូវការ"
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {(cnt.status === 'active' || cnt.status === 'overdue') && (
                            <button
                              onClick={() => onOpenRepaymentModal(cnt)}
                              className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors shadow-xs"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                              <span>ទទួលប្រាក់</span>
                            </button>
                          )}
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

      {/* Contract Detail Modal */}
      {selectedContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900 font-mono">{selectedContract.contractNumber}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium border ${getStatusBadge(selectedContract.status).bg}`}>
                      {getStatusBadge(selectedContract.status).label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    អតិថិជន: <strong>{selectedContract.customerName}</strong> · ទូរស័ព្ទ: {selectedContract.customerPhone}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onPrintContract(selectedContract)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>បោះពុម្ព</span>
                </button>
                <button
                  onClick={() => setSelectedContract(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Contract Highlights */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 mb-5 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">ប្រាក់ដើមខ្ចី:</span>
                <span className="text-base font-bold text-slate-900 tabular-nums">
                  {formatMoney(selectedContract.principalAmount, selectedContract.currency)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">ការប្រាក់:</span>
                <span className="text-base font-bold text-emerald-700 tabular-nums">
                  {selectedContract.interestRateMonthly}% /ខែ
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">នៅសល់ប្រាក់ដើម:</span>
                <span className="text-base font-bold text-slate-900 tabular-nums">
                  {formatMoney(selectedContract.remainingPrincipal, selectedContract.currency)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">ការប្រាក់បានបង់រួច:</span>
                <span className="text-base font-bold text-slate-900 tabular-nums">
                  {formatMoney(selectedContract.totalInterestPaid, selectedContract.currency)}
                </span>
              </div>
            </div>

            {/* Collateral Details (if pawn) */}
            {selectedContract.collateral && (
              <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-200 mb-5">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-amber-900">ព័ត៌មានទ្រព្យបញ្ចាំដែលបានតម្កល់</h4>
                  <span className="text-xs font-medium px-2 py-0.5 bg-amber-100 text-amber-800 rounded">
                    ទីតាំង: {selectedContract.collateral.storageLocation}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-slate-700">
                  <div><strong>ឈ្មោះទ្រព្យ:</strong> {selectedContract.collateral.name}</div>
                  <div><strong>ប្រភេទ:</strong> {getCollateralCategoryName(selectedContract.collateral.category)}</div>
                  <div><strong>តម្លៃប៉ាន់ស្មាន:</strong> {formatMoney(selectedContract.collateral.estimatedValue, selectedContract.collateral.currency)}</div>
                  {selectedContract.collateral.weightChi ? (
                    <div><strong>ទម្ងន់:</strong> {selectedContract.collateral.weightChi} ជី</div>
                  ) : null}
                  {selectedContract.collateral.serialOrPlateNumber ? (
                    <div><strong>លេខសម្គាល់/ស្លាកលេខ:</strong> {selectedContract.collateral.serialOrPlateNumber}</div>
                  ) : null}
                  {selectedContract.collateral.description ? (
                    <div className="col-span-2"><strong>ពិពណ៌នា:</strong> {selectedContract.collateral.description}</div>
                  ) : null}
                </div>
              </div>
            )}

            {/* Repayment Schedule Table */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 mb-2">តារាងកាលវិភាគបង់ប្រាក់</h4>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="py-2.5 px-3">លើកទី</th>
                      <th className="py-2.5 px-3">ថ្ងៃកំណត់</th>
                      <th className="py-2.5 px-3">ការប្រាក់</th>
                      <th className="py-2.5 px-3">ប្រាក់ដើមត្រូវបង់</th>
                      <th className="py-2.5 px-3">សរុបត្រូវបង់</th>
                      <th className="py-2.5 px-3">បានបង់</th>
                      <th className="py-2.5 px-3">ស្ថានភាព</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedContract.schedule.map((item) => (
                      <tr key={item.periodNumber} className={item.status === 'paid' ? 'bg-emerald-50/30' : ''}>
                        <td className="py-2.5 px-3 font-semibold text-slate-700">#{item.periodNumber}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-800">{item.dueDate}</td>
                        <td className="py-2.5 px-3 tabular-nums">{formatMoney(item.expectedInterest, selectedContract.currency)}</td>
                        <td className="py-2.5 px-3 tabular-nums">{formatMoney(item.expectedPrincipal, selectedContract.currency)}</td>
                        <td className="py-2.5 px-3 font-bold tabular-nums">{formatMoney(item.totalDue, selectedContract.currency)}</td>
                        <td className="py-2.5 px-3 tabular-nums font-semibold text-emerald-700">
                          {formatMoney(item.paidAmount, selectedContract.currency)}
                        </td>
                        <td className="py-2.5 px-3">
                          {item.status === 'paid' ? (
                            <span className="text-[11px] text-emerald-700 font-semibold">រួចរាល់</span>
                          ) : item.status === 'late' ? (
                            <span className="text-[11px] text-rose-600 font-semibold">យឺតយ៉ាវ</span>
                          ) : (
                            <span className="text-[11px] text-slate-500">រង់ចាំ</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between">
              <div>
                {selectedContract.notes && (
                  <p className="text-xs text-slate-500 italic">ចំណាំ: {selectedContract.notes}</p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedContract(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  បិទ
                </button>
                {(selectedContract.status === 'active' || selectedContract.status === 'overdue') && (
                  <button
                    onClick={() => {
                      const contract = selectedContract;
                      setSelectedContract(null);
                      onOpenRepaymentModal(contract);
                    }}
                    className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
                  >
                    <DollarSign className="w-4 h-4" />
                    <span>ទទួលប្រាក់កិច្ចសន្យានេះ</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
