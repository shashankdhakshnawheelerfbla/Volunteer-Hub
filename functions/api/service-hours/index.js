/*
 * Service Hours API
 *
 * GET: Retrieve reports.
 * POST: Submit reports.
 *
 * This endpoint is intentionally disabled until
 * authentication and authorization are implemented.
 */

export async function onRequest() {
    return new Response(
        JSON.stringify({
            error: "Service Hours API is not configured yet."
        }),
        {
            status: 501,
            headers: {
                "Content-Type": "application/json"
            }
        }
    );
}
