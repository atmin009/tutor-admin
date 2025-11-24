import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../components/ui/Table';

interface CourseApiResponse {
  id: number;
  title: string;
  status: 'draft' | 'published' | 'archived' | string;
  price: number;
  teacher?: {
    id: number;
    name: string;
    avatarUrl?: string | null;
  } | null;
  createdAt: string;
}

interface Course {
  id: number;
  title: string;
  status: 'draft' | 'published' | 'archived' | string;
  price: number;
  teacherName?: string | null;
  createdAt: string;
}

interface CoursesResponse {
  data: Course[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

interface ApiResponse {
  data: CoursesResponse;
  message: string;
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

const Courses = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 500);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const fetchCourses = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (statusFilter) params.append('status', statusFilter);

      const response = await axiosInstance.get<{ data: { data: CourseApiResponse[]; meta: CoursesResponse['meta'] }; message: string }>(`/admin/courses?${params.toString()}`);
      // Transform API response to match Course interface
      const transformedCourses: Course[] = response.data.data.data.map((course) => ({
        id: course.id,
        title: course.title,
        status: course.status,
        price: course.price,
        teacherName: course.teacher?.name || null,
        createdAt: course.createdAt,
      }));
      setCourses(transformedCourses);
      setTotalPages(response.data.data.meta.totalPages);
      setTotalItems(response.data.data.meta.totalItems);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch courses');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
    setPage(1);
  };

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };

  const handleDelete = async (course: Course) => {
    if (!window.confirm(`Are you sure you want to delete course "${course.title}"?`)) {
      return;
    }

    try {
      await axiosInstance.delete(`/admin/courses/${course.id}`);
      console.log('Course deleted successfully');
      fetchCourses();
    } catch (err: any) {
      console.error('Failed to delete course:', err.response?.data?.message || err.message);
      alert(err.response?.data?.message || 'Failed to delete course');
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusBadgeVariant = (status: string): 'default' | 'success' | 'danger' | 'warning' | 'outline' => {
    switch (status) {
      case 'published':
        return 'success';
      case 'draft':
        return 'warning';
      case 'archived':
        return 'outline';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Courses</CardTitle>
          <CardDescription>Manage all available courses</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search by title..."
                value={searchInput}
                onChange={handleSearchChange}
              />
            </div>
            <div className="w-full sm:w-48">
              <select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
              >
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <Button variant="primary" onClick={() => navigate('/admin/courses/new')}>
              New Course
            </Button>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <svg className="animate-spin h-8 w-8 text-brand" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-sm text-slate-500 mt-4">Loading courses...</p>
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
                  <h3 className="text-rose-800 font-semibold mb-1">Error loading courses</h3>
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
                    <TableHead>Title</TableHead>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courses.length === 0 ? (
                    <TableRow>
                      <TableCell {...({ colSpan: 6 } as any)} className="text-center py-12">
                        <div className="flex flex-col items-center space-y-3">
                          <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                          <p className="text-slate-500 font-medium">No courses found</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    courses.map((course) => (
                      <TableRow key={course.id}>
                        <TableCell>
                          <span className="font-medium text-slate-900">{course.title}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-slate-600">
                            {course.teacherName || <span className="text-slate-400 italic">No teacher</span>}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-slate-900">{formatCurrency(course.price)}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(course.status)}>
                            {course.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-slate-600">
                            {new Date(course.createdAt).toLocaleDateString('en-US', {
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
                              onClick={() => navigate(`/admin/courses/${course.id}`)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDelete(course)}
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
                    Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, totalItems)} of {totalItems} courses
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
  );
};

export default Courses;
