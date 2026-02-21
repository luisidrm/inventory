import { createApi } from '@reduxjs/toolkit/query/react';
import baseQueryWithReauth, { saveToken, saveRefreshToken } from '@/lib/baseQuery';
import type {
  LoginRequest,
  CreateOrganizationRequest,
  UserResponse,
  OrganizationResponse,
  ApiResponse,
} from '@/lib/auth-types';

export interface RegisterWithOrganizationRequest {
  organizationName: string;
  fullName: string;
  email: string;
  password: string;
  confirmationPassword: string;
  birthday: string;
  gender: number;
  phone?: string;
  organizationId?: number;
}

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User', 'Organization'],
  endpoints: (builder) => ({
    login: builder.mutation<ApiResponse<UserResponse>, LoginRequest>({
      query: (credentials) => ({
        url: '/account/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['User'],
    }),

    register: builder.mutation<void, {
      FullName: string;
      Email: string;
      Password: string;
      ConfirmationPassword: string;
      Birthday: string;
      Gender: number;
      Phone?: string;
      OrganizationId?: number;
    }>({
      query: (body) => ({
        url: '/account/register',
        method: 'POST',
        body,
      }),
    }),
    regiterWithOrganization: builder.mutation<void, RegisterWithOrganizationRequest>({
      query: (body) => ({
        url: '/account/register-with-organization',
        method: 'POST',
        body,
      }),
    }),
    createOrganization: builder.mutation<OrganizationResponse, CreateOrganizationRequest>({
      query: (data) => ({
        url: '/organization',
        method: 'POST',
        body: { Name: data.name, Code: data.code },
      }),
      invalidatesTags: ['Organization'],
    }),

    refreshToken: builder.mutation<void, { refreshToken: string }>({
      query: (body) => ({
        url: '/account/refresh',
        method: 'POST',
        body,
      }),
    }),

    logout: builder.mutation<void, void>({
      queryFn: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
        }
        return { data: undefined };
      },
      invalidatesTags: ['User'],
    }),
    resetPassword: builder.mutation<void, { email: string }>({
      query: (body) => ({
        url: '/account/forgot-password',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useRegiterWithOrganizationMutation,
  useCreateOrganizationMutation,
  useRefreshTokenMutation,
  useLogoutMutation,
  useResetPasswordMutation
} = authApi;