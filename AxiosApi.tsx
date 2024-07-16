/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @fileoverview This file contains functions related to user authentication and chat interactions using Axios.
 * @module ChatBotService
 */

// Axios import
import axios, {
  AxiosHeaders,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

// API Constants import
import {
  CreateUserParams,
  GetConversationListParams,
  LoginParams,
  SignupParams,
  UpdateUserParams,
  setPasswordParams,
  updateConversationAPIParams,
} from "../types/globalTypes";

import EventEmitter from "events";

/**
 * The base URL for the API.
 * @type {string}
 */
const URL = import.meta.env.VITE_REACT_API_URL;

/**
 * The check for whether the workflow is the Excel workflow.
 * @type {string}
 */
// const EXCEL_WORKFLOW = import.meta.env.VITE_IS_PUBLIC;

/**
 * The check for whether the workflow is the PDF workflow.
 * @type {string}
 */
// const PDF_WORKFLOW = import.meta.env.VITE_IS_PDF;

/**
 * Represents the parameters required for making chat-related requests.
 * @typedef {Object} ChatsParams
 * @property {string} user_id - The user ID.
 * @property {string} type - The type of chat.
 * @property {string} question - The chat question or query.
 */

/**
 * Performs user login and stores the obtained user ID in the local storage.
 * @async
 * @function
 * @returns {Promise<string>} A Promise that resolves to a string indicating the login status.
 * @throws {string} If an error occurs during the login process.
 */

interface ChatsParams {
  question: string;
  conv_id?: string;
}

export interface ChatsData {
  user_id?: string;
  chat_id?: string;
  sql_query?: string;
}

export interface QuestionData {
  user_id?: string;
  chat_id?: string;
  sig_response?: string;
}

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  useToken?: boolean;
}

interface CustomSuccessResponse<T = any> {
  success: boolean;
  data: T;
  error_message?: string;
  message_type?: string;
}

interface CustomErrorResponse {
  success: boolean;
  error_message: string;
  message_type: string;
}

const eventEmitter = new EventEmitter();

export const navigateTo = (path: string): void => {
  eventEmitter.emit("navigate", path);
};

export const listenToNavigation = (callback: (path: string) => void): void => {
  eventEmitter.on("navigate", callback);
};

export const removeNavigationListener = (
  callback: (path: string) => void
): void => {
  eventEmitter.removeListener("navigate", callback);
};

class ApiService {
  private axiosInstance: AxiosInstance;
  private URL: string;

  constructor() {
    this.URL = import.meta.env.VITE_REACT_API_URL;

    this.axiosInstance = axios.create({
      baseURL: this.URL,
    });

    this.axiosInstance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const customConfig = config as CustomAxiosRequestConfig;
        if (customConfig.useToken !== false) {
          const token = localStorage.getItem("token");
          if (token) {
            config.headers = config.headers || new AxiosHeaders();
            config.headers.set("Authorization", `Bearer ${token}`);
          }
        }
        return config;
      }
    );

    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => this.handleApiError(error)
    );
  }

  private handleApiError(error: unknown): CustomErrorResponse {
    console.error(error);
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        navigateTo("/");
        throw {
          success: false,
          error_message: "Your session has expired. Please login again.",
          message_type: "invalid_credentials",
        };
      }
      throw {
        success: false,
        error_message:
          error.response?.data.error_message || "An error occurred",
        message_type: error.response?.data.message_type || "error",
      };
    }
    throw {
      success: false,
      error_message: "An unexpected error occurred.",
      message_type: "unexpected_error",
    };
  }

  public async request(
    method: string,
    url: string,
    data?: unknown,
    useToken: boolean = true,
    contentType: string = "application/json"
  ): Promise<CustomSuccessResponse> {
    const headers: AxiosHeaders = new AxiosHeaders();
    headers.set("Content-Type", contentType);
    const config: CustomAxiosRequestConfig = {
      method,
      url,
      data,
      headers,
      useToken,
    };

    try {
      const response: AxiosResponse = await this.axiosInstance(config);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      throw this.handleApiError(error);
    }
  }
}

const apiService = new ApiService();
/**
 * Performs the user login and stores the access token and the user ID in the local storage.
 * @async
 * @function
 * @param {LoginParams} data - The data containing the email and password.
 */
