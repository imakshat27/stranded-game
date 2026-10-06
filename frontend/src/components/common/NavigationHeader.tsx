import {
  Compass,
  FlaskConical,
  ChartNoAxesCombined,
  Menu,
  ArrowLeft,
  RotateCcw,
  X,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { GameState } from "../../types/game";

interface Props {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  gameState: GameState | null;
  onRestart: () => void;
  loading: boolean;
}
const modes = [
  {
    id: "game",
    label: "Island",
    icon: Compass,
    detail: "Survive. Build. Escape.",
  },
  {
    id: "ai-lab",
    label: "AI Lab",
    icon: FlaskConical,
    detail: "Search, rules, and risk experiments",
  },
  {
    id: "analytics",
    label: "Expedition report",
    icon: ChartNoAxesCombined,
    detail: "Your moves and resource trends",
  },
];
export function NavigationHeader({
  activeTab,
  setActiveTab,
  onRestart,
  loading,
}: Props) {
  const [menu, setMenu] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!menu) return;
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenu(false);
        trigger.current?.focus();
      }
    };
    const outside = (e: PointerEvent) => {
      if (
        !menuRef.current?.contains(e.target as Node) &&
        !trigger.current?.contains(e.target as Node)
      )
        setMenu(false);
    };
    document.addEventListener("keydown", escape);
    document.addEventListener("pointerdown", outside);
    return () => {
      document.removeEventListener("keydown", escape);
      document.removeEventListener("pointerdown", outside);
    };
  }, [menu]);
  return (
    <header className="game-header">
      <button
        className="wordmark"
        onClick={() => {
          setActiveTab("game");
          setMenu(false);
        }}
        aria-label="STRANDED — return to island"
      >
        <Compass size={24} />
        <span>
          STRANDED<small>AN ISLAND SURVIVAL EXPEDITION</small>
        </span>
      </button>
      <div className="header-end">
        {activeTab !== "game" && (
          <button
            className="text-button return-island"
            onClick={() => setActiveTab("game")}
          >
            <ArrowLeft size={15} /> Return to island
          </button>
        )}

        <button
          ref={trigger}
          className="menu-trigger"
          aria-expanded={menu}
          aria-controls="expedition-menu"
          onClick={() => setMenu(!menu)}
        >
          {menu ? <X size={18} /> : <Menu size={18} />}
          <span>Menu</span>
        </button>
      </div>
      {menu && (
        <nav
          ref={menuRef}
          id="expedition-menu"
          className="expedition-menu"
          aria-label="Game modes"
        >
          <span className="eyebrow">YOUR EXPEDITION</span>
          {modes.map(({ id, label, icon: Icon, detail }) => (
            <button
              key={id}
              aria-current={activeTab === id ? "page" : undefined}
              onClick={() => {
                setActiveTab(id);
                setMenu(false);
              }}
            >
              <Icon size={21} />
              <span>
                {label}
                <small>{detail}</small>
              </span>
            </button>
          ))}
          <button
            disabled={loading}
            className="restart-menu"
            onClick={() => {
              onRestart();
              setMenu(false);
            }}
          >
            <RotateCcw size={19} />
            <span>
              Restart expedition<small>Begin again on the shore</small>
            </span>
          </button>
        </nav>
      )}
    </header>
  );
}
