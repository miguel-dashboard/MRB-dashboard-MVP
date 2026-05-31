const API_BASE = "http://localhost:3001/api/recruit/applicants";

async function requestJson(url, options) {
  const response = await fetch(url, options);

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message || `Error ${response.status} en ${url}`);
  }

  return response.json();
}

export function getRecruitApplicants() {
  return requestJson(API_BASE);
}

export function updateRecruitApplicantStatus(applicantId, estado) {
  return requestJson(`${API_BASE}/${applicantId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ estado }),
  });
}