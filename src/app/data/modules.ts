export interface StaticLesson {
  id: string;
  title: string;
  duration: string;
  content: string;
}

export interface StaticModule {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  scripture: string;
  scriptureRef: string;
  lessons: StaticLesson[];
  iconKey: string;
  accentColor: string;
  accentBg: string;
  accentBorder: string;
  duration: string;
  isLocked: boolean;
}

export const STATIC_MODULES: StaticModule[] = [
  {
    id: 'module-1',
    title: "God's Design for Marriage",
    subtitle: 'Biblical Foundations of Covenant',
    description:
      'Explore the divine blueprint for marriage — from Genesis to Ephesians. Discover why God created marriage as a sacred covenant and how a Christ-centered union reflects His relationship with the Church.',
    scripture:
      '"Therefore a man shall leave his father and his mother and hold fast to his wife, and they shall become one flesh."',
    scriptureRef: 'Genesis 2:24',
    iconKey: 'book',
    accentColor: 'var(--primary-600)',
    accentBg: 'var(--primary-50)',
    accentBorder: 'var(--primary-200)',
    duration: '1h 35m',
    isLocked: false,
    lessons: [
      {
        id: '1a',
        title: 'Marriage as Covenant, Not Contract',
        duration: '20 min',
        content: `MARRIAGE AS COVENANT, NOT CONTRACT

Opening Prayer
Begin in prayer, asking God to open your hearts to His design for marriage.

What is a Covenant?
In the ancient world, a covenant was far more than a legal agreement — it was a sacred, binding oath before God that involved the exchange of identity, loyalty, and even life itself. Unlike a contract, which is conditional ("I will do X if you do Y"), a covenant is unconditional: "I will give myself fully to you, regardless."

The Hebrew word for covenant is "berith" (ברית), and throughout Scripture, God initiates covenants with His people not because of their merit, but because of His love and faithfulness.

Genesis 2:24 — "Therefore a man shall leave his father and his mother and hold fast to his wife, and they shall become one flesh."

Marriage as a Divine Covenant
God did not design marriage as a temporary arrangement or a social contract that can be dissolved when inconvenient. He designed it as a covenant — a permanent, exclusive, life-giving bond between a man and a woman that images His own covenantal love for His people.

Three Marks of a Marriage Covenant:
1. LEAVING — Forsaking all competing loyalties. You establish a new primary household before God.
2. CLEAVING — Clinging to your spouse with unbreakable commitment, even through difficulty.
3. ONE FLESH — A complete union of body, soul, and spirit that is uniquely exclusive and sacred.

The Difference This Makes
When you view marriage as a contract, you keep score. You evaluate your spouse's performance. You calculate whether the relationship is "worth it." Contracts are broken when one party fails to deliver.

When you view marriage as a covenant, you ask: "How can I serve?" You extend grace when your spouse falls short. You pursue reconciliation when conflict arises. Covenants are honoured by laying down your rights.

Reflection Questions:
- In what ways have you thought of your relationship more like a contract than a covenant?
- What would it look like to commit to your partner covenantally — without conditions?
- How does knowing that God keeps His covenants give you courage to do the same?

Scripture for Meditation:
Malachi 2:14 — "The LORD was witness between you and the wife of your youth, to whom you have been faithless, though she is your companion and your wife by covenant."

Closing Challenge:
Write a short covenant statement to your future spouse — not what you expect from them, but what you commit to give.`,
      },
      {
        id: '1b',
        title: "The Trinity's Reflection in Marriage",
        duration: '25 min',
        content: `THE TRINITY'S REFLECTION IN MARRIAGE

Opening Reflection
"God created man in His own image, in the image of God He created him; male and female He created them." — Genesis 1:27

The Imago Dei and Marriage
To say that human beings are made in the image of God (imago Dei) is stunning enough. But note: it is in the context of creating them male and female that this image-bearing is described. This suggests that something about the union of husband and wife uniquely reflects the nature of God Himself.

God exists eternally as the Trinity: Father, Son, and Holy Spirit. Three persons, one God — distinct yet perfectly united in love, will, and purpose. No person of the Trinity acts independently; each gives fully to the other in what theologians call perichoresis — a mutual indwelling and self-giving love.

How Marriage Mirrors the Trinity:
- DISTINCTION WITHOUT DIVISION — Husband and wife are two distinct persons, yet "one flesh." The Trinity is three distinct persons, yet one God.
- MUTUAL SELF-GIVING — The Father gives all to the Son; the Son glorifies the Father. In marriage, you are called to give yourselves fully to one another.
- UNITY FROM LOVE — Trinitarian unity flows from perfect love. Marital unity flows not from compatibility or chemistry, but from sacrificial, covenant love.

The Danger of Individualism
Modern culture worships the autonomous self. "You do you." But the Trinity reveals that true identity is found in relationship, not isolation. Husband and wife do not lose themselves in marriage — they find their fuller selves as they pour out for one another.

Ephesians 5:25 — "Husbands, love your wives, as Christ loved the church and gave himself up for her."
The model for a husband's love is not cultural romance — it is Christ's self-emptying sacrifice. This is Trinitarian love made visible in marriage.

Reflection Questions:
- How does understanding God as Trinity change the way you think about your own identity in your future marriage?
- Where do you feel pulled toward self-preservation rather than self-giving in your relationship?
- What would it look like to "pour out" for your partner this week?

Closing Prayer:
Father, Son, and Holy Spirit — perfect community of love — shape our marriage to reflect Your unity. Teach us to give without keeping score, to serve without seeking return, and to love with a love that is not our own but Yours. Amen.`,
      },
      {
        id: '1c',
        title: 'Leaving & Cleaving: Prioritizing Your Spouse',
        duration: '20 min',
        content: `LEAVING & CLEAVING: PRIORITIZING YOUR SPOUSE

The Command to Leave
Genesis 2:24 begins with a command that is harder than it sounds: "A man shall leave his father and his mother." In the ancient world, this was radical. Family identity, economic security, and social belonging were all tied to your family of origin.

To "leave" is not just a geographic move — it is a relational realignment. You are establishing a new primary loyalty. Your spouse is now your closest human relationship, your primary household, your covenant partner.

What Leaving Looks Like Today:
- Emotional leaving: Your spouse's feelings and needs take priority over your parents' opinions.
- Decisional leaving: Major life decisions are made between the two of you, prayerfully before God — not dictated by your family of origin.
- Financial leaving: You build your own financial household together, not as an extension of your parents' household.

Note: Leaving does not mean dishonoring your parents (Exodus 20:12). It means your marriage covenant is now the primary human covenant in your life.

The Call to Cleave
The Hebrew word for "cleave" (dabaq) is the same word used to describe devotion and loyalty — even military allegiance. It is fierce, deliberate, and active. You do not drift into cleaving; you choose it, daily.

Cleaving means:
- Running toward your spouse in conflict, not away
- Protecting your marriage from emotional affairs, excessive outside demands, or misplaced loyalties
- Investing time, energy, and resources into your marriage as your highest human priority

Practical Threats to Cleaving:
- Over-involvement with family of origin
- Friendships or work relationships that draw emotional intimacy away from your spouse
- Technology, screens, and distraction that replace intentional connection

Ruth 1:16 — "Where you go I will go, and where you lodge I will lodge. Your people shall be my people, and your God my God."

Discussion Exercise:
Together, identify one area in each of your lives where "leaving" is still a work in progress. What makes it difficult? What would cleaving look like in that area?

Closing Truth:
Healthy marriages do not happen by accident. They are built by two people who choose — every day — to leave everything that competes and to cleave to one another.`,
      },
      {
        id: '1d',
        title: 'Marriage as a Gospel Picture',
        duration: '30 min',
        content: `MARRIAGE AS A GOSPEL PICTURE

The Great Mystery
In Ephesians 5:31-32, Paul quotes Genesis 2:24 and then says something astonishing: "This mystery is profound, and I am saying that it refers to Christ and the church."

Marriage was not invented merely for human flourishing — though it serves that purpose. It was designed from the beginning to be a living parable of the gospel.

The Husband as Christ
Ephesians 5:25-27 — "Husbands, love your wives, as Christ loved the church and gave himself up for her, that he might sanctify her…"

A husband's calling is not authority as the world understands it — commanding, demanding, dominating. His calling is cruciform authority: leading through sacrifice, serving through love, laying down his preferences, rights, and comfort for the good of his wife and family.

Christ pursued the church when she was unlovely (Romans 5:8). He gave His life not because the church earned it, but because love is the nature of God. Husbands are called to this same self-emptying love.

The Wife as the Church
Ephesians 5:22-24 — "Wives, submit to your own husbands, as to the Lord."

This is perhaps the most misunderstood passage in all of marriage theology. The context (verse 21) begins with mutual submission: "Submit to one another out of reverence for Christ." The wife's submission is not subjugation — it is a voluntary, Spirit-empowered response to a husband who loves her as Christ loves the church.

The church does not submit to Christ out of fear — but out of love, trust, and the security of knowing Christ laid down His life for her. This is the picture Paul holds before husbands and wives alike.

The Witness of a Christ-Centered Marriage
When a husband loves his wife sacrificially and a wife responds with honour and love, the watching world sees a picture of something it desperately needs: a God who pursues, a love that is unconditional, and a relationship that is rooted not in performance but in grace.

Your marriage will be a sermon. The question is what it preaches.

Reflection Questions:
- As a future husband: Where do you feel the pull to lead with authority rather than sacrifice? What would servant leadership look like this week?
- As a future wife: Where do you find it hardest to trust and honour? What would it mean to bring this to God?
- Together: How do you want your marriage to represent the gospel to your family, community, and church?

Closing Scripture:
"So they are no longer two but one flesh. What therefore God has joined together, let not man separate." — Matthew 19:6`,
      },
    ],
  },
  {
    id: 'module-2',
    title: 'Communication & Conflict',
    subtitle: 'Speaking Truth in Love',
    description:
      'Learn the art of Christ-like communication. Discover how to listen deeply, express vulnerably, and resolve conflict in ways that strengthen your bond rather than erode it.',
    scripture:
      '"Be quick to hear, slow to speak, slow to anger; for the anger of man does not produce the righteousness of God."',
    scriptureRef: 'James 1:19–20',
    iconKey: 'message',
    accentColor: 'var(--secondary-600)',
    accentBg: 'var(--secondary-50)',
    accentBorder: 'var(--secondary-200)',
    duration: '1h 40m',
    isLocked: false,
    lessons: [
      {
        id: '2a',
        title: 'The Listening Heart',
        duration: '25 min',
        content: `THE LISTENING HEART

Opening Scripture
"Know this, my beloved brothers: let every person be quick to hear, slow to speak, slow to anger." — James 1:19

Why Listening is a Spiritual Discipline
Most of us were never taught to truly listen. We were taught to wait for our turn to speak, to formulate our response, to defend our position. But Scripture presents listening as an act of humility, respect, and love.

To listen deeply to your spouse is to say: "You matter. Your inner world is worth my full attention. I will set aside my agenda to understand yours."

This is precisely how God listens to us. Psalm 34:15 — "The eyes of the LORD are toward the righteous and his ears toward their cry."

The Four Levels of Listening:
1. PASSIVE HEARING — You hear words, but your mind is elsewhere. This is the minimum.
2. SELECTIVE LISTENING — You hear what confirms what you already believe. Dangerous in conflict.
3. ATTENTIVE LISTENING — You focus on the words and meaning. Better, but still primarily cognitive.
4. EMPATHIC LISTENING — You seek to understand not just the words, but the feelings, needs, and heart beneath them. This is what your spouse needs.

The Listening Killers:
- Formulating your rebuttal while your partner is still speaking
- Interrupting to "correct the record"
- Minimising: "You're overreacting" / "That's not a big deal"
- Advising before being asked: "Here's what you should do..."
- Emotionally checking out when the topic is uncomfortable

The Skill of Reflective Listening:
Instead of immediately responding, try reflecting back what you heard: "What I'm hearing is that you felt unseen when I came home and went straight to my phone. Is that right?"

This does two things: (1) it shows your spouse they were heard, and (2) it gives you both the chance to correct any misunderstanding before you respond.

Proverbs 18:2 — "A fool takes no pleasure in understanding, but only in expressing his opinion."

Practice Exercise:
Partner A speaks for 3 minutes about something that matters to them. Partner B only listens — no questions, no responses. Then Partner B reflects back what they heard. Switch roles. Debrief: What did it feel like to be fully listened to?

Closing Reflection:
Great marriages are not built on great talkers — they are built on great listeners. Ask God to make you a spouse who listens to understand, not just to respond.`,
      },
      {
        id: '2b',
        title: 'Expressing Needs Without Contempt',
        duration: '20 min',
        content: `EXPRESSING NEEDS WITHOUT CONTEMPT

The Four Horsemen
Researcher John Gottman identified four communication patterns that predict divorce with over 90% accuracy. He calls them the Four Horsemen:
1. CRITICISM — Attacking your partner's character rather than their behaviour
2. CONTEMPT — Treating your partner as beneath you: eye-rolling, mockery, disgust
3. DEFENSIVENESS — Refusing to take responsibility; counter-attacking
4. STONEWALLING — Emotional withdrawal; shutting down

Of these four, contempt is the most destructive. It communicates: "I am superior to you. You are beneath me." Contempt corrodes love like acid.

The Antidote: The Soft Start-Up
Instead of "You never listen to me! You only care about yourself!" (criticism/contempt), try: "I've been feeling disconnected from you lately, and I really miss you. Can we make some time this week to talk?"

The difference: You are expressing a need without attacking your partner's character.

"I" Statements vs "You" Statements:
- YOU statement: "You always come home grumpy and take it out on me."
- I statement: "I feel hurt when I sense tension at the end of the day and I'm not sure how to reach you."

The "I" statement is vulnerable. It requires you to own your feelings rather than assign blame. This is far harder — and far more effective.

Ephesians 4:29 — "Let no corrupting talk come out of your mouths, but only such as is good for building up, as fits the occasion, that it may give grace to those who hear."

Needs Are Not Weaknesses
Many of us grew up in homes where expressing needs was equated with weakness or burden. We learned to suppress, minimise, or explode rather than articulate.

But God built you with legitimate needs — for connection, security, appreciation, physical affection, respect, understanding. Expressing these needs honestly and gently is not weakness; it is the courageous vulnerability that sustains intimacy.

Practice Together:
Each person completes the sentence: "I feel __________ when __________, and what I need is __________." Practice saying this about something real — even if small. Notice how your partner receives it.

Closing Truth:
Contempt builds walls. Vulnerable honesty builds bridges. Ask God to give you the courage to express your needs gently — and the grace to receive your partner's needs with compassion.`,
      },
      {
        id: '2c',
        title: 'Biblical Conflict Resolution',
        duration: '30 min',
        content: `BIBLICAL CONFLICT RESOLUTION

Conflict is Not the Enemy
Many couples enter marriage believing that a good marriage is a conflict-free marriage. This is a myth — and a harmful one. Conflict is not a sign that something is wrong with your marriage; it is a sign that two different people are living together, which is exactly what marriage is.

The question is not whether you will conflict — you will. The question is whether conflict will destroy you or develop you.

Matthew 18:15 — "If your brother sins against you, go and tell him his fault, between you and him alone."

The biblical model is not avoidance, and it is not explosion. It is courageous, private, direct conversation — between you and your spouse, before you involve anyone else.

The PAUSE Principle:
P — PRAY before you speak. Ask God to guide your words.
A — ACKNOWLEDGE your part. Rarely is conflict entirely one-sided.
U — UNDERSTAND their perspective before defending your own.
S — SPEAK the truth in love (Ephesians 4:15). Be honest and kind simultaneously.
E — EXTEND forgiveness. Do not hold the conflict over their head once it is resolved.

Repair Attempts
Gottman's research found that what distinguishes stable from unstable couples is not the absence of conflict but the presence of "repair attempts" — bids during conflict to de-escalate tension. These can be:
- Humour (used carefully): "We're both really fired up about this toothpaste thing…"
- Acknowledgment: "I think I understand your point, even if I see it differently."
- Timeout request: "I'm getting flooded. Can we take 20 minutes and come back to this?"

Proverbs 15:1 — "A soft answer turns away wrath, but a harsh word stirs up anger."

The 24-Hour Rule:
For significant conflicts, if emotions are running too high, agree to pause — but commit to returning within 24 hours. Stonewalling (perpetual avoidance) is corrosive. Flooding (escalating emotions) prevents resolution. The discipline is: pause, regulate, return.

Discussion Exercise:
Identify a topic you typically avoid because it creates conflict. Practice a "soft start-up" about it now — use an "I" statement, express the need, invite conversation. Notice what happens.

Closing Scripture:
"Be angry and do not sin; do not let the sun go down on your anger, and give no opportunity to the devil." — Ephesians 4:26–27`,
      },
      {
        id: '2d',
        title: 'Forgiveness as a Daily Practice',
        duration: '25 min',
        content: `FORGIVENESS AS A DAILY PRACTICE

The Weight We Were Not Meant to Carry
Unforgiveness is often described as "drinking poison and expecting the other person to die." When you hold on to an offense — nursing the wound, rehearsing the argument, cataloguing the failures — you are the one who is slowly diminished.

But forgiveness is not primarily about your emotional health, though it restores it. Forgiveness is primarily a theological act — it reflects the heart of God toward you.

Colossians 3:13 — "Bear with one another and, if one has a complaint against another, forgiving each other; as the Lord has forgiven you, so you also must forgive."

What Forgiveness Is — and Is Not:
FORGIVENESS IS:
- A decision, not a feeling (you may need to choose it before you feel it)
- Releasing your spouse from the debt of the offense
- Opening the door to restoration

FORGIVENESS IS NOT:
- Pretending the offense didn't happen
- Trusting immediately (trust is rebuilt; forgiveness is given)
- Condoning harmful or abusive behaviour
- Forgetting (though sometimes forgetting follows genuine forgiveness)

The Seventy Times Seven Standard
Matthew 18:21-22 — Peter asked Jesus: "Lord, how often will my brother sin against me, and I forgive him? As many as seven times?" Jesus replied: "I do not say to you seven times, but seventy-seven times."

Jesus is not giving a mathematical formula — He is demolishing the scorekeeping mentality altogether. Marriage is one of the most fertile grounds for forgiveness practice, because you will be wronged — repeatedly, by the person you love most.

Building a Culture of Forgiveness:
- Make it safe to say "I was wrong. I'm sorry."
- When your spouse apologises, receive it generously.
- Do not weaponise past forgiven offenses in future conflict.
- Pray together over wounds that are slow to heal.

1 Corinthians 13:5 — Love "keeps no record of wrongs."

Practical Discipline:
At the end of each day, before you sleep, briefly examine: Is there anything I need to forgive my spouse for? Is there anything I need to ask their forgiveness for? Keep the relational slate clean. Do not let offenses accumulate.

Closing Prayer:
Lord, You have forgiven us a debt we could never repay. Give us the grace to forgive one another freely. Where wounds are deep and forgiveness feels impossible, be our strength. Let our marriage be a place of perpetual grace. Amen.`,
      },
    ],
  },
  {
    id: 'module-3',
    title: 'Roles & Servant Leadership',
    subtitle: 'Partnership Rooted in Christ',
    description:
      "Discover what Scripture truly teaches about roles in marriage — not hierarchy for dominance, but servant leadership and mutual submission that mirrors Christ's love for the Church.",
    scripture:
      '"Submit to one another out of reverence for Christ… Husbands, love your wives, as Christ loved the church."',
    scriptureRef: 'Ephesians 5:21, 25',
    iconKey: 'heart',
    accentColor: 'var(--success-700)',
    accentBg: 'var(--success-50)',
    accentBorder: 'var(--success-200, #bbf7d0)',
    duration: '1h 35m',
    isLocked: false,
    lessons: [
      {
        id: '3a',
        title: 'Mutual Submission in Christ',
        duration: '25 min',
        content: `MUTUAL SUBMISSION IN CHRIST

The Forgotten Verse
Before Paul ever addresses husbands and wives in Ephesians 5, he addresses all believers: "Submit to one another out of reverence for Christ." (Ephesians 5:21)

This verse is the foundation and the context for everything that follows. Mutual submission — a Spirit-filled posture of preferring one another, deferring to one another, serving one another — is the Christian baseline before any role distinctions are discussed.

Any reading of Ephesians 5 that begins in verse 22 and skips verse 21 has missed the entire framework.

What is Submission?
The Greek word is hupotasso — literally, to "place oneself under" for a purpose. It is a military term that speaks of voluntary ordering, not compelled subordination.

Crucially: In the New Testament, believers are called to submit to God (James 4:7), to governing authorities (Romans 13:1), to church elders (Hebrews 13:17), and to one another (Ephesians 5:21). Submission is the basic posture of the Christian life.

Mutual submission in marriage means:
- Prioritising your spouse's needs over your own preferences
- Being willing to defer your agenda for their flourishing
- Making decisions with the other's wellbeing at the centre
- Resisting the urge to "win" at your partner's expense

The Opposite of Domination
The call to submission is never a license for one spouse to dominate, control, or demand compliance from the other. Where a husband uses "authority" to coerce, intimidate, or control — he has fundamentally misread the passage and contradicted its foundation in verse 21.

Philippians 2:3-4 — "Do nothing from selfish ambition or conceit, but in humility count others more significant than yourselves. Let each of you look not only to his own interests, but also to the interests of others."

Discussion Questions:
- In what areas do you most naturally serve and defer to your partner? Where is it hardest?
- What would change in your relationship if both of you practiced Philippians 2:3-4 as a daily discipline?
- How does knowing that Christ submitted to the Father (John 5:19) change how you feel about the concept of submission?

Closing Truth:
The marriage that practices mutual submission is a marriage that daily enacts the gospel — two people who lay down their rights to lift up the other.`,
      },
      {
        id: '3b',
        title: 'The Husband as Servant-Leader',
        duration: '25 min',
        content: `THE HUSBAND AS SERVANT-LEADER

The Standard Is Christ, Not Culture
Ephesians 5:25 — "Husbands, love your wives, as Christ loved the church and gave himself up for her."

The standard Paul sets for a husband is not a corner-office CEO, not a household manager, not the loudest voice in the room. The standard is Christ — who washed feet, touched lepers, welcomed children, bore the cross.

If you want to understand what Paul means by a husband's headship, look at what Jesus did with His authority: He used it entirely in service of others.

What Servant Leadership Is Not:
- It is not passive disengagement. Servant leaders are present, attentive, and involved.
- It is not authoritarian control. Demanding compliance is not leadership — it is fear.
- It is not performative niceness. Servant leadership is costly, not convenient.

What Servant Leadership Looks Like:
- Initiating: A servant leader does not wait for his wife to meet his needs — he initiates love, connection, and care.
- Sacrificing: He regularly asks: "What does she need?" and prioritises that over his comfort.
- Protecting: He creates an emotional, spiritual, and physical environment where his wife can flourish and be fully herself.
- Spiritual Leadership: He takes initiative in prayer, worship, and spiritual conversation — not because his wife cannot lead spiritually, but because he takes responsibility for the spiritual culture of the home.

Mark 10:45 — "For even the Son of Man came not to be served but to serve, and to give his life as a ransom for many."

A Word to Future Husbands:
Your authority in marriage is real — but its shape is cruciform. The way you exercise it is by giving yourself away. The measure of your leadership is not how many decisions you make, but how well your wife and family flourish under your care.

Reflection Questions:
- What models of male leadership did you grow up with? How do they align — or conflict — with the servant-leader model?
- What is one area of your relationship where you could take greater servant-leadership initiative this week?
- How does knowing that Jesus calls husbands to His own standard of love both humble and inspire you?

Closing Prayer:
Lord Jesus, I cannot love my wife the way You love the church in my own strength. Fill me with Your Spirit. Teach me to lead by laying down. Make me a husband who serves with joy. Amen.`,
      },
      {
        id: '3c',
        title: "The Wife's Strength and Wisdom",
        duration: '20 min',
        content: `THE WIFE'S STRENGTH AND WISDOM

Reclaiming Proverbs 31
Proverbs 31:10-31 is often misread as a performance checklist for wives. But the Hebrew text describes a woman of chayil — a word that means strength, valor, and even military might. This is not a domestically passive figure; she is a force.

She runs a business, manages a household, makes real-estate investments, cares for the poor, speaks wisdom, and does all of this from a foundation of reverent faith. The Proverbs 31 woman is not an exhausted perfectionist — she is a capable, confident partner.

Proverbs 31:25-26 — "Strength and dignity are her clothing, and she laughs at the time to come. She opens her mouth with wisdom, and the teaching of kindness is on her tongue."

What the Bible Actually Says About Wives:
The Scriptures present wives not as passive recipients of their husband's leadership, but as active co-image-bearers (Genesis 1:27), co-heirs of the grace of life (1 Peter 3:7), and essential partners in the marriage covenant.

Genesis 2:18 — God said it was "not good for man to be alone" and created the woman as an "ezer" — a Hebrew word most often translated "helper" but used elsewhere in Scripture to describe God Himself as the Helper of Israel (Psalm 121:2). This is not diminishment — it is power in service.

The Danger of Diminishment — In Both Directions:
Some church cultures have used the language of submission to silence women, minimize their gifts, or treat them as secondary. This distorts Scripture and dishonors the women God has designed.

But there is also a danger in over-correcting: rejecting the concept of submission entirely, treating any form of marital role distinction as oppressive, and losing the beauty of the complementary partnership Scripture describes.

A Secure Identity:
A wife's worth, identity, and voice are not derived from her husband — they come from God. She comes to marriage as a complete person, made in God's image, gifted for His purposes. Marriage does not complete her; it is a partnership in which two complete people join their lives in covenant.

Discussion Questions:
- How has your upbringing or church background shaped your understanding of a wife's role?
- What gifts and strengths do you bring to your future marriage?
- How can you and your partner create a marriage where both of you are genuinely seen, heard, and empowered?

Closing Truth:
The strongest marriages are not those where a passive wife defers to an assertive husband — they are those where two capable, God-fearing people bring their full selves to the covenant and serve one another from their strengths.`,
      },
      {
        id: '3d',
        title: 'Decision-Making as a Team',
        duration: '25 min',
        content: `DECISION-MAKING AS A TEAM

The Myth of the Tiebreaker Vote
Many couples enter marriage with a vague assumption that if they ever truly disagree, the husband has a "tiebreaker vote." This framing reveals a misunderstanding of both marriage and servant leadership.

Good marriage decision-making is not a voting process with a predetermined outcome — it is a shared discernment process where two people pray, discuss, listen, and seek wisdom together, trusting that the Spirit who dwells in both of them will lead them toward unity.

Amos 3:3 — "Do two walk together, unless they have agreed to meet?"

The Goal: Unity, Not Efficiency
Decision-making in marriage will sometimes be slow. It requires conversation, vulnerability, and sometimes the willingness to wait on a decision until both partners have peace. This is not inefficiency — it is the covenant in action.

Resist the temptation to treat your spouse as an obstacle to getting to the "right" answer. They are a God-given check, a complementary perspective, and often the voice of wisdom you most need to hear.

Proverbs 11:14 — "Where there is no guidance, a people falls, but in an abundance of counselors there is safety."

A Framework for Shared Decision-Making:
1. PRAY TOGETHER — Before major decisions, ask God for wisdom as a couple (James 1:5).
2. BOTH SPEAK — Each person shares their perspective, concerns, and desires fully before any decision is made.
3. LISTEN TO UNDERSTAND — Not just to counter, but to genuinely comprehend why your partner sees it as they do.
4. SEEK WISE COUNSEL — For major decisions (relocation, children, career), consult your pastor, mentor couple, or trusted community.
5. WAIT FOR PEACE — Where significant disagreement remains, wait. Make no major decision under conflict. Revisit with fresh eyes.
6. WHEN TRULY STUCK — If genuine deadlock occurs and a decision must be made, the husband may need to take responsibility — but only after genuinely pursuing unity, not as a first resort.

Financial Decisions:
Money is one of the most contentious decision-making domains. Establish early:
- One shared budget, built together
- Transparency about all income, spending, and debt
- No major purchases without prior agreement (define what "major" means for your household)

Closing Reflection:
The best decisions in your marriage will be ones you both made together, prayed over together, and own together. Build a decision-making culture that values your partner's voice as much as your own.`,
      },
    ],
  },
  {
    id: 'module-4',
    title: 'Finances & Stewardship',
    subtitle: 'Managing Money with Biblical Wisdom',
    description:
      'Money is one of the top sources of marital conflict. Build a biblical framework for managing finances together — budgeting, giving, debt, and trusting God as your ultimate provider.',
    scripture:
      '"Bring the full tithe into the storehouse… and thereby put me to the test, says the LORD of hosts."',
    scriptureRef: 'Malachi 3:10',
    iconKey: 'dollar',
    accentColor: 'var(--warning-700)',
    accentBg: 'var(--warning-50)',
    accentBorder: 'var(--warning-200, #fde68a)',
    duration: '1h 35m',
    isLocked: false,
    lessons: [
      {
        id: '4a',
        title: 'God as Owner; We Are Stewards',
        duration: '20 min',
        content: `GOD AS OWNER; WE ARE STEWARDS

The Foundation of Biblical Finance
Psalm 24:1 — "The earth is the LORD's, and everything in it, the world, and all who live in it."

The entire biblical framework for money begins here: God owns everything. Not 10% — everything. Your income, your savings, your home, your future earnings — all of it belongs to God. You are a manager of His resources, not an owner.

This single conviction, if truly internalized, transforms how you handle money.

From Entitlement to Stewardship:
When you believe you own your money, you ask: "What do I want to do with this?" When you understand you are a steward, you ask: "What does God want me to do with this?"

Stewardship is not about giving more (though it often leads there). It is about holding everything with an open hand — recognizing that what you have is a trust, not a right.

Deuteronomy 8:17-18 — "Beware lest you say in your heart, 'My power and the might of my hand have gotten me this wealth.' You shall remember the LORD your God, for it is he who gives you power to get wealth."

The Parable of the Talents (Matthew 25:14-30):
Jesus commends the servants who took what their master gave them and multiplied it. The condemned servant buried his talent out of fear. The lesson: faithful stewardship is active, not passive. God entrusts us with resources expecting us to use them wisely and generously.

Money and the Heart:
Matthew 6:21 — "For where your treasure is, there your heart will be also."
Your bank statement is a spiritual document. It reveals what you actually value — not what you say you value. Where does your money go? Into comfort, entertainment, status symbols? Or into savings, giving, and kingdom purposes?

Discussion as a Couple:
- What was your family's relationship with money growing up? How has that shaped you?
- Do you tend toward fear-based hoarding or fear-based spending? How does this affect your relationship with money?
- What would it look like to truly treat your finances as stewards — holding them with open hands before God?

Closing Truth:
The couple that holds money loosely — acknowledging God's ownership and their own stewardship — is freed from the anxiety, conflict, and idolatry that money so often produces. Start here.`,
      },
      {
        id: '4b',
        title: 'Building a Budget as a Team',
        duration: '25 min',
        content: `BUILDING A BUDGET AS A TEAM

A Budget Is a Spending Plan, Not a Prison
Many people avoid budgeting because it feels restrictive. The truth is the opposite: a budget gives you permission to spend. It transforms vague anxiety about money into a clear, intentional plan — one you and your spouse build and own together.

Luke 14:28 — "For which of you, desiring to build a tower, does not first sit down and count the cost, whether he has enough to complete it?"

Jesus commends planning. A budget is simply the application of this principle to your household finances.

One Account or Two?
The question of joint vs. separate accounts is one of the most common financial questions among engaged couples. The biblical model — two becoming one flesh — suggests full financial transparency and unity. We recommend one joint account as your household base, with small personal spending allowances for each partner built into the budget.

Separate accounts as the primary structure can create "yours and mine" dynamics that undermine the financial unity that marriage requires.

The Zero-Based Budget Method:
Every dollar of income is assigned a purpose before the month begins. Income minus all assigned categories equals zero. This does not mean you spend everything — "savings" and "emergency fund" are budget categories. Zero-based budgeting eliminates the mystery of where money went.

Basic Budget Categories:
- Giving (10% tithe + additional generosity goals)
- Savings (emergency fund: 3-6 months of expenses)
- Housing (mortgage/rent + utilities: aim for 25-30% of income)
- Food (groceries + dining out)
- Transportation (car payment, fuel, insurance, maintenance)
- Insurance (health, life, disability)
- Personal spending (each spouse gets an amount, no questions asked)
- Debt repayment
- Entertainment / vacation fund
- Miscellaneous

Budget Meeting Monthly:
Before each month begins, sit down together and build next month's budget. This prevents financial surprises, creates shared ownership of your spending plan, and opens the door for honest conversation about money.

Practical Exercise:
Together, list your combined anticipated monthly income. Then list all anticipated monthly expenses. Assign every dollar a category. Where is there surplus? Where is there deficit? What needs to change?

Closing Truth:
A budget is not a constraint — it is a covenant with your future self. Build it together, stick to it together, and adjust it together as life changes.`,
      },
      {
        id: '4c',
        title: 'Debt, Saving & Financial Goals',
        duration: '30 min',
        content: `DEBT, SAVING & FINANCIAL GOALS

The Weight of Debt
Proverbs 22:7 — "The rich rules over the poor, and the borrower is the slave of the lender."

This is not hyperbole. Debt reduces your freedom — financially, vocationally, and even relationally. When a significant portion of your income is committed to servicing past purchases, you have less freedom to give generously, to respond to God's leading, to take vocational risks, or to weather unexpected hardship.

Entering marriage with significant consumer debt (credit cards, car loans, personal loans, student loans) creates immediate financial pressure that requires honest conversation.

Before You Marry — Full Financial Transparency:
Before the wedding, both partners should disclose:
- All debt and monthly obligations
- Credit scores and credit history
- Savings and assets
- Income and income stability
- Financial history and habits (spending tendencies, past financial mistakes)

This is not romantic conversation — it is necessary covenant conversation. Financial secrets in marriage are not private; they are a breach of the "one flesh" unity you are committing to.

The Debt Snowball vs. Debt Avalanche:
Two common strategies for eliminating debt:
- SNOWBALL: Pay minimum on all debts; throw extra money at the smallest balance first. Psychologically motivating — you see wins quickly.
- AVALANCHE: Pay minimum on all debts; throw extra money at the highest interest rate first. Mathematically optimal — you pay less interest overall.

Choose the method you will actually stick to. The best debt-reduction strategy is the one you execute.

Building an Emergency Fund:
Before aggressively paying down debt (except high-interest consumer debt), build a starter emergency fund of $1,000-$2,000. This prevents new debt when unexpected expenses arise. Ultimately, aim for 3-6 months of living expenses in a liquid savings account.

Setting Shared Financial Goals:
- Short-term (0-2 years): Emergency fund, wedding savings, honeymoon, car replacement
- Medium-term (2-5 years): House down payment, debt freedom, education savings
- Long-term (5+ years): Retirement, generosity goals, college funds for children

Write your goals down. Attach dollar amounts and timelines. Review them quarterly.

Closing Scripture:
"Owe no one anything, except to love each other, for the one who loves another has fulfilled the law." — Romans 13:8`,
      },
      {
        id: '4d',
        title: 'Generosity & Tithing Together',
        duration: '20 min',
        content: `GENEROSITY & TITHING TOGETHER

Giving as a Spiritual Practice
2 Corinthians 9:7 — "Each one must give as he has decided in his heart, not reluctantly or under compulsion, for God loves a cheerful giver."

Generosity is not primarily a financial strategy — it is a spiritual posture that says: "I trust God more than I trust my bank account." It is one of the most powerful antidotes to the anxiety, materialism, and idolatry that money can produce.

The tithe — giving 10% of income to the local church — is the biblical starting point for generosity. For many couples, this feels impossible when budgets are tight. But consider: the tithe is not primarily about funding a church budget; it is about disciplining your heart to hold money loosely and honor God with the firstfruits.

Malachi 3:10 — "'Bring the full tithe into the storehouse, that there may be food in my house. And thereby put me to the test,' says the LORD of hosts, 'if I will not open the windows of heaven for you and pour down for you a blessing until there is no more need.'"

A Tithing Culture in Your Marriage:
- Decide together to tithe — make it a joint covenant, not an individual decision
- Give to your local church first (the storehouse)
- Build additional generosity into your budget as God grows your capacity
- Pray regularly about who and what God is calling you to support

The Danger of "When We Have More"
The most dangerous phrase in personal finance is "I'll give more when I have more." The data consistently shows that giving habits are formed when income is low — and expanded or contracted as income grows based on those early habits.

If you cannot give 10% when you earn $50,000, you are unlikely to give 10% when you earn $150,000. Generosity is a discipline built over time, not an automatic overflow of abundance.

Luke 21:1-4 — Jesus observed that the widow gave more than the rich — not in amount, but in proportion and in trust.

Practice Together:
As a couple, decide: What will our giving commitment look like in our first year of marriage? Write it down. Include: the percentage or amount, where it will go, and how it will be tracked.

Closing Prayer:
Lord, You gave Your Son freely. Teach us to give freely. Loosen our grip on money. Make us couples who are known by our generosity — and whose generosity becomes a testimony to Your provision. Amen.`,
      },
    ],
  },
  {
    id: 'module-5',
    title: 'Building Your Future Together',
    subtitle: 'Family, Calling & Community',
    description:
      'Envision and plan your life together — children, extended family, calling, church community, and the legacies you will build. Align your God-given purposes and plant roots that last.',
    scripture:
      '"Unless the LORD builds the house, those who build it labor in vain."',
    scriptureRef: 'Psalm 127:1',
    iconKey: 'home',
    accentColor: 'var(--neutral-700)',
    accentBg: 'var(--neutral-100)',
    accentBorder: 'var(--neutral-200)',
    duration: '1h 40m',
    isLocked: false,
    lessons: [
      {
        id: '5a',
        title: 'Navigating In-Laws & Healthy Boundaries',
        duration: '25 min',
        content: `NAVIGATING IN-LAWS & HEALTHY BOUNDARIES

The Third Relationship
When two people marry, they don't just marry each other — they marry into each other's families. How you navigate your relationships with parents and in-laws will be one of the defining factors of your marital health.

Genesis 2:24 sets the foundation: "A man shall leave his father and his mother and hold fast to his wife." The relational realignment is explicit. This does not mean abandonment or dishonor — it means that the marriage covenant now takes primary relational and decisional priority.

Honour Without Enmeshment:
Exodus 20:12 — "Honour your father and your mother." This command does not expire at marriage. You are still called to love, respect, and care for your parents as they age.

But honour does not require:
- Allowing parents to dictate your household decisions
- Sharing private marital matters with your family of origin
- Organising your life around parental expectations at the expense of your spouse
- Allowing extended family conflict to enter your marriage as a weapon

The United Front:
When one spouse has a difficult relationship with the other's family, the married couple must present a united front. This means:
- You defend your spouse to your own family, not your family to your spouse
- Issues with your in-laws are handled by the spouse who is their child, not the other
- You never triangulate — drawing a third party into your marital conflicts

Setting Healthy Boundaries:
Boundaries are not walls — they are the definition of where one person ends and another begins. Healthy in-law boundaries might include:
- Holidays: agreed-upon schedule, fair to both families
- Visits: duration, frequency, and overnight arrangements discussed in advance
- Advice: parents are welcome to offer opinions; decisions belong to the couple
- Childcare: discussed and agreed together, not assumed

Ephesians 4:15 — "Speaking the truth in love, we are to grow up in every way into him who is the head, into Christ."

Discussion:
- What dynamics in your family of origin will require the most "leaving"?
- What does your partner need you to understand about their family background?
- Where do you anticipate in-law challenges, and how will you handle them together?

Closing Truth:
A marriage that is strong enough to navigate family complexity is one where both spouses know that their partner has their back — completely, publicly, and consistently.`,
      },
      {
        id: '5b',
        title: 'Children & Parenting Philosophy',
        duration: '30 min',
        content: `CHILDREN & PARENTING PHILOSOPHY

The Pre-Marriage Conversation Most Couples Skip
Questions about children are among the most important you will have before marriage — and among the most commonly avoided. Couples often assume they are aligned without ever actually discussing specifics.

Before you marry, discuss:
- Do you both want children? Is this non-negotiable for either of you?
- How many children are you hoping for?
- What is your timeline? How long do you want to wait?
- What if conception is difficult? Are you open to adoption, fostering, medical intervention?
- What are your views on parenting styles, discipline, education, faith formation?

These are not conversations to have after the wedding. Significant misalignment in any of these areas can create deep relational pain.

Psalm 127:3 — "Behold, children are a heritage from the LORD, the fruit of the womb a reward."

A Biblical Vision of Parenting:
Children are a gift, not an achievement. They belong to God — you are their stewards, not their owners. Biblical parenting is:
- Formational: Pointing children toward God through daily life (Deuteronomy 6:6-7)
- Disciplinary: Training with love, consistency, and appropriate consequence (Proverbs 22:6)
- Gracious: Extending the same forgiveness and patience God extends to you (Ephesians 6:4 — "do not provoke your children to anger")
- Relational: Knowing your child deeply — their personality, fears, gifts, and struggles

Parenting Styles:
Research identifies four primary parenting styles:
- AUTHORITARIAN: High demands, low warmth. "Do what I say, because I said so."
- PERMISSIVE: Low demands, high warmth. "Whatever makes you happy."
- NEGLECTFUL: Low demands, low warmth. Disengaged.
- AUTHORITATIVE: High demands, high warmth. Clear expectations + deep relationship. (This most closely aligns with a biblical model.)

How Did Your Parents Parent You?
Your parenting instincts are deeply shaped by how you were raised — for good and for ill. Becoming aware of these patterns allows you to be intentional rather than reactive.

Discussion:
- How were you disciplined growing up? What do you want to carry forward? What do you want to change?
- What is your vision for your children's faith formation?
- How will you handle significant disagreements about parenting in the moment?

Closing Scripture:
"Train up a child in the way he should go; even when he is old he will not depart from it." — Proverbs 22:6`,
      },
      {
        id: '5c',
        title: 'Your Shared Calling & Vocation',
        duration: '25 min',
        content: `YOUR SHARED CALLING & VOCATION

More Than a Career
Vocation comes from the Latin vocare — "to call." Your vocation is not merely what you do to earn money; it is the particular way God has wired you to contribute to His kingdom and the flourishing of the world.

Every believer has a calling. But in marriage, two callings must be held together — sometimes in harmony, sometimes in tension, always in conversation.

Ephesians 2:10 — "For we are his workmanship, created in Christ Jesus for good works, which God prepared beforehand, that we should walk in them."

Questions to Explore Together:
- What are each of your vocational passions and gifts?
- What does each of you feel God has called you to contribute to the world?
- How do your callings complement each other?
- Where might your callings create tension (geography, time demands, income variability)?
- Who will adjust if/when children arrive? How will you make that decision together?

The Dual-Career Marriage:
Many couples today are navigating two significant careers alongside marriage and family. This is not inherently problematic — but it requires intentionality that single-career couples do not face.
- Whose career takes precedence in a relocation decision?
- How will you divide household responsibilities so neither partner carries a disproportionate burden?
- How will you protect your marriage from the identity absorption that high-achieving careers can produce?

Seasons of Life:
Your vocational arrangement will likely need to flex across seasons:
- Early marriage: establishing roots
- Children: intense demand years
- Midlife: vocational peak + parenting demands
- Empty nest: rediscovery and new callings
- Later life: slowing down, legacy-making

Do not lock in a rigid arrangement that cannot flex. Commit instead to ongoing conversation and mutual adjustment.

Romans 12:6-8 — "Having gifts that differ according to the grace given to us, let us use them."

Practice Exercise:
Each person answers: What are my top three gifts? What is my deepest vocational longing? What has God made me for that has nothing to do with income? Share with your partner. Identify overlaps, complementarities, and potential tension points.

Closing Truth:
The strongest couples are not those who subsume their calling to the marriage — they are those who bring their fullest, God-designed selves to the marriage and help one another flourish in their individual and shared callings.`,
      },
      {
        id: '5d',
        title: 'Planting Roots in a Church Home',
        duration: '20 min',
        content: `PLANTING ROOTS IN A CHURCH HOME

The Marriage That Isolates, Withers
Hebrews 10:24-25 — "And let us consider how to stir up one another to love and good works, not neglecting to meet together, as is the habit of some, but encouraging one another, and all the more as you see the Day drawing near."

Christian community is not optional for the believer — it is essential. And for a marriage to thrive, it needs to be embedded in a community of faith that will pray for you, celebrate with you, counsel you, and hold you accountable.

An isolated marriage is a vulnerable marriage.

Choosing a Church Home Together:
Many couples struggle to find a church after marriage because they each bring different preferences, backgrounds, and loyalties from their families of origin. Here is wisdom for the process:
- Pray together before you search
- Visit several churches together with open hearts
- Look for biblical preaching, genuine community, and opportunities to serve — not just a style you prefer
- Do not shop indefinitely; commit when you find a community that is genuinely teaching Scripture and welcoming you into its life
- If you have strong denominational convictions, discuss them honestly before the search

Being Known — Not Just Attending:
Attendance is not community. Real church community requires:
- A small group or home group where you are genuinely known
- Mentors — an older couple who can speak into your marriage
- Accountability — friends who can ask hard questions and tell you the truth
- Service — a place where you are contributing, not just consuming

Proverbs 27:17 — "Iron sharpens iron, and one person sharpens another."

The Mentoring Marriage:
One of the greatest gifts you can give your future marriage is an older, wiser couple who has navigated decades of covenant faithfulness. Find them. Invite them to speak into your life. The wisdom they carry cannot be found in books.

Marriage in Mission:
The healthiest marriages are not focused primarily on their own happiness — they are oriented outward in mission. A couple who serves together, who opens their home, who cares for the poor, who invest in the next generation, finds a depth of shared purpose that self-focused couples never discover.

Closing Prayer:
Lord, build our marriage in the context of Your people. Give us a church home where we are known, loved, and sharpened. Use our marriage in service of Your kingdom — not just for our own joy, but as a light in our community. Amen.

Final Module Reflection:
As you complete this module, take time to pray together over the life you are building. Where is God calling you? What legacy do you want to leave? What does it mean for your marriage to be built by the Lord? (Psalm 127:1)`,
      },
    ],
  },
];

export function getStaticModule(id: string): StaticModule | undefined {
  return STATIC_MODULES.find((m) => m.id === id);
}
