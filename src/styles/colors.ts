export const colors = {
  appBackground: '#090b10',
  neutral900: '#151a24',
  neutral950: '#0e1219',
  slate950: '#06080d',
  white: '#f8fafc',
  shadowDark: '#02040a',
  brandSoft: '#38bdf8',
  brandWarm: '#818cf8',
} as const;

export const gradients = {
  authShellBackground: `radial-gradient(circle at 14% 16%, rgba(14, 165, 233, 0.16), transparent 32%), radial-gradient(circle at 86% 18%, rgba(99, 102, 241, 0.14), transparent 36%), linear-gradient(180deg, ${colors.neutral950} 0%, ${colors.neutral900} 74%, ${colors.slate950} 100%)`,
  heroBackground: `radial-gradient(circle at 20% 20%, rgba(14, 165, 233, 0.18), transparent 35%), radial-gradient(circle at 80% 30%, rgba(99, 102, 241, 0.14), transparent 35%), linear-gradient(180deg, ${colors.neutral950} 0%, ${colors.neutral900} 70%, ${colors.slate950} 100%)`,
  bannerGlow: `radial-gradient(circle at 20% 20%, rgba(248, 250, 252, 0.12), transparent 42%)`,
} as const;
