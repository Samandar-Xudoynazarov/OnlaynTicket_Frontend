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
} from "lucide-react";

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
  imageUrl: string;
  link: string;
  deadline: string;
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

  // Reject dialog
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectEventId, setRejectEventId] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState(false);

  // Make organizer
  const [orgUserId, setOrgUserId] = useState("");
  const [makingOrg, setMakingOrg] = useState(false);

  // Add ad
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
            <TabsTrigger value="ads">Reklamalar</TabsTrigger>
          </TabsList>

          {/* Dashboard */}
          <TabsContent value="dashboard">
            {stats && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-amber-100 rounded-lg">
                        <Clock className="h-6 w-6 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{stats.pendingCount}</p>
                        <p className="text-sm text-slate-400">Kutilmoqda</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-emerald-100 rounded-lg">
                        <CheckCircle className="h-6 w-6 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{stats.approvedCount}</p>
                        <p className="text-sm text-slate-400">Tasdiqlangan</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{stats.usersCount}</p>
                        <p className="text-sm text-slate-400">Foydalanuvchilar</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-green-100 rounded-lg">
                        <DollarSign className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-sm">{formatPrice(stats.revenue)}</p>
                        <p className="text-sm text-slate-400">Umumiy daromad</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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
                  <form onSubmit={handleAddAd} className="flex flex-col sm:flex-row gap-3 items-end">
                    <div className="space-y-1 flex-1">
                      <Label className="text-xs">Rasm *</Label>
                      <Input type="file" accept="image/*" onChange={(e) => setAdImage(e.target.files?.[0] || null)} />
                    </div>
                    <div className="space-y-1 flex-1">
                      <Label className="text-xs">Link (ixtiyoriy)</Label>
                      <Input placeholder="https://..." value={adLink} onChange={(e) => setAdLink(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Deadline *</Label>
                      <Input type="datetime-local" value={adDeadline} onChange={(e) => setAdDeadline(e.target.value)} />
                    </div>
                    <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 shrink-0" disabled={addingAd}>
                      {addingAd && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Qo'shish
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
                    return (
                      <Card key={ad._id} className="overflow-hidden">
                        <div className="h-40 overflow-hidden">
                          <img src={ad.imageUrl} alt="Ad banner" className="w-full h-full object-cover" />
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