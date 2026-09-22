import { useCallback, useEffect, useState } from 'react';
import {
  Tabs, Card, Table, Button, Space, Typography, Tag as AntTag,
  Form, Input, Select, Modal, InputNumber, Popconfirm, Alert,
  message, Switch, Divider, Upload,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SettingOutlined, ReloadOutlined,
  UploadOutlined, InboxOutlined, DownloadOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { areasApi, equipmentsApi, tagsApi, importApi } from '../../services/api';

const { Title, Text } = Typography;
const { TextArea } = Input;

// ── Backend DTO shapes ──────────────────────────────────────────────────────
interface AreaCfg {
  id: number;
  maKhuVuc: string;
  tenKhuVuc: string;
  khuVucChaId?: number;
  thuTu: number;
  moTa?: string;
  conHoatDong: boolean;
  soThietBi: number;
}

interface EquipmentCfg {
  id: number;
  maThietBi: string;
  tenThietBi: string;
  khuVucId: number;
  tenKhuVuc: string;
  loaiThietBi?: string;
  mucDoQuanTrong?: string;
  moTa?: string;
  thuTu: number;
  conHoatDong: boolean;
  soTinHieu: number;
}

interface TagCfg {
  id: number;
  thietBiId: number;
  tenThietBi: string;
  kyHieu: string;
  tenTinHieu: string;
  loaiTinHieu: number;
  donVi?: string;
  giaTriDinhMuc?: number;
  nguongDuoi?: number;
  nguongTren?: number;
  tagGiaTriHienThi?: string;
  tagBaoDongH?: string;
  tagBaoDongHH?: string;
  conHoatDong: boolean;
  thuTu: number;
}

// ── Constants ───────────────────────────────────────────────────────────────
const LOAI_TH = [
  { value: 0, label: 'Nhiệt độ' },
  { value: 1, label: 'Áp suất' },
  { value: 2, label: 'Lưu lượng' },
  { value: 3, label: 'Rung động' },
  { value: 4, label: 'Bit báo động' },
  { value: 5, label: 'Khác' },
];

const MUCDO_OPTIONS = [
  { value: 'Cao', label: 'Cao' },
  { value: 'Trung bình', label: 'Trung bình' },
  { value: 'Thấp', label: 'Thấp' },
];

const LOAI_THIET_BI = ['Quạt', 'Bơm', 'Motor', 'Van', 'Băng tải', 'Gầu nâng', 'Khác'].map(v => ({ value: v, label: v }));

interface KetQuaImportDto {
  soKhuVucMoi: number;
  soThietBiMoi: number;
  soTinHieuMoi: number;
  soTinHieuCapNhat: number;
  soDongLoi: number;
  danhSachLoi: string[];
}

// ── Component ───────────────────────────────────────────────────────────────
export default function Configuration() {
  // Areas
  const [areas, setAreas] = useState<AreaCfg[]>([]);
  const [areasLoading, setAreasLoading] = useState(false);
  const [areaError, setAreaError] = useState<string | null>(null);
  const [areaModal, setAreaModal] = useState<{ open: boolean; record: AreaCfg | null }>({ open: false, record: null });
  const [areaForm] = Form.useForm();
  const [areaSaving, setAreaSaving] = useState(false);

  // Equipments
  const [equipments, setEquipments] = useState<EquipmentCfg[]>([]);
  const [equipLoading, setEquipLoading] = useState(false);
  const [equipError, setEquipError] = useState<string | null>(null);
  const [equipModal, setEquipModal] = useState<{ open: boolean; record: EquipmentCfg | null }>({ open: false, record: null });
  const [equipForm] = Form.useForm();
  const [equipSaving, setEquipSaving] = useState(false);

  // Tags
  const [tags, setTags] = useState<TagCfg[]>([]);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [tagError, setTagError] = useState<string | null>(null);
  const [tagModal, setTagModal] = useState<{ open: boolean; record: TagCfg | null }>({ open: false, record: null });
  const [tagForm] = Form.useForm();
  const [tagSaving, setTagSaving] = useState(false);
  const [selectedEquipId, setSelectedEquipId] = useState<number | null>(null);

  // Import CSV
  const [importModal, setImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<KetQuaImportDto | null>(null);

  // ── Loaders ────────────────────────────────────────────────────────────────
  const loadAreas = useCallback(async () => {
    setAreasLoading(true);
    try {
      const res = await areasApi.getAll();
      setAreas(res.data);
      setAreaError(null);
    } catch {
      setAreaError('Không thể tải danh sách khu vực. Kiểm tra kết nối backend.');
    } finally {
      setAreasLoading(false);
    }
  }, []);

  const loadEquipments = useCallback(async () => {
    setEquipLoading(true);
    try {
      const res = await equipmentsApi.getAll();
      setEquipments(res.data);
      setEquipError(null);
    } catch {
      setEquipError('Không thể tải danh sách thiết bị. Kiểm tra kết nối backend.');
    } finally {
      setEquipLoading(false);
    }
  }, []);

  const loadTags = useCallback(async (equipId: number) => {
    setTagsLoading(true);
    try {
      const res = await tagsApi.getByEquipment(equipId);
      setTags(res.data);
      setTagError(null);
    } catch {
      setTagError('Không thể tải danh sách tín hiệu.');
    } finally {
      setTagsLoading(false);
    }
  }, []);

  useEffect(() => { loadAreas(); }, [loadAreas]);
  useEffect(() => { loadEquipments(); }, [loadEquipments]);

  // ── Area CRUD ──────────────────────────────────────────────────────────────
  const openAreaModal = (record?: AreaCfg) => {
    areaForm.resetFields();
    if (record) {
      areaForm.setFieldsValue(record);
    } else {
      areaForm.setFieldsValue({ thuTu: areas.length + 1 });
    }
    setAreaModal({ open: true, record: record ?? null });
  };

  const handleAreaSave = async () => {
    let vals: Record<string, unknown>;
    try {
      vals = await areaForm.validateFields();
    } catch {
      return;
    }
    setAreaSaving(true);
    try {
      if (areaModal.record) {
        await areasApi.update(areaModal.record.id, vals);
        message.success('Đã cập nhật khu vực');
      } else {
        await areasApi.create(vals);
        message.success('Đã thêm khu vực mới');
      }
      setAreaModal({ open: false, record: null });
      loadAreas();
    } catch {
      message.error('Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setAreaSaving(false);
    }
  };

  const handleDeleteArea = async (id: number) => {
    try {
      await areasApi.delete(id);
      message.success('Đã xóa khu vực');
      loadAreas();
    } catch {
      message.error('Không thể xóa khu vực (có thể đang được sử dụng).');
    }
  };

  // ── Equipment CRUD ─────────────────────────────────────────────────────────
  const openEquipModal = (record?: EquipmentCfg) => {
    equipForm.resetFields();
    if (record) {
      equipForm.setFieldsValue(record);
    } else {
      equipForm.setFieldsValue({ thuTu: equipments.length + 1 });
    }
    setEquipModal({ open: true, record: record ?? null });
  };

  const handleEquipSave = async () => {
    let vals: Record<string, unknown>;
    try {
      vals = await equipForm.validateFields();
    } catch {
      return;
    }
    setEquipSaving(true);
    try {
      if (equipModal.record) {
        await equipmentsApi.update(equipModal.record.id, vals);
        message.success('Đã cập nhật thiết bị');
      } else {
        await equipmentsApi.create(vals);
        message.success('Đã thêm thiết bị mới');
      }
      setEquipModal({ open: false, record: null });
      loadEquipments();
    } catch {
      message.error('Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setEquipSaving(false);
    }
  };

  const handleDeleteEquip = async (id: number) => {
    try {
      await equipmentsApi.delete(id);
      message.success('Đã xóa thiết bị');
      loadEquipments();
    } catch {
      message.error('Không thể xóa thiết bị (có thể đang có tín hiệu liên kết).');
    }
  };

  // ── Tag CRUD ───────────────────────────────────────────────────────────────
  const openTagModal = (record?: TagCfg) => {
    tagForm.resetFields();
    if (record) {
      tagForm.setFieldsValue(record);
    } else {
      tagForm.setFieldsValue({
        thietBiId: selectedEquipId,
        thuTu: tags.length + 1,
        loaiTinHieu: 0,
      });
    }
    setTagModal({ open: true, record: record ?? null });
  };

  const handleTagSave = async () => {
    let vals: Record<string, unknown>;
    try {
      vals = await tagForm.validateFields();
    } catch {
      return;
    }
    setTagSaving(true);
    try {
      if (tagModal.record) {
        await tagsApi.update(tagModal.record.id, vals);
        message.success('Đã cập nhật tín hiệu');
      } else {
        await tagsApi.create(vals);
        message.success('Đã thêm tín hiệu mới');
      }
      setTagModal({ open: false, record: null });
      if (selectedEquipId) loadTags(selectedEquipId);
    } catch {
      message.error('Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setTagSaving(false);
    }
  };

  const handleDeleteTag = async (id: number) => {
    try {
      await tagsApi.delete(id);
      message.success('Đã xóa tín hiệu');
      if (selectedEquipId) loadTags(selectedEquipId);
    } catch {
      message.error('Không thể xóa tín hiệu.');
    }
  };

  // ── Import CSV ─────────────────────────────────────────────────────────────
  const closeImportModal = () => {
    setImportModal(false);
    setImportFile(null);
    setImportResult(null);
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await importApi.downloadTemplate();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'mau_import_thiet_bi_tin_hieu.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      message.error('Không thể tải file mẫu.');
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      message.warning('Vui lòng chọn file CSV trước.');
      return;
    }
    setImporting(true);
    setImportResult(null);
    try {
      const res = await importApi.uploadThietBiTinHieu(importFile);
      setImportResult(res.data);
      message.success('Import hoàn tất.');
      loadAreas();
      loadEquipments();
      if (selectedEquipId) loadTags(selectedEquipId);
    } catch (err) {
      const data = (err as { response?: { data?: unknown } })?.response?.data;
      message.error(typeof data === 'string' ? data : 'Import thất bại. Kiểm tra định dạng file.');
    } finally {
      setImporting(false);
    }
  };

  // ── Column defs ────────────────────────────────────────────────────────────
  const areaColumns: ColumnsType<AreaCfg> = [
    { title: 'Mã khu vực', dataIndex: 'maKhuVuc', width: 130 },
    { title: 'Tên khu vực', dataIndex: 'tenKhuVuc' },
    { title: 'Thiết bị', dataIndex: 'soThietBi', width: 90, align: 'right' },
    { title: 'Thứ tự', dataIndex: 'thuTu', width: 80, align: 'right' },
    {
      title: 'Trạng thái', dataIndex: 'conHoatDong', width: 110,
      render: v => <AntTag color={v ? 'success' : 'default'}>{v ? 'Active' : 'Inactive'}</AntTag>,
    },
    {
      title: 'Thao tác', width: 140,
      render: (_, r) => (
        <Space size="small">
          <Button size="small" icon={<EditOutlined />} onClick={() => openAreaModal(r)}>Sửa</Button>
          <Popconfirm
            title="Xóa khu vực này?"
            description="Khu vực sẽ bị đánh dấu không hoạt động."
            onConfirm={() => handleDeleteArea(r.id)}
            okText="Xóa" cancelText="Hủy" okButtonProps={{ danger: true }}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const equipColumns: ColumnsType<EquipmentCfg> = [
    { title: 'Mã thiết bị', dataIndex: 'maThietBi', width: 130 },
    { title: 'Tên thiết bị', dataIndex: 'tenThietBi' },
    { title: 'Khu vực', dataIndex: 'tenKhuVuc', width: 160 },
    { title: 'Loại', dataIndex: 'loaiThietBi', width: 100, render: v => v || '—' },
    { title: 'Tín hiệu', dataIndex: 'soTinHieu', width: 80, align: 'right' },
    {
      title: 'Trạng thái', dataIndex: 'conHoatDong', width: 110,
      render: v => <AntTag color={v ? 'success' : 'default'}>{v ? 'Active' : 'Inactive'}</AntTag>,
    },
    {
      title: 'Thao tác', width: 140,
      render: (_, r) => (
        <Space size="small">
          <Button size="small" icon={<EditOutlined />} onClick={() => openEquipModal(r)}>Sửa</Button>
          <Popconfirm
            title="Xóa thiết bị này?"
            description="Thiết bị sẽ bị đánh dấu không hoạt động."
            onConfirm={() => handleDeleteEquip(r.id)}
            okText="Xóa" cancelText="Hủy" okButtonProps={{ danger: true }}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const tagColumns: ColumnsType<TagCfg> = [
    { title: 'Ký hiệu', dataIndex: 'kyHieu', width: 170, render: v => <Text code style={{ fontSize: 12 }}>{v}</Text> },
    { title: 'Tên tín hiệu', dataIndex: 'tenTinHieu' },
    { title: 'Loại', dataIndex: 'loaiTinHieu', width: 110, render: v => LOAI_TH.find(x => x.value === v)?.label || '—' },
    { title: 'Đơn vị', dataIndex: 'donVi', width: 70, render: v => v || '—' },
    { title: 'Định mức', dataIndex: 'giaTriDinhMuc', width: 90, align: 'right', render: v => v ?? '—' },
    { title: 'Ngưỡng H', dataIndex: 'nguongDuoi', width: 95, align: 'right', render: v => v != null ? <Text style={{ color: '#faad14' }}>{v}</Text> : '—' },
    { title: 'Ngưỡng HH', dataIndex: 'nguongTren', width: 95, align: 'right', render: v => v != null ? <Text style={{ color: '#ff4d4f' }}>{v}</Text> : '—' },
    { title: 'Tag nguồn', dataIndex: 'tagGiaTriHienThi', width: 160, render: v => v ? <Text code style={{ fontSize: 11 }}>{v}</Text> : '—' },
    {
      title: 'Thao tác', width: 120,
      render: (_, r) => (
        <Space size="small">
          <Button size="small" icon={<EditOutlined />} onClick={() => openTagModal(r)}>Sửa</Button>
          <Popconfirm
            title="Xóa tín hiệu này?"
            onConfirm={() => handleDeleteTag(r.id)}
            okText="Xóa" cancelText="Hủy" okButtonProps={{ danger: true }}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          <SettingOutlined /> Cấu hình hệ thống
        </Title>
        <Button icon={<UploadOutlined />} onClick={() => setImportModal(true)}>
          Import cấu hình (CSV)
        </Button>
      </div>

      <Tabs
        items={[
          // ─── Khu vực ─────────────────────────────────────────────────────
          {
            key: 'areas',
            label: `Khu vực (${areas.length})`,
            children: (
              <>
                {areaError && <Alert message={areaError} type="error" showIcon closable style={{ marginBottom: 12 }} />}
                <Card
                  extra={
                    <Space>
                      <Button icon={<ReloadOutlined />} size="small" onClick={loadAreas}>Làm mới</Button>
                      <Button type="primary" icon={<PlusOutlined />} size="small" onClick={() => openAreaModal()}>
                        Thêm khu vực
                      </Button>
                    </Space>
                  }
                  styles={{ body: { padding: 0 } }}
                >
                  <Table
                    dataSource={areas}
                    columns={areaColumns}
                    rowKey="id"
                    size="middle"
                    pagination={false}
                    loading={areasLoading}
                  />
                </Card>
              </>
            ),
          },

          // ─── Thiết bị ─────────────────────────────────────────────────────
          {
            key: 'equipments',
            label: `Thiết bị (${equipments.length})`,
            children: (
              <>
                {equipError && <Alert message={equipError} type="error" showIcon closable style={{ marginBottom: 12 }} />}
                <Card
                  extra={
                    <Space>
                      <Button icon={<ReloadOutlined />} size="small" onClick={loadEquipments}>Làm mới</Button>
                      <Button type="primary" icon={<PlusOutlined />} size="small" onClick={() => openEquipModal()}>
                        Thêm thiết bị
                      </Button>
                    </Space>
                  }
                  styles={{ body: { padding: 0 } }}
                >
                  <Table
                    dataSource={equipments}
                    columns={equipColumns}
                    rowKey="id"
                    size="middle"
                    pagination={false}
                    loading={equipLoading}
                  />
                </Card>
              </>
            ),
          },

          // ─── Tín hiệu ─────────────────────────────────────────────────────
          {
            key: 'tags',
            label: 'Tín hiệu',
            children: (
              <>
                <Card size="small" style={{ marginBottom: 12 }}>
                  <Space wrap>
                    <Text>Thiết bị:</Text>
                    <Select
                      style={{ width: 300 }}
                      placeholder="Chọn thiết bị để xem tín hiệu..."
                      value={selectedEquipId}
                      onChange={(v: number) => {
                        setSelectedEquipId(v);
                        setTags([]);
                        loadTags(v);
                      }}
                      options={equipments.map(e => ({ value: e.id, label: `${e.maThietBi} — ${e.tenThietBi}` }))}
                      showSearch
                      filterOption={(input, opt) =>
                        String(opt?.label ?? '').toLowerCase().includes(input.toLowerCase())
                      }
                      allowClear
                      onClear={() => { setSelectedEquipId(null); setTags([]); }}
                    />
                    {selectedEquipId && (
                      <Button icon={<ReloadOutlined />} size="small" onClick={() => loadTags(selectedEquipId)}>
                        Làm mới
                      </Button>
                    )}
                  </Space>
                </Card>

                {tagError && <Alert message={tagError} type="error" showIcon closable style={{ marginBottom: 12 }} />}

                {selectedEquipId ? (
                  <Card
                    extra={
                      <Button type="primary" icon={<PlusOutlined />} size="small" onClick={() => openTagModal()}>
                        Thêm tín hiệu
                      </Button>
                    }
                    styles={{ body: { padding: 0 } }}
                  >
                    <Table
                      dataSource={tags}
                      columns={tagColumns}
                      rowKey="id"
                      size="middle"
                      pagination={false}
                      loading={tagsLoading}
                      scroll={{ x: 1150 }}
                    />
                  </Card>
                ) : (
                  <Card>
                    <Text type="secondary">Chọn một thiết bị ở trên để xem và quản lý danh sách tín hiệu.</Text>
                  </Card>
                )}
              </>
            ),
          },
        ]}
      />

      {/* ── Area Modal ────────────────────────────────────────────────────── */}
      <Modal
        title={areaModal.record ? 'Cập nhật khu vực' : 'Thêm khu vực mới'}
        open={areaModal.open}
        onOk={handleAreaSave}
        onCancel={() => setAreaModal({ open: false, record: null })}
        okText={areaModal.record ? 'Cập nhật' : 'Thêm mới'}
        cancelText="Hủy"
        confirmLoading={areaSaving}
        destroyOnClose
      >
        <Form form={areaForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            label="Mã khu vực" name="maKhuVuc"
            rules={[{ required: true, message: 'Vui lòng nhập mã khu vực' }]}
          >
            <Input placeholder="VD: BL, LQ, LMV..." />
          </Form.Item>
          <Form.Item
            label="Tên khu vực" name="tenKhuVuc"
            rules={[{ required: true, message: 'Vui lòng nhập tên khu vực' }]}
          >
            <Input placeholder="VD: Bản lược, Lò quay..." />
          </Form.Item>
          <Form.Item label="Khu vực cha" name="khuVucChaId">
            <Select
              allowClear
              placeholder="Không có (khu vực gốc)"
              options={areas
                .filter(a => a.id !== areaModal.record?.id)
                .map(a => ({ value: a.id, label: a.tenKhuVuc }))}
            />
          </Form.Item>
          <Space>
            <Form.Item label="Thứ tự" name="thuTu" style={{ width: 120 }}>
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
            {areaModal.record && (
              <Form.Item label="Hoạt động" name="conHoatDong" valuePropName="checked">
                <Switch />
              </Form.Item>
            )}
          </Space>
          <Form.Item label="Mô tả" name="moTa">
            <TextArea rows={3} placeholder="Mô tả khu vực..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Equipment Modal ───────────────────────────────────────────────── */}
      <Modal
        title={equipModal.record ? 'Cập nhật thiết bị' : 'Thêm thiết bị mới'}
        open={equipModal.open}
        onOk={handleEquipSave}
        onCancel={() => setEquipModal({ open: false, record: null })}
        okText={equipModal.record ? 'Cập nhật' : 'Thêm mới'}
        cancelText="Hủy"
        confirmLoading={equipSaving}
        width={620}
        destroyOnClose
      >
        <Form form={equipForm} layout="vertical" style={{ marginTop: 16 }}>
          <Space style={{ width: '100%' }} size="middle">
            <Form.Item
              label="Mã thiết bị" name="maThietBi" style={{ flex: 1 }}
              rules={[{ required: true, message: 'Bắt buộc' }]}
            >
              <Input placeholder="VD: BL-001" />
            </Form.Item>
            <Form.Item label="Thứ tự" name="thuTu" style={{ width: 110 }}>
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
          </Space>
          <Form.Item
            label="Tên thiết bị" name="tenThietBi"
            rules={[{ required: true, message: 'Bắt buộc' }]}
          >
            <Input placeholder="Tên đầy đủ của thiết bị..." />
          </Form.Item>
          <Form.Item
            label="Khu vực" name="khuVucId"
            rules={[{ required: true, message: 'Vui lòng chọn khu vực' }]}
          >
            <Select
              placeholder="Chọn khu vực..."
              options={areas.map(a => ({ value: a.id, label: a.tenKhuVuc }))}
            />
          </Form.Item>
          <Space style={{ width: '100%' }} size="middle">
            <Form.Item label="Loại thiết bị" name="loaiThietBi" style={{ flex: 1 }}>
              <Select allowClear placeholder="Chọn loại..." options={LOAI_THIET_BI} />
            </Form.Item>
            <Form.Item label="Mức độ quan trọng" name="mucDoQuanTrong" style={{ width: 190 }}>
              <Select allowClear placeholder="Chọn..." options={MUCDO_OPTIONS} />
            </Form.Item>
          </Space>
          {equipModal.record && (
            <Form.Item label="Hoạt động" name="conHoatDong" valuePropName="checked">
              <Switch />
            </Form.Item>
          )}
          <Form.Item label="Mô tả" name="moTa">
            <TextArea rows={2} placeholder="Mô tả thiết bị..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Tag Modal ─────────────────────────────────────────────────────── */}
      <Modal
        title={tagModal.record ? 'Cập nhật tín hiệu' : 'Thêm tín hiệu mới'}
        open={tagModal.open}
        onOk={handleTagSave}
        onCancel={() => setTagModal({ open: false, record: null })}
        okText={tagModal.record ? 'Cập nhật' : 'Thêm mới'}
        cancelText="Hủy"
        confirmLoading={tagSaving}
        width={640}
        destroyOnClose
      >
        <Form form={tagForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="thietBiId" hidden><Input /></Form.Item>

          <Space style={{ width: '100%' }} size="middle">
            <Form.Item
              label="Ký hiệu (Tag name)" name="kyHieu" style={{ flex: 1 }}
              rules={[{ required: true, message: 'Bắt buộc' }]}
            >
              <Input placeholder="VD: TE1548A_RTM" style={{ fontFamily: 'monospace' }} />
            </Form.Item>
            <Form.Item label="Thứ tự" name="thuTu" style={{ width: 110 }}>
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
          </Space>

          <Form.Item
            label="Tên tín hiệu" name="tenTinHieu"
            rules={[{ required: true, message: 'Bắt buộc' }]}
          >
            <Input placeholder="VD: Nhiệt độ cuộn dây A..." />
          </Form.Item>

          <Space style={{ width: '100%' }} size="middle">
            <Form.Item label="Loại tín hiệu" name="loaiTinHieu" style={{ flex: 1 }}>
              <Select options={LOAI_TH} />
            </Form.Item>
            <Form.Item label="Đơn vị" name="donVi" style={{ width: 110 }}>
              <Input placeholder="°C, bar, Hz..." />
            </Form.Item>
          </Space>

          <Divider titlePlacement="left" plain style={{ fontSize: 12, marginTop: 8 }}>Ngưỡng giá trị</Divider>
          <Space size="middle" wrap>
            <Form.Item label="Giá trị định mức" name="giaTriDinhMuc">
              <InputNumber style={{ width: 150 }} />
            </Form.Item>
            <Form.Item label="Ngưỡng H (Low/High)" name="nguongDuoi">
              <InputNumber style={{ width: 150 }} />
            </Form.Item>
            <Form.Item label="Ngưỡng HH (High High)" name="nguongTren">
              <InputNumber style={{ width: 150 }} />
            </Form.Item>
          </Space>

          <Divider titlePlacement="left" plain style={{ fontSize: 12, marginTop: 8 }}>Tag nguồn (SQL Server THONGSOVH_Vevien2)</Divider>
          <Form.Item label="Tag giá trị thực (_RTM)" name="tagGiaTriHienThi">
            <Input placeholder="VD: TE1548A_RTM" style={{ fontFamily: 'monospace' }} />
          </Form.Item>
          <Space style={{ width: '100%' }} size="middle">
            <Form.Item label="Tag bit H (_RTM_H)" name="tagBaoDongH" style={{ flex: 1 }}>
              <Input placeholder="VD: TE1548A_RTM_H" style={{ fontFamily: 'monospace' }} />
            </Form.Item>
            <Form.Item label="Tag bit HH (_RTM_HH)" name="tagBaoDongHH" style={{ flex: 1 }}>
              <Input placeholder="VD: TE1548A_RTM_HH" style={{ fontFamily: 'monospace' }} />
            </Form.Item>
          </Space>

          {tagModal.record && (
            <Form.Item label="Hoạt động" name="conHoatDong" valuePropName="checked">
              <Switch />
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* ── Import CSV Modal ──────────────────────────────────────────────── */}
      <Modal
        title="Import cấu hình từ CSV"
        open={importModal}
        onCancel={closeImportModal}
        width={620}
        destroyOnClose
        footer={[
          <Button key="template" icon={<DownloadOutlined />} onClick={handleDownloadTemplate}>
            Tải file mẫu
          </Button>,
          <Button key="cancel" onClick={closeImportModal}>Đóng</Button>,
          <Button key="import" type="primary" loading={importing} disabled={!importFile} onClick={handleImport}>
            Import
          </Button>,
        ]}
      >
        <Text type="secondary">
          File CSV chứa cấu hình Khu vực / Thiết bị / Tín hiệu (mỗi dòng là 1 tín hiệu). Tải file mẫu để
          biết đúng định dạng cột. Import chạy lại nhiều lần an toàn — dòng trùng mã khu vực/thiết bị/tín hiệu
          sẽ được cập nhật thay vì tạo trùng.
        </Text>

        <Upload.Dragger
          style={{ marginTop: 16 }}
          accept=".csv"
          maxCount={1}
          beforeUpload={(file) => {
            setImportFile(file);
            setImportResult(null);
            return false;
          }}
          onRemove={() => setImportFile(null)}
        >
          <p className="ant-upload-drag-icon"><InboxOutlined /></p>
          <p className="ant-upload-text">Kéo thả hoặc bấm để chọn file CSV</p>
        </Upload.Dragger>

        {importResult && (
          <div style={{ marginTop: 16 }}>
            <Alert
              type={importResult.soDongLoi > 0 ? 'warning' : 'success'}
              showIcon
              message={`Đã xử lý: ${importResult.soKhuVucMoi} khu vực mới, ${importResult.soThietBiMoi} thiết bị mới, ${importResult.soTinHieuMoi} tín hiệu mới, ${importResult.soTinHieuCapNhat} tín hiệu cập nhật.`}
              description={importResult.soDongLoi > 0 ? `${importResult.soDongLoi} dòng lỗi (xem chi tiết bên dưới).` : undefined}
            />
            {importResult.danhSachLoi.length > 0 && (
              <ul style={{ marginTop: 8, maxHeight: 160, overflowY: 'auto', paddingLeft: 20 }}>
                {importResult.danhSachLoi.map((loi, i) => (
                  <li key={i}><Text type="danger" style={{ fontSize: 12 }}>{loi}</Text></li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