export const login = async (data: LoginParams) => {
  const endpoint = "api/public/login";
  return apiService.request("POST", endpoint, data);
};

/**
 * Sends a chat request with the provided data and returns the response.
 * @async
 * @function
 * @param {ChatsParams} data - The data containing user ID, chat type, and question.
 * @returns {Promise<{ success: boolean, data?: any, error?: string }>} A Promise containing the chat response.
 * @throws {string} If an error occurs during the chat request.
 */

export const chats = async (data: ChatsParams) => {
  const user_id = localStorage.getItem("user_id");
  const endpoint = `api/public/users/${user_id}/pdf-chats`;
  return apiService.request("POST", endpoint, data);
};

/**
 * Updates the SQL query for the provided chat ID.
 * @async
 * @function
 * @param {ChatsData} data - The data containing the chat ID and SQL query.
 */
export const updateChat = async (data: ChatsData) => {
  const endpoint = `api/public/chats`;
  return apiService.request("PATCH", endpoint, data);
  // try {
  //   const token = localStorage.getItem('token');
  //   const res = await axios.patch(`${URL}api/public/chats`, data, {
  //     headers: {
  //       'Content-Type': 'application/json',
  //       Authorization: `Bearer ${token}`
  //     }
  //   });

  //   return res.data;
  // } catch (error: unknown) {
  //   console.log('Error while updating', error);

  //   if (axios.isAxiosError(error)) {
  //     if (error.response?.status === 401) {
  //       localStorage.removeItem('token');

  //       return {
  //         success: false,
  //         error_message: 'Your session has expired. Please login again.',
  //         message_type: 'invalid_credentials'
  //       };
  //     }

  //     return {
  //       success: false,
  //       error_message: error.response?.data.error_message,
  //       message_type: error.response?.data.message_type
  //     };
  //   } else {
  //     // Handle other types of errors here
  //     return {
  //       success: false,
  //       error_message: 'An unexpected error occurred.',
  //       message_type: 'unexpected_error'
  //     };
  //   }
  // }
};

/**
 * Updates the formatted question for the provided chat ID.
 * @async
 * @function
 * @param {QuestionData} data - The data containing the chat ID and formatted question.
 */
export const updateFormattedQuestion = async (data: QuestionData) => {
  const endpoint = `api/public/chats`;
  return apiService.request("PATCH", endpoint, data);
  // try {
  //   const token = localStorage.getItem('token');
  //   const res = await axios.patch(`${URL}api/public/chats`, data, {
  //     headers: {
  //       'Content-Type': 'application/json',
  //       Authorization: `Bearer ${token}`
  //     }
  //   });
  //   return res.data;
  // } catch (error: unknown) {
  //   console.log('Error while updating', error);

  //   if (axios.isAxiosError(error)) {
  //     if (error.response?.status === 401) {
  //       localStorage.removeItem('token');
  //       return {
  //         success: false,
  //         error_message: 'Your session has expired. Please login again.',
  //         message_type: 'invalid_credentials'
  //       };
  //     }

  //     return {
  //       success: false,
  //       error_message: error.response?.data.error_message,
  //       message_type: error.response?.data.message_type
  //     };
  //   } else {
  //     // Handle other types of errors here
  //     return {
  //       success: false,
  //       error_message: 'An unexpected error occurred.',
  //       message_type: 'unexpected_error'
  //     };
  //   }
  // }
};

/**
 * Fetches the user details for the provided user ID.
 * @function getUserDetailsById
 * @param {string} id - The user ID.
 * @returns {Promise<{ success: boolean, data?: any, error?: string }>} A Promise containing the user details.
 */
