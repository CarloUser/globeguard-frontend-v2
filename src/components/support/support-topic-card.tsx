import type {LucideIcon} from 'lucide-react';
import type {ReactNode} from 'react';

interface SupportTopicCardProps {
    icon: LucideIcon;
    title: string;
    text: string;
    /** Primary action (link/button), rendered below the text. */
    action: ReactNode;
    /** Small muted note under the action, e.g. "more downloads to follow". */
    hint?: string;
}

/** Card of the /support hub: icon, title, one-paragraph description, one action, optional hint. */
export function SupportTopicCard({icon: Icon, title, text, action, hint}: SupportTopicCardProps) {
    return (
        <div className="flex h-full flex-col rounded-md border border-slate-200 bg-white p-5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-slate-100 text-primary">
                <Icon className="size-5" />
            </span>
            <h2 className="mt-4 font-semibold text-foreground">{title}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">{text}</p>
            <div className="mt-auto flex flex-wrap gap-2 pt-4">{action}</div>
            {hint && <p className="mt-3 text-xs text-slate-500">{hint}</p>}
        </div>
    );
}
