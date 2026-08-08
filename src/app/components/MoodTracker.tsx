import { Smile } from 'lucide-react';
import { Card } from './ui/card';
import { useState } from 'react';
import { moods as moodsApi } from '../utils/api';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/LanguageContext';

interface MoodTrackerProps {
  onMoodSelect: (mood: string) => void;
  userMood?: string;
  partnerMood?: string;
}

const MoodFaceMini = ({ mood, size = 40 }: { mood: string; size?: number }) => {
  if (mood === 'great') return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <radialGradient id="mt-great" cx="42%" cy="32%" r="68%">
          <stop offset="0%" stopColor="#FFFDE7"/><stop offset="55%" stopColor="#FFD600"/><stop offset="100%" stopColor="#FF8F00"/>
        </radialGradient>
      </defs>
      <circle cx="24" cy="24" r="22" fill="url(#mt-great)"/>
      <circle cx="24" cy="24" r="22" fill="none" stroke="#F9A825" strokeWidth="1.5"/>
      <path d="M11 16 Q15 11 19 14" stroke="#7B5800" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <path d="M29 14 Q33 11 37 16" stroke="#7B5800" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <path d="M16 24 L17.2 20.8 L18.4 24 L21.6 24 L19 26.2 L19.9 29.4 L16 27.2 L12.1 29.4 L13 26.2 L10.4 24 L13.6 24 Z" fill="#E65100"/>
      <path d="M32 24 L33.2 20.8 L34.4 24 L37.6 24 L35 26.2 L35.9 29.4 L32 27.2 L28.1 29.4 L29 26.2 L26.4 24 L29.6 24 Z" fill="#E65100"/>
      <path d="M11 31 Q24 45 37 31" fill="white" stroke="#C17900" strokeWidth="2" strokeLinejoin="round"/>
      <path d="M11 31 Q24 38 37 31" fill="#C17900"/>
      <ellipse cx="9" cy="31" rx="5.5" ry="3.5" fill="#FF8A65" opacity="0.5"/>
      <ellipse cx="39" cy="31" rx="5.5" ry="3.5" fill="#FF8A65" opacity="0.5"/>
    </svg>
  );
  if (mood === 'okay') return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <radialGradient id="mt-okay" cx="42%" cy="32%" r="68%">
          <stop offset="0%" stopColor="#EDE7F6"/><stop offset="55%" stopColor="#B39DDB"/><stop offset="100%" stopColor="#673AB7"/>
        </radialGradient>
      </defs>
      <circle cx="24" cy="24" r="22" fill="url(#mt-okay)"/>
      <circle cx="24" cy="24" r="22" fill="none" stroke="#9575CD" strokeWidth="1.5"/>
      <path d="M11 17 L20 17" stroke="#311B92" strokeWidth="2.2" strokeLinecap="round"/>
      <path d="M28 17 L37 17" stroke="#311B92" strokeWidth="2.2" strokeLinecap="round"/>
      <ellipse cx="16" cy="23" rx="4.5" ry="5" fill="white"/>
      <circle cx="16" cy="24" r="2.8" fill="#1A237E"/>
      <circle cx="17.2" cy="22.5" r="1.1" fill="white" opacity="0.7"/>
      <ellipse cx="32" cy="23" rx="4.5" ry="5" fill="white"/>
      <circle cx="32" cy="24" r="2.8" fill="#1A237E"/>
      <circle cx="33.2" cy="22.5" r="1.1" fill="white" opacity="0.7"/>
      <path d="M17 34 Q24 31 31 34" fill="none" stroke="#311B92" strokeWidth="2.2" strokeLinecap="round"/>
    </svg>
  );
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <radialGradient id="mt-sad" cx="42%" cy="32%" r="68%">
          <stop offset="0%" stopColor="#E3F2FD"/><stop offset="55%" stopColor="#90CAF9"/><stop offset="100%" stopColor="#1565C0"/>
        </radialGradient>
      </defs>
      <circle cx="24" cy="24" r="22" fill="url(#mt-sad)"/>
      <circle cx="24" cy="24" r="22" fill="none" stroke="#42A5F5" strokeWidth="1.5"/>
      <path d="M11 16 Q15 19.5 19 17" stroke="#0D47A1" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <path d="M29 17 Q33 19.5 37 16" stroke="#0D47A1" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <ellipse cx="16" cy="23" rx="4.5" ry="5" fill="white" opacity="0.9"/>
      <circle cx="16" cy="24" r="2.8" fill="#0D47A1"/>
      <circle cx="17.2" cy="22.5" r="1.1" fill="white" opacity="0.6"/>
      <ellipse cx="32" cy="23" rx="4.5" ry="5" fill="white" opacity="0.9"/>
      <circle cx="32" cy="24" r="2.8" fill="#0D47A1"/>
      <circle cx="33.2" cy="22.5" r="1.1" fill="white" opacity="0.6"/>
      <path d="M15 36 Q24 29 33 36" fill="none" stroke="#0D47A1" strokeWidth="2.5" strokeLinecap="round"/>
      <ellipse cx="32" cy="31.5" rx="2.2" ry="3.5" fill="#64B5F6" opacity="0.8"/>
    </svg>
  );
};

