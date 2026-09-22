'use client';

import {useTranslations} from 'next-intl';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export interface SgwRemoveConfirmDialogProps {
    open: boolean;
    /** Keep the unlock (also fired when the dialog is dismissed with Escape / backdrop). */
    onKeep: () => void;
    /** Continue without the unlock. */
    onRemove: () => void;
}

/**
 * Confirmation shown before an SGW unlock is removed: unticking the auto-selected
 * Security-Gateway prompt on the product page, or removing an SGW line (SKU prefix
 * `GG-SGW-`) in the cart. Copy ported from the previous storefront's
 * SgwRemoveConfirmDialog; strings live in the `Configurator.sgwDialog` namespace.
 */
export function SgwRemoveConfirmDialog({open, onKeep, onRemove}: SgwRemoveConfirmDialogProps) {
    const t = useTranslations('Configurator.sgwDialog');

    return (
        <AlertDialog
            open={open}
            onOpenChange={(nextOpen) => {
                if (!nextOpen) {
                    onKeep();
                }
            }}
        >
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{t('title')}</AlertDialogTitle>
                    <AlertDialogDescription>{t('text')}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>{t('keep')}</AlertDialogCancel>
                    <AlertDialogAction variant="destructive" onClick={onRemove}>
                        {t('remove')}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export default SgwRemoveConfirmDialog;
