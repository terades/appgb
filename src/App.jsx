import React, { lazy, Suspense, useMemo, useState } from 'react';

function IconShell({ children, className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {children}
    </svg>
  );
}

function HomeIcon({ className }) {
  return (
    <IconShell className={className}>
      <path d="M4 11.5 12 5l8 6.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.5 10.7V19h11V10.7" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 19v-5h4v5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </IconShell>
  );
}

function InboxIcon({ className }) {
  return (
    <IconShell className={className}>
      <path d="M4.5 6.5h15v7l-2 4h-3l-1.2-2H10.7L9.5 17.5h-3l-2-4v-7Z" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
      <path d="M8 6.5V4.8h8V6.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </IconShell>
  );
}

function LayersIcon({ className }) {
  return (
    <IconShell className={className}>
      <path d="m12 4 7.5 4-7.5 4-7.5-4L12 4Z" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
      <path d="m4.5 12 7.5 4 7.5-4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m4.5 16 7.5 4 7.5-4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </IconShell>
  );
}

function RouteIcon({ className }) {
  return (
    <IconShell className={className}>
      <path d="M5 7a2 2 0 1 1 4 0c0 1.2-.8 2.1-1.8 3.1L5 12.3V7Z" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
      <path d="M13 6h5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M13 12h6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M13 18h4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M9 10.5h1.8c1.8 0 3.2 1.4 3.2 3.2V18" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </IconShell>
  );
}

function TruckIcon({ className }) {
  return (
    <IconShell className={className}>
      <path d="M4.5 7.5h9v7h-9z" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
      <path d="M13.5 10h3.2l2.8 3v1.5h-6" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
      <path d="M7 18.2a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2Z" stroke="currentColor" strokeWidth="1.9" />
      <path d="M17 18.2a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2Z" stroke="currentColor" strokeWidth="1.9" />
    </IconShell>
  );
}

function PeopleIcon({ className }) {
  return (
    <IconShell className={className}>
      <path d="M9 11a2.8 2.8 0 1 0 0-5.6A2.8 2.8 0 0 0 9 11Z" stroke="currentColor" strokeWidth="1.9" />
      <path d="M4.8 18.5c.4-2.8 2-4.5 4.2-4.5s3.8 1.7 4.2 4.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15.5 11a2.3 2.3 0 1 0 0-4.6 2.3 2.3 0 0 0 0 4.6Z" stroke="currentColor" strokeWidth="1.9" />
      <path d="M13.6 18.2c.2-2 1.3-3.4 2.9-3.4 1.4 0 2.4.8 3 2.4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </IconShell>
  );
}

function CheckIcon({ className }) {
  return (
    <IconShell className={className}>
      <path d="M12 4.8a7.2 7.2 0 1 0 7.2 7.2A7.2 7.2 0 0 0 12 4.8Z" stroke="currentColor" strokeWidth="1.9" />
      <path d="m9.4 12.1 1.9 1.9 3.7-4.1" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </IconShell>
  );
}

function PanelIcon({ className }) {
  return (
    <IconShell className={className}>
      <path d="M5 6.5h14v11H5z" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
      <path d="M8 6.5v11" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M5 10h14" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </IconShell>
  );
}

const SCREEN_COMPONENTS = {
  auftragspool: lazy(() => import('../AuftragspoolScreen 3.jsx')),
  feinplanung: lazy(() => import('../FeinplanungScreen 1.jsx')),
  reihenfolgeplanung: lazy(() => import('../Reihenfolgeplanung 2.jsx')),
  logistik: lazy(() => import('../LogistikScreen 2.jsx')),
  produktion: lazy(() => import('../ProduktionMitarbeiterScreen 1.jsx')),
  fertigmelden: lazy(() => import('../FertigmeldenScreen 1.jsx')),
};

