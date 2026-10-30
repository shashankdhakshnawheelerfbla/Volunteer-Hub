export function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "no-store"
        }
    });
}

export function handleApiError(error, context = "API request") {
    const safeMessage =
        error instanceof Error ? error.name : "Unknown error";

    console.error(`[${context}] ${safeMessage}`);

    return jsonResponse(
        { error: "An unexpected server error occurred." },
        500
    );
}
