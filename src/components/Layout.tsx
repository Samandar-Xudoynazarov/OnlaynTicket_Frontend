import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { myApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Bell, Menu, User, LogOut, Ticket, LayoutDashboard, Shield, ChevronDown, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";

const REGIONS = [
  "Toshkent", "Samarqand", "Buxoro", "Xorazm", "Navoiy",
  "Andijon", "Farg'ona", "Namangan", "Qashqadaryo", "Surxondaryo",
  "Jizzax", "Sirdaryo", "Qoraqalpog'iston",
];

const LANGUAGES = [
  { code: "uz", label: "O'zbek", flag: "🇺🇿" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "en", label: "English", flag: "🇬🇧" },
];

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t, i18n } = useTranslation();

  const selectedRegion = searchParams.get("region") || t("nav.allRegions");

  const CATEGORIES = [
    { key: "concert", label: t("nav.concerts") },
    { key: "event", label: t("nav.events") },
    { key: "sport", label: t("nav.sport") },
    { key: "culture", label: t("nav.culture") },
  ];

  useEffect(() => {
    if (user) {
      myApi.notifications().then((res) => {
        setNotifications(res.data.items || []);
        setUnreadCount((res.data.items || []).filter((n: Notification) => !n.isRead).length);
      }).catch(() => {});
    }
  }, [user, location.pathname]);

  const handleMarkRead = async (id: string) => {
    try {
      await myApi.markRead(id);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      /* ignore */
    }
  };

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code);
  };

  const currentLang = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-lg flex items-center justify-center font-bold text-sm">
              OT
            </div>
            <span className="text-xl font-bold hidden sm:block">
              Onlayn <span className="text-indigo-400">Tikket</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.key}
                to={`/?category=${cat.key}`}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hover:bg-white/10 ${
                  location.search.includes(cat.key) ? "bg-white/15 text-indigo-300" : "text-slate-300"
                }`}
              >
                {cat.label}
              </Link>
            ))}
          </nav>

          {/* Region Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-white/10">
                📍 {selectedRegion}
                <ChevronDown className="ml-1 h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-64 overflow-y-auto">
              <DropdownMenuItem onClick={() => {
                const params = new URLSearchParams(searchParams);
                params.delete("region");
                params.delete("page");
                navigate(`/?${params.toString()}`);
              }}>
                🌍 {t("nav.allRegions")}
              </DropdownMenuItem>
              {REGIONS.map((r) => (
                <DropdownMenuItem key={r} onClick={() => {
                  const params = new URLSearchParams(searchParams);
                  params.set("region", r);
                  params.delete("page");
                  navigate(`/?${params.toString()}`);
                }}>
                  {searchParams.get("region") === r ? "✓ " : ""}{r}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Language switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-white/10 gap-1.5">
                  <Globe className="h-4 w-4" />
                  <span className="hidden sm:inline text-sm">{currentLang.flag} {currentLang.code.toUpperCase()}</span>
                  <span className="sm:hidden text-sm">{currentLang.flag}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {LANGUAGES.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    className={i18n.language === lang.code ? "bg-indigo-50 text-indigo-700" : ""}
                  >
                    {lang.flag} {lang.label}
                    {i18n.language === lang.code && <span className="ml-auto text-indigo-500">✓</span>}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {user ? (
              <>
                {/* Notifications */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative text-slate-300 hover:text-white hover:bg-white/10">
                      <Bell className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-[10px]">
                          {unreadCount}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
                    <div className="px-3 py-2 font-semibold text-sm">{t("nav.notifications")}</div>
                    <DropdownMenuSeparator />
                    {notifications.length === 0 ? (
                      <div className="px-3 py-4 text-sm text-muted-foreground text-center">{t("nav.noNotifications")}</div>
                    ) : (
                      notifications.slice(0, 10).map((n) => (
                        <DropdownMenuItem
                          key={n._id}
                          onClick={() => handleMarkRead(n._id)}
                          className={`flex flex-col items-start gap-1 ${!n.isRead ? "bg-indigo-50" : ""}`}
                        >
                          <span className="font-medium text-sm">{n.title}</span>
                          <span className="text-xs text-muted-foreground line-clamp-2">{n.message}</span>
                        </DropdownMenuItem>
                      ))
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-white/10 gap-2">
                      <User className="h-4 w-4" />
                      <span className="hidden sm:inline">{user.firstName}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <div className="px-3 py-2">
                      <p className="font-medium text-sm">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                      <Badge variant="outline" className="mt-1 text-[10px]">{user.role}</Badge>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/profile")}>
                      <User className="mr-2 h-4 w-4" /> {t("nav.profile")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/my-tickets")}>
                      <Ticket className="mr-2 h-4 w-4" /> {t("nav.myTickets")}
                    </DropdownMenuItem>
                    {(user.role === "organizer" || user.role === "admin") && (
                      <DropdownMenuItem onClick={() => navigate("/organizer")}>
                        <LayoutDashboard className="mr-2 h-4 w-4" /> {t("nav.organizerPanel")}
                      </DropdownMenuItem>
                    )}
                    {user.role === "admin" && (
                      <DropdownMenuItem onClick={() => navigate("/admin")}>
                        <Shield className="mr-2 h-4 w-4" /> {t("nav.adminPanel")}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="text-red-600">
                      <LogOut className="mr-2 h-4 w-4" /> {t("nav.logout")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-white/10" onClick={() => navigate("/login")}>
                  {t("nav.login")}
                </Button>
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" onClick={() => navigate("/register")}>
                  {t("nav.register")}
                </Button>
              </div>
            )}

            {/* Mobile menu */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden text-slate-300 hover:text-white hover:bg-white/10">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72">
                <SheetHeader>
                  <SheetTitle>{t("nav.menu")}</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-2 mt-4">
                  {CATEGORIES.map((cat) => (
                    <Link
                      key={cat.key}
                      to={`/?category=${cat.key}`}
                      onClick={() => setMobileOpen(false)}
                      className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-100"
                    >
                      {cat.label}
                    </Link>
                  ))}
                  <DropdownMenuSeparator />
                  <div className="px-3 py-2">
                    <p className="text-xs text-slate-400 mb-2">Til / Язык / Language</p>
                    <div className="flex gap-2">
                      {LANGUAGES.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => { changeLanguage(lang.code); setMobileOpen(false); }}
                          className={`px-2 py-1 rounded text-sm border transition-colors ${
                            i18n.language === lang.code
                              ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          {lang.flag} {lang.code.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-lg flex items-center justify-center font-bold text-sm text-white">
                  OT
                </div>
                <span className="text-lg font-bold text-white">Onlayn Tikket</span>
              </div>
              <p className="text-sm">{t("footer.description")}</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">{t("footer.categories")}</h4>
              <div className="flex flex-col gap-1.5">
                {CATEGORIES.map((cat) => (
                  <Link key={cat.key} to={`/?category=${cat.key}`} className="text-sm hover:text-white transition-colors">
                    {cat.label}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">{t("footer.contact")}</h4>
              <p className="text-sm">Email: info@onlayntikket.uz</p>
              <p className="text-sm">Tel: +998 71 123 45 67</p>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-6 pt-6 text-center text-sm">
            © 2026 Onlayn Tikket. {t("footer.rights")}
          </div>
        </div>
      </footer>
    </div>
  );
}