export const getUserDetailsById = async (id: string) => {
  const endpoint = `api/public/user/${id}`;
  return apiService.request("GET", endpoint);
  // const token = localStorage.getItem('token');
  // try {
  //   const res = await axios.get(`${URL}api/public/user/${id}`, {
  //     headers: {
  //       'Content-Type': 'application/json',
  //       Authorization: `Bearer ${token}`
  //     }
  //   });

  //   if (res.status === 200 || res.status === 201) {
  //     return {
  //       success: true,
  //       data: res.data
  //     };
  //   }
  // } catch (error) {
  //   console.log('Error while fetching', error);
  //   if (axios.isAxiosError(error)) {
  //     if (error.response?.status === 401) {
  //       localStorage.removeItem('token');
  //       return {
  //         success: false,
  //         error_message: 'Your session has expired. Please login again.',
  //         message_type: 'invalid_credentials'
  //       };
  //     }

  //     return {
  //       success: false,
  //       error_message: error.response?.data.error_message,
  //       message_type: error.response?.data.message_type
  //     };
  //   } else {
  //     // Handle other types of errors here
  //     return {
  //       success: false,
  //       error_message: 'An unexpected error occurred.',
  //       message_type: 'unexpected_error'
  //     };
  //   }
  // }
};

/**
 * Fetches the user details for all the users.
 * @function getUsers
 * @returns {Promise<{ success: boolean, data?: any, error?: string }>} A Promise containing the user details.
 */
export const getUsers = async () => {
  const endpoint = `api/public/users`;
  return apiService.request("GET", endpoint);
  // const token = localStorage.getItem('token');
  // try {
  //   const res = await axios.get(`${URL}api/public/users`, {
  //     headers: {
  //       'Content-Type': 'application/json',
  //       Authorization: `Bearer ${token}`
  //     }
  //   });

  //   if (res.status === 200 || res.status === 201) {
  //     return {
  //       success: true,
  //       data: res.data
  //     };
  //   }
  // } catch (error) {
  //   console.log('Error while fetching', error);
  //   if (axios.isAxiosError(error)) {
  //     if (error.response?.status === 401) {
  //       localStorage.removeItem('token');
  //       return {
  //         success: false,
  //         error_message: 'Your session has expired. Please login again.',
  //         message_type: 'invalid_credentials'
  //       };
  //     }

  //     return {
  //       success: false,
  //       error_message: error.response?.data.error_message,
  //       message_type: error.response?.data.message_type
  //     };
  //   } else {
  //     // Handle other types of errors here
  //     return {
  //       success: false,
  //       error_message: 'An unexpected error occurred.',
  //       message_type: 'unexpected_error'
  //     };
  //   }
  // }
};

/**
 * Updates the user details for the provided user ID.
 * @function updateUser
 * @param {UpdateUserParams} data - The data containing user ID, chat type, and question.
 * @returns {Promise<{ success: boolean, data?: any, error?: string }>} A Promise containing the user details.
 */
export const updateUser = async (data: UpdateUserParams) => {
  const user_id = localStorage.getItem("user_id");
  const endpoint = `api/users/${user_id}`;
  return apiService.request("PATCH", endpoint, data);
  // try {
  //   const token = localStorage.getItem('token');
  //   const res = await axios.patch(`${URL}api/users/${user_id}`, data, {
  //     headers: {
  //       'Content-Type': 'application/json',
  //       Authorization: `Bearer ${token}`
  //     }
  //   });

  //   if (res.status === 200 || res.status === 201) {
  //     return {
  //       success: true,
  //       data: res.data
  //     };
  //   }
  // } catch (error) {
  //   console.log('Error while fetching', error);
  //   if (axios.isAxiosError(error)) {
  //     if (error.response?.status === 401) {
  //       localStorage.removeItem('token');
  //       return {
  //         success: false,
  //         error_message: 'Your session has expired. Please login again.',
  //         message_type: 'invalid_credentials'
  //       };
  //     }

  //     return {
  //       success: false,
  //       error_message: error.response?.data.error_message,
  //       message_type: error.response?.data.message_type
  //     };
  //   } else {
  //     // Handle other types of errors here
  //     return {
  //       success: false,
  //       error_message: 'An unexpected error occurred.',
  //       message_type: 'unexpected_error'
  //     };
  //   }
  // }
};

/**
 * Creates a new user with the provided data.
 * @function createUsers
 * @param {CreateUserParams} data - The data containing the email, username, password, and role of the user.
 * @returns {Promise<{ success: boolean, data?: any, error?: string }>} A Promise containing the user details.
 */
