import type { UiMessages } from '../utils/uiTranslation';
import { adminCommonMessages } from './adminCommon';
import { adminSecurityMessages } from './adminSecurity';

const eventMessages = Object.fromEntries(
  Object.entries(adminSecurityMessages)
    .filter(([source]) => /^(User|Couple|Devotional|Prayer|Journal|Qa|Mood|Profile|Admin) · /.test(source))
    .map(([source, translations]) => {
      const words = source.replace(' · ', ' ').toLowerCase();
      return [words.charAt(0).toUpperCase() + words.slice(1), translations];
    }),
);

export const adminActivityMessages: UiMessages = {
  ...adminCommonMessages,
  ...eventMessages,
  'Could not load KPI data': ['የአፈጻጸም መረጃን መጫን አልተቻለም', 'Odeeffannoo raawwii feʼuun hin dandaʼamne'],
  'Activity recorded': ['እንቅስቃሴ ተመዝግቧል', 'Gocha galmaaʼe'],
  'Unknown user': ['ያልታወቀ ተጠቃሚ', 'Fayyadamaa hin beekamne'],
};
