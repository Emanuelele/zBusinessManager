import React, { Profiler } from 'react';
import { fetchNui } from '../utils/fetchNui';

const onRenderCallback = (
  id, // the "id" prop of the Profiler tree that has just committed
  phase, // either "mount" (if the tree just mounted) or "update" (if it re-rendered)
  actualDuration, // time spent rendering the committed update
  baseDuration, // estimated time to render the entire subtree without memoization
  startTime, // when React began rendering this update
  commitTime, // when React committed this update
  interactions // the Set of interactions belonging to this update
) => {
  // Filter out very fast renders to reduce noise
  if (actualDuration > 5) {
    const msg = `[Profiler] ${id} (${phase}) took ${actualDuration.toFixed(2)}ms`;
    console.log(msg);
    // Send to client F8 console
    fetchNui('log', { message: msg }).catch(() => {});
  }
};

export default function DebugProfiler({ id, children }) {
  if (import.meta.env.PROD) return children; // Disable in production if needed, or keep for debugging

  return (
    <Profiler id={id} onRender={onRenderCallback}>
      {children}
    </Profiler>
  );
}
