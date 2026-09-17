'use client';

import {useState} from 'react';
import Image from 'next/image';
import {useTranslations} from 'next-intl';
import {ChevronLeft, ChevronRight} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {ProductVisual} from '@/components/commerce/product-visual';

interface ProductImageCarouselProps {
    productName: string;
    images: Array<{
        id: string;
        preview: string;
        source: string;
    }>;
}

export function ProductImageCarousel({productName, images}: ProductImageCarouselProps) {
    const t = useTranslations('Product');
    const [currentIndex, setCurrentIndex] = useState(0);

    if (!images || images.length === 0) {
        return (
            <ProductVisual
                name={productName}
                size="detail"
                className="aspect-[5/4] rounded-lg border border-slate-200 bg-white lg:aspect-[4/3]"
                priority
            />
        );
    }

    const goToPrevious = () => {
        setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };

    const goToNext = () => {
        setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    };

    return (
        <div className="space-y-3">
            <div className="group relative aspect-[5/4] overflow-hidden rounded-lg border border-slate-200 bg-white lg:aspect-[4/3]">
                <Image
                    src={images[currentIndex].source}
                    alt={t('imageAlt', {name: productName, index: currentIndex + 1})}
                    fill
                    className="object-contain p-6 transition-transform duration-500 group-hover:scale-[1.02]"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority={currentIndex === 0}
                />

                {images.length > 1 && (
                    <>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/85 shadow-sm opacity-0 transition-opacity hover:bg-white group-hover:opacity-100"
                            onClick={goToPrevious}
                            aria-label={t('previousImage')}
                        >
                            <ChevronLeft className="size-5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/85 shadow-sm opacity-0 transition-opacity hover:bg-white group-hover:opacity-100"
                            onClick={goToNext}
                            aria-label={t('nextImage')}
                        >
                            <ChevronRight className="size-5" />
                        </Button>
                    </>
                )}
            </div>

            {images.length > 1 && (
                <div className="grid grid-cols-4 gap-3">
                    {images.map((image, index) => (
                        <button
                            key={image.id}
                            type="button"
                            onClick={() => setCurrentIndex(index)}
                            aria-label={t('showImage', {name: productName, index: index + 1})}
                            aria-current={index === currentIndex ? 'true' : undefined}
                            className={`relative aspect-[4/3] overflow-hidden rounded-md border border-slate-200 bg-white transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                                index === currentIndex ? 'border-primary ring-1 ring-primary' : ''
                            }`}
                        >
                            <Image
                                src={image.preview}
                                alt={t('thumbnailAlt', {name: productName, index: index + 1})}
                                fill
                                className="object-contain p-2"
                                sizes="25vw"
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
