//@ts-nocheck
import {PhantomEventEmitter, PhantomFetcher, AsyncParallelismControl, simpleApiFetch} from "phantomfetcher";
import axios from "axios";

const [Events, requestsQueue] = [PhantomEventEmitter<Config>(), []];

class GobathApiError extends Error {
    constructor(
        public code: string,
        public message: string = '',
        public fields: object = {},
    ) {super()}
}
class GobathApiLimitError 		  extends GobathApiError {}
class GobathApiCommunicationError extends GobathApiError {}

const GobathApi = PhantomFetcher<Config, Root>(Events, (options, path, body, query) => {
    const method      = path.at(-1);
    const url         = `https://api.gobath.ru/${path.slice(0, -1).join('/').replace(/[A-Z]/g, l => `-${l.toLowerCase()}`).replace(/(^|[^a-z])-/g, '$1')}`; // CamelCase to snake-case, CAMELcase not allowed.
    const requestName = (typeof options.preventParallel == 'string') ? options.preventParallel : `${method} ${url}`;

    return AsyncParallelismControl(requestName, !!options.preventParallel, requestsQueue, async () => {
        let resp;
        let contentType;

        try {
            if (url === 'https://api.gobath.ru/upload') {
                resp = (await axios.request({
                    method: method as "POST",
                    url,
                    data: body,
                    headers: body.getHeaders? body.getHeaders() : {'Content-Type': 'multipart/form-data'},
                    withCredentials: true,
                    maxContentLength: Infinity,
                    maxBodyLength: Infinity,
                    onUploadProgress: (event) => options.onProgress && options.onProgress((event.loaded * 100) / event.total, event),
                }))
                contentType = resp.headers["content-type"];
            } else {
                resp = await simpleApiFetch(
                    method!,
                    url,
                    body,
                    query,
                    {},
                    {...options, fetch_options: {credentials: "include"}}
                );
                contentType = resp.headers.get('content-type');
            }
        } catch (err) {
            throw new GobathApiCommunicationError('COMMUNICATION_ERROR', err.message);
        }

        if (contentType?.startsWith('application/json')) {
            const {data, meta, error} = resp.data || await resp.json();

            if (error) {
                const {code, message, ...fields} = error;
                throw new GobathApiError(code, message, fields);
            }

            if (meta) {
                data.$meta = meta;
            }

            return data;
        } else {
            return await resp.text();
        }
    });
});

export {
    Events,
    GobathApi,
    GobathApiError,
    GobathApiLimitError,
    GobathApiCommunicationError,
}



import type {NoData, BodyRe, BodyOp, QuerRe, QuerOp, CplxRe, CplxOp, CplxBR, CplxQR} from "phantomfetcher";
import FormData from 'form-data';

interface Config {
    token?: string
    preventParallel?: boolean | string
}

type PostMessageHTML = string;

export interface AuthorizedResponse {
    auth_id: string
    user_id: number
    note: string
}

export interface FileWithVariants<VariantsT = string, MetaT = object> {
    id: string
    ext: string
    mimetype: string
    url: string
    size: number
    meta: MetaT
    created_at: string
    is_temp: boolean
    variants: null | {
        [key:VariantsT ]: FileWithVariants
    }
}

export interface AuthMagickLinkParams{
    /***
     * @description
     * in case `phone` will send short confirmation code.
     * in case `email` will send confirmation link.
     * Required.
     */
    via: "phone" | "email"
    /***
     * @description
     * in case `phone` number must be e164 format (with/out +).
     * in case `email` address must be email.
     * Required.
     */
    destination: string
    /***
     * @description
     * `registration`   - will throw error if user already exists.
     * `authorization`  - will throw error if user does not exist.
     * `password_reset` - will throw error if user does not exist.
     * Required.
     */
    purpose: "registration" | "authorization" | "password_reset"
    /***
     * @description
     * Received confirmation code.
     */
    code?: number | string
}

export interface AuthPasswordParams {
    /***
     * @description
     * Phone (e164 format with/out +) or email.
     * Required.
     */
    username: string
    /***
     * @description
     * Password.
     * Required.
     */
    password: string
}

export interface ProfileData {
    user_id:         number,
    name:            string,
    phone:           string | null,
    email:           string | null,
    prev_auth_at:    string | null,
    registered_at:   string,

    has_password:    boolean,
    has_token:       boolean,

    sso: {
        telegram:    boolean,
        vkontakte:   boolean,
        google:      boolean,
        yandex:      boolean,
    },

    avatar: {
        big:        string,
        medium:     string,
        small:      string,
        thumbnail:  string,
    } | null
}

