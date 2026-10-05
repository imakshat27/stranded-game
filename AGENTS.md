# STRANDED
## An Adaptive AI-Driven Survival & Strategic Planning Game

---

# 1. PROJECT OVERVIEW

Build a polished web-based AI survival strategy game called **STRANDED**.

The player is stranded on a remote island and must survive long enough to construct a viable escape plan and ultimately escape the island.

The game is deliberately conceptually simple:

> Survive → make decisions → manage resources → adapt to events → plan escape → escape.

However, the implementation should be technically sophisticated and demonstrate multiple Artificial Intelligence algorithms working together inside one coherent system.

This is an academic AI course project, so the AI algorithms must be **real implementations**, not decorative/randomized features.

The project should feel like a real polished product rather than a collection of disconnected algorithm demonstrations.

---

# 2. PRIMARY TECHNOLOGY STACK

## Frontend

Use:

- React
- TypeScript
- Vite
- Tailwind CSS
- React Flow for graph/state visualization
- Recharts for analytics/charts

## Backend

Use:

- Python
- FastAPI
- Pydantic
- SQLAlchemy
- SQLite initially

The architecture must allow PostgreSQL to replace SQLite later without requiring major application changes.

## Deployment

Frontend:

- Vercel

Backend:

- Render

Database:

- SQLite for development/prototype
- PostgreSQL-compatible architecture for future deployment

## Version Control

- Git
- GitHub

---

# 3. HIGH-LEVEL ARCHITECTURE

The system must have a clear separation between gameplay, AI, adaptation, and visualization.

```text
                         STRANDED
                            │
          ┌─────────────────┼──────────────────┐
          │                 │                  │
       FRONTEND          BACKEND            DATABASE
          │                 │                  │
      React/TS           FastAPI             SQLite
          │                 │
          │          ┌──────┴─────────┐
          │          │                │
          │      GAME ENGINE       AI ENGINE
          │          │                │
          │          │       ┌────────┼────────────┐
          │          │       │        │            │
          │          │    SEARCH   REASONING   PLANNING
          │          │
          │          └──────────────┐
          │                         │
          └──────── API ────────────┘
```

The frontend must never directly implement the core AI algorithms.

Python is responsible for:

- game state transitions
- search algorithms
- reasoning
- probability
- planning
- adaptation
- player profiling
- hint generation

React is responsible for:

- rendering gameplay
- displaying resources
- rendering decisions
- displaying AI explanations
- visualizing search trees
- visualizing algorithm execution
- displaying analytics
- communicating with the backend

---

# 4. CORE GAME CONCEPT

The game is turn/day based.

Each game consists of a sequence of game states.

A state is NOT simply a screen.

A state represents the complete logical condition of the player and environment.

For example:

```text
Day: 7

Health: 72
Water: 45
Food: 31
Energy: 60

Shelter: 2

Wood: 8
Rope: 1
Metal: 0

Escape Progress: 40%

Weather: cloudy

Location: eastern_camp

Current Objective:
Find materials for boat construction
```

The player gets a limited number of actions per day.

Recommended default:

```text
2 actions/day
```

Example actions:

- Gather water
- Gather food
- Explore
- Search wreckage
- Collect wood
- Search cave
- Rest
- Improve shelter
- Craft
- Repair
- Scout
- Work on escape project

Actions should have consequences.

Example:

```text
Explore
→ consumes energy
→ may consume water
→ may discover resources
→ may cause injury
→ may reveal new locations
→ may progress escape requirements
```

---

# 5. THE GAME IS A STATE GRAPH

Do NOT implement the game as a giant hard-coded tree.

The game should dynamically generate states.

Conceptually:

```text
State S0
  │
  ├── Explore
  │      ↓
  │     S1
  │
  ├── Rest
  │      ↓
  │     S2
  │
  └── Gather Water
         ↓
        S3
```

Then:

```text
S1
├── Search Cave
├── Return
└── Gather Wood
```

The graph grows as the player interacts with the game.

This is extremely important because the same state representation will later be used by:

- BFS
- DFS
- IDS
- UCS
- Best First Search
- A*
- Hill Climbing
- Planning
- Replanning
- AI hints
- visualization

---

# 6. GAME STATE MODEL

Create a canonical `GameState` model.

Example:

```python
class GameState:
    game_id: str

    day: int
    actions_remaining: int

    health: float
    water: float
    food: float
    energy: float

    shelter_level: int

    wood: int
    rope: int
    metal: int
    tools: int

    escape_progress: float

    location: str

    weather: str

    discovered_locations: list[str]

    active_effects: list[str]

    current_objective: str

    boat_parts: dict

    player_profile: dict

    difficulty_profile: dict

    game_status: str
```

The exact fields can evolve, but all AI algorithms must operate against a common state interface.

---

# 7. ACTION MODEL

