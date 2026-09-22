'use client';

import {useState, useTransition} from 'react';
import {X} from 'lucide-react';
import {removeFromCart} from '@/app/[locale]/cart/actions';
import {SgwRemoveConfirmDialog} from '@/components/configurator/sgw-remove-confirm-dialog';
import {Button} from '@/components/ui/button';
import {cn} from '@/lib/utils';

/** SKU prefix of the SGW unlock lines (licence or bypass cable) that get a removal warning. */
export const SGW_SKU_PREFIX = 'GG-SGW-';

export function isSgwLineSku(sku: string | null | undefined): boolean {
    return (sku ?? '').toUpperCase().startsWith(SGW_SKU_PREFIX);
}

interface RemoveLineButtonProps {
    lineId: string;
    sku: string;
    /** Accessible name of the button (Cart.removeItem). */
    label: string;
    className?: string;
}

/**
 * Cart line "X" button. Removing an SGW unlock line first opens the same confirmation
 * dialog the product configurator shows when the unlock is unticked (previous storefront:
 * cart page and Dropcart); every other line is removed straight away.
 */
export function RemoveLineButton({lineId, sku, label, className}: RemoveLineButtonProps) {
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const remove = () => {
        startTransition(async () => {
            await removeFromCart(lineId);
        });
    };

    const handleClick = () => {
        if (isSgwLineSku(sku)) {
            setConfirmOpen(true);
            return;
        }
        remove();
    };

    return (
        <>
            <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleClick}
                disabled={isPending}
                aria-label={label}
                className={cn(
                    'h-9 w-9 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive',
                    className,
                )}
            >
                <X className="h-5 w-5" />
            </Button>
            <SgwRemoveConfirmDialog
                open={confirmOpen}
                onKeep={() => setConfirmOpen(false)}
                onRemove={() => {
                    setConfirmOpen(false);
                    remove();
                }}
            />
        </>
    );
}
