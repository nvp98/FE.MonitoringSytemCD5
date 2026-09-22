import { useState, useEffect } from 'react';
import { Card, Table, Select, DatePicker, Button, Space, Typography, Tag, Row, Col } from 'antd';
import { DownloadOutlined, SearchOutlined, HistoryOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { monitoringApi, areasApi, equipmentsApi } from '../../services/api';
import type { HistoryRecord, Area, Equipment } from '../../types';
import { AlarmLevel } from '../../types';
import { alarmLevelColor } from '../../utils/alarmUtils';
import dayjs, { Dayjs } from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export default function History() {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [areas, setAreas] = useState<Area[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [filters, setFilters] = useState({
    areaId: undefined as number | undefined,
    equipmentId: undefined as number | undefined,
    tagId: undefined as number | undefined,
    dateRange: [dayjs().subtract(24, 'hour'), dayjs()] as [Dayjs, Dayjs],
    pageIndex: 0,
    pageSize: 100,
  });

  useEffect(() => {
    areasApi.getAll().then(r => setAreas(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (filters.areaId) {
      equipmentsApi.getAll(filters.areaId).then(r => setEquipments(r.data)).catch(() => {});
    }
  }, [filters.areaId]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const res = await monitoringApi.getHistory({
        areaId: filters.areaId,
        equipmentId: filters.equipmentId,
        fromDate: filters.dateRange[0].toISOString(),
        toDate: filters.dateRange[1].toISOString(),
        pageIndex: filters.pageIndex,
        pageSize: filters.pageSize,
      });
      setRecords(res.data.records);
      setTotal(res.data.total);
    } catch {
      setRecords(getMockRecords());
      setTotal(10);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { handleSearch(); }, [filters.pageIndex]);

  const columns: ColumnsType<HistoryRecord> = [
    { title: 'Thời gian', dataIndex: 'timestamp', width: 140, render: v => dayjs(v).format('DD/MM/YY HH:mm:ss'), sorter: true },
    { title: 'Khu vực', dataIndex: 'areaName', width: 120 },
    { title: 'Thiết bị', dataIndex: 'equipmentName', width: 200 },
    { title: 'Tag', dataIndex: 'tagName', width: 140, render: v => <Text code style={{ fontSize: 12 }}>{v}</Text> },
    { title: 'Tín hiệu', dataIndex: 'signalName' },
    {
      title: 'Giá trị', dataIndex: 'value', width: 120, align: 'right',
      render: (v: number, r: HistoryRecord) => {
        const lvl = r.status === 'HH' ? AlarmLevel.HighHigh : r.status === 'H' ? AlarmLevel.High : AlarmLevel.Normal;
        return <Text strong style={{ color: alarmLevelColor[lvl] }}>{v?.toFixed(3)}{r.unit ? ' ' + r.unit : ''}</Text>;
      }
    },
    { title: 'Quality', dataIndex: 'quality', width: 90, render: v => <Tag color={v === 'Good' ? 'success' : 'error'}>{v}</Tag> },
    {
      title: 'Trạng thái', dataIndex: 'status', width: 100,
      render: v => v === 'Normal' ? <Tag color="success">Normal</Tag>
        : v === 'H' ? <Tag color="warning">H</Tag>
        : <Tag color="error">HH</Tag>
    },
  ];

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>
        <HistoryOutlined /> Lịch sử dữ liệu
      </Title>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 8]}>
          <Col xs={24} md={6}>
            <Select
              placeholder="Khu vực"
              allowClear
              style={{ width: '100%' }}
              onChange={v => setFilters(f => ({ ...f, areaId: v, equipmentId: undefined }))}
              options={areas.map(a => ({ label: a.tenKhuVuc, value: a.id }))}
            />
          </Col>
          <Col xs={24} md={6}>
            <Select
              placeholder="Thiết bị"
              allowClear
              style={{ width: '100%' }}
              value={filters.equipmentId}
              onChange={v => setFilters(f => ({ ...f, equipmentId: v }))}
              options={equipments.map(e => ({ label: e.equipmentName, value: e.id }))}
            />
          </Col>
          <Col xs={24} md={8}>
            <RangePicker
              showTime
              style={{ width: '100%' }}
              value={filters.dateRange}
              onChange={v => v && setFilters(f => ({ ...f, dateRange: v as [Dayjs, Dayjs] }))}
              presets={[
                { label: '8 giờ', value: [dayjs().subtract(8, 'hour'), dayjs()] },
                { label: '24 giờ', value: [dayjs().subtract(24, 'hour'), dayjs()] },
                { label: '7 ngày', value: [dayjs().subtract(7, 'day'), dayjs()] },
              ]}
            />
          </Col>
          <Col xs={24} md={4}>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>Tìm kiếm</Button>
              <Button icon={<DownloadOutlined />} onClick={() => alert('Export...')}>Export</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card bodyStyle={{ padding: 0 }}>
        <Table
          dataSource={records}
          columns={columns}
          rowKey="id"
          loading={loading}
          size="middle"
          pagination={{
            total, pageSize: filters.pageSize, current: filters.pageIndex + 1,
            onChange: p => setFilters(f => ({ ...f, pageIndex: p - 1 })),
            showTotal: t => `${t} bản ghi`,
            showSizeChanger: true,
            pageSizeOptions: ['50', '100', '200', '500'],
            onShowSizeChange: (_, s) => setFilters(f => ({ ...f, pageSize: s }))
          }}
          scroll={{ x: 1100 }}
        />
      </Card>
    </div>
  );
}

function getMockRecords(): HistoryRecord[] {
  return Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    tagId: 1,
    tagName: 'TE1548A_RTM',
    signalName: 'Nhiệt độ cuộn dây A',
    equipmentName: 'Hộp gió UDD',
    areaName: 'Bản lược',
    unit: '°C',
    value: 110 + Math.random() * 50,
    quality: 'Good',
    status: Math.random() > 0.8 ? 'H' : 'Normal',
    timestamp: new Date(Date.now() - i * 600000).toISOString(),
  }));
}
