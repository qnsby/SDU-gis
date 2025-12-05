import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, Users, ExternalLink, Bell } from 'lucide-react';

interface EventCardProps {
  event: {
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
    priority: 'high' | 'medium' | 'low' | 'subject';
  };
  onToggleRegister?: () => void; // 🔴 колбек из Events.tsx
  disabled?: boolean;            // 🔴 блокировка кнопки во время запроса
}

const EventCard = ({ event, onToggleRegister, disabled }: EventCardProps) => {
  const priorityColors = {
    high: 'bg-red-100 text-red-800 border-red-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-green-100 text-green-800 border-green-200',
    pair: 'bg-blue-100 text-blue-800 border-blue-200',
  };

  const priorityLabels = {
    high: 'Важное',
    medium: 'Обычное',
    low: 'Информация',
    subject: 'Пара',
  };

  const categoryColors: { [key: string]: string } = {
    'Лекция': 'bg-blue-100 text-blue-800',
    'Семинар': 'bg-purple-100 text-purple-800',
    'Конференция': 'bg-indigo-100 text-indigo-800',
    'Мероприятие': 'bg-pink-100 text-pink-800',
    'Экзамен': 'bg-red-100 text-red-800',
    'Дедлайн': 'bg-orange-100 text-orange-800'
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-lg leading-tight">{event.title}</CardTitle>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{event.description}</p>
          </div>
          <div className="flex flex-col gap-1">
            <Badge className={priorityColors[event.priority]}>
              {priorityLabels[event.priority]}
            </Badge>
            <Badge
              variant="secondary"
              className={categoryColors[event.category] || 'bg-gray-100 text-gray-800'}
            >
              {event.category}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Calendar size={14} className="text-gray-500" />
            <span>{event.date}</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Clock size={14} className="text-gray-500" />
            <span>{event.time}</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <MapPin size={14} className="text-gray-500" />
            <span>{event.location}</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Users size={14} className="text-gray-500" />
            <span>Организатор: {event.organizer}</span>
          </div>
        </div>

        {event.attendees !== undefined && event.maxAttendees && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Участники:</span>
            <span
              className={`font-medium ${
                event.attendees >= event.maxAttendees ? 'text-red-600' : 'text-green-600'
              }`}
            >
              {event.attendees}/{event.maxAttendees}
            </span>
          </div>
        )}

        <div className="flex gap-2">
          {event.isRegistered ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={onToggleRegister}
              disabled={disabled}
            >
              <Bell size={14} className="mr-1" />
              {disabled ? 'Обновляем...' : 'Зарегистрирован'}
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              className="flex-1"
              onClick={onToggleRegister}
              disabled={disabled}
            >
              <Calendar size={14} className="mr-1" />
              {disabled ? 'Обновляем...' : 'Записаться'}
            </Button>
          )}
          <Button size="sm" variant="outline" type="button">
            <ExternalLink size={14} className="mr-1" />
            Подробнее
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default EventCard;