export const createUsers = async (data: CreateUserParams) => {
  const endpoint = `api/public/users`;
  return apiService.request("POST", endpoint, data);
  // const token = localStorage.getItem('token');
  // try {
  //   const res = await axios.post(`${URL}api/public/users`, data, {
  //     headers: {
  //       'Content-Type': 'application/json',
  //       Authorization: `Bearer ${token}`
  //     }
  //   });

  //   if (res.status === 200 || res.status === 201) {
  //     return {
  //       success: true,
  //       data: res.data
  //     };
  //   }
  // } catch (error) {
  //   console.log('Error while fetching', error);
  //   if (axios.isAxiosError(error)) {
  //     if (error.response?.status === 401) {
  //       localStorage.removeItem('token');
  //       return {
  //         success: false,
  //         error_message: 'Your session has expired. Please login again.',
  //         message_type: 'invalid_credentials'
  //       };
  //     }

  //     return {
  //       success: false,
  //       error_message: error.response?.data.error_message,
  //       message_type: error.response?.data.message_type
  //     };
  //   } else {
  //     // Handle other types of errors here
  //     return {
  //       success: false,
  //       error_message: 'An unexpected error occurred.',
  //       message_type: 'unexpected_error'
  //     };
  //   }
  // }
};

/**
 * Creates a new conversation.
 * @function createNewConversation
 */
export const createNewConversation = async () => {
  const endpoint = `api/public/conversations`;
  return apiService.request("POST", endpoint, {});
  // const token = localStorage.getItem('token');
  // try {
  //   const res = await axios.post(
  //     `${URL}api/public/conversations`,
  //     {},
  //     {
  //       headers: {
  //         'Content-Type': 'application/json',
  //         Authorization: `Bearer ${token}`
  //       }
  //     }
  //   );

  //   if (res.status === 200 || res.status === 201) {
  //     return {
  //       success: true,
  //       data: res.data
  //     };
  //   }
  // } catch (error) {
  //   console.log('Error while fetching', error);
  //   if (axios.isAxiosError(error)) {
  //     if (error.response?.status === 401) {
  //       localStorage.removeItem('token');
  //       return {
  //         success: false,
  //         error_message: 'Your session has expired. Please login again.',
  //         message_type: 'invalid_credentials'
  //       };
  //     }

  //     return {
  //       success: false,
  //       error_message: error.response?.data.error_message,
  //       message_type: error.response?.data.message_type
  //     };
  //   } else {
  //     // Handle other types of errors here
  //     return {
  //       success: false,
  //       error_message: 'An unexpected error occurred.',
  //       message_type: 'unexpected_error'
  //     };
  //   }
  // }
};

/**
 * Fetches the conversation list for the user.
 * @function getConversations
 * @param {GetConversationListParams} data - The data containing the page number and page size.
 */
export const getConversations = async (data?: GetConversationListParams) => {
  const user_id = localStorage.getItem("user_id");
  const endpoint = `api/public/users/${user_id}/conversations`;
  return apiService.request("GET", endpoint, data);
  // const token = localStorage.getItem('token');
  // try {
  //   const res = await axios.get(`${URL}api/public/users/${user_id}/conversations`, {
  //     headers: {
  //       'Content-Type': 'application/json',
  //       Authorization: `Bearer ${token}`
  //     },
  //     params: data
  //   });

  //   if (res.status === 200 || res.status === 201) {
  //     return {
  //       success: true,
  //       data: res.data
  //     };
  //   }
  // } catch (error) {
  //   console.log('Error while fetching', error);
  //   if (axios.isAxiosError(error)) {
  //     if (error.response?.status === 401) {
  //       localStorage.removeItem('token');
  //       return {
  //         success: false,
  //         error_message: 'Your session has expired. Please login again.',
  //         message_type: 'invalid_credentials'
  //       };
  //     }
  //     if (error.response?.status === 404) {
  //       return {
  //         success: false,
  //         error_message: 'No conversations found.',
  //         message_type: 'no_conversations_found'
  //       };
  //     }
  //     return {
  //       success: false,
  //       error_message: error.response?.data.error_message,
  //       message_type: error.response?.data.message_type
  //     };
  //   } else {
  //     return {
  //       success: false,
  //       error_message: 'An unexpected error occurred.',
  //       message_type: 'unexpected_error'
  //     };
  //   }
  // }
};

