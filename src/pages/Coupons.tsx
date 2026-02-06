import { useState, useEffect } from 'react';
import apiClient from '../api/axios';
import Drawer from '../components/ui/Drawer';

interface Coupon {
  id: number;
  code: string;
  description: string | null;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minPurchaseAmount: number | null;
  maxDiscountAmount: number | null;
  validFrom: string;
  validUntil: string;
  usageLimit: number | null;
  usageCount: number;
  userLimit: number | null;
  courseIds: number[] | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface CouponUsage {
  id: number;
  user: {
    id: number;
    name: string;
    email: string;
  };
  order: {
    id: number;
    orderId: string;
    amount: number;
    status: string;
    createdAt: string;
  };
  discountAmount: number;
  usedAt: string;
}

export default function Coupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [usageData, setUsageData] = useState<CouponUsage[]>([]);
  const [showUsageModal, setShowUsageModal] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: 0,
    minPurchaseAmount: '',
    maxDiscountAmount: '',
    validFrom: '',
    validUntil: '',
    usageLimit: '',
    userLimit: '',
    courseIds: '',
    status: 'active',
  });

  useEffect(() => {
    fetchCoupons();
  }, [page]);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/coupons?page=${page}&limit=10`);
      setCoupons(response.data.data.coupons);
      setTotalPages(response.data.data.totalPages);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const fetchCouponUsage = async (couponId: number) => {
    try {
      const response = await apiClient.get(`/coupons/${couponId}`);
      setUsageData(response.data.data.couponUsages || []);
      setShowUsageModal(true);
    } catch (err: any) {
      alert(err.response?.data?.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        code: formData.code,
        description: formData.description || null,
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue),
        minPurchaseAmount: formData.minPurchaseAmount ? Number(formData.minPurchaseAmount) : null,
        maxDiscountAmount: formData.maxDiscountAmount ? Number(formData.maxDiscountAmount) : null,
        validFrom: new Date(formData.validFrom),
        validUntil: new Date(formData.validUntil),
        usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null,
        userLimit: formData.userLimit ? Number(formData.userLimit) : null,
        courseIds: formData.courseIds
          ? formData.courseIds.split(',').map((id) => Number(id.trim())).filter((id) => !isNaN(id))
          : null,
        status: formData.status,
      };

      if (editingCoupon) {
        await apiClient.put(`/coupons/${editingCoupon.id}`, data);
      } else {
        await apiClient.post('/coupons', data);
      }

      setDrawerOpen(false);
      setEditingCoupon(null);
      resetForm();
      fetchCoupons();
    } catch (err: any) {
      alert(err.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      description: coupon.description || '',
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minPurchaseAmount: coupon.minPurchaseAmount?.toString() || '',
      maxDiscountAmount: coupon.maxDiscountAmount?.toString() || '',
      validFrom: new Date(coupon.validFrom).toISOString().slice(0, 16),
      validUntil: new Date(coupon.validUntil).toISOString().slice(0, 16),
      usageLimit: coupon.usageLimit?.toString() || '',
      userLimit: coupon.userLimit?.toString() || '',
      courseIds: coupon.courseIds?.join(', ') || '',
      status: coupon.status,
    });
    setDrawerOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบคูปองนี้?')) return;

    try {
      await apiClient.delete(`/coupons/${id}`);
      fetchCoupons();
    } catch (err: any) {
      alert(err.response?.data?.message || 'เกิดข้อผิดพลาดในการลบข้อมูล');
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      discountType: 'percentage',
      discountValue: 0,
      minPurchaseAmount: '',
      maxDiscountAmount: '',
      validFrom: '',
      validUntil: '',
      usageLimit: '',
      userLimit: '',
      courseIds: '',
      status: 'active',
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && coupons.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-brand border-t-transparent mx-auto" />
          <p className="text-slate-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">จัดการคูปอง</h1>
        <button
          onClick={() => {
            resetForm();
            setEditingCoupon(null);
            setDrawerOpen(true);
          }}
          className="rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#1d4ed8]"
        >
          + เพิ่มคูปอง
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">โค้ด</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">ประเภท</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">ส่วนลด</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">วันที่เริ่มต้น</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">วันที่สิ้นสุด</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">จำนวนที่ใช้</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">สถานะ</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase text-slate-500">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {coupons.map((coupon) => (
                <tr key={coupon.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="font-mono font-semibold text-slate-900">{coupon.code}</div>
                    {coupon.description && (
                      <div className="text-xs text-slate-500">{coupon.description}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {coupon.discountType === 'percentage' ? 'เปอร์เซ็นต์' : 'จำนวนเงิน'}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-900">
                    {coupon.discountType === 'percentage'
                      ? `${coupon.discountValue}%`
                      : formatPrice(coupon.discountValue)}
                    {coupon.maxDiscountAmount && coupon.discountType === 'percentage' && (
                      <div className="text-xs text-slate-500">
                        สูงสุด {formatPrice(coupon.maxDiscountAmount)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{formatDate(coupon.validFrom)}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{formatDate(coupon.validUntil)}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {coupon.usageCount} / {coupon.usageLimit || '∞'}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        coupon.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {coupon.status === 'active' ? 'ใช้งานได้' : 'ไม่ใช้งาน'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => fetchCouponUsage(coupon.id)}
                        className="text-sm text-brand hover:text-brand/80"
                      >
                        ดูการใช้งาน
                      </button>
                      <button
                        onClick={() => handleEdit(coupon)}
                        className="text-sm text-brand hover:text-brand/80"
                      >
                        แก้ไข
                      </button>
                      <button
                        onClick={() => handleDelete(coupon.id)}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        ลบ
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              ก่อนหน้า
            </button>
            <span className="text-sm text-slate-600">
              หน้า {page} จาก {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              ถัดไป
            </button>
          </div>
        )}
      </div>

      {/* Create/Edit Drawer */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setEditingCoupon(null);
          resetForm();
        }}
        title={editingCoupon ? 'แก้ไขคูปอง' : 'เพิ่มคูปองใหม่'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">โค้ด *</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">สถานะ</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  >
                    <option value="active">ใช้งานได้</option>
                    <option value="inactive">ไม่ใช้งาน</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">คำอธิบาย</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">ประเภทส่วนลด *</label>
                  <select
                    value={formData.discountType}
                    onChange={(e) =>
                      setFormData({ ...formData, discountType: e.target.value as 'percentage' | 'fixed' })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                    required
                  >
                    <option value="percentage">เปอร์เซ็นต์</option>
                    <option value="fixed">จำนวนเงิน</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">ค่าส่วนลด *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                    required
                  />
                </div>
              </div>

              {formData.discountType === 'percentage' && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">ส่วนลดสูงสุด (บาท)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.maxDiscountAmount}
                    onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">ราคาขั้นต่ำ (บาท)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.minPurchaseAmount}
                  onChange={(e) => setFormData({ ...formData, minPurchaseAmount: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">วันที่เริ่มต้น *</label>
                  <input
                    type="datetime-local"
                    value={formData.validFrom}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">วันที่สิ้นสุด *</label>
                  <input
                    type="datetime-local"
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">จำนวนครั้งที่ใช้ได้ (เว้นว่าง = ไม่จำกัด)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">จำนวนครั้งต่อผู้ใช้ (เว้นว่าง = ไม่จำกัด)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.userLimit}
                    onChange={(e) => setFormData({ ...formData, userLimit: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">คอร์สที่ใช้ได้ (ID คั่นด้วยจุลภาค, เว้นว่าง = ทุกคอร์ส)</label>
                <input
                  type="text"
                  value={formData.courseIds}
                  onChange={(e) => setFormData({ ...formData, courseIds: e.target.value })}
                  placeholder="เช่น 1, 2, 3"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setDrawerOpen(false);
                    setEditingCoupon(null);
                    resetForm();
                  }}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#1d4ed8]"
                >
                  บันทึก
                </button>
              </div>
            </form>
      </Drawer>

      {/* Usage Modal */}
      {showUsageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-4xl rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">ประวัติการใช้งานคูปอง</h2>
              <button
                onClick={() => setShowUsageModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase text-slate-500">ผู้ใช้</th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase text-slate-500">อีเมล</th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase text-slate-500">Order ID</th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase text-slate-500">ส่วนลด</th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase text-slate-500">วันที่ใช้</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {usageData.map((usage) => (
                    <tr key={usage.id}>
                      <td className="px-4 py-2 text-sm text-slate-900">{usage.user.name}</td>
                      <td className="px-4 py-2 text-sm text-slate-600">{usage.user.email}</td>
                      <td className="px-4 py-2 text-sm font-mono text-slate-600">{usage.order.orderId}</td>
                      <td className="px-4 py-2 text-sm text-slate-900">{formatPrice(usage.discountAmount)}</td>
                      <td className="px-4 py-2 text-sm text-slate-600">{formatDate(usage.usedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {usageData.length === 0 && (
                <div className="py-8 text-center text-slate-500">ยังไม่มีข้อมูลการใช้งาน</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

