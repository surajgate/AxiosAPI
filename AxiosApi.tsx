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
  InternalAxiosRequestConfig
} from 'axios';

// API Constants import
import {
  CreateUserParams,
  GetConversationListParams,
  LoginParams,
  SignupParams,
  UpdateUserParams,
  setPasswordParams,
  updateConversationAPIParams
} from '../types/globalTypes';

// Event import.
import EventEmitter from 'events';

/**
 * The base URL for the API.
 * @type {string} URL
 */
const URL = import.meta.env.VITE_REACT_API_URL;

/**
 * Represents the parameters required for making chat-related requests.
 * @type {Object} ChatsParams
 * @property {string} user_id - The user ID.
 * @property {string} type - The type of chat.
 * @property {string} question - The chat question or query.
 */
interface ChatsParams {
  question: string;
  conv_id?: string;
}

/**
 * Represents the data for a chat response.
 * @type {Object} ChatsData
 * @property {string} [user_id] - The user ID.
 * @property {string} [chat_id] - The chat ID.
 * @property {string} [sql_query] - The SQL query.
 */
export interface ChatsData {
  user_id?: string;
  chat_id?: string;
  sql_query?: string;
}

/**
 * Represents the data for a question response.
 * @type {Object} QuestionData
 * @property {string} [user_id] - The user ID.
 * @property {string} [chat_id] - The chat ID.
 * @property {string} [sig_response] - The signature response.
 */
export interface QuestionData {
  user_id?: string;
  chat_id?: string;
  sig_response?: string;
}
/**
 * Extends the InternalAxiosRequestConfig interface with an optional useToken property.
 * @interface CustomAxiosRequestConfig
 * @extends {InternalAxiosRequestConfig}
 * @property {boolean} [useToken] - Indicates whether the token should be used in the request headers.
 */
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  useToken?: boolean;
}

/**
 * Represents a custom success response from an API request.
 * @interface CustomSuccessResponse
 * @template T
 * @property {boolean} success - Indicates if the request was successful.
 * @property {T} data - The data returned from the API request.
 * @property {string} [error_message] - Optional error message if present.
 * @property {string} [message_type] - Optional message type.
 */
interface CustomSuccessResponse<T = any> {
  success: boolean;
  data: T;
  error_message?: string;
  message_type?: string;
}

/**
 * Represents a custom error response from an API request.
 * @interface CustomErrorResponse
 * @property {boolean} success - Indicates if the request was unsuccessful.
 * @property {string} error_message - The error message returned from the API request.
 * @property {string} message_type - The type of the error message.
 */
interface CustomErrorResponse {
  success: boolean;
  error_message: string;
  message_type: string;
}

/**
 * An instance of EventEmitter used for handling event-driven communication
 * within the application.
 * @type {EventEmitter}
 */
const eventEmitter: EventEmitter = new EventEmitter();

/**
 * Navigates to a specified path.
 * @function navigateTo
 * @param {string} path - The path to navigate to.
 */
export const navigateTo = (path: string): void => {
  eventEmitter.emit('navigate', path);
};

/**
 * Listens to navigation events and executes the callback when the event is triggered.
 * @function listenToNavigation
 * @param {function} callback - The callback to execute on navigation.
 */
export const listenToNavigation = (callback: (path: string) => void): void => {
  eventEmitter.on('navigate', callback);
};

/**
 * Removes the navigation listener.
 * @function removeNavigationListener
 * @param {function} callback - The callback to remove.
 */
export const removeNavigationListener = (callback: (path: string) => void): void => {
  eventEmitter.removeListener('navigate', callback);
};

/**
 * A service class for handling API requests using Axios.
 * This class provides methods to make HTTP requests while managing
 * authorization tokens and error handling.
 *
 * @class ApiService
 */
class ApiService {
  private axiosInstance: AxiosInstance;
  private URL: string;

