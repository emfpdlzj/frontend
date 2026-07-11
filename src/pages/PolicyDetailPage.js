import { Navigate, useParams } from 'react-router-dom';
import { PolicyDocument } from '../components/common/PolicyDocument';
import { POLICY_DOCUMENT_MAP } from '../config/policyDocuments';
import { ROUTE_PATHS } from '../config/routes';
import { useLocale } from '../i18n/LocaleContext';

export function PolicyDetailPage() {
  const { policyId } = useParams();
  const { localizePath } = useLocale();
  const policy = POLICY_DOCUMENT_MAP[policyId];

  if (!policy) {
    return <Navigate to={localizePath(ROUTE_PATHS.settings)} replace />;
  }

  return <PolicyDocument policy={policy} />;
}
