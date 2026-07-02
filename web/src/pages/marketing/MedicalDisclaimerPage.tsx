import { LegalPageLayout, LegalSection } from '@/components/marketing/LegalPageLayout';

export function MedicalDisclaimerPage() {
  return (
    <LegalPageLayout
      title="Medical disclaimer"
      updated="May 23, 2026"
      description="Important health information for MiraFood users.">
      <LegalSection title="Not medical advice">
        <p>
          <strong>MiraFood is not a medical device and does not provide medical advice.</strong> The
          app, including AI meal analysis, nutrition estimates, health scores, and coach feedback, is
          for informational and educational purposes only.
        </p>
        <p>
          Nothing in MiraFood is intended to diagnose, treat, cure, or prevent any disease or health
          condition.
        </p>
      </LegalSection>

      <LegalSection title="Consult a professional">
        <p>
          Always seek the advice of a qualified physician, registered dietitian, or other licensed
          healthcare provider before making changes to your diet, especially if you:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Have a medical condition or chronic illness</li>
          <li>Are pregnant, nursing, or planning pregnancy</li>
          <li>Have a history of eating disorders</li>
          <li>Take medication affected by diet or nutrition</li>
          <li>Have severe food allergies or intolerances</li>
        </ul>
      </LegalSection>

      <LegalSection title="Allergens & accuracy">
        <p>
          Nutrition and allergen information in MiraFood is estimated and may be incomplete or incorrect.
          Do not rely solely on the app for allergen avoidance. Always verify ingredients when allergies
          are a concern.
        </p>
      </LegalSection>

      <LegalSection title="Emergency">
        <p>
          If you think you may have a medical emergency, call your local emergency number immediately.
          Do not use MiraFood for emergency health decisions.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Questions:{' '}
          <a href="mailto:support@vitaway.org" className="text-blue-spruce-600 underline">
            support@vitaway.org
          </a>
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
