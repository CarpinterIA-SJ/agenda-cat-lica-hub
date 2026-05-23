export const ORGANIZER_EVENTS_KEY = "eventos_criados";
export const CUSTOM_EVENTS_KEY = "custom_events";

export type OrganizerEvent = {
  id: string;
  title: string;
  status: string;
  format: string;
  date: string;
  location: string;
  attendees: string;
  organizador: string;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

const formatToTypeLabel = (format: string) => {
  const map: Record<string, string> = {
    Presencial: "Evento presencial",
    Online: "Evento online",
    "Híbrido": "Evento híbrido",
  };
  return map[format] || format || "Evento";
};

const parseAttendees = (value: unknown): number => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const match = value.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  }
  return 0;
};

export const getOrganizerEvents = (): OrganizerEvent[] => {
  try {
    return JSON.parse(localStorage.getItem(ORGANIZER_EVENTS_KEY) || "[]");
  } catch {
    return [];
  }
};

// Reconciles organizer events into the participant-facing custom_events store.
// Preserves participant customizations (tickets, form visibility, custom fields)
// while refreshing metadata (name, date, location, type, status, organizer).
// Entries in custom_events without a matching organizer event are dropped.
export const syncCustomEvents = (): any[] => {
  const organizerEvents = getOrganizerEvents();
  let customEvents: any[] = [];
  try {
    customEvents = JSON.parse(localStorage.getItem(CUSTOM_EVENTS_KEY) || "[]");
  } catch {
    customEvents = [];
  }

  const reconciled = organizerEvents.map((ev) => {
    const existing = customEvents.find((c) => c.id === ev.id);
    const defaults = {
      time: "",
      startDateTime: "",
      description: "",
      descriptionText: "",
      bannerUrl: "",
      category: "",
      show_nome: true,
      show_email: true,
      show_cpf: true,
      show_nascimento: false,
      show_whatsapp: true,
      custom_fields: [],
      details: { tickets: [] },
    };

    return {
      ...defaults,
      ...(existing || {}),
      id: ev.id,
      name: ev.title,
      slug: existing?.slug || slugify(ev.title),
      date: ev.date,
      location: ev.location,
      type: formatToTypeLabel(ev.format),
      status: ev.status,
      organizerName: ev.organizador || existing?.organizerName || "",
      attendees: existing?.attendees ?? parseAttendees(ev.attendees),
    };
  });

  try {
    localStorage.setItem(CUSTOM_EVENTS_KEY, JSON.stringify(reconciled));
  } catch {
    // localStorage unavailable
  }

  return reconciled;
};
