import { motion, AnimatePresence } from "motion/react";
import { GraduationCap, Users2, X, ArrowRight } from "lucide-react";

const GOLD = "#D4AF37";
const INK = "#FAF9F6";

/* The "How do you want to use Starfix?" entry gate. Purely a fork in the
   UI — picking Student hands off to the exact existing signup flow
   unchanged; picking Mentor opens the new mentor onboarding wizard.
   Neither path touches auth/session logic itself. */
export function RoleChoice({
  open, onClose, onPickStudent, onPickMentor,
}: { open: boolean; onClose: () => void; onPickStudent: () => void; onPickMentor: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(4,4,12,.76)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: .98 }}
            onClick={(e) => e.stopPropagation()}
            style={{ width: "100%", maxWidth: 560, position: "relative", borderRadius: 26, padding: "42px 38px 36px", background: "#11101a", border: "1px solid rgba(212,175,55,.24)", boxShadow: "0 30px 90px rgba(0,0,0,.55)", color: INK, fontFamily: "Inter, sans-serif" }}
          >
            <button onClick={onClose} aria-label="Close" style={{ position: "absolute", top: 18, right: 18, background: "none", border: 0, color: "rgba(250,249,246,.35)", cursor: "pointer" }}><X size={18} /></button>
            <div style={{ color: GOLD, fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 18, marginBottom: 22 }}>Starfix</div>
            <h2 style={{ fontFamily: "Playfair Display, serif", margin: 0, fontSize: 28, textAlign: "center" }}>How do you want to use Starfix?</h2>
            <p style={{ color: "rgba(250,249,246,.46)", fontSize: 13.5, lineHeight: 1.6, margin: "10px 0 32px", textAlign: "center" }}>You can always tell — this shapes the account we set up for you.</p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <RoleCard icon={GraduationCap} title="Student / Learner" desc="Learn, grow, connect with mentors and track your progress." onClick={onPickStudent} />
              <RoleCard icon={Users2} title="Mentor" desc="Guide students, manage sessions and help them grow." onClick={onPickMentor} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function RoleCard({ icon: Icon, title, desc, onClick }: { icon: React.ComponentType<{ size?: number; color?: string }>; title: string; desc: string; onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -3, boxShadow: `0 0 0 1.5px ${GOLD}` }}
      whileTap={{ scale: 0.98 }}
      style={{
        textAlign: "left", cursor: "pointer", borderRadius: 18, padding: "24px 20px",
        background: "rgba(255,255,255,.045)", border: "1px solid rgba(255,255,255,.1)",
        color: INK, fontFamily: "Inter, sans-serif", display: "flex", flexDirection: "column", gap: 12,
        transition: "background 150ms ease",
      }}
    >
      <div style={{
        width: 42, height: 42, borderRadius: 12, background: "rgba(212,175,55,.12)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon size={19} color={GOLD} />
      </div>
      <div style={{ fontWeight: 700, fontSize: 15.5 }}>{title}</div>
      <p style={{ fontSize: 12.5, color: "rgba(250,249,246,.5)", lineHeight: 1.55, margin: 0 }}>{desc}</p>
      <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: GOLD, fontWeight: 600, marginTop: "auto" }}>
        Continue <ArrowRight size={13} />
      </div>
    </motion.button>
  );
}
