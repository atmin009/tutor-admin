import { useEffect, useState } from 'react';
import apiClient from '../api/axios';
import Drawer from '../components/ui/Drawer';

interface CourseOption {
  id: number;
  title: string;
}

interface BundlePromotion {
  id: number;
  name: string;
  description: string | null;
  price: number;
  status: string;
  courseIds: string; // JSON string from backend
  maxCourses: number | null;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function BundlePromotions() {
  const [bundles, setBundles] = useState<BundlePromotion[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingBundle, setEditingBundle] = useState<BundlePromotion | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    status: 'active',
    courseIds: [] as number[],
    maxCourses: '',
    startsAt: '',
    endsAt: '',
  });

  useEffect(() => {
    fetchBundles();
    fetchCourses();
  }, []);

  const fetchBundles = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/admin/bundles');
      setBundles(response.data.data || []);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูลโปรโมชันชุดคอร์ส');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await apiClient.get('/admin/courses', {
        params: { limit: 1000, page: 1 },
      });
      const raw = response.data.data?.data || [];
      setCourses(
        raw.map((c: any) => ({
          id: c.id,
          title: c.title,
        })),
      );
    } catch (err) {
      console.error('Failed to load courses for bundle promotions', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.price || formData.courseIds.length === 0) {
      alert('กรุณากรอกชื่อ ราคา และเลือกคอร์สอย่างน้อย 1 คอร์ส');
      return;
    }

    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description || null,
        price: Number(formData.price),
        status: formData.status,
        courseIds: formData.courseIds,
        maxCourses: formData.maxCourses ? Number(formData.maxCourses) : null,
        startsAt: formData.startsAt ? new Date(formData.startsAt) : null,
        endsAt: formData.endsAt ? new Date(formData.endsAt) : null,
      };

      if (editingBundle) {
        await apiClient.put(`/admin/bundles/${editingBundle.id}`, payload);
      } else {
        await apiClient.post('/admin/bundles', payload);
      }

      setDrawerOpen(false);
      setEditingBundle(null);
      resetForm();
      fetchBundles();
    } catch (err: any) {
      alert(err.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูลโปรโมชันชุดคอร์ส');
    }
  };

  const handleEdit = (bundle: BundlePromotion) => {
    setEditingBundle(bundle);
    let parsedCourseIds: number[] = [];
    try {
      parsedCourseIds = JSON.parse(bundle.courseIds || '[]');
    } catch {
      parsedCourseIds = [];
    }

    setFormData({
      name: bundle.name,
      description: bundle.description || '',
      price: bundle.price.toString(),
      status: bundle.status,
      courseIds: parsedCourseIds,
      maxCourses: bundle.maxCourses?.toString() || '',
      startsAt: bundle.startsAt
        ? new Date(bundle.startsAt).toISOString().slice(0, 16)
        : '',
      endsAt: bundle.endsAt ? new Date(bundle.endsAt).toISOString().slice(0, 16) : '',
    });
    setDrawerOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบโปรโมชันชุดคอร์สนี้?')) return;
    try {
      await apiClient.delete(`/admin/bundles/${id}`);
      fetchBundles();
    } catch (err: any) {
      alert(err.response?.data?.message || 'เกิดข้อผิดพลาดในการลบโปรโมชันชุดคอร์ส');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      status: 'active',
      courseIds: [],
      maxCourses: '',
      startsAt: '',
      endsAt: '',
    });
  };

  const toggleCourseInForm = (courseId: number) => {
    setFormData((prev) => {
      const exists = prev.courseIds.includes(courseId);
      return {
        ...prev,
        courseIds: exists
          ? prev.courseIds.filter((id) => id !== courseId)
          : [...prev.courseIds, courseId],
      };
    });
  };

  const formatDateTime = (value: string | null) => {
    if (!value) return '-';
    return new Date(value).toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && bundles.length === 0) {
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
        <h1 className="text-2xl font-bold text-slate-900">โปรโมชันชุดคอร์ส (Bundle)</h1>
        <button
          onClick={() => {
            resetForm();
            setEditingBundle(null);
            setDrawerOpen(true);
          }}
          className="rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#1d4ed8]"
        >
          + เพิ่มโปรโมชันชุดคอร์ส
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
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">ชื่อโปร</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">ราคาโปร</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">จำนวนคอร์ส</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">ช่วงเวลา</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500">สถานะ</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase text-slate-500">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {bundles.map((bundle) => {
                let courseCount = 0;
                try {
                  const arr = JSON.parse(bundle.courseIds || '[]');
                  courseCount = Array.isArray(arr) ? arr.length : 0;
                } catch {
                  courseCount = 0;
                }

                return (
                  <tr key={bundle.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{bundle.name}</div>
                      {bundle.description && (
                        <div className="text-xs text-slate-500">{bundle.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900">
                      {new Intl.NumberFormat('th-TH', {
                        style: 'currency',
                        currency: 'THB',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(bundle.price)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {courseCount}
                      {bundle.maxCourses && ` / ${bundle.maxCourses} คอร์ส`}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      <div>เริ่ม: {formatDateTime(bundle.startsAt)}</div>
                      <div>สิ้นสุด: {formatDateTime(bundle.endsAt)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          bundle.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {bundle.status === 'active' ? 'ใช้งานได้' : 'ไม่ใช้งาน'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:justify-end sm:gap-2">
                        {bundle.status === 'active' && (
                          <button
                            type="button"
                            onClick={() => {
                              const path = `/bundles/${bundle.id}`;
                              navigator.clipboard?.writeText(path).then(
                                () => alert('คัดลอก path แล้ว: ' + path + '\nนำไปต่อกับโดเมนหน้าลูกค้า เช่น https://yoursite.com' + path)
                              ).catch(() => alert('ลิงก์แชร์: ' + path));
                            }}
                            className="text-sm text-slate-600 hover:text-slate-900"
                          >
                            ลิงก์แชร์
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(bundle)}
                          className="text-sm text-brand hover:text-brand/80"
                        >
                          แก้ไข
                        </button>
                        <button
                          onClick={() => handleDelete(bundle.id)}
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          ลบ
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Drawer
        isOpen={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setEditingBundle(null);
          resetForm();
        }}
        title={editingBundle ? 'แก้ไขโปรโมชันชุดคอร์ส' : 'เพิ่มโปรโมชันชุดคอร์ส'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">ชื่อโปร *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
              <label className="mb-1 block text-sm font-medium text-slate-700">ราคาโปร (บาท) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                จำนวนคอร์สที่ต้องการ (เว้นว่าง = เท่ากับจำนวนที่เลือก)
              </label>
              <input
                type="number"
                min="1"
                value={formData.maxCourses}
                onChange={(e) => setFormData({ ...formData, maxCourses: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">วันที่เริ่มต้น</label>
              <input
                type="datetime-local"
                value={formData.startsAt}
                onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">วันที่สิ้นสุด</label>
              <input
                type="datetime-local"
                value={formData.endsAt}
                onChange={(e) => setFormData({ ...formData, endsAt: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              เลือกคอร์สในโปร (ขั้นต่ำ 1 คอร์ส)
            </label>
            <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-200">
              {courses.length === 0 ? (
                <div className="p-3 text-sm text-slate-500">ยังไม่มีข้อมูลคอร์ส</div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {courses.map((course) => {
                    const checked = formData.courseIds.includes(course.id);
                    return (
                      <li key={course.id}>
                        <label className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleCourseInForm(course.id)}
                            className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
                          />
                          <span className="flex-1 text-slate-800">
                            {course.title} <span className="text-xs text-slate-400">#{course.id}</span>
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              ระบบจะใช้จำนวนคอร์สที่เลือกเปรียบเทียบกับค่าจำนวนคอร์สที่ต้องการเพื่อ Validate ตอนลูกค้าซื้อโปร
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setDrawerOpen(false);
                setEditingBundle(null);
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
    </div>
  );
}

