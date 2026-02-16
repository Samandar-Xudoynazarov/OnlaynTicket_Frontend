import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { organizerApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Plus,
  Loader2,
  Calendar,
  Ticket,
  DollarSign,
  BarChart3,
  Trash2,
} from "lucide-react";

interface OrgEvent {
  _id: string;
  title: string;
  category: string;
  region: string;
  venueName: string;
  dateTime: string;
  isFree: boolean;
  status: string;
  posterUrl: string;
  rejectReason: string;
  createdAt: string;
}

interface EventStats {
  eventId: string;
  totalTickets: number;
  soldTickets: number;
  remainingTickets: number;
  revenue: number;
}

interface ZoneInput {
  name: string;
  price: string;
  quantityTotal: string;
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Qoralama",
  pending: "Kutilmoqda",
  approved: "Tasdiqlangan",
  rejected: "Rad etilgan",
  cancelled: "Bekor qilingan",
  ended: "Tugagan",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600",
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
  cancelled: "bg-slate-100 text-slate-600",
  ended: "bg-slate-100 text-slate-600",
};

const REGIONS = [
  "Toshkent", "Samarqand", "Buxoro", "Xorazm", "Navoiy",
  "Andijon", "Farg'ona", "Namangan", "Qashqadaryo", "Surxondaryo",
  "Jizzax", "Sirdaryo", "Qoraqalpog'iston",
];

function formatPrice(price: number) {
  return new Intl.NumberFormat("uz-UZ").format(price) + " so'm";
}

