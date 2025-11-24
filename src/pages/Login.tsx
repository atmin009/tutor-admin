import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';
import { useAuthStore } from '../store/authStore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Label } from '../components/ui/Label';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Checkbox } from '../components/ui/Checkbox';
import { Eye, EyeOff, XCircle } from 'lucide-react';

interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

const Login = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await axiosInstance.post<LoginResponse>('/auth/login', {
        email,
        password,
      });

      const { token, user } = response.data;
      login(token, {
        id: user.id,
        name: user.name,
        email: user.email,
      });

      if (rememberMe) {
        localStorage.setItem('authToken', token);
      } else {
        sessionStorage.setItem('authToken', token);
      }
      navigate('/admin/dashboard');
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || 'การเข้าสู่ระบบล้มเหลว โปรดตรวจสอบอีเมลและรหัสผ่านของคุณ';
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
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
            </div>

            <CardTitle className="text-3xl font-bold text-slate-900">Tutor Admin</CardTitle>
            <CardDescription className="text-slate-600">
              ระบบบริหารจัดการคอร์ส, ครูผู้สอน, และผู้ใช้งาน
            </CardDescription>
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
                    autoComplete="current-password"
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

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember-me"
                    checked={rememberMe}
                    onCheckedChange={(checked: boolean) => setRememberMe(checked)}
                    className="border-slate-300 data-[state=checked]:bg-brand data-[state=checked]:border-brand"
                  />
                  <Label htmlFor="remember-me" className="text-slate-600 text-sm cursor-pointer">
                    จำฉันไว้
                  </Label>
                </div>
                <a
                  href="#"
                  className="font-medium text-brand hover:text-brand/80 transition-colors"
                >
                  ลืมรหัสผ่าน?
                </a>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                className="w-full py-3 text-base font-semibold bg-brand text-white rounded-lg shadow-sm hover:bg-brand/90 transition-colors"
                disabled={isLoading}
              >
                {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
