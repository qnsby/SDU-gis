import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Filter, Calendar as CalendarIcon, Plus, Bell } from 'lucide-react';
import EventCard from '@/components/EventCard';

// Моковые данные для демонстрации
const mockEvents = [
  {
    id: '1',
    title: 'Лекция по машинному обучению',
    description: 'Введение в нейронные сети и глубокое обучение. Практические примеры и применение.',
    date: '15 ноября 2024',
    time: '10:00 - 11:30',
    location: 'А-101, Главный корпус',
    organizer: 'Проф. Иванов И.И.',
    category: 'Лекция',
    attendees: 45,
    maxAttendees: 50,
    priority: 'medium' as const,
    isRegistered: true
  },
  {
    id: '2',
    title: 'Дедлайн курсовой работы',
    description: 'Последний день сдачи курсовых работ по дисциплине "Базы данных".',
    date: '18 ноября 2024',
    time: '23:59',
    location: 'Онлайн',
    organizer: 'Деканат',
    category: 'Дедлайн',
    priority: 'high' as const
  },
  {
    id: '3',
    title: 'Научная конференция студентов',
    description: 'Ежегодная конференция с презентацией научных работ студентов всех курсов.',
    date: '22 ноября 2024',
    time: '09:00 - 17:00',
    location: 'Актовый зал',
    organizer: 'Научный отдел',
    category: 'Конференция',
    attendees: 120,
    maxAttendees: 200,
    priority: 'medium' as const
  },
  {
    id: '4',
    title: 'Семинар по карьерному развитию',
    description: 'Как составить резюме, подготовиться к собеседованию и найти работу мечты.',
    date: '25 ноября 2024',
    time: '14:00 - 16:00',
    location: 'Б-205, Корпус Б',
    organizer: 'Центр карьеры',
    category: 'Семинар',
    attendees: 25,
    maxAttendees: 30,
    priority: 'low' as const
  },
  {
    id: '5',
    title: 'День открытых дверей',
    description: 'Презентация университета для абитуриентов и их родителей.',
    date: '28 ноября 2024',
    time: '11:00 - 15:00',
    location: 'Все корпуса',
    organizer: 'Приемная комиссия',
    category: 'Мероприятие',
    priority: 'medium' as const
  },
  {
    id: '6',
    title: 'Экзамен по математическому анализу',
    description: 'Письменный экзамен по курсу математического анализа для 1 курса.',
    date: '2 декабря 2024',
    time: '09:00 - 12:00',
    location: 'В-301, Корпус В',
    organizer: 'Кафедра математики',
    category: 'Экзамен',
    priority: 'high' as const,
    isRegistered: true
  }
];

const Events = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('all');

  const filteredEvents = useMemo(() => {
    let events = mockEvents;

    // Фильтр по табам
    if (activeTab === 'registered') {
      events = events.filter(event => event.isRegistered);
    } else if (activeTab === 'upcoming') {
      // В реальном приложении здесь была бы фильтрация по датам
      events = events.slice(0, 3);
    }

    // Остальные фильтры
    return events.filter(event => {
      const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           event.organizer.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || event.category === categoryFilter;
      const matchesPriority = priorityFilter === 'all' || event.priority === priorityFilter;
      
      return matchesSearch && matchesCategory && matchesPriority;
    });
  }, [searchTerm, categoryFilter, priorityFilter, activeTab]);

  const categories = [...new Set(mockEvents.map(event => event.category))];
  
  const priorityCounts = {
    high: mockEvents.filter(e => e.priority === 'high').length,
    medium: mockEvents.filter(e => e.priority === 'medium').length,
    low: mockEvents.filter(e => e.priority === 'low').length
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
            Актуальные мероприятия, дедлайны и важные даты
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Bell size={16} />
            Уведомления
          </Button>
          <Button className="gap-2">
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

                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
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
                {filteredEvents.map(event => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Events;