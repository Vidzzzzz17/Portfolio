import { useState, type FocusEvent, type PointerEvent } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { FaLinkedinIn } from "react-icons/fa6";
import { SiGithub, SiInstagram, SiX } from "react-icons/si";
import type { IconType } from "react-icons";
import type { Day } from "@/lib/activity.functions";

type SocialCardProps = {
  label: string;
  href: string;
  handle: string;
  Icon: IconType;
  githubTotal?: number;
  githubDays?: Day[];
};

const socialProfiles: Omit<SocialCardProps, "githubTotal" | "githubDays">[] = [
  { label: "GitHub", href: "https://github.com/Vidzzzzz17", handle: "@Vidzzzzz17", Icon: SiGithub },
  { label: "Instagram", href: "https://www.instagram.com/vidit5791/", handle: "@vidit5791", Icon: SiInstagram },
  { label: "X", href: "https://x.com/vidit1727", handle: "@vidit1727", Icon: SiX },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/vidit-sharma-914202380/", handle: "Vidit Sharma", Icon: FaLinkedinIn },
];

function PreviewCard({ label, href, handle, Icon, githubTotal, githubDays }: SocialCardProps) {
  const [open, setOpen] = useState(false);
  const reduced = useReducedMotion();
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const springX = useSpring(pointerX, { stiffness: 300, damping: 24 });
  const springY = useSpring(pointerY, { stiffness: 300, damping: 24 });
  const rotateX = useTransform(springY, [-0.5, 0.5], [4, -4]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-4, 4]);
  const IconComponent = Icon;

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (reduced) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    pointerX.set((event.clientX - bounds.left) / bounds.width - 0.5);
    pointerY.set((event.clientY - bounds.top) / bounds.height - 0.5);
  }

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
  }

  return (
    <div
      className="social-preview relative"
      data-network={label}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocusCapture={() => setOpen(true)}
      onBlurCapture={handleBlur}
      onKeyDown={(event) => { if (event.key === "Escape") setOpen(false); }}
    >
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Open ${label} profile`}
        className="social-preview-trigger flex min-h-14 items-center gap-3 border border-border bg-card px-4 py-3 transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <IconComponent className="social-preview-icon size-5 shrink-0" aria-hidden="true" />
        <span className="min-w-0">
          <span className="block font-medium">{label}</span>
          <span className="block truncate font-mono text-xs text-muted-foreground">{handle}</span>
        </span>
        <span className="ml-auto text-muted-foreground" aria-hidden="true">↗</span>
      </a>
      <motion.div
        aria-hidden={!open}
        className="social-preview-popover absolute bottom-[calc(100%+12px)] left-1/2 z-30 w-[320px] max-w-[calc(100vw-32px)] -translate-x-1/2 border border-border bg-card p-5 shadow-xl"
        initial={false}
        animate={open ? { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" } : { opacity: 0, y: 6, scale: 0.98, filter: "blur(2px)" }}
        transition={reduced ? { duration: 0 } : { duration: open ? 0.22 : 0.15, ease: open ? [0.16, 1, 0.3, 1] : "easeIn" }}
        style={{
          pointerEvents: open ? "auto" : "none",
          rotateX: reduced ? 0 : rotateX,
          rotateY: reduced ? 0 : rotateY,
          transformPerspective: 1000,
        }}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => { pointerX.set(0); pointerY.set(0); }}
      >
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center border border-border bg-secondary">
            <IconComponent className="social-preview-icon size-5" aria-hidden="true" />
          </span>
          <span>
            <span className="block font-semibold">{label}</span>
            <span className="font-mono text-sm text-muted-foreground">{handle}</span>
          </span>
        </div>
        {label === "GitHub" && githubDays && githubTotal !== undefined ? (
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">{githubTotal.toLocaleString()} contributions in the last year</p>
            <div className="mt-3 grid grid-flow-col grid-rows-7 gap-1" aria-label="Recent GitHub contributions">
              {githubDays.slice(-70).map((day) => <span key={day.date} title={`${day.count} contributions on ${day.date}`} className={`size-2 rounded-[2px] bg-heat-${Math.min(4, day.level)}`} />)}
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">Open {label} profile</p>
        )}
        <a href={href} target="_blank" rel="noopener noreferrer" tabIndex={open ? 0 : -1} className="mt-4 inline-flex font-mono text-sm text-foreground underline underline-offset-4">
          Visit {label} ↗
        </a>
      </motion.div>
    </div>
  );
}

export function SocialPreviewCards({ githubTotal, githubDays }: { githubTotal?: number; githubDays?: Day[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {socialProfiles.map((profile) => (
        <PreviewCard
          key={profile.label}
          {...profile}
          githubTotal={profile.label === "GitHub" ? githubTotal : undefined}
          githubDays={profile.label === "GitHub" ? githubDays : undefined}
        />
      ))}
    </div>
  );
}