  constructor() {
    this.URL = import.meta.env.VITE_REACT_API_URL;

    this.axiosInstance = axios.create({
      baseURL: this.URL
    });

    this.axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
      const customConfig = config as CustomAxiosRequestConfig;
      if (customConfig.useToken !== false) {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers = config.headers || new AxiosHeaders();
          config.headers.set('Authorization', `Bearer ${token}`);
        }
      }
      return config;
    });

    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => this.handleApiError(error)
    );
  }

  /**
   * Handles API errors by checking the response status and
   * throwing an appropriate error message.
   *
   * @private
   * @param {unknown} error - The error object returned from Axios.
   * @returns {CustomErrorResponse} The formatted error response.
   */
  private handleApiError(error: unknown): CustomErrorResponse {
    console.error(error);
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigateTo('/');
        throw {
          success: false,
          error_message: 'Your session has expired. Please login again.',
          message_type: 'invalid_credentials'
        };
      }
      throw {
        success: false,
        error_message: error.response?.data.error_message || 'An error occurred',
        message_type: error.response?.data.message_type || 'error'
      };
    }
    throw {
      success: false,
      error_message: 'An unexpected error occurred.',
      message_type: 'unexpected_error'
    };
  }

  /**
   * Makes an HTTP request to the specified URL with the given method and data.
   * Automatically adds the authorization token if required.
   *
   * @param {string} method - The HTTP method (GET, POST, etc.).
   * @param {string} url - The endpoint URL.
   * @param {unknown} [data] - The request payload (optional).
   * @param {boolean} [useToken=true] - Whether to include the authorization token (default is true).
   * @param {string} [contentType='application/json'] - The content type of the request (default is application/json).
   * @returns {Promise<CustomSuccessResponse>} A promise that resolves to the response data.
   * @throws {CustomErrorResponse} Throws an error if the request fails.
   */
  public async request(
    method: string,
    url: string,
    data?: unknown,
    useToken: boolean = true,
    contentType: string = 'application/json'
  ): Promise<CustomSuccessResponse> {
    const headers: AxiosHeaders = new AxiosHeaders();
    headers.set('Content-Type', contentType);
    const config: CustomAxiosRequestConfig = {
      method,
      url,
      data,
      headers,
      useToken
    };

    try {
      const response: AxiosResponse = await this.axiosInstance(config);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      throw this.handleApiError(error);
    }
  }
}

/**
 * An instance of the ApiService class used to handle API requests throughout the application.
 * This instance is pre-configured with the base URL and Axios interceptors for request handling.
 *
 * @type {ApiService}
 */
const apiService = new ApiService();

/**
 * Performs the user login and stores the access token and the user ID in the local storage.
 * @async
 * @function
 * @param {LoginParams} data - The data containing the email and password.
 */
export const login = async (data: LoginParams) => {
  const endpoint = 'api/public/login';
  return apiService.request('POST', endpoint, data);
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
  const user_id = localStorage.getItem('user_id');
  const endpoint = `api/public/users/${user_id}/pdf-chats`;
  return apiService.request('POST', endpoint, data);
};

/**
 * Fetches the user details for the provided user ID.
 * @function getUserDetailsById
 * @param {string} id - The user ID.
 * @returns {Promise<{ success: boolean, data?: any, error?: string }>} A Promise containing the user details.
 */
export const getUserDetailsById = async (id: string) => {
  const endpoint = `api/public/user/${id}`;
  return apiService.request('GET', endpoint);
};

/**
 * Fetches the user details for all the users.
 * @function getUsers
 * @returns {Promise<{ success: boolean, data?: any, error?: string }>} A Promise containing the user details.
 */
export const getUsers = async () => {
  const endpoint = `api/public/users`;
  return apiService.request('GET', endpoint);
};

/**
 * Updates the user details for the provided user ID.
 * @function updateUser
 * @param {UpdateUserParams} data - The data containing user ID, chat type, and question.
 * @returns {Promise<{ success: boolean, data?: any, error?: string }>} A Promise containing the user details.
 */
export const updateUser = async (data: UpdateUserParams) => {
  const user_id = localStorage.getItem('user_id');
  const endpoint = `api/users/${user_id}`;
  return apiService.request('PATCH', endpoint, data);
};

/**
 * Creates a new user with the provided data.
 * @function createUsers
 * @param {CreateUserParams} data - The data containing the email, username, password, and role of the user.
 * @returns {Promise<{ success: boolean, data?: any, error?: string }>} A Promise containing the user details.
 */
export const createUsers = async (data: CreateUserParams) => {
  const endpoint = `api/public/users`;
  return apiService.request('POST', endpoint, data);
};

/**
 * Creates a new conversation.
 * @function createNewConversation
 */
