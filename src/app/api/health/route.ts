export async function GET() {
    return Response.json({
        status: 'ok',
        service: 'globeguard-frontend',
        timestamp: new Date().toISOString(),
    });
}