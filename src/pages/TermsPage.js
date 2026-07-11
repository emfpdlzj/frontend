import { PolicyDocument } from '../components/common/PolicyDocument';
import { POLICY_DOCUMENT_MAP } from '../config/policyDocuments';

export function TermsPage() {
  const policy = POLICY_DOCUMENT_MAP.terms;

  return <PolicyDocument policy={policy} />;
}
