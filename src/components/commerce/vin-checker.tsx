'use client';

import {useState} from 'react';
import {CheckCircle2, SearchCode} from 'lucide-react';

export function VinChecker() {
    const [vehicle, setVehicle] = useState('');
    const [checked, setChecked] = useState(false);

    return (
        <div className="glass-panel sticky top-32 p-6 lg:p-8">
            <div className="mb-6 flex size-12 items-center justify-center rounded-full bg-accent/20 text-accent">
                <SearchCode className="size-6" />
            </div>
            <h3 className="mb-2 text-xl font-bold">Brand Coverage Check</h3>
            <p className="mb-6 text-sm text-slate-600 dark:text-slate-300">Enter a brand to prepare a compatibility discussion from the imported brand coverage.</p>

            <div className="space-y-4">
                <input
                    type="text"
                    placeholder="Mercedes-Benz"
                    value={vehicle}
                    onChange={(event) => {
                        setVehicle(event.target.value);
                        setChecked(false);
                    }}
                    className="w-full rounded-lg border border-slate-200 bg-[#F0F6F9] p-3 text-center font-medium outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-white/10 dark:bg-[#101820]"
                    maxLength={80}
                />
                <button
                    onClick={() => {
                        if (vehicle.trim().length > 1) setChecked(true);
                    }}
                    className="btn-primary w-full disabled:pointer-events-none disabled:opacity-50"
                    disabled={vehicle.trim().length < 2}
                >
                    Check coverage
                </button>

                {checked && (
                    <div className="flex gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
                        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
                        <div className="text-sm">
                            <strong>Coverage can be matched</strong>
                            <p className="mt-1 opacity-80">Use the compatibility wizard or contact support to confirm exact vehicle functions before purchase.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
