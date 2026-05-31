import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { myApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { User, Mail, Phone, Hash, Calendar, Shield, Pencil, X, Check, Loader2, Ticket, LayoutDashboard } from "lucide-react";
import { useTranslation } from "react-i18next";

function formatDate(dateStr: string, lang: string) {
  const locale = lang === "ru" ? "ru-RU" : lang === "en" ? "en-US" : "uz-UZ";
  return new Date(dateStr).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
}

const ROLE_COLORS: Record<string, string> = {
  user: "bg-slate-100 text-slate-700",
  organizer: "bg-indigo-100 text-indigo-700",
  admin: "bg-red-100 text-red-700",
};

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  if (!user) {
    navigate("/login");
    return null;
  }

  const startEdit = () => {
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setPhone(user.phone || "");
    setEditing(true);
  };

  const cancelEdit = () => setEditing(false);

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("Ism va familya bo'sh bo'lmasligi kerak");
      return;
    }
    setSaving(true);
    try {
      await myApi.updateProfile({ firstName, lastName, phone });
      await refreshUser();
      setEditing(false);
      toast.success("Profil yangilandi!");
    } catch {
      toast.error("Saqlashda xatolik");
    } finally {
      setSaving(false);
    }
  };

  const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  const roleLabel = t(`profile.roles.${user.role}`) || user.role;

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">{t("profile.title")}</h1>

        <Card className="shadow-lg border-0">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-md">
                  {initials}
                </div>
                <div>
                  <CardTitle className="text-xl">
                    {user.firstName} {user.lastName}
                  </CardTitle>
                  <Badge className={`mt-1.5 ${ROLE_COLORS[user.role] || "bg-slate-100"}`}>
                    <Shield className="mr-1 h-3 w-3" />
                    {roleLabel}
                  </Badge>
                </div>
              </div>
              {!editing && (
                <Button variant="outline" size="sm" onClick={startEdit} className="shrink-0">
                  <Pencil className="mr-2 h-4 w-4" /> {t("profile.edit")}
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            <Separator />

            {editing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>{t("profile.firstName")} *</Label>
                    <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder={t("profile.firstName")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t("profile.lastName")} *</Label>
                    <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder={t("profile.lastName")} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>{t("profile.phone")}</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998 90 123 45 67" />
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-sm text-slate-500 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>{user.email} — {t("profile.emailNote")}</span>
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button className="bg-indigo-600 hover:bg-indigo-700 flex-1" onClick={handleSave} disabled={saving}>
                    {saving
                      ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("profile.saving")}</>
                      : <><Check className="mr-2 h-4 w-4" />{t("profile.save")}</>
                    }
                  </Button>
                  <Button variant="outline" onClick={cancelEdit} disabled={saving}>
                    <X className="mr-2 h-4 w-4" /> {t("profile.cancel")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid gap-4">
                <InfoRow icon={<User className="h-5 w-5 text-indigo-500" />} label={t("profile.fullName")} value={`${user.firstName} ${user.lastName}`} />
                <InfoRow icon={<Mail className="h-5 w-5 text-indigo-500" />} label={t("profile.email")} value={user.email} />
                <InfoRow icon={<Phone className="h-5 w-5 text-indigo-500" />} label={t("profile.phone")} value={user.phone || t("profile.notShown")} muted={!user.phone} />
                <InfoRow icon={<Hash className="h-5 w-5 text-indigo-500" />} label={t("profile.userId")} value={user.id} mono />
                <InfoRow icon={<Calendar className="h-5 w-5 text-indigo-500" />} label={t("profile.registered")} value={formatDate(user.createdAt, i18n.language)} />
              </div>
            )}

            <Separator />

            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => navigate("/my-tickets")} className="flex-1 sm:flex-none">
                <Ticket className="mr-2 h-4 w-4" /> {t("profile.goToTickets")}
              </Button>
              {(user.role === "organizer" || user.role === "admin") && (
                <Button variant="outline" onClick={() => navigate("/organizer")} className="flex-1 sm:flex-none">
                  <LayoutDashboard className="mr-2 h-4 w-4" /> {t("profile.goToOrganizer")}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

function InfoRow({
  icon, label, value, muted = false, mono = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  muted?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
      <div className="shrink-0">{icon}</div>
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className={`font-medium ${muted ? "text-slate-400" : "text-slate-800"} ${mono ? "font-mono text-sm" : ""}`}>
          {value}
        </p>
      </div>
    </div>
  );
}
