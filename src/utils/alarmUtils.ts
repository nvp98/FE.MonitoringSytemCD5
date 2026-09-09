import { AlarmLevel, EquipmentStatus } from '../types';

export const alarmLevelColor = {
  [AlarmLevel.Normal]: '#52c41a',
  [AlarmLevel.High]: '#faad14',
  [AlarmLevel.HighHigh]: '#ff4d4f',
};

export const alarmLevelText = {
  [AlarmLevel.Normal]: 'Bình thường',
  [AlarmLevel.High]: 'Cảnh báo H',
  [AlarmLevel.HighHigh]: 'Nguy hiểm HH',
};

export const alarmLevelBadge = {
  [AlarmLevel.Normal]: 'success',
  [AlarmLevel.High]: 'warning',
  [AlarmLevel.HighHigh]: 'error',
} as const;

export const equipmentStatusColor = {
  [EquipmentStatus.Normal]: '#52c41a',
  [EquipmentStatus.Warning]: '#faad14',
  [EquipmentStatus.Critical]: '#ff4d4f',
  [EquipmentStatus.Offline]: '#8c8c8c',
};

export const equipmentStatusText = {
  [EquipmentStatus.Normal]: 'Bình thường',
  [EquipmentStatus.Warning]: 'Cảnh báo',
  [EquipmentStatus.Critical]: 'Nguy hiểm',
  [EquipmentStatus.Offline]: 'Offline',
};

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}p ${seconds % 60}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}p`;
}

export function formatValue(value?: number, unit?: string): string {
  if (value === undefined || value === null) return '—';
  return `${value.toFixed(2)}${unit ? ' ' + unit : ''}`;
}
