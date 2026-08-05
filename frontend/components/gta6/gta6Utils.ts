export const CATEGORY_COLOR: Record<string, string> = {
    hotel:          "#3B82F6",
    residential:    "#10B981",
    restaurant:     "#F59E0B",
    retail:         "#8B5CF6",
    office:         "#6366F1",
    safehouse:      "#DC143C",
    landmark:       "#EC4899",
    transportation: "#06B6D4",
    leisure:        "#84CC16",
    construction:   "#F97316",
    industrial:     "#9CA3AF",
    government:     "#EAB308",
    service:        "#A78BFA",
    public:         "#34D399",
    demolished:     "#6B7280",
};

export const CATEGORY_LABEL: Record<string, string> = {
    hotel: "Hotel", residential: "Residential", restaurant: "Restaurant",
    retail: "Retail", office: "Office", safehouse: "Safehouse",
    landmark: "Landmark", transportation: "Transport", leisure: "Leisure",
    construction: "Construction", industrial: "Industrial",
    government: "Government", service: "Service", public: "Public",
    demolished: "Demolished",
};

const META_TAGS = ["2022", "unconfirmed", "may-not-exist", "reused", "address-ambiguous"];

export function getPhotoUrl(gtadbKey: string, type: "ig" | "rl"): string {
    return `https://raw.githubusercontent.com/rolux/gtadb.org/main/map/photos/6/${gtadbKey},${type}.jpg`;
}

export function getCategoryColor(categories: string[]): string {
    for (const cat of categories) {
        if (CATEGORY_COLOR[cat]) return CATEGORY_COLOR[cat];
    }
    return "#71717A";
}

export function getCategoryLabel(categories: string[]): string {
    for (const cat of categories) {
        if (!META_TAGS.includes(cat) && CATEGORY_LABEL[cat]) return CATEGORY_LABEL[cat];
    }
    const first = categories.find(c => !META_TAGS.includes(c));
    return first ? first.charAt(0).toUpperCase() + first.slice(1) : "Location";
}