Actions should be first-class objects.

Example:

```python
class Action:
    id: str
    name: str
    description: str

    energy_cost: float
    water_cost: float
    food_cost: float

    risk: float

    prerequisites: list[str]
```

Each action must have:

1. Preconditions
2. Cost
3. Effects
4. Risk
5. Resulting state

Example:

```text
ACTION: Explore Eastern Shore

Preconditions:
- energy >= 15
- water >= 5

Costs:
- energy -15
- water -5

Possible outcomes:
- find rope
- find wood
- discover location
- suffer injury
- find nothing

Potential state changes:
- escape_progress +X
- inventory changes
- player profile updated
```

---

# 8. RESOURCE SYSTEM

The game should contain meaningful resources.

Minimum:

```text
Health
Water
Food
Energy
Wood
Rope
Metal
Tools
Shelter
```

Resources must interact.

For example:

```text
Water decreases each day.
Food decreases each day.
Energy decreases through actions.
Low food/water affects health.
Low shelter increases weather damage.
```

Avoid making resource changes completely random.

They should depend on:

- action
- environment
- weather
- player profile
- difficulty
- previous events
- probabilistic model

---

# 9. ESCAPE SYSTEM

The player must have a long-term escape objective.

Example:

```text
Escape
│
├── Build Boat
│
├── Obtain Wood
│
├── Obtain Rope
│
├── Obtain Metal
│
└── Repair/Construct Components
```

The exact escape requirements can be designed later.

The important part is that escape is represented as a **goal state with prerequisites**.

For example:

```text
GOAL:
escape_ready == true
```

This enables:

- backward chaining
- planning
- A*
- UCS
- heuristic search
- replanning

---

# 10. EVENT SYSTEM

Events must not be purely random.

Create an internal event database/configuration.

Events should contain:

```python
EventDefinition:
    id
    name
    category
    description

    prerequisites

    base_probability

    resource_effects

    risk_level

    compatible_weather

    incompatible_events

    difficulty_modifier

    player_profile_modifiers
```

Categories:

```text
WEATHER
RESOURCE
EXPLORATION
DANGER
DISCOVERY
SURVIVAL
ESCAPE
```

Example events:

```text
Heavy Storm
Resource Discovery
Wild Animal Encounter
Fresh Water Discovery
Broken Equipment
Ship Wreck Discovery
Injury
Calm Weather
Food Spoilage
Storm Damage
Hidden Cave
```

---

# 11. ADAPTIVE EVENT GENERATION

The event generator should use:

```text
Current Game State
+
Player Profile
+
Difficulty Profile
+
Environment
+
Recent Events
+
Probabilistic Model
```

Then:

```text
Eligible Events
      ↓
Weighted Probabilities
      ↓
Event Selection
      ↓
Event Resolution
      ↓
New Game State
```

Do NOT simply do:

```python
random.choice(events)
```

Instead calculate meaningful weights.

For example:

```text
storm_weight =
    base_weight
    × weather_modifier
    × difficulty_modifier
    × shelter_modifier
    × recent_event_modifier
```

The system should also prevent nonsensical events.

Example:

If the player already experienced a severe storm yesterday, another severe storm should have reduced probability unless the design explicitly allows consecutive storms.

---

# 12. PLAYER PROFILE

The game should continuously analyze player behaviour.

Possible behavioral dimensions:

```text
exploration_frequency
risk_tolerance
resource_efficiency
resource_hoarding
rest_frequency
escape_focus
survival_stability
```

Classify the player into categories such as:

```text
Explorer
Risk Taker
Conservative
Balanced
```

Initially use transparent rule-based classification.

Later this can be replaced/extended with a Decision Tree or other classifier.

Example:

```text
if exploration_frequency > 0.65
and risk_tolerance > 0.6:

    profile = Explorer
```

The important thing is that this profile must actually be calculated from gameplay behaviour.

Do not fake it.

---

# 13. ADAPTIVE DIFFICULTY

Do NOT use only one `difficulty = 0.7` value.

Use a vector/profile.

Example:

```python
DifficultyProfile:
    resource_scarcity
    environmental_risk
    exploration_risk
    escape_complexity
```

These values should change gradually.

Example:

If player:

- rarely explores
- has abundant resources
- is surviving easily

then:

```text
exploration opportunities ↑
exploration incentives ↑
resource abundance slightly ↓
```

If player:

- takes extreme risks
- frequently loses health
- frequently reaches critical resource levels

then:

```text
danger probability ↓ slightly
recovery opportunities ↑
resource pressure ↓ slightly
```

The system should NOT punish or reward the player in an obvious/artificial way.

Adaptation should be subtle.

---

# 14. AI SURVIVAL ASSISTANT

The player gets:

## 3 FREE AI HINTS PER RUN

Important rules:

