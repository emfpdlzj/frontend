import { FILE_UPLOAD_POLICY } from '../config/securityPolicy';
import { validateFileUpload } from './fileValidation';

const createFile = (name, type = 'application/pdf') => ({
  name,
  type
});

test('accepts portfolio PDF files by extension and MIME type', () => {
  expect(validateFileUpload(createFile('portfolio.pdf'), FILE_UPLOAD_POLICY.portfolioPdf)).toEqual({ ok: true });
});

test('rejects files with mismatched extension or MIME type', () => {
  expect(validateFileUpload(createFile('portfolio.pdf.exe'), FILE_UPLOAD_POLICY.portfolioPdf)).toMatchObject({
    ok: false
  });
  expect(validateFileUpload(createFile('portfolio.pdf', 'application/x-msdownload'), FILE_UPLOAD_POLICY.portfolioPdf)).toMatchObject({
    ok: false
  });
});
