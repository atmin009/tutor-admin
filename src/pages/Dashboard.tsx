import { useEffect, useState } from 'react';
import axiosInstance from '../api/axios';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import Drawer from '../components/ui/Drawer';
import Badge from '../components/ui/Badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../components/ui/Table';

interface RevenueStats {
  totalRevenue: number;
  totalOrders: number;
  revenueByPaymentType: Array<{
    paymentType: string;
    _sum: { amount: number };
    _count: number;
  }>;
  dailyRevenue: Array<{
    date: string;
    revenue: number;
    count: number;
  }>;
  orderStatusCounts: Array<{
    status: string;
    _count: number;
  }>;
  period: {
    start: string;
    end: string;
  };
}

interface Order {
  id: number;
  orderId: string;
  amount: number;
  status: string;
  paymentType: string | null;
  createdAt: string;
  course: {
    id: number;
    title: string;
    price: number;
  };
  user: {
    id: number;
    name: string;
    email: string;
  };
}

interface OrderDetails extends Order {
  transactionId: string | null;
  paymentUrl: string | null;
  qrImageUrl: string | null;
  course: {
    id: number;
    title: string;
    price: number;
    teacher: {
      id: number;
      name: string;
    } | null;
  };
  user: {
    id: number;
    name: string;
    email: string;
    phone: string | null;
  };
}

