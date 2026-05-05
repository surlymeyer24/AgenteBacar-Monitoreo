import { NAV_ICONS, NAV_ICON_PROPS } from '../lib/navIcons';

export default function NavIcon({ name, size, className }) {
  const Icon = name ? NAV_ICONS[name] : null;
  if (!Icon) return null;
  return <Icon {...NAV_ICON_PROPS} size={size ?? NAV_ICON_PROPS.size} className={className} />;
}
