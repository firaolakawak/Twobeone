export interface StaticDevotional {
  id: string;
  date: string;
  title: string;
  verse: string;
  reference: string;
  reflection: string;
  prayerPrompt: string;
  tags: string[];
  status: 'published';
  language: 'en';
}

// Generate dates starting from today
function getDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0];
}

export const STATIC_DEVOTIONALS: StaticDevotional[] = [
  {
    id: 'dev-001',
    date: getDate(0),
    title: 'Love That Never Fails',
    verse: 'Love is patient, love is kind. It does not envy, it does not boast, it is not proud. It does not dishonor others, it is not self-seeking, it is not easily angered, it keeps no record of wrongs.',
    reference: '1 Corinthians 13:4–5',
    reflection: `Paul's famous description of love was not written for a wedding ceremony — it was written to a church tearing itself apart with pride and self-interest. That is precisely what makes it so powerful. Real love is not a feeling that rises and falls with circumstances; it is a daily choice to act in the interest of another.

Notice what love is not. It is not self-seeking. It is not easily angered. It keeps no record of wrongs. These are not natural instincts — they are disciplines. The natural human impulse is to protect ourselves, remember offenses, and demand our rights. Covenant love requires us to lay these instincts down.

As you prepare for marriage, ask yourself: Which of these qualities do I find hardest to practice? Where do I most quickly become self-seeking or keep score? Bring those places honestly before God — and before each other. The couple who can speak truthfully about their struggles with love will build a marriage on something far more durable than romantic feelings alone.`,
    prayerPrompt: 'Lord, show us where love is still growing in us. Teach us to be patient with each other and to keep no record of wrongs. Make our love more like Yours — steady, kind, and long-suffering. Amen.',
    tags: ['love', 'character', 'foundation'],
    status: 'published',
    language: 'en',
  },
  {
    id: 'dev-002',
    date: getDate(1),
    title: 'The Cord of Three Strands',
    verse: 'Though one may be overpowered, two can defend themselves. A cord of three strands is not quickly broken.',
    reference: 'Ecclesiastes 4:12',
    reflection: `Solomon, in his wisdom, identifies the principle that underlies every lasting marriage: strength is found not in two, but in three. When God is the third strand woven into your relationship, the bond becomes exponentially stronger than what either of you could create alone.

A two-strand rope will fray under pressure. Every marriage faces pressure — seasons of financial hardship, grief, relational conflict, health challenges, and spiritual dryness. Couples who have built on shared faith in God do not merely survive these seasons — they are refined by them, their bond deepened precisely because the difficulty drove them closer to God and to each other.

The practical implication is this: your spiritual life together is not a supplement to your relationship — it is its structural foundation. Pray together. Read Scripture together. Worship together. Seek wise counsel together. Every spiritual practice you build now is a strand woven into the cord that will hold you when life tests your union.`,
    prayerPrompt: 'Father, be the third strand in our relationship. We acknowledge that we cannot build a lasting marriage on our own strength. Weave yourself into every part of our life together. Amen.',
    tags: ['faith', 'foundation', 'community'],
    status: 'published',
    language: 'en',
  },
  {
    id: 'dev-003',
    date: getDate(2),
    title: 'Speaking Truth in Love',
    verse: 'Instead, speaking the truth in love, we will grow to become in every respect the mature body of him who is the head, that is, Christ.',
    reference: 'Ephesians 4:15',
    reflection: `Paul gives us one of the most challenging balancing acts in all of relational life: speak the truth in love. Not truth without love — that is cruelty. Not love without truth — that is flattery that enables harm. Both, together, in the same moment, aimed at the growth of the other person.

In marriage, you will need to tell your partner things they do not want to hear. You will need to name patterns you observe, name needs that are going unmet, and at times confront choices that are causing harm. The temptation is to choose between honesty and kindness — to either say nothing (false peace) or say everything without care (destructive honesty).

The way of Christ is different. He told his disciples hard truths — about their pride, their lack of faith, their misunderstanding of His mission. But He did so as one who was for them, not against them. That is the spirit truth-telling in marriage requires: I am saying this because I am completely for you, and that requires me to be honest with you.`,
    prayerPrompt: 'Lord, give us courage to speak truth and grace to speak it kindly. Let our honesty with each other always flow from love, never from pride or frustration. Grow us into people who can hear hard things because we trust each other\'s hearts. Amen.',
    tags: ['communication', 'honesty', 'growth'],
    status: 'published',
    language: 'en',
  },
  {
    id: 'dev-004',
    date: getDate(3),
    title: 'Humility: The Soil of a Strong Marriage',
    verse: 'Do nothing from selfish ambition or conceit, but in humility count others more significant than yourselves. Let each of you look not only to his own interests, but also to the interests of others.',
    reference: 'Philippians 2:3–4',
    reflection: `Paul's instruction seems simple on the surface, but it cuts against the grain of almost everything our culture teaches. We are trained to assert our rights, advocate for our interests, and refuse to be taken advantage of. Into this cultural current, Scripture places a stunning command: consider others more significant than yourself.

In marriage, this is not a license for one partner to be a doormat. It is a mutual posture — each person actively looking out for the interests of the other. Imagine a marriage where both partners wake up each day asking not "What do I need?" but "What does my partner need, and how can I meet it?" That marriage would be revolutionary.

Pride is the enemy of this posture. Pride says: my perspective is more accurate, my needs are more important, my version of events is correct. Humility says: I might be wrong. My partner's experience matters. Their needs are worth prioritizing. The couple who chooses humility — especially when it is costly — will find that it creates a safety in the relationship that no amount of romantic chemistry can replicate.`,
    prayerPrompt: 'Jesus, you humbled yourself — taking the form of a servant, laying down your life. Teach us to do the same for each other. Where pride has taken root in us, uproot it. Replace it with the genuine, costly humility that builds lasting love. Amen.',
    tags: ['humility', 'character', 'servanthood'],
    status: 'published',
    language: 'en',
  },
  {
    id: 'dev-005',
    date: getDate(4),
    title: 'Forgiveness: The Daily Discipline',
    verse: 'Be kind to one another, tenderhearted, forgiving one another, as God in Christ forgave you.',
    reference: 'Ephesians 4:32',
    reflection: `The grammar of this verse is important. It does not say "forgive each other when they deserve it" or "forgive each other when the offense is small." The model is: as God in Christ forgave you. That forgiveness was unconditional, complete, and costly. It is the standard Paul sets for marriage.

You will be wronged by your partner. They will forget something important, speak carelessly in a moment of stress, fail to meet a need you expressed, or carry a wound from their past that spills onto you. This is not pessimism — it is the honest acknowledgment that two imperfect people building a shared life will inevitably hurt each other.

The question is not whether you will be hurt, but what you will do with the hurt when it comes. Unforgiveness builds walls — slowly, one brick at a time. Forgiveness tears them down. The couple that builds a culture of quick, genuine forgiveness — and genuine repentance — will find that their marriage becomes more resilient with each year, not less. They will trust each other more, not less, because they have practised the grace that says: "You are not beyond my forgiveness."`,
    prayerPrompt: 'Father, thank You for forgiving us completely in Christ. Let that forgiveness overflow into our relationship. Where we have been hurt, give us the grace to forgive fully. Where we have caused hurt, give us the humility to own it and repent. Amen.',
    tags: ['forgiveness', 'grace', 'conflict'],
    status: 'published',
    language: 'en',
  },
  {
    id: 'dev-006',
    date: getDate(5),
    title: 'Prayer as Partnership',
    verse: '"Again I tell you, if two of you on earth agree about anything they ask for, it will be done for them by my Father in heaven."',
    reference: 'Matthew 18:19',
    reflection: `There is a particular power to prayer between two people who have made a covenant to walk through life together. Jesus identifies agreement in prayer as the condition for a remarkable promise: that the Father hears and responds. The word agree in Greek is sumphoneo — from which we get symphony. Agreement in prayer is not monotony; it is two distinct voices harmonising in the same direction before God.

Couples who pray together — genuinely, vulnerably, regularly — report something that many describe as a kind of intimacy unlike any other. When you pray with your partner, you hear what is on their heart before God. You hear what they are afraid of, what they are grateful for, what they are asking for on your behalf. Prayer between a couple opens a window into the soul of the other person.

The enemy will fight your prayer life together more than almost anything else. It feels vulnerable, even awkward at first. Start small — 60 seconds before you sleep, a sentence before a difficult conversation, a word of thanks together before a meal. Build the habit now, before the weight of life makes it feel optional. It is not optional. It is the artery of your spiritual life together.`,
    prayerPrompt: 'Lord, teach us to pray together. Remove the awkwardness and self-consciousness that keeps us from this. Let our shared prayer become the thread that runs through every day of our life together, keeping us anchored to You and to each other. Amen.',
    tags: ['prayer', 'spiritual life', 'intimacy'],
    status: 'published',
    language: 'en',
  },
  {
    id: 'dev-007',
    date: getDate(6),
    title: 'Building on the Rock',
    verse: '"Everyone who hears these words of mine and puts them into practice is like a wise man who built his house on the rock. The rain came down, the streams rose, and the winds blew and beat against that house; yet it did not fall, because it had its foundation on the rock."',
    reference: 'Matthew 7:24–25',
    reflection: `Jesus does not say the storms won't come. He says they will — rain, floods, winds. The difference between the wise builder and the foolish one is not the quality of the weather; it is the quality of the foundation. Both houses were apparently identical on the surface. The difference only became visible under pressure.

This parable was addressed to individuals, but it applies with equal force to marriages. Every couple will face storms — financial pressure, grief, conflict, illness, seasons of spiritual dryness, prodigal children, broken expectations. The storm does not reveal your strength; it reveals your foundation.

Building on the rock is not a one-time decision. It is a daily, practical commitment to hear the words of Jesus and put them into practice. It means praying when you don't feel like it. Forgiving when you'd rather keep score. Serving when you'd rather be served. Choosing honesty when vagueness feels safer. These daily choices are the bricks of your foundation, laid one at a time, before the storm ever arrives.`,
    prayerPrompt: 'Lord Jesus, help us build our marriage on Your words — not just hear them, but live them. Expose any sand we might be building on — any false security, any unaddressed weakness. Give us the courage to build well now, so we can weather whatever comes. Amen.',
    tags: ['foundation', 'faithfulness', 'preparation'],
    status: 'published',
    language: 'en',
  },
  {
    id: 'dev-008',
    date: getDate(7),
    title: 'The Gift of Listening',
    verse: 'My dear brothers and sisters, take note of this: Everyone should be quick to listen, slow to speak and slow to become angry.',
    reference: 'James 1:19',
    reflection: `Quick to listen. Slow to speak. The natural human order is exactly reversed — we are quick to speak and slow to listen, especially with the people closest to us. James names this tendency and calls us to something countercultural and, in marriage, revolutionary.

Deep listening is one of the most profound gifts you can give your partner. Not listening to respond, or to correct, or to wait for a pause so you can share your perspective — but listening to understand. Listening that says: I will set aside my own narrative long enough to genuinely enter yours.

In marriage, being listened to well feels like being loved. When your partner puts down their phone, turns to face you, and gives you their full attention, something shifts. You feel seen. Valued. Safe. And that safety is exactly what allows both partners to be vulnerable, honest, and real. Begin practising this now, before the distractions of life — children, work, screens, busyness — crowd it out. The couple that keeps the discipline of deep listening will find that intimacy does not fade with years; it deepens.`,
    prayerPrompt: 'God, make us better listeners — to You and to each other. Where we are quick to speak and slow to hear, reshape us. Give us the patience and the genuine curiosity to listen until we truly understand, not just until we can respond. Amen.',
    tags: ['communication', 'listening', 'intimacy'],
    status: 'published',
    language: 'en',
  },
  {
    id: 'dev-009',
    date: getDate(8),
    title: 'Servant Leadership',
    verse: '"Whoever wants to become great among you must be your servant, and whoever wants to be first must be your slave — just as the Son of Man did not come to be served, but to serve, and to give his life as a ransom for many."',
    reference: 'Matthew 20:26–28',
    reflection: `Jesus redefined greatness. In the kingdom of God, the measure of a person is not what they accumulate or control, but what they give away and whom they serve. This principle does not pause at the threshold of a marriage. If anything, it finds its deepest expression there.

The word servant comes from the Greek diakonos — one who waits on others, attends to their needs, acts on their behalf. Jesus used it to describe His own mission. The greatest servant who ever lived was not diminished by serving; He was glorified by it. His authority was not weakened by His posture of servanthood — it was expressed through it.

For husbands, this is the calling of leadership: not to command, but to serve. Not to demand compliance, but to create conditions where your partner thrives. For wives, and indeed for both partners, the question each morning becomes: How can I serve this person today? Not because I am obligated to, but because I am following the One who first served me. The marriage built on mutual service reflects the kingdom of God in the midst of ordinary domestic life.`,
    prayerPrompt: 'Jesus, You came to serve, not to be served. Reshape our understanding of what it means to lead and to love. Give us servant hearts — hearts that find joy in giving, not just receiving. Make our marriage a small picture of Your kingdom. Amen.',
    tags: ['servanthood', 'leadership', 'character'],
    status: 'published',
    language: 'en',
  },
  {
    id: 'dev-010',
    date: getDate(9),
    title: 'Guarding Your Hearts Together',
    verse: 'Above all else, guard your heart, for everything you do flows from it.',
    reference: 'Proverbs 4:23',
    reflection: `The heart, in biblical language, is the seat of the will, the emotions, and the deepest intentions of a person. Everything flows from it — our words, our choices, our patterns of relating, our capacity to love. Solomon's instruction to guard it is therefore one of the most comprehensive pieces of wisdom in Scripture.

In marriage, what does it mean to guard your heart? It means being honest with yourself and your partner about where temptation tends to take root — in what relationships, contexts, or media. It means building accountability and transparency into your life together rather than keeping compartments closed. It means maintaining the spiritual disciplines — prayer, Scripture, worship, community — that keep the heart oriented toward God and not toward lesser things.

The enemy is not passive. He does not leave hearts uncontested. But the couple who guards their hearts together — who pray for each other, speak honestly about vulnerability, and keep no hidden corners — will find that their marriage is not constantly on the defensive, but actively flourishing in the protection of God.`,
    prayerPrompt: 'Lord, guard our hearts — individually and together. Where we are vulnerable, be our shield. Give us the courage to be transparent with each other about our struggles, and the grace to protect one another without judgment. Amen.',
    tags: ['integrity', 'protection', 'spiritual discipline'],
    status: 'published',
    language: 'en',
  },
  {
    id: 'dev-011',
    date: getDate(10),
    title: 'Do Not Let the Sun Go Down on Your Anger',
    verse: '"In your anger do not sin": Do not let the sun go down while you are still angry, and do not give the devil a foothold.',
    reference: 'Ephesians 4:26–27',
    reflection: `Paul acknowledges something important: anger is not automatically sin. It is a human emotion that can be appropriate — Jesus himself was angry when he cleared the temple. The sin is not in the anger; it is in what we do with it. And the danger is time. When anger is left unresolved, it curdles — into resentment, bitterness, and contempt.

The image of the sun going down is urgent. Deal with it today. Not perfectly, not necessarily with complete resolution — sometimes complex conflicts need more than one conversation. But do not allow distance to grow overnight. Go to sleep with some form of reconciliation, even if just a mutual acknowledgment: "I love you, this isn't resolved yet, but I'm still for you."

The phrase "give the devil a foothold" is sobering. Unresolved anger is not neutral. It is an invitation to something darker — a root of bitterness that, once established, is difficult to remove. The couple who develops the discipline of short accounts, of not letting resentment accumulate, is the couple who will find that their love deepens rather than erodes with each passing year.`,
    prayerPrompt: 'Father, where we have anger, help us process it quickly and honestly. Do not let resentment take root between us. Give us the humility to reach for each other even when we are hurt, and the grace to repair quickly what conflict has frayed. Amen.',
    tags: ['conflict', 'anger', 'forgiveness', 'communication'],
    status: 'published',
    language: 'en',
  },
  {
    id: 'dev-012',
    date: getDate(11),
    title: 'Money and the Heart',
    verse: '"For where your treasure is, there your heart will be also."',
    reference: 'Matthew 6:21',
    reflection: `Jesus makes a startling claim: your money reveals your heart. Not your stated values, not your Sunday theology, not your aspirations — your actual spending patterns. The bank statement is one of the most honest spiritual documents you will ever encounter.

This is not primarily about guilt over how you spend money. It is an invitation to clarity. What do your current spending patterns reveal about what you genuinely value? What would you be willing to sacrifice financially for? What do you instinctively protect, and what do you instinctively give away? These patterns did not begin in adulthood; they were formed in childhood, shaped by your family's relationship with money, and reinforced by every financial decision you have made since.

Bringing these patterns into the open — with honesty and without shame — is one of the most important pre-marriage conversations you can have. The couple who can talk about money, who can see each other's patterns clearly and choose together what their treasure will be, will build not just financial stability but a shared set of values that will bless their entire household.`,
    prayerPrompt: 'Lord, align our hearts with Your kingdom. Show us where our treasure actually is, not where we wish it were. Give us generosity where there is hoarding, and wisdom where there is anxiety. Let our financial life together reflect what we truly believe about You. Amen.',
    tags: ['finances', 'stewardship', 'values'],
    status: 'published',
    language: 'en',
  },
  {
    id: 'dev-013',
    date: getDate(12),
    title: 'Rejoicing in Each Other',
    verse: 'Rejoice with those who rejoice; mourn with those who mourn.',
    reference: 'Romans 12:15',
    reflection: `This short verse contains one of the most demanding instructions in all of Paul's letters. Mourning with those who mourn is difficult, but it comes somewhat naturally — grief invites empathy. Rejoicing with those who rejoice is, for many of us, harder. It requires the death of envy, the burial of comparison, and the genuine celebration of another person's flourishing even when our own circumstances are difficult.

In marriage, your partner's joy should be your joy. When they receive good news, are promoted, achieve something they worked hard for, or experience a moment of pure delight — your first response reveals something about the quality of your love. Can you celebrate genuinely? Or do you find yourself minimising their joy, redirecting to your own experience, or feeling diminished by their success?

The couple who learns to be each other's greatest champion — who can hold the other's highs and lows with equal authenticity — will build a friendship that no external pressure can break. Your partner should be the first person you want to tell good news to, because they will be the most genuinely happy for you of anyone on earth.`,
    prayerPrompt: 'Lord, root out the envy and comparison that prevents us from celebrating each other fully. Teach us to delight in each other\'s flourishing. Let our marriage be marked by genuine joy — for each other and with each other. Amen.',
    tags: ['friendship', 'joy', 'empathy'],
    status: 'published',
    language: 'en',
  },
  {
    id: 'dev-014',
    date: getDate(13),
    title: 'The Wisdom of Counsel',
    verse: 'Plans fail for lack of counsel, but with many advisers they succeed.',
    reference: 'Proverbs 15:22',
    reflection: `Pride says: we can figure this out on our own. Wisdom says: we are stronger with people around us who can see what we cannot see, name what we cannot name, and offer what we do not have. Every great marriage has been built not just by two people, but within a community of people who have invested in its health.

Before you marry, seek out couples who have built what you want to build — 10, 20, 30 years in — and learn from them. Ask them hard questions. What do you wish you had known? What patterns did you have to fight against? How did you navigate the hard seasons? Their wisdom is a gift, and most people who have built well are deeply willing to share it.

Mentorship is not weakness — it is stewardship. You are stewarding one of the most important relationships in your life. To refuse wise counsel in order to appear self-sufficient is to risk something irreplaceable. Receive the wisdom of those who have gone before. Build your inner circle with intention. And when you have built something lasting, be willing to pass it on.`,
    prayerPrompt: 'Lord, send wise counselors into our lives — older couples, pastors, mentors — who will speak truth into our relationship. Give us the humility to receive counsel and the discernment to apply it wisely. We do not want to navigate this alone. Amen.',
    tags: ['wisdom', 'community', 'mentorship'],
    status: 'published',
    language: 'en',
  },
  {
    id: 'dev-015',
    date: getDate(14),
    title: 'Two Weeks In: Renewing Your Commitment',
    verse: 'Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up.',
    reference: 'Galatians 6:9',
    reflection: `Galatians 6:9 was written for the long haul. It anticipates the reality that doing good — in any relationship, any calling, any discipline — will sometimes feel unrewarding, repetitive, or costly without visible return. Paul's instruction is not to increase the intensity of effort, but to maintain the direction of commitment: do not give up.

Marriage is a long-haul endeavour. The early seasons are filled with discovery, romance, and fresh commitment. But every couple, regardless of how well-matched they are, will encounter seasons that feel like hard work with little visible return. Seasons of miscommunication, unmet expectations, the grinding routine of ordinary life. In those seasons, Galatians 6:9 is a word to lean into.

The harvest does not come immediately. It comes in time, for those who do not give up. The couple who keeps choosing each other through the ordinary days — who keeps serving, forgiving, listening, and pursuing — will one day look at the life they have built and understand what the harvest means. Keep going.`,
    prayerPrompt: 'Lord, give us endurance. In the seasons when love feels like work, remind us that You are faithful. Let the vision of the harvest keep us committed through the hard seasons. We choose to keep choosing each other. Amen.',
    tags: ['endurance', 'commitment', 'perseverance'],
    status: 'published',
    language: 'en',
  },
  {
    id: 'dev-016',
    date: getDate(15),
    title: 'Bearing One Another\'s Burdens',
    verse: 'Carry each other\'s burdens, and in this way you will fulfil the law of Christ.',
    reference: 'Galatians 6:2',
    reflection: `The law of Christ, Paul says, is fulfilled not by a list of rules but by the simple, daily act of bearing one another's burdens. To bear a burden is not merely to acknowledge that someone is struggling — it is to take some of the weight onto yourself. To say: I am not just sorry you are carrying this; I am going to help you carry it.

In marriage, this may be the most practical expression of love you will offer each other. Your partner will face burdens you cannot fully understand — grief from their past, anxiety about the future, the weight of failure, physical pain, vocational disappointment. You cannot remove these burdens. But you can sit in them. You can ask questions. You can remember. You can show up consistently, not just at the dramatic moments, but in the ordinary middle of a hard season.

Burden-bearing requires two things: the partner who bears must be willing to be honest about their burden (vulnerability), and the partner who carries must be willing to receive without judgment or advice that was not asked for (empathy). Both capacities are built over time, through consistent practice. Begin building them now.`,
    prayerPrompt: 'Jesus, You carried our burdens to the cross. Teach us to carry one another\'s burdens with that same love. Make us safe places for each other\'s pain. Give us the wisdom to know when to speak and when to simply be present. Amen.',
    tags: ['empathy', 'support', 'friendship'],
    status: 'published',
    language: 'en',
  },
  {
    id: 'dev-017',
    date: getDate(16),
    title: 'Contentment: The Secret',
    verse: 'I have learned, in whatever state I am, to be content. I know how to be brought low, and I know how to abound.',
    reference: 'Philippians 4:11–12',
    reflection: `Paul says he has learned contentment. This is not a trait he was born with — it is a discipline he acquired through experience. The school of contentment has an unusual curriculum: it teaches in both abundance and scarcity. It is only the person who has navigated both who can claim to know the secret.

Discontentment is corrosive in a marriage. It whispers: this is not enough. My partner is not enough. Our life is not enough. There is something better I should have, be, or experience. This whisper, left unchecked, will hollow out even the most seemingly compatible relationship. It will cause you to be perpetually dissatisfied — with your circumstances, your partner, and eventually yourself.

Contentment does not mean passivity or the absence of ambition. Paul was one of the most driven people in the New Testament. Contentment is the settled peace that what God has given you right now — this person, this season, this life — is genuinely good and worth embracing fully. Build this posture now, before the comparison trap of social media, career ambition, or neighbourhood pressure has a chance to take root in your marriage.`,
    prayerPrompt: 'Lord, teach us the secret of contentment. Where we are grasping for more, quiet us. Let us see the genuine goodness of what You have given us — each other, this season, this life. Guard us from the discontentment that would eat away at the gift of our love. Amen.',
    tags: ['contentment', 'gratitude', 'character'],
    status: 'published',
    language: 'en',
  },
  {
    id: 'dev-018',
    date: getDate(17),
    title: 'The Power of Encouragement',
    verse: 'Therefore encourage one another and build each other up, just as in fact you are doing.',
    reference: '1 Thessalonians 5:11',
    reflection: `The Greek word for encourage here is parakaleo — the same root as the word Jesus uses for the Holy Spirit: the Paraclete, the one who comes alongside. To encourage is to come alongside, to give strength, to speak courage into another person when their own courage is flagging.

Your partner needs your encouragement more than they need your assessment. They will spend much of their life being evaluated — by employers, colleagues, social media, their own inner critic. They need one place where the default register is not critique but affirmation. You can be that person for them.

Encouragement is not flattery. It is the honest recognition of genuine qualities and efforts. "I noticed how patiently you handled that situation." "I'm proud of who you are becoming." "The way you just did that — that's exactly what I love about you." These words cost nothing and mean everything. Build a daily practice of naming what you genuinely appreciate in your partner. Watch what happens to their confidence, their security, and their capacity to love you in return.`,
    prayerPrompt: 'Holy Spirit, the great Encourager, make us encouragers of each other. Show us the genuine gifts in our partner that are easy to overlook. Give us words that build up, not tear down. Let our home be a place where both of us feel genuinely seen and celebrated. Amen.',
    tags: ['encouragement', 'communication', 'affirmation'],
    status: 'published',
    language: 'en',
  },
  {
    id: 'dev-019',
    date: getDate(18),
    title: 'Leaving and Cleaving: The Relational Realignment',
    verse: 'That is why a man leaves his father and mother and is united to his wife, and they become one flesh.',
    reference: 'Genesis 2:24',
    reflection: `God's blueprint for marriage contains a before and an after. Before: a man (and by extension, a woman) is embedded in the family of origin. After: a new primary allegiance is formed. The leaving is not abandonment or dishonour — it is the necessary relational realignment that makes genuine cleaving possible.

Many couples struggle with this transition. Parents who have good intentions can unconsciously resist the leaving, continuing to expect primary loyalty, influence over decisions, or emotional precedence. And adult children who have not fully separated can find themselves caught between two competing allegiances.

The principle is clear: your spouse is your first loyalty among human relationships. Not your parents, not your best friend, not your children (when they come). Your spouse. This does not happen automatically or easily. It requires intentional communication with your families of origin, clear decisions about how family relationships will be structured, and a mutual commitment to make your marriage the protected centre. Discuss this honestly before you walk down the aisle. It is far easier to establish healthy patterns at the beginning than to realign them after years of drift.`,
    prayerPrompt: 'Father, give us the courage and the wisdom to leave well and cleave completely. Where family relationships need to be restructured, guide our conversations. Let our marriage be the primary human covenant in both of our lives, honoured by everyone who loves us. Amen.',
    tags: ['family', 'boundaries', 'foundation', 'leaving-cleaving'],
    status: 'published',
    language: 'en',
  },
  {
    id: 'dev-020',
    date: getDate(19),
    title: 'Gracious Speech',
    verse: 'Let your conversation be always full of grace, seasoned with salt, so that you may know how to answer everyone.',
    reference: 'Colossians 4:6',
    reflection: `Paul's image is vivid: speech that is full of grace and seasoned with salt. Salt in the ancient world was a preservative — it kept things from rotting. Gracious, well-seasoned speech preserves relationships. It keeps the goodwill between people from deteriorating. Careless speech — critical, sarcastic, dismissive, or harsh — is the opposite. It accelerates decay.

The partner you will spend your life with will hear more of your words than anyone else on earth. They will hear you in your worst moments — exhausted, stressed, frustrated, afraid. The challenge is to maintain a standard of gracious speech not just in public, not just on good days, but in the ordinary and difficult moments of domestic life.

This does not mean never disagreeing or never expressing frustration. Salt also adds flavour — speech can be honest and direct and still be gracious. The question is not "Am I saying what I want to say?" but "Am I saying it in a way that preserves the relationship, that honours this person, that I will not regret?" Practice before you marry. The patterns you establish now will follow you into the home you build together.`,
    prayerPrompt: 'Lord, set a guard over our mouths. Fill our words with grace and season them with wisdom. Where careless or harsh words have become habits, reshape us. Let the way we speak to each other be a source of life, not damage. Amen.',
    tags: ['communication', 'speech', 'grace'],
    status: 'published',
    language: 'en',
  },
  {
    id: 'dev-021',
    date: getDate(20),
    title: 'The Generosity Principle',
    verse: 'Give, and it will be given to you. A good measure, pressed down, shaken together and running over, will be poured into your lap. For with the measure you use, it will be measured to you.',
    reference: 'Luke 6:38',
    reflection: `Jesus is speaking about giving in its broadest sense — money, time, service, mercy, love. The principle is consistent across all of these: the posture of generosity returns to the giver in full measure, pressed down, running over. This is not a prosperity formula — it is a description of how generosity transforms the one who practices it and creates abundance in every dimension of life.

In marriage, generosity is the oxygen of love. The generous spouse gives their time without counting hours. They give their attention without distraction. They give their forgiveness without conditions. They give financially in proportion to what they have, not out of obligation. They give their energy to the relationship even when they are tired.

The arithmetic of generosity is counterintuitive. The more you give to your marriage — of yourself, your resources, your patience, your creativity — the more is returned to you. Not because your partner is obligated to reciprocate, but because generosity creates an atmosphere in which love flourishes and grows. Begin the practice of generosity now, and watch what it does to the culture of your relationship.`,
    prayerPrompt: 'Generous God, You have given us everything in Christ. Let that overflow into our marriage. Loosen our grip on our time, our resources, and our energy. Make us genuinely, joyfully generous with each other and with the world around us. Amen.',
    tags: ['generosity', 'giving', 'finances'],
    status: 'published',
    language: 'en',
  },
  {
    id: 'dev-022',
    date: getDate(21),
    title: 'Three Weeks: Sabbath Rest',
    verse: 'By the seventh day God had finished the work he had been doing; so on the seventh day he rested from all his work. Then God blessed the seventh day and made it holy.',
    reference: 'Genesis 2:2–3',
    reflection: `Rest is not a concession to human weakness — it is built into the structure of creation by God himself. The Sabbath was established not because God was tired, but as a rhythm of delight, renewal, and remembrance. It is a weekly declaration that we are not what we produce, and that the world will continue to turn without our constant effort.

In marriage, the rhythm of Sabbath is a profound gift. When life fills up — careers, children, ministry, responsibilities — the margin for genuine connection shrinks. Without intentional rest, a couple can easily find themselves living parallel lives under the same roof, efficient and exhausted, but not truly together.

The Sabbath principle applied to marriage looks different for every couple, but it begins with the same question: What does genuine rest and delight look like for us together? Not productive activity. Not scheduled appointments. Rest. Play. Worship. Quiet. The regular practice of stopping — of setting down the weight of a productive week to simply be with God and with each other — is one of the most countercultural and life-giving things a couple can do.`,
    prayerPrompt: 'Lord of the Sabbath, teach us to rest. In a culture that prizes constant productivity, give us the courage to stop. Let our rest together be a source of renewal — for our bodies, our spirits, and our love for each other. Amen.',
    tags: ['rest', 'sabbath', 'rhythm'],
    status: 'published',
    language: 'en',
  },
  {
    id: 'dev-023',
    date: getDate(22),
    title: 'Trust: The Invisible Architecture',
    verse: 'Now faith is confidence in what we hope for and assurance about what we do not see.',
    reference: 'Hebrews 11:1',
    reflection: `Trust in a marriage functions like a foundation in a building — invisible, underground, but the weight of everything else rests on it. When trust is intact, a marriage feels spacious and safe. When trust is damaged — by dishonesty, unfaithfulness, or repeated broken commitments — the structure above ground begins to crack, regardless of how beautiful it appears to the outside world.

Trust is built in the small moments, not the dramatic ones. It is built when you do what you said you would do. When you are where you said you would be. When you protect your partner's vulnerabilities rather than weaponise them in conflict. When you tell the truth even when a small lie would be more convenient. These small acts of trustworthiness, accumulated over years, create a foundation strong enough to hold any weight.

No marriage has perfect trust at every moment — trust can be wounded and must be rebuilt. The question is not whether you will be trustworthy flawlessly, but whether the overall direction of your life together is one of growing transparency, honesty, and follow-through. Build that culture now, brick by brick, and you will have something no storm can shake.`,
    prayerPrompt: 'God of faithfulness, make us trustworthy people. Where we are tempted to conceal, give us the courage to be transparent. Where trust has been wounded, guide us in rebuilding it well. Let our commitment to each other be something the other can lean on completely. Amen.',
    tags: ['trust', 'integrity', 'faithfulness'],
    status: 'published',
    language: 'en',
  },
  {
    id: 'dev-024',
    date: getDate(23),
    title: 'When God Feels Distant',
    verse: 'My God, my God, why have you forsaken me? Why are you so far from saving me, so far from my cries of anguish?',
    reference: 'Psalm 22:1',
    reflection: `Even the greatest saints have experienced seasons when God felt distant, silent, or absent. The Psalms are full of this honest cry — not a crisis of unbelief, but the authentic prayer of someone pressing through spiritual dryness. Jesus himself quoted these words from the cross. They are not the words of a faithless person; they are the words of someone committed enough to faith to pray honestly when it is hard.

Couples will face seasons of spiritual dryness — individually and together. Seasons when prayer feels hollow, when Scripture seems flat, when worship is effortful, and when God's presence feels remote. These seasons are not signs of a broken marriage or a failed faith. They are part of the normal terrain of spiritual life.

What matters in these seasons is not the intensity of feeling but the direction of movement. Keep praying even when it feels empty. Keep reading even when it seems dry. Keep showing up to worship together even when neither of you feels much. The discipline of continuing to reach for God in the dry season is what shapes spiritual maturity — and the couple who walks through dryness together, keeping faith despite the feeling, will find their bond deepened by the shared experience of persevering.`,
    prayerPrompt: 'God, even when we cannot feel You, we choose to reach for You. In our dry seasons — individually and together — be closer than we feel. Do not let spiritual dryness become spiritual drift. Keep us reaching for You and for each other. Amen.',
    tags: ['faith', 'spiritual life', 'perseverance'],
    status: 'published',
    language: 'en',
  },
  {
    id: 'dev-025',
    date: getDate(24),
    title: 'Children: A Heritage from the Lord',
    verse: 'Children are a heritage from the LORD, offspring a reward from him.',
    reference: 'Psalm 127:3',
    reflection: `The word heritage in Hebrew (nachalah) carries the meaning of a gift that is entrusted to you — something that belongs ultimately to the giver, but is placed in your care. Children, the psalmist says, belong first to God. They come to parents as stewards, not as possessions. This reframing changes everything about how we think about parenting.

Before children arrive, it is wise to discuss honestly: What is our theology of children? What are we hoping to pass on? What will we do differently from how we were raised? What values, rhythms, and practices will define our household? These conversations do not need to be exhaustive before marriage, but they need to begin. Significant misalignment around children — whether to have them, how many, how to raise them, what role faith will play — is one of the most common sources of marital pain when left unaddressed.

Whether or not children are in your future, the posture of stewardship — holding your life and relationships with open hands as a trust from God — is one of the most liberating convictions a couple can carry. Nothing you hold is yours to keep; everything has been given to you for a purpose larger than your own comfort.`,
    prayerPrompt: 'Lord, whatever our future holds, help us hold it with open hands. Give us wisdom and unity as we discuss our hopes and plans for family. And wherever You entrust children to us, make us faithful and loving stewards of the heritage You place in our care. Amen.',
    tags: ['family', 'children', 'stewardship'],
    status: 'published',
    language: 'en',
  },
  {
    id: 'dev-026',
    date: getDate(25),
    title: 'The Renewal of the Mind',
    verse: 'Do not conform to the pattern of this world, but be transformed by the renewing of your mind. Then you will be able to test and approve what God\'s will is — his good, pleasing and perfect will.',
    reference: 'Romans 12:2',
    reflection: `The world has a pattern — a set of assumptions, values, and narratives about what a good life looks like, what a successful marriage looks like, what love means, what enough is. These patterns are absorbed slowly, often without our awareness, through media, culture, comparison, and the accumulated weight of ordinary daily life.

Paul's instruction is radical: do not be conformed. Do not let the pattern of the world shape your marriage by default. Instead, be transformed — which requires the active, ongoing renewal of the mind. Read Scripture. Think carefully. Discuss with each other which cultural narratives you are accepting and which ones you are rejecting. Be intentional about the marriage you are building, not just the marriage that happens to you.

What does this look like practically? Choosing not to measure your marriage by cultural metrics of success. Resisting the comparison trap. Refusing to let busyness crowd out the intentional practices of love. Deciding your values around money, time, and family in light of the gospel, not in light of what your peers are doing. Conformity is easy and unconscious. Transformation requires deliberate effort and the grace of God. Choose transformation.`,
    prayerPrompt: 'Lord, transform our minds. Where we have absorbed the world\'s narrative without realising it — about success, love, enough, beauty, or worth — expose it and replace it with the truth of Your kingdom. Let our marriage be shaped by Your will, not the world\'s pattern. Amen.',
    tags: ['worldview', 'transformation', 'intentionality'],
    status: 'published',
    language: 'en',
  },
  {
    id: 'dev-027',
    date: getDate(26),
    title: 'Planted Together',
    verse: 'Blessed is the one who does not walk in step with the wicked or stand in the way that sinners take or sit in the company of mockers, but whose delight is in the law of the LORD, and who meditates on his law day and night. That person is like a tree planted by streams of water, which yields its fruit in season and whose leaf does not wither — whatever they do prospers.',
    reference: 'Psalm 1:1–3',
    reflection: `The image of the tree planted by streams of water is one of the most beautiful in all of Scripture. Rootedness. Fruitfulness. Resilience — the leaf does not wither even in dry seasons, because the root goes deep enough to reach water that is not affected by surface conditions.

For a marriage, this psalm raises two critical questions: What are you planted in? And what are you planted near? Planted in means the substance of your daily life — what you meditate on, what you delight in, what you return to for nourishment. Planted near means the community, relationships, and environment that shape you.

The couple who plants their marriage in the Word of God — who read, discuss, and meditate on Scripture together — will develop a rootedness that can hold in any season. And the couple who plants their marriage near a community of faith — who chooses friendships that build up rather than tear down — will find that the streams are never far away, even in dry seasons. Be intentional about where you plant, and you will be astonished at what grows.`,
    prayerPrompt: 'Lord, plant our marriage in You. Let Your Word be the soil we return to daily. Place us near streams of living water — in community, in worship, in relationship with people who know You deeply. Make us like trees that yield fruit in every season. Amen.',
    tags: ['roots', 'scripture', 'community', 'spiritual life'],
    status: 'published',
    language: 'en',
  },
  {
    id: 'dev-028',
    date: getDate(27),
    title: 'The Ministry of Reconciliation',
    verse: 'All this is from God, who reconciled us to himself through Christ and gave us the ministry of reconciliation.',
    reference: '2 Corinthians 5:18',
    reflection: `God's primary movement in history has been toward reconciliation — closing the distance between himself and His creation, bridging the gap that human sin created. And remarkably, He invites us into that same ministry. We are not just recipients of reconciliation; we are entrusted with it.

In marriage, reconciliation is not a crisis management tool — it is a way of life. The ministry of reconciliation begins in your own home, with your own partner. Every time you choose repair over retaliation, restoration over resentment, and coming toward rather than withdrawing — you are practising the ministry that God has given you.

And it extends outward. The couple who has learned to reconcile well — who has practised the art of repair in the privacy of their own home — has something to offer the world. They can mediate conflict in their community. They can speak hope to marriages that are struggling. They can model what it looks like to choose each other after the hardest kind of argument. Your marriage, refined by the practice of reconciliation, becomes a form of ministry.`,
    prayerPrompt: 'God of reconciliation, teach us the practice of repair. When we have torn something in our relationship, give us the courage and the grace to come toward each other and restore it. Make us, over time, ministers of reconciliation — in our home and in the world. Amen.',
    tags: ['reconciliation', 'conflict', 'restoration'],
    status: 'published',
    language: 'en',
  },
  {
    id: 'dev-029',
    date: getDate(28),
    title: 'What Covenant Looks Like on a Tuesday',
    verse: '"This is what the LORD Almighty says: \'Even now, return to me with all your heart...\' Return to the LORD your God, for he is gracious and compassionate, slow to anger and abounding in love."',
    reference: 'Joel 2:12–13',
    reflection: `Covenant commitment is most visible not on the wedding day, but on an unremarkable Tuesday. On the days when nothing dramatic is happening, when the ordinary weight of life has made everyone a little tired and a little distracted, and when showing up for each other requires nothing glamorous — just presence, patience, and small acts of faithfulness.

The romantic vision of marriage is sustained by high points. The covenant vision of marriage is sustained by consistency in the ordinary. Every time you choose to put down your phone and be present. Every time you ask a genuine question instead of making an assumption. Every time you speak kindly when you are tired. Every time you reach toward your partner when withdrawing would be easier — these ordinary moments are the substance of a great marriage.

Joel's call to return is a call available in any moment, after any drift. You do not need a dramatic occasion to renew your commitment to each other. Today — this ordinary Tuesday — is the day. Choose each other in the small moment right in front of you, and discover that the covenant is alive and well.`,
    prayerPrompt: 'Lord, keep us faithful in the ordinary days. In the unremarkable Tuesdays of life — the tired evenings, the repetitive routines, the small moments that feel like nothing — let us choose each other with quiet, steady faithfulness. Amen.',
    tags: ['covenant', 'faithfulness', 'ordinary life'],
    status: 'published',
    language: 'en',
  },
  {
    id: 'dev-030',
    date: getDate(29),
    title: 'The End of the Beginning',
    verse: 'Being confident of this, that he who began a good work in you will carry it on to completion until the day of Christ Jesus.',
    reference: 'Philippians 1:6',
    reflection: `Thirty days of devotional practice is a beginning, not a destination. And that is a good word to carry into marriage: every day is a beginning, not a destination. You are not trying to arrive at a finished product — you are in the middle of an ongoing work, one that God himself is authoring and completing.

The confidence Paul expresses is not in the Philippians' consistency or commitment — it is in God's faithfulness. He who began a good work will carry it to completion. The One who started something in you individually, and now in you together, will not abandon it half-finished. The seasons of difficulty, the patterns that need changing, the growth that feels slow — none of these signal that the work has failed. They are all part of the process of something being completed.

Take this truth into your marriage. God is at work. Not just in the big decisions and the dramatic moments, but in the daily practice of choosing love, in the gradual formation of character, in the slow deepening of trust and intimacy. You are not finished. Neither is He. And the most beautiful part of a covenant marriage may be the growing realization — year by year — of just how much is still becoming.`,
    prayerPrompt: 'God of completion, we thank You that You are not finished with us. Keep working in us — individually and together. Where we are impatient with our own growth, give us Your long perspective. We trust that what You began, You will complete. Amen.',
    tags: ['hope', 'perseverance', 'growth', 'completion'],
    status: 'published',
    language: 'en',
  },
];