1. The three hints cannot be used simultaneously.
2. Only one hint can be active at a time.
3. After using a hint, there should be a cooldown.
4. Recommended cooldown: 2–3 turns.
5. Additional hints may be earned through gameplay.
6. Hints must NOT reveal a guaranteed winning path.
7. Hints should provide a recommendation plus reasoning.
8. The player retains final decision-making authority.

Example:

Bad:

```text
Choose Explore.
```

Good:

```text
Recommended Action:
Explore the eastern shore.

Reasoning:
- Your water supply is currently stable.
- Your escape plan requires rope.
- The eastern shore has a relatively high probability
  of containing useful materials.
- Your current energy level can support the exploration.
- Waiting another day increases the opportunity cost
  because weather risk is expected to rise.
```

The assistant should reason over the actual state.

---

# 15. HINT ARCHITECTURE

The hint system should be a wrapper over the AI engine.

Possible process:

```text
Current Game State
       ↓
Generate Valid Actions
       ↓
Evaluate Actions
       ↓
Search / Planning / Probability
       ↓
Rank Actions
       ↓
Generate Explanation
       ↓
Return Recommendation
```

The hint system should NOT directly manipulate the game.

It only recommends.

---

# 16. SEARCH ALGORITHMS

Implement the search algorithms against a common search interface.

Create something like:

```python
class SearchProblem:
    initial_state
    goal_test(state)
    get_actions(state)
    transition(state, action)
    step_cost(state, action)
    heuristic(state)
```

Then every algorithm can operate against the same abstraction.

---

# 17. BFS

Implement Breadth First Search.

Use it when:

- actions have roughly equal cost
- finding the minimum number of actions is important

Track:

```text
nodes_explored
frontier
visited
solution_path
depth
```

---

# 18. DFS

Implement Depth First Search.

Use it for:

- exploring deep strategy branches
- demonstrating difference from BFS

Track:

```text
nodes_explored
current_depth
visited
solution_path
```

---

# 19. ITERATIVE DEEPENING SEARCH

Implement IDS.

Run:

```text
depth = 0
depth = 1
depth = 2
...
```

until a goal is found.

Track each iteration for visualization.

---

# 20. UNIFORM COST SEARCH

Implement UCS.

Actions should have meaningful costs.

Cost could combine:

```text
energy consumed
water consumed
food consumed
health risk
time
```

Example:

```text
action_cost =
    energy_cost
    + water_cost
    + food_cost
    + risk_cost
```

The exact formula should be configurable.

---

# 21. BEST FIRST SEARCH

Use a heuristic to select the most promising state.

Example heuristic:

```text
estimated_escape_progress
+
resource_safety
+
distance_to_goal
```

Track the priority queue/frontier.

---

# 22. A* SEARCH

Implement actual A*:

```text
f(n) = g(n) + h(n)
```

where:

```text
g(n) = cost accumulated so far
h(n) = estimated cost to reach escape
```

A* should be one of the primary algorithms used by the AI Survival Assistant.

---

# 23. HILL CLIMBING

Implement Hill Climbing for local improvement.

Possible use:

Given a candidate survival strategy:

```text
Plan A
Plan B
Plan C
```

evaluate neighboring plans and move toward a better evaluation.

This can also be used by the adaptive difficulty system to gradually optimize challenge parameters.

---

# 24. MINIMAX AND ALPHA-BETA

Do NOT force Minimax into the main single-player survival loop.

If implemented, create an optional adversarial scenario.

Example:

## Rival Survivor Mode

Two survivors compete for:

- limited food
- water
- materials
- escape resources

The AI rival chooses actions strategically.

Then:

```text
MAX = player
MIN = AI rival
```

Implement:

- Minimax
- Alpha-Beta pruning

Show the search tree in AI Lab.

This should be optional and should not damage the main survival game.

---

# 25. KNOWLEDGE REPRESENTATION

Create a knowledge base representing facts and rules.

Example facts:

```text
storm_active
shelter_level_low
water_low
health_low
rope_required
boat_incomplete
```

Rules:

```text
IF storm_active AND shelter_level_low
THEN weather_damage_risk_high
```

```text
IF water_low
THEN dehydration_risk_high
```

```text
IF rope_missing AND boat_incomplete
THEN escape_not_ready
```

The knowledge base should be inspectable.

---

# 26. FORWARD CHAINING

Given current facts:

```text
storm_active
shelter_level_low
```

derive:

```text
weather_damage_risk_high
```

Then potentially:

```text
health_damage_expected
```

Use this reasoning to explain AI recommendations.

---

# 27. BACKWARD CHAINING

Start from:

```text
GOAL:
escape
```

Determine prerequisites:

```text
escape
↓
boat_complete
↓
boat_components
↓
materials
↓
exploration/gathering
```

Use this to show how the AI reasons backwards from the escape objective.

---

# 28. BAYESIAN / PROBABILISTIC REASONING

