/*
 * Coordinator Review API
 *
 * Intended actions:
 * - Approve reports
 * - Reject reports
 * - Request changes
 *
 * Must verify coordinator permissions on the server.
 */

export async function onRequest() {
    return new Response(
        JSON.stringify({
            error: "Coordinator review API is not configured yet."
        }),
        {
            status: 501,
            headers: {
                "Content-Type": "application/json"
            }
        }
    );
}
