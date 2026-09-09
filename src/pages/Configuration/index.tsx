import { useState } from 'react';
import { Tabs, Card, Table, Button, Space, Typography, Tag, Form, Input, Select, Modal, InputNumber } from 'antd';
import { PlusOutlined, EditOutlined, SettingOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { SignalType } from '../../types';

const { Title, Text } = Typography;

const mockAreas = [
  { id: 1, areaCode: 'BL', areaName: 'Bản lược', parentAreaId: null, sortOrder: 1, isActive: true, equipmentCount: 8 },
  { id: 2, areaCode: 'LQ', areaName: 'Lò quay', parentAreaId: null, sortOrder: 2, isActive: true, equipmentCount: 6 },
  { id: 3, areaCode: 'LMV', areaName: 'Làm mát vòng', parentAreaId: null, sortOrder: 3, isActive: true, equipmentCount: 8 },
];

const mockEquipments = [
  { id: 1, equipmentCode: 'BL-001', equipmentName: 'Hộp gió DDD', areaName: 'Bản lược', equipmentType: 'Quạt', isActive: true, tagCount: 10 },
  { id: 2, equipmentCode: 'BL-002', equipmentName: 'Hộp gió UDD', areaName: 'Bản lược', equipmentType: 'Quạt', isActive: true, tagCount: 14 },
];

const mockTags = [
  { id: 1, tagName: 'TE1548A_RTM', signalName: 'Nhiệt độ cuộn dây A', signalType: SignalType.Temperature, unit: '°C', equipmentName: 'Hộp gió UDD', sourceTagName: 'TE1548A_RTM', sourceTagNameH: 'TE1548A_RTM_H', sourceTagNameHH: 'TE1548A_RTM_HH', ratedValue: 130, highLimit: 130, highHighLimit: 145 },
  { id: 2, tagName: 'TE1548B_RTM', signalName: 'Nhiệt độ cuộn dây B', signalType: SignalType.Temperature, unit: '°C', equipmentName: 'Hộp gió UDD', sourceTagName: 'TE1548B_RTM', sourceTagNameH: 'TE1548B_RTM_H', sourceTagNameHH: 'TE1548B_RTM_HH', ratedValue: 130, highLimit: 130, highHighLimit: 145 },
];

export default function Configuration() {
  const [thresholdModal, setThresholdModal] = useState<{ open: boolean; tagId: number | null }>({ open: false, tagId: null });
  const [form] = Form.useForm();

  const areaColumns: ColumnsType<typeof mockAreas[0]> = [
    { title: 'Mã khu vực', dataIndex: 'areaCode', width: 120 },
    { title: 'Tên khu vực', dataIndex: 'areaName' },
    { title: 'Thiết bị', dataIndex: 'equipmentCount', width: 90, align: 'right' },
    { title: 'Thứ tự', dataIndex: 'sortOrder', width: 80, align: 'right' },
    { title: 'Trạng thái', dataIndex: 'isActive', width: 100, render: v => <Tag color={v ? 'success' : 'default'}>{v ? 'Active' : 'Inactive'}</Tag> },
    { title: 'Thao tác', width: 100, render: () => <Button size="small" icon={<EditOutlined />}>Sửa</Button> },
  ];

  const equipmentColumns: ColumnsType<typeof mockEquipments[0]> = [
    { title: 'Mã thiết bị', dataIndex: 'equipmentCode', width: 120 },
    { title: 'Tên thiết bị', dataIndex: 'equipmentName' },
    { title: 'Khu vực', dataIndex: 'areaName', width: 150 },
    { title: 'Loại', dataIndex: 'equipmentType', width: 100 },
    { title: 'Tag', dataIndex: 'tagCount', width: 70, align: 'right' },
    { title: 'Trạng thái', dataIndex: 'isActive', width: 100, render: v => <Tag color={v ? 'success' : 'default'}>{v ? 'Active' : 'Inactive'}</Tag> },
    { title: 'Thao tác', width: 100, render: () => <Button size="small" icon={<EditOutlined />}>Sửa</Button> },
  ];

  const tagColumns: ColumnsType<typeof mockTags[0]> = [
    { title: 'Tag Name', dataIndex: 'tagName', width: 150, render: v => <Text code style={{ fontSize: 12 }}>{v}</Text> },
    { title: 'Tín hiệu', dataIndex: 'signalName' },
    { title: 'Thiết bị', dataIndex: 'equipmentName', width: 180 },
    { title: 'Đơn vị', dataIndex: 'unit', width: 70 },
    { title: 'Định mức', dataIndex: 'ratedValue', width: 90, align: 'right' },
    { title: 'H', dataIndex: 'highLimit', width: 80, align: 'right', render: v => v ? <Text style={{ color: '#faad14' }}>{v}</Text> : '—' },
    { title: 'HH', dataIndex: 'highHighLimit', width: 80, align: 'right', render: v => v ? <Text style={{ color: '#ff4d4f' }}>{v}</Text> : '—' },
    { title: 'Tag nguồn', dataIndex: 'sourceTagName', width: 150, render: v => <Text code style={{ fontSize: 11 }}>{v || '—'}</Text> },
    {
      title: 'Thao tác', width: 140,
      render: (_: unknown, r: typeof mockTags[0]) => (
        <Space size="small">
          <Button size="small" icon={<EditOutlined />}>Sửa</Button>
          <Button size="small" onClick={() => setThresholdModal({ open: true, tagId: r.id })}>H/HH</Button>
        </Space>
      )
    },
  ];

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>
        <SettingOutlined /> Cấu hình hệ thống
      </Title>

      <Tabs
        items={[
          {
            key: 'areas',
            label: 'Khu vực',
            children: (
              <Card
                extra={<Button type="primary" icon={<PlusOutlined />} size="small">Thêm khu vực</Button>}
                bodyStyle={{ padding: 0 }}
              >
                <Table dataSource={mockAreas} columns={areaColumns} rowKey="id" size="middle" pagination={false} />
              </Card>
            )
          },
          {
            key: 'equipments',
            label: 'Thiết bị',
            children: (
              <Card
                extra={<Button type="primary" icon={<PlusOutlined />} size="small">Thêm thiết bị</Button>}
                bodyStyle={{ padding: 0 }}
              >
                <Table dataSource={mockEquipments} columns={equipmentColumns} rowKey="id" size="middle" pagination={false} />
              </Card>
            )
          },
          {
            key: 'tags',
            label: 'Tag / Tín hiệu',
            children: (
              <Card
                extra={<Button type="primary" icon={<PlusOutlined />} size="small">Thêm Tag</Button>}
                bodyStyle={{ padding: 0 }}
              >
                <Table dataSource={mockTags} columns={tagColumns} rowKey="id" size="middle" pagination={false} scroll={{ x: 1100 }} />
              </Card>
            )
          },
          {
            key: 'mapping',
            label: 'Mapping Tag nguồn',
            children: (
              <Card>
                <Text type="secondary">Cấu hình mapping Tag từ nguồn SQL Server THONGSOVH_Vevien2 sang Tag hệ thống.</Text>
                <Table
                  style={{ marginTop: 16 }}
                  dataSource={mockTags}
                  columns={[
                    { title: 'Tag hệ thống', dataIndex: 'tagName', render: v => <Text code>{v}</Text> },
                    { title: 'Source RTM', dataIndex: 'sourceTagName', render: v => <Text code style={{ color: '#1890ff' }}>{v || '—'}</Text> },
                    { title: 'Source H', dataIndex: 'sourceTagNameH', render: v => <Text code style={{ color: '#faad14' }}>{v || '—'}</Text> },
                    { title: 'Source HH', dataIndex: 'sourceTagNameHH', render: v => <Text code style={{ color: '#ff4d4f' }}>{v || '—'}</Text> },
                    { title: '', width: 80, render: () => <Button size="small" icon={<EditOutlined />}>Sửa</Button> },
                  ]}
                  rowKey="id" size="small" pagination={false}
                />
              </Card>
            )
          },
        ]}
      />

      {/* Threshold Config Modal */}
      <Modal
        title="Cấu hình ngưỡng H/HH"
        open={thresholdModal.open}
        onOk={() => { form.submit(); setThresholdModal({ open: false, tagId: null }); }}
        onCancel={() => setThresholdModal({ open: false, tagId: null })}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Ngưỡng H (High)" name="highLimit">
            <InputNumber style={{ width: '100%' }} addonAfter="°C" />
          </Form.Item>
          <Form.Item label="Ngưỡng HH (High High)" name="highHighLimit">
            <InputNumber style={{ width: '100%' }} addonAfter="°C" />
          </Form.Item>
          <Form.Item label="Hysteresis (chống nhiễu)" name="hysteresis">
            <InputNumber style={{ width: '100%' }} defaultValue={0} min={0} />
          </Form.Item>
          <Form.Item label="Delay (giây)" name="delaySeconds">
            <InputNumber style={{ width: '100%' }} defaultValue={0} min={0} addonAfter="giây" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
