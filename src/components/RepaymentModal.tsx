import React, { useState } from 'react';
import { LoanContract, PaymentTransaction, PaymentMethod, PaymentType } from '../types';
import { formatMoney, getPaymentTypeName } from '../utils/formatters';
import { X, DollarSign, CheckCircle2, AlertTriangle, Printer } from 'lucide-react';

interface RepaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: LoanContract | null;
  onProcessPayment: (transaction: PaymentTransaction, updatedContract: LoanContract) => void;
  onPrintReceipt: (transaction: PaymentTransaction) => void;
}

export const RepaymentModal: React.FC<RepaymentModalProps> = ({
  isOpen,
  onClose,
  contract,
  onProcessPayment,
  onPrintReceipt,
}) => {
  if (!isOpen || !contract) return null;

  const [paymentType, setPaymentType] = useState<PaymentType>('interest_only');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('aba_khqr');
  const [customPrincipalAmount, setCustomPrincipalAmount] = useState<number>(0);
  const [penaltyAmount, setPenaltyAmount] = useState<number>(contract.latePenaltyFee || 0);
  const [notes, setNotes] = useState('');

  // Find next pending schedule item
  const nextPendingItem = contract.schedule.find((s) => s.status === 'pending' || s.status === 'late');
  const standardMonthlyInterest = (contract.remainingPrincipal * contract.interestRateMonthly) / 100;

  // Calculate payment portions based on payment type
  let principalPortion = 0;
  let interestPortion = 0;

  if (paymentType === 'interest_only') {
    interestPortion = nextPendingItem ? nextPendingItem.expectedInterest : standardMonthlyInterest;
    principalPortion = 0;
  } else if (paymentType === 'installment') {
    interestPortion = nextPendingItem ? nextPendingItem.expectedInterest : standardMonthlyInterest;
    principalPortion = nextPendingItem ? nextPendingItem.expectedPrincipal : (contract.remainingPrincipal / contract.termMonths);
  } else if (paymentType === 'full_payoff') {
    interestPortion = standardMonthlyInterest;
    principalPortion = contract.remainingPrincipal;
  } else if (paymentType === 'principal_only') {
    principalPortion = customPrincipalAmount;
    interestPortion = 0;
  }

  const totalAmountToPay = principalPortion + interestPortion + Number(penaltyAmount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (totalAmountToPay <= 0) return;

    const receiptNumber = `RCP-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;

    const newTx: PaymentTransaction = {
      id: `tx-${Date.now()}`,
      receiptNumber,
      contractId: contract.id,
      contractNumber: contract.contractNumber,
      customerId: contract.customerId,
      customerName: contract.customerName,
      customerPhone: contract.customerPhone,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentType,
      totalAmount: totalAmountToPay,
      currency: contract.currency,
      principalPortion,
      interestPortion,
      penaltyPortion: Number(penaltyAmount),
      paymentMethod,
      notes,
      receivedBy: 'បេឡាធិការ',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };

    // Update contract
    const newRemainingPrincipal = Math.max(0, contract.remainingPrincipal - principalPortion);
    const newTotalPrincipalPaid = contract.totalPrincipalPaid + principalPortion;
    const newTotalInterestPaid = contract.totalInterestPaid + interestPortion;

    // Update schedule
    const updatedSchedule = [...contract.schedule];
    if (nextPendingItem) {
      const idx = updatedSchedule.findIndex((s) => s.periodNumber === nextPendingItem.periodNumber);
      if (idx !== -1) {
        updatedSchedule[idx] = {
          ...updatedSchedule[idx],
          paidAmount: updatedSchedule[idx].paidAmount + interestPortion + principalPortion,
          status: newRemainingPrincipal === 0 || paymentType === 'interest_only' || paymentType === 'installment' ? 'paid' : 'partial',
          paidDate: new Date().toISOString().split('T')[0],
        };
      }
    }

    const isFullyPaid = newRemainingPrincipal <= 0;
    const updatedContract: LoanContract = {
      ...contract,
      remainingPrincipal: newRemainingPrincipal,
      totalPrincipalPaid: newTotalPrincipalPaid,
      totalInterestPaid: newTotalInterestPaid,
      latePenaltyFee: 0,
      status: isFullyPaid ? 'completed' : contract.status === 'overdue' ? 'active' : contract.status,
      schedule: updatedSchedule,
      collateral: contract.collateral
        ? {
            ...contract.collateral,
            status: isFullyPaid ? 'returned' : contract.collateral.status,
            releasedDate: isFullyPaid ? new Date().toISOString().split('T')[0] : undefined,
          }
        : undefined,
    };

    onProcessPayment(newTx, updatedContract);
    onClose();
    onPrintReceipt(newTx);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">ទទួលប្រាក់កម្ចី / ការប្រាក់</h3>
              <p className="text-xs text-slate-500">
                កិច្ចសន្យា: <strong className="font-mono text-slate-700">{contract.contractNumber}</strong> · អតិថិជន: <strong>{contract.customerName}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Contract Snapshot */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block">ប្រាក់ដើមនៅសល់:</span>
              <strong className="text-base text-slate-900 tabular-nums">
                {formatMoney(contract.remainingPrincipal, contract.currency)}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block">ការប្រាក់ក្នុង១ខែ:</span>
              <strong className="text-base text-emerald-700 tabular-nums">
                {formatMoney(standardMonthlyInterest, contract.currency)} ({contract.interestRateMonthly}%)
              </strong>
            </div>
            {contract.collateral && (
              <div className="col-span-2 pt-2 border-t border-slate-200 flex items-center justify-between">
                <span>ទ្រព្យបញ្ចាំ: <strong>{contract.collateral.name}</strong></span>
                <span className="text-slate-500 font-mono text-[11px]">{contract.collateral.storageLocation}</span>
              </div>
            )}
          </div>

          {/* Payment Type Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              ជ្រើសរើសប្រភេទការទូទាត់ *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentType('interest_only')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  paymentType === 'interest_only'
                    ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950 ring-1 ring-emerald-500'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="text-xs font-bold">បង់តែការប្រាក់</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {formatMoney(interestPortion || standardMonthlyInterest, contract.currency)}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentType('installment')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  paymentType === 'installment'
                    ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950 ring-1 ring-emerald-500'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="text-xs font-bold">បង់រំលស់ (ដើម + ការ)</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  តាមកាលវិភាគប្រចាំខែ
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentType('full_payoff')}
                className={`p-3 rounded-xl border text-left transition-all sm:col-span-2 ${
                  paymentType === 'full_payoff'
                    ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950 ring-1 ring-emerald-500'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold">បង់ផ្តាច់កិច្ចសន្យាទាំងស្រុង (Full Payoff)</div>
                  <span className="text-[11px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded">
                    ដោះលែងទ្រព្យវិញ
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  សងដើមនៅសល់ {formatMoney(contract.remainingPrincipal, contract.currency)} + ការប្រាក់
                </div>
              </button>
            </div>
          </div>

          {/* Penalty Fee if applicable */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ប្រាក់ផាកពិន័យយឺត (បើមាន)
              </label>
              <input
                type="number"
                value={penaltyAmount}
                onChange={(e) => setPenaltyAmount(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs tabular-nums focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                វិធីទូទាត់ប្រាក់ *
              </label>
              <select
                value={paymentMethod}
                onChange={(e: any) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="aba_khqr">KHQR / ABA Bank (ស្កេនបង់ប្រាក់)</option>
                <option value="cash">សាច់ប្រាក់សុទ្ធ (Cash)</option>
                <option value="bank_transfer">ផ្ទេរតាមគណនីធនាគារ</option>
                <option value="wing">Wing / វីង</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ចំណាំលើវិក្កយបត្រ (Notes)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ចំណាំបន្ថែមលើបង្កាន់ដៃ..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Total Breakdown Summary Card */}
          <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>ប្រាក់ដើម:</span>
              <span className="tabular-nums font-mono">{formatMoney(principalPortion, contract.currency)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>ការប្រាក់:</span>
              <span className="tabular-nums font-mono">{formatMoney(interestPortion, contract.currency)}</span>
            </div>
            {penaltyAmount > 0 && (
              <div className="flex items-center justify-between text-xs text-amber-400">
                <span>ផាកពិន័យយឺត:</span>
                <span className="tabular-nums font-mono">{formatMoney(penaltyAmount, contract.currency)}</span>
              </div>
            )}
            <div className="pt-2 border-t border-slate-700 flex items-center justify-between text-sm font-bold">
              <span>ទឹកប្រាក់សរុបត្រូវទទួល:</span>
              <span className="text-xl text-emerald-400 tabular-nums font-bold">
                {formatMoney(totalAmountToPay, contract.currency)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              បោះបង់
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>ទទួលប្រាក់ & ចេញបង្កាន់ដៃ</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
