import type {JsonLd} from '@/lib/blog/structured-data';

interface JsonLdScriptProps {
    data: JsonLd | readonly JsonLd[];
}

/**
 * Renders one or more schema.org objects as `application/ld+json`. `<` is escaped so that
 * editor-provided strings can never close the script element.
 */
export function JsonLdScript({data}: JsonLdScriptProps) {
    const entries = Array.isArray(data) ? data : [data];
    if (entries.length === 0) {
        return null;
    }

    return (
        <>
            {entries.map((entry, index) => (
                <script
                    key={index}
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{__html: JSON.stringify(entry).replace(/</g, '\\u003c')}}
                />
            ))}
        </>
    );
}
