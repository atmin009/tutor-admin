import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../api/axios';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import Badge from '../components/ui/Badge';

interface Teacher {
  id: number;
  name: string;
}

interface Section {
  id: number;
  title: string;
  sortOrder: number;
  courseId: number;
}

interface Lesson {
  id: number;
  title: string;
  contentType: string;
  contentUrl?: string | null;
  duration?: number | null;
  sortOrder: number;
  sectionId: number;
  courseId: number;
}

interface Course {
  id: number;
  title: string;
  slug: string;
  description?: string | null;
  summary?: string | null;
  price: number;
  salePrice?: number | null;
  status: string;
  coverImage?: string | null;
  previewVideoUrl?: string | null;
  teacherId?: number | null;
  createdAt?: string;
}

interface CourseFormData {
  title: string;
  slug: string;
  teacherId: number | null;
  price: number;
  salePrice: number | null;
  status: string;
  summary: string;
  description: string;
  coverImage: string | null;
  previewVideoUrl: string | null;
}

const CourseEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';

  const [course, setCourse] = useState<Course | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [lessonsBySection, setLessonsBySection] = useState<Record<number, Lesson[]>>({});
  
  const [formData, setFormData] = useState<CourseFormData>({
    title: '',
    slug: '',
    teacherId: null,
    price: 0,
    salePrice: null,
    status: 'draft',
    summary: '',
    description: '',
    coverImage: null,
    previewVideoUrl: null,
  });
  
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [previewVideoFile, setPreviewVideoFile] = useState<File | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingPreview, setIsUploadingPreview] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>('');
  
  // Section/Lesson management
  const [showNewSectionForm, setShowNewSectionForm] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [editingSectionId, setEditingSectionId] = useState<number | null>(null);
  const [editingSectionTitle, setEditingSectionTitle] = useState('');
  const [showLessonForm, setShowLessonForm] = useState<number | null>(null);
  const [editingLessonId, setEditingLessonId] = useState<number | null>(null);
  const [newLesson, setNewLesson] = useState({
    title: '',
    contentType: 'video',
    contentUrl: '',
    contentText: '',
    duration: '',
  });
  const [newLessonFile, setNewLessonFile] = useState<File | null>(null);
  const [editingLesson, setEditingLesson] = useState({
    title: '',
    contentType: 'video',
    contentUrl: '',
    contentText: '',
    duration: '',
  });
  const [editingLessonFile, setEditingLessonFile] = useState<File | null>(null);

  // Fetch course data if editing
  useEffect(() => {
    const fetchCourse = async () => {
      if (isNew) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await axiosInstance.get<{ data: Course; message: string }>(`/admin/courses/${id}`);
        const courseData = response.data.data;
        setCourse(courseData);
        setFormData({
          title: courseData.title,
          slug: courseData.slug,
          teacherId: courseData.teacherId || null,
          price: courseData.price,
          salePrice: courseData.salePrice || null,
          status: courseData.status,
          summary: courseData.summary || '',
          description: courseData.description || '',
          coverImage: courseData.coverImage || null,
          previewVideoUrl: courseData.previewVideoUrl || null,
        });
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load course');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourse();
  }, [id, isNew]);

  // Fetch teachers
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const response = await axiosInstance.get<{ data: Teacher[]; message: string }>('/admin/teachers');
        setTeachers(response.data.data);
      } catch (err: any) {
        console.error('Failed to fetch teachers:', err);
      }
    };

    fetchTeachers();
  }, []);

  // Fetch sections
  const fetchSections = useCallback(async () => {
    if (isNew) return;

    try {
      const response = await axiosInstance.get<{ data: Section[]; message: string }>(
        `/admin/courses/${id}/sections`
      );
      const sectionsData = response.data.data;
      setSections(sectionsData);

      // Fetch lessons for each section
      const lessonsPromises = sectionsData.map(async (section) => {
        try {
          const lessonsResponse = await axiosInstance.get<{ data: Lesson[]; message: string }>(
            `/admin/sections/${section.id}/lessons`
          );
          return { sectionId: section.id, lessons: lessonsResponse.data.data };
        } catch (err) {
          return { sectionId: section.id, lessons: [] };
        }
      });

      const lessonsResults = await Promise.all(lessonsPromises);
      const lessonsMap: Record<number, Lesson[]> = {};
      lessonsResults.forEach(({ sectionId, lessons }) => {
        lessonsMap[sectionId] = lessons;
      });
      setLessonsBySection(lessonsMap);
    } catch (err: any) {
      console.error('Failed to fetch sections:', err);
    }
  }, [id, isNew]);

  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  const handleFormChange = (field: keyof CourseFormData, value: string | number | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleUploadCover = async (file: File) => {
    try {
      setIsUploadingCover(true);
      const formData = new FormData();
      formData.append('cover', file);
      
      const response = await axiosInstance.post<{ data: { url: string }; message: string }>(
        '/admin/courses/upload-cover',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      setFormData((prev) => ({ ...prev, coverImage: response.data.data.url }));
      setCoverImageFile(null);
      return response.data.data.url;
    } catch (err: any) {
      alert(err.response?.data?.message || 'ไม่สามารถอัปโหลดภาพปกได้');
      throw err;
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleUploadPreview = async (file: File) => {
    try {
      setIsUploadingPreview(true);
      const formData = new FormData();
      formData.append('preview', file);
      
      const response = await axiosInstance.post<{ data: { url: string }; message: string }>(
        '/admin/courses/upload-preview',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      setFormData((prev) => ({ ...prev, previewVideoUrl: response.data.data.url }));
      setPreviewVideoFile(null);
      return response.data.data.url;
    } catch (err: any) {
      alert(err.response?.data?.message || 'ไม่สามารถอัปโหลดวิดีโอตัวอย่างได้');
      throw err;
    } finally {
      setIsUploadingPreview(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError('');

      // Upload files if selected
      let coverImageUrl = formData.coverImage;
      let previewVideoUrl = formData.previewVideoUrl;

      if (coverImageFile) {
        coverImageUrl = await handleUploadCover(coverImageFile);
      }

      if (previewVideoFile) {
        previewVideoUrl = await handleUploadPreview(previewVideoFile);
      }

      const payload: any = {
        title: formData.title.trim(),
        teacherId: formData.teacherId,
        price: formData.price,
        salePrice: formData.salePrice,
        status: formData.status,
        summary: formData.summary || null,
        description: formData.description || null,
        coverImage: coverImageUrl,
        previewVideoUrl: previewVideoUrl,
      };

      // Auto-generate slug if empty
      if (!formData.slug.trim()) {
        payload.slug = generateSlug(formData.title);
      } else {
        payload.slug = formData.slug.trim();
      }

      let savedCourse;
      if (isNew) {
        const response = await axiosInstance.post<{ data: Course; message: string }>('/admin/courses', payload);
        savedCourse = response.data.data;
        console.log('Course created successfully');
        navigate(`/admin/courses/${savedCourse.id}`);
      } else {
        await axiosInstance.put(`/admin/courses/${id}`, payload);
        console.log('Course updated successfully');
        // Refetch course data
        const response = await axiosInstance.get<{ data: Course; message: string }>(`/admin/courses/${id}`);
        setCourse(response.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to ${isNew ? 'create' : 'update'} course`);
      console.error('Save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSection = async () => {
    if (!id || isNew || !newSectionTitle.trim()) return;

    try {
      const response = await axiosInstance.post<{ data: Section; message: string }>(
        `/admin/courses/${id}/sections`,
        {
          title: newSectionTitle.trim(),
          sortOrder: sections.length,
        }
      );
      setSections((prev) => [...prev, response.data.data]);
      setNewSectionTitle('');
      setShowNewSectionForm(false);
    } catch (err: any) {
      console.error('Failed to create section:', err);
      alert(err.response?.data?.message || 'Failed to create section');
    }
  };

  const handleUpdateSection = async (sectionId: number) => {
    if (!editingSectionTitle.trim()) return;

    try {
      const response = await axiosInstance.put<{ data: Section; message: string }>(
        `/admin/sections/${sectionId}`,
        { title: editingSectionTitle.trim() }
      );
      setSections((prev) => prev.map((s) => (s.id === sectionId ? response.data.data : s)));
      setEditingSectionId(null);
      setEditingSectionTitle('');
    } catch (err: any) {
      console.error('Failed to update section:', err);
      alert(err.response?.data?.message || 'Failed to update section');
    }
  };

  const handleDeleteSection = async (sectionId: number) => {
    if (!window.confirm('Are you sure you want to delete this section? All lessons in this section will also be deleted.')) {
      return;
    }

    try {
      await axiosInstance.delete(`/admin/sections/${sectionId}`);
      setSections((prev) => prev.filter((s) => s.id !== sectionId));
      setLessonsBySection((prev) => {
        const updated = { ...prev };
        delete updated[sectionId];
        return updated;
      });
    } catch (err: any) {
      console.error('Failed to delete section:', err);
      alert(err.response?.data?.message || 'Failed to delete section');
    }
  };

  const handleAddLesson = async (sectionId: number) => {
    if (!id || isNew || !newLesson.title.trim()) return;

    try {
      const response = await axiosInstance.post<{ data: Lesson; message: string }>(
        `/admin/sections/${sectionId}/lessons`,
        {
          title: newLesson.title.trim(),
          contentType: newLesson.contentType,
          contentUrl: newLesson.contentUrl || null,
          duration: newLesson.duration ? parseInt(newLesson.duration, 10) : null,
        }
      );
      setLessonsBySection((prev) => ({
        ...prev,
        [sectionId]: [...(prev[sectionId] || []), response.data.data],
      }));
      setNewLesson({ title: '', contentType: 'video', contentUrl: '', contentText: '', duration: '' });
      setShowLessonForm(null);
    } catch (err: any) {
      console.error('Failed to create lesson:', err);
      alert(err.response?.data?.message || 'Failed to create lesson');
    }
  };

  const handleEditLesson = (lesson: Lesson) => {
    setEditingLessonId(lesson.id);
    setEditingLesson({
      title: lesson.title,
      contentType: lesson.contentType,
      contentUrl: lesson.contentUrl || '',
      contentText: '',
      duration: lesson.duration?.toString() || '',
    });
    setShowLessonForm(null); // Close add form if open
  };

  const handleUpdateLesson = async (lessonId: number, sectionId: number) => {
    if (!id || isNew || !editingLesson.title.trim()) return;

    try {
      let contentUrl = editingLesson.contentUrl || null;
      
      // If file type, upload file first
      if (editingLesson.contentType === 'file' && editingLessonFile) {
        const formData = new FormData();
        formData.append('file', editingLessonFile);
        const uploadResponse = await axiosInstance.post<{ data: { url: string }; message: string }>(
          `/admin/sections/${sectionId}/upload-attachment`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        contentUrl = uploadResponse.data.data.url;
      }

      const response = await axiosInstance.put<{ data: Lesson; message: string }>(
        `/admin/lessons/${lessonId}`,
        {
          title: editingLesson.title.trim(),
          contentType: editingLesson.contentType,
          contentUrl: editingLesson.contentType === 'text' ? null : contentUrl,
          contentText: editingLesson.contentType === 'text' ? editingLesson.contentText : null,
          duration: editingLesson.duration ? parseInt(editingLesson.duration, 10) : null,
        }
      );
      setLessonsBySection((prev) => ({
        ...prev,
        [sectionId]: (prev[sectionId] || []).map((l) => (l.id === lessonId ? response.data.data : l)),
      }));
      setEditingLessonId(null);
      setEditingLesson({ title: '', contentType: 'video', contentUrl: '', contentText: '', duration: '' });
      setEditingLessonFile(null);
    } catch (err: any) {
      console.error('Failed to update lesson:', err);
      alert(err.response?.data?.message || 'ไม่สามารถอัปเดตบทเรียนได้');
    }
  };

  const handleCancelEditLesson = () => {
    setEditingLessonId(null);
    setEditingLesson({ title: '', contentType: 'video', contentUrl: '', contentText: '', duration: '' });
    setEditingLessonFile(null);
  };

  const handleDeleteLesson = async (lessonId: number, sectionId: number) => {
    if (!window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบบทเรียนนี้?')) {
      return;
    }

    try {
      await axiosInstance.delete(`/admin/lessons/${lessonId}`);
      setLessonsBySection((prev) => ({
        ...prev,
        [sectionId]: (prev[sectionId] || []).filter((l) => l.id !== lessonId),
      }));
    } catch (err: any) {
      console.error('Failed to delete lesson:', err);
      alert(err.response?.data?.message || 'Failed to delete lesson');
    }
  };

  if (isLoading) {
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
      {/* Back Button */}
      <Link to="/admin/courses">
        <Button variant="ghost" size="sm">
          ← กลับไปยังรายการคอร์ส
        </Button>
      </Link>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border-2 border-rose-200 bg-rose-50 px-6 py-4">
          <p className="text-rose-700 text-sm">{error}</p>
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{isNew ? 'สร้างคอร์สใหม่' : 'แก้ไขคอร์ส'}</CardTitle>
              <CardDescription>
                {isNew ? 'เพิ่มคอร์สใหม่ลงในแพลตฟอร์ม' : 'อัปเดตรายละเอียดคอร์ส'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label required>ชื่อคอร์ส</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => handleFormChange('title', e.target.value)}
                    placeholder="กรอกชื่อคอร์ส"
                  />
                </div>

                <div>
                  <Label>Slug</Label>
                  <Input
                    value={formData.slug}
                    onChange={(e) => handleFormChange('slug', e.target.value)}
                    placeholder="จะสร้างอัตโนมัติจากชื่อคอร์สถ้าว่าง"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    ปล่อยว่างไว้เพื่อให้สร้างอัตโนมัติจากชื่อคอร์ส
                  </p>
                </div>

                <div>
                  <Label>ผู้สอน</Label>
                  <select
                    value={formData.teacherId || ''}
                    onChange={(e) => handleFormChange('teacherId', e.target.value ? parseInt(e.target.value, 10) : null)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                  >
                    <option value="">ไม่มีผู้สอน</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>ราคา</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => handleFormChange('price', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label>ราคาพิเศษ</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.salePrice || ''}
                      onChange={(e) => handleFormChange('salePrice', e.target.value ? parseFloat(e.target.value) : null)}
                      placeholder="ไม่บังคับ"
                    />
                  </div>
                </div>

                <div>
                  <Label>สถานะ</Label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleFormChange('status', e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                  >
                    <option value="draft">ร่าง</option>
                    <option value="published">เผยแพร่</option>
                    <option value="archived">เก็บถาวร</option>
                  </select>
                </div>

                <div>
                  <Label>สรุปย่อ</Label>
                  <textarea
                    value={formData.summary}
                    onChange={(e) => handleFormChange('summary', e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand resize-none"
                    placeholder="สรุปย่อของคอร์ส"
                  />
                </div>

                <div>
                  <Label>คำอธิบาย</Label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    rows={6}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand resize-none"
                    placeholder="คำอธิบายคอร์สแบบเต็ม (สามารถเพิ่ม rich text editor ได้ที่นี่)"
                  />
                </div>

                {/* Cover Image Upload */}
                <div>
                  <Label>ภาพปกคอร์ส</Label>
                  <div className="space-y-3">
                    {formData.coverImage && (
                      <div className="relative">
                        <img
                          src={`http://localhost:4000${formData.coverImage}`}
                          alt="Cover"
                          className="h-48 w-full rounded-lg object-cover border border-slate-200"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({ ...prev, coverImage: null }));
                            setCoverImageFile(null);
                          }}
                          className="absolute top-2 right-2 rounded-full bg-red-500 p-1.5 text-white hover:bg-red-600 transition-colors"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )}
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setCoverImageFile(file);
                          }
                        }}
                        className="hidden"
                        id="cover-image-upload"
                      />
                      <label
                        htmlFor="cover-image-upload"
                        className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {coverImageFile ? coverImageFile.name : formData.coverImage ? 'เปลี่ยนภาพปก' : 'อัปโหลดภาพปก'}
                      </label>
                      {coverImageFile && (
                        <p className="mt-1 text-xs text-slate-500">ไฟล์ที่เลือก: {coverImageFile.name}</p>
                      )}
                      {isUploadingCover && (
                        <p className="mt-1 text-xs text-brand">กำลังอัปโหลด...</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Preview Video Upload */}
                <div>
                  <Label>วิดีโอตัวอย่างคอร์ส</Label>
                  <div className="space-y-3">
                    {formData.previewVideoUrl && (
                      <div className="relative">
                        <div className="aspect-video w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-900">
                          {formData.previewVideoUrl.includes('youtube.com') || formData.previewVideoUrl.includes('youtu.be') ? (
                            <iframe
                              src={formData.previewVideoUrl.includes('youtube.com') 
                                ? formData.previewVideoUrl.replace('watch?v=', 'embed/')
                                : formData.previewVideoUrl.replace('youtu.be/', 'youtube.com/embed/')}
                              className="h-full w-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          ) : (
                            <video
                              src={`http://localhost:4000${formData.previewVideoUrl}`}
                              controls
                              className="h-full w-full"
                            />
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({ ...prev, previewVideoUrl: null }));
                            setPreviewVideoFile(null);
                          }}
                          className="absolute top-2 right-2 rounded-full bg-red-500 p-1.5 text-white hover:bg-red-600 transition-colors"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )}
                    <div>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setPreviewVideoFile(file);
                          }
                        }}
                        className="hidden"
                        id="preview-video-upload"
                      />
                      <label
                        htmlFor="preview-video-upload"
                        className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        {previewVideoFile ? previewVideoFile.name : formData.previewVideoUrl ? 'เปลี่ยนวิดีโอตัวอย่าง' : 'อัปโหลดวิดีโอตัวอย่าง'}
                      </label>
                      {previewVideoFile && (
                        <p className="mt-1 text-xs text-slate-500">ไฟล์ที่เลือก: {previewVideoFile.name}</p>
                      )}
                      {isUploadingPreview && (
                        <p className="mt-1 text-xs text-brand">กำลังอัปโหลด...</p>
                      )}
                      <p className="mt-2 text-xs text-slate-500">
                        หรือกรอก URL ของ YouTube (เช่น: https://www.youtube.com/watch?v=...)
                      </p>
                      <Input
                        type="text"
                        value={formData.previewVideoUrl?.startsWith('http') ? formData.previewVideoUrl : ''}
                        onChange={(e) => {
                          const url = e.target.value.trim();
                          setFormData((prev) => ({ ...prev, previewVideoUrl: url || null }));
                          setPreviewVideoFile(null);
                        }}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="mt-2"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button variant="primary" onClick={handleSave} isLoading={isSaving}>
                    {isNew ? 'Create Course' : 'Save Changes'}
                  </Button>
                  <Link to="/admin/courses">
                    <Button variant="secondary">Cancel</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* โครงสร้างคอร์ส - ส่วนและบทเรียน */}
          {!isNew && (
            <Card>
              <CardHeader>
                <CardTitle>Course Structure</CardTitle>
                <CardDescription>Manage sections and lessons</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Sections List */}
                  {sections.map((section) => (
                    <div key={section.id} className="border border-slate-200 rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        {editingSectionId === section.id ? (
                          <div className="flex-1 flex gap-2">
                            <Input
                              value={editingSectionTitle}
                              onChange={(e) => setEditingSectionTitle(e.target.value)}
                              placeholder="ชื่อส่วน"
                              className="flex-1"
                            />
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => handleUpdateSection(section.id)}
                            >
                              บันทึก
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                setEditingSectionId(null);
                                setEditingSectionTitle('');
                              }}
                            >
                              ยกเลิก
                            </Button>
                          </div>
                        ) : (
                          <>
                            <div className="flex-1">
                              <h4 className="font-medium text-slate-900">{section.title}</h4>
                              <p className="text-xs text-slate-500">ลำดับ: {section.sortOrder}</p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingSectionId(section.id);
                                  setEditingSectionTitle(section.title);
                                }}
                              >
                                เปลี่ยนชื่อ
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setShowLessonForm(section.id)}
                              >
                                เพิ่มบทเรียน
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => handleDeleteSection(section.id)}
                              >
                                ลบ
                              </Button>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Add Lesson Form */}
                      {showLessonForm === section.id && (
                        <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                          <div>
                            <Label required>ชื่อบทเรียน</Label>
                            <Input
                              value={newLesson.title}
                              onChange={(e) => setNewLesson((prev) => ({ ...prev, title: e.target.value }))}
                              placeholder="กรอกชื่อบทเรียน"
                            />
                          </div>
                          <div>
                            <Label required>ประเภทเนื้อหา</Label>
                            <select
                              value={newLesson.contentType}
                              onChange={(e) => {
                                setNewLesson((prev) => ({ ...prev, contentType: e.target.value, contentUrl: '', contentText: '' }));
                                setNewLessonFile(null);
                              }}
                              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                            >
                              <option value="video">วิดีโอ</option>
                              <option value="text">ข้อความ</option>
                              <option value="link">ลิงค์</option>
                              <option value="file">ไฟล์</option>
                            </select>
                          </div>
                          
                          {/* Video Content */}
                          {newLesson.contentType === 'video' && (
                            <div>
                              <Label>URL วิดีโอ</Label>
                              <Input
                                value={newLesson.contentUrl}
                                onChange={(e) => setNewLesson((prev) => ({ ...prev, contentUrl: e.target.value }))}
                                placeholder="https://www.youtube.com/watch?v=... หรือ URL วิดีโออื่น"
                              />
                              <p className="mt-1 text-xs text-slate-500">รองรับ YouTube หรือ URL วิดีโออื่น</p>
                            </div>
                          )}

                          {/* Text Content */}
                          {newLesson.contentType === 'text' && (
                            <div>
                              <Label required>เนื้อหาข้อความ</Label>
                              <textarea
                                value={newLesson.contentText}
                                onChange={(e) => setNewLesson((prev) => ({ ...prev, contentText: e.target.value }))}
                                rows={6}
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand resize-none"
                                placeholder="กรอกเนื้อหาข้อความ..."
                              />
                            </div>
                          )}

                          {/* Link Content */}
                          {newLesson.contentType === 'link' && (
                            <div>
                              <Label required>URL ลิงค์</Label>
                              <Input
                                value={newLesson.contentUrl}
                                onChange={(e) => setNewLesson((prev) => ({ ...prev, contentUrl: e.target.value }))}
                                placeholder="https://..."
                              />
                              <p className="mt-1 text-xs text-slate-500">ลิงค์ไปยังเว็บไซต์หรือทรัพยากรภายนอก</p>
                            </div>
                          )}

                          {/* File Content */}
                          {newLesson.contentType === 'file' && (
                            <div>
                              <Label required>ไฟล์</Label>
                              <input
                                type="file"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    setNewLessonFile(file);
                                  }
                                }}
                                className="hidden"
                                id="new-lesson-file-upload"
                              />
                              <label
                                htmlFor="new-lesson-file-upload"
                                className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                              >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                {newLessonFile ? newLessonFile.name : 'เลือกไฟล์'}
                              </label>
                              {newLessonFile && (
                                <p className="mt-1 text-xs text-slate-500">ไฟล์ที่เลือก: {newLessonFile.name}</p>
                              )}
                            </div>
                          )}

                          <div>
                            <Label>ระยะเวลา (นาที)</Label>
                            <Input
                              type="number"
                              value={newLesson.duration}
                              onChange={(e) => setNewLesson((prev) => ({ ...prev, duration: e.target.value }))}
                              placeholder="0"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => handleAddLesson(section.id)}
                            >
                              เพิ่มบทเรียน
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                setShowLessonForm(null);
                                setNewLesson({ title: '', contentType: 'video', contentUrl: '', contentText: '', duration: '' });
                                setNewLessonFile(null);
                              }}
                            >
                              ยกเลิก
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Lessons List */}
                      {lessonsBySection[section.id] && lessonsBySection[section.id].length > 0 && (
                        <div className="ml-4 space-y-2">
                          {lessonsBySection[section.id].map((lesson) => (
                            <div key={lesson.id}>
                              {editingLessonId === lesson.id ? (
                                // Edit Lesson Form
                                <div className="bg-slate-50 rounded-lg p-4 space-y-3 border border-brand/20">
                                  <div>
                                    <Label required>ชื่อบทเรียน</Label>
                                    <Input
                                      value={editingLesson.title}
                                      onChange={(e) => setEditingLesson((prev) => ({ ...prev, title: e.target.value }))}
                                      placeholder="กรอกชื่อบทเรียน"
                                    />
                                  </div>
                                  <div>
                                    <Label required>ประเภทเนื้อหา</Label>
                                    <select
                                      value={editingLesson.contentType}
                                      onChange={(e) => {
                                        setEditingLesson((prev) => ({ ...prev, contentType: e.target.value, contentUrl: '', contentText: '' }));
                                        setEditingLessonFile(null);
                                      }}
                                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                                    >
                                      <option value="video">วิดีโอ</option>
                                      <option value="text">ข้อความ</option>
                                      <option value="link">ลิงค์</option>
                                      <option value="file">ไฟล์</option>
                                    </select>
                                  </div>

                                  {/* Video Content */}
                                  {editingLesson.contentType === 'video' && (
                                    <div>
                                      <Label>URL วิดีโอ</Label>
                                      <Input
                                        value={editingLesson.contentUrl}
                                        onChange={(e) => setEditingLesson((prev) => ({ ...prev, contentUrl: e.target.value }))}
                                        placeholder="https://www.youtube.com/watch?v=... หรือ URL วิดีโออื่น"
                                      />
                                      <p className="mt-1 text-xs text-slate-500">รองรับ YouTube หรือ URL วิดีโออื่น</p>
                                    </div>
                                  )}

                                  {/* Text Content */}
                                  {editingLesson.contentType === 'text' && (
                                    <div>
                                      <Label required>เนื้อหาข้อความ</Label>
                                      <textarea
                                        value={editingLesson.contentText}
                                        onChange={(e) => setEditingLesson((prev) => ({ ...prev, contentText: e.target.value }))}
                                        rows={6}
                                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand resize-none"
                                        placeholder="กรอกเนื้อหาข้อความ..."
                                      />
                                    </div>
                                  )}

                                  {/* Link Content */}
                                  {editingLesson.contentType === 'link' && (
                                    <div>
                                      <Label required>URL ลิงค์</Label>
                                      <Input
                                        value={editingLesson.contentUrl}
                                        onChange={(e) => setEditingLesson((prev) => ({ ...prev, contentUrl: e.target.value }))}
                                        placeholder="https://..."
                                      />
                                      <p className="mt-1 text-xs text-slate-500">ลิงค์ไปยังเว็บไซต์หรือทรัพยากรภายนอก</p>
                                    </div>
                                  )}

                                  {/* File Content */}
                                  {editingLesson.contentType === 'file' && (
                                    <div>
                                      <Label required>ไฟล์</Label>
                                      {editingLesson.contentUrl && !editingLessonFile && (
                                        <p className="mb-2 text-xs text-slate-500">ไฟล์ปัจจุบัน: {editingLesson.contentUrl}</p>
                                      )}
                                      <input
                                        type="file"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                            setEditingLessonFile(file);
                                          }
                                        }}
                                        className="hidden"
                                        id="edit-lesson-file-upload"
                                      />
                                      <label
                                        htmlFor="edit-lesson-file-upload"
                                        className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                                      >
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                        {editingLessonFile ? editingLessonFile.name : editingLesson.contentUrl ? 'เปลี่ยนไฟล์' : 'เลือกไฟล์'}
                                      </label>
                                      {editingLessonFile && (
                                        <p className="mt-1 text-xs text-slate-500">ไฟล์ที่เลือก: {editingLessonFile.name}</p>
                                      )}
                                    </div>
                                  )}

                                  <div>
                                    <Label>ระยะเวลา (นาที)</Label>
                                    <Input
                                      type="number"
                                      value={editingLesson.duration}
                                      onChange={(e) => setEditingLesson((prev) => ({ ...prev, duration: e.target.value }))}
                                      placeholder="0"
                                    />
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="primary"
                                      onClick={() => handleUpdateLesson(lesson.id, section.id)}
                                    >
                                      บันทึกการแก้ไข
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      onClick={handleCancelEditLesson}
                                    >
                                      ยกเลิก
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                // Lesson Display
                                <div className="flex items-center justify-between bg-white border border-slate-100 rounded p-2">
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-slate-900">{lesson.title}</p>
                                    <div className="flex gap-2 mt-1">
                                      <Badge variant="outline">{lesson.contentType}</Badge>
                                      {lesson.duration && (
                                        <span className="text-xs text-slate-500">{lesson.duration} นาที</span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleEditLesson(lesson)}
                                    >
                                      แก้ไข
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="danger"
                                      onClick={() => handleDeleteLesson(lesson.id, section.id)}
                                    >
                                      ลบ
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add New Section Form */}
                  {showNewSectionForm ? (
                    <div className="border border-slate-200 rounded-lg p-4 space-y-3">
                      <div>
                        <Label required>ชื่อส่วน</Label>
                        <Input
                          value={newSectionTitle}
                          onChange={(e) => setNewSectionTitle(e.target.value)}
                          placeholder="กรอกชื่อส่วน"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="primary" onClick={handleAddSection}>
                          เพิ่มส่วน
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setShowNewSectionForm(false);
                            setNewSectionTitle('');
                          }}
                        >
                          ยกเลิก
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="secondary"
                      onClick={() => setShowNewSectionForm(true)}
                      disabled={isNew}
                    >
                      + เพิ่มส่วน
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Publish Panel */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Publish</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Status</Label>
                <select
                  value={formData.status}
                  onChange={(e) => handleFormChange('status', e.target.value)}
                              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              {!isNew && course && (
                <div className="pt-4 border-t border-slate-200">
                  <p className="text-xs text-slate-500 mb-2">Course Info</p>
                  <p className="text-sm text-slate-600">
                    Created: {new Date(course.createdAt || '').toLocaleDateString()}
                  </p>
                </div>
              )}

              <div className="pt-4">
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={handleSave}
                  isLoading={isSaving}
                >
                  {isNew ? 'Create Course' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CourseEditor;

