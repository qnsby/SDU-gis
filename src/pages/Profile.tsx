import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { GraduationCap, Mail, IdCard, User, Cake } from 'lucide-react';
import { Button } from '@/components/ui/button';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

type StudentProfile = {
  success: boolean;
  studentId: string;
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  photoUrl?: string | null;
  email?: string | null;
  birthDate?: string | null;
  grandGpa?: string | null;
};

const Profile = () => {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const navigate = useNavigate();

  const studentId = localStorage.getItem('studentId');
  const studentNameFallback = localStorage.getItem('studentName') || 'Студент';

  // Если нет studentId в localStorage — выкидываем на логин
  useEffect(() => {
    if (!studentId) {
      navigate('/login');
    }
  }, [studentId, navigate]);

  // Инициалы для аватарки
  const initials = (() => {
    const name =
      profile?.fullName ||
      (profile?.firstName && profile?.lastName
        ? `${profile.firstName} ${profile.lastName}`
        : studentNameFallback);

    const trimmed = name?.trim() || '';
    if (!trimmed) return '??';

    const parts = trimmed.split(' ');
    const letters = parts.map((p) => p[0]).slice(0, 2);
    return letters.join('').toUpperCase();
  })();

  // Отображаемое имя
  const displayName =
    profile?.fullName ||
    (profile?.firstName && profile?.lastName
      ? `${profile.firstName} ${profile.lastName}`
      : studentNameFallback);

  const fetchProfile = async () => {
    if (!studentId) return;
    try {
      setLoading(true);
      setErrorMsg(null);

      const res = await fetch(
        `${API_BASE_URL}/api/profile?studentId=${encodeURIComponent(studentId)}`,
      );

      if (!res.ok) {
        const text = await res.text();
        console.error('Profile error:', res.status, text);
        setErrorMsg('Не удалось загрузить профиль');
        return;
      }

      const data: StudentProfile = await res.json();
      if (!data.success) {
        setErrorMsg('Профиль не найден');
        return;
      }

      setProfile(data);
    } catch (err) {
      console.error(err);
      setErrorMsg('Ошибка при загрузке профиля');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
        <span className="text-gray-400">Главная</span>
        <span>/</span>
        <span className="font-medium text-gray-700">Профиль</span>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-16 w-16">
              {profile?.photoUrl && (
                <AvatarImage src={profile.photoUrl} alt={displayName} className="object-cover" />
              )}
              <AvatarFallback className="bg-blue-100 text-blue-700 text-lg">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                {displayName}
              </CardTitle>
              <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                <GraduationCap className="h-4 w-4" />
                SDU student
              </p>
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={fetchProfile} disabled={loading}>
            {loading ? 'Обновление...' : 'Обновить'}
          </Button>
        </CardHeader>

        <Separator />

        <CardContent className="pt-4">
          {errorMsg && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {errorMsg}
            </div>
          )}

          {loading && !profile ? (
            <div className="space-y-3">
              <div className="h-4 w-40 bg-gray-100 rounded animate-pulse" />
              <div className="h-4 w-52 bg-gray-100 rounded animate-pulse" />
              <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-xs uppercase text-gray-400">ФИО</p>
                  <p className="text-sm font-medium text-gray-900">{displayName}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs uppercase text-gray-400">ID студента</p>
                  <p className="text-sm font-medium flex items-center gap-2">
                    <IdCard className="h-4 w-4 text-blue-600" />
                    {studentId}
                  </p>
                </div>

                {/* Место под будущие поля (программа, группа, грант и т.д.) */}
                <div className="space-y-1">
                  <p className="text-xs uppercase text-gray-400">Email</p>
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    {profile?.email}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs uppercase text-gray-400">Grand GPA</p>
                  <p className="text-sm font-medium flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-gray-400" />
                    {profile?.grandGpa}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase text-gray-400">Дата рождения</p>
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Cake className="h-4 w-4 text-gray-400" />
                    {profile?.birthDate}
                  </p>
                </div>
              </div>

              <Separator className="my-4" />

              <p className="text-xs text-gray-400">
                Данные подтягиваются автоматически с my.sdu.edu.kz при авторизации в SDU`gis.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
