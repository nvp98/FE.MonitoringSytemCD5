import { useCallback, useEffect, useState } from 'react';
import {
  Card, Table, Tag, Button, Space, Typography, Badge, Alert,
  Modal, Form, Input, Select, InputNumber, DatePicker, Popconfirm, message,
} from 'antd';
import { ToolOutlined, PlusOutlined, CheckOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { maintenanceApi, equipmentsApi } from '../../services/api';
import dayjs, { Dayjs } from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

// Backend DTO shape
interface MaintenanceRecord {
  Id: number;
  ThietBiId: number;
  MaThietBi: string;
  TenThietBi: string;
  TenKhuVuc: string;
  TieuDe: string;
  MoTa?: string;
  NgayBaoDuongCuoi?: string;
  NgayBaoDuongTiep?: string;
  ChuKyNgay?: number;
  NguoiPhuTrach?: string;
  PhongBan?: string;
  TrangThaiHanChot: 'OK' | 'SapDen' | 'QuaHan';
}

interface EquipmentOption {
  Id: number;
  MaThietBi: string;
  TenThietBi: string;
}

const TRANG_THAI_LABEL: Record<string, { color: 'success' | 'warning' | 'error'; text: string }> = {
  OK: { color: 'success', text: 'Bình thường' },
  SapDen: { color: 'warning', text: 'Sắp đến hạn' },
  QuaHan: { color: 'error', text: 'Quá hạn' },
};

export default function Maintenance() {
  const [data, setData] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [equipments, setEquipments] = useState<EquipmentOption[]>([]);

  // Create / Edit modal
  const [modal, setModal] = useState<{ open: boolean; record: MaintenanceRecord | null }>({ open: false, record: null });
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  // Complete modal
  const [completeModal, setCompleteModal] = useState<{ open: boolean; id: number | null }>({ open: false, id: null });
  const [completeForm] = Form.useForm();
  const [completing, setCompleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await maintenanceApi.getAll();
      setData(res.data);
      setError(null);
    } catch {
      setError('Không thể kết nối đến máy chủ. Đang hiển thị dữ liệu mẫu.');
      setData(getMockData());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    equipmentsApi.getAll()
      .then(r => setEquipments(r.data))
      .catch(() => {/* ignore */});
  }, [load]);

  // ── Open modal ─────────────────────────────────────────────────────────────
  const openModal = (record?: MaintenanceRecord) => {
    form.resetFields();
    if (record) {
      form.setFieldsValue({
        ...record,
        NgayBaoDuongCuoi: record.NgayBaoDuongCuoi ? dayjs(record.NgayBaoDuongCuoi) : null,
        NgayBaoDuongTiep: record.NgayBaoDuongTiep ? dayjs(record.NgayBaoDuongTiep) : null,
      });
    }
    setModal({ open: true, record: record ?? null });
  };

  // ── Save (create or update) ────────────────────────────────────────────────
  const handleSave = async () => {
    let vals: Record<string, unknown>;
    try {
      vals = await form.validateFields();
    } catch {
      return;
    }

    const payload = {
      ...vals,
      NgayBaoDuongCuoi: (vals.NgayBaoDuongCuoi as Dayjs | null)?.toISOString() ?? null,
      NgayBaoDuongTiep: (vals.NgayBaoDuongTiep as Dayjs | null)?.toISOString() ?? null,
    };

    setSaving(true);
    try {
      if (modal.record) {
        await maintenanceApi.update(modal.record.Id, { ...payload, ConHoatDong: true });
        message.success('Đã cập nhật lịch bảo dưỡng');
      } else {
        await maintenanceApi.create(payload);
        message.success('Đã tạo lịch bảo dưỡng mới');
      }
      setModal({ open: false, record: null });
      load();
    } catch {
      message.error('Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  // ── Complete ───────────────────────────────────────────────────────────────
  const handleComplete = async () => {
    const { NguoiHoanThanh, GhiChu } = completeForm.getFieldsValue();
    if (!completeModal.id) return;
    setCompleting(true);
    try {
      await maintenanceApi.complete(completeModal.id, { NguoiHoanThanh, GhiChu });
      message.success('Đã đánh dấu hoàn thành bảo dưỡng');
      setCompleteModal({ open: false, id: null });
      completeForm.resetFields();
      load();
    } catch {
      message.error('Có lỗi xảy ra.');
    } finally {
      setCompleting(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (id: number) => {
    try {
      await maintenanceApi.delete(id);
      message.success('Đã xóa lịch bảo dưỡng');
      load();
    } catch {
      message.error('Không thể xóa lịch bảo dưỡng.');
    }
  };

  // ── Columns ────────────────────────────────────────────────────────────────
  const columns: ColumnsType<MaintenanceRecord> = [
    { title: 'Khu vực', dataIndex: 'TenKhuVuc', width: 150 },
    { title: 'Thiết bị', dataIndex: 'TenThietBi', width: 220 },
    { title: 'Hạng mục', dataIndex: 'TieuDe' },
    {
      title: 'Lần gần nhất', dataIndex: 'NgayBaoDuongCuoi', width: 130,
      render: v => v ? dayjs(v).format('DD/MM/YYYY') : '—',
    },
    {
      title: 'Lần tiếp theo', dataIndex: 'NgayBaoDuongTiep', width: 130,
      render: v => v ? dayjs(v).format('DD/MM/YYYY') : '—',
    },
    { title: 'Chu kỳ', dataIndex: 'ChuKyNgay', width: 90, render: v => v ? `${v} ngày` : '—' },
    {
      title: 'Trạng thái', dataIndex: 'TrangThaiHanChot', width: 130,
      render: v => {
        const s = TRANG_THAI_LABEL[v] ?? { color: 'default', text: v };
        return <Badge status={s.color} text={s.text} />;
      },
    },
    { title: 'Phụ trách', dataIndex: 'NguoiPhuTrach', width: 150, render: v => v || '—' },
    {
      title: 'Thao tác', width: 190,
      render: (_, r) => (
        <Space size="small">
          {r.TrangThaiHanChot !== 'OK' && (
            <Button
              size="small" type="primary" icon={<CheckOutlined />}
              onClick={() => { setCompleteModal({ open: true, id: r.Id }); completeForm.resetFields(); }}
            >
              Hoàn thành
            </Button>
          )}
          <Button size="small" icon={<EditOutlined />} onClick={() => openModal(r)} />
          <Popconfirm
            title="Xóa lịch bảo dưỡng này?"
            onConfirm={() => handleDelete(r.Id)}
            okText="Xóa" cancelText="Hủy" okButtonProps={{ danger: true }}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const overdueCount = data.filter(d => d.TrangThaiHanChot === 'QuaHan').length;
  const dueCount = data.filter(d => d.TrangThaiHanChot === 'SapDen').length;
  const okCount = data.filter(d => d.TrangThaiHanChot === 'OK').length;

  return (
    <div>
      {error && <Alert message={error} type="warning" showIcon style={{ marginBottom: 16, borderRadius: 8 }} />}

      <Space style={{ marginBottom: 16, justifyContent: 'space-between', width: '100%' }}>
        <Title level={4} style={{ margin: 0 }}>
          <ToolOutlined /> Bảo trì — Bảo dưỡng
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
          Tạo lịch bảo dưỡng
        </Button>
      </Space>

      <Space style={{ marginBottom: 16 }}>
        <Tag color="error" style={{ fontSize: 13 }}>Quá hạn: {overdueCount}</Tag>
        <Tag color="warning" style={{ fontSize: 13 }}>Sắp đến hạn: {dueCount}</Tag>
        <Tag color="success" style={{ fontSize: 13 }}>Bình thường: {okCount}</Tag>
      </Space>

      <Card styles={{ body: { padding: 0 } }}>
        <Table
          dataSource={data}
          columns={columns}
          rowKey="Id"
          loading={loading}
          size="middle"
          pagination={{ pageSize: 20, showSizeChanger: true, showTotal: t => `Tổng ${t} lịch` }}
          rowClassName={r =>
            r.TrangThaiHanChot === 'QuaHan' ? 'row-critical' : r.TrangThaiHanChot === 'SapDen' ? 'row-warning' : ''
          }
        />
      </Card>

      {/* ── Create / Edit Modal ─────────────────────────────────────────── */}
      <Modal
        title={modal.record ? 'Cập nhật lịch bảo dưỡng' : 'Tạo lịch bảo dưỡng mới'}
        open={modal.open}
        onOk={handleSave}
        onCancel={() => setModal({ open: false, record: null })}
        okText={modal.record ? 'Cập nhật' : 'Tạo mới'}
        cancelText="Hủy"
        confirmLoading={saving}
        width={620}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            label="Thiết bị" name="ThietBiId"
            rules={[{ required: true, message: 'Vui lòng chọn thiết bị' }]}
          >
            <Select
              placeholder="Chọn thiết bị..."
              showSearch
              filterOption={(input, opt) =>
                String(opt?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={equipments.map(e => ({
                value: e.Id,
                label: `${e.MaThietBi} — ${e.TenThietBi}`,
              }))}
            />
          </Form.Item>

          <Form.Item
            label="Hạng mục bảo dưỡng" name="TieuDe"
            rules={[{ required: true, message: 'Vui lòng nhập hạng mục' }]}
          >
            <Input placeholder="VD: Kiểm tra vòng bi định kỳ, Vệ sinh lọc bụi..." />
          </Form.Item>

          <Space style={{ width: '100%' }} size="middle">
            <Form.Item label="Ngày bảo dưỡng gần nhất" name="NgayBaoDuongCuoi" style={{ flex: 1 }}>
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="dd/mm/yyyy" />
            </Form.Item>
            <Form.Item label="Ngày bảo dưỡng tiếp theo" name="NgayBaoDuongTiep" style={{ flex: 1 }}>
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="dd/mm/yyyy" />
            </Form.Item>
          </Space>

          <Form.Item label="Chu kỳ (ngày)" name="ChuKyNgay">
            <InputNumber min={1} style={{ width: 160 }} addonAfter="ngày" placeholder="VD: 30" />
          </Form.Item>

          <Space style={{ width: '100%' }} size="middle">
            <Form.Item label="Người phụ trách" name="NguoiPhuTrach" style={{ flex: 1 }}>
              <Input placeholder="VD: Phòng cơ điện..." />
            </Form.Item>
            <Form.Item label="Phòng ban" name="PhongBan" style={{ flex: 1 }}>
              <Input placeholder="VD: Phòng bảo dưỡng..." />
            </Form.Item>
          </Space>

          <Form.Item label="Mô tả / Ghi chú" name="MoTa">
            <TextArea rows={3} placeholder="Mô tả chi tiết hạng mục bảo dưỡng..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Complete Modal ──────────────────────────────────────────────── */}
      <Modal
        title="Xác nhận hoàn thành bảo dưỡng"
        open={completeModal.open}
        onOk={handleComplete}
        onCancel={() => setCompleteModal({ open: false, id: null })}
        okText="Xác nhận hoàn thành"
        cancelText="Hủy"
        confirmLoading={completing}
        destroyOnClose
      >
        <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
          Hệ thống sẽ cập nhật ngày bảo dưỡng gần nhất và tính lại ngày bảo dưỡng tiếp theo theo chu kỳ.
        </Text>
        <Form form={completeForm} layout="vertical">
          <Form.Item label="Người thực hiện" name="NguoiHoanThanh">
            <Input placeholder="Tên người hoàn thành bảo dưỡng..." />
          </Form.Item>
          <Form.Item label="Ghi chú" name="GhiChu">
            <TextArea rows={3} placeholder="Ghi chú kết quả bảo dưỡng (tùy chọn)..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

function getMockData(): MaintenanceRecord[] {
  return [
    {
      Id: 1, ThietBiId: 1, MaThietBi: 'LMV-001', TenThietBi: 'Quạt Làm Mát vòng số 1',
      TenKhuVuc: 'Làm mát vòng', TieuDe: 'Kiểm tra vòng bi định kỳ',
      NgayBaoDuongCuoi: '2026-08-01T00:00:00Z', NgayBaoDuongTiep: '2026-09-01T00:00:00Z',
      ChuKyNgay: 30, TrangThaiHanChot: 'QuaHan', NguoiPhuTrach: 'Phòng cơ điện',
    },
    {
      Id: 2, ThietBiId: 2, MaThietBi: 'BL-001', TenThietBi: 'Hộp gió DDD',
      TenKhuVuc: 'Bản lược', TieuDe: 'Vệ sinh lọc bụi',
      NgayBaoDuongCuoi: '2026-08-15T00:00:00Z', NgayBaoDuongTiep: '2026-09-15T00:00:00Z',
      ChuKyNgay: 30, TrangThaiHanChot: 'OK', NguoiPhuTrach: 'Phòng bảo dưỡng',
    },
    {
      Id: 3, ThietBiId: 3, MaThietBi: 'QG-001', TenThietBi: 'Quạt gió chính',
      TenKhuVuc: 'Quạt gió và lọc bụi', TieuDe: 'Bôi trơn ổ bi',
      NgayBaoDuongCuoi: '2026-09-01T00:00:00Z', NgayBaoDuongTiep: '2026-09-08T00:00:00Z',
      ChuKyNgay: 7, TrangThaiHanChot: 'SapDen', NguoiPhuTrach: 'Phòng cơ điện',
    },
  ];
}