/**
 * Fetches the conversation details for the provided conversation ID.
 * @function getConversationById
 * @param {string} id - The conversation ID.
 */
export const getChatsByConversationId = async (id: string) => {
  const endpoint = `api/public/conversations/${id}/chats`;
  return apiService.request("GET", endpoint);
  // const token = localStorage.getItem('token');
  // try {
  //   const res = await axios.get(`${URL}api/public/conversations/${id}/chats`, {
  //     headers: {
  //       'Content-Type': 'application/json',
  //       Authorization: `Bearer ${token}`
  //     }
  //   });

  //   if (res.status === 200 || res.status === 201) {
  //     return {
  //       success: true,
  //       data: res.data
  //     };
  //   } else {
  //     return {
  //       success: false,
  //       error: 'Server Error'
  //     };
  //   }
  // } catch (error) {
  //   console.log('Error while fetching', error);
  //   if (axios.isAxiosError(error)) {
  //     if (error.response?.status === 401) {
  //       localStorage.removeItem('token');
  //       return {
  //         success: false,
  //         error_message: 'Your session has expired. Please login again.',
  //         message_type: 'invalid_credentials'
  //       };
  //     }
  //     if (error.response?.status === 404) {
  //       return {
  //         success: false,
  //         error_message: 'No conversations found.',
  //         message_type: 'no_conversations_found'
  //       };
  //     }
  //     return {
  //       success: false,
  //       error_message: error.response?.data.error_message,
  //       message_type: error.response?.data.message_type
  //     };
  //   } else {
  //     return {
  //       success: false,
  //       error_message: 'An unexpected error occurred.',
  //       message_type: 'unexpected_error'
  //     };
  //   }
  // }
};

/**
 * Updates the conversation details for the provided conversation ID.
 * @function updateConversation
 * @param {updateConversationAPIParams} params - The data containing the conversation ID and name.
 */
export const updateConversation = async (
  params: updateConversationAPIParams
) => {
  const user_id = localStorage.getItem("user_id");
  const endpoint = `api/public/users/${user_id}/conversations/${params.id}`;
  const data = {
    name: params.name,
  };
  return apiService.request("PATCH", endpoint, data);
  // const token = localStorage.getItem('token');
  // try {
  //   const data = {
  //     name: params.name
  //   };
  //   const res = await axios.patch(
  //     `${URL}api/public/users/${user_id}/conversations/${params.id}`,
  //     data,
  //     {
  //       headers: {
  //         'Content-Type': 'application/json',
  //         Authorization: `Bearer ${token}`
  //       }
  //     }
  //   );

  //   if (res.status === 200 || res.status === 201) {
  //     return {
  //       success: true,
  //       data: res.data
  //     };
  //   } else {
  //     return {
  //       success: false,
  //       error: 'Server Error'
  //     };
  //   }
  // } catch (error) {
  //   console.log('Error while fetching', error);
  //   if (axios.isAxiosError(error)) {
  //     if (error.response?.status === 401) {
  //       localStorage.removeItem('token');
  //       return {
  //         success: false,
  //         error_message: 'Your session has expired. Please login again.',
  //         message_type: 'invalid_credentials'
  //       };
  //     }
  //     if (error.response?.status === 404) {
  //       return {
  //         success: false,
  //         error_message: 'No conversations found.',
  //         message_type: 'no_conversations_found'
  //       };
  //     }
  //     return {
  //       success: false,
  //       error_message: error.response?.data.error_message,
  //       message_type: error.response?.data.message_type
  //     };
  //   } else {
  //     return {
  //       success: false,
  //       error_message: 'An unexpected error occurred.',
  //       message_type: 'unexpected_error'
  //     };
  //   }
  // }
};

/**
 * Archives the conversation for the provided conversation ID.
 * @function archiveConversation
 * @param {string} id - The conversation ID.
 * @async
 */
