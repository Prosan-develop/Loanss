import React, { useState } from 'react';
import { Customer, LoanType, CollateralCategory, Currency, InterestType, PaymentFrequency, LoanContract, Collateral } from '../types';
import { calculateRepaymentSchedule } from '../utils/loanCalculator';
import { formatMoney, getCollateralCategoryName } from '../utils/formatters';
import { X, FileText, Plus, Calculator, CheckCircle2, ShieldCheck } from 'lucide-react';

interface NewContractModalProps {
  isOpen?: boolean;
  customers: Customer[];
  defaultInterestRate: number;
  onClose: () => void;
  onSave?: (contractData: Omit<LoanContract, 'id' | 'totalInterestPaid' | 'totalPrincipalPaid' | 'remainingPrincipal' | 'latePenaltyFee' | 'createdAt'>) => LoanContract;
  onCreateContract?: (contract: LoanContract) => void;
  onAddCustomer?: (customer: Customer) => void;
  onOpenNewCustomerModal?: () => void;
  onContractCreated?: (contract: LoanContract, printImmediately?: boolean) => void;
  preselectedCustomer?: Customer | null;
}

export const NewContractModal: React.FC<NewContractModalProps> = ({
  isOpen = true,
  customers,
  defaultInterestRate,
  onClose,
  onSave,
  onCreateContract,
  onAddCustomer,
  onOpenNewCustomerModal,
  onContractCreated,
  preselectedCustomer,
}) => {
  if (isOpen === false) return null;

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    preselectedCustomer ? preselectedCustomer.id : (customers[0]?.id || '')
  );
  const [loanType, setLoanType] = useState<LoanType>('pawn');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [principalAmount, setPrincipalAmount] = useState<number>(1000);
  const [interestRateMonthly, setInterestRateMonthly] = useState<number>(defaultInterestRate || 2.5);
  const [termMonths, setTermMonths] = useState<number>(3);
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [interestType, setInterestType] = useState<InterestType>('interest_only');
  const [paymentFrequency, setPaymentFrequency] = useState<PaymentFrequency>('monthly');
  const [notes, setNotes] = useState<string>('');
  const [createdBy, setCreatedBy] = useState<string>('អ្នកគ្រប់គ្រងហាង');

  // Collateral Details
  const [collateralCategory, setCollateralCategory] = useState<CollateralCategory>('vehicle');
  const [collateralName, setCollateralName] = useState<string>('');
  const [collateralValue, setCollateralValue] = useState<number>(1500);
  const [collateralSerial, setCollateralSerial] = useState<string>('');
  const [collateralStorage, setCollateralStorage] = useState<string>('ទូសុវត្ថិភាព A-01');
  const [collateralDesc, setCollateralDesc] = useState<string>('');
  const [collateralWeightChi, setCollateralWeightChi] = useState<number>(0);

  const [activeStep, setActiveStep] = useState<1 | 2>(1);

  // Selected customer object
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  // Due Date calculation
  const calculateDueDate = (): string => {
    const start = new Date(startDate);
    start.setMonth(start.getMonth() + Number(termMonths));
    return start.toISOString().split('T')[0];
  };

  const schedulePreview = calculateRepaymentSchedule(
    Number(principalAmount) || 0,
    Number(interestRateMonthly) || 0,
    Number(termMonths) || 1,
    startDate,
    interestType,
    paymentFrequency
  );

  const totalExpectedInterest = schedulePreview.reduce((sum, item) => sum + item.expectedInterest, 0);

  const handleSubmit = (printImmediately = false) => {
    if (!selectedCustomer) {
      alert('សូមជ្រើសរើសអតិថិជន');
      return;
    }
    if (!principalAmount || principalAmount <= 0) {
      alert('សូមបញ្ចូលចំនួនទឹកប្រាក់កម្ចី');
      return;
    }
    if (loanType === 'pawn' && !collateralName.trim()) {
      alert('សូមបញ្ចូលឈ្មោះទ្រព្យបញ្ចាំ');
      return;
    }

    const prefix = loanType === 'pawn' ? 'PW' : 'LN';
    const contractNumber = `${prefix}-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    let collateralObj: Collateral | undefined = undefined;
    if (loanType === 'pawn') {
      collateralObj = {
        id: `col-${Date.now()}`,
        category: collateralCategory,
        name: collateralName.trim(),
        estimatedValue: Number(collateralValue) || 0,
        currency,
        description: collateralDesc.trim() || 'ទ្រព្យស្ថិតក្នុងស្ថានភាពល្អ',
        serialOrPlateNumber: collateralSerial.trim() || undefined,
        storageLocation: collateralStorage.trim() || 'ទូសុវត្ថិភាព A-01',
        status: 'in_vault',
        weightChi: collateralCategory === 'gold' ? Number(collateralWeightChi) : undefined,
      };
    }

    const contractDataPayload = {
      contractNumber,
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.nameKhmer,
      customerPhone: selectedCustomer.phone,
      customerNationalId: selectedCustomer.nationalId,
      loanType,
      collateral: collateralObj,
      principalAmount: Number(principalAmount),
      currency,
      interestRateMonthly: Number(interestRateMonthly),
      termMonths: Number(termMonths),
      startDate,
      dueDate: calculateDueDate(),
      paymentFrequency,
      interestType,
      status: 'active' as const,
      schedule: schedulePreview,
      notes: notes.trim(),
      createdBy: createdBy.trim(),
    };

    let newContract: LoanContract;
    if (onSave) {
      newContract = onSave(contractDataPayload);
    } else {
      newContract = {
        ...contractDataPayload,
        id: `con-${Date.now()}`,
        totalInterestPaid: 0,
        totalPrincipalPaid: 0,
        remainingPrincipal: Number(principalAmount),
        latePenaltyFee: 0,
        createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      };
      if (onCreateContract) {
        onCreateContract(newContract);
      }
    }

    if (onContractCreated) {
      onContractCreated(newContract, printImmediately);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full my-8 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            <h2 className="font-semibold text-slate-800">
              បង្កើតកិច្ចសន្យាថ្មី (New Pawn / Loan Contract)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab / Step Indicator */}
        <div className="flex border-b border-slate-200 text-xs font-medium">
          <button
            onClick={() => setActiveStep(1)}
            className={`flex-1 py-3 text-center transition-colors cursor-pointer ${
              activeStep === 1
                ? 'border-b-2 border-emerald-600 text-emerald-700 bg-emerald-50/30 font-semibold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            ជំហានទី ១: ព័ត៌មានកម្ចី & ទ្រព្យបញ្ចាំ
          </button>
          <button
            onClick={() => setActiveStep(2)}
            className={`flex-1 py-3 text-center transition-colors cursor-pointer ${
              activeStep === 2
                ? 'border-b-2 border-emerald-600 text-emerald-700 bg-emerald-50/30 font-semibold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            ជំហានទី ២: កាលវិភាគបង់ប្រាក់ & ពិនិត្យ
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 text-xs max-h-[70vh] overflow-y-auto">
          {activeStep === 1 ? (
            <div className="space-y-5">
              {/* Customer Selection */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-medium text-slate-700">
                    ជ្រើសរើសអតិថិជនអ្នកខ្ចី <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={onOpenNewCustomerModal}
                    className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-medium cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ បន្ថែមអតិថិជនថ្មី</span>
                  </button>
                </div>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500 bg-white"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameKhmer} ({c.phone}) - អត្តសញ្ញាណ: {c.nationalId}
                    </option>
                  ))}
                </select>
                {selectedCustomer && (
                  <div className="mt-2 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded border border-slate-200 flex justify-between">
                    <span>
                      អាសយដ្ឋាន: <strong className="text-slate-700">{selectedCustomer.address}</strong>
                    </span>
                    <span>
                      ទំនុកចិត្ត: <strong className="text-emerald-700">{selectedCustomer.status}</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Loan Type & Currency */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1.5">ប្រភេទកិច្ចសន្យា</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setLoanType('pawn')}
                      className={`flex-1 py-2 px-3 rounded-lg border text-center transition-all cursor-pointer ${
                        loanType === 'pawn'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-semibold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      បញ្ចាំទ្រព្យ (Pawn)
                    </button>
                    <button
                      type="button"
                      onClick={() => setLoanType('microloan')}
                      className={`flex-1 py-2 px-3 rounded-lg border text-center transition-all cursor-pointer ${
                        loanType === 'microloan'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-semibold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      កម្ចីបង់រំលស់ (Loan)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1.5">រូបិយប័ណ្ណ (Currency)</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrency('USD')}
                      className={`flex-1 py-2 px-3 rounded-lg border text-center transition-all cursor-pointer ${
                        currency === 'USD'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-semibold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      ដុល្លារ ($ USD)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrency('KHR')}
                      className={`flex-1 py-2 px-3 rounded-lg border text-center transition-all cursor-pointer ${
                        currency === 'KHR'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-semibold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      រៀល (៛ KHR)
                    </button>
                  </div>
                </div>
              </div>

              {/* Collateral Details (If Pawn) */}
              {loanType === 'pawn' && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center gap-2 text-slate-800 font-semibold text-xs">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>ព័ត៌មានទ្រព្យបញ្ចាំ (Collateral Items)</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 mb-1">ប្រភេទទ្រព្យ</label>
                      <select
                        value={collateralCategory}
                        onChange={(e) => setCollateralCategory(e.target.value as CollateralCategory)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:outline-none bg-white"
                      >
                        <option value="vehicle">យានយន្ត / ម៉ូតូ / ឡាន</option>
                        <option value="gold">មាស / ផ្លាកទីន</option>
                        <option value="land_title">ប្លង់ដី / ផ្ទះ</option>
                        <option value="electronics">គ្រឿងអេឡិចត្រូនិក / ទូរស័ព្ទ / កុំព្យូទ័រ</option>
                        <option value="jewelry">គ្រឿងអលង្ការ / ពេជ្រ</option>
                        <option value="other">ទ្រព្យផ្សេងៗ</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-600 mb-1">
                        ឈ្មោះទ្រព្យ <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={collateralName}
                        onChange={(e) => setCollateralName(e.target.value)}
                        placeholder="ឧ. ម៉ូតូ Honda Dream 125 ឆ្នាំ ២០២៤"
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:outline-none bg-white"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-600 mb-1">តម្លៃប៉ាន់ស្មាន ({currency})</label>
                      <input
                        type="number"
                        value={collateralValue}
                        onChange={(e) => setCollateralValue(parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono focus:outline-none bg-white"
                      />
                    </div>

                    {collateralCategory === 'gold' ? (
                      <div>
                        <label className="block text-slate-600 mb-1">ទម្ងន់មាស (គិតជា ជី)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={collateralWeightChi}
                          onChange={(e) => setCollateralWeightChi(parseFloat(e.target.value) || 0)}
                          placeholder="ឧ. 5"
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono focus:outline-none bg-white"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-slate-600 mb-1">លេខសម្គាល់ / ស្លាកលេខ / IMEI</label>
                        <input
                          type="text"
                          value={collateralSerial}
                          onChange={(e) => setCollateralSerial(e.target.value)}
                          placeholder="ភ្នំពេញ 1KM-9823 / IMEI..."
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:outline-none bg-white"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-slate-600 mb-1">ទីតាំងរក្សាទុកក្នុងឃ្លាំង</label>
                      <input
                        type="text"
                        value={collateralStorage}
                        onChange={(e) => setCollateralStorage(e.target.value)}
                        placeholder="ទូសុវត្ថិភាព A-01"
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:outline-none bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1">ពិពណ៌នាស្ថានភាពទ្រព្យ</label>
                    <input
                      type="text"
                      value={collateralDesc}
                      onChange={(e) => setCollateralDesc(e.target.value)}
                      placeholder="ម៉ាស៊ីនស្អាត ៩៥% មានសោ២គ្រាប់ និងកាតគ្រីច្បាប់ដើម..."
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:outline-none bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Financial Terms */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    ទឹកប្រាក់កម្ចី ({currency}) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={principalAmount}
                    onChange={(e) => setPrincipalAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-medium focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    អត្រាការប្រាក់ (% / ខែ)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={interestRateMonthly}
                    onChange={(e) => setInterestRateMonthly(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-medium focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    រយៈពេលកម្ចី (ខែ)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={termMonths}
                    onChange={(e) => setTermMonths(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-medium focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              {/* Repayment Style & Dates */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">របៀបគណនាការប្រាក់</label>
                  <select
                    value={interestType}
                    onChange={(e) => setInterestType(e.target.value as InterestType)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500 bg-white"
                  >
                    <option value="interest_only">បង់តែការប្រាក់រាល់ខែ (សងដើមចុងគ្រា)</option>
                    <option value="equal_installment">បង់រំលស់ដើម + ការប្រាក់ស្មើគ្នា</option>
                    <option value="fixed_end">សងដើម និងការប្រាក់ពេលចប់</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">កាលបរិច្ឆេទចាប់ផ្តើម</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">កាលបរិច្ឆេទផុតកំណត់</label>
                  <input
                    type="date"
                    value={calculateDueDate()}
                    readOnly
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-100 rounded-lg text-slate-600 cursor-not-allowed font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">ចំណាំបន្ថែម</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="លក្ខខណ្ឌបន្ថែម..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          ) : (
            /* Step 2: Schedule Preview */
            <div className="space-y-4">
              <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 grid grid-cols-3 gap-4">
                <div>
                  <span className="text-slate-500 block">ប្រាក់ដើមកម្ចីសរុប:</span>
                  <span className="text-base font-bold text-slate-900 font-mono">
                    {formatMoney(Number(principalAmount) || 0, currency)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">ការប្រាក់សរុបប៉ាន់ស្មាន:</span>
                  <span className="text-base font-bold text-emerald-700 font-mono">
                    {formatMoney(totalExpectedInterest, currency)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">ទឹកប្រាក់សរុបត្រូវប្រមូល:</span>
                  <span className="text-base font-bold text-slate-900 font-mono">
                    {formatMoney((Number(principalAmount) || 0) + totalExpectedInterest, currency)}
                  </span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-100 px-4 py-2 font-semibold text-slate-700 flex justify-between items-center">
                  <span>កាលវិភាគបង់ប្រាក់ ({schedulePreview.length} លើក)</span>
                  <span className="text-[11px] text-slate-500">គណនាស្វ័យប្រវត្តិ</span>
                </div>
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                    <tr>
                      <th className="py-2 px-3 text-center">លើកទី</th>
                      <th className="py-2 px-3">ថ្ងៃត្រូវបង់</th>
                      <th className="py-2 px-3 text-right">ប្រាក់ដើម</th>
                      <th className="py-2 px-3 text-right">ការប្រាក់</th>
                      <th className="py-2 px-3 text-right">សរុបត្រូវបង់</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {schedulePreview.map((item) => (
                      <tr key={item.periodNumber} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3 text-center text-slate-600">{item.periodNumber}</td>
                        <td className="py-2 px-3 text-slate-700">{item.dueDate}</td>
                        <td className="py-2 px-3 text-right text-slate-600">
                          {formatMoney(item.expectedPrincipal, currency)}
                        </td>
                        <td className="py-2 px-3 text-right text-emerald-700 font-medium">
                          {formatMoney(item.expectedInterest, currency)}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900">
                          {formatMoney(item.totalDue, currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs">
          <div>
            {activeStep === 2 && (
              <button
                type="button"
                onClick={() => setActiveStep(1)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 font-medium cursor-pointer"
              >
                ត្រឡប់ក្រោយ (Back)
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 font-medium cursor-pointer"
            >
              បោះបង់
            </button>

            {activeStep === 1 ? (
              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium shadow-xs cursor-pointer"
              >
                <Calculator className="w-4 h-4" />
                <span>ពិនិត្យកាលវិភាគ & បន្ទាប់</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleSubmit(false)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-medium shadow-xs cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>រក្សាទុកកិច្ចសន្យា</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit(true)}
                  className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium shadow-xs cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>រក្សាទុក & បោះពុម្ពកិច្ចសន្យា</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
