import {useTranslations} from 'next-intl';
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from '@/components/ui/accordion';
import type {BlogFaqSection} from '@/lib/vendure/blog';

interface BlogFaqProps {
    section: BlogFaqSection;
}

/**
 * FAQ accordion under a post (backend `blogFaq(slug)`). The first item is open by default,
 * matching the old storefront. Answers are editor HTML from the backend.
 */
export function BlogFaq({section}: BlogFaqProps) {
    const t = useTranslations('Blog');
    const items = [...section.items].sort((a, b) => a.sortOrder - b.sortOrder);
    if (items.length === 0) {
        return null;
    }

    const heading = section.title?.trim() || t('faqHeading');
    const intro = section.intro?.trim();

    return (
        <section aria-labelledby="blog-faq-heading" className="mt-12 rounded-md border border-slate-200 bg-white p-5 md:p-6">
            <h2 id="blog-faq-heading" className="text-2xl font-bold text-foreground">{heading}</h2>
            {intro && <p className="mt-2 text-sm leading-6 text-slate-600">{intro}</p>}
            <Accordion className="mt-4" defaultValue={[`faq-0`]}>
                {items.map((item, index) => (
                    <AccordionItem key={`${item.sortOrder}-${index}`} value={`faq-${index}`}>
                        <AccordionTrigger className="text-base">{item.question}</AccordionTrigger>
                        <AccordionContent>
                            <div
                                className="text-sm leading-6 text-slate-600 [&_a]:text-primary [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
                                dangerouslySetInnerHTML={{__html: item.answerHtml}}
                            />
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </section>
    );
}
