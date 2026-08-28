import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  KeyRound,
  Shield,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { Card, Badge, Button, Input, Select, Modal, Alert, LoadingState } from '../../components/ui/index.js';
import { UserRole } from '../../types/index.js';

interface AdminUserRecord {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  createdAt: string;
  lastLoginAt?: string;
}

export const UsersManagementTab: React.FC = () => {
  const { language } = useLanguage();
  const { user: currentUser, fetchWithAuth } = useAuth();
  const isAr = language === 'ar';

  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isResetPwdOpen, setIsResetPwdOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUserRecord | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const [newUserForm, setNewUserForm] = useState({
    email: '',
    fullName: '',
    password: '',
    role: 'USER' as UserRole,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchWithAuth('/api/admin/users');
      if (!res.ok) throw new Error('Failed to load user list');
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err: any) {
      setError(err.message || 'Error fetching users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setError(null);
    try {
      const res = await fetchWithAuth(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update role');

      setSuccessMsg(data.messageAr || (isAr ? 'تم تعديل الصلاحية بنجاح' : 'Role updated successfully'));
      loadUsers();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleStatusToggle = async (userId: string, currentStatus: string) => {
    setError(null);
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      const res = await fetchWithAuth(`/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update status');

      setSuccessMsg(data.messageAr || (isAr ? 'تم تحديث حالة الحساب' : 'Status updated'));
      loadUsers();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !newPassword) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetchWithAuth(`/api/admin/users/${selectedUser.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password');

      setSuccessMsg(data.messageAr || (isAr ? 'تم تعيين كلمة المرور الجديدة' : 'Password reset'));
      setIsResetPwdOpen(false);
      setNewPassword('');
      setSelectedUser(null);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetchWithAuth('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUserForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create user');

      setSuccessMsg(data.messageAr || (isAr ? 'تم إنشاء الحساب بنجاح' : 'User created'));
      setIsAddUserOpen(false);
      setNewUserForm({ email: '', fullName: '', password: '', role: 'USER' });
      loadUsers();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex-1 flex items-center gap-2 max-w-md">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isAr ? 'بحث بالاسم، البريد أو المعرف...' : 'Search by name, email, or ID...'}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            className="w-full"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            options={[
              { value: 'ALL', label: isAr ? 'جميع الأدوار' : 'All Roles' },
              { value: 'USER', label: 'Patient (USER)' },
              { value: 'HEALTHCARE_PROFESSIONAL', label: 'Doctor (HEALTHCARE_PROFESSIONAL)' },
              { value: 'ADMINISTRATOR', label: 'Admin (ADMINISTRATOR)' },
              { value: 'SUPER_ADMIN', label: 'Super Admin (SUPER_ADMIN)' },
            ]}
          />

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
            onClick={() => setIsAddUserOpen(true)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            {isAr ? 'إضافة مستخدم' : 'Add User'}
          </Button>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {successMsg && <Alert variant="success">{successMsg}</Alert>}

      {/* Users Table */}
      {isLoading ? (
        <LoadingState message={isAr ? 'جاري تحميل المستخدمين...' : 'Loading users...'} />
      ) : (
        <Card className="overflow-hidden bg-slate-900/70 border-slate-800 p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">{isAr ? 'المستخدم' : 'User'}</th>
                  <th className="py-3.5 px-4">{isAr ? 'الدور (RBAC Role)' : 'Role'}</th>
                  <th className="py-3.5 px-4">{isAr ? 'الحالة' : 'Status'}</th>
                  <th className="py-3.5 px-4">{isAr ? 'تاريخ الإنشاء' : 'Created'}</th>
                  <th className="py-3.5 px-4 text-center">{isAr ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div>
                        <div className="font-bold text-slate-100">{u.fullName}</div>
                        <div className="text-slate-400 text-[11px] font-mono">{u.email}</div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                        className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-xs font-semibold text-cyan-400 focus:outline-none"
                      >
                        <option value="USER">USER (Patient)</option>
                        <option value="HEALTHCARE_PROFESSIONAL">HEALTHCARE_PROFESSIONAL</option>
                        <option value="ADMINISTRATOR">ADMINISTRATOR</option>
                        <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                      </select>
                    </td>

                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleStatusToggle(u.id, u.status || 'ACTIVE')}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                          u.status === 'ACTIVE'
                            ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
                            : 'bg-rose-950/80 border-rose-800 text-rose-300'
                        }`}
                      >
                        {u.status === 'ACTIVE' ? <CheckCircle2 className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}
                        {u.status || 'ACTIVE'}
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-slate-400">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(u);
                          setIsResetPwdOpen(true);
                        }}
                        leftIcon={<KeyRound className="w-3 h-3 text-amber-400" />}
                      >
                        {isAr ? 'إعادة تعيين كلمة المرور' : 'Reset Pwd'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal: Add User */}
      <Modal
        isOpen={isAddUserOpen}
        onClose={() => setIsAddUserOpen(false)}
        title={isAr ? 'إضافة مستخدم جديد' : 'Add New User'}
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <Input
            label={isAr ? 'الاسم الكامل' : 'Full Name'}
            required
            value={newUserForm.fullName}
            onChange={(e) => setNewUserForm({ ...newUserForm, fullName: e.target.value })}
            placeholder="د. أحمد الصنعاني"
          />
          <Input
            label={isAr ? 'البريد الإلكتروني' : 'Email Address'}
            type="email"
            required
            value={newUserForm.email}
            onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
            placeholder="doctor@yemenmd.org"
          />
          <Input
            label={isAr ? 'كلمة المرور الأولية' : 'Initial Password'}
            type="password"
            required
            value={newUserForm.password}
            onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
            placeholder="••••••••"
          />
          <Select
            label={isAr ? 'الدور والصلاحيات (RBAC Role)' : 'RBAC Role'}
            value={newUserForm.role}
            onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value as UserRole })}
            options={[
              { value: 'USER', label: 'مستخدم / مريض (Patient)' },
              { value: 'HEALTHCARE_PROFESSIONAL', label: 'ممارس صحي / طبيب (Doctor)' },
              { value: 'ADMINISTRATOR', label: 'مدير نظام (Administrator)' },
              { value: 'SUPER_ADMIN', label: 'مدير أعلى (Super Admin)' },
            ]}
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="outline" type="button" onClick={() => setIsAddUserOpen(false)}>
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              {isAr ? 'إنشاء الحساب' : 'Create User'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Reset Password */}
      <Modal
        isOpen={isResetPwdOpen}
        onClose={() => {
          setIsResetPwdOpen(false);
          setSelectedUser(null);
          setNewPassword('');
        }}
        title={selectedUser ? `${isAr ? 'إعادة تعيين كلمة مرور:' : 'Reset Password for:'} ${selectedUser.fullName}` : ''}
      >
        <form onSubmit={handleResetPassword} className="space-y-4">
          <Input
            label={isAr ? 'كلمة المرور الجديدة' : 'New Password'}
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Minimum 6 characters"
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setIsResetPwdOpen(false);
                setSelectedUser(null);
              }}
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              {isAr ? 'تعيين كلمة المرور' : 'Set Password'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
