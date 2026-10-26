import React, { useState, useEffect } from 'react';
import { LoanContract, PaymentType, PaymentMethod, PaymentTransaction } from '../types';
import { formatMoney, getCollateralCategoryName } from '../utils/formatters';
import { checkOverdueDays } from '../utils/loanCalculator';
import { X, CheckCircle2, AlertTriangle, CreditCard } from 'lucide-react';

interface PaymentModalProps {
  contract: LoanContract;
  onClose: () => void;
  onRecordPayment: (paymentData: {
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
  onPaymentSuccess?: (tx: PaymentTransaction) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  contract,
  onClose,
  onRecordPayment,
  onPaymentSuccess,
}) => {
  const [paymentType, setPaymentType] = useState<PaymentType>(
    contract.interestType === 'equal_installment' ? 'installment' : 'interest_only'
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('aba_khqr');
  const [receivedBy, setReceivedBy] = useState('កញ្ញា រតនា (បេឡា)');
  const [notes, setNotes] = useState('');

  // Portions
  const [principalPortion, setPrincipalPortion] = useState<number>(0);
  const [interestPortion, setInterestPortion] = useState<number>(0);
  const [penaltyPortion, setPenaltyPortion] = useState<number>(contract.latePenaltyFee || 0);

  // Auto calculate defaults on type change
  useEffect(() => {
    const monthlyInterest = (contract.remainingPrincipal * contract.interestRateMonthly) / 100;
    const overdueDays = checkOverdueDays(contract.dueDate);
    const calculatedPenalty = contract.latePenaltyFee > 0 
      ? contract.latePenaltyFee 
      : overdueDays > 0 
        ? Math.round(monthlyInterest * 0.1) 
        : 0;

    setPenaltyPortion(calculatedPenalty);

    if (paymentType === 'interest_only') {
      setInterestPortion(monthlyInterest);
      setPrincipalPortion(0);
    } else if (paymentType === 'installment') {
      const estimatedMonthlyPrincipal = Math.round(contract.remainingPrincipal / Math.max(1, contract.termMonths));
      setPrincipalPortion(estimatedMonthlyPrincipal);
      setInterestPortion(monthlyInterest);
    } else if (paymentType === 'principal_only') {
      setPrincipalPortion(Math.min(500, contract.remainingPrincipal));
      setInterestPortion(0);
    } else if (paymentType === 'full_payoff') {
      setPrincipalPortion(contract.remainingPrincipal);
      setInterestPortion(monthlyInterest);
    }
  }, [paymentType, contract]);

  const totalAmount = (Number(principalPortion) || 0) + (Number(interestPortion) || 0) + (Number(penaltyPortion) || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (totalAmount <= 0) {
      alert('សូមបញ្ចូលចំនួនទឹកប្រាក់ដែលត្រូវបង់');
      return;
    }

    const tx = onRecordPayment({
      contractId: contract.id,
      paymentType,
      totalAmount,
      principalPortion: Number(principalPortion) || 0,
      interestPortion: Number(interestPortion) || 0,
      penaltyPortion: Number(penaltyPortion) || 0,
      paymentMethod,
      notes: notes.trim(),
      receivedBy: receivedBy.trim(),
    });

    if (onPaymentSuccess) {
      onPaymentSuccess(tx);
    } else {
      onClose();
    }
  };

  const isOverdue = checkOverdueDays(contract.dueDate) > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full my-8 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-600" />
            <h2 className="font-semibold text-slate-800">
              ទទួលប្រាក់ និងចេញបង្កាន់ដៃ (Receive Payment)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contract Summary Strip */}
        <div className="px-6 py-3 bg-emerald-50/50 border-b border-emerald-100 flex items-center justify-between text-xs">
          <div>
            <span className="font-mono font-bold text-slate-800">{contract.contractNumber}</span>
            <span className="mx-2 text-slate-300">|</span>
            <span className="font-medium text-slate-700">{contract.customerName}</span>
          </div>
          <div className="text-right">
            <span className="text-slate-500">ដើមនៅសល់: </span>
            <span className="font-bold text-emerald-800 font-mono">
              {formatMoney(contract.remainingPrincipal, contract.currency)}
            </span>
          </div>
        </div>

        {isOverdue && (
          <div className="mx-6 mt-4 p-2.5 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-800">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>
              កិច្ចសន្យានេះបានហួសកាលកំណត់ចំនួន <strong>{checkOverdueDays(contract.dueDate)} ថ្ងៃ</strong>! សូមពិនិត្យប្រាក់ផាកពិន័យ។
            </span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Payment Type Selection */}
          <div>
            <label className="block font-medium text-slate-700 mb-1.5">ប្រភេទនៃការបង់ប្រាក់</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentType('interest_only')}
                className={`py-2 px-3 text-left rounded-lg border transition-all cursor-pointer ${
                  paymentType === 'interest_only'
                    ? 'border-emerald-600 bg-emerald-50/60 text-emerald-900 font-semibold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div>១. បង់តែការប្រាក់</div>
                <div className="text-[10px] text-slate-500 mt-0.5">រក្សាប្រាក់ដើមដដែល</div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentType('installment')}
                className={`py-2 px-3 text-left rounded-lg border transition-all cursor-pointer ${
                  paymentType === 'installment'
                    ? 'border-emerald-600 bg-emerald-50/60 text-emerald-900 font-semibold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div>២. បង់រំលស់ (ដើម+ការ)</div>
                <div className="text-[10px] text-slate-500 mt-0.5">កាត់បន្ថយដើមមួយចំនួន</div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentType('principal_only')}
                className={`py-2 px-3 text-left rounded-lg border transition-all cursor-pointer ${
                  paymentType === 'principal_only'
                    ? 'border-emerald-600 bg-emerald-50/60 text-emerald-900 font-semibold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div>៣. បង់កាត់ប្រាក់ដើម</div>
                <div className="text-[10px] text-slate-500 mt-0.5">កាត់ដើមសុទ្ធ</div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentType('full_payoff')}
                className={`py-2 px-3 text-left rounded-lg border transition-all cursor-pointer ${
                  paymentType === 'full_payoff'
                    ? 'border-emerald-600 bg-emerald-50/60 text-emerald-900 font-semibold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div>៤. បង់ផ្តាច់កិច្ចសន្យា</div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {contract.collateral ? 'ដោះលែងទ្រព្យបញ្ចាំ' : 'បញ្ចប់កិច្ចសន្យា'}
                </div>
              </button>
            </div>
          </div>

          {/* Breakdown Fields */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <span className="font-semibold text-slate-800 block text-[11px] uppercase tracking-wider">
              ព័ត៌មានលម្អិតទឹកប្រាក់ ({contract.currency})
            </span>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-slate-600 mb-1">ការប្រាក់</label>
                <input
                  type="number"
                  step="any"
                  value={interestPortion}
                  onChange={(e) => setInterestPortion(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono font-medium focus:outline-none focus:border-emerald-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">ប្រាក់ដើម</label>
                <input
                  type="number"
                  step="any"
                  value={principalPortion}
                  onChange={(e) => setPrincipalPortion(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono font-medium focus:outline-none focus:border-emerald-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">ផាកពិន័យយឺត</label>
                <input
                  type="number"
                  step="any"
                  value={penaltyPortion}
                  onChange={(e) => setPenaltyPortion(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono font-medium focus:outline-none focus:border-emerald-500 bg-white"
                />
              </div>
            </div>

            {/* Total Display */}
            <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
              <span className="font-bold text-slate-700">ទឹកប្រាក់សរុបត្រូវបង់:</span>
              <span className="text-lg font-bold text-emerald-700 font-mono">
                {formatMoney(totalAmount, contract.currency)}
              </span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">វិធីទូទាត់</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500 bg-white"
              >
                <option value="aba_khqr">KHQR / ABA Bank</option>
                <option value="cash">សាច់ប្រាក់សុទ្ធ (Cash)</option>
                <option value="bank_transfer">ផ្ទេរប្រាក់ធនាគារ</option>
                <option value="wing">Wing / វីង</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">អ្នកទទួលប្រាក់ (បេឡា)</label>
              <input
                type="text"
                value={receivedBy}
                onChange={(e) => setReceivedBy(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">ចំណាំផ្សេងៗ</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ឧ. បង់ការប្រាក់ខែទី២ តាម KHQR..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 font-medium transition-colors cursor-pointer"
            >
              បោះបង់
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors shadow-xs cursor-pointer"
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
