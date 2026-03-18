import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scrollarea';
import { MapPin, Search, Filter, Layers, Navigation2, Compass } from 'lucide-react';
import React from 'react';

const buildings = [
  { id: 1, name: 'Главный корпус', code: 'A', distance: '150 м' },
  { id: 2, name: 'Инженерный корпус', code: 'B', distance: '320 м' },
  { id: 3, name: 'Библиотека', code: 'L', distance: '420 м' },
  { id: 4, name: 'Студенческий дом', code: 'D1', distance: '650 м' },
  { id: 5, name: 'Спортивный комплекс', code: 'S', distance: '900 м' },
];

export default function SduGisFrame() {
  return (
    <div className="grid h-[calc(100vh-7rem)] gap-6 lg:grid-cols-[340px,minmax(0,1fr)]">
      {/* Левая панель с фильтрами и поиском */}
      <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-sm">
        <CardHeader className="space-y-2">
          <CardTitle className="flex items-center justify-between text-lg">
            <span>SDU GIS</span>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
              Кампус карта
            </span>
          </CardTitle>
          <p className="text-sm text-gray-500">
            Найди здание, аудиторию или объект инфраструктуры на карте кампуса.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Поиск
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Введите название корпуса, аудитории или объекта"
                className="pl-9 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Тип объекта
              </label>
              <Select defaultValue="all">
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Выберите тип" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все объекты</SelectItem>
                  <SelectItem value="academic">Учебные корпуса</SelectItem>
                  <SelectItem value="dorm">Общежития</SelectItem>
                  <SelectItem value="service">Сервисы и инфраструктура</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Этаж
              </label>
              <Select defaultValue="any">
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Все этажи" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Все этажи</SelectItem>
                  <SelectItem value="0">Цокольный</SelectItem>
                  <SelectItem value="1">1 этаж</SelectItem>
                  <SelectItem value="2">2 этаж</SelectItem>
                  <SelectItem value="3">3 этаж</SelectItem>
                  <SelectItem value="4">4 этаж</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <Button variant="outline" size="sm" className="flex-1 gap-2">
              <Filter className="h-4 w-4" />
              Фильтры
            </Button>
            <Button variant="outline" size="sm" className="flex-1 gap-2">
              <Layers className="h-4 w-4" />
              Слои карты
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Ближайшие объекты
              </span>
              <span className="text-xs text-gray-400">5 результатов</span>
            </div>
            <ScrollArea className="h-56 rounded-md border bg-white/60">
              <div className="p-2">
                {buildings.map((b) => (
                  <button
                    key={b.id}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-blue-50"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-100 text-xs font-semibold text-blue-700">
                      {b.code}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{b.name}</span>
                        <span className="text-xs text-gray-400">{b.distance}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <MapPin className="h-3 w-3" />
                        Корпус {b.code}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          <Button className="w-full gap-2">
            <Navigation2 className="h-4 w-4" />
            Построить маршрут
          </Button>
        </CardContent>
      </Card>

      {/* Правая панель с картой */}
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-lg">Интерактивная карта SDU</CardTitle>
            <p className="mt-1 text-xs text-slate-300">
              Масштабируй, перемещай карту и изучай кампус в деталях.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8 bg-white/10 border-white/20">
              <Compass className="h-4 w-4" />
            </Button>
            <div className="flex flex-col rounded-md bg-black/30 px-3 py-1 text-xs text-slate-200">
              <span className="font-medium">Онлайн</span>
              <span className="text-[10px] text-emerald-300">Данные обновлены 2 мин назад</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative h-full pb-6">
          {/* Заглушка под будущий компонент карты */}
          <div className="relative flex h-full min-h-[360px] items-center justify-center rounded-xl border border-slate-700 bg-[radial-gradient(circle_at_top,_#1e293b,_#020617)]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(59,130,246,0.25),_transparent_55%)]" />
            <div className="relative z-10 text-center space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-black/40 px-4 py-1 text-xs text-slate-200 ring-1 ring-blue-500/40">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                SDU GIS • Бета-версия
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold">Компонент карты скоро здесь</h2>
                <p className="mx-auto max-w-md text-sm text-slate-300">
                  Здесь будет отображаться интерактивная карта кампуса: здания, корпуса, аудитории и
                  маршруты передвижения по SDU.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-lg bg-black/40 px-4 py-2 text-xs text-slate-200 ring-1 ring-slate-700/60">
                <span className="rounded-full bg-slate-800 px-2 py-1 text-[10px] uppercase tracking-wide text-slate-300">
                  Пример интерфейса
                </span>
                <span>Подключите сюда компонент карты (Leaflet, Mapbox, Yandex и т.д.)</span>
              </div>
            </div>

            {/* Сеточный фон поверх карты */}
            <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,rgba(148,163,184,0.15)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.15)_1px,transparent_1px)] [background-size:40px_40px]" />
          </div>
        </CardContent>
      </Card>
    </div>

  );
}

