import { formatUiDate, formatUiTime } from '../utils/uiDateTime';
import { useUiCopy, UI_LOCALES } from '../utils/uiTranslation';
import { journalUiMessages } from '../locales/journalUi';
import { LoadingMark } from './BrandLoader';
import { useState, useRef } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "./ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./ui/tabs";
import {
  Plus,
  Image as ImageIcon,
  Video,
  Mic,
  Calendar,
  X,
  Edit2,
  MessageCircle,
  Send,
  Trash2,
  MapPin,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  Search,
  Heart,
  Sparkles,
} from "lucide-react";
import { JournalEntry } from "../types";
import { toast } from "sonner";

interface EnhancedJournalProps {
  entries: JournalEntry[];
  onAddEntry: (entry: any) => Promise<void>;
  onUpdateEntry?: (id: string, entry: any) => Promise<void>;
  onDeleteEntry?: (id: string) => Promise<void>;
  userName?: string;
  partnerName?: string;
  userAvatar?: string;
  partnerAvatar?: string;
  accessToken: string;
  onBackToHome?: () => void;
}

interface MediaFile {
  type: "image" | "video" | "audio";
  file: File;
  preview: string;
  name: string;
}

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
}

export function EnhancedJournal({
  entries,
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry,
  userName = "You",
  partnerName = "Partner",
  userAvatar,
}: EnhancedJournalProps) {
  const tr = useUiCopy(journalUiMessages);
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [entryType, setEntryType] = useState<
    "journal" | "event"
  >("journal");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [editingEntry, setEditingEntry] =
    useState<JournalEntry | null>(null);
  const [commentingEntry, setCommentingEntry] =
    useState<JournalEntry | null>(null);
  const [commentText, setCommentText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [entryFilter, setEntryFilter] = useState<
    "all" | "journal" | "event"
  >("all");

  // Form fields
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [location, setLocation] = useState("");
  const [emoji, setEmoji] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(
    new Date(),
  );
  const [isShared, setIsShared] = useState(true);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);

  // Lightbox state
  const [lightboxImages, setLightboxImages] = useState<
    string[]
  >([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const openLightbox = (images: string[], index: number) => {
    setLightboxImages(images);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };
  const closeLightbox = () => setLightboxOpen(false);
  const prevImage = () =>
    setLightboxIndex(
      (i) =>
        (i - 1 + lightboxImages.length) % lightboxImages.length,
    );
  const nextImage = () =>
    setLightboxIndex((i) => (i + 1) % lightboxImages.length);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const commonEmojis = [
    "❤️",
    "😊",
    "🎉",
    "✨",
    "🙏",
    "💑",
    "💍",
    "🎂",
    "🌟",
    "🎊",
    "💕",
    "🌹",
  ];

  const handleFileUpload = async (
    files: FileList | null,
    type: "image" | "video",
  ) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    if (file.size > 50 * 1024 * 1024) {
      toast.error(tr("File size must be less than 50MB"));
      return;
    }

    const validTypes =
      type === "image"
        ? ["image/jpeg", "image/png", "image/gif", "image/webp"]
        : ["video/mp4", "video/webm", "video/quicktime"];

    if (!validTypes.includes(file.type)) {
      toast.error(tr(type === 'image' ? 'Invalid photo format' : 'Invalid video format'));
      return;
    }

    const preview = URL.createObjectURL(file);
    setMediaFiles((prev) => [
      ...prev,
      { type, file, preview, name: file.name },
    ]);
    toast.success(
      tr(type === 'image' ? 'Photo added!' : 'Video added!'),
    );
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const audioFile = new File(
          [audioBlob],
          `voice-note-${Date.now()}.webm`,
          { type: "audio/webm" },
        );
        const preview = URL.createObjectURL(audioBlob);

        setMediaFiles((prev) => [
          ...prev,
          {
            type: "audio",
            file: audioFile,
            preview,
            name: audioFile.name,
          },
        ]);

        toast.success(tr("Voice note recorded!"));
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Failed to start recording:", error);
      toast.error(tr("Failed to access microphone"));
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const removeMedia = (index: number) => {
    setMediaFiles((prev) => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const uploadMediaFiles = async (): Promise<
    Array<{ type: string; url: string; name: string }>
  > => {
    if (mediaFiles.length === 0) return [];
    const uploadedFiles = [];

    for (const mediaFile of mediaFiles) {
      try {
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () =>
            resolve(reader.result as string);
          reader.readAsDataURL(mediaFile.file);
        });
        uploadedFiles.push({
          type: mediaFile.type,
          url: base64,
          name: mediaFile.name,
        });
      } catch (error) {
        console.error("Upload error:", error);
        toast.error(tr('Failed to process {name}', { name: mediaFile.name }));
      }
    }
    return uploadedFiles;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const uploadedMedia = await uploadMediaFiles();
      const entryData = {
        title,
        content,
        location: location || undefined,
        emoji: emoji || undefined,
        entryType,
        isShared,
        createdAt: selectedDate.toISOString(),
        ...(uploadedMedia.length > 0
          ? { mediaFiles: uploadedMedia }
          : {}),
      };

      if (editingEntry) {
        await onUpdateEntry?.(editingEntry.id, entryData);
        toast.success(tr("Entry updated!"));
      } else {
        await onAddEntry(entryData);
        toast.success(tr("Entry saved!"));
      }

      resetForm();
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to save entry:", error);
      toast.error(tr("Failed to save entry"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !commentingEntry) return;

    try {
      const comment: Comment = {
        id: `comment:${Date.now()}`,
        userId: "current-user",
        userName: userName,
        userAvatar: userAvatar,
        content: commentText,
        createdAt: new Date().toISOString(),
      };

      const updatedComments = [
        ...(commentingEntry.comments || []),
        comment,
      ];
      await onUpdateEntry?.(commentingEntry.id, {
        comments: updatedComments,
      });
      setCommentText("");
      toast.success(tr("Comment added!"));
    } catch (error) {
      console.error("Failed to add comment:", error);
      toast.error(tr("Failed to add comment"));
    }
  };

  const handleEdit = (entry: JournalEntry) => {
    if ((entry as any).isPartner) {
      toast.error(tr("You can't edit your partner's entries"));
      return;
    }

    setEditingEntry(entry);
    setTitle(entry.title);
    setContent(entry.content || "");
    setLocation((entry as any).location || "");
    setEmoji((entry as any).emoji || "");
    setEntryType((entry as any).entryType || "journal");
    setIsShared(entry.isShared);
    setSelectedDate(new Date(entry.createdAt));
    setIsOpen(true);
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setLocation("");
    setEmoji("");
    setIsShared(true);
    setMediaFiles([]);
    setSelectedDate(new Date());
    setEditingEntry(null);
    setEntryType("journal");
  };

  const validEntries = entries.filter(
    (entry) =>
      entry.title || entry.content || (entry as any).emoji,
  );
  const visibleEntries = validEntries.filter((entry) => {
    const type = (entry as any).entryType || "journal";
    if (entryFilter !== "all" && type !== entryFilter) return false;
    if (!searchQuery.trim()) return true;
    const query = searchQuery.trim().toLowerCase();
    return [entry.title, entry.content, (entry as any).location]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  });

  const groupedEntries = visibleEntries
    .filter((entry) => {
      const hasContent =
        entry.title || entry.content || (entry as any).emoji;
      const hasValidDate =
        entry.createdAt &&
        !isNaN(new Date(entry.createdAt).getTime());
      return hasContent && hasValidDate;
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime(),
    )
    .reduce(
      (acc, entry) => {
        const date = new Date(entry.createdAt);
        const dateKey = date.toISOString().split("T")[0];
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(entry);
        return acc;
      },
      {} as Record<string, JournalEntry[]>,
    );

  const sortedDateKeys = Object.keys(groupedEntries).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime(),
  );
  const sharedEntryCount = validEntries.filter(
    (entry) => entry.isShared,
  ).length;
  const eventEntryCount = validEntries.filter(
    (entry) => (entry as any).entryType === "event",
  ).length;

  const openEntryForm = () => {
    resetForm();
    setIsOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 selection:bg-rose-200 dark:bg-neutral-950 dark:text-neutral-50">
      <main className="mx-auto w-full max-w-3xl space-y-7 px-4 pb-32 pt-5 sm:px-6 sm:pt-8">
        <header className="relative isolate overflow-hidden rounded-[2rem] bg-gradient-to-br from-rose-50 via-white to-amber-50 px-6 py-7 shadow-[0_18px_55px_-38px_rgba(190,24,93,0.45)] ring-1 ring-rose-100/80 sm:px-9 sm:py-9">
          <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-rose-200/30 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-52 w-52 rounded-full bg-amber-200/30 blur-3xl" aria-hidden="true" />
          <div className="relative">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="tbo-caption mb-4 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-rose-700 shadow-sm ring-1 ring-rose-100">
                  <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" aria-hidden="true" />

                  {tr("Our story, held with care")}
                </div>
                <h1 className="tbo-page-title break-words text-slate-950">{t.journal.title}</h1>
                <p className="tbo-supporting mt-2 max-w-lg text-slate-600">{tr("Capture the reflections, milestones, and little moments shaping your life together.")}</p>
              </div>
              <Button type="button" onClick={openEntryForm} className="tbo-action min-h-11 h-auto whitespace-normal rounded-full bg-rose-600 px-5 text-white shadow-lg shadow-rose-200 hover:bg-rose-700">
                <Plus className="h-4 w-4" aria-hidden="true" />
                {t.journal.newEntry}
              </Button>
            </div>
            <div className="mt-7 grid grid-cols-3 gap-3 border-t border-rose-100/80 pt-5 [overflow-wrap:anywhere]">
              <div><p className="text-xl font-bold text-slate-900">{validEntries.length}</p><p className="tbo-caption mt-0.5 text-slate-500">{tr("Entries")}</p></div>
              <div className="border-l border-rose-100 pl-3"><p className="text-xl font-bold text-slate-900">{sharedEntryCount}</p><p className="tbo-caption mt-0.5 text-slate-500">{tr("Shared")}</p></div>
              <div className="border-l border-rose-100 pl-3"><p className="text-xl font-bold text-slate-900">{eventEntryCount}</p><p className="tbo-caption mt-0.5 text-slate-500">{tr("Moments")}</p></div>
            </div>
          </div>
        </header>

        <section className="space-y-5" aria-label={tr("Journal controls")}>
          <div className="grid min-h-14 grid-cols-3 gap-1 rounded-[1.25rem] border border-slate-200/80 bg-slate-100/70 p-1.5 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04),0_10px_30px_-24px_rgba(15,23,42,0.45)]" role="tablist" aria-label={tr("Journal entry types")}>
            {([
              { value: "all", label: tr("All Entries"), icon: BookOpen },
              { value: "journal", label: tr("Reflections"), icon: Heart },
              { value: "event", label: tr("Moments"), icon: Sparkles },
            ] as const).map(({ value, label, icon: Icon }) => (
              <button key={value} type="button" role="tab" aria-label={label} aria-selected={entryFilter === value} onClick={() => setEntryFilter(value)} className={`tbo-action flex min-h-11 min-w-0 flex-wrap items-center justify-center gap-2 rounded-[0.9rem] px-2 py-2 [overflow-wrap:anywhere] transition-all ${entryFilter === value ? "bg-white text-rose-700 shadow-sm ring-1 ring-rose-100" : "text-slate-500 hover:bg-white/65 hover:text-slate-800"}`}>
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">{label}</span><span className="sm:hidden">{value === "all" ? tr("All") : label}</span>
              </button>
            ))}
          </div>

          <div className="relative" role="search">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <Input type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Escape") setSearchQuery(""); }} placeholder={t.journal.searchPlaceholder} aria-label={tr("Search journal entries")} className="tbo-field h-12 rounded-2xl border-slate-200 bg-white pl-11 pr-11 shadow-[0_8px_25px_-22px_rgba(15,23,42,0.55)] placeholder:text-slate-400 focus-visible:border-rose-300 focus-visible:ring-4 focus-visible:ring-rose-100" />
            {searchQuery && <button type="button" onClick={() => setSearchQuery("")} className="tbo-action absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label={tr("Clear journal search")}><X className="h-4 w-4" aria-hidden="true" /></button>}
          </div>
        </section>

        <section aria-label={tr("Journal timeline")}>
        {sortedDateKeys.map((dateKey) => {
          const date = new Date(dateKey);
          const month = formatUiDate(date, UI_LOCALES[language], {
            month: "long",
          });
          const day = date.getDate();
          const year = date.getFullYear();
          const dayOfWeek = formatUiDate(date, UI_LOCALES[language], {
            weekday: "long",
          });

          return (
            <div key={dateKey} className="mb-10 last:mb-0">
              {/* Date Header Segment */}
              <div className="sticky top-0 z-20 mb-6 flex items-center gap-4 rounded-2xl bg-slate-50/90 py-2 backdrop-blur-sm dark:bg-neutral-950/90">
                <div className="flex h-14 w-14 flex-col items-center justify-center rounded-2xl bg-rose-50 text-rose-700 shadow-sm ring-1 ring-rose-100 dark:bg-rose-500/20 dark:text-rose-300">
                  <span className="tbo-eyebrow opacity-80">
                    {month.slice(0, 3)}
                  </span>
                  <span className="text-xl font-bold leading-none">
                    {day}
                  </span>
                </div>
                <div>
                  <h3 className="tbo-card-title">
                    {dayOfWeek}
                  </h3>
                  <p className="tbo-caption text-muted-foreground">
                    {month} {day}, {year}
                  </p>
                </div>
              </div>

              {/* Entries Stack */}
              <div className="relative ml-7 space-y-6 border-l border-rose-200/70 pl-6 dark:border-neutral-800">
                {groupedEntries[dateKey].map((entry) => {
                  const isEvent =
                    (entry as any).entryType === "event";
                  const emoji = (entry as any).emoji;
                  const location = (entry as any).location;
                  const isPartner = (entry as any).isPartner;
                  const entryDate = new Date(entry.createdAt);
                  const timeStr = formatUiTime(entryDate, UI_LOCALES[language], {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    });
                  const imageMedia = entry.mediaFiles?.find(
                    (m) => m.type === "image",
                  );

                  return (
                    <div
                      key={entry.id}
                      className="relative group transition-all duration-300"
                    >
                      {/* Timeline Indicator Node */}
                      <div className="absolute -left-[31px] top-6 h-2.5 w-2.5 rounded-full border-2 border-rose-500 bg-white shadow-sm transition-colors duration-300 group-hover:bg-rose-500" />

                      <Card className="overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white shadow-[0_12px_36px_-28px_rgba(15,23,42,0.45)] transition-all duration-300 hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-[0_18px_42px_-26px_rgba(190,24,93,0.3)] dark:border-neutral-800/60 dark:bg-neutral-900">
                        {/* Hero Block Media */}
                        {imageMedia && imageMedia.url && (
                          <div
                            className="relative w-full h-48 sm:h-64 bg-muted overflow-hidden group/img cursor-pointer"
                            onClick={() =>
                              openLightbox([imageMedia.url], 0)
                            }
                          >
                            <img
                              src={imageMedia.url}
                              alt={entry.title}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                              <ZoomIn className="w-6 h-6 text-white drop-shadow" />
                            </div>
                            {emoji && (
                              <div className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-background/90 backdrop-blur-md flex items-center justify-center text-xl shadow-md border border-neutral-200/20">
                                {emoji}
                              </div>
                            )}
                          </div>
                        )}

                        <CardContent className="p-5 sm:p-6">
                          {/* Badges Stack */}
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            {isEvent && !imageMedia && (
                              <span className="text-2xl mr-1">
                                {emoji || "📝"}
                              </span>
                            )}
                            <span
                              className={`tbo-caption inline-flex items-center px-2.5 py-0.5 rounded-full border ${
                                isEvent
                                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                                  : "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border-rose-100 dark:border-rose-500/20"
                              }`}
                            >
                              {isEvent
                                ? tr("✨ Event")
                                : tr("📖 Journal")}
                            </span>
                            {isPartner && (
                              <span className="tbo-caption inline-flex items-center px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                💖 {partnerName}
                              </span>
                            )}
                          </div>

                          <h3 className="tbo-card-title break-words text-foreground mb-2">
                            {entry.title}
                          </h3>

                          {/* Metadata Row */}
                          <div className="tbo-caption flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground mb-4">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {timeStr}
                            </span>
                            {location && (
                              <>
                                <span className="opacity-40">
                                  •
                                </span>
                                <span className="flex items-center gap-1 max-w-[180px] truncate">
                                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                                  {location}
                                </span>
                              </>
                            )}
                          </div>

                          {entry.content && (
                            <p className="tbo-body break-words text-neutral-600 dark:text-neutral-300 whitespace-pre-wrap mb-4">
                              {entry.content}
                            </p>
                          )}

                          {/* Grid for Additional Pictures */}
                          {(() => {
                            const imgs =
                              entry.mediaFiles?.filter(
                                (m) => m.type === "image",
                              ) ?? [];
                            if (imgs.length <= 1) return null;
                            const shown = imgs.slice(1, 4);
                            const extra = imgs.length - 4;
                            return (
                              <div className="grid grid-cols-3 gap-2 mb-4">
                                {shown.map((img, idx) => (
                                  <div
                                    key={idx}
                                    className="relative rounded-xl overflow-hidden aspect-square cursor-pointer group/thumb border border-muted"
                                    onClick={() =>
                                      openLightbox(
                                        imgs.map((i) => i.url),
                                        idx + 1,
                                      )
                                    }
                                  >
                                    <img
                                      src={img.url}
                                      alt=""
                                      className="w-full h-full object-cover transition duration-300 group-hover/thumb:scale-105"
                                    />
                                    {idx === 2 && extra > 0 && (
                                      <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center">
                                        <span className="tbo-label text-white">
                                          +{extra}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            );
                          })()}

                          {/* Non-image Media components */}
                          {entry.mediaFiles &&
                            entry.mediaFiles.filter(
                              (m) => m.type !== "image",
                            ).length > 0 && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                                {entry.mediaFiles
                                  .filter(
                                    (m) => m.type !== "image",
                                  )
                                  .map((media, idx) => (
                                    <div
                                      key={idx}
                                      className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-3 flex items-center gap-2 bg-neutral-50/50 dark:bg-neutral-900/50"
                                    >
                                      <Mic className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                      <span className="tbo-caption text-muted-foreground truncate flex-1">
                                        {media.name}
                                      </span>
                                    </div>
                                  ))}
                              </div>
                            )}

                          {/* Render Comments */}
                          {entry.comments &&
                            entry.comments.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800 space-y-3">
                                {entry.comments
                                  .slice(0, 2)
                                  .map((comment: any) => (
                                    <div
                                      key={comment.id}
                                      className="flex gap-3 bg-muted/60 rounded-xl p-3 items-start"
                                    >
                                      <Avatar className="w-7 h-7 flex-shrink-0 ring-1 ring-border">
                                        <AvatarImage
                                          src={
                                            comment.userAvatar ||
                                            ""
                                          }
                                          alt={comment.userName}
                                        />
                                        <AvatarFallback className="bg-rose-500 text-[10px] text-white">
                                          {
                                            comment
                                              .userName?.[0]
                                          }
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1 min-w-0">
                                        <span className="tbo-caption block">
                                          {comment.userName}
                                        </span>
                                        <p className="tbo-caption text-muted-foreground mt-0.5">
                                          {comment.text ||
                                            comment.content}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            )}

                          {/* Component Card Interface Toolbar */}
                          <div className="flex items-center justify-end gap-1 pt-3 mt-4 border-t border-neutral-100 dark:border-neutral-800">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setCommentingEntry(entry)
                              }
                              className="tbo-action h-8 rounded-full px-3 text-muted-foreground hover:bg-rose-50 hover:text-rose-700 dark:hover:text-rose-400"
                            >
                              <MessageCircle className="w-4 h-4 mr-1.5" />

                              {tr("Comment")}
                            </Button>
                            {!isPartner && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleEdit(entry)
                                  }
                                  className="tbo-action h-8 rounded-full px-3 text-muted-foreground hover:bg-slate-100 hover:text-foreground"
                                >
                                  <Edit2 className="w-4 h-4 mr-1.5" />

                                  {tr("Edit")}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={async () => {
                                    if (
                                      confirm(
                                        tr("Delete this entry?"),
                                      )
                                    )
                                      await onDeleteEntry?.(
                                        entry.id,
                                      );
                                  }}
                                  className="tbo-action h-8 rounded-full px-3 text-muted-foreground hover:bg-red-50 hover:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4 mr-1.5" />

                                  {tr("Delete")}
                                </Button>
                              </>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {visibleEntries.length === 0 && (
          <div className="mx-auto max-w-sm rounded-[2rem] border border-rose-100 bg-gradient-to-br from-white to-rose-50/60 px-8 py-14 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-600">
              {searchQuery ? <Search className="h-6 w-6" /> : <BookOpen className="h-6 w-6" />}
            </div>
            <h3 className="tbo-card-title mb-2 text-slate-900">
              {searchQuery ? tr("No matching entries") : entryFilter === "event" ? tr("No moments yet") : t.journal.noEntries}
            </h3>
            <p className="tbo-supporting mb-6 text-slate-500">
              {searchQuery ? tr("Try another title, detail, or location.") : tr("Start documenting your shared faith journey and the moments you want to remember.")}
            </p>
            {searchQuery ? (
              <Button type="button" variant="ghost" onClick={() => setSearchQuery("")} className="tbo-action rounded-full text-rose-700 hover:bg-rose-100/70 hover:text-rose-800">{tr("Clear search")}</Button>
            ) : (
              <Button type="button" onClick={openEntryForm} className="tbo-action rounded-full bg-rose-600 px-5 text-white hover:bg-rose-700"><Plus className="h-4 w-4" />  {tr("Create First Entry")}</Button>
            )}
          </div>
        )}
        </section>
      </main>

      {/* Modal Composition Framework */}
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-h-[92dvh] gap-0 overflow-y-auto rounded-[1.75rem] border-rose-100 p-0 sm:max-w-xl">
          <DialogHeader className="border-b border-rose-100 bg-gradient-to-br from-rose-50 via-white to-amber-50 px-6 py-6 pr-12 text-left">
            <DialogTitle className="tbo-dialog-title text-slate-900">
              {editingEntry
                ? t.journal.edit
                : t.journal.newEntry}
            </DialogTitle>
            <DialogDescription className="tbo-supporting text-slate-600">
              {entryType === "journal"
                ? tr("Write what is on your heart and choose whether to share it.")
                : tr("Preserve a meaningful moment in your story together.")}
            </DialogDescription>
          </DialogHeader>

          <Tabs
            value={entryType}
            onValueChange={(v) =>
              setEntryType(v as "journal" | "event")
            }
            className="w-full p-6"
          >
            <TabsList className="grid h-12 w-full grid-cols-2 rounded-2xl bg-slate-100 p-1">
              <TabsTrigger
                value="journal"
                className="tbo-action rounded-xl py-2 data-[state=active]:text-rose-700 data-[state=active]:shadow-sm"
              >
                {t.journal.title}
              </TabsTrigger>
              <TabsTrigger
                value="event"
                className="tbo-action rounded-xl py-2 data-[state=active]:text-rose-700 data-[state=active]:shadow-sm"
              >

                {tr("Event")}
              </TabsTrigger>
            </TabsList>

            <form
              onSubmit={handleSubmit}
              className="mt-5 space-y-5"
            >
              {/* Chronological Configurations Segment */}
              <div className="grid grid-cols-2 gap-3 rounded-2xl border border-rose-100 bg-gradient-to-r from-rose-50/70 to-amber-50/70 p-4">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="date"
                    className="tbo-label text-muted-foreground"
                  >

                    {tr("Date")}
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={
                      selectedDate &&
                      !isNaN(selectedDate.getTime())
                        ? selectedDate
                            .toISOString()
                            .split("T")[0]
                        : new Date().toISOString().split("T")[0]
                    }
                    onChange={(e) => {
                      const [year, month, day] = e.target.value
                        .split("-")
                        .map(Number);
                      const newDate = new Date(selectedDate);
                      newDate.setFullYear(year);
                      newDate.setMonth(month - 1);
                      newDate.setDate(day);
                      setSelectedDate(newDate);
                    }}
                    className="tbo-field h-10 rounded-xl border-slate-200 bg-white shadow-none focus-visible:ring-rose-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="time"
                    className="tbo-label text-muted-foreground"
                  >

                    {tr("Time")}
                  </Label>
                  <Input
                    id="time"
                    type="time"
                    value={`${String(selectedDate.getHours()).padStart(2, "0")}:${String(selectedDate.getMinutes()).padStart(2, "0")}`}
                    onChange={(e) => {
                      const newDate = new Date(selectedDate);
                      const [hours, minutes] = e.target.value
                        .split(":")
                        .map(Number);
                      newDate.setHours(hours);
                      newDate.setMinutes(minutes);
                      setSelectedDate(newDate);
                    }}
                    className="tbo-field h-10 rounded-xl border-slate-200 bg-white shadow-none focus-visible:ring-rose-400"
                  />
                </div>
              </div>

              {entryType === "event" && (
                <div className="space-y-2">
                  <Label className="tbo-label">

                    {tr("Select Event Emoji")}
                  </Label>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 border rounded-xl">
                    {commonEmojis.map((e) => (
                      <button
                        key={e}
                        type="button"
                        onClick={() => setEmoji(e)}
                        aria-pressed={emoji === e}
                        aria-label={tr('Use {emoji} for this moment', { emoji: e })}
                        className={`rounded-xl p-2 text-xl transition-all ${emoji === e ? "bg-rose-50 ring-1 ring-rose-300" : "hover:bg-slate-100"}`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label
                  htmlFor="title"
                  className="tbo-label"
                >

                  {tr("Title")}
                </Label>
                <Input
                  id="title"
                  placeholder={
                    entryType === "event"
                      ? tr("What milestone happened?")
                      : tr("What's on your heart?")
                  }
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="tbo-field h-11 rounded-xl border-slate-200 focus-visible:ring-rose-400"
                />
              </div>

              {entryType === "event" && (
                <div className="space-y-1.5">
                  <Label
                    htmlFor="location"
                    className="tbo-label"
                  >

                    {tr("Location")}{" "}
                    <span className="text-muted-foreground font-normal">

                      {tr("(Optional)")}
                    </span>
                  </Label>
                  <Input
                    id="location"
                    placeholder={tr("Where did this memory happen?")}
                    value={location}
                    onChange={(e) =>
                      setLocation(e.target.value)
                    }
                    className="tbo-field h-11 rounded-xl border-slate-200 focus-visible:ring-rose-400"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label
                  htmlFor="content"
                  className="tbo-label"
                >

                  {tr("Details")}
                </Label>
                <Textarea
                  id="content"
                  placeholder={tr("Reflect deeper here...")}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                  required={entryType === "journal"}
                  className="tbo-field resize-none rounded-xl border-slate-200 focus-visible:ring-rose-400"
                />
              </div>

              {/* Media Upload Interaction Array */}
              <div className="space-y-2">
                <Label className="tbo-label">

                  {tr("Attach Media")}
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                    className="tbo-action h-10 rounded-xl border-slate-200 hover:bg-rose-50 hover:text-rose-700"
                  >
                    <ImageIcon className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />{" "}

                    {tr("Photo")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      videoInputRef.current?.click()
                    }
                    className="tbo-action h-10 rounded-xl border-slate-200 hover:bg-rose-50 hover:text-rose-700"
                  >
                    <Video className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />{" "}

                    {tr("Video")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={
                      isRecording
                        ? stopRecording
                        : startRecording
                    }
                    className={`tbo-action h-10 rounded-xl ${isRecording ? "border-red-200 bg-red-50 text-red-600" : "border-slate-200 hover:bg-rose-50 hover:text-rose-700"}`}
                  >
                    <Mic
                      className={`w-3.5 h-3.5 mr-1.5 ${isRecording ? "animate-pulse text-destructive" : "text-muted-foreground"}`}
                    />
                    {isRecording ? tr("Stop") : tr("Voice")}
                  </Button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="tbo-field hidden"
                  onChange={(e) =>
                    handleFileUpload(e.target.files, "image")
                  }
                />
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  className="tbo-field hidden"
                  onChange={(e) =>
                    handleFileUpload(e.target.files, "video")
                  }
                />

                {mediaFiles.length > 0 && (
                  <div className="space-y-1.5 mt-2 max-h-32 overflow-y-auto border rounded-xl p-2">
                    {mediaFiles.map((media, index) => (
                      <div
                        key={index}
                        className="border border-neutral-100 dark:border-neutral-900 rounded-lg p-1.5 flex items-center justify-between gap-2 bg-muted/30"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {media.type === "image" && (
                            <img
                              src={media.preview}
                              alt=""
                              className="w-8 h-8 object-cover rounded-md"
                            />
                          )}
                          <span className="tbo-caption truncate max-w-[180px]">
                            {media.name}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeMedia(index)}
                          className="tbo-action h-6 w-6 rounded-md text-muted-foreground hover:text-foreground"
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Privacy Config Segment */}
              <div className="flex items-center justify-between rounded-2xl border border-rose-100 bg-gradient-to-r from-rose-50 to-amber-50 p-4">
                <Label
                  htmlFor="shared"
                  className="tbo-label cursor-pointer"
                >
                  {isShared
                    ? tr("Shared with Partner")
                    : tr("Private Entry")}
                </Label>
                <Switch
                  id="shared"
                  checked={isShared}
                  onCheckedChange={setIsShared}
                  className="data-[state=checked]:bg-rose-600"
                />
              </div>

              <DialogFooter className="pt-2 gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  className="tbo-action h-10 rounded-full"
                >

                  {tr("Cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="tbo-action h-10 rounded-full border-0 bg-rose-600 px-5 text-white shadow-sm hover:bg-rose-700"
                >
                  {isLoading && <LoadingMark />}
                  {isLoading
                    ? tr("Saving...")
                    : editingEntry
                      ? tr("Update")
                      : tr("Save Entry")}
                </Button>
              </DialogFooter>
            </form>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Comment Dialog Composition */}
      <Dialog
        open={!!commentingEntry}
        onOpenChange={(open) =>
          !open && setCommentingEntry(null)
        }
      >
        <DialogContent className="sm:max-w-[420px] rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="tbo-dialog-title">

              {tr("Add Thoughtful Comment")}
            </DialogTitle>
            <DialogDescription className="tbo-supporting truncate">
              {commentingEntry?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <Textarea
              placeholder={tr("Share your words of encouragement...")}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={3}
              className="tbo-field rounded-xl resize-none focus-visible:ring-orange-500"
            />
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCommentingEntry(null)}
                className="tbo-action rounded-lg"
              >

                {tr("Cancel")}
              </Button>
              <Button
                size="sm"
                onClick={handleAddComment}
                className="tbo-action rounded-lg px-4 bg-gradient-to-r from-orange-500 to-amber-600 text-white border-0 hover:opacity-95"
              >
                <Send className="w-3.5 h-3.5 mr-1.5" />  {tr("Send")}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pure Lightbox Engine */}
      {lightboxOpen && lightboxImages.length > 0 && (
        <div
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/95 backdrop-blur-sm animate-fade-in"
          onClick={closeLightbox}
        >
          <button
            className="absolute top-6 right-6 text-white/70 hover:text-white p-2.5 rounded-full bg-white/10 transition-colors"
            onClick={closeLightbox}
          >
            <X className="w-5 h-5" />
          </button>

          {lightboxImages.length > 1 && (
            <div className="absolute top-6 text-white/60 text-xs font-mono tracking-widest bg-white/5 px-3 py-1 rounded-full">
              {lightboxIndex + 1} / {lightboxImages.length}
            </div>
          )}

          <div
            className="relative max-w-[90vw] max-h-[75vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxImages[lightboxIndex]}
              alt=""
              className="max-h-[75vh] max-w-[90vw] object-contain rounded-xl shadow-2xl transition-all duration-300 select-none"
            />

            {lightboxImages.length > 1 && (
              <>
                <button
                  className="absolute -left-4 sm:-left-14 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition-all active:scale-90"
                  onClick={prevImage}
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  className="absolute -right-4 sm:-right-14 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition-all active:scale-90"
                  onClick={nextImage}
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
