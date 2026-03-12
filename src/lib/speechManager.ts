import { getLanguage, LANGUAGES, t } from './i18n';
import { BallType } from '@/types/cricket';

class SpeechManager {
  private enabled = false;
  private overSummaryEnabled = false;

  constructor() {
    this.loadSettings();
  }

  private loadSettings() {
    this.enabled = localStorage.getItem('cricket_commentary_enabled') === 'true';
    this.overSummaryEnabled = localStorage.getItem('cricket_over_summary_enabled') === 'true';
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    localStorage.setItem('cricket_commentary_enabled', String(enabled));
  }

  isEnabled(): boolean {
    this.loadSettings();
    return this.enabled;
  }

  setOverSummaryEnabled(enabled: boolean) {
    this.overSummaryEnabled = enabled;
    localStorage.setItem('cricket_over_summary_enabled', String(enabled));
  }

  isOverSummaryEnabled(): boolean {
    this.loadSettings();
    return this.overSummaryEnabled;
  }

  private speak(text: string) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const lang = getLanguage();
    const langOption = LANGUAGES.find(l => l.code === lang);
    utterance.lang = langOption?.speechLang || 'en-IN';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);
  }

  announceBall(runs: number, ballType: BallType, isWicket: boolean) {
    if (!this.isEnabled()) return;

    let text: string;
    if (isWicket) {
      text = t('commentary.wicket');
    } else if (runs === 4 && (ballType === 'normal' || ballType === 'noball')) {
      text = t('commentary.four');
    } else if (runs === 6 && (ballType === 'normal' || ballType === 'noball')) {
      text = t('commentary.six');
    } else if (ballType === 'wide') {
      text = t('commentary.wide');
    } else if (ballType === 'noball') {
      text = t('commentary.noBall');
    } else if (runs === 0) {
      text = t('commentary.dotBall');
    } else {
      text = runs === 1 ? t('commentary.run', { runs }) : t('commentary.runs', { runs });
    }

    this.speak(text);
  }

  announceOverSummary(overNumber: number, totalRuns: number, totalWickets: number) {
    if (!this.isOverSummaryEnabled()) return;

    const key = totalWickets === 1 ? 'commentary.overSummary' : 'commentary.overSummaryPlural';
    const text = t(key, {
      over: String(overNumber),
      runs: String(totalRuns),
      wickets: String(totalWickets),
    });

    // Delay slightly so it doesn't overlap with ball announcement
    setTimeout(() => this.speak(text), 1500);
  }
}

export const speechManager = new SpeechManager();
