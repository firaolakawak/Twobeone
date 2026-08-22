# 🧪 Profile Picture Upload - Testing Guide

## Quick Test Checklist

### ✅ Basic Upload Test
- [ ] Navigate to Settings/Profile
- [ ] Click camera icon on avatar
- [ ] Select a valid image (JPG/PNG < 5MB)
- [ ] Success toast appears
- [ ] Avatar updates immediately
- [ ] Refresh page - picture persists

### ✅ Basic Delete Test
- [ ] Click trash icon on avatar
- [ ] Confirm deletion
- [ ] Success toast appears
- [ ] Avatar shows initials
- [ ] Picture removed from storage

### ✅ Validation Tests
- [ ] Upload > 5MB image → Error: "Image must be smaller than 5MB"
- [ ] Upload non-image file → Error: "Please select an image file"
- [ ] Upload without authentication → 401 Unauthorized

### ✅ Edge Cases
- [ ] Upload second time (replaces first)
- [ ] Delete when no picture exists → Error
- [ ] Upload, then logout, then login → Picture still there
- [ ] Partner can see your profile picture

## Detailed Test Scenarios

### Test 1: First Time Upload

**Steps**:
1. Sign in to TwoBeOne
2. Go to Settings → Profile tab
3. Observe avatar showing initials (no picture)
4. Click the small camera button on bottom-right of avatar
5. File picker opens
6. Select a JPEG image (e.g., 500KB)
7. Watch for upload

**Expected Results**:
- ✅ Loading spinner shows during upload
- ✅ Toast: "Profile picture updated!"
- ✅ Avatar immediately shows uploaded image
- ✅ Camera button still visible (for changing picture)
- ✅ Trash button appears (for deletion)

**Backend Logs** (Check Console):
```
[POST /profile/upload-picture] Uploading profile picture for user: {userId}
[POST /profile/upload-picture] Creating bucket: make-6d579fee-profile-pictures
[POST /profile/upload-picture] Uploading to path: {userId}/profile-{timestamp}.jpg
[POST /profile/upload-picture] Upload successful
[POST /profile/upload-picture] Generated signed URL
[POST /profile/upload-picture] ✅ Profile picture updated successfully
```

### Test 2: Replace Existing Picture

**Steps**:
1. Upload first picture (as in Test 1)
2. Click camera button again
3. Select a different image
4. Upload

**Expected Results**:
- ✅ Old picture deleted from storage
- ✅ New picture uploaded
- ✅ Avatar updates to new image
- ✅ Only one file exists in storage (not two)

**Backend Logs**:
```
[POST /profile/upload-picture] Deleting old picture: profile-{oldTimestamp}.jpg
[POST /profile/upload-picture] Uploading to path: {userId}/profile-{newTimestamp}.jpg
[POST /profile/upload-picture] ✅ Profile picture updated successfully
```

### Test 3: Delete Picture

**Steps**:
1. Ensure you have a profile picture
2. Click the trash button (red, bottom-left of avatar)
3. Confirm deletion

**Expected Results**:
- ✅ Toast: "Profile picture deleted!"
- ✅ Avatar reverts to showing initials
- ✅ Trash button disappears
- ✅ Camera button still visible
- ✅ File removed from Supabase Storage

**Backend Logs**:
```
[DELETE /profile/delete-picture] Deleting profile picture for user: {userId}
[DELETE /profile/delete-picture] Deleting file: {userId}/profile-{timestamp}.jpg
[DELETE /profile/delete-picture] ✅ Profile picture deleted successfully
```

### Test 4: File Size Validation

**Steps**:
1. Create or find an image > 5MB
2. Try to upload it
3. Observe error

**Expected Results**:
- ✅ Error toast: "Image must be smaller than 5MB"
- ✅ No upload occurs
- ✅ No network request made
- ✅ Avatar unchanged

### Test 5: File Type Validation

**Steps**:
1. Try to upload a PDF, TXT, or other non-image file
2. Observe error

**Expected Results**:
- ✅ Error toast: "Please select an image file"
- ✅ No upload occurs
- ✅ Avatar unchanged

### Test 6: Different Image Formats

