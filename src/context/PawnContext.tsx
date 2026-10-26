import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Customer,
  LoanContract,
  PaymentTransaction,
  CashflowEntry,
  ShopSettings,
  PaymentType,
  PaymentMethod,
} from '../types';
import {
  initialCustomers,
  initialContracts,
  initialTransactions,
  initialCashflows,
  initialSettings,
} from '../data/mockData';
import { checkOverdueDays } from '../utils/loanCalculator';

interface PawnContextType {
  settings: ShopSettings;
  updateSettings: (settings: ShopSettings) => void;
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id' | 'joinedDate'>) => Customer;
  updateCustomer: (id: string, customer: Partial<Customer>) => void;
  contracts: LoanContract[];
  addContract: (contract: Omit<LoanContract, 'id' | 'totalInterestPaid' | 'totalPrincipalPaid' | 'remainingPrincipal' | 'latePenaltyFee' | 'createdAt'>) => LoanContract;
  updateContract: (id: string, updates: Partial<LoanContract>) => void;
  transactions: PaymentTransaction[];
  recordPayment: (payment: {
    contractId: string;
    paymentType: PaymentType;
    totalAmount: number;
    principalPortion: number;
    interestPortion: number;
    penaltyPortion: number;
    paymentMethod: PaymentMethod;
    notes?: string;
    receivedBy: string;
  }) => PaymentTransaction;
  cashflows: CashflowEntry[];
  addCashflow: (entry: Omit<CashflowEntry, 'id'>) => void;
  releaseCollateral: (contractId: string) => void;
  forecloseCollateral: (contractId: string, notes?: string) => void;
  extendContract: (contractId: string, additionalMonths: number) => void;
  resetToDemoData: () => void;
  exportDatabaseJson: () => string;
  importDatabaseJson: (jsonStr: string) => boolean;
}

const PawnContext = createContext<PawnContextType | undefined>(undefined);

const STORAGE_KEYS = {
  SETTINGS: 'pawn_system_settings_v1',
  CUSTOMERS: 'pawn_system_customers_v1',
  CONTRACTS: 'pawn_system_contracts_v1',
  TRANSACTIONS: 'pawn_system_transactions_v1',
  CASHFLOWS: 'pawn_system_cashflows_v1',
};

