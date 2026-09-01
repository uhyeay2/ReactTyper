import { useNavigate } from "react-router-dom";
import styles from "./GamesScreen.module.css";

interface GameEntry {
  slug: string;
  title: string;
  description: string;
  tag: string;
}

const GAMES: GameEntry[] = [
  {
    slug: "word-drop",
    title: "Word Drop",
    description:
      "Type words before they fall and stack. Speed builds as you go; a fourth stacked word ends the game.",
    tag: "New",
  },
];

export function GamesScreen() {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <h1 className={styles.title}>Games</h1>
        <p className={styles.subtitle}>Choose a game to start</p>
      </div>

      <ul className={styles.grid}>
        {GAMES.map((game) => (
          <li key={game.slug} className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>{game.title}</span>
              {game.tag ? <span className={styles.tag}>{game.tag}</span> : null}
            </div>
            <p className={styles.cardDescription}>{game.description}</p>
            <button
              type="button"
              className={styles.play}
              onClick={() => navigate(`/games/${game.slug}`)}
            >
              Play
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
