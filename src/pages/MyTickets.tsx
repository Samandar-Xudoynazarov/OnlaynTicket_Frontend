import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { myApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Ticket, QrCode, Calendar, MapPin, Hash, CheckCircle, XCircle, Clock, Download } from "lucide-react";
import QRCode from "react-qr-code";
import { jsPDF } from "jspdf";

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
  valid: "bg-emerald-100 text-emerald-700 border-emerald-200",
  used: "bg-slate-100 text-slate-600 border-slate-200",
  refunded: "bg-amber-100 text-amber-700 border-amber-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  valid: <CheckCircle className="h-3.5 w-3.5" />,
  used: <Clock className="h-3.5 w-3.5" />,
  refunded: <XCircle className="h-3.5 w-3.5" />,
  cancelled: <XCircle className="h-3.5 w-3.5" />,
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
  const [pdfLoading, setPdfLoading] = useState(false);

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
    setSelectedTicket(null);
    try {
      const res = await myApi.ticketDetail(ticketId);
      setSelectedTicket(res.data);
    } catch {
      setSelectedTicket(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const downloadPDF = async (detail: TicketDetail) => {
    setPdfLoading(true);
    try {
      const { ticket, event } = detail;
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: [80, 140] });

      // Gradient-like top bar
      doc.setFillColor(99, 102, 241);
      doc.rect(0, 0, 80, 18, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("ONLAYN TIKKET", 40, 8, { align: "center" });
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text("Raqamli chipta", 40, 14, { align: "center" });

      // Event title
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      const titleLines = doc.splitTextToSize(event.title, 68);
      doc.text(titleLines, 6, 26);

      const afterTitle = 26 + titleLines.length * 5;

      // Divider
      doc.setDrawColor(226, 232, 240);
      doc.line(6, afterTitle + 2, 74, afterTitle + 2);

      // Info rows
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      const infoY = afterTitle + 8;

      const rows = [
        { label: "Sana:", value: formatDate(event.dateTime) + " " + formatTime(event.dateTime) },
        { label: "Manzil:", value: event.venueName + ", " + event.region },
        { label: "Zona:", value: ticket.zoneName },
        { label: "Holat:", value: STATUS_LABELS[ticket.status] || ticket.status },
      ];

      rows.forEach((row, i) => {
        doc.setFont("helvetica", "bold");
        doc.setTextColor(71, 85, 105);
        doc.text(row.label, 6, infoY + i * 7);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(15, 23, 42);
        const wrapped = doc.splitTextToSize(row.value, 50);
        doc.text(wrapped, 26, infoY + i * 7);
      });

      // Tear line
      const tearY = infoY + rows.length * 7 + 4;
      doc.setDrawColor(226, 232, 240);
      doc.setLineDash([2, 2]);
      doc.line(6, tearY, 74, tearY);
      doc.setLineDash([]);

      // QR Code as SVG → canvas → image
      const qrSvgEl = document.querySelector("#qr-svg-for-pdf svg") as SVGElement | null;
      if (qrSvgEl) {
        const svgData = new XMLSerializer().serializeToString(qrSvgEl);
        const canvas = document.createElement("canvas");
        canvas.width = 200;
        canvas.height = 200;
        const ctx = canvas.getContext("2d")!;
        const img = new Image();
        await new Promise<void>((resolve) => {
          img.onload = () => { ctx.drawImage(img, 0, 0, 200, 200); resolve(); };
          img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
        });
        const qrDataUrl = canvas.toDataURL("image/png");
        doc.addImage(qrDataUrl, "PNG", 20, tearY + 5, 40, 40);
      }

      // Ticket ID
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.setFont("helvetica", "normal");
      doc.text("ID: " + ticket._id.slice(-12).toUpperCase(), 40, tearY + 50, { align: "center" });

      // Bottom bar
      doc.setFillColor(241, 245, 249);
      doc.rect(0, 128, 80, 12, "F");
      doc.setFontSize(6);
      doc.setTextColor(148, 163, 184);
      doc.text("onlayntikket.uz  |  Kirish chog'ida QR kodni ko'rsating", 40, 135, { align: "center" });

      doc.save(`chipta-${ticket._id.slice(-8)}.pdf`);
    } finally {
      setPdfLoading(false);
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

  const validTickets = tickets.filter((t) => t.status === "valid");
  const otherTickets = tickets.filter((t) => t.status !== "valid");

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Mening chiptalarim</h1>
            <p className="text-slate-500 mt-1">{tickets.length} ta chipta</p>
          </div>
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Ticket className="h-7 w-7 text-white" />
          </div>
        </div>

        {tickets.length === 0 ? (
          <div className="text-center py-24 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Ticket className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-semibold text-slate-600 mb-2">Chiptalar topilmadi</h3>
            <p className="text-slate-400 mb-6">Siz hali chipta sotib olmagansiz</p>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => navigate("/")}>
              Eventlarni ko'rish
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Active tickets */}
            {validTickets.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                  Faol chiptalar ({validTickets.length})
                </h2>
                <div className="space-y-3">
                  {validTickets.map((ticket) => (
                    <TicketCard key={ticket._id} ticket={ticket} onOpen={openTicketDetail} />
                  ))}
                </div>
              </div>
            )}

            {/* Other tickets */}
            {otherTickets.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-slate-500 mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-slate-400" />
                  O'tgan chiptalar ({otherTickets.length})
                </h2>
                <div className="space-y-3 opacity-70">
                  {otherTickets.map((ticket) => (
                    <TicketCard key={ticket._id} ticket={ticket} onOpen={openTicketDetail} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* QR / Detail Dialog */}
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-0">
            <DialogTitle>Chipta</DialogTitle>
          </DialogHeader>

          {detailLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          ) : selectedTicket ? (
            <div>
              {/* Event poster strip */}
              {selectedTicket.event?.posterUrl && (
                <div className="h-32 overflow-hidden mx-6 mt-4 rounded-xl">
                  <img
                    src={selectedTicket.event.posterUrl}
                    alt={selectedTicket.event.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="px-6 py-4 space-y-4">
                {/* Event info */}
                {selectedTicket.event && (
                  <div>
                    <h3 className="font-bold text-lg text-slate-900">{selectedTicket.event.title}</h3>
                    <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-1.5">
                      <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                      <span>{formatDate(selectedTicket.event.dateTime)} • {formatTime(selectedTicket.event.dateTime)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-1">
                      <MapPin className="h-3.5 w-3.5 text-indigo-400" />
                      <span>{selectedTicket.event.venueName}, {selectedTicket.event.region}</span>
                    </div>
                  </div>
                )}

                <Separator className="border-dashed" />

                {/* Zone & status */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Zona</p>
                    <Badge variant="outline" className="font-semibold">{selectedTicket.ticket.zoneName}</Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400 mb-1">Holat</p>
                    <Badge className={`${STATUS_COLORS[selectedTicket.ticket.status] || "bg-slate-100"} flex items-center gap-1`}>
                      {STATUS_ICONS[selectedTicket.ticket.status]}
                      {STATUS_LABELS[selectedTicket.ticket.status] || selectedTicket.ticket.status}
                    </Badge>
                  </div>
                </div>

                {/* Dashed divider — ticket tear line */}
                <div className="relative">
                  <div className="absolute -left-6 -right-6 border-t-2 border-dashed border-slate-200" />
                  <div className="absolute -left-3 -top-3 w-6 h-6 bg-white rounded-full border border-slate-200" />
                  <div className="absolute -right-3 -top-3 w-6 h-6 bg-white rounded-full border border-slate-200" />
                </div>

                {/* QR Code */}
                <div className="flex flex-col items-center pt-2">
                  <div
                    id="qr-svg-for-pdf"
                    className={`p-4 rounded-2xl border-2 ${selectedTicket.ticket.status === "valid" ? "border-indigo-200 bg-indigo-50" : "border-slate-200 bg-slate-50"}`}
                  >
                    <QRCode
                      value={selectedTicket.ticket.qrPayload}
                      size={180}
                      style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                      viewBox="0 0 256 256"
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-3 text-center">
                    Kirishda skanerga ko'rsating
                  </p>
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400">
                    <Hash className="h-3 w-3" />
                    <span className="font-mono">{selectedTicket.ticket._id.slice(-8).toUpperCase()}</span>
                  </div>

                  {/* PDF download */}
                  <Button
                    className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700"
                    onClick={() => downloadPDF(selectedTicket)}
                    disabled={pdfLoading}
                  >
                    {pdfLoading
                      ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Tayyorlanmoqda...</>
                      : <><Download className="mr-2 h-4 w-4" />PDF yuklab olish</>
                    }
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center text-slate-500 py-8">Ma'lumot topilmadi</p>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

function TicketCard({ ticket, onOpen }: { ticket: TicketItem; onOpen: (id: string) => void }) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-0 shadow-md">
      <CardContent className="p-0">
        <div className="flex items-stretch">
          {/* Left color bar */}
          <div className={`w-1.5 shrink-0 ${ticket.status === "valid" ? "bg-emerald-500" : "bg-slate-300"}`} />

          <div className="flex-1 flex items-center justify-between gap-4 p-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={`${STATUS_COLORS[ticket.status] || "bg-slate-100"} text-xs flex items-center gap-1`}>
                  {STATUS_ICONS[ticket.status]}
                  {STATUS_LABELS[ticket.status] || ticket.status}
                </Badge>
                <Badge variant="outline" className="text-xs">{ticket.zoneName}</Badge>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-slate-500">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span>{formatDate(ticket.createdAt)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                <Hash className="h-3 w-3" />
                <span className="font-mono">{ticket._id.slice(-8).toUpperCase()}</span>
              </div>
            </div>

            <Button
              variant={ticket.status === "valid" ? "default" : "outline"}
              size="sm"
              onClick={() => onOpen(ticket._id)}
              className={ticket.status === "valid" ? "bg-indigo-600 hover:bg-indigo-700 shrink-0" : "shrink-0"}
            >
              <QrCode className="mr-2 h-4 w-4" />
              QR ko'rish
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
