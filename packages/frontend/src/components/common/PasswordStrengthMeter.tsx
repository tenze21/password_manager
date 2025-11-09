import { calculatePasswordStrength } from '@utils/crypto';
import { ProgressBar } from 'react-bootstrap';

interface PasswordStrengthMeterProps {
  password: string;
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password }) => {
  if (!password) return null;

  const strength = calculatePasswordStrength(password);
  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
  const strengthVariants = ['danger', 'warning', 'warning', 'success', 'success'] as const;
  const strengthPercent = ((strength + 1) / 5) * 100;

  return (
    <div className="mt-2">
      <ProgressBar
        now={strengthPercent}
        variant={strengthVariants[strength]}
        className="mb-1"
        style={{ height: '6px' }}
      />
      <small className={`text-${strengthVariants[strength]}`}>
        Password Strength: {strengthLabels[strength]}
      </small>
    </div>
  );
};