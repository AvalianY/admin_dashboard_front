import { icons, type IconName } from "./icon-data";
import styles from "./ui.module.css";

export function Icon({ name, size }: { name: IconName; size?: number }) {
  const icon = icons[name];
  const scale = size === undefined ? 1 : size / Math.max(icon.width, icon.height);
  return (
    <span
      className={styles.icon}
      style={{ width: icon.width * scale, height: icon.height * scale }}
      aria-hidden="true"
    >
      <svg
        width={icon.width}
        height={icon.height}
        viewBox={icon.viewBox}
        focusable="false"
        style={{ transform: `scale(${scale})` }}
      >
        <use href={`/icons.svg#icon-${name}`} />
      </svg>
    </span>
  );
}
