import dayjs from 'dayjs';
import type { AreaStatus } from '../../types';
import { EquipmentCard } from './EquipmentCard';

interface Props {
  area: AreaStatus;
}

function statusClass(area: AreaStatus) {
  if (area.criticalCount > 0) return 'status-critical';
  if (area.warningCount  > 0) return 'status-warning';
  return '';
}

export function AreaPanel({ area }: Props) {
  return (
    <div className={`area-panel ${statusClass(area)}`}>
      {/* Header */}
      <div className="area-header">
        <span className="area-title">{area.areaName}</span>

        <div className="area-stats">
          <span className="area-stat-chip chip-normal">✓ {area.normalCount}</span>
          {area.warningCount  > 0 && <span className="area-stat-chip chip-warning">H {area.warningCount}</span>}
          {area.criticalCount > 0 && <span className="area-stat-chip chip-critical">HH {area.criticalCount}</span>}
          {area.offlineCount  > 0 && <span className="area-stat-chip chip-offline">— {area.offlineCount}</span>}
          <span style={{ color: 'var(--text-tertiary)', fontSize: 12, marginLeft: 4 }}>{area.equipmentCount} thiết bị</span>
          <span style={{ color: 'var(--text-tertiary)', fontSize: 12, marginLeft: 4 }}>
            · {area.lastDataTime ? `Dữ liệu lúc ${dayjs(area.lastDataTime).format('HH:mm:ss DD/MM')}` : 'Chưa có dữ liệu'}
          </span>
        </div>
      </div>

      {/* Equipment grid */}
      <div className="area-body">
        <div className="eq-grid">
          {area.equipments.map(eq => (
            <EquipmentCard key={eq.equipmentId} equipment={eq} />
          ))}
        </div>
      </div>
    </div>
  );
}
