import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Checkbox, Button } from 'antd';
import { UserOutlined, LockOutlined, ThunderboltOutlined } from '@ant-design/icons';

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleFinish = (values: { username: string; password: string; remember: boolean }) => {
    setLoading(true);
    setTimeout(() => {
      const storage = values.remember ? localStorage : sessionStorage;
      storage.setItem('vv2_auth_user', values.username);
      setLoading(false);
      navigate('/', { replace: true });
    }, 500);
  };

  return (
    <div className="login-page">
      <div className="login-visual">
        <div className="login-globe">
          <span className="ring" />
          <span className="ring" />
          <span className="ring" />
          <span className="core" />
          <span className="dot-orbit" style={{ top: '8%', left: '48%', animationDelay: '0s' }} />
          <span className="dot-orbit" style={{ top: '55%', left: '4%', animationDelay: '1.4s' }} />
          <span className="dot-orbit" style={{ top: '78%', left: '70%', animationDelay: '2.8s' }} />
          <span className="dot-orbit" style={{ top: '20%', left: '85%', animationDelay: '4.2s' }} />
        </div>
        <div className="login-caption">
          <b>Hệ thống Giám sát &amp; Cảnh báo Thiết bị</b><br />
          Dây chuyền Vê viên 2
        </div>
      </div>

      <div className="login-panel">
        <div className="login-form-box">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36 }}>
            <div className="logo-icon" style={{ width: 36, height: 36, fontSize: 18 }}>
              <ThunderboltOutlined />
            </div>
            <span style={{ color: 'var(--text-primary)', fontSize: 15, fontWeight: 700 }}>VV2 Monitor</span>
          </div>

          <div className="login-title">Đăng nhập hệ thống</div>

          <Form layout="vertical" onFinish={handleFinish} initialValues={{ remember: true }}>
            <Form.Item name="username" rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập' }]}>
              <Input size="large" prefix={<UserOutlined style={{ color: 'var(--text-tertiary)' }} />} placeholder="Tên đăng nhập" />
            </Form.Item>
            <Form.Item name="password" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}>
              <Input.Password size="large" prefix={<LockOutlined style={{ color: 'var(--text-tertiary)' }} />} placeholder="Mật khẩu" />
            </Form.Item>
            <Form.Item name="remember" valuePropName="checked" style={{ marginBottom: 20 }}>
              <Checkbox>Tự động đăng nhập</Checkbox>
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" size="large" loading={loading} block>
                Đăng nhập
              </Button>
            </Form.Item>
          </Form>

          <div className="login-footer-hint">
            © {new Date().getFullYear()} Vê viên 2 — Giám sát thiết bị nhà máy
          </div>
        </div>
      </div>
    </div>
  );
}

export function isAuthenticated() {
  return Boolean(localStorage.getItem('vv2_auth_user') || sessionStorage.getItem('vv2_auth_user'));
}