Use probabilistic reasoning for uncertain events.

Example:

```text
P(storm | current_weather, season, recent_weather)
```

or:

```text
P(find_rope | eastern_shore, wreckage_present)
```

The model should update beliefs as evidence becomes available.

Do not make the numbers arbitrary in the UI.

Expose the reasoning:

```text
Prior probability:
0.25

Evidence:
Cloud cover increasing

Updated probability:
0.48
```

This makes the probabilistic reasoning demonstrable.

---

# 29. PLANNING

Create a planner that can generate a multi-step plan toward escape.

Example:

```text
Current State
     ↓
Find Wood
     ↓
Find Rope
     ↓
Find Metal
     ↓
Craft Components
     ↓
Build Boat
     ↓
Escape
```

The planner should consider:

- prerequisites
- resources
- costs
- risks
- current environment

---

# 30. REPLANNING

Replanning is essential.

Example:

Initial plan:

```text
Explore → Wood → Rope → Boat → Escape
```

Unexpected event:

```text
Storm destroys collected wood.
```

The previous plan is now invalid.

The AI should detect that and generate:

```text
Search Wreckage → Wood → Rope → Boat → Escape
```

The AI Lab should show:

```text
OLD PLAN
     ↓
INVALIDATED
     ↓
NEW STATE
     ↓
REPLANNING
     ↓
NEW PLAN
```

---

# 31. AI LAB

This is one of the most important parts of the project.

Create a separate frontend tab:

# AI LAB

It should visualize what the AI is doing.

Sections:

```text
┌──────────────────────────────────────────────────────────┐
│ AI LAB                                                   │
├──────────────────────────────────────────────────────────┤
│ Algorithm: A*                                            │
│ Status: Exploring                                        │
│ Nodes Explored: 37                                       │
│ Frontier: 12                                             │
│ Solution Cost: 14                                        │
├──────────────────────────────────────────────────────────┤
│                                                          │
│                 STATE GRAPH                               │
│                                                          │
│                   [S0]                                   │
│                  /    \                                   │
│              [S1]      [S2]                               │
│              /  \         \                              │
│           [S3] [S4]       [S5]                            │
│               \            /                              │
│                [S9]                                        │
│                  │                                        │
│               [GOAL]                                      │
│                                                          │
├──────────────────────────────────────────────────────────┤
│ OPEN SET                                                │
│ S7  S9  S11                                             │
│                                                          │
│ CLOSED SET                                              │
│ S0  S1  S2  S3  S4                                     │
└──────────────────────────────────────────────────────────┘
```

Use React Flow for the graph.

---

# 32. REAL-TIME ALGORITHM VISUALIZATION

Do not just show the final search tree.

The visualization should show the algorithm progressing.

For example:

```text
Step 1
Explore S0

Step 2
Add S1, S2, S3

Step 3
Explore S1

Step 4
Add S4, S5

Step 5
Explore S4
```

The frontend should receive algorithm execution information from the backend.

Possible API:

```text
POST /api/ai/search/visualize
```

Response:

```json
{
  "algorithm": "astar",
  "steps": [
    {
      "step": 1,
      "current_node": "S0",
      "frontier": ["S1", "S2"],
      "explored": ["S0"]
    },
    {
      "step": 2,
      "current_node": "S1",
      "frontier": ["S2", "S3"],
      "explored": ["S0", "S1"]
    }
  ]
}
```

The frontend can animate these steps.

---

# 33. ALGORITHM COMPARISON

Add an Algorithm Comparison section.

Allow:

```text
BFS
DFS
IDS
UCS
Best First
A*
```

to solve the same planning problem.

Show:

| Algorithm | Nodes | Cost | Depth | Time | Result |
|---|---:|---:|---:|---:|---|
| BFS | 42 | 12 | 7 | ... | Success |
| DFS | 61 | 19 | 11 | ... | Success |
| UCS | 49 | 10 | 8 | ... | Success |
| Best First | 31 | 14 | 8 | ... | Success |
| A* | 27 | 10 | 8 | ... | Success |

This table is academically valuable.

---

# 34. ANALYTICS TAB

Create:

# ANALYTICS

Display:

- Survival days
- Resource history
- Health history
- Exploration frequency
- Risk-taking score
- Current player profile
- Difficulty progression
- Escape progress
- Hints used
- Hints earned
- Algorithm usage

Charts:

```text
Health over time
Water over time
Food over time
Energy over time
Escape progress
Difficulty progression
```

Use Recharts.

---

# 35. KNOWLEDGE / REASONING TAB

Create another tab:

# KNOWLEDGE

Display:

```text
CURRENT FACTS

✓ storm_active
✓ shelter_level_low
✓ water_stable
✓ rope_missing

TRIGGERED RULES

storm_active + shelter_level_low
→ weather_damage_risk_high

rope_missing + boat_incomplete
→ escape_not_ready

INFERENCE

Recommended:
Improve shelter before next storm.
```

