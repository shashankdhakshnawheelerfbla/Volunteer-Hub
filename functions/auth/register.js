import { hashPassword } from "../_utils/passwords.js";
import {
    jsonResponse,
    handleApiError
} from "../_utils/responses.js";

export async function onRequest({ request, env }) {
    if (request.method !== "POST") {
        return jsonResponse(
            { error: "Method not allowed." },
            405
        );
    }

    try {
        let body;

        try {
            body = await request.json();
        } catch {
            return jsonResponse(
                { error: "Invalid JSON request body." },
                400
            );
        }

        const name =
            typeof body.name === "string"
                ? body.name.trim()
                : "";

        const email =
            typeof body.email === "string"
                ? body.email.trim().toLowerCase()
                : "";

        const password =
            typeof body.password === "string"
                ? body.password
                : "";

        if (!name || !email || !password) {
            return jsonResponse(
                { error: "Name, email, and password are required." },
                400
            );
        }

        if (name.length > 100) {
            return jsonResponse(
                { error: "Name is too long." },
                400
            );
        }

        if (
            email.length > 254 ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        ) {
            return jsonResponse(
                { error: "Enter a valid email address." },
                400
            );
        }

        if (password.length < 12 || password.length > 1024) {
            return jsonResponse(
                { error: "Password must be between 12 and 1024 characters." },
                400
            );
        }

        const existingVolunteer = await env.DB
            .prepare(
                "SELECT id FROM volunteers WHERE email = ? LIMIT 1"
            )
            .bind(email)
            .first();

        if (existingVolunteer) {
            return jsonResponse(
                { error: "An account with that email already exists." },
                409
            );
        }

        const passwordHash = await hashPassword(password);

        const results = await env.DB.batch([
            env.DB.prepare(
                "INSERT INTO volunteers (name, email) VALUES (?, ?)"
            ).bind(name, email),

            env.DB.prepare(
                `INSERT INTO password_credentials
                    (volunteer_id, password_hash)
                 VALUES (
                    (SELECT id FROM volunteers WHERE email = ?),
                    ?
                 )`
            ).bind(email, passwordHash)
        ]);

        if (
            results.length !== 2 ||
            results.some(result => result.success !== true)
        ) {
            throw new Error("Registration database operation failed.");
        }

        return jsonResponse(
            { message: "Account created successfully." },
            201
        );
    } catch (error) {
        return handleApiError(error, "Registration");
    }
}
