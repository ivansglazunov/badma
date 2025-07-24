import axios, { AxiosInstance, AxiosError } from 'axios';
import { ChessClient, ChessClientRequest, ChessServerResponse } from './chess-client';
import Debug from './debug';

const debug = Debug('axios-client');

// Helper function to serialize request data for GET params
// Handles basic types and JSON stringifies objects/arrays
function serializeRequestData(data: ChessClientRequest): Record<string, string> {
    const params: Record<string, string> = {};
    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            const value = data[key as keyof ChessClientRequest];
            if (value !== undefined && value !== null) {
                if (typeof value === 'object') {
                    try {
                        params[key] = JSON.stringify(value);
                    } catch (e) {
                        debug(`Could not stringify object for key ${key}:`, value);
                    }
                } else {
                    params[key] = String(value);
                }
            }
        }
    }
    return params;
}

export class AxiosChessClient extends ChessClient {
    private axiosInstance: AxiosInstance;

    // Accept a pre-configured Axios instance
    constructor(axiosInstance: AxiosInstance) {
        super(null as any); // Base constructor might need adjustment if it requires a server

        this.axiosInstance = axiosInstance;
        // Optional: Log the base URL from the provided instance for debugging
        debug(`AxiosChessClient initialized with provided Axios instance. Base URL: ${this.axiosInstance.defaults.baseURL}`);
    }

    // Override the protected methods to use the provided Axios instance

    protected override async _create(request: ChessClientRequest): Promise<ChessServerResponse> {
        return this.sendRequest(request);
    }

    protected override async _perk(request: ChessClientRequest): Promise<ChessServerResponse> {
        return this.sendRequest(request);
    }

    protected override async _join(request: ChessClientRequest): Promise<ChessServerResponse> {
        return this.sendRequest(request);
    }

    protected override async _leave(request: ChessClientRequest): Promise<ChessServerResponse> {
        return this.sendRequest(request);
    }

    protected override async _move(request: ChessClientRequest): Promise<ChessServerResponse> {
        return this.sendRequest(request);
    }

    protected override async _sync(request: ChessClientRequest): Promise<ChessServerResponse> {
        return this.sendRequest(request);
    }

    // Centralized request sending logic now uses GET
    private async sendRequest(request: ChessClientRequest): Promise<ChessServerResponse> {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const apiUrl = `${baseUrl}/api/badma`; // Base API URL

        // Get authorization header from defaults if available
        const authHeader = this.axiosInstance.defaults.headers.common['Authorization'];
        
        // Serialize the request data into query parameters
        const queryParams = serializeRequestData(request);
        
        debug(`Sending GET request via injected Axios instance to ${apiUrl} with params:`, queryParams);
        debug(`Using Authorization header: ${authHeader || 'none'}`);
        
        try {
            // Use axiosInstance.get and pass queryParams in the 'params' option
            const response = await this.axiosInstance.get<ChessServerResponse>(
                apiUrl,
                {
                    params: queryParams, // Pass serialized data as query parameters
                    headers: {
                        // Ensure Authorization header is sent if available
                        ...(authHeader && { 'Authorization': authHeader }),
                        // Content-Type is not typically needed for GET
                    }
                }
            );
            
            debug(`Received response from API (status ${response.status}):`, response.data);

            if (response.data && (response.data.data || response.data.error)) {
                 return response.data;
            } else {
                debug('Error: Unexpected response format from API', response.data);
                return { error: 'Unexpected response format from server.' };
            }

        } catch (error) {
            debug('Axios GET request failed:', error);
            let errorMessage = 'Failed to communicate with the server.';
            if (axios.isAxiosError(error)) {
                const axiosError = error as AxiosError;
                errorMessage = `Network or server error: ${axiosError.message}`;
                if (axiosError.response) {
                    errorMessage += ` (Status: ${axiosError.response.status})`;
                    debug('Axios error response data:', axiosError.response.data);
                    // Try to extract error from response data if available
                    const responseError = (axiosError.response.data as any)?.error;
                    if(responseError) {
                        errorMessage = `Server API Error: ${responseError}`; 
                    }
                }
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }
            // Return the application-level error structure
            return { error: errorMessage }; 
        }
    }
}
