import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { eventsApi, ordersApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Calendar,
  MapPin,
  Globe,
  Users,
  Ticket,
  Minus,
  Plus,
  Loader2,
  ExternalLink,
  ArrowLeft,
} from "lucide-react";

interface EventData {
  _id: string;
  title: string;
  category: string;
  region: string;
  venueName: string;
  address: string;
  lat: number | null;
  lng: number | null;
  mapUrl: string;
  dateTime: string;
  language: string;
  ageLimit: number;
  isFree: boolean;
  description: string;
  posterUrl: string;
}

interface Zone {
  _id: string;
  name: string;
  price: number;
  quantityTotal: number;
  quantitySold: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  concert: "Konsert",
  event: "Tadbir",
  sport: "Sport",
  culture: "Madaniy",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("uz-UZ", { day: "numeric", month: "long", year: "numeric" });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" });
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("uz-UZ").format(price) + " so'm";
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState<EventData | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    eventsApi
      .get(id)
      .then((res) => {
        setEvent(res.data.event);
        setZones(res.data.zones || []);
      })
      .catch(() => toast.error("Event topilmadi"))
      .finally(() => setLoading(false));
  }, [id]);

  const updateQty = (zoneId: string, delta: number) => {
    setQuantities((prev) => {
      const zone = zones.find((z) => z._id === zoneId);
      if (!zone) return prev;
      const remaining = Math.max(0, zone.quantityTotal - zone.quantitySold);
      const current = prev[zoneId] || 0;
      const next = Math.max(0, Math.min(remaining, current + delta));
      return { ...prev, [zoneId]: next };
    });
  };

  const selectedItems = zones
    .filter((z) => (quantities[z._id] || 0) > 0)
    .map((z) => ({ zone: z, qty: quantities[z._id] }));

  const totalAmount = selectedItems.reduce((sum, item) => sum + item.zone.price * item.qty, 0);

  const handleCheckout = () => {
    if (!user) {
      toast.error("Avval tizimga kiring");
      navigate("/login");
      return;
    }
    if (selectedItems.length === 0) {
      toast.error("Kamida bitta chipta tanlang");
      return;
    }
    setCheckoutOpen(true);
  };

  const handlePay = async () => {
    if (!event) return;
    setPaying(true);
    try {
      const orderRes = await ordersApi.create({
        eventId: event._id,
        items: selectedItems.map((item) => ({ zoneId: item.zone._id, qty: item.qty })),
      });
      const orderId = orderRes.data.order._id;

      // Mock payment
      await ordersApi.mockPayment({ orderId, status: "paid" });

      toast.success("Chipta muvaffaqiyatli sotib olindi!");
      setCheckoutOpen(false);
      setQuantities({});
      navigate("/my-tickets");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || "Xarid xatosi");
    } finally {
      setPaying(false);
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

  if (!event) {
    return (
      <Layout>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold text-slate-600">Event topilmadi</h2>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/")}>
            Bosh sahifaga qaytish
          </Button>
        </div>
      </Layout>
    );
  }

  const mapLink = event.mapUrl || (event.lat && event.lng ? `https://www.google.com/maps?q=${event.lat},${event.lng}` : "");

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Back button */}
        <Button variant="ghost" className="mb-4 text-slate-600" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Orqaga
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Event info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Poster */}
            <div className="rounded-xl overflow-hidden shadow-lg">
              {event.posterUrl ? (
                <img src={event.posterUrl} alt={event.title} className="w-full h-64 md:h-96 object-cover" />
              ) : (
                <div className="w-full h-64 md:h-96 bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                  <Ticket className="h-20 w-20 text-white/40" />
                </div>
              )}
            </div>

            {/* Info */}
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge className="bg-indigo-100 text-indigo-700">{CATEGORY_LABELS[event.category] || event.category}</Badge>
                {event.isFree ? (
                  <Badge className="bg-emerald-100 text-emerald-700">Bepul</Badge>
                ) : (
                  <Badge className="bg-amber-100 text-amber-700">Pullik</Badge>
                )}
                {event.ageLimit > 0 && <Badge variant="outline">{event.ageLimit}+</Badge>}
              </div>
              <h1 className="text-3xl font-bold text-slate-900 mb-4">{event.title}</h1>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-3 text-slate-600">
                  <Calendar className="h-5 w-5 text-indigo-500" />
                  <div>
                    <p className="font-medium">{formatDate(event.dateTime)}</p>
                    <p className="text-sm text-slate-400">{formatTime(event.dateTime)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <MapPin className="h-5 w-5 text-indigo-500" />
                  <div>
                    <p className="font-medium">{event.venueName}</p>
                    <p className="text-sm text-slate-400">{event.address}, {event.region}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <Globe className="h-5 w-5 text-indigo-500" />
                  <span>Til: {event.language === "uz" ? "O'zbek" : event.language === "ru" ? "Rus" : event.language}</span>
                </div>
                {event.ageLimit > 0 && (
                  <div className="flex items-center gap-3 text-slate-600">
                    <Users className="h-5 w-5 text-indigo-500" />
                    <span>Yosh chegarasi: {event.ageLimit}+</span>
                  </div>
                )}
              </div>

              {mapLink && (
                <a
                  href={mapLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-6"
                >
                  <MapPin className="h-4 w-4" /> Xaritada ko'rish <ExternalLink className="h-3 w-3" />
                </a>
              )}

              <Separator className="my-6" />

              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-3">Tadbir haqida</h2>
                <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">
                  {event.description || "Tavsif mavjud emas."}
                </p>
              </div>
            </div>
          </div>

          {/* Right: Ticket zones */}
          <div className="space-y-4">
            {!event.isFree && zones.length > 0 && (
              <Card className="shadow-lg sticky top-24">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Ticket className="h-5 w-5 text-indigo-500" />
                    Chipta tanlash
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {zones.map((zone) => {
                    const remaining = Math.max(0, zone.quantityTotal - zone.quantitySold);
                    const qty = quantities[zone._id] || 0;
                    return (
                      <div key={zone._id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold text-slate-900">{zone.name}</h4>
                            <p className="text-lg font-bold text-indigo-600">{formatPrice(zone.price)}</p>
                          </div>
                          <Badge variant={remaining > 0 ? "outline" : "destructive"} className="text-xs">
                            {remaining > 0 ? `${remaining} ta qoldi` : "Tugadi"}
                          </Badge>
                        </div>
                        {remaining > 0 && (
                          <div className="flex items-center gap-3 mt-3">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQty(zone._id, -1)}
                              disabled={qty <= 0}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="font-semibold text-lg w-8 text-center">{qty}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQty(zone._id, 1)}
                              disabled={qty >= remaining}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <Separator />

                  <div className="flex justify-between items-center">
                    <span className="font-medium text-slate-600">Jami:</span>
                    <span className="text-xl font-bold text-indigo-600">{formatPrice(totalAmount)}</span>
                  </div>

                  <Button
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-lg py-6"
                    disabled={selectedItems.length === 0}
                    onClick={handleCheckout}
                  >
                    Sotib olish
                  </Button>
                </CardContent>
              </Card>
            )}

            {event.isFree && (
              <Card className="shadow-lg">
                <CardContent className="p-6 text-center">
                  <Badge className="bg-emerald-100 text-emerald-700 text-lg px-4 py-2 mb-3">Bepul tadbir</Badge>
                  <p className="text-slate-500">Bu tadbir bepul. Chipta sotib olish shart emas.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Checkout Dialog */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Buyurtmani tasdiqlash</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="font-medium text-slate-900">{event.title}</p>
            <Separator />
            {selectedItems.map((item) => (
              <div key={item.zone._id} className="flex justify-between text-sm">
                <span>{item.zone.name} × {item.qty}</span>
                <span className="font-medium">{formatPrice(item.zone.price * item.qty)}</span>
              </div>
            ))}
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Jami:</span>
              <span className="text-indigo-600">{formatPrice(totalAmount)}</span>
            </div>
            <p className="text-xs text-slate-400">* MVP: Mock to'lov tizimi ishlatiladi</p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCheckoutOpen(false)}>Bekor qilish</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handlePay} disabled={paying}>
              {paying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              To'lash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}