export const archiveConversation = async (id: string) => {
  const endpoint = `api/public/conversations/${id}/archive`;
  return apiService.request("PATCH", endpoint, {});
  // try {
  //   const token = localStorage.getItem('token');
  //   const res = await axios.patch(
  //     `${URL}api/public/conversations/${id}/archive`,
  //     {},
  //     {
  //       headers: {
  //         'Content-Type': 'application/json',
  //         Authorization: `Bearer ${token}`
  //       }
  //     }
  //   );

  //   const status = res?.status || 500;

  //   if (status === 200 || status === 201) {
  //     return {
  //       success: true,
  //       data: res.data
  //     };
  //   } else {
  //     return {
  //       success: false,
  //       error: 'Server Error'
  //     };
  //   }
  // } catch (error) {
  //   console.error('Error while fetching', error);

  //   // Use type guards or assertions to narrow down the type
  //   if (axios.isAxiosError(error)) {
  //     if (error.response?.status === 401) {
  //       localStorage.removeItem('token');
  //       return {
  //         success: false,
  //         error_message: 'Your session has expired. Please login again.',
  //         message_type: 'invalid_credentials'
  //       };
  //     }

  //     return {
  //       success: false,
  //       error_message: error.response?.data.error_message,
  //       message_type: error.response?.data.message_type
  //     };
  //   } else {
  //     // Handle other types of errors here
  //     return {
  //       success: false,
  //       error_message: 'An unexpected error occurred.',
  //       message_type: 'unexpected_error'
  //     };
  //   }
  // }
};

/**
 * Get the PDF file data.
 * @function getFileID
 * @param {FormData} params - The data containing the PDF file.
 * @async
 */
export const getFileID = async () => {
  const user_id = localStorage.getItem("user_id");
  const endpoint = `api/public/users/${user_id}/get-file-id`;
  return apiService.request("GET", endpoint);
  // const token = localStorage.getItem('token');

  // try {
  //   const res = await axios.get(`${URL}api/public/users/${user_id}/get-file-id`, {
  //     headers: {
  //       accept: 'application/json',
  //       Authorization: `Bearer ${token}`
  //     }
  //   });
  //   if (res.status === 200 || res.status === 201 || res.status === 204) {
  //     return {
  //       success: true,
  //       data: res.data
  //     };
  //   }
  // } catch (error) {
  //   console.log('Error while fetching', error);
  //   if (axios.isAxiosError(error)) {
  //     if (error.response?.status === 401) {
  //       localStorage.removeItem('token');
  //       return {
  //         success: false,
  //         error_message: 'Your session has expired. Please login again.',
  //         message_type: 'invalid_credentials'
  //       };
  //     }

  //     return {
  //       success: false,
  //       error_message: error.response?.data.error_message,
  //       message_type: error.response?.data.message_type
  //     };
  //   } else {
  //     // Handle other types of errors here
  //     return {
  //       success: false,
  //       error_message: 'An unexpected error occurred.',
  //       message_type: 'unexpected_error'
  //     };
  //   }
  // }
};

/**
 * Uploads the PDF file to the server.
 * @function pdfUpload
 * @param {FormData} params - The data containing the PDF file.
 * @async
 */
export const pdfUpload = async (params: FormData) => {
  const user_id = localStorage.getItem("user_id");
  const endpoint = `api/public/users/${user_id}/pdf-upload`;
  return apiService.request(
    "POST",
    endpoint,
    params,
    true,
    "multipart/form-data"
  );
  // const token = localStorage.getItem('token');

  // try {
  //   const res = await axios.post(`${URL}api/public/users/${user_id}/pdf-upload`, params, {
  //     headers: {
  //       'Content-Type': 'multipart/form-data',
  //       accept: 'application/json',
  //       Authorization: `Bearer ${token}`
  //     }
  //   });
  //   if (res.status === 200 || res.status === 201 || res.status === 204) {
  //     return {
  //       success: true,
  //       data: res.data
  //     };
  //   }
  // } catch (error) {
  //   console.log('Error while fetching', error);
  //   if (axios.isAxiosError(error)) {
  //     if (error.response?.status === 401) {
  //       localStorage.removeItem('token');
  //       return {
  //         success: false,
  //         error_message: 'Your session has expired. Please login again.',
  //         message_type: 'invalid_credentials'
  //       };
  //     }

  //     return {
  //       success: false,
  //       error_message: error.response?.data.error_message,
  //       message_type: error.response?.data.message_type
  //     };
  //   } else {
  //     // Handle other types of errors here
  //     return {
  //       success: false,
  //       error_message: 'An unexpected error occurred.',
  //       message_type: 'unexpected_error'
  //     };
  //   }
  // }
};

