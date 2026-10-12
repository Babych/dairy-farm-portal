// Feature Module: Animals Herd Management & Animal Details
// Uses Repository Layer (AnimalRepository) for persistence decoupling
import { AnimalRepository } from './repositories/animalRepo.js';

export async function handleAnimals({ path, method, request, url, db, jsonResponse, getActiveFarmId }) {
    // 1. GET /api/animals
    if (path === "/api/animals" && method === "GET") {
        const limit = parseInt(url.searchParams.get("limit") || "50");
        const offset = parseInt(url.searchParams.get("offset") || "0");
        const search = url.searchParams.get("q") || url.searchParams.get("search") || "";
        const status = url.searchParams.get("status") || "ALL";
        const farmId = getActiveFarmId();

        const result = await AnimalRepository.searchAnimals(db, {
            farmId,
            search,
            status,
            limit,
            offset
        });
        return jsonResponse(result);
    }

    // 2. POST /api/animals (Insert single animal or batch list)
    if (path === "/api/animals" && method === "POST") {
        const body = await request.json();
        const items = Array.isArray(body) ? body : [body];
        const inserted = await AnimalRepository.batchInsert(db, items);
        return jsonResponse({ status: "success", inserted_count: inserted }, 201);
    }

    // 3. DELETE /api/animals/:id
    if (path.startsWith("/api/animals/") && method === "DELETE") {
        const animalId = path.split("/")[3];
        await AnimalRepository.deleteCascade(db, animalId);
        return jsonResponse({ status: "success", deleted_id: animalId });
    }

    // 4. GET /api/animals/:id (Animal Passport + Repro & Health History)
    if (path.startsWith("/api/animals/") && method === "GET") {
        const parts = path.split("/");
        const animalId = parts[3];
        const animalData = await AnimalRepository.getAnimal360(db, animalId);
        if (!animalData) return jsonResponse({ detail: "Корову не знайдено" }, 404);

        return jsonResponse(animalData);
    }

    return null;
}
