import type { TabType } from "./Sidebar";
import type { ProviderConfig } from "../hooks/useLlmStream";

interface HomePageProps {
  config: ProviderConfig | null;
  providerName: string;
  onNavigate: (tab: TabType) => void;
}

export function HomePage({ config, providerName, onNavigate }: HomePageProps) {
  // 从 localStorage 读取统计数据
  const stats = {
    generationCount: parseInt(localStorage.getItem("litreview_generation_count") || "0", 10),
  };

  return (
    <div className="home-page">
      {/* Welcome Section */}
      <section className="welcome-section">
        <h1 className="welcome-title">欢迎使用 LitReview Pro</h1>
        <p className="welcome-desc">
          您的智能学术写作助手，支持文献综述生成、语言润色等功能，
          助力高效完成学术写作。
        </p>
      </section>

      {/* Statistics Cards */}
      <section className="stats-section">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <div className="stat-value">{stats.generationCount}</div>
              <div className="stat-label">生成次数</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🔗</div>
            <div className="stat-content">
              <div className="stat-value">{providerName || "未配置"}</div>
              <div className="stat-label">当前 Provider</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🤖</div>
            <div className="stat-content">
              <div className="stat-value">{config?.model || "未配置"}</div>
              <div className="stat-label">当前模型</div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Access */}
      <section className="quick-access-section">
        <h2 className="section-title">快捷入口</h2>
        <div className="quick-access-grid">
          <button 
            className="quick-btn"
            onClick={() => onNavigate("review")}
          >
            <span className="quick-icon">📝</span>
            <span className="quick-label">开始综述生成</span>
          </button>

          <button 
            className="quick-btn"
            onClick={() => onNavigate("polish")}
          >
            <span className="quick-icon">✨</span>
            <span className="quick-label">语言润色</span>
          </button>

          <button 
            className="quick-btn"
            onClick={() => onNavigate("config")}
          >
            <span className="quick-icon">⚙️</span>
            <span className="quick-label">配置 API</span>
          </button>
        </div>
      </section>
    </div>
  );
}
