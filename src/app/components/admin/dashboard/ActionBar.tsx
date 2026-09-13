import { useUiCopy } from "../../../utils/uiTranslation";
import { adminCommonMessages } from "../../../locales/adminCommon";
import { BookOpen, CircleHelp, GraduationCap, Users, type LucideIcon } from "lucide-react";

const actions: Array<{ id: string; label: string; icon: LucideIcon }> = [
  { id: "devotionals", label: "Add Devotional", icon: BookOpen },
  { id: "questions", label: "Add Question", icon: CircleHelp },
  { id: "modules", label: "Create Module", icon: GraduationCap },
  { id: "groups", label: "Add Group", icon: Users },
];

export function ActionBar({ onAction }: { onAction?: (action: string) => void }) {
  const tr = useUiCopy(adminCommonMessages);
  return (
    <nav className="admin-actionbar" aria-label={tr("Quick actions")}>
      {actions.map(({ id, label, icon: Icon }) => (
        <span className="admin-actionbar__tooltip-wrap" key={id}>
          <button type="button" className="admin-actionbar__button" onClick={() => onAction?.(id)} aria-label={tr(label)} aria-describedby={`action-tip-${id}`}>
            <Icon aria-hidden="true" />
            <span>{tr(label)}</span>
          </button>
          <span id={`action-tip-${id}`} className="admin-actionbar__tooltip" role="tooltip">{tr(label)}</span>
        </span>
      ))}
    </nav>
  );
}
