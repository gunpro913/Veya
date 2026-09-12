import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Home as HomeIcon, Dumbbell, Camera, Utensils, TrendingUp, Bell, User,
  Flame, Zap, ChevronRight, ArrowLeft, Clock, Award, Lock, Send, ImagePlus,
  RefreshCw, Trophy, Pencil, AlertCircle, Search, Loader2, Sparkles, X, Check,
  Plus, Droplet, Moon, Smile, BookOpen, Users, Heart, ShoppingBag, ShoppingCart,
  CalendarDays, ListChecks, Trash2, Package, CreditCard, Minus, Tag, Repeat,
  Sunrise, MoonStar, BatteryFull, BatteryMedium, BatteryLow, ChevronLeft
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  DESIGN TOKENS — Liquid Glass                                       */
/* ------------------------------------------------------------------ */
/* ------------------------------------------------------------------ */
/*  THEME SYSTEM — VEYA Core (light/dark/system) + 3 fixed-character    */
/*  themes. `C` stays a single mutable object read live by every        */
/*  component (style={{color: C.text}} etc at render time), so          */
/*  switching themes just needs to mutate its values + trigger a        */
/*  re-render — no context refactor across 100+ call sites needed.      */
/* ------------------------------------------------------------------ */
const THEME_PALETTES = {
  coreDark: {
    bg: "#0B0D0E", text: "#F7F7F4", textDim: "rgba(247,247,244,0.62)", textFaint: "rgba(247,247,244,0.4)",
    violet: "#72B8B3", violetDim: "rgba(114,184,179,0.16)",
    amber: "#B99B5B", amberDim: "rgba(185,155,91,0.16)",
    mint: "#4D8F8B", mintDim: "rgba(77,143,139,0.16)",
    red: "#C2665C", redDim: "rgba(194,102,92,0.16)",
    glassBg: "#15181A", glassBorder: "rgba(247,247,244,0.10)", fill: "rgba(247,247,244,0.06)",
  },
  coreLight: {
    bg: "#F7F7F4", text: "#0B0D0E", textDim: "rgba(11,13,14,0.62)", textFaint: "rgba(11,13,14,0.4)",
    violet: "#72B8B3", violetDim: "rgba(114,184,179,0.16)",
    amber: "#96793A", amberDim: "rgba(150,121,58,0.14)",
    mint: "#4D8F8B", mintDim: "rgba(77,143,139,0.14)",
    red: "#A8483F", redDim: "rgba(168,72,63,0.12)",
    glassBg: "#FFFFFF", glassBorder: "rgba(11,13,14,0.08)", fill: "#E8EAE7",
  },
  obsidian: {
    bg: "#050506", text: "#F2F2F0", textDim: "rgba(242,242,240,0.58)", textFaint: "rgba(242,242,240,0.36)",
    violet: "#5FA39E", violetDim: "rgba(95,163,158,0.14)",
    amber: "#A78B52", amberDim: "rgba(167,139,82,0.14)",
    mint: "#3E7472", mintDim: "rgba(62,116,114,0.16)",
    red: "#B25850", redDim: "rgba(178,88,80,0.14)",
    glassBg: "#111213", glassBorder: "rgba(242,242,240,0.09)", fill: "rgba(242,242,240,0.05)",
  },
  aurora: {
    bg: "#FDFDFB", text: "#12151A", textDim: "rgba(18,21,26,0.6)", textFaint: "rgba(18,21,26,0.38)",
    violet: "#5FC2BB", violetDim: "rgba(95,194,187,0.16)",
    amber: "#C99A3F", amberDim: "rgba(201,154,63,0.14)",
    mint: "#4D8F8B", mintDim: "rgba(77,143,139,0.13)",
    red: "#C15A4F", redDim: "rgba(193,90,79,0.12)",
    glassBg: "#FFFFFF", glassBorder: "rgba(18,21,26,0.07)", fill: "#EFF3F1",
  },
  stealth: {
    bg: "#09090A", text: "#EDEDED", textDim: "rgba(237,237,237,0.55)", textFaint: "rgba(237,237,237,0.32)",
    violet: "#5A8F8B", violetDim: "rgba(90,143,139,0.12)",
    amber: "#9A8B6E", amberDim: "rgba(154,139,110,0.10)",
    mint: "#4A7A77", mintDim: "rgba(74,122,119,0.12)",
    red: "#9C5750", redDim: "rgba(156,87,80,0.12)",
    glassBg: "#0F0F10", glassBorder: "rgba(237,237,237,0.06)", fill: "rgba(237,237,237,0.04)",
  },
};

const THEME_META = {
  core: { name: "Veya Core", desc: "Clean, premium, balanced", swatch: null }, // swatch resolved from light/dark at render
  obsidian: { name: "Obsidian", desc: "Deep, focused, high contrast", swatch: THEME_PALETTES.obsidian },
  aurora: { name: "Aurora", desc: "Bright, fresh, energetic", swatch: THEME_PALETTES.aurora },
  stealth: { name: "Stealth", desc: "Minimal, technical, compact", swatch: THEME_PALETTES.stealth },
};

/* Accent packs layer an alternate primary accent color on top of
   whichever base theme is active — cosmetic only, unlocked with XP. */
const ACCENT_PACKS = {
  amber: { violet: "#C99A3F", violetDim: "rgba(201,154,63,0.16)" },
  rose: { violet: "#C15A78", violetDim: "rgba(193,90,120,0.16)" },
  sky: { violet: "#5B96C9", violetDim: "rgba(91,150,201,0.16)" },
};

const XP_SHOP_ITEMS = [
  { id: "accent_amber", category: "Accent Colors", type: "accent", value: "amber", name: "Amber Accent", desc: "Swap Veya's teal accent for a warm amber across the whole app.", price: 150 },
  { id: "accent_rose", category: "Accent Colors", type: "accent", value: "rose", name: "Rose Accent", desc: "A muted rose accent, layered on top of your current theme.", price: 150 },
  { id: "accent_sky", category: "Accent Colors", type: "accent", value: "sky", name: "Sky Accent", desc: "A cool sky-blue accent, layered on top of your current theme.", price: 150 },
  { id: "fx_glow", category: "UI Effects", type: "glow", value: true, name: "Momentum Glow", desc: "A soft glow around your Momentum ring on Home.", price: 100 },
  { id: "avatar_mark", category: "Avatars", type: "avatar", value: "mark", name: "Mark Avatar", desc: "Show the Veya mark instead of your initial in your avatar.", price: 120 },
  { id: "badge_iron", category: "Badges", type: "badge", value: "Iron Will", name: "Iron Will Badge", desc: "A badge next to your name in your profile.", price: 200 },
  { id: "badge_early", category: "Badges", type: "badge", value: "Early Riser", name: "Early Riser Badge", desc: "A badge next to your name in your profile.", price: 150 },
  { id: "badge_founding", category: "Badges", type: "badge", value: "Founding Member", name: "Founding Member Badge", desc: "A badge next to your name in your profile.", price: 300 },
];

const C = { ...THEME_PALETTES.coreDark };

/* ------------------------------------------------------------------ */
/*  SURFACES — calm, flat cards per VEYA guidelines (minimal, subtle    */
/*  borders, soft shadows, no heavy glass/blur effects)                 */
/* ------------------------------------------------------------------ */
function glassStyle(extra = {}) {
  return {
    background: C.glassBg,
    border: `1px solid ${C.glassBorder}`,
    boxShadow: "0 2px 12px rgba(0,0,0,0.22)",
    ...extra,
  };
}

function Glass({ children, style, className = "", onClick, tint, padded = true }) {
  const bg = tint ? `linear-gradient(135deg, ${tint}, transparent 65%), ${C.glassBg}` : C.glassBg;
  return (
    <div className={`relative overflow-hidden rounded-2xl ${className}`} style={glassStyle({ background: bg, ...style })} onClick={onClick}>
      <div className={`relative ${padded ? "p-5" : ""}`}>{children}</div>
    </div>
  );
}

function AmbientBackground() {
  return <div style={{ position: "fixed", inset: 0, zIndex: 0, background: C.bg }} />;
}

/* Minimal abstract V mark — placeholder until the official VEYA logo
   asset is supplied. Built to spec (abstract V, geometric, works small)
   but should be swapped for the real asset the moment it's available. */
/* Ribbon-style V mark, hand-traced from the supplied VEYA brand sheet
   (two interlacing ribbon strokes with hooked top terminals, crossing
   near the base). Built without a vector source, so treat as a close
   approximation — swap for the real exported SVG when available. */
function VeyaMark({ size = 24, color }) {
  const c = color || C.text;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <path d="M17,21 C25,14 36,14 43,20 C46,23 47,27 47,27 L47,34 C47,34 45,29 41,26 C36,22 29,22 24,27"
        stroke={c} strokeWidth="7.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.55" />
      <path d="M24,27 C30,33 36,42 40,52 C44,62 46,72 47,80"
        stroke={c} strokeWidth="7.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.55" />
      <path d="M17,21 C24,15 34,15 40,21 C46,27 49,36 50,44 L50,52 C49,42 45,33 39,27 C34,22 27,22 22,27 Z"
        fill={c} />
      <path d="M22,27 C29,34 35,44 39,55 C43,66 45,76 46,84 C47,76 50,64 55,53 C60,42 67,32 75,25"
        stroke={c} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M75,25 C68,18 58,17 51,23 C46,27 44,32 44,32 L44,40 C44,40 45,34 50,29 C56,24 64,24 70,29"
        stroke={c} strokeWidth="7.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function Pill({ children, tone = "violet" }) {
  const map = { violet: [C.violet, C.violetDim], amber: [C.amber, C.amberDim], mint: [C.mint, C.mintDim], red: [C.red, C.redDim] };
  const [fg, bg] = map[tone];
  return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium" style={{ color: fg, background: bg }}>{children}</span>;
}

function PrimaryButton({ children, onClick, disabled, icon: Icon, style }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 font-semibold text-sm transition-transform active:scale-[0.98] disabled:opacity-50"
      style={{ background: disabled ? C.fill : C.violet, color: disabled ? C.textFaint : "#0B0D0E", boxShadow: disabled ? "none" : "0 4px 14px rgba(114,184,179,0.28)", ...style }}>
      {Icon && <Icon size={17} />} {children}
    </button>
  );
}

function GhostButton({ children, onClick, icon: Icon, style }) {
  return (
    <button onClick={onClick}
      className="w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 font-semibold text-sm transition-transform active:scale-[0.98]"
      style={{ background: C.fill, color: C.text, border: `1px solid ${C.glassBorder}`, ...style }}>
      {Icon && <Icon size={17} />} {children}
    </button>
  );
}

function EmptyState({ title, sub, icon: Icon }) {
  return (
    <div className="flex flex-col items-center text-center py-10 px-6">
      {Icon && <div className="mb-3 rounded-2xl p-3" style={{ background: C.fill }}><Icon size={22} style={{ color: C.textDim }} /></div>}
      <p className="text-sm font-medium" style={{ color: C.text }}>{title}</p>
      {sub && <p className="text-xs mt-1" style={{ color: C.textFaint }}>{sub}</p>}
    </div>
  );
}

