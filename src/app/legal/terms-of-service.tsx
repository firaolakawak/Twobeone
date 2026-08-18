import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ScrollArea } from '../components/ui/scroll-area';
import { FileText, AlertTriangle, Heart, Shield, Users, Ban } from 'lucide-react';
import type { Language } from '../utils/i18n';

interface TermsOfServiceProps {
  language?: Language;
}

export function TermsOfService({ language = 'en' }: TermsOfServiceProps) {
  if (language === 'am') {
    return <TermsOfServiceAmharic />;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <FileText className="w-16 h-16 text-primary-600" />
          </div>
          <h1 className="text-primary-900">Terms of Service</h1>
          <p className="text-muted-foreground">Last Updated: November 22, 2024</p>
        </div>

        <Card className="bg-warning-50 border-warning-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning-500" />
              Important Notice
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              Please read these Terms of Service ("Terms") carefully before using the TwoBeOne mobile application 
              (the "Service"). By accessing or using the Service, you agree to be bound by these Terms. If you 
              disagree with any part of these Terms, you may not access the Service.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary-600" />
              1. Acceptance of Terms
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              By creating an account, connecting with a partner, or using any feature of TwoBeOne, you affirm that:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground">
              <li>You are at least 18 years of age</li>
              <li>You have the legal capacity to enter into a binding agreement</li>
              <li>You will use the Service in compliance with these Terms and all applicable laws</li>
              <li>All information you provide is accurate, current, and complete</li>
              <li>You understand that TwoBeOne is designed for couples in committed relationships</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Description of Service</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              TwoBeOne is a Christian couple-centered mobile application that provides:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground">
              <li><strong>Daily Devotionals:</strong> Bible-based content with Scripture readings and reflection prompts</li>
              <li><strong>Shared Journaling:</strong> Private and shared journal entries between connected partners</li>
              <li><strong>Prayer Tracking:</strong> Personal and shared prayer request management</li>
              <li><strong>"Know Each Other" Questions:</strong> Guided questions across multiple relationship categories</li>
              <li><strong>Gratitude Journal:</strong> Daily gratitude entries and shared appreciations</li>
              <li><strong>Progress Tracking:</strong> Milestones and achievements for couples' spiritual journey</li>
              <li><strong>Distance Connector:</strong> Optional location sharing to display physical distance between partners</li>
              <li><strong>Push Notifications:</strong> Daily reminders and partner activity updates</li>
            </ul>
            <p className="text-sm text-muted-foreground">
              We reserve the right to modify, suspend, or discontinue any aspect of the Service at any time with 
              or without notice.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-600" />
              3. Account Registration & Partner Connection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">3.1 Account Creation</h3>
              <ul className="list-disc list-inside space-y-2 text-foreground">
                <li>You must provide accurate and complete information during registration</li>
                <li>You are responsible for maintaining the confidentiality of your password</li>
                <li>You are responsible for all activities that occur under your account</li>
                <li>You must notify us immediately of any unauthorized use of your account</li>
                <li>One person may only maintain one active account</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">3.2 Partner Connection</h3>
              <ul className="list-disc list-inside space-y-2 text-foreground">
                <li>You may connect with one partner at a time using a unique invite code</li>
                <li>By connecting, you authorize your partner to access shared content as described in our Privacy Policy</li>
                <li>You understand that your partner will see most of your content unless marked "private"</li>
                <li>Connection is intended for couples in committed, trusting relationships</li>
                <li>Misuse of invite codes or connection features may result in account suspension</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">3.3 Disconnection Policy</h3>
              <div className="bg-primary-50 border-l-4 border-primary-600 p-4 rounded">
                <p className="font-semibold mb-2">Critical: Two-Partner Consent Required</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li><strong>Mutual Agreement:</strong> Both partners must agree to disconnect</li>
                  <li><strong>Grace Period:</strong> One-month grace period after the first partner requests disconnection</li>
                  <li><strong>Notifications:</strong> Both partners receive email notifications about disconnection requests</li>
                  <li><strong>During Grace Period:</strong> Both partners retain full access to shared data</li>
                  <li><strong>After Disconnection:</strong> Shared data access is revoked; each user retains their own content</li>
                  <li><strong>Account Deletion:</strong> Cannot delete account while connected; must disconnect first</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ban className="w-5 h-5 text-error-500" />
              4. Acceptable Use Policy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>You agree NOT to use the Service to:</p>
            <ul className="list-disc list-inside space-y-2 text-foreground">
              <li>Violate any local, state, national, or international law</li>
              <li>Harass, abuse, threaten, or intimidate another user</li>
              <li>Post or transmit harmful, offensive, or inappropriate content</li>
              <li>Impersonate any person or entity</li>
              <li>Upload viruses, malware, or any malicious code</li>
              <li>Attempt to gain unauthorized access to the Service or other users' accounts</li>
              <li>Use the Service for any commercial purpose without authorization</li>
              <li>Scrape, crawl, or harvest data from the Service</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Create multiple accounts or use the Service for fraudulent purposes</li>
              <li>Share another user's personal information without consent</li>
              <li>Use the Service in any way that could damage TwoBeOne's reputation</li>
            </ul>

            <p className="text-sm text-error-500 font-semibold">
              Violation of this Acceptable Use Policy may result in immediate account suspension or termination 
              without refund.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>5. User Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">5.1 Your Responsibility</h3>
              <p>
                You are solely responsible for all content you create, post, or share through the Service 
                ("User Content"), including:
              </p>
              <ul className="list-disc list-inside space-y-1 text-foreground">
                <li>Journal entries and devotional responses</li>
                <li>Prayer requests and updates</li>
                <li>Question answers and chat messages</li>
                <li>Gratitude entries and milestone descriptions</li>
                <li>Profile information and photos</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">5.2 License to TwoBeOne</h3>
              <p>
                By posting User Content, you grant TwoBeOne a non-exclusive, worldwide, royalty-free license to 
                use, store, display, and transmit your User Content solely for the purpose of:
              </p>
              <ul className="list-disc list-inside space-y-1 text-foreground">
                <li>Providing and improving the Service</li>
                <li>Sharing your content with your connected partner (as authorized by you)</li>
                <li>Creating anonymized analytics to improve user experience</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-2">
                We will NEVER use your User Content for marketing, advertising, or any purpose beyond 
                providing the Service without your explicit permission.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">5.3 Content Standards</h3>
              <p>All User Content must:</p>
              <ul className="list-disc list-inside space-y-1 text-foreground">
                <li>Be respectful and appropriate</li>
                <li>Not contain hate speech, threats, or harassment</li>
                <li>Not violate intellectual property rights</li>
                <li>Not contain sexually explicit material</li>
                <li>Align with the Christian values that TwoBeOne promotes</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">5.4 Content Monitoring</h3>
              <p className="text-sm text-foreground">
                While we do not routinely monitor User Content, we reserve the right to review and remove 
                content that violates these Terms. We may also suspend or terminate accounts that repeatedly 
                violate our content standards.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>6. Intellectual Property Rights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">6.1 TwoBeOne's Property</h3>
              <p>
                The Service, including its design, features, graphics, text, and software, is owned by TwoBeOne 
                and is protected by copyright, trademark, and other intellectual property laws. You may not:
              </p>
              <ul className="list-disc list-inside space-y-1 text-foreground">
                <li>Copy, modify, or create derivative works of the Service</li>
                <li>Reverse engineer or decompile any aspect of the Service</li>
                <li>Remove or alter any proprietary notices</li>
                <li>Use TwoBeOne's name, logo, or branding without permission</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">6.2 Third-Party Content</h3>
              <p className="text-sm text-foreground">
                The Service includes Bible verses and Scripture content from third-party sources. These materials 
                are used with proper attribution and in compliance with applicable licenses. You may not extract 
                or republish this content outside the Service without authorization.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>7. Privacy & Data Protection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Your privacy is important to us. Our collection and use of personal information is described in our 
              <strong> Privacy Policy</strong>, which is incorporated into these Terms by reference.
            </p>
            <p>
              By using the Service, you consent to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground">
              <li>The collection and use of your information as described in the Privacy Policy</li>
              <li>Sharing your content with your connected partner</li>
              <li>Receiving email notifications about account activity and service updates</li>
              <li>Optional push notifications (you can disable these in settings)</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>8. Location Services (Optional)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              The Distance Connector feature allows you to optionally share your location with your partner:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground">
              <li>Location sharing is entirely optional and opt-in</li>
              <li>You can enable/disable location sharing at any time</li>
              <li>Location data is only shared with your connected partner</li>
              <li>You can choose between live GPS location or manually entered city</li>
              <li>We do not sell or share location data with third parties</li>
            </ul>
            <p className="text-sm text-muted-foreground">
              By enabling location services, you grant TwoBeOne permission to access your device's location. 
              You may revoke this permission at any time through your device settings or the app.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>9. Payment Terms (If Applicable)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">9.1 Premium Features</h3>
              <p className="text-sm text-foreground">
                TwoBeOne may offer premium features through paid subscriptions. If you purchase a subscription:
              </p>
              <ul className="list-disc list-inside space-y-1 text-foreground">
                <li>Prices are stated in USD or local currency and subject to applicable taxes</li>
                <li>Subscriptions automatically renew unless canceled before the renewal date</li>
                <li>You can cancel anytime through your account settings or app store</li>
                <li>Refunds are subject to our refund policy and app store policies</li>
                <li>We may change subscription prices with 30 days' notice</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">9.2 Refund Policy</h3>
              <p className="text-sm text-foreground">
                Refunds for premium subscriptions are handled according to the app store's refund policy 
                (Apple App Store, Google Play Store). Contact the app store directly for refund requests. 
                We may offer discretionary refunds on a case-by-case basis.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary-600" />
              10. Disclaimers & Limitations of Liability
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">10.1 Service "As Is"</h3>
              <p className="text-sm text-foreground">
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR 
                IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR 
                PURPOSE, AND NON-INFRINGEMENT.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">10.2 Not Professional Advice</h3>
              <div className="bg-warning-50 border-l-4 border-warning-700 p-4 rounded">
                <p className="text-sm font-semibold mb-2">Important Disclaimer:</p>
                <p className="text-sm">
                  TwoBeOne is designed for spiritual growth and relationship enhancement but is NOT a substitute for:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm mt-2">
                  <li>Professional counseling or therapy</li>
                  <li>Medical or mental health advice</li>
                  <li>Legal advice</li>
                  <li>Marriage counseling from licensed professionals</li>
                </ul>
                <p className="text-sm mt-2">
                  If you are experiencing relationship difficulties, abuse, or mental health challenges, 
                  please seek help from qualified professionals.
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">10.3 No Guarantee of Results</h3>
              <p className="text-sm text-foreground">
                We do not guarantee that using TwoBeOne will improve your relationship, strengthen your faith, 
                or achieve any specific outcome. Results depend on your commitment and circumstances.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">10.4 Limitation of Liability</h3>
              <p className="text-sm text-foreground">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, TWOBEONE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, 
                SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED 
                DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
              </p>
              <p className="text-sm text-foreground mt-2">
                Our total liability shall not exceed the amount you paid to TwoBeOne in the 12 months preceding 
                the claim, or $100, whichever is greater.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>11. Indemnification</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              You agree to indemnify, defend, and hold harmless TwoBeOne, its officers, directors, employees, 
              and agents from any claims, liabilities, damages, losses, or expenses (including attorney's fees) 
              arising from:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground mt-2">
              <li>Your use or misuse of the Service</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any rights of another person or entity</li>
              <li>Your User Content</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>12. Termination</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">12.1 Termination by You</h3>
              <p className="text-sm text-foreground">
                You may terminate your account at any time through the app settings. Note:
              </p>
              <ul className="list-disc list-inside space-y-1 text-foreground text-sm">
                <li>You must disconnect from your partner before deleting your account</li>
                <li>Account deletion is permanent and cannot be undone</li>
                <li>Some data may be retained for legal compliance</li>
                <li>Premium subscriptions must be canceled separately through the app store</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">12.2 Termination by TwoBeOne</h3>
              <p className="text-sm text-foreground">
                We may suspend or terminate your account immediately, without prior notice, if:
              </p>
              <ul className="list-disc list-inside space-y-1 text-foreground text-sm">
                <li>You violate these Terms</li>
                <li>You engage in fraudulent or illegal activity</li>
                <li>Your account poses a security risk</li>
                <li>We are required to do so by law</li>
              </ul>
              <p className="text-sm text-foreground mt-2">
                Upon termination, your right to use the Service immediately ceases. We are not liable for 
                any loss or damage resulting from account termination.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>13. Modifications to Terms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              We reserve the right to modify these Terms at any time. We will notify you of material changes by:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground">
              <li>Posting the updated Terms in the app</li>
              <li>Updating the "Last Updated" date</li>
              <li>Sending an in-app or email notification</li>
            </ul>
            <p>
              Your continued use of the Service after changes are posted constitutes acceptance of the updated Terms. 
              If you do not agree to the new Terms, you must stop using the Service and delete your account.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>14. Dispute Resolution & Governing Law</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">14.1 Governing Law</h3>
              <p className="text-sm text-foreground">
                These Terms shall be governed by and construed in accordance with the laws of [Your Jurisdiction], 
                without regard to its conflict of law provisions.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">14.2 Dispute Resolution</h3>
              <p className="text-sm text-foreground">
                If a dispute arises, we encourage you to contact us first at <strong>support@twobeone.app</strong> 
                to seek an informal resolution.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">14.3 Arbitration</h3>
              <p className="text-sm text-foreground">
                Any disputes not resolved informally shall be resolved through binding arbitration in accordance 
                with the rules of [Arbitration Organization]. You waive your right to a jury trial or to 
                participate in a class action lawsuit.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>15. General Provisions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="list-disc list-inside space-y-2 text-foreground">
              <li><strong>Entire Agreement:</strong> These Terms constitute the entire agreement between you and TwoBeOne</li>
              <li><strong>Severability:</strong> If any provision is found unenforceable, the remaining provisions remain in effect</li>
              <li><strong>Waiver:</strong> Failure to enforce any right does not waive that right</li>
              <li><strong>Assignment:</strong> You may not assign these Terms; we may assign them without restriction</li>
              <li><strong>Force Majeure:</strong> We are not liable for delays or failures due to circumstances beyond our control</li>
              <li><strong>Language:</strong> These Terms are written in English; translations are for convenience only</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-primary-50 border-primary-200">
          <CardHeader>
            <CardTitle>16. Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p>
              If you have questions about these Terms, please contact us:
            </p>
            <div className="space-y-1">
              <p><strong>Email:</strong> support@twobeone.app</p>
              <p><strong>Legal Inquiries:</strong> legal@twobeone.app</p>
              <p><strong>Response Time:</strong> We aim to respond within 48-72 hours</p>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              🙏 <em>"And now these three remain: faith, hope and love. But the greatest of these is love." - 1 Corinthians 13:13</em>
            </p>
          </CardContent>
        </Card>

        <Card className="bg-muted">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="font-semibold">By using TwoBeOne, you acknowledge that:</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-foreground">
                <li>You have read and understood these Terms of Service</li>
                <li>You have read and understood our Privacy Policy</li>
                <li>You agree to be bound by these Terms</li>
                <li>You are at least 18 years of age</li>
                <li>You will use the Service responsibly and in accordance with Christian values</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground py-8">
          <p>© 2024 TwoBeOne. All rights reserved.</p>
          <p className="mt-2">Building stronger relationships through faith. 💜</p>
        </div>
      </div>
  );
}

function TermsOfServiceAmharic() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8" dir="ltr">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <FileText className="w-16 h-16 text-primary-600" />
          </div>
          <h1 className="text-primary-900">የአገልግሎት ውል</h1>
          <p className="text-muted-foreground">መጨረሻ የዘመነ፡ ህዳር 22፣ 2024</p>
        </div>

        <Card className="bg-warning-50 border-warning-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning-500" />
              አስፈላጊ ማስታወሻ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              እባክዎ TwoBeOne የሞባይል መተግበሪያን ከመጠቀምዎ በፊት እነዚህን የአገልግሎት ውሎች በጥንቃቄ ይንብቡ። 
              አገልግሎቱን በመድረስ ወይም በመጠቀም በእነዚህ ውሎች ተገዢ ለመሆን ይስማማሉ።
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary-600" />
              1. ውሎችን መቀበል
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              መለያ በመፍጠር፣ ከአጋር ጋር በመገናኘት ወይም የ TwoBeOne ማንኛውንም ባህሪ በመጠቀም፣ ያረጋግጣሉ፡
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground">
              <li>ቢያንስ የ18 ዓመት ወይም ከዚያ በላይ ናቸው</li>
              <li>ስምምነት ለመግባት ህጋዊ አቅም አለዎት</li>
              <li>አገልግሎቱን በእነዚህ ውሎች እና በሁሉም ተፈፃሚ በሆኑ ሕጎች በማክበር ይጠቀማሉ</li>
              <li>የሚሰጡት ሁሉም መረጃ ትክክለኛ፣ ወቅታዊ እና ሙሉ ነው</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. የአገልግሎት መግለጫ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              TwoBeOne የሚያቀርበው የክርስቲያን ጥንዶች ማእከል የተደረገ የሞባይል መተግበሪያ ነው፡
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground">
              <li><strong>ዕለታዊ መንፈሳዊ ትምህርቶች፡</strong> በመጽሐፍ ቅዱስ ላይ የተመሰረተ ይዘት</li>
              <li><strong>የተጋራ ማስታወሻ፡</strong> በተገናኙ አጋሮች መካከል የግል እና የተጋራ ጆርናል ግቤቶች</li>
              <li><strong>የጸሎት ክትትል፡</strong> የግል እና የተጋራ የጸሎት ጥያቄ አስተዳደር</li>
              <li><strong>"እርስ በርሳቸው እወቁ" ጥያቄዎች፡</strong> በብዙ የግንኙነት ምድቦች ላይ የተመሩ ጥያቄዎች</li>
              <li><strong>የምስጋና ጆርናል፡</strong> ዕለታዊ የምስጋና ግቤቶች</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-600" />
              3. የመለያ ምዝገባ እና የአጋር ግንኙነት
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">3.1 መለያ መፍጠር</h3>
              <ul className="list-disc list-inside space-y-2 text-foreground">
                <li>በምዝገባ ወቅት ትክክለኛ እና ሙሉ መረጃ ማቅረብ አለብዎ</li>
                <li>የይለፍ ቃልዎን ሚስጥራዊነት ለመጠበቅ ኃላፊነት አለብዎ</li>
                <li>በመለያዎ ስር ለሚደረጉ ሁሉም እንቅስቃሴዎች ኃላፊነት አለብዎ</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">3.2 የአጋር ግንኙነት</h3>
              <ul className="list-disc list-inside space-y-2 text-foreground">
                <li>ልዩ የግብዣ ኮድ በመጠቀም በአንድ ጊዜ ከአንድ አጋር ጋር መገናኘት ይችላሉ</li>
                <li>በመገናኘት፣ አጋርዎ የተጋራ ይዘትን እንዲደርስ ይፈቅዳሉ</li>
                <li>አጋርዎ "የግል" ምልክት ያልተደረገ ብዙ ይዘትዎን እንደሚያዩ ይረዱ</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">3.3 የመለያየት ፖሊሲ</h3>
              <div className="bg-primary-50 border-l-4 border-primary-600 p-4 rounded">
                <p className="font-semibold mb-2">ወሳኝ፡ የሁለት አጋር ፈቃድ ያስፈልጋል</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li><strong>የጋራ ስምምነት፡</strong> ሁለቱም አጋሮች ለመለያየት መስማማት አለባቸው</li>
                  <li><strong>የእረፍት ጊዜ፡</strong> የመጀመሪያው አጋር ለመለያየት ከጠየቀ በኋላ የአንድ ወር የእረፍት ጊዜ</li>
                  <li><strong>ማሳወቂያዎች፡</strong> ሁለቱም አጋሮች ስለ መለያየት ጥያቄዎች የኢሜይል ማሳወቂያዎች ይቀበላሉ</li>
                  <li><strong>ከመለያየት በኋላ፡</strong> የተጋራ ውሂብ መዳረሻ ይሰረዛል፤ እያንዳንዱ ተጠቃሚ የራሳቸውን ይዘት ይይዛል</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ban className="w-5 h-5 text-error-500" />
              4. ተቀባይነት ያለው የአጠቃቀም ፖሊሲ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>አገልግሎቱን ለመጠቀም አይስማሙም፡</p>
            <ul className="list-disc list-inside space-y-2 text-foreground">
              <li>ማንኛውንም ሕግ መጣስ</li>
              <li>ሌላውን ተጠቃሚ ማስጨነቅ፣ መሳደብ ወይም መፈራራት</li>
              <li>ጎጂ፣ የሚያስከፋ ወይም ተገቢ ያልሆነ ይዘት መለጠፍ</li>
              <li>ማንኛውንም ሰው ወይም አካል መምሰል</li>
              <li>ቫይረሶችን፣ ማልዌርን ወይም ማንኛውንም ጎጂ ኮድ መስቀል</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-primary-50 border-primary-200">
          <CardHeader>
            <CardTitle>16. የመገኛ መረጃ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p>
              ስለእነዚህ ውሎች ጥያቄዎች ካሉዎት፣ እባክዎን ያግኙን፡
            </p>
            <div className="space-y-1">
              <p><strong>ኢሜይል፡</strong> support@twobeone.app</p>
              <p><strong>የሕግ ጥያቄዎች፡</strong> legal@twobeone.app</p>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              🙏 <em>"አሁን እነዚህ ሦስቱ ይኖራሉ፡ እምነት፣ ተስፋ እና ፍቅር። ግን ከእነዚህ ውስጥ ታላቁ ፍቅር ነው።" - 1 ቆሮንቶስ 13፡13</em>
            </p>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground py-8">
          <p>© 2024 TwoBeOne. መብቱ በህግ የተጠበቀ ነው።</p>
          <p className="mt-2">በእምነት በኩል ጠንካራ ግንኙነቶችን መገንባት። 💜</p>
        </div>
      </div>
  );
}
