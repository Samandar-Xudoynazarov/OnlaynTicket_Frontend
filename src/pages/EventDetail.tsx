import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { eventsApi, ordersApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
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
  Clock,
  CreditCard,
  CheckCircle2,
  Timer,
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

const CATEGORY_COLORS: Record<string, string> = {
  concert: "bg-purple-100 text-purple-700",
  event: "bg-blue-100 text-blue-700",
  sport: "bg-green-100 text-green-700",
  culture: "bg-amber-100 text-amber-700",
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

function useCountdown(targetDate: string) {
  const calc = useCallback(() => {
    const diff = new Date(targetDate).getTime() - Date.now();
    if (diff <= 0) return null;
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return { d, h, m, s };
  }, [targetDate]);

  const [countdown, setCountdown] = useState(calc);

  useEffect(() => {
    const timer = setInterval(() => setCountdown(calc()), 1000);
    return () => clearInterval(timer);
  }, [calc]);

  return countdown;
}

function CountdownTimer({ dateTime }: { dateTime: string }) {
  const cd = useCountdown(dateTime);
  if (!cd) return (
    <div className="bg-slate-100 rounded-xl p-4 text-center">
      <p className="text-slate-500 font-medium">Tadbir tugagan</p>
    </div>
  );
  return (
    <div className="bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3 text-indigo-600">
        <Timer className="h-4 w-4" />
        <span className="text-sm font-medium">Tadbirga qolgan vaqt</span>
      </div>
      <div className="grid grid-cols-4 gap-2 text-center">
        {[
          { val: cd.d, label: "Kun" },
          { val: cd.h, label: "Soat" },
          { val: cd.m, label: "Daqiqa" },
          { val: cd.s, label: "Soniya" },
        ].map(({ val, label }) => (
          <div key={label} className="bg-white rounded-lg p-2 shadow-sm border border-indigo-100">
            <p className="text-2xl font-bold text-indigo-700">{String(val).padStart(2, "0")}</p>
            <p className="text-xs text-slate-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function MapEmbed({ lat, lng, mapUrl, address }: { lat: number | null; lng: number | null; mapUrl: string; address: string }) {
  const hasCoords = lat && lng;
  const hasMapUrl = mapUrl && mapUrl.trim().length > 0;

  if (!hasCoords && !hasMapUrl) return null;

  let embedSrc = "";
  if (hasCoords) {
    const delta = 0.008;
    embedSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - delta},${lat - delta},${lng + delta},${lat + delta}&layer=mapnik&marker=${lat},${lng}`;
  }

  const externalLink = hasCoords
    ? `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`
    : mapUrl;

  return (
    <div className="space-y-2">
      <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
        <MapPin className="h-5 w-5 text-indigo-500" />
        Joylashuv
      </h2>
      {hasCoords && (
        <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
          <iframe
            src={embedSrc}
            width="100%"
            height="280"
            style={{ border: 0 }}
            loading="lazy"
            title="Event location map"
          />
        </div>
      )}
      <a
        href={externalLink}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
      >
        <ExternalLink className="h-3.5 w-3.5" />
        {hasCoords ? "Xaritada kattaroq ko'rish" : "Xaritada ko'rish"}
      </a>
      <p className="text-sm text-slate-500">{address}</p>
    </div>
  );
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState<EventData | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [similar, setSimilar] = useState<EventData[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [payStep, setPayStep] = useState<"confirm" | "paying" | "done">("confirm");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    eventsApi
      .get(id)
      .then((res) => {
        const ev = res.data.event;
        setEvent(ev);
        setZones(res.data.zones || []);
        // O'xshash tadbirlarni yuklash
        eventsApi.list({ category: ev.category, limit: 4 })
          .then((r) => setSimilar((r.data.items || []).filter((e: EventData) => e._id !== ev._id).slice(0, 3)))
          .catch(() => {});
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
    setPayStep("confirm");
    setCheckoutOpen(true);
  };

  const handlePay = async () => {
    if (!event) return;
    setPayStep("paying");
    try {
      const orderRes = await ordersApi.create({
        eventId: event._id,
        items: selectedItems.map((item) => ({ zoneId: item.zone._id, qty: item.qty })),
      });
      const orderId = orderRes.data.order._id;
      await ordersApi.mockPayment({ orderId, status: "paid" });
      setPayStep("done");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || "Xarid xatosi");
      setPayStep("confirm");
    }
  };

  const handleDone = () => {
    setCheckoutOpen(false);
    setQuantities({});
    navigate("/my-tickets");
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

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Button variant="ghost" className="mb-4 text-slate-600" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Orqaga
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Event info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Poster */}
            <div className="rounded-2xl overflow-hidden shadow-xl">
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
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge className={CATEGORY_COLORS[event.category] || "bg-slate-100 text-slate-700"}>
                  {CATEGORY_LABELS[event.category] || event.category}
                </Badge>
                {event.isFree ? (
                  <Badge className="bg-emerald-100 text-emerald-700">Bepul</Badge>
                ) : (
                  <Badge className="bg-amber-100 text-amber-700">Pullik</Badge>
                )}
                {event.ageLimit > 0 && <Badge variant="outline">{event.ageLimit}+</Badge>}
              </div>
              <h1 className="text-3xl font-bold text-slate-900 mb-6">{event.title}</h1>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Sana</p>
                    <p className="font-medium text-slate-800">{formatDate(event.dateTime)}</p>
                    <p className="text-sm text-slate-500">{formatTime(event.dateTime)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <MapPin className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Manzil</p>
                    <p className="font-medium text-slate-800">{event.venueName}</p>
                    <p className="text-sm text-slate-500">{event.region}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Globe className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Til</p>
                    <p className="font-medium text-slate-800">
                      {event.language === "uz" ? "O'zbek" : event.language === "ru" ? "Rus" : event.language}
                    </p>
                  </div>
                </div>
                {event.ageLimit > 0 && (
                  <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <Users className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Yosh chegarasi</p>
                      <p className="font-medium text-slate-800">{event.ageLimit}+</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Countdown */}
              <CountdownTimer dateTime={event.dateTime} />

              <Separator className="my-6" />

              {/* Description */}
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-3">Tadbir haqida</h2>
                <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">
                  {event.description || "Tavsif mavjud emas."}
                </p>
              </div>

              <Separator className="my-6" />

              {/* Map */}
              <MapEmbed
                lat={event.lat}
                lng={event.lng}
                mapUrl={event.mapUrl}
                address={`${event.address}, ${event.region}`}
              />

              {/* O'xshash tadbirlar */}
              {similar.length > 0 && (
                <>
                  <Separator className="my-2" />
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900 mb-4">O'xshash tadbirlar</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {similar.map((ev) => (
                        <div
                          key={ev._id}
                          className="cursor-pointer group rounded-xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
                          onClick={() => { navigate(`/events/${ev._id}`); window.scrollTo(0, 0); }}
                        >
                          <div className="h-32 overflow-hidden bg-gradient-to-br from-indigo-400 to-violet-500">
                            {ev.posterUrl
                              ? <img src={ev.posterUrl} alt={ev.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                              : <div className="w-full h-full flex items-center justify-center"><Ticket className="h-8 w-8 text-white/50" /></div>
                            }
                          </div>
                          <div className="p-3">
                            <p className="font-semibold text-slate-800 text-sm line-clamp-2 group-hover:text-indigo-600 transition-colors">{ev.title}</p>
                            <p className="text-xs text-slate-400 mt-1">{new Date(ev.dateTime).toLocaleDateString("uz-UZ")}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
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
                    const soldPct = Math.round((zone.quantitySold / zone.quantityTotal) * 100);
                    const qty = quantities[zone._id] || 0;
                    return (
                      <div key={zone._id} className="border rounded-xl p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-slate-900">{zone.name}</h4>
                            <p className="text-lg font-bold text-indigo-600">{formatPrice(zone.price)}</p>
                          </div>
                          <Badge
                            variant={remaining > 0 ? "outline" : "destructive"}
                            className={`text-xs ${remaining > 0 && remaining <= 10 ? "border-amber-400 text-amber-600" : ""}`}
                          >
                            {remaining === 0 ? "Tugadi" : remaining <= 10 ? `⚡ ${remaining} ta qoldi` : `${remaining} ta`}
                          </Badge>
                        </div>

                        {/* Sold progress bar */}
                        <div className="space-y-1">
                          <Progress value={soldPct} className="h-1.5" />
                          <p className="text-xs text-slate-400">{zone.quantitySold} / {zone.quantityTotal} sotilgan</p>
                        </div>

                        {remaining > 0 && (
                          <div className="flex items-center gap-3">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 rounded-full"
                              onClick={() => updateQty(zone._id, -1)}
                              disabled={qty <= 0}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="font-bold text-lg w-8 text-center">{qty}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 rounded-full"
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
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-base py-6 rounded-xl"
                    disabled={selectedItems.length === 0}
                    onClick={handleCheckout}
                  >
                    <CreditCard className="mr-2 h-5 w-5" />
                    Sotib olish
                  </Button>

                  <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                    <Clock className="h-3 w-3" />
                    <span>Xavfsiz to'lov tizimi</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {event.isFree && (
              <Card className="shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700 text-base px-4 py-1.5 mb-3">Bepul tadbir</Badge>
                  <p className="text-slate-500 text-sm">Bu tadbir bepul. Chipta sotib olish shart emas.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Checkout Dialog */}
      <Dialog open={checkoutOpen} onOpenChange={(open) => {
        if (!open && payStep === "paying") return;
        setCheckoutOpen(open);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {payStep === "confirm" && "Buyurtmani tasdiqlash"}
              {payStep === "paying" && "To'lov amalga oshirilmoqda..."}
              {payStep === "done" && "Muvaffaqiyatli!"}
            </DialogTitle>
          </DialogHeader>

          {payStep === "confirm" && (
            <>
              <div className="space-y-3">
                <p className="font-semibold text-slate-900">{event.title}</p>
                <Separator />
                {selectedItems.map((item) => (
                  <div key={item.zone._id} className="flex justify-between text-sm">
                    <span className="text-slate-600">{item.zone.name} × {item.qty}</span>
                    <span className="font-medium">{formatPrice(item.zone.price * item.qty)}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Jami:</span>
                  <span className="text-indigo-600">{formatPrice(totalAmount)}</span>
                </div>

                {/* Payment method display */}
                <div className="bg-slate-50 rounded-xl p-4 flex items-center gap-3">
                  <CreditCard className="h-8 w-8 text-slate-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-700">To'lov usuli</p>
                    <p className="text-xs text-slate-400">Onlayn to'lov tizimi</p>
                  </div>
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setCheckoutOpen(false)}>Bekor qilish</Button>
                <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handlePay}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  To'lash — {formatPrice(totalAmount)}
                </Button>
              </DialogFooter>
            </>
          )}

          {payStep === "paying" && (
            <div className="py-10 flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-indigo-100 flex items-center justify-center">
                  <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                </div>
              </div>
              <div className="text-center">
                <p className="font-semibold text-slate-800">To'lov amalga oshirilmoqda</p>
                <p className="text-sm text-slate-400 mt-1">Iltimos, kuting...</p>
              </div>
              <div className="w-full space-y-2">
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Buyurtma yaratildi</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin text-indigo-500 shrink-0" />
                  <span>To'lov tekshirilmoqda...</span>
                </div>
              </div>
            </div>
          )}

          {payStep === "done" && (
            <div className="py-8 flex flex-col items-center gap-4 text-center">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-12 w-12 text-emerald-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-900">Chipta sotib olindi!</p>
                <p className="text-slate-500 mt-1">Chiptangizni "Mening chiptalarim" bo'limida ko'rishingiz mumkin.</p>
              </div>
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700" onClick={handleDone}>
                Chiptalarni ko'rish
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
