import { postingApi } from './postingApi';
import { httpRequest } from './httpClient';

jest.mock('./httpClient', () => ({
  httpRequest: jest.fn()
}));

beforeEach(() => {
  jest.clearAllMocks();
});

test('submitPostingFeedback sends reaction and comment to the posting feedback endpoint', async () => {
  httpRequest.mockResolvedValue({
    result: {
      feedbackId: 10,
      postingId: 99,
      reaction: 'DISLIKE'
    }
  });

  const payload = {
    reaction: 'DISLIKE',
    comment: '설명이 부족합니다.'
  };

  const response = await postingApi.submitPostingFeedback('access-token', 99, payload);

  expect(httpRequest).toHaveBeenCalledWith('/postings/99/feedback', {
    method: 'POST',
    token: 'access-token',
    body: payload,
    signal: undefined
  });
  expect(response).toEqual({
    feedbackId: 10,
    postingId: 99,
    reaction: 'DISLIKE'
  });
});
