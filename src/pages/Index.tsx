import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { eventsApi, adsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Calendar, MapPin, ChevronLeft, ChevronRight, Ticket, CalendarDays } from "lucide-react";
import { useTranslation } from "react-i18next";

function getDateRange(filter: string): { dateFrom?: string; dateTo?: string } {
  const now = new Date();
  if (filter === "today") {
    const start = new Date(now); start.setHours(0, 0, 0, 0);
    const end = new Date(now); end.setHours(23, 59, 59, 999);
    return { dateFrom: start.toISOString(), dateTo: end.toISOString() };
  }
  if (filter === "week") {
    const start = new Date(now); start.setHours(0, 0, 0, 0);
    const end = new Date(now); end.setDate(end.getDate() + 7); end.setHours(23, 59, 59, 999);
    return { dateFrom: start.toISOString(), dateTo: end.toISOString() };
  }
  if (filter === "month") {
    const start = new Date(now); start.setHours(0, 0, 0, 0);
    const end = new Date(now); end.setMonth(end.getMonth() + 1); end.setHours(23, 59, 59, 999);
    return { dateFrom: start.toISOString(), dateTo: end.toISOString() };
  }
  return {};
}

const HERO_BANNERS = [
  {
    image: "https://mgx-backend-cdn.metadl.com/generate/images/974027/2026-02-16/68414f5a-2ae0-4a80-bb4d-646cc2102aeb.png",
    title: "Eng yaxshi konsertlar",
    subtitle: "Sevimli san'atkorlaringiz bilan yaqindan uchrashing",
  },
  {
    image: "https://mgx-backend-cdn.metadl.com/generate/images/974027/2026-02-16/91c39d43-e4f1-400e-8f9a-11fa2873fb81.png",
    title: "Sport tadbirlari",
    subtitle: "Stadionlardagi eng qiziqarli o'yinlar",
  },
  {
    image: "https://mgx-backend-cdn.metadl.com/generate/images/974027/2026-02-16/e2a14332-5681-4fda-8bf1-372b548c2c47.png",
    title: "Madaniy tadbirlar",
    subtitle: "An'anaviy va zamonaviy san'at namoyishlari",
  },
  {
    image: "https://mgx-backend-cdn.metadl.com/generate/images/974027/2026-02-16/6896c531-7b2a-4aa8-bce9-e4c48648675a.png",
    title: "Sport musobaqalari",
    subtitle: "Eng kuchli jamoalar bellashuvi",
  },
];

interface EventItem {
  _id: string;
  title: string;
  category: string;
  region: string;
  venueName: string;
  dateTime: string;
  isFree: boolean;
  posterUrl: string;
  description: string;
}

