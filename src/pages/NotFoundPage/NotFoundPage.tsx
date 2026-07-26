import { Link } from 'react-router';
import styles from './NotFoundPage.module.css';

export function NotFoundPage() {
  return (
    <div className={styles.root}>
      <h1 className={styles.title}>Страница не найдена</h1>
      <p className={styles.hint}>Проверьте адрес или вернитесь на главный экран.</p>
      <Link to="/today" className={styles.link}>
        На главную
      </Link>
    </div>
  );
}
