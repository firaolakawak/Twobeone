import { useState, useEffect, useCallback } from "react";
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
    | "general";
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

export function NotificationCenter({
  accessToken,
  projectId,
  publicAnonKey,
  onNotificationClick,
}: NotificationCenterProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<
    Notification[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);

  const unreadCount = notifications.filter(
    (n) => !n.isRead,
  ).length;

  const fetchNotifications = useCallback(async () => {
    if (!accessToken) return;

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

      if (!response.ok) {
        setNotifications([]);
        return;
      }

      const data = await response.json();
      setNotifications(data.notifications || []);
    } catch {
      // Notifications are non-critical — fail silently
      setNotifications([]);
    } finally {
      clearTimeout(timeout);
    }
  }, [accessToken, projectId]);

  useEffect(() => {
    if (!accessToken) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 45000);
    return () => clearInterval(interval);
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
        toast.success("Notification removed");
      } catch (error) {
        console.error("Error deleting notification:", error);
        toast.error("Failed to delete notification");
      }
    },
    [accessToken, projectId],
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
      toast.success("All marked as read");
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast.error("Failed to update notifications");
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
    if (diffInMins < 1) return "Just now";
    if (diffInMins < 60) return `${diffInMins}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <>
      {/* Bell Trigger */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2.5 text-slate-700 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-all duration-200 focus:outline-none"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 stroke-[2]" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-0.5 -right-0.5 h-5 min-w-[20px] px-1 bg-rose-600 hover:bg-rose-600 text-white text-[11px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-pulse">
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
          <div className="fixed right-0 top-0 bottom-0 w-full max-w-[400px] bg-white shadow-2xl z-50 flex flex-col overflow-hidden border-l border-slate-200 animate-in slide-in-from-right duration-300">
            {/* High Contrast Header Area */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50 flex-shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-950">
                  {t?.notifications?.title || "Notifications"}
                </h3>
                {unreadCount > 0 && (
                  <p className="text-xs font-semibold text-rose-600 mt-0.5">
                    {unreadCount} unread items
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    disabled={isLoading}
                    className="h-8 text-xs text-slate-800 hover:text-slate-950 font-bold px-2.5 hover:bg-slate-200/80 border border-slate-200 bg-white"
                  >
                    <Check className="w-3.5 h-3.5 mr-1 text-slate-900" />
                    Mark all read
                  </Button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors border border-transparent hover:border-slate-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable List container matching absolute layout boundaries */}
            <ScrollArea className="flex-1 w-full h-full min-h-0 divide-y divide-slate-200 overflow-y-auto bg-white">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-20 px-4 text-center">
                  <div className="p-4 bg-slate-100 rounded-2xl mb-3 border border-slate-200">
                    <Bell className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-base font-bold text-slate-900">
                    All caught up!
                  </p>
                  <p className="text-xs text-slate-500 max-w-[240px] mt-1.5 leading-relaxed">
                    You'll be notified here when your partner
                    updates records or interacts.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {notifications.map((notification) => {
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
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className={`text-sm text-slate-950 truncate leading-tight tracking-tight ${
                                !notification.isRead
                                  ? "font-bold"
                                  : "font-medium text-slate-800"
                              }`}
                            >
                              {notification.title}
                            </p>
                            <span className="text-[11px] text-slate-500 flex-shrink-0 font-bold whitespace-nowrap bg-slate-100 px-1.5 py-0.5 rounded">
                              {formatTime(
                                notification.createdAt,
                              )}
                            </span>
                          </div>

                          <p className="text-xs text-slate-700 font-medium mt-1.5 line-clamp-3 leading-relaxed">
                            {notification.message}
                          </p>

                          {/* Quick Actions Action bar */}
                          <div className="flex items-center gap-3 mt-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-150">
                            {!notification.isRead && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                                className="text-xs text-rose-700 hover:text-rose-900 font-bold flex items-center gap-0.5 bg-rose-100 border border-rose-200 px-2 py-0.5 rounded shadow-sm"
                              >
                                Mark read
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(
                                  notification.id,
                                );
                              }}
                              className="text-xs text-slate-600 hover:text-slate-900 font-bold flex items-center gap-1 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded shadow-sm ml-auto"
                            >
                              <Trash2 className="w-3 h-3 text-slate-500" />
                              Delete
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