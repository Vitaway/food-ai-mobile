import { useState, type FormEvent } from 'react';
import { SelectField, TextAreaField, TextField } from '@/components/ui/Field';
import { CONTACT_EMAIL } from '@/constants/contact';

const TOPICS = [
  'Clinic or hospital partnership',
  'Coach onboarding',
  'General inquiry',
  'Technical support',
] as const;

type ContactFormCardProps = {
  title?: string;
  description?: string;
  defaultTopic?: (typeof TOPICS)[number];
};

export function ContactFormCard({
  title = 'Get in touch',
  description = 'Tell us about your clinic, coaching practice, or question. We aim to respond within 2 business days.',
  defaultTopic = 'General inquiry',
}: ContactFormCardProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState<string>(defaultTopic);
  const [message, setMessage] = useState('');

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const subject = `[MiraFood] ${topic}${name ? ` — ${name}` : ''}`;
    const body = [
      name ? `Name: ${name}` : null,
      email ? `Email: ${email}` : null,
      `Topic: ${topic}`,
      '',
      message,
    ]
      .filter(Boolean)
      .join('\n');

    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  return (
    <div className="rounded-3xl border border-ash-grey-200 bg-white p-8 shadow-sm">
      <h2 className="text-xl text-ash-grey-900">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-ash-grey-600">{description}</p>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <TextField
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
        />
        <TextField
          label="Email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
        <SelectField label="Topic" value={topic} onChange={(e) => setTopic(e.target.value)}>
          {TOPICS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </SelectField>
        <TextAreaField
          label="Message"
          required
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="How can we help?"
        />
        <button
          type="submit"
          className="inline-flex w-full items-center justify-center rounded-2xl bg-blue-spruce-600 px-5 py-3 text-sm font-normal text-white transition-colors hover:bg-blue-spruce-700">
          Send message
        </button>
        <p className="text-xs text-ash-grey-500">
          Opens your email app addressed to {CONTACT_EMAIL}
        </p>
      </form>
    </div>
  );
}