function Ring({ size = 96, stroke = 9, pct, color, track = C.fill, children }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const dash = Math.max(0, Math.min(1, pct)) * c;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeDasharray={`${dash} ${c}`} strokeLinecap="round" style={{ transition: "stroke-dasharray 0.6s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>{children}</div>
    </div>
  );
}

function Sheet({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ background: "rgba(0,0,0,0.55)" }} onClick={onClose}>
      <div className="rounded-t-3xl flex flex-col" style={{ ...glassStyle({ background: C.glassBg }), maxHeight: "calc(100% - 48px)" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-4 pb-3 shrink-0" style={{ borderBottom: `1px solid ${C.glassBorder}` }}>
          <p className="font-semibold text-base" style={{ color: C.text }}>{title}</p>
          <button onClick={onClose} className="p-1.5 rounded-full" style={{ background: C.fill }}><X size={16} style={{ color: C.textDim }} /></button>
        </div>
        <div className="overflow-y-auto px-5 py-4 flex-1 min-h-0" style={{ WebkitOverflowScrolling: "touch", overscrollBehavior: "contain" }}>{children}</div>
      </div>
    </div>
  );
}

function Toast({ text }) {
  if (!text) return null;
  return (
    <div className="fixed left-1/2 z-[60] px-4 py-2.5 rounded-2xl text-sm font-medium flex items-center gap-2"
      style={{ ...glassStyle({ background: "rgba(24,25,28,0.75)" }), bottom: 106, transform: "translateX(-50%)", color: C.text }}>
      <Sparkles size={15} style={{ color: C.amber }} /> {text}
    </div>
  );
}

function ErrorNote({ text }) {
  return (
    <div className="flex items-start gap-2 rounded-2xl p-3" style={{ background: C.redDim }}>
      <AlertCircle size={15} style={{ color: C.red, marginTop: 1 }} />
      <p className="text-xs" style={{ color: C.text }}>{text}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  CONTENT LIBRARY                                                     */
/* ------------------------------------------------------------------ */
const EXERCISES = [
  { id: "ex_squat", name: "Bodyweight Squat", muscle: "Legs, Glutes", equipment: "Bodyweight (or dumbbells)", difficulty: "Beginner", instructions: "Feet shoulder-width apart, chest tall. Sit your hips back and down like sitting into a chair, then drive up through your heels.", mistakes: "Knees caving inward; heels lifting off the floor.", alt: "Glute Bridge" },
  { id: "ex_pushup", name: "Push-Up (Incline or Full)", muscle: "Chest, Triceps, Shoulders", equipment: "Bodyweight", difficulty: "Beginner", instructions: "Hands slightly wider than shoulders, body in a straight line. On an incline (hands on a bench or counter) for an easier version. Lower your chest, press back up.", mistakes: "Sagging hips; flaring elbows too wide.", alt: "Wall Push-Up" },
  { id: "ex_glutebridge", name: "Glute Bridge", muscle: "Glutes, Hamstrings", equipment: "Bodyweight", difficulty: "Beginner", instructions: "Lie on your back, knees bent, feet flat. Squeeze your glutes and lift your hips until your body forms a straight line from shoulders to knees.", mistakes: "Overarching the lower back instead of squeezing glutes.", alt: "Bodyweight Squat" },
  { id: "ex_row", name: "Dumbbell / Backpack Row", muscle: "Back, Biceps", equipment: "Dumbbell or loaded backpack", difficulty: "Beginner", instructions: "Hinge forward, brace on a bench or your knee, pull the weight toward your hip, squeeze your shoulder blade at the top.", mistakes: "Twisting the torso; using momentum instead of control.", alt: "Resistance Band Row" },
  { id: "ex_deadbug", name: "Dead Bug", muscle: "Core", equipment: "Bodyweight", difficulty: "Beginner", instructions: "Lie on your back, arms up and knees bent at 90°. Slowly lower one arm and the opposite leg toward the floor while keeping your lower back pressed down, then return.", mistakes: "Letting the lower back arch off the floor.", alt: "Plank" },
  { id: "ex_catcow", name: "Cat-Cow", muscle: "Spine, Posture", equipment: "Bodyweight", difficulty: "Beginner", instructions: "On hands and knees, alternate arching and rounding your spine slowly, moving with your breath.", mistakes: "Rushing the movement instead of moving with breath.", alt: "Thread the Needle" },
  { id: "ex_wgs", name: "World's Greatest Stretch", muscle: "Hips, Spine, Hamstrings", equipment: "Bodyweight", difficulty: "Beginner", instructions: "From a deep lunge, place both hands inside your front foot, rotate your torso and reach one arm to the ceiling, then flow back down.", mistakes: "Rushing through instead of holding each rotation briefly.", alt: "Hip Mobility Drill" },
  { id: "ex_hipmob", name: "Hip Mobility Drill", muscle: "Hips", equipment: "Bodyweight", difficulty: "Beginner", instructions: "From standing or kneeling, circle each hip through its full range slowly — think 'drawing circles' with your knee — both directions.", mistakes: "Moving too fast to feel the actual range.", alt: "World's Greatest Stretch" },
  { id: "ex_shouldermob", name: "Shoulder Mobility Drill", muscle: "Shoulders", equipment: "Bodyweight", difficulty: "Beginner", instructions: "Slow arm circles, then reach one arm overhead and the other behind your back, alternating (a gentle version of a shoulder 'clock').", mistakes: "Shrugging the shoulders up toward the ears.", alt: "Wall Slides" },
  { id: "ex_hamstringmob", name: "Hamstring Mobility Drill", muscle: "Hamstrings", equipment: "Bodyweight", difficulty: "Beginner", instructions: "Standing or seated, hinge forward with a soft knee bend and reach toward your toes, holding gently where you feel a stretch — never forcing it.", mistakes: "Bouncing instead of holding a steady stretch.", alt: "World's Greatest Stretch" },
  { id: "ex_walk", name: "Easy Walk", muscle: "Full Body (low intensity)", equipment: "None", difficulty: "Beginner", instructions: "A relaxed-pace walk — outdoors or in place — to raise your heart rate gently and aid recovery.", mistakes: "Turning it into a hard effort — this is meant to feel easy.", alt: "Marching in Place" },
  { id: "ex_revlunge", name: "Reverse Lunge", muscle: "Legs, Glutes", equipment: "Bodyweight (or dumbbells)", difficulty: "Beginner", instructions: "Step one foot backward into a lunge, both knees bending toward 90°, then push through your front heel to return to standing.", mistakes: "Front knee traveling far past the toes; losing balance.", alt: "Split Squat" },
  { id: "ex_rdl", name: "Romanian Deadlift (Light)", muscle: "Hamstrings, Glutes", equipment: "Light dumbbells", difficulty: "Intermediate", instructions: "Hinge at the hips with a slight knee bend, lower the weights along your legs while keeping your back flat, then return to standing by driving your hips forward.", mistakes: "Rounding the lower back; bending the knees too much (turns it into a squat).", alt: "Glute Bridge", requiresEquipment: ["dumbbells"], altId: "ex_glutebridge" },
  { id: "ex_plank", name: "Plank", muscle: "Core", equipment: "Bodyweight", difficulty: "Beginner", instructions: "Forearms and toes on the floor, body in a straight line from head to heels. Brace your core and breathe steadily.", mistakes: "Hips sagging or piking up.", alt: "Dead Bug" },
  { id: "ex_marching", name: "Marching / High Knees", muscle: "Legs, Cardio", equipment: "None", difficulty: "Beginner", instructions: "Drive your knees up toward hip height at a steady rhythm, arms pumping naturally — start slow and build pace.", mistakes: "Leaning too far back instead of staying tall.", alt: "Easy Walk" },
  { id: "ex_backlunge", name: "Step-Back Lunge", muscle: "Legs, Glutes", equipment: "Bodyweight", difficulty: "Beginner", instructions: "Same movement pattern as a reverse lunge — step back, lower under control, push back to standing through the front heel.", mistakes: "Short, unstable steps.", alt: "Reverse Lunge" },
  { id: "ex_mountainclimber", name: "Mountain Climber (Slow Variation)", muscle: "Core, Cardio", equipment: "Bodyweight", difficulty: "Beginner", instructions: "From a plank position, drive one knee toward your chest at a time, controlled — speed up only once form feels solid.", mistakes: "Letting the hips pike up as you tire.", alt: "Dead Bug" },
  { id: "ex_calfraise", name: "Calf Raise", muscle: "Calves", equipment: "Bodyweight", difficulty: "Beginner", instructions: "Stand tall, rise onto the balls of your feet, pause briefly at the top, then lower with control.", mistakes: "Rushing through without a controlled lowering phase.", alt: "Single-Leg Calf Raise" },
  { id: "ex_stepup", name: "Step-Up", muscle: "Legs, Glutes", equipment: "Bench or sturdy step", difficulty: "Beginner", instructions: "Step fully onto a stable elevated surface, drive through the lead heel to stand tall, then step back down with control.", mistakes: "Pushing off the trailing leg instead of the working leg.", alt: "Reverse Lunge", requiresEquipment: ["bench"], altId: "ex_revlunge" },
  { id: "ex_splitsquat", name: "Split Squat", muscle: "Legs, Glutes", equipment: "Bodyweight (or dumbbells)", difficulty: "Intermediate", instructions: "In a staggered stance, lower your back knee toward the floor while keeping your front shin fairly vertical, then push back up.", mistakes: "Front knee drifting inward.", alt: "Reverse Lunge" },
  { id: "ex_sideplank", name: "Side Plank", muscle: "Obliques, Core", equipment: "Bodyweight", difficulty: "Intermediate", instructions: "Prop up on one forearm, stack your feet, lift your hips so your body forms a straight line. Keep your bottom hip lifted off the floor.", mistakes: "Letting the hips sag toward the floor.", alt: "Plank" },
  { id: "ex_shoulderpress", name: "Shoulder Press", muscle: "Shoulders, Triceps", equipment: "Dumbbells", difficulty: "Intermediate", instructions: "Dumbbells at shoulder height, press overhead until arms are extended, lower with control.", mistakes: "Arching the lower back; flaring elbows out too fast.", alt: "Pike Push-Up", requiresEquipment: ["dumbbells"], altId: "ex_pushup" },
  { id: "ex_latpulldown", name: "Lat Pulldown / Assisted Pull-Up", muscle: "Back, Biceps", equipment: "Cable machine or assisted pull-up machine", difficulty: "Intermediate", instructions: "Pull the bar (or your bodyweight) down/up toward your chest, leading with your elbows, squeezing your shoulder blades together.", mistakes: "Using momentum by leaning back excessively.", alt: "Dumbbell Row", requiresEquipment: ["gym"], altId: "ex_row" },
  { id: "ex_bicepcurl", name: "Biceps Curl", muscle: "Biceps", equipment: "Dumbbells", difficulty: "Beginner", instructions: "Elbows pinned to your sides, curl the weights up with control, squeeze at the top, lower slowly.", mistakes: "Swinging the weight using the shoulders or back.", alt: "Resistance Band Curl", requiresEquipment: ["dumbbells"], altId: "ex_row" },
  { id: "ex_tricepext", name: "Triceps Extension", muscle: "Triceps", equipment: "Dumbbell", difficulty: "Beginner", instructions: "Holding a dumbbell overhead with both hands, lower it behind your head by bending the elbows, then extend back up.", mistakes: "Elbows flaring outward instead of staying close to the head.", alt: "Triceps Push-Up", requiresEquipment: ["dumbbells"], altId: "ex_pushup" },
  { id: "ex_breathing", name: "Diaphragmatic Breathing", muscle: "Core, Nervous System", equipment: "None", difficulty: "Beginner", instructions: "Lying or seated, one hand on your chest and one on your belly. Breathe in through your nose so your belly rises more than your chest, exhale slowly.", mistakes: "Breathing shallow into the chest instead of the belly.", alt: "Box Breathing" },
  { id: "ex_neckmob", name: "Neck Mobility", muscle: "Neck", equipment: "None", difficulty: "Beginner", instructions: "Slowly tilt your head side to side, then rotate gently looking over each shoulder, moving well within a comfortable range.", mistakes: "Forcing the range or moving quickly.", alt: "Chin Tuck" },
  { id: "ex_thoracicrot", name: "Thoracic Rotation", muscle: "Upper Back, Spine", equipment: "None", difficulty: "Beginner", instructions: "On hands and knees, place one hand behind your head and rotate your elbow up toward the ceiling, following it with your eyes, then reverse.", mistakes: "Rotating from the lower back instead of the upper back.", alt: "Cat-Cow" },
  { id: "ex_anklemob", name: "Ankle Mobility", muscle: "Ankles", equipment: "None", difficulty: "Beginner", instructions: "In a half-kneeling position, drive your front knee forward over your toes without lifting your heel, feeling a stretch at the ankle.", mistakes: "Letting the heel lift off the ground.", alt: "Calf Raise" },
  { id: "ex_chintuck", name: "Chin Tuck", muscle: "Neck, Posture", equipment: "None", difficulty: "Beginner", instructions: "Gently draw your chin straight back (like making a 'double chin') without tilting up or down. Hold briefly, release.", mistakes: "Tilting the head down instead of drawing it straight back.", alt: "Neck Mobility" },
  { id: "ex_wallslides", name: "Wall Slides", muscle: "Shoulders, Upper Back", equipment: "None", difficulty: "Beginner", instructions: "Back against a wall, arms in a goalpost position touching the wall. Slide your arms overhead and back down while keeping contact with the wall.", mistakes: "Arching the lower back off the wall to force the range.", alt: "Shoulder Mobility Drill" },
  { id: "ex_thoracicext", name: "Thoracic Extension", muscle: "Upper Back", equipment: "None (optional rolled towel)", difficulty: "Beginner", instructions: "Seated or over a support at your upper back, gently arch your upper spine backward, opening the chest.", mistakes: "Extending from the lower back instead of the upper back.", alt: "Wall Slides" },
  { id: "ex_birddog", name: "Bird Dog", muscle: "Core, Lower Back", equipment: "Bodyweight", difficulty: "Beginner", instructions: "On hands and knees, extend one arm and the opposite leg until level with your torso, keeping your hips square, then return with control.", mistakes: "Rotating the hips instead of keeping them level.", alt: "Dead Bug" },
  { id: "ex_hipflexmob", name: "Hip-Flexor Mobility", muscle: "Hip Flexors", equipment: "None", difficulty: "Beginner", instructions: "From a kneeling lunge position, gently push your hips forward until you feel a stretch at the front of the back hip, keeping your torso tall.", mistakes: "Arching the lower back to fake more range.", alt: "World's Greatest Stretch" },
];

/* Courses are the source of truth; each day becomes a startable session. */
const COURSES = [
  {
    id: "c1", name: "Foundation: 4-Week Fitness Program", level: "Beginner", weeks: 4, sessionsPerWeek: 4,
    equipment: "Bodyweight; optional dumbbells", free: true,
    positioning: "Build consistency, movement quality, strength and fitness.",
    rewardXp: 500, badge: "Foundation Badge", unlocks: "Intermediate courses",
    days: [
      { label: "Day 1 — Full Body", tags: ["beginner", "back-after-a-break"], exercises: [{ ex: "ex_squat", sets: 3, reps: "10" }, { ex: "ex_pushup", sets: 3, reps: "8" }, { ex: "ex_glutebridge", sets: 3, reps: "12" }, { ex: "ex_row", sets: 3, reps: "10" }, { ex: "ex_deadbug", sets: 3, reps: "8 / side" }] },
      { label: "Day 2 — Mobility", tags: ["low-energy", "reset", "desk"], exercises: [{ ex: "ex_catcow", sets: 2, reps: "8" }, { ex: "ex_wgs", sets: 2, reps: "5 / side" }, { ex: "ex_hipmob", sets: 2, reps: "6 / side" }, { ex: "ex_shouldermob", sets: 2, reps: "8" }, { ex: "ex_hamstringmob", sets: 2, reps: "30s / side" }, { ex: "ex_walk", sets: 1, reps: "10 min" }] },
      { label: "Day 3 — Full Body Strength", tags: ["beginner"], exercises: [{ ex: "ex_revlunge", sets: 3, reps: "8 / side" }, { ex: "ex_pushup", sets: 3, reps: "8" }, { ex: "ex_rdl", sets: 3, reps: "10" }, { ex: "ex_row", sets: 3, reps: "10" }, { ex: "ex_plank", sets: 3, reps: "20-30s" }] },
      { label: "Day 4 — Conditioning", tags: ["beginner", "reset"], exercises: [{ ex: "ex_marching", sets: 3, reps: "30s" }, { ex: "ex_squat", sets: 3, reps: "10" }, { ex: "ex_backlunge", sets: 3, reps: "8 / side" }, { ex: "ex_pushup", sets: 3, reps: "8" }, { ex: "ex_mountainclimber", sets: 3, reps: "20s" }, { ex: "ex_catcow", sets: 1, reps: "8" }] },
    ],
  },
  {
    id: "c2", name: "Leg Day: Lower Body Strength", level: "Beginner → Intermediate", weeks: 4, sessionsPerWeek: 2,
    equipment: "Dumbbells", free: false, price: 9,
    positioning: "Build real lower-body strength with two focused sessions a week.",
    rewardXp: 600, badge: "Lower Body Badge", unlocks: null,
    days: [
      { label: "Session A", tags: [], exercises: [{ ex: "ex_squat", sets: 3, reps: "8-12" }, { ex: "ex_revlunge", sets: 3, reps: "8 / side" }, { ex: "ex_glutebridge", sets: 3, reps: "12" }, { ex: "ex_calfraise", sets: 3, reps: "12" }, { ex: "ex_deadbug", sets: 3, reps: "8 / side" }] },
      { label: "Session B", tags: [], exercises: [{ ex: "ex_rdl", sets: 3, reps: "8-12" }, { ex: "ex_stepup", sets: 3, reps: "8 / side" }, { ex: "ex_splitsquat", sets: 3, reps: "8 / side" }, { ex: "ex_calfraise", sets: 3, reps: "15" }, { ex: "ex_sideplank", sets: 3, reps: "20s / side" }] },
    ],
  },
  {
    id: "c3", name: "Strength Builder", level: "Intermediate", weeks: 6, sessionsPerWeek: 4,
    equipment: "Dumbbells; gym machines optional", free: false, price: 15,
    positioning: "A full weekly split for people ready to train with intent.",
    rewardXp: 900, badge: "Strength Builder Badge", unlocks: null,
    days: [
      { label: "Day 1 — Upper", tags: [], exercises: [{ ex: "ex_pushup", sets: 4, reps: "8-10" }, { ex: "ex_row", sets: 4, reps: "10" }, { ex: "ex_shoulderpress", sets: 3, reps: "10" }, { ex: "ex_latpulldown", sets: 3, reps: "10" }, { ex: "ex_bicepcurl", sets: 2, reps: "12" }, { ex: "ex_tricepext", sets: 2, reps: "12" }] },
      { label: "Day 2 — Lower", tags: [], exercises: [{ ex: "ex_squat", sets: 4, reps: "10" }, { ex: "ex_rdl", sets: 3, reps: "10" }, { ex: "ex_revlunge", sets: 3, reps: "8 / side" }, { ex: "ex_calfraise", sets: 3, reps: "15" }, { ex: "ex_deadbug", sets: 3, reps: "8 / side" }] },
      { label: "Day 3 — Recovery", tags: ["low-energy", "reset"], exercises: [{ ex: "ex_catcow", sets: 2, reps: "8" }, { ex: "ex_walk", sets: 1, reps: "15-20 min" }, { ex: "ex_wgs", sets: 2, reps: "5 / side" }] },
      { label: "Day 4 — Full Body", tags: [], exercises: [{ ex: "ex_squat", sets: 3, reps: "10" }, { ex: "ex_shoulderpress", sets: 3, reps: "10" }, { ex: "ex_row", sets: 3, reps: "10" }, { ex: "ex_rdl", sets: 3, reps: "10" }, { ex: "ex_plank", sets: 3, reps: "30s" }] },
      { label: "Day 5 — Optional Conditioning", tags: ["reset"], exercises: [{ ex: "ex_marching", sets: 3, reps: "30s" }, { ex: "ex_mountainclimber", sets: 3, reps: "20s" }] },
    ],
  },
  {
    id: "c4", name: "14-Day Mobility Reset", level: "All levels", weeks: 2, sessionsPerWeek: 7,
    equipment: "None", free: false, price: 7,
    positioning: "Improve movement quality and flexibility, 10–15 minutes a day.",
    rewardXp: 300, badge: "Mobility Master Badge", unlocks: null,
    dailyNote: "This program improves movement quality and flexibility — it doesn't promise permanent changes to body structure.",
    days: [
      { label: "Daily Flow", tags: ["low-energy", "reset", "desk"], exercises: [{ ex: "ex_breathing", sets: 1, reps: "1 min" }, { ex: "ex_neckmob", sets: 1, reps: "45s" }, { ex: "ex_shouldermob", sets: 1, reps: "45s" }, { ex: "ex_thoracicrot", sets: 1, reps: "6 / side" }, { ex: "ex_hipmob", sets: 1, reps: "6 / side" }, { ex: "ex_hamstringmob", sets: 1, reps: "30s / side" }, { ex: "ex_anklemob", sets: 1, reps: "6 / side" }, { ex: "ex_catcow", sets: 1, reps: "8" }] },
    ],
  },
  {
    id: "c5", name: "Posture & Movement", level: "Beginner", weeks: 3, sessionsPerWeek: 7,
    equipment: "None", free: false, price: 7,
    positioning: "Movement awareness and mobility work for people who sit a lot.",
    rewardXp: 400, badge: "Movement Master Badge", unlocks: null,
    dailyNote: "This focuses on movement awareness and mobility, not a promise of permanent posture correction.",
    days: [
      { label: "Daily Routine", tags: ["desk", "low-energy", "reset"], exercises: [{ ex: "ex_chintuck", sets: 2, reps: "8" }, { ex: "ex_wallslides", sets: 2, reps: "10" }, { ex: "ex_thoracicext", sets: 2, reps: "8" }, { ex: "ex_catcow", sets: 1, reps: "8" }, { ex: "ex_birddog", sets: 2, reps: "8 / side" }, { ex: "ex_glutebridge", sets: 2, reps: "12" }, { ex: "ex_hipflexmob", sets: 2, reps: "30s / side" }, { ex: "ex_shouldermob", sets: 1, reps: "45s" }] },
    ],
  },
  {
    id: "c6", name: "20-Minute Fitness", level: "Beginner", weeks: 4, sessionsPerWeek: 3,
    equipment: "Bodyweight", free: false, price: 9,
    positioning: "Built for limited time — a full session in 20 minutes.",
    rewardXp: 500, badge: "Consistency Badge", unlocks: null,
    days: [
      { label: "Full Session", tags: ["reset", "beginner"], exercises: [{ ex: "ex_marching", sets: 1, reps: "5 min warm-up" }, { ex: "ex_squat", sets: 2, reps: "12" }, { ex: "ex_pushup", sets: 2, reps: "8" }, { ex: "ex_revlunge", sets: 2, reps: "8 / side" }, { ex: "ex_row", sets: 2, reps: "10" }, { ex: "ex_plank", sets: 2, reps: "20s" }, { ex: "ex_catcow", sets: 1, reps: "5 min cooldown" }] },
    ],
  },
];

/* Derive startable "workout" sessions from every course day. */
const WORKOUTS = COURSES.flatMap((c) =>
  c.days.map((d, i) => ({
    id: `${c.id}-d${i}`, courseId: c.id, name: c.days.length > 1 ? `${c.name.split(":")[0]} · ${d.label}` : c.name,
    type: d.label, duration: Math.max(10, Math.round(d.exercises.length * 4.5)), difficulty: c.level.split(" ")[0],
    equipment: c.equipment, tags: d.tags || [], exercises: d.exercises,
  }))
);

/* Real day progression: advances Day 1 → Day 2 → Day 3 ... as sessions are
   completed, cycling back to Day 1 after the last day — rather than being
   pinned to a fixed weekday, which let people replay "Day 1" forever. */
function courseProgress(state, courseId) {
  const course = COURSES.find((c) => c.id === courseId);
  const courseWorkouts = WORKOUTS.filter((w) => w.courseId === courseId);
  const completedCount = state.workoutHistory.filter((h) => h.courseId === courseId).length;
  const nextIndex = courseWorkouts.length ? completedCount % courseWorkouts.length : 0;
  return { course, courseWorkouts, completedCount, nextIndex };
}
function nextWorkoutForCourse(state, courseId) {
  const { courseWorkouts, nextIndex } = courseProgress(state, courseId);
  return courseWorkouts[nextIndex] || courseWorkouts[0];
}

const COLLECTIONS = [
  { id: "reset", name: "15-Minute Reset", desc: "Short sessions for packed days", filter: "reset" },
  { id: "desk", name: "Desk Worker Relief", desc: "Undo hours of sitting", filter: "desk" },
  { id: "back-after-a-break", name: "Back After a Break", desc: "Ease back in without burnout", filter: "back-after-a-break" },
  { id: "low-energy", name: "Low-Energy Day", desc: "Something is better than nothing", filter: "low-energy" },
  { id: "beginner", name: "New to Training", desc: "Start here, no experience needed", filter: "beginner" },
];

/* Recipes — ingredients here don't include precise quantities, so calories
   are intentionally left out rather than invented; use "Estimate with AI" in-app. */
const RECIPES = [
  { id: "r1", name: "Avocado Smoothie", collection: "Everyday Breakfasts", time: "5 min", tags: ["Vegetarian", "Quick"], ingredients: ["1/2 avocado", "1 banana", "Milk or suitable alternative", "Water as needed", "Optional cinnamon"], steps: ["Add ingredients to a blender.", "Blend until smooth.", "Adjust consistency with water or milk.", "Serve immediately."] },
  { id: "r2", name: "Banana Oat Smoothie", collection: "Everyday Breakfasts", time: "5 min", tags: ["Vegetarian", "Quick"], ingredients: ["Banana", "Oats", "Milk or suitable alternative", "Cinnamon", "Water as needed"], steps: ["Blend until smooth."] },
  { id: "r3", name: "Egg & Vegetable Toast", collection: "Everyday Breakfasts", time: "10 min", tags: ["Vegetarian"], ingredients: ["Eggs", "Whole-grain bread", "Tomato", "Cucumber", "Optional herbs/spices"], steps: ["Cook eggs thoroughly.", "Toast bread.", "Add vegetables.", "Serve together."] },
  { id: "r4", name: "Yogurt Fruit Bowl", collection: "Everyday Breakfasts", time: "5 min", tags: ["Vegetarian", "Quick"], ingredients: ["Plain yogurt", "Banana", "Apple or berries", "Oats", "Optional nuts/seeds"], steps: ["Combine ingredients in a bowl."] },
  { id: "r5", name: "Chicken Rice Bowl", collection: "Quick Lunches", time: "20 min", tags: ["High Protein"], ingredients: ["Cooked rice", "Chicken", "Carrot", "Cucumber", "Tomato", "Optional herbs/spices"], steps: ["Cook chicken thoroughly.", "Prepare vegetables.", "Add rice to a bowl.", "Add chicken and vegetables.", "Season to taste."] },
  { id: "r6", name: "Chicken Wrap", collection: "Quick Lunches", time: "12 min", tags: ["High Protein", "Quick"], ingredients: ["Wrap", "Cooked chicken", "Lettuce", "Tomato", "Cucumber", "Yogurt-based sauce"], steps: ["Add ingredients to the wrap and roll."] },
  { id: "r7", name: "Tuna & Vegetable Sandwich", collection: "Quick Lunches", time: "10 min", tags: ["High Protein", "Quick"], ingredients: ["Bread", "Tuna", "Cucumber", "Tomato", "Lettuce", "Yogurt-based dressing"], steps: ["Combine ingredients and serve."] },
  { id: "r8", name: "Chicken & Vegetable Stir-Fry", collection: "Simple Dinners", time: "25 min", tags: ["High Protein"], ingredients: ["Chicken", "Bell pepper", "Carrot", "Broccoli", "Onion", "Rice", "Light seasoning"], steps: ["Cook chicken thoroughly.", "Add vegetables.", "Stir-fry until vegetables are appropriately cooked.", "Serve with rice."] },
  { id: "r9", name: "Vegetable & Egg Rice", collection: "Simple Dinners", time: "20 min", tags: ["Vegetarian"], ingredients: ["Cooked rice", "Eggs", "Carrot", "Peas", "Onion", "Optional soy sauce"], steps: ["Cook vegetables.", "Add eggs and cook thoroughly.", "Add rice.", "Mix and season."] },
  { id: "r10", name: "Baked Chicken & Potatoes", collection: "Simple Dinners", time: "45 min", tags: ["High Protein"], ingredients: ["Chicken", "Potatoes", "Carrots", "Onion", "Herbs/spices", "Small amount of cooking oil"], steps: ["Prepare ingredients.", "Season.", "Bake until chicken is fully cooked and vegetables are tender.", "Serve."] },
  { id: "r11", name: "Mango Smoothie", collection: "Smoothies", time: "5 min", tags: ["Vegetarian", "Quick"], ingredients: ["Mango", "Yogurt or milk", "Water as needed"], steps: ["Blend until smooth."] },
  { id: "r12", name: "Strawberry Banana Smoothie", collection: "Smoothies", time: "5 min", tags: ["Vegetarian", "Quick"], ingredients: ["Strawberries", "Banana", "Milk or yogurt"], steps: ["Blend until smooth."] },
  { id: "r13", name: "Pineapple & Yogurt Smoothie", collection: "Smoothies", time: "5 min", tags: ["Vegetarian", "Quick"], ingredients: ["Pineapple", "Yogurt", "Water"], steps: ["Blend until smooth."] },
  { id: "r14", name: "Apple Cinnamon Smoothie", collection: "Smoothies", time: "5 min", tags: ["Vegetarian", "Quick"], ingredients: ["Apple", "Banana", "Milk", "Cinnamon"], steps: ["Blend until smooth."] },
  { id: "r15", name: "Fruit & Yogurt", collection: "Quick Snacks", time: "3 min", tags: ["Vegetarian", "Quick"], ingredients: ["Fruit", "Plain yogurt", "Optional oats"], steps: ["Combine in a bowl."] },
  { id: "r16", name: "Peanut Butter Banana Toast", collection: "Quick Snacks", time: "5 min", tags: ["Vegetarian", "Quick"], ingredients: ["Whole-grain toast", "Banana", "A small amount of peanut butter"], steps: ["Toast the bread.", "Top with banana and peanut butter."] },
  { id: "r17", name: "Boiled Eggs & Vegetables", collection: "Quick Snacks", time: "10 min", tags: ["High Protein", "Quick"], ingredients: ["Eggs", "Cucumber", "Tomato", "Fruit"], steps: ["Boil the eggs.", "Serve alongside vegetables and fruit."] },
];
const RECIPE_COLLECTIONS = [...new Set(RECIPES.map((r) => r.collection))];

const MICRO_LESSONS = [
  { title: "Hunger vs. boredom", body: "Physical hunger builds gradually and you'd eat almost anything. Boredom or stress cravings hit suddenly and usually want one specific food. Next time you reach for a snack, pause for ten seconds and ask which one this is — no judgment either way, just information." },
  { title: "No food is 'bad'", body: "Labeling foods as good or bad tends to backfire — it's linked to more guilt and more overeating, not less. A more useful lens: some foods are more nutrient-dense, some are more calorie-dense. Both fit into a balanced week." },
  { title: "The 20-minute rule", body: "It takes roughly 20 minutes for your brain to register fullness signals from your stomach. Eating slightly slower — putting your fork down between bites — is one of the simplest, most evidence-backed ways to naturally eat less without restriction." },
  { title: "Streaks over intensity", body: "A hard workout you do once beats nothing, but a moderate workout you repeat weekly beats both. Motivation fades fast; consistency is what actually changes your body. If today feels low-energy, a shorter session still keeps the streak — and the habit — alive." },
  { title: "Sleep is a training variable", body: "Poor sleep raises the hormone that drives hunger (ghrelin) and lowers the one that signals fullness (leptin) — which is why bad sleep often shows up as cravings the next day. Treating sleep as part of your fitness plan, not separate from it, changes outcomes more than most people expect." },
  { title: "Environment beats willpower", body: "Relying on willpower to resist food in plain sight is a losing long-term strategy — willpower is a limited resource that depletes through the day. Changing what's visible and easy to reach (produce at eye level, treats out of sight) does more work than motivation ever will." },
];

const LEARN_COURSES = [
  {
    id: "lc1", name: "Nutrition Basics", icon: "Apple", desc: "The fundamentals, explained simply",
    lessons: [
      {
        id: "lc1-l1", title: "Calories, Explained Simply",
        explanation: "A calorie is just a unit of energy — the energy your body gets from food and the energy it spends existing, moving, and training. Your body weight tends to move in the direction of the gap between the two over time, but that gap is an estimate, not a precise dial you can control day to day.",
        keyPoints: ["Calories in vs. calories out drives weight trends over time, not any single meal or day.", "Your daily need shifts with activity, sleep, stress, and even the weather.", "Small, sustainable gaps beat large, unsustainable ones."],
        example: "Someone who slightly under-eats their needs most days, but not every day, will usually trend toward gradual fat loss over weeks — even with occasional higher-calorie days mixed in.",
        takeaway: "Think in weekly averages, not daily perfection.",
        quiz: { q: "What matters most for long-term weight trends?", options: ["One perfect day", "The average over weeks", "Never eating past 6pm"], correct: 1 },
      },
      {
        id: "lc1-l2", title: "Protein, Carbs & Fat — What They Actually Do",
        explanation: "The three macronutrients each play a distinct role. Protein supplies the building blocks for muscle repair and a wide range of body functions. Carbohydrates are your body's preferred, fastest-access fuel, especially for training. Fat supports hormone production and helps absorb certain vitamins.",
        keyPoints: ["Protein: repair and maintenance, especially muscle.", "Carbs: fast energy, particularly useful around training.", "Fat: hormones, vitamin absorption, and satiety.", "None of the three is inherently 'good' or 'bad' — context and amount matter."],
        example: "A plate with chicken (protein), rice (carbs), and a drizzle of oil or avocado (fat) covers all three roles in one simple meal.",
        takeaway: "Balanced doesn't mean equal — it means each macro is doing its job.",
        quiz: { q: "Which macronutrient is the body's fastest-access training fuel?", options: ["Fat", "Protein", "Carbohydrates"], correct: 2 },
      },
      {
        id: "lc1-l3", title: "Reading a Food Label",
        explanation: "Nutrition labels list values per serving — not always per package — so the first thing worth checking is the serving size itself, since it changes every other number on the label. From there, calories and the three macros give you the core picture.",
        keyPoints: ["Check serving size first — it's the multiplier for everything else.", "Calories and macros (protein/carbs/fat) give the core nutritional picture.", "Ingredient lists are ordered by quantity, largest first."],
        example: "A snack listing '150 kcal per serving, 2.5 servings per package' actually contains about 375 kcal if you eat the whole package.",
        takeaway: "Always check the serving size before comparing numbers.",
        quiz: null,
      },
      {
        id: "lc1-l4", title: "Building a Balanced Plate",
        explanation: "Without weighing or counting anything, a simple visual method works well for most meals: roughly a palm of protein, a fist of carbs, and a thumb of fat, plus vegetables to fill remaining space.",
        keyPoints: ["Palm-sized portion of protein.", "Fist-sized portion of carbohydrates.", "Thumb-sized portion of fat.", "Fill the rest of the plate with vegetables."],
        example: "Grilled chicken (palm), rice (fist), a little added oil (thumb), and a generous side of vegetables — no scale required.",
        takeaway: "A balanced plate is a habit you can build by eye, not a spreadsheet.",
        quiz: { q: "In the palm-method, what represents a carbohydrate portion?", options: ["A thumb", "A fist", "A palm"], correct: 1 },
      },
    ],
  },
  {
    id: "lc2", name: "Beginner Cooking", icon: "ChefHat", desc: "Core techniques that cover most meals",
    lessons: [
      {
        id: "lc2-l1", title: "Five Techniques That Cover Most Meals",
        explanation: "You don't need dozens of techniques to cook well — five cover the majority of everyday meals: boiling/steaming, pan-searing, roasting, stir-frying, and simmering (for curries, stews, and sauces).",
        keyPoints: ["Boil/steam: rice, vegetables, eggs.", "Pan-sear: chicken, fish, tofu.", "Roast: vegetables, whole cuts of meat.", "Stir-fry: quick vegetable and protein combinations.", "Simmer: curries, dhal, sauces."],
        example: "Rice (boiled) + chicken curry (simmered) + a stir-fried vegetable side covers three of the five techniques in one meal.",
        takeaway: "Master five techniques, and most recipes become variations on what you already know.",
        quiz: { q: "Which technique is best for curries and dhal?", options: ["Roasting", "Simmering", "Stir-frying"], correct: 1 },
      },
      {
        id: "lc2-l2", title: "Stocking a Simple Pantry",
        explanation: "A well-stocked but simple pantry removes most of the friction from cooking. A short list of staples — a couple of oils, key spices, rice or grains, and some canned or dried proteins — covers a surprising number of meals.",
        keyPoints: ["A neutral oil for cooking, one flavorful oil for finishing.", "A small core spice set beats a huge, unused collection.", "Rice, grains, or noodles as a base.", "A shelf-stable protein (canned fish, dried lentils, eggs) for low-effort days."],
        example: "Rice, dhal, onions, garlic, and a basic spice set can produce a complete, satisfying meal with almost nothing else.",
        takeaway: "A smaller, well-used pantry beats a large, cluttered one.",
        quiz: null,
      },
      {
        id: "lc2-l3", title: "Cooking Protein Without Guessing",
        explanation: "Undercooked or overcooked protein is one of the most common beginner frustrations. A few simple visual and timing cues remove most of the guesswork without needing a thermometer.",
        keyPoints: ["Chicken: juices run clear, no pink at the thickest point.", "Fish: flakes easily with a fork.", "Eggs: whites fully set, yolk as firm as you prefer.", "Resting meat for a few minutes after cooking improves texture."],
        example: "Pressing a cooked chicken breast — if it feels firm all the way through rather than squishy in the center, it's likely done.",
        takeaway: "A few visual cues remove most of the guesswork from cooking protein.",
        quiz: { q: "How can you tell fish is cooked through?", options: ["It turns bright red", "It flakes easily with a fork", "It shrinks by half"], correct: 1 },
      },
      {
        id: "lc2-l4", title: "Meal Prep Basics",
        explanation: "Meal prep doesn't require cooking every meal for the week in one sitting. A lighter approach — prepping a few base components in advance — is usually far more sustainable and still saves real time.",
        keyPoints: ["Cook a base grain and a base protein in bulk.", "Prep vegetables (washed, chopped) rather than full meals.", "Mix and match components through the week instead of eating identical meals.", "Refrigerate for a few days; freeze for longer storage."],
        example: "Cooking a big batch of rice and grilled chicken on Sunday lets you build several different meals through the week by pairing them with different vegetables and sauces.",
        takeaway: "Prep components, not just finished meals — it's more flexible and less boring.",
        quiz: null,
      },
    ],
  },
  {
    id: "lc3", name: "Pre & Post Workout Nutrition", icon: "Zap", desc: "Fueling and recovering around training",
    lessons: [
      {
        id: "lc3-l1", title: "What to Eat Before Training",
        explanation: "Pre-workout eating is about giving your body accessible energy without feeling weighed down. Timing matters more than any single 'perfect' food — a lighter, carb-leaning meal or snack an hour or two before training tends to work well for most people.",
        keyPoints: ["Favor familiar, easily digestible carbs before training.", "Very high-fat or high-fiber meals right before training can feel heavy.", "Timing is individual — experiment with what sits well for you.", "Training fasted is fine for some people and some session types, not a requirement for anyone."],
        example: "A banana and a small handful of nuts, or toast with a bit of honey, roughly an hour before a session.",
        takeaway: "There's no single perfect pre-workout food — consistency and how it feels for you matter more.",
        quiz: { q: "What tends to feel heavy right before training?", options: ["Simple carbs", "Very high-fat or high-fiber meals", "Water"], correct: 1 },
      },
      {
        id: "lc3-l2", title: "What to Eat After Training",
        explanation: "After training, the priority shifts to recovery: replacing used energy and providing protein to support muscle repair. The exact timing window is more flexible than it's often made out to be — what you eat across the day matters more than a narrow post-workout minute count.",
        keyPoints: ["Protein supports muscle repair after training.", "Carbs help replenish energy used during the session.", "The 'anabolic window' is far more flexible than commonly claimed — hours, not minutes.", "Your next full meal usually covers post-workout needs just fine."],
        example: "A chicken and rice bowl an hour or two after training covers both the protein and carbohydrate side of recovery.",
        takeaway: "Your next real meal is usually your 'post-workout meal' — no need to rush.",
        quiz: null,
      },
      {
        id: "lc3-l3", title: "Hydration & Training",
        explanation: "Even mild dehydration can affect how a workout feels — energy, focus, and perceived effort all tend to suffer before thirst even kicks in strongly. Steady hydration through the day matters more than trying to chug water right before training.",
        keyPoints: ["Aim for steady fluid intake throughout the day, not just around workouts.", "Thirst is a lagging signal — you're often already mildly dehydrated by the time it hits.", "Hot climates or heavy sweating increase fluid needs.", "Plain water covers most people's needs for typical training sessions."],
        example: "Sipping water steadily through the day, rather than one large glass right before training, keeps hydration more consistent.",
        takeaway: "Hydrate throughout the day — don't wait for thirst or save it all for pre-workout.",
        quiz: { q: "When should you mainly focus on hydration?", options: ["Only right before training", "Steadily throughout the day", "Only after you feel thirsty"], correct: 1 },
      },
    ],
  },
  {
    id: "lc4", name: "Sri Lankan Healthy Cooking", icon: "Soup", desc: "Balance and lightness in traditional favorites",
    lessons: [
      {
        id: "lc4-l1", title: "Building a Balanced Rice & Curry Plate",
        explanation: "A traditional rice and curry plate is naturally well-suited to balance — it typically brings together a carbohydrate base, a protein curry, a lentil dish, and vegetable-based sides in one meal.",
        keyPoints: ["Rice provides the carbohydrate base.", "A meat, fish, or egg curry supplies protein.", "Dhal (parippu) adds plant protein and fiber.", "Mallung or vegetable curries round out the plate with micronutrients."],
        example: "Rice, chicken curry, dhal, and a mallung together already reflect the palm/fist/thumb balance from Nutrition Basics — without needing any adjustment.",
        takeaway: "A traditional rice and curry plate is often naturally balanced already.",
        quiz: { q: "What does dhal (parippu) mainly contribute to the plate?", options: ["Fat", "Plant protein and fiber", "Simple sugar"], correct: 1 },
      },
      {
        id: "lc4-l2", title: "Lightening Up Traditional Favorites",
        explanation: "Small, simple adjustments can shift the overall nutrient density of familiar dishes without changing what they fundamentally are — this isn't about labeling any traditional food as 'bad', just about small, optional tweaks.",
        keyPoints: ["Reducing added oil slightly rarely changes a curry's flavor noticeably.", "Grilling or baking instead of deep-frying for devilled dishes.", "Adding an extra vegetable side rather than replacing existing ones.", "Portion, not elimination, is usually the simplest lever."],
        example: "A devilled chicken made with a light pan-sear instead of deep-frying keeps the same spice profile with a different cooking method.",
        takeaway: "Small tweaks, not elimination, are usually the most sustainable approach.",
        quiz: null,
      },
      {
        id: "lc4-l3", title: "The Power of Sambols & Mallung",
        explanation: "Sambols and mallung are often underrated nutritionally — they pack vegetables, herbs, and (in the case of pol sambol) healthy fats into a small, flavorful portion that naturally increases the vegetable content of a meal.",
        keyPoints: ["Pol sambol adds coconut (fat) plus chili and lime.", "Gotukola sambol and mallung are concentrated vegetable/herb sources.", "These sides are an easy way to add volume and micronutrients without a separate 'salad'.", "They pair naturally with rice and curry — no extra effort required."],
        example: "Adding a spoon of gotukola sambol to a plate increases vegetable intake without needing to prepare a separate dish.",
        takeaway: "Sambols and mallung are some of the easiest wins for adding vegetables to a meal.",
        quiz: { q: "What do pol sambol's main ingredients include?", options: ["Rice and sugar", "Coconut, chili, and lime", "Only chili powder"], correct: 1 },
      },
      {
        id: "lc4-l4", title: "Smart Choices When Eating Out",
        explanation: "Eating out doesn't have to mean abandoning balance. Most Sri Lankan menus offer enough variety to build a reasonably balanced plate with a few simple choices.",
        keyPoints: ["Choosing a curry-based dish over a deep-fried one where both are available.", "Adding a vegetable or dhal side rather than skipping it.", "Being mindful of portion on rice, without needing to avoid it.", "Kottu and fried rice are fine occasionally — they just tend to be more calorie-dense."],
        example: "Choosing chicken curry with rice and a vegetable side over a large plate of kottu doesn't mean giving up kottu forever — just recognizing the difference for a given day.",
        takeaway: "Balance is about the pattern of choices over time, not any single meal out.",
        quiz: null,
      },
    ],
  },
];

const GROCERY_CATEGORIES = ["Fruits", "Vegetables", "Protein", "Dairy", "Grains", "Pantry", "Drinks", "Other"];
const CATEGORY_KEYWORDS = {
  Fruits: ["apple", "banana", "berry", "berries", "lemon", "lime", "orange", "avocado", "mango", "grape", "melon", "peach", "pear", "pineapple", "strawberr", "fruit"],
  Vegetables: ["spinach", "tomato", "pepper", "broccoli", "carrot", "onion", "garlic", "lettuce", "cucumber", "greens", "potato", "zucchini", "kale", "peas", "vegetable"],
  Protein: ["chicken", "beef", "salmon", "fish", "egg", "tofu", "shrimp", "turkey", "pork", "beans", "chickpea", "lentil", "tuna"],
  Dairy: ["milk", "cheese", "yogurt", "yoghurt", "butter", "cream"],
  Grains: ["rice", "oats", "bread", "pasta", "quinoa", "wrap", "tortilla", "cereal", "toast"],
  Drinks: ["juice", "water", "tea", "coffee"],
  Pantry: ["oil", "honey", "salt", "spice", "sauce", "chia", "nut", "flour", "sugar", "cinnamon", "peanut butter", "seasoning", "dressing"],
};
function categorizeIngredient(name) {
  const n = name.toLowerCase();
  for (const cat of GROCERY_CATEGORIES) {
    const kws = CATEGORY_KEYWORDS[cat];
    if (kws && kws.some((k) => n.includes(k))) return cat;
  }
  return "Other";
}
function cleanIngredientsForGrocery(list) {
  return list
    .filter((i) => !/^water( as needed)?$/i.test(i.trim()))
    .map((i) => i.replace(/^optional\s+/i, "").replace(/\s+as needed$/i, "").trim());
}

const PRODUCTS = [
  { id: "p2", type: "course", category: "Premium Courses", name: "Leg Day: Lower Body Strength", price: 9, courseId: "c2", desc: "Two focused lower-body sessions a week for 4 weeks — squat and hinge patterns, step-ups, split squats, and core work that supports both." },
  { id: "p3", type: "course", category: "Premium Courses", name: "Strength Builder", price: 15, courseId: "c3", desc: "A 6-week, 4-day weekly split covering upper, lower, recovery and full-body work — for people ready to train with real structure." },
  { id: "p4", type: "course", category: "Premium Courses", name: "14-Day Mobility Reset", price: 7, courseId: "c4", desc: "10–15 minutes a day for two weeks to improve movement quality and flexibility from the ground up." },
  { id: "p5", type: "course", category: "Premium Courses", name: "Posture & Movement", price: 7, courseId: "c5", desc: "A daily 10–15 minute routine for people who sit a lot — chin tucks, wall slides, hip-flexor mobility and more." },
  { id: "p6", type: "course", category: "Premium Courses", name: "20-Minute Fitness", price: 9, courseId: "c6", desc: "Built for limited time — a complete warm-up, session and cooldown in 20 minutes, 3 days a week." },
  { id: "p7", type: "digital", category: "Digital Products", name: "Complete Recipe Collection", price: 9, recipeIds: RECIPES.map((r) => r.id), desc: "All 17 recipes across breakfasts, quick lunches, simple dinners, smoothies and snacks — with grocery list and meal-planner integration built in." },
  { id: "p8", type: "bundle", category: "Bundles", name: "Complete Fitness Bundle", price: 39, bundleCourseIds: ["c2", "c3", "c4", "c5", "c6"], bundleProductIds: ["p7"], desc: "Every premium course (Leg Day, Strength Builder, Mobility Reset, Posture & Movement, 20-Minute Fitness) plus the full recipe collection, bundled at a discount versus buying separately." },
  { id: "p9", type: "physical", category: "Accessories", name: "Resistance Band Set (5-Pack)", price: 24, stock: 18, desc: "Five resistance levels for home workouts, mobility work, and warm-ups. Includes a door anchor and carry bag." },
  { id: "p10", type: "physical", category: "Accessories", name: "Foam Roller", price: 22, stock: 11, desc: "High-density foam roller for post-workout recovery and myofascial release." },
  { id: "p11", type: "physical", category: "Accessories", name: "Adjustable Dumbbell Pair (2–10kg)", price: 89, stock: 6, desc: "Space-saving adjustable dumbbells covering most home-workout rep ranges." },
];

const EX_MAP = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));

/* ------------------------------------------------------------------ */
/*  EXERCISE ILLUSTRATIONS — hand-drawn stick-figure poses (no photo    */
/*  assets available in this environment). Each pose is a simple joint  */
/*  map in a 0-100 viewBox: head/shoulder/hip/hands/knees/feet.         */
/* ------------------------------------------------------------------ */
const POSES = {
  STANDING: { head: [50, 18], shoulder: [50, 28], hip: [50, 52], handL: [38, 45], handR: [62, 45], kneeL: [46, 72], kneeR: [54, 72], footL: [44, 92], footR: [56, 92] },
  ARMS_UP: { head: [50, 18], shoulder: [50, 28], hip: [50, 52], handL: [35, 15], handR: [65, 15], kneeL: [46, 72], kneeR: [54, 72], footL: [44, 92], footR: [56, 92] },
  SQUAT_LOW: { head: [50, 38], shoulder: [50, 46], hip: [50, 64], handL: [34, 52], handR: [66, 52], kneeL: [36, 70], kneeR: [64, 70], footL: [40, 92], footR: [60, 92] },
  PUSHUP_TOP: { head: [14, 38], shoulder: [24, 40], hip: [58, 42], handL: [24, 60], handR: [24, 64], kneeL: [80, 44], kneeR: [80, 46], footL: [95, 46], footR: [95, 48] },
  PUSHUP_BOTTOM: { head: [14, 50], shoulder: [24, 52], hip: [58, 50], handL: [26, 60], handR: [26, 64], kneeL: [80, 52], kneeR: [80, 54], footL: [95, 54], footR: [95, 56] },
  MOUNTAINCLIMBER_END: { head: [14, 38], shoulder: [24, 40], hip: [55, 42], handL: [24, 60], handR: [24, 64], kneeL: [80, 44], kneeR: [45, 44], footL: [95, 46], footR: [50, 50] },
  GLUTE_BRIDGE_DOWN: { head: [15, 58], shoulder: [28, 58], hip: [55, 60], handL: [30, 68], handR: [30, 72], kneeL: [70, 50], kneeR: [70, 54], footL: [80, 60], footR: [80, 64] },
  GLUTE_BRIDGE_UP: { head: [15, 58], shoulder: [28, 58], hip: [55, 44], handL: [30, 68], handR: [30, 72], kneeL: [70, 48], kneeR: [70, 52], footL: [80, 60], footR: [80, 64] },
  DEADBUG_START: { head: [20, 55], shoulder: [32, 55], hip: [55, 55], handL: [32, 35], handR: [32, 35], kneeL: [62, 35], kneeR: [62, 38], footL: [62, 55], footR: [62, 58] },
  DEADBUG_END: { head: [20, 55], shoulder: [32, 55], hip: [55, 55], handL: [32, 35], handR: [10, 50], kneeL: [75, 53], kneeR: [62, 36], footL: [92, 55], footR: [62, 58] },
  QUADRUPED_ROUND: { head: [22, 50], shoulder: [35, 45], hip: [65, 50], handL: [35, 68], handR: [35, 68], kneeL: [65, 68], kneeR: [65, 68], footL: [75, 70], footR: [75, 70] },
  QUADRUPED_ARCH: { head: [22, 42], shoulder: [35, 45], hip: [65, 52], handL: [35, 68], handR: [35, 68], kneeL: [65, 68], kneeR: [65, 68], footL: [75, 70], footR: [75, 70] },
  WGS_DOWN: { head: [38, 45], shoulder: [40, 50], hip: [55, 58], handL: [33, 80], handR: [33, 80], kneeL: [35, 72], kneeR: [70, 75], footL: [33, 92], footR: [85, 92] },
  WGS_ROTATE: { head: [38, 42], shoulder: [42, 48], hip: [55, 58], handL: [33, 80], handR: [60, 25], kneeL: [35, 72], kneeR: [70, 75], footL: [33, 92], footR: [85, 92] },
  HIPMOB_START: { head: [50, 20], shoulder: [50, 30], hip: [50, 55], handL: [40, 42], handR: [62, 42], kneeL: [38, 58], kneeR: [54, 74], footL: [42, 66], footR: [56, 92] },
  HIPMOB_END: { head: [50, 20], shoulder: [50, 30], hip: [50, 55], handL: [40, 42], handR: [62, 42], kneeL: [28, 62], kneeR: [54, 74], footL: [35, 70], footR: [56, 92] },
  HAMSTRING_START: { head: [45, 25], shoulder: [47, 32], hip: [52, 55], handL: [42, 50], handR: [58, 50], kneeL: [46, 72], kneeR: [54, 72], footL: [44, 92], footR: [56, 92] },
  HAMSTRING_END: { head: [40, 55], shoulder: [42, 58], hip: [52, 58], handL: [42, 80], handR: [45, 82], kneeL: [46, 72], kneeR: [54, 72], footL: [44, 92], footR: [56, 92] },
  WALK_A: { head: [50, 20], shoulder: [50, 30], hip: [50, 54], handL: [58, 45], handR: [40, 48], kneeL: [38, 70], kneeR: [58, 74], footL: [32, 90], footR: [68, 92] },
  WALK_B: { head: [50, 20], shoulder: [50, 30], hip: [50, 54], handL: [60, 48], handR: [42, 45], kneeL: [42, 74], kneeR: [62, 70], footL: [32, 92], footR: [68, 90] },
  LUNGE_END: { head: [50, 25], shoulder: [50, 33], hip: [52, 55], handL: [42, 45], handR: [62, 45], kneeL: [42, 72], kneeR: [68, 76], footL: [40, 90], footR: [80, 94] },
  RDL_END: { head: [32, 42], shoulder: [36, 48], hip: [58, 50], handL: [32, 68], handR: [34, 72], kneeL: [50, 72], kneeR: [58, 72], footL: [48, 92], footR: [58, 92] },
  MARCHING_END: { head: [50, 20], shoulder: [50, 30], hip: [50, 54], handL: [62, 35], handR: [38, 50], kneeL: [42, 50], kneeR: [54, 74], footL: [46, 62], footR: [56, 92] },
  CALF_RAISE_UP: { head: [50, 14], shoulder: [50, 24], hip: [50, 48], handL: [38, 41], handR: [62, 41], kneeL: [46, 68], kneeR: [54, 68], footL: [44, 90], footR: [56, 90] },
  SIDEPLANK_HOLD: { head: [20, 45], shoulder: [30, 48], hip: [55, 52], handL: [30, 68], handR: [70, 30], kneeL: [75, 55], kneeR: [75, 55], footL: [92, 58], footR: [92, 58] },
  ARMS_AT_SHOULDER: { head: [50, 18], shoulder: [50, 28], hip: [50, 52], handL: [38, 26], handR: [62, 26], kneeL: [46, 72], kneeR: [54, 72], footL: [44, 92], footR: [56, 92] },
  PULLDOWN_END: { head: [50, 20], shoulder: [50, 30], hip: [50, 55], handL: [38, 42], handR: [62, 42], kneeL: [46, 72], kneeR: [54, 72], footL: [44, 92], footR: [56, 92] },
  CURL_UP: { head: [50, 18], shoulder: [50, 28], hip: [50, 52], handL: [42, 30], handR: [58, 30], kneeL: [46, 72], kneeR: [54, 72], footL: [44, 92], footR: [56, 92] },
  TRICEP_BEND: { head: [50, 18], shoulder: [50, 28], hip: [50, 52], handL: [45, 22], handR: [55, 22], kneeL: [46, 72], kneeR: [54, 72], footL: [44, 92], footR: [56, 92] },
  BREATHING_HOLD: { head: [15, 58], shoulder: [28, 58], hip: [55, 60], handL: [35, 55], handR: [45, 58], kneeL: [70, 50], kneeR: [70, 54], footL: [80, 60], footR: [80, 64] },
  HEAD_TILT: { head: [42, 18], shoulder: [50, 28], hip: [50, 52], handL: [38, 45], handR: [62, 45], kneeL: [46, 72], kneeR: [54, 72], footL: [44, 92], footR: [56, 92] },
  QUAD_NEUTRAL: { head: [22, 46], shoulder: [35, 45], hip: [65, 50], handL: [35, 68], handR: [35, 68], kneeL: [65, 68], kneeR: [65, 68], footL: [75, 70], footR: [75, 70] },
  QUAD_ROTATE: { head: [22, 46], shoulder: [38, 42], hip: [65, 50], handL: [35, 68], handR: [45, 20], kneeL: [65, 68], kneeR: [65, 68], footL: [75, 70], footR: [75, 70] },
  HALF_KNEEL: { head: [35, 30], shoulder: [38, 38], hip: [45, 55], handL: [40, 50], handR: [40, 50], kneeL: [35, 72], kneeR: [60, 80], footL: [33, 92], footR: [75, 85] },
  HALF_KNEEL_FORWARD: { head: [33, 30], shoulder: [36, 38], hip: [38, 56], handL: [38, 50], handR: [38, 50], kneeL: [28, 70], kneeR: [60, 80], footL: [33, 92], footR: [75, 85] },
  CHIN_TUCK: { head: [47, 18], shoulder: [50, 28], hip: [50, 52], handL: [38, 45], handR: [62, 45], kneeL: [46, 72], kneeR: [54, 72], footL: [44, 92], footR: [56, 92] },
  GOALPOST_LOW: { head: [50, 18], shoulder: [50, 28], hip: [50, 52], handL: [35, 20], handR: [65, 20], kneeL: [46, 72], kneeR: [54, 72], footL: [44, 92], footR: [56, 92] },
  SEATED_ARCH: { head: [54, 15], shoulder: [52, 26], hip: [50, 52], handL: [38, 42], handR: [62, 42], kneeL: [46, 72], kneeR: [54, 72], footL: [44, 92], footR: [56, 92] },
  BIRDDOG_EXTEND: { head: [15, 42], shoulder: [30, 44], hip: [65, 50], handL: [10, 45], handR: [35, 68], kneeL: [85, 52], kneeR: [65, 68], footL: [98, 50], footR: [75, 70] },
  HALF_KNEEL_HIP_PUSH: { head: [38, 25], shoulder: [40, 34], hip: [48, 55], handL: [42, 48], handR: [42, 48], kneeL: [35, 72], kneeR: [62, 80], footL: [33, 92], footR: [76, 85] },
};

const EXERCISE_POSES = {
  ex_squat: { start: "STANDING", end: "SQUAT_LOW" },
  ex_pushup: { start: "PUSHUP_TOP", end: "PUSHUP_BOTTOM" },
  ex_glutebridge: { start: "GLUTE_BRIDGE_DOWN", end: "GLUTE_BRIDGE_UP" },
  ex_row: { start: "HAMSTRING_START", end: "RDL_END" },
  ex_deadbug: { start: "DEADBUG_START", end: "DEADBUG_END" },
  ex_catcow: { start: "QUADRUPED_ROUND", end: "QUADRUPED_ARCH" },
  ex_wgs: { start: "WGS_DOWN", end: "WGS_ROTATE" },
  ex_hipmob: { start: "HIPMOB_START", end: "HIPMOB_END" },
  ex_shouldermob: { start: "STANDING", end: "ARMS_UP" },
  ex_hamstringmob: { start: "HAMSTRING_START", end: "HAMSTRING_END" },
  ex_walk: { start: "WALK_A", end: "WALK_B" },
  ex_revlunge: { start: "STANDING", end: "LUNGE_END" },
  ex_rdl: { start: "STANDING", end: "RDL_END" },
  ex_plank: { start: "PUSHUP_TOP", end: null, isHold: true },
  ex_marching: { start: "STANDING", end: "MARCHING_END" },
  ex_backlunge: { start: "STANDING", end: "LUNGE_END" },
  ex_mountainclimber: { start: "PUSHUP_TOP", end: "MOUNTAINCLIMBER_END" },
  ex_calfraise: { start: "STANDING", end: "CALF_RAISE_UP" },
  ex_stepup: { start: "STANDING", end: "MARCHING_END" },
  ex_splitsquat: { start: "STANDING", end: "LUNGE_END" },
  ex_sideplank: { start: "SIDEPLANK_HOLD", end: null, isHold: true },
  ex_shoulderpress: { start: "ARMS_AT_SHOULDER", end: "ARMS_UP" },
  ex_latpulldown: { start: "ARMS_UP", end: "PULLDOWN_END" },
  ex_bicepcurl: { start: "STANDING", end: "CURL_UP" },
  ex_tricepext: { start: "ARMS_UP", end: "TRICEP_BEND" },
  ex_breathing: { start: "BREATHING_HOLD", end: null, isHold: true },
  ex_neckmob: { start: "STANDING", end: "HEAD_TILT" },
  ex_thoracicrot: { start: "QUAD_NEUTRAL", end: "QUAD_ROTATE" },
  ex_anklemob: { start: "HALF_KNEEL", end: "HALF_KNEEL_FORWARD" },
  ex_chintuck: { start: "STANDING", end: "CHIN_TUCK" },
  ex_wallslides: { start: "GOALPOST_LOW", end: "ARMS_UP" },
  ex_thoracicext: { start: "STANDING", end: "SEATED_ARCH" },
  ex_birddog: { start: "QUAD_NEUTRAL", end: "BIRDDOG_EXTEND" },
  ex_hipflexmob: { start: "HALF_KNEEL", end: "HALF_KNEEL_HIP_PUSH" },
};

function StickFigure({ pose, size = 84, color }) {
  const c = color || C.violet;
  if (!pose) return null;
  const { head, shoulder, hip, handL, handR, kneeL, kneeR, footL, footR } = pose;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <polyline points={`${hip[0]},${hip[1]} ${kneeR[0]},${kneeR[1]} ${footR[0]},${footR[1]}`} fill="none" stroke={c} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
      <polyline points={`${hip[0]},${hip[1]} ${kneeL[0]},${kneeL[1]} ${footL[0]},${footL[1]}`} fill="none" stroke={c} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1={shoulder[0]} y1={shoulder[1]} x2={hip[0]} y2={hip[1]} stroke={c} strokeWidth="3.2" strokeLinecap="round" />
      <line x1={shoulder[0]} y1={shoulder[1]} x2={handR[0]} y2={handR[1]} stroke={c} strokeWidth="3" strokeLinecap="round" opacity="0.5" />
      <line x1={shoulder[0]} y1={shoulder[1]} x2={handL[0]} y2={handL[1]} stroke={c} strokeWidth="3" strokeLinecap="round" />
      <circle cx={head[0]} cy={head[1]} r="7" fill="none" stroke={c} strokeWidth="3.2" />
    </svg>
  );
}