export const PawnProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<ShopSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return saved ? JSON.parse(saved) : initialSettings;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    return saved ? JSON.parse(saved) : initialCustomers;
  });

  const [contracts, setContracts] = useState<LoanContract[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CONTRACTS);
    if (!saved) return initialContracts;
    try {
      const parsed: LoanContract[] = JSON.parse(saved);
      // Auto recalculate overdue status based on current date
      return parsed.map((c) => {
        if (c.status === 'completed' || c.status === 'foreclosed') return c;
        const overdueDays = checkOverdueDays(c.dueDate);
        if (overdueDays > 0) {
          return { ...c, status: 'overdue' as const };
        }
        return c;
      });
    } catch {
      return initialContracts;
    }
  });

  const [transactions, setTransactions] = useState<PaymentTransaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return saved ? JSON.parse(saved) : initialTransactions;
  });

  const [cashflows, setCashflows] = useState<CashflowEntry[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CASHFLOWS);
    return saved ? JSON.parse(saved) : initialCashflows;
  });

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CONTRACTS, JSON.stringify(contracts));
  }, [contracts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CASHFLOWS, JSON.stringify(cashflows));
  }, [cashflows]);

  const updateSettings = (newSettings: ShopSettings) => {
    setSettings(newSettings);
  };

  const addCustomer = (data: Omit<Customer, 'id' | 'joinedDate'>): Customer => {
    const newCustomer: Customer = {
      ...data,
      id: `cust-${Date.now()}`,
      joinedDate: new Date().toISOString().split('T')[0],
    };
    setCustomers((prev) => [newCustomer, ...prev]);
    return newCustomer;
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  const addContract = (
    data: Omit<
      LoanContract,
      'id' | 'totalInterestPaid' | 'totalPrincipalPaid' | 'remainingPrincipal' | 'latePenaltyFee' | 'createdAt'
    >
  ): LoanContract => {
    const now = new Date();
    const newContract: LoanContract = {
      ...data,
      id: `con-${Date.now()}`,
      totalInterestPaid: 0,
      totalPrincipalPaid: 0,
      remainingPrincipal: data.principalAmount,
      latePenaltyFee: 0,
      createdAt: `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
    };

    setContracts((prev) => [newContract, ...prev]);

    // Record cashflow disbursement
    addCashflow({
      date: newContract.startDate,
      type: 'disbursement',
      category: 'ការបញ្ចេញដើមកម្ចី',
      description: `បញ្ចេញដើមកម្ចីកិច្ចសន្យា #${newContract.contractNumber} (${newContract.customerName})`,
      amount: newContract.principalAmount,
      currency: newContract.currency,
      referenceId: newContract.id,
      createdBy: newContract.createdBy || 'អ្នកគ្រប់គ្រងហាង',
    });

    return newContract;
  };

  const updateContract = (id: string, updates: Partial<LoanContract>) => {
    setContracts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  const recordPayment = ({
    contractId,
    paymentType,
    totalAmount,
    principalPortion,
    interestPortion,
    penaltyPortion,
    paymentMethod,
    notes,
    receivedBy,
  }: {
    contractId: string;
    paymentType: PaymentType;
    totalAmount: number;
    principalPortion: number;
    interestPortion: number;
    penaltyPortion: number;
    paymentMethod: PaymentMethod;
    notes?: string;
    receivedBy: string;
  }): PaymentTransaction => {
    const contract = contracts.find((c) => c.id === contractId);
    if (!contract) {
      throw new Error('Contract not found');
    }

    const now = new Date();
    const formattedDate = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const receiptNumber = `RCP-${now.getFullYear()}-${String(transactions.length + 101).padStart(4, '0')}`;

    const newTx: PaymentTransaction = {
      id: `tx-${Date.now()}`,
      receiptNumber,
      contractId: contract.id,
      contractNumber: contract.contractNumber,
      customerId: contract.customerId,
      customerName: contract.customerName,
      customerPhone: contract.customerPhone,
      paymentDate: formattedDate,
      paymentType,
      totalAmount,
      currency: contract.currency,
      principalPortion,
      interestPortion,
      penaltyPortion,
      paymentMethod,
      notes,
      receivedBy,
      createdAt: formattedDate,
    };

    setTransactions((prev) => [newTx, ...prev]);

    // Update contract balance and schedule
    setContracts((prev) =>
      prev.map((c) => {
        if (c.id !== contractId) return c;

        const newRemaining = Math.max(0, c.remainingPrincipal - principalPortion);
        const newPrincipalPaid = c.totalPrincipalPaid + principalPortion;
        const newInterestPaid = c.totalInterestPaid + interestPortion;
        const isCompleted = paymentType === 'full_payoff' || newRemaining <= 0;

        // Mark schedules as paid if matching
        let remainingInterestToApply = interestPortion;
        let remainingPrincipalToApply = principalPortion;

        const updatedSchedule = c.schedule.map((item) => {
          if (item.status === 'paid') return item;

          if (remainingInterestToApply >= item.expectedInterest && (item.expectedPrincipal === 0 || remainingPrincipalToApply >= item.expectedPrincipal)) {
            remainingInterestToApply -= item.expectedInterest;
            remainingPrincipalToApply -= item.expectedPrincipal;
            return {
              ...item,
              paidAmount: item.totalDue,
              paidDate: formattedDate.split(' ')[0],
              status: 'paid' as const,
            };
          }
          return item;
        });

        // Update collateral status if completed
        let updatedCollateral = c.collateral;
        if (isCompleted && updatedCollateral && updatedCollateral.status === 'in_vault') {
          updatedCollateral = {
            ...updatedCollateral,
            status: 'returned',
            releasedDate: formattedDate.split(' ')[0],
          };
        }

        return {
          ...c,
          remainingPrincipal: newRemaining,
          totalPrincipalPaid: newPrincipalPaid,
          totalInterestPaid: newInterestPaid,
          latePenaltyFee: Math.max(0, c.latePenaltyFee - penaltyPortion),
          status: isCompleted ? 'completed' : c.status === 'overdue' && penaltyPortion > 0 ? 'active' : c.status,
          schedule: updatedSchedule,
          collateral: updatedCollateral,
        };
      })
    );

    // Record cashflow
    addCashflow({
      date: formattedDate.split(' ')[0],
      type: 'income',
      category: paymentType === 'interest_only' ? 'ចំណូលការប្រាក់' : 'ប្រមូលប្រាក់ដើម និងការប្រាក់',
      description: `បង្កាន់ដៃ #${receiptNumber} - ${contract.contractNumber} (${contract.customerName})`,
      amount: totalAmount,
      currency: contract.currency,
      referenceId: newTx.id,
      createdBy: receivedBy,
    });

    return newTx;
  };

  const addCashflow = (entry: Omit<CashflowEntry, 'id'>) => {
    const newEntry: CashflowEntry = {
      ...entry,
      id: `cf-${Date.now()}`,
    };
    setCashflows((prev) => [newEntry, ...prev]);
  };

  const releaseCollateral = (contractId: string) => {
    setContracts((prev) =>
      prev.map((c) => {
        if (c.id !== contractId || !c.collateral) return c;
        return {
          ...c,
          collateral: {
            ...c.collateral,
            status: 'returned',
            releasedDate: new Date().toISOString().split('T')[0],
          },
        };
      })
    );
  };

  const forecloseCollateral = (contractId: string, notes?: string) => {
    setContracts((prev) =>
      prev.map((c) => {
        if (c.id !== contractId) return c;
        return {
          ...c,
          status: 'foreclosed',
          notes: notes ? `${c.notes || ''}\n[រឹបអូស]: ${notes}` : c.notes,
          collateral: c.collateral
            ? {
                ...c.collateral,
                status: 'foreclosed',
                foreclosedDate: new Date().toISOString().split('T')[0],
              }
            : undefined,
        };
      })
    );
  };

  const extendContract = (contractId: string, additionalMonths: number) => {
    setContracts((prev) =>
      prev.map((c) => {
        if (c.id !== contractId) return c;
        const currentDue = new Date(c.dueDate);
        currentDue.setMonth(currentDue.getMonth() + additionalMonths);
        const newDueDate = currentDue.toISOString().split('T')[0];
        return {
          ...c,
          termMonths: c.termMonths + additionalMonths,
          dueDate: newDueDate,
          status: 'extended',
        };
      })
    );
  };

  const resetToDemoData = () => {
    setSettings(initialSettings);
    setCustomers(initialCustomers);
    setContracts(initialContracts);
    setTransactions(initialTransactions);
    setCashflows(initialCashflows);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.CUSTOMERS);
    localStorage.removeItem(STORAGE_KEYS.CONTRACTS);
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.CASHFLOWS);
  };

  const exportDatabaseJson = () => {
    const data = {
      settings,
      customers,
      contracts,
      transactions,
      cashflows,
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(data, null, 2);
  };

  const importDatabaseJson = (jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr);
      if (data.customers && data.contracts) {
        if (data.settings) setSettings(data.settings);
        if (data.customers) setCustomers(data.customers);
        if (data.contracts) setContracts(data.contracts);
        if (data.transactions) setTransactions(data.transactions);
        if (data.cashflows) setCashflows(data.cashflows);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  return (
    <PawnContext.Provider
      value={{
        settings,
        updateSettings,
        customers,
        addCustomer,
        updateCustomer,
        contracts,
        addContract,
        updateContract,
        transactions,
        recordPayment,
        cashflows,
        addCashflow,
        releaseCollateral,
        forecloseCollateral,
        extendContract,
        resetToDemoData,
        exportDatabaseJson,
        importDatabaseJson,
      }}
    >
      {children}
    </PawnContext.Provider>
  );
};

export const usePawn = () => {
  const context = useContext(PawnContext);
  if (!context) {
    throw new Error('usePawn must be used within a PawnProvider');
  }
  return context;
};
