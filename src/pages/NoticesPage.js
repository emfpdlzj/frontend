import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { noticeApi } from '../api/noticeApi';
import { useAuth } from '../auth/AuthContext';
import { PageShell } from '../components/common/PageShell';
import { StatusMessage } from '../components/common/StatusMessage';
import { ROUTE_PATHS } from '../config/routes';
import { useLocale } from '../i18n/LocaleContext';

const EMPTY_NOTICE_FORM = {
  title: '',
  content: '',
  pinned: false,
  published: true
};

const formatNoticeDate = (value) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
};

function NoticeMeta({ notice, showPublished = false }) {
  return (
    <div className="notice-meta">
      {notice?.pinned ? <span>상단 고정</span> : null}
      {showPublished ? <span>{notice?.published ? '공개' : '비공개'}</span> : null}
      {formatNoticeDate(notice?.createdAt) ? <span>{formatNoticeDate(notice.createdAt)}</span> : null}
    </div>
  );
}

export function NoticesPage() {
  const { localizePath } = useLocale();
  const [state, setState] = useState({ status: 'loading', error: '', items: [] });

  useEffect(() => {
    const controller = new AbortController();

    noticeApi.getNotices({ signal: controller.signal })
      .then((items) => {
        setState({ status: items.length ? 'success' : 'empty', error: '', items });
      })
      .catch((error) => {
        if (error.name === 'AbortError') {
          return;
        }
        setState({ status: 'error', error: error.message || '공지사항을 불러오지 못했습니다.', items: [] });
      });

    return () => controller.abort();
  }, []);

  return (
    <PageShell title="공지사항" description="BridgeWork 서비스 안내와 변경 사항을 확인할 수 있습니다.">
      {state.status === 'loading' ? <StatusMessage>공지사항을 불러오는 중입니다.</StatusMessage> : null}
      {state.status === 'error' ? <StatusMessage kind="error">{state.error}</StatusMessage> : null}
      {state.status === 'empty' ? <StatusMessage>등록된 공지사항이 없습니다.</StatusMessage> : null}
      {state.status === 'success' ? (
        <div className="notice-list">
          {state.items.map((notice) => (
            <Link key={notice.id} to={localizePath(`${ROUTE_PATHS.notices}/${notice.id}`)} className="notice-list__item">
              <NoticeMeta notice={notice} />
              <strong>{notice.title}</strong>
              <p>{notice.content}</p>
            </Link>
          ))}
        </div>
      ) : null}
    </PageShell>
  );
}

export function NoticeDetailPage() {
  const { noticeId } = useParams();
  const { localizePath } = useLocale();
  const [state, setState] = useState({ status: 'loading', error: '', notice: null });

  useEffect(() => {
    const controller = new AbortController();

    noticeApi.getNotice(noticeId, { signal: controller.signal })
      .then((notice) => {
        setState({ status: 'success', error: '', notice });
      })
      .catch((error) => {
        if (error.name === 'AbortError') {
          return;
        }
        setState({ status: 'error', error: error.message || '공지사항을 불러오지 못했습니다.', notice: null });
      });

    return () => controller.abort();
  }, [noticeId]);

  return (
    <PageShell
      title={state.notice?.title || '공지사항'}
      description="BridgeWork 서비스 공지 상세입니다."
      actions={<Link className="secondary-button notice-action-link" to={localizePath(ROUTE_PATHS.notices)}>목록</Link>}
    >
      {state.status === 'loading' ? <StatusMessage>공지사항을 불러오는 중입니다.</StatusMessage> : null}
      {state.status === 'error' ? <StatusMessage kind="error">{state.error}</StatusMessage> : null}
      {state.status === 'success' ? (
        <article className="notice-detail">
          <NoticeMeta notice={state.notice} />
          <div className="notice-detail__content">{state.notice.content}</div>
        </article>
      ) : null}
    </PageShell>
  );
}