interface Root<ConfigT = Config> {
    Auth: {
        MagickLink: {
            GET:  CplxQR<ConfigT, null, AuthMagickLinkParams, AuthorizedResponse>
        }
        Password: {
            POST: BodyRe<ConfigT, AuthPasswordParams, null, AuthorizedResponse>
        }
        Telegram: {
            POST: BodyRe<ConfigT,
                /***
                 * @description
                 * User data from telegram auth result
                 * Required.
                 */
                object,
                AuthorizedResponse
            >
        }
        Google: {
            GET:   NoData<ConfigT, PostMessageHTML>
        }
        Yandex: {
            GET:   NoData<ConfigT, PostMessageHTML>
        }
        Vkontakte: {
            GET:   NoData<ConfigT, PostMessageHTML>
        }
        Logout: {
            GET:   NoData<ConfigT, { note: string }>
        }
    },
    Confirmation: {
        EmailChangeAccess: {
            GET: NoData<ConfigT, {
                email: boolean
                phone: boolean
            }>
            Email: {
                GET: NoData<ConfigT, { note: string, code_id: string }>
            }
            Phone: {
                GET: NoData<ConfigT, { note: string, code_id: string }>
            }
        }
        PhoneChangeAccess: {
            GET: NoData<ConfigT, {
                email: boolean
                phone: boolean
            }>
            Email: {
                GET: NoData<ConfigT, { note: string, code_id: string }>
            }
            Phone: {
                GET: NoData<ConfigT, { note: string, code_id: string }>
            }
        }
        ProfileDeleteAccess: {
            GET: NoData<ConfigT, {
                email: boolean
                phone: boolean
            }>
            Email: {
                GET: NoData<ConfigT, { note: string, code_id: string }>
            }
            Phone: {
                GET: NoData<ConfigT, { note: string, code_id: string }>
            }
        }
        BusinessDeleteAccess: {
            GET: NoData<ConfigT, {
                email: boolean
                phone: boolean
                password: boolean
            }>
            Email: {
                GET: NoData<ConfigT, { note: string, code_id: string }>
            }
            Phone: {
                GET: NoData<ConfigT, { note: string, code_id: string }>
            }
            Password: {
                GET: BodyRe<ConfigT, {
                        /***
                         * @description
                         * The account password of owner.
                         * Required.
                         */
                        password: string,
                        fields: {
                            /***
                             * @description
                             * ID of the business.
                             * Required.
                             */
                            business_id?: string
                        }
                    },
                    {
                        note: string,
                        code_id: string,
                        code: string
                    }
                >
            }
        }
        ProfileEmail: {
            GET: NoData<ConfigT, {
                email: boolean
            }>
            Email: {
                GET: QuerRe<ConfigT,
                    {
                        /***
                         * @description
                         * The new user email.
                         * Required.
                         */
                        email: string,
                        fields?: {
                            /***
                             * @description
                             * Confirmation code requested with `/confirmation/email-change-access` and received by account owner.
                             * Required - if user has email.
                             */
                            code?: string
                        }
                    },
                    {
                        note: string
                        code_id: string
                    }
                >
            }
        }
        ProfilePhone: {
            GET: NoData<ConfigT, {
                phone: boolean
            }>
            Phone: {
                GET: QuerRe<ConfigT,
                    {
                        /***
                         * @description
                         * The new user phone (e164 format with/out +).
                         * Required.
                         */
                        phone: string,
                        fields?: {
                            /***
                             * @description
                             * Confirmation code requested with `/confirmation/phone-change-access` and received by account owner.
                             * Required - if user has phone.
                             */
                            code?: string
                        }
                    },
                    {
                        note: string
                        code_id: string
                    }
                >
            }
        }
        VerifyCode: {
            GET: QuerRe<ConfigT,
                {
                    /***
                     * @description
                     * The `code_id` from `/confirmation/* /*` request.
                     * Required.
                     */
                    code_id: string,
                    /***
                     * @description
                     * The received code requested with `/confirmation/* /*`.
                     * Required.
                     */
                    code: string
                },
                {
                    valid: boolean
                }
            >
        }
    },
    Profile: {
        GET:   NoData<ConfigT, ProfileData>

        PATCH: BodyRe<ConfigT,
            {
                /***
                 * @description
                 * User name in profile. Optional.
                 */
                name?: string
            },
            {
                updated: ["name"]
            }
        >

        DELETE: BodyRe<ConfigT,
            {
                /***
                 * @description
                 * The user password.
                 * Required - if user has password.
                 */
                password?: string
                /***
                 * @description
                 * Confirmation code requested with `/confirmation/profile-delete-access` and received by owner.
                 * Required - if user has no password but has email or phone.
                 */
                code?: string
            },
            {
                note: string
            }
        >

        Avatar: {
            GET:   NoData<ConfigT,
                {
                    file: null | FileWithVariants<"medium" | "small" | "thumbnail", {width: number, height: number}>
                }
            >
            PATCH: BodyRe<ConfigT,
                {
                    file_id: string
                },
                {
                    note: string
                }
            >
        }
        Password: {
            PATCH: BodyRe<ConfigT,
                {
                    /***
                     * @description
                     * Old password, or empty if user has no password installed yet.
                     */
                    old_password?: string,
                    /***
                     * @description
                     * New password, min length 8 chars.
                     * Required.
                     */
                    new_password: string
                },
                {
                    note: string
                }
            >
        }
        Phone: {
            PATCH: BodyRe<ConfigT,
                {
                    /***
                     * @description
                     * The new user phone (e164 format with/out +).
                     * Required.
                     */
                    phone: string,
                    /***
                     * @description
                     * Confirmation code requested with `/confirmation/profile-phone` and received by `phone`.
                     * Required.
                     */
                    code: string
                },
                {
                    note: string
                }
            >
        }
        Email: {
            PATCH: BodyRe<ConfigT,
                {
                    /***
                     * @description
                     * The new user phone (e164 format with/out +).
                     * Required.
                     */
                    email: string,
                    /***
                     * @description
                     * Confirmation code requested with `/confirmation/profile-email` and received by `email`.
                     * Required.
                     */
                    code: string
                },
                {
                    note: string
                }
            >
        }
        Sso: {
            Yandex: {
                LINK:   NoData<ConfigT, {
                    /***
                     * @description
                     * Use SSO provider login procedure with this `redirect` link.
                     * Auth and SSO connection has one logic.
                     * See /auth/yandex description for current example.
                     */
                    redirect: string
                }>
                UNLINK: NoData<ConfigT, {
                    note: string
                }>
            }
        }
    },
    File: {
        [key: string]: {
            GET: QuerOp<ConfigT,
                {
                    /***
                     * @description
                     * false|true|{variant} - default false.
                     * false - return file info.
                     * true - redirect to file url.
                     * {variant} - redirect to file variant url (if variant not exists, will redirect to main file url).
                     * Optional.
                     */
                    redirect?: boolean | string
                },
                {
                    file: FileWithVariants<string, Record<string, any>>
                }
            >
        }
    },
    Upload: {
        POST(form_data: FormData, query?: null, config?: ConfigT & {onProgress?: (percent: number) => void}): Promise<{
            files: {
                [key: string]: {
                    file_id: string
                    origname: string
                    mimetype: string
                    size: number
                    is_temp: boolean
                }
            }
        }>
    },
    Business: {
        GET: NoData<ConfigT, GetBusinessResponse[]>
        PATCH: BodyRe<ConfigT,
            {
                /***
                 * @description
                 * Title for the business (internal show).
                 * Optional.
                 */
                name?: string
            },
            {
                updated: ["name"]
            }
        >
        DELETE: BodyRe<ConfigT,
            {
                /***
                 * @description
                 * Confirmation code requested with `/confirmation/business-delete-access` and received by owner.
                 * Required.
                 */
                code: string
            },
            {
                note: string
            }
        >
        New: {
            Legal: {
                POST: BodyRe<ConfigT, RequisitesLegalParams & {business_name?: string}, { note: string, business_id: number }>
            }
            Individual: {
                POST: BodyRe<ConfigT, RequisitesIndividualParams & {business_name?: string}, { note: string, business_id: number }>
            }
            Selfbusy: {
                POST: BodyRe<ConfigT, RequisitesSelfbusyParams & {business_name?: string}, { note: string, business_id: number }>
            }
            Person: {
                POST: BodyRe<ConfigT, RequisitesPersonParams & {business_name?: string}, { note: string, business_id: number }>
            }
        }
        Requisites: {
            GET: NoData<ConfigT, GetBusinessResponse>
            Legal: {
                PATCH: BodyRe<ConfigT, RequisitesLegalParams, { note: string }>
            }
            Individual: {
                PATCH: BodyRe<ConfigT, RequisitesIndividualParams, { note: string }>
            }
            Selfbusy: {
                PATCH: BodyRe<ConfigT, RequisitesSelfbusyParams, { note: string }>
            }
            Person: {
                PATCH: BodyRe<ConfigT, RequisitesPersonParams, { note: string }>
            }
            Bank: {
                PATCH: BodyRe<ConfigT, RequisitesBankParams, { note: string }>
            }
            Contacts: {
                PATCH: BodyRe<ConfigT, RequisitesContactsParams, { note: string }>
            }
        }
    }
}

