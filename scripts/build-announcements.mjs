import { readFile, readdir, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(scriptDirectory, "..");
const announcementsDirectory = path.join(projectDirectory, "content", "announcements");
const outputDirectory = path.join(projectDirectory, "public", "api", "v1");
const outputPath = path.join(outputDirectory, "announcements.json");
const allowedTypes = new Set(["development", "update", "maintenance", "incident"]);
const allowedSeverities = new Set(["info", "warning", "critical"]);
const checkOnly = process.argv.includes("--check");

const files = (await readdir(announcementsDirectory))
    .filter(file => file.endsWith(".json"))
    .sort();

if (files.length === 0) {
    throw new Error("Nenhum comunicado foi encontrado.");
}

const announcements = [];
const ids = new Set();

for (const file of files) {
    const filePath = path.join(announcementsDirectory, file);
    const announcement = JSON.parse(await readFile(filePath, "utf8"));

    validateAnnouncement(announcement, file);

    if (ids.has(announcement.id)) {
        throw new Error(`${file}: o id "${announcement.id}" está duplicado.`);
    }

    ids.add(announcement.id);
    announcements.push(announcement);
}

announcements.sort((first, second) => (
    Date.parse(second.publishedAt) - Date.parse(first.publishedAt)
));

if (checkOnly) {
    console.log(`${announcements.length} comunicado(s) válido(s).`);
    process.exit(0);
}

const feed = {
    schemaVersion: 1,
    channel: "alpha",
    product: {
        name: "Vennperio",
        version: "alpha",
        status: "Em desenvolvimento"
    },
    announcements
};

await mkdir(outputDirectory, { recursive: true });
await writeFile(outputPath, `${JSON.stringify(feed, null, 2)}\n`, "utf8");
console.log(`Feed gerado em ${path.relative(projectDirectory, outputPath)}.`);

function validateAnnouncement(announcement, file) {
    if (!isPlainObject(announcement)) {
        throw new Error(`${file}: o conteúdo deve ser um objeto JSON.`);
    }

    requireString(announcement, "id", file, 80);
    requireString(announcement, "version", file, 32);
    requireString(announcement, "title", file, 80);
    requireString(announcement, "message", file, 240);

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(announcement.id)) {
        throw new Error(`${file}: "id" deve usar letras minúsculas, números e hífens.`);
    }

    if (!allowedTypes.has(announcement.type)) {
        throw new Error(`${file}: tipo inválido "${announcement.type}".`);
    }

    if (!allowedSeverities.has(announcement.severity)) {
        throw new Error(`${file}: severidade inválida "${announcement.severity}".`);
    }

    validateOptionalString(announcement, "details", file, 1000);
    validateDate(announcement, "publishedAt", file, false);
    validateDate(announcement, "startsAt", file, true);
    validateDate(announcement, "endsAt", file, true);
    validateDate(announcement, "expiresAt", file, true);
    requireBoolean(announcement, "dismissible", file);
    requireBoolean(announcement, "active", file);

    if (announcement.startsAt && announcement.endsAt
        && Date.parse(announcement.endsAt) <= Date.parse(announcement.startsAt)) {
        throw new Error(`${file}: "endsAt" deve ser posterior a "startsAt".`);
    }

    const allowedKeys = new Set([
        "id",
        "version",
        "type",
        "severity",
        "title",
        "message",
        "details",
        "publishedAt",
        "startsAt",
        "endsAt",
        "expiresAt",
        "dismissible",
        "active"
    ]);

    for (const key of Object.keys(announcement)) {
        if (!allowedKeys.has(key)) {
            throw new Error(`${file}: campo desconhecido "${key}".`);
        }
    }
}

function requireString(value, key, file, maxLength) {
    if (typeof value[key] !== "string" || value[key].trim().length === 0) {
        throw new Error(`${file}: "${key}" deve ser um texto preenchido.`);
    }

    if (value[key].length > maxLength) {
        throw new Error(`${file}: "${key}" excede ${maxLength} caracteres.`);
    }
}

function validateOptionalString(value, key, file, maxLength) {
    if (value[key] === undefined) {
        return;
    }

    if (typeof value[key] !== "string" || value[key].length > maxLength) {
        throw new Error(`${file}: "${key}" deve ser um texto de até ${maxLength} caracteres.`);
    }
}

function requireBoolean(value, key, file) {
    if (typeof value[key] !== "boolean") {
        throw new Error(`${file}: "${key}" deve ser booleano.`);
    }
}

function validateDate(value, key, file, nullable) {
    if (nullable && value[key] === null) {
        return;
    }

    if (typeof value[key] !== "string"
        || !hasExplicitTimezone(value[key])
        || !Number.isFinite(Date.parse(value[key]))) {
        throw new Error(`${file}: "${key}" deve ser uma data ISO 8601 com fuso horário.`);
    }
}

function hasExplicitTimezone(value) {
    return /(?:Z|[+-]\d{2}:\d{2})$/.test(value);
}

function isPlainObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}
