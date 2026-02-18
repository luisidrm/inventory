export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignUpRequest {
  fullName: string;
  email: string;
  password: string;
  confirmationPassword: string;
  birthday: string;
  gender: number;
  phone?: string;
  organizationId?: number;
}

export interface CreateOrganizationRequest {
  name: string;
  code: string;
}

export interface UserResponse {
  id: number;
  birthDate: string;
  fullName: string;
  identity: string;
  genderId: number;
  gender: string;
  email: string;
  phone: string;
  statusId: number;
  status: string;
  locationId?: number;
  organizationId?: number;
  roleId?: number;
  location?: LocationResponse;
  organization?: OrganizationResponse;
}
export interface LoginResponse {
  result: UserResponse;
  statusCode: number;
  customStatusCode: number;
}

export interface OrganizationResponse {
  result: {
    id: number;
    name: string;
    code: string;
    description?: string;
    createdAt: string;
    modifiedAt: string;
  },
  statusCode: number;
  customStatusCode: number;
}

export interface LocationResponse {
  id: number;
  organizationId: number;
  organizationName?: string;
  name: string;
  code: string;
  description?: string;
  createdAt: string;
  modifiedAt: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}