function ExercisePoseCard({ exerciseId, images }) {
  const config = EXERCISE_POSES[exerciseId];
  if (!config && !images?.start) return null;
  const startPose = config ? POSES[config.start] : null;
  const endPose = config?.end ? POSES[config.end] : null;
  const endLabel = config?.isHold ? "Hold" : "Start";
  return (
    <div className="rounded-2xl p-4 flex items-center justify-center gap-3" style={{ background: C.fill }}>
      <div className="flex flex-col items-center gap-1">
        {images?.start ? (
          <img src={images.start} alt="Start position" className="rounded-xl object-cover" style={{ width: 84, height: 84 }} />
        ) : (
          <StickFigure pose={startPose} />
        )}
        <p className="text-[10px] font-semibold uppercase" style={{ color: C.textFaint }}>{endLabel}</p>
      </div>
      {(endPose || images?.end) && (
        <>
          <ChevronRight size={16} style={{ color: C.textFaint }} />
          <div className="flex flex-col items-center gap-1">
            {images?.end ? (
              <img src={images.end} alt="End position" className="rounded-xl object-cover" style={{ width: 84, height: 84 }} />
            ) : (
              <StickFigure pose={endPose} />
            )}
            <p className="text-[10px] font-semibold uppercase" style={{ color: C.textFaint }}>End</p>
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  MUSCLE MAP — front/back body diagram highlighting worked muscles,   */
/*  same visual language as Fitbod/Strong-style apps. Hand-coded SVG    */
/*  zones (simplified, not photoreal anatomy), highlighted from each    */
/*  exercise's existing `muscle` text field.                            */
/* ------------------------------------------------------------------ */
const FRONT_SHAPES = [
  { key: "head", type: "circle", cx: 50, cy: 10, r: 7 },
  { key: "neck", type: "rect", x: 46, y: 16, w: 8, h: 6, rx: 2 },
  { key: "shoulders", type: "ellipse", cx: 30, cy: 26, rx: 7, ry: 6 },
  { key: "shoulders", type: "ellipse", cx: 70, cy: 26, rx: 7, ry: 6 },
  { key: "chest", type: "rect", x: 37, y: 22, w: 26, h: 16, rx: 5 },
  { key: "biceps", type: "rect", x: 18, y: 24, w: 10, h: 24, rx: 5 },
  { key: "biceps", type: "rect", x: 72, y: 24, w: 10, h: 24, rx: 5 },
  { key: "forearms", type: "rect", x: 16, y: 50, w: 9, h: 20, rx: 4 },
  { key: "forearms", type: "rect", x: 75, y: 50, w: 9, h: 20, rx: 4 },
  { key: "abs", type: "rect", x: 41, y: 40, w: 18, h: 20, rx: 4 },
  { key: "obliques", type: "rect", x: 34, y: 42, w: 6, h: 18, rx: 3 },
  { key: "obliques", type: "rect", x: 60, y: 42, w: 6, h: 18, rx: 3 },
  { key: "hipflexors", type: "rect", x: 39, y: 62, w: 22, h: 8, rx: 4 },
  { key: "quads", type: "rect", x: 35, y: 72, w: 13, h: 32, rx: 6 },
  { key: "quads", type: "rect", x: 52, y: 72, w: 13, h: 32, rx: 6 },
  { key: "calves", type: "rect", x: 37, y: 108, w: 10, h: 26, rx: 4 },
  { key: "calves", type: "rect", x: 53, y: 108, w: 10, h: 26, rx: 4 },
  { key: null, type: "ellipse", cx: 42, cy: 138, rx: 7, ry: 4 },
  { key: null, type: "ellipse", cx: 58, cy: 138, rx: 7, ry: 4 },
];

const BACK_SHAPES = [
  { key: "head", type: "circle", cx: 50, cy: 10, r: 7 },
  { key: "neck", type: "rect", x: 46, y: 16, w: 8, h: 6, rx: 2 },
  { key: "shoulders", type: "ellipse", cx: 30, cy: 26, rx: 7, ry: 6 },
  { key: "shoulders", type: "ellipse", cx: 70, cy: 26, rx: 7, ry: 6 },
  { key: "traps", type: "rect", x: 38, y: 18, w: 24, h: 12, rx: 5 },
  { key: "back", type: "rect", x: 35, y: 31, w: 30, h: 22, rx: 7 },
  { key: "back", type: "rect", x: 42, y: 54, w: 16, h: 10, rx: 4 },
  { key: "triceps", type: "rect", x: 18, y: 24, w: 10, h: 24, rx: 5 },
  { key: "triceps", type: "rect", x: 72, y: 24, w: 10, h: 24, rx: 5 },
  { key: "forearms", type: "rect", x: 16, y: 50, w: 9, h: 20, rx: 4 },
  { key: "forearms", type: "rect", x: 75, y: 50, w: 9, h: 20, rx: 4 },
  { key: "glutes", type: "rect", x: 36, y: 62, w: 28, h: 14, rx: 8 },
  { key: "hamstrings", type: "rect", x: 35, y: 78, w: 13, h: 30, rx: 6 },
  { key: "hamstrings", type: "rect", x: 52, y: 78, w: 13, h: 30, rx: 6 },
  { key: "calves", type: "rect", x: 37, y: 108, w: 10, h: 26, rx: 4 },
  { key: "calves", type: "rect", x: 53, y: 108, w: 10, h: 26, rx: 4 },
  { key: null, type: "ellipse", cx: 42, cy: 138, rx: 7, ry: 4 },
  { key: null, type: "ellipse", cx: 58, cy: 138, rx: 7, ry: 4 },
];

function muscleTextToKeys(text) {
  const t = (text || "").toLowerCase();
  const keys = new Set();
  if (t.includes("chest")) keys.add("chest");
  if (t.includes("shoulder")) keys.add("shoulders");
  if (t.includes("bicep")) keys.add("biceps");
  if (t.includes("tricep")) keys.add("triceps");
  if (t.includes("forearm")) keys.add("forearms");
  if (t.includes("core")) { keys.add("abs"); keys.add("obliques"); }
  if (t.includes("oblique")) keys.add("obliques");
  if (t.includes("glute")) keys.add("glutes");
  if (t.includes("hamstring")) keys.add("hamstrings");
  if (t.includes("quad")) keys.add("quads");
  if (t.includes("calv") || t.includes("ankle")) keys.add("calves");
  if (t.includes("hip")) keys.add("hipflexors");
  if (t.includes("neck")) keys.add("neck");
  if (t.includes("trap")) keys.add("traps");
  if (t.includes("spine") || t.includes("back")) keys.add("back");
  if (t.includes("leg") && !keys.has("quads") && !keys.has("hamstrings")) { keys.add("quads"); keys.add("hamstrings"); }
  return keys;
}

function BodyDiagram({ shapes, highlighted, size = 74 }) {
  return (
    <svg width={size} height={size * 1.7} viewBox="0 0 100 170">
      {shapes.map((s, i) => {
        const active = s.key && highlighted.has(s.key);
        const props = { fill: active ? C.violet : "none", stroke: active ? C.violet : C.textFaint, strokeWidth: 1.5, opacity: active ? 0.9 : 0.35 };
        if (s.type === "circle") return <circle key={i} cx={s.cx} cy={s.cy} r={s.r} {...props} />;
        if (s.type === "ellipse") return <ellipse key={i} cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} {...props} />;
        return <rect key={i} x={s.x} y={s.y} width={s.w} height={s.h} rx={s.rx} {...props} />;
      })}
    </svg>
  );
}

function MuscleMapCard({ muscleText, imageUrl }) {
  const highlighted = muscleTextToKeys(muscleText);
  if (highlighted.size === 0 && !imageUrl) return null;
  return (
    <div className="rounded-2xl p-4" style={{ background: C.fill }}>
      <p className="text-[10px] font-semibold uppercase mb-3 text-center tracking-wide" style={{ color: C.textFaint }}>Muscles Worked</p>
      {imageUrl ? (
        <img src={imageUrl} alt="Muscles worked" className="rounded-xl object-cover w-full" style={{ maxHeight: 220 }} />
      ) : (
        <div className="flex items-center justify-center gap-8">
          <div className="flex flex-col items-center gap-1.5">
            <BodyDiagram shapes={FRONT_SHAPES} highlighted={highlighted} />
            <p className="text-[9px] font-medium uppercase" style={{ color: C.textFaint }}>Front</p>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <BodyDiagram shapes={BACK_SHAPES} highlighted={highlighted} />
            <p className="text-[9px] font-medium uppercase" style={{ color: C.textFaint }}>Back</p>
          </div>
        </div>
      )}
    </div>
  );
}


const EQUIPMENT_OPTS = [
  { id: "dumbbells", label: "Dumbbells" },
  { id: "bands", label: "Resistance bands" },
  { id: "pullup_bar", label: "Pull-up bar" },
  { id: "bench", label: "Bench" },
  { id: "barbell", label: "Barbell" },
  { id: "gym", label: "Full gym" },
];

/* Returns the exercise the user should actually see for a given equipment
   profile — swaps to a safe bodyweight-friendly altId when the original
   needs equipment they don't have, per Home vs Gym training mode. */
function resolveExercise(exId, equipmentProfile) {
  const ex = EX_MAP[exId];
  const needs = ex.requiresEquipment || [];
  if (needs.length === 0) return { exercise: ex, substituted: false };
  const covered = needs.some((tag) => equipmentProfile.includes(tag) || equipmentProfile.includes("gym"));
  if (covered) return { exercise: ex, substituted: false };
  if (ex.altId && EX_MAP[ex.altId]) return { exercise: EX_MAP[ex.altId], substituted: true, originalName: ex.name };
  return { exercise: ex, substituted: false };
}
const todayKey = () => new Date().toISOString().slice(0, 10);
const fmtDay = (d) => d.toLocaleDateString(undefined, { weekday: "short" });
function dayHash(str) { let h = 0; for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0; return h; }
function todaysLesson() { return MICRO_LESSONS[dayHash(todayKey()) % MICRO_LESSONS.length]; }

/* ------------------------------------------------------------------ */
/*  DAILY QUOTE — one per calendar day, lightly personalized to real   */
/*  state (streak / recovery / missed days), never shaming.            */
/* ------------------------------------------------------------------ */
const QUOTES_GENERAL = [
  { text: "Discipline is doing the session even when motivation didn't show up.", theme: "Discipline" },
  { text: "Progress is rarely visible day to day. It shows up in the average of your weeks.", theme: "Progress" },
  { text: "The plan doesn't need to be perfect. It needs to be repeatable.", theme: "Consistency" },
  { text: "Strength is built in the sets that feel unremarkable.", theme: "Training" },
  { text: "Patience isn't passive. It's choosing the slow method because it actually works.", theme: "Patience" },
  { text: "Recovery is part of training, not a break from it.", theme: "Recovery" },
  { text: "Confidence follows competence. Competence follows reps.", theme: "Confidence" },
  { text: "A habit you can sustain beats a routine you can't.", theme: "Healthy Habits" },
  { text: "Resilience is a skill. Every hard session is practice.", theme: "Resilience" },
  { text: "You don't need a perfect week. You need a week that's better than doing nothing.", theme: "Consistency" },
  { text: "The work compounds quietly. Trust the process you can't fully see yet.", theme: "Progress" },
  { text: "Form first, then load. Then everything else.", theme: "Training" },
];
const QUOTES_CONSISTENT = [
  { text: "Consistency is becoming your advantage.", theme: "Consistency" },
  { text: "This streak isn't luck. It's a habit you built on purpose.", theme: "Consistency" },
];
const QUOTES_MISSED = [
  { text: "One missed day doesn't define your progress.", theme: "Resilience" },
  { text: "The only broken streak is the one you don't restart.", theme: "Resilience" },
];
const QUOTES_RECOVERY = [
  { text: "Recovery is part of training.", theme: "Recovery" },
  { text: "Listen to your recovery signals.", theme: "Recovery" },
];

function pickDailyQuote(state) {
  const recovery = computeRecoveryStatus(state);
  const daysSinceActive = state.profile.lastActiveDate ? Math.floor((Date.now() - new Date(state.profile.lastActiveDate).getTime()) / 86400000) : null;
  let pool = QUOTES_GENERAL;
  if (recovery.status === "low") pool = QUOTES_RECOVERY;
  else if (daysSinceActive != null && daysSinceActive >= 2) pool = QUOTES_MISSED;
  else if (state.profile.streak >= 3) pool = QUOTES_CONSISTENT;
  return pool[dayHash(todayKey() + pool.length) % pool.length];
}

const DENSITY_META = {
  green: { label: "Nutrient-dense", color: C.mint, tone: "mint" },
  yellow: { label: "Balanced", color: C.amber, tone: "amber" },
  red: { label: "Calorie-dense", color: C.red, tone: "red" },
};
function splitSteps(text) {
  return text.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
}

function classifyDensity(entry) {
  if (entry.density && DENSITY_META[entry.density]) return entry.density;
  const macroSum = (entry.protein || 0) + (entry.carbs || 0) + (entry.fat || 0);
  const ratio = entry.calories / Math.max(1, macroSum);
  if (ratio < 6) return "green";
  if (ratio < 9) return "yellow";
  return "red";
}

/* ------------------------------------------------------------------ */
/*  RECOVERY — combines sleep, energy, and recent training load into   */
/*  a plain-language status. Never diagnostic, never shaming.           */
/* ------------------------------------------------------------------ */
const QUALITY_SCORE = { excellent: 4, good: 3, okay: 2, poor: 1, "very poor": 0 };

function computeRecoveryStatus(state) {
  const today = state.checkins[todayKey()] || {};
  const hasSleep = typeof today.sleepHours === "number";
  const hasEnergy = typeof today.energy === "number";
  if (!hasSleep && !hasEnergy) {
    return { status: "unknown", label: "Log a check-in", message: "Log this morning's sleep and energy so Veya can gauge your recovery." };
  }
  let score = 0, signals = 0;
  if (hasSleep) { signals++; score += today.sleepHours >= 7 ? 2 : today.sleepHours >= 6 ? 1 : 0; }
  if (hasEnergy) { signals++; score += today.energy >= 4 ? 2 : today.energy === 3 ? 1 : 0; }
  const recentWorkouts = state.workoutHistory.filter((h) => (Date.now() - new Date(h.date).getTime()) / 86400000 <= 3).length;
  if (recentWorkouts >= 4) score -= 1;
  const avg = score / Math.max(1, signals);
  if (avg >= 1.5) return { status: "ready", label: "Ready to train", message: "Your recovery indicators look good today." };
  if (avg >= 0.6) return { status: "moderate", label: "Listen to your body", message: "Recovery looks okay — train if you feel good, or ease off if not." };
  return { status: "low", label: "Recovery recommended", message: "Your energy and/or sleep are low today. Consider a recovery day or light mobility instead of a hard session." };
}

function last7Sleep(state) {
  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000);
    const key = d.toISOString().slice(0, 10);
    const c = state.checkins[key];
    return { label: fmtDay(d), hours: typeof c?.sleepHours === "number" ? c.sleepHours : null };
  });
}

/* ------------------------------------------------------------------ */
/*  XP / LEVEL / ACHIEVEMENTS                                          */
/* ------------------------------------------------------------------ */
const LEVEL_NAMES = ["Starter", "Consistent", "Building", "Focused", "Strong", "Advanced", "Dedicated", "Elite"];
function levelName(level) { return LEVEL_NAMES[Math.min(level, LEVEL_NAMES.length) - 1]; }
function levelInfo(xp) {
  let level = 1, need = 300, remaining = xp;
  while (remaining >= need) { remaining -= need; level++; need = Math.round(need * 1.15); }
  return { level, into: remaining, need, name: levelName(level) };
}
const ACHIEVEMENTS = [
  { id: "a1", name: "First Workout", desc: "Complete your first session", check: (s) => s.workoutHistory.length >= 1 },
  { id: "a2", name: "5 Workouts", desc: "Complete 5 workout sessions", check: (s) => s.workoutHistory.length >= 5 },
  { id: "a3", name: "First Scan", desc: "Log a meal with AI scan", check: (s) => Object.values(s.foodLog).flat().some((f) => f.source === "scanned") },
  { id: "a4", name: "3-Day Streak", desc: "Stay active 3 days in a row", check: (s) => s.profile.streak >= 3 },
  { id: "a5", name: "7-Day Streak", desc: "Stay active 7 days in a row", check: (s) => s.profile.streak >= 7 },
  { id: "a6", name: "Level 5", desc: "Reach level 5", check: (s) => levelInfo(s.profile.xp).level >= 5 },
  { id: "a7", name: "Mindful Start", desc: "Complete your first daily check-in", check: (s) => Object.keys(s.checkins || {}).length >= 1 },
];

/* ------------------------------------------------------------------ */
/*  AI HELPERS                                                         */
/* ------------------------------------------------------------------ */
async function callClaude({ system, messages, image }) {
  const finalMessages = image
    ? [...messages.slice(0, -1), { role: "user", content: [{ type: "image", source: { type: "base64", media_type: image.mediaType, data: image.data } }, { type: "text", text: messages[messages.length - 1].content }] }]
    : messages;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000, system, messages: finalMessages }),
  });
  if (!res.ok) throw new Error("AI request failed");
  const data = await res.json();
  return (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
}
function parseJsonLoose(text) {
  return JSON.parse(text.replace(/```json/gi, "").replace(/```/g, "").trim());
}

/* ------------------------------------------------------------------ */
/*  SUPABASE — fetch-based client (see supabaseClient.js for notes)    */
/* ------------------------------------------------------------------ */
const SUPABASE_URL = "https://orosfesudgybtvhbgjxu.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_RoZ0tR6u3RUJKmvqQdocGg_sXODY7L0";
const SESSION_KEY = "supabase-session";

