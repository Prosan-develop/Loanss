import React, { useState } from 'react';
import { ShopSettings, Customer, LoanContract, PaymentTransaction } from '../types';
import { Save, RefreshCw, Download, Upload, ShieldCheck, Check } from 'lucide-react';

interface SettingsViewProps {
  settings: ShopSettings;
  onUpdateSettings: (newSettings: ShopSettings) => void;
  onResetData: () => void;
  allData: {
    customers: Customer[];
    contracts: LoanContract[];
    transactions: PaymentTransaction[];
  };
  onImportData: (data: any) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onResetData,
  allData,
  onImportData,
}) => {
  const [formData, setFormData] = useState<ShopSettings>({ ...settings });
  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleExportJson = () => {
    const dataToExport = {
      settings: formData,
      customers: allData.customers,
      contracts: allData.contracts,
      transactions: allData.transactions,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pawnshop_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.customers && parsed.contracts) {
          onImportData(parsed);
          alert('ទិន្នន័យត្រូវបាននាំចូលដោយជោគជ័យ!');
        } else {
          alert('ឯកសារមិនត្រឹមត្រូវតាមទម្រង់ប្រព័ន្ធ!');
        }
      } catch (err) {
        alert('មានបញ្ហាក្នុងការអានឯកសារ JSON!');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="pb-4 border-b border-slate-200 mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">ការកំណត់ហាង និងរូបិយប័ណ្ណ</h3>
            <p className="text-xs text-slate-500 mt-0.5">ព័ត៌មានដែលត្រូវបង្ហាញលើកិច្ចសន្យា និងបង្កាន់ដៃទទួលប្រាក់</p>
          </div>
          {isSaved && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold">
              <Check className="w-4 h-4" />
              <span>បានរក្សាទុកជោគជ័យ!</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Shop Information */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-800">ព័ត៌មានទូទៅរបស់ហាង</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ឈ្មោះហាង (ភាសាខ្មែរ) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.shopNameKhmer}
                  onChange={(e) => setFormData({ ...formData, shopNameKhmer: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ឈ្មោះហាង (English / Latin)
                </label>
                <input
                  type="text"
                  value={formData.shopNameLatin}
                  onChange={(e) => setFormData({ ...formData, shopNameLatin: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  លេខអាជ្ញាប័ណ្ណអាជីវកម្ម
                </label>
                <input
                  type="text"
                  value={formData.businessLicense}
                  onChange={(e) => setFormData({ ...formData, businessLicense: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  លេខទូរស័ព្ទទាក់ទង *
                </label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  អាសយដ្ឋានហាង
                </label>
                <input
                  type="text"
                  value={formData.addressKhmer}
                  onChange={(e) => setFormData({ ...formData, addressKhmer: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Financial Parameters */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <h4 className="text-xs font-bold text-slate-800">ការកំណត់អត្រាការប្រាក់ និងអត្រាប្តូរប្រាក់</h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  អត្រាប្តូរប្រាក់ (1 USD = ? KHR) *
                </label>
                <input
                  type="number"
                  required
                  value={formData.exchangeRateUsdToKhr}
                  onChange={(e) => setFormData({ ...formData, exchangeRateUsdToKhr: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  អត្រាការប្រាក់ស្តង់ដារ (% /ខែ) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={formData.defaultInterestRate}
                  onChange={(e) => setFormData({ ...formData, defaultInterestRate: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  រយៈពេលអនុគ្រោះយឺតយ៉ាវ (ថ្ងៃ)
                </label>
                <input
                  type="number"
                  value={formData.gracePeriodDays}
                  onChange={(e) => setFormData({ ...formData, gracePeriodDays: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm tabular-nums"
                />
              </div>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="space-y-2 pt-4 border-t border-slate-200">
            <label className="block text-xs font-bold text-slate-800">
              លក្ខខណ្ឌកិច្ចសន្យាបញ្ចាំ (បង្ហាញលើលិខិតផ្លូវការ)
            </label>
            <textarea
              rows={4}
              value={formData.termsAndConditionsKhmer}
              onChange={(e) => setFormData({ ...formData, termsAndConditionsKhmer: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs leading-relaxed"
            />
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>រក្សាទុកការកំណត់</span>
            </button>
          </div>
        </form>
      </div>

      {/* Backup and Restore Data */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div>
          <h4 className="text-sm font-bold text-slate-900">ការគ្រប់គ្រងទិន្នន័យ (Backup & Reset)</h4>
          <p className="text-xs text-slate-500 mt-0.5">
            ទាញយកទិន្នន័យបម្រុងទុក ឬកំណត់ទិន្នន័យគំរូឡើងវិញគ្រប់ពេល
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleExportJson}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>ទាញយកទិន្នន័យបម្រុងទុក (Export JSON)</span>
          </button>

          <label className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>នាំចូលទិន្នន័យ (Import JSON)</span>
            <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
          </label>

          <button
            onClick={() => {
              if (confirm('តើលោកអ្នកពិតជាចង់កំណត់ទិន្នន័យគំរូដើមឡើងវិញមែនទេ?')) {
                onResetData();
              }
            }}
            className="flex items-center gap-2 px-4 py-2 text-rose-700 hover:bg-rose-50 border border-rose-200 text-xs font-semibold rounded-lg transition-colors ml-auto"
          >
            <RefreshCw className="w-4 h-4" />
            <span>កំណត់ទិន្នន័យដើមឡើងវិញ (Reset Sample Data)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
