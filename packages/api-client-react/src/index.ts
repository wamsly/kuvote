import {
  useQuery,
  useMutation,
  type UseQueryOptions,
} from "@tanstack/react-query";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("kuvote_token");
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`/api${path}`, { ...options, headers });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error((body as any)?.message ?? `HTTP ${res.status}`);
    throw err;
  }
  return body as T;
}

type QueryOpts<T> = { query?: Omit<UseQueryOptions<T>, "queryKey" | "queryFn"> & { queryKey?: unknown[] } };

export function getListPollsQueryKey() { return ["polls"] as const; }
export function getListActivePollsPublicQueryKey() { return ["polls", "active", "public"] as const; }
export function getGetPollDetailsQueryKey(pollId?: string) { return ["polls", pollId] as const; }
export function getGetPollResultsQueryKey(pollId?: string) { return ["polls", pollId, "results"] as const; }
export function getGetVotingHistoryQueryKey() { return ["profile", "voting-history"] as const; }
export function getListMyApplicationsQueryKey() { return ["candidates", "my-applications"] as const; }
export function getAdminListPollsQueryKey() { return ["admin", "polls"] as const; }
export function getAdminListUsersQueryKey() { return ["admin", "users"] as const; }
export function getAdminListCandidatesQueryKey() { return ["admin", "candidates"] as const; }
export function getAdminReportsQueryKey() { return ["admin", "reports"] as const; }
export function getAdminAuditLogQueryKey() { return ["admin", "audit"] as const; }
export function getApplicationSettingsQueryKey(pollId?: string) { return ["candidates", "application-settings", pollId] as const; }
export function getAdminApplicationSettingsQueryKey(pollId?: string) { return ["admin", "application-settings", pollId] as const; }

export function useListPolls(opts?: QueryOpts<unknown>) {
  return useQuery({
    queryKey: getListPollsQueryKey(),
    queryFn: () => apiFetch("/polls"),
    ...opts?.query,
  });
}

export function useListActivePollsPublic(opts?: QueryOpts<unknown>) {
  return useQuery({
    queryKey: getListActivePollsPublicQueryKey(),
    queryFn: () => apiFetch("/polls/active/public"),
    ...opts?.query,
  });
}

export function useGetPollDetails(pollId: string, opts?: QueryOpts<unknown>) {
  return useQuery({
    queryKey: opts?.query?.queryKey ?? getGetPollDetailsQueryKey(pollId),
    queryFn: () => apiFetch(`/polls/${pollId}`),
    enabled: Boolean(pollId),
    ...opts?.query,
  });
}

export function useGetPollResults(pollId: string, opts?: QueryOpts<unknown>) {
  return useQuery({
    queryKey: opts?.query?.queryKey ?? getGetPollResultsQueryKey(pollId),
    queryFn: () => apiFetch(`/polls/${pollId}/results`),
    enabled: Boolean(pollId),
    ...opts?.query,
  });
}

export function useGetProfile(opts?: QueryOpts<unknown>) {
  return useQuery({
    queryKey: ["profile"],
    queryFn: () => apiFetch("/profile"),
    ...opts?.query,
  });
}

export function useGetVotingHistory(opts?: QueryOpts<unknown>) {
  return useQuery({
    queryKey: opts?.query?.queryKey ?? getGetVotingHistoryQueryKey(),
    queryFn: () => apiFetch("/profile/voting-history"),
    enabled: opts?.query?.enabled ?? true,
    ...opts?.query,
  });
}

export function useListMyApplications(opts?: QueryOpts<unknown>) {
  return useQuery({
    queryKey: getListMyApplicationsQueryKey(),
    queryFn: () => apiFetch("/candidates/my-applications"),
    ...opts?.query,
  });
}

export function useGetApplicationSettings(pollId: string, opts?: QueryOpts<unknown>) {
  return useQuery({
    queryKey: opts?.query?.queryKey ?? getApplicationSettingsQueryKey(pollId),
    queryFn: () => apiFetch(`/candidates/application-settings/${pollId}`),
    enabled: Boolean(pollId),
    ...opts?.query,
  });
}

export function useListSchools(opts?: QueryOpts<unknown>) {
  return useQuery({
    queryKey: ["catalog", "schools"],
    queryFn: () => apiFetch("/catalog/schools"),
    staleTime: Infinity,
    ...opts?.query,
  });
}

export function useListHostels(opts?: QueryOpts<unknown>) {
  return useQuery({
    queryKey: ["catalog", "hostels"],
    queryFn: () => apiFetch("/catalog/hostels"),
    staleTime: Infinity,
    ...opts?.query,
  });
}

export function useListPositions(opts?: QueryOpts<unknown>) {
  return useQuery({
    queryKey: ["catalog", "positions"],
    queryFn: () => apiFetch("/catalog/positions"),
    staleTime: Infinity,
    ...opts?.query,
  });
}

