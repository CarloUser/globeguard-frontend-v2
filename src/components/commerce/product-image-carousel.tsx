'use client';

import {useMemo, useState} from 'react';
import Image from 'next/image';
import {ChevronLeft, ChevronRight} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {ProductVisual, getProductPlaceholderSource} from '@/components/commerce/product-visual';

interface ProductImageCarouselProps {
    productName: string;
    images: Array<{
        id: string;
        preview: string;
        source: string;
    }>;
}

const fallbackGallery = [
    {id: 'basic-kit', label: 'BASIC kit', source: '/placeholders/basic-kit.svg'},
    {id: 'pro-workshop', label: 'PRO workshop', source: '/placeholders/pro-workshop.svg'},
    {id: 'adapter-cables', label: 'Adapters and cables', source: '/placeholders/adapter-cables.svg'},
    {id: 'software-updates', label: 'Software updates', source: '/placeholders/software-updates.svg'},
];

function getOrderedFallbackGallery(productName: string) {
    const primarySource = getProductPlaceholderSource(productName);
    return [...fallbackGallery].sort((a, b) => Number(b.source === primarySource) - Number(a.source === primarySource));
}

export function ProductImageCarousel({productName, images}: ProductImageCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const fallbackImages = useMemo(() => getOrderedFallbackGallery(productName), [productName]);

    if (!images || images.length === 0) {
        const currentFallback = fallbackImages[currentIndex] ?? fallbackImages[0];

        return (
            <div className="space-y-3">
                <ProductVisual
                    name={`${productName} ${currentFallback.label}`}
                    asset={{source: currentFallback.source, preview: currentFallback.source}}
                    size="detail"
                    className="aspect-[5/4] rounded-lg border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950 lg:aspect-[4/3]"
                    priority
                />
                <div className="grid grid-cols-4 gap-3">
                    {fallbackImages.map((image, index) => (
                        <button
                            key={image.id}
                            type="button"
                            aria-label={`Show ${image.label} placeholder`}
                            aria-current={index === currentIndex ? 'true' : undefined}
                            onClick={() => setCurrentIndex(index)}
                            className={`relative aspect-[4/3] overflow-hidden rounded-md border border-slate-200 bg-white transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:border-white/10 dark:bg-slate-950 ${
                                index === currentIndex ? 'border-primary ring-1 ring-primary' : ''
                            }`}
                        >
                            <Image
                                src={image.source}
                                alt={`${image.label} thumbnail`}
                                fill
                                className="object-contain p-2"
                                sizes="(max-width: 640px) 25vw, 150px"
                            />
                        </button>
                    ))}
                </div>
            </div>
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
            <div className="group relative aspect-[5/4] overflow-hidden rounded-lg border border-slate-200 bg-white lg:aspect-[4/3] dark:border-white/10 dark:bg-slate-950">
                <Image
                    src={images[currentIndex].source}
                    alt={`${productName} image ${currentIndex + 1}`}
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
                            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/85 shadow-sm opacity-0 transition-opacity hover:bg-white group-hover:opacity-100 dark:bg-slate-950/80 dark:hover:bg-slate-950"
                            onClick={goToPrevious}
                            aria-label="Previous product image"
                        >
                            <ChevronLeft className="size-5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/85 shadow-sm opacity-0 transition-opacity hover:bg-white group-hover:opacity-100 dark:bg-slate-950/80 dark:hover:bg-slate-950"
                            onClick={goToNext}
                            aria-label="Next product image"
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
                            aria-label={`Show ${productName} image ${index + 1}`}
                            aria-current={index === currentIndex ? 'true' : undefined}
                            className={`relative aspect-[4/3] overflow-hidden rounded-md border border-slate-200 bg-white transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:border-white/10 dark:bg-slate-950 ${
                                index === currentIndex ? 'border-primary ring-1 ring-primary' : ''
                            }`}
                        >
                            <Image
                                src={image.preview}
                                alt={`${productName} thumbnail ${index + 1}`}
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