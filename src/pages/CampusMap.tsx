import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Map, 
  Search, 
  Navigation, 
  MapPin, 
  Building, 
  Coffee, 
  BookOpen, 
  Car, 
  Utensils,
  Wifi,
  Heart,
  GraduationCap,
  LucideIcon
} from 'lucide-react';

// Моковые данные для демонстрации
const campusBuildings = [
  {
    id: '1',
    name: 'Главный корпус',
    type: 'academic',
    description: 'Административные офисы, лекционные залы, деканаты',
    floors: 4,
    facilities: ['Wi-Fi', 'Кафе', 'Библиотека'],
    coordinates: { x: 300, y: 200 }
  },
  {
    id: '2',
    name: 'Корпус А',
    type: 'academic',
    description: 'Факультет информатики и математики',
    floors: 5,
    facilities: ['Wi-Fi', 'Компьютерные классы'],
    coordinates: { x: 200, y: 150 }
  },
  {
    id: '3',
    name: 'Корпус Б',
    type: 'academic',
    description: 'Факультет экономики и управления',
    floors: 3,
    facilities: ['Wi-Fi', 'Конференц-залы'],
    coordinates: { x: 400, y: 150 }
  },
  {
    id: '4',
    name: 'Библиотека',
    type: 'library',
    description: 'Центральная научная библиотека',
    floors: 6,
    facilities: ['Wi-Fi', 'Читальные залы', 'Архив'],
    coordinates: { x: 350, y: 300 }
  },
  {
    id: '5',
    name: 'Столовая',
    type: 'dining',
    description: 'Главная столовая университета',
    floors: 2,
    facilities: ['Кафе', 'Столовая', 'Буфет'],
    coordinates: { x: 150, y: 250 }
  },
  {
    id: '6',
    name: 'Спортивный комплекс',
    type: 'sports',
    description: 'Спортивные залы и бассейн',
    floors: 2,
    facilities: ['Спортзал', 'Бассейн', 'Раздевалки'],
    coordinates: { x: 450, y: 250 }
  },
  {
    id: '7',
    name: 'Общежитие №1',
    type: 'dormitory',
    description: 'Студенческое общежитие',
    floors: 9,
    facilities: ['Wi-Fi', 'Кухни', 'Прачечная'],
    coordinates: { x: 100, y: 350 }
  },
  {
    id: '8',
    name: 'Парковка',
    type: 'parking',
    description: 'Основная парковка для студентов и сотрудников',
    floors: 1,
    facilities: ['Парковка', 'Охрана'],
    coordinates: { x: 500, y: 350 }
  }
];

const facilityIcons: { [key: string]: LucideIcon } = {
  'Wi-Fi': Wifi,
  'Кафе': Coffee,
  'Библиотека': BookOpen,
  'Столовая': Utensils,
  'Парковка': Car,
  'Спортзал': Heart,
  'Компьютерные классы': GraduationCap
};

const buildingTypeColors = {
  academic: 'bg-blue-500',
  library: 'bg-green-500',
  dining: 'bg-orange-500',
  sports: 'bg-red-500',
  dormitory: 'bg-purple-500',
  parking: 'bg-gray-500'
};

const buildingTypeLabels = {
  academic: 'Учебный корпус',
  library: 'Библиотека',
  dining: 'Питание',
  sports: 'Спорт',
  dormitory: 'Общежитие',
  parking: 'Парковка'
};

