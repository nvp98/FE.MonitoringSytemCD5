import { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  useLocation,
  useNavigate,
  Navigate,
} from "react-router-dom";
import { Menu, Badge, ConfigProvider, theme, Dropdown } from "antd";
import type { MenuProps } from "antd";
import {
  DashboardOutlined,
  EyeOutlined,
  AlertOutlined,
  HistoryOutlined,
  LineChartOutlined,
  ToolOutlined,
  SettingOutlined,
  ThunderboltOutlined,
  BellOutlined,
  SoundOutlined,
  UserOutlined,
  LogoutOutlined,
  DownOutlined,
} from "@ant-design/icons";
import viVN from "antd/locale/vi_VN";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import Dashboard from "./pages/Dashboard";
import Monitoring from "./pages/Monitoring";
import Alarms from "./pages/Alarms";
import History from "./pages/History";
import Trend from "./pages/Trend";
import Maintenance from "./pages/Maintenance";
import Configuration from "./pages/Configuration";
import Login, { isAuthenticated } from "./pages/Login";
import "./App.css";

dayjs.locale("vi");

const MENU = [
  { key: "/", label: "Tổng quan", icon: <DashboardOutlined /> },
  { key: "/monitoring", label: "Giám sát thiết bị", icon: <EyeOutlined /> },
  { key: "/alarms", label: "Cảnh báo", icon: <AlertOutlined /> },
  { key: "/history", label: "Lịch sử dữ liệu", icon: <HistoryOutlined /> },
  { key: "/trend", label: "Biểu đồ Trend", icon: <LineChartOutlined /> },
  { key: "/maintenance", label: "Bảo trì", icon: <ToolOutlined /> },
  { key: "/configuration", label: "Cấu hình", icon: <SettingOutlined /> },
];

function Clock() {
  const [now, setNow] = useState(dayjs());
  useEffect(() => {
    const t = setInterval(() => setNow(dayjs()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="app-clock">
      {now.format("HH:mm:ss")} — {now.format("DD/MM/YYYY")}
    </span>
  );
}

function RequireAuth({ children }: { children: React.ReactElement }) {
  const location = useLocation();
  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const selectedKey =
    MENU.find((m) => m.key !== "/" && location.pathname.startsWith(m.key))
      ?.key || (location.pathname === "/" ? "/" : "");

  const userName =
    localStorage.getItem("vv2_auth_user") ||
    sessionStorage.getItem("vv2_auth_user") ||
    "Người dùng";

  const userMenu: MenuProps["items"] = [
    {
      key: "logout",
      label: "Đăng xuất",
      icon: <LogoutOutlined />,
      onClick: () => {
        localStorage.removeItem("vv2_auth_user");
        sessionStorage.removeItem("vv2_auth_user");
        navigate("/login", { replace: true });
      },
    },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      <div className="app-topbar">
        <div className="app-brand" onClick={() => navigate("/")}>
          <div className="logo-icon">
            <ThunderboltOutlined />
          </div>
          <div>
            <div className="logo-text">Giám sát thiết bị NM.CĐ5</div>
            <div className="logo-sub"></div>
          </div>
        </div>

        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[selectedKey]}
          className="app-topmenu"
          items={MENU.map((m) => ({
            key: m.key,
            icon: m.icon,
            label: <NavLink to={m.key}>{m.label}</NavLink>,
          }))}
        />

        <div className="app-topbar-right">
          <Clock />
          <NavLink to="/alarms" className="topbar-icon-btn">
            <Badge count={2} size="small">
              <BellOutlined />
            </Badge>
          </NavLink>
          <span className="topbar-icon-btn">
            <SoundOutlined />
          </span>
          <Dropdown menu={{ items: userMenu }} trigger={["click"]}>
            <div className="app-user">
              <UserOutlined style={{ color: "var(--text-secondary)" }} />
              <span className="app-user-name">{userName}</span>
              <DownOutlined
                style={{ fontSize: 10, color: "var(--text-tertiary)" }}
              />
            </div>
          </Dropdown>
        </div>
      </div>

      <div className="app-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/monitoring" element={<Monitoring />} />
          <Route path="/monitoring/:equipmentId" element={<Monitoring />} />
          <Route path="/alarms" element={<Alarms />} />
          <Route path="/history" element={<History />} />
          <Route path="/trend" element={<Trend />} />
          <Route path="/maintenance" element={<Maintenance />} />
          <Route path="/configuration" element={<Configuration />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ConfigProvider
      locale={viVN}
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: "#2f8fff",
          colorInfo: "#2f8fff",
          borderRadius: 8,
          fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
          colorBgBase: "#0b1120",
          colorBgContainer: "#121a2e",
          colorBgElevated: "#141c33",
          colorBorder: "rgba(120,160,255,.16)",
          colorBorderSecondary: "rgba(120,160,255,.12)",
        },
        components: {
          Menu: {
            darkItemBg: "transparent",
            darkItemSelectedBg: "rgba(47,143,255,.2)",
            itemHeight: 44,
            horizontalItemSelectedBg: "rgba(47,143,255,.18)",
          },
          Card: { borderRadiusLG: 10 },
          Table: { headerBg: "#182238" },
          Layout: { bodyBg: "#0b1120" },
        },
      }}
    >
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <RequireAuth>
                <AppLayout />
              </RequireAuth>
            }
          />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}
