import { useEffect, useState } from 'react';
import { Table, Tabs, Tag, Button, Space, Typography, Modal, Input, Card, Badge, Statistic, Row, Col } from 'antd';
import { CheckOutlined, CloseOutlined, AlertOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { alarmsApi } from '../../services/api';
import type { AlarmCurrent, AlarmHistory } from '../../types';
import { AlarmLevel, AlarmStatus } from '../../types';
import { alarmLevelColor, formatDuration } from '../../utils/alarmUtils';
import dayjs from 'dayjs';

const { Text } = Typography;

function getLevelTag(level: AlarmLevel) {
  return level === AlarmLevel.HighHigh
    ? <Tag color="error" style={{ fontWeight: 'bold' }}>HH</Tag>
    : <Tag color="warning" style={{ fontWeight: 'bold' }}>H</Tag>;
}

export default function Alarms() {
  const [active, setActive] = useState<AlarmCurrent[]>([]);
  const [history, setHistory] = useState<AlarmHistory[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [ackModal, setAckModal] = useState<{ open: boolean; id: number | null }>({ open: false, id: null });
  const [ackNote, setAckNote] = useState('');
  const [page, setPage] = useState(0);

  const loadActive = async () => {
    setLoading(true);
    try {
      const res = await alarmsApi.getActive();
      setActive(res.data);
    } catch {
      setActive(getMockActive());
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await alarmsApi.getHistory({ pageIndex: page, pageSize: 50 });
      setHistory(res.data.records);
      setTotal(res.data.total);
    } catch {
      setHistory(getMockHistory());
      setTotal(5);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadActive(); }, []);
  useEffect(() => { loadHistory(); }, [page]);

  const handleAck = async () => {
    if (!ackModal.id) return;
    await alarmsApi.acknowledge(ackModal.id, { acknowledgedBy: 'Operator', note: ackNote });
    setAckModal({ open: false, id: null });
    setAckNote('');
    loadActive();
  };

  const activeColumns: ColumnsType<AlarmCurrent> = [
    { title: 'Khu vực', dataIndex: 'areaName', width: 120 },
    { title: 'Thiết bị', dataIndex: 'equipmentName', width: 200 },
    { title: 'Tag', dataIndex: 'tagName', width: 140, render: v => <Text code style={{ fontSize: 12 }}>{v}</Text> },
    { title: 'Tín hiệu', dataIndex: 'signalName' },
    {
      title: 'Giá trị', dataIndex: 'currentValue', width: 110, align: 'right',
      render: (v: number, r: AlarmCurrent) => (
        <Text strong style={{ color: alarmLevelColor[r.alarmLevel] }}>
          {v?.toFixed(2)}{r.unit ? ' ' + r.unit : ''}
        </Text>
      )
    },
    { title: 'Ngưỡng', dataIndex: 'thresholdValue', width: 90, align: 'right', render: (v, r: AlarmCurrent) => `${v}${r.unit ? ' ' + r.unit : ''}` },
    { title: 'Mức', dataIndex: 'alarmLevel', width: 70, render: getLevelTag },
    { title: 'Bắt đầu', dataIndex: 'startTime', width: 130, render: v => dayjs(v).format('DD/MM HH:mm:ss') },
    { title: 'Thời gian', dataIndex: 'durationSeconds', width: 90, render: formatDuration },
    {
      title: 'Trạng thái', dataIndex: 'status', width: 120,
      render: (v: AlarmStatus) => v === AlarmStatus.Active
        ? <Badge status="error" text="Đang xảy ra" />
        : <Badge status="warning" text="Đã xác nhận" />
    },
    { title: 'Người xác nhận', dataIndex: 'acknowledgedBy', width: 130, render: v => v || '—' },
    {
      title: 'Thao tác', width: 140,
      render: (_: unknown, r: AlarmCurrent) => (
        <Space size="small">
          {r.status === AlarmStatus.Active && (
            <Button size="small" type="primary" icon={<CheckOutlined />}
              onClick={() => setAckModal({ open: true, id: r.id })}>
              ACK
            </Button>
          )}
          {r.status === AlarmStatus.Acknowledged && (
            <Button size="small" danger icon={<CloseOutlined />}
              onClick={() => alarmsApi.clear(r.id, 'Operator').then(loadActive)}>
              Clear
            </Button>
          )}
        </Space>
      )
    },
  ];

  const historyColumns: ColumnsType<AlarmHistory> = [
    { title: 'Khu vực', dataIndex: 'areaName', width: 120 },
    { title: 'Thiết bị', dataIndex: 'equipmentName', width: 200 },
    { title: 'Tag', dataIndex: 'tagName', width: 140, render: v => <Text code style={{ fontSize: 12 }}>{v}</Text> },
    { title: 'Tín hiệu', dataIndex: 'signalName' },
    {
      title: 'Giá trị', dataIndex: 'triggerValue', width: 110, align: 'right',
      render: (v: number, r: AlarmHistory) => (
        <Text strong style={{ color: alarmLevelColor[r.alarmLevel] }}>{v?.toFixed(2)}{r.unit ? ' ' + r.unit : ''}</Text>
      )
    },
    { title: 'Mức', dataIndex: 'alarmLevel', width: 70, render: getLevelTag },
    { title: 'Bắt đầu', dataIndex: 'startTime', width: 130, render: v => dayjs(v).format('DD/MM HH:mm:ss') },
    { title: 'ACK', dataIndex: 'acknowledgedTime', width: 130, render: v => v ? dayjs(v).format('DD/MM HH:mm:ss') : '—' },
    { title: 'Cleared', dataIndex: 'clearedTime', width: 130, render: v => v ? dayjs(v).format('DD/MM HH:mm:ss') : '—' },
    { title: 'Thời gian', dataIndex: 'durationSeconds', width: 90, render: v => v ? formatDuration(v) : '—' },
    { title: 'Người xử lý', dataIndex: 'acknowledgedBy', width: 120, render: v => v || '—' },
    { title: 'Ghi chú', dataIndex: 'note', render: v => v || '—' },
  ];

  const hhCount = active.filter(a => a.alarmLevel === AlarmLevel.HighHigh).length;
  const hCount = active.filter(a => a.alarmLevel === AlarmLevel.High).length;
  const ackCount = active.filter(a => a.status === AlarmStatus.Acknowledged).length;

  return (
    <div>
      <Typography.Title level={4} style={{ marginBottom: 16 }}>
        <AlertOutlined /> Quản lý cảnh báo
      </Typography.Title>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card><Statistic title="Đang xảy ra" value={active.filter(a => a.status === AlarmStatus.Active).length} valueStyle={{ color: '#ff4d4f' }} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="Nguy hiểm HH" value={hhCount} valueStyle={{ color: '#ff4d4f' }} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="Cảnh báo H" value={hCount} valueStyle={{ color: '#faad14' }} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="Đã xác nhận" value={ackCount} valueStyle={{ color: '#1890ff' }} /></Card>
        </Col>
      </Row>

      <Tabs
        items={[
          {
            key: 'active',
            label: (
              <Space>
                Đang xảy ra
                {active.filter(a => a.status === AlarmStatus.Active).length > 0 && (
                  <Tag color="error">{active.filter(a => a.status === AlarmStatus.Active).length}</Tag>
                )}
              </Space>
            ),
            children: (
              <Card bodyStyle={{ padding: 0 }}>
                <Table
                  dataSource={active.filter(a => a.status === AlarmStatus.Active)}
                  columns={activeColumns}
                  rowKey="id"
                  loading={loading}
                  size="middle"
                  pagination={false}
                  scroll={{ x: 1200 }}
                  rowClassName={r => r.alarmLevel === AlarmLevel.HighHigh ? 'row-critical' : 'row-warning'}
                />
              </Card>
            )
          },
          {
            key: 'acked',
            label: <Space>Đã xác nhận {ackCount > 0 && <Tag color="blue">{ackCount}</Tag>}</Space>,
            children: (
              <Card bodyStyle={{ padding: 0 }}>
                <Table
                  dataSource={active.filter(a => a.status === AlarmStatus.Acknowledged)}
                  columns={activeColumns}
                  rowKey="id"
                  loading={loading}
                  size="middle"
                  pagination={false}
                  scroll={{ x: 1200 }}
                />
              </Card>
            )
          },
          {
            key: 'history',
            label: 'Lịch sử',
            children: (
              <Card bodyStyle={{ padding: 0 }}>
                <Table
                  dataSource={history}
                  columns={historyColumns}
                  rowKey="id"
                  loading={loading}
                  size="middle"
                  pagination={{ total, pageSize: 50, current: page + 1, onChange: p => setPage(p - 1), showTotal: t => `${t} bản ghi` }}
                  scroll={{ x: 1400 }}
                />
              </Card>
            )
          },
        ]}
      />

      <Modal
        title="Xác nhận cảnh báo (ACK)"
        open={ackModal.open}
        onOk={handleAck}
        onCancel={() => setAckModal({ open: false, id: null })}
        okText="Xác nhận"
        cancelText="Hủy"
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>Ghi chú xử lý:</Text>
          <Input.TextArea
            rows={3}
            value={ackNote}
            onChange={e => setAckNote(e.target.value)}
            placeholder="Nhập ghi chú (tùy chọn)"
          />
        </Space>
      </Modal>
    </div>
  );
}

function getMockActive(): AlarmCurrent[] {
  return [
    { id: 1, tagId: 1, tagName: 'TE1548A_RTM', signalName: 'Nhiệt độ cuộn dây A', equipmentId: 2, equipmentName: 'Hộp gió UDD', areaName: 'Bản lược', alarmLevel: AlarmLevel.HighHigh, alarmLevelText: 'HH', currentValue: 165.4, thresholdValue: 145, unit: '°C', startTime: new Date(Date.now() - 600000).toISOString(), lastUpdateTime: new Date().toISOString(), status: AlarmStatus.Active, durationSeconds: 600 },
    { id: 2, tagId: 4, tagName: '3VT13_RTM', signalName: 'Rung Y trước quạt', equipmentId: 1, equipmentName: 'Hộp gió DDD', areaName: 'Bản lược', alarmLevel: AlarmLevel.High, alarmLevelText: 'H', currentValue: 8.2, thresholdValue: 7.1, unit: 'mm/s', startTime: new Date(Date.now() - 180000).toISOString(), lastUpdateTime: new Date().toISOString(), status: AlarmStatus.Acknowledged, acknowledgedBy: 'Operator 1', durationSeconds: 180 },
  ];
}

function getMockHistory(): AlarmHistory[] {
  return [
    { id: 1, tagId: 1, tagName: 'TE1548A_RTM', signalName: 'Nhiệt độ cuộn dây A', equipmentId: 2, equipmentName: 'Hộp gió UDD', areaName: 'Bản lược', alarmLevel: AlarmLevel.High, alarmLevelText: 'H', triggerValue: 135.2, thresholdValue: 130, unit: '°C', startTime: new Date(Date.now() - 86400000).toISOString(), acknowledgedTime: new Date(Date.now() - 84000000).toISOString(), clearedTime: new Date(Date.now() - 82000000).toISOString(), acknowledgedBy: 'Operator', durationSeconds: 2400 },
  ];
}
