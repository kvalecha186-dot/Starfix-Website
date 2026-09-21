import type { UserProfile } from "../types";
import { MentorLayout } from "./MentorLayout";

interface Props {
  userProfile?: UserProfile | null;
  onLogout: () => void;
  onUpdateProfile?: (patch: Partial<UserProfile>) => void;
}

export function MentorDashboard({ userProfile, onLogout, onUpdateProfile }: Props) {
  return (
    <MentorLayout
      userProfile={userProfile}
      onLogout={onLogout}
      onUpdateProfile={onUpdateProfile}
    />
  );
}
