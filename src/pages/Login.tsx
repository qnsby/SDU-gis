// src/pages/Login.tsx (или где у тебя лежит этот компонент)

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GraduationCap, Eye, EyeOff, AlertCircle } from 'lucide-react';

const Login = () => {
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!studentId || !password) {
      setError('Пожалуйста, заполните все поля');
      setIsLoading(false);  
      return;
    }

    try {
      const res = await fetch('http://localhost:8000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId,
          password,
        }),
      });

      if (!res.ok) {
        let msg = 'Ошибка авторизации. Проверьте данные.';
        try {
          const errData = await res.json();
          if (errData?.detail) msg = errData.detail;
        } catch {
          /* ignore */
        }
        setError(msg);
        setIsLoading(false);
        return;
      }

      const data = await res.json();

      if (data.success) {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('studentId', data.studentId);
        localStorage.setItem('studentPassword', password); // 👈 сохраняем пароль для /api/schedule
        if (data.studentName) {
          localStorage.setItem('studentName', data.studentName);
        }

        navigate('/');
      } else {
        setError(data.message || 'Не удалось войти. Попробуйте ещё раз.');
      }
    } catch (err) {
      console.error(err);
      setError('Ошибка соединения с сервером. Попробуйте позже.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Логотип и заголовок */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full">
              <GraduationCap className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            SDU`gis
          </h1>
          <p className="text-gray-600">
            Войдите в систему для доступа к университетским сервисам
          </p>
        </div>

        {/* Форма авторизации */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Вход в систему</CardTitle>
            <CardDescription className="text-center">
              Используйте ваш студенческий ID и пароль от my.sdu.edu.kz
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="studentId">Студенческий ID</Label>
                <Input
                  id="studentId"
                  type="text"
                  placeholder="Введите ваш студенческий ID"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Введите ваш пароль"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 pr-12"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-12 w-12"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </Button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                disabled={isLoading}
              >
                {isLoading ? 'Вход...' : 'Войти'}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <p className="text-xs text-gray-500">
                Авторизация выполняется через ваш аккаунт my.sdu.edu.kz
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
