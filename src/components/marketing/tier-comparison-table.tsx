import type {ReactNode} from 'react';
import {Link} from '@/i18n/navigation';

export interface TierComparisonColumn {
    key: string;
    heading: ReactNode;
    cta: {href: string; label: ReactNode};
}

export interface TierComparisonRow {
    key: string;
    label: ReactNode;
    /** One cell per column, keyed by `TierComparisonColumn.key`. */
    cells: Record<string, ReactNode>;
}

interface TierComparisonTableProps {
    columns: TierComparisonColumn[];
    rows: TierComparisonRow[];
    featureAria: string;
    actionAria: string;
}

/** Feature-by-tier matrix (BASIC / WoMo / PRO / ELITE) with a CTA row; scrolls horizontally on small screens. */
export function TierComparisonTable({columns, rows, featureAria, actionAria}: TierComparisonTableProps) {
    return (
        <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
            <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead>
                    <tr className="bg-slate-50 text-left">
                        <th scope="col" className="px-4 py-3" aria-label={featureAria} />
                        {columns.map((column) => (
                            <th scope="col" key={column.key} className="px-4 py-3 font-bold text-foreground">
                                {column.heading}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr key={row.key} className="border-t border-slate-200 align-top">
                            <th scope="row" className="px-4 py-3 text-left font-semibold text-foreground">
                                {row.label}
                            </th>
                            {columns.map((column) => (
                                <td key={column.key} className="px-4 py-3 leading-6 text-slate-600">
                                    {row.cells[column.key]}
                                </td>
                            ))}
                        </tr>
                    ))}
                    <tr className="border-t border-slate-200">
                        <th scope="row" className="px-4 py-3" aria-label={actionAria} />
                        {columns.map((column) => (
                            <td key={column.key} className="px-4 py-3">
                                <Link href={column.cta.href} className="btn-primary px-4 py-2 text-sm">
                                    {column.cta.label}
                                </Link>
                            </td>
                        ))}
                    </tr>
                </tbody>
            </table>
        </div>
    );
}
