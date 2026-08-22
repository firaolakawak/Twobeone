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
import { toast } from "sonner@2.0.3";

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
  const { t } = useLanguage();
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
        toast.success("Prayer updated!");
      } else {
        await onAddPrayer(prayerData);
        toast.success("Prayer request added!");
      }

      resetForm();
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to save prayer:", error);
      toast.error("Failed to save prayer request");
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
      toast.error("Failed to update prayer");
    }
  };

  const handleToggleAnswered = async (prayer: Prayer) => {
    try {
      await onUpdatePrayer(prayer.id, {
        isAnswered: !prayer.isAnswered,
      });
      toast.success(
        prayer.isAnswered
          ? "Marked as ongoing"
          : "Praise God! Prayer answered! 🎉",
      );
    } catch (error) {
      toast.error("Failed to update prayer");
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
        !prayer.category.toLowerCase().includes(query)
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
    return date.toLocaleDateString("en-US", {
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
    <div className="mx-auto min-h-screen w-full max-w-3xl space-y-7 pb-28">
      <header className="relative isolate overflow-hidden rounded-[2rem] bg-gradient-to-br from-rose-50 via-white to-amber-50 px-6 py-7 shadow-[0_18px_55px_-38px_rgba(190,24,93,0.45)] ring-1 ring-rose-100/80 sm:px-9 sm:py-9">
        <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-rose-200/30 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-52 w-52 rounded-full bg-amber-200/30 blur-3xl" aria-hidden="true" />
        <div className="relative">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-xs font-semibold tracking-wide text-rose-700 shadow-sm ring-1 ring-rose-100">
                <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" aria-hidden="true" />
                Held together in prayer
              </div>
              <h1 className="text-3xl font-bold tracking-[-0.035em] text-slate-950 sm:text-4xl">{t.prayer.title}</h1>
              <p className="mt-2 max-w-lg text-[15px] leading-7 text-slate-600">Bring your hopes, needs, and gratitude into one shared sacred space.</p>
            </div>
            <Button type="button" onClick={openPrayerForm} className="h-11 rounded-full bg-rose-600 px-5 font-bold text-white shadow-lg shadow-rose-200 hover:bg-rose-700">
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t.prayer.newRequest}
            </Button>
          </div>
          <div className="mt-7 grid grid-cols-3 gap-3 border-t border-rose-100/80 pt-5">
            <div><p className="text-xl font-bold text-slate-900">{activePrayerCount}</p><p className="mt-0.5 text-xs font-medium text-slate-500">Active</p></div>
            <div className="border-l border-rose-100 pl-3"><p className="text-xl font-bold text-slate-900">{togetherPrayerCount}</p><p className="mt-0.5 text-xs font-medium text-slate-500">Together</p></div>
            <div className="border-l border-rose-100 pl-3"><p className="text-xl font-bold text-slate-900">{answeredPrayerCount}</p><p className="mt-0.5 text-xs font-medium text-slate-500">Answered</p></div>
          </div>
        </div>
      </header>

      <div className="space-y-5">
        <div className="grid h-14 w-full grid-cols-3 gap-1 rounded-[1.25rem] border border-slate-200/80 bg-slate-100/70 p-1.5 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04),0_10px_30px_-24px_rgba(15,23,42,0.45)]" role="tablist" aria-label="Prayer sections">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "requests"}
            onClick={() => setActiveTab("requests")}
            className={`flex h-full items-center justify-center gap-2 rounded-[0.9rem] px-2 text-xs font-semibold transition-all sm:text-sm ${
              activeTab === "requests"
                ? "bg-white text-rose-700 shadow-sm ring-1 ring-rose-100"
                : "text-slate-500 hover:bg-white/65 hover:text-slate-800"
            }`}
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">{t.prayer.prayerRequests}</span><span className="sm:hidden">Active</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "answered"}
            onClick={() => setActiveTab("answered")}
            className={`flex h-full items-center justify-center gap-2 rounded-[0.9rem] px-2 text-xs font-semibold transition-all sm:text-sm ${
              activeTab === "answered"
                ? "bg-white text-rose-700 shadow-sm ring-1 ring-rose-100"
                : "text-slate-500 hover:bg-white/65 hover:text-slate-800"
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
            className={`flex h-full items-center justify-center gap-2 rounded-[0.9rem] px-2 text-xs font-semibold transition-all sm:text-sm ${
              activeTab === "together"
                ? "bg-white text-rose-700 shadow-sm ring-1 ring-rose-100"
                : "text-slate-500 hover:bg-white/65 hover:text-slate-800"
            }`}
          >
            <Heart className="h-4 w-4" aria-hidden="true" />
            {t.prayer.together}
          </button>
        </div>

        <div className="relative" role="search">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <Input
            type="search"
            placeholder={t.prayer.searchPrayers}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(event) => { if (event.key === "Escape") setSearchQuery(""); }}
            aria-label="Search prayers"
            className="h-12 rounded-2xl border-slate-200 bg-white pl-11 pr-11 shadow-[0_8px_25px_-22px_rgba(15,23,42,0.55)] placeholder:text-slate-400 focus-visible:border-rose-300 focus-visible:ring-4 focus-visible:ring-rose-100"
          />
          {searchQuery && (
            <button type="button" onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Clear prayer search">
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Prayer List */}
      <div className="space-y-4">
        {!hasPartner && activeTab === "together" ? (
          <Card className="rounded-[2rem] border-rose-100 bg-gradient-to-br from-white to-rose-50/50 p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-500">
              <Users className="h-8 w-8" aria-hidden="true" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-slate-900">
              Connect with Your Partner
            </h3>
            <p className="mx-auto max-w-md text-sm leading-6 text-slate-500">
              Prayer sharing is available when you're connected
              as a couple. Share your invite code or enter your
              partner's code to start praying together.
            </p>
          </Card>
        ) : filteredPrayers.length === 0 ? (
          <Card className="rounded-[2rem] border-rose-100 bg-gradient-to-br from-white to-rose-50/50 p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-500">
              {searchQuery ? <Search className="h-7 w-7" aria-hidden="true" /> : <Heart className="h-8 w-8" aria-hidden="true" />}
            </div>
            <h3 className="mb-2 text-lg font-bold text-slate-900">
              {searchQuery
                ? "No matching prayers"
                : activeTab === "together"
                ? t.prayer.prayTogether
                : activeTab === "answered"
                  ? t.prayer.answered
                  : t.prayer.noRequests}
            </h3>
            <p className="text-sm leading-6 text-slate-500">
              {searchQuery
                ? "Try a different title, category, or prayer detail."
                : activeTab === "together"
                ? "Pray together as a couple to strengthen your bond"
                : activeTab === "answered"
                  ? "Answered prayers will appear here"
                  : "Start by adding a prayer request"}
            </p>
            {searchQuery && (
              <Button type="button" variant="ghost" onClick={() => setSearchQuery("")} className="mt-4 rounded-full text-rose-700 hover:bg-rose-100/70 hover:text-rose-800">Clear search</Button>
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
                className="group overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white shadow-[0_12px_36px_-28px_rgba(15,23,42,0.45)] transition-all hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-[0_18px_42px_-26px_rgba(190,24,93,0.3)]"
              >
                <CardContent className="p-0">
                  <div className="p-5 sm:p-6">
                    <div className="flex items-start gap-4">
                    <div
                      className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-rose-50 text-xl ring-1 ring-rose-100"
                    >
                      {prayer.isLockedForPartner ? <Lock className="h-5 w-5 text-violet-600" /> : catData.icon}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-slate-500">
                        <span className="text-rose-700">{prayer.category}</span>
                        <span aria-hidden="true">•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                          {formatDate(prayer.createdAt)}
                        </span>
                        {prayer.isAnswered && (
                          <Badge className="border-0 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 shadow-none hover:bg-emerald-50">
                            Answered
                          </Badge>
                        )}
                        {!prayer.isPartner && (
                          <Badge variant="outline" className="border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600">
                            {prayer.isSharedWithPartner === false ? <><UserRound className="mr-1 h-3 w-3" />Private</> : prayer.isSurprise ? <><Lock className="mr-1 h-3 w-3" />Surprise</> : <><Users className="mr-1 h-3 w-3" />Shared</>}
                          </Badge>
                        )}
                      </div>
                      <h3 className="mb-1.5 text-base font-bold leading-snug text-slate-900 sm:text-lg">
                        {prayer.title}
                      </h3>
                      <p
                        className={`text-sm leading-6 text-slate-600 ${
                          isExpanded ? "" : "line-clamp-2"
                        }`}
                      >
                        {prayer.isLockedForPartner
                          ? `Surprise — locked until ${prayer.unlockAt ? formatDate(prayer.unlockAt) : "the reveal date"}.`
                          : prayer.description}
                      </p>
                    </div>

                    {!prayer.isLockedForPartner && <button
                      type="button"
                      onClick={() => toggleExpand(prayer.id)}
                      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-700"
                      aria-label={`${isExpanded ? "Collapse" : "Expand"} ${prayer.title}`}
                      aria-expanded={isExpanded}
                    >
                      {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </button>}
                    </div>

                    <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                      <button
                        type="button"
                        onClick={() => handleTogglePrayed(prayer, "you")}
                        disabled={!canTrack}
                        aria-pressed={Boolean(prayer.isPartner ? prayer.partnerPrayed : prayer.youPrayed)}
                        className={`flex min-h-10 items-center gap-2 rounded-full px-3.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${(prayer.isPartner ? prayer.partnerPrayed : prayer.youPrayed) ? "bg-rose-100 text-rose-700" : "bg-slate-50 text-slate-600 hover:bg-rose-50 hover:text-rose-700"}`}
                      >
                        <span className={`flex h-5 w-5 items-center justify-center rounded-full ${(prayer.isPartner ? prayer.partnerPrayed : prayer.youPrayed) ? "bg-rose-500 text-white" : "border border-slate-300 bg-white"}`}>
                          {(prayer.isPartner ? prayer.partnerPrayed : prayer.youPrayed) && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                        </span>
                        You prayed
                      </button>
                      {!prayer.isPartner && <button
                        type="button"
                        onClick={() => handleTogglePrayed(prayer, "partner")}
                        disabled={!canTrack}
                        aria-pressed={Boolean(prayer.partnerPrayed)}
                        className={`flex min-h-10 items-center gap-2 rounded-full px-3.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${prayer.partnerPrayed ? "bg-amber-100 text-amber-800" : "bg-slate-50 text-slate-600 hover:bg-amber-50 hover:text-amber-800"}`}
                      >
                        <span className={`flex h-5 w-5 items-center justify-center rounded-full ${prayer.partnerPrayed ? "bg-amber-500 text-white" : "border border-slate-300 bg-white"}`}>
                          {prayer.partnerPrayed && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                        </span>
                        Partner prayed
                      </button>}
                      <span className="ml-auto flex items-center gap-1.5 text-xs font-medium text-slate-500">
                        <Heart className="h-3.5 w-3.5 text-rose-500" aria-hidden="true" />
                        {prayerCount} praying
                      </span>
                    </div>
                  </div>

                  {isExpanded && canManage && (
                    <div className="grid grid-cols-3 gap-2 border-t border-slate-100 bg-slate-50/70 p-3 sm:px-5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(prayer)}
                        className="rounded-full border-slate-200 bg-white text-xs"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleToggleAnswered(prayer)
                        }
                        className="rounded-full border-slate-200 bg-white text-xs"
                      >
                        {prayer.isAnswered
                          ? "Mark Active"
                          : t.prayer.markAnswered}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm("Delete this prayer?")) {
                            onDeletePrayer(prayer.id);
                          }
                        }}
                        className="rounded-full border-slate-200 bg-white text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        Delete
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
        <DialogContent className="max-h-[92dvh] gap-0 overflow-y-auto rounded-[1.75rem] border-rose-100 p-0 sm:max-w-xl">
          <DialogHeader className="border-b border-rose-100 bg-gradient-to-br from-rose-50 via-white to-amber-50 px-6 py-6 pr-12 text-left">
            <DialogTitle className="text-2xl font-bold text-slate-900">
              {editingPrayer
                ? "Edit Prayer"
                : "New Prayer Request"}
            </DialogTitle>
            <DialogDescription className="leading-6 text-slate-600">
              Create a space to return to this prayer together.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5 p-6">
            {/* Category Selection */}
            <div className="space-y-2">
              <Label>Category</Label>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    aria-pressed={category === cat.value}
                    className={`flex min-h-20 flex-col items-center justify-center rounded-xl border p-3 transition-all ${
                      category === cat.value
                        ? "border-rose-300 bg-rose-50 text-rose-800 shadow-sm"
                        : "border-slate-200 bg-white text-slate-700 hover:border-rose-200 hover:bg-rose-50/50"
                    }`}
                  >
                    <span className="text-2xl mb-1">
                      {cat.emoji}
                    </span>
                    <span className="text-xs text-center leading-tight">
                      {cat.value}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">{t.prayer.requestTitle}</Label>
              <Input
                id="title"
                placeholder="What are you praying for?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="h-11 rounded-xl border-slate-200 focus-visible:ring-rose-400"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Details</Label>
              <Textarea
                id="description"
                placeholder="Share more about this prayer request..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                required
                className="rounded-xl border-slate-200 focus-visible:ring-rose-400"
              />
            </div>

            {/* Reminder Date */}
            <div className="space-y-2">
              <Label htmlFor="reminder">
                <Bell className="w-4 h-4 inline mr-1" />
                Set Reminder (Optional)
              </Label>
              <Input
                id="reminder"
                type="date"
                value={reminderDate}
                onChange={(e) =>
                  setReminderDate(e.target.value)
                }
                min={new Date().toISOString().split("T")[0]}
                className="h-11 rounded-xl border-slate-200 focus-visible:ring-rose-400"
              />
            </div>

            <div className="space-y-3 rounded-2xl border border-violet-100 bg-violet-50/50 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label htmlFor="partner-sharing" className="cursor-pointer font-medium">Share with Partner</Label>
                  <p className="mt-1 text-xs text-slate-500">Turn this off to keep the prayer in your private list.</p>
                </div>
                <Switch id="partner-sharing" checked={isSharedWithPartner} onCheckedChange={(checked) => { setIsSharedWithPartner(checked); if (!checked) { setIsSurprise(false); setIsSharedWithCommunity(false); } }} />
              </div>
              {isSharedWithPartner && (
                <>
                  <div className="flex items-center justify-between gap-4 border-t border-violet-100 pt-3">
                    <div>
                      <Label htmlFor="surprise-lock" className="cursor-pointer font-medium">Make it a surprise</Label>
                      <p className="mt-1 text-xs text-slate-500">Your partner sees only a locked surprise until the date.</p>
                    </div>
                    <Switch id="surprise-lock" checked={isSurprise} onCheckedChange={setIsSurprise} />
                  </div>
                  {isSurprise && <div className="space-y-2"><Label htmlFor="prayer-unlock">Unlock date</Label><Input id="prayer-unlock" type="date" required value={unlockAt} min={new Date().toISOString().slice(0, 10)} onChange={(event) => setUnlockAt(event.target.value)} className="h-11 rounded-xl bg-white" /></div>}
                </>
              )}
            </div>

            {/* Community Sharing */}
            <div className="flex items-center justify-between rounded-2xl border border-rose-100 bg-gradient-to-r from-rose-50 to-amber-50 p-4">
              <div className="flex-1">
                <Label
                  htmlFor="community"
                  className="cursor-pointer font-medium"
                >
                  Share with Community
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Allow other couples to see and pray for this
                  request
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
                className="rounded-full"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="rounded-full bg-rose-600 px-6 text-white shadow-sm hover:bg-rose-700"
              >
                {isLoading
                  ? "Saving..."
                  : editingPrayer
                    ? "Update"
                    : "Add Prayer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
