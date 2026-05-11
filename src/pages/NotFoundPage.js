import { CommonErrorPage } from '../components/common/CommonErrorPage';

export function NotFoundPage() {
  return <CommonErrorPage status={404} />;
}