interface AdBanner {
  _id: string;
  mediaType: "image" | "video";
  imageUrl: string;
  link: string;
  deadline: string;
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

function formatDate(dateStr: string, lang = "uz") {
  const locale = lang === "ru" ? "ru-RU" : lang === "en" ? "en-US" : "uz-UZ";
  return new Date(dateStr).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" });
}

export default function HomePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [ads, setAds] = useState<AdBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [freeFilter, setFreeFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const { t, i18n } = useTranslation();
  const category = searchParams.get("category") || "";
  const region = searchParams.get("region") || "";

  const DATE_FILTERS = [
    { label: t("index.all"), value: "all" },
    { label: t("index.today"), value: "today" },
    { label: t("index.thisWeek"), value: "week" },
    { label: t("index.thisMonth"), value: "month" },
  ];

  // Load ads
  useEffect(() => {
    adsApi.listPublic().then((res) => setAds(res.data.items || [])).catch(() => {});
  }, []);

  // Load events
  useEffect(() => {
    setLoading(true);
    const params: Record<string, string | number> = { page, limit: 12 };
    if (category) params.category = category;
    if (region) params.region = region;
    if (freeFilter === "free") params.isFree = "true";
    if (freeFilter === "paid") params.isFree = "false";
    if (search.trim()) params.q = search.trim();
    const dateRange = getDateRange(dateFilter);
    if (dateRange.dateFrom) params.dateFrom = dateRange.dateFrom;
    if (dateRange.dateTo) params.dateTo = dateRange.dateTo;

    eventsApi.list(params as Parameters<typeof eventsApi.list>[0])
      .then((res) => {
        setEvents(res.data.items || []);
        setTotal(res.data.total || 0);
      })
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [category, region, freeFilter, dateFilter, search, page]);

  // Auto-slide banners
  const allBanners = ads.length > 0
    ? ads.map((ad) => ({
        image: ad.mediaType === "video" ? "" : ad.imageUrl,
        video: ad.mediaType === "video" ? ad.imageUrl : "",
        title: "", subtitle: "", link: ad.link,
      }))
    : HERO_BANNERS;

  useEffect(() => {
    if (allBanners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % allBanners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [allBanners.length]);

  const totalPages = Math.ceil(total / 12);

  return (
    <Layout>
      {/* Hero Banner Slider */}
      <section className="relative h-[400px] md:h-[500px] overflow-hidden">
        {allBanners.map((banner, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-700 ${i === currentSlide ? "opacity-100" : "opacity-0"}`}
          >
            {(banner as { video?: string }).video ? (
              <video
                src={(banner as { video?: string }).video}
                className="w-full h-full object-cover"
                autoPlay
                muted
                loop
                playsInline
              />
            ) : (
              <img
                src={banner.image}
                alt={banner.title || "Banner"}
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            {banner.title && (
              <div className="absolute bottom-16 left-0 right-0 text-center text-white px-4">
                <h2 className="text-3xl md:text-5xl font-bold mb-2 drop-shadow-lg">{banner.title}</h2>
                <p className="text-lg md:text-xl text-slate-200 drop-shadow">{banner.subtitle}</p>
              </div>
            )}
          </div>
        ))}
        {/* Slider controls */}
        {allBanners.length > 1 && (
          <>
            <button
              onClick={() => setCurrentSlide((prev) => (prev - 1 + allBanners.length) % allBanners.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 transition-colors"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={() => setCurrentSlide((prev) => (prev + 1) % allBanners.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 transition-colors"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {allBanners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`w-3 h-3 rounded-full transition-colors ${i === currentSlide ? "bg-white" : "bg-white/40"}`}
                />
              ))}
            </div>
          </>
        )}
      </section>

      {/* Filters & Search */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
              {category ? CATEGORY_LABELS[category] || "Eventlar" : "Barcha eventlar"}
              {region ? ` — ${region}` : ""}
            </h1>
            <p className="text-slate-500 mt-1">{total} ta event topildi</p>
          </div>
          <div className="flex flex-col gap-3 w-full md:w-auto">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder={t("index.searchPlaceholder")}
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="pl-10"
                />
              </div>
              <Tabs value={freeFilter} onValueChange={(v) => { setFreeFilter(v); setPage(1); }}>
                <TabsList>
                  <TabsTrigger value="all">{t("index.all")}</TabsTrigger>
                  <TabsTrigger value="paid">Pullik</TabsTrigger>
                  <TabsTrigger value="free">{t("index.free")}</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            {/* Sana filtri */}
            <div className="flex items-center gap-2 flex-wrap">
              <CalendarDays className="h-4 w-4 text-slate-400 shrink-0" />
              {DATE_FILTERS.map((df) => (
                <button
                  key={df.value}
                  onClick={() => { setDateFilter(df.value); setPage(1); }}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-all border ${
                    dateFilter === df.value
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
                  }`}
                >
                  {df.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="overflow-hidden animate-pulse">
                <div className="h-48 bg-slate-200" />
                <CardContent className="p-4 space-y-3">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                  <div className="h-3 bg-slate-200 rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20">
            <Ticket className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-600 mb-2">{t("index.noEvents")}</h3>
            <p className="text-slate-400">{t("index.noEventsDesc")}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {events.map((event) => (
                <Card
                  key={event._id}
                  className="overflow-hidden cursor-pointer group hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  onClick={() => navigate(`/events/${event._id}`)}
                >
                  <div className="relative h-48 overflow-hidden">
                    {event.posterUrl ? (
                      <img
                        src={event.posterUrl}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                        <Ticket className="h-12 w-12 text-white/60" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3 flex gap-2">
                      <Badge className={`${CATEGORY_COLORS[event.category] || "bg-slate-100 text-slate-700"} text-xs`}>
                        {CATEGORY_LABELS[event.category] || event.category}
                      </Badge>
                      {event.isFree && (
                        <Badge className="bg-emerald-100 text-emerald-700 text-xs">{t("common.free")}</Badge>
                      )}
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                      {event.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-sm text-slate-500 mb-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{formatDate(event.dateTime, i18n.language)} • {formatTime(event.dateTime)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-slate-500 mb-3">
                      <MapPin className="h-3.5 w-3.5" />
                      <span className="line-clamp-1">{event.venueName}, {event.region}</span>
                    </div>
                    <Button size="sm" className="w-full bg-indigo-600 hover:bg-indigo-700">
                      Batafsil
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const p = i + 1;
                  return (
                    <Button
                      key={p}
                      variant={p === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPage(p)}
                      className={p === page ? "bg-indigo-600" : ""}
                    >
                      {p}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </Layout>
  );
}