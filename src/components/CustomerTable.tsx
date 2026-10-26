import React, { useState, useMemo } from 'react';
import { Customer, LoanContract, Currency } from '../types';
import { formatMoney, getStatusBadge, getCollateralCategoryName } from '../utils/formatters';
import { 
  Search, 
  UserPlus, 
  Phone, 
  MapPin, 
  CreditCard, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  PlusCircle, 
  X, 
  Users, 
  ShieldCheck, 
  AlertCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar,
  Printer,
  Download,
  CheckSquare,
  Square,
  MinusSquare,
  Check,
  FileSpreadsheet
} from 'lucide-react';



interface CustomerTableProps {
  customers: Customer[];
  contracts: LoanContract[];
  onAddCustomer: (newCustomer: Customer) => void;
  onUpdateCustomer?: (updatedCustomer: Customer) => void;
  onCreateLoanForCustomer?: (customer: Customer) => void;
  onViewContract?: (contractId: string) => void;
}

export const CustomerTable: React.FC<CustomerTableProps> = ({
  customers,
  contracts,
  onAddCustomer,
  onUpdateCustomer,
  onCreateLoanForCustomer,
  onViewContract,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'overdue' | 'no_loan'>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Sorting state
  const [sortField, setSortField] = useState<'name' | 'activeLoans' | 'registrationDate'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Multi-row selection state
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  const [isBulkReportModalOpen, setIsBulkReportModalOpen] = useState(false);


  const handleSort = (field: 'name' | 'activeLoans' | 'registrationDate') => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      // For loans and dates, desc (highest loans / newest dates) is the most intuitive first click
      setSortDirection(field === 'activeLoans' || field === 'registrationDate' ? 'desc' : 'asc');
    }
  };


  // Form state for adding new customer
  const [formData, setFormData] = useState({
    nameKhmer: '',
    nameLatin: '',
    phone: '',
    nationalId: '',
    address: '',
    occupation: '',
    emergencyName: '',
    emergencyPhone: '',
    emergencyRelation: '',
    status: 'normal' as 'reliable' | 'normal' | 'watchlist' | 'blocked',
    notes: '',
  });

  // Calculate customer's current active loan and status
  const customerLoanData = useMemo(() => {
    const map = new Map<string, {
      contracts: LoanContract[];
      activeContracts: LoanContract[];
      overdueContracts: LoanContract[];
      totalRemainingUSD: number;
      totalRemainingKHR: number;
      overallStatus: 'active' | 'overdue' | 'completed' | 'no_loan';
      activeCollaterals: string[];
    }>();

    customers.forEach((c) => {
      const custContracts = contracts.filter((cnt) => cnt.customerId === c.id);
      const active = custContracts.filter((cnt) => cnt.status === 'active');
      const overdue = custContracts.filter((cnt) => cnt.status === 'overdue');

      let usdRem = 0;
      let khrRem = 0;
      const collaterals: string[] = [];

      [...active, ...overdue].forEach((cnt) => {
        if (cnt.currency === 'USD') usdRem += cnt.remainingPrincipal;
        if (cnt.currency === 'KHR') khrRem += cnt.remainingPrincipal;
        if (cnt.collateral && cnt.collateral.status === 'in_vault') {
          collaterals.push(cnt.collateral.name);
        }
      });

      let overallStatus: 'active' | 'overdue' | 'completed' | 'no_loan' = 'no_loan';
      if (overdue.length > 0) {
        overallStatus = 'overdue';
      } else if (active.length > 0) {
        overallStatus = 'active';
      } else if (custContracts.length > 0) {
        overallStatus = 'completed';
      }

      map.set(c.id, {
        contracts: custContracts,
        activeContracts: active,
        overdueContracts: overdue,
        totalRemainingUSD: usdRem,
        totalRemainingKHR: khrRem,
        overallStatus,
        activeCollaterals: collaterals,
      });
    });

    return map;
  }, [customers, contracts]);

  // Filter and search customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchSearch =
        c.nameKhmer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.nameLatin.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm) ||
        c.nationalId.includes(searchTerm) ||
        c.code.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;

      const loanInfo = customerLoanData.get(c.id);
      if (statusFilter === 'active') {
        return loanInfo && loanInfo.activeContracts.length > 0;
      }
      if (statusFilter === 'overdue') {
        return loanInfo && loanInfo.overdueContracts.length > 0;
      }
      if (statusFilter === 'no_loan') {
        return !loanInfo || (loanInfo.activeContracts.length === 0 && loanInfo.overdueContracts.length === 0);
      }

      return true;
    });
  }, [customers, searchTerm, statusFilter, customerLoanData]);

  // Sort filtered customers
  const sortedCustomers = useMemo(() => {
    return [...filteredCustomers].sort((a, b) => {
      let comparison = 0;

      if (sortField === 'name') {
        comparison = a.nameKhmer.localeCompare(b.nameKhmer, 'km') || a.nameLatin.localeCompare(b.nameLatin);
      } else if (sortField === 'activeLoans') {
        const loanDataA = customerLoanData.get(a.id);
        const loanDataB = customerLoanData.get(b.id);
        const countA = (loanDataA?.activeContracts.length || 0) + (loanDataA?.overdueContracts.length || 0);
        const countB = (loanDataB?.activeContracts.length || 0) + (loanDataB?.overdueContracts.length || 0);

        if (countA !== countB) {
          comparison = countA - countB;
        } else {
          // Secondary tiebreaker: total remaining balance in USD
          const balA = (loanDataA?.totalRemainingUSD || 0) + (loanDataA?.totalRemainingKHR || 0) / 4100;
          const balB = (loanDataB?.totalRemainingUSD || 0) + (loanDataB?.totalRemainingKHR || 0) / 4100;
          comparison = balA - balB;
        }
      } else if (sortField === 'registrationDate') {
        const dateA = new Date(a.joinedDate || '1970-01-01').getTime();
        const dateB = new Date(b.joinedDate || '1970-01-01').getTime();
        comparison = dateA - dateB;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredCustomers, sortField, sortDirection, customerLoanData]);

  const renderSortIndicator = (field: 'name' | 'activeLoans' | 'registrationDate') => {
    const isCurrent = sortField === field;
    return (
      <span className={`inline-flex items-center justify-center p-0.5 rounded transition-colors ${isCurrent ? 'bg-emerald-50 text-emerald-700' : 'text-slate-400 group-hover:text-slate-600'}`}>
        {!isCurrent ? (
          <ArrowUpDown className="w-3.5 h-3.5 shrink-0" />
        ) : sortDirection === 'asc' ? (
          <ArrowUp className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
        ) : (
          <ArrowDown className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
        )}
      </span>
    );
  };

  // Selection helpers
  const isAllSelected = sortedCustomers.length > 0 && sortedCustomers.every(c => selectedCustomerIds.includes(c.id));
  const isSomeSelected = sortedCustomers.some(c => selectedCustomerIds.includes(c.id)) && !isAllSelected;

  const handleToggleCustomer = (id: string) => {
    setSelectedCustomerIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      const visibleIds = new Set(sortedCustomers.map(c => c.id));
      setSelectedCustomerIds(prev => prev.filter(id => !visibleIds.has(id)));
    } else {
      const visibleIds = sortedCustomers.map(c => c.id);
      setSelectedCustomerIds(prev => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleBulkUpdateStatus = (newStatus: 'reliable' | 'normal' | 'watchlist' | 'blocked') => {
    if (!onUpdateCustomer) return;
    selectedCustomerIds.forEach(id => {
      const cust = customers.find(c => c.id === id);
      if (cust) {
        onUpdateCustomer({ ...cust, status: newStatus });
      }
    });
  };

  const handleExportSelectedCsv = () => {
    const targetCustomers = customers.filter(c => selectedCustomerIds.includes(c.id));
    if (targetCustomers.length === 0) return;

    const headers = ['លេខកូដ', 'ឈ្មោះខ្មែរ', 'ឈ្មោះឡាតាំង', 'លេខទូរស័ព្ទ', 'អត្តសញ្ញាណប័ណ្ណ', 'អាសយដ្ឋាន', 'មុខរបរ', 'កម្ចីសកម្ម', 'ប្រាក់ជំពាក់USD', 'ប្រាក់ជំពាក់KHR', 'កាលបរិច្ឆេទចុះឈ្មោះ', 'កម្រិតទុកចិត្ត'];
    
    const rows = targetCustomers.map(c => {
      const loan = customerLoanData.get(c.id);
      const activeCount = (loan?.activeContracts.length || 0) + (loan?.overdueContracts.length || 0);
      return [
        c.code,
        `"${c.nameKhmer.replace(/"/g, '""')}"`,
        `"${c.nameLatin.replace(/"/g, '""')}"`,
        `"${c.phone}"`,
        `"${c.nationalId}"`,
        `"${c.address.replace(/"/g, '""')}"`,
        `"${(c.occupation || '').replace(/"/g, '""')}"`,
        activeCount,
        loan?.totalRemainingUSD || 0,
        loan?.totalRemainingKHR || 0,
        c.joinedDate || '',
        c.status
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `របាយការណ៍អតិថិជន_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };



  // Overall metrics
  const totalCustomersCount = customers.length;
  const withActiveLoansCount = useMemo(() => {
    let count = 0;
    customerLoanData.forEach((val) => {
      if (val.activeContracts.length > 0 || val.overdueContracts.length > 0) count++;
    });
    return count;
  }, [customerLoanData]);

  const overdueCustomersCount = useMemo(() => {
    let count = 0;
    customerLoanData.forEach((val) => {
      if (val.overdueContracts.length > 0) count++;
    });
    return count;
  }, [customerLoanData]);

  const reliableCustomersCount = customers.filter((c) => c.status === 'reliable').length;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nameKhmer || !formData.phone) return;

    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      code: `CUST-${String(customers.length + 1).padStart(3, '0')}`,
      nameKhmer: formData.nameKhmer,
      nameLatin: formData.nameLatin || formData.nameKhmer,
      phone: formData.phone,
      nationalId: formData.nationalId || 'N/A',
      address: formData.address || 'ភ្នំពេញ',
      occupation: formData.occupation,
      emergencyContact: formData.emergencyName
        ? {
            name: formData.emergencyName,
            phone: formData.emergencyPhone,
            relation: formData.emergencyRelation || 'សាច់ញាតិ',
          }
        : undefined,
      status: formData.status,
      joinedDate: new Date().toISOString().split('T')[0],
      notes: formData.notes,
    };

    onAddCustomer(newCust);
    setIsAddModalOpen(false);
    setFormData({
      nameKhmer: '',
      nameLatin: '',
      phone: '',
      nationalId: '',
      address: '',
      occupation: '',
      emergencyName: '',
      emergencyPhone: '',
      emergencyRelation: '',
      status: 'normal',
      notes: '',
    });
  };

  const openCustomerDetail = (cust: Customer) => {
    setSelectedCustomer(cust);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">អតិថិជនសរុប</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums">{totalCustomersCount} នាក់</div>
          <div className="text-xs text-slate-400 mt-1">ក្នុងប្រព័ន្ធគ្រប់គ្រង</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">កំពុងមានកម្ចី/បញ្ចាំ</span>
            <CreditCard className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 tabular-nums">{withActiveLoansCount} នាក់</div>
          <div className="text-xs text-slate-400 mt-1">កិច្ចសន្យាកំពុងដំណើរការ</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">ជំពាក់ហួសកំណត់</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-600 tabular-nums">{overdueCustomersCount} នាក់</div>
          <div className="text-xs text-rose-500 font-medium mt-1">ត្រូវការតាមដានរំលឹក</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">អតិថិជនល្អទុកចិត្ត</span>
            <ShieldCheck className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-bold text-sky-700 tabular-nums">{reliableCustomersCount} នាក់</div>
          <div className="text-xs text-slate-400 mt-1">ប្រវត្តិបង់ប្រាក់ទៀងទាត់</div>
        </div>
      </div>

      {/* Search, Filter & Actions Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ស្វែងរកតាមឈ្មោះ, លេខទូរស័ព្ទ, លេខកូដ, អត្តសញ្ញាណប័ណ្ណ..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Tabs & Add Button */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ទាំងអស់ ({customers.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                statusFilter === 'active'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              កំពុងមានកម្ចី ({withActiveLoansCount})
            </button>
            <button
              onClick={() => setStatusFilter('overdue')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                statusFilter === 'overdue'
                  ? 'bg-white text-rose-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ហួសកំណត់ ({overdueCustomersCount})
            </button>
            <button
              onClick={() => setStatusFilter('no_loan')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                statusFilter === 'no_loan'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              គ្មានកម្ចីសកម្ម
            </button>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-xs whitespace-nowrap shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ បន្ថែមអតិថិជនថ្មី</span>
          </button>
        </div>
      </div>

      {/* Bulk Action Toolbar */}
      {selectedCustomerIds.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-600 text-white font-semibold text-xs tabular-nums">
              {selectedCustomerIds.length}
            </span>
            <div>
              <p className="text-xs font-semibold text-emerald-950">
                បានជ្រើសរើស {selectedCustomerIds.length} នាក់ នៃអតិថិជនសរុប {customers.length} នាក់
              </p>
              <p className="text-[11px] text-emerald-700">
                {selectedCustomerIds.length === sortedCustomers.length 
                  ? 'បានជ្រើសរើសអតិថិជនទាំងអស់ក្នុងតារាង' 
                  : `បានជ្រើសរើស ${selectedCustomerIds.length} ក្នុងចំណោម ${sortedCustomers.length} នាក់ក្នុងទំព័រនេះ`}
              </p>
            </div>
            {selectedCustomerIds.length < sortedCustomers.length && (
              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="text-xs text-emerald-800 underline hover:text-emerald-950 font-medium ml-1 cursor-pointer"
              >
                ជ្រើសទាំងអស់ក្នុងតារាង ({sortedCustomers.length})
              </button>
            )}
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* Generate / Print Report */}
            <button
              type="button"
              onClick={() => setIsBulkReportModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100/60 rounded-lg text-xs font-medium transition-colors shadow-2xs cursor-pointer"
              title="បង្កើតនិងបោះពុម្ពរបាយការណ៍សង្ខេបសម្រាប់អតិថិជនដែលបានជ្រើស"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-700" />
              <span>របាយការណ៍សង្ខេប (Print Report)</span>
            </button>

            {/* Export CSV */}
            <button
              type="button"
              onClick={handleExportSelectedCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100/60 rounded-lg text-xs font-medium transition-colors shadow-2xs cursor-pointer"
              title="ទាញយកទិន្នន័យអតិថិជនជាឯកសារ Excel/CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-700" />
              <span>នាំចេញ CSV ({selectedCustomerIds.length})</span>
            </button>

            {/* Quick Status / Reliability update buttons */}
            {onUpdateCustomer && (
              <div className="flex items-center gap-1 pl-2 border-l border-emerald-200">
                <span className="text-[11px] text-emerald-800 font-medium mr-1">កម្រិតទុកចិត្ត:</span>
                <button
                  type="button"
                  onClick={() => handleBulkUpdateStatus('reliable')}
                  className="px-2 py-1 bg-white hover:bg-emerald-100 border border-emerald-200 rounded text-[11px] text-emerald-800 font-medium transition-colors cursor-pointer"
                  title="ដាក់កម្រិតទុកចិត្តខ្ពស់សម្រាប់អតិថិជនដែលបានជ្រើស"
                >
                  ទុកចិត្តខ្ពស់
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkUpdateStatus('normal')}
                  className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded text-[11px] text-slate-700 font-medium transition-colors cursor-pointer"
                  title="ដាក់កម្រិតធម្មតាសម្រាប់អតិថិជនដែលបានជ្រើស"
                >
                  ធម្មតា
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkUpdateStatus('watchlist')}
                  className="px-2 py-1 bg-white hover:bg-amber-100 border border-amber-300 rounded text-[11px] text-amber-800 font-medium transition-colors cursor-pointer"
                  title="ដាក់ក្នុងបញ្ជីឃ្លាំមើលសម្រាប់អតិថិជនដែលបានជ្រើស"
                >
                  ឃ្លាំមើល
                </button>
              </div>
            )}

            {/* Deselect all */}
            <button
              type="button"
              onClick={() => setSelectedCustomerIds([])}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 rounded-lg transition-colors ml-1 cursor-pointer"
              title="ដោះការជ្រើសរើសទាំងអស់"
            >
              <X className="w-3.5 h-3.5" />
              <span>សម្អាត</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Customers Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <th className="py-3.5 px-3 w-10 text-center">
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="inline-flex items-center justify-center p-1 rounded hover:bg-slate-200/60 transition-colors text-slate-600 focus:outline-none cursor-pointer"
                    title={isAllSelected ? "ដោះការជ្រើសរើសទាំងអស់" : "ជ្រើសរើសទាំងអស់"}
                    aria-label="Select all rows"
                  >
                    {isAllSelected ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600" />
                    ) : isSomeSelected ? (
                      <MinusSquare className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </th>
                <th className="py-3.5 px-4">
                  <button
                    type="button"
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-1.5 text-left font-semibold text-xs text-slate-700 hover:text-emerald-700 group focus:outline-none cursor-pointer select-none"
                    title="ចុចដើម្បីតម្រៀបតាមឈ្មោះអតិថិជន"
                  >
                    <span>អតិថិជន</span>
                    {renderSortIndicator('name')}
                  </button>
                </th>
                <th className="py-3.5 px-4">ទំនាក់ទំនង & អត្តសញ្ញាណ</th>
                <th className="py-3.5 px-4">អាសយដ្ឋាន & មុខរបរ</th>
                <th className="py-3.5 px-4">
                  <button
                    type="button"
                    onClick={() => handleSort('activeLoans')}
                    className="flex items-center gap-1.5 text-left font-semibold text-xs text-slate-700 hover:text-emerald-700 group focus:outline-none cursor-pointer select-none"
                    title="ចុចដើម្បីតម្រៀបតាមកម្ចីសកម្ម"
                  >
                    <span>ស្ថានភាពកម្ចីបច្ចុប្បន្ន</span>
                    {renderSortIndicator('activeLoans')}
                  </button>
                </th>
                <th className="py-3.5 px-4">
                  <button
                    type="button"
                    onClick={() => handleSort('registrationDate')}
                    className="flex items-center gap-1.5 text-left font-semibold text-xs text-slate-700 hover:text-emerald-700 group focus:outline-none cursor-pointer select-none"
                    title="ចុចដើម្បីតម្រៀបតាមកាលបរិច្ឆេទចុះឈ្មោះ"
                  >
                    <span>កាលបរិច្ឆេទចុះឈ្មោះ</span>
                    {renderSortIndicator('registrationDate')}
                  </button>
                </th>
                <th className="py-3.5 px-4">ទ្រព្យបញ្ចាំកំពុងរក្សាទុក</th>
                <th className="py-3.5 px-4">ភាពជឿទុកចិត្ត</th>
                <th className="py-3.5 px-4 text-right">សកម្មភាព</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {sortedCustomers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-medium">មិនមានទិន្នន័យអតិថិជនត្រូវបានរកឃើញទេ</p>
                    <p className="text-xs text-slate-400 mt-1">សូមសាកល្បងផ្លាស់ប្តូរពាក្យស្វែងរក ឬបន្ថែមអតិថិជនថ្មី</p>
                  </td>
                </tr>
              ) : (
                sortedCustomers.map((cust) => {
                  const loanData = customerLoanData.get(cust.id);
                  const activeCount = (loanData?.activeContracts.length || 0) + (loanData?.overdueContracts.length || 0);
                  const isOverdue = (loanData?.overdueContracts.length || 0) > 0;
                  const isSelected = selectedCustomerIds.includes(cust.id);

                  return (
                    <tr 
                      key={cust.id} 
                      className={`transition-colors cursor-pointer group ${isSelected ? 'bg-emerald-50/70 hover:bg-emerald-100/60' : 'hover:bg-slate-50/80'}`}
                      onClick={() => openCustomerDetail(cust)}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-3 w-10 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleToggleCustomer(cust.id)}
                          className="inline-flex items-center justify-center p-1 rounded hover:bg-slate-200/50 transition-colors focus:outline-none cursor-pointer"
                          aria-label={`ជ្រើសរើស ${cust.nameKhmer}`}
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300 group-hover:text-slate-400" />
                          )}
                        </button>
                      </td>

                      {/* Name & Code */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-semibold text-xs border border-slate-200 shrink-0">
                            {cust.nameKhmer.slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
                              {cust.nameKhmer}
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono text-slate-400">{cust.code}</span>
                              <span aria-hidden="true">·</span>
                              <span>{cust.nameLatin}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Phone & ID */}
                      <td className="py-3.5 px-4">
                        <div className="text-slate-800 font-medium font-mono text-xs flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{cust.phone}</span>
                        </div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">
                          ID: {cust.nationalId}
                        </div>
                      </td>

                      {/* Address & Occupation */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="text-slate-700 text-xs truncate flex items-center gap-1" title={cust.address}>
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{cust.address}</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 truncate">
                          {cust.occupation || 'មិនបានបញ្ជាក់'}
                        </div>
                      </td>

                      {/* Loan Status & Balance */}
                      <td className="py-3.5 px-4">
                        {activeCount > 0 ? (
                          <div>
                            <div className="flex items-center gap-1.5">
                              {isOverdue ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                                  <AlertCircle className="w-3 h-3" />
                                  ហួសកំណត់ ({loanData?.overdueContracts.length})
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <Clock className="w-3 h-3" />
                                  សកម្ម ({activeCount} កិច្ចសន្យា)
                                </span>
                              )}
                            </div>
                            <div className="text-xs font-semibold text-slate-900 mt-1 tabular-nums">
                              {loanData?.totalRemainingUSD ? (
                                <span>{formatMoney(loanData.totalRemainingUSD, 'USD')}</span>
                              ) : null}
                              {loanData?.totalRemainingUSD && loanData?.totalRemainingKHR ? ' + ' : ''}
                              {loanData?.totalRemainingKHR ? (
                                <span>{formatMoney(loanData.totalRemainingKHR, 'KHR')}</span>
                              ) : null}
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                            <span>គ្មានកម្ចីសកម្ម</span>
                          </div>
                        )}
                      </td>

                      {/* Registration Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs text-slate-700 font-mono">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{cust.joinedDate || '—'}</span>
                        </div>
                      </td>

                      {/* Collateral in Vault */}
                      <td className="py-3.5 px-4 max-w-xs">
                        {loanData && loanData.activeCollaterals.length > 0 ? (
                          <div className="space-y-1">
                            {loanData.activeCollaterals.slice(0, 2).map((col, idx) => (
                              <div key={idx} className="text-xs text-slate-700 truncate bg-slate-50 px-2 py-1 rounded border border-slate-200" title={col}>
                                📦 {col}
                              </div>
                            ))}
                            {loanData.activeCollaterals.length > 2 && (
                              <div className="text-[11px] text-slate-500">
                                +{loanData.activeCollaterals.length - 2} ទ្រព្យទៀត
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>

                      {/* Reliability Tag */}
                      <td className="py-3.5 px-4">
                        {cust.status === 'reliable' && (
                          <span className="text-xs text-emerald-700 font-medium bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                            ល្អ / ទុកចិត្ត
                          </span>
                        )}
                        {cust.status === 'normal' && (
                          <span className="text-xs text-slate-600 font-medium bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                            ទូទៅ
                          </span>
                        )}
                        {cust.status === 'watchlist' && (
                          <span className="text-xs text-amber-700 font-medium bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                            ត្រូវតាមដាន
                          </span>
                        )}
                        {cust.status === 'blocked' && (
                          <span className="text-xs text-rose-700 font-medium bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                            ផ្អាកផ្តល់កម្ចី
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openCustomerDetail(cust)}
                            title="មើលព័ត៌មានលម្អិត"
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                          {onCreateLoanForCustomer && (
                            <button
                              onClick={() => onCreateLoanForCustomer(cust)}
                              title="បង្កើតកិច្ចសន្យាកម្ចីថ្មី"
                              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition-colors whitespace-nowrap"
                            >
                              <PlusCircle className="w-3.5 h-3.5" />
                              <span>កម្ចីថ្មី</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Summary & Sort indicator */}
        <div className="py-3 px-4 bg-slate-50/75 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex flex-wrap items-center gap-2">
            <div>
              បង្ហាញ <span className="font-semibold text-slate-800 tabular-nums">{sortedCustomers.length}</span> នាក់ ក្នុងចំណោម <span className="font-semibold text-slate-800 tabular-nums">{customers.length}</span> នាក់
            </div>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <div className="flex items-center gap-1 text-[11px] text-slate-600">
              <span>តម្រៀបតាម:</span>
              <span className="font-semibold text-emerald-700">
                {sortField === 'name' && `ឈ្មោះអតិថិជន (${sortDirection === 'asc' ? 'ក ទៅ អ' : 'អ ទៅ ក'})`}
                {sortField === 'activeLoans' && `កម្ចីសកម្ម (${sortDirection === 'desc' ? 'ច្រើន ទៅ តិច' : 'តិច ទៅ ច្រើន'})`}
                {sortField === 'registrationDate' && `កាលបរិច្ឆេទចុះឈ្មោះ (${sortDirection === 'desc' ? 'ថ្មីបំផុត' : 'ចាស់បំផុត'})`}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span>
              កម្ចីកំពុងសកម្មសរុប: <strong className="text-slate-800 tabular-nums">{withActiveLoansCount}</strong>
            </span>
            <span>
              ហួសកាលកំណត់: <strong className="text-rose-600 tabular-nums">{overdueCustomersCount}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Add Customer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900">ចុះឈ្មោះអតិថិជនថ្មី</h3>
                <p className="text-xs text-slate-500 mt-0.5">បញ្ចូលព័ត៌មានអត្តសញ្ញាណ និងទំនាក់ទំនងអតិថិជន</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ឈ្មោះជាភាសាខ្មែរ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nameKhmer}
                    onChange={(e) => setFormData({ ...formData, nameKhmer: e.target.value })}
                    placeholder="ឧ. ចាន់ សុភាព"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ឈ្មោះជាអក្សរឡាតាំង
                  </label>
                  <input
                    type="text"
                    value={formData.nameLatin}
                    onChange={(e) => setFormData({ ...formData, nameLatin: e.target.value })}
                    placeholder="e.g. Chan Sopheap"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    លេខទូរស័ព្ទ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="ឧ. 012 345 678"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    លេខអត្តសញ្ញាណប័ណ្ណ (ID Card)
                  </label>
                  <input
                    type="text"
                    value={formData.nationalId}
                    onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                    placeholder="ឧ. 010892341"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  អាសយដ្ឋានបច្ចុប្បន្ន
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="ផ្ទះលេខ, ផ្លូវ, សង្កាត់, ខណ្ឌ, រាជធានី/ខេត្ត"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    មុខរបរ ឬ អាជីវកម្ម
                  </label>
                  <input
                    type="text"
                    value={formData.occupation}
                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                    placeholder="ឧ. អាជីវករលក់ដូរ, បុគ្គលិក..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ចំណាត់ថ្នាក់អតិថិជន
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e: any) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="reliable">ល្អ / គួរឱ្យទុកចិត្ត (Reliable)</option>
                    <option value="normal">ធម្មតា (Normal)</option>
                    <option value="watchlist">ត្រូវតាមដាន (Watchlist)</option>
                    <option value="blocked">ផ្អាកសេវា (Blocked)</option>
                  </select>
                </div>
              </div>

              {/* Emergency Contact Group */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-slate-700 block">ទំនាក់ទំនងបន្ទាន់ (សាច់ញាតិ)</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={formData.emergencyName}
                    onChange={(e) => setFormData({ ...formData, emergencyName: e.target.value })}
                    placeholder="ឈ្មោះអ្នកធានា/សាច់ញាតិ"
                    className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                  <input
                    type="tel"
                    value={formData.emergencyPhone}
                    onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                    placeholder="លេខទូរស័ព្ទ"
                    className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                  />
                  <input
                    type="text"
                    value={formData.emergencyRelation}
                    onChange={(e) => setFormData({ ...formData, emergencyRelation: e.target.value })}
                    placeholder="ត្រូវជាអ្វី (ឧ. ប្តី/ប្រពន្ធ)"
                    className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ចំណាំបន្ថែម
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="ព័ត៌មានលម្អិតផ្សេងៗ..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-xs"
                >
                  រក្សាទុកអតិថិជន
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Detail Drawer / Modal */}
      {isDetailModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-200 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 font-bold text-lg flex items-center justify-center border border-emerald-200">
                  {selectedCustomer.nameKhmer.slice(0, 2)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-slate-900">{selectedCustomer.nameKhmer}</h3>
                    <span className="text-xs font-mono text-slate-500 px-2 py-0.5 bg-slate-100 rounded">
                      {selectedCustomer.code}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{selectedCustomer.nameLatin} · ចុះឈ្មោះថ្ងៃទី {selectedCustomer.joinedDate}</p>
                </div>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Information Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">លេខទូរស័ព្ទ:</span>
                <span className="font-semibold text-slate-800 font-mono">{selectedCustomer.phone}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">អត្តសញ្ញាណប័ណ្ណ:</span>
                <span className="font-semibold text-slate-800 font-mono">{selectedCustomer.nationalId}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">មុខរបរ:</span>
                <span className="font-semibold text-slate-800">{selectedCustomer.occupation || '—'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block mb-0.5">អាសយដ្ឋាន:</span>
                <span className="font-medium text-slate-800">{selectedCustomer.address}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">ចំណាត់ថ្នាក់:</span>
                <span className="font-medium text-emerald-700">{selectedCustomer.status}</span>
              </div>
              {selectedCustomer.emergencyContact && (
                <div className="col-span-3 pt-2 border-t border-slate-200">
                  <span className="text-slate-400 block mb-0.5">ទំនាក់ទំនងបន្ទាន់:</span>
                  <span className="text-slate-700 font-medium">
                    {selectedCustomer.emergencyContact.name} ({selectedCustomer.emergencyContact.relation}) - {selectedCustomer.emergencyContact.phone}
                  </span>
                </div>
              )}
            </div>

            {/* Historical and Active Contracts */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-slate-900">ប្រវត្តិកិច្ចសន្យាខ្ចីប្រាក់ និងបញ្ចាំ</h4>
                {onCreateLoanForCustomer && (
                  <button
                    onClick={() => {
                      setIsDetailModalOpen(false);
                      onCreateLoanForCustomer(selectedCustomer);
                    }}
                    className="flex items-center gap-1 text-xs text-emerald-700 font-medium hover:underline"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>+ បង្កើតកម្ចីថ្មីជូនអតិថិជននេះ</span>
                  </button>
                )}
              </div>

              {contracts.filter((c) => c.customerId === selectedCustomer.id).length === 0 ? (
                <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  អតិថិជននេះមិនទាន់មានកិច្ចសន្យាណាមួយនៅឡើយទេ
                </div>
              ) : (
                <div className="space-y-3">
                  {contracts
                    .filter((c) => c.customerId === selectedCustomer.id)
                    .map((cnt) => {
                      const badge = getStatusBadge(cnt.status);
                      return (
                        <div
                          key={cnt.id}
                          className="p-3.5 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-bold font-mono text-sm text-slate-900">
                                {cnt.contractNumber}
                              </span>
                              <span className={`text-[11px] px-2 py-0.5 rounded font-medium border ${badge.bg}`}>
                                {badge.label}
                              </span>
                              <span className="text-xs text-slate-500">
                                ({cnt.loanType === 'pawn' ? 'បញ្ចាំទ្រព្យ' : 'កម្ចីបង់រំលស់'})
                              </span>
                            </div>

                            <div className="text-right">
                              <span className="text-xs text-slate-400">ប្រាក់ដើម: </span>
                              <span className="font-bold text-slate-900 tabular-nums">
                                {formatMoney(cnt.principalAmount, cnt.currency)}
                              </span>
                            </div>
                          </div>

                          {cnt.collateral && (
                            <div className="mt-2 text-xs text-slate-700 bg-slate-50 p-2 rounded border border-slate-100 flex items-center justify-between">
                              <div>
                                <strong>ទ្រព្យ:</strong> {cnt.collateral.name} ({getCollateralCategoryName(cnt.collateral.category)})
                              </div>
                              <span className="text-[11px] text-slate-500">
                                តម្លៃប៉ាន់ស្មាន: {formatMoney(cnt.collateral.estimatedValue, cnt.collateral.currency)}
                              </span>
                            </div>
                          )}

                          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                            <div>
                              អត្រាការប្រាក់: <strong>{cnt.interestRateMonthly}% /ខែ</strong> · រយៈពេល: <strong>{cnt.termMonths} ខែ</strong>
                            </div>
                            <div className="text-right">
                              នៅសល់ប្រាក់ដើម: <strong className="text-slate-900 tabular-nums">{formatMoney(cnt.remainingPrincipal, cnt.currency)}</strong>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-5 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                បិទផ្ទាំង
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Bulk Customer Report Modal */}
      {isBulkReportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static print:block">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 print:max-h-none print:border-none print:shadow-none print:w-full">
            {/* Modal Header (hidden during print) */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 print:hidden">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    របាយការណ៍សង្ខេបបញ្ជីអតិថិជន និងស្ថានភាពឥណទាន
                  </h3>
                  <p className="text-xs text-slate-500">
                    បានជ្រើសរើសអតិថិជនចំនួន <span className="font-semibold text-emerald-700">{selectedCustomerIds.length} នាក់</span> សម្រាប់បោះពុម្ព ឬចេញរបាយការណ៍ផ្លូវការ
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportSelectedCsv}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition-colors shadow-2xs cursor-pointer"
                  title="ទាញយកជា CSV / Excel"
                >
                  <Download className="w-4 h-4 text-slate-600" />
                  <span>ទាញយក CSV</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors shadow-xs cursor-pointer"
                  title="បោះពុម្ពរបាយការណ៍នេះ"
                >
                  <Printer className="w-4 h-4" />
                  <span>បោះពុម្ពរបាយការណ៍ (Print)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsBulkReportModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-lg transition-colors cursor-pointer"
                  title="បិទផ្ទាំង"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body / Printable Document Area */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6 print:overflow-visible print:p-0">
              {(() => {
                const targetCustomers = customers.filter(c => selectedCustomerIds.includes(c.id));
                let totalActiveLoans = 0;
                let totalOverdueLoans = 0;
                let totalUSD = 0;
                let totalKHR = 0;
                let totalCollateralsCount = 0;

                targetCustomers.forEach(cust => {
                  const data = customerLoanData.get(cust.id);
                  if (data) {
                    totalActiveLoans += data.activeContracts.length;
                    totalOverdueLoans += data.overdueContracts.length;
                    totalUSD += data.totalRemainingUSD;
                    totalKHR += data.totalRemainingKHR;
                    totalCollateralsCount += data.activeCollaterals.length;
                  }
                });

                return (
                  <div className="space-y-6 text-slate-800">
                    {/* Official Cambodian Header */}
                    <div className="text-center border-b border-slate-200 pb-5">
                      <p className="font-bold text-sm text-slate-900 tracking-wider">ព្រះរាជាណាចក្រកម្ពុជា</p>
                      <p className="font-bold text-xs text-slate-700 tracking-widest mt-0.5">ជាតិ សាសនា ព្រះមហាក្សត្រ</p>
                      <div className="w-16 h-0.5 bg-slate-400 mx-auto my-2" />
                      <h2 className="text-lg font-bold text-slate-900 mt-2">
                        ប្រព័ន្ធគ្រប់គ្រងហាងកម្ចី និងបញ្ចាំរហ័ស
                      </h2>
                      <p className="text-xs text-slate-600 font-medium mt-1">
                        របាយការណ៍សង្ខេបស្ថានភាពអតិថិជន និងសមតុល្យបំណុលនៅសល់ (Selected Customers Credit Statement)
                      </p>
                      <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-center gap-4">
                        <span>កាលបរិច្ឆេទបង្កើត: <strong>{new Date().toLocaleDateString('km-KH')}</strong></span>
                        <span>·</span>
                        <span>ម៉ោង: <strong>{new Date().toLocaleTimeString('km-KH')}</strong></span>
                        <span>·</span>
                        <span>ចំនួនអតិថិជន: <strong>{targetCustomers.length} នាក់</strong></span>
                      </div>
                    </div>

                    {/* Summary Metric Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-[11px] text-slate-500 block">អតិថិជនជ្រើសរើស</span>
                        <span className="text-lg font-bold text-slate-900 tabular-nums">
                          {targetCustomers.length} <span className="text-xs font-normal text-slate-500">នាក់</span>
                        </span>
                      </div>
                      <div className="p-3 bg-emerald-50/70 rounded-lg border border-emerald-200">
                        <span className="text-[11px] text-emerald-800 block">កម្ចីសកម្ម / ហួសកំណត់</span>
                        <span className="text-lg font-bold text-emerald-950 tabular-nums">
                          {totalActiveLoans} <span className="text-xs font-normal text-emerald-700">សកម្ម</span>
                          {totalOverdueLoans > 0 && (
                            <span className="text-xs text-rose-600 font-medium ml-1">({totalOverdueLoans} យឺត)</span>
                          )}
                        </span>
                      </div>
                      <div className="p-3 bg-blue-50/70 rounded-lg border border-blue-200">
                        <span className="text-[11px] text-blue-800 block">បំណុលដើមនៅសល់ (USD)</span>
                        <span className="text-lg font-bold text-blue-950 tabular-nums">
                          ${totalUSD.toLocaleString()}
                        </span>
                      </div>
                      <div className="p-3 bg-amber-50/70 rounded-lg border border-amber-200">
                        <span className="text-[11px] text-amber-800 block">បំណុលដើមនៅសល់ (KHR)</span>
                        <span className="text-lg font-bold text-amber-950 tabular-nums">
                          {totalKHR.toLocaleString()} ៛
                        </span>
                      </div>
                    </div>

                    {/* Report Table */}
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-semibold">
                            <th className="py-2.5 px-3 w-8 text-center">#</th>
                            <th className="py-2.5 px-3">លេខកូដ & ឈ្មោះអតិថិជន</th>
                            <th className="py-2.5 px-3">លេខទូរស័ព្ទ / អត្តសញ្ញាណ</th>
                            <th className="py-2.5 px-3">អាសយដ្ឋាន</th>
                            <th className="py-2.5 px-3 text-center">កម្ចីសកម្ម</th>
                            <th className="py-2.5 px-3 text-right">បំណុលនៅសល់</th>
                            <th className="py-2.5 px-3">ទ្រព្យបញ្ចាំតម្កល់</th>
                            <th className="py-2.5 px-3 text-center">កម្រិតទុកចិត្ត</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {targetCustomers.map((cust, idx) => {
                            const data = customerLoanData.get(cust.id);
                            const activeCount = (data?.activeContracts.length || 0) + (data?.overdueContracts.length || 0);

                            return (
                              <tr key={cust.id} className="hover:bg-slate-50/60">
                                <td className="py-2.5 px-3 text-center text-slate-400 font-mono">
                                  {idx + 1}
                                </td>
                                <td className="py-2.5 px-3">
                                  <div className="font-semibold text-slate-900">{cust.nameKhmer}</div>
                                  <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                                    <span>{cust.code}</span>
                                    <span>·</span>
                                    <span>{cust.nameLatin}</span>
                                  </div>
                                </td>
                                <td className="py-2.5 px-3">
                                  <div className="font-mono text-slate-800 font-medium">{cust.phone}</div>
                                  <div className="text-[11px] text-slate-400 font-mono">ID: {cust.nationalId}</div>
                                </td>
                                <td className="py-2.5 px-3 text-slate-600 max-w-[180px] truncate">
                                  {cust.address}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  {activeCount > 0 ? (
                                    <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                      {activeCount} កម្ចី
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 font-medium">គ្មានកម្ចី</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                                  {(data?.totalRemainingUSD || 0) > 0 && (
                                    <div className="font-semibold text-slate-900">
                                      ${data?.totalRemainingUSD.toLocaleString()}
                                    </div>
                                  )}
                                  {(data?.totalRemainingKHR || 0) > 0 && (
                                    <div className="text-[11px] text-slate-600 font-medium">
                                      {data?.totalRemainingKHR.toLocaleString()} ៛
                                    </div>
                                  )}
                                  {(!data || (data.totalRemainingUSD === 0 && data.totalRemainingKHR === 0)) && (
                                    <span className="text-slate-400">$0.00</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                                  {data && data.activeCollaterals.length > 0 ? (
                                    <span>{data.activeCollaterals.slice(0, 2).join(', ')}{data.activeCollaterals.length > 2 ? ` (+${data.activeCollaterals.length - 2})` : ''}</span>
                                  ) : (
                                    <span className="text-slate-400">គ្មានទ្រព្យតម្កល់</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <span className={`text-[10px] px-2 py-0.5 rounded font-medium border ${
                                    cust.status === 'reliable' 
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                      : cust.status === 'watchlist' 
                                        ? 'bg-amber-50 text-amber-700 border-amber-200' 
                                        : cust.status === 'blocked' 
                                          ? 'bg-rose-50 text-rose-700 border-rose-200' 
                                          : 'bg-slate-100 text-slate-700 border-slate-200'
                                  }`}>
                                    {cust.status === 'reliable' ? 'ទុកចិត្តខ្ពស់' : cust.status === 'watchlist' ? 'ឃ្លាំមើល' : cust.status === 'blocked' ? 'ផ្អាកផ្តល់កម្ចី' : 'ធម្មតា'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Official Signatures / Approvals Block */}
                    <div className="pt-8 mt-6 grid grid-cols-3 gap-6 text-center text-xs text-slate-600">
                      <div>
                        <p className="font-semibold text-slate-900 mb-16">អ្នករៀបចំរបាយការណ៍</p>
                        <div className="border-t border-slate-300 w-32 mx-auto pt-1 text-[11px] text-slate-400">
                          (ហត្ថលេខា & ឈ្មោះ)
                        </div>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 mb-16">គណនេយ្យករ / បេឡាធិការ</p>
                        <div className="border-t border-slate-300 w-32 mx-auto pt-1 text-[11px] text-slate-400">
                          (ហត្ថលេខា & ឈ្មោះ)
                        </div>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 mb-16">ប្រធានសាខា / អ្នកអនុម័ត</p>
                        <div className="border-t border-slate-300 w-32 mx-auto pt-1 text-[11px] text-slate-400">
                          (ហត្ថលេខា & ត្រា)
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer (hidden during print) */}
            <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50 print:hidden">
              <span className="text-xs text-slate-500">
                ព័ត៌មាននេះជាឯកសារផ្ទៃក្នុងសម្រាប់គ្រប់គ្រងឥណទាន និងហានិភ័យ
              </span>
              <button
                type="button"
                onClick={() => setIsBulkReportModalOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                បិទផ្ទាំង
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
