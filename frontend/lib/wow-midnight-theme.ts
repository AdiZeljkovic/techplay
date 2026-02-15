/**
 * WoW Midnight Design System
 * Official Midnight expansion visual identity
 *
 * Based on Blizzard's Midnight aesthetic:
 * - Deep blue-black tones (not violet)
 * - Purple-to-gold gradients (Void → Light)
 * - Ethereal glow effects
 * - Sharp, modern borders
 * - Premium glass morphism
 */

export const MidnightTheme = {
  // Core Backgrounds (Deep Blue-Black)
  backgrounds: {
    void: 'linear-gradient(135deg, #0a0e1a 0%, #1a1f2e 50%, #0f1419 100%)',
    voidDark: 'linear-gradient(180deg, #050810 0%, #0a0e1a 100%)',
    lightEthereal: 'linear-gradient(135deg, #1a1f3a 0%, #2a2f4a 100%)',
    glass: 'rgba(10, 14, 26, 0.7)',
    glassLight: 'rgba(26, 31, 62, 0.5)',
  },

  // Void Theme (Purple)
  void: {
    primary: '#9370DB',      // Medium purple
    deep: '#6B46C1',         // Deep purple
    ethereal: '#A78BFA',     // Light ethereal purple
    dark: '#4C1D95',         // Very dark purple
    glow: 'rgba(147, 112, 219, 0.6)',
    glowStrong: 'rgba(147, 112, 219, 0.9)',
  },

  // Light Theme (Gold/Sunwell)
  light: {
    primary: '#FFD700',      // Gold
    warm: '#FFA500',         // Orange-gold
    bright: '#FFED4E',       // Bright gold
    prestige: '#F0E68C',     // Khaki gold
    glow: 'rgba(255, 215, 0, 0.6)',
    glowStrong: 'rgba(255, 215, 0, 0.9)',
  },

  // Urgency Colors (Red Crystal)
  urgency: {
    critical: '#DC143C',     // Crimson
    high: '#FF6B6B',         // Light red
    warning: '#FF8C00',      // Orange
    dark: '#8B0000',         // Dark red
    glow: 'rgba(220, 20, 60, 0.6)',
  },

  // Quel'Thalas Accent (Blood Elf)
  bloodElf: {
    crimson: '#DC143C',
    gold: '#DAA520',
    crystal: '#FF4500',
  },

  // UI Elements
  borders: {
    voidSharp: '2px solid rgba(147, 112, 219, 0.4)',
    voidGlow: '3px solid rgba(147, 112, 219, 0.6)',
    lightSharp: '2px solid rgba(255, 215, 0, 0.4)',
    lightGlow: '3px solid rgba(255, 215, 0, 0.6)',
    glass: '1px solid rgba(255, 255, 255, 0.1)',
  },

  // Shadows & Depth
  shadows: {
    voidGlow: '0 0 30px rgba(147, 112, 219, 0.4), 0 8px 20px rgba(0, 0, 0, 0.6)',
    lightGlow: '0 0 30px rgba(255, 215, 0, 0.4), 0 8px 20px rgba(0, 0, 0, 0.6)',
    urgencyGlow: '0 0 30px rgba(220, 20, 60, 0.5), 0 8px 20px rgba(0, 0, 0, 0.6)',
    depth: '0 10px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
    innerGlow: 'inset 0 0 40px rgba(147, 112, 219, 0.2)',
  },

  // Gradients (Void → Light)
  gradients: {
    voidToLight: 'linear-gradient(135deg, #6B46C1 0%, #9370DB 50%, #FFD700 100%)',
    voidHorizontal: 'linear-gradient(to right, #4C1D95, #6B46C1, #9370DB)',
    lightHorizontal: 'linear-gradient(to right, #DAA520, #FFD700, #FFED4E)',
    urgencyPulse: 'linear-gradient(135deg, #8B0000, #DC143C, #FF6B6B)',
    glassOverlay: 'linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0) 100%)',
  },

  // Typography
  text: {
    void: '#A78BFA',         // Ethereal purple
    light: '#FFD700',        // Gold
    bright: '#FFFFFF',       // White
    muted: '#9CA3AF',        // Gray
    urgent: '#FF6B6B',       // Light red
  },

  // Animations
  animations: {
    glow: {
      '@keyframes voidGlow': {
        '0%, 100%': { filter: 'drop-shadow(0 0 8px rgba(147, 112, 219, 0.6))' },
        '50%': { filter: 'drop-shadow(0 0 20px rgba(147, 112, 219, 0.9))' },
      },
      '@keyframes lightGlow': {
        '0%, 100%': { filter: 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.6))' },
        '50%': { filter: 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.9))' },
      },
    },
  },
};