let currentSession = null;
async function loadSession() {
  try {
    const res = await window.storage.get(SESSION_KEY, false);
    if (res && res.value) currentSession = JSON.parse(res.value);
  } catch (e) { /* no session yet */ }
  return currentSession;
}
async function saveSession(session) {
  currentSession = session;
  try {
    if (session) await window.storage.set(SESSION_KEY, JSON.stringify(session), false);
    else await window.storage.delete(SESSION_KEY, false);
  } catch (e) { /* ignore */ }
}
async function authFetch(path, body) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || data.msg || "Request failed");
  return data;
}
const supabase = {
  auth: {
    async signUp(email, password, displayName) {
      const data = await authFetch("/signup", { email, password, data: { display_name: displayName || "" } });
      if (data.access_token) await saveSession(data);
      return data;
    },
    async signIn(email, password) {
      const data = await authFetch("/token?grant_type=password", { email, password });
      await saveSession(data);
      return data;
    },
    async signOut() {
      if (currentSession?.access_token) {
        await fetch(`${SUPABASE_URL}/auth/v1/logout`, { method: "POST", headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${currentSession.access_token}` } }).catch(() => {});
      }
      await saveSession(null);
    },
    async resetPasswordForEmail(email) {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/recover`, { method: "POST", headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY }, body: JSON.stringify({ email }) });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error_description || d.msg || "Could not send reset email"); }
    },
    async getSession() { if (!currentSession) await loadSession(); return currentSession; },
  },
  db: {
    async request(table, { method = "GET", query = "", body, prefer } = {}) {
      const session = await supabase.auth.getSession();
      const headers = { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${session?.access_token || SUPABASE_ANON_KEY}` };
      if (prefer) headers.Prefer = prefer;
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.message || `Request to ${table} failed`); }
      if (res.status === 204) return null;
      return res.json();
    },
    select(table, query = "?select=*") { return supabase.db.request(table, { method: "GET", query }); },
    insert(table, row) { return supabase.db.request(table, { method: "POST", body: row, prefer: "return=representation" }); },
    update(table, query, patch) { return supabase.db.request(table, { method: "PATCH", query, body: patch, prefer: "return=representation" }); },
    delete(table, query) { return supabase.db.request(table, { method: "DELETE", query }); },
  },
};

/* ------------------------------------------------------------------ */
/*  STATE — profile / workouts / food log / XP live in Supabase;       */
/*  everything else (check-ins, meal plan, grocery, store) stays local */
/*  for now, per the current migration scope.                          */
/* ------------------------------------------------------------------ */
const ADMIN_EMAIL = "yunusfawzan9@gmail.com";
const SHARED_IMAGES_KEY = "veya-shared-exercise-images";

async function loadSharedExerciseImages() {
  try {
    const res = await window.storage.get(SHARED_IMAGES_KEY, true);
    if (res?.value) return JSON.parse(res.value);
  } catch (e) { /* none set yet */ }
  return {};
}
async function saveSharedExerciseImages(images) {
  try { await window.storage.set(SHARED_IMAGES_KEY, JSON.stringify(images), true); } catch (e) { /* ignore */ }
}

const LOCAL_KEY = "fitness-app-local-v1";
const defaultState = () => ({
  profile: { name: "", setupDone: false, xp: 0, streak: 0, lastActiveDate: null, goal: "general_fitness", equipment: "Dumbbells", trainingMode: "home", equipmentProfile: [], dietary: "No restrictions", targets: { calories: 2100, protein: 140, carbs: 230, fat: 70 }, lastLessonXpDate: null },
  foodLog: {},
  workoutHistory: [],
  courseBadges: [],
  checkins: {},
  mealPlan: null,
  groceryList: [],
  cart: [],
  purchaseHistory: [],
  exploredRecipes: [],
  completedLearnLessons: [],
  exerciseImages: {},
  ownedCosmetics: [],
  equippedCosmetics: { accent: null, avatar: "initial", glow: false, badge: null },
  xpLog: [],
  restDays: {},
  dismissedMissed: {},
});

async function loadLocalState() {
  try {
    const res = await window.storage.get(LOCAL_KEY, false);
    if (res && res.value) return JSON.parse(res.value);
  } catch (e) { /* first run */ }
  return {};
}
async function saveLocalState(partial) {
  try { await window.storage.set(LOCAL_KEY, JSON.stringify(partial), false); } catch (e) { /* ignore */ }
}

async function loadRemoteState(userId) {
  let profileRows = await supabase.db.select("profiles", `?user_id=eq.${userId}&select=*`);
  let p = profileRows[0];
  if (!p) {
    // Trigger may not have fired yet right after signup — create it directly.
    const created = await supabase.db.insert("profiles", { user_id: userId });
    p = created[0];
  }
  const [historyRows, foodRows, badgeRows, xpRows, cosmeticRows] = await Promise.all([
    supabase.db.select("workout_history", `?user_id=eq.${userId}&select=*&order=completed_at.desc&limit=500`),
    supabase.db.select("food_logs", `?user_id=eq.${userId}&select=*&order=logged_at.desc&limit=1000`),
    supabase.db.select("course_badges", `?user_id=eq.${userId}&select=course_id`),
    supabase.db.select("xp_transactions", `?user_id=eq.${userId}&select=amount`),
    supabase.db.select("user_cosmetics", `?user_id=eq.${userId}&select=cosmetic_id`).catch(() => []),
  ]);

  const foodLog = {};
  foodRows.forEach((r) => {
    const day = r.logged_at;
    if (!foodLog[day]) foodLog[day] = [];
    foodLog[day].push({ id: r.id, name: r.food_name, portion: r.portion, calories: Number(r.estimated_calories) || 0, protein: Number(r.estimated_protein) || 0, carbs: Number(r.estimated_carbs) || 0, fat: Number(r.estimated_fat) || 0, density: r.density, source: r.source, confidence: r.confidence, meal: r.meal_type });
  });

  return {
    profile: {
      name: p.display_name || "", setupDone: !!(p.display_name && p.display_name.trim()),
      xp: xpRows.reduce((s, r) => s + r.amount, 0), streak: p.streak || 0, lastActiveDate: p.last_active_date,
      goal: p.goal || "general_fitness", equipment: p.equipment || "Dumbbells", dietary: p.dietary || "No restrictions",
      targets: { calories: p.target_calories, protein: p.target_protein, carbs: p.target_carbs, fat: p.target_fat },
      lastLessonXpDate: null,
    },
    workoutHistory: historyRows.map((h) => ({ id: h.id, date: h.completed_at.slice(0, 10), workoutId: h.workout_id, courseId: h.course_id, name: h.workout_name })),
    foodLog,
    courseBadges: badgeRows.map((b) => b.course_id),
    ownedCosmetics: (cosmeticRows || []).map((c) => c.cosmetic_id),
    equippedCosmetics: { accent: p.equipped_accent ?? null, avatar: p.equipped_avatar ?? "initial", glow: !!p.equipped_glow, badge: p.equipped_badge ?? null },
  };
}

/* ------------------------------------------------------------------ */
/*  MAIN APP                                                            */
/* ------------------------------------------------------------------ */
export default function App() {
  const [authChecking, setAuthChecking] = useState(true);
  const [session, setSession] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState(defaultState());
  const [tab, setTab] = useState("home");
  const [toast, setToast] = useState("");
  const [coachOpen, setCoachOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [morningOpen, setMorningOpen] = useState(false);
  const [eveningOpen, setEveningOpen] = useState(false);
  const [lessonOpen, setLessonOpen] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [storeOpen, setStoreOpen] = useState(false);
  const [authDefaultMode, setAuthDefaultMode] = useState("signin");
  const [appearance, setAppearance] = useState("system"); // light | dark | system
  const [themeName, setThemeName] = useState("core");       // core | obsidian | aurora | stealth
  const [systemDark, setSystemDark] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const THEME_PREFS_KEY = "veya-theme-prefs";

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemDark(mq.matches);
    const handler = (e) => setSystemDark(e.matches);
    mq.addEventListener ? mq.addEventListener("change", handler) : mq.addListener(handler);
    return () => (mq.removeEventListener ? mq.removeEventListener("change", handler) : mq.removeListener(handler));
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const raw = await window.storage.get(THEME_PREFS_KEY, false);
        if (raw?.value) {
          const p = JSON.parse(raw.value);
          if (p.appearance) setAppearance(p.appearance);
          if (p.themeName) setThemeName(p.themeName);
        }
      } catch (e) { /* first run, defaults are fine */ }
    })();
  }, []);

  useEffect(() => {
    window.storage.set(THEME_PREFS_KEY, JSON.stringify({ appearance, themeName }), false).catch(() => {});
  }, [appearance, themeName]);

  // Resolve + apply the active palette synchronously every render, before
  // any child component reads C.* — this is what makes the switch instant.
  const resolvedDark = appearance === "system" ? systemDark : appearance === "dark";
  const activePalette = themeName === "core" ? (resolvedDark ? THEME_PALETTES.coreDark : THEME_PALETTES.coreLight) : THEME_PALETTES[themeName];
  Object.assign(C, activePalette);
  if (state.equippedCosmetics?.accent && ACCENT_PACKS[state.equippedCosmetics.accent]) {
    Object.assign(C, ACCENT_PACKS[state.equippedCosmetics.accent]);
  }

  const saveTimer = useRef(null);
  const GUEST_KEY = "veya-guest-state";

  const showToast = useCallback((t) => { setToast(t); setTimeout(() => setToast(""), 2600); }, []);

  const enterGuestMode = useCallback(async () => {
    setLoading(true);
    let guestState = null;
    try {
      const raw = await window.storage.get(GUEST_KEY, false);
      if (raw?.value) guestState = JSON.parse(raw.value);
    } catch (e) { /* no saved guest session yet */ }
    if (!guestState) {
      guestState = { ...defaultState(), profile: { ...defaultState().profile, name: "Guest User", setupDone: true, goal: "general_fitness", equipment: "Dumbbells" } };
    }
    setIsGuest(true);
    setState(guestState);
    setLoading(false);
  }, []);

  const exitGuestMode = useCallback(async () => {
    try { await window.storage.delete(GUEST_KEY, false); } catch (e) { /* ignore */ }
    setIsGuest(false);
    setState(defaultState());
    setProfileOpen(false);
  }, []);

  const bootstrap = useCallback(async (sess) => {
    setLoading(true);
    try {
      const [remote, local] = await Promise.all([loadRemoteState(sess.user.id), loadLocalState()]);
      const merged = {
        ...defaultState(), ...remote,
        checkins: local.checkins || {}, mealPlan: local.mealPlan || null, groceryList: local.groceryList || [],
        cart: local.cart || [], purchaseHistory: local.purchaseHistory || [], exploredRecipes: local.exploredRecipes || [], completedLearnLessons: local.completedLearnLessons || [],
        xpLog: local.xpLog || [],
        restDays: local.restDays || {}, dismissedMissed: local.dismissedMissed || {},
        profile: { ...remote.profile, lastLessonXpDate: local.lastLessonXpDate || null, trainingMode: local.trainingMode || "home", equipmentProfile: local.equipmentProfile || [] },
      };
      setState(merged);
      if (!merged.profile.setupDone) setSetupOpen(true);
    } catch (e) {
      showToast("Couldn't load your data — check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    (async () => {
      const sess = await supabase.auth.getSession();
      if (sess?.access_token) {
        setSession(sess);
        await bootstrap(sess);
      }
      setAuthChecking(false);
    })();
  }, [bootstrap]);

  useEffect(() => {
    (async () => {
      const shared = await loadSharedExerciseImages();
      if (Object.keys(shared).length > 0) {
        setState((prev) => ({ ...prev, exerciseImages: shared }));
      }
    })();
  }, []);

  useEffect(() => {
    if (loading || authChecking) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      if (session) {
        saveLocalState({ checkins: state.checkins, mealPlan: state.mealPlan, groceryList: state.groceryList, cart: state.cart, purchaseHistory: state.purchaseHistory, exploredRecipes: state.exploredRecipes, lastLessonXpDate: state.profile.lastLessonXpDate, ownedCosmetics: state.ownedCosmetics, equippedCosmetics: state.equippedCosmetics, xpLog: state.xpLog, trainingMode: state.profile.trainingMode, equipmentProfile: state.profile.equipmentProfile, restDays: state.restDays, dismissedMissed: state.dismissedMissed, completedLearnLessons: state.completedLearnLessons });
      } else if (isGuest) {
        window.storage.set(GUEST_KEY, JSON.stringify(state), false).catch(() => {});
      }
    }, 500);
    return () => clearTimeout(saveTimer.current);
  }, [state, loading, authChecking, session, isGuest]);

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setState(defaultState());
    setProfileOpen(false);
  }, []);

  const touchStreakAndXp = useCallback((amount, reason) => {
    setState((prev) => {
      const today = todayKey();
      let { streak, lastActiveDate } = prev.profile;
      if (lastActiveDate !== today) {
        const yest = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        streak = lastActiveDate === yest ? streak + 1 : 1;
        lastActiveDate = today;
      }
      if (session?.user?.id) {
        supabase.db.update("profiles", `?user_id=eq.${session.user.id}`, { streak, last_active_date: lastActiveDate }).catch(() => showToast("Couldn't save your streak — check your connection."));
        supabase.db.insert("xp_transactions", { user_id: session.user.id, amount, reason }).catch(() => showToast("Couldn't save your XP — check your connection."));
      }
      const xpLog = [{ id: `x${Date.now()}`, amount, reason, date: todayKey() }, ...prev.xpLog].slice(0, 50);
      return { ...prev, profile: { ...prev.profile, xp: prev.profile.xp + amount, streak, lastActiveDate }, xpLog };
    });
    showToast(`+${amount} XP · ${reason}`);
  }, [session, showToast]);

  // Spend XP on a cosmetic. Never deducts silently — the shop UI always
  // confirms price + balance-after before calling this.
  const spendXp = useCallback((amount, reason) => {
    setState((prev) => {
      if (session?.user?.id) {
        supabase.db.insert("xp_transactions", { user_id: session.user.id, amount: -amount, reason }).catch(() => showToast("Couldn't sync this purchase — check your connection."));
      }
      const xpLog = [{ id: `x${Date.now()}`, amount: -amount, reason, date: todayKey() }, ...prev.xpLog].slice(0, 50);
      return { ...prev, profile: { ...prev.profile, xp: prev.profile.xp - amount }, xpLog };
    });
  }, [session, showToast]);

  const EQUIP_COLUMN = { accent: "equipped_accent", avatar: "equipped_avatar", glow: "equipped_glow", badge: "equipped_badge" };

  const purchaseCosmetic = useCallback((item) => {
    let allowed = false;
    setState((prev) => {
      allowed = prev.profile.xp >= item.price && !prev.ownedCosmetics.includes(item.id);
      if (!allowed) return prev;
      return { ...prev, ownedCosmetics: [...prev.ownedCosmetics, item.id], equippedCosmetics: { ...prev.equippedCosmetics, [item.type]: item.value } };
    });
    if (allowed) {
      spendXp(item.price, item.name);
      showToast(`${item.name} unlocked`);
      if (session?.user?.id) {
        supabase.db.insert("user_cosmetics", { user_id: session.user.id, cosmetic_id: item.id }).catch(() => {});
        supabase.db.update("profiles", `?user_id=eq.${session.user.id}`, { [EQUIP_COLUMN[item.type]]: item.value }).catch(() => {});
      }
    } else showToast("Not enough XP for that yet");
  }, [spendXp, showToast, session]);

  const equipCosmetic = useCallback((type, value) => {
    setState((prev) => ({ ...prev, equippedCosmetics: { ...prev.equippedCosmetics, [type]: value } }));
    if (session?.user?.id) {
      supabase.db.update("profiles", `?user_id=eq.${session.user.id}`, { [EQUIP_COLUMN[type]]: value }).catch(() => showToast("Couldn't sync — check your connection."));
    }
  }, [session, showToast]);

  const logFood = useCallback(async (entry, meal) => {
    const k = todayKey();
    if (isGuest) {
      setState((prev) => {
        const list = prev.foodLog[k] ? [...prev.foodLog[k]] : [];
        list.push({ ...entry, id: `f${Date.now()}`, meal });
        return { ...prev, foodLog: { ...prev.foodLog, [k]: list } };
      });
      touchStreakAndXp(20, "Meal logged");
      return;
    }
    if (!session?.user?.id) return;
    try {
      const inserted = await supabase.db.insert("food_logs", {
        user_id: session.user.id, logged_at: k, meal_type: meal, food_name: entry.name, portion: entry.portion || null,
        estimated_calories: entry.calories, estimated_protein: entry.protein, estimated_carbs: entry.carbs, estimated_fat: entry.fat,
        density: entry.density || null, source: entry.source || null, confidence: entry.confidence || null,
      });
      const row = inserted[0];
      setState((prev) => {
        const list = prev.foodLog[k] ? [...prev.foodLog[k]] : [];
        list.push({ id: row.id, name: row.food_name, portion: row.portion, calories: entry.calories, protein: entry.protein, carbs: entry.carbs, fat: entry.fat, density: row.density, source: row.source, confidence: row.confidence, meal });
        return { ...prev, foodLog: { ...prev.foodLog, [k]: list } };
      });
      touchStreakAndXp(20, "Meal logged");
    } catch (e) {
      showToast("Your meal could not be saved — check your connection and try again.");
    }
  }, [session, isGuest, touchStreakAndXp, showToast]);

  // Logs several food items from one meal (e.g. "rice, chicken curry, dhal and
  // sambol") as separate food_log rows, but awards Meal Logged XP exactly
  // once — otherwise splitting a meal into more items would farm more XP.
  const logFoodBatch = useCallback(async (items, meal) => {
    const k = todayKey();
    if (isGuest) {
      setState((prev) => {
        const list = prev.foodLog[k] ? [...prev.foodLog[k]] : [];
        items.forEach((entry, idx) => list.push({ ...entry, id: `f${Date.now()}_${idx}`, meal }));
        return { ...prev, foodLog: { ...prev.foodLog, [k]: list } };
      });
      touchStreakAndXp(20, "Meal logged");
      return;
    }
    if (!session?.user?.id) return;
    try {
      const rows = items.map((entry) => ({
        user_id: session.user.id, logged_at: k, meal_type: meal, food_name: entry.name, portion: entry.portion || null,
        estimated_calories: entry.calories, estimated_protein: entry.protein, estimated_carbs: entry.carbs, estimated_fat: entry.fat,
        density: entry.density || null, source: entry.source || null, confidence: entry.confidence || null,
      }));
      const inserted = await supabase.db.insert("food_logs", rows);
      setState((prev) => {
        const list = prev.foodLog[k] ? [...prev.foodLog[k]] : [];
        inserted.forEach((row, idx) => list.push({ id: row.id, name: row.food_name, portion: row.portion, calories: items[idx].calories, protein: items[idx].protein, carbs: items[idx].carbs, fat: items[idx].fat, density: row.density, source: row.source, confidence: row.confidence, meal }));
        return { ...prev, foodLog: { ...prev.foodLog, [k]: list } };
      });
      touchStreakAndXp(20, "Meal logged");
    } catch (e) {
      showToast("Your meal could not be saved — check your connection and try again.");
    }
  }, [session, isGuest, touchStreakAndXp, showToast]);

  const deleteFood = useCallback(async (id) => {
    if (isGuest) {
      setState((prev) => {
        const k = todayKey();
        return { ...prev, foodLog: { ...prev.foodLog, [k]: (prev.foodLog[k] || []).filter((f) => f.id !== id) } };
      });
      return;
    }
    if (!session?.user?.id) return;
    try {
      await supabase.db.delete("food_logs", `?id=eq.${id}`);
      setState((prev) => {
        const k = todayKey();
        return { ...prev, foodLog: { ...prev.foodLog, [k]: (prev.foodLog[k] || []).filter((f) => f.id !== id) } };
      });
    } catch (e) {
      showToast("Couldn't delete that entry — check your connection.");
    }
  }, [session, isGuest, showToast]);

  const completeWorkout = useCallback(async (workout) => {
    const alreadyDoneToday = state.workoutHistory.some((h) => h.workoutId === workout.id && h.date === todayKey());
    if (alreadyDoneToday) {
      showToast("Already completed today — nice practice rep, no extra XP");
      return;
    }
    if (isGuest) {
      let courseJustCompleted = null;
      setState((prev) => {
        const newHistory = [...prev.workoutHistory, { id: `wh${Date.now()}`, date: todayKey(), workoutId: workout.id, courseId: workout.courseId, name: workout.name }];
        let courseBadges = prev.courseBadges;
        if (workout.courseId) {
          const course = COURSES.find((c) => c.id === workout.courseId);
          const sessionsDone = newHistory.filter((h) => h.courseId === workout.courseId).length;
          if (course && sessionsDone >= course.weeks * course.sessionsPerWeek && !courseBadges.includes(workout.courseId)) {
            courseBadges = [...courseBadges, workout.courseId];
            courseJustCompleted = course;
          }
        }
        return { ...prev, workoutHistory: newHistory, courseBadges };
      });
      touchStreakAndXp(100, "Workout completed");
      if (courseJustCompleted) setTimeout(() => touchStreakAndXp(courseJustCompleted.rewardXp, `${courseJustCompleted.badge} unlocked!`), 900);
      return;
    }
    if (!session?.user?.id) return;
    try {
      const inserted = await supabase.db.insert("workout_history", { user_id: session.user.id, workout_id: workout.id, course_id: workout.courseId || null, workout_name: workout.name });
      const row = inserted[0];
      let courseJustCompleted = null;
      setState((prev) => {
        const newHistory = [...prev.workoutHistory, { id: row.id, date: row.completed_at.slice(0, 10), workoutId: row.workout_id, courseId: row.course_id, name: row.workout_name }];
        let courseBadges = prev.courseBadges;
        if (workout.courseId) {
          const course = COURSES.find((c) => c.id === workout.courseId);
          const sessionsDone = newHistory.filter((h) => h.courseId === workout.courseId).length;
          if (course && sessionsDone >= course.weeks * course.sessionsPerWeek && !courseBadges.includes(workout.courseId)) {
            courseBadges = [...courseBadges, workout.courseId];
            courseJustCompleted = course;
          }
        }
        return { ...prev, workoutHistory: newHistory, courseBadges };
      });
      touchStreakAndXp(100, "Workout completed");
      if (courseJustCompleted) {
        supabase.db.insert("course_badges", { user_id: session.user.id, course_id: courseJustCompleted.id }).catch(() => {});
        setTimeout(() => touchStreakAndXp(courseJustCompleted.rewardXp, `${courseJustCompleted.badge} unlocked!`), 900);
      }
    } catch (e) {
      showToast("Your workout could not be saved — check your connection and try again.");
    }
  }, [session, isGuest, touchStreakAndXp, showToast, state.workoutHistory]);

  const logMorningCheckin = useCallback((data) => {
    const today = todayKey();
    let alreadyDone = false;
    setState((prev) => {
      alreadyDone = !!prev.checkins[today]?.morningDone;
      return { ...prev, checkins: { ...prev.checkins, [today]: { ...prev.checkins[today], ...data, morningDone: true } } };
    });
    if (!alreadyDone) touchStreakAndXp(15, "Morning check-in");
    setMorningOpen(false);
  }, [touchStreakAndXp]);

  const logEveningCheckin = useCallback((data) => {
    const today = todayKey();
    let alreadyDone = false;
    setState((prev) => {
      alreadyDone = !!prev.checkins[today]?.eveningDone;
      return { ...prev, checkins: { ...prev.checkins, [today]: { ...prev.checkins[today], ...data, eveningDone: true } } };
    });
    if (!alreadyDone) touchStreakAndXp(10, "Evening check-in");
    setEveningOpen(false);
  }, [touchStreakAndXp]);

  const markLessonRead = useCallback(() => {
    let shouldAward = false;
    setState((prev) => {
      if (prev.profile.lastLessonXpDate === todayKey()) return prev;
      shouldAward = true;
      return { ...prev, profile: { ...prev.profile, lastLessonXpDate: todayKey() } };
    });
    if (shouldAward) touchStreakAndXp(10, "Daily insight read");
  }, [touchStreakAndXp]);

  const markRestDay = useCallback((dateKey) => {
    setState((prev) => ({ ...prev, restDays: { ...prev.restDays, [dateKey]: true }, dismissedMissed: { ...prev.dismissedMissed, [dateKey]: true } }));
    showToast("Marked as a recovery day");
  }, [showToast]);

  const skipMissed = useCallback((dateKey) => {
    setState((prev) => ({ ...prev, dismissedMissed: { ...prev.dismissedMissed, [dateKey]: true } }));
  }, []);

  const finishSetup = useCallback(async (name, goal, equipment, trainingMode, equipmentProfile) => {
    if (isGuest) {
      setState((prev) => ({ ...prev, profile: { ...prev.profile, name, goal, equipment, trainingMode, equipmentProfile, setupDone: true } }));
      setSetupOpen(false);
      return;
    }
    if (!session?.user?.id) return;
    try {
      await supabase.db.update("profiles", `?user_id=eq.${session.user.id}`, { display_name: name, goal, equipment });
      setState((prev) => ({ ...prev, profile: { ...prev.profile, name, goal, equipment, trainingMode, equipmentProfile, setupDone: true } }));
      setSetupOpen(false);
    } catch (e) {
      showToast("Couldn't save your profile — check your connection and try again.");
    }
  }, [session, isGuest, showToast]);

  const addGroceryItems = useCallback((items, source) => {
    setState((prev) => {
      const existingNames = new Set(prev.groceryList.map((g) => g.name.toLowerCase()));
      const additions = items
        .filter((name) => !existingNames.has(name.toLowerCase()))
        .map((name) => ({ id: `g${Date.now()}${Math.random().toString(36).slice(2, 6)}`, name, category: categorizeIngredient(name), quantity: "1", purchased: false, source }));
      return { ...prev, groceryList: [...prev.groceryList, ...additions] };
    });
  }, []);
  const toggleGrocery = useCallback((id) => {
    setState((prev) => ({ ...prev, groceryList: prev.groceryList.map((g) => g.id === id ? { ...g, purchased: !g.purchased } : g) }));
  }, []);
  const deleteGrocery = useCallback((id) => {
    setState((prev) => ({ ...prev, groceryList: prev.groceryList.filter((g) => g.id !== id) }));
  }, []);
  const clearPurchasedGrocery = useCallback(() => {
    setState((prev) => ({ ...prev, groceryList: prev.groceryList.filter((g) => !g.purchased) }));
  }, []);
  const setMealPlan = useCallback((plan) => setState((prev) => ({ ...prev, mealPlan: plan })), []);
  const exploreRecipe = useCallback((recipeId) => {
    setState((prev) => {
      if (prev.exploredRecipes.includes(recipeId)) return prev;
      return { ...prev, exploredRecipes: [...prev.exploredRecipes, recipeId] };
    });
    touchStreakAndXp(10, "Recipe explored");
  }, [touchStreakAndXp]);

  const completeLearnLesson = useCallback((lessonId) => {
    let alreadyDone = false;
    setState((prev) => {
      alreadyDone = prev.completedLearnLessons.includes(lessonId);
      if (alreadyDone) return prev;
      return { ...prev, completedLearnLessons: [...prev.completedLearnLessons, lessonId] };
    });
    if (!alreadyDone) touchStreakAndXp(15, "Course lesson completed");
  }, [touchStreakAndXp]);

  const isAdmin = session?.user?.email === ADMIN_EMAIL;

  const setExerciseImage = useCallback((exerciseId, field, url) => {
    if (session?.user?.email !== ADMIN_EMAIL) { showToast("Only the admin account can edit these images."); return; }
    setState((prev) => {
      const nextImages = {
        ...prev.exerciseImages,
        [exerciseId]: { ...prev.exerciseImages[exerciseId], [field]: url.trim() || undefined },
      };
      saveSharedExerciseImages(nextImages);
      return { ...prev, exerciseImages: nextImages };
    });
  }, [session, showToast]);

  const addToCart = useCallback((product) => {
    setState((prev) => {
      const existing = prev.cart.find((c) => c.id === product.id);
      const cart = existing ? prev.cart.map((c) => c.id === product.id ? { ...c, qty: c.qty + 1 } : c) : [...prev.cart, { id: product.id, qty: 1 }];
      return { ...prev, cart };
    });
    showToast(`${product.name} added to cart`);
  }, [showToast]);
  const removeFromCart = useCallback((id) => setState((prev) => ({ ...prev, cart: prev.cart.filter((c) => c.id !== id) })), []);
  const updateCartQty = useCallback((id, qty) => {
    setState((prev) => ({ ...prev, cart: qty <= 0 ? prev.cart.filter((c) => c.id !== id) : prev.cart.map((c) => c.id === id ? { ...c, qty } : c) }));
  }, []);
  const checkout = useCallback(() => {
    setState((prev) => {
      const items = prev.cart.map((c) => ({ ...PRODUCTS.find((p) => p.id === c.id), qty: c.qty }));
      const total = items.reduce((s, i) => s + i.price * i.qty, 0);
      const order = { id: `o${Date.now()}`, date: todayKey(), items: items.map((i) => ({ id: i.id, name: i.name, qty: i.qty, price: i.price })), total, status: "Demo order — no payment processed" };
      return { ...prev, cart: [], purchaseHistory: [order, ...prev.purchaseHistory] };
    });
    showToast("Demo order placed — no real payment was processed");
  }, [showToast]);

  useEffect(() => { document.title = "VEYA — Personal wellness, intelligently."; }, []);

  if (authChecking) return <LoadingScreen />;
  if (!session && !isGuest) return <AuthScreen onAuthed={async (sess) => { setSession(sess); await bootstrap(sess); }} onGuest={enterGuestMode} defaultMode={authDefaultMode} />;
  if (loading) return <LoadingScreen />;

  const todaysWorkout = nextWorkoutForCourse(state, "c1");
  const todaysFood = state.foodLog[todayKey()] || [];
  const todaysCheckin = state.checkins[todayKey()];
  const ownedProductIds = new Set(state.purchaseHistory.flatMap((o) => o.items.map((i) => i.id)));
  PRODUCTS.forEach((p) => {
    if (p.type === "bundle" && ownedProductIds.has(p.id)) {
      (p.bundleProductIds || []).forEach((id) => ownedProductIds.add(id));
      (p.bundleCourseIds || []).forEach((cid) => {
        const linked = PRODUCTS.find((x) => x.courseId === cid);
        if (linked) ownedProductIds.add(linked.id);
      });
    }
  });

  return (
    <div className="min-h-screen w-full flex justify-center relative" style={{ fontFamily: "-apple-system, ui-sans-serif, system-ui, sans-serif" }}>
      <AmbientBackground />
      <div className="w-full relative" style={{ maxWidth: 480, zIndex: 1 }}>
        <TopBar profile={state.profile} onBell={() => setNotifOpen(true)} onAvatar={() => setProfileOpen(true)} onStore={() => setStoreOpen(true)} cartCount={state.cart.reduce((s, c) => s + c.qty, 0)} isGuest={isGuest} equippedCosmetics={state.equippedCosmetics} />

        <main className="px-4 pt-3 pb-28">
          {tab === "home" && (
            <HomeTab state={state} todaysWorkout={todaysWorkout} todaysFood={todaysFood} todaysCheckin={todaysCheckin}
              onGoTrain={() => setTab("train")} onGoScan={() => setTab("scan")} onOpenCoach={() => setCoachOpen(true)}
              onGoNutrition={() => setTab("nutrition")} onGoProgress={() => setTab("progress")}
              onOpenMorning={() => setMorningOpen(true)} onOpenEvening={() => setEveningOpen(true)} onOpenLesson={() => setLessonOpen(true)} showToast={showToast}
              onMarkRestDay={markRestDay} onSkipMissed={skipMissed} />
          )}
          {tab === "train" && <TrainTab state={state} todaysWorkout={todaysWorkout} onComplete={completeWorkout} showToast={showToast} ownedProductIds={ownedProductIds} onOpenStore={() => setStoreOpen(true)} onSetExerciseImage={setExerciseImage} isAdmin={isAdmin} />}
          {tab === "scan" && <ScanTab onLog={logFood} onLogBatch={logFoodBatch} showToast={showToast} />}
          {tab === "nutrition" && (
            <NutritionTab state={state} setState={setState} todaysFood={todaysFood} onLog={logFood} onDelete={deleteFood}
              onAddGrocery={addGroceryItems} onToggleGrocery={toggleGrocery} onDeleteGrocery={deleteGrocery} onClearPurchased={clearPurchasedGrocery}
              onSetMealPlan={setMealPlan} onExploreRecipe={exploreRecipe} showToast={showToast} session={session} onCompleteLesson={completeLearnLesson} />
          )}
          {tab === "progress" && <ProgressTab state={state} />}
        </main>

        <BottomNav tab={tab} setTab={setTab} />
        <Toast text={toast} />

        {coachOpen && <CoachSheet state={state} todaysWorkout={todaysWorkout} todaysFood={todaysFood} todaysCheckin={todaysCheckin} onClose={() => setCoachOpen(false)} />}
        {notifOpen && (
          <Sheet title="Notifications" onClose={() => setNotifOpen(false)}>
            <EmptyState icon={Bell} title="No notifications yet" sub="Workout reminders and weekly summaries will appear here once notifications are configured." />
          </Sheet>
        )}
        {profileOpen && <ProfileSheet state={state} setState={setState} onClose={() => setProfileOpen(false)} session={session} onSignOut={handleSignOut} showToast={showToast} isGuest={isGuest} onExitGuest={exitGuestMode} onGoToSignup={() => { setAuthDefaultMode("signup"); exitGuestMode(); }} onOpenSettings={() => { setProfileOpen(false); setSettingsOpen(true); }} onOpenShop={() => { setProfileOpen(false); setShopOpen(true); }} />}
        {settingsOpen && <SettingsSheet state={state} setState={setState} appearance={appearance} setAppearance={setAppearance} themeName={themeName} setThemeName={setThemeName} resolvedDark={resolvedDark} onClose={() => setSettingsOpen(false)} />}
        {shopOpen && <ShopSheet state={state} onPurchase={purchaseCosmetic} onEquip={equipCosmetic} onClose={() => setShopOpen(false)} />}
        {morningOpen && <MorningCheckinSheet existing={todaysCheckin} onSave={logMorningCheckin} onClose={() => setMorningOpen(false)} />}
        {eveningOpen && <EveningCheckinSheet existing={todaysCheckin} onSave={logEveningCheckin} onClose={() => setEveningOpen(false)} />}
        {lessonOpen && <LessonSheet lesson={todaysLesson()} onOpen={markLessonRead} onClose={() => setLessonOpen(false)} alreadyRead={state.profile.lastLessonXpDate === todayKey()} />}
        {setupOpen && <SetupSheet onFinish={finishSetup} />}
        {storeOpen && (
          <StoreView state={state} onClose={() => setStoreOpen(false)} onAddToCart={addToCart} onRemoveFromCart={removeFromCart}
            onUpdateQty={updateCartQty} onCheckout={checkout} ownedProductIds={ownedProductIds} />
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  LOADING                                                             */
/* ------------------------------------------------------------------ */
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center relative">
      <AmbientBackground />
      <div className="relative" style={{ zIndex: 1 }}>
        <VeyaMark size={32} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  AUTH SCREEN                                                         */
/* ------------------------------------------------------------------ */
function AuthScreen({ onAuthed, onGuest, defaultMode = "signin" }) {
  const [mode, setMode] = useState(defaultMode); // signin | signup | reset
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function submit() {
    setLoading(true); setError(""); setInfo("");
    try {
      if (mode === "signin") {
        const data = await supabase.auth.signIn(email.trim(), password);
        await onAuthed(data);
      } else if (mode === "signup") {
        const data = await supabase.auth.signUp(email.trim(), password, name.trim());
        if (data.access_token) {
          await onAuthed(data);
        } else {
          setInfo("Check your email to confirm your account, then sign in.");
          setMode("signin");
        }
      } else if (mode === "reset") {
        await supabase.auth.resetPasswordForEmail(email.trim());
        setInfo("If that email has an account, a reset link is on its way.");
      }
    } catch (e) {
      setError(e.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex justify-center relative items-center px-4">
      <AmbientBackground />
      <div className="w-full relative" style={{ maxWidth: 420, zIndex: 1 }}>
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: C.fill, border: `1px solid ${C.glassBorder}` }}>
            <VeyaMark size={22} />
          </div>
          <p className="text-2xl font-bold tracking-widest" style={{ color: C.text }}>VEYA</p>
          <p className="text-xs mt-1" style={{ color: C.textFaint }}>Personal wellness, intelligently.</p>
        </div>

        <Glass>
          <p className="text-sm font-semibold mb-3" style={{ color: C.text }}>{mode === "signup" ? "Create your account" : mode === "reset" ? "Reset your password" : "Welcome back"}</p>
          <div className="space-y-3">
            {mode === "signup" && (
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="w-full rounded-2xl p-3.5 text-sm outline-none" style={{ background: C.fill, color: C.text }} />
            )}
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" className="w-full rounded-2xl p-3.5 text-sm outline-none" style={{ background: C.fill, color: C.text }} />
            {mode !== "reset" && (
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" className="w-full rounded-2xl p-3.5 text-sm outline-none" style={{ background: C.fill, color: C.text }} />
            )}
            {error && <ErrorNote text={error} />}
            {info && <div className="rounded-2xl p-3" style={{ background: C.mintDim }}><p className="text-xs" style={{ color: C.text }}>{info}</p></div>}
            <PrimaryButton onClick={submit} disabled={loading || !email || (mode !== "reset" && !password)}>
              {loading ? "Please wait…" : mode === "signup" ? "Create Account" : mode === "reset" ? "Send Reset Link" : "Sign In"}
            </PrimaryButton>
          </div>
        </Glass>

        {mode !== "reset" && (
          <div className="mt-3">
            <GhostButton onClick={onGuest}>Continue as Guest</GhostButton>
            <p className="text-[11px] text-center mt-2" style={{ color: C.textFaint }}>Explore VEYA with demo data — nothing saves to the cloud until you create an account.</p>
          </div>
        )}

        <div className="text-center mt-4 space-y-2">
          {mode === "signin" && (
            <>
              <button onClick={() => { setMode("reset"); setError(""); setInfo(""); }} className="text-xs" style={{ color: C.textDim }}>Forgot your password?</button>
              <p className="text-xs" style={{ color: C.textFaint }}>No account? <button onClick={() => { setMode("signup"); setError(""); setInfo(""); }} style={{ color: C.violet }}>Create one</button></p>
            </>
          )}
          {mode === "signup" && (
            <p className="text-xs" style={{ color: C.textFaint }}>Already have an account? <button onClick={() => { setMode("signin"); setError(""); setInfo(""); }} style={{ color: C.violet }}>Sign in</button></p>
          )}
          {mode === "reset" && (
            <button onClick={() => { setMode("signin"); setError(""); setInfo(""); }} className="text-xs" style={{ color: C.violet }}>Back to sign in</button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  TOP BAR / BOTTOM NAV — floating glass                               */
/* ------------------------------------------------------------------ */
function TopBar({ profile, onBell, onAvatar, onStore, cartCount, isGuest, equippedCosmetics }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return (
    <div className="sticky top-0 z-30 px-4 pt-4 pb-2" style={{ background: "linear-gradient(180deg, rgba(11,13,14,0.9) 60%, rgba(11,13,14,0))" }}>
      <div className="flex items-center justify-between rounded-2xl px-4 py-3" style={glassStyle()}>
        <div className="flex items-center gap-2.5">
          <VeyaMark size={18} />
          <div>
            <p className="text-xs font-medium" style={{ color: C.textFaint }}>{greeting}{isGuest && " · Guest"}</p>
            <p className="text-lg font-bold tracking-tight" style={{ color: C.text }}>{profile.name || "there"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onStore} className="relative p-2.5 rounded-full" style={{ background: C.fill }}>
            <ShoppingBag size={16} style={{ color: C.textDim }} />
            {cartCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center" style={{ background: C.violet, color: "#0B0D0E" }}>{cartCount}</span>}
          </button>
          <button onClick={onBell} className="p-2.5 rounded-full" style={{ background: C.fill }}><Bell size={16} style={{ color: C.textDim }} /></button>
          <button onClick={onAvatar} className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm" style={{ background: C.violet, color: "#0B0D0E" }}>
            {equippedCosmetics?.avatar === "mark" ? <VeyaMark size={16} color="#0B0D0E" /> : (profile.name || "U").slice(0, 1).toUpperCase()}
          </button>
        </div>
      </div>
      {isGuest && (
        <div className="mt-2 rounded-xl px-3.5 py-2 flex items-center justify-between" style={{ background: C.amberDim }}>
          <p className="text-[11px]" style={{ color: C.text }}>Exploring as a guest — nothing is saved to the cloud yet.</p>
          <button onClick={onAvatar} className="text-[11px] font-semibold" style={{ color: C.amber }}>Save progress</button>
        </div>
      )}
    </div>
  );
}

function BottomNav({ tab, setTab }) {
  const items = [
    { id: "home", label: "Home", icon: HomeIcon },
    { id: "train", label: "Train", icon: Dumbbell },
    { id: "scan", label: "Scan", icon: Camera, center: true },
    { id: "nutrition", label: "Nutrition", icon: Utensils },
    { id: "progress", label: "Progress", icon: TrendingUp },
  ];
  return (
    <div className="fixed bottom-0 left-0 right-0 flex justify-center z-40 pb-5 px-4">
      <div className="w-full flex items-end justify-between px-3 py-2.5 rounded-full" style={{ ...glassStyle(), maxWidth: 460, background: "rgba(18,19,22,0.65)" }}>
        {items.map((it) => {
          const active = tab === it.id;
          if (it.center) {
            return (
              <button key={it.id} onClick={() => setTab(it.id)} className="flex flex-col items-center -mt-7">
                <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${C.violet}, #4D8F8B)`, boxShadow: "0 10px 28px rgba(156,140,255,0.5)", border: "1px solid rgba(255,255,255,0.35)" }}>
                  <Camera size={22} color="#0A0B0D" />
                </div>
              </button>
            );
          }
          return (
            <button key={it.id} onClick={() => setTab(it.id)} className="flex flex-col items-center gap-1 px-2.5 py-1 rounded-2xl" style={{ background: active ? C.fill : "transparent" }}>
              <it.icon size={20} style={{ color: active ? C.text : C.textFaint }} />
              <span className="text-[10px] font-medium" style={{ color: active ? C.text : C.textFaint }}>{it.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  HOME TAB                                                            */
/* ------------------------------------------------------------------ */
function HomeTab({ state, todaysWorkout, todaysFood, todaysCheckin, onGoTrain, onGoScan, onGoNutrition, onGoProgress, onOpenCoach, onOpenMorning, onOpenEvening, onOpenLesson, showToast, onMarkRestDay, onSkipMissed }) {
  const { level, into, need, name: levelTitle } = levelInfo(state.profile.xp);
  const caloriesToday = todaysFood.reduce((s, f) => s + (f.calories || 0), 0);
  const target = state.profile.targets.calories;
  const todayEntries = state.workoutHistory.filter((w) => w.date === todayKey());
  const workoutDoneToday = todayEntries.length > 0;
  const isFirstEver = state.workoutHistory.length === 0;
  const lesson = todaysLesson();
  const lessonRead = state.profile.lastLessonXpDate === todayKey();
  const recovery = computeRecoveryStatus(state);
  const quote = pickDailyQuote(state);
  const hour = new Date().getHours();
  const morningDone = !!todaysCheckin?.morningDone;
  const eveningDone = !!todaysCheckin?.eveningDone;
  const RECOVERY_META = { ready: { tone: "mint", icon: BatteryFull }, moderate: { tone: "amber", icon: BatteryMedium }, low: { tone: "red", icon: BatteryLow }, unknown: { tone: "violet", icon: Moon } };
  const rm = RECOVERY_META[recovery.status];

  const yesterdayKey = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const yesterdayHadActivity = state.workoutHistory.some((h) => h.date === yesterdayKey) || !!state.checkins[yesterdayKey] || !!state.restDays[yesterdayKey];
  const showMissedPrompt = !isFirstEver && !yesterdayHadActivity && !state.dismissedMissed[yesterdayKey];

  const energyLabel = (n) => (n == null ? "Not logged" : n >= 4 ? "Good" : n === 3 ? "Fair" : "Low");
  const lastWorkoutLabel = (() => {
    if (state.workoutHistory.length === 0) return "No workouts yet";
    const last = state.workoutHistory[state.workoutHistory.length - 1];
    const days = Math.floor((Date.now() - new Date(last.date).getTime()) / 86400000);
    return days === 0 ? "Today" : days === 1 ? "Yesterday" : `${days} days ago`;
  })();

  const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - weekStart.getDay()); weekStart.setHours(0, 0, 0, 0);
  const weekKey = weekStart.toISOString().slice(0, 10);
  const weekWorkouts = state.workoutHistory.filter((h) => h.date >= weekKey).length;
  const weekCheckinDays = Object.keys(state.checkins).filter((d) => d >= weekKey).length;
  const weekRestDays = Object.keys(state.restDays).filter((d) => d >= weekKey).length;
  const weekXp = state.xpLog.filter((x) => x.date >= weekKey && x.amount > 0).reduce((s, x) => s + x.amount, 0);

  const quickActions = [
    { icon: Dumbbell, label: "Workout", onClick: onGoTrain },
    { icon: Camera, label: "Food", onClick: onGoScan },
    { icon: Utensils, label: "Recipes", onClick: onGoNutrition },
    { icon: Sparkles, label: "Coach", onClick: onOpenCoach },
  ];

  return (
    <div className="space-y-4 mt-1">
      {showMissedPrompt && (
        <Glass tint={C.amberDim}>
          <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: C.textFaint }}>Yesterday</p>
          <p className="text-sm font-semibold mb-1" style={{ color: C.text }}>No session logged — that's completely fine.</p>
          <p className="text-xs mb-4" style={{ color: C.textDim }}>Nothing stacks up. Today's session is exactly where you left off.</p>
          <div className="grid grid-cols-3 gap-2">
            <GhostButton onClick={() => onSkipMissed(yesterdayKey)}>Continue</GhostButton>
            <GhostButton onClick={() => onMarkRestDay(yesterdayKey)}>Recovery</GhostButton>
            <GhostButton onClick={() => onSkipMissed(yesterdayKey)}>Skip</GhostButton>
          </div>
        </Glass>
      )}

      {/* TODAY — the adaptive primary state */}
      {recovery.status === "low" && !workoutDoneToday ? (
        <Glass tint={C.redDim}>
          <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: C.textFaint }}>Today</p>
          <p className="text-xl font-bold mb-2" style={{ color: C.text }}>Recovery Day</p>
          <p className="text-sm mb-4" style={{ color: C.textDim }}>{recovery.message}</p>
          <div className="grid grid-cols-2 gap-2">
            <GhostButton onClick={onGoTrain}>Light Mobility</GhostButton>
            <PrimaryButton onClick={() => showToast("Recovery day noted — rest well.")}>Rest</PrimaryButton>
          </div>
        </Glass>
      ) : workoutDoneToday ? (
        <Glass tint={C.mintDim}>
          <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: C.textFaint }}>Today</p>
          <div className="flex items-center gap-2 mb-2">
            <div className="rounded-full p-1" style={{ background: C.mintDim }}><Check size={14} style={{ color: C.mint }} /></div>
            <p className="text-xl font-bold" style={{ color: C.text }}>{todayEntries[0].name} Completed</p>
          </div>
          <p className="text-sm mb-4" style={{ color: C.textDim }}>Nice work. Recover well before your next session.</p>
          <GhostButton onClick={onGoTrain} icon={Clock}>View Workout</GhostButton>
          <p className="text-[11px] mt-3" style={{ color: C.textFaint }}>Up next: {nextWorkoutForCourse(state, "c1")?.type}</p>
        </Glass>
      ) : (
        <Glass onClick={onGoTrain} className="cursor-pointer" tint={C.violetDim}>
          <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: C.textFaint }}>Today</p>
          <p className="text-xl font-bold mb-2" style={{ color: C.text }}>{todaysWorkout.name}</p>
          <div className="flex gap-2 mb-4">
            <Pill tone="violet"><Clock size={11} className="inline mr-1" />{todaysWorkout.duration} min</Pill>
            <Pill tone="amber">Ready to train</Pill>
          </div>
          <PrimaryButton icon={Dumbbell}>Start Workout</PrimaryButton>
          {isFirstEver && <p className="text-[11px] mt-3 text-center" style={{ color: C.textFaint }}>Your first session starts here.</p>}
        </Glass>
      )}

      <div className="relative overflow-hidden rounded-2xl p-5" style={{ background: C.glassBg, border: `1px solid ${C.glassBorder}` }}>
        <svg width="140" height="140" viewBox="0 0 140 140" style={{ position: "absolute", top: -30, right: -30, opacity: 0.5 }}>
          <circle cx="70" cy="70" r="68" stroke={C.violet} strokeOpacity="0.25" strokeWidth="1" fill="none" />
          <circle cx="70" cy="70" r="46" stroke={C.violet} strokeOpacity="0.18" strokeWidth="1" fill="none" />
        </svg>
        <div className="relative flex items-start gap-2 mb-2">
          <VeyaMark size={14} />
          <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: C.textFaint }}>{quote.theme}</p>
        </div>
        <p className="relative text-lg font-semibold leading-snug" style={{ color: C.text }}>{quote.text}</p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-4 gap-2">
        {quickActions.map((a) => (
          <button key={a.label} onClick={a.onClick} className="flex flex-col items-center gap-1.5 rounded-2xl py-3" style={{ background: C.fill }}>
            <a.icon size={18} style={{ color: C.violet }} />
            <span className="text-[10px] font-medium" style={{ color: C.textDim }}>{a.label}</span>
          </button>
        ))}
      </div>

      <Glass>
        <div className="flex items-center gap-4">
          <div style={state.equippedCosmetics?.glow ? { borderRadius: "50%", boxShadow: `0 0 28px 4px ${C.violetDim}` } : undefined}>
            <Ring size={92} stroke={8} pct={workoutDoneToday ? 1 : 0.08} color={C.amber}>
              <Ring size={62} stroke={7} pct={Math.min(1, caloriesToday / target)} color={C.mint}>
                <Flame size={18} style={{ color: C.amber }} />
              </Ring>
            </Ring>
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium" style={{ color: C.textFaint }}>Momentum</p>
            <p className="text-lg font-bold" style={{ color: C.text }}>{state.profile.streak}-day streak</p>
            <p className="text-xs mt-0.5" style={{ color: C.textDim }}>Outer ring: training · Inner ring: nutrition</p>
          </div>
        </div>
      </Glass>

      {/* Recovery snapshot */}
      <Glass tint={C[rm.tone + "Dim"] || C.violetDim}>
        <div className="flex items-center gap-3 mb-3">
          <div className="rounded-2xl p-2.5" style={{ background: C[rm.tone + "Dim"] }}><rm.icon size={18} style={{ color: C[rm.tone] }} /></div>
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: C.textFaint }}>Recovery</p>
            <p className="text-sm font-semibold" style={{ color: C.text }}>{recovery.label}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-y-2 text-xs">
          <div><p style={{ color: C.textFaint }}>Sleep</p><p className="font-semibold" style={{ color: C.text }}>{typeof todaysCheckin?.sleepHours === "number" ? `${todaysCheckin.sleepHours}h` : "Not logged"}</p></div>
          <div><p style={{ color: C.textFaint }}>Energy</p><p className="font-semibold" style={{ color: C.text }}>{energyLabel(todaysCheckin?.energy)}</p></div>
          <div><p style={{ color: C.textFaint }}>Last workout</p><p className="font-semibold" style={{ color: C.text }}>{lastWorkoutLabel}</p></div>
          <div><p style={{ color: C.textFaint }}>Status</p><p className="font-semibold" style={{ color: C.text }}>{recovery.label}</p></div>
        </div>
      </Glass>

      {!morningDone ? (
        <Glass onClick={onOpenMorning} className="cursor-pointer" tint={C.violetDim}>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl p-2.5" style={{ background: C.violetDim }}><Sunrise size={18} style={{ color: C.violet }} /></div>
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: C.text }}>Morning check-in</p>
              <p className="text-xs" style={{ color: C.textDim }}>Sleep and energy · 30 seconds</p>
            </div>
            <ChevronRight size={16} style={{ color: C.textFaint }} />
          </div>
        </Glass>
      ) : (
        <Glass>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: C.textFaint }}>Today's check-in</p>
            <button onClick={onOpenMorning}><Pencil size={13} style={{ color: C.textFaint }} /></button>
          </div>
          <div className="flex justify-between text-center">
            <CheckinStat icon={Moon} label="Sleep" value={`${todaysCheckin.sleepHours}h`} />
            <CheckinStat icon={Zap} label="Energy" value={todaysCheckin.energy} />
            <CheckinStat icon={Droplet} label="Water" value={`${todaysCheckin.water ?? 0}`} />
            <CheckinStat icon={Smile} label="Mood" value={todaysCheckin.mood ?? "—"} />
          </div>
        </Glass>
      )}

      {morningDone && !eveningDone && hour >= 17 && (
        <Glass onClick={onOpenEvening} className="cursor-pointer" tint={C.mintDim}>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl p-2.5" style={{ background: C.mintDim }}><MoonStar size={18} style={{ color: C.mint }} /></div>
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: C.text }}>Evening check-in</p>
              <p className="text-xs" style={{ color: C.textDim }}>How today went · 20 seconds</p>
            </div>
            <ChevronRight size={16} style={{ color: C.textFaint }} />
          </div>
        </Glass>
      )}

      {/* This week */}
      <Glass onClick={onGoProgress} className="cursor-pointer">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: C.textFaint }}>This Week</p>
          <ChevronRight size={16} style={{ color: C.textFaint }} />
        </div>
        <div className="flex justify-between text-center">
          <div><p className="text-lg font-bold" style={{ color: C.text }}>{weekWorkouts}</p><p className="text-[10px]" style={{ color: C.textFaint }}>Workouts</p></div>
          <div><p className="text-lg font-bold" style={{ color: C.text }}>{weekRestDays}</p><p className="text-[10px]" style={{ color: C.textFaint }}>Rest days</p></div>
          <div><p className="text-lg font-bold" style={{ color: C.text }}>{weekCheckinDays}</p><p className="text-[10px]" style={{ color: C.textFaint }}>Check-in days</p></div>
          <div><p className="text-lg font-bold" style={{ color: C.amber }}>+{weekXp}</p><p className="text-[10px]" style={{ color: C.textFaint }}>XP</p></div>
        </div>
        <p className="text-[11px] mt-3 text-center" style={{ color: C.textFaint }}>{state.profile.streak}-day consistency streak</p>
      </Glass>

      {/* Nutrition snapshot */}
      <Glass onClick={onGoScan} className="cursor-pointer">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: C.textFaint }}>Nutrition</p>
          <ChevronRight size={16} style={{ color: C.textFaint }} />
        </div>
        {todaysFood.length === 0 ? (
          <p className="text-sm" style={{ color: C.textDim }}>Tell Veya what you ate.</p>
        ) : (
          <>
            <div className="flex items-baseline gap-1.5">
              <p className="text-2xl font-bold" style={{ color: C.text }}>{caloriesToday}</p>
              <p className="text-sm" style={{ color: C.textFaint }}>/ {target} kcal today</p>
            </div>
            <p className="text-xs mt-1" style={{ color: C.textDim }}>{todaysFood.length} meal{todaysFood.length !== 1 ? "s" : ""} logged · last: {todaysFood[todaysFood.length - 1].name}</p>
            <div className="h-2 rounded-full mt-3 overflow-hidden" style={{ background: C.fill }}>
              <div className="h-full rounded-full" style={{ width: `${Math.min(100, (caloriesToday / target) * 100)}%`, background: C.mint }} />
            </div>
          </>
        )}
      </Glass>

      <Glass onClick={onOpenLesson} className="cursor-pointer" tint={C.mintDim}>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl p-2.5" style={{ background: C.mintDim }}><BookOpen size={18} style={{ color: C.mint }} /></div>
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: C.text }}>Today's insight{lessonRead && " · read"}</p>
            <p className="text-xs" style={{ color: C.textDim }}>{lesson.title}</p>
          </div>
          <ChevronRight size={16} style={{ color: C.textFaint }} />
        </div>
      </Glass>

      <Glass>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: C.textFaint }}>Level {level} — {levelTitle}</p>
            <p className="text-sm font-medium mt-0.5" style={{ color: C.text }}>{into} / {need} XP to next level</p>
          </div>
          <div className="rounded-2xl p-2.5" style={{ background: C.amberDim }}><Zap size={18} style={{ color: C.amber }} /></div>
        </div>
        <div className="h-2 rounded-full mt-3 overflow-hidden" style={{ background: C.fill }}>
          <div className="h-full rounded-full" style={{ width: `${(into / need) * 100}%`, background: C.amber }} />
        </div>
      </Glass>

      <Glass onClick={onOpenCoach} className="cursor-pointer" tint={C.violetDim}>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl p-2.5" style={{ background: C.violetDim }}><Sparkles size={18} style={{ color: C.violet }} /></div>
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: C.text }}>Your next decision, made simpler.</p>
            <p className="text-xs" style={{ color: C.textDim }}>"What should I do today?"</p>
          </div>
          <ChevronRight size={16} style={{ color: C.textFaint }} />
        </div>
      </Glass>
    </div>
  );
}

