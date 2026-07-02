import {
  getPasswordStrength,
  passwordRequirementStatus,
  strengthBarClass,
  strengthTextClass,
} from '@/lib/passwordStrength';

type PasswordStrengthMeterProps = {
  password: string;
};

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  if (!password) return null;

  const strength = getPasswordStrength(password);
  const reqs = passwordRequirementStatus(password);

  return (
    <div className="space-y-2">
      <div className="h-1.5 overflow-hidden rounded-full bg-ash-grey-100">
        <div className={`h-full rounded-full transition-all ${strengthBarClass(strength)}`} />
      </div>
      <p className={`text-xs font-medium capitalize ${strengthTextClass(strength)}`}>
        Password strength: {strength}
      </p>
      <ul className="space-y-1 text-xs">
        <Requirement met={reqs.length} label="At least 8 characters" />
        <Requirement met={reqs.mixedCase} label="Upper and lower case letters" />
        <Requirement met={reqs.number} label="At least one number" />
      </ul>
    </div>
  );
}

function Requirement({ met, label }: { met: boolean; label: string }) {
  return (
    <li className={met ? 'text-shamrock-700' : 'text-ash-grey-400'}>
      {met ? '✓' : '○'} {label}
    </li>
  );
}
