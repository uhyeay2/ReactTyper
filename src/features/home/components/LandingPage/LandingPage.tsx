import { Link } from "react-router-dom";
import styles from "./LandingPage.module.css";

interface FeatureCard {
  title: string;
  description: string;
}

const FEATURES: FeatureCard[] = [
  {
    title: "Typing Tests",
    description:
      "Challenge yourself with timed and word-count typing tests and measure your speed and accuracy in real time.",
  },
  {
    title: "Touch Typing Lessons",
    description:
      "Structured lessons guide you through the keyboard, helping you build muscle memory and type without looking.",
  },
  {
    title: "Virtual Keyboard",
    description:
      "Toggle an on-screen keyboard that highlights each key as you press it, showing the correct finger placement.",
  },
  {
    title: "Session History",
    description:
      "Every typing session is saved so you can review your progress, WPM trends, and accuracy over time.",
  },
];

export function LandingPage() {
  return (
    <div className={styles.container}>
      <section className={styles.hero}>
        <h1 className={styles.title}>ReactTyper</h1>
        <p className={styles.subtitle}>
          Improve your typing speed and accuracy with tests, lessons, and detailed
          progress tracking.
        </p>
        <Link className={styles.cta} to="/test">
          Start a Typing Test
        </Link>
      </section>

      <section className={styles.cards}>
        {FEATURES.map((feature) => (
          <article key={feature.title} className={styles.card}>
            <h2 className={styles.cardTitle}>{feature.title}</h2>
            <p className={styles.cardBody}>{feature.description}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
