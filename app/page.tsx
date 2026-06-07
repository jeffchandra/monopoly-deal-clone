import {
  createGame,
  createPlayer,
  endTurn,
} from "../lib/gameEngine";

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

  endTurn(game);

  return (
    <main>
      <h1>
        Monopoly Deal Clone
      </h1>

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