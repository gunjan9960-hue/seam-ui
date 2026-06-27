// Brand-accurate SVG icons for each connector

type ConnectorId =
  | "notion"
  | "slack"
  | "confluence"
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