**Test each format**:
- [ ] JPEG/JPG → Should work
- [ ] PNG → Should work
- [ ] GIF → Should work
- [ ] WEBP → Should work
- [ ] SVG → Should work (as it's technically an image)
- [ ] BMP → Should work

### Test 7: Authentication Test

**Steps**:
1. Sign out of TwoBeOne
2. Manually send a POST request to upload endpoint (using cURL or Postman)
3. Don't include Authorization header

**Expected Results**:
- ✅ Response: 401 Unauthorized
- ✅ Error: "Unauthorized"
- ✅ No upload occurs

### Test 8: Partner View

**Steps**:
1. User A uploads profile picture
2. User B (partner of User A) views User A's profile

**Expected Results**:
- ✅ User B can see User A's profile picture
- ✅ Picture loads correctly
- ✅ Picture persists on refresh

**Locations to Check**:
- Dashboard (partner avatar)
- Journal entries (partner's entries)
- Settings (partner info section)
- Questions (partner's responses)

### Test 9: Storage Persistence

**Steps**:
1. Upload profile picture
2. Note the URL in network tab or console
3. Sign out
4. Sign in again
5. Check if same picture loads

**Expected Results**:
- ✅ Same image URL (signed URL is long-lived)
- ✅ Picture loads successfully
- ✅ No re-upload needed

### Test 10: Concurrent Upload

**Steps**:
1. Start uploading a large image (~4MB)
2. While uploading, try to upload another image
3. Observe behavior

**Expected Results**:
- ✅ First upload may complete or be cancelled
- ✅ Second upload processes
- ✅ No corrupted state
- ✅ Only one picture in storage

## Browser Testing

Test across different browsers:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

## Mobile Testing

### iOS Safari
- [ ] Camera icon tappable
- [ ] File picker opens
- [ ] Can select from Photos
- [ ] Can take new photo
- [ ] Upload works
- [ ] Image displays correctly

### Android Chrome
- [ ] Camera icon tappable
- [ ] File picker opens
- [ ] Can select from Gallery
- [ ] Can take new photo
- [ ] Upload works
- [ ] Image displays correctly

## Performance Testing

### Small Image (< 100KB)
- Expected upload time: < 2 seconds
- Expected UI update: Immediate

### Medium Image (500KB - 1MB)
- Expected upload time: 2-5 seconds
- Expected UI update: Immediate

### Large Image (4-5MB)
- Expected upload time: 5-10 seconds
- Expected UI update: Immediate

## Network Testing

### Slow Connection (3G)
- [ ] Upload still works (takes longer)
- [ ] Loading indicator shows
- [ ] User can wait for completion
- [ ] Success/error feedback clear

### No Connection
- [ ] Error message appears
- [ ] User informed about connection issue
- [ ] Can retry when back online

### Connection Lost During Upload
- [ ] Upload fails gracefully
- [ ] Error toast appears
- [ ] User can retry

## Security Testing

### URL Tampering
1. Get your signed URL
2. Try to access another user's file by changing userId in path
3. Expected: Access denied (private bucket)

### Direct Storage Access
1. Try to access storage without signed URL
2. Expected: Access denied

### Expired URL
1. Wait for signed URL to expire (10 years - not practical)
2. Expected: Re-generation of signed URL on next profile load

## Debugging

### Check Browser Console
Look for these logs:
```javascript
// Frontend
"Failed to upload profile picture: {error}"
"Failed to delete profile picture: {error}"

// Network Tab
POST /make-server-6d579fee/profile/upload-picture
DELETE /make-server-6d579fee/profile/delete-picture
```

### Check Backend Logs
Look for these patterns:
```
[POST /profile/upload-picture] Uploading profile picture for user: ...
[POST /profile/upload-picture] Creating bucket: ...
[POST /profile/upload-picture] Uploading to path: ...
[POST /profile/upload-picture] ✅ Profile picture updated successfully

[DELETE /profile/delete-picture] Deleting profile picture for user: ...
[DELETE /profile/delete-picture] ✅ Profile picture deleted successfully
```

### Common Issues

**Issue**: Upload succeeds but avatar doesn't update
- **Solution**: Check if `onRefresh()` is called
- **Solution**: Check if profile state updates in App.tsx

**Issue**: "Failed to generate URL"
- **Solution**: Check Supabase Storage permissions
- **Solution**: Verify service role key is set

**Issue**: "Failed to upload picture"
- **Solution**: Check if bucket creation failed
- **Solution**: Verify Supabase Storage is enabled in project

**Issue**: 401 Unauthorized
- **Solution**: Check if user is signed in
- **Solution**: Verify access token is valid

**Issue**: Image doesn't load (broken image icon)
- **Solution**: Check if signed URL is valid
- **Solution**: Verify file exists in storage
- **Solution**: Check network connectivity

## Manual cURL Testing

### Upload Picture
```bash
# 1. Get access token from browser console
# 2. Convert image to base64
base64 -i profile.jpg -o profile.txt

# 3. Send request
curl -X POST \
  https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-6d579fee/profile/upload-picture \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "imageData": "data:image/jpeg;base64,YOUR_BASE64_DATA",
    "fileName": "profile.jpg"
  }'
```

### Delete Picture
```bash
curl -X DELETE \
  https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-6d579fee/profile/delete-picture \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Success Criteria

✅ **All tests pass**
✅ **No console errors**
✅ **No backend errors**
✅ **Images load consistently**
✅ **UI updates immediately**
✅ **Storage bucket managed correctly**
✅ **No orphaned files in storage**

## Reporting Issues

If you find issues, report with:
1. Browser/device used
2. Steps to reproduce
3. Expected vs actual behavior
4. Console errors (if any)
5. Backend logs (if available)
6. Network tab screenshot

---

**Last Updated**: Current implementation
**Status**: Ready for testing
