import type {
  LoginRequest,
  SignUpRequest,
  CreateOrganizationRequest,
  UserResponse,
  OrganizationResponse,
  ApiResponse,
} from "./auth-types";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://inventorydevelop.us-east-2.elasticbeanstalk.com/api";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function saveToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("token", token.replace("Bearer ", ""));
}

export function saveRefreshToken(refreshToken: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("refreshToken", refreshToken);
}

export function saveUser(user: UserResponse): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("user", JSON.stringify(user));
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
}

export async function login(
  credentials: LoginRequest
): Promise<{ user: UserResponse }> {
  const res = await fetch(`${API_URL}/account/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  const token = res.headers.get("Authorization");
  const refreshToken = res.headers.get("RefreshToken");
  if (token) saveToken(token);
  if (refreshToken) saveRefreshToken(refreshToken);

  const json = (await res.json()) as ApiResponse<UserResponse>;
  if (!res.ok) {
    const msg =
      json?.message ?? (res.status === 401 ? "Email o contraseña incorrectos." : "Error al iniciar sesión.");
    throw new Error(msg);
  }
  if (json.data) {
    saveUser(json.data);
    return { user: json.data };
  }
  throw new Error("Respuesta inválida del servidor.");
}

export async function register(body: {
  FullName: string;
  Email: string;
  Password: string;
  ConfirmationPassword: string;
  Birthday: string;
  Gender: number;
  Phone?: string;
  OrganizationId?: number;
}): Promise<void> {
  const res = await fetch(`${API_URL}/account/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.message ?? "Error al registrar.");
  }
}

export async function createOrganization(
  data: CreateOrganizationRequest
): Promise<OrganizationResponse> {
  const token = getToken();
  const res = await fetch(`${API_URL}/organization`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ Name: data.name, Code: data.code }),
  });
  const json = (await res.json()) as ApiResponse<OrganizationResponse>;
  if (!res.ok) {
    throw new Error(json?.message ?? "Error al crear la organización.");
  }
  return json.data ?? (json as unknown as OrganizationResponse);
}

export async function registerWithOrganization(
  userData: SignUpRequest,
  orgData: CreateOrganizationRequest
): Promise<{ user: UserResponse }> {
  const response = await createOrganization(orgData)
  console.log(response)
  await register({
    FullName: userData.fullName,
    Email: userData.email,
    Password: userData.password,
    ConfirmationPassword: userData.confirmationPassword,
    Birthday: userData.birthday,
    Gender: userData.gender,
    ...(userData.phone ? { Phone: userData.phone } : {}),
    ...(response.result ? { OrganizationId: response.result.id } : {}),
  });

  return login({ email: userData.email, password: userData.password });
}
