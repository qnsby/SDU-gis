import { useState, useMemo, useEffect, FormEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Filter, Calendar as CalendarIcon, Plus, Bell } from 'lucide-react';
import EventCard from '@/components/EventCard';

function getTodayWeekdayRu(): string {
  const days = [
    'Воскресенье',
    'Понедельник',
    'Вторник',
    'Среда',
    'Четверг',
    'Пятница',
    'Суббота',
  ];
  const todayIndex = new Date().getDay(); // 0 = Вс, 1 = Пн ...
  return days[todayIndex];
}

// 👇 Тип события (совпадает с тем, что ждёт EventCard)
type Priority = 'high' | 'medium' | 'low';

export type UniversityEvent = {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  organizer: string;
  category: string;
  attendees?: number;
  maxAttendees?: number;
  isRegistered?: boolean;
  priority: Priority;
};

type ScheduleLesson = {
  day: string;     // Понедельник
  time: string;    // 08:30-09:20
  course: string;  // INF 321
  teacher: string; // Bakhtiyor Meraliyev
  room: string;    // H 102
};

type ScheduleResponse = {
  success: boolean;
  studentId: string | null;
  studentName: string | null;
  lessons: ScheduleLesson[];
  message: string;
};

// 🔴 ответы бэка по регистрации
type RegisteredEventsResponse = {
  success: boolean;
  eventIds: string[];
};

type RegisterEventResponse = {
  success: boolean;
  isRegistered: boolean;
  message: string;
};

// 🧠 маппинг уроков расписания → события для EventCard
function mapScheduleToEvents(lessons: ScheduleLesson[]): UniversityEvent[] {
  return lessons.map((lesson, idx) => ({
    id: `schedule-${idx}-${lesson.day}-${lesson.time}-${lesson.course}-${lesson.room}`,
    title: lesson.course,
    description: `${lesson.course} — занятие по расписанию`,
    date: lesson.day,
    time: lesson.time,
    location: lesson.room,
    organizer: lesson.teacher,
    category: 'Пара',
    priority: 'medium',
    isRegistered: true, // пары всегда считаем "моими"
  }));
}

// Начальное состояние формы добавления
const emptyForm = {
  title: '',
  description: '',
  date: '',
  time: '',
  location: '',
  organizer: '',
  category: 'Лекция',
  priority: 'medium' as Priority,
};

