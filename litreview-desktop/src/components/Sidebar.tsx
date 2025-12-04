export type TabType = "home" | "review" | "polish" | "config";

interface NavItem {
  id: TabType;
  icon: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: "home", icon: "🏠", label: "首页" },
  { id: "review", icon: "📝", label: "综述生成" },
  { id: "polish", icon: "✨", label: "语言润色" },
  { id: "config", icon: "⚙️", label: "API 配置" },
];

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <nav className="sidebar">
      <div className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${activeTab === item.id ? "active" : ""}`}
            onClick={() => onTabChange(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
