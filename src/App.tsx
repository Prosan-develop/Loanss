/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Customer, 
  LoanContract, 
  PaymentTransaction, 
  CashflowEntry, 
  ShopSettings 
} from './types';
import { 
  initialCustomers, 
  initialContracts, 
  initialTransactions, 
  initialCashflows, 
  initialShopSettings 
} from './data/mockData';
import { CustomerTable } from './components/CustomerTable';
import { ContractList } from './components/ContractList';
import { DashboardView } from './components/DashboardView';
import { CollateralVault } from './components/CollateralVault';
import { SettingsView } from './components/SettingsView';
import { NewContractModal } from './components/NewContractModal';
import { RepaymentModal } from './components/RepaymentModal';
import { PrintReceiptModal } from './components/PrintReceiptModal';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Shield, 
  Settings, 
  Plus, 
  Coins,
  ChevronRight
} from 'lucide-react';

export default function App() {
  // Persistent React state initialized from localStorage
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('pawnshop_customers');
    return saved ? JSON.parse(saved) : initialCustomers;
  });

  const [contracts, setContracts] = useState<LoanContract[]>(() => {
    const saved = localStorage.getItem('pawnshop_contracts');
    return saved ? JSON.parse(saved) : initialContracts;
  });

  const [transactions, setTransactions] = useState<PaymentTransaction[]>(() => {
    const saved = localStorage.getItem('pawnshop_transactions');
    return saved ? JSON.parse(saved) : initialTransactions;
  });

  const [shopSettings, setShopSettings] = useState<ShopSettings>(() => {
    const saved = localStorage.getItem('pawnshop_settings');
    return saved ? JSON.parse(saved) : initialShopSettings;
  });

  // Active Tab state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'customers' | 'contracts' | 'vault' | 'settings'>('customers');

  // Modals state
  const [isNewContractModalOpen, setIsNewContractModalOpen] = useState(false);
  const [selectedCustomerForLoan, setSelectedCustomerForLoan] = useState<Customer | null>(null);

  const [isRepaymentModalOpen, setIsRepaymentModalOpen] = useState(false);
  const [repaymentContract, setRepaymentContract] = useState<LoanContract | null>(null);

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printTransaction, setPrintTransaction] = useState<PaymentTransaction | null>(null);
  const [printContract, setPrintContract] = useState<LoanContract | null>(null);

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem('pawnshop_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('pawnshop_contracts', JSON.stringify(contracts));
  }, [contracts]);

  useEffect(() => {
    localStorage.setItem('pawnshop_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('pawnshop_settings', JSON.stringify(shopSettings));
  }, [shopSettings]);

  // Customer handlers
  const handleAddCustomer = (newCustomer: Customer) => {
    setCustomers((prev) => [newCustomer, ...prev]);
  };

  const handleUpdateCustomer = (updatedCustomer: Customer) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === updatedCustomer.id ? updatedCustomer : c))
    );
  };

  const handleCreateLoanForCustomer = (customer: Customer) => {
    setSelectedCustomerForLoan(customer);
    setIsNewContractModalOpen(true);
  };

  // Contract handlers
  const handleCreateContract = (newContract: LoanContract) => {
    setContracts((prev) => [newContract, ...prev]);
    // Optionally open print contract immediately
    setPrintContract(newContract);
    setPrintTransaction(null);
    setIsPrintModalOpen(true);
  };

  const handleOpenRepayment = (contract: LoanContract) => {
    setRepaymentContract(contract);
    setIsRepaymentModalOpen(true);
  };

  const handleProcessPayment = (
    newTx: PaymentTransaction,
    updatedContract: LoanContract
  ) => {
    setTransactions((prev) => [newTx, ...prev]);
    setContracts((prev) =>
      prev.map((c) => (c.id === updatedContract.id ? updatedContract : c))
    );
  };

  const handlePrintReceipt = (tx: PaymentTransaction) => {
    setPrintTransaction(tx);
    setPrintContract(null);
    setIsPrintModalOpen(true);
  };

  const handlePrintContract = (contract: LoanContract) => {
    setPrintContract(contract);
    setPrintTransaction(null);
    setIsPrintModalOpen(true);
  };

  const handleReleaseCollateral = (contractId: string) => {
    setContracts((prev) =>
      prev.map((c) => {
        if (c.id === contractId && c.collateral) {
          return {
            ...c,
            collateral: {
              ...c.collateral,
              status: 'returned',
              releasedDate: new Date().toISOString().split('T')[0],
            },
          };
        }
        return c;
      })
    );
  };

  const handleForecloseCollateral = (contractId: string) => {
    setContracts((prev) =>
      prev.map((c) => {
        if (c.id === contractId && c.collateral) {
          return {
            ...c,
            status: 'foreclosed',
            collateral: {
              ...c.collateral,
              status: 'foreclosed',
              foreclosedDate: new Date().toISOString().split('T')[0],
            },
          };
        }
        return c;
      })
    );
  };

  // Reset to default sample data
  const handleResetData = () => {
    setCustomers(initialCustomers);
    setContracts(initialContracts);
    setTransactions(initialTransactions);
    setShopSettings(initialShopSettings);
    localStorage.clear();
  };

  const handleImportData = (data: any) => {
    if (data.customers) setCustomers(data.customers);
    if (data.contracts) setContracts(data.contracts);
    if (data.transactions) setTransactions(data.transactions);
    if (data.settings) setShopSettings(data.settings);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* Top Bar Contract (3 Zones: Brand, Nav links, Primary action) */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Coins className="w-5 h-5" />
            </div>
            <span className="text-base font-bold tracking-tight text-slate-900">
              {shopSettings.shopNameKhmer}
            </span>
          </div>

          {/* Zone 2: Navigation Links (Single-line controls) */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-semibold text-slate-600">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'dashboard'
                  ? 'bg-slate-100 text-slate-900 font-bold'
                  : 'hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-slate-500" />
              <span>ផ្ទាំងគ្រប់គ្រង</span>
            </button>

            <button
              onClick={() => setActiveTab('customers')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'customers'
                  ? 'bg-emerald-50 text-emerald-800 font-bold'
                  : 'hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Users className="w-4 h-4 text-emerald-600" />
              <span>បញ្ជីអតិថិជន ({customers.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('contracts')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'contracts'
                  ? 'bg-slate-100 text-slate-900 font-bold'
                  : 'hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <FileText className="w-4 h-4 text-slate-500" />
              <span>កិច្ចសន្យាកម្ចី & បញ្ចាំ ({contracts.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('vault')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'vault'
                  ? 'bg-slate-100 text-slate-900 font-bold'
                  : 'hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Shield className="w-4 h-4 text-amber-600" />
              <span>ឃ្លាំងទ្រព្យបញ្ចាំ</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'settings'
                  ? 'bg-slate-100 text-slate-900 font-bold'
                  : 'hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Settings className="w-4 h-4 text-slate-500" />
              <span>ការកំណត់</span>
            </button>
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => {
                setSelectedCustomerForLoan(null);
                setIsNewContractModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ បង្កើតកិច្ចសន្យាថ្មី</span>
            </button>
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="flex md:hidden overflow-x-auto px-4 py-2 bg-slate-50 border-t border-slate-200 gap-2 text-xs">
          <button
            onClick={() => setActiveTab('customers')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeTab === 'customers' ? 'bg-emerald-600 text-white font-bold' : 'bg-white text-slate-700'}`}
          >
            អតិថិជន
          </button>
          <button
            onClick={() => setActiveTab('contracts')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeTab === 'contracts' ? 'bg-emerald-600 text-white font-bold' : 'bg-white text-slate-700'}`}
          >
            កិច្ចសន្យា
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-emerald-600 text-white font-bold' : 'bg-white text-slate-700'}`}
          >
            ផ្ទាំងគ្រប់គ្រង
          </button>
          <button
            onClick={() => setActiveTab('vault')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeTab === 'vault' ? 'bg-emerald-600 text-white font-bold' : 'bg-white text-slate-700'}`}
          >
            ឃ្លាំងទ្រព្យ
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeTab === 'settings' ? 'bg-emerald-600 text-white font-bold' : 'bg-white text-slate-700'}`}
          >
            ការកំណត់
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* Breadcrumb kicker */}
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-4 no-print">
          <span>ប្រព័ន្ធគ្រប់គ្រងហាង</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-semibold text-slate-800">
            {activeTab === 'dashboard' && 'ផ្ទាំងគ្រប់គ្រងទូទៅ (Dashboard)'}
            {activeTab === 'customers' && 'តារាងគ្រប់គ្រងអតិថិជន (Customers Table)'}
            {activeTab === 'contracts' && 'បញ្ជីកិច្ចសន្យាកម្ចី និងបញ្ចាំ (Contracts)'}
            {activeTab === 'vault' && 'ឃ្លាំងស្តុកទ្រព្យបញ្ចាំ (Collateral Vault)'}
            {activeTab === 'settings' && 'ការកំណត់ហាង & ទិន្នន័យ (Settings)'}
          </span>
        </div>

        {/* View Switcher */}
        {activeTab === 'customers' && (
          <CustomerTable
            customers={customers}
            contracts={contracts}
            onAddCustomer={handleAddCustomer}
            onUpdateCustomer={handleUpdateCustomer}
            onCreateLoanForCustomer={handleCreateLoanForCustomer}
          />
        )}

        {activeTab === 'contracts' && (
          <ContractList
            contracts={contracts}
            onOpenNewContractModal={() => {
              setSelectedCustomerForLoan(null);
              setIsNewContractModalOpen(true);
            }}
            onOpenRepaymentModal={handleOpenRepayment}
            onPrintContract={handlePrintContract}
            onForecloseContract={handleForecloseCollateral}
            onReleaseCollateral={handleReleaseCollateral}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardView
            contracts={contracts}
            customers={customers}
            transactions={transactions}
            shopSettings={shopSettings}
            onOpenNewContract={() => {
              setSelectedCustomerForLoan(null);
              setIsNewContractModalOpen(true);
            }}
            onOpenRepayment={handleOpenRepayment}
            onPrintReceipt={handlePrintReceipt}
            onSelectCustomerTab={() => setActiveTab('customers')}
            onSelectContractsTab={() => setActiveTab('contracts')}
          />
        )}

        {activeTab === 'vault' && (
          <CollateralVault
            contracts={contracts}
            onReleaseCollateral={handleReleaseCollateral}
            onForecloseCollateral={handleForecloseCollateral}
            onViewContract={(cnt) => {
              setActiveTab('contracts');
            }}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            settings={shopSettings}
            onUpdateSettings={setShopSettings}
            onResetData={handleResetData}
            allData={{ customers, contracts, transactions }}
            onImportData={handleImportData}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-6 text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            © {new Date().getFullYear()} {shopSettings.shopNameKhmer} ({shopSettings.shopNameLatin})
          </div>
          <div className="text-slate-400">
            {shopSettings.businessLicense} · ទំនាក់ទំនង: {shopSettings.phone}
          </div>
        </div>
      </footer>

      {/* Global Modals */}
      <NewContractModal
        isOpen={isNewContractModalOpen}
        onClose={() => setIsNewContractModalOpen(false)}
        customers={customers}
        onAddCustomer={handleAddCustomer}
        onCreateContract={handleCreateContract}
        preselectedCustomer={selectedCustomerForLoan}
        defaultInterestRate={shopSettings.defaultInterestRate}
      />

      <RepaymentModal
        isOpen={isRepaymentModalOpen}
        onClose={() => setIsRepaymentModalOpen(false)}
        contract={repaymentContract}
        onProcessPayment={handleProcessPayment}
        onPrintReceipt={handlePrintReceipt}
      />

      <PrintReceiptModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        transaction={printTransaction}
        contract={printContract}
        shopSettings={shopSettings}
      />
    </div>
  );
}
