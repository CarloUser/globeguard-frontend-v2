'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Field, FieldLabel, FieldError, FieldGroup } from '@/components/ui/field';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useForm, Controller } from 'react-hook-form';
import { Loader2, AlertCircle } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { useCheckout } from '../checkout-provider';
import { setShippingAddress, createCustomerAddress } from '../actions';
import { CountrySelect } from '@/components/shared/country-select';
import {useTranslations} from 'next-intl';

interface ShippingAddressStepProps {
  onComplete: () => void;
}

interface AddressFormData {
  fullName: string;
  streetLine1: string;
  streetLine2?: string;
  city: string;
  province: string;
  postalCode: string;
  countryCode: string;
  phoneNumber: string;
  company?: string;
}

export default function ShippingAddressStep({ onComplete }: ShippingAddressStepProps) {
  const t = useTranslations('Checkout');
  const router = useRouter();
  const { addresses, countries, order } = useCheckout();
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(() => {
    if (order.shippingAddress) {
      const matchingAddress = addresses.find(
        (a) =>
          a.streetLine1 === order.shippingAddress?.streetLine1 &&
          a.postalCode === order.shippingAddress?.postalCode
      );
      if (matchingAddress) return matchingAddress.id;
    }
    const defaultAddress = addresses.find((a) => a.defaultShippingAddress);
    return defaultAddress?.id || null;
  });
  const [dialogOpen, setDialogOpen] = useState(addresses.length === 0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [useSameForBilling, setUseSameForBilling] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getDefaultFormValues = (): Partial<AddressFormData> => {
    const customerFullName = order.customer
      ? `${order.customer.firstName} ${order.customer.lastName}`.trim()
      : '';

    return {
      fullName: customerFullName,
      countryCode: 'CH',
      phoneNumber: order.customer?.phoneNumber || '',
    };
  };

  const { register, handleSubmit, formState: { errors }, reset, control } = useForm<AddressFormData>({
    defaultValues: getDefaultFormValues()
  });

  const handleSelectExistingAddress = async () => {
    if (!selectedAddressId) return;

    setLoading(true);
    setError(null);
    try {
      const selectedAddress = addresses.find(a => a.id === selectedAddressId);
      if (!selectedAddress) return;

      await setShippingAddress({
        fullName: selectedAddress.fullName || '',
        company: selectedAddress.company || '',
        streetLine1: selectedAddress.streetLine1,
        streetLine2: selectedAddress.streetLine2 || '',
        city: selectedAddress.city || '',
        province: selectedAddress.province || '',
        postalCode: selectedAddress.postalCode || '',
        countryCode: selectedAddress.country.code,
        phoneNumber: selectedAddress.phoneNumber || '',
      }, useSameForBilling);

      router.refresh();
      onComplete();
    } catch (err) {
      console.error('Error setting address:', err);
      setError(t('addressError'));
    } finally {
      setLoading(false);
    }
  };

  const onSaveNewAddress = async (data: AddressFormData) => {
    setSaving(true);
    setError(null);
    try {
      const newAddress = await createCustomerAddress(data);
      setDialogOpen(false);
      reset();
      router.refresh();
      setSelectedAddressId(newAddress.id);
    } catch (err) {
      console.error('Error creating address:', err);
      setError(t('addressError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {addresses.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold">{t('selectSavedAddress')}</h3>
          <RadioGroup value={selectedAddressId || ''} onValueChange={setSelectedAddressId}>
            {addresses.map((address) => (
              <div key={address.id} className="flex items-start space-x-3">
                <RadioGroupItem value={address.id} id={`shipping-address-${address.id}`} className="mt-1" />
                <Label htmlFor={`shipping-address-${address.id}`} className="flex-1 cursor-pointer">
                  <Card className="p-4">
                    <div className="leading-tight space-y-0">
                      <p className="font-medium">{address.fullName}</p>
                      {address.company && <p className="text-sm text-muted-foreground">{address.company}</p>}
                      <p className="text-sm text-muted-foreground">
                        {address.streetLine1}
                        {address.streetLine2 && `, ${address.streetLine2}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {address.postalCode} {address.city}{address.province ? `, ${address.province}` : ''}
                      </p>
                      <p className="text-sm text-muted-foreground">{address.country.name}</p>
                      <p className="text-sm text-muted-foreground">{address.phoneNumber}</p>
                    </div>
                  </Card>
                </Label>
              </div>
            ))}
          </RadioGroup>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="same-billing"
              checked={useSameForBilling}
              onCheckedChange={(checked) => setUseSameForBilling(checked === true)}
            />
            <label
              htmlFor="same-billing"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {t('useSameForBilling')}
            </label>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleSelectExistingAddress}
              disabled={!selectedAddressId || loading}
              className="flex-1"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('continueWithSelected')}
            </Button>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger render={<Button type="button" variant="outline" />}>
                {t('addNewAddress')}
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit(onSaveNewAddress)}>
                  <DialogHeader>
                    <DialogTitle>{t('addNewAddress')}</DialogTitle>
                    <DialogDescription>
                      {t('addNewAddressDescription')}
                    </DialogDescription>
                  </DialogHeader>

                  <FieldGroup className="my-6">
                    <div className="grid grid-cols-2 gap-4">
                      <Field className="col-span-2">
                        <FieldLabel htmlFor="fullName">{t('fullNameLabel')}</FieldLabel>
                        <Input
                          id="fullName"
                          {...register('fullName')}
                        />
                        <FieldError>{errors.fullName?.message}</FieldError>
                      </Field>

                      <Field className="col-span-2">
                        <FieldLabel htmlFor="company">{t('company')}</FieldLabel>
                        <Input id="company" {...register('company')} />
                      </Field>

                      <Field className="col-span-2">
                        <FieldLabel htmlFor="streetLine1">{t('streetAddress')}</FieldLabel>
                        <Input
                          id="streetLine1"
                          {...register('streetLine1', { required: t('streetRequired') })}
                        />
                        <FieldError>{errors.streetLine1?.message}</FieldError>
                      </Field>

                      <Field className="col-span-2">
                        <FieldLabel htmlFor="streetLine2">{t('apartment')}</FieldLabel>
                        <Input id="streetLine2" {...register('streetLine2')} />
                      </Field>

                      <Field>
                        <FieldLabel htmlFor="city">{t('cityLabel')}</FieldLabel>
                        <Input
                          id="city"
                          {...register('city')}
                        />
                        <FieldError>{errors.city?.message}</FieldError>
                      </Field>

                      <Field>
                        <FieldLabel htmlFor="province">{t('stateProvince')}</FieldLabel>
                        <Input
                          id="province"
                          {...register('province')}
                        />
                        <FieldError>{errors.province?.message}</FieldError>
                      </Field>

                      <Field>
                        <FieldLabel htmlFor="postalCode">{t('postalCodeLabel')}</FieldLabel>
                        <Input
                          id="postalCode"
                          {...register('postalCode')}
                        />
                        <FieldError>{errors.postalCode?.message}</FieldError>
                      </Field>

                      <Field>
                        <FieldLabel htmlFor="countryCode">{t('country')}</FieldLabel>
                        <Controller
                          name="countryCode"
                          control={control}
                          rules={{ required: t('countryRequired') }}
                          render={({ field }) => (
                            <CountrySelect
                              countries={countries}
                              value={field.value}
                              onValueChange={field.onChange}
                              disabled={saving}
                            />
                          )}
                        />
                        <FieldError>{errors.countryCode?.message}</FieldError>
                      </Field>

                      <Field className="col-span-2">
                        <FieldLabel htmlFor="phoneNumber">{t('phoneNumberLabel')}</FieldLabel>
                        <Input
                          id="phoneNumber"
                          type="tel"
                          {...register('phoneNumber')}
                        />
                        <FieldError>{errors.phoneNumber?.message}</FieldError>
                      </Field>
                    </div>
                  </FieldGroup>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                      {t('cancel')}
                    </Button>
                    <Button type="submit" disabled={saving}>
                      {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {t('saveAddress')}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      )}

      {addresses.length === 0 && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button type="button" className="w-full" />}>
            {t('addShippingAddress')}
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit(onSaveNewAddress)}>
              <DialogHeader>
                <DialogTitle>{t('addShippingAddress')}</DialogTitle>
                <DialogDescription>
                  {t('addShippingAddressDescription')}
                </DialogDescription>
              </DialogHeader>

              <FieldGroup className="my-6">
                <div className="grid grid-cols-2 gap-4">
                  <Field className="col-span-2">
                    <FieldLabel htmlFor="fullName">{t('fullNameLabel')}</FieldLabel>
                    <Input
                      id="fullName"
                      {...register('fullName')}
                    />
                    <FieldError>{errors.fullName?.message}</FieldError>
                  </Field>

                  <Field className="col-span-2">
                    <FieldLabel htmlFor="company">{t('company')}</FieldLabel>
                    <Input id="company" {...register('company')} />
                  </Field>

                  <Field className="col-span-2">
                    <FieldLabel htmlFor="streetLine1">{t('streetAddress')}</FieldLabel>
                    <Input
                      id="streetLine1"
                      {...register('streetLine1', { required: t('streetRequired') })}
                    />
                    <FieldError>{errors.streetLine1?.message}</FieldError>
                  </Field>

                  <Field className="col-span-2">
                    <FieldLabel htmlFor="streetLine2">{t('apartment')}</FieldLabel>
                    <Input id="streetLine2" {...register('streetLine2')} />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="city">{t('cityLabel')}</FieldLabel>
                    <Input
                      id="city"
                      {...register('city')}
                    />
                    <FieldError>{errors.city?.message}</FieldError>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="province">{t('stateProvince')}</FieldLabel>
                    <Input
                      id="province"
                      {...register('province')}
                    />
                    <FieldError>{errors.province?.message}</FieldError>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="postalCode">{t('postalCodeLabel')}</FieldLabel>
                    <Input
                      id="postalCode"
                      {...register('postalCode')}
                    />
                    <FieldError>{errors.postalCode?.message}</FieldError>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="countryCode">{t('country')}</FieldLabel>
                    <Controller
                      name="countryCode"
                      control={control}
                      rules={{ required: t('countryRequired') }}
                      render={({ field }) => (
                        <CountrySelect
                          countries={countries}
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={saving}
                        />
                      )}
                    />
                    <FieldError>{errors.countryCode?.message}</FieldError>
                  </Field>

                  <Field className="col-span-2">
                    <FieldLabel htmlFor="phoneNumber">{t('phoneNumberLabel')}</FieldLabel>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      {...register('phoneNumber')}
                    />
                    <FieldError>{errors.phoneNumber?.message}</FieldError>
                  </Field>
                </div>
              </FieldGroup>

              <DialogFooter>
                <Button type="submit" disabled={saving} className="w-full">
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('saveAddress')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
