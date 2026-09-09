import { useEffect, useState } from 'react';
import { Card, Table, Tag, Button, Space, Typography, Badge, Alert } from 'antd';
import { ToolOutlined, PlusOutlined, CheckOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { maintenanceApi } from '../../services/api';
import dayjs from 'dayjs';

const { Title } = Typography;

interface MaintenanceRecord {
  id: number;
  equipmentName: string;
  areaName: string;
  title: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  cycleDays?: number;
  dueStatus: 'OK' | 'Due' | 'Overdue';
  responsiblePerson?: string;
}

export default function Maintenance() {
  const [data, setData] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await maintenanceApi.getAll();
      setData(res.data);
      setError(null);
    } catch {
      setError('Không thể kết nối đến máy chủ. Đang hiển thị dữ liệu demo.');
      setData(getMockData());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleComplete = async (id: number) => {
    try {
      await maintenanceApi.complete(id, { completedBy: 'Operator' });
    } finally {
      load();
    }
  };

  const columns: ColumnsType<MaintenanceRecord> = [
    { title: 'Khu vực', dataIndex: 'areaName', width: 150 },
    { title: 'Thiết bị', dataIndex: 'equipmentName', width: 220 },
    { title: 'Hạng mục', dataIndex: 'title' },
    { title: 'Lần gần nhất', dataIndex: 'lastMaintenanceDate', width: 120, render: v => v ? dayjs(v).format('DD/MM/YYYY') : '—' },
    { title: 'Lần tiếp theo', dataIndex: 'nextMaintenanceDate', width: 120, render: v => v ? dayjs(v).format('DD/MM/YYYY') : '—' },
    { title: 'Chu kỳ', dataIndex: 'cycleDays', width: 90, render: v => v ? `${v} ngày` : '—' },
    {
      title: 'Trạng thái', dataIndex: 'dueStatus', width: 110,
      render: v => v === 'OK' ? <Badge status="success" text="OK" />
        : v === 'Due' ? <Badge status="warning" text="Sắp đến hạn" />
        : <Badge status="error" text="Quá hạn" />
    },
    { title: 'Phụ trách', dataIndex: 'responsiblePerson', width: 150, render: v => v || '—' },
    {
      title: 'Thao tác', width: 160,
      render: (_, r: MaintenanceRecord) => (
        <Space size="small">
          {r.dueStatus !== 'OK' && (
            <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => handleComplete(r.id)}>
              Hoàn thành
            </Button>
          )}
        </Space>
      )
    },
  ];

  return (
    <div>
      {error && <Alert message={error} type="warning" showIcon style={{ marginBottom: 16, borderRadius: 8 }} />}

      <Space style={{ marginBottom: 16, justifyContent: 'space-between', width: '100%' }}>
        <Title level={4} style={{ margin: 0 }}>
          <ToolOutlined /> Bảo trì - Bảo dưỡng
        </Title>
        <Button type="primary" icon={<PlusOutlined />}>Tạo yêu cầu bảo trì</Button>
      </Space>

      <Space style={{ marginBottom: 16 }}>
        <Tag color="error" style={{ fontSize: 13 }}>Quá hạn: {data.filter(d => d.dueStatus === 'Overdue').length}</Tag>
        <Tag color="warning" style={{ fontSize: 13 }}>Sắp đến hạn: {data.filter(d => d.dueStatus === 'Due').length}</Tag>
        <Tag color="success" style={{ fontSize: 13 }}>Bình thường: {data.filter(d => d.dueStatus === 'OK').length}</Tag>
      </Space>

      <Card bodyStyle={{ padding: 0 }}>
        <Table
          dataSource={data}
          columns={columns}
          rowKey="id"
          loading={loading}
          size="middle"
          pagination={false}
          rowClassName={r => r.dueStatus === 'Overdue' ? 'row-critical' : r.dueStatus === 'Due' ? 'row-warning' : ''}
        />
      </Card>
    </div>
  );
}

function getMockData(): MaintenanceRecord[] {
  return [
    { id: 1, equipmentName: 'Quạt Làm Mát vòng số 1', areaName: 'Làm mát vòng', title: 'Kiểm tra vòng bi định kỳ', lastMaintenanceDate: '2026-08-01', nextMaintenanceDate: '2026-09-01', cycleDays: 30, dueStatus: 'Overdue', responsiblePerson: 'Phòng cơ điện' },
    { id: 2, equipmentName: 'Hộp gió DDD', areaName: 'Bản lược', title: 'Vệ sinh lọc bụi', lastMaintenanceDate: '2026-08-15', nextMaintenanceDate: '2026-09-15', cycleDays: 30, dueStatus: 'OK', responsiblePerson: 'Phòng bảo dưỡng' },
    { id: 3, equipmentName: 'Quạt gió chính', areaName: 'Quạt gió và lọc bụi', title: 'Bôi trơn ổ bi', lastMaintenanceDate: '2026-09-01', nextMaintenanceDate: '2026-09-08', cycleDays: 7, dueStatus: 'Due', responsiblePerson: 'Phòng cơ điện' },
  ];
}
