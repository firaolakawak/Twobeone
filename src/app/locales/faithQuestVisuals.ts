import type { UiMessages } from '../utils/uiTranslation';

/** Brief labels accompanying emoji; the original mission copy supplies full context. */
export const faithQuestVisualMessages = {
  'Hard day. What would help you?': ['አስቸጋሪ ቀን። ምን ይረዳዎታል?', 'Guyyaa rakkisaa. Maaltu si gargaara?'],
  'Just listen': ['ብቻ አዳምጡኝ', 'Qofa na dhaggeeffadhu'],
  'Encourage me': ['አበረታቱኝ', 'Na jajjabeessi'],
  'Quiet company': ['በዝምታ አብሮነት', 'Callisanii waliin turuu'],

  'Your partner is late. What do you do?': ['አጋርዎ ዘግይቷል። ምን ያደርጋሉ?', 'Hiriyaan kee tureera. Maal goota?'],
  'Check in': ['ሁኔታውን ጠይቁ', 'Nagaa gaafadhu'],
  'Another time': ['በሌላ ጊዜ', 'Yeroo biraa'],
  'Miss you': ['ናፍቀውኛል', 'Si yaadeera'],

  'How will you send a little love?': ['ትንሽ ፍቅርን እንዴት ይልካሉ?', 'Jaalala xiqqoo akkamitti ergita?'],
  'Voice note': ['የድምፅ መልእክት', 'Ergaa sagalee'],
  'Three appreciations': ['ሦስት አድናቆቶች', 'Dinqisiifannaa sadii'],
  'Treasured memory': ['ውድ ትዝታ', 'Yaadannoo jaallatamaa'],

  'A small win! How would you celebrate?': ['ትንሽ ስኬት! እንዴት ያከብራሉ?', 'Milkaaʼina xiqqoo! Akkamitti kabajta?'],
  'Well done': ['መልካም ሠርተዋል', 'Baayʼee gaarii'],
  'Tell my story': ['ታሪኬን ልናገር', 'Seenaa koo himuu'],
  'Time together': ['አብሮ ጊዜ', 'Yeroo waliin'],

  'Talk or rest? How can you make room?': ['ውይይት ወይስ እረፍት? እንዴት ይስማማሉ?', 'Haasaʼuu moo boqochuu? Akkamitti waliif mijjeessitu?'],
  'Quick check-in': ['አጭር ውይይት', 'Wal gaafachuu gabaabaa'],
  'After resting': ['ካረፉ በኋላ', 'Erga boqotanii'],
  'Note for later': ['ለበኋላ መልእክት', 'Ergaa boodaaf'],

  'How can you give them breathing room?': ['እፎይታ እንዲያገኙ እንዴት ይረዳሉ?', 'Yeroo boqonnaa akkamitti kennitaaf?'],
  'No-rush encouragement': ['ያለ ጥድፊያ ማበረታታት', 'Jajjabina ariifannaa malee'],
  'Calming prayer': ['የሚያረጋጋ ጸሎት', 'Kadhannaa tasgabbeessu'],
  'Flexible time': ['የሚመች ጊዜ', 'Yeroo mijataa'],

  'Feeling overwhelmed? What pause helps you?': ['ጫና ተሰምቶዎታል? ምን ዓይነት እረፍት ይረዳዎታል?', 'Wanti sitti baayʼatee? Boqonnaan akkamii si gargaara?'],
  'Quiet minute': ['ጸጥ ያለ ደቂቃ', 'Daqiiqaa tasgabbaaʼaa'],
  'Break, then return': ['አርፈን እንመለስ', 'Boqonnee haa deebinu'],
  'Write thoughts': ['ሐሳቦችን መጻፍ', 'Yaada barreessuu'],

  'No reply yet. What could help?': ['እስካሁን ምላሽ የለም። ምን ይረዳል?', 'Ammas deebiin hin jiru. Maaltu gargaara?'],
  'Wait as agreed': ['በተስማሙት ጊዜ መጠበቅ', 'Akka waliigalanitti eeguu'],
  'Ask when': ['መቼ እንደሚመች ጠይቁ', 'Yoom akka taʼu gaafadhu'],
  'Share my need': ['ፍላጎቴን መግለጽ', 'Fedhii koo himuu'],

  'How can today feel a little less rushed?': ['የዛሬን ጥድፊያ እንዴት ይቀንሳሉ?', 'Ariifannaa harʼaa akkamitti hirʼista?'],
  'Shorter call': ['አጭር ጥሪ', 'Bilbila gabaabaa'],
  'Flexible plan': ['ምርጫ ያለው ዕቅድ', 'Karoora filannoo qabu'],
  'Break-time note': ['ለእረፍት ጊዜ መልእክት', 'Ergaa yeroo boqonnaa'],

  'Waiting for news. What support helps you?': ['ዜና እየጠበቁ ነው። ምን ድጋፍ ይረዳዎታል?', 'Oduu eegaa jirta. Deeggarsi kam si gargaara?'],
  'Pray together': ['አብሮ መጸለይ', 'Waliin kadhachuu'],
  'Light distraction': ['ቀላል መዝናኛ', 'Bashannana salphaa'],
  'Talk about worries': ['ስለ ጭንቀት ማውራት', 'Yaaddoo irratti haasaʼuu'],

  'They seem distracted. What could you say?': ['ትኩረታቸው የተበተነ ይመስላል። ምን ይላሉ?', 'Yaadaan fagaatanii fakkaatu. Maal jetta?'],
  'Better time?': ['ሌላ ጊዜ ይሻላል?', 'Yeroo biraa wayyaa?'],
  'One focused minute?': ['አንድ ደቂቃ በትኩረት?', 'Daqiiqaa tokko xiyyeeffannaan?'],
  'On your mind?': ['ምን እያሰቡ ነው?', 'Maal yaadaa jirta?'],

  'What encouragement will you send today?': ['ዛሬ ምን ማበረታቻ ይልካሉ?', 'Harʼa jajjabina akkamii ergita?'],
  'Name a strength': ['ጥንካሬን መጥቀስ', 'Cimina tokko himuu'],
  'Personal prayer': ['የግል ጸሎት', 'Kadhannaa dhuunfaa'],
  'Past victory': ['ያለፈ ድል', 'Injifannoo darbe'],

  'Which small gesture makes you feel cared for?': ['የትኛው ትንሽ ተግባር እንክብካቤ ያስሰማዎታል?', 'Gocha xiqqaa kamtu kunuunsa sitti dhageessisa?'],
  'Remember details': ['ትንንሽ ነገሮችን ማስታወስ', 'Waan xixiqqaa yaadachuu'],
  'How’d it go?': ['እንዴት ነበር?', 'Akkam ture?'],
  'Practical help': ['ተግባራዊ እርዳታ', 'Gargaarsa qabatamaa'],

  'Too much to do. How could you help?': ['ሥራ በዝቷል። እንዴት ሊረዱ ይችላሉ?', 'Hojiin baayʼateera. Akkamitti gargaaruu dandeessa?'],
  'Hardest task?': ['ከባዱ ሥራ የትኛው ነው?', 'Hojiin ulfaataan kam?'],
  'Help one task': ['በአንድ ሥራ መርዳት', 'Hojii tokko gargaaruu'],
  'Listen first': ['መጀመሪያ ማዳመጥ', 'Dura dhaggeeffachuu'],

  'How will you thank them for their effort?': ['ላደረጉት ጥረት እንዴት ያመሰግናሉ?', 'Carraaqqii isaaniif akkamitti galateeffatta?'],
  'Thank their effort': ['ጥረታቸውን ማመስገን', 'Carraaqqii galateeffachuu'],
  'Specific appreciation': ['የተለየ አድናቆት', 'Dinqisiifannaa adda taʼe'],
  'Thank-you card': ['የምስጋና ካርድ', 'Kaardii galataa'],

  'A hard conversation. What helps you begin?': ['ከባድ ውይይት። ለመጀመር ምን ይረዳዎታል?', 'Haasaʼa rakkisaa. Jalqabuuf maaltu si gargaara?'],
  'Calm time': ['የተረጋጋ ጊዜ', 'Yeroo tasgabbaaʼaa'],
  'We’re a team': ['እኛ አንድ ቡድን ነን', 'Nuti garee tokko'],
  'Pray first': ['መጀመሪያ መጸለይ', 'Dura kadhachuu'],

  'That text felt sharp. What comes first?': ['መልእክቱ አስቀይሟል። መጀመሪያ ምን ያደርጋሉ?', 'Ergaan sun si tuqe. Dura maal goota?'],
  'Ask their meaning': ['ምን ማለታቸውን ጠይቁ', 'Hiika isaa gaafadhu'],
  'Share my feelings': ['ስሜቴን መግለጽ', 'Miira koo himuu'],
  'Talk when ready': ['ሲዘጋጁ ማውራት', 'Yeroo qophaaʼan haasaʼuu'],

  'What peaceful moment will you send?': ['ምን ዓይነት የሰላም አፍታ ያጋራሉ?', 'Yeroo nagaa akkamii ergita?'],
  'Gentle prayer': ['ረጋ ያለ ጸሎት', 'Kadhannaa tasgabbaaʼaa'],
  'Peaceful photo': ['ሰላም የሚሰጥ ፎቶ', 'Suuraa nagaa'],
  'Rest invitation': ['ለእረፍት ግብዣ', 'Affeerraa boqonnaa'],

  'A misunderstanding. What helps you reconnect?': ['አለመግባባት። እንደገና ለመቀራረብ ምን ይረዳል?', 'Wal dhabuu. Deebiʼanii walitti dhihaachuuf maaltu gargaara?'],
  'Sincere apology': ['ከልብ ይቅርታ', 'Dhiifama garaadhaa'],
  'Hear both sides': ['ሁለቱንም ሐሳቦች መስማት', 'Yaada lamaanuu dhaggeeffachuu'],
  'Agree a change': ['በለውጥ ላይ መስማማት', 'Jijjiirama irratti waliigaluu'],

  'Different schedules. How can you stay close?': ['የተለያዩ መርሐ ግብሮች። እንዴት ይቀራረባሉ?', 'Sagantaa adda addaa. Akkamitti walitti dhihaattu?'],
  'Brief shared time': ['አጭር የጋራ ጊዜ', 'Yeroo gabaabaa waliin'],
  'Exchange notes': ['መልእክቶችን መለዋወጥ', 'Ergaa wal jijjiiruu'],
  'Plan unhurried time': ['ያልተቻኮለ ጊዜ ማቀድ', 'Yeroo tasgabbaaʼaa karoorfachuu'],

  'Which small act will you follow through on?': ['የትኛውን ትንሽ ተግባር ይፈጽማሉ?', 'Gocha xiqqaa kam raawwatta?'],
  'Promised update': ['ቃል የተገባ መረጃ', 'Oduu waadaa galame'],
  'Follow up news': ['ዜናቸውን መከታተል', 'Oduu isaanii hordofuu'],
  'Written prayer': ['የተጻፈ ጸሎት', 'Kadhannaa barreeffame'],

  'When apart, what helps you feel close?': ['ሲራራቁ ቅርበት እንዲሰማዎት ምን ይረዳል?', 'Yeroo walirraa fagaatan maaltu walitti isin dhiheessa?'],
  'Regular check-in': ['መደበኛ ውይይት', 'Yeroo yeroon wal gaafachuu'],
  'Everyday glimpse': ['የዕለት ተዕለት ቅኝት', 'Jireenya guyyaa ilaaluu'],
  'Wake-up message': ['የመነሻ ጊዜ መልእክት', 'Ergaa yeroo dammaqan'],

  'Your plans changed. How can you show care?': ['ዕቅድዎ ተቀይሯል። አሳቢነትን እንዴት ያሳያሉ?', 'Karoorri kee jijjiirameera. Kunuunsa akkamitti agarsiista?'],
  'Explain and reschedule': ['አስረድቶ እንደገና መቀጠር', 'Ibsanii deebiʼanii beellamuu'],
  'Ask the impact': ['ተጽእኖውን መጠየቅ', 'Dhiibbaa isaa gaafachuu'],
  'Acknowledge disappointment': ['ቅሬታን መረዳት', 'Gadda hubachuu'],

  'How will you show that you remembered?': ['እንዳስታወሱ እንዴት ያሳያሉ?', 'Akka yaadatte akkamitti agarsiista?'],
  'Ask about it': ['ስለ ጉዳዩ መጠየቅ', 'Waaʼee isaa gaafachuu'],
  'Shared memory': ['የጋራ ትዝታ', 'Yaadannoo waliin'],
  'Encourage their goal': ['ግባቸውን ማበረታታት', 'Kaayyoo isaanii jajjabeessuu'],

  'Which everyday habit helps you feel secure?': ['የትኛው ዕለታዊ ልማድ መተማመን ያስሰማዎታል?', 'Amalli guyyaa guyyaa kam amantaa siif kenna?'],
  'Keep our plans': ['ዕቅዶቻችንን መጠበቅ', 'Karoora keenya eeguu'],
  'Honest limits': ['ገደቦችን በእውነት መግለጽ', 'Daangaa dhugaadhaan ibsuu'],
  'Time to listen': ['ለማዳመጥ ጊዜ', 'Yeroo dhaggeeffachuu'],

  'A hard day. How could you invite joy?': ['አስቸጋሪ ቀን። ደስታን እንዴት ያመጣሉ?', 'Guyyaa rakkisaa. Gammachuu akkamitti affeerta?'],
  'Funny story?': ['አስቂኝ ታሪክ ይፈልጋሉ?', 'Seenaa kolfisiisu barbaaddaa?'],
  'Happy memory': ['አስደሳች ትዝታ', 'Yaadannoo gammachiisaa'],
  'Their activity choice': ['እነሱ የመረጡት ተግባር', 'Gocha isaan filatan'],

  'Which free, playful surprise will you prepare?': ['ያለ ወጪ ምን አስደሳች ስጦታ ያዘጋጃሉ?', 'Bashannana bilisaa kam qopheessita?'],
  'Memory riddle': ['የትዝታ እንቆቅልሽ', 'Hiibboo yaadannoo'],
  'Imaginary date sketch': ['የሕልም ቀጠሮ ሥዕል', 'Fakkii beellama yaadaa'],
  'Cheerful greeting': ['አስደሳች ሰላምታ', 'Nagaa gammachiisaa'],

  'What simple moment would brighten your day?': ['ምን ቀላል አፍታ ቀንዎን ያስደስታል?', 'Yeroon salphaan kam guyyaa kee gammachiisa?'],
  'Familiar funny story': ['የታወቀ አስቂኝ ታሪክ', 'Seenaa kolfisiisu beekamaa'],
  'Discover together': ['አብሮ ማወቅ', 'Waliin barachuu'],
  'Quiet gratitude': ['በእርጋታ ምስጋና', 'Galata tasgabbaaʼaa'],

  'Big or quiet celebrations? What could work?': ['ትልቅ ወይስ ጸጥ ያለ በዓል? ምን ይሻላል?', 'Kabaja guddaa moo tasgabbaaʼaa? Maaltu mijata?'],
  'What matters most?': ['ከሁሉ የሚበልጠው ምንድን ነው?', 'Maaltu caalaatti barbaachisa?'],
  'Surprise then quiet': ['ድንገተኛ ደስታና እርጋታ', 'Waan gammachiisuufi tasgabbii'],
  'Take turns choosing': ['በየተራ መምረጥ', 'Dabareedhaan filachuu'],

  'How will you share three reasons for gratitude?': ['ሦስት የምስጋና ምክንያቶችን እንዴት ያጋራሉ?', 'Sababoota galataa sadii akkamitti qoodda?'],
  'Three thank-you notes': ['ሦስት የምስጋና መልእክቶች', 'Ergaa galataa sadii'],
  'Three-photo collage': ['የሦስት ፎቶ ቅንብር', 'Suuraa sadii walitti qabame'],
  'Thankful prayer': ['የምስጋና ጸሎት', 'Kadhannaa galataa'],
} satisfies UiMessages;
