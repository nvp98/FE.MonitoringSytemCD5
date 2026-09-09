import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, Select, DatePicker, Button, Space, Typography, Empty, Spin, Row, Col, Tag } from 'antd';
import { DownloadOutlined, LineChartOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { equipmentsApi, tagsApi, monitoringApi } from '../../services/api';
import type { TrendData, Equipment, Tag as TagType } from '../../types';
import dayjs, { Dayjs } from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const LINE_COLORS = ['#1890ff', '#52c41a', '#722ed1', '#fa8c16', '#eb2f96'];

export default function Trend() {
  const [searchParams] = useSearchParams();
  const initialTagId = searchParams.get('tagId');

  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [tags, setTags] = useState<TagType[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<number[]>(initialTagId ? [parseInt(initialTagId)] : []);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([dayjs().subtract(8, 'hour'), dayjs()]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    equipmentsApi.getAll().then(r => setEquipments(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedEquipment) {
      tagsApi.getByEquipment(selectedEquipment)
        .then(r => setTags(r.data))
        .catch(() => setTags([]));
    }
  }, [selectedEquipment]);

  const handleQuery = async () => {
    if (selectedTags.length === 0) return;
    setLoading(true);
    try {
      const res = await monitoringApi.getTrend(selectedTags, dateRange[0].toISOString(), dateRange[1].toISOString());
      setTrendData(res.data);
    } catch {
      setTrendData(getMockTrend(selectedTags));
    } finally {
      setLoading(false);
    }
  };

  const chartOption: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      formatter: (params: unknown) => {
        const items = params as Array<{ seriesName: string; value: [string, number]; color: string }>;
        if (!items?.length) return '';
        const time = dayjs(items[0].value[0]).format('DD/MM HH:mm:ss');
        const lines = items.map(p => `<span style="color:${p.color}">●</span> ${p.seriesName}: <b>${p.value[1]?.toFixed(2)}</b>`);
        return `<div>${time}<br/>${lines.join('<br/>')}</div>`;
      }
    },
    legend: { bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: 60, containLabel: true },
    xAxis: {
      type: 'time',
      axisLabel: { formatter: (v: number) => dayjs(v).format('HH:mm\nDD/MM') },
    },
    yAxis: { type: 'value', scale: true },
    dataZoom: [
      { type: 'inside', xAxisIndex: 0 },
      { type: 'slider', xAxisIndex: 0, bottom: 40 }
    ],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    series: trendData.flatMap((td, i): any[] => {
      const color = LINE_COLORS[i % LINE_COLORS.length];
      const result = [
        {
          name: td.signalName || td.tagName,
          type: 'line' as const,
          showSymbol: false,
          lineStyle: { width: 2, color },
          itemStyle: { color },
          data: td.points.map(p => [p.timestamp, p.value]),
        },
      ];
      if (td.highLimit !== undefined && td.highLimit !== null) {
        result.push({
          name: `${td.tagName} H (${td.highLimit})`,
          type: 'line' as const,
          showSymbol: false,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          lineStyle: { width: 1, type: 'dashed', color: '#faad14' } as any,
          itemStyle: { color: '#faad14' },
          data: td.points.length > 0
            ? [[td.points[0].timestamp, td.highLimit], [td.points[td.points.length - 1].timestamp, td.highLimit]]
            : [],
        });
      }
      if (td.highHighLimit !== undefined && td.highHighLimit !== null) {
        result.push({
          name: `${td.tagName} HH (${td.highHighLimit})`,
          type: 'line' as const,
          showSymbol: false,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          lineStyle: { width: 1, type: 'dashed', color: '#ff4d4f' } as any,
          itemStyle: { color: '#ff4d4f' },
          data: td.points.length > 0
            ? [[td.points[0].timestamp, td.highHighLimit], [td.points[td.points.length - 1].timestamp, td.highHighLimit]]
            : [],
        });
      }
      return result;
    }),
  };

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>
        <LineChartOutlined /> Biểu đồ Trend
      </Title>

      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Select
            placeholder="Chọn thiết bị"
            style={{ width: 240 }}
            allowClear
            onChange={v => { setSelectedEquipment(v); setSelectedTags([]); }}
            options={equipments.map(e => ({ label: e.equipmentName, value: e.id }))}
          />
          <Select
            mode="multiple"
            placeholder="Chọn Tag (tối đa 5)"
            style={{ width: 320 }}
            value={selectedTags}
            onChange={setSelectedTags}
            maxTagCount={3}
            options={tags.map(t => ({
              label: <Space><Text code style={{ fontSize: 11 }}>{t.tagName}</Text><Text type="secondary" style={{ fontSize: 11 }}>{t.signalName}</Text></Space>,
              value: t.id
            }))}
          />
          <RangePicker
            showTime
            value={dateRange}
            onChange={v => v && setDateRange(v as [Dayjs, Dayjs])}
            presets={[
              { label: '1 giờ', value: [dayjs().subtract(1, 'hour'), dayjs()] },
              { label: '8 giờ', value: [dayjs().subtract(8, 'hour'), dayjs()] },
              { label: '24 giờ', value: [dayjs().subtract(24, 'hour'), dayjs()] },
              { label: '7 ngày', value: [dayjs().subtract(7, 'day'), dayjs()] },
            ]}
          />
          <Button type="primary" onClick={handleQuery} disabled={selectedTags.length === 0}>
            Xem Trend
          </Button>
          {trendData.length > 0 && (
            <Button icon={<DownloadOutlined />} onClick={() => alert('Export data...')}>
              Export
            </Button>
          )}
        </Space>
      </Card>

      {/* Tag info */}
      {trendData.length > 0 && (
        <Row gutter={[8, 8]} style={{ marginBottom: 12 }}>
          {trendData.map((td, i) => (
            <Col key={td.tagId}>
              <Tag color={LINE_COLORS[i % LINE_COLORS.length]} style={{ fontSize: 13 }}>
                {td.tagName} — {td.signalName}{td.unit ? ` (${td.unit})` : ''}
                {td.highLimit !== undefined && ` | H: ${td.highLimit}`}
                {td.highHighLimit !== undefined && ` | HH: ${td.highHighLimit}`}
              </Tag>
            </Col>
          ))}
        </Row>
      )}

      <Card bodyStyle={{ padding: 0 }}>
        <Spin spinning={loading}>
          {trendData.length === 0
            ? <Empty description="Chọn Tag và nhấn Xem Trend để hiển thị biểu đồ" style={{ padding: 60 }} />
            : <ReactECharts
              option={chartOption}
              style={{ height: 480 }}
              opts={{ renderer: 'canvas' }}
            />
          }
        </Spin>
      </Card>
    </div>
  );
}

function getMockTrend(tagIds: number[]): TrendData[] {
  const now = Date.now();
  return tagIds.map(id => ({
    tagId: id,
    tagName: `TE154${id}_RTM`,
    signalName: `Nhiệt độ cuộn dây ${String.fromCharCode(64 + id)}`,
    unit: '°C',
    highLimit: 130,
    highHighLimit: 145,
    points: Array.from({ length: 100 }, (_, i) => ({
      timestamp: new Date(now - (100 - i) * 288000).toISOString(),
      value: 110 + Math.random() * 40,
      quality: 'Good'
    }))
  }));
}
