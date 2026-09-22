export enum AlarmLevel {
  Normal = 0,
  High = 1,
  HighHigh = 2,
}

export enum AlarmStatus {
  Active = 0,
  Acknowledged = 1,
  Cleared = 2,
  Closed = 3,
}

export enum EquipmentStatus {
  Normal = 0,
  Warning = 1,
  Critical = 2,
  Offline = 3,
}

export enum SignalType {
  Temperature = 0,
  Pressure = 1,
  Flow = 2,
  Vibration = 3,
  AlarmBit = 4,
  Other = 5,
}

export interface Area {
  id: number;
  maKhuVuc: string;
  tenKhuVuc: string;
  khuVucChaId?: number;
  thuTu: number;
  moTa?: string;
  conHoatDong: boolean;
  soThietBi: number;
  soBinhThuong: number;
  soCanhBao: number;
  soNghiemTrong: number;
  soOffline: number;
  chiNhanh?: Area[];
}

export interface Equipment {
  id: number;
  equipmentCode: string;
  equipmentName: string;
  areaId: number;
  areaName: string;
  equipmentType?: string;
  criticality?: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  status: EquipmentStatus;
  tagCount: number;
  normalTagCount: number;
  warningTagCount: number;
  criticalTagCount: number;
}

export interface TagThreshold {
  id: number;
  tagId: number;
  normalMin?: number;
  normalMax?: number;
  highLimit?: number;
  highHighLimit?: number;
  lowLimit?: number;
  lowLowLimit?: number;
  hysteresis: number;
  delaySeconds: number;
}

export interface Tag {
  id: number;
  equipmentId: number;
  equipmentName: string;
  tagName: string;
  signalName: string;
  signalType: SignalType;
  unit?: string;
  sourceTagName?: string;
  sourceTagNameH?: string;
  sourceTagNameHH?: string;
  ratedValue?: number;
  isActive: boolean;
  sortOrder: number;
  threshold?: TagThreshold;
  currentValue?: number;
  currentAlarmLevel: AlarmLevel;
  lastUpdated?: string;
}

export interface TagCurrentValue {
  tagId: number;
  tagName: string;
  signalName: string;
  unit?: string;
  value?: number;
  alarmLevel: AlarmLevel;
  highLimit?: number;
  highHighLimit?: number;
  ratedValue?: number;
  timestamp?: string;
  quality: string;
  /** Chỉ có giá trị khi xem gộp "Tất cả thiết bị". */
  equipmentId?: number;
  equipmentCode?: string;
  equipmentName?: string;
  areaName?: string;
}

export interface AlarmCurrent {
  id: number;
  tagId: number;
  tagName: string;
  signalName: string;
  equipmentId: number;
  equipmentName: string;
  areaName: string;
  alarmLevel: AlarmLevel;
  alarmLevelText: string;
  currentValue: number;
  thresholdValue: number;
  unit?: string;
  startTime: string;
  lastUpdateTime: string;
  status: AlarmStatus;
  acknowledgedBy?: string;
  acknowledgedTime?: string;
  note?: string;
  durationSeconds: number;
}

export interface AlarmHistory {
  id: number;
  tagId: number;
  tagName: string;
  signalName: string;
  equipmentId: number;
  equipmentName: string;
  areaName: string;
  alarmLevel: AlarmLevel;
  alarmLevelText: string;
  triggerValue: number;
  thresholdValue: number;
  unit?: string;
  startTime: string;
  acknowledgedTime?: string;
  clearedTime?: string;
  acknowledgedBy?: string;
  note?: string;
  durationSeconds?: number;
}

export interface DashboardSummary {
  totalEquipment: number;
  normalCount: number;
  warningCount: number;
  criticalCount: number;
  offlineCount: number;
  activeAlarmCount: number;
  highAlarmCount: number;
  highHighAlarmCount: number;
  areaStatuses: AreaStatus[];
  recentAlarms: RecentAlarm[];
}

export interface AreaStatus {
  areaId: number;
  areaName: string;
  equipmentCount: number;
  normalCount: number;
  warningCount: number;
  criticalCount: number;
  offlineCount: number;
  equipments: EquipmentStatusItem[];
  /** Thời điểm mới nhất trong số các Tag của khu vực có dữ liệu — undefined nếu chưa có dữ liệu. */
  lastDataTime?: string;
}

export interface EquipmentStatusItem {
  equipmentId: number;
  equipmentCode: string;
  equipmentName: string;
  status: EquipmentStatus;
  tagCount: number;
  normalTagCount: number;
  warningTagCount: number;
  criticalTagCount: number;
  /** Optional preview of a few key tag readings, shown on the dashboard card when the API provides them. */
  sampleMetrics?: { label: string; value: number; unit: string; alarmLevel: AlarmLevel }[];
}

export interface RecentAlarm {
  alarmId: number;
  tagName: string;
  equipmentName: string;
  areaName: string;
  alarmLevel: AlarmLevel;
  currentValue: number;
  unit?: string;
  startTime: string;
}

export interface TrendPoint {
  timestamp: string;
  value: number;
  quality: string;
}

export interface TrendData {
  tagId: number;
  tagName: string;
  signalName: string;
  unit?: string;
  highLimit?: number;
  highHighLimit?: number;
  points: TrendPoint[];
}

export interface HistoryRecord {
  id: number;
  tagId: number;
  tagName: string;
  signalName: string;
  equipmentName: string;
  areaName: string;
  unit?: string;
  value: number;
  quality: string;
  status: string;
  timestamp: string;
}

export interface PagedResult<T> {
  records: T[];
  total: number;
}
