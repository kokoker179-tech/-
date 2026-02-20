
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from "react-router-dom";
import { 
  Home, UserPlus, CheckSquare, Users, Menu, X, 
  ClipboardList, Settings, LogOut, Code, Monitor, 
  Sun, Moon, Languages, Globe 
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { t, Lang } from '../services/i18n';

const NavItem = ({ to, icon: Icon, label, active, onClick, colorClass }: { to: string, icon: any, label: string, active: boolean, onClick?: () => void, colorClass: string }) => (
  <Link
    to={to}
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
      active 
        ? 'bg-gradient-to-l from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-200 dark:shadow-none scale-[1.02]' 
        : `text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md ${colorClass}`
    }`}
  >
    <Icon size={20} className={active ? 'text-white' : ''} />
    <span className="font-bold">{label}</span>
  </Link>
);

interface LayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
  hideSidebar?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, onLogout, hideSidebar = false }) => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState(storageService.getConfig());
  const [theme, setTheme] = useState(storageService.getTheme());
  const [lang, setLang] = useState<Lang>(storageService.getLang());

  const updateUI = () => {
    const currentTheme = storageService.getTheme();
    const currentLang = storageService.getLang();
    setTheme(currentTheme);
    setLang(currentLang);
    
    // Apply classes to document
    document.documentElement.classList.toggle('dark', currentTheme === 'dark');
    document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLang;
  };

  useEffect(() => {
    updateUI();
    const updateConfig = () => setConfig(storageService.getConfig());
    window.addEventListener('storage_updated', updateConfig);
    window.addEventListener('ui_updated', updateUI);
    return () => {
      window.removeEventListener('storage_updated', updateConfig);
      window.removeEventListener('ui_updated', updateUI);
    };
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    storageService.setTheme(next);
  };

  const toggleLang = () => {
    const next = lang === 'ar' ? 'en' : 'ar';
    storageService.setLang(next);
  };

  const handleLogoutClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onLogout();
    setIsOpen(false);
  };

  const SignatureFooter = () => (
    <div className="mt-auto py-8 text-center px-4">
      <div className="w-12 h-px bg-slate-200 dark:bg-slate-800 mx-auto mb-4"></div>
      <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1.5 uppercase tracking-wider">
        <Code size={12} className="text-blue-500" />
        {lang === 'ar' ? 'نظام مطور بواسطة:' : 'Developed by:'} 
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
          {lang === 'ar' ? 'كيرلس صفوت' : 'Kirillos Safwat'}
        </span>
      </p>
      <p className="text-[9px] text-slate-300 dark:text-slate-600 font-bold mt-1 uppercase">Angel Raphael Church System</p>
    </div>
  );

  const ControlPanel = () => (
    <div className="grid grid-cols-2 gap-2 p-2 bg-slate-100/50 dark:bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 mb-4">
      <button 
        onClick={toggleTheme}
        className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-all text-slate-600 dark:text-slate-400"
      >
        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} className="text-amber-500" />}
        <span className="text-[9px] font-black uppercase">{t('theme', lang)}</span>
      </button>
      <button 
        onClick={toggleLang}
        className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-all text-slate-600 dark:text-slate-400"
      >
        <Globe size={18} className="text-blue-500" />
        <span className="text-[9px] font-black uppercase">{lang.toUpperCase()}</span>
      </button>
    </div>
  );

  if (hideSidebar) {
    return (
      <div className="min-h-screen bg-[#fcfdfe] dark:bg-slate-950 transition-colors duration-500 flex flex-col p-4 md:p-8">
        <main className="flex-1">
          {children}
        </main>
        <SignatureFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfdfe] dark:bg-slate-950 transition-colors duration-500 flex">
      {/* Sidebar - Desktop */}
      <aside className={`hidden lg:flex flex-col w-72 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-slate-100 dark:border-slate-800 p-6 fixed h-full ${lang === 'ar' ? 'right-0 border-l' : 'left-0 border-r'} z-40 overflow-y-auto scrollbar-thin`}>
        <div className="mb-10 text-center shrink-0">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white shadow-xl rotate-3">
             <Users size={32} />
          </div>
          <h1 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-b from-slate-800 dark:from-white to-slate-500 dark:to-slate-500 leading-tight px-2">
            {config.meetingName} <br/> {config.churchName}
          </h1>
        </div>

        <nav className="flex flex-col gap-2 shrink-0">
          <NavItem to="/" icon={Home} label={t('dashboard', lang)} active={location.pathname === '/'} colorClass="hover:text-blue-600" />
          <NavItem to="/register-attendance" icon={CheckSquare} label={t('registerAttendance', lang)} active={location.pathname === '/register-attendance'} colorClass="hover:text-emerald-600" />
          <NavItem to="/youth-portal" icon={Monitor} label={t('youthPortal', lang)} active={location.pathname === '/youth-portal'} colorClass="hover:text-indigo-600" />
          <NavItem to="/all-attendance" icon={ClipboardList} label={t('fullHistory', lang)} active={location.pathname === '/all-attendance'} colorClass="hover:text-amber-600" />
          <NavItem to="/add-youth" icon={UserPlus} label={t('addNewYouth', lang)} active={location.pathname === '/add-youth'} colorClass="hover:text-purple-600" />
          <NavItem to="/youth-list" icon={Users} label={t('youthList', lang)} active={location.pathname === '/youth-list'} colorClass="hover:text-cyan-600" />
          <NavItem to="/settings" icon={Settings} label={t('settings', lang)} active={location.pathname === '/settings'} colorClass="hover:text-rose-600" />
        </nav>

        <div className="mt-auto pt-6 space-y-4 shrink-0">
          <ControlPanel />
          <button 
            onClick={handleLogoutClick}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-600 dark:hover:bg-rose-600 hover:text-white transition-all font-black shadow-sm"
          >
            <LogOut size={20} />
            <span>{t('logout', lang)}</span>
          </button>
        </div>
        
        <div className="shrink-0">
          <SignatureFooter />
        </div>
      </aside>

      {/* Mobile Top Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-b border-slate-100 dark:border-slate-800 px-4 py-3 flex items-center justify-between z-50">
        <button onClick={() => setIsOpen(true)} className="p-2 text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
          <Menu size={24} />
        </button>
        <span className="font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-600 text-sm truncate max-w-[150px]">{config.meetingName}</span>
        <div className="flex items-center gap-2">
           <button onClick={toggleTheme} className="p-2 text-slate-500">
             {theme === 'light' ? <Moon size={20} /> : <Sun size={20} className="text-amber-500" />}
           </button>
           <button onClick={handleLogoutClick} className="p-2 text-rose-500">
             <LogOut size={20} />
           </button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[100] lg:hidden" onClick={() => setIsOpen(false)}>
          <aside className={`absolute ${lang === 'ar' ? 'right-0' : 'left-0'} top-0 bottom-0 w-72 bg-white dark:bg-slate-900 p-6 flex flex-col gap-4 shadow-2xl overflow-y-auto`} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6 shrink-0 border-b border-slate-50 dark:border-slate-800 pb-4">
              <span className="font-black text-blue-600">{lang === 'ar' ? 'القائمة الرئيسية' : 'Main Menu'}</span>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X size={24} /></button>
            </div>
            <nav className="flex flex-col gap-2 shrink-0">
              <NavItem to="/" icon={Home} label={t('dashboard', lang)} active={location.pathname === '/'} onClick={() => setIsOpen(false)} colorClass="hover:text-blue-600" />
              <NavItem to="/register-attendance" icon={CheckSquare} label={t('registerAttendance', lang)} active={location.pathname === '/register-attendance'} onClick={() => setIsOpen(false)} colorClass="hover:text-emerald-600" />
              <NavItem to="/youth-portal" icon={Monitor} label={t('youthPortal', lang)} active={location.pathname === '/youth-portal'} onClick={() => setIsOpen(false)} colorClass="hover:text-indigo-600" />
              <NavItem to="/all-attendance" icon={ClipboardList} label={t('fullHistory', lang)} active={location.pathname === '/all-attendance'} onClick={() => setIsOpen(false)} colorClass="hover:text-amber-600" />
              <NavItem to="/add-youth" icon={UserPlus} label={t('addNewYouth', lang)} active={location.pathname === '/add-youth'} onClick={() => setIsOpen(false)} colorClass="hover:text-purple-600" />
              <NavItem to="/youth-list" icon={Users} label={t('youthList', lang)} active={location.pathname === '/youth-list'} onClick={() => setIsOpen(false)} colorClass="hover:text-cyan-600" />
              <NavItem to="/settings" icon={Settings} label={t('settings', lang)} active={location.pathname === '/settings'} onClick={() => setIsOpen(false)} colorClass="hover:text-rose-600" />
            </nav>
            <div className="mt-auto pt-4 shrink-0">
              <ControlPanel />
              <button onClick={handleLogoutClick} className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 font-black shadow-sm mb-4">
                <LogOut size={20} />
                <span>{t('logout', lang)}</span>
              </button>
              <SignatureFooter />
            </div>
          </aside>
        </div>
      )}

      <main className={`flex-1 ${lang === 'ar' ? 'lg:mr-72' : 'lg:ml-72'} p-4 lg:p-10 mt-16 lg:mt-0 overflow-x-hidden flex flex-col min-h-screen transition-all`}>
        <div className="flex-1">
          {children}
        </div>
        <div className="lg:hidden">
          <SignatureFooter />
        </div>
      </main>
    </div>
  );
};
