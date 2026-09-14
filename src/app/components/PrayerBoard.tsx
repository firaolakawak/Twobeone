import '../styles/feature-glass.css';
import { formatUiDate } from '../utils/uiDateTime';
import { useUiCopy, UI_LOCALES } from '../utils/uiTranslation';
import { prayerUiMessages } from '../locales/prayerUi';
import { LoadingMark } from './BrandLoader';
import { useState } from "react";
import { useLanguage } from '../contexts/LanguageContext';
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Badge } from "./ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import {
  Plus,
  Heart,
  Check,
  ChevronDown,
  ChevronUp,
  Bell,
  Search,
  Users,
  CheckCircle2,
  Calendar,
  MessageCircle,
  X,
  Lock,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

interface Prayer {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: string;
  isAnswered: boolean;
  answeredAt?: string | null;
  reminderDate?: string | null;
  isSharedWithCommunity: boolean;
  prayerCount: number;
  youPrayed?: boolean;
  partnerPrayed?: boolean;
  createdAt: string;
  updatedAt: string;
  isPartner?: boolean;
  isCommunity?: boolean;
  isSharedWithPartner?: boolean;
  isSurprise?: boolean;
  unlockAt?: string | null;
  isLockedForPartner?: boolean;
}

interface PrayerBoardProps {
  prayers: Prayer[];
  onAddPrayer: (prayer: any) => Promise<void>;
  onUpdatePrayer: (id: string, updates: any) => Promise<void>;
  onDeletePrayer: (id: string) => Promise<void>;
  onMarkPrayed: (id: string) => Promise<void>;
  onBackToHome?: () => void;
}

const CATEGORIES = [
  {
    value: "Relationship",
    emoji: "💑",
    icon: "💑",
    color: "bg-primary-500",
  },
  {
    value: "Family",
    emoji: "👨‍👩‍👧‍👦",
    icon: "👨‍👩‍👧‍👦",
    color: "bg-sky-500",
  },
  {
    value: "Health",
    emoji: "💪",
    icon: "💊",
    color: "bg-success-500",
  },
  {
    value: "Work",
    emoji: "💼",
    icon: "💼",
    color: "bg-primary-500",
  },
  {
    value: "Spiritual Growth",
    emoji: "✨",
    icon: "✨",
    color: "bg-warning-500",
  },
  {
    value: "Guidance",
    emoji: "🧭",
    icon: "🧭",
    color: "bg-sky-500",
  },
  {
    value: "Thanksgiving",
    emoji: "🙏",
    icon: "🙏",
    color: "bg-warning-500",
  },
  {
    value: "Financial",
    emoji: "💰",
    icon: "💰",
    color: "bg-success-500",
  },
  {
    value: "General",
    emoji: "📿",
    icon: "📿",
    color: "bg-muted0",
  },
];

