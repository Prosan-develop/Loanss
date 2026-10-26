import React, { useState } from 'react';
import { usePawn } from '../context/PawnContext';
import { Customer, LoanContract } from '../types';
import { formatMoney } from '../utils/formatters';
import {
  Search,
  UserPlus,
  Phone,
  MapPin,
  Shield,
  FileText,
  Clock,
  UserCheck,
  Edit2,
} from 'lucide-react';

interface CustomersViewProps {
  onOpenNewCustomerModal: () => void;
  onEditCustomer: (customer: Customer) => void;
  onOpenContractDetail: (contract: LoanContract) => void;
  onStartContractForCustomer: (customer: Customer) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  onOpenNewCustomerModal,
  onEditCustomer,
  onOpenContractDetail,
  onStartContractForCustomer,
}) => {
  const { customers, contracts } = usePawn();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredCustomers = customers.filter((cust) => {
    if (statusFilter !== 'all' && cust.status !== statusFilter) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchNameKhmer = cust.nameKhmer.toLowerCase().includes(q);
      const matchNameLatin = cust.nameLatin.toLowerCase().includes(q);
      const matchPhone = cust.phone.includes(q);
      const matchId = cust.nationalId.toLowerCase().includes(q);
      if (!matchNameKhmer && !matchNameLatin && !matchPhone && !matchId) {
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
            placeholder="ស្វែងរកឈ្មោះ, លេខទូរស័ព្ទ, លេខអត្តសញ្ញាណ..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none text-slate-700"
          >
            <option value="all">គ្រប់កម្រិតទំនុកចិត្ត</option>
            <option value="reliable">ទុកចិត្តបានខ្ពស់ (Reliable)</option>
            <option value="normal">ធម្មតា (Normal)</option>
            <option value="watchlist">គួរតាមដាន (Watchlist)</option>
            <option value="blocked">ផ្អាកសេវា (Blocked)</option>
          </select>

          {/* New Customer Button */}
          <button
            onClick={onOpenNewCustomerModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer ml-auto"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ ចុះឈ្មោះអតិថិជនថ្មី</span>
          </button>
        </div>
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
            មិនមានព័ត៌មានអតិថិជនណាត្រូវតាមការស្វែងរកទេ
          </div>
        ) : (
          filteredCustomers.map((customer) => {
            const customerContracts = contracts.filter((c) => c.customerId === customer.id);
            const activeLoans = customerContracts.filter(
              (c) => c.status === 'active' || c.status === 'overdue' || c.status === 'extended'
            );

            return (
              <div
                key={customer.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors"
              >
                <div>
                  {/* Top Bar: Code & Reliability */}
                  <div className="flex items-center justify-between text-xs mb-3">
                    <span className="font-mono text-slate-400 font-semibold">{customer.code}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                        customer.status === 'reliable'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : customer.status === 'watchlist'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : customer.status === 'blocked'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {customer.status === 'reliable'
                        ? 'ទុកចិត្តខ្ពស់'
                        : customer.status === 'watchlist'
                        ? 'តាមដាន'
                        : customer.status === 'blocked'
                        ? 'ផ្អាកសេវា'
                        : 'ធម្មតា'}
                    </span>
                  </div>

                  {/* Name */}
                  <h3 className="font-bold text-base text-slate-900">{customer.nameKhmer}</h3>
                  {customer.nameLatin && (
                    <p className="text-xs text-slate-500 -mt-0.5">{customer.nameLatin}</p>
                  )}

                  {/* Info details */}
                  <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono font-medium text-slate-800">{customer.phone}</span>
                    </div>

                    {customer.nationalId && (
                      <div className="flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-[11px] font-mono text-slate-600">
                          អត្តសញ្ញាណ: {customer.nationalId}
                        </span>
                      </div>
                    )}

                    {customer.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="text-[11px] text-slate-500 line-clamp-1">{customer.address}</span>
                      </div>
                    )}

                    {customer.emergencyContact && (
                      <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                        អ្នកធានា/សាច់ញាតិ: {customer.emergencyContact.name} ({customer.emergencyContact.relation}) · {customer.emergencyContact.phone}
                      </div>
                    )}
                  </div>

                  {/* Loan stats badge */}
                  <div className="mt-4 p-2.5 bg-slate-50 rounded-lg border border-slate-100 flex justify-between text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">កម្ចីសកម្ម</span>
                      <span className="font-bold font-mono text-emerald-700">
                        {activeLoans.length} កិច្ចសន្យា
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block text-[10px]">ប្រវត្តិកម្ចីសរុប</span>
                      <span className="font-bold font-mono text-slate-700">
                        {customerContracts.length} លើក
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Card Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <button
                    onClick={() => onEditCustomer(customer)}
                    className="flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>កែប្រែ</span>
                  </button>

                  <button
                    onClick={() => onStartContractForCustomer(customer)}
                    className="flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
                  >
                    <span>+ បង្កើតកិច្ចសន្យា</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