// Quality Rating Colors (WoW Item Quality)
export const QualityColors = {
  legendary: { primary: '#FF8000', glow: 'rgba(255, 128, 0, 0.7)' },  // Orange
  epic: { primary: '#A335EE', glow: 'rgba(163, 53, 238, 0.7)' },      // Purple
  rare: { primary: '#0070DD', glow: 'rgba(0, 112, 221, 0.7)' },       // Blue
  uncommon: { primary: '#1EFF00', glow: 'rgba(30, 255, 0, 0.7)' },    // Green
  common: { primary: '#FFFFFF', glow: 'rgba(255, 255, 255, 0.7)' },   // White
};

// Utility function to get urgency colors based on days remaining
export const getUrgencyTheme = (daysRemaining: number) => {
  if (daysRemaining <= 3) {
    return {
      background: MidnightTheme.gradients.urgencyPulse,
      border: MidnightTheme.urgency.critical,
      text: MidnightTheme.urgency.high,
      glow: MidnightTheme.urgency.glow,
      shadow: MidnightTheme.shadows.urgencyGlow,
    };
  }
  if (daysRemaining <= 7) {
    return {
      background: `linear-gradient(135deg, ${MidnightTheme.urgency.warning}, ${MidnightTheme.light.warm})`,
      border: MidnightTheme.urgency.warning,
      text: MidnightTheme.light.warm,
      glow: 'rgba(255, 140, 0, 0.6)',
      shadow: '0 0 30px rgba(255, 140, 0, 0.5), 0 8px 20px rgba(0, 0, 0, 0.6)',
    };
  }
  if (daysRemaining <= 14) {
    return {
      background: MidnightTheme.gradients.voidToLight,
      border: MidnightTheme.void.primary,
      text: MidnightTheme.light.primary,
      glow: MidnightTheme.void.glow,
      shadow: MidnightTheme.shadows.voidGlow,
    };
  }
  return {
    background: MidnightTheme.backgrounds.void,
    border: MidnightTheme.void.ethereal,
    text: MidnightTheme.text.void,
    glow: MidnightTheme.void.glow,
    shadow: MidnightTheme.shadows.voidGlow,
  };
};

// Glass morphism card style
export const glassCard = {
  background: MidnightTheme.backgrounds.glass,
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  border: MidnightTheme.borders.glass,
  boxShadow: MidnightTheme.shadows.depth,
};

// Premium button style
export const premiumButton = (variant: 'void' | 'light' | 'urgency' = 'void') => {
  const themes = {
    void: {
      background: MidnightTheme.gradients.voidHorizontal,
      border: MidnightTheme.borders.voidGlow,
      shadow: MidnightTheme.shadows.voidGlow,
      text: MidnightTheme.text.bright,
    },
    light: {
      background: MidnightTheme.gradients.lightHorizontal,
      border: MidnightTheme.borders.lightGlow,
      shadow: MidnightTheme.shadows.lightGlow,
      text: '#000000',
    },
    urgency: {
      background: MidnightTheme.gradients.urgencyPulse,
      border: `2px solid ${MidnightTheme.urgency.critical}`,
      shadow: MidnightTheme.shadows.urgencyGlow,
      text: MidnightTheme.text.bright,
    },
  };

  return themes[variant];
};