const CampusMap = () => {
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const filteredBuildings = campusBuildings.filter(building => {
    const matchesSearch = building.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         building.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || building.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const selectedBuildingData = selectedBuilding 
    ? campusBuildings.find(b => b.id === selectedBuilding)
    : null;

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Map className="text-blue-600" />
            Карта кампуса
          </h1>
          <p className="text-gray-600 mt-1">
            Интерактивная карта всех зданий и объектов университета
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <Navigation size={16} />
          Мое местоположение
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Карта */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin size={20} />
                Карта кампуса
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative bg-green-50 rounded-lg overflow-hidden" style={{ height: '500px' }}>
                {/* SVG карта */}
                <svg width="100%" height="100%" viewBox="0 0 600 400" className="absolute inset-0">
                  {/* Дорожки */}
                  <path 
                    d="M50,200 Q300,180 550,200" 
                    stroke="#94a3b8" 
                    strokeWidth="8" 
                    fill="none"
                    strokeDasharray="10,5"
                  />
                  <path 
                    d="M300,50 L300,350" 
                    stroke="#94a3b8" 
                    strokeWidth="6" 
                    fill="none"
                    strokeDasharray="8,4"
                  />
                  
                  {/* Зеленые зоны */}
                  <circle cx="150" cy="100" r="30" fill="#22c55e" opacity="0.3" />
                  <circle cx="450" cy="100" r="25" fill="#22c55e" opacity="0.3" />
                  <circle cx="300" cy="380" r="40" fill="#22c55e" opacity="0.3" />
                  
                  {/* Здания */}
                  {campusBuildings.map(building => (
                    <g key={building.id}>
                      <rect
                        x={building.coordinates.x - 25}
                        y={building.coordinates.y - 20}
                        width="50"
                        height="40"
                        fill={selectedBuilding === building.id ? '#3b82f6' : buildingTypeColors[building.type as keyof typeof buildingTypeColors]}
                        stroke={selectedBuilding === building.id ? '#1d4ed8' : '#374151'}
                        strokeWidth={selectedBuilding === building.id ? '3' : '1'}
                        rx="4"
                        className="cursor-pointer transition-all hover:opacity-80"
                        onClick={() => setSelectedBuilding(building.id)}
                      />
                      <text
                        x={building.coordinates.x}
                        y={building.coordinates.y + 5}
                        textAnchor="middle"
                        className="text-xs fill-white font-medium pointer-events-none"
                      >
                        {building.name.split(' ')[0]}
                      </text>
                    </g>
                  ))}
                </svg>
                
                {/* Легенда */}
                <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 space-y-2">
                  <h4 className="font-medium text-sm">Легенда:</h4>
                  {Object.entries(buildingTypeLabels).map(([type, label]) => (
                    <div key={type} className="flex items-center gap-2 text-xs">
                      <div 
                        className={`w-3 h-3 rounded ${buildingTypeColors[type as keyof typeof buildingTypeColors]}`}
                      />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Боковая панель */}
        <div className="space-y-6">
          {/* Поиск и фильтры */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Поиск зданий</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Поиск по названию..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Тип здания" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все типы</SelectItem>
                  {Object.entries(buildingTypeLabels).map(([type, label]) => (
                    <SelectItem key={type} value={type}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Информация о выбранном здании */}
          {selectedBuildingData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building size={20} />
                  {selectedBuildingData.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  {selectedBuildingData.description}
                </p>
                
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {selectedBuildingData.floors} этажей
                  </Badge>
                  <Badge 
                    className={buildingTypeColors[selectedBuildingData.type as keyof typeof buildingTypeColors] + ' text-white'}
                  >
                    {buildingTypeLabels[selectedBuildingData.type as keyof typeof buildingTypeLabels]}
                  </Badge>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Удобства:</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedBuildingData.facilities.map(facility => {
                      const Icon = facilityIcons[facility] || MapPin;
                      return (
                        <Badge key={facility} variant="outline" className="text-xs">
                          <Icon size={12} className="mr-1" />
                          {facility}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1">
                    <Navigation size={14} className="mr-1" />
                    Маршрут
                  </Button>
                  <Button size="sm" variant="outline">
                    Подробнее
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Список зданий */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Здания ({filteredBuildings.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {filteredBuildings.map(building => (
                  <div
                    key={building.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedBuilding === building.id 
                        ? 'bg-blue-50 border-blue-200 border' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedBuilding(building.id)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div 
                        className={`w-3 h-3 rounded ${buildingTypeColors[building.type as keyof typeof buildingTypeColors]}`}
                      />
                      <span className="font-medium text-sm">{building.name}</span>
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {building.description}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CampusMap;