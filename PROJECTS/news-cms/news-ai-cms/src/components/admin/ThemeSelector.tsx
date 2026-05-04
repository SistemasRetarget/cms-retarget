'use client';

import { useTheme } from '@/lib/useTheme';
import { getContrastRatio } from '@/lib/themes';
import styles from './ThemeSelector.module.css';

export default function ThemeSelector() {
  const { theme, selectTheme, availableThemes } = useTheme();

  if (!theme) return null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Apariencia</h3>
        <p className={styles.subtitle}>Selecciona un tema</p>
      </div>

      <div className={styles.grid}>
        {availableThemes.map(t => {
          const contrast = getContrastRatio(t.colors.background, t.colors.text);
          const isSelected = theme.id === t.id;

          return (
            <button
              key={t.id}
              onClick={() => selectTheme(t.id)}
              className={`${styles.themeCard} ${isSelected ? styles.selected : ''}`}
              style={{
                '--preview-bg': t.colors.background,
                '--preview-text': t.colors.text,
                '--preview-primary': t.colors.primary,
              } as React.CSSProperties}
            >
              <div className={styles.preview}>
                <div className={styles.previewColor} />
              </div>
              <div className={styles.info}>
                <div className={styles.name}>{t.name}</div>
                <div className={styles.meta}>
                  {t.contrast === 'enhanced' && (
                    <span className={styles.badge}>Contraste alto</span>
                  )}
                  <span className={styles.contrast}>
                    {contrast >= 7 ? '✓ AAA' : contrast >= 4.5 ? '✓ AA' : '⚠ Low'}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.label}>Tema actual:</span>
          <span className={styles.value}>{theme.name}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.label}>Contraste:</span>
          <span className={styles.value}>
            {getContrastRatio(theme.colors.background, theme.colors.text).toFixed(2)}:1
          </span>
        </div>
      </div>
    </div>
  );
}