export interface GetBusinessResponse {
    id:         number,
    name:       string,
    requisites: RequisitesPublicInfo,
}

export interface RequisitesPublicInfo {
    main: null | {
        name:         string
        short_name:   string
        moderation:   "MODERATING" | "MODERATED" | "DECLINED"
        type:         "LEGAL" | "INDIVIDUAL" | "SELFBUSY" | "PERSON"
        legal: null | {
            inn:          string
            kpp:          string
            yur_address:  string
            fact_address: string
        },
        individual: null | {
            inn:          string
            ogrnip:       string
            yur_address:  string
            fact_address: string
        },
        selfbusy: null | {
            inn:          string
            reg_address:  string
        }
        person: null | {
            reg_address: string
            passport:    PersonPassport | null
        }
    },
    bank: null | {
        name:    string
        bic:     string
        cor:     string
        account: string
    },
    contacts: null | {
        name:    string
        phone:   string | null
        email:   string | null
    },
}

export interface PersonPassport {
    country:                "RUS"
    firstname:              string
    lastname:               string
    patronymic:             string | null
    sex:                    "M" | "F"
    born_date:              string
    born_place:             string
    passport_serial:        string
    passport_number:        string
    passport_issued_by:     string
    passport_issued_date:   string
    passport_division_code: string
}