This makes knowledge representation and reasoning visible to the evaluator.

---

# 36. MAIN GAME UI

The main game screen should be polished.

Suggested layout:

```text
┌───────────────────────────────────────────────────────────────┐
│ STRANDED                                  DAY 7     ⚙        │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│ HEALTH      WATER       FOOD       ENERGY                     │
│ ███████     █████       █████      ███████                    │
│ 72          45          31         60                         │
│                                                               │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│                     CURRENT SITUATION                         │
│                                                               │
│ You discover a partially damaged wreckage                    │
│ along the eastern shore.                                     │
│                                                               │
│ You may be able to recover useful materials, but the area     │
│ appears unstable.                                             │
│                                                               │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  [ SEARCH WRECKAGE ]       [ RETURN TO CAMP ]                │
│                                                               │
│  [ EXPLORE SHORE ]         [ REST ]                          │
│                                                               │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│ 🧠 AI HINTS: 2 remaining     Next hint available in 2 turns │
│                                                               │
│ [ ASK SURVIVAL ADVISOR ]                                     │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

---

# 37. VISUAL DESIGN

The game should feel like:

```text
Survival + Strategy + AI Laboratory
```

Avoid making it look like a generic CRUD application.

Design characteristics:

- dark natural palette
- ocean/forest/sand visual language
- strong typography
- cards
- progress bars
- subtle animations
- clean icons
- clear hierarchy
- responsive layout

Do NOT overdo visual effects.

The UI should prioritize usability.

---

# 38. FRONTEND ROUTES

Recommended routes:

```text
/
    Landing page

/game
    Main game

/ai-lab
    AI visualization

/analytics
    Player/game analytics

/knowledge
    Knowledge representation/reasoning

/algorithms
    Algorithm comparison

/help
    Rules/how to play
```

Alternatively these can be tabs within the main application.

---

# 39. BACKEND API

Recommended endpoints:

## Game

```text
POST /api/game/start
GET  /api/game/{game_id}
POST /api/game/{game_id}/action
POST /api/game/{game_id}/hint
POST /api/game/{game_id}/restart
```

## AI

```text
POST /api/ai/search
POST /api/ai/search/visualize
POST /api/ai/compare
POST /api/ai/plan
POST /api/ai/replan
POST /api/ai/reason
POST /api/ai/probability
```

## Analytics

```text
GET /api/analytics/{game_id}
GET /api/analytics/{game_id}/history
```

## Knowledge

```text
GET /api/knowledge/{game_id}
GET /api/knowledge/{game_id}/facts
GET /api/knowledge/{game_id}/rules
```

---

# 40. API RESPONSE DESIGN

All API responses should be structured and predictable.

Example:

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

Errors:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "INVALID_ACTION",
    "message": "The player does not have enough energy."
  }
}
```

Use Pydantic models for request/response validation.

---

# 41. DATABASE DESIGN

Create tables/models approximately as follows:

```text
Game
----
id
created_at
status
current_day
current_state


GameState
---------
id
game_id
day
state_json
created_at


ActionHistory
-------------
id
game_id
day
action
state_before
state_after
created_at


EventHistory
------------
id
game_id
day
event_id
outcome
created_at


PlayerProfile
-------------
game_id
exploration_score
risk_score
resource_score
profile_type


AlgorithmRun
------------
id
game_id
algorithm
nodes_explored
solution_cost
execution_time
result
created_at
```

Do not prematurely over-normalize everything.

Game state can initially be stored as JSON where practical.

---

# 42. GAME STATE TRANSITIONS

Centralize state transition logic.

There should be one reliable function:

```python
apply_action(
    state: GameState,
    action: Action
) -> StateTransition
```

It should:

1. Validate action
2. Apply costs
3. Apply effects
4. Generate possible event
5. Resolve event
6. Update resources
7. Update player profile
8. Update difficulty
9. Check game status
10. Return new state

Do NOT duplicate state transition logic across endpoints.

---

# 43. SEARCH STATE REPRESENTATION

Search should not mutate the real game state.

Search operates on copies/immutable representations.

Example:

```text
Real Game State
      │
      ▼
Search Problem
      │
      ├── simulated state
      ├── simulated state
      ├── simulated state
      └── ...
```

Search must never accidentally modify the player's actual game.

This is critical.

---

# 44. DETERMINISM FOR SEARCH

For AI search demonstrations, support deterministic simulation.

The search engine should be able to run:

```text
randomness = disabled
```

or use a fixed seed.

This allows:

```text
BFS
vs
DFS
vs
UCS
vs
A*
```

to solve the same state-space problem fairly.

Actual gameplay can still use probabilistic outcomes.

---

# 45. RANDOMNESS AND SEEDS

