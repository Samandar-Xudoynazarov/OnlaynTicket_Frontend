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
  DialogFooter,
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
  MapPin,
  TrendingUp,
  Pencil,
  AlertCircle,
  Send,
} from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface OrgEvent {
  _id: string;
  title: string;
  category: string;
  region: string;
  venueName: string;
  address: string;
  mapUrl: string;
  lat: number | null;
  lng: number | null;
  dateTime: string;
  language: string;
  ageLimit: number;
  isFree: boolean;
  description: string;
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

function toDatetimeLocal(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Reusable event form fields
function EventFormFields({
  title, setTitle,
  category, setCategory,
  region, setRegion,
  venueName, setVenueName,
  address, setAddress,
  lat, setLat,
  lng, setLng,
  mapUrl, setMapUrl,
  dateTime, setDateTime,
  language, setLanguage,
  ageLimit, setAgeLimit,
  isFree, setIsFree,
  description, setDescription,
  poster, setPoster,
  zones, addZone, removeZone, updateZone,
}: {
  title: string; setTitle: (v: string) => void;
  category: string; setCategory: (v: string) => void;
  region: string; setRegion: (v: string) => void;
  venueName: string; setVenueName: (v: string) => void;
  address: string; setAddress: (v: string) => void;
  lat: string; setLat: (v: string) => void;
  lng: string; setLng: (v: string) => void;
  mapUrl: string; setMapUrl: (v: string) => void;
  dateTime: string; setDateTime: (v: string) => void;
  language: string; setLanguage: (v: string) => void;
  ageLimit: string; setAgeLimit: (v: string) => void;
  isFree: boolean; setIsFree: (v: boolean) => void;
  description: string; setDescription: (v: string) => void;
  poster: File | null; setPoster: (v: File | null) => void;
  zones: ZoneInput[];
  addZone: () => void;
  removeZone: (i: number) => void;
  updateZone: (i: number, field: keyof ZoneInput, value: string) => void;
}) {
  return (
    <div className="space-y-6">
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
          <Label className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-indigo-500" />
            Xarita koordinatalari
          </Label>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Kenglik: 41.299" value={lat} onChange={(e) => setLat(e.target.value)} />
            <Input placeholder="Uzunlik: 69.240" value={lng} onChange={(e) => setLng(e.target.value)} />
          </div>
          <p className="text-xs text-slate-400">Google Maps → joy ustiga o'ng tugma → koordinatlarni nusxalang</p>
        </div>
        <div className="space-y-2">
          <Label>Yoki Google Maps linki</Label>
          <Input placeholder="https://maps.google.com/..." value={mapUrl} onChange={(e) => setMapUrl(e.target.value)} />
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
          {poster && <p className="text-xs text-emerald-600">✓ {poster.name}</p>}
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
    </div>
  );
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

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<OrgEvent | null>(null);
  const [updating, setUpdating] = useState(false);

  // Shared form state (create & edit)
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("concert");
  const [region, setRegion] = useState("Toshkent");
  const [venueName, setVenueName] = useState("");
  const [address, setAddress] = useState("");
  const [mapUrl, setMapUrl] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [language, setLanguage] = useState("uz");
  const [ageLimit, setAgeLimit] = useState("0");
  const [isFree, setIsFree] = useState(false);
  const [description, setDescription] = useState("");
  const [poster, setPoster] = useState<File | null>(null);
  const [zones, setZones] = useState<ZoneInput[]>([{ name: "", price: "", quantityTotal: "" }]);

  // Edit-specific form state
  const [eTitle, setETitle] = useState("");
  const [eCategory, setECategory] = useState("concert");
  const [eRegion, setERegion] = useState("Toshkent");
  const [eVenueName, setEVenueName] = useState("");
  const [eAddress, setEAddress] = useState("");
  const [eMapUrl, setEMapUrl] = useState("");
  const [eLat, setELat] = useState("");
  const [eLng, setELng] = useState("");
  const [eDateTime, setEDateTime] = useState("");
  const [eLanguage, setELanguage] = useState("uz");
  const [eAgeLimit, setEAgeLimit] = useState("0");
  const [eIsFree, setEIsFree] = useState(false);
  const [eDescription, setEDescription] = useState("");
  const [ePoster, setEPoster] = useState<File | null>(null);
  const [eZones, setEZones] = useState<ZoneInput[]>([{ name: "", price: "", quantityTotal: "" }]);

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

  const openEdit = async (ev: OrgEvent) => {
    setEditingEvent(ev);
    setETitle(ev.title);
    setECategory(ev.category);
    setERegion(ev.region);
    setEVenueName(ev.venueName);
    setEAddress(ev.address || "");
    setEMapUrl(ev.mapUrl || "");
    setELat(ev.lat ? String(ev.lat) : "");
    setELng(ev.lng ? String(ev.lng) : "");
    setEDateTime(toDatetimeLocal(ev.dateTime));
    setELanguage(ev.language || "uz");
    setEAgeLimit(String(ev.ageLimit || 0));
    setEIsFree(ev.isFree);
    setEDescription(ev.description || "");
    setEPoster(null);
    setEZones([{ name: "", price: "", quantityTotal: "" }]);
    setEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;
    if (!eTitle || !eVenueName || !eAddress || !eDateTime) {
      toast.error("Barcha majburiy maydonlarni to'ldiring");
      return;
    }

    setUpdating(true);
    try {
      const formData = new FormData();
      formData.append("title", eTitle);
      formData.append("category", eCategory);
      formData.append("region", eRegion);
      formData.append("venueName", eVenueName);
      formData.append("address", eAddress);
      formData.append("mapUrl", eMapUrl);
      if (eLat) formData.append("lat", eLat);
      if (eLng) formData.append("lng", eLng);
      formData.append("dateTime", eDateTime);
      formData.append("language", eLanguage);
      formData.append("ageLimit", eAgeLimit);
      formData.append("isFree", String(eIsFree));
      formData.append("description", eDescription);
      if (ePoster) formData.append("poster", ePoster);

      const validZones = eZones.filter((z) => z.name && z.price && z.quantityTotal);
      if (!eIsFree && validZones.length > 0) {
        formData.append("zones", JSON.stringify(
          validZones.map((z) => ({ name: z.name, price: Number(z.price), quantityTotal: Number(z.quantityTotal) }))
        ));
      }

      await organizerApi.updateEvent(editingEvent._id, formData);
      toast.success("Event yangilandi! Admin qayta ko'rib chiqadi.");
      setEditOpen(false);
      loadEvents();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || "Yangilash xatosi");
    } finally {
      setUpdating(false);
    }
  };

  // Create form helpers
  const addZone = () => setZones([...zones, { name: "", price: "", quantityTotal: "" }]);
  const removeZone = (i: number) => setZones(zones.filter((_, idx) => idx !== i));
  const updateZone = (i: number, field: keyof ZoneInput, value: string) => {
    const updated = [...zones];
    updated[i] = { ...updated[i], [field]: value };
    setZones(updated);
  };

  // Edit form helpers
  const eAddZone = () => setEZones([...eZones, { name: "", price: "", quantityTotal: "" }]);
  const eRemoveZone = (i: number) => setEZones(eZones.filter((_, idx) => idx !== i));
  const eUpdateZone = (i: number, field: keyof ZoneInput, value: string) => {
    const updated = [...eZones];
    updated[i] = { ...updated[i], [field]: value };
    setEZones(updated);
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
      if (lat) formData.append("lat", lat);
      if (lng) formData.append("lng", lng);
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
      setTitle(""); setVenueName(""); setAddress(""); setMapUrl(""); setLat(""); setLng(""); setDateTime("");
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
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
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
                            <div className="flex items-start gap-1.5 mt-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                              <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                              <p className="text-sm text-red-600">Rad etish sababi: {ev.rejectReason}</p>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-2 shrink-0">
                          {(ev.status === "pending" || ev.status === "rejected") && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEdit(ev)}
                              className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                            >
                              <Pencil className="mr-2 h-4 w-4" /> Tahrirlash
                            </Button>
                          )}
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
                  <EventFormFields
                    title={title} setTitle={setTitle}
                    category={category} setCategory={setCategory}
                    region={region} setRegion={setRegion}
                    venueName={venueName} setVenueName={setVenueName}
                    address={address} setAddress={setAddress}
                    lat={lat} setLat={setLat}
                    lng={lng} setLng={setLng}
                    mapUrl={mapUrl} setMapUrl={setMapUrl}
                    dateTime={dateTime} setDateTime={setDateTime}
                    language={language} setLanguage={setLanguage}
                    ageLimit={ageLimit} setAgeLimit={setAgeLimit}
                    isFree={isFree} setIsFree={setIsFree}
                    description={description} setDescription={setDescription}
                    poster={poster} setPoster={setPoster}
                    zones={zones} addZone={addZone} removeZone={removeZone} updateZone={updateZone}
                  />
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

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-indigo-500" />
              Eventni tahrirlash
            </DialogTitle>
          </DialogHeader>

          {editingEvent?.status === "rejected" && editingEvent.rejectReason && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-4">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-700 text-sm">Rad etilgan sabab:</p>
                <p className="text-red-600 text-sm mt-0.5">{editingEvent.rejectReason}</p>
                <p className="text-slate-500 text-xs mt-2">
                  Quyidagi ma'lumotlarni to'g'irlab, qayta yuboring — admin qayta ko'rib chiqadi.
                </p>
              </div>
            </div>
          )}

          {editingEvent?.status === "pending" && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-amber-700 text-sm">
                Bu event hali admin tomonidan ko'rib chiqilmagan. Tahrirlasangiz, qayta ko'rib chiqishga yuboriladi.
              </p>
            </div>
          )}

          <form onSubmit={handleUpdate} className="space-y-4">
            <EventFormFields
              title={eTitle} setTitle={setETitle}
              category={eCategory} setCategory={setECategory}
              region={eRegion} setRegion={setERegion}
              venueName={eVenueName} setVenueName={setEVenueName}
              address={eAddress} setAddress={setEAddress}
              lat={eLat} setLat={setELat}
              lng={eLng} setLng={setELng}
              mapUrl={eMapUrl} setMapUrl={setEMapUrl}
              dateTime={eDateTime} setDateTime={setEDateTime}
              language={eLanguage} setLanguage={setELanguage}
              ageLimit={eAgeLimit} setAgeLimit={setEAgeLimit}
              isFree={eIsFree} setIsFree={setEIsFree}
              description={eDescription} setDescription={setEDescription}
              poster={ePoster} setPoster={setEPoster}
              zones={eZones} addZone={eAddZone} removeZone={eRemoveZone} updateZone={eUpdateZone}
            />
            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Bekor qilish
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={updating}>
                {updating
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Yuborilmoqda...</>
                  : <><Send className="mr-2 h-4 w-4" />Saqlash va qayta yuborish</>
                }
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
              <h3 className="font-semibold text-slate-900">{statsEvent.title}</h3>
              {stats.totalTickets > 0 && (
                <div className="flex flex-col items-center">
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Sotilgan", value: stats.soldTickets },
                          { name: "Qolgan", value: stats.remainingTickets },
                        ]}
                        cx="50%" cy="50%"
                        innerRadius={50} outerRadius={80}
                        paddingAngle={3} dataKey="value"
                      >
                        <Cell fill="#6366f1" />
                        <Cell fill="#e2e8f0" />
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} ta`, ""]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-indigo-500" />
                      <span className="text-slate-600">Sotilgan</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-slate-200" />
                      <span className="text-slate-600">Qolgan</span>
                    </div>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-indigo-50 rounded-xl p-4 text-center">
                  <Ticket className="h-5 w-5 text-indigo-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-indigo-700">{stats.totalTickets}</p>
                  <p className="text-xs text-slate-500">Jami chipta</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-4 text-center">
                  <TrendingUp className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-emerald-700">{stats.soldTickets}</p>
                  <p className="text-xs text-slate-500">Sotilgan</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-4 text-center">
                  <Ticket className="h-5 w-5 text-amber-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-amber-700">{stats.remainingTickets}</p>
                  <p className="text-xs text-slate-500">Qolgan</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <DollarSign className="h-5 w-5 text-green-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-green-700">{formatPrice(stats.revenue)}</p>
                  <p className="text-xs text-slate-500">Daromad</p>
                </div>
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
