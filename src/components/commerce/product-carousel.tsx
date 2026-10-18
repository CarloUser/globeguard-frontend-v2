'use client';

import {ProductCard} from '@/components/commerce/product-card';
import {Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious} from '@/components/ui/carousel';
import {FragmentOf} from '@/graphql';
import {ProductCardFragment} from '@/lib/vendure/fragments';
import {useTranslations} from 'next-intl';
import {useId} from 'react';

interface ProductCarouselClientProps {
    title: string;
    products: Array<FragmentOf<typeof ProductCardFragment>>;
}

export function ProductCarousel({title, products}: ProductCarouselClientProps) {
    const id = useId();
    const t = useTranslations('Common');

    return (
        <section className="bg-muted/40 py-12 md:py-16">
            <div className="container mx-auto px-4">
                <div className="mb-8 flex items-end justify-between gap-4">
                    <h2 id={`${id}-title`} className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">{title}</h2>
                </div>
                <Carousel
                    opts={{
                        align: 'start',
                        loop: true,
                    }}
                    className="w-full md:px-12"
                    // Screen readers announce the role descriptions verbatim, so they must be in the page language
                    aria-labelledby={`${id}-title`}
                    aria-roledescription={t('carousel')}
                >
                    <CarouselContent className="-ml-3 md:-ml-4">
                        {products.map((product, i) => (
                            <CarouselItem key={id + i}
                                          aria-roledescription={t('carouselSlide')}
                                          className="basis-full pl-3 sm:basis-1/2 md:pl-4 lg:basis-1/3 xl:basis-1/4">
                                <ProductCard product={product}/>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious className="left-0 hidden md:flex" label={t('previousSlide')}/>
                    <CarouselNext className="right-0 hidden md:flex" label={t('nextSlide')}/>
                </Carousel>
            </div>
        </section>
    );
}
