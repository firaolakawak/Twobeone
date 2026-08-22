/**
 * TwoBeOne Admin Initialization
 * Utility to initialize the admin system with default admins
 */

import * as kv from './kv_store.tsx';

export async function initializeAdminSystem() {
  try {
    console.log('[Admin Init] Checking admin system initialization...');
    
    // Check if admin list already exists
    const existingAdmins = await kv.get('system:admins');
    
    if (existingAdmins && Array.isArray(existingAdmins) && existingAdmins.length > 0) {
      console.log('[Admin Init] Admin system already initialized with', existingAdmins.length, 'admins');
      return existingAdmins;
    }
    
    console.log('[Admin Init] Initializing admin system for the first time...');
    
    // Get all users to find default admin emails
    const allUsers = await kv.getByPrefix('user:');
    
    // Default admin emails (from original requirements)
    const defaultAdminEmails = [
      'admin@twobeone.com',
      'naf@gmail.com',
      'abdigetu1710@gmail.com',
      'mahtebng@gmail.com'
    ];
    
    // Find user IDs for default admin emails
    const adminUserIds: string[] = [];
    
    for (const user of allUsers) {
      if (user.email && defaultAdminEmails.includes(user.email.toLowerCase())) {
        adminUserIds.push(user.id);
        
        // Mark user profile with admin added timestamp
        user.adminAddedAt = new Date().toISOString();
        user.adminAddedBy = 'system'; // System initialization
        await kv.set(`user:${user.id}`, user);
        
        console.log('[Admin Init] Added default admin:', user.email);
      }
    }
    
    // Save admin list
    if (adminUserIds.length > 0) {
      await kv.set('system:admins', adminUserIds);
      console.log('[Admin Init] Admin system initialized with', adminUserIds.length, 'default admins');
    } else {
      console.log('[Admin Init] No default admin users found. Admin list will be empty until users sign up.');
      await kv.set('system:admins', []);
    }
    
    return adminUserIds;
  } catch (error) {
    console.error('[Admin Init] Error initializing admin system:', error);
    return [];
  }
}

// Function to add a user to admin list (can be called manually if needed)
export async function addAdminByEmail(email: string) {
  try {
    const allUsers = await kv.getByPrefix('user:');
    const user = allUsers.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      console.error('[Admin Init] User not found:', email);
      return false;
    }
    
    const adminList = await kv.get('system:admins') || [];
    
    if (adminList.includes(user.id)) {
      console.log('[Admin Init] User is already an admin:', email);
      return true;
    }
    
    adminList.push(user.id);
    await kv.set('system:admins', adminList);
    
    // Update user profile
    user.adminAddedAt = new Date().toISOString();
    user.adminAddedBy = 'system';
    await kv.set(`user:${user.id}`, user);
    
    console.log('[Admin Init] Admin privilege granted to:', email);
    return true;
  } catch (error) {
    console.error('[Admin Init] Error adding admin:', error);
    return false;
  }
}