const MODULES = [
  {
    key: 'auftragspool',
    label: 'Auftragspool',
    icon: InboxIcon,
    items: [{ key: 'auftragspool', label: 'Auftragspool', icon: PanelIcon }],
  },
  {
    key: 'feinplanung',
    label: 'Feinplanung',
    icon: LayersIcon,
    items: [
      { key: 'Uebersicht', label: 'Uebersicht', icon: PanelIcon },
      { key: 'Planung', label: 'Planung', icon: PanelIcon },
      { key: 'Bauteillisten', label: 'Bauteillisten', icon: PanelIcon },
      { key: 'Artikel', label: 'Artikel', icon: PanelIcon },
      { key: 'Arbeitsplaene', label: 'Arbeitspläne', icon: PanelIcon },
      { key: 'Arbeitsganggruppen', label: 'Arbeitsganggruppen', icon: PanelIcon },
      { key: 'Vorlagen', label: 'Vorlagen', icon: PanelIcon },
      { key: 'Auftragspool', label: 'Auftragspool', icon: PanelIcon },
      { key: 'Projektuebersicht', label: 'Projektübersicht', icon: PanelIcon },
    ],
  },
  {
    key: 'reihenfolgeplanung',
    label: 'Reihenfolgeplanung',
    icon: RouteIcon,
    items: [{ key: 'reihenfolgeplanung', label: 'Reihenfolgeplanung', icon: PanelIcon }],
  },
  {
    key: 'logistik',
    label: 'Logistik',
    icon: TruckIcon,
    items: [
      { key: 'Produktionsuebersicht', label: 'Produktionsübersicht', icon: PanelIcon },
      { key: 'LKW Kalender', label: 'LKW Kalender', icon: TruckIcon },
      { key: 'Uebersicht Transportgestelle', label: 'Übersicht Transportgestelle', icon: PanelIcon },
      { key: 'Physischer Bestand', label: 'Physischer Bestand', icon: PanelIcon },
      { key: 'Externe Aufträge', label: 'Externe Aufträge', icon: PeopleIcon },
      { key: 'Magazin', label: 'Magazin', icon: PanelIcon },
    ],
  },
  {
    key: 'produktion',
    label: 'Produktion Mitarbeiter',
    icon: PeopleIcon,
    items: [{ key: 'produktion', label: 'Produktion Mitarbeiter', icon: PanelIcon }],
  },
  {
    key: 'fertigmelden',
    label: 'Fertigmelden',
    icon: CheckIcon,
    items: [{ key: 'fertigmelden', label: 'Fertigmelden', icon: PanelIcon }],
  },
];

function HomeView() {
  return (
    <div className="home-view">
      <div className="home-card">
        <span className="home-eyebrow">Xecution App</span>
        <h3>Navigation gestartet</h3>
        <p>Wähle links einen Bereich, um die jeweilige Seite zu öffnen.</p>
      </div>
    </div>
  );
}

function findModule(key) {
  return MODULES.find((module) => module.key === key) || null;
}

function findLogistikLabel(viewKey) {
  return MODULES.find((module) => module.key === 'logistik')?.items.find((item) => item.key === viewKey)?.label || viewKey;
}