export function useAdminListPolls(opts?: QueryOpts<unknown>) {
  return useQuery({
    queryKey: getAdminListPollsQueryKey(),
    queryFn: () => apiFetch("/admin/polls"),
    ...opts?.query,
  });
}

export function useAdminListUsers(opts?: QueryOpts<unknown>) {
  return useQuery({
    queryKey: getAdminListUsersQueryKey(),
    queryFn: () => apiFetch("/admin/users"),
    ...opts?.query,
  });
}

export function useAdminListCandidates(opts?: QueryOpts<unknown>) {
  return useQuery({
    queryKey: getAdminListCandidatesQueryKey(),
    queryFn: () => apiFetch("/admin/candidates"),
    ...opts?.query,
  });
}

export function useAdminReports(opts?: QueryOpts<unknown>) {
  return useQuery({
    queryKey: getAdminReportsQueryKey(),
    queryFn: () => apiFetch("/admin/reports"),
    ...opts?.query,
  });
}

export function useAdminElectionResultsReport(opts?: QueryOpts<unknown>) {
  return useQuery({
    queryKey: ["admin", "reports", "election-results"],
    queryFn: () => apiFetch("/admin/reports/election-results"),
    ...opts?.query,
  });
}

export function useAdminVoterTurnoutReport(opts?: QueryOpts<unknown>) {
  return useQuery({
    queryKey: ["admin", "reports", "voter-turnout"],
    queryFn: () => apiFetch("/admin/reports/voter-turnout"),
    ...opts?.query,
  });
}

export function useAdminCandidateReport(opts?: QueryOpts<unknown>) {
  return useQuery({
    queryKey: ["admin", "reports", "candidate-report"],
    queryFn: () => apiFetch("/admin/reports/candidate-report"),
    ...opts?.query,
  });
}

export function useAdminVoterParticipationReport(opts?: QueryOpts<unknown>) {
  return useQuery({
    queryKey: ["admin", "reports", "voter-participation"],
    queryFn: () => apiFetch("/admin/reports/voter-participation"),
    ...opts?.query,
  });
}

export function useAdminRejectedCandidatesReport(opts?: QueryOpts<unknown>) {
  return useQuery({
    queryKey: ["admin", "reports", "rejected-candidates"],
    queryFn: () => apiFetch("/admin/reports/rejected-candidates"),
    ...opts?.query,
  });
}

export function useAdminDashboard(opts?: QueryOpts<unknown>) {
  return useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: () => apiFetch("/admin/dashboard"),
    ...opts?.query,
  });
}

export function useAdminAuditLog(opts?: QueryOpts<unknown>) {
  return useQuery({
    queryKey: getAdminAuditLogQueryKey(),
    queryFn: () => apiFetch("/admin/audit"),
    ...opts?.query,
  });
}

export function useAdminGetApplicationSettings(pollId: string, opts?: QueryOpts<unknown>) {
  return useQuery({
    queryKey: opts?.query?.queryKey ?? getAdminApplicationSettingsQueryKey(pollId),
    queryFn: () => apiFetch(`/admin/polls/${pollId}/application-settings`),
    enabled: Boolean(pollId),
    ...opts?.query,
  });
}

export function useGetPollDetailsAdmin(pollId: string, opts?: QueryOpts<unknown>) {
  return useGetPollDetails(pollId, opts);
}

export function useStudentLogin() {
  return useMutation({
    mutationFn: ({ data }: { data: { identifier: string; password: string } }) =>
      apiFetch("/auth/login", { method: "POST", body: JSON.stringify(data) }),
  });
}

export function useAdminLogin() {
  return useMutation({
    mutationFn: ({ data }: { data: { email: string; password: string } }) =>
      apiFetch("/admin/login", { method: "POST", body: JSON.stringify(data) }),
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: ({ data }: { data: { email: string } }) =>
      apiFetch("/auth/forgot-password", { method: "POST", body: JSON.stringify(data) }),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: ({ data }: { data: { email: string; otp: string; newPassword: string } }) =>
      apiFetch("/auth/reset-password", { method: "POST", body: JSON.stringify(data) }),
  });
}

export function useCastVote() {
  return useMutation({
    mutationFn: ({ pollId, data }: { pollId: string; data: { selections: Array<{ seatId: string; candidateId: string; encryptedPayload: string }> } }) =>
      apiFetch(`/polls/${pollId}/vote`, { method: "POST", body: JSON.stringify(data) }),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: ({ data }: { data: { currentPassword: string; newPassword: string } }) =>
      apiFetch("/profile/change-password", { method: "POST", body: JSON.stringify(data) }),
  });
}

export function useApplyCandidate() {
  return useMutation({
    mutationFn: ({ data }: { data: { pollId: string; seatId: string; manifesto: string; slogan?: string; bio?: string } }) =>
      apiFetch("/candidates/apply", { method: "POST", body: JSON.stringify(data) }),
  });
}

