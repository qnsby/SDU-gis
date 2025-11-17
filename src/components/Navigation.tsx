import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Menu, Home, DoorOpen, Calendar, Map, GraduationCap, LogOut, User } from 'lucide-react';

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const studentId = localStorage.getItem('studentId') || '';
  const studentName = localStorage.getItem('studentName') || 'Студент';

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('studentId');
    localStorage.removeItem('studentName');
    navigate('/login');
  };

  const navItems = [
    { path: '/', label: 'Главная', icon: Home },
    { path: '/rooms', label: 'Свободные кабинеты', icon: DoorOpen },
    { path: '/events', label: 'События', icon: Calendar },
    { path: '/map', label: 'Карта кампуса', icon: Map },
  ];

  const NavLinks = ({ mobile = false }) => (
    <>
      {navItems.map(({ path, label, icon: Icon }) => (
        <Link
          key={path}
          to={path}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            location.pathname === path
              ? 'bg-blue-100 text-blue-700 font-medium'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          } ${mobile ? 'w-full justify-start' : ''}`}
          onClick={() => mobile && setIsOpen(false)}
        >
          <Icon size={18} />
          {label}
        </Link>
      ))}
    </>
  );

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Логотип */}
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-blue-700">
            <GraduationCap size={24} />
            SDU`gis
          </Link>

          {/* Десктопная навигация */}
          <div className="hidden md:flex items-center gap-2">
            <NavLinks />
          </div>

          {/* Профиль пользователя */}
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 h-10">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-blue-100 text-blue-700">
                      {studentId.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:block text-sm font-medium">
                    {studentName}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{studentName}</p>
                  <p className="text-xs text-gray-500">ID: {studentId}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Профиль
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="cursor-pointer text-red-600 focus:text-red-600"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Выйти
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Мобильное меню */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu size={20} />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <div className="flex flex-col gap-4 mt-8">
                  <NavLinks mobile />
                  <div className="border-t pt-4">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-red-600 hover:text-red-600 hover:bg-red-50"
                      onClick={handleLogout}
                    >
                      <LogOut size={18} className="mr-2" />
                      Выйти
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;