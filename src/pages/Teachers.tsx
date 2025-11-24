import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../components/ui/Table';
import { Label } from '../components/ui/Label';
import Drawer from '../components/ui/Drawer';

interface Teacher {
  id: number;
  name: string;
  bio?: string | null;
  avatarUrl?: string | null;
  createdAt?: string;
}

interface TeachersResponse {
  data: Teacher[];
  message: string;
}

interface TeacherFormData {
  name: string;
  bio: string;
  avatarUrl: string;
}

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

// Avatar component with fallback
interface AvatarProps {
  avatarUrl?: string | null;
  name: string;
}

const Avatar = ({ avatarUrl, name }: AvatarProps) => {
  const [avatarError, setAvatarError] = useState(false);

  if (avatarUrl && !avatarError) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className="h-8 w-8 rounded-full object-cover"
        onError={() => setAvatarError(true)}
      />
    );
  }

  return (
    <div className="h-8 w-8 rounded-full bg-[#2563eb] flex items-center justify-center text-white font-semibold text-xs">
      {name.charAt(0).toUpperCase()}
    </div>
  );
};

// TeacherForm component
interface TeacherFormProps {
  mode: 'create' | 'edit';
  initialTeacher?: Teacher;
  onSubmit: (data: TeacherFormData) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

const TeacherForm = ({ mode, initialTeacher, onSubmit, onCancel, isLoading }: TeacherFormProps) => {
  const [formData, setFormData] = useState<TeacherFormData>({
    name: initialTeacher?.name || '',
    bio: initialTeacher?.bio || '',
    avatarUrl: initialTeacher?.avatarUrl || '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof TeacherFormData, string>>>({});

  // Reset form when initialTeacher changes (switching between create/edit)
  useEffect(() => {
    if (mode === 'create') {
      setFormData({
        name: '',
        bio: '',
        avatarUrl: '',
      });
    } else if (initialTeacher) {
      setFormData({
        name: initialTeacher.name || '',
        bio: initialTeacher.bio || '',
        avatarUrl: initialTeacher.avatarUrl || '',
      });
    }
    setErrors({});
  }, [mode, initialTeacher]);

  const handleChange = (field: keyof TeacherFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof TeacherFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label required>Name</Label>
        <Input
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          error={!!errors.name}
          placeholder="Enter teacher name"
        />
        {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name}</p>}
      </div>

      <div>
        <Label>Bio</Label>
        <textarea
          value={formData.bio}
          onChange={(e) => handleChange('bio', e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand resize-none"
          placeholder="Enter teacher bio"
        />
      </div>

      <div>
        <Label>Avatar URL</Label>
        <Input
          type="url"
          value={formData.avatarUrl}
          onChange={(e) => handleChange('avatarUrl', e.target.value)}
          placeholder="https://example.com/avatar.jpg"
        />
        <p className="text-xs text-slate-500 mt-1">Enter a URL to the teacher's avatar image</p>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" variant="primary" isLoading={isLoading} className="flex-1">
          {mode === 'create' ? 'Create Teacher' : 'Update Teacher'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
      </div>
    </form>
  );
};

const Teachers = () => {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 500);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit'>('create');
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | undefined>();
  const [formLoading, setFormLoading] = useState(false);

  const fetchTeachers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await axiosInstance.get<TeachersResponse>('/admin/teachers');
      // API returns { data: Teacher[], message: string }
      setTeachers(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch teachers');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  // Debug: Log drawer state changes
  useEffect(() => {
    console.log('=== Drawer State Update ===');
    console.log('drawerOpen:', drawerOpen);
    console.log('drawerMode:', drawerMode);
    console.log('selectedTeacher:', selectedTeacher);
    console.log('========================');
  }, [drawerOpen, drawerMode, selectedTeacher]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  const handleCreate = () => {
    console.log('Add Teacher button clicked');
    console.log('Current drawerOpen state:', drawerOpen);
    // Reset all drawer-related state
    setSelectedTeacher(undefined);
    setDrawerMode('create');
    // Use a callback to ensure state is set
    setDrawerOpen(true);
    console.log('Drawer state set to open - drawerOpen should be true');
  };

  const handleEdit = (teacher: Teacher) => {
    console.log('Edit Teacher clicked for:', teacher.name);
    setSelectedTeacher(teacher);
    setDrawerMode('edit');
    setDrawerOpen(true);
    console.log('Drawer opened in edit mode');
  };

  const handleDelete = async (teacher: Teacher) => {
    if (!window.confirm(`Are you sure you want to delete teacher "${teacher.name}"?`)) {
      return;
    }

    try {
      await axiosInstance.delete(`/admin/teachers/${teacher.id}`);
      console.log('Teacher deleted successfully');
      fetchTeachers();
    } catch (err: any) {
      console.error('Failed to delete teacher:', err.response?.data?.message || err.message);
      alert(err.response?.data?.message || 'Failed to delete teacher');
    }
  };

  const handleFormSubmit = async (data: TeacherFormData) => {
    console.log('Form submit triggered, mode:', drawerMode);
    console.log('Form data:', data);
    
    try {
      setFormLoading(true);
      const payload = {
        name: data.name.trim(),
        bio: data.bio || null,
        avatarUrl: data.avatarUrl || null,
      };

      console.log('Submitting payload:', payload);

      if (drawerMode === 'create') {
        console.log('Calling POST /admin/teachers');
        await axiosInstance.post('/admin/teachers', payload);
        console.log('Teacher created successfully');
      } else if (selectedTeacher) {
        console.log(`Calling PUT /admin/teachers/${selectedTeacher.id}`);
        await axiosInstance.put(`/admin/teachers/${selectedTeacher.id}`, payload);
        console.log('Teacher updated successfully');
      }

      setDrawerOpen(false);
      fetchTeachers();
    } catch (err: any) {
      console.error('Failed to save teacher:', err);
      console.error('Error response:', err.response?.data);
      const errorMessage = err.response?.data?.message || err.message || 'An unexpected error occurred';
      alert(errorMessage);
    } finally {
      setFormLoading(false);
    }
  };

  // Client-side filtering by name
  const filteredTeachers = debouncedSearch
    ? teachers.filter((teacher) =>
        teacher.name.toLowerCase().includes(debouncedSearch.toLowerCase())
      )
    : teachers;

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Teachers</CardTitle>
            <CardDescription>Manage course instructors.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Search by name..."
                  value={searchInput}
                  onChange={handleSearchChange}
                />
              </div>
              <Button variant="primary" onClick={handleCreate}>
                เพิ่มผู้สอน
              </Button>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-12">
                <svg className="animate-spin h-8 w-8 text-brand" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-sm text-slate-500 mt-4">Loading teachers...</p>
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
                    <h3 className="text-rose-800 font-semibold mb-1">Error loading teachers</h3>
                    <p className="text-rose-700 text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Table */}
            {!isLoading && !error && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>รูปภาพ</TableHead>
                    <TableHead>ชื่อ</TableHead>
                    <TableHead>ประวัติ</TableHead>
                    <TableHead className="text-right">การดำเนินการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTeachers.length === 0 ? (
                    <TableRow>
                      <TableCell {...({ colSpan: 4 } as any)} className="text-center py-12">
                        <div className="flex flex-col items-center space-y-3">
                          <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                          <p className="text-slate-500 font-medium">
                            {debouncedSearch ? 'No teachers found matching your search' : 'No teachers found'}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTeachers.map((teacher) => (
                      <TableRow key={teacher.id}>
                        <TableCell>
                          <Avatar avatarUrl={teacher.avatarUrl} name={teacher.name} />
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-slate-900">{teacher.name}</span>
                        </TableCell>
                        <TableCell>
                          <p className="text-slate-600 max-w-md truncate">
                            {teacher.bio || <span className="text-slate-400 italic">No bio</span>}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => navigate(`/admin/teachers/${teacher.id}/dashboard`)}
                            >
                              ดู Dashboard
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(teacher)}
                            >
                              แก้ไข
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDelete(teacher)}
                            >
                              ลบ
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Drawer */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => {
          console.log('Drawer close triggered');
          setDrawerOpen(false);
        }}
        title={drawerMode === 'create' ? 'Create Teacher' : 'Edit Teacher'}
      >
        <TeacherForm
          key={drawerMode === 'create' ? 'create' : `edit-${selectedTeacher?.id}`}
          mode={drawerMode}
          initialTeacher={selectedTeacher}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            console.log('Cancel button clicked');
            setDrawerOpen(false);
          }}
          isLoading={formLoading}
        />
      </Drawer>
    </>
  );
};

export default Teachers;

