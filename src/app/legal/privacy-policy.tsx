import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ScrollArea } from '../components/ui/scroll-area';
import { Shield, Mail, MapPin, Heart, Database, Lock } from 'lucide-react';

interface PrivacyPolicyProps {
  language?: 'en' | 'am';
}

export function PrivacyPolicy({ language = 'en' }: PrivacyPolicyProps) {
  if (language === 'am') {
    return <PrivacyPolicyAmharic />;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <Shield className="w-16 h-16 text-primary-600" />
          </div>
          <h1 className="text-primary-900">Privacy Policy</h1>
          <p className="text-muted-foreground">Last Updated: August 17, 2026</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary-600" />
              Introduction
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Welcome to <strong>TwoBeOne</strong> ("we," "our," or "us"). TwoBeOne is a Christian couple-centered 
              mobile application designed to strengthen relationships through Bible-based guidance, shared reflection, 
              and spiritual growth.
            </p>
            <p>
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use 
              our mobile application and related services (collectively, the "Service"). Please read this policy carefully. 
              If you do not agree with the terms of this privacy policy, please do not access the Service.
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Your Trust Matters:</strong> As a faith-based app serving couples, we take your privacy seriously 
              and are committed to protecting your personal information and maintaining the sanctity of your relationship data.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-primary-600" />
              Information We Collect
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">1. Personal Information You Provide</h3>
              <ul className="list-disc list-inside space-y-2 text-foreground">
                <li><strong>Account Information:</strong> Name, email address, password (encrypted), profile photo</li>
                <li><strong>Couple Connection:</strong> Partner invite codes, relationship start date, relationship milestones</li>
                <li><strong>Profile Details:</strong> Language preference (English/Amharic), timezone, notification preferences</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">2. Spiritual & Relationship Content</h3>
              <ul className="list-disc list-inside space-y-2 text-foreground">
                <li><strong>Devotional Responses:</strong> Your reflections, journal entries, and responses to daily devotionals</li>
                <li><strong>Prayer Requests:</strong> Prayer topics, status updates, and shared prayer requests with your partner</li>
                <li><strong>Question Responses:</strong> Answers to "Know Each Other" questions across various categories</li>
                <li><strong>Gratitude Entries:</strong> Daily gratitude journal entries and shared appreciations</li>
                <li><strong>Milestone Tracking:</strong> Relationship milestones, achievements, and spiritual growth markers</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">3. Location Information (Optional)</h3>
              <ul className="list-disc list-inside space-y-2 text-foreground">
                <li><strong>Distance Connector Feature:</strong> GPS coordinates or manually entered city/country</li>
                <li><strong>Purpose:</strong> Calculate and display distance between you and your partner</li>
                <li><strong>Control:</strong> You can enable/disable location sharing at any time</li>
                <li><strong>Sharing:</strong> Location data is only shared with your connected partner</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">4. Automatically Collected Information</h3>
              <ul className="list-disc list-inside space-y-2 text-foreground">
                <li><strong>Device Information:</strong> Device type, operating system, browser type, app version</li>
                <li><strong>Usage Data:</strong> Features accessed, time spent, interaction patterns (anonymized)</li>
                <li><strong>Log Data:</strong> IP address, access times, error logs for troubleshooting</li>
                <li><strong>Push Notification Tokens:</strong> To deliver daily devotionals and partner notifications</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">5. Bible API Data</h3>
              <p className="text-foreground">
                We integrate with third-party Bible APIs to provide Scripture content. We do not store or track 
                which verses you read beyond what you explicitly save in your journal entries.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary-600" />
              How We Use Your Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>We use the information we collect to:</p>
            <ul className="list-disc list-inside space-y-2 text-foreground">
              <li><strong>Provide Core Services:</strong> Enable couple connections, synchronize data between partners, deliver devotionals</li>
              <li><strong>Facilitate Communication:</strong> Share journal entries, prayer requests, and question responses with your partner</li>
              <li><strong>Personalization:</strong> Deliver content in your preferred language, customize devotionals based on progress</li>
              <li><strong>Notifications:</strong> Send daily devotionals, prayer reminders, partner activity updates, milestone celebrations</li>
              <li><strong>Saturday Email:</strong> Send registered users and standalone subscribers weekly encouragement, relationship guidance, and product updates; every edition includes an unsubscribe option</li>
              <li><strong>Distance Tracking:</strong> Calculate and display physical distance between connected partners (opt-in)</li>
              <li><strong>Service Improvement:</strong> Analyze usage patterns (anonymized) to improve features and user experience</li>
              <li><strong>Security & Safety:</strong> Prevent fraud, ensure account security, enforce Terms of Service</li>
              <li><strong>Legal Compliance:</strong> Respond to legal requests, protect rights and safety</li>
              <li><strong>Communication:</strong> Send service updates, new feature announcements, support responses</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary-600" />
              Partner Data Sharing (Critical)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-primary-50 border-l-4 border-primary-600 p-4 rounded">
              <p className="font-semibold text-primary-900 mb-2">
                ⚠️ Important: When you connect with a partner using an invite code:
              </p>
              <ul className="list-disc list-inside space-y-1 text-primary-900">
                <li>Your partner will have access to most of your content within the app</li>
                <li>This includes devotional responses, prayer requests, question answers, gratitude entries, and milestones</li>
                <li>Location data (if enabled) is shared with your partner</li>
                <li>Some content can be marked as "private" and will not be shared</li>
              </ul>
            </div>

            <p>
              <strong>What Your Partner Can See:</strong>
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground">
              <li>Your profile information (name, photo)</li>
              <li>Your devotional responses and journal entries (unless marked private)</li>
              <li>Your prayer requests (unless marked private)</li>
              <li>Your answers to "Know Each Other" questions</li>
              <li>Your gratitude journal entries</li>
              <li>Your milestones and achievements</li>
              <li>Your location (if you enable the Distance Connector)</li>
            </ul>

            <p>
              <strong>Disconnection Policy:</strong> Both partners must agree to disconnect. During the one-month grace period, 
              both partners retain access to shared data. After disconnection is finalized, shared data access is revoked, 
              but each user retains their own content.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Third-Party Service Providers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>We use the following third-party services to operate TwoBeOne:</p>

            <div className="space-y-3">
              <div>
                <h4 className="font-semibold">Supabase (Database & Authentication)</h4>
                <p className="text-sm text-muted-foreground">
                  We use Supabase to store and manage your data securely. Supabase is SOC 2 Type 2 compliant and 
                  provides enterprise-grade security.
                  <br />
                  Privacy Policy: <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">https://supabase.com/privacy</a>
                </p>
              </div>

              <div>
                <h4 className="font-semibold">Bible API Services</h4>
                <p className="text-sm text-muted-foreground">
                  We integrate with Bible API services to provide Scripture content. These services do not receive 
                  your personal information.
                </p>
              </div>

              <div>
                <h4 className="font-semibold">Resend (Email Delivery)</h4>
                <p className="text-sm text-muted-foreground">
                  We use Resend to deliver essential account messages and the weekly Saturday email. Messages are
                  sent to registered users and confirmed standalone subscribers. You can opt out at any time through
                  the unsubscribe link included in each edition.
                  <br />
                  Privacy Policy: <a href="https://resend.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">https://resend.com/legal/privacy-policy</a>
                </p>
              </div>

              <div>
                <h4 className="font-semibold">Analytics Services (If Enabled)</h4>
                <p className="text-sm text-muted-foreground">
                  We may use analytics tools to understand app usage patterns. All analytics data is anonymized 
                  and does not include your personal spiritual content.
                </p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> We do not sell your data to third parties. Third-party services are used solely 
              to provide and improve our Service.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Security</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              We implement industry-standard security measures to protect your information:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground">
              <li><strong>Encryption:</strong> All data is encrypted in transit (HTTPS/TLS) and at rest</li>
              <li><strong>Password Security:</strong> Passwords are hashed using bcrypt with salt</li>
              <li><strong>Access Control:</strong> Strict authentication and authorization controls</li>
              <li><strong>Regular Backups:</strong> Automated backups to prevent data loss</li>
              <li><strong>Secure Infrastructure:</strong> Hosted on secure, SOC 2 compliant servers</li>
              <li><strong>Monitoring:</strong> 24/7 security monitoring and logging</li>
            </ul>
            <p className="text-sm text-muted-foreground">
              However, no method of transmission over the internet or electronic storage is 100% secure. 
              While we strive to use commercially acceptable means to protect your information, we cannot 
              guarantee absolute security.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Privacy Rights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>You have the following rights regarding your personal information:</p>

            <div className="space-y-3">
              <div>
                <h4 className="font-semibold">1. Access & Portability</h4>
                <p className="text-sm text-foreground">
                  Request a copy of all personal data we hold about you in a machine-readable format.
                </p>
              </div>

              <div>
                <h4 className="font-semibold">2. Correction</h4>
                <p className="text-sm text-foreground">
                  Update or correct your personal information through the app settings.
                </p>
              </div>

              <div>
                <h4 className="font-semibold">3. Deletion ("Right to be Forgotten")</h4>
                <p className="text-sm text-foreground">
                  Request deletion of your account and associated data. Note: If you are connected to a partner, 
                  both must agree to disconnect before account deletion. Deletion is permanent and cannot be undone.
                </p>
              </div>

              <div>
                <h4 className="font-semibold">4. Restrict Processing</h4>
                <p className="text-sm text-foreground">
                  Request restriction of how we process your data (e.g., disable location sharing).
                </p>
              </div>

              <div>
                <h4 className="font-semibold">5. Object to Processing</h4>
                <p className="text-sm text-foreground">
                  Object to specific data processing activities (e.g., marketing communications).
                </p>
              </div>

              <div>
                <h4 className="font-semibold">6. Withdraw Consent</h4>
                <p className="text-sm text-foreground">
                  Withdraw consent for optional features like location sharing or push notifications.
                </p>
              </div>
            </div>

            <p className="text-sm">
              To exercise any of these rights, contact us at: <strong>privacy@twobeone.app</strong>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Retention</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>We retain your information for as long as necessary to provide the Service:</p>
            <ul className="list-disc list-inside space-y-2 text-foreground">
              <li><strong>Active Accounts:</strong> Data is retained indefinitely while your account is active</li>
              <li><strong>After Disconnection:</strong> Shared data access is revoked, but each user retains their own content</li>
              <li><strong>Account Deletion:</strong> Most data is deleted within 30 days; some may be retained for legal compliance</li>
              <li><strong>Backup Data:</strong> May persist in backups for up to 90 days</li>
              <li><strong>Legal Requirements:</strong> Some data may be retained longer if required by law</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Children's Privacy</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              TwoBeOne is intended for use by adults in committed relationships. Our Service is not directed to 
              individuals under the age of 18. We do not knowingly collect personal information from children under 18. 
              If you are a parent or guardian and believe your child has provided us with personal information, 
              please contact us at <strong>privacy@twobeone.app</strong>.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>International Data Transfers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Your information may be transferred to and maintained on computers located outside of your state, 
              province, country, or other governmental jurisdiction where data protection laws may differ. 
              If you are located outside the United States and choose to provide information to us, please note 
              that we transfer data, including personal data, to the United States and process it there.
            </p>
            <p>
              Our infrastructure provider (Supabase) uses secure, geographically distributed data centers. 
              Data transfers comply with GDPR requirements through Standard Contractual Clauses (SCCs).
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary-600" />
              California Privacy Rights (CCPA)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>If you are a California resident, you have specific rights under the California Consumer Privacy Act (CCPA):</p>
            <ul className="list-disc list-inside space-y-2 text-foreground">
              <li><strong>Right to Know:</strong> Request disclosure of personal information collected, used, or shared</li>
              <li><strong>Right to Delete:</strong> Request deletion of personal information</li>
              <li><strong>Right to Opt-Out:</strong> We do not sell personal information (no opt-out needed)</li>
              <li><strong>Right to Non-Discrimination:</strong> We will not discriminate against you for exercising your rights</li>
            </ul>
            <p className="text-sm">
              To exercise these rights, contact: <strong>privacy@twobeone.app</strong>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>European Union Rights (GDPR)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>If you are in the European Economic Area (EEA), you have rights under the General Data Protection Regulation (GDPR):</p>
            <ul className="list-disc list-inside space-y-2 text-foreground">
              <li>Right of access, rectification, erasure, and restriction</li>
              <li>Right to data portability</li>
              <li>Right to object to processing</li>
              <li>Right to withdraw consent</li>
              <li>Right to lodge a complaint with a supervisory authority</li>
            </ul>
            <p>
              <strong>Legal Basis for Processing:</strong> We process your data based on:
            </p>
            <ul className="list-disc list-inside space-y-1 text-foreground">
              <li>Your consent (e.g., location sharing)</li>
              <li>Performance of contract (providing the Service)</li>
              <li>Legitimate interests (improving the Service, security)</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Changes to This Privacy Policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. 
              We will notify you of any material changes by:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground">
              <li>Posting the new Privacy Policy in the app</li>
              <li>Updating the "Last Updated" date</li>
              <li>Sending an in-app notification</li>
              <li>Sending an email notification (for significant changes)</li>
            </ul>
            <p>
              Your continued use of the Service after changes are posted constitutes acceptance of the updated Privacy Policy.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-primary-50 border-primary-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary-600" />
              Contact Us
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p>
              If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, 
              please contact us:
            </p>
            <div className="space-y-1">
              <p><strong>Email:</strong> privacy@twobeone.app</p>
              <p><strong>Support Email:</strong> support@twobeone.app</p>
              <p><strong>Response Time:</strong> We aim to respond within 48 hours</p>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              🙏 <em>"Trust in the Lord with all your heart and lean not on your own understanding." - Proverbs 3:5</em>
            </p>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground py-8">
          <p>© 2024 TwoBeOne. All rights reserved.</p>
          <p className="mt-2">Building stronger relationships through faith. 💜</p>
        </div>
      </div>
  );
}

