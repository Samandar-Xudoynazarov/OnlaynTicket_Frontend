import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { myApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Ticket, QrCode, Calendar, MapPin } from "lucide-react";

interface TicketItem {
  _id: string;
  eventId: string;
  zoneName: string;
  qrPayload: string;
  status: string;
  createdAt: string;
}

interface TicketDetail {
  ticket: TicketItem;
  event: {
    _id: string;
    title: string;
    venueName: string;
    address: string;
    region: string;
    dateTime: string;
    posterUrl: string;
    mapUrl: string;
  };
}

const STATUS_LABELS: Record<string, string> = {
  valid: "Amal qiladi",
  used: "Ishlatilgan",
  refunded: "Qaytarilgan",
  cancelled: "Bekor qilingan",
};

const STATUS_COLORS: Record<string, string> = {
  valid: "bg-emerald-100 text-emerald-700",
  used: "bg-slate-100 text-slate-600",
  refunded: "bg-amber-100 text-amber-700",
  cancelled: "bg-red-100 text-red-700",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("uz-UZ", { day: "numeric", month: "long", year: "numeric" });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" });
}

export default function MyTicketsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<TicketDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    setLoading(true);
    myApi.tickets()
      .then((res) => setTickets(res.data.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const openTicketDetail = async (ticketId: string) => {
    setDetailLoading(true);
    setQrOpen(true);
    try {
      const res = await myApi.ticketDetail(ticketId);
      setSelectedTicket(res.data);
    } catch {
      setSelectedTicket(null);
    } finally {
      setDetailLoading(false);
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
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">Mening chiptalarim</h1>

        {tickets.length === 0 ? (
          <div className="text-center py-20">
            <Ticket className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-600 mb-2">Chiptalar topilmadi</h3>
            <p className="text-slate-400 mb-4">Siz hali chipta sotib olmagansiz</p>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => navigate("/")}>
              Eventlarni ko'rish
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <Card key={ticket._id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={`${STATUS_COLORS[ticket.status] || "bg-slate-100"} text-xs`}>
                        {STATUS_LABELS[ticket.status] || ticket.status}
                      </Badge>
                      <Badge variant="outline" className="text-xs">{ticket.zoneName}</Badge>
                    </div>
                    <p className="text-sm text-slate-500">
                      <Calendar className="inline h-3 w-3 mr-1" />
                      {formatDate(ticket.createdAt)}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">ID: {ticket._id}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openTicketDetail(ticket._id)}
                    className="shrink-0"
                  >
                    <QrCode className="mr-2 h-4 w-4" /> QR ko'rish
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* QR / Detail Dialog */}
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Chipta ma'lumotlari</DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          ) : selectedTicket ? (
            <div className="space-y-4">
              {selectedTicket.event && (
                <div>
                  <h3 className="font-semibold text-lg">{selectedTicket.event.title}</h3>
                  <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{formatDate(selectedTicket.event.dateTime)} • {formatTime(selectedTicket.event.dateTime)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-1">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{selectedTicket.event.venueName}, {selectedTicket.event.region}</span>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Badge className={`${STATUS_COLORS[selectedTicket.ticket.status] || "bg-slate-100"} text-xs`}>
                  {STATUS_LABELS[selectedTicket.ticket.status] || selectedTicket.ticket.status}
                </Badge>
                <Badge variant="outline">{selectedTicket.ticket.zoneName}</Badge>
              </div>
              {/* QR Code display */}
              <div className="bg-white border-2 border-dashed border-slate-200 rounded-xl p-6 text-center">
                <QrCode className="h-32 w-32 mx-auto text-slate-800 mb-3" />
                <p className="text-xs text-slate-400 break-all max-h-20 overflow-hidden">
                  {selectedTicket.ticket.qrPayload.substring(0, 80)}...
                </p>
              </div>
              <p className="text-xs text-slate-400 text-center">
                * QR kodni kirishda skanerga ko'rsating
              </p>
            </div>
          ) : (
            <p className="text-center text-slate-500 py-4">Ma'lumot topilmadi</p>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}