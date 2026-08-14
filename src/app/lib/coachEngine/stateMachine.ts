/* ─────────────────────────────────────────────────────────────────────────
   Session State Machine — single structured state object for the AI Coach session.
   Prevents scattered flags, preserves confirmed conversation context across turns,
   isolates emotional signals from topics, and prevents topic blending.
───────────────────────────────────────────────────────────────────────── */

export interface ConfirmedTopic {
  id: string;
  label: string;
  category: string;
}

export type SkillLevel = "Beginner" | "Intermediate" | "Advanced";

export class SessionState {
  public confirmedTopic: ConfirmedTopic | null = null;
  public confirmedLevel: SkillLevel | null = null;
  public emotionalSignal: string | null = null;
  public openQuestion: string | null = null; // e.g. "ASKED_LEVEL", "ASKED_STUCK_REASON"
  public suggestedMentorIds: Set<number> = new Set();
  public suggestedVideoTitles: Set<string> = new Set();
  public history: { from: "user" | "coach"; text: string }[] = [];

  constructor() {}

  public setConfirmedTopic(topic: ConfirmedTopic) {
    // If switching to a distinctly new topic, reset level and recommendations to avoid blending
    if (this.confirmedTopic && this.confirmedTopic.id !== topic.id) {
      this.confirmedTopic = topic;
      this.confirmedLevel = null;
      this.openQuestion = null;
      this.suggestedMentorIds.clear();
      this.suggestedVideoTitles.clear();
    } else {
      this.confirmedTopic = topic;
    }
  }

  public setConfirmedLevel(level: SkillLevel) {
    this.confirmedLevel = level;
    if (this.openQuestion === "ASKED_LEVEL") {
      this.openQuestion = null;
    }
  }

  public setEmotionalSignal(signal: string | null) {
    this.emotionalSignal = signal;
  }

  public setOpenQuestion(q: string | null) {
    this.openQuestion = q;
  }

  public recordTurn(from: "user" | "coach", text: string) {
    this.history.push({ from, text });
  }

  public markMentorSuggested(mentorId: number) {
    this.suggestedMentorIds.add(mentorId);
  }

  public markVideoSuggested(title: string) {
    this.suggestedVideoTitles.add(title);
  }

  public resetSession() {
    this.confirmedTopic = null;
    this.confirmedLevel = null;
    this.emotionalSignal = null;
    this.openQuestion = null;
    this.suggestedMentorIds.clear();
    this.suggestedVideoTitles.clear();
    this.history = [];
  }
}

export const sessionState = new SessionState();
