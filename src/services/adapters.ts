// Chuyển đổi DTO tiếng Việt trả về từ backend (GiamSatController) sang các type tiếng Anh
// mà trang Dashboard/Monitoring đã được thiết kế sẵn (xem src/types/index.ts).
// Chỉ dùng cho 2 endpoint "tong-quan" và "gia-tri-hien-tai" — areasApi/equipmentsApi/tagsApi
// dùng chung cho trang Cấu hình nên giữ nguyên shape gốc, không adapt ở đây.
import type {
  DashboardSummary, AreaStatus, EquipmentStatusItem, RecentAlarm, TagCurrentValue,
} from '../types';

// ── Backend DTO shapes (raw JSON, camelCase theo mặc định System.Text.Json) ──
interface MauThongSoDto { nhanHieu: string; giaTri: number; donVi?: string; mucBaoDong: number }
interface TrangThaiThietBiDto {
  thietBiId: number; maThietBi: string; tenThietBi: string; trangThai: number;
  soTinHieu: number; soTinHieuBinhThuong: number; soTinHieuCanhBao: number; soTinHieuNghiemTrong: number;
  mauThongSo: MauThongSoDto[];
}
interface TrangThaiKhuVucDto {
  khuVucId: number; tenKhuVuc: string; soThietBi: number;
  soBinhThuong: number; soCanhBao: number; soNghiemTrong: number; soOffline: number;
  thietBis: TrangThaiThietBiDto[];
  thoiDiemCapNhatGanNhat?: string;
}
interface BaoDongGanDayDto {
  baoDongId: number; kyHieu: string; tenThietBi: string; tenKhuVuc: string;
  mucBaoDong: number; giaTriDo: number; donVi?: string; thoiDiemBatDau: string;
}
export interface TongQuanDto {
  tongThietBi: number; soBinhThuong: number; soCanhBao: number; soNghiemTrong: number; soOffline: number;
  soBaoDongHoatDong: number; soBaoDongH: number; soBaoDongHH: number;
  trangThaiKhuVuc: TrangThaiKhuVucDto[];
  baoDongGanDay: BaoDongGanDayDto[];
}
export interface GiaTriHienTaiDto {
  tinHieuId: number; kyHieu: string; tenTinHieu: string; donVi?: string;
  giaTriDinhMuc?: number; nguongDuoi?: number; nguongTren?: number;
  giaTri?: number;
  mucBaoDong: number; thoiDiem?: string; chatLuong: string;
  // Chỉ có giá trị khi lấy gộp nhiều thiết bị (xem monitoringApi.getAllCurrentValues)
  thietBiId?: number; maThietBi?: string; tenThietBi?: string; tenKhuVuc?: string;
}

export function mapDashboardSummary(dto: TongQuanDto): DashboardSummary {
  return {
    totalEquipment: dto.tongThietBi,
    normalCount: dto.soBinhThuong,
    warningCount: dto.soCanhBao,
    criticalCount: dto.soNghiemTrong,
    offlineCount: dto.soOffline,
    activeAlarmCount: dto.soBaoDongHoatDong,
    highAlarmCount: dto.soBaoDongH,
    highHighAlarmCount: dto.soBaoDongHH,
    areaStatuses: (dto.trangThaiKhuVuc ?? []).map(mapAreaStatus),
    recentAlarms: (dto.baoDongGanDay ?? []).map(mapRecentAlarm),
  };
}

function mapAreaStatus(dto: TrangThaiKhuVucDto): AreaStatus {
  return {
    areaId: dto.khuVucId,
    areaName: dto.tenKhuVuc,
    equipmentCount: dto.soThietBi,
    normalCount: dto.soBinhThuong,
    warningCount: dto.soCanhBao,
    criticalCount: dto.soNghiemTrong,
    offlineCount: dto.soOffline,
    equipments: (dto.thietBis ?? []).map(mapEquipmentStatusItem),
    lastDataTime: dto.thoiDiemCapNhatGanNhat,
  };
}

function mapEquipmentStatusItem(dto: TrangThaiThietBiDto): EquipmentStatusItem {
  return {
    equipmentId: dto.thietBiId,
    equipmentCode: dto.maThietBi,
    equipmentName: dto.tenThietBi,
    status: dto.trangThai,
    tagCount: dto.soTinHieu,
    normalTagCount: dto.soTinHieuBinhThuong,
    warningTagCount: dto.soTinHieuCanhBao,
    criticalTagCount: dto.soTinHieuNghiemTrong,
    sampleMetrics: (dto.mauThongSo ?? []).map(m => ({
      label: m.nhanHieu,
      value: m.giaTri,
      unit: m.donVi ?? '',
      alarmLevel: m.mucBaoDong,
    })),
  };
}

function mapRecentAlarm(dto: BaoDongGanDayDto): RecentAlarm {
  return {
    alarmId: dto.baoDongId,
    tagName: dto.kyHieu,
    equipmentName: dto.tenThietBi,
    areaName: dto.tenKhuVuc,
    alarmLevel: dto.mucBaoDong,
    currentValue: dto.giaTriDo,
    unit: dto.donVi,
    startTime: dto.thoiDiemBatDau,
  };
}

export function mapTagCurrentValues(list: GiaTriHienTaiDto[]): TagCurrentValue[] {
  return (list ?? []).map(dto => ({
    tagId: dto.tinHieuId,
    tagName: dto.kyHieu,
    signalName: dto.tenTinHieu,
    unit: dto.donVi,
    value: dto.giaTri,
    alarmLevel: dto.mucBaoDong,
    highLimit: dto.nguongDuoi,
    highHighLimit: dto.nguongTren,
    ratedValue: dto.giaTriDinhMuc,
    timestamp: dto.thoiDiem,
    quality: dto.chatLuong,
    equipmentId: dto.thietBiId,
    equipmentCode: dto.maThietBi,
    equipmentName: dto.tenThietBi,
    areaName: dto.tenKhuVuc,
  }));
}