export interface RequisitesPersonParams {
    /***
     * @description
     * Country code.
     * Only available variant `RUS`.
     * Required.
     */
    country: "RUS"
    /***
     * @description
     * Firstname (as in the passport).
     * Required.
     */
    firstname: string
    /***
     * @description
     * Lastname (as in the passport).
     * Required.
     */
    lastname: string
    /***
     * Patronymic (as in the passport).
     * Leave empty if has no.
     * Optional.
     */
    patronymic?: string
    /***
     * @description
     * M - male, F - female.
     * Required.
     */
    sex: "F" | "M"
    /***
     * @description
     * Born date `YYYY-MM-DD`.
     * Required.
     */
    born_date: string
    /***
     * @description
     * Born place (as in the passport).
     * Required.
     */
    born_place: string
    /***
     * @description
     * Passport serial (with/out spaces).
     * Required.
     */
    passport_serial: string
    /***
     * @description
     * Passport number (with/out spaces).
     * Required.
     */
    passport_number: string
    /***
     * @description
     * Passport issued by (as in th passport).
     * Required.
     */
    passport_issued_by: string
    /***
     * @description
     * Passport issued date `YYYY-MM-DD`.
     * Required.
     */
    passport_issued_date: string
    /***
     * @description
     * Passport division code (as in passport).
     * Required.
     */
    passport_division_code: string
    /***
     * @description
     * Registration address (free format).
     * Required.
     */
    reg_address: string
}

export interface RequisitesSelfbusyParams {
    /***
     * @description
     * Full name.
     * Required.
     */
    fio: string
    /***
     * @description
     * INN.
     * Required.
     */
    inn: string
    /***
     * @description
     * Registration address (free format).
     * Required.
     */
    reg_address: string
}

export interface RequisitesIndividualParams {
    /***
     * @description
     * Individual entrepreneur's INN.
     * Required.
     */
    inn: string
    /***
     * @description
     * Individual entrepreneur's actual address (free format).
     * Leave empty to clone legal address.
     * Optional.
     */
    fact_address?: string
}

export interface RequisitesLegalParams {
    /***
     * @description
     * Organization INN.
     * Required.
     */
    inn: string
    /***
     * @description
     * Organization KPP.
     * Required.
     */
    kpp: string
    /***
     * @description
     * Organization actual address (free format).
     * Leave empty to clone legal address.
     * Optional.
     */
    fact_address?: string
}

export interface RequisitesBankParams {
    /***
     * @description
     * The BIC of bank.
     * Required.
     */
    bic: string
    /***
     * @description
     * Personal account number in bank.
     * Required.
     */
    account: string | number
}

export interface RequisitesContactsParams {
    /***
     * @description
     * Name of the contact person.
     * Required.
     */
    name: string
    /***
     * @description
     * Phone of the contact person (e164 format with/out +)
     * Required - if email not set.
     */
    phone?: string
    /***
     * @description
     * Email of the contact person.
     * Required - if phone not set.
     */
    email?: string
}
