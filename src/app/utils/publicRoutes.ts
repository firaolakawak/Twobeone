export type StaticPage =
  | "blog"
  | "help-center"
  | "community"
  | "contact"
  | "privacy-policy"
  | "terms-of-service"
  | "cookie-policy"
  | null;

export type PublicStaticPage = Exclude<StaticPage, null>;

export const STATIC_PAGE_PATHS: Record<PublicStaticPage, string> = {
  blog: "/blog",
  "help-center": "/help-center",
  community: "/community",
  contact: "/contact",
  "privacy-policy": "/privacy",
  "terms-of-service": "/terms",
  "cookie-policy": "/cookies",
};

const STATIC_PAGE_PATH_ALIASES: Record<string, PublicStaticPage> = {
  "/blog": "blog",
  "/help": "help-center",
  "/help-center": "help-center",
  "/community": "community",
  "/contact": "contact",
  "/contact-us": "contact",
  "/privacy": "privacy-policy",
  "/privacy-policy": "privacy-policy",
  "/terms": "terms-of-service",
  "/terms-of-service": "terms-of-service",
  "/cookies": "cookie-policy",
  "/cookie-policy": "cookie-policy",
};

export function staticPageFromPath(pathname: string): StaticPage {
  const normalizedPath = pathname.length > 1
    ? pathname.replace(/\/+$/, "")
    : pathname;
  return STATIC_PAGE_PATH_ALIASES[normalizedPath] ?? null;
}