function CheckinStat({ icon: Icon, label, value }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <Icon size={16} style={{ color: C.violet }} />
      <p className="text-sm font-bold" style={{ color: C.text }}>{value}</p>
      <p className="text-[10px]" style={{ color: C.textFaint }}>{label}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  TRAIN TAB                                                           */
/* ------------------------------------------------------------------ */
function TrainTab({ state, todaysWorkout, onComplete, showToast, ownedProductIds, onOpenStore, onSetExerciseImage, isAdmin }) {
  const [active, setActive] = useState(null);
  const [view, setView] = useState("list");
  const [exerciseDetail, setExerciseDetail] = useState(null);
  const [query, setQuery] = useState("");
  const [collectionFilter, setCollectionFilter] = useState(null);
  const equipmentProfile = state.profile.trainingMode === "gym" && state.profile.equipmentProfile.length === 0
    ? ["dumbbells", "bands", "pullup_bar", "bench", "barbell", "gym"]
    : state.profile.equipmentProfile;

  if (active) return <WorkoutSession workout={active} equipmentProfile={equipmentProfile} exerciseImages={state.exerciseImages} onSetExerciseImage={onSetExerciseImage} isAdmin={isAdmin} onExit={() => setActive(null)} onComplete={(w) => { onComplete(w); setActive(null); }} />;

  const filteredEx = EXERCISES.filter((e) => e.name.toLowerCase().includes(query.toLowerCase()) || e.muscle.toLowerCase().includes(query.toLowerCase()));
  const accessibleWorkouts = WORKOUTS.filter((w) => {
    const linked = PRODUCTS.find((p) => p.courseId === w.courseId);
    return !linked || ownedProductIds.has(linked.id);
  });
  const visibleWorkouts = collectionFilter ? accessibleWorkouts.filter((w) => w.tags.includes(collectionFilter)) : accessibleWorkouts;

  return (
    <div className="space-y-6 mt-1">
      <div className="flex gap-2">
        {["list", "courses", "library", "history"].map((v) => (
          <button key={v} onClick={() => setView(v)} className="px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize" style={{ background: view === v ? C.text : C.fill, color: view === v ? C.bg : C.textDim }}>
            {v === "list" ? "Workouts" : v}
          </button>
        ))}
      </div>

      {view === "list" && (
        <div className="space-y-4">
          <Glass tint={C.amberDim}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: C.amber }}>Recommended today</p>
            <p className="text-lg font-bold mb-3" style={{ color: C.text }}>{todaysWorkout.name}</p>
            <PrimaryButton onClick={() => setActive(todaysWorkout)} icon={Dumbbell}>Start Workout</PrimaryButton>
          </Glass>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2 px-1" style={{ color: C.textFaint }}>Collections</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {COLLECTIONS.map((c) => (
                <button key={c.id} onClick={() => setCollectionFilter(collectionFilter === c.filter ? null : c.filter)}
                  className="shrink-0 rounded-2xl px-3.5 py-2.5 text-left" style={{ minWidth: 160, background: collectionFilter === c.filter ? C.violetDim : C.fill, border: `1px solid ${collectionFilter === c.filter ? C.violet : C.glassBorder}` }}>
                  <p className="text-xs font-semibold" style={{ color: collectionFilter === c.filter ? C.violet : C.text }}>{c.name}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: C.textFaint }}>{c.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {visibleWorkouts.map((w) => (
              <Glass key={w.id} onClick={() => setActive(w)} className="cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm" style={{ color: C.text }}>{w.name}</p>
                    <p className="text-xs mt-1" style={{ color: C.textFaint }}>{w.type} · {w.duration} min · {w.equipment}</p>
                  </div>
                  <ChevronRight size={16} style={{ color: C.textFaint }} />
                </div>
              </Glass>
            ))}
          </div>
        </div>
      )}

      {view === "courses" && (
        <div className="space-y-3">
          {COURSES.map((c) => {
            const linkedProduct = PRODUCTS.find((p) => p.courseId === c.id);
            const locked = linkedProduct && !ownedProductIds.has(linkedProduct.id);
            const totalSessions = c.weeks * c.sessionsPerWeek;
            const { courseWorkouts, nextIndex } = courseProgress(state, c.id);
            const sessionsDone = state.workoutHistory.filter((h) => h.courseId === c.id).length;
            const pct = Math.min(100, Math.round((sessionsDone / totalSessions) * 100));
            const completed = state.courseBadges?.includes(c.id);
            const nextWorkout = courseWorkouts[nextIndex];
            return (
              <Glass key={c.id}>
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold text-sm" style={{ color: C.text }}>{c.name}</p>
                  {completed ? <Pill tone="mint"><Award size={11} className="inline mr-1" />{c.badge}</Pill> : linkedProduct && (locked ? <Pill tone="amber">Premium</Pill> : <Pill tone="mint">Owned</Pill>)}
                </div>
                <p className="text-xs mt-1 mb-3" style={{ color: C.textFaint }}>{c.weeks} week{c.weeks > 1 ? "s" : ""} · {c.sessionsPerWeek}× / week · {c.level}</p>
                {locked ? (
                  <GhostButton icon={ShoppingBag} onClick={onOpenStore}>Unlock in Store — ${linkedProduct.price}</GhostButton>
                ) : (
                  <>
                    <div className="h-2 rounded-full overflow-hidden mb-2" style={{ background: C.fill }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: completed ? C.mint : C.violet }} />
                    </div>
                    <p className="text-xs mb-3" style={{ color: C.textDim }}>{completed ? `Completed · +${c.rewardXp} XP earned` : `${pct}% complete · ${sessionsDone}/${totalSessions} sessions`}</p>
                    {nextWorkout && (
                      <button onClick={() => setActive(nextWorkout)} className="w-full flex items-center justify-between rounded-2xl p-3" style={{ background: C.violetDim }}>
                        <div className="text-left">
                          <p className="text-[10px] font-semibold uppercase" style={{ color: C.violet }}>Up next</p>
                          <p className="text-xs font-medium" style={{ color: C.text }}>{nextWorkout.type}</p>
                        </div>
                        <ChevronRight size={15} style={{ color: C.violet }} />
                      </button>
                    )}
                  </>
                )}
              </Glass>
            );
          })}
        </div>
      )}

      {view === "library" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-2xl px-3.5 py-2.5" style={{ background: C.fill }}>
            <Search size={16} style={{ color: C.textFaint }} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search exercises" className="bg-transparent outline-none text-sm flex-1" style={{ color: C.text }} />
          </div>
          {filteredEx.map((ex) => {
            const poseConfig = EXERCISE_POSES[ex.id];
            return (
              <Glass key={ex.id} onClick={() => setExerciseDetail(ex)} className="cursor-pointer">
                <div className="flex items-center gap-3">
                  {poseConfig && (
                    <div className="rounded-xl shrink-0" style={{ background: C.fill, padding: 2 }}>
                      <StickFigure pose={POSES[poseConfig.start]} size={40} />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-sm" style={{ color: C.text }}>{ex.name}</p>
                    <p className="text-xs mt-1" style={{ color: C.textFaint }}>{ex.muscle} · {ex.equipment}</p>
                  </div>
                  <Pill tone="violet">{ex.difficulty}</Pill>
                </div>
              </Glass>
            );
          })}
        </div>
      )}

      {view === "history" && (
        state.workoutHistory.length === 0 ? (
          <EmptyState icon={Clock} title="No workouts yet" sub="Sessions you complete will show up here, most recent first." />
        ) : (
          <div className="space-y-2">
            {[...state.workoutHistory].reverse().map((h) => {
              const w = WORKOUTS.find((x) => x.id === h.workoutId);
              const d = new Date(h.date + "T00:00:00");
              return (
                <Glass key={h.id} padded={false}>
                  <div className="flex items-center justify-between p-3.5">
                    <div>
                      <p className="text-sm font-semibold" style={{ color: C.text }}>{h.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: C.textFaint }}>{d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}{w ? ` · ${w.duration} min` : ""}</p>
                    </div>
                    <div className="rounded-full p-1.5" style={{ background: C.mintDim }}><Check size={13} style={{ color: C.mint }} /></div>
                  </div>
                </Glass>
              );
            })}
          </div>
        )
      )}

      {exerciseDetail && <ExerciseDetailSheet exercise={exerciseDetail} images={state.exerciseImages[exerciseDetail.id]} onSetImage={onSetExerciseImage} isAdmin={isAdmin} onClose={() => setExerciseDetail(null)} />}
    </div>
  );
}