export function useUploadCandidateDocument() {
  return useMutation({
    mutationFn: ({ candidateId, data }: { candidateId: string; data: { documentName: string; documentType: string; fileData: string; fileName: string } }) =>
      apiFetch(`/candidates/${candidateId}/upload-document`, { method: "POST", body: JSON.stringify(data) }),
  });
}

export function useAdminCreatePoll() {
  return useMutation({
    mutationFn: ({ data }: { data: Record<string, unknown> }) =>
      apiFetch("/admin/polls", { method: "POST", body: JSON.stringify(data) }),
  });
}

export function useAdminUpdatePoll() {
  return useMutation({
    mutationFn: ({ pollId, data }: { pollId: string; data: Record<string, unknown> }) =>
      apiFetch(`/admin/polls/${pollId}`, { method: "PUT", body: JSON.stringify(data) }),
  });
}

export function useAdminLockPoll() {
  return useMutation({
    mutationFn: ({ pollId }: { pollId: string }) =>
      apiFetch(`/admin/polls/${pollId}/lock`, { method: "POST", body: JSON.stringify({}) }),
  });
}

export function useAdminUnlockPoll() {
  return useMutation({
    mutationFn: ({ pollId }: { pollId: string }) =>
      apiFetch(`/admin/polls/${pollId}/unlock`, { method: "POST", body: JSON.stringify({}) }),
  });
}

export function useAdminDeletePoll() {
  return useMutation({
    mutationFn: ({ pollId }: { pollId: string }) =>
      apiFetch(`/admin/polls/${pollId}`, { method: "DELETE" }),
  });
}

export function useAdminOpenApplicationWindow() {
  return useMutation({
    mutationFn: ({ pollId, data }: { pollId: string; data?: { timerDurationMinutes?: number } }) =>
      apiFetch(`/admin/polls/${pollId}/open-applications`, { method: "POST", body: JSON.stringify(data ?? {}) }),
  });
}

export function useAdminCloseApplicationWindow() {
  return useMutation({
    mutationFn: ({ pollId }: { pollId: string }) =>
      apiFetch(`/admin/polls/${pollId}/close-applications`, { method: "POST", body: JSON.stringify({}) }),
  });
}

export function useAdminApproveUser() {
  return useMutation({
    mutationFn: ({ userId }: { userId: string }) =>
      apiFetch(`/admin/users/${userId}/approve`, { method: "POST", body: JSON.stringify({}) }),
  });
}

export function useAdminDisableUser() {
  return useMutation({
    mutationFn: ({ userId }: { userId: string }) =>
      apiFetch(`/admin/users/${userId}/disable`, { method: "POST", body: JSON.stringify({}) }),
  });
}

export function useAdminPromoteUser() {
  return useMutation({
    mutationFn: ({ userId }: { userId: string }) =>
      apiFetch(`/admin/users/${userId}/promote`, { method: "POST", body: JSON.stringify({}) }),
  });
}

export function useAdminRemoveVoter() {
  return useMutation({
    mutationFn: ({ userId }: { userId: string }) =>
      apiFetch(`/admin/users/${userId}`, { method: "DELETE" }),
  });
}

export function useAdminApproveCandidate() {
  return useMutation({
    mutationFn: ({ candidateId }: { candidateId: string }) =>
      apiFetch(`/admin/candidates/${candidateId}/approve`, { method: "POST", body: JSON.stringify({}) }),
  });
}

export function useAdminRejectCandidate() {
  return useMutation({
    mutationFn: ({ candidateId, data }: { candidateId: string; data?: { reason?: string } }) =>
      apiFetch(`/admin/candidates/${candidateId}/reject`, { method: "POST", body: JSON.stringify(data ?? {}) }),
  });
}

export function useAdminAddCandidate() {
  return useMutation({
    mutationFn: ({ data }: { data: { pollId: string; seatId: string; userId: string; manifesto: string } }) =>
      apiFetch("/admin/candidates", { method: "POST", body: JSON.stringify(data) }),
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: ({ data }: { data: { name: string; email: string; password: string; gender: string; courseId: string; hostelId?: string; registrationNumber?: string } }) =>
      apiFetch("/auth/register", { method: "POST", body: JSON.stringify(data) }),
  });
}

export function useVerifyOtp() {
  return useMutation({
    mutationFn: ({ data }: { data: { email: string; otp: string } }) =>
      apiFetch("/auth/verify-otp", { method: "POST", body: JSON.stringify(data) }),
  });
}

export function useResendOtp() {
  return useMutation({
    mutationFn: ({ data }: { data: { email: string } }) =>
      apiFetch("/auth/resend-otp", { method: "POST", body: JSON.stringify(data) }),
  });
}

export function usePrefillRegistration() {
  return useMutation({
    mutationFn: ({ email, regNumber }: { email?: string; regNumber?: string }) => {
      const params = new URLSearchParams();
      if (email) params.set("email", email);
      if (regNumber) params.set("regNumber", regNumber);
      return apiFetch(`/auth/prefill?${params.toString()}`);
    },
  });
}
