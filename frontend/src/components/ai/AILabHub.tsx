import { useState } from "react";
import { GitBranch, BookOpen, ShieldAlert, Swords } from "lucide-react";
import type { GameState } from "../../types/game";
import { SearchCompareView } from "./SearchCompareView";
import { KnowledgeView } from "../knowledge/KnowledgeView";
import { ProbabilityView } from "../probability/ProbabilityView";
import { RivalModeView } from "../rival/RivalModeView";
export function AILabHub({
  gameState,
  initialSubTab = "search",
}: {
  gameState: GameState | null;
  initialSubTab?: string;
  onSelectAction?: (id: string) => void;
  onNavigateToGame?: () => void;
}) {
  const [tab, setTab] = useState(initialSubTab);
  return (
    <section aria-label="AI Lab">
      <div className="workbench-heading">
        <div>
          <h1>AI Lab</h1>
          <p>
            Explore possible futures and understand how decisions are made.
            Experiments leave your expedition unchanged.
          </p>
        </div>
      </div>
      <div className="workbench-layout">
        <nav className="workbench-nav" aria-label="AI experiments">
          {[
            { id: "search", label: "Search & Compare", Icon: GitBranch },
            { id: "knowledge", label: "Rules & requirements", Icon: BookOpen },
            { id: "probability", label: "Risk experiments", Icon: ShieldAlert },
            { id: "rival", label: "Rival sandbox", Icon: Swords },
          ].map(({ id, label, Icon }) => (
            <button
              key={id}
              aria-current={tab === id ? "page" : undefined}
              onClick={() => setTab(id)}
            >
              <Icon size={17} />
              {label}
            </button>
          ))}
        </nav>
        <div className="workbench-content">
          {!gameState && (
            <p className="inline-error">
              Connect to your expedition before running an experiment.
            </p>
          )}
          {tab === "search" && <SearchCompareView gameState={gameState} />}{" "}
          {tab === "knowledge" && <KnowledgeView gameState={gameState} />}{" "}
          {tab === "probability" && <ProbabilityView gameState={gameState} />}{" "}
          {tab === "rival" && <RivalModeView />}
        </div>
      </div>
    </section>
  );
}
