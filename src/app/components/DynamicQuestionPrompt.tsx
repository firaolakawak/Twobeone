import { Check, Heart, HeartCrack, ThumbsDown, ThumbsUp, X } from 'lucide-react';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';

type QuestionType = 'text' | 'multiple_choice' | 'multiple_select' | 'like_dislike' | 'love_hate' | 'scale' | 'yes_no';

interface QuestionPrompt {
  id: string;
  text: string;
  type: QuestionType;
  options?: string[];
  scaleMax?: number;
}

interface DynamicQuestionPromptProps {
  prompt: QuestionPrompt;
  value: string | string[] | number | null;
  onChange: (value: string | string[] | number) => void;
  disabled?: boolean;
}

const optionBase = 'group relative w-full rounded-2xl border px-4 py-3.5 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 motion-safe:hover:-translate-y-0.5 motion-safe:active:scale-[0.985]';
const choiceBase = 'group relative flex min-h-28 flex-1 flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border p-4 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 motion-safe:hover:-translate-y-0.5 motion-safe:active:scale-[0.98]';

export function DynamicQuestionPrompt({ prompt, value, onChange, disabled = false }: DynamicQuestionPromptProps) {
  const setValue = (newValue: string | string[] | number) => {
    if (!disabled) onChange(newValue);
  };

  const selectedMark = (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-600 text-white shadow-sm" aria-hidden="true">
      <Check className="h-3.5 w-3.5" strokeWidth={3} />
    </span>
  );

  const renderPromptInput = () => {
    switch (prompt.type) {
      case 'text':
        return (
          <div className="relative">
            <Textarea
              id={`prompt-${prompt.id}`}
              value={(value as string) || ''}
              onChange={(event) => setValue(event.target.value)}
              placeholder="Share what is on your heart…"
              rows={5}
              disabled={disabled}
              className="min-h-32 resize-y rounded-2xl border-primary-100 bg-white/80 px-4 py-4 text-base leading-relaxed shadow-sm transition-all placeholder:text-muted-foreground/70 focus-visible:border-primary-300 focus-visible:ring-primary-200"
            />
            <span className="pointer-events-none absolute bottom-3 right-4 text-xs text-muted-foreground">Take your time</span>
          </div>
        );

      case 'multiple_choice':
        return (
          <div className="grid gap-2.5" role="radiogroup" aria-labelledby={`prompt-label-${prompt.id}`}>
            {(prompt.options || []).map((option, index) => {
              const isSelected = value === option;
              return (
                <button
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  key={`${prompt.id}-option-${index}`}
                  onClick={() => setValue(option)}
                  disabled={disabled}
                  className={`${optionBase} ${isSelected ? 'border-primary-300 bg-primary-50 text-primary-950 shadow-[0_8px_28px_rgba(190,68,112,0.10)]' : 'border-border/70 bg-white/75 text-foreground hover:border-primary-200 hover:bg-primary-50/40 hover:shadow-sm'}`}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className={`text-[15px] leading-snug ${isSelected ? 'font-semibold' : 'font-medium'}`}>{option}</span>
                    {isSelected ? selectedMark : <span className="h-5 w-5 shrink-0 rounded-full border-2 border-neutral-200 transition-colors group-hover:border-primary-200" aria-hidden="true" />}
                  </span>
                </button>
              );
            })}
          </div>
        );

      case 'multiple_select': {
        const selectedOptions = (value as string[]) || [];
        return (
          <div className="grid gap-2.5" aria-labelledby={`prompt-label-${prompt.id}`}>
            {(prompt.options || []).map((option, index) => {
              const isSelected = selectedOptions.includes(option);
              return (
                <button
                  type="button"
                  aria-pressed={isSelected}
                  key={`${prompt.id}-multi-${index}`}
                  onClick={() => setValue(isSelected ? selectedOptions.filter(item => item !== option) : [...selectedOptions, option])}
                  disabled={disabled}
                  className={`${optionBase} ${isSelected ? 'border-primary-300 bg-primary-50 text-primary-950 shadow-[0_8px_28px_rgba(190,68,112,0.10)]' : 'border-border/70 bg-white/75 hover:border-primary-200 hover:bg-primary-50/40 hover:shadow-sm'}`}
                >
                  <span className="flex items-center gap-3">
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition-colors ${isSelected ? 'border-primary-600 bg-primary-600 text-white' : 'border-neutral-200 bg-white group-hover:border-primary-200'}`} aria-hidden="true">
                      {isSelected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                    </span>
                    <span className={`text-[15px] ${isSelected ? 'font-semibold' : 'font-medium'}`}>{option}</span>
                  </span>
                </button>
              );
            })}
          </div>
        );
      }

      case 'like_dislike':
        return (
          <div className="grid grid-cols-2 gap-3 py-1" role="radiogroup" aria-labelledby={`prompt-label-${prompt.id}`}>
            {[
              { key: 'like', label: 'Like', Icon: ThumbsUp, selected: 'border-emerald-300 bg-emerald-50 text-emerald-800 shadow-sm' },
              { key: 'dislike', label: 'Dislike', Icon: ThumbsDown, selected: 'border-rose-300 bg-rose-50 text-rose-800 shadow-sm' },
            ].map(({ key, label, Icon, selected }) => {
              const isSelected = value === key;
              return (
                <button type="button" role="radio" aria-checked={isSelected} key={key} onClick={() => setValue(key)} disabled={disabled} className={`${choiceBase} ${isSelected ? selected : 'border-border/70 bg-white/75 text-muted-foreground hover:border-primary-200 hover:bg-primary-50/40'}`}>
                  <Icon className={`h-8 w-8 transition-transform duration-200 ${isSelected ? 'scale-110' : 'group-hover:scale-105'}`} />
                  <span className="font-semibold">{label}</span>
                  {isSelected && <span className="absolute right-3 top-3">{selectedMark}</span>}
                </button>
              );
            })}
          </div>
        );

      case 'love_hate':
        return (
          <div className="grid grid-cols-2 gap-3 py-1" role="radiogroup" aria-labelledby={`prompt-label-${prompt.id}`}>
            {[
              { key: 'love', label: 'Love', Icon: Heart, selected: 'border-primary-300 bg-primary-50 text-primary-700 shadow-sm' },
              { key: 'hate', label: 'Not for me', Icon: HeartCrack, selected: 'border-neutral-300 bg-neutral-100 text-neutral-700 shadow-sm' },
            ].map(({ key, label, Icon, selected }) => {
              const isSelected = value === key;
              return (
                <button type="button" role="radio" aria-checked={isSelected} key={key} onClick={() => setValue(key)} disabled={disabled} className={`${choiceBase} ${isSelected ? selected : 'border-border/70 bg-white/75 text-muted-foreground hover:border-primary-200 hover:bg-primary-50/40'}`}>
                  <Icon className={`h-8 w-8 transition-transform duration-200 ${isSelected ? 'scale-110 fill-current' : 'group-hover:scale-105'}`} />
                  <span className="font-semibold">{label}</span>
                  {isSelected && <span className="absolute right-3 top-3">{selectedMark}</span>}
                </button>
              );
            })}
          </div>
        );

      case 'scale': {
        const scaleMax = prompt.scaleMax || 5;
        const currentValue = (value as number) || 0;
        return (
          <div className="rounded-2xl border border-primary-100 bg-white/70 p-4 shadow-sm">
            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${scaleMax}, minmax(0, 1fr))` }} role="radiogroup" aria-labelledby={`prompt-label-${prompt.id}`}>
              {Array.from({ length: scaleMax }, (_, index) => index + 1).map(num => {
                const isSelected = currentValue === num;
                return (
                  <button type="button" role="radio" aria-checked={isSelected} aria-label={`${num} out of ${scaleMax}`} key={num} onClick={() => setValue(num)} disabled={disabled} className={`aspect-square min-h-10 rounded-xl border text-sm font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:opacity-50 motion-safe:hover:-translate-y-0.5 motion-safe:active:scale-95 ${isSelected ? 'border-primary-600 bg-primary-600 text-white shadow-[0_7px_18px_rgba(190,68,112,0.24)]' : 'border-border/70 bg-white text-muted-foreground hover:border-primary-200 hover:bg-primary-50'}`}>
                    {num}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex justify-between text-xs font-medium text-muted-foreground"><span>Not at all</span><span>Very much</span></div>
          </div>
        );
      }

      case 'yes_no':
        return (
          <div className="grid grid-cols-2 gap-3 py-1" role="radiogroup" aria-labelledby={`prompt-label-${prompt.id}`}>
            {[
              { key: 'yes', label: 'Yes', Icon: Check, selected: 'border-emerald-300 bg-emerald-50 text-emerald-800 shadow-sm' },
              { key: 'no', label: 'No', Icon: X, selected: 'border-rose-300 bg-rose-50 text-rose-800 shadow-sm' },
            ].map(({ key, label, Icon, selected }) => {
              const isSelected = value === key;
              return (
                <button type="button" role="radio" aria-checked={isSelected} key={key} onClick={() => setValue(key)} disabled={disabled} className={`${choiceBase} ${isSelected ? selected : 'border-border/70 bg-white/75 text-muted-foreground hover:border-primary-200 hover:bg-primary-50/40'}`}>
                  <span className={`flex h-11 w-11 items-center justify-center rounded-full ${isSelected ? 'bg-white/75' : 'bg-neutral-100'}`}><Icon className="h-6 w-6" strokeWidth={2.5} /></span>
                  <span className="font-semibold">{label}</span>
                  {isSelected && <span className="absolute right-3 top-3">{selectedMark}</span>}
                </button>
              );
            })}
          </div>
        );

      default:
        return <p className="text-muted-foreground">Unsupported question type</p>;
    }
  };

  return (
    <section className="space-y-3 rounded-3xl border border-primary-100/80 bg-gradient-to-br from-white via-white to-primary-50/45 p-4 shadow-[0_12px_36px_rgba(83,45,67,0.06)] sm:p-5">
      <Label id={`prompt-label-${prompt.id}`} htmlFor={`prompt-${prompt.id}`} className="block text-base font-semibold leading-snug text-foreground sm:text-lg">
        {prompt.text}
      </Label>
      {prompt.type === 'multiple_select' && <p className="-mt-1 text-xs text-muted-foreground">Choose all that feel true for you</p>}
      {renderPromptInput()}
    </section>
  );
}
