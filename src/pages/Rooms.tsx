import { useState, useMemo, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Filter, RefreshCw, DoorOpen } from 'lucide-react';
import RoomCard from '@/components/RoomCard';

type RoomJson = {
  number?: string;
  floor?: number;
  capacity?: number;
  status?: string;
};

type RoomsPayloadObject = {
  updated_at?: string;
  free_count?: number;
  total_count?: number;
  rooms?: RoomJson[];
};

const Rooms = () => {
  const [rooms, setRooms] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRooms = async () => {
      try {
        setLoading(true);
        const res = await fetch('/rooms.json', { cache: 'no-store' });

        if (!res.ok) {
          throw new Error(`Не удалось загрузить rooms.json (status ${res.status})`);
        }

        const data: unknown = await res.json();
        console.log('rooms.json в Rooms.tsx =>', data);

        let roomsArray: RoomJson[] = [];

        if (Array.isArray(data)) {
          // формат A: просто массив комнат
          roomsArray = data as RoomJson[];
        } else if (data && typeof data === 'object') {
          // формат B: объект с полем rooms
          const obj = data as RoomsPayloadObject;
          if (Array.isArray(obj.rooms)) {
            roomsArray = obj.rooms;
          } else {
            throw new Error('rooms.json: поле "rooms" отсутствует или не является массивом');
          }
        } else {
          throw new Error('Неожиданный формат rooms.json');
        }

        const formatted = roomsArray.map((r, i) => {
          const number = typeof r === 'string' ? r : (r.number || '');
          const building = number ? number[0] : 'Неизвестно';

          return {
            id: i.toString(),
            number,
            building,
            floor: (r as any).floor || 1,
            capacity: (r as any).capacity || 0,
            status: (r as any).status || 'free',
            type: 'Аудитория',
          };
        });

        setRooms(formatted);
      } catch (err) {
        console.error('Ошибка загрузки данных о кабинетах:', err);
      } finally {
        setLoading(false);
      }
    };

    loadRooms();
  }, []);

  const filteredRooms = useMemo(() => {
    return rooms.filter((room) =>
      room.number.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [rooms, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <DoorOpen className="text-blue-600" />
          Свободные кабинеты
        </h1>
        <Button
          variant="outline"
          onClick={async () => {
            setLoading(true);
            try {
              // Вызов Python-скрипта через backend endpoint
              const res = await fetch('http://localhost:7777/run-parser');
              const text = await res.text();
              console.log(text);
              // после завершения парсера перечитаем страницу/rooms.json
              window.location.reload();
            } catch (err) {
              console.error('Ошибка при запуске парсера:', err);
              alert('Не удалось обновить данные. Убедитесь, что сервер запущен.');
            } finally {
              setLoading(false);
            }
          }}
        >
          <RefreshCw size={16} /> Обновить
        </Button>
      </div>

      {loading ? (
        <p>Загрузка...</p>
      ) : (
        <div>
          <h2 className="text-xl font-semibold mb-4">
            Найдено аудиторий: {filteredRooms.length}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Rooms;
