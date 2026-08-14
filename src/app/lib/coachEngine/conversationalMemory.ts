/* ─────────────────────────────────────────────────────────────────────────
   Conversational Memory — session memory tracker for AI Coach.
   Tracks topics, skill levels, specific concerns, and recommended mentors
   so the coach can reference earlier parts of the conversation naturally.
───────────────────────────────────────────────────────────────────────── */

export interface ChatTurn {
  id: string;
  from: "user" | "coach";
  text: string;
  timestamp: number;
}

export class CoachMemory {
  private turns: ChatTurn[] = [];
  private discussedTopics: Set<string> = new Set();
  private recommendedMentorIds: Set<number> = new Set();
  private userLevel: string | null = null;
  private primaryConcern: string | null = null;
  public pendingClarificationTopicId: string | null = null;

  constructor() {}

  public recordTurn(from: "user" | "coach", text: string, topicId?: string) {
    this.turns.push({
      id: Math.random().toString(36).slice(2),
      from,
      text,
      timestamp: Date.now(),
    });

    if (topicId) {
      this.discussedTopics.add(topicId);
    }
  }

  public setLevel(level: string) {
    this.userLevel = level;
  }

  public getLevel(): string | null {
    return this.userLevel;
  }

  public setConcern(concern: string) {
    this.primaryConcern = concern;
  }

  public getConcern(): string | null {
    return this.primaryConcern;
  }

  public markMentorRecommended(mentorId: number) {
    this.recommendedMentorIds.add(mentorId);
  }

  public hasRecommendedMentor(mentorId: number): boolean {
    return this.recommendedMentorIds.has(mentorId);
  }

  public hasDiscussedTopic(topicId: string): boolean {
    return this.discussedTopics.has(topicId);
  }

  public getRecentUserMessage(): string | null {
    const userTurns = this.turns.filter((t) => t.from === "user");
    return userTurns.length > 0 ? userTurns[userTurns.length - 1].text : null;
  }

  public getContextSummary(): string {
    const parts: string[] = [];
    if (this.userLevel) {
      parts.push(`Level: ${this.userLevel}`);
    }
    if (this.primaryConcern) {
      parts.push(`Concern: "${this.primaryConcern}"`);
    }
    if (this.discussedTopics.size > 0) {
      parts.push(`Topics: ${Array.from(this.discussedTopics).join(", ")}`);
    }
    return parts.join(" | ");
  }

  public clear() {
    this.turns = [];
    this.discussedTopics.clear();
    this.recommendedMentorIds.clear();
    this.userLevel = null;
    this.primaryConcern = null;
    this.pendingClarificationTopicId = null;
  }
}

export const sessionMemory = new CoachMemory();
