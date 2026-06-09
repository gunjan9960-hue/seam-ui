// Brand-accurate SVG icons for each connector

type ConnectorId =
  | "notion"
  | "jira"
  | "google-docs"
  | "google-sheets"
  | "slack"
  | "confluence"
  | "calendar"
  | "mixpanel";

interface ConnectorMeta {
  label: string;
  color: string;
  bg: string;
  Icon: React.FC<{ size: number }>;
}

const NotionIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect width="24" height="24" rx="4" fill="#FFFFFF"/>
    <path d="M6.5 5h7.8c.3 0 .6.1.8.3l2.6 2.6c.2.2.3.5.3.8V19c0 .6-.4 1-1 1H6.5c-.6 0-1-.4-1-1V6c0-.6.4-1 1-1z" fill="#191919"/>
    <path d="M8 9h8M8 12h6M8 15h4" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M14.5 5v3.5H18" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
  </svg>
);

const JiraIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect width="24" height="24" rx="4" fill="#0052CC"/>
    <path d="M12 4.5L7 9.5l3 3 2-2 2 2 3-3L12 4.5z" fill="#DEEBFF"/>
    <path d="M12 19.5L17 14.5l-3-3-2 2-2-2-3 3L12 19.5z" fill="#DEEBFF"/>
    <path d="M7 9.5l5 5 5-5" stroke="#0052CC" strokeWidth="0.5"/>
  </svg>
);

const GoogleDocsIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect width="24" height="24" rx="4" fill="#4285F4"/>
    <rect x="6" y="5" width="12" height="15" rx="1.5" fill="white"/>
    <path d="M8.5 10h7M8.5 12.5h7M8.5 15h5" stroke="#4285F4" strokeWidth="1.2" strokeLinecap="round"/>
    <path d="M14 5v3.5H18" fill="#B0C9FF"/>
  </svg>
);

const GoogleSheetsIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect width="24" height="24" rx="4" fill="#34A853"/>
    <rect x="6" y="5" width="12" height="15" rx="1.5" fill="white"/>
    <line x1="6" y1="11" x2="18" y2="11" stroke="#34A853" strokeWidth="1"/>
    <line x1="6" y1="14.5" x2="18" y2="14.5" stroke="#34A853" strokeWidth="1"/>
    <line x1="11" y1="5" x2="11" y2="20" stroke="#34A853" strokeWidth="1"/>
  </svg>
);

const SlackIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect width="24" height="24" rx="4" fill="#4A154B"/>
    <circle cx="8.5" cy="9" r="2" fill="#E01E5A"/>
    <circle cx="15.5" cy="9" r="2" fill="#36C5F0"/>
    <circle cx="8.5" cy="15" r="2" fill="#2EB67D"/>
    <circle cx="15.5" cy="15" r="2" fill="#ECB22E"/>
  </svg>
);

const ConfluenceIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect width="24" height="24" rx="4" fill="#1868DB"/>
    <path d="M5.5 16.5c.3-.5 3-4.5 6.5-4.5s6.2 4 6.5 4.5" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.5"/>
    <path d="M5.5 7.5C5.8 8 8.5 12 12 12s6.2-4 6.5-4.5" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/>
  </svg>
);

const CalendarIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect width="24" height="24" rx="4" fill="#EA4335"/>
    <rect x="5" y="7" width="14" height="12" rx="1.5" fill="white"/>
    <rect x="5" y="7" width="14" height="4" rx="1.5" fill="#EA4335"/>
    <line x1="9" y1="5" x2="9" y2="9" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="15" y1="5" x2="15" y2="9" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    <rect x="8" y="13" width="2.5" height="2.5" rx="0.5" fill="#EA4335"/>
    <rect x="12" y="13" width="2.5" height="2.5" rx="0.5" fill="#EA4335"/>
  </svg>
);

const MixpanelIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect width="24" height="24" rx="4" fill="#7C3AED"/>
    <rect x="5" y="15" width="3" height="4" rx="1" fill="white" opacity="0.5"/>
    <rect x="10" y="11" width="3" height="8" rx="1" fill="white" opacity="0.75"/>
    <rect x="15" y="7" width="3" height="12" rx="1" fill="white"/>
    <path d="M6.5 10L11 7l5.5 2.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
  </svg>
);

export const CONNECTORS: Record<ConnectorId, ConnectorMeta> = {
  notion: {
    label: "Notion",
    color: "#191919",
    bg: "#F5F5F5",
    Icon: NotionIcon,
  },
  jira: {
    label: "Jira",
    color: "#0052CC",
    bg: "#EBF2FF",
    Icon: JiraIcon,
  },
  "google-docs": {
    label: "Google Docs",
    color: "#4285F4",
    bg: "#EBF3FF",
    Icon: GoogleDocsIcon,
  },
  "google-sheets": {
    label: "Google Sheets",
    color: "#34A853",
    bg: "#E8F5E9",
    Icon: GoogleSheetsIcon,
  },
  slack: {
    label: "Slack",
    color: "#4A154B",
    bg: "#F9F0F9",
    Icon: SlackIcon,
  },
  confluence: {
    label: "Confluence",
    color: "#1868DB",
    bg: "#EBF2FF",
    Icon: ConfluenceIcon,
  },
  calendar: {
    label: "Calendar",
    color: "#EA4335",
    bg: "#FEECEB",
    Icon: CalendarIcon,
  },
  mixpanel: {
    label: "Mixpanel",
    color: "#7C3AED",
    bg: "#F5F3FF",
    Icon: MixpanelIcon,
  },
};

export default function ConnectorIcon({
  id,
  size = 28,
}: {
  id: ConnectorId;
  size?: number;
}) {
  const connector = CONNECTORS[id];
  if (!connector) return null;
  const { Icon } = connector;
  return <Icon size={size} />;
}

export type { ConnectorId };
