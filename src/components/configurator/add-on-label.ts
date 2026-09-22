'use client';

import {useTranslations} from 'next-intl';
import {useCallback} from 'react';

import type {AddOnLine} from '@/lib/globeguard/types';

/**
 * Localised label of an add-on line, rendered from `labelKey` + `labelParams`
 * (never from the German `label` / `labelEn` business strings). Messages live under
 * `Configurator.addOn.*`:
 *   sgwLicense         {licenseGroup, duration, quantity}
 *   sgwCable           {cable}
 *   proExtension       {name}
 *   proExtensionModule {name}
 *   cableSet           {name}
 *   trumaCable         –
 */
export function useAddOnLineLabel(): (line: Pick<AddOnLine, 'labelKey' | 'labelParams'>) => string {
    const t = useTranslations('Configurator.addOn');

    return useCallback((line: Pick<AddOnLine, 'labelKey' | 'labelParams'>) => t(line.labelKey, line.labelParams), [t]);
}
