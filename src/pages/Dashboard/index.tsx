import { useEffect, useState } from 'react';
import { Row, Col, Select, Switch, Alert, Empty, Spin } from 'antd';
import { ClusterOutlined, DotChartOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { monitoringApi } from '../../services/api';
import type { DashboardSummary, RecentAlarm, EquipmentStatusItem } from '../../types';
import { AlarmLevel, EquipmentStatus } from '../../types';
import { AreaPanel } from '../../components/monitoring/AreaPanel';
import { formatValue } from '../../utils/alarmUtils';
import { useSignalR } from '../../hooks/useSignalR';
import dayjs from 'dayjs';

export default function Dashboard() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [areaFilter, setAreaFilter] = useState<number | null>(null);
  const [onlyAlarming, setOnlyAlarming] = useState(false);

  const load = async () => {
    try {
      const res = await monitoringApi.getDashboard();
      setData(res.data);
      setError(null);
    } catch {
      setError('Không thể kết nối đến máy chủ. Đang hiển thị dữ liệu demo.');
      setData(getMockData());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  useSignalR({
    TagValueChanged: () => load(),
    AlarmRaised: () => load(),
    AlarmCleared: () => load(),
  });

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 360 }}>
      <Spin size="large" tip="Đang tải dữ liệu..." />
    </div>
  );

  const summary = data!;
  const totalMeasurePoints = summary.areaStatuses.reduce((sum, a) =>
    sum + a.equipments.reduce((s, e) => s + e.tagCount, 0), 0);

  const donutData = [
    { name: 'Bình thường', value: summary.normalCount, color: 'var(--status-normal)' },
    { name: 'Cảnh báo H', value: summary.warningCount, color: 'var(--status-warning)' },
    { name: 'Nguy hiểm HH', value: summary.criticalCount, color: 'var(--status-critical)' },
    { name: 'Offline', value: summary.offlineCount, color: 'var(--status-offline)' },
  ];

  const donutOption: EChartsOption = {
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie',
      radius: ['62%', '86%'],
      avoidLabelOverlap: false,
      label: { show: false },
      labelLine: { show: false },
      itemStyle: { borderColor: '#121a2e', borderWidth: 2 },
      data: donutData.map(d => ({
        name: d.name,
        value: d.value,
        itemStyle: { color: d.color.startsWith('var') ? resolveVar(d.color) : d.color },
      })),
    }],
  };

  const flaggedEquipment: EquipmentStatusItem[] = summary.areaStatuses
    .flatMap(a => a.equipments.map(e => ({ ...e, __area: a.areaName })))
    .filter(e => e.status !== EquipmentStatus.Normal)
    .sort((a, b) => b.status - a.status)
    .slice(0, 6) as (EquipmentStatusItem & { __area: string })[];

  const visibleAreas = summary.areaStatuses
    .filter(a => !areaFilter || a.areaId === areaFilter)
    .map(a => onlyAlarming ? { ...a, equipments: a.equipments.filter(e => e.status !== EquipmentStatus.Normal) } : a)
    .filter(a => a.equipments.length > 0);

  return (
    <div>
      {error && <Alert message={error} type="warning" showIcon style={{ marginBottom: 16, borderRadius: 8 }} />}

      <Row gutter={16}>
        {/* ── Left rail ── */}
        <Col xs={24} xl={6}>
          <div className="side-panel">
            <div className="side-panel-title">Phạm vi giám sát</div>
            <div className="range-stat-row">
              <div className="range-stat-icon"><ClusterOutlined /></div>
              <div>
                <div className="range-stat-label">Số lượng thiết bị</div>
                <span className="range-stat-value">{summary.totalEquipment}</span>
                <span className="range-stat-unit">thiết bị</span>
              </div>
            </div>
            <div className="range-stat-row">
              <div className="range-stat-icon"><DotChartOutlined /></div>
              <div>
                <div className="range-stat-label">Số điểm đo</div>
                <span className="range-stat-value">{totalMeasurePoints}</span>
                <span className="range-stat-unit">Tag</span>
              </div>
            </div>
          </div>

          <div className="side-panel">
            <div className="side-panel-title">Phân bố trạng thái cảnh báo</div>
            <div className="donut-wrap">
              <div style={{ width: 120, height: 120, position: 'relative', flexShrink: 0 }}>
                <ReactECharts option={donutOption} style={{ width: 120, height: 120 }} opts={{ renderer: 'svg' }} />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', pointerEvents: 'none' }}>
                  <div className="donut-center-value">{summary.totalEquipment}</div>
                  <div className="donut-center-sub">Tổng thiết bị</div>
                </div>
              </div>
              <div className="donut-legend">
                {donutData.map(d => (
                  <div key={d.name} className="donut-legend-row">
                    <span className="donut-legend-dot" style={{ background: d.color.startsWith('var') ? resolveVar(d.color) : d.color }} />
                    <span className="donut-legend-name">{d.name}</span>
                    <span className="donut-legend-val">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="side-panel">
            <div className="side-panel-title">
              Cảnh báo mới nhất {summary.activeAlarmCount > 0 && <span className="level-pill level-pill-critical" style={{ marginLeft: 6 }}>{summary.activeAlarmCount}</span>}
            </div>
            {summary.recentAlarms.length === 0 ? (
              <Empty description="Không có cảnh báo" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              summary.recentAlarms.slice(0, 6).map(a => <RecentAlarmRow key={a.alarmId} alarm={a} />)
            )}
          </div>

          <div className="side-panel">
            <div className="side-panel-title">Thiết bị cần chú ý</div>
            {flaggedEquipment.length === 0 ? (
              <Empty description="Tất cả thiết bị bình thường" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              flaggedEquipment.map(e => (
                <div className="mini-list-item" key={e.equipmentId}>
                  <div className="mini-list-main">
                    <div className="mini-list-name">{e.equipmentName}</div>
                    <div className="mini-list-sub">{(e as unknown as { __area: string }).__area}</div>
                  </div>
                  <span className={`level-pill ${e.status === EquipmentStatus.Critical ? 'level-pill-critical' : 'level-pill-warning'}`}>
                    {e.status === EquipmentStatus.Critical ? 'HH' : 'H'}
                  </span>
                </div>
              ))
            )}
          </div>
        </Col>

        {/* ── Main column ── */}
        <Col xs={24} xl={18}>
          <div className="dash-toolbar">
            <Select
              placeholder="Tất cả khu vực"
              allowClear
              style={{ width: 200 }}
              value={areaFilter ?? undefined}
              onChange={v => setAreaFilter(v ?? null)}
              options={summary.areaStatuses.map(a => ({ label: a.areaName, value: a.areaId }))}
            />
            <span className="dash-toolbar-chip" style={{ background: 'rgba(255,176,32,.14)', color: 'var(--status-warning)' }}>
              Đang chờ xử lý: {summary.activeAlarmCount} cảnh báo
            </span>
            <span className="dash-toolbar-chip" style={{ background: 'rgba(51,214,138,.12)', color: 'var(--status-normal)' }}>
              Bình thường: {summary.normalCount}/{summary.totalEquipment}
            </span>
            <div className="dash-toolbar-sep" />
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              Chỉ hiện thiết bị có cảnh báo
              <Switch size="small" checked={onlyAlarming} onChange={setOnlyAlarming} />
            </span>
          </div>

          {visibleAreas.length === 0
            ? <Empty description="Không có thiết bị phù hợp bộ lọc" style={{ marginTop: 60 }} />
            : visibleAreas.map(area => <AreaPanel key={area.areaId} area={area} />)
          }
        </Col>
      </Row>
    </div>
  );
}

function RecentAlarmRow({ alarm }: { alarm: RecentAlarm }) {
  const isCritical = alarm.alarmLevel === AlarmLevel.HighHigh;
  return (
    <div className="mini-list-item">
      <div className="mini-list-main">
        <div className="mini-list-name">{alarm.equipmentName}</div>
        <div className="mini-list-sub">{alarm.areaName} · {formatValue(alarm.currentValue, alarm.unit)}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <span className={`level-pill ${isCritical ? 'level-pill-critical' : 'level-pill-warning'}`}>{isCritical ? 'HH' : 'H'}</span>
        <div className="mini-list-time">{dayjs(alarm.startTime).format('HH:mm DD/MM')}</div>
      </div>
    </div>
  );
}

function resolveVar(v: string) {
  const map: Record<string, string> = {
    'var(--status-normal)': '#33d68a',
    'var(--status-warning)': '#ffb020',
    'var(--status-critical)': '#ff4d5e',
    'var(--status-offline)': '#5b6478',
  };
  return map[v] ?? v;
}

function getMockData(): DashboardSummary {
  return {
    totalEquipment: 18,
    normalCount: 16,
    warningCount: 1,
    criticalCount: 1,
    offlineCount: 0,
    activeAlarmCount: 5,
    highAlarmCount: 3,
    highHighAlarmCount: 2,
    areaStatuses: [
      {
        areaId: 1, areaName: 'Bản lược', equipmentCount: 8,
        normalCount: 6, warningCount: 1, criticalCount: 1, offlineCount: 0,
        equipments: [
          { equipmentId: 1, equipmentCode: 'BL-001', equipmentName: 'Hộp gió DDD', status: 1, tagCount: 10, normalTagCount: 8, warningTagCount: 2, criticalTagCount: 0 },
          {
            equipmentId: 2, equipmentCode: 'BL-002', equipmentName: 'Hộp gió UDD', status: 2, tagCount: 14, normalTagCount: 10, warningTagCount: 2, criticalTagCount: 2,
            sampleMetrics: [
              { label: 'Không dẫn động 1H', value: 0.277, unit: ' mm/s', alarmLevel: AlarmLevel.Normal },
              { label: 'Không dẫn động 1H', value: 43, unit: '°C', alarmLevel: AlarmLevel.High },
              { label: 'Dẫn động 2H', value: 0.312, unit: ' mm/s', alarmLevel: AlarmLevel.Normal },
              { label: 'Dẫn động 2H', value: 45, unit: '°C', alarmLevel: AlarmLevel.HighHigh },
            ],
          },
          { equipmentId: 3, equipmentCode: 'BL-003', equipmentName: 'Hộp gió TPH', status: 0, tagCount: 10, normalTagCount: 10, warningTagCount: 0, criticalTagCount: 0 },
          { equipmentId: 4, equipmentCode: 'BL-004', equipmentName: 'Hộp gió PH', status: 0, tagCount: 16, normalTagCount: 16, warningTagCount: 0, criticalTagCount: 0 },
        ]
      },
      {
        areaId: 2, areaName: 'Lò quay', equipmentCount: 6,
        normalCount: 5, warningCount: 1, criticalCount: 0, offlineCount: 0,
        equipments: [
          { equipmentId: 10, equipmentCode: 'LQ-001', equipmentName: 'Nhiệt độ vỏ lò quay', status: 1, tagCount: 1, normalTagCount: 0, warningTagCount: 1, criticalTagCount: 0 },
          { equipmentId: 11, equipmentCode: 'LQ-002', equipmentName: 'Đầu Lò quay', status: 0, tagCount: 1, normalTagCount: 1, warningTagCount: 0, criticalTagCount: 0 },
          { equipmentId: 12, equipmentCode: 'LQ-003', equipmentName: 'Nhiệt độ đầu lò quay', status: 0, tagCount: 4, normalTagCount: 4, warningTagCount: 0, criticalTagCount: 0 },
        ]
      },
      {
        areaId: 3, areaName: 'Làm mát vòng', equipmentCount: 4,
        normalCount: 4, warningCount: 0, criticalCount: 0, offlineCount: 0,
        equipments: [
          { equipmentId: 20, equipmentCode: 'LMV-001', equipmentName: 'Quạt Làm Mát vòng số 1', status: 0, tagCount: 15, normalTagCount: 15, warningTagCount: 0, criticalTagCount: 0 },
          { equipmentId: 21, equipmentCode: 'LMV-002', equipmentName: 'Quạt Làm Mát vòng số 2', status: 0, tagCount: 15, normalTagCount: 15, warningTagCount: 0, criticalTagCount: 0 },
          { equipmentId: 22, equipmentCode: 'LMV-003', equipmentName: 'Quạt Làm Mát vòng số 3', status: 0, tagCount: 15, normalTagCount: 15, warningTagCount: 0, criticalTagCount: 0 },
          { equipmentId: 23, equipmentCode: 'LMV-004', equipmentName: 'Quạt Làm Mát vòng số 4', status: 0, tagCount: 15, normalTagCount: 15, warningTagCount: 0, criticalTagCount: 0 },
        ]
      },
    ],
    recentAlarms: [
      { alarmId: 1, tagName: 'TE1548A_RTM', equipmentName: 'Hộp gió UDD', areaName: 'Bản lược', alarmLevel: AlarmLevel.HighHigh, currentValue: 165.4, unit: '°C', startTime: new Date().toISOString() },
      { alarmId: 2, tagName: '3VT13_RTM', equipmentName: 'Hộp gió DDD', areaName: 'Bản lược', alarmLevel: AlarmLevel.High, currentValue: 8.2, unit: 'mm/s', startTime: new Date(Date.now() - 180000).toISOString() },
      { alarmId: 3, tagName: 'TE2201_RTM', equipmentName: 'Nhiệt độ vỏ lò quay', areaName: 'Lò quay', alarmLevel: AlarmLevel.High, currentValue: 412, unit: '°C', startTime: new Date(Date.now() - 900000).toISOString() },
    ]
  };
}
