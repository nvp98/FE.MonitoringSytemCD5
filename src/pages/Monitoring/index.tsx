import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Row, Col, Card, Table, Tag, Space, Typography, Select, Button,
  Statistic, Tabs, Badge, Spin, Tooltip, Empty
} from 'antd';
import {
  ArrowLeftOutlined, LineChartOutlined, BellOutlined,
  ToolOutlined, ReloadOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { equipmentsApi, areasApi, monitoringApi } from '../../services/api';
import type { Equipment, Area, TagCurrentValue } from '../../types';
import { AlarmLevel } from '../../types';
import { alarmLevelColor, formatValue } from '../../utils/alarmUtils';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

export default function Monitoring() {
  const { equipmentId } = useParams<{ equipmentId: string }>();
  const navigate = useNavigate();
  const [areas, setAreas] = useState<Area[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [selectedArea, setSelectedArea] = useState<number | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<number | null>(null);
  const [tagValues, setTagValues] = useState<TagCurrentValue[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    areasApi.getAll().then(r => setAreas(r.data)).catch(() => setAreas(getMockAreas()));
  }, []);

  useEffect(() => {
    if (equipmentId) {
      setSelectedEquipment(parseInt(equipmentId));
    }
  }, [equipmentId]);

  useEffect(() => {
    if (selectedArea) {
      equipmentsApi.getAll(selectedArea)
        .then(r => setEquipments(r.data))
        .catch(() => setEquipments(getMockEquipments()));
    } else {
      equipmentsApi.getAll()
        .then(r => setEquipments(r.data))
        .catch(() => setEquipments(getMockEquipments()));
    }
  }, [selectedArea]);

  const loadTagValues = async (id: number) => {
    setLoading(true);
    try {
      const res = await monitoringApi.getCurrentValues(id);
      setTagValues(res.data);
    } catch {
      setTagValues(getMockTagValues());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedEquipment) {
      loadTagValues(selectedEquipment);
      const interval = setInterval(() => loadTagValues(selectedEquipment), 10000);
      return () => clearInterval(interval);
    }
  }, [selectedEquipment]);

  const currentEquipment = equipments.find(e => e.id === selectedEquipment);

  const columns: ColumnsType<TagCurrentValue> = [
    {
      title: 'Tag',
      dataIndex: 'tagName',
      width: 140,
      render: (v: string) => <Text code style={{ fontSize: 12 }}>{v}</Text>,
    },
    {
      title: 'Tín hiệu',
      dataIndex: 'signalName',
      render: (v: string) => <Text style={{ fontSize: 13 }}>{v}</Text>,
    },
    {
      title: 'Giá trị',
      dataIndex: 'value',
      width: 130,
      align: 'right',
      render: (v: number, r: TagCurrentValue) => (
        <Text
          strong
          style={{
            color: alarmLevelColor[r.alarmLevel],
            fontSize: 14,
            animation: r.alarmLevel !== AlarmLevel.Normal ? 'pulse 1.5s ease-in-out infinite' : undefined,
          }}
        >
          {formatValue(v, r.unit)}
        </Text>
      ),
    },
    {
      title: 'Định mức',
      dataIndex: 'ratedValue',
      width: 100,
      align: 'right',
      render: (v: number, r: TagCurrentValue) => <Text type="secondary">{formatValue(v, r.unit)}</Text>,
    },
    {
      title: 'H',
      dataIndex: 'highLimit',
      width: 90,
      align: 'right',
      render: (v: number, r: TagCurrentValue) => (
        <Text style={{ color: '#faad14' }}>{v !== undefined ? formatValue(v, r.unit) : '—'}</Text>
      ),
    },
    {
      title: 'HH',
      dataIndex: 'highHighLimit',
      width: 90,
      align: 'right',
      render: (v: number, r: TagCurrentValue) => (
        <Text style={{ color: '#ff4d4f' }}>{v !== undefined ? formatValue(v, r.unit) : '—'}</Text>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'alarmLevel',
      width: 120,
      render: (v: AlarmLevel) => {
        if (v === AlarmLevel.Normal) return <Badge status="success" text="Bình thường" />;
        if (v === AlarmLevel.High) return <Badge status="warning" text={<Text style={{ color: '#faad14', fontWeight: 'bold' }}>Cảnh báo H</Text>} />;
        return <Badge status="error" text={<Text style={{ color: '#ff4d4f', fontWeight: 'bold' }}>Nguy hiểm HH</Text>} />;
      },
    },
    {
      title: 'Cập nhật',
      dataIndex: 'timestamp',
      width: 130,
      render: (v: string) => <Text style={{ fontSize: 11 }} type="secondary">{v ? dayjs(v).format('HH:mm:ss') : '—'}</Text>,
    },
    {
      title: '',
      width: 80,
      render: (_: unknown, r: TagCurrentValue) => (
        <Tooltip title="Xem trend">
          <Button
            size="small"
            icon={<LineChartOutlined />}
            onClick={() => navigate(`/trend?tagId=${r.tagId}`)}
          />
        </Tooltip>
      ),
    },
  ];

  const warningCount = tagValues.filter(t => t.alarmLevel === AlarmLevel.High).length;
  const criticalCount = tagValues.filter(t => t.alarmLevel === AlarmLevel.HighHigh).length;

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/')}>Tổng quan</Button>
        <Title level={4} style={{ margin: 0 }}>Giám sát thiết bị</Title>
      </Space>

      {/* Filters */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap>
          <Select
            placeholder="Chọn khu vực"
            allowClear
            style={{ width: 200 }}
            onChange={v => { setSelectedArea(v); setSelectedEquipment(null); }}
          >
            {areas.map(a => <Option key={a.id} value={a.id}>{a.areaName}</Option>)}
          </Select>
          <Select
            placeholder="Chọn thiết bị"
            allowClear
            style={{ width: 280 }}
            value={selectedEquipment}
            onChange={v => { setSelectedEquipment(v); navigate(`/monitoring/${v}`); }}
          >
            {equipments.map(e => (
              <Option key={e.id} value={e.id}>
                <Space>
                  {e.equipmentName}
                  {e.status === 2 && <Tag color="error">HH</Tag>}
                  {e.status === 1 && <Tag color="warning">H</Tag>}
                </Space>
              </Option>
            ))}
          </Select>
          {selectedEquipment && (
            <Button icon={<ReloadOutlined />} onClick={() => loadTagValues(selectedEquipment)}>
              Làm mới
            </Button>
          )}
        </Space>
      </Card>

      {selectedEquipment && currentEquipment && (
        <>
          {/* Equipment Summary */}
          <Card style={{ marginBottom: 16 }}>
            <Row gutter={[16, 8]}>
              <Col xs={24} md={12}>
                <Space direction="vertical" size={0}>
                  <Title level={5} style={{ margin: 0 }}>{currentEquipment.equipmentName}</Title>
                  <Text type="secondary">{currentEquipment.equipmentCode} — {currentEquipment.areaName}</Text>
                </Space>
              </Col>
              <Col xs={8} md={4}>
                <Statistic title="Tổng Tag" value={tagValues.length} />
              </Col>
              <Col xs={8} md={4}>
                <Statistic title={<Text style={{ color: '#faad14' }}>Cảnh báo H</Text>} value={warningCount} valueStyle={{ color: '#faad14' }} />
              </Col>
              <Col xs={8} md={4}>
                <Statistic title={<Text style={{ color: '#ff4d4f' }}>Nguy hiểm HH</Text>} value={criticalCount} valueStyle={{ color: '#ff4d4f' }} />
              </Col>
            </Row>
          </Card>

          {/* Tag Table */}
          <Tabs
            items={[
              {
                key: 'tags',
                label: <Space><BellOutlined />Danh sách Tag</Space>,
                children: (
                  <Card bodyStyle={{ padding: 0 }}>
                    <Spin spinning={loading}>
                      <Table
                        dataSource={tagValues}
                        columns={columns}
                        rowKey="tagId"
                        size="middle"
                        pagination={{ pageSize: 20, showTotal: t => `${t} Tag` }}
                        rowClassName={r =>
                          r.alarmLevel === AlarmLevel.HighHigh ? 'row-critical'
                            : r.alarmLevel === AlarmLevel.High ? 'row-warning'
                            : ''
                        }
                        scroll={{ x: 900 }}
                      />
                    </Spin>
                  </Card>
                )
              },
              {
                key: 'alarms',
                label: <Space><BellOutlined />{warningCount + criticalCount > 0 && <Tag color="red">{warningCount + criticalCount}</Tag>}Cảnh báo</Space>,
                children: (
                  <Card>
                    {warningCount + criticalCount === 0
                      ? <Empty description="Không có cảnh báo" />
                      : <Table
                        dataSource={tagValues.filter(t => t.alarmLevel !== AlarmLevel.Normal)}
                        columns={columns.slice(0, -1)}
                        rowKey="tagId"
                        size="middle"
                        pagination={false}
                      />
                    }
                  </Card>
                )
              },
              {
                key: 'maintenance',
                label: <Space><ToolOutlined />Bảo trì</Space>,
                children: <Card><Empty description="Chưa có lịch bảo trì" /></Card>
              },
            ]}
          />
        </>
      )}

      {!selectedEquipment && (
        <Card>
          <Empty description="Chọn thiết bị để xem dữ liệu giám sát" />
        </Card>
      )}
    </div>
  );
}

function getMockAreas(): Area[] {
  return [
    { id: 1, areaCode: 'BL', areaName: 'Bản lược', sortOrder: 1, isActive: true, equipmentCount: 8, normalCount: 6, warningCount: 1, criticalCount: 1, offlineCount: 0 },
    { id: 2, areaCode: 'LQ', areaName: 'Lò quay', sortOrder: 2, isActive: true, equipmentCount: 6, normalCount: 5, warningCount: 1, criticalCount: 0, offlineCount: 0 },
    { id: 3, areaCode: 'LMV', areaName: 'Làm mát vòng', sortOrder: 3, isActive: true, equipmentCount: 8, normalCount: 8, warningCount: 0, criticalCount: 0, offlineCount: 0 },
  ];
}

function getMockEquipments(): Equipment[] {
  return [
    { id: 1, equipmentCode: 'BL-001', equipmentName: 'Hộp gió DDD', areaId: 1, areaName: 'Bản lược', sortOrder: 1, isActive: true, status: 1, tagCount: 10, normalTagCount: 8, warningTagCount: 2, criticalTagCount: 0 },
    { id: 2, equipmentCode: 'BL-002', equipmentName: 'Hộp gió UDD', areaId: 1, areaName: 'Bản lược', sortOrder: 2, isActive: true, status: 2, tagCount: 14, normalTagCount: 10, warningTagCount: 2, criticalTagCount: 2 },
  ];
}

function getMockTagValues(): TagCurrentValue[] {
  return [
    { tagId: 1, tagName: 'TE1548A_RTM', signalName: 'Nhiệt độ cuộn dây A', unit: '°C', value: 125.4, alarmLevel: AlarmLevel.Normal, highLimit: 130, highHighLimit: 145, ratedValue: 130, timestamp: new Date().toISOString(), quality: 'Good' },
    { tagId: 2, tagName: 'TE1548B_RTM', signalName: 'Nhiệt độ cuộn dây B', unit: '°C', value: 138.2, alarmLevel: AlarmLevel.High, highLimit: 130, highHighLimit: 145, ratedValue: 130, timestamp: new Date().toISOString(), quality: 'Good' },
    { tagId: 3, tagName: 'TE1548C_RTM', signalName: 'Nhiệt độ cuộn dây C', unit: '°C', value: 158.9, alarmLevel: AlarmLevel.HighHigh, highLimit: 130, highHighLimit: 145, ratedValue: 130, timestamp: new Date().toISOString(), quality: 'Good' },
    { tagId: 4, tagName: '3VT13_RTM', signalName: 'Rung Y trước quạt', unit: 'mm/s', value: 3.1, alarmLevel: AlarmLevel.Normal, highLimit: 7.1, highHighLimit: 11.2, ratedValue: 7.1, timestamp: new Date().toISOString(), quality: 'Good' },
    { tagId: 5, tagName: '3VT14_RTM', signalName: 'Rung X trước quạt', unit: 'mm/s', value: 4.8, alarmLevel: AlarmLevel.Normal, highLimit: 7.1, highHighLimit: 11.2, ratedValue: 7.1, timestamp: new Date().toISOString(), quality: 'Good' },
  ];
}
