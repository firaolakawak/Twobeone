import type { UiMessages } from '../utils/uiTranslation';
import { publicLandingMessages } from './publicLanding';

export const dashboardFeatureMessages = {
  'Bible Study': ['መጽሐፍ ቅዱስ ጥናት', 'Qoʼannoo Kitaaba Qulqulluu'],
  'Couple Journal': ['የጥንዶች ማስታወሻ', 'Yaadannoo Hiriyootaa'],
  'Prayer Tracker': ['የጸሎት ክትትል', 'Hordoffii Kadhannaa'],
  'Dates & Plans': ['ቀጠሮዎች እና ዕቅዶች', 'Beellamaa fi Karoora'],
  'Grow in His Word': ['በቃሉ እደጉ', 'Dubbii Isaa keessatti guddadhaa'],
  'Share & Be Real': ['አጋሩ እና ቅን ይሁኑ', 'Qoodaa, dhugaa taʼaa'],
  'Pray Together': ['አብራችሁ ጸልዩ', 'Waliin kadhadhaa'],
  'Build Your Future': ['የወደፊታችሁን ገንቡ', 'Fuuldura keessan ijaaraa'],
  'Read More': ['ተጨማሪ ያንብቡ', 'Dabalata dubbisaa'],
  // Reuse the existing authored quotation instead of inventing a Scripture edition.
  '“Two are better than one...”': publicLandingMessages['“Two are better than one.”'],
  'Ecclesiastes 4:9': publicLandingMessages['ECCLESIASTES 4:9'],
} satisfies UiMessages;