export default function OrganizerPanelPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<OrgEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("events");
  const [creating, setCreating] = useState(false);

  // Stats dialog
  const [statsOpen, setStatsOpen] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [stats, setStats] = useState<EventStats | null>(null);
  const [statsEvent, setStatsEvent] = useState<OrgEvent | null>(null);

  // Create form
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("concert");
  const [region, setRegion] = useState("Toshkent");
  const [venueName, setVenueName] = useState("");
  const [address, setAddress] = useState("");
  const [mapUrl, setMapUrl] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [language, setLanguage] = useState("uz");
  const [ageLimit, setAgeLimit] = useState("0");
  const [isFree, setIsFree] = useState(false);
  const [description, setDescription] = useState("");
  const [poster, setPoster] = useState<File | null>(null);
  const [zones, setZones] = useState<ZoneInput[]>([{ name: "", price: "", quantityTotal: "" }]);

  useEffect(() => {
    if (!user || (user.role !== "organizer" && user.role !== "admin")) {
      navigate("/");
      return;
    }
    loadEvents();
  }, [user, navigate]);

  const loadEvents = () => {
    setLoading(true);
    organizerApi.myEvents()
      .then((res) => setEvents(res.data.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const openStats = async (event: OrgEvent) => {
    setStatsEvent(event);
    setStatsOpen(true);
    setStatsLoading(true);
    try {
      const res = await organizerApi.getStats(event._id);
      setStats(res.data);
    } catch {
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  };

  const addZone = () => setZones([...zones, { name: "", price: "", quantityTotal: "" }]);
  const removeZone = (i: number) => setZones(zones.filter((_, idx) => idx !== i));
  const updateZone = (i: number, field: keyof ZoneInput, value: string) => {
    const updated = [...zones];
    updated[i] = { ...updated[i], [field]: value };
    setZones(updated);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !venueName || !address || !dateTime) {
      toast.error("Barcha majburiy maydonlarni to'ldiring");
      return;
    }
    if (!isFree) {
      const validZones = zones.filter((z) => z.name && z.price && z.quantityTotal);
      if (validZones.length === 0) {
        toast.error("Pullik event uchun kamida bitta zona kerak");
        return;
      }
    }

    setCreating(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("category", category);
      formData.append("region", region);
      formData.append("venueName", venueName);
      formData.append("address", address);
      formData.append("mapUrl", mapUrl);
      formData.append("dateTime", dateTime);
      formData.append("language", language);
      formData.append("ageLimit", ageLimit);
      formData.append("isFree", String(isFree));
      formData.append("description", description);
      if (poster) formData.append("poster", poster);
      if (!isFree) {
        const validZones = zones
          .filter((z) => z.name && z.price && z.quantityTotal)
          .map((z) => ({ name: z.name, price: Number(z.price), quantityTotal: Number(z.quantityTotal) }));
        formData.append("zones", JSON.stringify(validZones));
      }

      await organizerApi.createEvent(formData);
      toast.success("Event yaratildi! Admin tasdiqlashini kuting.");
      setTab("events");
      loadEvents();
      // Reset form
      setTitle(""); setVenueName(""); setAddress(""); setMapUrl(""); setDateTime("");
      setDescription(""); setPoster(null); setZones([{ name: "", price: "", quantityTotal: "" }]);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || "Event yaratish xatosi");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">Organizer Panel</h1>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="events">Mening eventlarim</TabsTrigger>
            <TabsTrigger value="create">Yangi event yaratish</TabsTrigger>
          </TabsList>

          {/* Events list */}
          <TabsContent value="events">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-16">
                <Calendar className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-600 mb-2">Eventlar topilmadi</h3>
                <Button className="bg-indigo-600 hover:bg-indigo-700 mt-2" onClick={() => setTab("create")}>
                  <Plus className="mr-2 h-4 w-4" /> Yangi event yaratish
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {events.map((ev) => (
                  <Card key={ev._id} className="hover:shadow-lg transition-shadow">
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
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-slate-900 truncate">{ev.title}</h3>
                            <Badge className={`${STATUS_COLORS[ev.status] || "bg-slate-100"} text-xs shrink-0`}>
                              {STATUS_LABELS[ev.status] || ev.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-500">{ev.venueName} • {ev.region}</p>
                          <p className="text-sm text-slate-400">
                            {new Date(ev.dateTime).toLocaleDateString("uz-UZ")}
                          </p>
                          {ev.status === "rejected" && ev.rejectReason && (
                            <p className="text-sm text-red-500 mt-1">Sabab: {ev.rejectReason}</p>
                          )}
                        </div>
                        <div className="shrink-0">
                          <Button variant="outline" size="sm" onClick={() => openStats(ev)}>
                            <BarChart3 className="mr-2 h-4 w-4" /> Statistika
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Create event */}
          <TabsContent value="create">
            <Card>
              <CardHeader>
                <CardTitle>Yangi event yaratish</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreate} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nomi *</Label>
                      <Input placeholder="Event nomi" value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Kategoriya *</Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="concert">Konsert</SelectItem>
                          <SelectItem value="event">Tadbir</SelectItem>
                          <SelectItem value="sport">Sport</SelectItem>
                          <SelectItem value="culture">Madaniy</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Viloyat *</Label>
                      <Select value={region} onValueChange={setRegion}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {REGIONS.map((r) => (
                            <SelectItem key={r} value={r}>{r}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Joy nomi *</Label>
                      <Input placeholder="Konsert zali nomi" value={venueName} onChange={(e) => setVenueName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Manzil *</Label>
                      <Input placeholder="To'liq manzil" value={address} onChange={(e) => setAddress(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Xarita link</Label>
                      <Input placeholder="Google Maps link" value={mapUrl} onChange={(e) => setMapUrl(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Sana va vaqt *</Label>
                      <Input type="datetime-local" value={dateTime} onChange={(e) => setDateTime(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Til</Label>
                      <Select value={language} onValueChange={setLanguage}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="uz">O'zbek</SelectItem>
                          <SelectItem value="ru">Rus</SelectItem>
                          <SelectItem value="en">Ingliz</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Yosh chegarasi</Label>
                      <Input type="number" min="0" value={ageLimit} onChange={(e) => setAgeLimit(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Poster rasmi</Label>
                      <Input type="file" accept="image/*" onChange={(e) => setPoster(e.target.files?.[0] || null)} />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Switch checked={isFree} onCheckedChange={setIsFree} />
                    <Label>Bepul tadbir</Label>
                  </div>

                  <div className="space-y-2">
                    <Label>Tavsif</Label>
                    <Textarea placeholder="Event haqida batafsil..." value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
                  </div>

                  {/* Zones */}
                  {!isFree && (
                    <div className="space-y-4">
                      <Separator />
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-slate-900">Chipta zonalari</h3>
                        <Button type="button" variant="outline" size="sm" onClick={addZone}>
                          <Plus className="mr-1 h-3 w-3" /> Zona qo'shish
                        </Button>
                      </div>
                      {zones.map((zone, i) => (
                        <div key={i} className="grid grid-cols-4 gap-3 items-end">
                          <div className="space-y-1">
                            <Label className="text-xs">Zona nomi</Label>
                            <Input placeholder="VIP" value={zone.name} onChange={(e) => updateZone(i, "name", e.target.value)} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Narx (so'm)</Label>
                            <Input type="number" min="0" placeholder="100000" value={zone.price} onChange={(e) => updateZone(i, "price", e.target.value)} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Soni</Label>
                            <Input type="number" min="0" placeholder="100" value={zone.quantityTotal} onChange={(e) => updateZone(i, "quantityTotal", e.target.value)} />
                          </div>
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeZone(i)} disabled={zones.length <= 1} className="text-red-500">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={creating}>
                    {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Event yaratish (Admin tasdiqlashi kerak)
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Stats Dialog */}
      <Dialog open={statsOpen} onOpenChange={setStatsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Event statistikasi</DialogTitle>
          </DialogHeader>
          {statsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          ) : stats && statsEvent ? (
            <div className="space-y-4">
              <h3 className="font-semibold">{statsEvent.title}</h3>
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <Ticket className="h-6 w-6 text-indigo-500 mx-auto mb-1" />
                    <p className="text-2xl font-bold">{stats.totalTickets}</p>
                    <p className="text-xs text-slate-400">Jami chipta</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Ticket className="h-6 w-6 text-emerald-500 mx-auto mb-1" />
                    <p className="text-2xl font-bold">{stats.soldTickets}</p>
                    <p className="text-xs text-slate-400">Sotilgan</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Ticket className="h-6 w-6 text-amber-500 mx-auto mb-1" />
                    <p className="text-2xl font-bold">{stats.remainingTickets}</p>
                    <p className="text-xs text-slate-400">Qolgan</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <DollarSign className="h-6 w-6 text-green-500 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-sm">{formatPrice(stats.revenue)}</p>
                    <p className="text-xs text-slate-400">Daromad</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <p className="text-center text-slate-500 py-4">Ma'lumot topilmadi</p>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}