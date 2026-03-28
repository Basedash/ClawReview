import type { ListRequestsQuery } from '@clawreview/shared';
import type {
  GetRequestResponse,
  ListRequestsResponse,
  UpdateRequestContentInput,
  UpdateRequestContentResponse,
} from '../../../../packages/shared/src/api/requests.js';
import type {
  RetryResumeResponse,
  SubmitReviewInput,
  SubmitReviewResponse,
} from '../../../../packages/shared/src/api/reviews.js';

const API_BASE = '/api';

type RequestErrorPayload = {
  error?: {
    message?: string;
  };
};

async function requestJson<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${input}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  const payload = (await response.json().catch(() => null)) as
    | RequestErrorPayload
    | null;

  if (!response.ok) {
    const message =
      payload?.error?.message ?? `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload as T;
}

export async function fetchRequests(
  query: Partial<ListRequestsQuery>,
): Promise<ListRequestsResponse> {
  const searchParams = new URLSearchParams();

  if (query.status) {
    searchParams.set('status', query.status);
  }
  if (query.reviewState) {
    searchParams.set('reviewState', query.reviewState);
  }
  if (query.search) {
    searchParams.set('search', query.search);
  }
  if (query.limit) {
    searchParams.set('limit', String(query.limit));
  }

  const suffix = searchParams.toString();
  return requestJson<ListRequestsResponse>(
    `/requests${suffix ? `?${suffix}` : ''}`,
  );
}

export async function fetchRequestDetail(
  id: string,
): Promise<GetRequestResponse> {
  return requestJson<GetRequestResponse>(`/requests/${id}`);
}

export async function updateRequestContent(
  id: string,
  input: UpdateRequestContentInput,
): Promise<UpdateRequestContentResponse> {
  return requestJson<UpdateRequestContentResponse>(`/requests/${id}/content`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function submitReview(
  id: string,
  input: SubmitReviewInput,
): Promise<SubmitReviewResponse> {
  return requestJson<SubmitReviewResponse>(`/requests/${id}/review`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function retryResume(id: string): Promise<RetryResumeResponse> {
  return requestJson<RetryResumeResponse>(`/requests/${id}/retry-resume`, {
    method: 'POST',
  });
}
