import { formatUiDate } from '../utils/uiDateTime';
import { getNotificationCopy } from '../utils/notificationCopy';
import { notificationMessages } from '../locales/notification';
import { BrandLoader, LoadingMark } from './BrandLoader';
import { useUiCopy, UI_LOCALES } from '../utils/uiTranslation';
import { systemMessages } from '../locales/system';
import { useState, useEffect, useCallback, useRef } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import {
  Bell,
  X,
  Check,
  Heart,
  MessageCircle,
  Users,
  MessageSquareDot,
  Trash2,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { toast } from "sonner";

const notificationUiMessages = { ...systemMessages, ...notificationMessages };

interface Notification {
  id: string;
  recipientId: string;
  senderId: string;
  type:
    | "devotional"
    | "journal"
    | "prayer"
    | "question"
    | "question_answered"
    | "partner_link"
    | "mood_report"
    | "mood_analysis"
    | "chat"
    | "profile_update"
    | "general"
    | "partner_disconnect_request"
    | "partner_disconnect_agreed"
    | "partner_disconnect_cancelled"
    | "partner_disconnected"
    | "verse_shared"
    | "live_started";
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}

interface NotificationCenterProps {
  accessToken: string;
  projectId: string;
  publicAnonKey: string;
  onNotificationClick?: (notification: Notification) => void;
}

export function deduplicateDailyMoodReports(notifications: Notification[]): Notification[] {
  const seenDays = new Set<string>();
  return notifications.filter((notification) => {
    if (notification.type !== "mood_report") return true;
    const timestamp = new Date(notification.createdAt);
    const dayKey = Number.isNaN(timestamp.getTime())
      ? notification.createdAt
      : timestamp.toISOString().slice(0, 10);
    if (seenDays.has(dayKey)) return false;
    seenDays.add(dayKey);
    return true;
  });
}

export function NotificationCenter({
  accessToken,
  projectId,
  publicAnonKey,
  onNotificationClick,
}: NotificationCenterProps) {
  const tr = useUiCopy(notificationUiMessages);
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<
    Notification[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(!accessToken);
  const fetchVersion = useRef(0);

  const unreadCount = notifications.filter(
    (n) => !n.isRead,
  ).length;

  const fetchNotifications = useCallback(async () => {
    if (!accessToken) return;

    const version = ++fetchVersion.current;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/notifications`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          signal: controller.signal,
        },
      );

      if (version !== fetchVersion.current) return;
      if (!response.ok) {
        setNotifications([]);
        return;
      }

      const data = await response.json();
      if (version !== fetchVersion.current) return;
      setNotifications(
        deduplicateDailyMoodReports(data.notifications || []),
      );
    } catch {
      // Notifications are non-critical — fail silently
      if (version === fetchVersion.current) setNotifications([]);
    } finally {
      clearTimeout(timeout);
      if (version === fetchVersion.current) setHasLoaded(true);
    }
  }, [accessToken, projectId]);

  useEffect(() => {
    setNotifications([]);
    setHasLoaded(!accessToken);
    if (!accessToken) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 45000);
    return () => { clearInterval(interval); fetchVersion.current++; };
  }, [accessToken, fetchNotifications]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, isRead: true } : n,
        ),
      );

      try {
        await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/notifications/${notificationId}/read`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          },
        );
      } catch (err) {
        console.warn(
          "Mark-read failed for",
          notificationId,
          err,
        );
      }
    },
    [accessToken, projectId],
  );

  const deleteNotification = useCallback(
    async (notificationId: string) => {
      setNotifications((prev) =>
        prev.filter((n) => n.id !== notificationId),
      );

      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/notifications/${notificationId}`,
          {
            method: "DELETE",
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        );
        if (!response.ok) throw new Error("Delete failed");
        toast.success(t.notifications.removed);
      } catch (error) {
        console.error("Error deleting notification:", error);
        toast.error(t.notifications.removeFailed);
      }
    },
    [accessToken, projectId, t.notifications.removed, t.notifications.removeFailed],
  );

  const markAllAsRead = async () => {
    setIsLoading(true);
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, isRead: true })),
    );

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/notifications/read-all`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        },
      );
      if (!response.ok)
        throw new Error("Failed to mark all as read");
      toast.success(tr("All marked as read"));
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast.error(tr("Failed to update notifications"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationClick = (
    notification: Notification,
  ) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    setIsOpen(false);
    if (onNotificationClick) onNotificationClick(notification);
  };

  const getNotificationDetails = (type: string) => {
    const iconClass = "w-4 h-4";
    switch (type) {
      case "devotional":
        return {
          icon: (
            <Heart
              className={`${iconClass} fill-rose-600 text-rose-600`}
            />
          ),
          bg: "bg-rose-100 border border-rose-200",
        };
      case "journal":
        return {
          icon: (
            <MessageCircle
              className={`${iconClass} text-violet-600`}
            />
          ),
          bg: "bg-violet-100 border border-violet-200",
        };
      case "prayer":
        return {
          icon: (
            <Heart className={`${iconClass} text-pink-600`} />
          ),
          bg: "bg-pink-100 border border-pink-200",
        };
      case "question":
        return {
          icon: (
            <MessageCircle
              className={`${iconClass} text-emerald-600`}
            />
          ),
          bg: "bg-emerald-100 border border-emerald-200",
        };
      case "question_answered":
        return {
          icon: (
            <MessageSquareDot
              className={`${iconClass} text-teal-600`}
            />
          ),
          bg: "bg-teal-100 border border-teal-200",
        };
      case "partner_link":
        return {
          icon: (
            <Users className={`${iconClass} text-amber-700`} />
          ),
          bg: "bg-amber-100 border border-amber-200",
        };
      case "chat":
        return {
          icon: <MessageSquareDot className={`${iconClass} text-rose-600`} />,
          bg: "bg-rose-100 border border-rose-200",
        };
      default:
        return {
          icon: (
            <Bell className={`${iconClass} text-slate-700`} />
          ),
          bg: "bg-slate-100 border border-slate-200",
        };
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const diffInMs = Date.now() - date.getTime();
    const diffInMins = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMs / 3600000);
    const diffInDays = Math.floor(diffInMs / 86400000);
    if (diffInMins < 1) return t.time.justNow;
    if (diffInMins < 60) return tr(diffInMins === 1 ? "{count} minute ago" : "{count} minutes ago", { count: diffInMins });
    if (diffInHours < 24) return tr(diffInHours === 1 ? "{count} hour ago" : "{count} hours ago", { count: diffInHours });
    if (diffInDays < 7) return tr(diffInDays === 1 ? "{count} day ago" : "{count} days ago", { count: diffInDays });
    return formatUiDate(date, UI_LOCALES[language], {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <>
      {/* Bell Trigger */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="tbo-action app-icon-button relative grid h-11 w-11 place-items-center rounded-full text-slate-800 transition-all duration-200 hover:bg-slate-100 hover:text-slate-950 focus:outline-none"
        aria-label={tr("Notifications")}
      >
        <Bell className="h-6 w-6 stroke-[2.2]" />
        {unreadCount > 0 && (
          <Badge className="tbo-caption absolute -top-0.5 -right-0.5 h-5 min-w-[20px] px-1 bg-rose-600 hover:bg-rose-600 text-white rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        )}
      </button>

      {isOpen && (
        <>
          {/* Dimmed Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          {/* Full Screen Height Drawer Panel */}
          <div className="[overflow-wrap:anywhere] fixed right-0 top-0 bottom-0 w-full max-w-[400px] bg-white shadow-2xl z-50 flex flex-col overflow-hidden border-l border-slate-200 animate-in slide-in-from-right duration-300">
            {/* High Contrast Header Area */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-slate-200 bg-slate-50 flex-shrink-0">
              <div>
                <h3 className="tbo-card-title text-slate-950">
                  {t?.notifications?.title || tr("Notifications")}
                </h3>
                {unreadCount > 0 && (
                  <p className="tbo-caption text-rose-600 mt-0.5">
                    {unreadCount} {t.notifications.unreadItems}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap min-w-0 max-w-full items-center gap-1">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    disabled={isLoading}
                    className="tbo-action min-h-8 h-auto max-w-full min-w-0 whitespace-normal text-slate-800 hover:text-slate-950 px-2.5 hover:bg-slate-200/80 border border-slate-200 bg-white"
                  >
                    {isLoading ? <LoadingMark /> : <Check className="w-3.5 h-3.5 mr-1 text-slate-900" />}
                    {t.notifications.markAllRead}
                  </Button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  aria-label={tr("Close")}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors border border-transparent hover:border-slate-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable List container matching absolute layout boundaries */}
            <ScrollArea className="flex-1 w-full h-full min-h-0 divide-y divide-slate-200 overflow-y-auto bg-white">
              {!hasLoaded ? (
                <BrandLoader className="min-h-48 px-4 py-12" />
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-20 px-4 text-center">
                  <div className="p-4 bg-slate-100 rounded-2xl mb-3 border border-slate-200">
                    <Bell className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="tbo-body text-slate-900">
                    {t.notifications.allCaughtUp}
                  </p>
                  <p className="tbo-caption text-slate-500 max-w-[240px] mt-1.5">
                    {t.notifications.noNewNotifications}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {notifications.map((notification) => {
                    const copy = getNotificationCopy(notification, language);
                    const design = getNotificationDetails(
                      notification.type,
                    );
                    return (
                      <div
                        key={notification.id}
                        onClick={() =>
                          handleNotificationClick(notification)
                        }
                        className={`group relative p-4 flex gap-3.5 cursor-pointer transition-all duration-150 border-l-4 select-none ${
                          !notification.isRead
                            ? "bg-slate-50/90 border-l-rose-600 hover:bg-slate-100/80"
                            : "border-l-transparent hover:bg-slate-50"
                        }`}
                      >
                        {/* High Contrast Icon Container */}
                        <div
                          className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center shadow-sm ${design.bg}`}
                        >
                          {design.icon}
                        </div>

                        {/* Title & Message text fields */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <p
                              className={`tbo-label min-w-0 max-w-full text-slate-950 ${
                                !notification.isRead
                                  ? ""
                                  : " text-slate-800"
                              }`}
                            >
                              {copy.title}
                            </p>
                            <span className="tbo-caption min-w-0 max-w-full text-slate-500 whitespace-normal bg-slate-100 px-1.5 py-0.5 rounded">
                              {formatTime(
                                notification.createdAt,
                              )}
                            </span>
                          </div>

                          <p className="tbo-caption text-slate-700 mt-1.5 line-clamp-3">
                            {copy.message}
                          </p>

                          {/* Quick Actions Action bar */}
                          <div className="flex flex-wrap items-center gap-3 mt-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-150">
                            {!notification.isRead && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                                className="tbo-action text-rose-700 hover:text-rose-900 flex items-center gap-0.5 bg-rose-100 border border-rose-200 px-2 py-0.5 rounded shadow-sm"
                              >
                                {t.notifications.markRead}
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(
                                  notification.id,
                                );
                              }}
                              className="tbo-action text-slate-600 hover:text-slate-900 flex items-center gap-1 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded shadow-sm ml-auto"
                            >
                              <Trash2 className="w-3 h-3 text-slate-500" />
                              {t.common.delete}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>
        </>
      )}
    </>
  );
}