export function PrayerBoard({
  prayers,
  onAddPrayer,
  onUpdatePrayer,
  onDeletePrayer,
  onMarkPrayed,
}: PrayerBoardProps) {
  const tr = useUiCopy(prayerUiMessages);
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingPrayer, setEditingPrayer] =
    useState<Prayer | null>(null);
  const [activeTab, setActiveTab] = useState<
    "requests" | "answered" | "together"
  >("requests");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCards, setExpandedCards] = useState<
    Set<string>
  >(new Set());

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General");
  const [reminderDate, setReminderDate] = useState("");
  const [isSharedWithCommunity, setIsSharedWithCommunity] =
    useState(false);
  const [isSharedWithPartner, setIsSharedWithPartner] = useState(true);
  const [isSurprise, setIsSurprise] = useState(false);
  const [unlockAt, setUnlockAt] = useState("");

  // Check if user has a partner (based on whether there are any partner prayers)
  const hasPartner = prayers.some(
    (prayer) => prayer.isPartner === true,
  );

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory("General");
    setReminderDate("");
    setIsSharedWithCommunity(false);
    setIsSharedWithPartner(true);
    setIsSurprise(false);
    setUnlockAt("");
    setEditingPrayer(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const prayerData = {
        title,
        description,
        category,
        reminderDate: reminderDate || null,
        isSharedWithCommunity,
        isSharedWithPartner,
        isSurprise: isSharedWithPartner && isSurprise,
        unlockAt: isSharedWithPartner && isSurprise && unlockAt ? new Date(`${unlockAt}T00:00:00`).toISOString() : null,
        youPrayed: true,
        partnerPrayed: false,
      };

      if (editingPrayer) {
        await onUpdatePrayer(editingPrayer.id, prayerData);
        toast.success(tr("Prayer updated!"));
      } else {
        await onAddPrayer(prayerData);
        toast.success(tr("Prayer request added!"));
      }

      resetForm();
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to save prayer:", error);
      toast.error(tr("Failed to save prayer request"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (prayer: Prayer) => {
    setEditingPrayer(prayer);
    setTitle(prayer.title);
    setDescription(prayer.description);
    setCategory(prayer.category);
    setReminderDate(prayer.reminderDate || "");
    setIsSharedWithCommunity(prayer.isSharedWithCommunity);
    setIsSharedWithPartner(prayer.isSharedWithPartner !== false);
    setIsSurprise(Boolean(prayer.isSurprise));
    setUnlockAt(prayer.unlockAt ? prayer.unlockAt.slice(0, 10) : "");
    setIsOpen(true);
  };

  const handleTogglePrayed = async (
    prayer: Prayer,
    isPrayer: "you" | "partner",
  ) => {
    // Can't modify community prayers from others
    if (prayer.isCommunity) return;

    try {
      if (prayer.isPartner) {
        await onUpdatePrayer(prayer.id, { partnerPrayed: !prayer.partnerPrayed });
        return;
      }
      if (isPrayer === "you") {
        await onUpdatePrayer(prayer.id, {
          youPrayed: !prayer.youPrayed,
        });
      } else {
        await onUpdatePrayer(prayer.id, {
          partnerPrayed: !prayer.partnerPrayed,
        });
      }
    } catch (error) {
      toast.error(tr("Failed to update prayer"));
    }
  };

  const handleToggleAnswered = async (prayer: Prayer) => {
    try {
      await onUpdatePrayer(prayer.id, {
        isAnswered: !prayer.isAnswered,
      });
      toast.success(
        prayer.isAnswered
          ? tr("Marked as ongoing")
          : tr("Praise God! Prayer answered! 🎉"),
      );
    } catch (error) {
      toast.error(tr("Failed to update prayer"));
    }
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedCards(newExpanded);
  };

  // Filter prayers
  const filteredPrayers = prayers.filter((prayer) => {
    // Text search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !prayer.title.toLowerCase().includes(query) &&
        !prayer.description.toLowerCase().includes(query) &&
        !tr(prayer.category).toLocaleLowerCase().includes(query)
      ) {
        return false;
      }
    }

    // Tab filtering
    if (activeTab === "answered" && !prayer.isAnswered)
      return false;
    if (activeTab === "requests" && prayer.isAnswered)
      return false;
    if (
      activeTab === "together" &&
      (!prayer.youPrayed || !prayer.partnerPrayed)
    )
      return false;

    return true;
  });

  const getCategoryData = (categoryName: string) => {
    return (
      CATEGORIES.find((c) => c.value === categoryName) ||
      CATEGORIES[CATEGORIES.length - 1]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return formatUiDate(date, UI_LOCALES[language], {
      month: "short",
      day: "numeric",
      year:
        date.getFullYear() !== new Date().getFullYear()
          ? "numeric"
          : undefined,
    });
  };

  const activePrayerCount = prayers.filter(
    (prayer) => !prayer.isAnswered,
  ).length;
  const answeredPrayerCount = prayers.filter(
    (prayer) => prayer.isAnswered,
  ).length;
  const togetherPrayerCount = prayers.filter(
    (prayer) => prayer.youPrayed && prayer.partnerPrayed,
  ).length;

  const openPrayerForm = () => {
    resetForm();
    setIsOpen(true);
  };

  return (
    <div className="tbo-feature-layout mx-auto min-h-screen w-full max-w-3xl space-y-7 pb-28">
      <header className="tbo-feature-header relative isolate overflow-hidden rounded-[2rem] tbo-glass-raised px-6 py-7 shadow-[0_18px_55px_-38px_rgba(190,24,93,0.45)] ring-1 ring-[var(--glass-rim)] sm:px-9 sm:py-9">
        <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-[var(--glass-inset-surface)] blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-52 w-52 rounded-full bg-amber-200/30 blur-3xl" aria-hidden="true" />
        <div className="relative">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="tbo-caption mb-4 inline-flex items-center gap-2 rounded-full bg-[var(--glass-inset-surface)] px-3 py-1.5 text-[var(--glass-accent)] shadow-sm ring-1 ring-[var(--glass-rim)]">
                <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" aria-hidden="true" />

                {tr("Held together in prayer")}
              </div>
              <h1 className="tbo-page-title break-words text-foreground">{t.prayer.title}</h1>
              <p className="tbo-supporting mt-2 max-w-lg text-muted-foreground">{tr("Bring your hopes, needs, and gratitude into one shared sacred space.")}</p>
            </div>
            <Button type="button" onClick={openPrayerForm} className="tbo-action min-h-11 h-auto whitespace-normal rounded-full px-5 shadow-lg">
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t.prayer.newRequest}
            </Button>
          </div>
          <div className="tbo-feature-stats mt-7 grid grid-cols-3 gap-3 border-t border-[var(--glass-border)] pt-5 [overflow-wrap:anywhere]">
            <div><p className="text-xl font-bold text-foreground">{activePrayerCount}</p><p className="tbo-caption mt-0.5 text-muted-foreground">{tr("Active")}</p></div>
            <div className="border-l border-[var(--glass-border)] pl-3"><p className="text-xl font-bold text-foreground">{togetherPrayerCount}</p><p className="tbo-caption mt-0.5 text-muted-foreground">{tr("Together")}</p></div>
            <div className="border-l border-[var(--glass-border)] pl-3"><p className="text-xl font-bold text-foreground">{answeredPrayerCount}</p><p className="tbo-caption mt-0.5 text-muted-foreground">{tr("Answered")}</p></div>
          </div>
        </div>
      </header>

      <div className="space-y-5">
        <div className="grid min-h-14 w-full grid-cols-3 gap-1 rounded-[1.25rem] border border-[var(--glass-border)] tbo-glass-inset p-1.5 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04),0_10px_30px_-24px_rgba(15,23,42,0.45)]" role="tablist" aria-label={tr("Prayer sections")}>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "requests"}
            onClick={() => setActiveTab("requests")}
            className={`tbo-action flex min-h-11 min-w-0 flex-wrap items-center justify-center gap-2 rounded-[0.9rem] px-2 py-2 [overflow-wrap:anywhere] transition-all ${
              activeTab === "requests"
                ? "bg-[var(--glass-inset-surface)] text-[var(--glass-accent)] shadow-sm ring-1 ring-[var(--glass-rim)]"
                : "text-muted-foreground hover:bg-[var(--glass-inset-surface)] hover:text-foreground"
            }`}
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">{t.prayer.prayerRequests}</span><span className="sm:hidden">{tr("Active")}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "answered"}
            onClick={() => setActiveTab("answered")}
            className={`tbo-action flex min-h-11 min-w-0 flex-wrap items-center justify-center gap-2 rounded-[0.9rem] px-2 py-2 [overflow-wrap:anywhere] transition-all ${
              activeTab === "answered"
                ? "bg-[var(--glass-inset-surface)] text-[var(--glass-accent)] shadow-sm ring-1 ring-[var(--glass-rim)]"
                : "text-muted-foreground hover:bg-[var(--glass-inset-surface)] hover:text-foreground"
            }`}
          >
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            {t.prayer.answered}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "together"}
            onClick={() => setActiveTab("together")}
            className={`tbo-action flex min-h-11 min-w-0 flex-wrap items-center justify-center gap-2 rounded-[0.9rem] px-2 py-2 [overflow-wrap:anywhere] transition-all ${
              activeTab === "together"
                ? "bg-[var(--glass-inset-surface)] text-[var(--glass-accent)] shadow-sm ring-1 ring-[var(--glass-rim)]"
                : "text-muted-foreground hover:bg-[var(--glass-inset-surface)] hover:text-foreground"
            }`}
          >
            <Heart className="h-4 w-4" aria-hidden="true" />
            {t.prayer.together}
          </button>
        </div>

        <div className="relative" role="search">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            type="search"
            placeholder={t.prayer.searchPrayers}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(event) => { if (event.key === "Escape") setSearchQuery(""); }}
            aria-label={tr("Search prayers")}
            className="tbo-field h-12 rounded-2xl border-[var(--glass-border)] bg-[var(--glass-inset-surface)] pl-11 pr-11 shadow-[0_8px_25px_-22px_rgba(15,23,42,0.55)] placeholder:text-muted-foreground focus-visible:border-rose-300 focus-visible:ring-4 focus-visible:ring-[var(--glass-rim)]"
          />
          {searchQuery && (
            <button type="button" onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-[var(--glass-inset-surface)] hover:text-foreground" aria-label={tr("Clear prayer search")}>
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Prayer List */}
      <div className="space-y-4">
        {!hasPartner && activeTab === "together" ? (
          <Card className="rounded-[2rem] border-[var(--glass-border)] tbo-glass p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--glass-inset-surface)] text-rose-500">
              <Users className="h-8 w-8" aria-hidden="true" />
            </div>
            <h3 className="tbo-card-title mb-2 text-foreground">

              {tr("Connect with Your Partner")}
            </h3>
            <p className="tbo-supporting mx-auto max-w-md text-muted-foreground">

              {tr("Prayer sharing is available when you're connected as a couple. Share your invite code or enter your partner's code to start praying together.")}
            </p>
          </Card>
        ) : filteredPrayers.length === 0 ? (
          <Card className="rounded-[2rem] border-[var(--glass-border)] tbo-glass p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--glass-inset-surface)] text-rose-500">
              {searchQuery ? <Search className="h-7 w-7" aria-hidden="true" /> : <Heart className="h-8 w-8" aria-hidden="true" />}
            </div>
            <h3 className="tbo-card-title mb-2 text-foreground">
              {searchQuery
                ? tr("No matching prayers")
                : activeTab === "together"
                ? t.prayer.prayTogether
                : activeTab === "answered"
                  ? t.prayer.answered
                  : t.prayer.noRequests}
            </h3>
            <p className="tbo-supporting text-muted-foreground">
              {searchQuery
                ? tr("Try a different title, category, or prayer detail.")
                : activeTab === "together"
                ? tr("Pray together as a couple to strengthen your bond")
                : activeTab === "answered"
                  ? tr("Answered prayers will appear here")
                  : tr("Start by adding a prayer request")}
            </p>
            {searchQuery && (
              <Button type="button" variant="ghost" onClick={() => setSearchQuery("")} className="tbo-action mt-4 rounded-full text-[var(--glass-accent)] hover:bg-[var(--glass-inset-surface)] hover:text-[var(--glass-accent)]">{tr("Clear search")}</Button>
            )}
          </Card>
        ) : (
          filteredPrayers.map((prayer) => {
            const catData = getCategoryData(prayer.category);
            const canTrack = !prayer.isCommunity && !prayer.isLockedForPartner;
            const canManage = !prayer.isPartner && !prayer.isCommunity;
            const isExpanded = expandedCards.has(prayer.id);
            const prayerCount =
              (prayer.youPrayed ? 1 : 0) +
              (prayer.partnerPrayed ? 1 : 0);

            return (
              <Card
                key={prayer.id}
                className="tbo-glass group overflow-hidden rounded-[1.5rem] border border-[var(--glass-border)] shadow-[0_12px_36px_-28px_rgba(15,23,42,0.45)] transition-all hover:-translate-y-0.5 hover:border-[var(--glass-border)] hover:shadow-[0_18px_42px_-26px_rgba(190,24,93,0.3)]"
              >
                <CardContent className="p-0">
                  <div className="tbo-feature-card-content p-5 sm:p-6">
                    <div className="tbo-feature-card-heading flex items-start gap-4">
                    <div
                      className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-[var(--glass-inset-surface)] text-xl ring-1 ring-[var(--glass-rim)]"
                    >
                      {prayer.isLockedForPartner ? <Lock className="h-5 w-5 text-[var(--glass-accent)]" /> : catData.icon}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="tbo-caption mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground">
                        <span className="text-[var(--glass-accent)]">{tr(prayer.category)}</span>
                        <span aria-hidden="true">•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                          {formatDate(prayer.createdAt)}
                        </span>
                        {prayer.isAnswered && (
                          <Badge className="max-w-full whitespace-normal h-auto min-h-6 tbo-caption border-0 bg-emerald-50 px-2 py-0.5 text-emerald-700 shadow-none hover:bg-emerald-50">

                            {tr("Answered")}
                          </Badge>
                        )}
                        {!prayer.isPartner && (
                          <Badge variant="outline" className="max-w-full whitespace-normal h-auto min-h-6 tbo-caption border-[var(--glass-border)] bg-[var(--glass-inset-surface)] px-2 py-0.5 text-muted-foreground">
                            {prayer.isSharedWithPartner === false ? <><UserRound className="mr-1 h-3 w-3" />{tr("Private")}</> : prayer.isSurprise ? <><Lock className="mr-1 h-3 w-3" />{tr("Surprise")}</> : <><Users className="mr-1 h-3 w-3" />{tr("Shared")}</>}
                          </Badge>
                        )}
                      </div>
                      <h3 className="tbo-card-title break-words mb-1.5 text-foreground">
                        {prayer.title}
                      </h3>
                      <p
                        className={`tbo-body break-words text-muted-foreground ${
                          isExpanded ? "" : "line-clamp-2"
                        }`}
                      >
                        {prayer.isLockedForPartner
                          ? tr('Surprise — locked until {date}.', { date: prayer.unlockAt ? formatDate(prayer.unlockAt) : tr('the reveal date') })
                          : prayer.description}
                      </p>
                    </div>

                    {!prayer.isLockedForPartner && <button
                      type="button"
                      onClick={() => toggleExpand(prayer.id)}
                      className="tbo-action flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-[var(--glass-inset-surface)] hover:text-[var(--glass-accent)]"
                      aria-label={tr(isExpanded ? 'Collapse {title}' : 'Expand {title}', { title: prayer.title })}
                      aria-expanded={isExpanded}
                    >
                      {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </button>}
                    </div>

                    <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-[var(--glass-border)] pt-4">
                      <button
                        type="button"
                        onClick={() => handleTogglePrayed(prayer, "you")}
                        disabled={!canTrack}
                        aria-pressed={Boolean(prayer.isPartner ? prayer.partnerPrayed : prayer.youPrayed)}
                        className={`tbo-feature-small-action tbo-action flex min-h-10 items-center gap-2 rounded-full px-3.5 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${(prayer.isPartner ? prayer.partnerPrayed : prayer.youPrayed) ? "bg-[var(--glass-inset-surface)] text-[var(--glass-accent)]" : "bg-[var(--glass-inset-surface)] text-muted-foreground hover:bg-[var(--glass-inset-surface)] hover:text-[var(--glass-accent)]"}`}
                      >
                        <span className={`flex h-5 w-5 items-center justify-center rounded-full ${(prayer.isPartner ? prayer.partnerPrayed : prayer.youPrayed) ? "bg-rose-500 text-white" : "border border-[var(--glass-border)] bg-[var(--glass-inset-surface)]"}`}>
                          {(prayer.isPartner ? prayer.partnerPrayed : prayer.youPrayed) && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                        </span>

                        {tr("You prayed")}
                      </button>
                      {!prayer.isPartner && <button
                        type="button"
                        onClick={() => handleTogglePrayed(prayer, "partner")}
                        disabled={!canTrack}
                        aria-pressed={Boolean(prayer.partnerPrayed)}
                        className={`tbo-feature-small-action tbo-action flex min-h-10 items-center gap-2 rounded-full px-3.5 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${prayer.partnerPrayed ? "bg-amber-100 text-amber-800" : "bg-[var(--glass-inset-surface)] text-muted-foreground hover:bg-amber-50 hover:text-amber-800"}`}
                      >
                        <span className={`flex h-5 w-5 items-center justify-center rounded-full ${prayer.partnerPrayed ? "bg-amber-500 text-white" : "border border-[var(--glass-border)] bg-[var(--glass-inset-surface)]"}`}>
                          {prayer.partnerPrayed && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                        </span>

                        {tr("Partner prayed")}
                      </button>}
                      <span className="tbo-caption ml-auto flex items-center gap-1.5 text-muted-foreground">
                        <Heart className="h-3.5 w-3.5 text-rose-500" aria-hidden="true" />
                        {prayerCount}  {tr("praying")}
                      </span>
                    </div>
                  </div>

                  {isExpanded && canManage && (
                    <div className="grid grid-cols-3 gap-2 border-t border-[var(--glass-border)] bg-[var(--glass-inset-surface)] p-3 sm:px-5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(prayer)}
                        className="tbo-action rounded-full border-[var(--glass-border)] bg-[var(--glass-inset-surface)]"
                      >

                        {tr("Edit")}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleToggleAnswered(prayer)
                        }
                        className="tbo-action rounded-full border-[var(--glass-border)] bg-[var(--glass-inset-surface)]"
                      >
                        {prayer.isAnswered
                          ? tr("Mark Active")
                          : t.prayer.markAnswered}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm(tr("Delete this prayer?"))) {
                            onDeletePrayer(prayer.id);
                          }
                        }}
                        className="tbo-action rounded-full border-[var(--glass-border)] bg-[var(--glass-inset-surface)] text-red-600 hover:bg-red-50 hover:text-red-700"
                      >

                        {tr("Delete")}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Add/Edit Prayer Dialog */}
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-h-[92dvh] gap-0 overflow-y-auto rounded-[1.75rem] border-[var(--glass-border)] p-0 sm:max-w-xl">
          <DialogHeader className="border-b border-[var(--glass-border)] tbo-glass-raised px-6 py-6 pr-12 text-left">
            <DialogTitle className="tbo-dialog-title text-foreground">
              {editingPrayer
                ? tr("Edit Prayer")
                : tr("New Prayer Request")}
            </DialogTitle>
            <DialogDescription className="tbo-supporting text-muted-foreground">

              {tr("Create a space to return to this prayer together.")}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5 p-6">
            {/* Category Selection */}
            <div className="space-y-2">
              <Label className="tbo-label">{tr("Category")}</Label>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    aria-pressed={category === cat.value}
                    className={`flex min-h-20 flex-col items-center justify-center rounded-xl border p-3 transition-all ${
                      category === cat.value
                        ? "border-rose-300 bg-[var(--glass-inset-surface)] text-[var(--glass-accent)] shadow-sm"
                        : "border-[var(--glass-border)] bg-[var(--glass-inset-surface)] text-foreground hover:border-[var(--glass-border)] hover:bg-[var(--glass-inset-surface)]"
                    }`}
                  >
                    <span className="text-2xl mb-1">
                      {cat.emoji}
                    </span>
                    <span className="tbo-caption text-center">
                      {tr(cat.value)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label className="tbo-label" htmlFor="title">{t.prayer.requestTitle}</Label>
              <Input
                id="title"
                placeholder={tr("What are you praying for?")}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="tbo-field h-11 rounded-xl border-[var(--glass-border)] focus-visible:ring-rose-400"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="tbo-label" htmlFor="description">{tr("Details")}</Label>
              <Textarea
                id="description"
                placeholder={tr("Share more about this prayer request...")}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                required
                className="tbo-field rounded-xl border-[var(--glass-border)] focus-visible:ring-rose-400"
              />
            </div>

            {/* Reminder Date */}
            <div className="space-y-2">
              <Label className="tbo-label" htmlFor="reminder">
                <Bell className="w-4 h-4 inline mr-1" />

                {tr("Set Reminder (Optional)")}
              </Label>
              <Input
                id="reminder"
                type="date"
                value={reminderDate}
                onChange={(e) =>
                  setReminderDate(e.target.value)
                }
                min={new Date().toISOString().split("T")[0]}
                className="tbo-field h-11 rounded-xl border-[var(--glass-border)] focus-visible:ring-rose-400"
              />
            </div>

            <div className="space-y-3 rounded-2xl border border-[var(--glass-border)] tbo-glass-inset p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label htmlFor="partner-sharing" className="tbo-label cursor-pointer">{tr("Share with Partner")}</Label>
                  <p className="tbo-caption mt-1 text-muted-foreground">{tr("Turn this off to keep the prayer in your private list.")}</p>
                </div>
                <Switch id="partner-sharing" checked={isSharedWithPartner} onCheckedChange={(checked) => { setIsSharedWithPartner(checked); if (!checked) { setIsSurprise(false); setIsSharedWithCommunity(false); } }} />
              </div>
              {isSharedWithPartner && (
                <>
                  <div className="flex items-center justify-between gap-4 border-t border-[var(--glass-border)] pt-3">
                    <div>
                      <Label htmlFor="surprise-lock" className="tbo-label cursor-pointer">{tr("Make it a surprise")}</Label>
                      <p className="tbo-caption mt-1 text-muted-foreground">{tr("Your partner sees only a locked surprise until the date.")}</p>
                    </div>
                    <Switch id="surprise-lock" checked={isSurprise} onCheckedChange={setIsSurprise} />
                  </div>
                  {isSurprise && <div className="space-y-2"><Label className="tbo-label" htmlFor="prayer-unlock">{tr("Unlock date")}</Label><Input id="prayer-unlock" type="date" required value={unlockAt} min={new Date().toISOString().slice(0, 10)} onChange={(event) => setUnlockAt(event.target.value)} className="tbo-field h-11 rounded-xl bg-[var(--glass-inset-surface)]" /></div>}
                </>
              )}
            </div>

            {/* Community Sharing */}
            <div className="flex items-center justify-between rounded-2xl border border-[var(--glass-border)] tbo-glass-inset p-4">
              <div className="flex-1">
                <Label
                  htmlFor="community"
                  className="tbo-label cursor-pointer"
                >

                  {tr("Share with Community")}
                </Label>
                <p className="tbo-caption text-muted-foreground mt-1">

                  {tr("Allow other couples to see and pray for this request")}
                </p>
              </div>
              <Switch
                id="community"
                checked={isSharedWithCommunity}
                disabled={!isSharedWithPartner}
                onCheckedChange={setIsSharedWithCommunity}
              />
            </div>

            <DialogFooter className="gap-2 pt-1 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="tbo-action rounded-full"
              >

                {tr("Cancel")}
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="tbo-action rounded-full px-6 shadow-sm"
              >
                {isLoading && <LoadingMark />}
                {isLoading
                  ? tr("Saving...")
                  : editingPrayer
                    ? tr("Update")
                    : tr("Add Prayer")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
