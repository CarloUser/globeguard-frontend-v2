'use client';

import {ProductCard} from '@/components/commerce/product-card';
import {Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious} from '@/components/ui/carousel';
import {FragmentOf} from '@/graphql';
import {ProductCardFragment} from '@/lib/vendure/fragments';
import {useId} from 'react';

interface ProductCarouselClientProps {
    title: string;
    products: Array<FragmentOf<typeof ProductCardFragment>>;
}

export function ProductCarousel({title, products}: ProductCarouselClientProps) {
    const id = useId();

    return (
        <section className="bg-muted/40 py-12 md:py-16">
            <div className="container mx-auto px-4">
                <div className="mb-8 flex items-end justify-between gap-4">
                    <h2 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">{title}</h2>
                </div>
                <Carousel
                    opts={{
                        align: 'start',
                        loop: true,
                    }}
                    className="w-full"
                >
                    <CarouselContent className="-ml-3 md:-ml-4">
                        {products.map((product, i) => (
                            <CarouselItem key={id + i}
                                          className="basis-full pl-3 sm:basis-1/2 md:pl-4 lg:basis-1/3 xl:basis-1/4">
                                <ProductCard product={product}/>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious className="hidden md:flex"/>
                    <CarouselNext className="hidden md:flex"/>
                </Carousel>
            </div>
        </section>
    );
}