/**
 * Uploads the PDF file to the server.
 * @function pdfUploadUpdateFile
 * @param {FormData} params - The data containing the PDF file.
 * @async
 */
export const pdfUploadUpdateFile = async (params: FormData) => {
  const user_id = localStorage.getItem("user_id");
  const endpoint = `api/public/users/${user_id}/pdf-upload`;
  return apiService.request(
    "PATCH",
    endpoint,
    params,
    true,
    "multipart/form-data"
  );
  // const token = localStorage.getItem('token');

  // try {
  //   const res = await axios.patch(`${URL}api/public/users/${user_id}/pdf-upload`, params, {
  //     headers: {
  //       'Content-Type': 'multipart/form-data',
  //       accept: 'application/json',
  //       Authorization: `Bearer ${token}`
  //     }
  //   });

  //   if (res.status === 200 || res.status === 201 || res.status === 204) {
  //     return {
  //       success: true,
  //       data: res.data
  //     };
  //   }
  // } catch (error) {
  //   console.log('Error while fetching', error);
  //   if (axios.isAxiosError(error)) {
  //     if (error.response?.status === 401) {
  //       localStorage.removeItem('token');
  //       return {
  //         success: false,
  //         error_message: 'Your session has expired. Please login again.',
  //         message_type: 'invalid_credentials'
  //       };
  //     }

  //     return {
  //       success: false,
  //       error_message: error.response?.data.error_message,
  //       message_type: error.response?.data.message_type
  //     };
  //   } else {
  //     // Handle other types of errors here
  //     return {
  //       success: false,
  //       error_message: 'An unexpected error occurred.',
  //       message_type: 'unexpected_error'
  //     };
  //   }
  // }
};

/**
 * Submits the Password that was set by the user.
 * @param {string} shortLivedToken - The short lived token.
 */
export const setUserPassword = async (params: setPasswordParams) => {
  try {
    const res = await axios.post(
      `${URL}api/public/set-password`,
      {
        password: params.password,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${params.shortLivedToken}`,
        },
      }
    );

    if (res.status === 200 || res.status === 201) {
      return {
        success: true,
        data: res.data,
      };
    }
  } catch (error) {
    console.log("Error while fetching", error);
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        return {
          success: false,
          error_message: "Your session has expired. Please login again.",
          message_type: "invalid_credentials",
        };
      }

      return {
        success: false,
        error_message: error.response?.data.error_message,
        message_type: error.response?.data.message_type,
      };
    } else {
      return {
        success: false,
        error_message: "An unexpected error occurred.",
        message_type: "unexpected_error",
      };
    }
  }
};

/**
 * Sign up API.
 * @function signup
 * @param {SignupProps} param - Data for the sign up.
 */
export const signup = async (param: SignupParams) => {
  const endpoint = `api/public/signup`;
  return apiService.request("POST", endpoint, param, false);
};

/**
 * pdf list API.
 * @function pdfList
 * @async
 */
export const pdfList = async () => {
  const user_id = localStorage.getItem("user_id");
  const endpoint = `api/public/users/${user_id}/get-pdfs`;
  return apiService.request("GET", endpoint);
  // return apiService.request('GET', endpoint, {}, true, 'multipart/form-data');
};

/**
 * Delete the PDF file from the server.
 * @function pdfDelete
 * @param {string[]} params - Array of PDF ids to delete.
 * @async
 */
export const pdfDelete = async (params: string[]) => {
  const user_id = localStorage.getItem("user_id");
  const endpoint = `api/public/users/${user_id}/delete-pdfs`;
  const data = { pdf_ids: params };
  return apiService.request("DELETE", endpoint, data);
};

/**
 * Provides list of all the views or sheets for the data dictionary.
 * @function staticData
 * @async
 */
export const staticData = async (data_source_id: string) => {
  const user_id = localStorage.getItem("user_id");
  const endpoint = `api/public/users/${user_id}/data-sources/${data_source_id}/data-dictionary`;
  return apiService.request("GET", endpoint);
};
