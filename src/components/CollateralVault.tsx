import React, { useState, useMemo } from 'react';
import { LoanContract, CollateralCategory, CollateralStatus } from '../types';
import { formatMoney, getCollateralCategoryName } from '../utils/formatters';
import { Search, Shield, CheckCircle, AlertTriangle, Archive, Filter, Eye } from 'lucide-react';

interface CollateralVaultProps {
  contracts: LoanContract[];
  onReleaseCollateral: (contractId: string) => void;
  onForecloseCollateral: (contractId: string) => void;
  onViewContract: (contract: LoanContract) => void;
}

export const CollateralVault: React.FC<CollateralVaultProps> = ({
  contracts,
  onReleaseCollateral,
  onForecloseCollateral,
  onViewContract,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | CollateralCategory>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | CollateralStatus>('all');

  // Extract all collaterals with their parent contract details
  const collateralItems = useMemo(() => {
    return contracts
      .filter((c) => !!c.collateral)
      .map((c) => ({
        ...c.collateral!,
        contractId: c.id,
        contractNumber: c.contractNumber,
        customerName: c.customerName,
        customerPhone: c.customerPhone,
        contractStatus: c.status,
        contractDueDate: c.dueDate,
        principalAmount: c.principalAmount,
        currency: c.currency,
        parentContract: c,
      }));
  }, [contracts]);

  const filteredItems = useMemo(() => {
    return collateralItems.filter((item) => {
      const matchSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.contractNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.storageLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.serialOrPlateNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);

      if (!matchSearch) return false;
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;

      return true;
    });
  }, [collateralItems, searchTerm, categoryFilter, statusFilter]);

  // Aggregate Vault Value
  const vaultTotals = useMemo(() => {
    let usdEst = 0;
    let khrEst = 0;
    let goldWeightChi = 0;
    let inVaultCount = 0;

    collateralItems.forEach((item) => {
      if (item.status === 'in_vault') {
        inVaultCount++;
        if (item.currency === 'USD') usdEst += item.estimatedValue;
        if (item.currency === 'KHR') khrEst += item.estimatedValue;
        if (item.weightChi) goldWeightChi += Number(item.weightChi);
      }
    });

    return { usdEst, khrEst, goldWeightChi, inVaultCount };
  }, [collateralItems]);

  return (
    <div className="space-y-6">
      {/* Vault KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">ទ្រព្យក្នុងឃ្លាំងសរុប</span>
            <Shield className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums">
            {vaultTotals.inVaultCount} មុខ
          </div>
          <div className="text-xs text-slate-400 mt-1">កំពុងរក្សាទុកក្នុងទូសុវត្ថិភាព</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">តម្លៃប៉ាន់ស្មានសរុប (USD)</span>
            <span className="text-xs font-bold text-slate-400">$</span>
          </div>
          <div className="text-2xl font-bold text-emerald-700 tabular-nums">
            {formatMoney(vaultTotals.usdEst, 'USD')}
          </div>
          <div className="text-xs text-slate-400 mt-1">ទ្រព្យបញ្ចាំជាប្រាក់ដុល្លារ</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">ទម្ងន់មាសក្នុងទូដែក</span>
            <span className="text-xs font-bold text-amber-600">ជី</span>
          </div>
          <div className="text-2xl font-bold text-amber-700 tabular-nums">
            {vaultTotals.goldWeightChi} ជី
          </div>
          <div className="text-xs text-slate-400 mt-1">មាស / ផ្លាកទីនសុទ្ធ</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">តម្លៃប៉ាន់ស្មាន (KHR)</span>
            <span className="text-xs font-bold text-slate-400">៛</span>
          </div>
          <div className="text-2xl font-bold text-slate-800 tabular-nums">
            {formatMoney(vaultTotals.khrEst, 'KHR')}
          </div>
          <div className="text-xs text-slate-400 mt-1">ទ្រព្យគិតជាប្រាក់រៀល</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ស្វែងរកទ្រព្យបញ្ចាំ, ម្ចាស់, លេខកិច្ចសន្យា, ទីតាំងទូ..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e: any) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
          >
            <option value="all">គ្រប់ប្រភេទទ្រព្យ</option>
            <option value="gold">មាស / ផ្លាកទីន</option>
            <option value="vehicle">យានយន្ត / ម៉ូតូ</option>
            <option value="jewelry">គ្រឿងអលង្ការ / ពេជ្រ</option>
            <option value="land_title">ប្លង់ដី / ផ្ទះ</option>
            <option value="electronics">អេឡិចត្រូនិក</option>
            <option value="other">ផ្សេងៗ</option>
          </select>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              ទាំងអស់ ({collateralItems.length})
            </button>
            <button
              onClick={() => setStatusFilter('in_vault')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                statusFilter === 'in_vault' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              ក្នុងឃ្លាំង ({vaultTotals.inVaultCount})
            </button>
            <button
              onClick={() => setStatusFilter('returned')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                statusFilter === 'returned' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-600'
              }`}
            >
              បានប្រគល់វិញ
            </button>
            <button
              onClick={() => setStatusFilter('foreclosed')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                statusFilter === 'foreclosed' ? 'bg-white text-amber-800 shadow-xs' : 'text-slate-600'
              }`}
            >
              បានរឹបអូស
            </button>
          </div>
        </div>
      </div>

      {/* Collateral Vault Items Grid / Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <th className="py-3.5 px-4">ទ្រព្យបញ្ចាំ & ប្រភេទ</th>
                <th className="py-3.5 px-4">ម្ចាស់ទ្រព្យ & កិច្ចសន្យា</th>
                <th className="py-3.5 px-4">ទីតាំងរក្សាទុក (Vault Location)</th>
                <th className="py-3.5 px-4">តម្លៃប៉ាន់ស្មាន / ប្រាក់កម្ចី</th>
                <th className="py-3.5 px-4">ស្ថានភាពទ្រព្យ</th>
                <th className="py-3.5 px-4 text-right">សកម្មភាព</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <Shield className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-medium">មិនមានទ្រព្យបញ្ចាំត្រូវនឹងការស្វែងរកទេ</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name & Category */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{item.name}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span>{getCollateralCategoryName(item.category)}</span>
                          {item.weightChi && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-semibold text-amber-700">{item.weightChi} ជី</span>
                            </>
                          )}
                          {item.serialOrPlateNumber && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono">{item.serialOrPlateNumber}</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Customer & Contract */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{item.customerName}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <span className="font-mono text-emerald-700 font-medium">{item.contractNumber}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono">{item.customerPhone}</span>
                        </div>
                      </td>

                      {/* Location in Vault */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 border border-slate-200 rounded font-mono text-xs font-semibold text-slate-800">
                          📦 {item.storageLocation}
                        </span>
                      </td>

                      {/* Financials */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 tabular-nums">
                          {formatMoney(item.estimatedValue, item.currency)}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          ប្រាក់កម្ចី: <span className="font-semibold tabular-nums">{formatMoney(item.principalAmount, item.currency)}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {item.status === 'in_vault' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-xs font-medium">
                            <Shield className="w-3 h-3" />
                            ក្នុងទូសុវត្ថិភាព
                          </span>
                        )}
                        {item.status === 'returned' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded text-xs font-medium">
                            <CheckCircle className="w-3 h-3" />
                            បានប្រគល់វិញ
                          </span>
                        )}
                        {item.status === 'foreclosed' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded text-xs font-medium">
                            <AlertTriangle className="w-3 h-3" />
                            បានរឹបអូស
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onViewContract(item.parentContract)}
                            title="មើលកិច្ចសន្យា"
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {item.status === 'in_vault' && item.contractStatus === 'completed' && (
                            <button
                              onClick={() => onReleaseCollateral(item.contractId)}
                              className="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition-colors"
                            >
                              ប្រគល់ទ្រព្យវិញ
                            </button>
                          )}

                          {item.status === 'in_vault' && item.contractStatus === 'overdue' && (
                            <button
                              onClick={() => onForecloseCollateral(item.contractId)}
                              className="px-2.5 py-1 text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded transition-colors"
                            >
                              រឹបអូសលក់ឡៃឡុង
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
    </div>
  );
};