const Events = () => {
  // 🟩 события-расписание, которые приходят с /api/schedule (личные)
  const [scheduleEvents, setScheduleEvents] = useState<UniversityEvent[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  // 🔴 ОБЩИЕ ивенты из Mongo (/api/events) — для всех
  const [globalEvents, setGlobalEvents] = useState<UniversityEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);

  // 🔴 ID событий, на которые пользователь записан (Mongo)
  const [registeredIds, setRegisteredIds] = useState<string[]>([]);
  const [registerBusy, setRegisterBusy] = useState<string | null>(null); // id события, которое сейчас шлём

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | Priority>('all');
  const [activeTab, setActiveTab] = useState('all');

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  // 📡 тянем расписание с backend при монтировании страницы
  useEffect(() => {
    const studentId = localStorage.getItem('studentId');
    const password = localStorage.getItem('studentPassword'); // мы сохраняли его в Login.tsx

    if (!studentId || !password) {
      setScheduleError('Для загрузки расписания нужно авторизоваться.');
      return;
    }

    const fetchSchedule = async () => {
      setScheduleLoading(true);
      setScheduleError(null);

      try {
        const res = await fetch('http://localhost:8000/api/schedule', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ studentId, password }),
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Ошибка сервера: ${res.status} ${text}`);
        }

        const data: ScheduleResponse = await res.json();

        if (!data.success) {
          throw new Error(data.message || 'Не удалось получить расписание');
        }

        const mapped = mapScheduleToEvents(data.lessons);
        setScheduleEvents(mapped);
      } catch (err: any) {
        console.error(err);
        setScheduleError(err.message || 'Ошибка при загрузке расписания');
      } finally {
        setScheduleLoading(false);
      }
    };

    fetchSchedule();
  }, []);

  // 🔴 тянем ОБЩИЕ ивенты из Mongo (/api/events)
  useEffect(() => {
    const fetchEvents = async () => {
      setEventsLoading(true);
      setEventsError(null);
      try {
        const res = await fetch('http://localhost:8000/api/events');
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Ошибка сервера: ${res.status} ${text}`);
        }
        const data: UniversityEvent[] = await res.json();
        setGlobalEvents(data);
      } catch (err: any) {
        console.error(err);
        setEventsError(err.message || 'Не удалось загрузить события');
      } finally {
        setEventsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // 🔴 тянем список eventId, на которые юзер записан (/api/events/registered)
  useEffect(() => {
    const studentId = localStorage.getItem('studentId');
    const password = localStorage.getItem('studentPassword');
    if (!studentId || !password) return;

    const fetchRegistered = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/events/registered', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId, password }),
        });

        if (!res.ok) {
          console.warn('Не удалось загрузить список регистраций');
          return;
        }

        const data: RegisteredEventsResponse = await res.json();
        if (data.success && Array.isArray(data.eventIds)) {
          setRegisteredIds(data.eventIds);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchRegistered();
  }, []);

  // 🔴 обработчик нажатия на "Записаться / Зарегистрирован"
  const handleToggleRegister = async (eventId: string, currentlyRegistered: boolean) => {
    const studentId = localStorage.getItem('studentId');
    const password = localStorage.getItem('studentPassword');

    if (!studentId || !password) {
      alert('Сначала нужно авторизоваться');
      return;
    }

    setRegisterBusy(eventId);
    try {
      const res = await fetch('http://localhost:8000/api/events/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          password,
          eventId,
          action: currentlyRegistered ? 'unregister' : 'register',
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Ошибка сервера: ${res.status} ${text}`);
      }

      const data: RegisterEventResponse = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Ошибка при изменении регистрации');
      }

      setRegisteredIds(prev =>
        data.isRegistered
          ? Array.from(new Set([...prev, eventId]))
          : prev.filter(id => id !== eventId)
      );
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Не удалось обновить регистрацию');
    } finally {
      setRegisterBusy(null);
    }
  };

  // все события = расписание (личные) + общие из Mongo
  const allEvents = useMemo(
    () => [...scheduleEvents, ...globalEvents],
    [scheduleEvents, globalEvents]
  );

  // Обработчик изменения полей формы (создание нового ОБЩЕГО события)
  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // 🔴 Добавление нового ОБЩЕГО события → POST /api/events
  const handleAddEvent = async (e: FormEvent) => {
    e.preventDefault();

    if (!form.title || !form.date) {
      alert('Название и дата обязательны');
      return;
    }

    const studentId = localStorage.getItem('studentId');
    const password = localStorage.getItem('studentPassword');

    if (!studentId || !password) {
      alert('Чтобы создать событие, нужно авторизоваться');
      return;
    }

    try {
      const res = await fetch('http://localhost:8000/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          password,
          event: {
            title: form.title,
            description: form.description,
            date: form.date,
            time: form.time,
            location: form.location,
            organizer: form.organizer || 'Организатор не указан',
            category: form.category,
            priority: form.priority,
          },
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Ошибка сервера: ${res.status} ${text}`);
      }

      const created: UniversityEvent = await res.json();
      // добавляем в список общих ивентов
      setGlobalEvents(prev => [created, ...prev]);

      setForm(emptyForm);
      setIsAddOpen(false);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Не удалось создать событие');
    }
  };

  const filteredEvents = useMemo(() => {
    let list = allEvents;

    // Фильтр по табам
    if (activeTab === 'registered') {
      list = list.filter(
        event =>
          event.isRegistered ||
          registeredIds.includes(event.id)
      );
    } else if (activeTab === 'upcoming') {
      const today = getTodayWeekdayRu().toLowerCase();

      list = list.filter(event => {
        const d = (event.date || '').toLowerCase().trim();
        return (
          d === today ||
          d.startsWith(today) ||
          d.includes(today)
        );
      });
    }

    // Остальные фильтры (поиск, категория, приоритет)
    return list.filter(event => {
      const matchesSearch =
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.organizer.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        categoryFilter === 'all' || event.category === categoryFilter;

      const matchesPriority =
        priorityFilter === 'all' || event.priority === priorityFilter;

      return matchesSearch && matchesCategory && matchesPriority;
    });
  }, [allEvents, searchTerm, categoryFilter, priorityFilter, activeTab, registeredIds]);

  const categories = [...new Set(allEvents.map(event => event.category))];

  const priorityCounts = {
    high: allEvents.filter(e => e.priority === 'high').length,
    medium: allEvents.filter(e => e.priority === 'medium').length,
    low: allEvents.filter(e => e.priority === 'low').length,
  };

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CalendarIcon className="text-blue-600" />
            События университета
          </h1>
          <p className="text-gray-600 mt-1">
            Актуальные мероприятия, дедлайны и твои пары как события
          </p>
          {scheduleLoading && (
            <p className="text-xs text-gray-500 mt-1">
              Загружаем расписание с сервера...
            </p>
          )}
          {scheduleError && (
            <p className="text-xs text-red-500 mt-1">
              {scheduleError}
            </p>
          )}
          {eventsLoading && (
            <p className="text-xs text-gray-500 mt-1">
              Загружаем общие события...
            </p>
          )}
          {eventsError && (
            <p className="text-xs text-red-500 mt-1">
              {eventsError}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Bell size={16} />
            Уведомления
          </Button>
          <Button className="gap-2" onClick={() => setIsAddOpen(true)}>
            <Plus size={16} />
            Добавить событие
          </Button>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{priorityCounts.high}</div>
            <div className="text-sm text-gray-600">Важных</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{priorityCounts.medium}</div>
            <div className="text-sm text-gray-600">Обычных</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{priorityCounts.low}</div>
            <div className="text-sm text-gray-600">Информационных</div>
          </CardContent>
        </Card>
      </div>

      {/* Табы */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">Все события</TabsTrigger>
          <TabsTrigger value="registered">Мои записи</TabsTrigger>
          <TabsTrigger value="upcoming">Ближайшие</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6 mt-6">
          {/* Фильтры */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter size={20} />
                Фильтры
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Поиск событий..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Категория" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все категории</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={priorityFilter}
                  onValueChange={(val: 'all' | Priority) => setPriorityFilter(val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Приоритет" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все приоритеты</SelectItem>
                    <SelectItem value="high">Важные</SelectItem>
                    <SelectItem value="medium">Обычные</SelectItem>
                    <SelectItem value="low">Информационные</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(searchTerm || categoryFilter !== 'all' || priorityFilter !== 'all') && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Активные фильтры:</span>
                  {searchTerm && (
                    <Badge variant="secondary">
                      Поиск: {searchTerm}
                    </Badge>
                  )}
                  {categoryFilter !== 'all' && (
                    <Badge variant="secondary">
                      Категория: {categoryFilter}
                    </Badge>
                  )}
                  {priorityFilter !== 'all' && (
                    <Badge variant="secondary">
                      Приоритет: {priorityFilter === 'high' ? 'Важные' : priorityFilter === 'medium' ? 'Обычные' : 'Информационные'}
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchTerm('');
                      setCategoryFilter('all');
                      setPriorityFilter('all');
                    }}
                  >
                    Сбросить
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Результаты */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {activeTab === 'all' && `Всего событий: ${filteredEvents.length}`}
                {activeTab === 'registered' && `Мои записи: ${filteredEvents.length}`}
                {activeTab === 'upcoming' && `Ближайшие события: ${filteredEvents.length}`}
              </h2>
            </div>

            {filteredEvents.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <CalendarIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">События не найдены</h3>
                  <p className="text-gray-600">
                    {activeTab === 'registered'
                      ? 'Вы пока не записались ни на одно событие'
                      : 'Попробуйте изменить параметры поиска или фильтры'
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {filteredEvents.map(event => {
                  const isReg = event.isRegistered || registeredIds.includes(event.id);
                  return (
                    <EventCard
                      key={event.id}
                      event={{ ...event, isRegistered: isReg }}
                      onToggleRegister={() => handleToggleRegister(event.id, isReg)}
                      disabled={registerBusy === event.id}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Модалка "Добавить событие" */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-lg space-y-4">
            <h2 className="text-xl font-semibold mb-2">Добавить событие</h2>
            <form onSubmit={handleAddEvent} className="space-y-3">
              <div>
                <label className="text-sm font-medium">Название *</label>
                <Input
                  name="title"
                  value={form.title}
                  onChange={handleFormChange}
                  placeholder="Например, Экзамен по ООП"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Описание</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleFormChange}
                  className="mt-1 w-full border rounded-md px-3 py-2 text-sm min-h-[70px]"
                  placeholder="Краткое описание события..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Дата / День *</label>
                  <Input
                    type="text"
                    name="date"
                    value={form.date}
                    onChange={handleFormChange}
                    placeholder="Например, Понедельник или 10 января 2025"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Время</label>
                  <Input
                    type="text"
                    name="time"
                    value={form.time}
                    onChange={handleFormChange}
                    placeholder="09:00 - 11:00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Локация</label>
                  <Input
                    name="location"
                    value={form.location}
                    onChange={handleFormChange}
                    placeholder="D101, Актовый зал, Онлайн..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Организатор</label>
                  <Input
                    name="organizer"
                    value={form.organizer}
                    onChange={handleFormChange}
                    placeholder="Например, Кафедра ИТ"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Категория</label>
                  <Input
                    name="category"
                    value={form.category}
                    onChange={handleFormChange}
                    placeholder="Лекция, Экзамен, Мероприятие..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Приоритет</label>
                  <select
                    className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
                    value={form.priority}
                    onChange={(e) =>
                      setForm(prev => ({ ...prev, priority: e.target.value as Priority }))
                    }
                  >
                    <option value="high">Важное</option>
                    <option value="medium">Обычное</option>
                    <option value="low">Информация</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddOpen(false);
                    setForm(emptyForm);
                  }}
                >
                  Отмена
                </Button>
                <Button type="submit">
                  Сохранить
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;
