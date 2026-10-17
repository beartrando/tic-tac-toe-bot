import http from "node:http";
import logger from "@shared/logger";
import type {MessageLogger} from "@shared/elastic";
import RequestOptionsInterface from "./interfaces/request-options.interface";

export class HttpClient {

    constructor(
        private readonly host: string,
        private readonly port: number,
        private readonly messageLogger?: MessageLogger,
    ) {
    }

    public async get(uri: string, requestOptions?: RequestOptionsInterface): Promise<any> {
        return await this.request(uri, 'GET', requestOptions);
    }

    public async post(uri: string, requestOptions?: RequestOptionsInterface): Promise<any> {
        return await this.request(uri, 'POST', requestOptions);
    }

    public async delete(uri: string, requestOptions?: RequestOptionsInterface): Promise<any> {
        return await this.request(uri, 'DELETE', requestOptions);
    }

    public async put(uri: string, requestOptions?: RequestOptionsInterface): Promise<any> {
        return await this.request(uri, 'PUT', requestOptions);
    }

    public async patch(uri: string, requestOptions?: RequestOptionsInterface): Promise<any> {
        return await this.request(uri, 'PATCH', requestOptions);
    }

    private async request(
        uri: string,
        method: string = "GET",
        requestOptions?: RequestOptionsInterface,
    ): Promise<any> {
        const channel = `${method} /${uri}`;

        void this.messageLogger?.logOut('http', channel, requestOptions?.body ?? null);

        return new Promise((resolve, reject) => {
            const headers: Record<string, string | number> = {
                "Content-Type": "application/json",
                ...requestOptions?.headers,
            };

            let data = '';
            if (requestOptions?.body) {
                data = JSON.stringify(requestOptions.body);
                headers["Content-Length"] = Buffer.byteLength(data);
            }

            const options = {
                hostname: this.host,
                port: this.port,
                path: `/${uri}`,
                method,
                headers,
            };

            const req = http.request(options, (res) => {
                let body = "";
                res.on("data", (chunk) => (body += chunk));
                res.on("end", () => {
                    try {
                        const response = JSON.parse(body);
                        void this.messageLogger?.logIn('http', channel, response);
                        resolve(response);
                    } catch (err) {
                        logger.error(body);
                        void this.messageLogger?.logIn('http', channel, {error: body});
                        reject(err);
                    }
                });
            });

            // logger.log(options);

            req.on("error", (err) => {
                void this.messageLogger?.logIn('http', channel, {error: err.message});

                if ((err as NodeJS.ErrnoException).code === "ECONNREFUSED") {
                    reject(new Error(`Gateway unavailable at ${this.host}:${this.port}`));
                } else {
                    reject(err);
                }
            });

            if (data) {
                req.write(data);
            }
            req.end();
        });
    }
}

export default HttpClient;
