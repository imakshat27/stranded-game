import React, { useState } from 'react';
import {
  BookOpen,
  Feather,
  Sparkles,
  Scroll,
  Clock,
  Compass,
  AlertTriangle,
  Flame,
  Droplets,
  Zap,
  TrendingUp,
  TrendingDown,
  History,
  Volume2
} from 'lucide-react';
import { GameState, StateTransition } from '../../types/game';
import { generateStoryEntry, StoryChapter } from '../../services/narrative';

interface StoryExpeditionChronicleProps {
  gameState: GameState;
  latestTransition: StateTransition | null;
  onRequestHint?: () => void;
}

export const StoryExpeditionChronicle: React.FC<StoryExpeditionChronicleProps> = ({
  gameState,
  latestTransition,
  onRequestHint
}) => {
  const [viewMode, setViewMode] = useState<'chronicle' | 'archive'>('chronicle');
  const currentChapter = generateStoryEntry(gameState, latestTransition);

  return (
    <div className="parchment-panel rounded-2xl p-6 lg:p-8 nautical-corner-tl border-2 border-[#c29b38]/40 shadow-2xl relative overflow-hidden">
      {/* Decorative Top Leather Spine Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 mb-6 border-b border-[#c29b38]/30">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-[#2f2215] border-2 border-[#c29b38]/60 flex items-center justify-center text-[#e5b85c] shadow-inner shrink-0">
            <Feather className="w-5 h-5 text-[#e5b85c]" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-title text-base sm:text-lg text-[#fae5a5] font-bold tracking-wide">
                The Survivor's Journal
              </span>
              <span className="text-[10px] font-title px-2 py-0.5 rounded-full bg-[#352516] text-[#e6c35c] border border-[#c29b38]/40 shrink-0">
                Volume I • Entry {gameState.day}
              </span>
            </div>
            <p className="text-xs text-[#b8a287] font-serif italic mt-0.5 truncate">
              Official Log of the Uncharted Pacific Isle • Location: {gameState.location.replace('_', ' ').toUpperCase()}
            </p>
          </div>
        </div>

        {/* Tab Toggle: Chronicle vs Past Logs */}
        <div className="flex items-center gap-1.5 bg-[#1b150e] p-1 rounded-xl border border-[#c29b38]/30">
          <button
            onClick={() => setViewMode('chronicle')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-serif transition cursor-pointer ${
              viewMode === 'chronicle'
                ? 'bg-[#3d2b1a] text-[#fae5a5] border border-[#c29b38]/60 font-semibold shadow-xs'
                : 'text-[#9c856c] hover:text-[#fae5a5]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-[#e6c35c]" />
            <span>Latest Chronicle</span>
          </button>
          <button
            onClick={() => setViewMode('archive')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-serif transition cursor-pointer ${
              viewMode === 'archive'
                ? 'bg-[#3d2b1a] text-[#fae5a5] border border-[#c29b38]/60 font-semibold shadow-xs'
                : 'text-[#9c856c] hover:text-[#fae5a5]'
            }`}
          >
            <History className="w-3.5 h-3.5 text-[#c29b38]" />
            <span>Ship's Logbook ({gameState.log_messages?.length || 1})</span>
          </button>
        </div>
      </div>

      {viewMode === 'chronicle' ? (
        <div className="space-y-6">
          {/* Chapter Banner & Title */}
          <div className="bg-[#1f1710]/80 rounded-xl p-4 border border-[#c29b38]/30 relative">
            <div className="flex items-center justify-between text-xs text-[#c29b38] font-title mb-1.5">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#e5b85c]" />
                Day {gameState.day} • {currentChapter.timeOfDay}
              </span>
              <span className="capitalize text-[#dcd0bf] italic font-serif">
                Weather: {gameState.weather} • {gameState.actions_remaining} turns remaining
              </span>
            </div>
            <h2 className="font-title text-xl lg:text-2xl text-[#fae5a5] font-bold tracking-wide">
              {currentChapter.title}
            </h2>
          </div>

          {/* Literary Prose Narrative Display */}
          <div className="relative pl-2 sm:pl-4 border-l-2 border-[#c29b38]/40 space-y-4">
            <p className="font-story text-base lg:text-lg text-[#f0e4cf] leading-relaxed story-dropcap text-justify">
              {currentChapter.narrativeText}
            </p>

            {/* Survivor's Inner Monologue / Soliloquy */}
            <div className="p-3.5 rounded-xl bg-[#2a1d12]/70 border border-[#c29b38]/30 text-sm text-[#eeddc5] italic font-serif flex items-start gap-3 shadow-inner">
              <span className="text-2xl text-[#c29b38] leading-none select-none">“</span>
              <div className="pt-0.5">
                <span className="font-medium text-[#fae5a5]">{currentChapter.survivorThought.replace(/^"|"$/g, '')}</span>
                <span className="block text-[11px] text-[#8c765c] not-italic font-title mt-1 tracking-wider uppercase">
                  — The Marooned Captain's Thoughts
                </span>
              </div>
            </div>
          </div>

          {/* Atmospheric Ambient Sensory Cues */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <div className="flex items-center gap-1.5 text-xs text-[#a8947b] font-serif italic mr-1">
              <Volume2 className="w-3.5 h-3.5 text-[#c29b38]" />
              <span>Sensory Ambiance:</span>
            </div>
            {currentChapter.ambientSensory.map((cue, idx) => (
              <span
                key={idx}
                className="text-xs font-serif px-2.5 py-1 rounded-full bg-[#271d14] border border-[#c29b38]/25 text-[#eeddc5] shadow-xs"
              >
                {cue}
              </span>
            ))}
          </div>

          {/* Outcome Ledger Breakdown Card */}
          {(currentChapter.outcomeSummary || (currentChapter.resourceDeltas && currentChapter.resourceDeltas.length > 0)) && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-[#291e14] to-[#1c140d] border border-[#c29b38]/45 shadow-lg space-y-3">
              <div className="flex items-center justify-between border-b border-[#c29b38]/25 pb-2">
                <span className="font-title text-xs uppercase tracking-wider text-[#fae5a5] font-semibold flex items-center gap-1.5">
                  <Scroll className="w-3.5 h-3.5 text-[#e5b85c]" />
                  Ledger of Consequences & Undertakings
                </span>
                {currentChapter.actionTaken && (
                  <span className="text-xs font-serif text-[#dcd0bf] italic">
                    Action: <strong className="text-[#fae5a5] not-italic">{currentChapter.actionTaken}</strong>
                  </span>
                )}
              </div>

              {currentChapter.outcomeSummary && (
                <p className="text-xs lg:text-sm text-[#eeddc5] font-serif leading-relaxed">
                  {currentChapter.outcomeSummary}
                </p>
              )}

              {/* Resource Changes Pills */}
              {currentChapter.resourceDeltas && currentChapter.resourceDeltas.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {currentChapter.resourceDeltas.map((delta, i) => (
                    <span
                      key={i}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-title font-medium border ${
                        delta.type === 'gain'
                          ? 'bg-[#1e2f1f] border-[#3d7a55] text-[#bbf7d0]'
                          : 'bg-[#331c19] border-[#8a3328] text-[#fecaca]'
                      }`}
                    >
                      {delta.type === 'gain' ? (
                        <TrendingUp className="w-3 h-3 text-[#4ade80]" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-[#f87171]" />
                      )}
                      <span>
                        {delta.type === 'gain' ? `+${delta.value}` : delta.value} {delta.label}
                      </span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Event Encounter Callout (if active) */}
          {currentChapter.eventEncountered && (
            <div className="p-4 rounded-xl bg-[#2e1915]/90 border border-[#a83222] shadow-lg flex items-start gap-3.5">
              <AlertTriangle className="w-5 h-5 text-[#e05a47] shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-title text-sm font-bold text-[#fecaca]">
                    {currentChapter.eventEncountered.name}
                  </span>
                  <span className="text-[10px] font-serif uppercase tracking-widest px-2 py-0.5 rounded bg-[#451814] text-[#f87171] border border-[#a83222]/50">
                    {currentChapter.eventEncountered.severity.toUpperCase()} HAZARD
                  </span>
                </div>
                <p className="text-xs text-[#f5d0ca] font-serif mt-1 leading-relaxed">
                  {currentChapter.eventEncountered.description}
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Archive View: Chronological Logbook */
        <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-2">
          {gameState.log_messages && gameState.log_messages.length > 0 ? (
            gameState.log_messages.slice().reverse().map((entry, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-[#1f1710] border border-[#c29b38]/30 text-xs font-serif space-y-1 hover:border-[#c29b38]/60 transition"
              >
                <div className="flex items-center justify-between text-[#c29b38] font-title">
                  <span className="font-semibold text-[#fae5a5]">Day {entry.day}</span>
                  <span className="italic text-[#8c765c] capitalize">{entry.action.replace('_', ' ')}</span>
                </div>
                <p className="text-[#eeddc5] leading-relaxed">
                  {entry.message}
                </p>
              </div>
            ))
          ) : (
            <p className="text-xs text-[#8c765c] font-serif italic text-center py-8">
              No previous expedition entries logged yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
