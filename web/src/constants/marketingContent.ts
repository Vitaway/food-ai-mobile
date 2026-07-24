export const impactStats = [
  {
    value: '100%',
    label: 'Diary macros coach-reviewed',
    detail: 'Approved meals only — AI estimates stay hidden until a coach verifies them.',
    accent: 'text-shamrock-600',
  },
  {
    value: '< 1 min',
    label: 'Typical meal log',
    detail: 'Snap a photo or describe your meal — AI handles portion and macro estimates.',
    accent: 'text-blue-spruce-600',
  },
  {
    value: '3',
    label: 'Ways to log',
    detail: 'Camera, gallery, or text description — built for every age and setting.',
    accent: 'text-cinnamon-wood-500',
  },
] as const;

export const differentiators = [
  {
    title: 'Coach-verified data',
    desc: 'Unlike generic calorie apps, every number in your diary is approved by a real nutrition coach.',
    icon: '✓',
    color: 'bg-shamrock-500',
  },
  {
    title: 'Expert-led workflow',
    desc: 'Designed with coaches and clinicians in mind — review queues, patient file IDs, and client context.',
    icon: '◎',
    color: 'bg-blue-spruce-600',
  },
  {
    title: 'AI portion intelligence',
    desc: 'Photo-based plate detection and smart analysis — with your description when the photo is unclear.',
    icon: '◉',
    color: 'bg-cinnamon-wood-400',
  },
  {
    title: 'Built for outcomes',
    desc: 'Track macros, water, streaks, and insights over time — closing the loop between logging and change.',
    icon: '↗',
    color: 'bg-blue-spruce-700',
  },
  {
    title: 'Privacy first',
    desc: 'Your health data is protected. We do not sell identifiable information. See our privacy policy.',
    icon: '🔒',
    color: 'bg-ash-grey-700',
  },
  {
    title: 'Trusted in Rwanda',
    desc: 'Partnering with public health institutions to bring evidence-based nutrition support at scale.',
    icon: '🇷🇼',
    color: 'bg-shamrock-600',
  },
] as const;

export const testimonials = [
  {
    quote:
      'I like that MiraFood is linked to my coach. The app shows me an AI estimate, but nothing hits my diary until someone reviews it — that builds real trust.',
    name: 'Aline U.',
    role: 'MiraFood member',
    context: 'Patient',
    image: '/marketing/testimonials/1.jpg',
  },
  {
    quote:
      'The review queue is clean and fast. I can see the photo, edit ingredients, and approve or reject in minutes — much quicker than a full dietary recall interview.',
    name: 'Dr. Eric N.',
    role: 'Vitaway nutrition coach',
    context: 'Coach',
    image: '/marketing/testimonials/2.jpg',
  },
  {
    quote:
      'Patient file IDs and a shared review workflow make it easy to scale coach support across a clinic without losing quality.',
    name: 'Claire M.',
    role: 'Clinic operations lead',
    context: 'Partner',
    image: '/marketing/testimonials/3.jpg',
  },
] as const;

export const homeSteps = [
  {
    step: '01',
    title: 'Snap or describe your meal',
    desc: 'Camera, gallery, or text — log in seconds. Add a note when the photo needs context.',
  },
  {
    step: '02',
    title: 'AI estimates portions & macros',
    desc: 'Plate detection and vision AI identify foods and estimate nutrition for coach review.',
  },
  {
    step: '03',
    title: 'Coach verifies before your diary',
    desc: 'A nutrition coach approves, edits, or rejects — only verified data counts toward your goals.',
  },
  {
    step: '04',
    title: 'Track progress over time',
    desc: 'Insights, streaks, hydration, and personalized tips help you improve week after week.',
  },
] as const;

export const coachFaqs = [
  {
    q: 'Will MiraFood add to my workload?',
    a: 'MiraFood is designed like a structured review queue — not open-ended messaging. Clients log meals; you approve or adjust in minutes. Most reviews take far less time than a traditional dietary recall.',
  },
  {
    q: 'Can I edit AI-generated nutrition?',
    a: 'Yes. Coaches can adjust meal names, ingredient weights, and leave notes for clients before approving or rejecting.',
  },
  {
    q: 'What do clients see before I approve?',
    a: 'Clients see AI estimates while a meal is in review, but approved macros only enter their diary after you sign off — keeping your guidance authoritative.',
  },
] as const;

export const clinicFaqs = [
  {
    q: 'How does MiraFood help our clinic?',
    a: 'Scale human-in-the-loop nutrition review across clients with consistent workflows, patient file IDs, and a shared coach dashboard — without every visit starting from a blank dietary history.',
  },
  {
    q: 'Is the technology evidence-based?',
    a: 'MiraFood combines vision AI with mandatory coach review. We document our methodology on the clinical evidence page and align workflows with medical nutrition therapy principles.',
  },
  {
    q: 'How do we get started?',
    a: 'Contact our team to discuss pilot deployment, coach onboarding, and integration with your existing Vitaway programs.',
  },
] as const;

export const patientFaqs = [
  {
    q: 'What is my patient file ID?',
    a: 'When you register, MiraFood assigns a patient MRN (e.g. MRN-26070183) — your unique reference across the platform and with your care team.',
  },
  {
    q: 'Why do coaches review my meals?',
    a: 'Coach review ensures the nutrition in your diary is accurate and appropriate for your goals — not just an AI guess.',
  },
  {
    q: 'Can I log without a photo?',
    a: 'Yes. Describe your meal in text, or add a note to a photo when the image alone is unclear.',
  },
] as const;

export const supportFaqsExtra = [
  {
    q: 'How accurate is the AI?',
    a: 'AI provides a first estimate. A coach reviews every meal before approved macros appear in your diary. For unclear photos, add a description or send to your coach without AI.',
  },
  {
    q: 'What is a patient file ID?',
    a: 'Your Vitaway patient file ID links your MiraFood account to your health profile and care team. Find it in Profile → Account.',
  },
  {
    q: 'Who can access my meal data?',
    a: 'You, assigned coaches reviewing your meals, and authorized Vitaway administrators. See our Privacy Policy for details.',
  },
  {
    q: 'Is MiraFood available in Rwanda?',
    a: 'Yes. MiraFood is built with Vitaway and partners including Rwanda public health institutions. The app works wherever you have internet access.',
  },
  {
    q: 'How do clinics partner with Vitaway?',
    a: 'Email support@vitaway.org or use the contact form on our For clinics page. We support pilot programs and coach onboarding.',
  },
] as const;
