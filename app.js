const demoResources = [
  {
    name: "Executive Sales Dashboard",
    category: "Power BI",
    url: "#",
    owner: "BI Team",
    description: "Main leadership dashboard for sales, targets, product performance, and weekly movement.",
    tags: ["sales", "weekly", "management"],
    pinned: true
  },
  {
    name: "Operations KPI Dashboard",
    category: "Power BI",
    url: "#",
    owner: "Data Team",
    description: "Daily operational KPIs, SLA checks, volume trends, and exception monitoring.",
    tags: ["ops", "daily", "kpi"],
    pinned: true
  },
  {
    name: "Monthly Reporting Pack",
    category: "Excel",
    url: "#",
    owner: "Reporting",
    description: "Excel workbook template for month-end reporting, validation, and manual commentary.",
    tags: ["month-end", "template", "excel"],
    pinned: false
  },
  {
    name: "Raw Data Folder",
    category: "Data Sources",
    url: "#",
    owner: "Data Ops",
    description: "Shared folder for raw exports, intake files, and source snapshots used by the team.",
    tags: ["folder", "source", "raw"],
    pinned: true
  },
  {
    name: "Data Dictionary",
    category: "Docs",
    url: "#",
    owner: "Governance",
    description: "Definitions for key metrics, fields, business rules, and calculation logic.",
    tags: ["definitions", "metrics", "sop"],
    pinned: false
  },
  {
    name: "Refresh Checklist",
    category: "Docs",
    url: "#",
    owner: "BI Team",
    description: "Step-by-step checks for dashboard refresh, issue triage, and stakeholder updates.",
    tags: ["refresh", "checklist", "power bi"],
    pinned: false
  }
];

const categories = ["All", "Power BI", "Excel", "Data Sources", "Docs", "Automation"];
const iconByCategory = {
  "Power BI": "BI",
  Excel: "XL",
  "Data Sources": "DB",
  Docs: "DO",
  Automation: "AU"
};

const storageKey = "data-team-hub-resources";
const generatedResources = mergeResources(
  Array.isArray(window.HUB_RESOURCES) ? window.HUB_RESOURCES : [],
  Array.isArray(window.HUB_SOPS) ? window.HUB_SOPS : []
);
let resources = loadResources();
let activeCategory = "All";
let editingResourceKey = null;

const resourceGrid = document.querySelector("#resourceGrid");
const featuredGrid = document.querySelector("#featuredGrid");
const quickLinks = document.querySelector("#quickLinks");
const filterTabs = document.querySelector("#filterTabs");
const searchInput = document.querySelector("#searchInput");
const resultCount = document.querySelector("#resultCount");
const emptyState = document.querySelector("#emptyState");
const dialog = document.querySelector("#resourceDialog");
const form = document.querySelector("#resourceForm");

function loadResources() {
  const stored = localStorage.getItem(storageKey);
  if (!stored) {
    return generatedResources.length ? generatedResources : demoResources;
  }

  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? mergeResources(parsed, generatedResources) : generatedResources.length ? generatedResources : demoResources;
  } catch {
    return generatedResources.length ? generatedResources : demoResources;
  }
}

function saveResources() {
  localStorage.setItem(storageKey, JSON.stringify(resources));
}

function mergeResources(primaryResources, secondaryResources) {
  const byKey = new Map();

  secondaryResources.forEach((resource) => {
    byKey.set(getResourceKey(resource), resource);
  });

  primaryResources.forEach((resource) => {
    const key = getResourceKey(resource);
    if (resource.sop && !byKey.has(key)) return;
    const generated = byKey.get(key) || {};
    byKey.set(key, {
      ...generated,
      ...resource,
      url: resource.url && resource.url !== "#" ? resource.url : generated.url || "#",
      featured: resource.featured ?? generated.featured,
      pinned: resource.pinned ?? generated.pinned
    });
  });

  return Array.from(byKey.values());
}

