/**
 * Utility functions for client intake categorization and cohorts.
 */

export interface IntakeStats {
  total: number;
  active: number;
  graduated: number;
  other: number;
}

export interface IntakeGroup<T = any> {
  intake: string;
  clients: T[];
  stats: IntakeStats;
}

export const isActiveStatus = (s: string) =>
  (s || '').toLowerCase().trim() === 'active';

export const isAlumniStatus = (s: string) =>
  ['complete', 'graduated', 'alumni', 'alumni - placed', 'alumni - awaiting placement'].includes((s || '').toLowerCase().trim());

/**
 * Extracts the intake / cohort name for a given client.
 * Rule:
 * - If client has an explicit custom intake in notes, use it.
 * - Otherwise:
 *   - All alumni on the system are "35th Intake"
 *   - All other clients are "36th Intake"
 */
export function getClientIntake(client: any): string {
  if (!client) return "36th Intake";

  // 1. Direct field
  if (typeof client.intake === 'string' && client.intake.trim()) {
    const val = client.intake.trim();
    if (val !== "Unassigned") return val;
  }

  // 2. Parsed notes
  if (client.notes) {
    try {
      const parsed = typeof client.notes === 'string' ? JSON.parse(client.notes) : client.notes;
      if (parsed) {
        if (typeof parsed.intake === 'string' && parsed.intake.trim() && parsed.intake.trim() !== "Unassigned") {
          return parsed.intake.trim();
        }
        if (parsed.assessmentData?.intake && typeof parsed.assessmentData.intake === 'string' && parsed.assessmentData.intake.trim() !== "Unassigned") {
          return parsed.assessmentData.intake.trim();
        }
        if (parsed.assessmentData?.intakeCohort && typeof parsed.assessmentData.intakeCohort === 'string' && parsed.assessmentData.intakeCohort.trim() !== "Unassigned") {
          return parsed.assessmentData.intakeCohort.trim();
        }
      }
    } catch {
      // ignore parse error
    }
  }

  // 3. Status rule:
  // All alumni on the system are 35th Intake, all others are 36th Intake
  if (isAlumniStatus(client.status)) {
    return "35th Intake";
  }

  return "36th Intake";
}

/**
 * Natural comparator for sorting intake titles in descending order
 * (e.g. 36th Intake, 35th Intake, Intake 3, Intake 2, Intake 1, Unassigned)
 */
export function compareIntakes(a: string, b: string): number {
  if (a === b) return 0;
  if (a === "Unassigned") return 1;
  if (b === "Unassigned") return -1;

  // Extract numbers if present (e.g. 36th -> 36, 35th -> 35)
  const aNumMatch = a.match(/\d+/g);
  const bNumMatch = b.match(/\d+/g);

  if (aNumMatch && bNumMatch) {
    const aVal = parseInt(aNumMatch[aNumMatch.length - 1], 10);
    const bVal = parseInt(bNumMatch[bNumMatch.length - 1], 10);
    if (aVal !== bVal) {
      return bVal - aVal; // Descending (36th Intake comes before 35th Intake)
    }
  }

  return a.localeCompare(b);
}

/**
 * Gets a sorted list of unique intakes present in the client list.
 */
export function getUniqueIntakes(clients: any[]): string[] {
  const intakeSet = new Set<string>(["36th Intake", "35th Intake"]);
  clients.forEach(c => {
    intakeSet.add(getClientIntake(c));
  });

  return Array.from(intakeSet).sort(compareIntakes);
}

/**
 * Updates all client records in Supabase so their notes JSON
 * explicitly stores "35th Intake" for alumni and "36th Intake" for others.
 */
export async function syncAllClientIntakesToSupabase(supabaseClient: any): Promise<{ updated: number; total: number; errors: number }> {
  try {
    const { data: clients, error } = await supabaseClient
      .from('clients')
      .select('id, status, notes');

    if (error || !clients) {
      console.error("Error fetching clients for intake sync:", error);
      return { updated: 0, total: 0, errors: 1 };
    }

    let updatedCount = 0;
    let errorCount = 0;

    for (const client of clients) {
      const targetIntake = isAlumniStatus(client.status) ? "35th Intake" : "36th Intake";

      let existingNotes: any = {};
      try {
        existingNotes = typeof client.notes === 'string' ? JSON.parse(client.notes) : (client.notes || {});
      } catch {
        existingNotes = {};
      }

      // Check if already synchronized
      if (existingNotes.intake === targetIntake && existingNotes.assessmentData?.intake === targetIntake) {
        continue;
      }

      const updatedNotes = {
        ...existingNotes,
        intake: targetIntake,
        ...(existingNotes.assessmentData ? {
          assessmentData: {
            ...existingNotes.assessmentData,
            intake: targetIntake
          }
        } : {
          assessmentData: {
            intake: targetIntake
          }
        })
      };

      const { error: updateError } = await supabaseClient
        .from('clients')
        .update({ notes: JSON.stringify(updatedNotes) })
        .eq('id', client.id);

      if (updateError) {
        console.error(`Failed to update intake for client ${client.id}:`, updateError);
        errorCount++;
      } else {
        updatedCount++;
      }
    }

    return { updated: updatedCount, total: clients.length, errors: errorCount };
  } catch (err) {
    console.error("Error in syncAllClientIntakesToSupabase:", err);
    return { updated: 0, total: 0, errors: 1 };
  }
}

/**
 * Groups clients into structured intake groups with stats.
 */
export function groupClientsByIntake<T = any>(clients: T[]): IntakeGroup<T>[] {
  const map = new Map<string, T[]>();

  clients.forEach(client => {
    const intake = getClientIntake(client);
    if (!map.has(intake)) {
      map.set(intake, []);
    }
    map.get(intake)!.push(client);
  });

  const sortedIntakeNames = Array.from(map.keys()).sort(compareIntakes);

  return sortedIntakeNames.map(intake => {
    const groupClients = map.get(intake) || [];
    const total = groupClients.length;
    const active = groupClients.filter((c: any) => isActiveStatus(c.status)).length;
    const graduated = groupClients.filter((c: any) => isAlumniStatus(c.status)).length;
    const other = Math.max(0, total - active - graduated);

    return {
      intake,
      clients: groupClients,
      stats: { total, active, graduated, other }
    };
  });
}
