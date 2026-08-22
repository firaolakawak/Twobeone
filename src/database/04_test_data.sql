-- ============================================
-- TwoBeOne Test Data - OPTIONAL
-- Add sample data for testing
-- ============================================
-- Run this AFTER completing steps 1-3
-- This is optional but recommended for testing

-- ============================================
-- SAMPLE QUESTIONS (Know Each Other Feature)
-- ============================================

-- Faith Category
INSERT INTO questions (category, question, description, question_order, is_active)
VALUES 
('Faith', 'What is your favorite Bible verse and why?', 'Share the verse that speaks to your heart', 1, true),
('Faith', 'How do you prefer to spend your quiet time with God?', 'Describe your prayer and devotional routine', 2, true),
('Faith', 'What spiritual gift do you believe God has given you?', 'Reflect on your unique calling', 3, true),
('Faith', 'How has your faith journey shaped who you are today?', 'Share your testimony', 4, true),
('Faith', 'What does it mean to you to be equally yoked in marriage?', 'Discuss spiritual compatibility', 5, true)
ON CONFLICT DO NOTHING;

-- Communication Category
INSERT INTO questions (category, question, description, question_order, is_active)
VALUES 
('Communication', 'How do you prefer to resolve conflicts?', 'Describe your conflict resolution style', 1, true),
('Communication', 'What makes you feel truly heard in a conversation?', 'Share your communication needs', 2, true),
('Communication', 'How do you like to receive feedback?', 'Discuss healthy communication', 3, true),
('Communication', 'What topics are most important for us to discuss regularly?', 'Identify key conversation areas', 4, true),
('Communication', 'How can I better support you when you're stressed?', 'Share support preferences', 5, true)
ON CONFLICT DO NOTHING;

-- Love Category
INSERT INTO questions (category, question, description, question_order, is_active)
VALUES 
('Love', 'What does love mean to you?', 'Define your view of love', 1, true),
('Love', 'How do you most feel loved?', 'Identify your love language', 2, true),
('Love', 'What was the moment you knew you loved me?', 'Share your love story', 3, true),
('Love', 'How do you want to express love in our marriage?', 'Discuss expressions of love', 4, true),
('Love', 'What love story (real or fictional) inspires you?', 'Share relationship inspiration', 5, true)
ON CONFLICT DO NOTHING;

-- Family Category
INSERT INTO questions (category, question, description, question_order, is_active)
VALUES 
('Family', 'What family traditions do you want to continue?', 'Discuss family heritage', 1, true),
('Family', 'How do you envision our relationship with extended family?', 'Set family boundaries', 2, true),
('Family', 'What did you learn about marriage from your parents?', 'Reflect on family influence', 3, true),
('Family', 'How many children would you like to have?', 'Discuss family planning', 4, true),
('Family', 'What values do you want to instill in our children?', 'Share parenting values', 5, true)
ON CONFLICT DO NOTHING;

-- Finance Category
INSERT INTO questions (category, question, description, question_order, is_active)
VALUES 
('Finance', 'How do you approach saving and spending money?', 'Discuss financial habits', 1, true),
('Finance', 'What are your financial goals for the next 5 years?', 'Plan financial future', 2, true),
('Finance', 'How should we handle debt as a couple?', 'Address financial challenges', 3, true),
('Finance', 'What does financial stewardship mean to you?', 'Discuss biblical finance', 4, true),
('Finance', 'How should we make major financial decisions together?', 'Establish decision-making process', 5, true)
ON CONFLICT DO NOTHING;

-- Dreams Category
INSERT INTO questions (category, question, description, question_order, is_active)
VALUES 
('Dreams', 'What are your career aspirations?', 'Share professional goals', 1, true),
('Dreams', 'Where do you see us living in 10 years?', 'Envision future together', 2, true),
('Dreams', 'What is something you've always wanted to do?', 'Share bucket list items', 3, true),
('Dreams', 'How can I support your dreams and goals?', 'Discuss mutual support', 4, true),
('Dreams', 'What legacy do you want to leave?', 'Reflect on life purpose', 5, true)
ON CONFLICT DO NOTHING;

-- Conflict Category
INSERT INTO questions (category, question, description, question_order, is_active)
VALUES 
('Conflict', 'What triggers frustration or anger in you?', 'Identify emotional triggers', 1, true),
('Conflict', 'How do you need space or time during disagreements?', 'Discuss conflict space needs', 2, true),
('Conflict', 'What does forgiveness mean to you?', 'Reflect on reconciliation', 3, true),
('Conflict', 'What conflict resolution rules should we establish?', 'Set healthy boundaries', 4, true),
('Conflict', 'How can we keep Christ at the center during conflicts?', 'Maintain spiritual focus', 5, true)
ON CONFLICT DO NOTHING;

-- Intimacy Category
INSERT INTO questions (category, question, description, question_order, is_active)
VALUES 
('Intimacy', 'What does emotional intimacy mean to you?', 'Define closeness', 1, true),
('Intimacy', 'How do you feel most connected to me?', 'Identify connection points', 2, true),
('Intimacy', 'What boundaries are important to maintain?', 'Discuss healthy limits', 3, true),
('Intimacy', 'How can we grow closer spiritually?', 'Deepen spiritual bond', 4, true),
('Intimacy', 'What does vulnerability look like to you?', 'Share openness preferences', 5, true)
ON CONFLICT DO NOTHING;

-- ============================================
-- SAMPLE DEVOTIONAL
-- ============================================

INSERT INTO devotions (
    title, 
    body, 
    memory_verse,
    verse_text,
    verse_reference,
    published_date
)
VALUES (
    'Building Your Marriage on the Rock',
    E'Today, let\'s reflect on the foundation of our relationship. In Matthew 7:24-25, Jesus teaches us about building our house on the rock versus the sand.\n\nJust as a house needs a strong foundation to withstand storms, your marriage needs to be built on the solid rock of Christ. When challenges come—and they will—a Christ-centered relationship can weather any storm.\n\nThink about this: What does it mean to build your marriage on Christ? It means:\n• Praying together daily\n• Seeking God\'s wisdom in decisions\n• Forgiving as Christ forgave\n• Loving sacrificially as He loved the church\n• Making His Word the final authority\n\nToday\'s Challenge: Discuss with your partner one way you can strengthen the foundation of your marriage this week.',
    'Therefore everyone who hears these words of mine and puts them into practice is like a wise man who built his house on the rock.',
    'Therefore everyone who hears these words of mine and puts them into practice is like a wise man who built his house on the rock. The rain came down, the streams rose, and the winds blew and beat against that house; yet it did not fall, because it had its foundation on the rock.',
    'Matthew 7:24-25',
    CURRENT_DATE
)
ON CONFLICT DO NOTHING;

-- Add a few more devotionals for upcoming days
INSERT INTO devotions (
    title, 
    body, 
    memory_verse,
    verse_text,
    verse_reference,
    published_date
)
VALUES (
    'The Power of Unity in Marriage',
    E'Genesis 2:24 tells us that a man and woman become "one flesh" in marriage. This isn\'t just physical—it\'s emotional, spiritual, and relational unity.\n\nUnity doesn\'t mean losing your identity. It means two individuals choosing to walk together in the same direction, supporting each other\'s growth while growing together.\n\nPractical ways to build unity:\n• Make decisions together\n• Support each other\'s dreams\n• Celebrate each other\'s wins\n• Face challenges as a team\n• Keep your relationship a priority\n\nRemember: The enemy wants to divide, but God wants to unite. Choose unity today.',
    'That is why a man leaves his father and mother and is united to his wife, and they become one flesh.',
    'That is why a man leaves his father and mother and is united to his wife, and they become one flesh.',
    'Genesis 2:24',
    CURRENT_DATE + 1
)
ON CONFLICT DO NOTHING;

INSERT INTO devotions (
    title, 
    body, 
    memory_verse,
    verse_text,
    verse_reference,
    published_date
)
VALUES (
    'Love is Patient, Love is Kind',
    E'First Corinthians 13 is often read at weddings, but how often do we actually live it out in marriage?\n\nLove is patient—with your partner\'s flaws, growth journey, and mistakes.\nLove is kind—in words, actions, and thoughts.\nLove doesn\'t envy—celebrating their successes as your own.\nLove doesn\'t boast—staying humble in the relationship.\n\nToday, pick ONE characteristic from 1 Corinthians 13:4-7 and intentionally practice it with your spouse.\n\nPray together: "Lord, help us to love each other the way You describe love. Make our love patient, kind, and selfless. Amen."',
    'Love is patient, love is kind. It does not envy, it does not boast, it is not proud.',
    'Love is patient, love is kind. It does not envy, it does not boast, it is not proud. It does not dishonor others, it is not self-seeking, it is not easily angered, it keeps no record of wrongs.',
    '1 Corinthians 13:4-5',
    CURRENT_DATE + 2
)
ON CONFLICT DO NOTHING;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '====================================';
    RAISE NOTICE '✅ TEST DATA LOADED';
    RAISE NOTICE '====================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Added:';
    RAISE NOTICE '  • 40 "Know Each Other" questions across 8 categories';
    RAISE NOTICE '  • 3 sample devotionals (today + next 2 days)';
    RAISE NOTICE '';
    RAISE NOTICE 'You can now:';
    RAISE NOTICE '  1. Test the Q&A feature with real questions';
    RAISE NOTICE '  2. View devotionals in the app';
    RAISE NOTICE '  3. Add test users and try answering questions';
    RAISE NOTICE '';
    RAISE NOTICE 'Next: Connect your UI to the database!';
    RAISE NOTICE '';
END $$;
