import { Users } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { cn } from './ui/utils';

export function PresenceDot({ online, label, className }: { online: boolean; label: string; className?: string }) {
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      data-online={online}
      className={cn(
        'absolute bottom-1 right-1 z-30 h-3.5 w-3.5 rounded-full border-2 border-card shadow-sm transition-colors',
        online ? 'bg-green-500' : 'bg-red-500',
        className,
      )}
    />
  );
}

interface CoupleAvatarStackProps {
  userName: string;
  userAvatar?: string;
  userOnline?: boolean;
  partnerName?: string;
  partnerAvatar?: string;
  partnerOnline?: boolean;
}

const initials = (name: string) => name.trim().split(/\s+/).map(part => part[0]).join('') || '?';

export function CoupleAvatarStack({ userName, userAvatar, userOnline, partnerName, partnerAvatar, partnerOnline }: CoupleAvatarStackProps) {
  const { t } = useLanguage();

  return (
    <div className="relative ml-auto h-24 w-28 shrink-0 sm:h-32 sm:w-40" data-couple-avatars>
      <div className="pointer-events-none absolute inset-2 rounded-full bg-gradient-to-br from-rose-200/50 to-sky-200/40 blur-xl dark:from-rose-500/10 dark:to-sky-500/10" />
      <div className="absolute left-0 top-0 z-10">
        <Avatar className="h-18 w-18 border-4 border-card shadow-md ring-1 ring-rose-200/70 dark:ring-rose-800/50 sm:h-24 sm:w-24">
          <AvatarImage src={userAvatar} alt={userName} />
          <AvatarFallback className="bg-gradient-to-br from-rose-400 to-rose-600 text-lg font-semibold text-white sm:text-xl">{initials(userName)}</AvatarFallback>
        </Avatar>
        {userOnline !== undefined && <PresenceDot online={userOnline} label={`${userName}: ${userOnline ? t.dashboard.online : t.dashboard.offline}`} className="left-1 right-auto" />}
      </div>
      <div className="absolute bottom-0 right-0 z-20">
        <Avatar className="h-18 w-18 border-4 border-card shadow-lg ring-1 ring-sky-200/70 dark:ring-sky-800/50 sm:h-24 sm:w-24">
          <AvatarImage src={partnerAvatar} alt={partnerName || t.mood.partner} />
          <AvatarFallback className={partnerName ? 'bg-gradient-to-br from-sky-400 to-sky-600 text-lg font-semibold text-white sm:text-xl' : 'bg-muted text-muted-foreground'}>
            {partnerName ? initials(partnerName) : <Users className="h-7 w-7" />}
          </AvatarFallback>
        </Avatar>
        {partnerName && partnerOnline !== undefined && <PresenceDot online={partnerOnline} label={`${partnerName}: ${partnerOnline ? t.dashboard.online : t.dashboard.offline}`} />}
      </div>
    </div>
  );
}
