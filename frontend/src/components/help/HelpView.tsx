export function HelpView() {
  return (
    <section className="gameplay-guide">
      <h2>Survive today. Build your escape.</h2>
      <p>
        You have two actions each day. Each committed choice spends one action
        plus its listed supplies. After the second choice, night passes and a
        new day begins.
      </p>
      <ol>
        <li>
          <strong>Check your condition.</strong> Water and food are consumed
          overnight. Depletion harms health. Energy pays for work; resting and
          shelter help recovery.
        </li>
        <li>
          <strong>Preview before you act.</strong> Scene buttons and map markers
          let you inspect options freely. Only “Take this action” spends a turn.
          Previewing a cave does not mean you have explored it.
        </li>
        <li>
          <strong>Gather and explore.</strong> Collect water, food, and wood.
          Explore the eastern shore to unlock wreckage salvage. Search the cave
          for metal and tools. Locked choices explain their requirements.
        </li>
        <li>
          <strong>Prepare your camp.</strong> Improve shelter to support
          recovery and withstand bad weather. Check your bag before crafting.
        </li>
        <li>
          <strong>Build all four boat parts.</strong> Hull, rigging, rudder, and
          provisions are required. Open Escape plan for your next step. Once
          ready, select Launch escape at the boat slipway.
        </li>
      </ol>
      <h3>Tools you can open without spending a turn</h3>
      <p>
        <b>Bag:</b> materials and boat readiness. <b>Your journey:</b> recorded
        moves and simulated alternatives. <b>AI Lab:</b> optional search and
        reasoning experiments. <b>Report:</b> your decisions and resource
        trends.
      </p>
      <h3>Advisor hints</h3>
      <p>
        You start with three hints. Requesting one uses a hint, but does not
        consume an action. A two-action cooldown follows each hint; discoveries
        can earn additional hints. The advisor explains a recommendation, and
        you decide whether to take it.
      </p>
      <h3>Real outcomes and possible futures</h3>
      <p>
        Weather, events, and discoveries can change real outcomes. Blue dashed
        graph branches are deterministic simulations. Teal paths show what
        actually happened. Experiments do not alter your saved expedition.
      </p>
    </section>
  );
}
