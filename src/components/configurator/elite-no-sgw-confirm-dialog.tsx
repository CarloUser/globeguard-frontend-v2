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

export interface EliteNoSgwConfirmDialogProps {
    open: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}

/**
 * ELITE device page: the customer clicked "add to cart" without ticking any SGW unlock
 * (plan warning `elite-no-sgw`, one of CONFIRM_WARNINGS). Replaces the previous
 * storefront's window.confirm with an accessible AlertDialog.
 */
export function EliteNoSgwConfirmDialog({open, onCancel, onConfirm}: EliteNoSgwConfirmDialogProps) {
    const t = useTranslations('Configurator.eliteNoSgwDialog');

    return (
        <AlertDialog
            open={open}
            onOpenChange={(nextOpen) => {
                if (!nextOpen) {
                    onCancel();
                }
            }}
        >
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{t('title')}</AlertDialogTitle>
                    <AlertDialogDescription>{t('text')}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm}>{t('confirm')}</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