Every game should have a seed.

Example:

```python
game_seed = uuid(...)
```

Use a deterministic RNG derived from that seed when possible.

This allows replay/debugging.

Store the seed with the game.

---

# 46. SECURITY / VALIDATION

Never trust the frontend.

The backend must validate:

- game ID
- action legality
- hint availability
- cooldown
- resource values
- game status

The frontend should only display state.

The backend is authoritative.

---

# 47. ERROR HANDLING

Handle:

- invalid actions
- expired game
- game already finished
- insufficient resources
- AI search failure
- malformed requests
- database failure

The UI should display graceful errors.

Never expose Python stack traces to users.

---

# 48. PERFORMANCE

Do not allow unrestricted search explosions.

Implement:

```text
max_nodes
max_depth
max_execution_time
```

for search.

Example:

```python
SearchConfig(
    max_nodes=5000,
    max_depth=30,
    timeout_ms=2000
)
```

If search is terminated early, return:

```text
status = "LIMIT_REACHED"
```

rather than freezing the backend.

---

# 49. AI SEARCH VISUALIZATION DATA

Every search algorithm should produce a standardized result.

Example:

```python
SearchResult:
    algorithm
    success
    path
    cost
    nodes_explored
    max_frontier_size
    execution_time
    depth
    visualization_steps
```

This allows the frontend to visualize every algorithm using the same component.

---

# 50. FRONTEND COMPONENT STRUCTURE

Suggested:

```text
src/
│
├── components/
│   ├── game/
│   │   ├── ResourceBar.tsx
│   │   ├── SituationCard.tsx
│   │   ├── ActionCard.tsx
│   │   ├── HintPanel.tsx
│   │   └── GameHeader.tsx
│   │
│   ├── ai/
│   │   ├── SearchGraph.tsx
│   │   ├── SearchControls.tsx
│   │   ├── FrontierPanel.tsx
│   │   ├── SearchMetrics.tsx
│   │   └── AlgorithmComparison.tsx
│   │
│   ├── analytics/
│   │   ├── ResourceChart.tsx
│   │   ├── SurvivalChart.tsx
│   │   └── PlayerProfileCard.tsx
│   │
│   └── knowledge/
│       ├── FactsPanel.tsx
│       ├── RulesPanel.tsx
│       └── InferencePanel.tsx
│
├── pages/
│   ├── Landing.tsx
│   ├── Game.tsx
│   ├── AILab.tsx
│   ├── Analytics.tsx
│   └── Knowledge.tsx
│
├── api/
│   ├── game.ts
│   ├── ai.ts
│   └── analytics.ts
│
├── types/
│   ├── game.ts
│   ├── ai.ts
│   └── analytics.ts
│
└── app/
    └── router.tsx
```

---

# 51. BACKEND STRUCTURE

Use:

```text
backend/
│
├── app/
│   ├── main.py
│   │
│   ├── api/
│   │   ├── game.py
│   │   ├── ai.py
│   │   ├── analytics.py
│   │   └── knowledge.py
│   │
│   ├── game/
│   │   ├── state.py
│   │   ├── actions.py
│   │   ├── transitions.py
│   │   ├── events.py
│   │   └── engine.py
│   │
│   ├── algorithms/
│   │   ├── base.py
│   │   ├── bfs.py
│   │   ├── dfs.py
│   │   ├── ids.py
│   │   ├── ucs.py
│   │   ├── best_first.py
│   │   ├── astar.py
│   │   ├── hill_climbing.py
│   │   ├── minimax.py
│   │   └── alpha_beta.py
│   │
│   ├── reasoning/
│   │   ├── facts.py
│   │   ├── rules.py
│   │   ├── forward_chaining.py
│   │   └── backward_chaining.py
│   │
│   ├── probability/
│   │   └── bayesian.py
│   │
│   ├── planning/
│   │   ├── planner.py
│   │   └── replanner.py
│   │
│   ├── adaptation/
│   │   ├── player_profile.py
│   │   └── difficulty.py
│   │
│   ├── advisor/
│   │   ├── advisor.py
│   │   └── explanation.py
│   │
│   ├── database/
│   │   ├── models.py
│   │   ├── session.py
│   │   └── repository.py
│   │
│   └── schemas/
│       ├── game.py
│       ├── ai.py
│       └── analytics.py
│
├── tests/
│
├── requirements.txt
└── README.md
```

---

# 52. CONFIGURATION

Do not hard-code everything.

Create configuration files for:

```text
game settings
resource rates
event definitions
action definitions
difficulty parameters
escape requirements
search limits
```

For example:

```text
config/
├── actions.json
├── events.json
├── resources.json
├── difficulty.json
└── escape.json
```

This makes the game scalable.

---

# 53. TESTING

Implement unit tests for:

## Game

- action validation
- resource consumption
- state transitions
- event resolution
- win condition
- loss condition