export default function App() {
  const [activeModuleKey, setActiveModuleKey] = useState('home');
  const [activeLogistikView, setActiveLogistikView] = useState('Produktionsuebersicht');
  const [activeFeinplanungView, setActiveFeinplanungView] = useState('Planung');
  const [openModuleKey, setOpenModuleKey] = useState('logistik');

  const activePage = useMemo(() => {
    if (activeModuleKey === 'home') {
      return {
        title: 'Home',
        label: 'Home',
        component: HomeView,
        props: {},
      };
    }

    const module = findModule(activeModuleKey);
    if (!module) {
      return {
        title: 'Home',
        label: 'Home',
        component: HomeView,
        props: {},
      };
    }

    if (module.key === 'logistik') {
      return {
        title: `Logistik - ${findLogistikLabel(activeLogistikView)}`,
        label: findLogistikLabel(activeLogistikView),
        component: SCREEN_COMPONENTS.logistik,
        props: {
          activeLogistikView,
          hideSidebar: true,
        },
      };
    }

    if (module.key === 'feinplanung') {
      return {
        title: `Feinplanung - ${activeFeinplanungView}`,
        label: activeFeinplanungView,
        component: SCREEN_COMPONENTS.feinplanung,
        props: {
          activeFeinplanungView,
          hideSidebar: true,
        },
      };
    }

    return {
      title: module.label,
      label: module.label,
      component: SCREEN_COMPONENTS[module.key],
      props: {},
    };
  }, [activeModuleKey, activeLogistikView, activeFeinplanungView]);

  const ActiveComponent = activePage.component;

  const handleGroupToggle = (moduleKey) => {
    setOpenModuleKey((current) => (current === moduleKey ? null : moduleKey));
  };

  const handleItemClick = (moduleKey, itemKey) => {
    setActiveModuleKey(moduleKey);
    setOpenModuleKey(moduleKey);
    if (moduleKey === 'logistik') {
      setActiveLogistikView(itemKey);
    } else if (moduleKey === 'feinplanung') {
      setActiveFeinplanungView(itemKey);
    }
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-top">
          <button className="menu-toggle" type="button" aria-label="Menü">
            <span />
            <span />
            <span />
          </button>

          <div className="brand">
            <div className="brand-mark" aria-hidden="true">
              =
              <span>X</span>
            </div>
            <div className="brand-copy">
              <h1>
                Xecution
                <br />
                App
              </h1>
            </div>
          </div>
        </div>

        <nav className="nav">
          <div className="nav-overview">
            <div className="nav-kicker">Übersicht</div>
            <button
              type="button"
              className={activeModuleKey === 'home' ? 'nav-link is-active' : 'nav-link'}
              onClick={() => setActiveModuleKey('home')}
            >
              <HomeIcon className="nav-icon" />
              <span className="nav-link-label">Home</span>
            </button>
          </div>

          <div className="nav-kicker nav-kicker-spaced">Module</div>

          {MODULES.map((module) => {
            const isOpen = openModuleKey === module.key;
            const isActiveGroup = activeModuleKey === module.key;
            const GroupIcon = module.icon;
            const firstItem = module.items[0];

            return (
              <div key={module.key} className={isActiveGroup ? 'nav-group is-active-group' : 'nav-group'}>
                <button
                  type="button"
                  className="group-header"
                  onClick={() => handleGroupToggle(module.key)}
                  aria-expanded={isOpen}
                >
                  <span className="group-header-left">
                    <GroupIcon className="nav-icon nav-icon-group" />
                    <span>{module.label}</span>
                  </span>
                  <span className={isOpen ? 'chevron is-open' : 'chevron'} aria-hidden="true">
                    ▸
                  </span>
                </button>

                {isOpen && (
                  <div className="group-items">
                    {module.items.map((item) => {
                      const ItemIcon = item.icon;
                      const isActiveItem =
                        module.key === 'logistik'
                          ? activeModuleKey === 'logistik' && activeLogistikView === item.key
                          : module.key === 'feinplanung'
                          ? activeModuleKey === 'feinplanung' && activeFeinplanungView === item.key
                          : activeModuleKey === module.key;

                      return (
                        <button
                          key={item.key}
                          type="button"
                          className={isActiveItem ? 'nav-link is-active nav-link-child' : 'nav-link nav-link-child'}
                          onClick={() => handleItemClick(module.key, item.key)}
                          aria-current={isActiveItem ? 'page' : undefined}
                        >
                          <ItemIcon className="nav-icon nav-icon-child" />
                          <span className="nav-link-label">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      <main className="content">
        <div className="content-header">
          <span className="content-label">Aktiv</span>
          <h2>{activePage.title}</h2>
        </div>

        <section className="screen-frame">
          <Suspense fallback={<div className="loading-state">Lädt...</div>}>
            <ActiveComponent {...activePage.props} />
          </Suspense>
        </section>
      </main>
    </div>
  );
}