export function MoodTracker({ onMoodSelect, userMood, partnerMood }: MoodTrackerProps) {
  const { t } = useLanguage();
  const moods = [
    { value: 'great', label: t.mood.great, bg: 'linear-gradient(135deg, var(--success-50), var(--warning-50))', border: 'var(--success-400)', glow: 'var(--success-100)' },
    { value: 'okay',  label: t.mood.okay,  bg: 'linear-gradient(135deg, var(--secondary-50), var(--primary-50))', border: 'var(--secondary-400)', glow: 'var(--secondary-100)' },
    { value: 'sad',   label: t.mood.sad,   bg: 'linear-gradient(135deg, var(--primary-50), var(--neutral-100))', border: 'var(--primary-300)', glow: 'var(--primary-50)' },
  ];
  const [selectedMood, setSelectedMood] = useState<string | null>(userMood || null);
  const [isSaving, setIsSaving] = useState(false);

  const handleMoodClick = async (moodValue: string) => {
    setSelectedMood(moodValue);
    onMoodSelect(moodValue);
    setIsSaving(true);
    try {
      await moodsApi.save(moodValue as 'great' | 'good' | 'okay' | 'sad');
      toast.success('Mood saved!');
    } catch (error) {
      console.error('Error saving mood:', error);
      toast.error('Failed to save mood');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="bg-card rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4" style={{ color: 'var(--primary-600)' }}>
        <Smile className="w-5 h-5" />
        <h3 style={{ fontWeight: 'var(--font-weight-medium)', margin: 0 }}>{t.dashboard.todaysMood}</h3>
      </div>

      <div className="space-y-5">
        {/* Your mood */}
        <div>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--muted-foreground)', marginBottom: 'var(--spacing-3)' }}>{t.dashboard.yourMood}</p>
          <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
            {moods.map((mood) => {
              const isSelected = selectedMood === mood.value;
              return (
                <button
                  key={mood.value}
                  onClick={() => handleMoodClick(mood.value)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    gap: 'var(--spacing-1)',
                    flex: 1,
                    padding: 'var(--spacing-2) var(--spacing-1)',
                    borderRadius: 'var(--radius-lg)',
                    border: `2px solid ${isSelected ? mood.border : 'var(--neutral-200)'}`,
                    background: isSelected ? mood.bg : 'var(--card)',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
                    transform: isSelected ? 'scale(1.06)' : 'scale(1)',
                    boxShadow: isSelected ? `0 4px 14px ${mood.glow}` : '0 1px 3px rgba(0,0,0,0.06)',
                  }}
                >
                  <MoodFaceMini mood={mood.value} size={40} />
                  <span style={{ fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: isSelected ? 'var(--foreground)' : 'var(--muted-foreground)' }}>
                    {mood.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Partner mood */}
        <div>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--muted-foreground)', marginBottom: 'var(--spacing-3)' }}>{t.dashboard.partnersMood}</p>
          <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
            {moods.map((mood) => {
              const isPartnerMood = partnerMood === mood.value;
              return (
                <div
                  key={mood.value}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    gap: 'var(--spacing-1)',
                    flex: 1,
                    padding: 'var(--spacing-2) var(--spacing-1)',
                    borderRadius: 'var(--radius-lg)',
                    border: `2px solid ${isPartnerMood ? mood.border : 'var(--neutral-200)'}`,
                    background: isPartnerMood ? mood.bg : 'var(--muted)',
                    opacity: isPartnerMood ? 1 : 0.45,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <MoodFaceMini mood={mood.value} size={40} />
                  <span style={{ fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: 'var(--muted-foreground)' }}>
                    {mood.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}