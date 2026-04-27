import { persons, relationEdges, type Person, type RelationEdge } from './persons';
import { events, type HistoricalEvent } from './events';
import { works, type Work, WORK_TYPE_LABELS, WORK_TYPE_COLORS } from './works';
import { factions, type Faction, type FactionId } from './factions';
import { mapLocations, type MapLocation } from './locations';

// ===== Person Cache =====
export const personById: Record<string, Person> = {};
export const personsByFaction: Record<FactionId, Person[]> = {} as any;
export const personNameToId: Record<string, string> = {};

// ===== Event Cache =====
export const eventById: Record<string, HistoricalEvent> = {};
export const eventsByYear: Record<number, HistoricalEvent[]> = {};
export const eventsByImportance: Record<string, HistoricalEvent[]> = {};

// ===== Work Cache =====
export const workById: Record<string, Work> = {};
export const worksByType: Record<string, Work[]> = {};

// ===== Location Cache =====
export const locationById: Record<string, MapLocation> = {};

// ===== Faction Cache =====
export const factionById: Record<string, Faction> = {};
export const factionColorMap: Record<string, { color: string; bgColor: string }> = {};

// ===== Relation Cache =====
export const edgesFromPerson: Record<string, RelationEdge[]> = {};
export const edgesToPerson: Record<string, RelationEdge[]> = {};

// ===== Build all caches =====
function buildCaches() {
  // Persons
  for (const p of persons) {
    personById[p.id] = p;
    personNameToId[p.name] = p.id;
    if (!personsByFaction[p.faction]) personsByFaction[p.faction] = [];
    personsByFaction[p.faction].push(p);
  }

  // Events
  for (const e of events) {
    eventById[e.id] = e;
    for (let y = e.startYear; y <= e.endYear; y++) {
      if (!eventsByYear[y]) eventsByYear[y] = [];
      eventsByYear[y].push(e);
    }
    if (!eventsByImportance[e.importance]) eventsByImportance[e.importance] = [];
    eventsByImportance[e.importance].push(e);
  }

  // Works
  for (const w of works) {
    workById[w.id] = w;
    if (!worksByType[w.type]) worksByType[w.type] = [];
    worksByType[w.type].push(w);
  }

  // Locations
  for (const loc of mapLocations) {
    locationById[loc.id] = loc;
  }

  // Factions
  for (const f of Object.values(factions)) {
    factionById[f.id] = f;
    factionColorMap[f.id] = { color: f.color, bgColor: f.bgColor };
  }

  // Relations
  for (const e of relationEdges) {
    if (!edgesFromPerson[e.source]) edgesFromPerson[e.source] = [];
    edgesFromPerson[e.source].push(e);
    if (!edgesToPerson[e.target]) edgesToPerson[e.target] = [];
    edgesToPerson[e.target].push(e);
  }
}

buildCaches();

// ===== Helper functions =====

export function getPersonRelations(personId: string): RelationEdge[] {
  return [
    ...(edgesFromPerson[personId] || []),
    ...(edgesToPerson[personId] || []),
  ];
}

export function getRelatedPersons(personId: string): Person[] {
  const edges = getPersonRelations(personId);
  const ids = new Set<string>();
  for (const e of edges) {
    if (e.source !== personId) ids.add(e.source);
    if (e.target !== personId) ids.add(e.target);
  }
  return [...ids].map(id => personById[id]).filter(Boolean);
}

export function getEventsForYear(year: number): HistoricalEvent[] {
  return eventsByYear[year] || [];
}

export function getEventsForPerson(personId: string): HistoricalEvent[] {
  return events.filter(e => e.persons?.includes(personId));
}

export function getWorksForPerson(personId: string): Work[] {
  return works.filter(w => w.authorId === personId);
}

export function searchPersons(query: string): Person[] {
  if (!query.trim()) return persons;
  const q = query.trim().toLowerCase();
  return persons.filter(p => {
    if (p.name.toLowerCase().includes(q)) return true;
    if (p.title && p.title.toLowerCase().includes(q)) return true;
    if (p.id.toLowerCase().includes(q)) return true;
    return false;
  });
}

export function searchWorks(query: string): Work[] {
  if (!query.trim()) return works;
  const q = query.trim().toLowerCase();
  return works.filter(w => {
    if (w.title.toLowerCase().includes(q)) return true;
    if (w.author.toLowerCase().includes(q)) return true;
    return false;
  });
}

export function searchEvents(query: string): HistoricalEvent[] {
  if (!query.trim()) return events;
  const q = query.trim().toLowerCase();
  return events.filter(e => {
    if (e.title.toLowerCase().includes(q)) return true;
    if (e.description && e.description.toLowerCase().includes(q)) return true;
    if (e.tags?.some(t => t.toLowerCase().includes(q))) return true;
    return false;
  });
}

export function searchLocations(query: string): MapLocation[] {
  if (!query.trim()) return mapLocations;
  const q = query.trim().toLowerCase();
  return mapLocations.filter(l => {
    if (l.name.toLowerCase().includes(q)) return true;
    if (l.description && l.description.toLowerCase().includes(q)) return true;
    return false;
  });
}

export { persons, relationEdges, events, works, factions, mapLocations, WORK_TYPE_LABELS, WORK_TYPE_COLORS };
export type { Person, RelationEdge, HistoricalEvent, Work, Faction, FactionId, MapLocation };
