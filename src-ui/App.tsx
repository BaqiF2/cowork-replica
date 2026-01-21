import {
  Component,
  For,
  Match,
  Switch,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
} from 'solid-js';
import {
  getLayoutConfig,
  getSidebarConfig,
  toggleSidebar,
  createInitialLayoutState,
  type LayoutState,
} from './components/Layout';
import { ipcService } from './services/ipcService';
import { PermissionModal } from './components/common/PermissionModal';
import { RewindMenu } from './components/files/RewindMenu';
import { PermissionSettings } from './components/settings/PermissionSettings';
import { ChatView } from './views/ChatView';
import { WorkspaceView } from './views/WorkspaceView';
import { getEnv } from './utils/env';

type AppView = 'chat' | 'workspace' | 'settings';

const DEFAULT_VIEW = getEnv('COWORK_APP_DEFAULT_VIEW', 'chat') as AppView;

const VIEW_META: Record<AppView, { title: string; description: string }> = {
  chat: {
    title: '对话',
    description: '与助手协作、查看工具调用与流式输出',
  },
  workspace: {
    title: '工作区',
    description: '管理项目与历史会话',
  },
  settings: {
    title: '权限',
    description: '调整权限模式并查看授权历史',
  },
};

const NAV_ITEMS: Array<{ id: AppView; icon: string; label: string }> = [
  { id: 'chat', icon: '💬', label: '对话' },
  { id: 'workspace', icon: '📁', label: '工作区' },
  { id: 'settings', icon: '⚙️', label: '权限' },
];

const App: Component = () => {
  const [layoutState, setLayoutState] = createSignal<LayoutState>(
    createInitialLayoutState()
  );
  const [activeView, setActiveView] = createSignal<AppView>(DEFAULT_VIEW);
  const sidebarConfig = getSidebarConfig();
  const layoutConfig = getLayoutConfig();
  const viewMeta = createMemo(() => VIEW_META[activeView()]);

  const handleToggleSidebar = () => {
    setLayoutState((prev) => toggleSidebar(prev));
  };

  onMount(() => {
    void ipcService.initialize().catch((error) => {
      console.error('[App] Failed to initialize IPC service', error);
    });

    const handleResize = () => {
      setLayoutState((prev) => ({
        ...prev,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
      }));
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    onCleanup(() => {
      window.removeEventListener('resize', handleResize);
      void ipcService.destroy().catch((error) => {
        console.error('[App] Failed to destroy IPC service', error);
      });
    });
  });

  const sidebarWidth = createMemo(() =>
    layoutState().sidebarExpanded
      ? sidebarConfig.width
      : sidebarConfig.collapsedWidth
  );

  return (
    <div
      style={{
        display: 'flex',
        'flex-direction': 'row',
        'min-width': `${layoutConfig.windowConstraints.minWidth}px`,
        'min-height': `${layoutConfig.windowConstraints.minHeight}px`,
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        'background-color': 'var(--bg-primary)',
      }}
    >
      {/* Sidebar */}
      <aside
        style={{
          width: `${sidebarWidth()}px`,
          'min-width': `${sidebarWidth()}px`,
          height: '100%',
          display: 'flex',
          'flex-direction': 'column',
          'background-color': 'var(--bg-secondary)',
          'border-right': '1px solid var(--border-subtle)',
          transition: 'width var(--transition-normal)',
          overflow: 'hidden',
        }}
      >
        {/* Sidebar Header */}
        <div
          style={{
            padding: 'var(--spacing-md)',
            'border-bottom': '1px solid var(--border-subtle)',
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'space-between',
          }}
        >
          {layoutState().sidebarExpanded && (
            <span
              style={{
                'font-size': 'var(--font-size-lg)',
                'font-weight': 'var(--font-weight-semibold)',
                color: 'var(--text-primary)',
              }}
            >
              Cowork
            </span>
          )}
          <button
            onClick={handleToggleSidebar}
            style={{
              padding: 'var(--spacing-sm)',
              'background-color': 'var(--bg-tertiary)',
              border: '1px solid var(--border-default)',
              'border-radius': 'var(--border-radius-md)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
            title={layoutState().sidebarExpanded ? '收起侧边栏' : '展开侧边栏'}
          >
            {layoutState().sidebarExpanded ? '◀' : '▶'}
          </button>
        </div>

        {/* Sidebar Content */}
        <div
          style={{
            flex: '1',
            padding: 'var(--spacing-md)',
            'overflow-y': 'auto',
          }}
        >
          {layoutState().sidebarExpanded && (
            <nav>
              <For each={NAV_ITEMS}>
                {(item) => (
                  <SidebarItem
                    icon={item.icon}
                    label={item.label}
                    active={activeView() === item.id}
                    onSelect={() => setActiveView(item.id)}
                  />
                )}
              </For>
            </nav>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main
        style={{
          'flex-grow': '1',
          'min-width': `${layoutConfig.mainContent.minWidth}px`,
          padding: layoutConfig.mainContent.padding,
          height: '100%',
          'overflow-y': 'auto',
          'background-color': 'var(--bg-primary)',
        }}
      >
        {/* Header */}
        <header
          style={{
            'margin-bottom': 'var(--spacing-xl)',
          }}
        >
          <h1
            style={{
              'font-size': 'var(--font-size-2xl)',
              'font-weight': 'var(--font-weight-bold)',
              color: 'var(--text-primary)',
              margin: '0',
            }}
          >
            {viewMeta().title}
          </h1>
          <p
            style={{
              'font-size': 'var(--font-size-base)',
              color: 'var(--text-secondary)',
              'margin-top': 'var(--spacing-sm)',
            }}
          >
            {viewMeta().description}
          </p>
        </header>

        {/* Content Area */}
        <div
          style={{
            'background-color': 'var(--bg-secondary)',
            'border-radius': 'var(--border-radius-lg)',
            padding: 'var(--spacing-lg)',
            border: '1px solid var(--border-subtle)',
            height: '100%',
            display: 'flex',
            'flex-direction': 'column',
            overflow: 'hidden',
          }}
        >
          <Switch fallback={<ChatView />}>
            <Match when={activeView() === 'chat'}>
              <ChatView />
            </Match>
            <Match when={activeView() === 'workspace'}>
              <WorkspaceView />
            </Match>
            <Match when={activeView() === 'settings'}>
              <PermissionSettings />
            </Match>
          </Switch>
        </div>

        <PermissionModal />
        <RewindMenu />
      </main>
    </div>
  );
};

interface SidebarItemProps {
  icon: string;
  label: string;
  active?: boolean;
  onSelect?: () => void;
}

const SidebarItem: Component<SidebarItemProps> = (props) => {
  return (
    <button
      type="button"
      onClick={props.onSelect}
      aria-current={props.active ? 'page' : undefined}
      style={{
        display: 'flex',
        'align-items': 'center',
        gap: 'var(--spacing-sm)',
        padding: 'var(--spacing-sm) var(--spacing-md)',
        'border-radius': 'var(--border-radius-md)',
        'background-color': props.active ? 'var(--bg-tertiary)' : 'transparent',
        color: props.active ? 'var(--text-primary)' : 'var(--text-secondary)',
        cursor: 'pointer',
        'margin-bottom': 'var(--spacing-xs)',
        transition: 'all var(--transition-fast)',
        border: 'none',
        width: '100%',
        'text-align': 'left',
      }}
    >
      <span>{props.icon}</span>
      <span>{props.label}</span>
    </button>
  );
};

export default App;
