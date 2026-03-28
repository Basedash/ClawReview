const API_BASE = '/api';
async function requestJson(input, init) {
    const response = await fetch(`${API_BASE}${input}`, {
        headers: {
            'Content-Type': 'application/json',
            ...(init?.headers ?? {}),
        },
        ...init,
    });
    const payload = (await response.json().catch(() => null));
    if (!response.ok) {
        const message = payload?.error?.message ?? `Request failed with status ${response.status}`;
        throw new Error(message);
    }
    return payload;
}
export async function fetchRequests(query) {
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
    return requestJson(`/requests${suffix ? `?${suffix}` : ''}`);
}
export async function fetchRequestDetail(id) {
    return requestJson(`/requests/${id}`);
}
export async function updateRequestContent(id, input) {
    return requestJson(`/requests/${id}/content`, {
        method: 'PATCH',
        body: JSON.stringify(input),
    });
}
export async function submitReview(id, input) {
    return requestJson(`/requests/${id}/review`, {
        method: 'POST',
        body: JSON.stringify(input),
    });
}
export async function retryResume(id) {
    return requestJson(`/requests/${id}/retry-resume`, {
        method: 'POST',
    });
}
