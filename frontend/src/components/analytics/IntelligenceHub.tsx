import type { GameState } from "../../types/game";
import { AnalyticsView } from "./AnalyticsView";
export function IntelligenceHub({
  gameState,
}: {
  gameState: GameState | null;
  initialSubTab?: string;
}) {
  return (
    <section>
      <div className="workbench-heading">
        <div>
          <h1>Your expedition</h1>
          <p>
            Look back at what happened and decide what needs attention next.
          </p>
        </div>
      </div>
      {gameState ? (
        <AnalyticsView gameState={gameState} />
      ) : (
        <p>Connect to the island to begin your record.</p>
      )}
    </section>
  );
}
