import { Camera, HandHeart } from 'lucide-react';
import { Button } from './ui/button';

interface FloatingActionButtonsProps {
  onCameraClick?: () => void;
  onPrayClick: () => void;
}

export function FloatingActionButtons({ onCameraClick, onPrayClick }: FloatingActionButtonsProps) {
  return (
    <div className="fixed bottom-20 right-4 z-40 flex flex-col gap-3">
      {onCameraClick && (
        <Button
          onClick={onCameraClick}
          className="w-14 h-14 rounded-full bg-orange-300 hover:bg-orange-400 text-gray-800 shadow-lg"
        >
          <Camera className="w-6 h-6" />
        </Button>
      )}
    </div>
  );
}