function normalize(value) {
  return value.toLowerCase().trim();
}

function matchesSearch(resource, keyword) {
  if (!keyword) {
    return true;
  }

  const searchable = [
    resource.name,
    resource.category,
    resource.owner,
    resource.description,
    ...(resource.tags || [])
  ].join(" ");

  return normalize(searchable).includes(keyword);
}

function filteredResources() {
  const keyword = normalize(searchInput.value);
  return resources.filter((resource) => {
    if (resource.sop) return false;
    const categoryMatch = activeCategory === "All" || resource.category === activeCategory;
    return categoryMatch && matchesSearch(resource, keyword);
  });
}

function renderFilters() {
  if (!filterTabs) return;
  filterTabs.innerHTML = categories
    .map((category) => {
      const isActive = category === activeCategory ? "active" : "";
      return `<button class="${isActive}" type="button" data-category="${category}">${category}</button>`;
    })
    .join("");
}

function renderStats() {
  if (!document.querySelector("#totalResources")) return;
  document.querySelector("#totalResources").textContent = resources.length;
  document.querySelector("#powerBiCount").textContent = resources.filter((item) => item.category === "Power BI").length;
  document.querySelector("#excelCount").textContent = resources.filter((item) => item.category === "Excel").length;
  document.querySelector("#featuredCount").textContent = `${resources.filter((item) => item.featured).length} shortcuts`;
}

function renderFeatured() {
  if (!featuredGrid) return;
  const priority = ["KL Data Team Meeting Minutes", "Data Team Dashboard", "Path Tracking Worksheet"];
  const featuredResources = resources.filter((resource) => priority.includes(resource.name)).sort((a, b) => priority.indexOf(a.name) - priority.indexOf(b.name));
  document.querySelector("#featuredCount").textContent = `${featuredResources.length} shortcuts`;

  featuredGrid.innerHTML = featuredResources
    .map((resource) => {
      const hasLink = resource.url && resource.url !== "#";
      const resourceKey = getResourceKey(resource);
      const action = hasLink
        ? `<a class="tool-action" href="${escapeAttribute(resource.url)}" target="_blank" rel="noreferrer">Open</a>`
        : `<button class="tool-action missing-link-button" type="button" data-resource-key="${escapeAttribute(resourceKey)}">Add link</button>`;

      return `
        <article class="tool-card">
          <div>
            <span class="tool-type">${escapeHtml(resource.category)}</span>
            <h4>${escapeHtml(resource.name)}</h4>
            <p>${escapeHtml(resource.tags?.includes("folder") ? "Shared folder" : resource.category === "Power BI" ? "Team performance & reporting" : resource.name === "Path Tracking Worksheet" ? "Path tracking & team progress" : resource.category === "Automation" ? "Pole pinning, Excel 360 & KML" : resource.name.includes("Checklist") ? "Weekly checks & progress" : "Meeting notes & weekly priorities")}</p>
          </div>
          ${action}
        </article>
      `;
    })
    .join("");
}

function renderCards() {
  if (!resourceGrid) return;
  const visibleResources = filteredResources();
  resultCount.textContent = `${visibleResources.length} ${visibleResources.length === 1 ? "item" : "items"}`;
  emptyState.hidden = visibleResources.length > 0;

  resourceGrid.innerHTML = visibleResources
    .map((resource) => {
      const icon = iconByCategory[resource.category] || "DT";
      const hasLink = resource.url && resource.url !== "#";
      const resourceKey = getResourceKey(resource);
      const tags = (resource.tags || [])
        .map((tag) => `<span>${escapeHtml(tag)}</span>`)
        .join("");

      return `
        <article class="resource-card">
          <div class="card-top">
            <div class="card-icon" aria-hidden="true">${icon}</div>
            <div>
              <h4>${escapeHtml(resource.name)}</h4>
              <p>${escapeHtml(resource.description || "No description yet.")}</p>
            </div>
          </div>
          <div class="meta-row">
            <span>${escapeHtml(resource.category)}</span>
            <span>${escapeHtml(resource.owner || "Data Team")}</span>
          </div>
          <div class="tag-row">${tags}</div>
          ${
            hasLink
              ? `<a class="open-link" href="${escapeAttribute(resource.url)}" target="_blank" rel="noreferrer">Open</a>`
              : `<button class="open-link missing-link-button" type="button" data-resource-key="${escapeAttribute(resourceKey)}">Add link</button>`
          }
        </article>
      `;
    })
    .join("");
}