function ExerciseDetailSheet({ exercise, images, onSetImage, onClose }) {
  const [editOpen, setEditOpen] = useState(false);
  const [startUrl, setStartUrl] = useState(images?.start || "");
  const [endUrl, setEndUrl] = useState(images?.end || "");
  const [muscleUrl, setMuscleUrl] = useState(images?.muscleMap || "");

  function save() {
    onSetImage?.(exercise.id, "start", startUrl);
    onSetImage?.(exercise.id, "end", endUrl);
    onSetImage?.(exercise.id, "muscleMap", muscleUrl);
    setEditOpen(false);
  }

  return (
    <Sheet title={exercise.name} onClose={onClose}>
      <div className="space-y-5">
        <ExercisePoseCard exerciseId={exercise.id} images={images} />
        <MuscleMapCard muscleText={exercise.muscle} imageUrl={images?.muscleMap} />

        <button onClick={() => setEditOpen((o) => !o)} className="w-full flex items-center justify-between rounded-2xl p-3" style={{ background: C.fill }}>
          <span className="text-xs font-medium" style={{ color: C.textDim }}>{images?.start || images?.end || images?.muscleMap ? "Edit your images" : "Add your own images"}</span>
          <ChevronRight size={14} style={{ color: C.textFaint, transform: editOpen ? "rotate(90deg)" : "none" }} />
        </button>
        {editOpen && (
          <div className="rounded-2xl p-3.5 space-y-3" style={{ background: C.fill }}>
            <p className="text-[11px]" style={{ color: C.textFaint }}>Paste a direct image URL (from your own hosting) for each. Leave blank to keep the built-in illustration.</p>
            <div>
              <p className="text-[10px] font-semibold uppercase mb-1" style={{ color: C.textFaint }}>Start position photo URL</p>
              <input value={startUrl} onChange={(e) => setStartUrl(e.target.value)} placeholder="https://…" className="w-full rounded-xl p-2.5 text-xs outline-none" style={{ background: C.glassBg, color: C.text, border: `1px solid ${C.glassBorder}` }} />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase mb-1" style={{ color: C.textFaint }}>End position photo URL</p>
              <input value={endUrl} onChange={(e) => setEndUrl(e.target.value)} placeholder="https://…" className="w-full rounded-xl p-2.5 text-xs outline-none" style={{ background: C.glassBg, color: C.text, border: `1px solid ${C.glassBorder}` }} />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase mb-1" style={{ color: C.textFaint }}>Muscle diagram photo URL</p>
              <input value={muscleUrl} onChange={(e) => setMuscleUrl(e.target.value)} placeholder="https://…" className="w-full rounded-xl p-2.5 text-xs outline-none" style={{ background: C.glassBg, color: C.text, border: `1px solid ${C.glassBorder}` }} />
            </div>
            <PrimaryButton onClick={save}>Save Images</PrimaryButton>
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          <Pill tone="violet">{exercise.muscle}</Pill>
          <Pill tone="amber">{exercise.equipment}</Pill>
          <Pill tone="mint">{exercise.difficulty}</Pill>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase mb-2" style={{ color: C.textFaint }}>How to do it</p>
          <div className="space-y-2">
            {splitSteps(exercise.instructions).map((step, i) => (
              <div key={i} className="flex gap-2.5">
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: C.violetDim }}>
                  <span className="text-[10px] font-bold" style={{ color: C.violet }}>{i + 1}</span>
                </div>
                <p className="text-sm" style={{ color: C.text }}>{step}</p>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase mb-2" style={{ color: C.textFaint }}>Watch for</p>
          <div className="rounded-2xl p-3" style={{ background: C.redDim }}>
            <p className="text-sm" style={{ color: C.text }}>{exercise.mistakes}</p>
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase mb-2" style={{ color: C.textFaint }}>Beginner-friendly option</p>
          <div className="rounded-2xl p-3" style={{ background: C.mintDim }}>
            <p className="text-sm" style={{ color: C.text }}>{exercise.alt}</p>
          </div>
        </div>
      </div>
    </Sheet>
  );
}

function WorkoutSession({ workout, equipmentProfile, exerciseImages, onSetExerciseImage, isAdmin, onExit, onComplete }) {
  const [done, setDone] = useState({});
  const [detailEx, setDetailEx] = useState(null);
  const allDone = workout.exercises.every((e) => done[e.ex]);
  return (
    <div className="mt-1 space-y-4">
      <button onClick={onExit} className="flex items-center gap-1.5 text-sm font-medium" style={{ color: C.textDim }}><ArrowLeft size={16} /> Exit workout</button>
      <div>
        <p className="text-xl font-bold" style={{ color: C.text }}>{workout.name}</p>
        <p className="text-xs mt-1" style={{ color: C.textFaint }}>{workout.duration} min · {workout.exercises.length} exercises</p>
      </div>
      <div className="space-y-3">
        {workout.exercises.map((e) => {
          const { exercise: ex, substituted, originalName } = resolveExercise(e.ex, equipmentProfile || []);
          const complete = !!done[e.ex];
          return (
            <Glass key={e.ex} style={{ opacity: complete ? 0.6 : 1 }}>
              <div className="flex items-center justify-between">
                <div className="flex-1 cursor-pointer" onClick={() => setDone((d) => ({ ...d, [e.ex]: !d[e.ex] }))}>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="font-semibold text-sm" style={{ color: C.text, textDecoration: complete ? "line-through" : "none" }}>{ex.name}</p>
                    {substituted && <Pill tone="amber">Adapted</Pill>}
                  </div>
                  {substituted && <p className="text-[10px] mt-0.5" style={{ color: C.textFaint }}>Swapped from {originalName} — no equipment needed</p>}
                  <p className="text-xs mt-1" style={{ color: C.textFaint }}>{e.sets} sets × {e.reps}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setDetailEx(ex)} className="text-[11px] font-semibold px-2.5 py-1.5 rounded-full" style={{ background: C.violetDim, color: C.violet }}>How to</button>
                  <button onClick={() => setDone((d) => ({ ...d, [e.ex]: !d[e.ex] }))} className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: complete ? C.mint : C.fill }}>{complete && <Check size={15} color="#0A0B0D" />}</button>
                </div>
              </div>
            </Glass>
          );
        })}
      </div>
      <PrimaryButton onClick={() => onComplete(workout)} icon={Trophy}>{allDone ? "Finish Workout" : "Finish Anyway"}</PrimaryButton>
      {detailEx && <ExerciseDetailSheet exercise={detailEx} images={exerciseImages?.[detailEx.id]} onSetImage={onSetExerciseImage} isAdmin={isAdmin} onClose={() => setDetailEx(null)} />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SCAN TAB                                                            */
/* ------------------------------------------------------------------ */
function ScanTab({ onLog, onLogBatch, showToast }) {
  const [mode, setMode] = useState("choose");
  const [image, setImage] = useState(null);
  const [description, setDescription] = useState("");
  const [items, setItems] = useState(null);
  const [confidence, setConfidence] = useState("medium");
  const [error, setError] = useState("");
  const [meal, setMeal] = useState(defaultMealSlot());
  const fileRef = useRef(null);

  function defaultMealSlot() {
    const h = new Date().getHours();
    if (h < 11) return "Breakfast";
    if (h < 16) return "Lunch";
    if (h < 21) return "Dinner";
    return "Snacks";
  }

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      setImage({ data: dataUrl.split(",")[1], mediaType: file.type, previewUrl: dataUrl });
      setMode("preview"); setError("");
    };
    reader.readAsDataURL(file);
  };

  const FOOD_AI_SCHEMA = "Reply with ONLY a raw JSON object, no markdown fences, no commentary, in exactly this shape: {\"items\":[{\"food_name\":string,\"portion\":string,\"calories\":number,\"protein_g\":number,\"carbs_g\":number,\"fat_g\":number,\"density\":\"green\"|\"yellow\"|\"red\"}],\"confidence\":\"low\"|\"medium\"|\"high\"}. density means nutrient density, not a restriction: green = nutrient-dense (vegetables, fruit, lean protein), yellow = balanced/mixed, red = calorie-dense (fried, sugary, highly processed). Always split a meal into its separate components as separate items — e.g. \"rice with chicken curry, dhal and pol sambol\" becomes four items: rice, chicken curry, dhal curry, pol sambol. Do not merge a whole meal into one item. Recognize common Sri Lankan dishes and their spelling variations: rice, chicken curry, fish curry, dhal/parippu, pol sambol, seeni sambol, katta sambol, gotukola sambol, mallung, string hoppers, hoppers, egg hoppers, kottu, paratha, roti, pittu, kiribath, lamprais, fried rice, devilled chicken/fish, watalappam, curd, milk tea, plain tea, and similar dishes from other cuisines. These are estimates, never exact measurements — if unsure about an item, still include your best guess and reflect the uncertainty via a lower overall confidence rather than omitting it.";

  async function analyzeImage() {
    setMode("analyzing"); setError("");
    try {
      const text = await callClaude({
        system: `You are the Veya food AI. Analyze the food photo and identify each visible food component separately. ${FOOD_AI_SCHEMA}`,
        messages: [{ role: "user", content: "Identify and estimate the nutrition of every food in this photo." }],
        image: { data: image.data, mediaType: image.mediaType },
      });
      const parsed = parseJsonLoose(text);
      setItems(parsed.items || []); setConfidence(parsed.confidence || "medium"); setMode("result");
    } catch (e) { setError("We couldn't estimate this meal accurately. Try again or add it manually."); setMode("preview"); }
  }

  async function analyzeDescription() {
    if (!description.trim()) return;
    setMode("analyzing"); setError("");
    try {
      const text = await callClaude({
        system: `You are the Veya food AI. Parse the user's natural-language meal description into its separate food items. ${FOOD_AI_SCHEMA}`,
        messages: [{ role: "user", content: `Parse and estimate the nutrition of this meal: "${description}"` }],
      });
      const parsed = parseJsonLoose(text);
      setItems(parsed.items || []); setConfidence(parsed.confidence || "medium"); setMode("result");
    } catch (e) { setError("We couldn't estimate that meal. Try rephrasing or add it manually."); setMode("describe"); }
  }

  function reset() { setMode("choose"); setImage(null); setDescription(""); setItems(null); setError(""); }
  function confirmAdd() {
    const source = image ? "scanned" : "described";
    const built = items.map((it) => ({ name: it.food_name, portion: it.portion, calories: Math.round(it.calories) || 0, protein: Math.round(it.protein_g) || 0, carbs: Math.round(it.carbs_g) || 0, fat: Math.round(it.fat_g) || 0, source, confidence, density: it.density }));
    onLogBatch(built, meal);
    showToast(`${built.length} item${built.length !== 1 ? "s" : ""} added · +20 XP`); reset();
  }

  return (
    <div className="mt-1 space-y-4">
      <div><p className="text-xl font-bold" style={{ color: C.text }}>Scan a meal</p><p className="text-xs mt-1" style={{ color: C.textFaint }}>AI-estimated nutrition — recognizes multi-item and Sri Lankan meals.</p></div>

      {mode === "choose" && (
        <div className="space-y-3">
          <Glass>
            <div className="flex flex-col items-center py-6 text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: C.violetDim }}><Camera size={26} style={{ color: C.violet }} /></div>
              <p className="text-sm font-semibold mb-1" style={{ color: C.text }}>Take or upload a photo</p>
              <p className="text-xs mb-4" style={{ color: C.textFaint }}>Our AI will separate and estimate each food</p>
              <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
              <PrimaryButton icon={ImagePlus} onClick={() => fileRef.current?.click()}>Choose Photo</PrimaryButton>
            </div>
          </Glass>
          <GhostButton icon={Pencil} onClick={() => setMode("describe")}>Describe food manually</GhostButton>
          <GhostButton icon={Plus} onClick={() => setMode("manual")}>Enter nutrition manually</GhostButton>
        </div>
      )}

      {mode === "preview" && image && (
        <div className="space-y-3">
          <img src={image.previewUrl} alt="Food preview" className="w-full rounded-3xl object-cover" style={{ maxHeight: 280, border: `1px solid ${C.glassBorder}` }} />
          {error && <ErrorNote text={error} />}
          <PrimaryButton icon={Sparkles} onClick={analyzeImage}>Analyze with AI</PrimaryButton>
          <GhostButton icon={RefreshCw} onClick={reset}>Scan Again</GhostButton>
        </div>
      )}

      {mode === "describe" && (
        <div className="space-y-3">
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder='e.g. "rice with chicken curry, dhal and pol sambol"' className="w-full rounded-2xl p-3.5 text-sm outline-none resize-none" style={{ background: C.fill, color: C.text, border: `1px solid ${C.glassBorder}` }} />
          {error && <ErrorNote text={error} />}
          <PrimaryButton icon={Sparkles} disabled={!description.trim()} onClick={analyzeDescription}>Estimate Nutrition</PrimaryButton>
          <GhostButton onClick={reset}>Cancel</GhostButton>
        </div>
      )}

      {mode === "analyzing" && (
        <Glass><div className="flex flex-col items-center py-10"><Loader2 size={26} className="animate-spin mb-3" style={{ color: C.violet }} /><p className="text-sm font-medium" style={{ color: C.text }}>Analyzing your meal…</p></div></Glass>
      )}

      {mode === "manual" && <ManualEntry onCancel={reset} onSave={(entry) => { onLog({ ...entry, source: "manual" }, meal); showToast("Added to food log · +20 XP"); reset(); }} meal={meal} setMeal={setMeal} />}
      {mode === "result" && items && <MultiItemEditor items={items} setItems={setItems} confidence={confidence} meal={meal} setMeal={setMeal} onConfirm={confirmAdd} onScanAgain={reset} isImage={!!image} />}
    </div>
  );
}

function MealPicker({ meal, setMeal }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {["Breakfast", "Lunch", "Dinner", "Snacks"].map((m) => (
        <button key={m} onClick={() => setMeal(m)} className="px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: meal === m ? C.text : C.fill, color: meal === m ? "#0A0B0D" : C.textDim }}>{m}</button>
      ))}
    </div>
  );
}

function MultiItemEditor({ items, setItems, confidence, meal, setMeal, onConfirm, onScanAgain, isImage }) {
  const totals = items.reduce((a, i) => ({ calories: a.calories + (i.calories || 0), protein: a.protein + (i.protein_g || 0), carbs: a.carbs + (i.carbs_g || 0), fat: a.fat + (i.fat_g || 0) }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  function updateItem(idx, key, val) { setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [key]: val } : it))); }
  function removeItem(idx) { setItems((prev) => prev.filter((_, i) => i !== idx)); }
  function addBlank() { setItems((prev) => [...prev, { food_name: "New item", portion: "", calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, density: "yellow" }]); }

  return (
    <div className="space-y-3">
      <Glass>
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-semibold" style={{ color: C.text }}>{items.length} item{items.length !== 1 ? "s" : ""} detected</p>
          <Pill tone={confidence === "high" ? "mint" : confidence === "low" ? "red" : "amber"}>{confidence} confidence</Pill>
        </div>
        <p className="text-xs" style={{ color: C.textFaint }}>{isImage ? "AI photo estimate" : "AI estimate"} — not exact. Edit anything below.</p>
      </Glass>

      {items.map((item, idx) => {
        const density = DENSITY_META[classifyDensity({ calories: item.calories, protein: item.protein_g, carbs: item.carbs_g, fat: item.fat_g, density: item.density })];
        return (
          <Glass key={idx}>
            <div className="flex items-center justify-between mb-1">
              <input value={item.food_name} onChange={(e) => updateItem(idx, "food_name", e.target.value)} className="bg-transparent outline-none font-semibold text-sm flex-1" style={{ color: C.text }} />
              <div className="flex items-center gap-2">
                <Pill tone={density.tone}>{density.label}</Pill>
                <button onClick={() => removeItem(idx)} className="p-1 rounded-full" style={{ background: C.fill }}><X size={12} style={{ color: C.textFaint }} /></button>
              </div>
            </div>
            {item.portion && <p className="text-xs mb-2" style={{ color: C.textFaint }}>{item.portion}</p>}
            <div className="grid grid-cols-4 gap-2">
              <MiniNum label="kcal" value={item.calories} onChange={(v) => updateItem(idx, "calories", v)} />
              <MiniNum label="P" value={item.protein_g} onChange={(v) => updateItem(idx, "protein_g", v)} />
              <MiniNum label="C" value={item.carbs_g} onChange={(v) => updateItem(idx, "carbs_g", v)} />
              <MiniNum label="F" value={item.fat_g} onChange={(v) => updateItem(idx, "fat_g", v)} />
            </div>
          </Glass>
        );
      })}

      <GhostButton icon={Plus} onClick={addBlank}>Add Another Item</GhostButton>

      <Glass>
        <p className="text-xs font-semibold uppercase mb-2" style={{ color: C.textFaint }}>Meal total</p>
        <p className="text-lg font-bold mb-3" style={{ color: C.text }}>{Math.round(totals.calories)} kcal · P{Math.round(totals.protein)} C{Math.round(totals.carbs)} F{Math.round(totals.fat)}</p>
        <p className="text-xs font-semibold uppercase mb-2" style={{ color: C.textFaint }}>Meal</p>
        <MealPicker meal={meal} setMeal={setMeal} />
      </Glass>

      <div className="space-y-2">
        <PrimaryButton icon={Plus} disabled={items.length === 0} onClick={onConfirm}>Add {items.length} Item{items.length !== 1 ? "s" : ""} to Food Log</PrimaryButton>
        <GhostButton icon={RefreshCw} onClick={onScanAgain}>Scan Again</GhostButton>
      </div>
    </div>
  );
}

function MiniNum({ label, value, onChange }) {
  return (
    <div className="rounded-xl p-2" style={{ background: C.fill }}>
      <p className="text-[9px] font-semibold uppercase mb-0.5" style={{ color: C.textFaint }}>{label}</p>
      <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} className="bg-transparent outline-none font-bold text-sm w-full" style={{ color: C.text }} />
    </div>
  );
}

function NumField({ label, value, onChange, suffix }) {
  return (
    <div className="rounded-2xl p-3" style={{ background: C.fill }}>
      <p className="text-[10px] font-semibold uppercase mb-1" style={{ color: C.textFaint }}>{label}</p>
      <div className="flex items-baseline gap-1">
        <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} className="bg-transparent outline-none font-bold text-base w-full" style={{ color: C.text }} />
        <span className="text-xs" style={{ color: C.textFaint }}>{suffix}</span>
      </div>
    </div>
  );
}

function ManualEntry({ onCancel, onSave, meal, setMeal }) {
  const [f, setF] = useState({ name: "", calories: "", protein: "", carbs: "", fat: "" });
  const valid = f.name.trim() && f.calories !== "";
  return (
    <Glass>
      <p className="text-xs font-semibold uppercase mb-3" style={{ color: C.textFaint }}>Manual entry</p>
      <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Food name" className="w-full rounded-2xl p-3 text-sm outline-none mb-3" style={{ background: C.fill, color: C.text }} />
      <div className="grid grid-cols-2 gap-3 mb-4">
        {["calories", "protein", "carbs", "fat"].map((k) => (
          <div key={k} className="rounded-2xl p-3" style={{ background: C.fill }}>
            <p className="text-[10px] font-semibold uppercase mb-1 capitalize" style={{ color: C.textFaint }}>{k}</p>
            <input type="number" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} className="bg-transparent outline-none font-bold text-base w-full" style={{ color: C.text }} />
          </div>
        ))}
      </div>
      <p className="text-xs font-semibold uppercase mb-2" style={{ color: C.textFaint }}>Meal</p>
      <div className="mb-4"><MealPicker meal={meal} setMeal={setMeal} /></div>
      <div className="space-y-2">
        <PrimaryButton icon={Plus} disabled={!valid} onClick={() => onSave({ name: f.name, calories: Number(f.calories) || 0, protein: Number(f.protein) || 0, carbs: Number(f.carbs) || 0, fat: Number(f.fat) || 0, portion: "" })}>Add to Food Log</PrimaryButton>
        <GhostButton onClick={onCancel}>Cancel</GhostButton>
      </div>
    </Glass>
  );
}

