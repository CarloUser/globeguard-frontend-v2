import {NextResponse} from 'next/server';
import {getCompatibilityRecommendation} from '@/lib/vendure/compatibility';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const vehicleGroup = typeof body.vehicleGroup === 'string' ? body.vehicleGroup.trim() : '';
        const brand = typeof body.brand === 'string' ? body.brand.trim() : '';
        const languageCode = typeof body.languageCode === 'string' ? body.languageCode.trim() : undefined;

        if (!brand) {
            return NextResponse.json({error: 'brand is required'}, {status: 400});
        }

        const recommendation = await getCompatibilityRecommendation(
            {
                vehicleGroup: vehicleGroup || null,
                brand,
            },
            languageCode,
        );

        return NextResponse.json(recommendation);
    } catch (error) {
        return NextResponse.json(
            {error: error instanceof Error ? error.message : 'Could not calculate compatibility recommendation'},
            {status: 500},
        );
    }
}