function PrivacyPolicyAmharic() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8" dir="ltr">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <Shield className="w-16 h-16 text-primary-600" />
          </div>
          <h1 className="text-primary-900">የግላዊነት ፖሊሲ</h1>
          <p className="text-muted-foreground">መጨረሻ የዘመነ፡ ህዳር 22፣ 2024</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary-600" />
              መግቢያ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              ወደ <strong>TwoBeOne</strong> እንኳን በደህና መጡ። TwoBeOne በመጽሐፍ ቅዱስ መሰረት በተመሰረተ መመሪያ፣ በጋራ ማስተዋል እና 
              በመንፈሳዊ እድገት ግንኙነቶችን ለማጠናከር የተነደፈ የክርስቲያን ጥንዶች ማእከል የተደረገ የሞባይል መተግበሪያ ነው።
            </p>
            <p>
              ይህ የግላዊነት ፖሊሲ የእኛን የሞባይል መተግበሪያ እና ተዛማጅ አገልግሎቶች ("አገልግሎት") ሲጠቀሙ መረጃዎን እንዴት እንደምንሰበስብ፣ 
              እንደምንጠቀም፣ እንደምናጋራ እና እንደምንጠብቅ ያብራራል። እባክዎ ይህንን ፖሊሲ በጥንቃቄ ያንብቡ።
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>እምነትዎ አስፈላጊ ነው፡</strong> ጥንዶችን እንደሚያገለግል የእምነት መሰረት ያለው መተግበሪያ በመሆናችን፣ 
              የእርስዎን ግላዊነት በቁም ነገር እንመለከታለን።
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-primary-600" />
              የምንሰበስበው መረጃ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">1. የግል መረጃ</h3>
              <ul className="list-disc list-inside space-y-2 text-foreground">
                <li><strong>የመለያ መረጃ፡</strong> ስም፣ የኢሜይል አድራሻ፣ የይለፍ ቃል (የተመሰጠረ)፣ የመገለጫ ፎቶ</li>
                <li><strong>የጥንድ ግንኙነት፡</strong> የአጋር የግብዣ ኮዶች፣ የግንኙነት መጀመሪያ ቀን</li>
                <li><strong>የመገለጫ ዝርዝሮች፡</strong> የቋንቋ ምርጫ (እንግሊዝኛ/አማርኛ)፣ የጊዜ ዞን</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">2. መንፈሳዊ እና የግንኙነት ይዘት</h3>
              <ul className="list-disc list-inside space-y-2 text-foreground">
                <li><strong>የመንፈሳዊ ምላሾች፡</strong> የእርስዎ ማሰብ፣ ጆርናል ግቤቶች</li>
                <li><strong>የጸሎት ጥያቄዎች፡</strong> የጸሎት ርዕሰ ጉዳዮች እና ሁኔታ ማሻሻያዎች</li>
                <li><strong>የጥያቄ ምላሾች፡</strong> "እርስ በርሳቸው እወቁ" ጥያቄዎችን መልሶች</li>
                <li><strong>የምስጋና ግቤቶች፡</strong> ዕለታዊ የምስጋና ጆርናል ግቤቶች</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">3. የአካባቢ መረጃ (አማራጭ)</h3>
              <ul className="list-disc list-inside space-y-2 text-foreground">
                <li><strong>የርቀት ማገናኛ ባህሪ፡</strong> GPS መጋጠሚያዎች ወይም በእጅ የገቡ ከተማ/አገር</li>
                <li><strong>ዓላማ፡</strong> በእርስዎ እና በአጋርዎ መካከል ያለውን ርቀት ለማስላት</li>
                <li><strong>ቁጥጥር፡</strong> የአካባቢ መጋራትን በማንኛውም ጊዜ ማንቃት/ማሰናከል ይችላሉ</li>
                <li><strong>መጋራት፡</strong> የአካባቢ ውሂብ ከተገናኘው አጋርዎ ጋር ብቻ ይጋራል</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary-600" />
              የአጋር ውሂብ መጋራት (ወሳኝ)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-primary-50 border-l-4 border-primary-600 p-4 rounded">
              <p className="font-semibold text-primary-900 mb-2">
                ⚠️ አስፈላጊ፡ የግብዣ ኮድ ተጠቅመው ከአጋር ጋር ሲገናኙ፡
              </p>
              <ul className="list-disc list-inside space-y-1 text-primary-900">
                <li>አጋርዎ በመተግበሪያው ውስጥ ወደ ብዙዎቹ ይዘቶችዎ መዳረሻ ይኖረዋል</li>
                <li>ይህ የመንፈሳዊ ምላሾች፣ የጸሎት ጥያቄዎች፣ የጥያቄ መልሶች ያካትታል</li>
                <li>የአካባቢ ውሂብ (ካንቁ) ከአጋርዎ ጋር ይጋራል</li>
              </ul>
            </div>

            <p>
              <strong>የመለያየት ፖሊሲ፡</strong> ሁለቱም አጋሮች ለመለያየት መስማማት አለባቸው። በአንድ ወር የእረፍት ጊዜ ውስጥ፣ 
              ሁለቱም አጋሮች ለተጋራ ውሂብ መዳረሻ ይቀጥላሉ።
            </p>
          </CardContent>
        </Card>

        <Card className="bg-primary-50 border-primary-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary-600" />
              ያግኙን
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p>
              ስለዚህ የግላዊነት ፖሊሲ ጥያቄዎች ካሉዎት፣ እባክዎን ያግኙን፡
            </p>
            <div className="space-y-1">
              <p><strong>ኢሜይል፡</strong> privacy@twobeone.app</p>
              <p><strong>የድጋፍ ኢሜይል፡</strong> support@twobeone.app</p>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              🙏 <em>"በመላው ልብህ በእግዚአብሔር ታመን።" - ምሳሌ 3፡5</em>
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
