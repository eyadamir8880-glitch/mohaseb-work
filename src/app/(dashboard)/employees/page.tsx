'use client';

import { useState, useMemo } from 'react';
import { useLanguage } from '@/providers/language-provider';
import { useAppStore } from '@/stores/use-app-store';
import { formatCurrency, formatDate, getStatusColor, generateId } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';
import { Trash2 } from 'lucide-react';

export default function EmployeesPage() {
  const { language, t } = useLanguage();
  const store = useAppStore();
  const { employees, payrollRecords } = store;
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPayroll, setShowPayroll] = useState(false);
  const [payrollMonth, setPayrollMonth] = useState(new Date().getMonth() + 1);
  const [payrollYear, setPayrollYear] = useState(new Date().getFullYear());
  const [showDeleteAll, setShowDeleteAll] = useState(false);

  const columns = [
    { key: 'name', header: t('employees.name'), sortable: true, render: (item: any) => language === 'ar' ? item.nameAr || item.name : item.name },
    { key: 'position', header: t('employees.position'), render: (item: any) => language === 'ar' ? item.positionAr || item.position : item.position },
    { key: 'phone', header: t('employees.phone') },
    { key: 'baseSalary', header: t('employees.baseSalary'), render: (item: any) => formatCurrency(item.baseSalary, 'EGP', language) },
    { key: 'netSalary', header: t('employees.netSalary'), render: (item: any) => formatCurrency(item.netSalary, 'EGP', language) },
    { key: 'joinDate', header: t('employees.joinDate'), render: (item: any) => formatDate(item.joinDate) },
    { key: 'status', header: t('app.status'), render: (item: any) => (
      <span className={`badge ${getStatusColor(item.status)}`}>
        {item.status === 'active' ? t('employees.active') : item.status === 'on_leave' ? t('employees.onLeave') : t('employees.terminated')}
      </span>
    )},
    { key: 'actions', header: t('app.actions'), render: (item: any) => (
      <div className="flex gap-1">
        <button className="btn-ghost btn-sm p-1" onClick={() => { setEditingId(item.id); setShowModal(true); }}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button className="btn-ghost btn-sm p-1 text-red-600" onClick={() => { if (confirm(t('app.deleteConfirm'))) store.deleteEmployee(item.id); }}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    )},
  ];

  const handleProcessPayroll = () => {
    const activeEmps = employees.filter(e => e.status === 'active');
    activeEmps.forEach(emp => {
      const existing = payrollRecords.find(r => r.employeeId === emp.id && r.month === payrollMonth && r.year === payrollYear);
      if (!existing) {
        store.addPayrollRecord({
          employeeId: emp.id, month: payrollMonth, year: payrollYear,
          baseSalary: emp.baseSalary, allowances: emp.allowances, deductions: emp.deductions,
          netSalary: emp.netSalary, paymentDate: new Date().toISOString().split('T')[0],
          treasuryTransactionId: null, status: 'paid',
        });
        store.addTreasuryTransaction({
          type: 'expense', amount: emp.netSalary, date: new Date().toISOString().split('T')[0],
          accountId: store.treasuryAccounts[0]?.id || '', fromAccountId: null, toAccountId: null,
          paymentMethod: 'cash', paymentMethodDetail: '', categoryId: '',
          description: `Payroll - ${emp.name} (${payrollMonth}/${payrollYear})`,
          descriptionAr: `رواتب - ${emp.nameAr || emp.name} (${payrollMonth}/${payrollYear})`,
          referenceNumber: '', receiptUrl: '', linkedInvoiceId: null, linkedPOId: null, linkedReturnId: null,
          isRecurring: false, recurringPattern: null, nextOccurrence: null, isReconciled: false, reconciledAt: null,
        });
      }
    });
    alert(`Payroll processed for ${activeEmps.length} employees`);
  };

  const handleDeleteAll = () => {
    store.clearModuleData('employees');
    setShowDeleteAll(false);
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">{t('employees.title')}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowDeleteAll(true)} className="gap-2 text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-950">
            <Trash2 className="h-4 w-4" />
            {t('app.deleteAll')}
          </Button>
          <Button variant="outline" onClick={() => setShowPayroll(true)}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t('employees.payroll')}
          </Button>
          <Button onClick={() => { setEditingId(null); setShowModal(true); }}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            {t('employees.addNew')}
          </Button>
        </div>
      </div>
      <DataTable columns={columns} data={employees} emptyMessage={t('app.noData')} />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? t('employees.editEmployee') : t('employees.addNew')}>
        <EmployeeForm employeeId={editingId} onSave={() => setShowModal(false)} onCancel={() => setShowModal(false)} />
      </Modal>

      <Modal isOpen={showPayroll} onClose={() => setShowPayroll(false)} title={t('employees.processPayroll')}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('employees.month')} type="number" min="1" max="12" value={payrollMonth} onChange={(e) => setPayrollMonth(parseInt(e.target.value))} />
            <Input label={t('employees.year')} type="number" value={payrollYear} onChange={(e) => setPayrollYear(parseInt(e.target.value))} />
          </div>
          <p className="text-sm text-slate-500">
            {employees.filter(e => e.status === 'active').length} {t('employees.active')} employees will be processed.
            Total: {formatCurrency(employees.filter(e => e.status === 'active').reduce((s, e) => s + e.netSalary, 0), 'EGP', language)}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowPayroll(false)}>{t('app.cancel')}</Button>
            <Button onClick={handleProcessPayroll}>{t('employees.processPayroll')}</Button>
          </div>
        </div>
      </Modal>

      {showDeleteAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowDeleteAll(false)} />
          <div className="relative bg-background rounded-lg shadow-xl w-full max-w-sm mx-4 p-6">
            <h2 className="text-lg font-semibold mb-2">{t('app.deleteAll')}</h2>
            <p className="text-sm text-muted-foreground mb-4">{t('app.deleteAllWarning')}</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDeleteAll(false)}>{t('app.cancel')}</Button>
              <Button variant="danger" onClick={handleDeleteAll}>{t('app.yesDelete')}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmployeeForm({ employeeId, onSave, onCancel }: { employeeId: string | null; onSave: () => void; onCancel: () => void }) {
  const { t } = useLanguage();
  const store = useAppStore();
  const existing = employeeId ? store.employees.find(e => e.id === employeeId) : null;
  const [name, setName] = useState(existing?.name || '');
  const [nameAr, setNameAr] = useState(existing?.nameAr || '');
  const [position, setPosition] = useState(existing?.position || '');
  const [positionAr, setPositionAr] = useState(existing?.positionAr || '');
  const [phone, setPhone] = useState(existing?.phone || '');
  const [email, setEmail] = useState(existing?.email || '');
  const [address, setAddress] = useState(existing?.address || '');
  const [joinDate, setJoinDate] = useState(existing?.joinDate || new Date().toISOString().split('T')[0]);
  const [baseSalary, setBaseSalary] = useState(String(existing?.baseSalary || 0));
  const [allowances, setAllowances] = useState(String(existing?.allowances || 0));
  const [deductions, setDeductions] = useState(String(existing?.deductions || 0));
  const [status, setStatus] = useState(existing?.status || 'active');
  const [notes, setNotes] = useState(existing?.notes || '');

  const netSalary = parseFloat(baseSalary) + parseFloat(allowances) - parseFloat(deductions);

  const handleSave = () => {
    const data = { name, nameAr, position, positionAr, phone, email, address, joinDate, baseSalary: parseFloat(baseSalary), allowances: parseFloat(allowances), deductions: parseFloat(deductions), netSalary, status: status as any, notes };
    if (existing) {
      store.updateEmployee(existing.id, data);
    } else {
      store.addEmployee(data);
    }
    onSave();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label={t('employees.name') + ' (EN)'} value={name} onChange={(e) => setName(e.target.value)} />
        <Input label={t('employees.name') + ' (AR)'} value={nameAr} onChange={(e) => setNameAr(e.target.value)} />
        <Input label={t('employees.position') + ' (EN)'} value={position} onChange={(e) => setPosition(e.target.value)} />
        <Input label={t('employees.position') + ' (AR)'} value={positionAr} onChange={(e) => setPositionAr(e.target.value)} />
        <Input label={t('employees.phone')} value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Input label={t('employees.email')} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input label={t('customers.address')} value={address} onChange={(e) => setAddress(e.target.value)} />
        <Input label={t('employees.joinDate')} type="date" value={joinDate} onChange={(e) => setJoinDate(e.target.value)} />
        <Input label={t('employees.baseSalary')} type="number" value={baseSalary} onChange={(e) => setBaseSalary(e.target.value)} />
        <Input label={t('employees.allowances')} type="number" value={allowances} onChange={(e) => setAllowances(e.target.value)} />
        <Input label={t('employees.deductions')} type="number" value={deductions} onChange={(e) => setDeductions(e.target.value)} />
        <div>
          <label className="label">{t('employees.netSalary')}</label>
          <div className="input mt-1 bg-slate-50 dark:bg-slate-700">{formatCurrency(netSalary, 'EGP', 'en')}</div>
        </div>
        <Select label={t('app.status')} value={status} onChange={(e) => setStatus(e.target.value as 'active' | 'on_leave' | 'terminated')}
          options={[
            { value: 'active', label: t('employees.active') },
            { value: 'on_leave', label: t('employees.onLeave') },
            { value: 'terminated', label: t('employees.terminated') },
          ]} />
      </div>
      <div>
        <label className="label">{t('suppliers.notes')}</label>
        <textarea className="input mt-1 min-h-[60px]" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>{t('app.cancel')}</Button>
        <Button onClick={handleSave}>{t('app.save')}</Button>
      </div>
    </div>
  );
}
