export interface MonitoredSite {
    id: number;
    name: string;
    url: string;
    scanFrequencyMinutes: number;
    baselineScreenshotPath: string | null;
}

export interface QaLog {
    id: number;
    executedAt: string;
    status: string;
    visualDifferenceScore: number;
    actualLoadTimeMs: number;
    screenshotPath: string | null;
}