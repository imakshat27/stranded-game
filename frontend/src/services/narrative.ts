import { GameState, Action, StateTransition } from '../types/game';

export interface StoryChapter {
  id: string;
  day: number;
  timeOfDay: string;
  title: string;
  narrativeText: string;
  ambientSensory: string[];
  actionTaken?: string;
  outcomeSummary?: string;
  resourceDeltas?: Array<{ label: string; value: number; type: 'gain' | 'loss' }>;
  eventEncountered?: {
    name: string;
    description: string;
    severity: 'mild' | 'moderate' | 'perilous';
  };
  survivorThought: string;
}

/**
 * Generate rich, atmospheric story narrative based on game state and transitions.
 */
export function generateStoryEntry(
  state: GameState,
  transition?: StateTransition | null
): StoryChapter {
  const day = state.day;
  const turnsLeft = state.actions_remaining;
  
  // Determine time of day
  let timeOfDay = 'Golden Morning';
  if (turnsLeft === 1) timeOfDay = 'Scorching Midday';
  else if (turnsLeft === 0) timeOfDay = 'Gathering Twilight';

  // Sensory atmospheric cues based on weather and location
  const ambientSensory: string[] = [];
  if (state.weather === 'stormy') {
    ambientSensory.push('⛈️ Gale-force winds howling through palm canopies');
    ambientSensory.push('⚡ Deafening thunder echoing over the volcanic ridge');
  } else if (state.weather === 'rainy') {
    ambientSensory.push('🌧️ Steady tropical downpour lashing the thatch shelter');
    ambientSensory.push('💧 Freshwater pooling in rock hollows and broad leaves');
  } else if (state.weather === 'cloudy') {
    ambientSensory.push('☁️ Dense sea fog rolling in from the outer reef');
    ambientSensory.push('🌊 Heavy swell crashing relentlessly against black basalt');
  } else {
    ambientSensory.push('☀️ Blinding tropical sun beating down upon the white sand');
    ambientSensory.push('🌴 Salt-laden trade winds rustling dried palm fronds');
  }

  // Location-specific cues
  if (state.location.includes('reef') || state.location.includes('beach') || state.location === 'base_camp') {
    ambientSensory.push('🐚 Rhythmic surf churning flotsam along the tideline');
  } else if (state.location.includes('jungle') || state.location.includes('spring')) {
    ambientSensory.push('🦜 Screeches of unseen macaws in the humid jungle canopy');
  } else if (state.location.includes('ridge') || state.location.includes('mountain')) {
    ambientSensory.push('💨 Bracing gusts sweeping across the volcanic precipice');
  }

  // Generate Chapter Title & Narrative
  let title = `Day ${day}: The Marooned Mariner`;
  let narrativeText = '';
  let survivorThought = '';
  const resourceDeltas: Array<{ label: string; value: number; type: 'gain' | 'loss' }> = [];

  if (transition) {
    const actName = transition.action_name;
    title = `Day ${day}: Chronicle of the ${actName}`;

    // Process resource changes
    if (transition.resource_changes) {
      Object.entries(transition.resource_changes).forEach(([k, v]) => {
        if (v !== 0) {
          resourceDeltas.push({
            label: k.charAt(0).toUpperCase() + k.slice(1),
            value: v,
            type: v > 0 ? 'gain' : 'loss'
          });
        }
      });
    }

    // Build literary prose based on action taken
    if (transition.action_id.includes('explore') || transition.action_id.includes('scout')) {
      narrativeText = `With sea-boots gripped against the slippery coral, you strike out into uncharted terrain. The dense foliage yields slowly to your efforts. Signs of the island's isolation surround you—ancient driftwood bleached by sun and salt, strange birds watching with cold curiosity, and tidal pools teeming with life. Every step charts this forgotten sanctuary deeper into your memory.`;
      survivorThought = `"Every league explored brings me closer to either salvation or a forgotten grave. I must keep my bearings."`;
    } else if (transition.action_id.includes('wood') || transition.action_id.includes('forage')) {
      narrativeText = `You scour the tideline and jungle margins with weathered hands. The tropical humidity weighs heavy upon your shoulders, yet the scent of rich timber and sea brine sharpens your resolve. You chop and haul sturdy trunks of ironwood and buoyant driftwood, stockpiling fuel for the night fire and raw timber for the catamaran frame.`;
      survivorThought = `"Without wood, I am marooned forever. With it, I can carve wings across this ocean."`;
    } else if (transition.action_id.includes('water') || transition.action_id.includes('drink')) {
      narrativeText = `Kneeling beside the crystalline cascade of the freshwater stream, you cup your blistered hands into the cool flow. The parched dryness in your throat subsides as pure volcanic spring water revitalizes your blood. You take care to fill your bamboo canteens to the brim before the midday heat turns the shallows warm.`;
      survivorThought = `"Fresh water is more precious than Spanish doubloons on this forsaken spit of sand."`;
    } else if (transition.action_id.includes('fish') || transition.action_id.includes('food') || transition.action_id.includes('hunt')) {
      narrativeText = `Stepping carefully among the submerged coral shelves, you watch the translucent teal waters. A school of silver reef mullet flashes between sea anemones. With calculated patience, you strike, securing rich caloric provisions that will stave off the gnawing hunger of another night.`;
      survivorThought = `"The sea provides today, but the tide is a fickle master. I must conserve every scrap."`;
    } else if (transition.action_id.includes('build') || transition.action_id.includes('craft') || transition.action_id.includes('hull') || transition.action_id.includes('rig')) {
      narrativeText = `Working beneath the shade of leaning palms, you square the heavy logs with steady adze blows. Coir cords are braided tightly from boiled coconut fibers, binding crossbeams with ancient seafarer knots. The escape vessel steadily ceases to be a dream and takes physical form upon the sand.`;
      survivorThought = `"Bit by bit, lashing by lashing, she will hold together against the Pacific rollers."`;
    } else if (transition.action_id.includes('rest') || transition.action_id.includes('sleep')) {
      narrativeText = `Exhaustion claims your weary limbs. You retreat to the shelter of woven palm fronds, nursing blistered palms as the sound of the Pacific tide lulls your senses. Resting by the embers of your hearth fire, your strength slowly rekindles for the trials that await at dawn.`;
      survivorThought = `"Rest is not idleness when survival demands every ounce of tomorrow's grit."`;
    } else {
      narrativeText = transition.message || `You executed '${actName}' with seaman's determination, adjusting your strategy to the harsh island realities.`;
      survivorThought = `"Survival is a ledger of small triumphs and calculated risks."`;
    }
  } else {
    // Initial start or fresh day
    if (day === 1) {
      title = "Chapter I: Cast Upon the Reefs of Isla de la Muerte";
      narrativeText = `The violent roar of the storm still rings in your ears as you open your eyes. Coughing up brine, you find yourself washed ashore on a jagged crescent of white coral sand. Behind you lies the smoking wreckage of your vessel, splintered across the outer shoals. Ahead, an impenetrable tropical canopy rises toward an ominous volcanic ridge. You are stranded, alone, with nothing but your sailor's wits and will to survive.`;
      survivorThought = `"The ship is gone, but the sea has not claimed me yet. I will build an escape catamaran or die trying."`;
    } else {
      title = `Chapter ${day}: Dawn Over the Uncharted Isle`;
      narrativeText = `The sun climbs slowly above the eastern horizon, tinting the boundless ocean in hues of burnished brass and rose. Tropical seabirds wheel overhead in search of schools. Your camp still stands, though another day of hunger, dehydration, and relentless labor awaits. The catamaran frame rests patiently on the sand, awaiting more timber and rigging.`;
      survivorThought = `"Another sunrise granted. Every turn must count toward the great passage home."`;
    }
  }

  // Event parsing if present
  let eventEncountered: StoryChapter['eventEncountered'] = undefined;
  if (transition?.event_occurred) {
    const ev = transition.event_occurred;
    eventEncountered = {
      name: ev.name,
      description: ev.description,
      severity: ev.risk_level > 0.6 ? 'perilous' : ev.risk_level > 0.3 ? 'moderate' : 'mild'
    };
  } else if (state.recent_events && state.recent_events.length > 0) {
    const lastEv = state.recent_events[state.recent_events.length - 1];
    eventEncountered = {
      name: 'Island Phenomenon',
      description: lastEv,
      severity: 'moderate'
    };
  }

  return {
    id: `chapter-${day}-${turnsLeft}`,
    day,
    timeOfDay,
    title,
    narrativeText,
    ambientSensory,
    actionTaken: transition?.action_name,
    outcomeSummary: transition?.message,
    resourceDeltas,
    eventEncountered,
    survivorThought
  };
}
