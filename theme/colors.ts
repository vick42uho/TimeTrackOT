const lightColors = {
  // Base colors
  background: '#f8fafc',
  foreground: '#0f172a',

  // Card colors
  card: '#ffffff',
  cardForeground: '#0f172a',

  // Popover colors
  popover: '#ffffff',
  popoverForeground: '#0f172a',

  // Primary colors
  primary: '#2563eb',
  primaryForeground: '#FFFFFF',

  // Secondary colors
  secondary: '#f1f5f9',
  secondaryForeground: '#0f172a',

  // Muted colors
  muted: '#78788033',
  mutedForeground: '#71717a',

  // Accent colors
  accent: '#f1f5f9',
  accentForeground: '#0f172a',

  // Destructive colors
  destructive: '#ef4444',
  destructiveForeground: '#FFFFFF',

  // Border and input
  border: '#e2e8f0',
  input: '#e4e4e7',
  ring: '#a1a1aa',

  // Text colors
  text: '#0f172a',
  textMuted: '#71717a',

  // Legacy support for existing components
  tint: '#2563eb',
  icon: '#64748b',
  tabIconDefault: '#64748b',
  tabIconSelected: '#2563eb',

  // Default buttons, links, Send button, selected tabs
  blue: '#007AFF',

  // Success states, FaceTime buttons, completed tasks
  green: '#34C759',

  // Delete buttons, error states, critical alerts
  red: '#FF3B30',

  // VoiceOver highlights, warning states
  orange: '#FF9500',

  // Notes app accent, Reminders highlights
  yellow: '#FFCC00',

  // Pink accent color for various UI elements
  pink: '#FF2D92',

  // Purple accent for creative apps and features
  purple: '#AF52DE',

  // Teal accent for communication features
  teal: '#5AC8FA',

  // Indigo accent for system features
  indigo: '#5856D6',

  // Semantic states
  success: '#22c55e',
  successForeground: '#ffffff',
  warning: '#f59e0b',
  warningForeground: '#ffffff',
  info: '#3b82f6',
  infoForeground: '#ffffff',
  error: '#ef4444',
  errorForeground: '#ffffff',
};

const darkColors = {
  // Base colors
  background: '#090d16',
  foreground: '#f8fafc',

  // Card colors
  card: '#131b2e',
  cardForeground: '#f8fafc',

  // Popover colors
  popover: '#131b2e',
  popoverForeground: '#f8fafc',

  // Primary colors
  primary: '#3b82f6',
  primaryForeground: '#FFFFFF',

  // Secondary colors
  secondary: '#1e293b',
  secondaryForeground: '#f8fafc',

  // Muted colors
  muted: '#78788033',
  mutedForeground: '#94a3b8',

  // Accent colors
  accent: '#1e293b',
  accentForeground: '#f8fafc',

  // Destructive colors
  destructive: '#ef4444',
  destructiveForeground: '#FFFFFF',

  // Border and input - using alpha values for better blending
  border: '#1e293b',
  input: '#111827',
  ring: '#3b82f6',

  // Text colors
  text: '#f8fafc',
  textMuted: '#94a3b8',

  // Legacy support for existing components
  tint: '#3b82f6',
  icon: '#94a3b8',
  tabIconDefault: '#94a3b8',
  tabIconSelected: '#3b82f6',

  // Default buttons, links, Send button, selected tabs
  blue: '#0A84FF',

  // Success states, FaceTime buttons, completed tasks
  green: '#30D158',

  // Delete buttons, error states, critical alerts
  red: '#FF453A',

  // VoiceOver highlights, warning states
  orange: '#FF9F0A',

  // Notes app accent, Reminders highlights
  yellow: '#FFD60A',

  // Pink accent color for various UI elements
  pink: '#FF375F',

  // Purple accent for creative apps and features
  purple: '#BF5AF2',

  // Teal accent for communication features
  teal: '#64D2FF',

  // Indigo accent for system features
  indigo: '#5E5CE6',

  // Semantic states
  success: '#16a34a',
  successForeground: '#ffffff',
  warning: '#d97706',
  warningForeground: '#ffffff',
  info: '#2563eb',
  infoForeground: '#ffffff',
  error: '#dc2626',
  errorForeground: '#ffffff',
};

export const Colors = {
  light: lightColors,
  dark: darkColors,
};

// Export individual color schemes for easier access
export { darkColors, lightColors };

// Utility type for color keys
export type ColorKeys = keyof typeof lightColors;

// Helper function to get color with opacity (useful for React Native)
export const withOpacity = (color: string, opacity: number) => {
  // Handle rgba colors
  if (color.startsWith('rgba')) {
    return color;
  }

  // Handle hex colors
  if (color.startsWith('#')) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  return color;
};
