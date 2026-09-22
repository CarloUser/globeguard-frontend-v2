import {formatSelectionBadge} from '@/lib/globeguard/picker';
import {cn} from '@/lib/utils';

type LineSelection = Parameters<typeof formatSelectionBadge>[0];

interface SelectionBadgeProps {
    /** OrderLine.customFields (selectedBrandGroupId / selectedYear / selectedBrandGroupIds). */
    selection: LineSelection | null | undefined;
    locale: string;
    className?: string;
}

/**
 * 'Fiat, Alfa Romeo, Lancia · Modelljahr 2020' / '6 Markengruppen gewählt' under a cart,
 * checkout or confirmation line. Renders nothing when the line carries no selection.
 * Plain markup so it works in server and client components alike.
 */
export function SelectionBadge({selection, locale, className}: SelectionBadgeProps) {
    const text = formatSelectionBadge(selection ?? {}, locale);

    if (!text) {
        return null;
    }

    return (
        <span
            className={cn(
                'inline-flex max-w-full items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary',
                className,
            )}
        >
            {text}
        </span>
    );
}
