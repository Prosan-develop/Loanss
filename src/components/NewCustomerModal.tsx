import React, { useState } from 'react';
import { Customer } from '../types';
import { X, UserPlus, Save } from 'lucide-react';

interface NewCustomerModalProps {
  onClose: () => void;
  onSave: (customer: Omit<Customer, 'id' | 'joinedDate'>) => Customer;
  existingCustomer?: Customer;
}

export const NewCustomerModal: React.FC<NewCustomerModalProps> = ({
  onClose,
  onSave,
  existingCustomer,
}) => {
  const [nameKhmer, setNameKhmer] = useState(existingCustomer?.nameKhmer || '');
  const [nameLatin, setNameLatin] = useState(existingCustomer?.nameLatin || '');
  const [phone, setPhone] = useState(existingCustomer?.phone || '');
  const [nationalId, setNationalId] = useState(existingCustomer?.nationalId || '');
  const [address, setAddress] = useState(existingCustomer?.address || '');
  const [occupation, setOccupation] = useState(existingCustomer?.occupation || '');
  const [emergencyName, setEmergencyName] = useState(existingCustomer?.emergencyContact?.name || '');
  const [emergencyPhone, setEmergencyPhone] = useState(existingCustomer?.emergencyContact?.phone || '');
  const [emergencyRelation, setEmergencyRelation] = useState(existingCustomer?.emergencyContact?.relation || '');
  const [status, setStatus] = useState<Customer['status']>(existingCustomer?.status || 'normal');
  const [notes, setNotes] = useState(existingCustomer?.notes || '');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameKhmer.trim()) {
      setError('សូមបញ្ចូលឈ្មោះអតិថិជនជាភាសាខ្មែរ');
      return;
    }
    if (!phone.trim()) {
      setError('សូមបញ្ចូលលេខទូរស័ព្ទ');
      return;
    }

    const code = existingCustomer?.code || `CUST-${Math.floor(100 + Math.random() * 900)}`;

    onSave({
      code,
      nameKhmer: nameKhmer.trim(),
      nameLatin: nameLatin.trim(),
      phone: phone.trim(),
      nationalId: nationalId.trim(),
      address: address.trim(),
      occupation: occupation.trim(),
      emergencyContact: emergencyName.trim()
        ? {
            name: emergencyName.trim(),
            phone: emergencyPhone.trim(),
            relation: emergencyRelation.trim(),
          }
        : undefined,
      status,
      notes: notes.trim(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full my-8 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-emerald-600" />
            <h2 className="font-semibold text-slate-800">
              {existingCustomer ? 'កែប្រែព័ត៌មានអតិថិជន' : 'ចុះឈ្មោះអតិថិជនថ្មី (New Customer)'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                ឈ្មោះជាភាសាខ្មែរ <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={nameKhmer}
                onChange={(e) => setNameKhmer(e.target.value)}
                placeholder="ឧ. លោក សុខ ចាន់ថា"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">ឈ្មោះឡាតាំង (Latin Name)</label>
              <input
                type="text"
                value={nameLatin}
                onChange={(e) => setNameLatin(e.target.value)}
                placeholder="Sok Chantha"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                លេខទូរស័ព្ទ <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="012 345 678"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">លេខអត្តសញ្ញាណប័ណ្ណ / លិខិតឆ្លងដែន</label>
              <input
                type="text"
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                placeholder="010884921"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">មុខរបរ / អាជីវកម្ម</label>
              <input
                type="text"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                placeholder="អាជីវករ, បុគ្គលិកក្រុមហ៊ុន..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">កម្រិតទំនុកចិត្ត (Credit Status)</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Customer['status'])}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
              >
                <option value="reliable">ទុកចិត្តបានខ្ពស់ (Reliable)</option>
                <option value="normal">ធម្មតា (Normal)</option>
                <option value="watchlist">គួរតាមដាន (Watchlist)</option>
                <option value="blocked">ផ្អាកសេវា (Blocked)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">អាសយដ្ឋានបច្ចុប្បន្ន</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="ផ្ទះលេខ... ផ្លូវ... សង្កាត់... ខណ្ឌ... រាជធានី/ខេត្ត"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Emergency Contact */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
            <span className="font-semibold text-slate-700 block">អ្នកទំនាក់ទំនងបន្ទាន់ (Emergency Contact)</span>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                value={emergencyName}
                onChange={(e) => setEmergencyName(e.target.value)}
                placeholder="ឈ្មោះអ្នកធានា/សាច់ញាតិ"
                className="px-2.5 py-1.5 border border-slate-300 rounded focus:outline-none bg-white"
              />
              <input
                type="tel"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                placeholder="លេខទូរស័ព្ទ"
                className="px-2.5 py-1.5 border border-slate-300 rounded focus:outline-none bg-white"
              />
              <input
                type="text"
                value={emergencyRelation}
                onChange={(e) => setEmergencyRelation(e.target.value)}
                placeholder="ត្រូវជា (ភរិយា, បងប្អូន...)"
                className="px-2.5 py-1.5 border border-slate-300 rounded focus:outline-none bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">កំណត់សម្គាល់បន្ថែម</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ព័ត៌មានផ្សេងៗ..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

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
              <Save className="w-4 h-4" />
              <span>រក្សាទុកព័ត៌មាន</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
