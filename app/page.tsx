import {
  createGame,
  createPlayer,
  startGame,
  playCard,
} from "../lib/gameEngine";

import {
  getCompletedSetCount,
} from "../lib/propertyUtils";

export default function Home() {
  const player1 =
    createPlayer(
      "p1",
      "Player 1"
    );

  const player2 =
    createPlayer(
      "p2",
      "Player 2"
    );

  const game =
    createGame(
      player1,
      player2
    );

  startGame(game);

  const propertyCards =
    game.players[0].hand.filter(
      card =>
        card.type ===
        "property"
    );

  for (const card of propertyCards) {
    playCard(
      game,
      "p1",
      card.id
    );
  }

  return (
    <main
      style={{
        padding: "20px",
      }}
    >
      <h1>
        Monopoly Deal Clone
      </h1>

      <h2>
        Completed Sets:
        {" "}
        {getCompletedSetCount(
          game.players[0]
        )}
      </h2>

      <pre>
        {JSON.stringify(
          game,
          null,
          2
        )}
      </pre>
    </main>
  );
}