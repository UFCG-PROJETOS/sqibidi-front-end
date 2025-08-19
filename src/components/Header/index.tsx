import styles from "./Header.module.css";

const Header = () => {
	return (
		<header className={styles.headerContainer}>
			<div className={styles.headerLeft}>
				<button
					type="button"
					className={styles.iconButton}
					aria-label="Abrir menu"
				>
					<span className={styles.icon}>&#94;</span>
				</button>
				<button type="button" className={styles.iconButton} aria-label="Ajuda">
					<span className={styles.icon}>?</span>
				</button>
			</div>

			<div className={styles.headerCenter}>
				<h1 className={styles.headerTitle}>SQIBIDI</h1>
			</div>

			<div className={styles.headerRight}>
				<button
					type="button"
					className={styles.iconButton}
					aria-label="Estatísticas"
				>
					<span className={styles.icon}>&#128202;</span>{" "}
				</button>
				<button
					type="button"
					className={styles.iconButton}
					aria-label="Configurações"
				>
					<span className={styles.icon}>&#9881;</span>{" "}
				</button>
			</div>
		</header>
	);
};

export default Header;
