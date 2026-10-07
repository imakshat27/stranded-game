import React from 'react';
import {
  Sparkles,
  X,
  Compass,
  Scroll,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { HintExplanation } from '../../types/game';

interface MarinersAlmanacModalProps {
  hint: HintExplanation | null;
  onClose: () => void;
  onExecuteSuggestedAction?: (actionId: string) => void;
}

export const MarinersAlmanacModal: React.FC<MarinersAlmanacModalProps> = ({
  hint,
  onClose,
  onExecuteSuggestedAction
}) => {
  if (!hint) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="parchment-panel max-w-xl w-full rounded-2xl p-6 lg:p-7 border-2 border-[#c29b38] shadow-2xl relative space-y-4 animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-[#c29b38]/30 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#2f2214] border border-[#c29b38]/60 flex items-center justify-center text-[#e5b85c]">
              <Sparkles className="w-4 h-4 text-[#e5b85c]" />
            </div>
            <div>
              <h3 className="font-decorative text-base lg:text-lg text-[#fae5a5] font-bold">
                The Old Navigator’s Almanac
              </h3>
              <span className="text-[11px] text-[#b8a287] font-serif italic">
                Strategic Heuristic & Island AI Advisory
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#b8a287] hover:text-[#fae5a5] hover:bg-[#281d13] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Recommended Action Card */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-[#2c2014] to-[#1c140d] border border-[#c29b38]/50 shadow-inner space-y-2">
          <div className="flex items-center justify-between text-xs text-[#c29b38] font-title">
            <span className="uppercase tracking-wider">Advised Next Undertaking</span>
            <span className="text-[11px] text-[#e5b85c]">
              Remaining Consultations: {hint.hints_remaining}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <h4 className="font-title text-base font-bold text-[#fae5a5]">
              {hint.recommended_action_name}
            </h4>
            <span className="text-[10px] font-title px-2 py-0.5 rounded bg-[#382617] text-[#d4af37] border border-[#c29b38]/30">
              {hint.strategic_objective || 'Survival Objective'}
            </span>
          </div>

          <p className="text-xs text-[#eeddc5] font-serif leading-relaxed">
            {hint.summary}
          </p>
        </div>

        {/* Supporting Reasons */}
        {hint.supporting_factors && hint.supporting_factors.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-xs font-title text-[#fae5a5] flex items-center gap-1.5">
              <Scroll className="w-3.5 h-3.5 text-[#e5b85c]" />
              Navigational Merits & Supporting Logic
            </span>
            <div className="space-y-1 bg-[#1f1710] p-3 rounded-xl border border-[#c29b38]/25">
              {hint.supporting_factors.map((factor, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs font-serif text-[#eeddc5]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#4ade80] shrink-0 mt-0.5" />
                  <span>{factor}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Negative Factors / Warnings */}
        {hint.negative_factors && hint.negative_factors.length > 0 && (
          <div className="space-y-1.5">
            <div className="space-y-1 bg-[#2e1915]/80 p-3 rounded-xl border border-[#a83222]/50">
              {hint.negative_factors.map((warn, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs font-serif text-[#fecaca]">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#f87171] shrink-0 mt-0.5" />
                  <span>{warn}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-[#c29b38]/25">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-[#c29b38]/30 text-xs font-serif text-[#b8a287] hover:text-[#fae5a5] transition cursor-pointer"
          >
            Close Almanac
          </button>
          {onExecuteSuggestedAction && (
            <button
              onClick={() => {
                onExecuteSuggestedAction(hint.recommended_action_id);
                onClose();
              }}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#3d2a17] to-[#2b1d10] border border-[#c29b38]/60 text-[#fae5a5] hover:border-[#e5b85c] text-xs font-serif font-semibold transition cursor-pointer shadow-md"
            >
              <span>Follow Navigator’s Advice</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#e6c35c]" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
