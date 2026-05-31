import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi, adsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Loader2,
  CheckCircle,
  XCircle,
  Users,
  Ticket,
  DollarSign,
  Clock,
  BarChart3,
  Image,
  Trash2,
  Plus,
  UserPlus,
  TrendingUp,
  Video,
  FileVideo,
  Search,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface AdminStats {
  pendingCount: number;
  approvedCount: number;
  usersCount: number;
  revenue: number;
}

interface PendingEvent {
  _id: string;
  title: string;
  category: string;
  region: string;
  venueName: string;
  dateTime: string;
  isFree: boolean;
  posterUrl: string;
  organizerId: string;
  createdAt: string;
}

interface ApprovedReport {
  eventId: string;
  title: string;
  organizerId: string;
  totalTickets: number;
  soldTickets: number;
  remainingTickets: number;
  revenue: number;
}

interface AdBanner {
  _id: string;
  mediaType: "image" | "video";
  imageUrl: string;
  link: string;
  deadline: string;
  createdAt: string;
}

interface AdminUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  createdAt: string;
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("uz-UZ").format(price) + " so'm";
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("uz-UZ", { day: "numeric", month: "long", year: "numeric" });
}

export default function AdminPanelPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("dashboard");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [pendingEvents, setPendingEvents] = useState<PendingEvent[]>([]);
  const [approvedReport, setApprovedReport] = useState<ApprovedReport[]>([]);
  const [ads, setAds] = useState<AdBanner[]>([]);
  const [loading, setLoading] = useState(true);

  // Users list
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersPage, setUsersPage] = useState(1);
  const [usersQ, setUsersQ] = useState("");
  const [usersRole, setUsersRole] = useState("");
  const [usersLoading, setUsersLoading] = useState(false);
  const [makingOrgForUser, setMakingOrgForUser] = useState<string | null>(null);

  // Reject dialog
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectEventId, setRejectEventId] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState(false);

  // Make organizer
  const [orgUserId, setOrgUserId] = useState("");
  const [makingOrg, setMakingOrg] = useState(false);

  // Add ad
  const [adMediaType, setAdMediaType] = useState<"image" | "video">("image");
  const [adImage, setAdImage] = useState<File | null>(null);
  const [adLink, setAdLink] = useState("");
  const [adDeadline, setAdDeadline] = useState("");
  const [addingAd, setAddingAd] = useState(false);

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/");
      return;
    }
    loadAll();
  }, [user, navigate]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [statsRes, pendingRes, reportRes, adsRes] = await Promise.all([
        adminApi.stats(),
        adminApi.pendingEvents(),
        adminApi.approvedReport(),
        adsApi.listAdmin(),
      ]);
      setStats(statsRes.data);
      setPendingEvents(pendingRes.data.items || []);
      setApprovedReport(reportRes.data.items || []);
      setAds(adsRes.data.items || []);
    } catch {
      toast.error("Ma'lumotlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await adminApi.approveEvent(id);
      toast.success("Event tasdiqlandi!");
      loadAll();
    } catch {
      toast.error("Tasdiqlash xatosi");
    }
  };

  const openReject = (id: string) => {
    setRejectEventId(id);
    setRejectReason("");
    setRejectOpen(true);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error("Sababni kiriting");
      return;
    }
    setRejecting(true);
    try {
      await adminApi.rejectEvent(rejectEventId, rejectReason);
      toast.success("Event rad etildi");
      setRejectOpen(false);
      loadAll();
    } catch {
      toast.error("Rad etish xatosi");
    } finally {
      setRejecting(false);
    }
  };

  const handleMakeOrganizer = async () => {
    if (!orgUserId.trim()) {
      toast.error("User ID kiriting");
      return;
    }
    setMakingOrg(true);
    try {
      const res = await adminApi.makeOrganizer(orgUserId.trim());
      toast.success(`${res.data.user.firstName} ${res.data.user.lastName} organizer bo'ldi!`);
      setOrgUserId("");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || "Xatolik");
    } finally {
      setMakingOrg(false);
    }
  };

  const handleAddAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adImage || !adDeadline) {
      toast.error("Rasm va deadline kerak");
      return;
    }
    setAddingAd(true);
    try {
      const formData = new FormData();
      formData.append("image", adImage);
      formData.append("deadline", adDeadline);
      if (adLink) formData.append("link", adLink);
      await adsApi.create(formData);
      toast.success("Reklama qo'shildi!");
      setAdImage(null);
      setAdLink("");
      setAdDeadline("");
      setAdMediaType("image");
      loadAll();
    } catch {
      toast.error("Reklama qo'shish xatosi");
    } finally {
      setAddingAd(false);
    }
  };

  const handleDeleteAd = async (id: string) => {
    try {
      await adsApi.delete(id);
      toast.success("Reklama o'chirildi");
      loadAll();
    } catch {
      toast.error("O'chirish xatosi");
    }
  };

  const loadUsers = async (page = 1, q = usersQ, role = usersRole) => {
    setUsersLoading(true);
    try {
      const res = await adminApi.listUsers({ page, limit: 20, q: q || undefined, role: role || undefined });
      setUsers(res.data.items || []);
      setUsersTotal(res.data.total || 0);
      setUsersPage(page);
    } catch {
      toast.error("Foydalanuvchilarni yuklashda xatolik");
    } finally {
      setUsersLoading(false);
    }
  };

  const handleMakeOrganizerInline = async (userId: string) => {
    setMakingOrgForUser(userId);
    try {
      const res = await adminApi.makeOrganizer(userId);
      toast.success(`${res.data.user.firstName} organizer bo'ldi!`);
      loadUsers(usersPage);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || "Xatolik");
    } finally {
      setMakingOrgForUser(null);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">Admin Panel</h1>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-6 flex-wrap">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="pending">Kutilmoqda ({pendingEvents.length})</TabsTrigger>
            <TabsTrigger value="stats">Statistika</TabsTrigger>
            <TabsTrigger value="organizers">Organizerlar</TabsTrigger>
            <TabsTrigger value="users" onClick={() => { if (users.length === 0) loadUsers(1); }}>
              Foydalanuvchilar
            </TabsTrigger>
            <TabsTrigger value="ads">Reklamalar</TabsTrigger>
          </TabsList>

          {/* Dashboard */}
          <TabsContent value="dashboard">
            {stats && (
              <div className="space-y-6">
                {/* Stat cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="border-0 shadow-md">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-3 bg-amber-100 rounded-xl">
                          <Clock className="h-6 w-6 text-amber-600" />
                        </div>
                        <span className="text-xs text-amber-500 font-medium bg-amber-50 px-2 py-1 rounded-full">Yangi</span>
                      </div>
                      <p className="text-3xl font-bold text-slate-900">{stats.pendingCount}</p>
                      <p className="text-sm text-slate-400 mt-1">Kutilmoqda</p>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-md">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-3 bg-emerald-100 rounded-xl">
                          <CheckCircle className="h-6 w-6 text-emerald-600" />
                        </div>
                      </div>
                      <p className="text-3xl font-bold text-slate-900">{stats.approvedCount}</p>
                      <p className="text-sm text-slate-400 mt-1">Tasdiqlangan</p>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-md">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-3 bg-blue-100 rounded-xl">
                          <Users className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                      <p className="text-3xl font-bold text-slate-900">{stats.usersCount}</p>
                      <p className="text-sm text-slate-400 mt-1">Foydalanuvchilar</p>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-md bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-3 bg-white/20 rounded-xl">
                          <DollarSign className="h-6 w-6 text-white" />
                        </div>
                        <TrendingUp className="h-4 w-4 text-white/60" />
                      </div>
                      <p className="text-2xl font-bold">{formatPrice(stats.revenue)}</p>
                      <p className="text-sm text-white/70 mt-1">Umumiy daromad</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Bar chart - events */}
                  <Card className="border-0 shadow-md">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-indigo-500" />
                        Eventlar holati
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={[
                          { name: "Kutilmoqda", value: stats.pendingCount, fill: "#f59e0b" },
                          { name: "Tasdiqlangan", value: stats.approvedCount, fill: "#10b981" },
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                          <Tooltip />
                          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                            {[{ fill: "#f59e0b" }, { fill: "#10b981" }].map((entry, index) => (
                              <Cell key={index} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Pie chart - approved report top 5 */}
                  <Card className="border-0 shadow-md">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Ticket className="h-4 w-4 text-indigo-500" />
                        Chipta taqsimoti (top 5)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {approvedReport.length === 0 ? (
                        <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
                          Ma'lumot yo'q
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height={200}>
                          <PieChart>
                            <Pie
                              data={approvedReport.slice(0, 5).map((r) => ({
                                name: r.title.length > 15 ? r.title.slice(0, 15) + "…" : r.title,
                                value: r.soldTickets,
                              }))}
                              cx="50%"
                              cy="50%"
                              outerRadius={70}
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              labelLine={false}
                            >
                              {approvedReport.slice(0, 5).map((_, i) => (
                                <Cell key={i} fill={["#6366f1", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b"][i % 5]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(v) => [`${v} ta`, "Sotilgan"]} />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Pending Events */}
          <TabsContent value="pending">
            {pendingEvents.length === 0 ? (
              <div className="text-center py-16">
                <CheckCircle className="h-16 w-16 text-emerald-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-600">Kutilayotgan eventlar yo'q</h3>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingEvents.map((ev) => (
                  <Card key={ev._id}>
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="w-full sm:w-32 h-24 rounded-lg overflow-hidden shrink-0">
                          {ev.posterUrl ? (
                            <img src={ev.posterUrl} alt={ev.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                              <Ticket className="h-8 w-8 text-white/60" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-900">{ev.title}</h3>
                          <p className="text-sm text-slate-500">{ev.venueName} • {ev.region}</p>
                          <p className="text-sm text-slate-400">{formatDate(ev.dateTime)}</p>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">{ev.category}</Badge>
                            {ev.isFree && <Badge className="bg-emerald-100 text-emerald-700 text-xs">Bepul</Badge>}
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleApprove(ev._id)}>
                            <CheckCircle className="mr-1 h-4 w-4" /> Tasdiqlash
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => openReject(ev._id)}>
                            <XCircle className="mr-1 h-4 w-4" /> Rad etish
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Stats */}
          <TabsContent value="stats">
            {approvedReport.length === 0 ? (
              <div className="text-center py-16">
                <BarChart3 className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-600">Statistika mavjud emas</h3>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="text-left p-3 text-sm font-semibold">Event</th>
                      <th className="text-center p-3 text-sm font-semibold">Jami</th>
                      <th className="text-center p-3 text-sm font-semibold">Sotilgan</th>
                      <th className="text-center p-3 text-sm font-semibold">Qolgan</th>
                      <th className="text-right p-3 text-sm font-semibold">Daromad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvedReport.map((r) => (
                      <tr key={r.eventId} className="border-b hover:bg-slate-50">
                        <td className="p-3 text-sm font-medium">{r.title}</td>
                        <td className="p-3 text-sm text-center">{r.totalTickets}</td>
                        <td className="p-3 text-sm text-center text-emerald-600 font-medium">{r.soldTickets}</td>
                        <td className="p-3 text-sm text-center">{r.remainingTickets}</td>
                        <td className="p-3 text-sm text-right font-medium">{formatPrice(r.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          {/* Organizers */}
          <TabsContent value="organizers">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" /> Organizer role berish
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3 max-w-md">
                  <Input
                    placeholder="User ID kiriting"
                    value={orgUserId}
                    onChange={(e) => setOrgUserId(e.target.value)}
                  />
                  <Button className="bg-indigo-600 hover:bg-indigo-700 shrink-0" onClick={handleMakeOrganizer} disabled={makingOrg}>
                    {makingOrg && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Organizer qilish
                  </Button>
                </div>
                <p className="text-sm text-slate-400 mt-2">
                  Foydalanuvchining User ID sini kiriting. Uni Profil sahifasidan topish mumkin.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users */}
          <TabsContent value="users">
            <div className="space-y-4">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    className="pl-9"
                    placeholder="Ism, familya yoki email bo'yicha qidirish..."
                    value={usersQ}
                    onChange={(e) => setUsersQ(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { setUsersPage(1); loadUsers(1, usersQ, usersRole); } }}
                  />
                </div>
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  value={usersRole}
                  onChange={(e) => { setUsersRole(e.target.value); loadUsers(1, usersQ, e.target.value); }}
                >
                  <option value="">Barcha rollar</option>
                  <option value="user">Foydalanuvchi</option>
                  <option value="organizer">Organizer</option>
                  <option value="admin">Admin</option>
                </select>
                <Button
                  variant="outline"
                  onClick={() => loadUsers(1, usersQ, usersRole)}
                  disabled={usersLoading}
                >
                  {usersLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>

              {usersLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-16">
                  <Users className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-600">Foydalanuvchilar topilmadi</h3>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="text-left p-3 font-semibold text-slate-600">Foydalanuvchi</th>
                          <th className="text-left p-3 font-semibold text-slate-600 hidden sm:table-cell">Email</th>
                          <th className="text-center p-3 font-semibold text-slate-600">Rol</th>
                          <th className="text-left p-3 font-semibold text-slate-600 hidden md:table-cell">Ro'yxatdan o'tgan</th>
                          <th className="text-center p-3 font-semibold text-slate-600">Amal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u) => (
                          <tr key={u._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                            <td className="p-3">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                  {u.firstName[0]}{u.lastName[0]}
                                </div>
                                <div>
                                  <p className="font-medium text-slate-800">{u.firstName} {u.lastName}</p>
                                  <p className="text-xs text-slate-400 sm:hidden">{u.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-3 text-slate-500 hidden sm:table-cell">{u.email}</td>
                            <td className="p-3 text-center">
                              <Badge className={
                                u.role === "admin"
                                  ? "bg-red-100 text-red-700"
                                  : u.role === "organizer"
                                  ? "bg-indigo-100 text-indigo-700"
                                  : "bg-slate-100 text-slate-600"
                              }>
                                {u.role === "admin" ? "Admin" : u.role === "organizer" ? "Organizer" : "Foydalanuvchi"}
                              </Badge>
                            </td>
                            <td className="p-3 text-slate-400 hidden md:table-cell">{formatDate(u.createdAt)}</td>
                            <td className="p-3 text-center">
                              {u.role === "user" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 text-xs"
                                  onClick={() => handleMakeOrganizerInline(u._id)}
                                  disabled={makingOrgForUser === u._id}
                                >
                                  {makingOrgForUser === u._id
                                    ? <Loader2 className="h-3 w-3 animate-spin" />
                                    : <><UserPlus className="h-3 w-3 mr-1" />Organizer</>
                                  }
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center justify-between pt-2">
                    <p className="text-sm text-slate-400">
                      Jami {usersTotal} ta foydalanuvchi
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={usersPage <= 1 || usersLoading}
                        onClick={() => loadUsers(usersPage - 1)}
                      >
                        Oldingi
                      </Button>
                      <span className="flex items-center px-3 text-sm text-slate-600">
                        {usersPage} / {Math.max(1, Math.ceil(usersTotal / 20))}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={usersPage >= Math.ceil(usersTotal / 20) || usersLoading}
                        onClick={() => loadUsers(usersPage + 1)}
                      >
                        Keyingi
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          {/* Ads */}
          <TabsContent value="ads">
            <div className="space-y-6">
              {/* Add ad form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" /> Yangi reklama qo'shish
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddAd} className="space-y-4">
                    {/* Media type selector */}
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setAdMediaType("image")}
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                          adMediaType === "image"
                            ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                            : "border-slate-200 hover:border-slate-300 text-slate-500"
                        }`}
                      >
                        <Image className="h-6 w-6" />
                        <div className="text-left">
                          <p className="font-medium text-sm">Rasm</p>
                          <p className="text-xs opacity-70">PNG, JPG, WEBP (5MB)</p>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdMediaType("video")}
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                          adMediaType === "video"
                            ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                            : "border-slate-200 hover:border-slate-300 text-slate-500"
                        }`}
                      >
                        <Video className="h-6 w-6" />
                        <div className="text-left">
                          <p className="font-medium text-sm">Video</p>
                          <p className="text-xs opacity-70">MP4, WEBM (50MB)</p>
                        </div>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                      <div className="space-y-1">
                        <Label className="text-xs">
                          {adMediaType === "video" ? "Video fayl *" : "Rasm *"}
                        </Label>
                        <Input
                          type="file"
                          accept={adMediaType === "video" ? "video/mp4,video/webm,video/quicktime" : "image/*"}
                          onChange={(e) => setAdImage(e.target.files?.[0] || null)}
                        />
                        {adImage && (
                          <p className="text-xs text-emerald-600">✓ {adImage.name}</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Link (ixtiyoriy)</Label>
                        <Input placeholder="https://..." value={adLink} onChange={(e) => setAdLink(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Deadline *</Label>
                        <Input type="datetime-local" value={adDeadline} onChange={(e) => setAdDeadline(e.target.value)} />
                      </div>
                    </div>

                    <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={addingAd}>
                      {addingAd
                        ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Yuklanmoqda...</>
                        : <><Plus className="mr-2 h-4 w-4" />Reklama qo'shish</>
                      }
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Ads list */}
              {ads.length === 0 ? (
                <div className="text-center py-12">
                  <Image className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-600">Reklamalar yo'q</h3>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ads.map((ad) => {
                    const isActive = new Date(ad.deadline).getTime() > Date.now();
                    const isVideo = ad.mediaType === "video";
                    return (
                      <Card key={ad._id} className="overflow-hidden">
                        <div className="h-44 overflow-hidden bg-slate-900 relative">
                          {isVideo ? (
                            <video
                              src={ad.imageUrl}
                              className="w-full h-full object-cover"
                              muted
                              loop
                              autoPlay
                              playsInline
                            />
                          ) : (
                            <img src={ad.imageUrl} alt="Ad banner" className="w-full h-full object-cover" />
                          )}
                          {isVideo && (
                            <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                              <FileVideo className="h-3 w-3" /> Video
                            </div>
                          )}
                        </div>
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <Badge className={isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}>
                                {isActive ? "Faol" : "Muddati o'tgan"}
                              </Badge>
                              <p className="text-xs text-slate-400 mt-1">
                                {formatDate(ad.deadline)}gacha
                              </p>
                            </div>
                            <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDeleteAd(ad._id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Eventni rad etish</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Rad etish sababi *</Label>
            <Textarea
              placeholder="Sababni yozing..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Bekor qilish</Button>
            <Button variant="destructive" onClick={handleReject} disabled={rejecting}>
              {rejecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Rad etish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}