import { useEffect, useState, useCallback } from 'react';
import axiosInstance from '../api/axios';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../components/ui/Table';
import { Label } from '../components/ui/Label';
import Drawer from '../components/ui/Drawer';

interface User {
  id: number;
  name: string;
  email: string;
  status: 'active' | 'suspended' | string;
  roles: string[];
  createdAt: string;
}

interface UsersResponse {
  data: User[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

interface ApiResponse {
  data: UsersResponse;
  message: string;
}

interface UserFormData {
  name: string;
  email: string;
  password: string;
  status: 'active' | 'suspended';
  roleNames: string[];
}

const AVAILABLE_ROLES = ['super_admin', 'admin', 'teacher'];

// Debounce hook
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// UserForm component
interface UserFormProps {
  mode: 'create' | 'edit';
  initialUser?: User;
  onSubmit: (data: UserFormData) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

const UserForm = ({ mode, initialUser, onSubmit, onCancel, isLoading }: UserFormProps) => {
  const [formData, setFormData] = useState<UserFormData>({
    name: initialUser?.name || '',
    email: initialUser?.email || '',
    password: '',
    status: (initialUser?.status as 'active' | 'suspended') || 'active',
    roleNames: initialUser?.roles || [],
  });

  const [errors, setErrors] = useState<Partial<Record<keyof UserFormData, string>>>({});

  const handleChange = (field: keyof UserFormData, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleRoleToggle = (role: string) => {
    setFormData((prev) => ({
      ...prev,
      roleNames: prev.roleNames.includes(role)
        ? prev.roleNames.filter((r) => r !== role)
        : [...prev.roleNames, role],
    }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof UserFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (mode === 'create' && !formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const submitData = { ...formData };
    // Don't send password if empty in edit mode
    if (mode === 'edit' && !submitData.password) {
      delete (submitData as any).password;
    }

    await onSubmit(submitData as UserFormData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label required>Name</Label>
        <Input
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          error={!!errors.name}
          placeholder="Enter user name"
        />
        {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name}</p>}
      </div>

      <div>
        <Label required>Email</Label>
        <Input
          type="email"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          error={!!errors.email}
          placeholder="Enter email address"
        />
        {errors.email && <p className="text-xs text-rose-500 mt-1">{errors.email}</p>}
      </div>

      <div>
        <Label required={mode === 'create'}>Password</Label>
        <Input
          type="password"
          value={formData.password}
          onChange={(e) => handleChange('password', e.target.value)}
          error={!!errors.password}
          placeholder={mode === 'create' ? 'Enter password' : 'Leave empty to keep current password'}
        />
        {errors.password && <p className="text-xs text-rose-500 mt-1">{errors.password}</p>}
        {mode === 'edit' && (
          <p className="text-xs text-slate-500 mt-1">Leave empty to keep current password</p>
        )}
      </div>

      <div>
        <Label required>Status</Label>
        <select
          value={formData.status}
          onChange={(e) => handleChange('status', e.target.value as 'active' | 'suspended')}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
        >
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      <div>
        <Label>Roles</Label>
        <div className="space-y-2 mt-2">
          {AVAILABLE_ROLES.map((role) => (
            <label key={role} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.roleNames.includes(role)}
                onChange={() => handleRoleToggle(role)}
                className="w-4 h-4 text-brand border-slate-300 rounded focus:ring-brand"
              />
              <span className="text-sm text-slate-700 capitalize">{role.replace('_', ' ')}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" variant="primary" isLoading={isLoading} className="flex-1">
          {mode === 'create' ? 'Create User' : 'Update User'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
      </div>
    </form>
  );
};

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 500);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit'>('create');
  const [selectedUser, setSelectedUser] = useState<User | undefined>();
  const [formLoading, setFormLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (debouncedSearch) params.append('search', debouncedSearch);

      const response = await axiosInstance.get<ApiResponse>(`/admin/users?${params.toString()}`);
      setUsers(response.data.data.data);
      setTotalPages(response.data.data.meta.totalPages);
      setTotalItems(response.data.data.meta.totalItems);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, debouncedSearch]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
    setPage(1);
  };

  const handleCreate = () => {
    setSelectedUser(undefined);
    setDrawerMode('create');
    setDrawerOpen(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setDrawerMode('edit');
    setDrawerOpen(true);
  };

  const handleDelete = async (user: User) => {
    if (!window.confirm(`Are you sure you want to delete user "${user.name}"?`)) {
      return;
    }

    try {
      await axiosInstance.delete(`/admin/users/${user.id}`);
      console.log('User deleted successfully');
      fetchUsers();
    } catch (err: any) {
      console.error('Failed to delete user:', err.response?.data?.message || err.message);
      alert(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleFormSubmit = async (data: UserFormData) => {
    try {
      setFormLoading(true);
      const payload: any = {
        name: data.name,
        email: data.email,
        status: data.status,
        roleNames: data.roleNames,
      };

      if (drawerMode === 'create') {
        payload.password = data.password;
        await axiosInstance.post('/admin/users', payload);
        console.log('User created successfully');
      } else {
        if (data.password) {
          payload.password = data.password;
        }
        await axiosInstance.put(`/admin/users/${selectedUser?.id}`, payload);
        console.log('User updated successfully');
      }

      setDrawerOpen(false);
      fetchUsers();
    } catch (err: any) {
      console.error('Failed to save user:', err.response?.data?.message || err.message);
      alert(err.response?.data?.message || `Failed to ${drawerMode === 'create' ? 'create' : 'update'} user`);
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>Manage all system users</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchInput}
                  onChange={handleSearchChange}
                />
              </div>
              <Button variant="primary" onClick={handleCreate}>
                Add User
              </Button>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-12">
                <svg className="animate-spin h-8 w-8 text-brand" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-sm text-slate-500 mt-4">Loading users...</p>
              </div>
            )}

            {/* Error State */}
            {error && !isLoading && (
              <div className="rounded-lg border-2 border-rose-200 bg-rose-50 px-6 py-4">
                <div className="flex items-start space-x-3">
                  <svg className="w-6 h-6 text-rose-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h3 className="text-rose-800 font-semibold mb-1">Error loading users</h3>
                    <p className="text-rose-700 text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Table */}
            {!isLoading && !error && (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Roles</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell {...({ colSpan: 6 } as any)} className="text-center py-12">
                          <div className="flex flex-col items-center space-y-3">
                            <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            <p className="text-slate-500 font-medium">No users found</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="h-10 w-10 rounded-full bg-[#2563eb] flex items-center justify-center text-white font-semibold text-sm">
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-medium text-slate-900">{user.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-slate-600">{user.email}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.status === 'active' ? 'success' : 'danger'}>
                              {user.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {user.roles && user.roles.length > 0 ? (
                                user.roles.map((role, idx) => (
                                  <Badge key={idx} variant="outline">
                                    {role}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-xs text-slate-400">No roles</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-slate-600">
                              {new Date(user.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(user)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleDelete(user)}
                              >
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-slate-200 px-4 py-4 mt-4">
                    <div className="text-sm text-slate-600">
                      Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, totalItems)} of {totalItems} users
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-slate-600 px-2">
                        Page {page} of {totalPages}
                      </span>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Drawer */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={drawerMode === 'create' ? 'Create User' : 'Edit User'}
      >
        <UserForm
          mode={drawerMode}
          initialUser={selectedUser}
          onSubmit={handleFormSubmit}
          onCancel={() => setDrawerOpen(false)}
          isLoading={formLoading}
        />
      </Drawer>
    </>
  );
};

export default Users;

