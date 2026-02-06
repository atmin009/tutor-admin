import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../api/axios';
import { useAuthStore } from '../store/authStore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Label } from '../components/ui/Label';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Eye, EyeOff, XCircle } from 'lucide-react';

interface RegisterResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

const Register = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (password !== confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน');
      return;
    }

    if (password.length < 6) {
      setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }

    setIsLoading(true);

    try {
      // Register super admin
      const response = await axiosInstance.post<RegisterResponse>('/auth/register-super-admin', {
        name,
        email,
        password,
      });

      const { token, user } = response.data;
      login(token, {
        id: user.id,
        name: user.name,
        email: user.email,
      });

      sessionStorage.setItem('authToken', token);
      navigate('/admin/dashboard');
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || 'การสมัครสมาชิกล้มเหลว โปรดลองอีกครั้ง';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        <Card className="border border-slate-200 bg-white shadow-lg">
          <CardHeader className="text-center space-y-3 pt-8 pb-6">
            <div className="flex justify-center mb-2">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand/10">
                <svg
                  className="h-8 w-8 text-brand"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                  />
                </svg>
              </div>
            </div>

            <CardTitle className="text-3xl font-bold text-slate-900">สมัคร Super Admin</CardTitle>
            <CardDescription className="text-slate-600">
              สร้างบัญชี Super Admin สำหรับการจัดการระบบ
            </CardDescription>
            <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-800">
                ⚠️ หน้านี้เป็นชั่วคราวสำหรับการสร้าง Super Admin เท่านั้น
              </p>
            </div>
          </CardHeader>

          <CardContent className="px-8 pb-8 space-y-5">
            {error && (
              <div
                role="alert"
                className="p-3 text-sm rounded-lg border border-red-200 bg-red-50 text-red-700 flex items-center gap-2"
              >
                <XCircle className="w-4 h-4 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-700 text-sm font-medium">
                  ชื่อ
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder="ชื่อของคุณ"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-brand focus:border-transparent rounded-lg py-3 px-4 transition-all"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 text-sm font-medium">
                  อีเมล
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-brand focus:border-transparent rounded-lg py-3 px-4 transition-all"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700 text-sm font-medium">
                  รหัสผ่าน
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-brand focus:border-transparent rounded-lg py-3 px-4 pr-12 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-brand focus:outline-none transition-colors"
                    aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-700 text-sm font-medium">
                  ยืนยันรหัสผ่าน
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-brand focus:border-transparent rounded-lg py-3 px-4 pr-12 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-brand focus:outline-none transition-colors"
                    aria-label={showConfirmPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                className="w-full py-3 text-base font-semibold bg-brand text-white rounded-lg shadow-sm hover:bg-brand/90 transition-colors"
                disabled={isLoading}
              >
                {isLoading ? 'กำลังสมัครสมาชิก...' : 'สมัครสมาชิก'}
              </Button>

              <div className="text-center text-sm text-slate-600">
                มีบัญชีอยู่แล้ว?{' '}
                <Link to="/login" className="font-medium text-brand hover:text-brand/80 transition-colors">
                  เข้าสู่ระบบ
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;

