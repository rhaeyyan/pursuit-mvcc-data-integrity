import styles from "./RightInspector.module.css";

export default function RightInspector() {
  return (
    <aside className={styles.inspectorContainer} aria-label="Data Inspector">
      <div className={styles.header}>
        <h2 className={styles.title}>Data Reliability</h2>
        <span className={styles.badge}>2018–25</span>
      </div>

      <div className={styles.content}>
        <div className={styles.section}>
          <h3 className={styles.label}>Window</h3>
          <p className={styles.text}>2018–25</p>
        </div>

        <div className={styles.section}>
          <h3 className={styles.label}>Minor Crashes</h3>
          <p className={styles.text}>
            Excluded from primary metrics due to uneven reporting. Data strictly
            follows casualty-filtered events.
          </p>
        </div>
      </div>

      <div className={styles.footer}>
        <h3 className={styles.label}>Defensible line</h3>
        <p className={styles.text}>
          Casualty-filtered collisions fell 18.2% from 2018 to 2025.
        </p>
      </div>
    </aside>
  );
}
