import { Tooltip } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ToolOutlined } from '@ant-design/icons';
import type { EquipmentStatusItem } from '../../types';
import { EquipmentStatus, AlarmLevel } from '../../types';

interface Props {
  equipment: EquipmentStatusItem;
}

const cardClass: Record<EquipmentStatus, string> = {
  [EquipmentStatus.Normal]:   '',
  [EquipmentStatus.Warning]:  'eq-warning',
  [EquipmentStatus.Critical]: 'eq-critical',
  [EquipmentStatus.Offline]:  '',
};

const levelPill: Record<EquipmentStatus, { text: string; cls: string }> = {
  [EquipmentStatus.Normal]:   { text: 'Bình thường', cls: 'level-pill-normal' },
  [EquipmentStatus.Warning]:  { text: 'Cảnh báo H',  cls: 'level-pill-warning' },
  [EquipmentStatus.Critical]: { text: 'Nguy hiểm HH', cls: 'level-pill-critical' },
  [EquipmentStatus.Offline]:  { text: 'Offline',      cls: 'level-pill-offline' },
};

function metricValueClass(level: AlarmLevel) {
  if (level === AlarmLevel.HighHigh) return 'eq-metric-value is-critical';
  if (level === AlarmLevel.High) return 'eq-metric-value is-warning';
  return 'eq-metric-value';
}

export function EquipmentCard({ equipment }: Props) {
  const navigate = useNavigate();
  const pill = levelPill[equipment.status];

  return (
    <Tooltip title="Click để xem chi tiết Tag" mouseEnterDelay={0.6}>
      <div
        className={`eq-card ${cardClass[equipment.status]}`}
        onClick={() => navigate(`/monitoring/${equipment.equipmentId}`)}
        role="button"
      >
        <div className="eq-card-top">
          <div className="eq-card-title">
            <div className="eq-card-name" title={equipment.equipmentName}>{equipment.equipmentName}</div>
            <span className={`level-pill ${pill.cls}`} style={{ marginTop: 4, display: 'inline-block' }}>{pill.text}</span>
          </div>
          <div className="eq-card-thumb"><ToolOutlined /></div>
        </div>

        {equipment.sampleMetrics && equipment.sampleMetrics.length > 0 ? (
          <div className="eq-metrics">
            {equipment.sampleMetrics.slice(0, 4).map((m, i) => (
              <div key={i}>
                <div className="eq-metric-label" title={m.label}>{m.label}</div>
                <div className={metricValueClass(m.alarmLevel)}>{m.value}{m.unit}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="eq-badges">
            <span className="eq-badge eq-badge-count">{equipment.tagCount} Tag</span>
            {equipment.criticalTagCount > 0 && <span className="eq-badge eq-badge-hh">HH {equipment.criticalTagCount}</span>}
            {equipment.warningTagCount > 0 && <span className="eq-badge eq-badge-h">H {equipment.warningTagCount}</span>}
          </div>
        )}
      </div>
    </Tooltip>
  );
}
