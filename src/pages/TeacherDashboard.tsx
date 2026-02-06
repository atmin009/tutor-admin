import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../components/ui/Table';

interface SalesStats {
  totalSales: number;
  totalRevenue: number;
  totalCourses: number;
  courses: Array<{
    id: number;
    title: string;
  }>;
  salesByCourse: Array<{
    courseId: number;
    courseTitle: string;
    sales: number;
    revenue: number;
  }>;
  period: {
    start: string;
    end: string;
  };
}

interface Buyer {
  id: number;
  orderId: string;
  amount: number;
  createdAt: string;
  course: {
    id: number;
    title: string;
  };
  user: {
    id: number;
    name: string;
    email: string;
    phone: string | null;
  };
}

const TeacherDashboard = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState<any>(null);
  const [salesStats, setSalesStats] = useState<SalesStats | null>(null);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        const response = await axiosInstance.get(`/admin/teachers/${id}`);
        setTeacher(response.data.data);
      } catch (err: any) {
        console.error('Failed to fetch teacher:', err);
        setError('ไม่สามารถโหลดข้อมูลผู้สอนได้');
      }
    };

    if (id) {
      fetchTeacher();
    }
  }, [id]);

  const fetchSalesStats = async () => {
    try {
      const response = await axiosInstance.get<{ data: SalesStats; message: string }>(
        `/admin/teachers/${id}/dashboard/stats?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
      );
      setSalesStats(response.data.data);
      setError('');
    } catch (err: any) {
      console.error('Failed to fetch sales stats:', err);
      setError(err.response?.data?.message || 'ไม่สามารถโหลดข้อมูลสถิติการขายได้');
    }
  };

  const fetchBuyers = async () => {
    try {
      const response = await axiosInstance.get<{ data: { data: Buyer[]; meta: any }; message: string }>(
        `/admin/teachers/${id}/dashboard/buyers?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&page=${page}&limit=20`
      );
      setBuyers(response.data.data.data);
      setTotalPages(response.data.data.meta.totalPages);
      setError('');
    } catch (err: any) {
      console.error('Failed to fetch buyers:', err);
      setError(err.response?.data?.message || 'ไม่สามารถโหลดรายชื่อผู้ซื้อได้');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError('');
      try {
        await Promise.all([
          fetchSalesStats(),
          fetchBuyers(),
        ]);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      loadData();
    }
  }, [id, dateRange, page]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!teacher) {
    return (
      <div className="flex items-center justify-center py-12">
        <svg className="animate-spin h-8 w-8 text-brand" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin/teachers')}
            >
              ← กลับ
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">แดชบอร์ดผู้สอน</h1>
              <p className="mt-1 text-slate-600">{teacher.name}</p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Sales Statistics */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>สถิติการขาย</CardTitle>
              <CardDescription>จำนวนคอร์สที่ขายได้และรายได้</CardDescription>
            </div>
            <div className="flex gap-2">
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin h-8 w-8 text-brand" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : salesStats ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="rounded-lg border border-slate-200 bg-white p-6">
                <p className="text-sm font-medium text-slate-600">จำนวนคอร์สที่ขายได้</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {salesStats.totalSales}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  จาก {salesStats.totalCourses} คอร์ส
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-6">
                <p className="text-sm font-medium text-slate-600">รายได้รวม</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {formatCurrency(salesStats.totalRevenue)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {salesStats.totalSales > 0
                    ? `เฉลี่ย ${formatCurrency(salesStats.totalRevenue / salesStats.totalSales)} ต่อรายการ`
                    : '-'}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-6">
                <p className="text-sm font-medium text-slate-600">ช่วงเวลา</p>
                <p className="mt-2 text-sm text-slate-900">
                  {formatDate(salesStats.period.start)} - {formatDate(salesStats.period.end)}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="mt-4 text-sm font-medium text-slate-900">ยังไม่มีข้อมูลการขาย</p>
              <p className="mt-1 text-sm text-slate-500">ยังไม่มีรายการขายในช่วงเวลาที่เลือก</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sales by Course */}
      {salesStats && salesStats.salesByCourse.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>ยอดขายตามคอร์ส</CardTitle>
            <CardDescription>จำนวนการขายและรายได้ของแต่ละคอร์ส</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {salesStats.salesByCourse.map((item) => (
                <div
                  key={item.courseId}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4"
                >
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{item.courseTitle}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      ขายได้ {item.sales} รายการ
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-slate-900">
                      {formatCurrency(item.revenue)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Buyers List */}
      <Card>
        <CardHeader>
          <CardTitle>รายชื่อผู้ซื้อ</CardTitle>
          <CardDescription>รายละเอียดผู้ที่ซื้อคอร์สของคุณ</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin h-8 w-8 text-brand" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : buyers.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>รหัสคำสั่งซื้อ</TableHead>
                      <TableHead>ผู้ซื้อ</TableHead>
                      <TableHead>คอร์ส</TableHead>
                      <TableHead>จำนวนเงิน</TableHead>
                      <TableHead>วันที่ซื้อ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {buyers.map((buyer) => (
                      <TableRow key={buyer.id}>
                        <TableCell className="font-mono text-sm">{buyer.orderId}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-slate-900">{buyer.user.name}</p>
                            <p className="text-xs text-slate-500">{buyer.user.email}</p>
                            {buyer.user.phone && (
                              <p className="text-xs text-slate-500">{buyer.user.phone}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium text-slate-900">{buyer.course.title}</p>
                        </TableCell>
                        <TableCell className="font-semibold text-slate-900">
                          {formatCurrency(buyer.amount)}
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {formatDate(buyer.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-slate-600">
                    หน้า {page} จาก {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      ก่อนหน้า
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      ถัดไป
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <p className="mt-4 text-sm font-medium text-slate-900">ยังไม่มีรายชื่อผู้ซื้อ</p>
              <p className="mt-1 text-sm text-slate-500">ยังไม่มีผู้ซื้อในช่วงเวลาที่เลือก</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherDashboard;

