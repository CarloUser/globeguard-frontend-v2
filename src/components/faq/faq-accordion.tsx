import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from '@/components/ui/accordion';
import {Prose} from '@/components/legal/prose';
import type {SitePageFaqItem} from '@/lib/vendure/faq';

interface FaqAccordionProps {
    items: readonly SitePageFaqItem[];
    className?: string;
}

/**
 * Accordion of FAQ items. Answers are HTML that the backend sanitizes on write; they are
 * rendered through the `Prose` container (the only place using `dangerouslySetInnerHTML`).
 */
export function FaqAccordion({items, className}: FaqAccordionProps) {
    return (
        <Accordion className={className}>
            {items.map((item, index) => (
                <AccordionItem key={`${index}-${item.question}`} value={index} className="border-slate-200">
                    <AccordionTrigger className="text-base font-semibold text-foreground">{item.question}</AccordionTrigger>
                    <AccordionContent>
                        <Prose html={item.answerHtml} className="text-sm leading-6" />
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
    );
}
