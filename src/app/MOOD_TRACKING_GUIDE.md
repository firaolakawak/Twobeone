# 💝 TwoBeOne Mood Tracking System - Complete Guide

## Overview

TwoBeOne now features a comprehensive **AI-Powered Mood Tracking System** that helps couples understand their emotional patterns and strengthen their relationship through insights and weekly reports.

---

## ✨ Features Implemented

### 1. **Daily Mood Tracking**
- Track your emotional state every day with 4 mood levels:
  - 😊 **Great** - Feeling wonderful and blessed
  - 😊 **Good** - Positive and content
  - 😐 **Okay** - Neutral or just getting by
  - 😔 **Sad** - Feeling down or struggling
- Add optional notes to express what's on your heart
- See your partner's mood in real-time on the dashboard
- Quick mood selection from the couple dashboard

### 2. **Mood Analytics Dashboard**
Accessible via **"View Analytics"** button on the dashboard mood card:

#### **Visual Charts & Trends**
- **7-Day Mood Trend Chart**: Line graph showing both partners' emotional patterns
- **Mood Distribution**: See how often you and your partner felt each emotion
- **Weekly Averages**: Track average mood scores (0-4 scale)
- **Progress Indicators**: Visual progress bars showing emotional wellness

#### **Recent History**
- View last 10 mood entries with timestamps
- See both your moods and your partner's
- Read emotional notes you both shared

### 3. **AI-Powered Analysis** 🧠
Click **"Generate AI Analysis"** to receive:
- Compassionate, faith-based insights about your emotional patterns
- Observations about how your moods correlate with your partner's
- Relevant Bible verses and spiritual encouragement
- Prayer points specific to your emotional journey
- Actionable suggestions for spiritual and emotional growth

**Powered by OpenAI GPT-4o-mini** for thoughtful, Christ-centered guidance.

### 4. **Weekly Mood Reports** 📊
- **Automatic Generation**: Reports auto-generate every 7 days
- **Sent to Both Partners**: Both receive notifications with the report
- **Manual Generation**: Click "Weekly Report" button anytime
- **Includes**:
  - 7-day mood summary for both partners
  - Average emotional wellness scores
  - AI-generated encouragement and insights
  - Bible-based guidance for the week ahead
  - Specific observations about your journey together

---

## 🚀 How to Use

### **Step 1: Set Up OpenAI API Key**
A popup has appeared asking for your OpenAI API key. Here's how to get one:

1. Go to [platform.openai.com](https://platform.openai.com/api-keys)
2. Sign up or log in to your OpenAI account
3. Click **"Create new secret key"**
4. Copy the key (starts with `sk-...`)
5. Paste it into the popup that appeared
6. The key is stored securely in your Supabase environment

**Note**: Without this key, mood tracking will still work, but AI analysis and weekly reports will show placeholder text.

### **Step 2: Track Your Daily Mood**
1. Open the TwoBeOne app and log in
2. On the **Couple Dashboard**, find the "Today's Mood" card
3. Tap one of the 4 emoji buttons to record your mood
4. (Optional) Navigate to Mood Analytics to add a note
5. See your partner's mood update in real-time!

### **Step 3: View Analytics**
1. On the dashboard, click **"View Analytics"** in the mood card
2. Explore your 7-day trends and patterns
3. Check mood distributions for both you and your partner
4. Review recent mood history

### **Step 4: Generate AI Insights**
1. In the Mood Analytics screen, scroll to **"AI Mood Analysis"**
2. Click **"Generate AI Analysis"**
3. Wait 5-10 seconds while OpenAI analyzes your patterns
4. Read the compassionate, faith-based insights
5. Save the analysis for future reference

### **Step 5: Weekly Reports (Automatic)**
- Every 7 days, the system automatically checks if a report should be generated
- If you and your partner have tracked moods during the week, a report is created
- **Both partners receive a notification** with:
  - Title: "💝 Weekly Mood Report"
  - Your combined mood averages
  - Period covered
  - AI-generated insights
- Click the notification to open the Mood Analytics screen
- Manual trigger: Click **"Weekly Report"** button anytime

---

## 📊 Backend API Endpoints

### New Mood Endpoints Added:

1. **POST** `/moods/analyze`
   - Generates AI analysis of last 7 days of mood data
   - Requires partner to be linked
   - Returns detailed analysis with statistics

2. **GET** `/moods/analysis`
   - Retrieves history of all mood analyses
   - Shows past insights and reports

3. **POST** `/moods/weekly-report`
   - Generates weekly mood report
   - Sends notifications to both partners
   - Includes AI summary and statistics

### Updated Frontend API Methods:
```typescript
moods.analyze() // Generate AI analysis
moods.getAnalysis() // Get analysis history
moods.generateWeeklyReport() // Manually trigger weekly report
```

---

## 🎨 UI/UX Highlights

### **Gradient Design**
- Beautiful purple-to-pink gradients for mood features
- Faith-centered iconography (Hearts, Smiles, Brain)
- Clean 8dp spacing system maintained throughout

### **Responsive Charts**
- Uses **Recharts** library for beautiful visualizations
- Line charts for trends over time
- Clear legends and tooltips
- Mobile-optimized touch interactions

### **Real-time Updates**
- Mood data refreshes every 10 seconds
- See partner's mood changes instantly
- Notification badge updates automatically

### **Accessibility**
- Clear mood labels and descriptions
- High-contrast colors for readability
- Screen reader friendly icons
- Touch-friendly button sizes (minimum 44x44px)

---

## 🔔 Notification System

### **Mood Report Notifications**
- Type: `mood_report`
- Title: "💝 Weekly Mood Report"
- Includes: Period dates, averages, AI insights
- Click to open: Mood Analytics screen
- Auto-marking as read on click

### **Toast Notifications**
- Mood saved: "Mood saved! 💝"
- Analysis generated: "Analysis generated! 🧠"
- Weekly report: "Weekly report sent to both of you! Check notifications 💝"

---

## 🧪 Testing the Features

### **Test Daily Mood Tracking**
1. Log in as User A
2. Set your mood to "Great" 😊
3. Log in as User B (partner)
4. Verify you see User A's mood on your dashboard
5. Set your own mood to "Good"
6. Both moods should now be visible

### **Test AI Analysis**
1. Track at least 2-3 moods over a few days
2. Navigate to Mood Analytics
3. Click "Generate AI Analysis"
4. Verify the AI generates relevant, faith-based insights
5. Check that Bible verses and prayer points are included

### **Test Weekly Report**
1. Have both partners track moods for at least 2-3 days
2. Click "Weekly Report" button in Mood Analytics
3. Check notifications on both accounts
4. Verify both partners received the notification
5. Click notification to view full report
6. Confirm AI analysis is included

### **Test Auto-Weekly Reports**
1. Log in after 7+ days since last report
2. System should auto-generate report if moods exist
3. Both partners should receive notifications
4. Verify `localStorage` timestamp is updated

---

## 💡 Best Practices

### **For Daily Use**
- Track your mood at the same time each day (morning or evening)
- Add notes when you're feeling strong emotions
- Check your partner's mood to show support
- Use moods as conversation starters

### **For Analysis**
- Generate AI analysis once per week
- Discuss insights with your partner during devotional time
- Use Bible verses as prayer prompts
- Track improvement over time

### **For Weekly Reports**
- Review reports together as a couple
- Discuss patterns and correlations
- Pray about areas of struggle
- Celebrate positive trends

---

## 🔧 Technical Details

### **Data Storage**
- Key-value store pattern: `mood:{userId}:{moodId}`
- Analysis storage: `mood-analysis:{userId}:{analysisId}`
- Notifications: `notification:{userId}:{notificationId}`

### **Auto-Report Timing**
- Checked on dashboard load
- Checked once per 24 hours
- Uses `localStorage` to track last report date
- Prevents duplicate reports within 7-day window

### **AI Model**
- Model: `gpt-4o-mini` (fast, cost-effective)
- Max tokens: 300-500 depending on endpoint
- Temperature: 0.7 (balanced creativity)
- System prompt: Christian counselor persona

### **Performance**
- Mood data: Polls every 10 seconds
- Charts: Responsive Container for all screen sizes
- Analysis: 5-10 second generation time
- Weekly reports: Background task, non-blocking

---

## 📈 Statistics Calculated

### **Mood Values**
- Great = 4 points
- Good = 3 points
- Okay = 2 points
- Sad = 1 point

### **Averages**
- User average: Sum of user moods / count
- Partner average: Sum of partner moods / count
- Combined displayed in reports

### **Distributions**
- Count of each mood type per person
- Visualized in bar format
- Last 7 days only

---

## 🎯 Future Enhancements (Optional)

1. **Mood Streaks**: Track consecutive days of positive moods
2. **Mood Journaling**: Expand notes into full journal entries
3. **Mood Reminders**: Daily push notifications to log mood
4. **Emotion Categories**: Add more granular emotions (anxious, joyful, grateful)
5. **Couple Correlations**: AI insights on how partner moods affect each other
6. **Monthly Reports**: Extended analysis beyond weekly

---

## 🆘 Troubleshooting

### **"AI analysis not available" error**
- Verify OPENAI_API_KEY is set in Supabase secrets
- Check OpenAI account has credits
- Ensure API key starts with `sk-`

### **"Not enough mood data" error**
- Track moods for at least 2-3 days
- Ensure both partners have tracked at least once
- Wait until 7-day window has some data

### **Weekly report not generating**
- Check that both partners are linked
- Verify at least one mood exists in last 7 days
- Try manual trigger via "Weekly Report" button
- Check browser console for errors

### **Partner's mood not showing**
- Ensure both users are properly linked via invite code
- Check that partner has tracked a mood today
- Wait 10 seconds for polling to update
- Refresh the page

---

## 🙏 Faith-Centered Design

Every aspect of the mood tracking system is designed with Christian values:

- **Compassionate AI**: Responses are warm, encouraging, and Christ-centered
- **Bible Integration**: Relevant verses for every emotional state
- **Prayer Focus**: Specific prayer points generated for couples
- **Grace & Support**: Non-judgmental tone, emphasizing God's love
- **Relationship Building**: Tools to strengthen communication and intimacy

---

## 📝 Summary

You now have a complete **AI-Powered Mood Tracking System** with:

✅ **4 mood levels** with emoji selection  
✅ **Real-time partner mood sharing**  
✅ **Visual analytics** with charts and trends  
✅ **AI-powered insights** using GPT-4o-mini  
✅ **Automatic weekly reports** sent to both partners  
✅ **Notification system** for mood updates  
✅ **Faith-based guidance** and Bible verses  
✅ **Mobile-responsive design** following TwoBeOne design system  

The system is fully integrated with your existing TwoBeOne app and ready to help couples grow emotionally and spiritually together! 💝

---

**Next Steps:**
1. Add your OpenAI API key via the popup
2. Start tracking your moods daily
3. Generate your first AI analysis after 3-4 days
4. Receive your first weekly report after 7 days
5. Use insights for deeper couple conversations

**God bless your relationship journey! 🙏💕**