## Search

- BFS
- DFS
- IDS
- UCS
- Best First
- A*

Test on small deterministic state graphs.

## Reasoning

- forward chaining
- backward chaining

## Probability

- probability updates

## Adaptation

- player classification
- difficulty adjustment

## Hints

- 3 free hints
- cooldown
- earned hints
- hint cannot modify state

---

# 54. IMPORTANT ACADEMIC REQUIREMENT

The project must not look like:

```text
"Game with some AI labels attached."
```

The AI algorithms must genuinely influence the system.

Examples:

### A*

Actually generates survival/escape plans.

### BFS

Actually finds shortest-action paths in a simplified state space.

### UCS

Actually minimizes weighted survival cost.

### Bayesian reasoning

Actually influences uncertain event estimation.

### Forward chaining

Actually derives consequences from game facts.

### Backward chaining

Actually decomposes the escape goal.

### Planning

Actually generates action sequences.

### Replanning

Actually responds to unexpected events.

### Player classification

Actually analyzes gameplay history.

### Adaptive difficulty

Actually changes game parameters.

### AI Advisor

Actually uses these components to generate recommendations.

---

# 55. DO NOT FORCE ALGORITHMS

If an algorithm does not naturally fit the single-player game, do not create a ridiculous artificial use.

Minimax and Alpha-Beta should belong to an optional adversarial/rival mode.

The main game should prioritize:

```text
Search
Reasoning
Probability
Planning
Adaptation
```

---

# 56. IMPLEMENTATION PHASES

Do NOT attempt everything simultaneously.

Build in phases.

## PHASE 1 — Project Setup

Create:

```text
frontend/
backend/
```

Set up:

- React
- TypeScript
- Vite
- Tailwind
- FastAPI
- Pydantic
- SQLAlchemy
- SQLite

Verify frontend can call backend.

---

## PHASE 2 — Core Game

Implement:

- GameState
- actions
- resources
- day cycle
- state transitions
- win/loss
- basic events

At the end of Phase 2, the game should already be playable.

---

## PHASE 3 — Event System

Implement:

- event definitions
- eligibility
- weighted selection
- weather
- risk
- event history

---

## PHASE 4 — Player Adaptation

Implement:

- behavior metrics
- player classification
- adaptive difficulty
- adaptive event weights

---

## PHASE 5 — Search Engine

Implement:

1. BFS
2. DFS
3. IDS
4. UCS
5. Best First
6. A*
7. Hill Climbing

Use one shared `SearchProblem`.

---

## PHASE 6 — AI Advisor

Implement:

- action evaluation
- search-based recommendation
- reasoning explanation
- hint limits
- cooldown
- earned hints

---

## PHASE 7 — Knowledge + Probability

Implement:

- knowledge base
- facts
- rules
- forward chaining
- backward chaining
- Bayesian reasoning

---

## PHASE 8 — Planning

Implement:

- planner
- escape goal decomposition
- replanning after unexpected events

---

## PHASE 9 — AI Lab

Implement:

- graph visualization
- search animation
- algorithm comparison
- frontier
- explored nodes
- metrics

---

## PHASE 10 — Analytics

Implement:

- resource graphs
- player profile
- difficulty history
- algorithm statistics
- hint history

---

## PHASE 11 — Adversarial Mode

Only after everything above is stable:

- rival survivor
- Minimax
- Alpha-Beta

---

## PHASE 12 — Polish

Add:

- animations
- responsive design
- loading states
- error handling
- empty states
- tooltips
- transitions
- final visual polish

---

# 57. DEVELOPMENT PRINCIPLE

Always maintain a playable application.

Do NOT spend several weeks implementing AI before the game works.

The milestone sequence should be:

```text
Playable Game
      ↓
Playable + Events
      ↓
Playable + Adaptation
      ↓
Playable + Search
      ↓
Playable + AI Advisor
      ↓
Playable + Reasoning
      ↓
Playable + Planning
      ↓
AI Visualization
      ↓
Analytics
      ↓
Polish
```

---

# 58. MVP DEFINITION

The MVP is complete when:

1. A player can start a game.
2. The player receives a state.
3. The player can perform actions.
4. Resources change.
5. Events occur.
6. Days progress.
7. The player can eventually escape or fail.
8. Player behavior is recorded.
9. Difficulty adapts.
10. At least A* can generate a meaningful recommendation.
11. The player has 3 free hints.
12. Hints have cooldown.
13. The AI Lab displays a search graph.
14. The frontend communicates with the Python backend.
15. The application can be deployed.

Everything else is an extension.

---

# 59. DEPLOYMENT

The final deployment should look like:

```text
GitHub
│
├── frontend
│      ↓
│    Vercel
│
└── backend
       ↓
     Render
```

Frontend environment variable:

```text
VITE_API_URL=https://your-backend-url
```

Backend should configure:

```text
DATABASE_URL
FRONTEND_URL
ENVIRONMENT
```

FastAPI must configure CORS to allow the production frontend.

Do not hard-code localhost URLs in production.

---

# 60. LOCAL DEVELOPMENT

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Backend:

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Windows equivalent activation may be required.

---

# 61. PRODUCTION REQUIREMENTS

Frontend:

```bash
npm run build
```

Backend should expose:

```text
GET /
```

returning something like:

```json
{
  "status": "ok",
  "service": "stranded-api"
}
```

Also expose:

```text
GET /health
```

for deployment health checks.

---

# 62. CODE QUALITY

The implementation should prioritize:

- type safety
- clear abstractions
- small modules
- no duplicated logic
- meaningful variable names
- comments for algorithms
- docstrings for important AI functions
- unit tests
- predictable API contracts

Do not create a massive monolithic file.

Do not put all game logic into React components.

Do not put all backend logic into `main.py`.

---

# 63. IMPORTANT FRONTEND/BACKEND RULE

The backend is authoritative.

Never allow the frontend to decide:

```text
whether an action is valid
whether a hint is available
whether the player has enough resources
whether the player has escaped
whether the player has won
```

The frontend requests an action.

The backend decides the result.

---

# 64. AI EXPLANABILITY

Every major AI recommendation should have an explanation.

For example:

```text
Recommendation:
Search the eastern shore.

Supporting factors:

+ High probability of rope discovery
+ Escape plan requires rope
+ Current energy is sufficient
+ Weather risk is moderate

Negative factors:

- 15 energy cost
- Moderate injury risk
```

This is especially important because the project is about AI, not merely gameplay.

---

# 65. DESIGN PHILOSOPHY

The player should feel:

> "I am making survival decisions."

The professor should feel:

> "I can clearly see where the AI algorithms are being used."

The developer should feel:

> "I can add another algorithm without rewriting the entire game."

That is the core design goal.

---

# 66. FINAL SUCCESS CRITERIA

The final application should feel like:

```text
             STRANDED
                  │
        ┌─────────┴─────────┐
        │                   │
      GAME                AI LAB
        │                   │
   Survival            Search Visualizer
   Resources           Algorithm Compare
   Events              Planning
   Exploration         Reasoning
   Escape              Probability
        │                   │
        └─────────┬─────────┘
                  │
              ANALYTICS
                  │
        Player Behavior
        Difficulty
        Performance
```

The game should be simple enough for a user to understand within a minute, but technically deep enough that the underlying AI system supports:

- BFS
- DFS
- IDS
- UCS
- Best First Search
- A*
- Hill Climbing
- Minimax
- Alpha-Beta
- Knowledge Representation
- Forward Chaining
- Backward Chaining
- Bayesian reasoning
- Planning
- Replanning
- Classification
- Adaptive difficulty

without making the project feel like a collection of unrelated demos.

---

# 67. INSTRUCTIONS TO THE IMPLEMENTING AI AGENT

You are the primary implementation agent for this project.

You should:

1. First inspect the existing repository.
2. Do not destroy existing work without understanding it.
3. Establish the frontend/backend architecture.
4. Implement the project incrementally.
5. Keep the application runnable after each major phase.
6. Create reusable abstractions for AI algorithms.
7. Write tests alongside core AI functionality.
8. Do not fake algorithm outputs.
9. Do not replace AI algorithms with random selection.
10. Do not implement algorithms only for display.
11. Ensure gameplay actually uses the AI systems.
12. Keep the UI polished throughout development.
13. Use realistic deterministic test scenarios for algorithm comparison.
14. Keep the game state serializable.
15. Keep the backend authoritative.
16. Do not introduce unnecessary infrastructure.
17. Do not use external ML datasets unless there is a clear reason.
18. Keep the system extensible.
19. Document major architectural decisions.
20. Before declaring completion, verify that the application can run locally from a clean setup.

When uncertain between adding complexity and keeping the game understandable, prefer:

> simple gameplay + sophisticated underlying AI.

Do not turn the game itself into a complicated rules simulator.

The complexity should live primarily in the AI systems, state representation, adaptation, planning, and visualization.

---

# 68. FIRST TASK

Before implementing advanced AI:

### Step 1

Create the repository structure.

### Step 2

Create the React frontend.

### Step 3

Create the FastAPI backend.

### Step 4

Connect frontend → backend.

### Step 5

Implement the initial `GameState`.

### Step 6

Implement:

```text
Start Game
↓
View State
↓
Choose Action
↓
Backend validates action
↓
State transitions
↓
Return new state
```

### Step 7

Create a basic polished Game UI.

### Step 8

Only after this works, begin adding the AI systems.

Do not implement the entire specification in one giant step.

Build vertically and keep the application runnable at every stage.