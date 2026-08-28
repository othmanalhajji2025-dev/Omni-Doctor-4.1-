import React, { useState, useEffect } from 'react';
import {
  User,
  Stethoscope,
  Crown,
  ShieldAlert,
  Search,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  KeyRound,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  Award,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { Card, Badge, Button, Input, Select, Modal, LoadingState, Alert } from '../../components/ui/index.js';
import { UserRole } from '../../types/index.js';

interface AdminUserRecord {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  fullNameEn?: string;
  specialty?: string;
  licenseNumber?: string;
  phoneNumber?: string;
  createdAt: string;
  updatedAt?: string;
}

export const AdminUsersTab: React.FC = () => {
  const { language } = useLanguage();
  const { role, fetchWithAuth } = useAuth();
  const isAr = language === 'ar';

  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUserRecord | null>(null);

  // Form State
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formFullName, setFormFullName] = useState('');
  const [formFullNameEn, setFormFullNameEn] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('USER');
  const [formSpecialty, setFormSpecialty] = useState('');
  const [formLicense, setFormLicense] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let url = '/api/admin/users';
      const params = new URLSearchParams();
      if (roleFilter !== 'ALL') params.append('role', roleFilter);
      if (searchQuery.trim()) params.append('query', searchQuery.trim());
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetchWithAuth(url);
      if (!res.ok) {
        throw new Error('Access denied: Unauthorized to view user directory');
      }
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [roleFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadUsers();
  };

  const handleRoleQuickChange = async (targetUserId: string, newRole: UserRole) => {
    try {
      const res = await fetchWithAuth(`/api/admin/users/${targetUserId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.messageAr || data.error || 'Failed to update role');

      setUsers(users.map(u => (u.id === targetUserId ? { ...u, role: newRole } : u)));
      setSuccessMsg(data.messageAr || (isAr ? 'تم تحديث الصلاحية بنجاح' : 'Role updated'));
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmail || !formPassword || !formFullName) {
      setError(isAr ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill required fields');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetchWithAuth('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formEmail,
          password: formPassword,
          fullName: formFullName,
          fullNameEn: formFullNameEn || formFullName,
          role: formRole,
          specialty: formSpecialty || undefined,
          licenseNumber: formLicense || undefined,
          phoneNumber: formPhone || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.messageAr || data.error || 'Failed to create user');

      setSuccessMsg(data.messageAr || (isAr ? 'تم إنشاء الحساب بنجاح' : 'User created'));
      setIsAddModalOpen(false);
      resetForm();
      loadUsers();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetchWithAuth(`/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formEmail,
          fullName: formFullName,
          fullNameEn: formFullNameEn,
          role: formRole,
          specialty: formSpecialty,
          licenseNumber: formLicense,
          phoneNumber: formPhone,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.messageAr || data.error || 'Failed to update user');

      setSuccessMsg(data.messageAr || (isAr ? 'تم تحديث البيانات بنجاح' : 'User updated'));
      setIsEditModalOpen(false);
      loadUsers();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetchWithAuth(`/api/admin/users/${selectedUser.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.messageAr || data.error || 'Failed to delete user');

      setSuccessMsg(data.messageAr || (isAr ? 'تم حذف الحساب بنجاح' : 'User deleted'));
      setIsDeleteModalOpen(false);
      loadUsers();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (user: AdminUserRecord) => {
    setSelectedUser(user);
    setFormEmail(user.email);
    setFormFullName(user.fullName);
    setFormFullNameEn(user.fullNameEn || '');
    setFormRole(user.role);
    setFormSpecialty(user.specialty || '');
    setFormLicense(user.licenseNumber || '');
    setFormPhone(user.phoneNumber || '');
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (user: AdminUserRecord) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const resetForm = () => {
    setFormEmail('');
    setFormPassword('');
    setFormFullName('');
    setFormFullNameEn('');
    setFormRole('USER');
    setFormSpecialty('');
    setFormLicense('');
    setFormPhone('');
    setSelectedUser(null);
  };

  const totalPatients = users.filter(u => u.role === 'USER').length;
  const totalDoctors = users.filter(u => u.role === 'HEALTHCARE_PROFESSIONAL').length;
  const totalAdmins = users.filter(u => u.role === 'ADMINISTRATOR' || u.role === 'SUPER_ADMIN').length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <Card className="p-4 bg-slate-900/90 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">{isAr ? 'إجمالي الحسابات' : 'Total Accounts'}</span>
            <User className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-slate-100 mt-2">{users.length}</p>
        </Card>

        <Card className="p-4 bg-slate-900/90 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">{isAr ? 'المرضى (Patients)' : 'Patients'}</span>
            <Badge variant="success" size="sm">{totalPatients}</Badge>
          </div>
          <p className="text-2xl font-black text-emerald-400 mt-2">{totalPatients}</p>
        </Card>

        <Card className="p-4 bg-slate-900/90 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">{isAr ? 'الأطباء والممارسين' : 'Doctors & Pros'}</span>
            <Stethoscope className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-black text-cyan-400 mt-2">{totalDoctors}</p>
        </Card>

        <Card className="p-4 bg-slate-900/90 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">{isAr ? 'المشرفون (Admins)' : 'Administrators'}</span>
            <Crown className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-black text-purple-400 mt-2">{totalAdmins}</p>
        </Card>
      </div>

      {/* Messages */}
      {error && (
        <Alert variant="danger" title={isAr ? 'خطأ أمني / إداري' : 'Error'}>
          {error}
        </Alert>
      )}
      {successMsg && (
        <Alert variant="success" title={isAr ? 'اكتمل بنجاح' : 'Success'}>
          {successMsg}
        </Alert>
      )}

      {/* Action Bar & Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-900/70 p-3.5 rounded-xl border border-slate-800">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute start-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'بحث بالاسم، البريد، التخصص، أو الهاتف...' : 'Search by name, email, specialty, phone...'}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs py-2 ps-9 pe-3 text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm">
            {isAr ? 'بحث' : 'Search'}
          </Button>
        </form>

        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg text-xs py-2 px-3 text-slate-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="ALL">{isAr ? 'كافة الأدوار (All Roles)' : 'All Roles'}</option>
            <option value="USER">USER (مريض)</option>
            <option value="HEALTHCARE_PROFESSIONAL">HEALTHCARE_PROFESSIONAL (طبيب)</option>
            <option value="ADMINISTRATOR">ADMINISTRATOR (مشرف)</option>
            <option value="SUPER_ADMIN">SUPER_ADMIN (المدير الأعلى)</option>
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={loadUsers}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            {isAr ? 'تحديث' : 'Refresh'}
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              resetForm();
              setIsAddModalOpen(true);
            }}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            {isAr ? 'إضافة مستخدم' : 'Add User'}
          </Button>
        </div>
      </div>

      {/* Users Directory Table */}
      <Card className="p-0 overflow-hidden border-slate-800">
        {isLoading ? (
          <div className="py-12">
            <LoadingState text={isAr ? 'جارِ جلب قائمة المستخدمين...' : 'Loading users directory...'} />
          </div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            {isAr ? 'لا يوجد مستخدمون يطابقون معايير البحث' : 'No users match search criteria'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 text-start">{isAr ? 'المستخدم' : 'User'}</th>
                  <th className="py-3 px-4 text-start">{isAr ? 'البريد / الهاتف' : 'Contact'}</th>
                  <th className="py-3 px-4 text-start">{isAr ? 'الدور الحالي' : 'Current Role'}</th>
                  <th className="py-3 px-4 text-start">{isAr ? 'ترقية وتعديل الصلاحية (RBAC)' : 'Change Role'}</th>
                  <th className="py-3 px-4 text-start">{isAr ? 'تاريخ التسجيل' : 'Registered'}</th>
                  <th className="py-3 px-4 text-center">{isAr ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-900/60 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-200">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                          {u.role === 'SUPER_ADMIN' ? (
                            <Crown className="w-4 h-4 text-purple-400" />
                          ) : u.role === 'ADMINISTRATOR' ? (
                            <ShieldAlert className="w-4 h-4 text-amber-400" />
                          ) : u.role === 'HEALTHCARE_PROFESSIONAL' ? (
                            <Stethoscope className="w-4 h-4 text-cyan-400" />
                          ) : (
                            <User className="w-4 h-4 text-emerald-400" />
                          )}
                        </div>
                        <div>
                          <span>{u.fullName}</span>
                          {u.specialty && (
                            <div className="flex items-center gap-1 text-[10px] text-cyan-400 font-normal">
                              <Award className="w-2.5 h-2.5" />
                              <span>{u.specialty}</span>
                              {u.licenseNumber && <span>({u.licenseNumber})</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      <div>{u.email}</div>
                      {u.phoneNumber && <div className="text-[10px] text-slate-500">{u.phoneNumber}</div>}
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          u.role === 'SUPER_ADMIN'
                            ? 'primary'
                            : u.role === 'ADMINISTRATOR'
                            ? 'warning'
                            : u.role === 'HEALTHCARE_PROFESSIONAL'
                            ? 'info'
                            : 'success'
                        }
                        size="sm"
                      >
                        {u.role}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleQuickChange(u.id, e.target.value as UserRole)}
                        disabled={role !== 'SUPER_ADMIN' && u.role === 'SUPER_ADMIN'}
                        className="bg-slate-950 border border-slate-700 rounded-lg text-xs py-1 px-2 text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer disabled:opacity-50"
                      >
                        <option value="USER">USER (مريض)</option>
                        <option value="HEALTHCARE_PROFESSIONAL">HEALTHCARE_PROFESSIONAL (طبيب)</option>
                        <option value="ADMINISTRATOR">ADMINISTRATOR (مشرف)</option>
                        {role === 'SUPER_ADMIN' && (
                          <option value="SUPER_ADMIN">SUPER_ADMIN (المدير الأعلى)</option>
                        )}
                      </select>
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {new Date(u.createdAt).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openEditModal(u)}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
                          title={isAr ? 'تعديل البيانات' : 'Edit details'}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(u)}
                          disabled={u.id === selectedUser?.id || (u.role === 'SUPER_ADMIN' && role !== 'SUPER_ADMIN')}
                          className="p-1.5 rounded-lg bg-rose-950/40 text-rose-400 hover:bg-rose-900/60 hover:text-white transition-colors cursor-pointer disabled:opacity-30"
                          title={isAr ? 'حذف الحساب' : 'Delete user'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add User Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={isAr ? 'إضافة مستخدم جديد للنظام' : 'Add New Platform User'}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {isAr ? 'الاسم الكامل (عربي)' : 'Full Name (Arabic)'} *
              </label>
              <input
                type="text"
                required
                value={formFullName}
                onChange={(e) => setFormFullName(e.target.value)}
                placeholder="د. أحمد عبدالله"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs py-2 px-3 text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {isAr ? 'الاسم بالإنجليزي' : 'Full Name (English)'}
              </label>
              <input
                type="text"
                value={formFullNameEn}
                onChange={(e) => setFormFullNameEn(e.target.value)}
                placeholder="Dr. Ahmed Abdullah"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs py-2 px-3 text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {isAr ? 'البريد الإلكتروني' : 'Email'} *
              </label>
              <input
                type="email"
                required
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="doctor@hospital.org"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs py-2 px-3 text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {isAr ? 'كلمة المرور' : 'Password'} *
              </label>
              <input
                type="password"
                required
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs py-2 px-3 text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {isAr ? 'الدور في المنصة (RBAC)' : 'User Role'}
              </label>
              <select
                value={formRole}
                onChange={(e) => setFormRole(e.target.value as UserRole)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs py-2 px-3 text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="USER">USER (مريض / مستخدم عادي)</option>
                <option value="HEALTHCARE_PROFESSIONAL">HEALTHCARE_PROFESSIONAL (طبيب / ممارس)</option>
                <option value="ADMINISTRATOR">ADMINISTRATOR (مشرف نظام)</option>
                {role === 'SUPER_ADMIN' && (
                  <option value="SUPER_ADMIN">SUPER_ADMIN (المدير الأعلى)</option>
                )}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {isAr ? 'رقم الهاتف' : 'Phone Number'}
              </label>
              <input
                type="text"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="+966 50 123 4567"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs py-2 px-3 text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {formRole === 'HEALTHCARE_PROFESSIONAL' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-cyan-950/20 border border-cyan-800/40 rounded-xl animate-fadeIn">
              <div>
                <label className="block text-xs font-medium text-cyan-300 mb-1">
                  {isAr ? 'التخصص الطبي' : 'Medical Specialty'}
                </label>
                <input
                  type="text"
                  value={formSpecialty}
                  onChange={(e) => setFormSpecialty(e.target.value)}
                  placeholder="أمراض الباطنية / القلب"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs py-2 px-3 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-cyan-300 mb-1">
                  {isAr ? 'رقم ترخيص المزاولة' : 'License Number'}
                </label>
                <input
                  type="text"
                  value={formLicense}
                  onChange={(e) => setFormLicense(e.target.value)}
                  placeholder="MOH-849201"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs py-2 px-3 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
            >
              {isAr ? 'حفظ وإنشاء الحساب' : 'Create User'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={isAr ? `تعديل بيانات المستخدم: ${selectedUser?.fullName}` : `Edit User: ${selectedUser?.fullName}`}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleUpdateUser} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {isAr ? 'الاسم الكامل (عربي)' : 'Full Name (Arabic)'} *
              </label>
              <input
                type="text"
                required
                value={formFullName}
                onChange={(e) => setFormFullName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs py-2 px-3 text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {isAr ? 'الاسم بالإنجليزي' : 'Full Name (English)'}
              </label>
              <input
                type="text"
                value={formFullNameEn}
                onChange={(e) => setFormFullNameEn(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs py-2 px-3 text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {isAr ? 'البريد الإلكتروني' : 'Email'} *
              </label>
              <input
                type="email"
                required
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs py-2 px-3 text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {isAr ? 'الدور (RBAC)' : 'User Role'}
              </label>
              <select
                value={formRole}
                onChange={(e) => setFormRole(e.target.value as UserRole)}
                disabled={role !== 'SUPER_ADMIN' && selectedUser?.role === 'SUPER_ADMIN'}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs py-2 px-3 text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="USER">USER (مريض)</option>
                <option value="HEALTHCARE_PROFESSIONAL">HEALTHCARE_PROFESSIONAL (طبيب)</option>
                <option value="ADMINISTRATOR">ADMINISTRATOR (مشرف)</option>
                {role === 'SUPER_ADMIN' && (
                  <option value="SUPER_ADMIN">SUPER_ADMIN (المدير الأعلى)</option>
                )}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {isAr ? 'رقم الهاتف' : 'Phone'}
              </label>
              <input
                type="text"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs py-2 px-3 text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {isAr ? 'التخصص الطبي' : 'Specialty'}
              </label>
              <input
                type="text"
                value={formSpecialty}
                onChange={(e) => setFormSpecialty(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs py-2 px-3 text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {isAr ? 'رقم الترخيص' : 'License'}
              </label>
              <input
                type="text"
                value={formLicense}
                onChange={(e) => setFormLicense(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs py-2 px-3 text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditModalOpen(false)}
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
            >
              {isAr ? 'حفظ التعديلات' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title={isAr ? 'تأكيد حذف الحساب' : 'Confirm User Deletion'}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            {isAr
              ? `هل أنت متأكد من رغبتك في حذف حساب "${selectedUser?.fullName}" (${selectedUser?.email})؟ سيتم حذف جميع السجلات الصحية المرتبطة به نهائياً وفق معايير الخصوصية.`
              : `Are you sure you want to permanently delete user "${selectedUser?.fullName}" (${selectedUser?.email}) and all isolated records?`}
          </p>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              {isAr ? 'تراجع' : 'Cancel'}
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              isLoading={isSubmitting}
              onClick={handleDeleteUser}
            >
              {isAr ? 'نعم، احذف الحساب' : 'Delete Account'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
