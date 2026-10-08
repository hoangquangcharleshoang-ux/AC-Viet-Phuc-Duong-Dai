/**
 * AC — Context-Aware Cultural Remix Co-pilot
 * Idle Session Timeout & Safe In-Flight Deferral Manager
 *
 * Requirements:
 * - 2m30s (150,000ms): Show warning "Phiên này sẽ bắt đầu lại sau 30 giây vì không có hoạt động."
 * - 3m00s (180,000ms): Invoke canonical Session Reset barrier.
 * - User interactions reset idle clock (mousemove, mousedown, keydown, touchstart, scroll, click).
 * - React renders, state updates, network/websocket activity, QA/image completion DO NOT reset idle clock.
 * - In-flight work (Call A, Call B, Exploration, image generation, Visual QA) defers destructive reset until settled.
 */

export class IdleSessionManager {
  private lastUserActivityTime: number = Date.now();
  private warningThresholdMs: number;
  private resetThresholdMs: number;
  private checkIntervalMs: number;
  private intervalId: any = null;
  public isWarningShown: boolean = false;
  public isResetDeferred: boolean = false;
  public isWarningDeferred: boolean = false;

  private onShowWarning: () => void;
  private onDismissWarning: () => void;
  private onTriggerReset: () => void;
  private isWorkInFlight: () => boolean;

  constructor(options: {
    warningThresholdMs?: number;
    resetThresholdMs?: number;
    checkIntervalMs?: number;
    onShowWarning: () => void;
    onDismissWarning: () => void;
    onTriggerReset: () => void;
    isWorkInFlight: () => boolean;
  }) {
    this.warningThresholdMs = options.warningThresholdMs ?? 150000;
    this.resetThresholdMs = options.resetThresholdMs ?? 180000;
    this.checkIntervalMs = options.checkIntervalMs ?? 1000;
    this.onShowWarning = options.onShowWarning;
    this.onDismissWarning = options.onDismissWarning;
    this.onTriggerReset = options.onTriggerReset;
    this.isWorkInFlight = options.isWorkInFlight;
  }

  public recordUserActivity(): void {
    this.lastUserActivityTime = Date.now();
    this.isResetDeferred = false;
    this.isWarningDeferred = false;
    if (this.isWarningShown) {
      this.isWarningShown = false;
      this.onDismissWarning();
    }
  }

  public getElapsedIdleMs(): number {
    return Date.now() - this.lastUserActivityTime;
  }

  public checkTick(): void {
    const elapsed = this.getElapsedIdleMs();
    const inFlight = this.isWorkInFlight();

    if (elapsed >= this.resetThresholdMs) {
      if (inFlight) {
        this.isResetDeferred = true;
      } else {
        this.isWarningShown = false;
        this.isResetDeferred = false;
        this.isWarningDeferred = false;
        this.onDismissWarning();
        this.onTriggerReset();
        this.lastUserActivityTime = Date.now();
      }
    } else if (elapsed >= this.warningThresholdMs) {
      if (inFlight) {
        this.isWarningDeferred = true;
      } else {
        if (!this.isWarningShown) {
          this.isWarningShown = true;
          this.onShowWarning();
        }
      }
    }
  }

  public onWorkSettled(): void {
    const elapsed = this.getElapsedIdleMs();
    if (this.isResetDeferred || elapsed >= this.resetThresholdMs) {
      this.isResetDeferred = false;
      this.isWarningDeferred = false;
      this.isWarningShown = false;
      this.onDismissWarning();
      this.onTriggerReset();
      this.lastUserActivityTime = Date.now();
    } else if (this.isWarningDeferred || elapsed >= this.warningThresholdMs) {
      this.isWarningDeferred = false;
      if (!this.isWarningShown) {
        this.isWarningShown = true;
        this.onShowWarning();
      }
    }
  }

  public start(): void {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => this.checkTick(), this.checkIntervalMs);
  }

  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
