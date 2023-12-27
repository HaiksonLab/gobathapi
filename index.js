"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoadMoreUp = exports.LoadMoreDown = exports.GobathApiCommunicationError = exports.GobathApiLimitError = exports.GobathApiError = exports.GobathApi = exports.Events = void 0;
//@ts-nocheck
const phantomfetcher_1 = require("phantomfetcher");
const axios_1 = __importDefault(require("axios"));
const [Events, requestsQueue] = [(0, phantomfetcher_1.PhantomEventEmitter)(), []];
exports.Events = Events;
class GobathApiError extends Error {
    constructor(code, message = '', fields = {}) {
        super();
        this.code = code;
        this.message = message;
        this.fields = fields;
    }
}
exports.GobathApiError = GobathApiError;
class GobathApiLimitError extends GobathApiError {
}
exports.GobathApiLimitError = GobathApiLimitError;
class GobathApiCommunicationError extends GobathApiError {
}
exports.GobathApiCommunicationError = GobathApiCommunicationError;
const GobathApi = (0, phantomfetcher_1.PhantomFetcher)(Events, (options, path, body, query) => {
    const method = path.at(-1);
    const url = `https://api.gobath.ru/${path.slice(0, -1).join('/').replace(/[A-Z]/g, l => `-${l.toLowerCase()}`).replace(/(^|[^a-z])-/g, '$1')}`; // CamelCase to snake-case, CAMELcase not allowed.
    const requestName = (typeof options.preventParallel == 'string') ? options.preventParallel : `${method} ${url}`;
    return (0, phantomfetcher_1.AsyncParallelismControl)(requestName, !!options.preventParallel, requestsQueue, () => __awaiter(void 0, void 0, void 0, function* () {
        let resp;
        let contentType;
        try {
            if (url === 'https://api.gobath.ru/upload') {
                resp = (yield axios_1.default.request({
                    method: method,
                    url,
                    data: body,
                    headers: body.getHeaders ? body.getHeaders() : { 'Content-Type': 'multipart/form-data' },
                    withCredentials: true,
                    maxContentLength: Infinity,
                    maxBodyLength: Infinity,
                    onUploadProgress: (event) => options.onProgress && options.onProgress((event.loaded * 100) / event.total, event),
                }));
                contentType = resp.headers["content-type"];
            }
            else {
                resp = yield (0, phantomfetcher_1.simpleApiFetch)(method, url, body, query, {}, Object.assign(Object.assign({}, options), { fetch_options: { credentials: "include" } }));
                contentType = resp.headers.get('content-type');
            }
        }
        catch (err) {
            throw new GobathApiCommunicationError('COMMUNICATION_ERROR', err.message);
        }
        if (contentType === null || contentType === void 0 ? void 0 : contentType.startsWith('application/json')) {
            const { data, meta, error } = resp.data || (yield resp.json());
            if (error) {
                const { code, message } = error, fields = __rest(error, ["code", "message"]);
                throw new GobathApiError(code, message, fields);
            }
            if (meta) {
                data.$meta = meta;
            }
            return data;
        }
        else {
            return yield resp.text();
        }
    }));
});
exports.GobathApi = GobathApi;
/**
 * Load more for GobathApi pagination (without using $meta)
 * @example:
 *    LoadMoreDown(this.notifications, 20, vue_infinity_scroll_event.done, async (ol) => {
 *        return await GobathApi().Notifications.Unread.SEARCH(ol);
 *    });
 */
function LoadMoreDown(list, load_by, done, fetch) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const more = yield fetch({
                offset: list.length,
                limit: load_by,
            });
            if (!more.length) {
                return done('empty');
            }
            list.push(...more);
            done('ok');
        }
        catch (err) {
            done('error');
        }
        /*if (more.length) {
            list.splice(0, more.length);
            setTimeout(()=>{
                list.push(...more);
                this.last_offset = this.last_offset + more.length;
                done('ok');
            }, 10)
        } else {
            done('empty');
        }*/
    });
}
exports.LoadMoreDown = LoadMoreDown;
/**
 * Load more for GobathApi pagination (without using $meta)
 * @example:
 *    LoadMoreUp(this.notifications, 20, vue_infinity_scroll_event.done, async (ol) => {
 *        return await GobathApi().Notifications.Unread.SEARCH(ol);
 *    });
 */
function LoadMoreUp(list, load_by, done, fetch) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const more = yield fetch({
                offset: list.length,
                limit: load_by,
            });
            if (!more.length) {
                return done('empty');
            }
            list.unshift(...more);
            done('ok');
        }
        catch (err) {
            done('error');
        }
    });
}
exports.LoadMoreUp = LoadMoreUp;
