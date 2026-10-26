import React from 'react';
import { ShopSettings } from '../types';
import { Plus, Landmark, DollarSign } from 'lucide-react';

export type NavTab = 
  | 'dashboard' 
  | 'contracts' 
  | 'repayments' 
  | 'customers' 
  | 'vault' 
  | 'cashflow' 
  | 'reports' 
  | 'settings';

interface NavbarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenNewContractModal: () => void;
  settings: ShopSettings;
  overdueCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  onOpenNewContractModal,
  settings,
  overdueCount,
}) => {
  const navItems: { id: NavTab; label: string; badge?: number }[] = [
    { id: 'dashboard', label: 'ផ្ទាំងគ្រប់គ្រង' },
    { id: 'contracts', label: 'កិច្ចសន្យា', badge: overdueCount > 0 ? overdueCount : undefined },
    { id: 'repayments', label: 'ទទួលប្រាក់ & បង្កាន់ដៃ' },
    { id: 'customers', label: 'អតិថិជន' },
    { id: 'vault', label: 'ឃ្លាំងទ្រព្យបញ្ចាំ' },
    { id: 'cashflow', label: 'លំហូរសាច់ប្រាក់' },
    { id: 'reports', label: 'របាយការណ៍' },
    { id: 'settings', label: 'ការកំណត់' },
  ];

  return (
    <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-40">
      {/* Top 3-Zone Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-xs">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <a
                href="#dashboard"
                onClick={(e) => {
                  e.preventDefault();
                  onTabChange('dashboard');
                }}
                className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap block"
              >
                {settings.shopNameKhmer}
              </a>
              <span className="text-[11px] text-slate-400 block -mt-0.5">
                {settings.shopNameLatin}
              </span>
            </div>
          </div>

          {/* Zone 2: Single-line Clean Nav Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  currentTab === item.id
                    ? 'text-emerald-700 bg-emerald-50/80 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className="text-[10px] px-1.5 py-0.2 bg-rose-500 text-white rounded-full font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Zone 3: Primary Action */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-500 px-2.5 py-1 bg-slate-100 rounded-lg font-mono">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600 -mr-0.5" />
              <span>1 USD = {settings.exchangeRateUsdToKhr.toLocaleString()} ៛</span>
            </div>

            <button
              onClick={onOpenNewContractModal}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ បង្កើតកិច្ចសន្យាថ្មី</span>
            </button>
          </div>
        </div>

        {/* Mobile Nav Links Row */}
        <div className="lg:hidden flex items-center gap-1 overflow-x-auto py-2 border-t border-slate-100 scrollbar-none text-xs">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`px-3 py-1.5 rounded-md whitespace-nowrap shrink-0 cursor-pointer ${
                currentTab === item.id
                  ? 'text-emerald-700 bg-emerald-50 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {item.label}
              {item.badge !== undefined && ` (${item.badge})`}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