export function AdminNoticesPage() {
  const { callWithAuth } = useAuth();
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [form, setForm] = useState(EMPTY_NOTICE_FORM);
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sortedItems = useMemo(() => items, [items]);

  const loadNotices = useCallback((signal) => {
    setStatus('loading');
    setError('');
    return callWithAuth((accessToken) => noticeApi.getAdminNotices(accessToken, { signal }))
      .then((nextItems) => {
        setItems(nextItems);
        setStatus(nextItems.length ? 'success' : 'empty');
      })
      .catch((loadError) => {
        if (loadError.name === 'AbortError') {
          return;
        }
        setError(loadError.message || '공지사항을 불러오지 못했습니다.');
        setStatus('error');
      });
  }, [callWithAuth]);

  useEffect(() => {
    const controller = new AbortController();
    loadNotices(controller.signal);
    return () => controller.abort();
  }, [loadNotices]);

  const resetForm = () => {
    setForm(EMPTY_NOTICE_FORM);
    setEditingId(null);
  };

  const handleEdit = (notice) => {
    setEditingId(notice.id);
    setForm({
      title: notice.title || '',
      content: notice.content || '',
      pinned: Boolean(notice.pinned),
      published: Boolean(notice.published)
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await callWithAuth((accessToken) => (
        editingId
          ? noticeApi.updateAdminNotice(accessToken, editingId, form)
          : noticeApi.createAdminNotice(accessToken, form)
      ));
      resetForm();
      await loadNotices();
    } catch (submitError) {
      setError(submitError.message || '공지사항을 저장하지 못했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (noticeId) => {
    if (isSubmitting) {
      return;
    }

    if (!window.confirm('공지사항을 삭제하시겠습니까?')) {
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await callWithAuth((accessToken) => noticeApi.deleteAdminNotice(accessToken, noticeId));
      if (editingId === noticeId) {
        resetForm();
      }
      await loadNotices();
    } catch (deleteError) {
      setError(deleteError.message || '공지사항을 삭제하지 못했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageShell title="공지사항 관리" description="서비스 공지사항을 생성, 수정, 공개 전환할 수 있습니다.">
      {error ? <StatusMessage kind="error">{error}</StatusMessage> : null}
      <div className="admin-notice-layout">
        <form className="admin-notice-form" onSubmit={handleSubmit}>
          <label>
            <span>제목</span>
            <input
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              maxLength={160}
              required
            />
          </label>
          <label>
            <span>본문</span>
            <textarea
              value={form.content}
              onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
              maxLength={10000}
              rows={10}
              required
            />
          </label>
          <div className="admin-notice-form__checks">
            <label>
              <input
                type="checkbox"
                checked={form.pinned}
                onChange={(event) => setForm((prev) => ({ ...prev, pinned: event.target.checked }))}
              />
              <span>상단 고정</span>
            </label>
            <label>
              <input
                type="checkbox"
                checked={form.published}
                onChange={(event) => setForm((prev) => ({ ...prev, published: event.target.checked }))}
              />
              <span>공개</span>
            </label>
          </div>
          <div className="admin-notice-form__actions">
            <button type="submit" className="primary-button" disabled={isSubmitting}>
              {editingId ? '수정' : '등록'}
            </button>
            <button type="button" className="secondary-button" onClick={resetForm} disabled={isSubmitting}>
              초기화
            </button>
          </div>
        </form>

        <section className="admin-notice-list" aria-label="공지사항 관리 목록">
          {status === 'loading' ? <StatusMessage>공지사항을 불러오는 중입니다.</StatusMessage> : null}
          {status === 'empty' ? <StatusMessage>등록된 공지사항이 없습니다.</StatusMessage> : null}
          {status === 'error' ? <StatusMessage kind="error">{error}</StatusMessage> : null}
          {status === 'success' ? sortedItems.map((notice) => (
            <article key={notice.id} className="admin-notice-list__item">
              <NoticeMeta notice={notice} showPublished />
              <strong>{notice.title}</strong>
              <p>{notice.content}</p>
              <div className="admin-notice-list__actions">
                <button type="button" className="secondary-button" onClick={() => handleEdit(notice)} disabled={isSubmitting}>
                  수정
                </button>
                <button type="button" className="secondary-button is-danger" onClick={() => handleDelete(notice.id)} disabled={isSubmitting}>
                  삭제
                </button>
              </div>
            </article>
          )) : null}
        </section>
      </div>
    </PageShell>
  );
}