export const createNewConversation = async () => {
  const endpoint = `api/public/conversations`;
  return apiService.request('POST', endpoint, {});
};

/**
 * Fetches the conversation list for the user.
 * @function getConversations
 * @param {GetConversationListParams} data - The data containing the page number and page size.
 */
export const getConversations = async (data?: GetConversationListParams) => {
  const user_id = localStorage.getItem('user_id');
  const endpoint = `api/public/users/${user_id}/conversations`;
  return apiService.request('GET', endpoint, data);
};

/**
 * Fetches the conversation details for the provided conversation ID.
 * @function getConversationById
 * @param {string} id - The conversation ID.
 */
export const getChatsByConversationId = async (id: string) => {
  const endpoint = `api/public/conversations/${id}/chats`;
  return apiService.request('GET', endpoint);
};

/**
 * Updates the conversation details for the provided conversation ID.
 * @function updateConversation
 * @param {updateConversationAPIParams} params - The data containing the conversation ID and name.
 */
export const updateConversation = async (params: updateConversationAPIParams) => {
  const user_id = localStorage.getItem('user_id');
  const endpoint = `api/public/users/${user_id}/conversations/${params.id}`;
  const data = {
    name: params.name
  };
  return apiService.request('PATCH', endpoint, data);
};

/**
 * Archives the conversation for the provided conversation ID.
 * @function archiveConversation
 * @param {string} id - The conversation ID.
 * @async
 */
export const archiveConversation = async (id: string) => {
  const user_id = localStorage.getItem('user_id');
  const endpoint = `api/public/users/${user_id}/conversations/${id}/archive`;
  return apiService.request('PATCH', endpoint, {});
};

/**
 * Get the PDF file data.
 * @function getFileID
 * @param {FormData} params - The data containing the PDF file.
 * @async
 */
export const getFileID = async () => {
  const user_id = localStorage.getItem('user_id');
  const endpoint = `api/public/users/${user_id}/get-file-id`;
  return apiService.request('GET', endpoint);
};

/**
 * Uploads the PDF file to the server.
 * @function pdfUpload
 * @param {FormData} params - The data containing the PDF file.
 * @async
 */
export const pdfUpload = async (params: FormData) => {
  const user_id = localStorage.getItem('user_id');
  const endpoint = `api/public/users/${user_id}/pdf-upload`;
  return apiService.request('POST', endpoint, params, true, 'multipart/form-data');
};

/**
 * Uploads the PDF file to the server.
 * @function pdfUploadUpdateFile
 * @param {FormData} params - The data containing the PDF file.
 */
export const pdfUploadUpdateFile = async (params: FormData) => {
  const user_id = localStorage.getItem('user_id');
  const endpoint = `api/public/users/${user_id}/pdf-upload`;
  return apiService.request('PATCH', endpoint, params, true, 'multipart/form-data');
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
        password: params.password
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${params.shortLivedToken}`
        }
      }
    );

    if (res.status === 200 || res.status === 201) {
      return {
        success: true,
        data: res.data
      };
    }
  } catch (error) {
    console.log('Error while fetching', error);
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        return {
          success: false,
          error_message: 'Your session has expired. Please login again.',
          message_type: 'invalid_credentials'
        };
      }

      return {
        success: false,
        error_message: error.response?.data.error_message,
        message_type: error.response?.data.message_type
      };
    } else {
      return {
        success: false,
        error_message: 'An unexpected error occurred.',
        message_type: 'unexpected_error'
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
  return apiService.request('POST', endpoint, param, false);
};

/**
 * pdf list API.
 * @function pdfList
 * @async
 */
export const pdfList = async () => {
  const user_id = localStorage.getItem('user_id');
  const endpoint = `api/public/users/${user_id}/get-pdfs`;
  return apiService.request('GET', endpoint);
  // return apiService.request('GET', endpoint, {}, true, 'multipart/form-data');
};

/**
 * Delete the PDF file from the server.
 * @function pdfDelete
 * @param {string[]} params - Array of PDF ids to delete.
 * @async
 */
export const pdfDelete = async (params: string[]) => {
  const user_id = localStorage.getItem('user_id');
  const endpoint = `api/public/users/${user_id}/delete-pdfs`;
  const data = { pdf_ids: params };
  return apiService.request('DELETE', endpoint, data);
};
