// src/lib/activeChannelTracker.ts
let activeChannelId: string | null = null;

export function setActiveChannel(channelId: string | null): void {
  activeChannelId = channelId;
}

export function getActiveChannel(): string | null {
  return activeChannelId;
}

export function isViewingChannel(channelId: string): boolean {
  return activeChannelId === channelId;
}
