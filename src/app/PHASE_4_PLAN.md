# 🚀 Phase 4: UI Integration Plan

**Goal:** Connect all 12 screens to the real backend API  
**Status:** Starting Now!  
**Expected Time:** 4-6 hours

---

## 📋 Integration Checklist

### **Priority 1: Authentication & Core (30 min)**
- [ ] 1. Create API service utility
- [ ] 2. Update Signup screen
- [ ] 3. Update Login screen  
- [ ] 4. Update Profile screen
- [ ] 5. Test auth flow end-to-end

### **Priority 2: Main Features (2 hours)**
- [ ] 6. Update Journal screen (list & create)
- [ ] 7. Update Prayer Board (list & create)
- [ ] 8. Update Devotional screen
- [ ] 9. Update Dashboard (real stats)
- [ ] 10. Update Couple Linking

### **Priority 3: New Features (1.5 hours)**
- [ ] 11. Update Mood Tracker
- [ ] 12. Update Q&A screen
- [ ] 13. Update Notifications
- [ ] 14. Update Progress/Stats

### **Priority 4: Polish (1 hour)**
- [ ] 15. Add loading states
- [ ] 16. Add error handling
- [ ] 17. Add success messages
- [ ] 18. Test all flows

---

## 🎯 What We'll Build

### **API Service Layer**
Create `/utils/api.ts` with:
- Authentication helpers
- API call functions
- Error handling
- Token management

### **Screen Updates**
Replace mock data with real API calls in:
1. `/App.tsx` - Main routing & auth
2. `/components/SignupScreen.tsx`
3. `/components/LoginScreen.tsx`
4. `/components/ProfileScreen.tsx`
5. `/components/JournalScreen.tsx`
6. `/components/PrayerBoardScreen.tsx`
7. `/components/DevotionalScreen.tsx`
8. `/components/DashboardScreen.tsx`
9. And more...

---

## 🔧 Technical Approach

### **1. API Service Pattern**
```typescript
// /utils/api.ts
export const api = {
  auth: {
    signup: (data) => fetch(...),
    login: (data) => fetch(...),
  },
  profile: {
    get: () => fetch(...),
    update: (data) => fetch(...),
  },
  journal: {
    list: () => fetch(...),
    create: (data) => fetch(...),
    update: (id, data) => fetch(...),
    delete: (id) => fetch(...),
  },
  // etc...
}
```

### **2. React State Pattern**
```typescript
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  loadData();
}, []);

async function loadData() {
  try {
    setLoading(true);
    const result = await api.profile.get();
    setData(result);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
}
```

### **3. Error Handling Pattern**
```typescript
if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
if (!data) return <EmptyState />;
return <DataView data={data} />;
```

---

## 📊 Integration Strategy

### **Phase 4A: Foundation (30 min)**
1. Create API service utility
2. Create auth helpers
3. Update Supabase client setup
4. Test basic connectivity

### **Phase 4B: Authentication (1 hour)**
1. Update signup flow
2. Update login flow
3. Add session management
4. Test auth persistence

### **Phase 4C: Core Features (2 hours)**
1. Profile CRUD
2. Journal CRUD
3. Prayer CRUD
4. Devotional reading

### **Phase 4D: Dashboard (1 hour)**
1. Real stats from database
2. Recent activity feed
3. Streak display
4. Partner connection status

### **Phase 4E: Polish (1 hour)**
1. Loading states everywhere
2. Error messages
3. Success toasts
4. Optimistic updates

---

## 🎯 Success Criteria

### **Must Have:**
- ✅ Users can sign up & login
- ✅ Profile loads from database
- ✅ Journal entries persist
- ✅ Prayer requests persist
- ✅ Devotionals load from database
- ✅ Couple linking works
- ✅ Data syncs between partners

### **Nice to Have:**
- ✅ Loading skeletons
- ✅ Error boundaries
- ✅ Optimistic updates
- ✅ Offline support indicators

---

## 🔥 Let's Start!

I'll begin with Phase 4A - creating the API service layer and updating authentication.

**Ready to build?** Let's connect your beautiful UI to the powerful backend! 🚀
