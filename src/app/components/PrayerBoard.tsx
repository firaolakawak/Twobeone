import { useState, useEffect } from "react";
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
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Bell,
  Search,
  SlidersHorizontal,
  Users,
  Circle,
  CheckCircle2,
  Calendar,
  MessageCircle,
  Home,
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
  onBackToHome,
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
    setIsOpen(true);
  };

  const handleTogglePrayed = async (
    prayer: Prayer,
    isPrayer: "you" | "partner",
  ) => {
    // Can't modify community prayers from others
    if (prayer.isCommunity) return;

    try {
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
        !prayer.description.toLowerCase().includes(query)
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
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-card border-b">
        {/* Tabs */}
        <div className="flex items-center border-b">
          <button
            onClick={() => setActiveTab("requests")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium relative ${
              activeTab === "requests"
                ? "text-primary-700"
                : "text-muted-foreground"
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            {t.prayer.prayerRequests}
            {activeTab === "requests" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-700"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab("answered")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium relative ${
              activeTab === "answered"
                ? "text-primary-700"
                : "text-muted-foreground"
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            {t.prayer.answered}
            {activeTab === "answered" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-700"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab("together")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium relative ${
              activeTab === "together"
                ? "text-primary-700"
                : "text-muted-foreground"
            }`}
          >
            <Heart className="w-4 h-4" />
            {t.prayer.together}
            {activeTab === "together" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-700"></div>
            )}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 py-3 bg-card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t.prayer.searchPrayers}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-muted border-0"
          />
        </div>
      </div>

      {/* Prayer List */}
      <div className="px-4 py-4 space-y-3">
        {!hasPartner && activeTab === "together" ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
              <Users className="w-10 h-10 text-primary-400" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">
              Connect with Your Partner
            </h3>
            <p className="text-sm text-muted-foreground mb-6 px-6">
              Prayer sharing is available when you're connected
              as a couple. Share your invite code or enter your
              partner's code to start praying together.
            </p>
          </div>
        ) : filteredPrayers.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Heart className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">
              {activeTab === "together"
                ? t.prayer.prayTogether
                : activeTab === "answered"
                  ? t.prayer.answered
                  : t.prayer.noRequests}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              {activeTab === "together"
                ? "Pray together as a couple to strengthen your bond"
                : activeTab === "answered"
                  ? "Answered prayers will appear here"
                  : "Start by adding a prayer request"}
            </p>
          </div>
        ) : (
          filteredPrayers.map((prayer) => {
            const catData = getCategoryData(prayer.category);
            const canEdit = !prayer.isCommunity; // Both partners can edit their shared prayers
            const isExpanded = expandedCards.has(prayer.id);
            const prayerCount =
              (prayer.youPrayed ? 1 : 0) +
              (prayer.partnerPrayed ? 1 : 0);

            return (
              <Card
                key={prayer.id}
                className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow"
              >
                <CardContent className="p-0">
                  <div className="flex items-start gap-3 p-4">
                    {/* Category Icon */}
                    <div
                      className={`flex-shrink-0 w-12 h-12 rounded-full ${catData.color} flex items-center justify-center text-white text-xl`}
                    >
                      {catData.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Title */}
                      <h3 className="font-semibold text-foreground mb-1 leading-tight">
                        {prayer.title}
                      </h3>

                      {/* Description */}
                      <p
                        className={`text-sm text-muted-foreground leading-relaxed ${
                          isExpanded ? "" : "line-clamp-2"
                        }`}
                      >
                        {prayer.description}
                      </p>

                      {/* Meta Info */}
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(prayer.createdAt)}
                        </span>
                        <span>•</span>
                        <span>
                          {prayerCount} prayer
                          {prayerCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>

                    {/* Right Side Actions */}
                    <div className="flex-shrink-0 flex flex-col items-end gap-2">
                      {/* Prayer Status Circles */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            handleTogglePrayed(prayer, "you")
                          }
                          disabled={!canEdit}
                          className="flex flex-col items-center gap-1 disabled:opacity-50"
                        >
                          {prayer.youPrayed ? (
                            <div className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full border-2 border-border"></div>
                          )}
                          <span className="text-xs text-muted-foreground">
                            You
                          </span>
                        </button>

                        <button
                          onClick={() =>
                            handleTogglePrayed(
                              prayer,
                              "partner",
                            )
                          }
                          disabled={!canEdit}
                          className="flex flex-col items-center gap-1 disabled:opacity-50"
                        >
                          {prayer.partnerPrayed ? (
                            <div className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full border-2 border-border"></div>
                          )}
                          <span className="text-xs text-muted-foreground">
                            Partner
                          </span>
                        </button>
                      </div>

                      {/* Expand Button */}
                      <button
                        onClick={() => toggleExpand(prayer.id)}
                        className="text-muted-foreground hover:text-muted-foreground"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Actions */}
                  {isExpanded && canEdit && (
                    <div className="px-4 pb-4 pt-2 border-t border-border flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(prayer)}
                        className="flex-1 text-xs"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleToggleAnswered(prayer)
                        }
                        className="flex-1 text-xs"
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
                        className="flex-1 text-xs text-error-500 hover:text-error-700"
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

      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-40 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-warning-500 to-warning-500 shadow-lg flex items-center justify-center text-white hover:shadow-xl transition-shadow z-50"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Add/Edit Prayer Dialog */}
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>
              {editingPrayer
                ? "Edit Prayer"
                : "New Prayer Request"}
            </DialogTitle>
            <DialogDescription>
              {t.prayer.prayerRequests}. 
              together as a couple.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Category Selection */}
            <div className="space-y-2">
              <Label>Category</Label>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                      category === cat.value
                        ? `border-primary-500 bg-primary-50 scale-105`
                        : "border-border hover:border-primary-300"
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
              />
            </div>

            {/* Community Sharing */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-sky-50 to-sky-100 rounded-lg border border-sky-200">
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
                onCheckedChange={setIsSharedWithCommunity}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800"
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