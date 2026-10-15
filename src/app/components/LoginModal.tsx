import { SupabaseAuthModal, type SupabaseAuthMode } from "./SupabaseAuthModal";
import { useState } from "react";

export function LoginModal({
  onLogin,
  onClose,
  onSignUp,
}: {
  onLogin: () => void;
  onClose: () => void;
  onSignUp?: () => void;
}) {
  const [mode, setMode] = useState<SupabaseAuthMode>("login");

  const handleSwitch = (newMode: SupabaseAuthMode) => {
    if (newMode === "signup" && onSignUp) {
      onSignUp();
      return;
    }
    setMode(newMode);
  };

  return (
    <SupabaseAuthModal
      mode={mode}
      onClose={onClose}
      onSuccess={onLogin}
      onSwitchMode={handleSwitch}
    />
  );
}
