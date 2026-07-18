import { Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';

export default function Terms() {
  return (
    <div className="min-h-screen bg-brand-mist">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-10">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md"
            style={{ background: 'linear-gradient(135deg, #2F6FED, #6C4FD8, #16407A)' }}>
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <Link to="/" className="font-extrabold text-xl gradient-text">Learnova</Link>
        </div>

        <div className="bg-white rounded-3xl border border-brand-border p-8 space-y-8">
          <div>
            <h1 className="text-3xl font-extrabold text-brand-dark mb-1">Terms of Service</h1>
            <p className="text-brand-secondary text-sm">Last updated: July 2026</p>
          </div>

          {[
            {
              title: '1. Acceptance of Terms',
              body: 'By accessing or using Learnova ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Platform.',
            },
            {
              title: '2. Platform Purpose',
              body: 'Learnova is an education discovery platform that connects students with institutes and tutors across India. We do not provide educational services directly — we facilitate discovery and communication between students and education providers.',
            },
            {
              title: '3. User Accounts',
              body: 'You must provide accurate information when creating an account. You are responsible for maintaining the security of your account credentials. Learnova reserves the right to suspend or terminate accounts that violate these terms.',
            },
            {
              title: '4. Institutes & Tutors',
              body: 'Institutes and tutors must provide accurate information about their services, fees, and qualifications. Provider publication may depend on the onboarding flow in use, including plan selection, payment, or manual review for older registrations. Learnova does not verify academic credentials but expects truthful listings.',
            },
            {
              title: '5. Student Conduct',
              body: 'Students agree to use enquiries and reviews respectfully. Spam, abuse, or fraudulent enquiries may result in account suspension.',
            },
            {
              title: '6. Reviews & Ratings',
              body: 'Reviews must be honest and based on genuine experience. Fake or malicious reviews are prohibited and may be removed.',
            },
            {
              title: '7. Limitation of Liability',
              body: 'Learnova is not responsible for the quality of education provided by listed institutes or tutors, disputes between students and providers, or any loss arising from the use of information on the Platform.',
            },
            {
              title: '8. Changes to Terms',
              body: 'We may update these terms at any time. Continued use of the Platform after changes constitutes acceptance of the new terms.',
            },
          ].map(s => (
            <div key={s.title}>
              <h2 className="text-lg font-extrabold text-brand-dark mb-2">{s.title}</h2>
              <p className="text-brand-secondary leading-relaxed text-sm">{s.body}</p>
            </div>
          ))}

          <div className="border-t border-brand-border pt-8">
            <h1 className="text-3xl font-extrabold text-brand-dark mb-1">Privacy Policy</h1>
            <p className="text-brand-secondary text-sm mb-6">Last updated: July 2026</p>

            {[
              {
                title: 'What we collect',
                body: 'We collect your name, email address, and any profile information you choose to provide (location, bio, phone). We also store enquiries and reviews you submit.',
              },
              {
                title: 'How we use it',
                body: 'Your information is used to operate the Platform — to show your profile to students, route enquiries, and manage your account. We do not sell your data to third parties.',
              },
              {
                title: 'Data storage',
                body: 'All data is stored on the Learnova server. Passwords are hashed and never stored in plain text. Profile images are stored on the server.',
              },
              {
                title: 'Your rights',
                body: 'You may request deletion of your account and associated data at any time by contacting us. Upon deletion, your profile, reviews, and enquiries will be permanently removed.',
              },
              {
                title: 'Contact',
                body: 'For any privacy-related queries, contact us at: learnova63@gmail.com',
              },
            ].map(s => (
              <div key={s.title} className="mb-5">
                <h2 className="text-lg font-extrabold text-brand-dark mb-2">{s.title}</h2>
                <p className="text-brand-secondary leading-relaxed text-sm">{s.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-8">
          <Link to="/" className="text-brand-primary hover:text-brand-dark font-semibold text-sm">
            ← Back to Learnova
          </Link>
        </div>
      </div>
    </div>
  );
}
