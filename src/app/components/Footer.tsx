import { StarfixLogo } from "./StarfixLogo";
import { Twitter, Instagram, Linkedin, Youtube } from "lucide-react";

const links = {
  Platform: ["How It Works", "Find a Mentor", "Transformation Paths", "Star Map", "Daily Missions"],
  Company: ["About Us", "Careers", "Press", "Blog", "Contact"],
  Legal: ["Privacy Policy", "Terms of Service", "Cookie Policy", "GDPR"],
};

const socials = [
  { Icon: Twitter, label: "Twitter" },
  { Icon: Instagram, label: "Instagram" },
  { Icon: Linkedin, label: "LinkedIn" },
  { Icon: Youtube, label: "YouTube" },
];

/* Tiny constellation decoration */
function ConstellationDeco() {
  return (
    <svg width={90} height={60} viewBox="0 0 90 60" fill="none" className="opacity-30">
      <circle cx="15" cy="45" r="1.5" fill="#D4AF37" />
      <circle cx="35" cy="20" r="2" fill="#D4AF37" />
      <circle cx="60" cy="38" r="1.2" fill="#D4AF37" />
      <circle cx="78" cy="15" r="1.8" fill="#D4AF37" />
      <circle cx="50" cy="8" r="1" fill="#D4AF37" />
      <line x1="15" y1="45" x2="35" y2="20" stroke="#D4AF37" strokeWidth="0.5" />
      <line x1="35" y1="20" x2="50" y2="8" stroke="#D4AF37" strokeWidth="0.5" />
      <line x1="50" y1="8" x2="78" y2="15" stroke="#D4AF37" strokeWidth="0.5" />
      <line x1="35" y1="20" x2="60" y2="38" stroke="#D4AF37" strokeWidth="0.5" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer
      style={{
        background: "#050510",
        borderTop: "1px solid rgba(212,175,55,0.07)",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-14">
          {/* Brand */}
          <div className="col-span-2">
            <StarfixLogo size={34} markColor="#D4AF37" textColor="#FAF9F6" />
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.82rem",
                color: "rgba(250,249,246,0.35)",
                lineHeight: 1.75,
                marginTop: "1.1rem",
                maxWidth: 250,
                fontWeight: 300,
              }}
            >
              The world's most trusted platform for personal transformation through expert mentorship, AI guidance, and structured celestial growth paths.
            </p>
            <div className="mt-5 mb-6">
              <ConstellationDeco />
            </div>
            <div className="flex gap-2.5">
              {socials.map(({ Icon, label }) => (
                <button
                  key={label}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    color: "rgba(250,249,246,0.35)",
                  }}
                  onMouseEnter={(e) => {
                    const b = e.currentTarget as HTMLButtonElement;
                    b.style.borderColor = "rgba(212,175,55,0.3)";
                    b.style.color = "#D4AF37";
                    b.style.background = "rgba(212,175,55,0.06)";
                  }}
                  onMouseLeave={(e) => {
                    const b = e.currentTarget as HTMLButtonElement;
                    b.style.borderColor = "rgba(255,255,255,0.07)";
                    b.style.color = "rgba(250,249,246,0.35)";
                    b.style.background = "rgba(255,255,255,0.03)";
                  }}
                  aria-label={label}
                >
                  <Icon size={14} />
                </button>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <h5
                className="mb-4 uppercase tracking-widest"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.65rem",
                  color: "#D4AF37",
                  fontWeight: 600,
                }}
              >
                {category}
              </h5>
              <ul className="flex flex-col gap-2.5">
                {items.map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: "0.8rem",
                        color: "rgba(250,249,246,0.35)",
                        fontWeight: 300,
                        textDecoration: "none",
                        transition: "color 0.2s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.color = "#D4AF37")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = "rgba(250,249,246,0.35)")
                      }
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6"
          style={{ borderTop: "1px solid rgba(212,175,55,0.06)" }}
        >
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.72rem",
              color: "rgba(250,249,246,0.2)",
            }}
          >
            © 2026 Starfix Inc. All rights reserved.
          </p>
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.72rem",
              color: "rgba(250,249,246,0.18)",
              letterSpacing: "0.08em",
            }}
          >
            Become the Best Version of Yourself ✦
          </p>
        </div>
      </div>
    </footer>
  );
}
