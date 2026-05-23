'use client';

import GraphExplorer from '@/components/GraphExplorer';

/**
 * Example Graph Visualization Page
 * 
 * This page demonstrates the GraphExplorer component in action.
 * 
 * The graph visualizes relationships between:
 * - OPTIONS: Interests and preferences from data/options.ts
 * - ROLES: Role categories from data/roles.ts
 * - GROUPS: Tag groups from data/groups.ts
 * 
 * All connections are manually defined in lib/graphConnections.ts
 */

export default function GraphPage() {
  return (
    <div className="w-full h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <GraphExplorer />
    </div>
  );
}