function renderQuickLinks() {
  if (!quickLinks) return;
  const pinned = resources.filter((resource) => resource.pinned).slice(0, 5);
  quickLinks.innerHTML = pinned
    .map(
      (resource) => {
        const hasLink = resource.url && resource.url !== "#";
        const tag = hasLink ? "a" : "button";
        const href = hasLink ? `href="${escapeAttribute(resource.url)}" target="_blank" rel="noreferrer"` : `type="button" data-resource-key="${escapeAttribute(getResourceKey(resource))}"`;

        return `
          <${tag} class="quick-link ${hasLink ? "" : "missing-link-button"}" ${href}>
            <strong>${escapeHtml(resource.name)}</strong>
            <span>${escapeHtml(resource.category)} · ${escapeHtml(resource.owner || "Data Team")}</span>
          </${tag}>
        `;
      }
    )
    .join("");
}

function render() {
  renderFilters();
  renderStats();
  renderFeatured();
  renderCards();
  renderQuickLinks();
  renderSops();
}

function renderSops() {
  if (!document.querySelector("#sopList")) return;
  const keyword = normalize(document.querySelector("#sopSearch").value);
  const sops = resources.filter((item) => item.sop && matchesSearch(item, keyword));
  document.querySelector("#sopCount").textContent = `${sops.length} ${sops.length === 1 ? "document" : "documents"}`;
  document.querySelector("#sopEmpty").hidden = sops.length > 0;
  document.querySelector("#sopList").innerHTML = sops.map((item) => {
    const key = escapeAttribute(getResourceKey(item));
    let hasLink = false;
    try { hasLink = new URL(item.url).protocol === "https:"; } catch {}
    const wordLink = getWordLink(item);
    return `<article class="sop-row">
      <span class="sop-number">${escapeHtml(item.number || "SOP")}</span>
      <div class="sop-title"><h4>${escapeHtml(item.name)}</h4><p>${escapeHtml(item.format || "Document")}${hasLink ? " / Original document" : " / Link needed"}</p></div>
      <div class="sop-actions">${hasLink
        ? `<a class="primary-button" href="${escapeAttribute(item.url)}" target="_blank" rel="noopener noreferrer">Open document</a>${wordLink ? `<a class="secondary-button word-link" href="${escapeAttribute(wordLink)}">Open in Word</a>` : ""}`
        : `<button type="button" class="secondary-button missing-link-button" data-resource-key="${key}">Add document link</button>`}</div>
    </article>`;
  }).join("");
}

function getWordLink(item) {
  if (item.format !== "Word") return "";
  try {
    const url = new URL(item.wordUrl || item.url);
    if (url.protocol !== "https:" || !url.hostname.endsWith(".sharepoint.com") || !/\.docx?$/i.test(url.pathname) || url.href.includes("|")) return "";
    url.searchParams.delete("web");
    return `ms-word:ofe|u|${url.href}`;
  } catch { return ""; }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value || "#");
}

function getResourceKey(resource) {
  return normalize(`${resource.name || ""}|${resource.category || ""}`);
}

