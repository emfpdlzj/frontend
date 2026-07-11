import { PolicyDocument } from '../components/common/PolicyDocument';
import { POLICY_DOCUMENT_MAP } from '../config/policyDocuments';

export function PrivacyPage() {
  const policy = POLICY_DOCUMENT_MAP['privacy-policy'];

  return <PolicyDocument policy={policy} />;
}
