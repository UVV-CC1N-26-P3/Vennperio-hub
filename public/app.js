const feedUrl = "/api/v1/announcements.json";
const announcementList = document.getElementById("announcementList");
const announcementCount = document.getElementById("announcementCount");
const productVersion = document.getElementById("productVersion");
const productStatus = document.getElementById("productStatus");
const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeZone: "America/Sao_Paulo"
});

loadAnnouncements();

async function loadAnnouncements() {
    try {
        const response = await fetch(feedUrl, {
            cache: "no-cache",
            headers: {
                Accept: "application/json"
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const feed = await response.json();

        renderProduct(feed.product);
        renderAnnouncements(getVisibleAnnouncements(feed.announcements));
    } catch (error) {
        console.error("Falha ao carregar os comunicados:", error);
        renderError();
    }
}

function getVisibleAnnouncements(announcements) {
    const now = Date.now();

    return (Array.isArray(announcements) ? announcements : []).filter(announcement => (
        announcement
        && announcement.active === true
        && (!announcement.expiresAt || Date.parse(announcement.expiresAt) > now)
    ));
}

function renderProduct(product) {
    if (!product || typeof product !== "object") {
        return;
    }

    productVersion.textContent = normalizeText(product.version, "Alpha");
    productStatus.textContent = normalizeText(product.status, "Em desenvolvimento");
}

function renderAnnouncements(announcements) {
    announcementList.replaceChildren();
    announcementCount.textContent = `${announcements.length} comunicado${announcements.length === 1 ? "" : "s"}`;

    if (announcements.length === 0) {
        announcementList.append(createMessageCard(
            "announcement-card--empty",
            "Nenhum comunicado ativo."
        ));
        return;
    }

    for (const announcement of announcements) {
        announcementList.append(createAnnouncementCard(announcement));
    }
}

function createAnnouncementCard(announcement) {
    const article = document.createElement("article");
    const metadata = document.createElement("div");
    const badge = document.createElement("span");
    const version = document.createElement("span");
    const publishedAt = document.createElement("time");
    const title = document.createElement("h3");
    const message = document.createElement("p");

    article.className = "announcement-card";
    article.dataset.severity = normalizeSeverity(announcement.severity);
    metadata.className = "announcement-card__meta";
    badge.className = "announcement-card__badge";
    badge.textContent = getTypeLabel(announcement.type);
    version.textContent = normalizeText(announcement.version, "Alpha");
    publishedAt.dateTime = announcement.publishedAt;
    publishedAt.textContent = formatDate(announcement.publishedAt);
    title.textContent = normalizeText(announcement.title, "Comunicado");
    message.className = "announcement-card__message";
    message.textContent = normalizeText(announcement.message, "");

    metadata.append(badge, version, publishedAt);
    article.append(metadata, title, message);

    if (typeof announcement.details === "string" && announcement.details.trim()) {
        const details = document.createElement("p");

        details.className = "announcement-card__details";
        details.textContent = announcement.details.trim();
        article.append(details);
    }

    return article;
}

function renderError() {
    announcementCount.textContent = "";
    announcementList.replaceChildren(createMessageCard(
        "announcement-card--error",
        "Não foi possível carregar os comunicados agora."
    ));
}

function createMessageCard(className, message) {
    const article = document.createElement("article");
    const paragraph = document.createElement("p");

    article.className = `announcement-card ${className}`;
    paragraph.textContent = message;
    article.append(paragraph);
    return article;
}

function normalizeSeverity(value) {
    return value === "warning" || value === "critical" ? value : "info";
}

function getTypeLabel(value) {
    const labels = {
        development: "Desenvolvimento",
        update: "Atualização",
        maintenance: "Manutenção",
        incident: "Incidente"
    };

    return labels[value] || "Comunicado";
}

function formatDate(value) {
    const date = new Date(value);

    return Number.isFinite(date.getTime()) ? dateFormatter.format(date) : "Data indisponível";
}

function normalizeText(value, fallback) {
    return typeof value === "string" && value.trim() ? value.trim() : fallback;
}
