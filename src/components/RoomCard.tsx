'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Users, Clock, Wifi, Monitor, Calendar } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface RoomCardProps {
  room: {
    id: string;
    number: string;
    building: string;
    floor: number;
    capacity: number;
    status: 'free' | 'occupied' | 'soon';
    nextOccupied?: string;
    equipment?: string[]; // ← теперь опционально
    type: string;
  };
}

const RoomCard = ({ room }: RoomCardProps) => {
  const statusColors: Record<RoomCardProps['room']['status'], string> = {
    free: 'bg-green-100 text-green-800 border-green-200',
    occupied: 'bg-red-100 text-red-800 border-red-200',
    soon: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  };

  const statusLabels: Record<RoomCardProps['room']['status'], string> = {
    free: 'Свободна',
    occupied: 'Занята',
    soon: 'Скоро занята',
  };

  const equipmentIcons: Record<string, LucideIcon> = {
    'Wi-Fi': Wifi,
    Проектор: Monitor,
    Компьютер: Monitor,
  };

  // если нет оборудования — сделаем пустой массив
  const equipmentList = room.equipment ?? [];

  return (
    <Card className="hover:shadow-lg transition-shadow border border-gray-200">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">{room.number}</CardTitle>
            <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
              <MapPin size={14} />
              <span>
                {room.building}, {room.floor} этаж
              </span>
            </div>
          </div>
          <Badge className={`${statusColors[room.status]} border`}>
            {statusLabels[room.status]}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1">
            <Users size={14} />
            <span>{room.capacity} мест</span>
          </div>
          <span className="text-gray-500">{room.type}</span>
        </div>

        {room.nextOccupied && (
          <div className="flex items-center gap-1 text-sm text-orange-600">
            <Clock size={14} />
            <span>Занята с {room.nextOccupied}</span>
          </div>
        )}

        {/* ✅ безопасная проверка на наличие оборудования */}
        {equipmentList.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {equipmentList.map((item) => {
              const Icon = equipmentIcons[item] || Monitor;
              return (
                <Badge key={item} variant="secondary" className="text-xs flex items-center">
                  <Icon size={12} className="mr-1" />
                  {item}
                </Badge>
              );
            })}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button size="sm" className="flex-1">
            <Calendar size={14} className="mr-1" />
            Забронировать
          </Button>
          <Button size="sm" variant="outline">
            <MapPin size={14} className="mr-1" />
            На карте
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RoomCard;
