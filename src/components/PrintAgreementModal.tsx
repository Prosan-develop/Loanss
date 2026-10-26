import React from 'react';
import { LoanContract, ShopSettings } from '../types';
import { formatMoney, getCollateralCategoryName } from '../utils/formatters';
import { Printer, X } from 'lucide-react';

interface PrintAgreementModalProps {
  contract: LoanContract;
  settings: ShopSettings;
  onClose: () => void;
}

export const PrintAgreementModal: React.FC<PrintAgreementModalProps> = ({
  contract,
  settings,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full my-8 overflow-hidden print-page">
        {/* Controls - Hidden during print */}
        <div className="no-print flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">កិច្ចសន្យាខ្ចីប្រាក់ និងបញ្ចាំទ្រព្យ</span>
            <span className="text-xs text-slate-500 font-mono">#{contract.contractNumber}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>បោះពុម្ពកិច្ចសន្យា (Print Agreement)</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Contract Document */}
        <div className="p-10 font-sans text-slate-900 bg-white leading-relaxed text-sm">
          {/* National Header */}
          <div className="text-center mb-6">
            <h2 className="text-base font-bold text-slate-900">ព្រះរាជាណាចក្រកម្ពុជា</h2>
            <h3 className="text-sm font-semibold text-slate-800">ជាតិ សាសនា ព្រះមហាក្សត្រ</h3>
            <div className="w-16 h-0.5 bg-slate-400 mx-auto my-2"></div>
            <h1 className="text-xl font-bold text-slate-900 mt-4 uppercase">
              {contract.loanType === 'pawn' ? 'លិខិតកិច្ចសន្យាខ្ចីប្រាក់ និងបញ្ចាំទ្រព្យ' : 'លិខិតកិច្ចសន្យាខ្ចីប្រាក់'}
            </h1>
            <p className="text-xs text-slate-500 font-mono mt-1">លេខកូដកិច្ចសន្យា: {contract.contractNumber}</p>
          </div>

          <p className="text-xs text-slate-700 indent-8 mb-4">
            ថ្ងៃនេះ ត្រូវនឹងថ្ងៃទី <strong>{contract.startDate.split('-')[2]}</strong> ខែ <strong>{contract.startDate.split('-')[1]}</strong> ឆ្នាំ <strong>{contract.startDate.split('-')[0]}</strong> នៅទីស្នាក់ការ <strong>{settings.shopNameKhmer}</strong> យើងខ្ញុំរួមមាន៖
          </p>

          {/* Party A */}
          <div className="mb-4 bg-slate-50/70 p-3 rounded border border-slate-200 text-xs">
            <p className="font-bold text-slate-800 mb-1">ភាគី "ក" (ម្ចាស់បំណុល / ម្ចាស់ហាងទទួលបញ្ចាំ)៖</p>
            <div className="grid grid-cols-2 gap-2 text-slate-700">
              <p>ឈ្មោះក្រុមហ៊ុន/ហាង: <strong>{settings.shopNameKhmer}</strong></p>
              <p>អាជ្ញាប័ណ្ណ: <strong>{settings.businessLicense}</strong></p>
              <p>លេខទូរស័ព្ទ: <strong>{settings.phone}</strong></p>
              <p>អាសយដ្ឋាន: <strong>{settings.addressKhmer}</strong></p>
            </div>
          </div>

          {/* Party B */}
          <div className="mb-5 bg-slate-50/70 p-3 rounded border border-slate-200 text-xs">
            <p className="font-bold text-slate-800 mb-1">ភាគី "ខ" (កូនបំណុល / អ្នកដាក់បញ្ចាំ)៖</p>
            <div className="grid grid-cols-2 gap-2 text-slate-700">
              <p>ឈ្មោះ: <strong>{contract.customerName}</strong></p>
              <p>អត្តសញ្ញាណប័ណ្ណលេខ: <strong>{contract.customerNationalId}</strong></p>
              <p>លេខទូរស័ព្ទ: <strong>{contract.customerPhone}</strong></p>
              <p>កាលបរិច្ឆេទចាប់ផ្តើម: <strong>{contract.startDate}</strong></p>
            </div>
          </div>

          {/* Agreement Clauses */}
          <div className="space-y-3 text-xs text-slate-800 mb-6">
            <p>
              <strong>មាត្រា ១ (លក្ខខណ្ឌប្រាក់កម្ចី)៖</strong> ភាគី "ក" បានយល់ព្រមប្រគល់ប្រាក់កម្ចីចំនួន <strong>{formatMoney(contract.principalAmount, contract.currency)}</strong> ទៅឲ្យភាគី "ខ"។ ដោយមានអត្រាការប្រាក់ <strong>{contract.interestRateMonthly}% ក្នុងមួយខែ</strong> រយៈពេលកិច្ចសន្យាចំនួន <strong>{contract.termMonths} ខែ</strong> ចាប់ពីថ្ងៃទី <strong>{contract.startDate}</strong> ដល់ថ្ងៃផុតកំណត់ទី <strong>{contract.dueDate}</strong>។
            </p>

            {contract.collateral && (
              <p>
                <strong>មាត្រា ២ (ទ្រព្យដាក់បញ្ចាំ)៖</strong> ដើម្បីធានាក្នុងការសងប្រាក់កម្ចី ភាគី "ខ" បានដាក់ទ្រព្យបញ្ចាំរួមមាន៖ <strong>{contract.collateral.name}</strong> ({getCollateralCategoryName(contract.collateral.category)}) {contract.collateral.serialOrPlateNumber ? `លេខសម្គាល់/ស្លាកលេខ៖ ${contract.collateral.serialOrPlateNumber}` : ''} {contract.collateral.weightChi ? `ទម្ងន់៖ ${contract.collateral.weightChi} ជី` : ''}។ តម្លៃប៉ាន់ស្មាន៖ <strong>{formatMoney(contract.collateral.estimatedValue, contract.collateral.currency)}</strong>។ ព័ត៌មានលម្អិត៖ {contract.collateral.description}។
              </p>
            )}

            <p>
              <strong>មាត្រា ៣ (ការទូទាត់ និងការទទួលខុសត្រូវ)៖</strong> ភាគី "ខ" សន្យាបង់ការប្រាក់ និងប្រាក់ដើមតាមកាលវិភាគដែលបានកំណត់យ៉ាងទៀងទាត់។ បើមានការពន្យារពេល ភាគី "ខ" ត្រូវជូនដំណឹងជាមុន។ ភាគី "ក" មានកាតព្វកិច្ចថែរក្សាទ្រព្យបញ្ចាំឲ្យស្ថិតក្នុងស្ថានភាពសុវត្ថិភាពល្អ និងប្រគល់ជូនវិញពេញលេញពេលភាគី "ខ" បានទូទាត់ផ្តាច់។
            </p>

            <p>
              <strong>មាត្រា ៤ (ករណីផុតកំណត់ ឬខកខានទូទាត់)៖</strong> ប្រសិនបើផុតកំណត់កិច្ចសន្យាហួសរយៈពេល <strong>៣០ ថ្ងៃ</strong> ដោយភាគី "ខ" មិនបានមកបង់ការប្រាក់ ពន្យារ ឬទូទាត់ប្រាក់ដើម នោះភាគី "ខ" យល់ព្រមប្រគល់សិទ្ធិពេញលេញជូនភាគី "ក" ក្នុងការរឹបអូស និងចាត់ចែងលក់ឡៃឡុងទ្រព្យបញ្ចាំខាងលើ ដើម្បីទូទាត់បំណុល ដោយមិនចាំបាច់មានការអនុញ្ញាតបន្ថែមពីភាគី "ខ" ឡើយ។
            </p>

            <p>
              កិច្ចសន្យានេះ ត្រូវបានធ្វើឡើងជាភាសាខ្មែរ ចំនួន ០២ ច្បាប់ មានតម្លៃគតិយុត្តស្មើគ្នា ដោយភាគីនីមួយៗរក្សាទុកម្នាក់មួយច្បាប់ និងបានអាន យល់ច្បាស់ដោយស្ម័គ្រចិត្ត ដោយគ្មានការបង្ខិតបង្ខំពីបុគ្គលណាម្នាក់ឡើយ។
            </p>
          </div>

          {/* Signatures & Fingerprints */}
          <div className="grid grid-cols-3 gap-4 text-center text-xs pt-6 border-t border-slate-200 mt-6">
            <div>
              <p className="font-bold text-slate-800">ភាគី "ក" (ម្ចាស់ហាង)</p>
              <p className="text-[10px] text-slate-500">ហត្ថលេខា និងត្រា</p>
              <div className="h-20"></div>
              <p className="font-semibold text-slate-800">{contract.createdBy}</p>
            </div>
            <div>
              <p className="font-bold text-slate-800">សាក្សី / អ្នកធានា</p>
              <p className="text-[10px] text-slate-500">ហត្ថលេខា</p>
              <div className="h-20"></div>
              <p className="text-slate-400">..............................</p>
            </div>
            <div>
              <p className="font-bold text-slate-800">ភាគី "ខ" (អ្នកខ្ចីប្រាក់)</p>
              <p className="text-[10px] text-slate-500">ស្នាមមេដៃស្តាំ</p>
              <div className="h-20 flex items-center justify-center">
                <div className="w-14 h-16 border border-dashed border-slate-300 rounded flex items-center justify-center text-[9px] text-slate-400">
                  ស្នាមមេដៃ
                </div>
              </div>
              <p className="font-semibold text-slate-800">{contract.customerName}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
