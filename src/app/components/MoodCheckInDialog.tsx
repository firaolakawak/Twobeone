import { useLanguage } from "../contexts/LanguageContext";
import { dashboardJourneyCopy } from "../data/dashboard-journey";
import { moodCheckInCopy } from "../data/mood-check-in";
import { MOOD_EMOJI, type MoodValue } from "../utils/moodCheckIn";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import "./mood-check-in.css";

export interface MoodCheckInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (value: MoodValue) => void;
  isSaving: boolean;
  selectedMood?: MoodValue | null;
  /** A localized, user-facing save error. */
  error?: string | null;
}

const MOOD_OPTIONS: readonly MoodValue[] = ["great", "good", "okay", "sad"];

export function MoodCheckInDialog({
  open,
  onOpenChange,
  onSelect,
  isSaving,
  selectedMood = null,
  error = null,
}: MoodCheckInDialogProps) {
  const { t, language } = useLanguage();
  const copy = moodCheckInCopy[language];

  const handleOpenChange = (nextOpen: boolean) => {
    if (!isSaving) onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="mood-check-in"
        data-saving={isSaving}
        onEscapeKeyDown={(event) => {
          if (isSaving) event.preventDefault();
        }}
        onInteractOutside={(event) => {
          if (isSaving) event.preventDefault();
        }}
      >
        <DialogHeader className="mood-check-in__header">
          <DialogTitle className="mood-check-in__title">
            {dashboardJourneyCopy[language].moodTitle}
          </DialogTitle>
          <DialogDescription className="mood-check-in__description">
            {copy.description}
          </DialogDescription>
        </DialogHeader>

        <div
          className="mood-check-in__choices"
          role="group"
          aria-label={copy.yourMood}
          aria-busy={isSaving}
        >
          {MOOD_OPTIONS.map((value) => (
            <button
              key={value}
              type="button"
              className="mood-check-in__choice"
              aria-pressed={selectedMood === value}
              disabled={isSaving}
              onClick={() => {
                if (!isSaving) onSelect(value);
              }}
            >
              <span className="mood-check-in__emoji" aria-hidden="true">
                {MOOD_EMOJI[value]}
              </span>
              <span>{t.mood[value]}</span>
            </button>
          ))}
        </div>

        {isSaving && (
          <p className="mood-check-in__status" role="status">
            {copy.saving}
          </p>
        )}
        {error !== null && (
          <p className="mood-check-in__error" role="alert">
            {error.trim() || copy.saveError}
          </p>
        )}

        <div className="mood-check-in__footer">
          <button
            type="button"
            className="mood-check-in__dismiss"
            disabled={isSaving}
            onClick={() => handleOpenChange(false)}
          >
            {copy.notNow}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
