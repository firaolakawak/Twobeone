import { Heart, Calendar, User, UserPlus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

interface CoupleHeaderProps {
  userName?: string;
  partnerName?: string;
  daysTogetherDate?: string;
}

export function CoupleHeader({ userName, partnerName, daysTogetherDate }: CoupleHeaderProps) {
  const calculateDaysTogether = () => {
    if (!daysTogetherDate) return 0;
    const start = new Date(daysTogetherDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysTogether = calculateDaysTogether();

  return (
    <div className="relative">
      {/* Love Messages */}
      <div className="flex justify-between items-start mb-4 px-2">
        <div className="text-sm">I love you ❤️</div>
        <div className="text-sm">I love you ❤️</div>
      </div>

      {/* Couple Avatars with Distance */}
      <div className="flex items-center justify-center gap-6 mb-6">
        {/* User Avatar */}
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-rose-200 to-pink-300 flex items-center justify-center border-4 border-white shadow-lg overflow-hidden">
            <User className="w-12 h-12 text-rose-600" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center border-2 border-white">
            <Heart className="w-4 h-4 text-white fill-white" />
          </div>
        </div>

        {/* Distance Badge */}
        <div className="bg-white px-4 py-2 rounded-full shadow-md border border-gray-200">
          <span className="text-sm font-medium text-gray-700">? km</span>
        </div>

        {/* Partner Avatar */}
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-200 to-indigo-300 flex items-center justify-center border-4 border-white shadow-lg overflow-hidden">
            {partnerName ? (
              <div className="text-2xl font-bold text-indigo-600">
                {partnerName.charAt(0).toUpperCase()}
              </div>
            ) : (
              <UserPlus className="w-12 h-12 text-indigo-600" />
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center border-2 border-white">
            <Heart className="w-4 h-4 text-white fill-white" />
          </div>
        </div>
      </div>
    </div>
  );
}