/* ------------------------------------------------------------------ */
/*  NUTRITION TAB                                                       */
/* ------------------------------------------------------------------ */
function NutritionTab({ state, setState, todaysFood, onLog, onDelete, onAddGrocery, onToggleGrocery, onDeleteGrocery, onClearPurchased, onSetMealPlan, onExploreRecipe, showToast, session, onCompleteLesson }) {
  const [view, setView] = useState("diary");
  const [editTargets, setEditTargets] = useState(false);
  const meals = ["Breakfast", "Lunch", "Dinner", "Snacks"];
  const totals = todaysFood.reduce((a, f) => ({ calories: a.calories + f.calories, protein: a.protein + f.protein, carbs: a.carbs + f.carbs, fat: a.fat + f.fat }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  const t = state.profile.targets;

  return (
    <div className="mt-1 space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {["diary", "recipes", "planner", "grocery", "learn"].map((v) => (
          <button key={v} onClick={() => setView(v)} className="shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize" style={{ background: view === v ? C.text : C.fill, color: view === v ? C.bg : C.textDim }}>{v === "planner" ? "Meal Plan" : v}</button>
        ))}
      </div>

      {view === "diary" && (
        <>
          <Glass>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: C.textFaint }}>Today's totals</p>
              <button onClick={() => setEditTargets(true)}><Pencil size={13} style={{ color: C.textFaint }} /></button>
            </div>
            <MacroBar label="Calories" value={totals.calories} target={t.calories} color={C.mint} unit="kcal" />
            <MacroBar label="Protein" value={totals.protein} target={t.protein} color={C.violet} unit="g" />
            <MacroBar label="Carbs" value={totals.carbs} target={t.carbs} color={C.amber} unit="g" />
            <MacroBar label="Fat" value={totals.fat} target={t.fat} color={C.red} unit="g" />
          </Glass>

          {meals.map((m) => {
            const entries = todaysFood.filter((f) => f.meal === m);
            return (
              <div key={m}>
                <p className="text-xs font-semibold uppercase tracking-wide mb-2 px-1" style={{ color: C.textFaint }}>{m}</p>
                {entries.length === 0 ? (
                  <Glass style={{ padding: 16 }} padded={false}><p className="text-xs p-4" style={{ color: C.textFaint }}>Nothing logged yet.</p></Glass>
                ) : (
                  <div className="space-y-2">
                    {entries.map((e) => {
                      const d = DENSITY_META[classifyDensity(e)];
                      return (
                        <Glass key={e.id} style={{ padding: 14 }} padded={false}>
                          <div className="flex items-center justify-between p-3.5">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold" style={{ color: C.text }}>{e.name}</p>
                                <span style={{ width: 7, height: 7, borderRadius: "50%", background: d.color, display: "inline-block" }} />
                              </div>
                              <p className="text-xs mt-0.5" style={{ color: C.textFaint }}>{e.calories} kcal · P{e.protein} C{e.carbs} F{e.fat} · {e.source}</p>
                            </div>
                            <button onClick={() => onDelete(e.id)} className="p-1.5 rounded-full" style={{ background: C.fill }}><X size={13} style={{ color: C.textFaint }} /></button>
                          </div>
                        </Glass>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}

      {view === "recipes" && (
        <div className="space-y-5">
          {RECIPE_COLLECTIONS.map((col) => (
            <div key={col}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2 px-1" style={{ color: C.textFaint }}>{col}</p>
              <div className="space-y-3">
                {RECIPES.filter((r) => r.collection === col).map((r) => (
                  <RecipeCard key={r.id} recipe={r} onLog={onLog} onAddGrocery={onAddGrocery} showToast={showToast} onExplore={onExploreRecipe} explored={state.exploredRecipes?.includes(r.id)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {view === "planner" && <MealPlannerView state={state} onSetMealPlan={onSetMealPlan} onAddGrocery={onAddGrocery} showToast={showToast} />}
      {view === "grocery" && <GroceryListView list={state.groceryList} onAdd={onAddGrocery} onToggle={onToggleGrocery} onDelete={onDeleteGrocery} onClearPurchased={onClearPurchased} />}
      {view === "learn" && <LearnView completedLessons={state.completedLearnLessons} onCompleteLesson={onCompleteLesson} />}

      {editTargets && (
        <Sheet title="Daily targets" onClose={() => setEditTargets(false)}>
          <TargetsEditor targets={t} onSave={async (targets) => {
            setState((p) => ({ ...p, profile: { ...p.profile, targets } }));
            setEditTargets(false);
            if (session?.user?.id) {
              try {
                await supabase.db.update("profiles", `?user_id=eq.${session.user.id}`, { target_calories: targets.calories, target_protein: targets.protein, target_carbs: targets.carbs, target_fat: targets.fat });
              } catch (e) { showToast("Couldn't save your targets — check your connection."); }
            }
          }} />
        </Sheet>
      )}
    </div>
  );
}

function RecipeCard({ recipe, onLog, onAddGrocery, showToast, onExplore, explored }) {
  const [open, setOpen] = useState(false);
  const [estimate, setEstimate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [meal, setMeal] = useState(defaultMealSlot());
  function defaultMealSlot() {
    const h = new Date().getHours();
    return h < 11 ? "Breakfast" : h < 16 ? "Lunch" : h < 21 ? "Dinner" : "Snacks";
  }

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && !explored) onExplore(recipe.id);
  }

  async function estimate_() {
    setLoading(true); setError("");
    try {
      const system = "You are a nutrition estimation assistant inside a fitness app. Reply with ONLY a raw JSON object, no markdown fences, no commentary, in exactly this shape: {\"calories\":number,\"protein_g\":number,\"carbs_g\":number,\"fat_g\":number,\"confidence\":\"low\"|\"medium\"|\"high\",\"density\":\"green\"|\"yellow\"|\"red\"}. Ingredient quantities aren't specified, so this is a rough estimate for one typical serving — reflect that with a lower confidence, never imply certainty.";
      const text = await callClaude({ system, messages: [{ role: "user", content: `Estimate the nutrition for one serving of "${recipe.name}" made from: ${recipe.ingredients.join(", ")}.` }] });
      setEstimate(parseJsonLoose(text));
    } catch (e) { setError("Couldn't estimate this one — you can still log it manually."); }
    finally { setLoading(false); }
  }

  return (
    <Glass padded={false}>
      <div className="p-4">
        <div className="flex items-center justify-between cursor-pointer" onClick={toggle}>
          <div>
            <p className="text-sm font-semibold" style={{ color: C.text }}>{recipe.name}</p>
            <p className="text-xs mt-0.5" style={{ color: C.textFaint }}>{recipe.time} · {recipe.tags.join(" · ")}</p>
          </div>
          <ChevronRight size={16} style={{ color: C.textFaint, transform: open ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
        </div>

        {open && (
          <div className="mt-3 space-y-3">
            <div>
              <p className="text-[10px] font-semibold uppercase mb-1" style={{ color: C.textFaint }}>Ingredients</p>
              <p className="text-xs" style={{ color: C.textDim }}>{recipe.ingredients.join(", ")}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase mb-1" style={{ color: C.textFaint }}>Method</p>
              <div className="space-y-1">{recipe.steps.map((s, i) => <p key={i} className="text-xs" style={{ color: C.textDim }}>{i + 1}. {s}</p>)}</div>
            </div>

            {!estimate && !loading && (
              <GhostButton icon={Sparkles} onClick={estimate_}>Estimate Nutrition with AI</GhostButton>
            )}
            {loading && <div className="flex items-center gap-2 py-2"><Loader2 size={14} className="animate-spin" style={{ color: C.violet }} /><p className="text-xs" style={{ color: C.textDim }}>Estimating…</p></div>}
            {error && <ErrorNote text={error} />}
            {estimate && (
              <div className="rounded-2xl p-3" style={{ background: C.fill }}>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Pill tone={estimate.confidence === "high" ? "mint" : estimate.confidence === "low" ? "red" : "amber"}>{estimate.confidence} confidence</Pill>
                  <Pill tone={DENSITY_META[estimate.density]?.tone || "amber"}>{DENSITY_META[estimate.density]?.label || "Balanced"}</Pill>
                </div>
                <p className="text-xs" style={{ color: C.textFaint }}>~{Math.round(estimate.calories)} kcal · P{Math.round(estimate.protein_g)} C{Math.round(estimate.carbs_g)} F{Math.round(estimate.fat_g)} (rough, per typical serving)</p>
                <div className="mt-2"><MealPicker meal={meal} setMeal={setMeal} /></div>
                <div className="mt-2">
                  <PrimaryButton icon={Plus} onClick={() => {
                    onLog({ name: recipe.name, portion: "1 serving (AI estimate)", calories: Math.round(estimate.calories), protein: Math.round(estimate.protein_g), carbs: Math.round(estimate.carbs_g), fat: Math.round(estimate.fat_g), source: "recipe", density: estimate.density }, meal);
                    showToast("Added to food log · +20 XP");
                  }}>Add to Food Log</PrimaryButton>
                </div>
              </div>
            )}

            <GhostButton icon={ListChecks} onClick={() => { const cleaned = cleanIngredientsForGrocery(recipe.ingredients); onAddGrocery(cleaned, "recipe"); showToast(`${cleaned.length} ingredients added to grocery list`); }}>Add Ingredients to Grocery List</GhostButton>
          </div>
        )}
      </div>
    </Glass>
  );
}

function MacroBar({ label, value, target, color, unit }) {
  const pct = Math.min(100, (value / target) * 100);
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex justify-between text-xs mb-1"><span style={{ color: C.textDim }}>{label}</span><span style={{ color: C.text }}>{value} / {target} {unit}</span></div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: C.fill }}><div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} /></div>
    </div>
  );
}

function TargetsEditor({ targets, onSave }) {
  const [t, setT] = useState(targets);
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {["calories", "protein", "carbs", "fat"].map((k) => (
          <div key={k} className="rounded-2xl p-3" style={{ background: C.fill }}>
            <p className="text-[10px] font-semibold uppercase mb-1 capitalize" style={{ color: C.textFaint }}>{k}</p>
            <input type="number" value={t[k]} onChange={(e) => setT({ ...t, [k]: Number(e.target.value) })} className="bg-transparent outline-none font-bold text-base w-full" style={{ color: C.text }} />
          </div>
        ))}
      </div>
      <PrimaryButton onClick={() => onSave(t)}>Save Targets</PrimaryButton>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  MEAL PLANNER                                                        */
/* ------------------------------------------------------------------ */
const COST_META = { low: { label: "Low cost", tone: "mint" }, medium: { label: "Mid cost", tone: "amber" }, high: { label: "Higher cost", tone: "red" } };

function MealPlannerView({ state, onSetMealPlan, onAddGrocery, showToast }) {
  const [days, setDays] = useState(3);
  const [dietary, setDietary] = useState(state.profile.dietary || "No restrictions");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [replacing, setReplacing] = useState(null); // {dayIdx, meal}
  const plan = state.mealPlan;

  async function generate() {
    setLoading(true); setError("");
    try {
      const system = `You are a meal-planning assistant inside a fitness app. Create a ${days}-day meal plan (Breakfast, Lunch, Dinner, Snacks each day) considering: dietary preference "${dietary}", daily target ~${state.profile.targets.calories} kcal / ${state.profile.targets.protein}g protein, goal "${state.profile.goal}". Reply with ONLY a raw JSON object, no markdown fences, no commentary, in exactly this shape: {"days":[{"day":1,"meals":{"Breakfast":{"name":string,"calories":number,"protein":number,"carbs":number,"fat":number,"ingredients":[string],"costTier":"low"|"medium"|"high"},"Lunch":{...same shape...},"Dinner":{...same shape...},"Snacks":{...same shape...}}}]}. Keep meals realistic, simple to prepare, and varied across days. Never suggest extreme calorie restriction.`;
      const text = await callClaude({ system, messages: [{ role: "user", content: `Generate the ${days}-day meal plan now.` }] });
      const parsed = parseJsonLoose(text);
      onSetMealPlan({ days: parsed.days, dietary, generatedAt: todayKey() });
    } catch (e) { setError("We couldn't generate a meal plan right now. Please try again."); }
    finally { setLoading(false); }
  }

  async function replaceMeal(dayIdx, mealName) {
    setReplacing({ dayIdx, mealName });
    try {
      const system = `You are a meal-planning assistant inside a fitness app. Suggest ONE replacement meal for "${mealName}" considering dietary preference "${dietary}" and goal "${state.profile.goal}". Reply with ONLY a raw JSON object, no markdown fences: {"name":string,"calories":number,"protein":number,"carbs":number,"fat":number,"ingredients":[string],"costTier":"low"|"medium"|"high"}.`;
      const text = await callClaude({ system, messages: [{ role: "user", content: "Suggest a replacement meal." }] });
      const parsed = parseJsonLoose(text);
      const newDays = plan.days.map((d, i) => i === dayIdx ? { ...d, meals: { ...d.meals, [mealName]: parsed } } : d);
      onSetMealPlan({ ...plan, days: newDays });
    } catch (e) { showToast("Couldn't replace that meal — try again"); }
    finally { setReplacing(null); }
  }

  function addAllToGrocery() {
    if (!plan) return;
    const all = plan.days.flatMap((d) => Object.values(d.meals).flatMap((m) => m.ingredients || []));
    const unique = [...new Set(all)];
    onAddGrocery(unique, "meal plan");
    showToast(`${unique.length} ingredients added to grocery list`);
  }

  return (
    <div className="space-y-4">
      <Glass>
        <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: C.textFaint }}>Generate a plan</p>
        <div className="flex gap-2 mb-3">
          {[1, 3, 7].map((n) => (
            <button key={n} onClick={() => setDays(n)} className="flex-1 py-2 rounded-2xl text-sm font-semibold" style={{ background: days === n ? C.violetDim : C.fill, color: days === n ? C.violet : C.textDim, border: days === n ? `1px solid ${C.violet}` : "1px solid transparent" }}>{n} day{n > 1 ? "s" : ""}</button>
          ))}
        </div>
        <input value={dietary} onChange={(e) => setDietary(e.target.value)} placeholder="Dietary preferences / allergies (e.g. vegetarian, no nuts)" className="w-full rounded-2xl p-3 text-sm outline-none mb-3" style={{ background: C.fill, color: C.text }} />
        {error && <div className="mb-3"><ErrorNote text={error} /></div>}
        <PrimaryButton icon={loading ? Loader2 : CalendarDays} disabled={loading} onClick={generate}>{loading ? "Generating…" : plan ? "Regenerate Plan" : "Generate Meal Plan"}</PrimaryButton>
      </Glass>

      {!plan && !loading && <EmptyState icon={CalendarDays} title="No meal plan yet" sub="Choose a length and preferences above, then generate one." />}

      {plan && (
        <>
          <GhostButton icon={ListChecks} onClick={addAllToGrocery}>Add All Ingredients to Grocery List</GhostButton>
          {plan.days.map((d, di) => (
            <Glass key={di}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: C.textFaint }}>Day {d.day}</p>
              <div className="space-y-3">
                {Object.entries(d.meals).map(([mealName, m]) => {
                  const cost = m.costTier ? COST_META[m.costTier] : null;
                  const isReplacing = replacing && replacing.dayIdx === di && replacing.mealName === mealName;
                  return (
                    <div key={mealName} className="rounded-2xl p-3" style={{ background: C.fill }}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[10px] font-semibold uppercase" style={{ color: C.textFaint }}>{mealName}</p>
                        <button onClick={() => replaceMeal(di, mealName)} disabled={isReplacing} className="p-1 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                          {isReplacing ? <Loader2 size={12} className="animate-spin" style={{ color: C.textDim }} /> : <Repeat size={12} style={{ color: C.textDim }} />}
                        </button>
                      </div>
                      <p className="text-sm font-semibold" style={{ color: C.text }}>{m.name}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs" style={{ color: C.textFaint }}>{m.calories} kcal · P{m.protein} C{m.carbs} F{m.fat}</span>
                        {cost && <Pill tone={cost.tone}>{cost.label}</Pill>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Glass>
          ))}
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  GROCERY LIST                                                        */
/* ------------------------------------------------------------------ */
function GroceryListView({ list, onAdd, onToggle, onDelete, onClearPurchased }) {
  const [newItem, setNewItem] = useState("");
  const purchasedCount = list.filter((g) => g.purchased).length;

  return (
    <div className="space-y-4">
      <Glass>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: C.textFaint }}>Shopping list</p>
          <p className="text-xs" style={{ color: C.textFaint }}>{purchasedCount}/{list.length} picked up</p>
        </div>
        <div className="flex gap-2">
          <input value={newItem} onChange={(e) => setNewItem(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && newItem.trim()) { onAdd([newItem.trim()], "manual"); setNewItem(""); } }}
            placeholder="Add an item…" className="flex-1 rounded-2xl px-3.5 py-2.5 text-sm outline-none" style={{ background: C.fill, color: C.text }} />
          <button onClick={() => { if (newItem.trim()) { onAdd([newItem.trim()], "manual"); setNewItem(""); } }} className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${C.violet}, #4D8F8B)` }}><Plus size={18} color="#0A0B0D" /></button>
        </div>
      </Glass>

      {list.length === 0 ? (
        <EmptyState icon={ListChecks} title="Build your first shopping list" sub="Add items manually, or send ingredients here from a recipe or meal plan." />
      ) : (
        <>
          {GROCERY_CATEGORIES.map((cat) => {
            const items = list.filter((g) => g.category === cat);
            if (items.length === 0) return null;
            return (
              <div key={cat}>
                <p className="text-xs font-semibold uppercase tracking-wide mb-2 px-1" style={{ color: C.textFaint }}>{cat}</p>
                <div className="space-y-2">
                  {items.map((g) => (
                    <Glass key={g.id} padded={false} onClick={() => onToggle(g.id)} className="cursor-pointer">
                      <div className="flex items-center justify-between p-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: g.purchased ? C.mint : C.fill }}>{g.purchased && <Check size={13} color="#0A0B0D" />}</div>
                          <div>
                            <p className="text-sm font-medium capitalize" style={{ color: C.text, textDecoration: g.purchased ? "line-through" : "none", opacity: g.purchased ? 0.5 : 1 }}>{g.name}</p>
                            <p className="text-[10px]" style={{ color: C.textFaint }}>from {g.source}</p>
                          </div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); onDelete(g.id); }} className="p-1.5 rounded-full" style={{ background: C.fill }}><Trash2 size={13} style={{ color: C.textFaint }} /></button>
                      </div>
                    </Glass>
                  ))}
                </div>
              </div>
            );
          })}
          {purchasedCount > 0 && <GhostButton icon={Trash2} onClick={onClearPurchased}>Clear Picked-Up Items</GhostButton>}
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  LEARN — nutrition & cooking courses                                 */
/* ------------------------------------------------------------------ */
const LEARN_ICONS = { Apple: Utensils, ChefHat: BookOpen, Zap: Zap, Soup: Utensils };

function LearnView({ completedLessons, onCompleteLesson }) {
  const [openCourse, setOpenCourse] = useState(null);
  const [openLesson, setOpenLesson] = useState(null);

  return (
    <div className="space-y-3">
      <p className="text-xs" style={{ color: C.textFaint }}>Short, practical lessons — no fluff, no unsupported claims.</p>
      {LEARN_COURSES.map((course) => {
        const doneCount = course.lessons.filter((l) => completedLessons.includes(l.id)).length;
        const Icon = LEARN_ICONS[course.icon] || BookOpen;
        return (
          <Glass key={course.id} onClick={() => setOpenCourse(course)} className="cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl p-2.5" style={{ background: C.violetDim }}><Icon size={18} style={{ color: C.violet }} /></div>
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: C.text }}>{course.name}</p>
                <p className="text-xs mt-0.5" style={{ color: C.textFaint }}>{course.desc}</p>
              </div>
              <ChevronRight size={16} style={{ color: C.textFaint }} />
            </div>
            <div className="h-1.5 rounded-full overflow-hidden mt-3" style={{ background: C.fill }}>
              <div className="h-full rounded-full" style={{ width: `${(doneCount / course.lessons.length) * 100}%`, background: C.mint }} />
            </div>
            <p className="text-[10px] mt-1.5" style={{ color: C.textFaint }}>{doneCount}/{course.lessons.length} lessons complete</p>
          </Glass>
        );
      })}

      {openCourse && !openLesson && (
        <Sheet title={openCourse.name} onClose={() => setOpenCourse(null)}>
          <div className="space-y-2">
            {openCourse.lessons.map((lesson, i) => {
              const done = completedLessons.includes(lesson.id);
              return (
                <Glass key={lesson.id} padded={false} onClick={() => setOpenLesson(lesson)} className="cursor-pointer">
                  <div className="flex items-center justify-between p-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: done ? C.mint : C.fill }}>
                        {done ? <Check size={13} color="#0B0D0E" /> : <p className="text-xs font-semibold" style={{ color: C.textFaint }}>{i + 1}</p>}
                      </div>
                      <p className="text-sm font-medium" style={{ color: C.text }}>{lesson.title}</p>
                    </div>
                    <ChevronRight size={15} style={{ color: C.textFaint }} />
                  </div>
                </Glass>
              );
            })}
          </div>
        </Sheet>
      )}

      {openLesson && (
        <LearnLessonSheet lesson={openLesson} done={completedLessons.includes(openLesson.id)} onComplete={() => onCompleteLesson(openLesson.id)} onClose={() => setOpenLesson(null)} />
      )}
    </div>
  );
}

function LearnLessonSheet({ lesson, done, onComplete, onClose }) {
  const [quizAnswer, setQuizAnswer] = useState(null);
  return (
    <Sheet title={lesson.title} onClose={onClose}>
      <div className="space-y-5">
        <p className="text-sm leading-relaxed" style={{ color: C.text }}>{lesson.explanation}</p>

        <div>
          <p className="text-xs font-semibold uppercase mb-2" style={{ color: C.textFaint }}>Key points</p>
          <div className="space-y-1.5">
            {lesson.keyPoints.map((p, i) => (
              <div key={i} className="flex gap-2">
                <span style={{ width: 5, height: 5, borderRadius: 3, background: C.violet, display: "inline-block", marginTop: 7, flexShrink: 0 }} />
                <p className="text-sm" style={{ color: C.textDim }}>{p}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl p-3" style={{ background: C.fill }}>
          <p className="text-[10px] font-semibold uppercase mb-1" style={{ color: C.textFaint }}>Example</p>
          <p className="text-sm" style={{ color: C.text }}>{lesson.example}</p>
        </div>

        {lesson.quiz && (
          <div className="rounded-2xl p-3.5" style={{ background: C.violetDim }}>
            <p className="text-xs font-semibold uppercase mb-2" style={{ color: C.violet }}>Quick check</p>
            <p className="text-sm font-medium mb-3" style={{ color: C.text }}>{lesson.quiz.q}</p>
            <div className="space-y-2">
              {lesson.quiz.options.map((opt, i) => {
                const isCorrect = i === lesson.quiz.correct;
                const selected = quizAnswer === i;
                const showState = quizAnswer !== null && (selected || isCorrect);
                return (
                  <button key={i} onClick={() => setQuizAnswer(i)} disabled={quizAnswer !== null} className="w-full text-left text-sm rounded-xl px-3 py-2.5"
                    style={{ background: showState ? (isCorrect ? C.mintDim : C.redDim) : C.fill, color: showState ? (isCorrect ? C.mint : C.red) : C.text }}>
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="rounded-2xl p-3.5" style={{ background: C.amberDim }}>
          <p className="text-[10px] font-semibold uppercase mb-1" style={{ color: C.amber }}>Takeaway</p>
          <p className="text-sm font-medium" style={{ color: C.text }}>{lesson.takeaway}</p>
        </div>

        {done ? (
          <Pill tone="mint"><Check size={11} className="inline mr-1" />Completed</Pill>
        ) : (
          <PrimaryButton icon={Check} onClick={onComplete}>Mark Complete · +15 XP</PrimaryButton>
        )}
      </div>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */
/*  PROGRESS TAB                                                        */
/* ------------------------------------------------------------------ */
function ProgressTab({ state }) {
  const [view, setView] = useState("overview");
  const [selectedDay, setSelectedDay] = useState(null);
  const { level, into, need, name: levelTitle } = levelInfo(state.profile.xp);
  const last7 = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000);
    const key = d.toISOString().slice(0, 10);
    const cals = (state.foodLog[key] || []).reduce((s, f) => s + f.calories, 0);
    const worked = state.workoutHistory.some((w) => w.date === key);
    return { label: fmtDay(d), cals, worked };
  });
  const maxCal = Math.max(state.profile.targets.calories, ...last7.map((d) => d.cals), 1);
  const recovery = computeRecoveryStatus(state);
  const sleep7 = last7Sleep(state);
  const avgSleep = (() => {
    const vals = sleep7.filter((d) => d.hours != null).map((d) => d.hours);
    return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null;
  })();

  return (
    <div className="mt-1 space-y-4">
      <div className="flex gap-2">
        {["overview", "calendar", "recovery"].map((v) => (
          <button key={v} onClick={() => setView(v)} className="px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize" style={{ background: view === v ? C.text : C.fill, color: view === v ? C.bg : C.textDim }}>{v}</button>
        ))}
      </div>

      {view === "overview" && (
        <>
          <Glass>
            <div className="flex items-center gap-4">
              <Ring size={80} stroke={8} pct={into / need} color={C.violet}><p className="text-xs font-bold" style={{ color: C.text }}>Lv {level}</p></Ring>
              <div>
                <p className="text-lg font-bold" style={{ color: C.text }}>{levelTitle}</p>
                <p className="text-xs" style={{ color: C.textFaint }}>{state.profile.xp} XP total</p>
                <p className="text-xs mt-0.5" style={{ color: C.textFaint }}>{into} / {need} to level {level + 1}{level < LEVEL_NAMES.length ? ` — ${levelName(level + 1)}` : ""}</p>
              </div>
            </div>
          </Glass>

          <div className="grid grid-cols-2 gap-3">
            <Glass style={{ padding: 16 }} padded={false}><div className="p-4"><p className="text-2xl font-bold" style={{ color: C.text }}>{state.workoutHistory.length}</p><p className="text-xs" style={{ color: C.textFaint }}>Workouts completed</p></div></Glass>
            <Glass style={{ padding: 16 }} padded={false}><div className="p-4"><p className="text-2xl font-bold" style={{ color: C.text }}>{state.profile.streak}</p><p className="text-xs" style={{ color: C.textFaint }}>Current streak</p></div></Glass>
          </div>

          <Glass>
            <p className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: C.textFaint }}>Last 7 days</p>
            <div className="flex items-end justify-between gap-2" style={{ height: 110 }}>
              {last7.map((d, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
                  <div className="w-full rounded-lg" style={{ height: Math.max(4, (d.cals / maxCal) * 80), background: d.worked ? C.violet : C.fill, minWidth: 8 }} />
                  <span className="text-[10px]" style={{ color: C.textFaint }}>{d.label}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] mt-3" style={{ color: C.textFaint }}>Bar height = calories logged · accent = trained that day</p>
          </Glass>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2 px-1" style={{ color: C.textFaint }}>Achievements</p>
            <div className="grid grid-cols-2 gap-3">
              {ACHIEVEMENTS.map((a) => {
                const unlocked = a.check(state);
                return (
                  <Glass key={a.id} style={{ padding: 14, opacity: unlocked ? 1 : 0.5 }} padded={false}>
                    <div className="p-4">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center mb-2" style={{ background: unlocked ? C.amberDim : C.fill }}>{unlocked ? <Award size={16} style={{ color: C.amber }} /> : <Lock size={14} style={{ color: C.textFaint }} />}</div>
                      <p className="text-xs font-semibold" style={{ color: C.text }}>{a.name}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: C.textFaint }}>{a.desc}</p>
                    </div>
                  </Glass>
                );
              })}
            </div>
          </div>
        </>
      )}

      {view === "calendar" && <CalendarView state={state} onSelectDay={setSelectedDay} />}

      {view === "recovery" && (
        <>
          <Glass tint={C[{ ready: "mint", moderate: "amber", low: "red", unknown: "violet" }[recovery.status] + "Dim"]}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: C.textFaint }}>Today</p>
            <p className="text-lg font-bold mb-1" style={{ color: C.text }}>{recovery.label}</p>
            <p className="text-sm" style={{ color: C.textDim }}>{recovery.message}</p>
          </Glass>
          <Glass>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: C.textFaint }}>Sleep — last 7 days</p>
              {avgSleep != null && <p className="text-xs" style={{ color: C.text }}>avg {avgSleep}h</p>}
            </div>
            <div className="flex items-end justify-between gap-2" style={{ height: 100 }}>
              {sleep7.map((d, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
                  <div className="w-full rounded-lg" style={{ height: d.hours ? Math.max(4, (d.hours / 10) * 76) : 4, background: d.hours ? C.violet : C.fill, minWidth: 8 }} />
                  <span className="text-[10px]" style={{ color: C.textFaint }}>{d.label}</span>
                </div>
              ))}
            </div>
            {avgSleep == null && <p className="text-xs mt-3" style={{ color: C.textFaint }}>Log a morning check-in to start tracking sleep.</p>}
          </Glass>
        </>
      )}

      {selectedDay && <DayDetailSheet dateKey={selectedDay} state={state} onClose={() => setSelectedDay(null)} />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  CALENDAR                                                            */
/* ------------------------------------------------------------------ */
function CalendarView({ state, onSelectDay }) {
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const today = todayKey();
  const year = cursor.getFullYear(), month = cursor.getMonth();
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const cells = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  function dayState(day) {
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const worked = state.workoutHistory.some((h) => h.date === key);
    const checkin = state.checkins[key];
    const isRest = !!state.restDays[key];
    return { key, worked, hasCheckin: !!checkin, isRest, isToday: key === today, isFuture: key > today };
  }

  return (
    <Glass>
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setCursor(new Date(year, month - 1, 1))} className="p-1.5 rounded-full" style={{ background: C.fill }}><ChevronLeft size={15} style={{ color: C.textDim }} /></button>
        <p className="text-sm font-semibold" style={{ color: C.text }}>{monthLabel}</p>
        <button onClick={() => setCursor(new Date(year, month + 1, 1))} className="p-1.5 rounded-full" style={{ background: C.fill }}><ChevronRight size={15} style={{ color: C.textDim }} /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <p key={i} className="text-center text-[10px] font-semibold" style={{ color: C.textFaint }}>{d}</p>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const ds = dayState(day);
          return (
            <button key={i} onClick={() => onSelectDay(ds.key)} className="aspect-square rounded-xl flex flex-col items-center justify-center relative"
              style={{ background: ds.isToday ? C.violetDim : ds.worked ? C.fill : "transparent", border: ds.isToday ? `1px solid ${C.violet}` : "1px solid transparent" }}>
              <span className="text-xs font-medium" style={{ color: ds.isFuture ? C.textFaint : C.text }}>{day}</span>
              <div className="flex gap-0.5 mt-0.5">
                {ds.worked && <span style={{ width: 4, height: 4, borderRadius: 2, background: C.violet, display: "inline-block" }} />}
                {ds.hasCheckin && <span style={{ width: 4, height: 4, borderRadius: 2, background: C.mint, display: "inline-block" }} />}
                {ds.isRest && <span style={{ width: 4, height: 4, borderRadius: 2, background: C.amber, display: "inline-block" }} />}
              </div>
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-4 flex-wrap">
        <div className="flex items-center gap-1.5"><span style={{ width: 6, height: 6, borderRadius: 3, background: C.violet, display: "inline-block" }} /><span className="text-[10px]" style={{ color: C.textFaint }}>Workout</span></div>
        <div className="flex items-center gap-1.5"><span style={{ width: 6, height: 6, borderRadius: 3, background: C.mint, display: "inline-block" }} /><span className="text-[10px]" style={{ color: C.textFaint }}>Check-in</span></div>
        <div className="flex items-center gap-1.5"><span style={{ width: 6, height: 6, borderRadius: 3, background: C.amber, display: "inline-block" }} /><span className="text-[10px]" style={{ color: C.textFaint }}>Rest day</span></div>
      </div>
    </Glass>
  );
}

function DayDetailSheet({ dateKey, state, onClose }) {
  const workouts = state.workoutHistory.filter((h) => h.date === dateKey);
  const meals = state.foodLog[dateKey] || [];
  const checkin = state.checkins[dateKey];
  const calories = meals.reduce((s, m) => s + m.calories, 0);
  const estXp = workouts.length * 100 + meals.length * 20 + (checkin ? 15 : 0);
  const label = new Date(dateKey + "T00:00:00").toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  return (
    <Sheet title={label} onClose={onClose}>
      <div className="space-y-4">
        {state.restDays[dateKey] && (
          <div className="rounded-2xl p-3 flex items-center gap-2" style={{ background: C.amberDim }}>
            <Moon size={15} style={{ color: C.amber }} />
            <p className="text-xs font-medium" style={{ color: C.text }}>Rest Day — a valid part of the plan, not a missed session.</p>
          </div>
        )}
        <div>
          <p className="text-xs font-semibold uppercase mb-2" style={{ color: C.textFaint }}>Workout</p>
          {workouts.length === 0 ? <p className="text-sm" style={{ color: C.textFaint }}>No workout logged.</p> : workouts.map((w) => (
            <div key={w.id} className="flex items-center gap-2 mb-1"><Check size={13} style={{ color: C.mint }} /><p className="text-sm" style={{ color: C.text }}>{w.name}</p></div>
          ))}
        </div>
        {checkin && (
          <div>
            <p className="text-xs font-semibold uppercase mb-2" style={{ color: C.textFaint }}>Check-in</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {typeof checkin.sleepHours === "number" && <p style={{ color: C.textDim }}>Sleep: <span style={{ color: C.text }}>{checkin.sleepHours}h</span></p>}
              {checkin.sleepQuality && <p style={{ color: C.textDim }}>Quality: <span style={{ color: C.text }}>{checkin.sleepQuality}</span></p>}
              {typeof checkin.energy === "number" && <p style={{ color: C.textDim }}>Energy: <span style={{ color: C.text }}>{checkin.energy}/5</span></p>}
              {typeof checkin.mood === "number" && <p style={{ color: C.textDim }}>Mood: <span style={{ color: C.text }}>{checkin.mood}/5</span></p>}
            </div>
          </div>
        )}
        <div>
          <p className="text-xs font-semibold uppercase mb-2" style={{ color: C.textFaint }}>Nutrition</p>
          <p className="text-sm" style={{ color: C.text }}>{meals.length} meal{meals.length !== 1 ? "s" : ""} logged{meals.length > 0 ? ` · ${calories} kcal` : ""}</p>
        </div>
        <div className="rounded-2xl p-3" style={{ background: C.amberDim }}>
          <p className="text-xs" style={{ color: C.textFaint }}>Estimated XP earned</p>
          <p className="text-lg font-bold" style={{ color: C.amber }}>+{estXp}</p>
        </div>
      </div>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */
/*  AI COACH                                                            */
/* ------------------------------------------------------------------ */
const COACH_QUICK_ACTIONS = [
  "What should I train today?",
  "Explain my workout",
  "What should I eat?",
  "I'm low on energy",
  "Analyze my progress",
  "Help me recover",
];

function CoachSheet({ state, todaysWorkout, todaysFood, todaysCheckin, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages, sending]);

  async function send(overrideText) {
    const text = (overrideText ?? input).trim();
    if (!text || sending) return;
    const next = [...messages, { role: "user", content: text }];
    setMessages(next); setInput(""); setSending(true); setError("");
    try {
      const totals = todaysFood.reduce((a, f) => a + f.calories, 0);
      const mealsLogged = todaysFood.length;
      const checkinStr = todaysCheckin ? `Today's check-in — sleep: ${typeof todaysCheckin.sleepHours === "number" ? todaysCheckin.sleepHours + "h (" + (todaysCheckin.sleepQuality || "unrated") + ")" : "not logged"}, energy: ${todaysCheckin.energy ?? "not logged"}/5, mood: ${todaysCheckin.mood ?? "not logged"}/5.` : "No check-in logged today.";
      const recentWorkouts = state.workoutHistory.slice(-5).map((w) => w.name).join(", ") || "none yet";
      const recovery = computeRecoveryStatus(state);
      const { level } = levelInfo(state.profile.xp);
      const nextUp = nextWorkoutForCourse(state, "c1");
      const system = `You are Veya Coach, the AI coach inside the Veya fitness app. Personality: confident, calm, direct, practical, disciplined, knowledgeable, motivating without being childish. Avoid excessive emojis, fake hype ("AMAZING!!! 🔥"), constant praise, or long motivational speeches — sound like a capable human coach giving someone real information, not a cheerleader. Support short paragraphs, bullets, or numbered steps where useful; avoid giant walls of text.

User context: goal "${state.profile.goal}", equipment "${state.profile.equipment}", level ${level}, current streak ${state.profile.streak} days. Today's recommended session: "${todaysWorkout.name}" (${todaysWorkout.duration} min). Next scheduled session in their program: "${nextUp?.name}". Calories logged today: ${totals}/${state.profile.targets.calories} across ${mealsLogged} meal(s). Recent workouts: ${recentWorkouts}. ${checkinStr} Computed recovery status: ${recovery.label} — ${recovery.message}

Weigh the recovery status when recommending training intensity — suggest an easier session or rest when recovery is low, stated plainly and without shaming the user (e.g. "Your energy is low today. If sleep has also been short, take a recovery day or light mobility instead of forcing a hard session."). Never diagnose medical conditions or prescribe medication. Never encourage extreme calorie restriction, starvation, or excessive exercise. If asked about medical symptoms, suggest seeing a qualified professional. Keep replies under 130 words unless a detailed plan is explicitly requested.`;
      const reply = await callClaude({ system, messages: next.map((m) => ({ role: m.role, content: m.content })) });
      setMessages((m) => [...m, { role: "assistant", content: reply || "I'm not sure how to help with that yet — try rephrasing." }]);
    } catch (e) { setError("Veya Coach is having trouble responding right now. Please try again."); }
    finally { setSending(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: C.bg }}>
      <div className="flex items-center justify-between px-5 pt-6 pb-3" style={{ borderBottom: `1px solid ${C.glassBorder}` }}>
        <div className="flex items-center gap-2.5">
          <button onClick={onClose} className="p-1.5 rounded-full" style={{ background: C.fill }}><ArrowLeft size={16} style={{ color: C.textDim }} /></button>
          <div className="rounded-full p-2" style={{ background: C.violetDim }}><VeyaMark size={16} /></div>
          <div>
            <p className="font-semibold text-sm" style={{ color: C.text }}>VEYA COACH</p>
            <p className="text-[10px]" style={{ color: C.textFaint }}>Your personal AI fitness coach</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-full" style={{ background: C.fill }}><X size={16} style={{ color: C.textDim }} /></button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center text-center pt-8 pb-2">
            <VeyaMark size={30} />
            <p className="text-sm font-bold mt-3 tracking-wide" style={{ color: C.text }}>VEYA COACH</p>
            <p className="text-xs mt-1" style={{ color: C.textFaint }}>Your training. Your recovery. Your progress.</p>
            <p className="text-xs mt-3 max-w-[240px]" style={{ color: C.textDim }}>Ask me about your workout, food, recovery or progress.</p>
            <div className="grid grid-cols-2 gap-2 mt-5 w-full">
              {COACH_QUICK_ACTIONS.map((q) => (
                <button key={q} onClick={() => send(q)} className="text-left text-xs font-medium rounded-2xl px-3 py-2.5" style={{ background: C.fill, color: C.text }}>{q}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className="flex" style={{ justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div className="max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm" style={{ background: m.role === "user" ? C.violet : C.fill, color: m.role === "user" ? "#0B0D0E" : C.text, border: m.role === "user" ? "none" : `1px solid ${C.glassBorder}` }}>{m.content}</div>
          </div>
        ))}
        {sending && (
          <div className="flex items-center gap-2">
            <div className="rounded-2xl px-3.5 py-2.5 flex items-center gap-2" style={{ background: C.fill }}>
              <Loader2 size={14} className="animate-spin" style={{ color: C.textDim }} />
              <p className="text-xs" style={{ color: C.textDim }}>Veya is thinking…</p>
            </div>
          </div>
        )}
        {error && <ErrorNote text={error} />}
      </div>

      {messages.length > 0 && messages.length <= 2 && (
        <div className="px-5 pb-2 flex gap-2 overflow-x-auto">
          {COACH_QUICK_ACTIONS.filter((q) => !messages.some((m) => m.content === q)).slice(0, 3).map((q) => (
            <button key={q} onClick={() => send(q)} className="shrink-0 text-xs font-medium rounded-full px-3 py-1.5" style={{ background: C.fill, color: C.textDim }}>{q}</button>
          ))}
        </div>
      )}

      <div className="p-4 flex items-center gap-2" style={{ borderTop: `1px solid ${C.glassBorder}` }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Ask Veya anything…" className="flex-1 rounded-full px-4 py-3 text-sm outline-none" style={{ background: C.fill, color: C.text, border: `1px solid ${C.glassBorder}` }} />
        <button onClick={() => send()} disabled={sending || !input.trim()} className="w-11 h-11 rounded-full flex items-center justify-center disabled:opacity-50" style={{ background: C.violet }}><Send size={16} color="#0B0D0E" /></button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  CHECK-IN / LESSON / PROFILE / SETUP SHEETS                          */
/* ------------------------------------------------------------------ */
function Scale({ value, setValue, icons }) {
  return (
    <div className="flex gap-2 justify-between">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} onClick={() => setValue(n)} className="flex-1 py-2.5 rounded-2xl text-lg" style={{ background: value === n ? C.violetDim : C.fill, border: value === n ? `1px solid ${C.violet}` : "1px solid transparent" }}>{icons[n - 1]}</button>
      ))}
    </div>
  );
}

const SLEEP_QUALITY_OPTS = ["poor", "okay", "good", "excellent"];

function MorningCheckinSheet({ existing, onSave, onClose }) {
  const [bedtime, setBedtime] = useState(existing?.bedtime || "22:30");
  const [wakeTime, setWakeTime] = useState(existing?.wakeTime || "06:30");
  const [quality, setQuality] = useState(existing?.sleepQuality || "good");
  const [energy, setEnergy] = useState(existing?.energy || 3);
  const [water, setWater] = useState(existing?.water ?? 0);

  function computeHours() {
    const [bh, bm] = bedtime.split(":").map(Number);
    const [wh, wm] = wakeTime.split(":").map(Number);
    let mins = (wh * 60 + wm) - (bh * 60 + bm);
    if (mins <= 0) mins += 24 * 60;
    return Math.round((mins / 60) * 10) / 10;
  }
  const sleepHours = computeHours();

  return (
    <Sheet title="Morning check-in" onClose={onClose}>
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-semibold uppercase mb-2" style={{ color: C.textFaint }}>Bedtime</p>
            <input type="time" value={bedtime} onChange={(e) => setBedtime(e.target.value)} className="w-full rounded-2xl p-3 text-sm outline-none" style={{ background: C.fill, color: C.text }} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase mb-2" style={{ color: C.textFaint }}>Wake time</p>
            <input type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} className="w-full rounded-2xl p-3 text-sm outline-none" style={{ background: C.fill, color: C.text }} />
          </div>
        </div>
        <div className="rounded-2xl p-3 flex items-center gap-2" style={{ background: C.violetDim }}>
          <Moon size={15} style={{ color: C.violet }} />
          <p className="text-xs" style={{ color: C.text }}>{sleepHours}h of sleep</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase mb-2" style={{ color: C.textFaint }}>Sleep quality</p>
          <div className="flex gap-2">
            {SLEEP_QUALITY_OPTS.map((q) => (
              <button key={q} onClick={() => setQuality(q)} className="flex-1 py-2.5 rounded-2xl text-xs font-medium capitalize" style={{ background: quality === q ? C.violetDim : C.fill, color: quality === q ? C.violet : C.textDim, border: quality === q ? `1px solid ${C.violet}` : "1px solid transparent" }}>{q}</button>
            ))}
          </div>
        </div>
        <div><p className="text-xs font-semibold uppercase mb-2" style={{ color: C.textFaint }}>Energy today</p><Scale value={energy} setValue={setEnergy} icons={["🪫", "🔋", "🔋", "⚡", "⚡"]} /></div>
        <div>
          <p className="text-xs font-semibold uppercase mb-2" style={{ color: C.textFaint }}>Water so far: {water} glasses</p>
          <div className="flex items-center gap-3">
            <button onClick={() => setWater(Math.max(0, water - 1))} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: C.fill }}>–</button>
            <div className="flex-1 flex gap-1">{Array.from({ length: 8 }).map((_, i) => <Droplet key={i} size={16} style={{ color: i < water ? C.violet : C.fill }} fill={i < water ? C.violet : "none"} />)}</div>
            <button onClick={() => setWater(water + 1)} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: C.fill }}>+</button>
          </div>
        </div>
        <PrimaryButton onClick={() => onSave({ bedtime, wakeTime, sleepHours, sleepQuality: quality, energy, water })}>Save Morning Check-in</PrimaryButton>
      </div>
    </Sheet>
  );
}

function EveningCheckinSheet({ existing, onSave, onClose }) {
  const [mood, setMood] = useState(existing?.mood || 3);
  const [note, setNote] = useState(existing?.note || "");

  return (
    <Sheet title="Evening check-in" onClose={onClose}>
      <div className="space-y-5">
        <div><p className="text-xs font-semibold uppercase mb-2" style={{ color: C.textFaint }}>How was today?</p><Scale value={mood} setValue={setMood} icons={["😞", "😕", "🙂", "😄", "🤩"]} /></div>
        <div>
          <p className="text-xs font-semibold uppercase mb-2" style={{ color: C.textFaint }}>Anything worth noting? (optional)</p>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="e.g. felt sore, great session, stressful day…" className="w-full rounded-2xl p-3 text-sm outline-none resize-none" style={{ background: C.fill, color: C.text }} />
        </div>
        <PrimaryButton onClick={() => onSave({ mood, note })}>Save Evening Check-in</PrimaryButton>
      </div>
    </Sheet>
  );
}

function LessonSheet({ lesson, onOpen, onClose, alreadyRead }) {
  useEffect(() => { onOpen(); }, []);
  return (
    <Sheet title="Today's insight" onClose={onClose}>
      <div className="rounded-2xl p-2 mb-3" style={{ background: C.mintDim, display: "inline-block" }}><BookOpen size={18} style={{ color: C.mint }} /></div>
      <p className="text-lg font-bold mb-2" style={{ color: C.text }}>{lesson.title}</p>
      <p className="text-sm leading-relaxed" style={{ color: C.textDim }}>{lesson.body}</p>
      {!alreadyRead && <div className="mt-4"><Pill tone="mint">+10 XP earned</Pill></div>}
    </Sheet>
  );
}

function ProfileSheet({ state, setState, onClose, session, onSignOut, showToast, isGuest, onExitGuest, onGoToSignup, onOpenSettings, onOpenShop }) {
  const [name, setName] = useState(state.profile.name);
  const [saving, setSaving] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);

  async function save() {
    if (isGuest) {
      setState((p) => ({ ...p, profile: { ...p.profile, name } }));
      onClose();
      return;
    }
    if (!session?.user?.id) return;
    setSaving(true);
    try {
      await supabase.db.update("profiles", `?user_id=eq.${session.user.id}`, { display_name: name });
      setState((p) => ({ ...p, profile: { ...p.profile, name, setupDone: true } }));
      onClose();
    } catch (e) { showToast("Couldn't save your profile — check your connection."); }
    finally { setSaving(false); }
  }

  return (
    <Sheet title={isGuest ? "Guest profile" : "Your profile"} onClose={onClose}>
      {isGuest ? (
        <div className="rounded-2xl p-3 mb-4" style={{ background: C.violetDim }}>
          <p className="text-xs" style={{ color: C.text }}>You're exploring VEYA as a guest. Progress is saved on this device only — create a free account to keep it permanently and sync across devices.</p>
        </div>
      ) : (
        <>
          <p className="text-xs mb-1" style={{ color: C.textFaint }}>Signed in as</p>
          <p className="text-sm font-medium mb-4" style={{ color: C.text }}>{session?.user?.email}</p>
        </>
      )}
      {state.equippedCosmetics?.badge && <div className="mb-3"><Pill tone="amber"><Award size={11} className="inline mr-1" />{state.equippedCosmetics.badge}</Pill></div>}
      <p className="text-xs font-semibold uppercase mb-2" style={{ color: C.textFaint }}>Name</p>
      <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-2xl p-3 text-sm outline-none mb-4" style={{ background: C.fill, color: C.text }} />
      <button onClick={onOpenShop} className="w-full flex items-center justify-between rounded-2xl p-3.5 mb-2" style={{ background: C.fill }}>
        <span className="text-sm font-medium" style={{ color: C.text }}>Veya Shop</span>
        <div className="flex items-center gap-1.5"><span className="text-xs font-semibold" style={{ color: C.violet }}>{state.profile.xp} XP</span><ChevronRight size={16} style={{ color: C.textFaint }} /></div>
      </button>
      <button onClick={onOpenSettings} className="w-full flex items-center justify-between rounded-2xl p-3.5 mb-4" style={{ background: C.fill }}>
        <span className="text-sm font-medium" style={{ color: C.text }}>Appearance & Theme</span>
        <ChevronRight size={16} style={{ color: C.textFaint }} />
      </button>
      <div className="space-y-2">
        <PrimaryButton onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</PrimaryButton>
        {isGuest ? (
          <>
            <GhostButton onClick={onGoToSignup} style={{ color: C.violet, borderColor: C.violet }}>Create Your Free VEYA Account</GhostButton>
            {!confirmExit ? (
              <GhostButton onClick={() => setConfirmExit(true)} style={{ color: C.red }}>Exit Guest Mode</GhostButton>
            ) : (
              <div className="rounded-2xl p-3 space-y-2" style={{ background: C.redDim }}>
                <p className="text-xs" style={{ color: C.text }}>This clears your demo progress on this device. Continue?</p>
                <div className="grid grid-cols-2 gap-2">
                  <GhostButton onClick={() => setConfirmExit(false)}>Cancel</GhostButton>
                  <PrimaryButton onClick={onExitGuest} style={{ background: C.red, color: "#0B0D0E" }}>Confirm</PrimaryButton>
                </div>
              </div>
            )}
          </>
        ) : (
          <GhostButton onClick={onSignOut} style={{ color: C.red }}>Sign Out</GhostButton>
        )}
      </div>
    </Sheet>
  );
}

function SettingsSheet({ state, setState, appearance, setAppearance, themeName, setThemeName, resolvedDark, onClose }) {
  const appearanceOpts = [
    { id: "light", label: "Light", icon: "☀️" },
    { id: "dark", label: "Dark", icon: "🌙" },
    { id: "system", label: "System", icon: "⚙️" },
  ];
  const themeOpts = ["core", "obsidian", "aurora", "stealth"];

  function swatchFor(id) {
    if (id === "core") return resolvedDark ? THEME_PALETTES.coreDark : THEME_PALETTES.coreLight;
    return THEME_PALETTES[id];
  }
  function setTrainingMode(mode) { setState((p) => ({ ...p, profile: { ...p.profile, trainingMode: mode } })); }
  function toggleEquip(id) {
    setState((p) => {
      const has = p.profile.equipmentProfile.includes(id);
      return { ...p, profile: { ...p.profile, equipmentProfile: has ? p.profile.equipmentProfile.filter((x) => x !== id) : [...p.profile.equipmentProfile, id] } };
    });
  }

  return (
    <Sheet title="Appearance & Theme" onClose={onClose}>
      <p className="text-xs font-semibold uppercase mb-2" style={{ color: C.textFaint }}>Appearance</p>
      <div className="flex gap-2 mb-6">
        {appearanceOpts.map((o) => (
          <button key={o.id} onClick={() => setAppearance(o.id)} className="flex-1 rounded-2xl py-3 text-center"
            style={{ background: appearance === o.id ? C.violetDim : C.fill, border: appearance === o.id ? `1px solid ${C.violet}` : "1px solid transparent" }}>
            <p className="text-lg mb-1">{o.icon}</p>
            <p className="text-xs font-medium" style={{ color: appearance === o.id ? C.violet : C.textDim }}>{o.label}</p>
          </button>
        ))}
      </div>

      <p className="text-xs font-semibold uppercase mb-2" style={{ color: C.textFaint }}>Theme</p>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {themeOpts.map((id) => {
          const meta = THEME_META[id];
          const p = swatchFor(id);
          const active = themeName === id;
          return (
            <button key={id} onClick={() => setThemeName(id)} className="rounded-2xl p-3.5 text-left"
              style={{ background: active ? C.violetDim : C.fill, border: active ? `1px solid ${C.violet}` : "1px solid transparent" }}>
              <div className="flex items-center gap-1 mb-2">
                <span style={{ width: 16, height: 16, borderRadius: 8, background: p.bg, border: `1px solid ${p.glassBorder}`, display: "inline-block" }} />
                <span style={{ width: 16, height: 16, borderRadius: 8, background: p.violet, display: "inline-block" }} />
              </div>
              <p className="text-xs font-semibold" style={{ color: active ? C.violet : C.text }}>{id === "core" ? "Veya Core" : meta.name}</p>
              <p className="text-[10px] mt-0.5" style={{ color: C.textFaint }}>{id === "core" ? "Clean, premium, balanced" : meta.desc}</p>
            </button>
          );
        })}
      </div>
      <p className="text-[11px] mb-6" style={{ color: C.textFaint }}>Obsidian, Aurora and Stealth have a fixed light/dark character by design — the Appearance setting above only affects Veya Core.</p>

      <p className="text-xs font-semibold uppercase mb-2" style={{ color: C.textFaint }}>Training</p>
      <div className="grid grid-cols-2 gap-2 mb-6">
        <button onClick={() => setTrainingMode("home")} className="rounded-2xl p-3.5 text-center" style={{ background: state.profile.trainingMode === "home" ? C.violetDim : C.fill, border: state.profile.trainingMode === "home" ? `1px solid ${C.violet}` : "1px solid transparent" }}>
          <p className="mb-1">🏠</p>
          <p className="text-xs font-medium" style={{ color: state.profile.trainingMode === "home" ? C.violet : C.text }}>Home / Bodyweight</p>
        </button>
        <button onClick={() => setTrainingMode("gym")} className="rounded-2xl p-3.5 text-center" style={{ background: state.profile.trainingMode === "gym" ? C.violetDim : C.fill, border: state.profile.trainingMode === "gym" ? `1px solid ${C.violet}` : "1px solid transparent" }}>
          <p className="mb-1">🏋️</p>
          <p className="text-xs font-medium" style={{ color: state.profile.trainingMode === "gym" ? C.violet : C.text }}>Gym</p>
        </button>
      </div>

      <p className="text-xs font-semibold uppercase mb-2" style={{ color: C.textFaint }}>Equipment</p>
      <div className="grid grid-cols-2 gap-2">
        {EQUIPMENT_OPTS.map((eq) => {
          const on = state.profile.equipmentProfile.includes(eq.id);
          return (
            <button key={eq.id} onClick={() => toggleEquip(eq.id)} className="rounded-2xl p-3 text-sm font-medium text-left flex items-center gap-2" style={{ background: on ? C.violetDim : C.fill, color: on ? C.violet : C.textDim, border: on ? `1px solid ${C.violet}` : "1px solid transparent" }}>
              <span style={{ width: 14, height: 14, borderRadius: 4, border: `1.5px solid ${on ? C.violet : C.textFaint}`, background: on ? C.violet : "transparent", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{on && <Check size={10} color="#0B0D0E" />}</span>
              {eq.label}
            </button>
          );
        })}
      </div>
      <p className="text-[11px] mt-3" style={{ color: C.textFaint }}>Exercises that need equipment you don't have are automatically swapped for a bodyweight-friendly alternative during your sessions.</p>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */
/*  VEYA SHOP                                                           */
/* ------------------------------------------------------------------ */
function ShopSheet({ state, onPurchase, onEquip, onClose }) {
  const [view, setView] = useState("shop"); // shop | history
  const [confirmItem, setConfirmItem] = useState(null);
  const categories = [...new Set(XP_SHOP_ITEMS.map((i) => i.category))];

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: C.bg }}>
      <div className="flex items-center justify-between px-5 pt-6 pb-3" style={{ borderBottom: `1px solid ${C.glassBorder}` }}>
        <div className="flex items-center gap-2">
          <button onClick={onClose} className="p-1.5 rounded-full" style={{ background: C.fill }}><ArrowLeft size={16} style={{ color: C.textDim }} /></button>
          <div className="rounded-full p-2" style={{ background: C.violetDim }}><VeyaMark size={16} /></div>
          <p className="font-semibold text-sm" style={{ color: C.text }}>VEYA SHOP</p>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-full" style={{ background: C.fill }}><X size={16} style={{ color: C.textDim }} /></button>
      </div>

      <div className="px-5 pt-4">
        <Glass tint={C.violetDim}>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: C.textFaint }}>XP Balance</p>
          <p className="text-2xl font-bold" style={{ color: C.text }}>{state.profile.xp} XP</p>
        </Glass>
        <div className="flex gap-2 mt-3">
          {["shop", "history"].map((v) => (
            <button key={v} onClick={() => setView(v)} className="px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize" style={{ background: view === v ? C.text : C.fill, color: view === v ? C.bg : C.textDim }}>{v === "shop" ? "Cosmetics" : "History"}</button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {view === "shop" && categories.map((cat) => (
          <div key={cat} className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-wide mb-2 px-1" style={{ color: C.textFaint }}>{cat}</p>
            <div className="space-y-2">
              {XP_SHOP_ITEMS.filter((i) => i.category === cat).map((item) => {
                const owned = state.ownedCosmetics.includes(item.id);
                const equipped = state.equippedCosmetics[item.type] === item.value;
                return (
                  <Glass key={item.id}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold" style={{ color: C.text }}>{item.name}</p>
                      {owned ? <Pill tone="mint">Owned</Pill> : <Pill tone="amber">{item.price} XP</Pill>}
                    </div>
                    <p className="text-xs mb-3" style={{ color: C.textFaint }}>{item.desc}</p>
                    {owned ? (
                      equipped ? <Pill tone="violet">Equipped</Pill> : <GhostButton onClick={() => onEquip(item.type, item.value)}>Equip</GhostButton>
                    ) : (
                      <PrimaryButton onClick={() => setConfirmItem(item)} disabled={state.profile.xp < item.price}>{state.profile.xp < item.price ? "Not enough XP" : "Unlock"}</PrimaryButton>
                    )}
                  </Glass>
                );
              })}
            </div>
          </div>
        ))}

        {view === "history" && (
          state.xpLog.length === 0 ? (
            <EmptyState icon={Zap} title="No XP activity yet" sub="Workouts, check-ins, and meals you log will show up here." />
          ) : (
            <div className="space-y-2">
              {state.xpLog.map((x) => (
                <Glass key={x.id} padded={false}>
                  <div className="flex items-center justify-between p-3.5">
                    <div>
                      <p className="text-sm font-medium" style={{ color: C.text }}>{x.reason}</p>
                      <p className="text-[10px]" style={{ color: C.textFaint }}>{x.date}</p>
                    </div>
                    <p className="text-sm font-bold" style={{ color: x.amount > 0 ? C.mint : C.red }}>{x.amount > 0 ? "+" : ""}{x.amount} XP</p>
                  </div>
                </Glass>
              ))}
            </div>
          )
        )}
      </div>

      {confirmItem && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center" style={{ background: "rgba(0,0,0,0.6)" }} onClick={() => setConfirmItem(null)}>
          <div className="w-full rounded-t-3xl p-5" style={{ maxWidth: 480, background: C.glassBg, border: `1px solid ${C.glassBorder}` }} onClick={(e) => e.stopPropagation()}>
            <p className="text-sm font-semibold mb-1" style={{ color: C.text }}>{confirmItem.name}</p>
            <p className="text-xs mb-4" style={{ color: C.textFaint }}>{confirmItem.desc}</p>
            <div className="flex justify-between text-sm mb-1"><span style={{ color: C.textDim }}>Price</span><span style={{ color: C.text }}>{confirmItem.price} XP</span></div>
            <div className="flex justify-between text-sm mb-1"><span style={{ color: C.textDim }}>Current balance</span><span style={{ color: C.text }}>{state.profile.xp} XP</span></div>
            <div className="flex justify-between text-sm mb-4"><span style={{ color: C.textDim }}>Balance after</span><span style={{ color: C.text }}>{state.profile.xp - confirmItem.price} XP</span></div>
            <div className="grid grid-cols-2 gap-2">
              <GhostButton onClick={() => setConfirmItem(null)}>Cancel</GhostButton>
              <PrimaryButton onClick={() => { onPurchase(confirmItem); setConfirmItem(null); }}>Unlock</PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SetupSheet({ onFinish }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("general_fitness");
  const [trainingMode, setTrainingMode] = useState("home");
  const [equipmentProfile, setEquipmentProfile] = useState([]);
  const goals = [{ id: "general_fitness", label: "General fitness" }, { id: "strength", label: "Build strength" }, { id: "consistency", label: "Build consistency" }, { id: "mobility", label: "Improve mobility" }];

  function toggleEquip(id) {
    setEquipmentProfile((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }
  function equipmentDisplayString() {
    if (trainingMode === "gym" && equipmentProfile.length === 0) return "Full gym";
    if (equipmentProfile.length === 0) return "Bodyweight only";
    return equipmentProfile.map((id) => EQUIPMENT_OPTS.find((o) => o.id === id)?.label).join(", ");
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ background: "rgba(0,0,0,0.6)" }}>
      <div className="rounded-t-3xl px-5 pt-6 pb-8" style={glassStyle({ background: "rgba(20,21,24,0.75)" })}>
        <p className="text-lg font-bold mb-1" style={{ color: C.text }}>Welcome 👋</p>
        <p className="text-xs mb-5" style={{ color: C.textFaint }}>A couple of quick questions to personalize your plan.</p>
        {step === 0 && (
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase" style={{ color: C.textFaint }}>What should we call you?</p>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="w-full rounded-2xl p-3.5 text-sm outline-none" style={{ background: C.fill, color: C.text }} />
            <PrimaryButton disabled={!name.trim()} onClick={() => setStep(1)}>Continue</PrimaryButton>
          </div>
        )}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase" style={{ color: C.textFaint }}>What's your main goal?</p>
            <div className="grid grid-cols-2 gap-2">
              {goals.map((g) => (
                <button key={g.id} onClick={() => setGoal(g.id)} className="rounded-2xl p-3 text-sm font-medium text-left" style={{ background: goal === g.id ? C.violetDim : C.fill, color: goal === g.id ? C.violet : C.textDim, border: goal === g.id ? `1px solid ${C.violet}` : "1px solid transparent" }}>{g.label}</button>
              ))}
            </div>
            <PrimaryButton onClick={() => setStep(2)}>Continue</PrimaryButton>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase" style={{ color: C.textFaint }}>Where do you train?</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setTrainingMode("home")} className="rounded-2xl p-4 text-center" style={{ background: trainingMode === "home" ? C.violetDim : C.fill, border: trainingMode === "home" ? `1px solid ${C.violet}` : "1px solid transparent" }}>
                <p className="text-lg mb-1">🏠</p>
                <p className="text-sm font-medium" style={{ color: trainingMode === "home" ? C.violet : C.text }}>Home / Bodyweight</p>
              </button>
              <button onClick={() => setTrainingMode("gym")} className="rounded-2xl p-4 text-center" style={{ background: trainingMode === "gym" ? C.violetDim : C.fill, border: trainingMode === "gym" ? `1px solid ${C.violet}` : "1px solid transparent" }}>
                <p className="text-lg mb-1">🏋️</p>
                <p className="text-sm font-medium" style={{ color: trainingMode === "gym" ? C.violet : C.text }}>Gym</p>
              </button>
            </div>
            <p className="text-[11px]" style={{ color: C.textFaint }}>{trainingMode === "home" ? "We'll prioritize bodyweight and home-friendly exercises — no equipment assumed unless you add it next." : "We'll use full gym equipment by default."}</p>
            <PrimaryButton onClick={() => setStep(3)}>Continue</PrimaryButton>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase" style={{ color: C.textFaint }}>Any equipment you have? (optional)</p>
            <div className="grid grid-cols-2 gap-2">
              {EQUIPMENT_OPTS.map((eq) => (
                <button key={eq.id} onClick={() => toggleEquip(eq.id)} className="rounded-2xl p-3 text-sm font-medium text-left flex items-center gap-2" style={{ background: equipmentProfile.includes(eq.id) ? C.violetDim : C.fill, color: equipmentProfile.includes(eq.id) ? C.violet : C.textDim, border: equipmentProfile.includes(eq.id) ? `1px solid ${C.violet}` : "1px solid transparent" }}>
                  <span style={{ width: 14, height: 14, borderRadius: 4, border: `1.5px solid ${equipmentProfile.includes(eq.id) ? C.violet : C.textFaint}`, background: equipmentProfile.includes(eq.id) ? C.violet : "transparent", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{equipmentProfile.includes(eq.id) && <Check size={10} color="#0B0D0E" />}</span>
                  {eq.label}
                </button>
              ))}
            </div>
            <PrimaryButton onClick={() => onFinish(name, goal, equipmentDisplayString(), trainingMode, equipmentProfile)}>Get Started</PrimaryButton>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  STORE                                                                */
/* ------------------------------------------------------------------ */
function StoreView({ state, onClose, onAddToCart, onRemoveFromCart, onUpdateQty, onCheckout, ownedProductIds }) {
  const [screen, setScreen] = useState("browse"); // browse | detail | cart | history | library
  const [selected, setSelected] = useState(null);
  const [category, setCategory] = useState("All");
  const categories = ["All", ...new Set(PRODUCTS.map((p) => p.category))];
  const visible = category === "All" ? PRODUCTS : PRODUCTS.filter((p) => p.category === category);
  const cartItems = state.cart.map((c) => ({ ...PRODUCTS.find((p) => p.id === c.id), qty: c.qty }));
  const cartTotal = cartItems.reduce((s, i) => s + i.price * i.qty, 0);
  const ownedProducts = PRODUCTS.filter((p) => ownedProductIds.has(p.id));

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: C.bg }}>
      <AmbientBackground />
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center justify-between px-5 pt-6 pb-3" style={{ borderBottom: `1px solid ${C.glassBorder}` }}>
          <div className="flex items-center gap-2">
            {screen !== "browse" ? (
              <button onClick={() => setScreen("browse")} className="p-1.5 rounded-full" style={{ background: C.fill }}><ArrowLeft size={16} style={{ color: C.textDim }} /></button>
            ) : (
              <button onClick={onClose} className="p-1.5 rounded-full" style={{ background: C.fill }}><ArrowLeft size={16} style={{ color: C.textDim }} /></button>
            )}
            <div className="rounded-full p-2" style={{ background: C.violetDim }}><ShoppingBag size={16} style={{ color: C.violet }} /></div>
            <p className="font-semibold" style={{ color: C.text }}>{screen === "detail" ? "Product" : screen === "cart" ? "Cart" : screen === "history" ? "Orders" : screen === "library" ? "My Library" : "Store"}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setScreen("library")} className="p-2 rounded-full" style={{ background: C.fill }}><BookOpen size={16} style={{ color: C.textDim }} /></button>
            <button onClick={() => setScreen("history")} className="p-2 rounded-full" style={{ background: C.fill }}><Package size={16} style={{ color: C.textDim }} /></button>
            <button onClick={() => setScreen("cart")} className="relative p-2 rounded-full" style={{ background: C.fill }}>
              <ShoppingCart size={16} style={{ color: C.textDim }} />
              {cartItems.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center" style={{ background: C.violet, color: "#0A0B0D" }}>{cartItems.reduce((s, i) => s + i.qty, 0)}</span>}
            </button>
            <button onClick={onClose} className="p-1.5 rounded-full" style={{ background: C.fill }}><X size={16} style={{ color: C.textDim }} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {screen === "browse" && (
            <div className="space-y-4">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {categories.map((c) => (
                  <button key={c} onClick={() => setCategory(c)} className="shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold" style={{ background: category === c ? C.text : C.fill, color: category === c ? "#0A0B0D" : C.textDim }}>{c}</button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {visible.map((p) => {
                  const owned = ownedProductIds.has(p.id);
                  return (
                    <Glass key={p.id} onClick={() => { setSelected(p); setScreen("detail"); }} className="cursor-pointer" padded={false}>
                      <div className="p-4">
                        <div className="w-full aspect-square rounded-2xl mb-3 flex items-center justify-center relative" style={{ background: `linear-gradient(135deg, ${C.violetDim}, ${C.mintDim})` }}>
                          {p.type === "course" ? <Trophy size={26} style={{ color: C.violet }} /> : p.type === "digital" ? <BookOpen size={26} style={{ color: C.violet }} /> : <Package size={26} style={{ color: C.violet }} />}
                          {owned && <span className="absolute top-2 right-2"><Pill tone="mint">Owned</Pill></span>}
                        </div>
                        <p className="text-xs font-semibold leading-snug" style={{ color: C.text }}>{p.name}</p>
                        <p className="text-sm font-bold mt-1" style={{ color: C.violet }}>${p.price}</p>
                      </div>
                    </Glass>
                  );
                })}
              </div>
            </div>
          )}

          {screen === "detail" && selected && (
            <div className="space-y-4">
              <div className="w-full rounded-3xl flex items-center justify-center" style={{ height: 200, background: `linear-gradient(135deg, ${C.violetDim}, ${C.mintDim})` }}>
                {selected.type === "course" ? <Trophy size={44} style={{ color: C.violet }} /> : selected.type === "digital" ? <BookOpen size={44} style={{ color: C.violet }} /> : <Package size={44} style={{ color: C.violet }} />}
              </div>
              <div>
                <div className="flex items-center gap-2"><Pill tone="violet">{selected.category}</Pill>{ownedProductIds.has(selected.id) && <Pill tone="mint">Owned</Pill>}</div>
                <p className="text-xl font-bold mt-2" style={{ color: C.text }}>{selected.name}</p>
                <p className="text-2xl font-bold mt-1" style={{ color: C.violet }}>${selected.price}</p>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: C.textDim }}>{selected.desc}</p>
              {selected.type === "physical" && <p className="text-xs" style={{ color: C.textFaint }}>{selected.stock} in stock</p>}
              {ownedProductIds.has(selected.id) ? (
                <PrimaryButton icon={BookOpen} onClick={() => setScreen("library")}>Open in My Library</PrimaryButton>
              ) : (
                <PrimaryButton icon={ShoppingCart} onClick={() => onAddToCart(selected)}>Add to Cart</PrimaryButton>
              )}
            </div>
          )}

          {screen === "cart" && (
            cartItems.length === 0 ? (
              <EmptyState icon={ShoppingCart} title="Your cart is empty" sub="Browse the store to add courses, guides, or accessories." />
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  {cartItems.map((i) => (
                    <Glass key={i.id} padded={false}>
                      <div className="flex items-center justify-between p-3.5">
                        <div>
                          <p className="text-sm font-semibold" style={{ color: C.text }}>{i.name}</p>
                          <p className="text-xs" style={{ color: C.textFaint }}>${i.price} each</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => onUpdateQty(i.id, i.qty - 1)} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: C.fill }}><Minus size={13} style={{ color: C.textDim }} /></button>
                          <span className="text-sm font-semibold w-4 text-center" style={{ color: C.text }}>{i.qty}</span>
                          <button onClick={() => onUpdateQty(i.id, i.qty + 1)} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: C.fill }}><Plus size={13} style={{ color: C.textDim }} /></button>
                        </div>
                      </div>
                    </Glass>
                  ))}
                </div>
                <Glass>
                  <div className="flex justify-between mb-1"><span className="text-sm" style={{ color: C.textDim }}>Subtotal</span><span className="text-sm font-semibold" style={{ color: C.text }}>${cartTotal}</span></div>
                  <p className="text-[11px] mb-4" style={{ color: C.textFaint }}>This is a checkout preview — no payment provider is connected yet, so no real charge will be made.</p>
                  <PrimaryButton icon={CreditCard} onClick={() => { onCheckout(); setScreen("history"); }}>Place Demo Order</PrimaryButton>
                </Glass>
              </div>
            )
          )}

          {screen === "history" && (
            state.purchaseHistory.length === 0 ? (
              <EmptyState icon={Package} title="No orders yet" sub="Your order history will appear here." />
            ) : (
              <div className="space-y-3">
                {state.purchaseHistory.map((o) => (
                  <Glass key={o.id}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold" style={{ color: C.text }}>Order · {o.date}</p>
                      <Pill tone="amber">{o.status}</Pill>
                    </div>
                    {o.items.map((it, idx) => (
                      <p key={idx} className="text-xs" style={{ color: C.textDim }}>{it.qty}× {it.name} — ${it.price * it.qty}</p>
                    ))}
                    <p className="text-xs font-semibold mt-2" style={{ color: C.text }}>Total: ${o.total}</p>
                  </Glass>
                ))}
              </div>
            )
          )}

          {screen === "library" && (
            ownedProducts.length === 0 ? (
              <EmptyState icon={BookOpen} title="Nothing here yet" sub="Courses and guides you buy will show up here, ready to open." />
            ) : (
              <div className="space-y-3">
                {ownedProducts.map((p) => <LibraryItem key={p.id} product={p} />)}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

function LibraryItem({ product }) {
  const [open, setOpen] = useState(false);
  const linkedCourse = product.courseId ? COURSES.find((c) => c.id === product.courseId) : null;
  return (
    <Glass>
      <div className="flex items-center justify-between mb-2">
        <p className="font-semibold text-sm" style={{ color: C.text }}>{product.name}</p>
        <button onClick={() => setOpen((o) => !o)} className="p-1.5 rounded-full" style={{ background: C.fill }}><ChevronRight size={14} style={{ color: C.textDim, transform: open ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} /></button>
      </div>
      {!open ? (
        <p className="text-xs" style={{ color: C.textFaint }}>Tap to open</p>
      ) : (
        <div className="mt-2 space-y-2">
          {linkedCourse && (
            <>
              <p className="text-xs" style={{ color: C.textDim }}>{linkedCourse.weeks} weeks · {linkedCourse.difficulty}. Head to Train → Courses to start a session — it's now unlocked there.</p>
              <div className="space-y-1.5">
                {WORKOUTS.filter((w) => w.courseId === linkedCourse.id).map((w) => <p key={w.id} className="text-xs rounded-xl px-3 py-2" style={{ background: C.fill, color: C.text }}>{w.name} · {w.duration} min</p>)}
              </div>
            </>
          )}
          {product.recipeIds && (
            <div className="space-y-1.5">
              {product.recipeIds.map((rid) => { const r = RECIPES.find((x) => x.id === rid); return r ? <p key={rid} className="text-xs rounded-xl px-3 py-2" style={{ background: C.fill, color: C.text }}>{r.name} · {r.collection}</p> : null; })}
              <p className="text-[10px]" style={{ color: C.textFaint }}>Find these anytime under Nutrition → Recipes.</p>
            </div>
          )}
          {product.toc && (
            <div className="space-y-1.5">
              {product.toc.map((c, i) => <p key={i} className="text-xs rounded-xl px-3 py-2" style={{ background: C.fill, color: C.text }}>{c}</p>)}
            </div>
          )}
        </div>
      )}
    </Glass>
  );
}
