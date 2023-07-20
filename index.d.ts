declare const Events: import("phantomfetcher").PhantomEvents<Config>;
declare class GobathApiError extends Error {
    code: string;
    message: string;
    fields: object;
    constructor(code: string, message?: string, fields?: object);
}
declare class GobathApiLimitError extends GobathApiError {
}
declare class GobathApiCommunicationError extends GobathApiError {
}
declare const GobathApi: import("phantomfetcher").RootConfigurable<Config & import("phantomfetcher").DefaultConfig, Root<Config>>;
export { Events, GobathApi, GobathApiError, GobathApiLimitError, GobathApiCommunicationError, };
import type { NoData, BodyRe, QuerRe, QuerOp, CplxQR } from "phantomfetcher";
import FormData from 'form-data';
interface Config {
    token?: string;
    preventParallel?: boolean | string;
}
interface AuthorizedResponse {
    auth_id: string;
    user_id: number;
    note: string;
}
type PostMessageHTML = string;
interface FileWithVariants<VariantsT = string, MetaT = object> {
    id: string;
    ext: string;
    mimetype: string;
    url: string;
    size: number;
    meta: MetaT;
    created_at: string;
    is_temp: boolean;
    variants: null | {
        [key: VariantsT]: {
            id: string;
            ext: string;
            mimetype: string;
            url: string;
            size: number;
            meta: MetaT;
            created_at: string;
            is_temp: boolean;
        };
    };
}
interface Root<ConfigT = Config> {
    Auth: {
        MagickLink: {
            GET: CplxQR<ConfigT, null, {
                /***
                 * @description
                 * in case `phone` will send short confirmation code.
                 * in case `email` will send confirmation link.
                 * Required.
                 */
                via: "phone" | "email";
                /***
                 * @description
                 * in case `phone` number must be e164 format (with/out +).
                 * in case `email` address must be email.
                 * Required.
                 */
                destination: string;
                /***
                 * @description
                 * `authorization` - by default.
                 * `password_reset` - to reset password after confirmation.
                 * Optional.
                 */
                purpose?: "authorization" | "password_reset";
                /***
                 * @description
                 * Received confirmation code.
                 */
                code?: number | string;
            }, AuthorizedResponse>;
        };
        Password: {
            POST: BodyRe<ConfigT, {
                /***
                 * @description
                 * Phone (e164 format with/out +) or email.
                 * Required.
                 */
                username: string;
                /***
                 * @description
                 * Password.
                 * Required.
                 */
                password: string;
            }, null, AuthorizedResponse>;
        };
        Telegram: {
            POST: BodyRe<ConfigT, 
            /***
             * @description
             * User data from telegram auth result
             * Required.
             */
            object, AuthorizedResponse>;
        };
        Google: {
            GET: NoData<ConfigT, PostMessageHTML>;
        };
        Yandex: {
            GET: NoData<ConfigT, PostMessageHTML>;
        };
        Vkontakte: {
            GET: NoData<ConfigT, PostMessageHTML>;
        };
        Logout: {
            GET: NoData<ConfigT, {
                note: string;
            }>;
        };
    };
    Confirmation: {
        EmailChangeAccess: {
            Email: {
                GET: NoData<ConfigT, {
                    note: string;
                }>;
            };
            Phone: {
                GET: NoData<ConfigT, {
                    note: string;
                }>;
            };
        };
        PhoneChangeAccess: {
            Email: {
                GET: NoData<ConfigT, {
                    note: string;
                }>;
            };
            Phone: {
                GET: NoData<ConfigT, {
                    note: string;
                }>;
            };
        };
        ProfileDeleteAccess: {
            Email: {
                GET: NoData<ConfigT, {
                    note: string;
                }>;
            };
            Phone: {
                GET: NoData<ConfigT, {
                    note: string;
                }>;
            };
        };
        ProfileEmail: {
            Email: {
                GET: QuerRe<ConfigT, {
                    /***
                     * @description
                     * The new user email.
                     * Required.
                     */
                    email: string;
                    fields?: {
                        /***
                         * @description
                         * Confirmation code requested with `/confirmation/email-change-access` and received by account owner.
                         * Required - if user has email.
                         */
                        code?: string;
                    };
                }, {
                    note: string;
                }>;
            };
        };
        ProfilePhone: {
            Phone: {
                GET: QuerRe<ConfigT, {
                    /***
                     * @description
                     * The new user phone (e164 format with/out +).
                     * Required.
                     */
                    phone: string;
                    fields?: {
                        /***
                         * @description
                         * Confirmation code requested with `/confirmation/phone-change-access` and received by account owner.
                         * Required - if user has phone.
                         */
                        code?: string;
                    };
                }, {
                    note: string;
                }>;
            };
        };
    };
    Profile: {
        GET: NoData<ConfigT, {
            user_id: number;
            name: string;
            phone: string | null;
            email: string | null;
            prev_auth_at: string | null;
            registered_at: string;
            has_password: boolean;
            has_token: boolean;
            sso: {
                telegram: boolean;
                vkontakte: boolean;
                google: boolean;
                yandex: boolean;
            };
            avatar: {
                big: string;
                medium: string;
                small: string;
                thumbnail: string;
            } | null;
        }>;
        PATCH: BodyRe<ConfigT, {
            /***
             * @description
             * User name in profile. Optional.
             */
            name?: string;
        }, {
            updated: ["name"];
        }>;
        DELETE: BodyRe<ConfigT, {
            /***
             * @description
             * The user password.
             * Required - if user has password.
             */
            password?: string;
            /***
             * @description
             * Confirmation code requested with `/confirmation/profile-delete-access` and received by owner.
             * Required - if user has no password but has email or phone.
             */
            code?: string;
        }, {
            note: string;
        }>;
        Avatar: {
            GET: NoData<ConfigT, {
                file: null | FileWithVariants<"medium" | "small" | "thumbnail", {
                    width: number;
                    height: number;
                }>;
            }>;
            PATCH: BodyRe<ConfigT, {
                file_id: string;
            }, {
                note: string;
            }>;
        };
        Password: {
            PATCH: BodyRe<ConfigT, {
                /***
                 * @description
                 * Old password, or empty if user has no password installed yet.
                 */
                old_password?: string;
                /***
                 * @description
                 * New password, min length 8 chars.
                 * Required.
                 */
                new_password: string;
            }, {
                note: string;
            }>;
        };
        Phone: {
            PATCH: BodyRe<ConfigT, {
                /***
                 * @description
                 * The new user phone (e164 format with/out +).
                 * Required.
                 */
                phone: string;
                /***
                 * @description
                 * Confirmation code requested with `/confirmation/profile-phone` and received by `phone`.
                 * Required.
                 */
                code: string;
            }, {
                note: string;
            }>;
        };
        Email: {
            PATCH: BodyRe<ConfigT, {
                /***
                 * @description
                 * The new user phone (e164 format with/out +).
                 * Required.
                 */
                email: string;
                /***
                 * @description
                 * Confirmation code requested with `/confirmation/profile-email` and received by `email`.
                 * Required.
                 */
                code: string;
            }, {
                note: string;
            }>;
        };
        Sso: {
            Yandex: {
                LINK: NoData<ConfigT, {
                    /***
                     * @description
                     * Use SSO provider login procedure with this `redirect` link.
                     * Auth and SSO connection has one logic.
                     * See /auth/yandex description for current example.
                     */
                    redirect: string;
                }>;
                UNLINK: NoData<ConfigT, {
                    note: string;
                }>;
            };
        };
    };
    File: {
        [key: string]: {
            GET: QuerOp<ConfigT, {
                /***
                 * @description
                 * false|true|{variant} - default false.
                 * false - return file info.
                 * true - redirect to file url.
                 * {variant} - redirect to file variant url (if variant not exists, will redirect to main file url).
                 * Optional.
                 */
                redirect?: boolean | string;
            }, {
                file: FileWithVariants<string, Record<string, any>>;
            }>;
        };
    };
    Upload: {
        POST(form_data: FormData, query?: null, config?: ConfigT & {
            onProgress?: (percent: number) => void;
        }): Promise<{
            files: {
                [key: string]: {
                    file_id: string;
                    origname: string;
                    mimetype: string;
                    size: number;
                    is_temp: boolean;
                };
            };
        }>;
    };
}
