import React from 'react';
import { PaymentTransaction, LoanContract, ShopSettings } from '../types';
import { formatMoney, getPaymentMethodName, getPaymentTypeName, getCollateralCategoryName } from '../utils/formatters';
import { Printer, X, CheckCircle, ShieldCheck } from 'lucide-react';

interface PrintReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction?: PaymentTransaction | null;
  contract?: LoanContract | null;
  shopSettings: ShopSettings;
}

export const PrintReceiptModal: React.FC<PrintReceiptModalProps> = ({
  isOpen,
  onClose,
  transaction,
  contract,
  shopSettings,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl border border-slate-200 max-h-[95vh] overflow-y-auto relative print-page">
        {/* Modal Controls (Hidden in Print) */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6 no-print">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-800">
              {transaction ? 'បង្កាន់ដៃទទួលប្រាក់ផ្លូវការ' : 'លិខិតកិច្ចសន្យាខ្ចីប្រាក់ & បញ្ចាំ'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>បោះពុម្ព (Print)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* --- RECEIPT CONTENT --- */}
        {transaction && (
          <div className="text-slate-900 space-y-6 p-4 border border-slate-300 rounded-xl bg-white">
            {/* Header */}
            <div className="text-center pb-4 border-b border-dashed border-slate-300">
              <div className="text-xs font-bold text-slate-600 tracking-wider">ព្រះរាជាណាចក្រកម្ពុជា</div>
              <div className="text-xs font-medium text-slate-500 mb-2">ជាតិ សាសនា ព្រះមហាក្សត្រ</div>
              <h2 className="text-xl font-bold text-slate-900 mt-2">{shopSettings.shopNameKhmer}</h2>
              <div className="text-xs text-slate-500">{shopSettings.shopNameLatin}</div>
              <div className="text-[11px] text-slate-500 mt-1">
                អាសយដ្ឋាន: {shopSettings.addressKhmer}
              </div>
              <div className="text-[11px] text-slate-500">
                ទូរស័ព្ទ: {shopSettings.phone} · {shopSettings.businessLicense}
              </div>
              <div className="mt-4 inline-block px-4 py-1 bg-slate-100 border border-slate-300 rounded-md font-bold text-sm">
                បង្កាន់ដៃទទួលប្រាក់ / OFFICIAL RECEIPT
              </div>
            </div>

            {/* Receipt Meta */}
            <div className="grid grid-cols-2 text-xs gap-2">
              <div>
                <span className="text-slate-500">លេខបង្កាន់ដៃ:</span>{' '}
                <strong className="font-mono">{transaction.receiptNumber}</strong>
              </div>
              <div className="text-right">
                <span className="text-slate-500">កាលបរិច្ឆេទ:</span>{' '}
                <strong className="font-mono">{transaction.paymentDate}</strong>
              </div>
              <div>
                <span className="text-slate-500">លេខកិច្ចសន្យា:</span>{' '}
                <strong className="font-mono">{transaction.contractNumber}</strong>
              </div>
              <div className="text-right">
                <span className="text-slate-500">វិធីទូទាត់:</span>{' '}
                <strong>{getPaymentMethodName(transaction.paymentMethod)}</strong>
              </div>
            </div>

            {/* Customer Details */}
            <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1 border border-slate-200">
              <div className="flex justify-between">
                <span>ឈ្មោះអតិថិជន: <strong>{transaction.customerName}</strong></span>
                <span>លេខទូរស័ព្ទ: <strong className="font-mono">{transaction.customerPhone}</strong></span>
              </div>
              <div>
                <span>ប្រភេទការទូទាត់: <strong>{getPaymentTypeName(transaction.paymentType)}</strong></span>
              </div>
            </div>

            {/* Payment Breakdown Table */}
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-300 bg-slate-50 text-slate-700">
                  <th className="py-2 px-3 text-left">បរិយាយ</th>
                  <th className="py-2 px-3 text-right">ចំនួនទឹកប្រាក់ ({transaction.currency})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="py-2 px-3">ប្រាក់ដើមបានបង់ / Principal</td>
                  <td className="py-2 px-3 text-right tabular-nums font-mono font-medium">
                    {formatMoney(transaction.principalPortion, transaction.currency)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3">ការប្រាក់ / Interest Portion</td>
                  <td className="py-2 px-3 text-right tabular-nums font-mono font-medium">
                    {formatMoney(transaction.interestPortion, transaction.currency)}
                  </td>
                </tr>
                {transaction.penaltyPortion > 0 && (
                  <tr>
                    <td className="py-2 px-3">ប្រាក់ពិន័យយឺត / Late Penalty</td>
                    <td className="py-2 px-3 text-right tabular-nums font-mono font-medium text-rose-600">
                      {formatMoney(transaction.penaltyPortion, transaction.currency)}
                    </td>
                  </tr>
                )}
                <tr className="font-bold border-t-2 border-slate-400 bg-slate-100 text-sm">
                  <td className="py-2.5 px-3">ទឹកប្រាក់សរុបបានទទួល / Total Paid</td>
                  <td className="py-2.5 px-3 text-right tabular-nums font-mono text-emerald-800">
                    {formatMoney(transaction.totalAmount, transaction.currency)}
                  </td>
                </tr>
              </tbody>
            </table>

            {transaction.notes && (
              <div className="text-xs text-slate-600 italic">
                សម្គាល់: {transaction.notes}
              </div>
            )}

            {/* Signature Blocks */}
            <div className="grid grid-cols-2 pt-8 text-center text-xs gap-8">
              <div>
                <p className="font-medium text-slate-600 mb-16">ហត្ថលេខាអ្នកប្រគល់ប្រាក់</p>
                <div className="border-t border-slate-300 pt-1 font-semibold">{transaction.customerName}</div>
              </div>
              <div>
                <p className="font-medium text-slate-600 mb-16">ហត្ថលេខាអ្នកទទួលប្រាក់ / បេឡាធិការ</p>
                <div className="border-t border-slate-300 pt-1 font-semibold">{transaction.receivedBy}</div>
              </div>
            </div>

            <div className="text-center text-[10px] text-slate-400 pt-4 border-t border-slate-200">
              សូមរក្សាទុកបង្កាន់ដៃនេះជាភស្តុតាង · អរគុណដែលបានប្រើប្រាស់សេវាកម្មរបស់យើងខ្ញុំ!
            </div>
          </div>
        )}

        {/* --- FORMAL CONTRACT CONTENT --- */}
        {!transaction && contract && (
          <div className="text-slate-900 space-y-5 p-6 border border-slate-300 rounded-xl bg-white text-xs leading-relaxed">
            {/* Header */}
            <div className="text-center pb-3 border-b border-slate-300">
              <div className="text-xs font-bold text-slate-700 tracking-wider">ព្រះរាជាណាចក្រកម្ពុជា</div>
              <div className="text-xs font-medium text-slate-600 mb-2">ជាតិ សាសនា ព្រះមហាក្សត្រ</div>
              <h2 className="text-lg font-bold text-slate-900 mt-2">
                កិច្ចសន្យាខ្ចីប្រាក់ និងបញ្ចាំទ្រព្យ
              </h2>
              <div className="text-[11px] font-mono text-slate-500">
                លេខកូដកិច្ចសន្យា: <strong>{contract.contractNumber}</strong>
              </div>
            </div>

            <p>
              ថ្ងៃនេះ ថ្ងៃទី <strong>{contract.startDate.split('-')[2]}</strong> ខែ <strong>{contract.startDate.split('-')[1]}</strong> ឆ្នាំ <strong>{contract.startDate.split('-')[0]}</strong> នៅ <strong>{shopSettings.shopNameKhmer}</strong> អាសយដ្ឋាន {shopSettings.addressKhmer}។
            </p>

            <div className="space-y-2">
              <p>
                <strong>ភាគី (ក) ម្ចាស់ហាងផ្តល់កម្ចី:</strong> {shopSettings.shopNameKhmer} តំណាងដោយ {contract.createdBy} ទូរស័ព្ទ {shopSettings.phone}។
              </p>
              <p>
                <strong>ភាគី (ខ) អ្នកខ្ចីប្រាក់/បញ្ចាំ:</strong> ឈ្មោះ <strong>{contract.customerName}</strong> កាន់អត្តសញ្ញាណប័ណ្ណលេខ <strong>{contract.customerNationalId}</strong> ទូរស័ព្ទ <strong>{contract.customerPhone}</strong>។
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
              <div className="font-bold text-slate-800">ប្រការ ១. ចំនួនទឹកប្រាក់ និងលក្ខខណ្ឌកម្ចី:</div>
              <div className="grid grid-cols-2 gap-2 pl-3">
                <div>- ចំនួនប្រាក់ខ្ចី: <strong>{formatMoney(contract.principalAmount, contract.currency)}</strong></div>
                <div>- អត្រាការប្រាក់: <strong>{contract.interestRateMonthly}% ក្នុង១ខែ</strong></div>
                <div>- រយៈពេលកិច្ចសន្យា: <strong>{contract.termMonths} ខែ</strong></div>
                <div>- ថ្ងៃផុតកំណត់: <strong>{contract.dueDate}</strong></div>
              </div>
            </div>

            {contract.collateral && (
              <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-200 space-y-1.5">
                <div className="font-bold text-amber-900">ប្រការ ២. ព័ត៌មានទ្រព្យបញ្ចាំតម្កល់ធានា:</div>
                <div className="pl-3 space-y-1">
                  <div>- ទ្រព្យបញ្ចាំ: <strong>{contract.collateral.name}</strong> ({getCollateralCategoryName(contract.collateral.category)})</div>
                  <div>- តម្លៃប៉ាន់ស្មាន: <strong>{formatMoney(contract.collateral.estimatedValue, contract.collateral.currency)}</strong></div>
                  {contract.collateral.serialOrPlateNumber && (
                    <div>- លេខសម្គាល់/ស្លាកលេខ: <strong>{contract.collateral.serialOrPlateNumber}</strong></div>
                  )}
                  {contract.collateral.weightChi && (
                    <div>- ទម្ងន់មាស: <strong>{contract.collateral.weightChi} ជី</strong></div>
                  )}
                  <div>- ទីតាំងរក្សាទុក: <strong>{contract.collateral.storageLocation}</strong></div>
                </div>
              </div>
            )}

            <div className="space-y-1">
              <div className="font-bold text-slate-800">ប្រការ ៣. លក្ខខណ្ឌទូទៅ:</div>
              <p className="whitespace-pre-line text-[11px] text-slate-700 pl-3">
                {shopSettings.termsAndConditionsKhmer}
              </p>
            </div>

            {/* Signatures & Thumbprints */}
            <div className="grid grid-cols-2 pt-8 text-center text-xs gap-6">
              <div>
                <p className="font-bold text-slate-800 mb-2">ភាគី (ក) ម្ចាស់ហាង</p>
                <div className="w-20 h-24 border border-dashed border-slate-300 mx-auto my-3 flex items-center justify-center text-[10px] text-slate-400">
                  ត្រាហាង
                </div>
                <div className="font-semibold">{shopSettings.shopNameKhmer}</div>
              </div>

              <div>
                <p className="font-bold text-slate-800 mb-2">ភាគី (ខ) ស្នាមមេដៃស្ដាំអ្នកខ្ចី</p>
                <div className="w-20 h-24 border border-slate-300 rounded mx-auto my-3 flex items-center justify-center text-[10px] text-slate-400 bg-slate-50">
                  ស្នាមមេដៃស្ដាំ
                </div>
                <div className="font-semibold">{contract.customerName}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