const Dashboard = () => {
  const [revenueStats, setRevenueStats] = useState<RevenueStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetails | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [statusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const fetchRevenueStats = async () => {
    try {
      const response = await axiosInstance.get<{ data: RevenueStats; message: string }>(
        `/admin/payments/revenue-stats?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
      );
      setRevenueStats(response.data.data);
      setError('');
    } catch (err: any) {
      console.error('Failed to fetch revenue stats:', err);
      setError(err.response?.data?.message || 'ไม่สามารถโหลดข้อมูลสถิติรายได้ได้');
    }
  };

  const fetchRecentOrders = async () => {
    try {
      const statusParam = statusFilter !== 'all' ? `&status=${statusFilter}` : '';
      const response = await axiosInstance.get<{ data: { data: Order[]; meta: any }; message: string }>(
        `/admin/payments/recent-orders?limit=50${statusParam}`
      );
      setRecentOrders(response.data.data.data);
      setError('');
    } catch (err: any) {
      console.error('Failed to fetch recent orders:', err);
      setError(err.response?.data?.message || 'ไม่สามารถโหลดรายการสั่งซื้อได้');
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const response = await axiosInstance.get<{ data: any[]; message: string }>(
        '/admin/payments/payment-methods'
      );
      setPaymentMethods(response.data.data);
      setError('');
    } catch (err: any) {
      console.error('Failed to fetch payment methods:', err);
      setError(err.response?.data?.message || 'ไม่สามารถโหลดข้อมูลช่องทางการชำระเงินได้');
    }
  };

  const fetchOrderDetails = async (orderId: number) => {
    try {
      const response = await axiosInstance.get<{ data: OrderDetails; message: string }>(
        `/admin/payments/order/${orderId}`
      );
      setSelectedOrder(response.data.data);
      setIsDrawerOpen(true);
    } catch (err: any) {
      console.error('Failed to fetch order details:', err);
      alert('ไม่สามารถโหลดรายละเอียดการสั่งซื้อได้');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError('');
      try {
        await Promise.all([
          fetchRevenueStats(),
          fetchRecentOrders(),
          fetchPaymentMethods(),
        ]);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [dateRange, statusFilter]);

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

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' }> = {
      completed: { label: 'สำเร็จ', variant: 'success' },
      pending: { label: 'รอดำเนินการ', variant: 'warning' },
      failed: { label: 'ล้มเหลว', variant: 'danger' },
      cancelled: { label: 'ยกเลิก', variant: 'danger' },
    };
    const statusInfo = statusMap[status] || { label: status, variant: 'default' };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getPaymentTypeLabel = (type: string | null) => {
    const typeMap: Record<string, string> = {
      card: 'บัตรเครดิต/เดบิต',
      qrnone: 'QR Code',
    };
    return type ? typeMap[type] || type : '-';
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">แดชบอร์ด</h1>
        <p className="mt-2 text-slate-600">วิเคราะห์ยอดเงินและจัดการการชำระเงิน</p>
      </div>

      {/* Revenue Statistics */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>สรุปยอดเงิน</CardTitle>
              <CardDescription>วิเคราะห์รายได้ตามช่วงเวลา</CardDescription>
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
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin h-8 w-8 text-brand" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : revenueStats ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="rounded-lg border border-slate-200 bg-white p-6">
                <p className="text-sm font-medium text-slate-600">รายได้รวม</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {formatCurrency(revenueStats.totalRevenue)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {revenueStats.totalOrders} รายการ
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-6">
                <p className="text-sm font-medium text-slate-600">รายได้เฉลี่ยต่อรายการ</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {formatCurrency(
                    revenueStats.totalOrders > 0
                      ? revenueStats.totalRevenue / revenueStats.totalOrders
                      : 0
                  )}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-6">
                <p className="text-sm font-medium text-slate-600">ช่วงเวลา</p>
                <p className="mt-2 text-sm text-slate-900">
                  {formatDate(revenueStats.period.start)} - {formatDate(revenueStats.period.end)}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="mt-4 text-sm font-medium text-slate-900">ยังไม่มีข้อมูลสถิติรายได้</p>
              <p className="mt-1 text-sm text-slate-500">ยังไม่มีรายการชำระเงินที่สำเร็จในช่วงเวลาที่เลือก</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle>ช่องทางการชำระเงิน</CardTitle>
          <CardDescription>สรุปยอดเงินตามช่องทางการชำระเงิน</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin h-8 w-8 text-brand" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : paymentMethods.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {paymentMethods.map((method) => (
                <div
                  key={method.paymentType}
                  className="rounded-lg border border-slate-200 bg-white p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">
                        {getPaymentTypeLabel(method.paymentType)}
                      </p>
                      <p className="mt-1 text-2xl font-bold text-slate-900">
                        {formatCurrency(method._sum.amount || 0)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {method._count} รายการ
                      </p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <p className="mt-4 text-sm font-medium text-slate-900">ยังไม่มีข้อมูลการชำระเงิน</p>
              <p className="mt-1 text-sm text-slate-500">ยังไม่มีรายการชำระเงินที่สำเร็จในระบบ</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>รายการสั่งซื้อล่าสุด</CardTitle>
          <CardDescription>คอร์สที่ซื้อล่าสุดและรายละเอียดการซื้อ</CardDescription>
        </CardHeader>
        <CardContent>
          {recentOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>รหัสคำสั่งซื้อ</TableHead>
                    <TableHead>ผู้ใช้</TableHead>
                    <TableHead>คอร์ส</TableHead>
                    <TableHead>จำนวนเงิน</TableHead>
                    <TableHead>ช่องทาง</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead>วันที่</TableHead>
                    <TableHead>การดำเนินการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-sm">{order.orderId}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-slate-900">{order.user.name}</p>
                          <p className="text-xs text-slate-500">{order.user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-slate-900">{order.course.title}</p>
                        <p className="text-xs text-slate-500">{formatCurrency(order.course.price)}</p>
                      </TableCell>
                      <TableCell className="font-semibold text-slate-900">
                        {formatCurrency(order.amount)}
                      </TableCell>
                      <TableCell>{getPaymentTypeLabel(order.paymentType)}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {formatDate(order.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => fetchOrderDetails(order.id)}
                        >
                          ดูรายละเอียด
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mt-4 text-sm font-medium text-slate-900">ยังไม่มีรายการสั่งซื้อ</p>
              <p className="mt-1 text-sm text-slate-500">
                {statusFilter !== 'all' ? 'ไม่พบรายการที่ตรงกับสถานะที่เลือก' : 'ยังไม่มีรายการสั่งซื้อในระบบ'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Details Drawer */}
      <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title="รายละเอียดการสั่งซื้อ">
        {selectedOrder && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-slate-600">รหัสคำสั่งซื้อ</h3>
              <p className="mt-1 font-mono text-lg text-slate-900">{selectedOrder.orderId}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-slate-600">ข้อมูลผู้ใช้</h3>
              <div className="mt-2 space-y-1">
                <p className="text-slate-900">{selectedOrder.user.name}</p>
                <p className="text-sm text-slate-600">{selectedOrder.user.email}</p>
                {selectedOrder.user.phone && (
                  <p className="text-sm text-slate-600">{selectedOrder.user.phone}</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-slate-600">ข้อมูลคอร์ส</h3>
              <div className="mt-2 space-y-1">
                <p className="text-slate-900">{selectedOrder.course.title}</p>
                {selectedOrder.course.teacher && (
                  <p className="text-sm text-slate-600">ผู้สอน: {selectedOrder.course.teacher.name}</p>
                )}
                <p className="text-sm text-slate-600">ราคา: {formatCurrency(selectedOrder.course.price)}</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-slate-600">ข้อมูลการชำระเงิน</h3>
              <div className="mt-2 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600">จำนวนเงิน:</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(selectedOrder.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">ช่องทาง:</span>
                  <span className="text-slate-900">{getPaymentTypeLabel(selectedOrder.paymentType)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">สถานะ:</span>
                  {getStatusBadge(selectedOrder.status)}
                </div>
                {selectedOrder.transactionId && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Transaction ID:</span>
                    <span className="font-mono text-sm text-slate-900">{selectedOrder.transactionId}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-slate-600">วันที่และเวลา</h3>
              <div className="mt-2 space-y-1">
                <p className="text-sm text-slate-600">สร้างเมื่อ: {formatDate(selectedOrder.createdAt)}</p>
              </div>
            </div>

            {selectedOrder.qrImageUrl && (
              <div>
                <h3 className="text-sm font-medium text-slate-600">QR Code</h3>
                <img
                  src={selectedOrder.qrImageUrl}
                  alt="QR Code"
                  className="mt-2 rounded-lg border border-slate-200"
                />
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default Dashboard;
