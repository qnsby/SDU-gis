import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DoorOpen, Calendar, Map, Clock, Users, MapPin } from 'lucide-react';

type RoomsPayload = {
  updated_at?: string;
  free_count?: number;
  total_count?: number;
  rooms?: { number: string; status: string }[];
};

export default function Index() {
  const studentName = localStorage.getItem('studentName') || 'Студент';

  const [freeRoomsCount, setFreeRoomsCount] = useState<number | null>(null);
  const [totalRoomsCount, setTotalRoomsCount] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await fetch('/rooms.json', { cache: 'no-store' });
        if (!res.ok) {
          console.error('Не удалось загрузить rooms.json');
          return;
        }
        const data: RoomsPayload = await res.json();

        const free = data.free_count ?? data.rooms?.length ?? null;
        const total = data.total_count ?? null;

        if (free !== null) setFreeRoomsCount(free);
        if (total !== null) setTotalRoomsCount(total);
        if (data.updated_at) setLastUpdated(data.updated_at);
      } catch (e) {
        console.error('Ошибка при загрузке rooms.json', e);
      }
    };

    fetchRooms();
  }, []);

  const features = [
    {
      title: 'Свободные кабинеты',
      description: 'Найди свободные аудитории для учебы и встреч',
      icon: DoorOpen,
      path: '/rooms',
      color: 'from-blue-500 to-cyan-500',
      stats:
        freeRoomsCount !== null
          ? `${freeRoomsCount} свободных сейчас`
          : 'Загрузка данных...'
    },
    {
      title: 'События университета',
      description: 'Актуальные мероприятия и важные даты',
      icon: Calendar,
      path: '/events',
      color: 'from-purple-500 to-pink-500',
      stats: '8 событий на этой неделе' // пока статично
    },
    {
      title: 'Карта кампуса',
      description: 'Интерактивная карта всех зданий и объектов',
      icon: Map,
      path: '/map',
      color: 'from-green-500 to-emerald-500',
      stats:
        totalRoomsCount !== null
          ? `${totalRoomsCount} кабинетов на карте`
          : 'Загрузка...'
    }
  ];

  return (
    <div className="space-y-12">
      {/* Персональное приветствие */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Добро пожаловать, {studentName.split(' ')[0] || studentName}!
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Твой персональный помощник для навигации по SDU. 
          Находи свободные кабинеты, следи за событиями и изучай карту кампуса.
        </p>
      </div>

      {/* Основные функции */}
      <div className="grid md:grid-cols-3 gap-6">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Card
              key={feature.path}
              className="group hover:shadow-lg transition-all duration-300 border-0 bg-white/70 backdrop-blur-sm"
            >
              <CardHeader className="pb-4">
                <div
                  className={`w-12 h-12 rounded-lg bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                >
                  <Icon className="text-white" size={24} />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
                <CardDescription className="text-gray-600">
                  {feature.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock size={16} />
                  {feature.stats}
                </div>
                <Link to={feature.path}>
                  <Button className="w-full group-hover:bg-gradient-to-r group-hover:from-blue-500 group-hover:to-purple-500 transition-all">
                    Перейти
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Быстрая статистика */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-4 bg-white/50 rounded-lg backdrop-blur-sm">
          <div className="text-2xl font-bold text-blue-600">
            {totalRoomsCount !== null ? totalRoomsCount : '—'}
          </div>
          <div className="text-sm text-gray-600">Всего кабинетов</div>
        </div>
        <div className="text-center p-4 bg-white/50 rounded-lg backdrop-blur-sm">
          <div className="text-2xl font-bold text-purple-600">
            {freeRoomsCount !== null ? freeRoomsCount : '—'}
          </div>
          <div className="text-sm text-gray-600">Свободно сейчас</div>
        </div>
        <div className="text-center p-4 bg-white/50 rounded-lg backdrop-blur-sm">
          <div className="text-2xl font-bold text-green-600">12</div>
          <div className="text-sm text-gray-600">Зданий</div>
        </div>
        <div className="text-center p-4 bg-white/50 rounded-lg backdrop-blur-sm">
          <div className="text-2xl font-bold text-orange-600">8</div>
          <div className="text-sm text-gray-600">Событий</div>
        </div>
      </div>

      {/* Информационный блок */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-0">
        <CardContent className="p-8">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="text-blue-600" size={24} />
            </div> 
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">Интеграция с порталом SDU</h3>
              <p className="text-gray-600 mb-4">
                Данные о свободных кабинетах обновляются в реальном времени через парсинг портала университета. 
                Информация о событиях синхронизируется с официальным календарем мероприятий SDU.
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <MapPin size={16} />
                Последнее обновление:{' '}
                {lastUpdated ? lastUpdated : 'данные ещё не загружены'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