function openLinkEditor(resourceKey) {
  const resource = resources.find((item) => getResourceKey(item) === resourceKey);
  if (!resource) {
    return;
  }

  editingResourceKey = resourceKey;
  form.reset();
  form.elements.name.value = resource.name || "";
  form.elements.category.value = resource.category || "Docs";
  form.elements.url.value = resource.url === "#" ? "" : resource.url || "";
  if (form.elements.wordUrl) form.elements.wordUrl.value = resource.wordUrl || "";
  form.elements.owner.value = resource.owner || "Data Team";
  form.elements.description.value = resource.description || "";
  form.elements.tags.value = (resource.tags || []).join(", ");
  document.querySelector("#resourceDialog h3").textContent = "Update resource link";
  dialog.showModal();
}

filterTabs?.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) {
    return;
  }

  activeCategory = button.dataset.category;
  render();
});

searchInput?.addEventListener("input", renderCards);

document.querySelectorAll("[data-section-link]").forEach((link) => {
  link.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach((item) => item.classList.remove("active"));
    link.classList.add("active");

    const section = link.dataset.sectionLink;
    if (section === "sop") {
      document.querySelector("#sop").scrollIntoView({ behavior: "smooth" });
      return;
    }
    activeCategory = section === "overview" ? "All" : section;
    render();
    if (section !== "overview") document.querySelector(".toolbar").scrollIntoView({ behavior: "smooth" });
  });
});

document.querySelector("#addResourceButton")?.addEventListener("click", () => {
  editingResourceKey = null;
  form.reset();
  document.querySelector("#resourceDialog h3").textContent = "Add resource";
  dialog.showModal();
});

document.querySelector("#closeDialogButton").addEventListener("click", () => {
  dialog.close();
});

document.querySelector("#resetResourcesButton").addEventListener("click", () => {
  resources = generatedResources.length ? generatedResources : demoResources;
  saveResources();
  render();
  dialog.close();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(form);
  const urlInput = form.elements.url;
  urlInput.setCustomValidity("");
  try {
    if (new URL(formData.get("url")).protocol !== "https:") throw new Error();
  } catch {
    urlInput.setCustomValidity("Use an HTTPS document or report link.");
    urlInput.reportValidity();
    return;
  }
  const tags = String(formData.get("tags") || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  const resource = {
    name: formData.get("name"),
    category: formData.get("category"),
    url: formData.get("url"),
    owner: formData.get("owner") || "Data Team",
    description: formData.get("description") || "",
    tags,
    pinned: resources.length < 3
  };
  if (form.elements.wordUrl) {
    const wordUrl = String(formData.get("wordUrl") || "").trim();
    form.elements.wordUrl.setCustomValidity("");
    if (wordUrl && !getWordLink({ format: "Word", wordUrl })) {
      form.elements.wordUrl.setCustomValidity("Use the HTTPS SharePoint file address ending in .docx or .doc.");
      form.elements.wordUrl.reportValidity();
      return;
    }
    resource.wordUrl = wordUrl;
  }

  if (editingResourceKey) {
    resources = resources.map((item) => {
      if (getResourceKey(item) !== editingResourceKey) {
        return item;
      }

      return {
        ...item,
        ...resource,
        pinned: item.pinned
      };
    });
  } else {
    resources = [resource, ...resources];
  }

  saveResources();
  render();
  editingResourceKey = null;
  dialog.close();
});

document.addEventListener("click", (event) => {
  const button = event.target.closest(".missing-link-button");
  if (!button) {
    return;
  }

  openLinkEditor(button.dataset.resourceKey);
});

render();

form.elements.url.addEventListener("input", () => form.elements.url.setCustomValidity(""));
form.elements.wordUrl?.addEventListener("input", () => form.elements.wordUrl.setCustomValidity(""));
document.querySelector("#sopSearch")?.addEventListener("input", renderSops);
document.querySelector("#exportLinksButton").addEventListener("click", () => {
  const blob = new Blob([`window.HUB_RESOURCES = ${JSON.stringify(resources, null, 2)};\n`], { type: "text/javascript" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "resources.generated.js";
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
