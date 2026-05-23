/**
 * Graph Connections Configuration
 * 
 * This file defines the relationships between nodes (options, roles, and groups).
 * Each connection represents an edge in the graph.
 * 
 * Node IDs come from:
 * - OPTIONS: data/options.ts (e.g., "24-7", "abduction-aggressor", etc.)
 * - ROLES: data/roles.ts (e.g., "top", "bottom", "dominant", etc.)
 * - GROUPS: data/groups.ts (e.g., "upper-body", "lower-body", "bdsm", etc.)
 * 
 * STRUCTURE:
 * Each connection object has:
 * - source: string (node ID - source of the connection)
 * - target: string (node ID - target of the connection)
 * 
 * The graph is directed, so (A → B) is different from (B → A).
 * For bidirectional connections, add both directions.
 */

export interface GraphConnection {
  source: string;
  target: string;
}

/**
 * EXAMPLE HIERARCHICAL STRUCTURE:
 * 
 * Group (Broad) → Group (Narrow) → Options
 * 
 * upper-body
 *   ├── armpits → armpit-licking, armpit-fetish, armpit-worship
 *   ├── breasts → breast-play, lactation, breast-feeding
 *   └── ...
 * 
 * lower-body
 *   ├── thighs → thigh-job, thigh-worship, thigh-crushing
 *   ├── feet → foot-job, foot-worship, foot-stomping
 *   └── ...
 * 
 * dynamics
 *   ├── bdsm → bondage, discipline, dominance, submission
 *   ├── power-exchange → master-slave, ownership, control
 *   └── ...
 * 
 * ROLE CONNECTIONS:
 * Roles typically connect to each other (dynamics) and to preferences (options)
 * 
 * dominant ↔ submissive
 * sadist ↔ masochist
 * top ↔ bottom
 * 
 * MULTI-DIRECTIONAL EXAMPLES:
 * 
 * "sadist" role connects to:
 *   - submissive (role opposite)
 *   - bondage, pain, impact-play (options)
 *   - sadism-masochism (group)
 * 
 * "24-7" option connects to:
 *   - bdsm (broad group)
 *   - master, slave (roles)
 *   - power-exchange (narrow group)
 *   - ownership, control, dynamics (related options)
 */

export const GRAPH_CONNECTIONS: GraphConnection[] = [
  // SAMPLE CONNECTIONS - Replace with your actual connections
  // These are just examples to show the pattern
  
  // Role connections (bidirectional)
  { source: 'top', target: 'bottom' },
  { source: 'bottom', target: 'top' },
  { source: 'dominant', target: 'submissive' },
  { source: 'submissive', target: 'dominant' },
  { source: 'sadist', target: 'masochist' },
  { source: 'masochist', target: 'sadist' },
  
  // A few group connections to visible structure
  // NOTE: Add your own connections below. Check data/options.ts, data/roles.ts, and data/groups.ts for valid IDs
];

/**
 * UTILITY: Generate connections programmatically
 * 
 * Example: Auto-connect all options in a group to the group itself
 * 
 * export function generateGroupConnections() {
 *   const connections: GraphConnection[] = [];
 *   
 *   GROUPS.forEach(group => {
 *     OPTIONS.forEach(option => {
 *       if (option.tags.includes(group.id)) {
 *         connections.push({
 *           source: group.id,
 *           target: option.id,
 *         });
 *       }
 *     });
 *   });
 *   
 *   return connections;
 * }
 * 
 * Then use: GRAPH_CONNECTIONS.push(...generateGroupConnections())
 */
