const __import_meta_url = require('node:url').pathToFileURL(__filename).href;
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// ../../node_modules/.pnpm/hono@4.13.13/node_modules/hono/dist/http-exception.js
var init_http_exception = __esm({
  "../../node_modules/.pnpm/hono@4.13.13/node_modules/hono/dist/http-exception.js"() {
  }
});

// ../../node_modules/.pnpm/hono@4.13.13/node_modules/hono/dist/request/constants.js
var GET_MATCH_RESULT;
var init_constants = __esm({
  "../../node_modules/.pnpm/hono@4.13.13/node_modules/hono/dist/request/constants.js"() {
    GET_MATCH_RESULT = Symbol();
  }
});

// ../../node_modules/.pnpm/hono@4.13.13/node_modules/hono/dist/utils/crypto.js
var init_crypto = __esm({
  "../../node_modules/.pnpm/hono@4.13.13/node_modules/hono/dist/utils/crypto.js"() {
  }
});

// ../../node_modules/.pnpm/hono@4.13.13/node_modules/hono/dist/utils/buffer.js
var bufferToFormData;
var init_buffer = __esm({
  "../../node_modules/.pnpm/hono@4.13.13/node_modules/hono/dist/utils/buffer.js"() {
    init_crypto();
    bufferToFormData = (arrayBuffer, contentType) => {
      return new Response(arrayBuffer, { headers: { "Content-Type": contentType.replace(/^[^;]+/, (mediaType) => mediaType.toLowerCase()) } }).formData();
    };
  }
});

// ../../node_modules/.pnpm/hono@4.13.13/node_modules/hono/dist/utils/body.js
async function parseFormData(request, options) {
  if (!isRawRequest(request) && request.bodyCache.formData) return convertFormDataToBodyData(await request.bodyCache.formData, options);
  const headers = isRawRequest(request) ? request.headers : request.raw.headers;
  const arrayBuffer = await request.arrayBuffer();
  const formDataPromise = bufferToFormData(arrayBuffer, headers.get("Content-Type") || "");
  if (!isRawRequest(request)) request.bodyCache.formData = formDataPromise;
  const formData = await formDataPromise;
  if (formData) return convertFormDataToBodyData(formData, options);
  return {};
}
function convertFormDataToBodyData(formData, options) {
  const form = /* @__PURE__ */ Object.create(null);
  const nestingState = { count: 0 };
  formData.forEach((value, key) => {
    if (!(options.all || key.endsWith("[]"))) form[key] = value;
    else handleParsingAllValues(form, key, value);
  });
  if (options.dot) Object.entries(form).forEach(([key, value]) => {
    if (key.includes(".")) {
      handleParsingNestedValues(form, key, value, nestingState);
      delete form[key];
    }
  });
  return form;
}
var MAX_NESTED_OBJECTS, isRawRequest, parseBody, handleParsingAllValues, handleParsingNestedValues, throwNestingLimitExceeded;
var init_body = __esm({
  "../../node_modules/.pnpm/hono@4.13.13/node_modules/hono/dist/utils/body.js"() {
    init_buffer();
    MAX_NESTED_OBJECTS = 1e4;
    isRawRequest = (request) => "headers" in request;
    parseBody = async (request, options = /* @__PURE__ */ Object.create(null)) => {
      const { all = false, dot = false } = options;
      const mediaType = (isRawRequest(request) ? request.headers : request.raw.headers).get("Content-Type")?.split(";")[0].trim().toLowerCase();
      if (mediaType === "multipart/form-data" || mediaType === "application/x-www-form-urlencoded") return parseFormData(request, {
        all,
        dot
      });
      return {};
    };
    handleParsingAllValues = (form, key, value) => {
      if (form[key] !== void 0) {
        if (Array.isArray(form[key])) form[key].push(value);
        else form[key] = [form[key], value];
      } else if (!key.endsWith("[]")) form[key] = value;
      else form[key] = [value];
    };
    handleParsingNestedValues = (form, key, value, state) => {
      if (/(?:^|\.)__proto__\./.test(key)) return;
      let nestedForm = form;
      const keys = key.split(".", 34);
      if (keys.length > 33) throwNestingLimitExceeded();
      keys.forEach((key2, index) => {
        if (index === keys.length - 1) nestedForm[key2] = value;
        else {
          if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
            if (state.count++ >= MAX_NESTED_OBJECTS) throwNestingLimitExceeded();
            nestedForm[key2] = /* @__PURE__ */ Object.create(null);
          }
          nestedForm = nestedForm[key2];
        }
      });
    };
    throwNestingLimitExceeded = () => {
      throw new Error("Nesting limit exceeded");
    };
  }
});

// ../../node_modules/.pnpm/hono@4.13.13/node_modules/hono/dist/utils/url.js
var splitPath, splitRoutingPath, extractGroupsFromPath, replaceGroupMarks, patternCache, getPattern, tryDecode, tryDecodeURI, getPath, getPathNoStrict, mergePath, checkOptionalParameter, tryDecodeURIComponent, _decodeURI, _getQueryParam, getQueryParam, getQueryParams, decodeURIComponent_;
var init_url = __esm({
  "../../node_modules/.pnpm/hono@4.13.13/node_modules/hono/dist/utils/url.js"() {
    splitPath = (path19) => {
      const paths2 = path19.split("/");
      if (paths2[0] === "") paths2.shift();
      return paths2;
    };
    splitRoutingPath = (routePath) => {
      const { groups, path: path19 } = extractGroupsFromPath(routePath);
      const paths2 = splitPath(path19);
      return replaceGroupMarks(paths2, groups);
    };
    extractGroupsFromPath = (path19) => {
      const groups = [];
      path19 = path19.replace(/\{[^}]+\}/g, (match2, index) => {
        const mark = `@${index}`;
        groups.push([mark, match2]);
        return mark;
      });
      return {
        groups,
        path: path19
      };
    };
    replaceGroupMarks = (paths2, groups) => {
      for (let i2 = groups.length - 1; i2 >= 0; i2--) {
        const [mark] = groups[i2];
        for (let j = paths2.length - 1; j >= 0; j--) if (paths2[j].includes(mark)) {
          paths2[j] = paths2[j].replace(mark, groups[i2][1]);
          break;
        }
      }
      return paths2;
    };
    patternCache = {};
    getPattern = (label, next) => {
      if (label === "*") return "*";
      const match2 = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
      if (match2) {
        const cacheKey2 = `${label}#${next}`;
        if (!patternCache[cacheKey2]) {
          if (match2[2]) patternCache[cacheKey2] = next && next[0] !== ":" && next[0] !== "*" ? [
            cacheKey2,
            match2[1],
            new RegExp(`^${match2[2]}(?=/${next})`)
          ] : [
            label,
            match2[1],
            new RegExp(`^${match2[2]}$`)
          ];
          else patternCache[cacheKey2] = [
            label,
            match2[1],
            true
          ];
        }
        return patternCache[cacheKey2];
      }
      return null;
    };
    tryDecode = (str, decoder) => {
      try {
        return decoder(str);
      } catch {
        return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match2) => {
          try {
            return decoder(match2);
          } catch {
            return match2;
          }
        });
      }
    };
    tryDecodeURI = (str) => tryDecode(str, decodeURI);
    getPath = (request) => {
      const url = request.url;
      const start = url.indexOf("/", url.indexOf(":") + 4);
      let i2 = start;
      for (; i2 < url.length; i2++) {
        const charCode = url.charCodeAt(i2);
        if (charCode === 37) {
          const queryIndex = url.indexOf("?", i2);
          const hashIndex = url.indexOf("#", i2);
          const end = queryIndex === -1 ? hashIndex === -1 ? void 0 : hashIndex : hashIndex === -1 ? queryIndex : Math.min(queryIndex, hashIndex);
          const path19 = url.slice(start, end);
          return tryDecodeURI(path19.includes("%25") ? path19.replace(/%25/g, "%2525") : path19);
        } else if (charCode === 63 || charCode === 35) break;
      }
      return url.slice(start, i2);
    };
    getPathNoStrict = (request) => {
      const result = getPath(request);
      return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
    };
    mergePath = (base, sub, ...rest) => {
      if (rest.length) sub = mergePath(sub, ...rest);
      return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
    };
    checkOptionalParameter = (path19) => {
      if (path19.charCodeAt(path19.length - 1) !== 63 || !path19.includes(":")) return null;
      const segments = path19.split("/");
      const results = [];
      let basePath = "";
      segments.forEach((segment) => {
        if (segment !== "" && !/\:/.test(segment)) basePath += "/" + segment;
        else if (/\:/.test(segment)) {
          if (segment.charCodeAt(segment.length - 1) === 63) {
            if (results.length === 0 && basePath === "") results.push("/");
            else results.push(basePath);
            const optionalSegment = segment.slice(0, -1);
            basePath += "/" + optionalSegment;
            results.push(basePath);
          } else basePath += "/" + segment;
        }
      });
      return results.filter((v, i2, a2) => a2.indexOf(v) === i2);
    };
    tryDecodeURIComponent = (str) => str.indexOf("%") !== -1 ? tryDecode(str, decodeURIComponent_) : str;
    _decodeURI = (value) => {
      if (value.indexOf("+") !== -1) value = value.replace(/\+/g, " ");
      return tryDecodeURIComponent(value);
    };
    _getQueryParam = (url, key, multiple) => {
      const hashIndex = url.indexOf("#", 8);
      if (hashIndex !== -1) url = url.slice(0, hashIndex);
      let encoded;
      if (!multiple && key && key.indexOf("%") === -1 && key.indexOf("+") === -1) {
        let keyIndex2 = url.indexOf("?", 8);
        if (keyIndex2 === -1) return;
        if (!url.startsWith(key, keyIndex2 + 1)) keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
        while (keyIndex2 !== -1) {
          const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
          if (trailingKeyCode === 61) {
            const valueIndex = keyIndex2 + key.length + 2;
            const endIndex = url.indexOf("&", valueIndex);
            return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
          } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) return "";
          keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
        }
        encoded = /[%+]/.test(url);
        if (!encoded) return;
      }
      const results = /* @__PURE__ */ Object.create(null);
      encoded ??= /[%+]/.test(url);
      let keyIndex = url.indexOf("?", 8);
      while (keyIndex !== -1) {
        const nextKeyIndex = url.indexOf("&", keyIndex + 1);
        let valueIndex = url.indexOf("=", keyIndex);
        if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) valueIndex = -1;
        let name = url.slice(keyIndex + 1, valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex);
        if (encoded) name = _decodeURI(name);
        keyIndex = nextKeyIndex;
        if (name === "") continue;
        let value;
        if (valueIndex === -1) value = "";
        else {
          value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
          if (encoded) value = _decodeURI(value);
        }
        if (multiple) {
          if (!(results[name] && Array.isArray(results[name]))) results[name] = [];
          results[name].push(value);
        } else results[name] ??= value;
      }
      return key ? results[key] : results;
    };
    getQueryParam = _getQueryParam;
    getQueryParams = (url, key) => {
      return _getQueryParam(url, key, true);
    };
    decodeURIComponent_ = decodeURIComponent;
  }
});

// ../../node_modules/.pnpm/hono@4.13.13/node_modules/hono/dist/request.js
var HonoRequest;
var init_request = __esm({
  "../../node_modules/.pnpm/hono@4.13.13/node_modules/hono/dist/request.js"() {
    init_http_exception();
    init_constants();
    init_body();
    init_url();
    HonoRequest = class {
      /**
      * `.raw` can get the raw Request object.
      *
      * @see {@link https://hono.dev/docs/api/request#raw}
      *
      * @example
      * ```ts
      * // For Cloudflare Workers
      * app.post('/', async (c) => {
      *   const metadata = c.req.raw.cf?.hostMetadata?
      *   ...
      * })
      * ```
      */
      raw;
      #validatedData;
      #matchResult;
      routeIndex = 0;
      /**
      * `.path` can get the pathname of the request.
      *
      * @see {@link https://hono.dev/docs/api/request#path}
      *
      * @example
      * ```ts
      * app.get('/about/me', (c) => {
      *   const pathname = c.req.path // `/about/me`
      * })
      * ```
      */
      path;
      bodyCache = {};
      constructor(request, path19 = "/", matchResult = [[]]) {
        this.raw = request;
        this.path = path19;
        this.#matchResult = matchResult;
      }
      param(key) {
        return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
      }
      #getDecodedParam(key) {
        const paramKey = this.#matchResult[0][this.routeIndex]?.[1][key];
        const param = this.#getParamValue(paramKey);
        return param && tryDecodeURIComponent(param);
      }
      #getAllDecodedParams() {
        const decoded = {};
        const keys = Object.keys(this.#matchResult[0][this.routeIndex]?.[1] ?? {});
        for (const key of keys) {
          const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
          if (value !== void 0) decoded[key] = tryDecodeURIComponent(value);
        }
        return decoded;
      }
      #getParamValue(paramKey) {
        return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
      }
      query(key) {
        return getQueryParam(this.url, key);
      }
      queries(key) {
        return getQueryParams(this.url, key);
      }
      header(name) {
        if (name) return this.raw.headers.get(name) ?? void 0;
        const headerData = /* @__PURE__ */ Object.create(null);
        this.raw.headers.forEach((value, key) => {
          headerData[key] = value;
        });
        return headerData;
      }
      async parseBody(options) {
        return parseBody(this, options);
      }
      #cachedBody = (key) => {
        const { bodyCache, raw: raw2 } = this;
        const cachedBody = bodyCache[key];
        if (cachedBody) return cachedBody;
        for (const anyCachedKey in bodyCache) return bodyCache[anyCachedKey].then((body) => {
          if (anyCachedKey === "json") body = JSON.stringify(body);
          const contentType = anyCachedKey === "formData" ? void 0 : raw2.headers.get("content-type");
          return new Response(body, { headers: contentType ? { "Content-Type": contentType } : void 0 })[key]();
        });
        return bodyCache[key] = raw2[key]();
      };
      /**
      * `.json()` can parse Request body of type `application/json`
      *
      * @see {@link https://hono.dev/docs/api/request#json}
      *
      * @example
      * ```ts
      * app.post('/entry', async (c) => {
      *   const body = await c.req.json()
      * })
      * ```
      */
      json() {
        return this.#cachedBody("text").then((text) => JSON.parse(text));
      }
      /**
      * `.text()` can parse Request body of type `text/plain`
      *
      * @see {@link https://hono.dev/docs/api/request#text}
      *
      * @example
      * ```ts
      * app.post('/entry', async (c) => {
      *   const body = await c.req.text()
      * })
      * ```
      */
      text() {
        return this.#cachedBody("text");
      }
      /**
      * `.arrayBuffer()` parse Request body as an `ArrayBuffer`
      *
      * @see {@link https://hono.dev/docs/api/request#arraybuffer}
      *
      * @example
      * ```ts
      * app.post('/entry', async (c) => {
      *   const body = await c.req.arrayBuffer()
      * })
      * ```
      */
      arrayBuffer() {
        return this.#cachedBody("arrayBuffer");
      }
      /**
      * `.bytes()` parses the request body as a `Uint8Array`.
      *
      * @see {@link https://hono.dev/docs/api/request#bytes}
      *
      * @example
      * ```ts
      * app.post('/entry', async (c) => {
      *   const body = await c.req.bytes()
      * })
      * ```
      */
      bytes() {
        return this.#cachedBody("arrayBuffer").then((buffer) => new Uint8Array(buffer));
      }
      /**
      * Parses the request body as a `Blob`.
      * @example
      * ```ts
      * app.post('/entry', async (c) => {
      *   const body = await c.req.blob();
      * });
      * ```
      * @see https://hono.dev/docs/api/request#blob
      */
      blob() {
        return this.#cachedBody("blob");
      }
      /**
      * Parses the request body as `FormData`.
      * @example
      * ```ts
      * app.post('/entry', async (c) => {
      *   const body = await c.req.formData();
      * });
      * ```
      * @see https://hono.dev/docs/api/request#formdata
      */
      formData() {
        return this.#cachedBody("formData");
      }
      /**
      * Adds validated data to the request.
      *
      * @param target - The target of the validation.
      * @param data - The validated data to add.
      */
      addValidatedData(target, data) {
        (this.#validatedData ??= {})[target] = data;
      }
      valid(target) {
        return this.#validatedData?.[target];
      }
      /**
      * `.url` can get the request url strings.
      *
      * @see {@link https://hono.dev/docs/api/request#url}
      *
      * @example
      * ```ts
      * app.get('/about/me', (c) => {
      *   const url = c.req.url // `http://localhost:8787/about/me`
      *   ...
      * })
      * ```
      */
      get url() {
        return this.raw.url;
      }
      /**
      * `.method` can get the method name of the request.
      *
      * @see {@link https://hono.dev/docs/api/request#method}
      *
      * @example
      * ```ts
      * app.get('/about/me', (c) => {
      *   const method = c.req.method // `GET`
      * })
      * ```
      */
      get method() {
        return this.raw.method;
      }
      get [GET_MATCH_RESULT]() {
        return this.#matchResult;
      }
      /**
      * `.matchedRoutes` can return a matched route in the handler
      *
      * @deprecated
      *
      * Use matchedRoutes helper defined in "hono/route" instead.
      *
      * @see {@link https://hono.dev/docs/api/request#matchedroutes}
      *
      * @example
      * ```ts
      * app.use('*', async function logger(c, next) {
      *   await next()
      *   c.req.matchedRoutes.forEach(({ handler, method, path }, i) => {
      *     const name = handler.name || (handler.length < 2 ? '[handler]' : '[middleware]')
      *     console.log(
      *       method,
      *       ' ',
      *       path,
      *       ' '.repeat(Math.max(10 - path.length, 0)),
      *       name,
      *       i === c.req.routeIndex ? '<- respond from here' : ''
      *     )
      *   })
      * })
      * ```
      */
      get matchedRoutes() {
        return this.#matchResult[0].map(([[, route]]) => route);
      }
      /**
      * `.routePath` can retrieve the path registered within the handler
      *
      * @deprecated
      *
      * Use routePath helper defined in "hono/route" instead.
      *
      * @see {@link https://hono.dev/docs/api/request#routepath}
      *
      * @example
      * ```ts
      * app.get('/posts/:id', (c) => {
      *   return c.json({ path: c.req.routePath })
      * })
      * ```
      */
      get routePath() {
        return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
      }
    };
  }
});

// ../../node_modules/.pnpm/hono@4.13.13/node_modules/hono/dist/utils/html.js
var HtmlEscapedCallbackPhase, raw, resolveCallback;
var init_html = __esm({
  "../../node_modules/.pnpm/hono@4.13.13/node_modules/hono/dist/utils/html.js"() {
    HtmlEscapedCallbackPhase = {
      Stringify: 1,
      BeforeStream: 2,
      Stream: 3
    };
    raw = (value, callbacks) => {
      const escapedString = new String(value);
      escapedString.isEscaped = true;
      escapedString.callbacks = callbacks;
      return escapedString;
    };
    resolveCallback = async (str, phase, preserveCallbacks, context, buffer) => {
      if (typeof str === "object" && !(str instanceof String)) {
        if (!(str instanceof Promise)) str = str.toString();
        if (str instanceof Promise) str = await str;
      }
      const callbacks = str.callbacks;
      if (!callbacks?.length) return Promise.resolve(str);
      if (buffer) buffer[0] += str;
      else buffer = [str];
      const resStr = Promise.all(callbacks.map((c3) => c3({
        phase,
        buffer,
        context
      }))).then((res) => Promise.all(res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))).then(() => buffer[0]));
      if (preserveCallbacks) return raw(await resStr, callbacks);
      else return resStr;
    };
  }
});

// ../../node_modules/.pnpm/hono@4.13.13/node_modules/hono/dist/context.js
var TEXT_PLAIN, setDefaultContentType, createResponseInstance, Context;
var init_context = __esm({
  "../../node_modules/.pnpm/hono@4.13.13/node_modules/hono/dist/context.js"() {
    init_request();
    init_html();
    TEXT_PLAIN = "text/plain; charset=UTF-8";
    setDefaultContentType = (contentType, headers) => {
      return {
        "Content-Type": contentType,
        ...headers
      };
    };
    createResponseInstance = (body, init) => new Response(body, init);
    Context = class {
      #rawRequest;
      #req;
      /**
      * `.env` can get bindings (environment variables, secrets, KV namespaces, D1 database, R2 bucket etc.) in Cloudflare Workers.
      *
      * @see {@link https://hono.dev/docs/api/context#env}
      *
      * @example
      * ```ts
      * // Environment object for Cloudflare Workers
      * app.get('*', async c => {
      *   const counter = c.env.COUNTER
      * })
      * ```
      */
      env = {};
      #var;
      finalized = false;
      /**
      * `.error` can get the error object from the middleware if the Handler throws an error.
      *
      * @see {@link https://hono.dev/docs/api/context#error}
      *
      * @example
      * ```ts
      * app.use('*', async (c, next) => {
      *   await next()
      *   if (c.error) {
      *     // do something...
      *   }
      * })
      * ```
      */
      error;
      #status;
      #executionCtx;
      #res;
      #layout;
      #renderer;
      #notFoundHandler;
      #preparedHeaders;
      #matchResult;
      #path;
      /**
      * Creates an instance of the Context class.
      *
      * @param req - The Request object.
      * @param options - Optional configuration options for the context.
      */
      constructor(req, options) {
        this.#rawRequest = req;
        if (options) {
          this.#executionCtx = options.executionCtx;
          this.env = options.env;
          this.#notFoundHandler = options.notFoundHandler;
          this.#path = options.path;
          this.#matchResult = options.matchResult;
        }
      }
      /**
      * `.req` is the instance of {@link HonoRequest}.
      */
      get req() {
        this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
        return this.#req;
      }
      /**
      * @see {@link https://hono.dev/docs/api/context#event}
      * The FetchEvent associated with the current request.
      *
      * @throws Will throw an error if the context does not have a FetchEvent.
      */
      get event() {
        if (this.#executionCtx && "respondWith" in this.#executionCtx) return this.#executionCtx;
        else throw Error("This context has no FetchEvent");
      }
      /**
      * @see {@link https://hono.dev/docs/api/context#executionctx}
      * The ExecutionContext associated with the current request.
      *
      * @throws Will throw an error if the context does not have an ExecutionContext.
      */
      get executionCtx() {
        if (this.#executionCtx) return this.#executionCtx;
        else throw Error("This context has no ExecutionContext");
      }
      /**
      * @see {@link https://hono.dev/docs/api/context#res}
      * The Response object for the current request.
      */
      get res() {
        return this.#res ||= createResponseInstance(null, { headers: this.#preparedHeaders ??= new Headers() });
      }
      /**
      * Sets the Response object for the current request.
      *
      * @param _res - The Response object to set.
      */
      set res(_res) {
        if (this.#res && _res) {
          _res = createResponseInstance(_res.body, _res);
          for (const [k, v] of this.#res.headers.entries()) {
            if (k === "content-type") continue;
            if (k === "set-cookie") {
              const cookies = this.#res.headers.getSetCookie();
              _res.headers.delete("set-cookie");
              for (const cookie of cookies) _res.headers.append("set-cookie", cookie);
            } else _res.headers.set(k, v);
          }
        }
        this.#res = _res;
        this.finalized = true;
      }
      /**
      * `.render()` can create a response within a layout.
      *
      * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
      *
      * @example
      * ```ts
      * app.get('/', (c) => {
      *   return c.render('Hello!')
      * })
      * ```
      */
      render = (...args) => {
        this.#renderer ??= (content) => this.html(content);
        return this.#renderer(...args);
      };
      /**
      * Sets the layout for the response.
      *
      * @param layout - The layout to set.
      * @returns The layout function.
      */
      setLayout = (layout) => this.#layout = layout;
      /**
      * Gets the current layout for the response.
      *
      * @returns The current layout function.
      */
      getLayout = () => this.#layout;
      /**
      * `.setRenderer()` can set the layout in the custom middleware.
      *
      * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
      *
      * @example
      * ```tsx
      * app.use('*', async (c, next) => {
      *   c.setRenderer((content) => {
      *     return c.html(
      *       <html>
      *         <body>
      *           <p>{content}</p>
      *         </body>
      *       </html>
      *     )
      *   })
      *   await next()
      * })
      * ```
      */
      setRenderer = (renderer) => {
        this.#renderer = renderer;
      };
      /**
      * `.header()` can set headers.
      *
      * @see {@link https://hono.dev/docs/api/context#header}
      *
      * @example
      * ```ts
      * app.get('/welcome', (c) => {
      *   // Set headers
      *   c.header('X-Message', 'Hello!')
      *   c.header('Content-Type', 'text/plain')
      *
      *   // Append multiple headers using the append option (e.g. Vary)
      *   c.header('Vary', 'Accept-Encoding', { append: true })
      *   c.header('Vary', 'User-Agent', { append: true })
      *
      *   return c.body('Thank you for coming')
      * })
      * ```
      */
      header = (name, value, options) => {
        if (this.finalized) this.#res = createResponseInstance(this.#res.body, this.#res);
        const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers();
        if (value === void 0) headers.delete(name);
        else if (options?.append) headers.append(name, value);
        else headers.set(name, value);
      };
      status = (status) => {
        this.#status = status;
      };
      /**
      * `.set()` can set the value specified by the key.
      *
      * @see {@link https://hono.dev/docs/api/context#set-get}
      *
      * @example
      * ```ts
      * app.use('*', async (c, next) => {
      *   c.set('message', 'Hono is hot!!')
      *   await next()
      * })
      * ```
      */
      set = (key, value) => {
        this.#var ??= /* @__PURE__ */ new Map();
        this.#var.set(key, value);
      };
      /**
      * `.get()` can use the value specified by the key.
      *
      * @see {@link https://hono.dev/docs/api/context#set-get}
      *
      * @example
      * ```ts
      * app.get('/', (c) => {
      *   const message = c.get('message')
      *   return c.text(`The message is "${message}"`)
      * })
      * ```
      */
      get = (key) => {
        return this.#var ? this.#var.get(key) : void 0;
      };
      /**
      * `.var` can access the value of a variable.
      *
      * @see {@link https://hono.dev/docs/api/context#var}
      *
      * @example
      * ```ts
      * const result = c.var.client.oneMethod()
      * ```
      */
      get var() {
        if (!this.#var) return {};
        return Object.fromEntries(this.#var);
      }
      #newResponse(data, arg, headers) {
        let responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders;
        if (typeof arg === "object" && arg.headers) {
          responseHeaders ??= new Headers();
          for (const [key, value] of new Headers(arg.headers)) if (key === "set-cookie") responseHeaders.append(key, value);
          else responseHeaders.set(key, value);
        }
        if (headers) {
          if (!responseHeaders) {
            let count2 = 0;
            for (const k in headers) if (++count2 > 1 || typeof headers[k] !== "string") {
              responseHeaders = new Headers();
              break;
            }
          }
          if (responseHeaders) for (const k in headers) {
            const v = headers[k];
            if (typeof v === "string") responseHeaders.set(k, v);
            else {
              responseHeaders.delete(k);
              for (const v2 of v) responseHeaders.append(k, v2);
            }
          }
        }
        const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
        return createResponseInstance(data, {
          status,
          headers: responseHeaders ?? headers
        });
      }
      newResponse = (...args) => this.#newResponse(...args);
      /**
      * `.body()` can return the HTTP response.
      * You can set headers with `.header()` and set HTTP status code with `.status`.
      * This can also be set in `.text()`, `.json()` and so on.
      *
      * @see {@link https://hono.dev/docs/api/context#body}
      *
      * @example
      * ```ts
      * app.get('/welcome', (c) => {
      *   // Set headers
      *   c.header('X-Message', 'Hello!')
      *   c.header('Content-Type', 'text/plain')
      *   // Set HTTP status code
      *   c.status(201)
      *
      *   // Return the response body
      *   return c.body('Thank you for coming')
      * })
      * ```
      */
      body = (data, arg, headers) => this.#newResponse(data, arg, headers);
      /**
      * `.text()` can render text as `Content-Type:text/plain`.
      *
      * @see {@link https://hono.dev/docs/api/context#text}
      *
      * @example
      * ```ts
      * app.get('/say', (c) => {
      *   return c.text('Hello!')
      * })
      * ```
      */
      text = (text, arg, headers) => {
        return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text) : this.#newResponse(text, arg, setDefaultContentType(TEXT_PLAIN, headers));
      };
      /**
      * `.json()` can render JSON as `Content-Type:application/json`.
      *
      * @see {@link https://hono.dev/docs/api/context#json}
      *
      * @example
      * ```ts
      * app.get('/api', (c) => {
      *   return c.json({ message: 'Hello!' })
      * })
      * ```
      */
      json = (object, arg, headers) => {
        return this.#newResponse(JSON.stringify(object), arg, setDefaultContentType("application/json", headers));
      };
      html = (html, arg, headers) => {
        const res = (html2) => this.#newResponse(html2, arg, setDefaultContentType("text/html; charset=UTF-8", headers));
        return typeof html === "object" ? resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html);
      };
      /**
      * `.redirect()` can Redirect, default status code is 302.
      *
      * @see {@link https://hono.dev/docs/api/context#redirect}
      *
      * @example
      * ```ts
      * app.get('/redirect', (c) => {
      *   return c.redirect('/')
      * })
      * app.get('/redirect-permanently', (c) => {
      *   return c.redirect('/', 301)
      * })
      * ```
      */
      redirect = (location, status) => {
        const locationString = String(location);
        this.header("Location", !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString));
        return this.newResponse(null, status ?? 302);
      };
      /**
      * `.notFound()` can return the Not Found Response.
      *
      * @see {@link https://hono.dev/docs/api/context#notfound}
      *
      * @example
      * ```ts
      * app.get('/notfound', (c) => {
      *   return c.notFound()
      * })
      * ```
      */
      notFound = () => {
        this.#notFoundHandler ??= () => createResponseInstance();
        return this.#notFoundHandler(this);
      };
    };
  }
});

// ../../packages/core/src/paths.ts
function ensureDirs() {
  for (const p of Object.values(paths).filter((p2) => !p2.endsWith(".json"))) {
    import_node_fs.default.mkdirSync(p, { recursive: true });
  }
}
var import_node_os, import_node_path, import_node_fs, HMX_HOME, paths;
var init_paths = __esm({
  "../../packages/core/src/paths.ts"() {
    "use strict";
    import_node_os = __toESM(require("node:os"), 1);
    import_node_path = __toESM(require("node:path"), 1);
    import_node_fs = __toESM(require("node:fs"), 1);
    HMX_HOME = process.env.HMX_HOME ?? import_node_path.default.join(import_node_os.default.homedir(), ".hmx");
    paths = {
      home: HMX_HOME,
      sessions: import_node_path.default.join(HMX_HOME, "sessions"),
      chromeData: import_node_path.default.join(HMX_HOME, "chrome-data"),
      assets: import_node_path.default.join(HMX_HOME, "assets"),
      media: import_node_path.default.join(HMX_HOME, "media"),
      logs: import_node_path.default.join(HMX_HOME, "logs"),
      providersConfig: import_node_path.default.join(HMX_HOME, "providers"),
      accounts: import_node_path.default.join(HMX_HOME, "accounts"),
      catalogFile: import_node_path.default.join(HMX_HOME, "assets", "catalog.json")
    };
  }
});

// ../../packages/core/src/env.ts
function loadEnv(dir = process.cwd()) {
  const file = import_node_path2.default.join(dir, ".env");
  if (!import_node_fs2.default.existsSync(file)) return;
  for (const line of import_node_fs2.default.readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (val.startsWith('"') && val.endsWith('"') || val.startsWith("'") && val.endsWith("'")) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}
var import_node_fs2, import_node_path2;
var init_env = __esm({
  "../../packages/core/src/env.ts"() {
    "use strict";
    import_node_fs2 = __toESM(require("node:fs"), 1);
    import_node_path2 = __toESM(require("node:path"), 1);
  }
});

// ../../packages/core/src/llm.ts
function* parseSseTokens(chunk) {
  for (const line of chunk.split("\n")) {
    const t = line.trim();
    if (!t.startsWith("data:")) continue;
    const payload = t.slice(5).trim();
    if (payload === "[DONE]") return;
    try {
      const delta = JSON.parse(payload)?.choices?.[0]?.delta?.content;
      if (typeof delta === "string") yield delta;
    } catch {
    }
  }
}
var LlmClient;
var init_llm = __esm({
  "../../packages/core/src/llm.ts"() {
    "use strict";
    LlmClient = class _LlmClient {
      constructor(cfg) {
        this.cfg = cfg;
      }
      static fromEnv() {
        const baseUrl = process.env.HMX_LLM_BASE_URL ?? "http://localhost:11434/v1";
        const model = process.env.HMX_LLM_MODEL ?? "qwen2.5:14b";
        const apiKey = process.env.HMX_LLM_API_KEY;
        return new _LlmClient({ baseUrl, apiKey, model });
      }
      /** Session seviyesinde model override'i (kural: model degisince session bozulmaz) */
      withModel(model) {
        return new _LlmClient({ ...this.cfg, model });
      }
      get model() {
        return this.cfg.model;
      }
      get baseUrl() {
        return this.cfg.baseUrl;
      }
      async chat(messages) {
        const res = await fetch(`${this.cfg.baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            ...this.cfg.apiKey ? { authorization: `Bearer ${this.cfg.apiKey}` } : {}
          },
          body: JSON.stringify({ model: this.cfg.model, messages, temperature: 0.2 })
        });
        if (!res.ok) {
          throw new Error(`LLM istegi basarisiz: ${res.status} ${await res.text()}`);
        }
        const data = await res.json();
        return data.choices?.[0]?.message?.content ?? "";
      }
      /** Streaming chat: her token icin onToken cagrilir, tam metin dondurulur */
      async chatStream(messages, onToken) {
        const res = await fetch(`${this.cfg.baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            ...this.cfg.apiKey ? { authorization: `Bearer ${this.cfg.apiKey}` } : {}
          },
          body: JSON.stringify({ model: this.cfg.model, messages, temperature: 0.2, stream: true })
        });
        if (!res.ok) {
          throw new Error(`LLM stream istegi basarisiz: ${res.status} ${await res.text()}`);
        }
        if (!res.body) throw new Error("LLM stream govdesi yok");
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let full = "";
        let pending = "";
        for (; ; ) {
          const { done, value } = await reader.read();
          if (done) break;
          pending += decoder.decode(value, { stream: true });
          const lastBreak = pending.lastIndexOf("\n\n");
          if (lastBreak < 0) continue;
          const ready = pending.slice(0, lastBreak);
          pending = pending.slice(lastBreak + 2);
          for (const token of parseSseTokens(ready)) {
            full += token;
            onToken(token);
          }
        }
        if (pending.trim()) {
          for (const token of parseSseTokens(pending)) {
            full += token;
            onToken(token);
          }
        }
        return full;
      }
      /** Endpoint'in bildigi modelleri listeler (OpenAI GET /models) */
      async listModels() {
        const res = await fetch(`${this.cfg.baseUrl}/models`, {
          headers: this.cfg.apiKey ? { authorization: `Bearer ${this.cfg.apiKey}` } : {}
        });
        if (!res.ok) throw new Error(`Model listesi alinamadi: HTTP ${res.status}`);
        const data = await res.json();
        return (data.data ?? []).map((m) => m.id).filter(Boolean).sort();
      }
    };
  }
});

// ../../packages/core/src/store.ts
function readJson(file) {
  try {
    return JSON.parse(import_node_fs3.default.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}
function writeJson(file, data) {
  import_node_fs3.default.mkdirSync(import_node_path3.default.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  import_node_fs3.default.writeFileSync(tmp, JSON.stringify(data, null, 2));
  import_node_fs3.default.renameSync(tmp, file);
}
function listJsonFiles(dir) {
  if (!import_node_fs3.default.existsSync(dir)) return [];
  return import_node_fs3.default.readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => import_node_path3.default.join(dir, f));
}
var import_node_fs3, import_node_path3;
var init_store = __esm({
  "../../packages/core/src/store.ts"() {
    "use strict";
    import_node_fs3 = __toESM(require("node:fs"), 1);
    import_node_path3 = __toESM(require("node:path"), 1);
  }
});

// ../../packages/core/src/index.ts
var src_exports = {};
__export(src_exports, {
  HMX_HOME: () => HMX_HOME,
  LlmClient: () => LlmClient,
  ensureDirs: () => ensureDirs,
  listJsonFiles: () => listJsonFiles,
  loadEnv: () => loadEnv,
  parseSseTokens: () => parseSseTokens,
  paths: () => paths,
  readJson: () => readJson,
  writeJson: () => writeJson
});
var init_src = __esm({
  "../../packages/core/src/index.ts"() {
    "use strict";
    init_paths();
    init_env();
    init_llm();
    init_store();
  }
});

// ../../packages/providers/src/chrome.ts
function findChromeExe() {
  const candidates = [];
  if (process.platform === "win32") {
    const local = process.env.LOCALAPPDATA ?? "";
    candidates.push(
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
      import_node_path4.default.join(local, "Google\\Chrome\\Application\\chrome.exe")
    );
  } else if (process.platform === "darwin") {
    candidates.push("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome");
  } else {
    candidates.push("/usr/bin/google-chrome", "/usr/bin/chromium-browser", "/usr/bin/chromium");
  }
  for (const c3 of candidates) if (import_node_fs4.default.existsSync(c3)) return c3;
  return null;
}
function chromeUserDataDir() {
  if (process.platform === "win32") {
    return import_node_path4.default.join(process.env.LOCALAPPDATA ?? "", "Google", "Chrome", "User Data");
  }
  if (process.platform === "darwin") {
    return import_node_path4.default.join(import_node_os2.default.homedir(), "Library", "Application Support", "Google", "Chrome");
  }
  return import_node_path4.default.join(import_node_os2.default.homedir(), ".config", "google-chrome");
}
function listChromeProfiles(userDataDir = chromeUserDataDir()) {
  const localState = import_node_path4.default.join(userDataDir, "Local State");
  const out = [];
  try {
    const raw2 = JSON.parse(import_node_fs4.default.readFileSync(localState, "utf8"));
    const cache = raw2?.profile?.info_cache ?? {};
    for (const [dir, info] of Object.entries(cache)) {
      out.push({ dir, name: info.name ?? dir, email: info.user_name || void 0 });
    }
  } catch {
    if (import_node_fs4.default.existsSync(userDataDir)) {
      for (const d of import_node_fs4.default.readdirSync(userDataDir)) {
        if (d === "Default" || /^Profile \d+$/.test(d)) out.push({ dir: d, name: d });
      }
    }
  }
  return out;
}
function ensureProfileCopy(profileDir, force = false) {
  const srcRoot = chromeUserDataDir();
  const srcProfile = import_node_path4.default.join(srcRoot, profileDir);
  const dstProfile = import_node_path4.default.join(HMX_CHROME_DATA, profileDir);
  import_node_fs4.default.mkdirSync(HMX_CHROME_DATA, { recursive: true });
  if (import_node_fs4.default.existsSync(dstProfile) && !force) return;
  if (!import_node_fs4.default.existsSync(srcProfile)) {
    import_node_fs4.default.mkdirSync(dstProfile, { recursive: true });
    return;
  }
  console.log(`Profil kopyalaniyor: ${profileDir} (boyuta gore 1-2 dk surebilir)...`);
  import_node_fs4.default.cpSync(srcProfile, dstProfile, { recursive: true, force: true });
  const localState = import_node_path4.default.join(srcRoot, "Local State");
  if (import_node_fs4.default.existsSync(localState)) {
    import_node_fs4.default.copyFileSync(localState, import_node_path4.default.join(HMX_CHROME_DATA, "Local State"));
  }
  console.log("Profil kopyalandi.");
}
function readDevToolsPort(userDataDir) {
  try {
    const raw2 = import_node_fs4.default.readFileSync(import_node_path4.default.join(userDataDir, "DevToolsActivePort"), "utf8");
    const port2 = Number(raw2.split("\n")[0].trim());
    return Number.isInteger(port2) && port2 > 0 ? port2 : null;
  } catch {
    return null;
  }
}
async function waitForDebugger(proc, userDataDir, timeoutMs = 6e4) {
  const start = Date.now();
  let stderr = "";
  proc.stderr?.on("data", (d) => {
    stderr += d.toString();
  });
  while (Date.now() - start < timeoutMs) {
    const port2 = readDevToolsPort(userDataDir);
    if (port2) {
      try {
        const res = await fetch(`http://127.0.0.1:${port2}/json/version`);
        if (res.ok) return port2;
      } catch {
      }
    }
    if (proc.exitCode !== null) {
      throw new Error(
        `Chrome beklenmedik sekilde kapandi (debug portu hic acilmadi).
Son Chrome ciktisi:
${stderr.slice(-800) || "(cikti yok)"}`
      );
    }
    await sleep(400);
  }
  throw new Error(
    `Chrome debug portu ${timeoutMs / 1e3} sn icinde acilmadi. Antivirus/firewall 127.0.0.1 baglantisini engelliyor olabilir.`
  );
}
async function launchRealChrome(opts) {
  const exe = findChromeExe();
  if (!exe) throw new Error("Chrome bulunamadi. Google Chrome kurulu olmali.");
  import_node_fs4.default.mkdirSync(HMX_CHROME_DATA, { recursive: true });
  const args = [
    "--remote-debugging-port=0",
    // 0 = bos port sec; DevToolsActivePort'tan okunur
    `--user-data-dir=${HMX_CHROME_DATA}`,
    // izole dizin -> debug portu calisir
    "--remote-allow-origins=*",
    // Playwright WS baglantisi icin ZORUNLU
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-session-crashed-bubble",
    // "sayfalari geri yukle" balonunu kapat
    "--hide-crash-restore-bubble",
    "--disable-features=ChromeWhatsNewUI"
  ];
  if (opts.profileDir) args.push(`--profile-directory=${opts.profileDir}`);
  if (opts.headless) args.push("--headless=new");
  else args.push("--start-maximized");
  args.push(opts.url);
  const proc = (0, import_node_child_process.spawn)(exe, args, { stdio: ["ignore", "ignore", "pipe"] });
  const port2 = await waitForDebugger(proc, HMX_CHROME_DATA);
  return { proc, port: port2 };
}
async function connectChrome(port2) {
  const { chromium } = await import("playwright");
  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${port2}`);
  const context = browser.contexts()[0] ?? await browser.newContext();
  return { browser, context };
}
var import_node_fs4, import_node_os2, import_node_path4, import_node_child_process, HMX_CHROME_DATA, sleep;
var init_chrome = __esm({
  "../../packages/providers/src/chrome.ts"() {
    "use strict";
    import_node_fs4 = __toESM(require("node:fs"), 1);
    import_node_os2 = __toESM(require("node:os"), 1);
    import_node_path4 = __toESM(require("node:path"), 1);
    import_node_child_process = require("node:child_process");
    init_src();
    HMX_CHROME_DATA = paths.chromeData;
    sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  }
});

// ../../packages/providers/src/account-pool.ts
function quotaCooldownMs() {
  const v = Number(process.env.HMX_QUOTA_COOLDOWN_MS);
  return Number.isFinite(v) && v > 0 ? v : 6 * 60 * 60 * 1e3;
}
var import_node_fs5, import_node_path5, import_node_crypto, AccountPool;
var init_account_pool = __esm({
  "../../packages/providers/src/account-pool.ts"() {
    "use strict";
    import_node_fs5 = __toESM(require("node:fs"), 1);
    import_node_path5 = __toESM(require("node:path"), 1);
    import_node_crypto = __toESM(require("node:crypto"), 1);
    init_src();
    AccountPool = class {
      constructor(rootDir = paths.accounts) {
        this.rootDir = rootDir;
        ensureDirs();
      }
      dir(providerId) {
        return import_node_path5.default.join(this.rootDir, providerId);
      }
      file(providerId, accountId) {
        return import_node_path5.default.join(this.dir(providerId), `${accountId}.json`);
      }
      list(providerId) {
        const out = [];
        for (const f of listJsonFiles(this.dir(providerId))) {
          const acc = readJson(f);
          if (acc) out.push(acc);
        }
        return out.sort((a2, b) => (a2.lastUsedAt ?? 0) - (b.lastUsedAt ?? 0));
      }
      listAll() {
        const out = [];
        try {
          for (const d of import_node_fs5.default.readdirSync(this.rootDir)) {
            out.push(...this.list(d));
          }
        } catch {
        }
        return out;
      }
      add(acc) {
        const full = {
          status: "active",
          failCount: 0,
          ...acc,
          id: acc.id ?? `${acc.providerId}-${import_node_crypto.default.randomBytes(3).toString("hex")}`
        };
        writeJson(this.file(full.providerId, full.id), full);
        return full;
      }
      remove(providerId, accountId) {
        try {
          import_node_fs5.default.unlinkSync(this.file(providerId, accountId));
          return true;
        } catch {
          return false;
        }
      }
      save(acc) {
        writeJson(this.file(acc.providerId, acc.id), acc);
      }
      /** Kullanilabilir ilk hesap: aktif + cooldown'u gecmis + exclude disinda + en az kullanilan */
      pickNext(providerId, exclude) {
        const now = Date.now();
        const usable = this.list(providerId).filter((a2) => {
          if (a2.status === "error") return false;
          if (a2.status === "cooldown" && (a2.cooldownUntil ?? 0) > now) return false;
          if (exclude?.has(a2.id)) return false;
          return true;
        });
        return usable[0] ?? null;
      }
      /** Kota hatasi -> cooldown (varsayilan 6 saat); normal hata -> failCount++, 3'te "error" */
      reportFailure(acc, isQuota, error) {
        if (isQuota) {
          acc.status = "cooldown";
          acc.cooldownUntil = Date.now() + quotaCooldownMs();
          acc.notes = `kota: ${error.slice(0, 200)}`;
        } else {
          acc.failCount++;
          if (acc.failCount >= 3) {
            acc.status = "error";
            acc.notes = `3 ardisik hata: ${error.slice(0, 200)}`;
          }
        }
        this.save(acc);
      }
      /** Basari: failCount sifirla, cooldown kaldir, lastUsedAt guncelle */
      reportSuccess(acc) {
        acc.status = "active";
        acc.failCount = 0;
        delete acc.cooldownUntil;
        acc.lastUsedAt = Date.now();
        this.save(acc);
      }
    };
  }
});

// ../../packages/providers/src/quota.ts
function isQuotaError(errOrText, indicators = DEFAULT_QUOTA_INDICATORS) {
  const text = (errOrText instanceof Error ? errOrText.message : String(errOrText)).toLowerCase();
  return indicators.some((i2) => text.includes(i2.toLowerCase()));
}
var DEFAULT_QUOTA_INDICATORS, QuotaError;
var init_quota = __esm({
  "../../packages/providers/src/quota.ts"() {
    "use strict";
    DEFAULT_QUOTA_INDICATORS = [
      "quota exceeded",
      "kota doldu",
      "rate limit",
      "usage limit reached",
      "too many requests",
      "429"
    ];
    QuotaError = class extends Error {
      constructor(providerId) {
        super(`${providerId}: kota doldu (baska hesap denenecek)`);
        this.providerId = providerId;
        this.name = "QuotaError";
      }
    };
  }
});

// ../../packages/providers/src/base/browser-session-provider.ts
var import_node_path6, import_node_fs6, import_node_readline, BrowserSessionProvider;
var init_browser_session_provider = __esm({
  "../../packages/providers/src/base/browser-session-provider.ts"() {
    "use strict";
    import_node_path6 = __toESM(require("node:path"), 1);
    import_node_fs6 = __toESM(require("node:fs"), 1);
    import_node_readline = __toESM(require("node:readline"), 1);
    init_src();
    init_chrome();
    init_account_pool();
    init_quota();
    BrowserSessionProvider = class {
      constructor(cfg, pool = new AccountPool()) {
        this.cfg = cfg;
        this.pool = pool;
      }
      authMode = "browser-session";
      selector(key) {
        const sel = this.cfg.selectors?.[key];
        if (!sel) throw new Error(`[${this.id}] selector tanimli degil: ${key} (config/providers/${this.id}.json)`);
        return sel;
      }
      /** Havuzda kullanilabilir hesap var mi? (Chrome baslatmadan, ucuz kontrol) */
      async isAvailable() {
        return !!this.pool.pickNext(this.id);
      }
      /**
       * Interaktif giris: gercek Chrome profillerini listeler, kullaniciya sektirir,
       * o profille Chrome'u acar; kullanici siteye elle girer, Enter'a basinca oturum
       * hesap havuzuna kaydedilir (Bolum 3.2 giris akisi).
       */
      async interactiveLogin(label) {
        ensureDirs();
        if (!findChromeExe()) throw new Error("Google Chrome bulunamadi. Once Chrome kur.");
        const profiles = listChromeProfiles();
        if (profiles.length === 0) throw new Error("Chrome profili bulunamadi.");
        console.log("\nChrome profillerin:");
        profiles.forEach((p, i2) => {
          console.log(`  [${i2 + 1}] ${p.name}${p.email ? `  (${p.email})` : ""}  \u2014 ${p.dir}`);
        });
        const answer = await this.ask(`
Hangi profille giris yapilsin? (1-${profiles.length}): `);
        const idx = parseInt(answer, 10) - 1;
        const chosen = profiles[idx];
        if (!chosen) throw new Error("Gecersiz secim.");
        ensureProfileCopy(chosen.dir);
        console.log(`
Chrome aciliyor (profil: ${chosen.name})...`);
        const { proc } = await launchRealChrome({ url: this.cfg.baseUrl, profileDir: chosen.dir });
        console.log(`[${this.id}] Acilan Chrome'da giris yap (${this.cfg.baseUrl}).`);
        await this.ask("Giris bitince burada Enter'a bas...");
        proc.kill("SIGTERM");
        const acc = this.pool.add({
          providerId: this.id,
          label: label ?? (chosen.email ? `${chosen.name} (${chosen.email})` : chosen.name),
          profileDirectory: chosen.dir
        });
        console.log(`[${this.id}] Hesap kaydedildi: ${acc.label} (${acc.id})`);
        return acc;
      }
      ask(q) {
        const rl = import_node_readline.default.createInterface({ input: process.stdin, output: process.stdout });
        return new Promise((res) => rl.question(q, (a2) => {
          rl.close();
          res(a2.trim());
        }));
      }
      /** Kayitli hesabin profiliyle gercek Chrome'u baslatip bir sayfa uzerinde islem yapar */
      async withPage(acc, job) {
        if (!acc.profileDirectory) {
          throw new Error(`[${this.id}] Hesapta Chrome profili yok: ${acc.id}. Yeniden hesap ekleyin.`);
        }
        const headless = process.env.HMX_HEADLESS === "1";
        const { proc, port: port2 } = await launchRealChrome({
          url: this.cfg.baseUrl,
          profileDir: acc.profileDirectory,
          headless
        });
        try {
          const { browser, context } = await connectChrome(port2);
          const page = context.pages()[0] ?? await context.newPage();
          const result = await job(page);
          await browser.close().catch(() => {
          });
          return result;
        } finally {
          proc.kill("SIGTERM");
        }
      }
      /**
       * Kota rotasyon dongusu (Bolum 2.2): kota dolan hesap cooldown'a alinir,
       * siradaki hesapla devam edilir. Kota disi hata aninda firlatilir
       * (baska hesap denemek anlamsizdir).
       */
      async generateWithRotation(job) {
        const tried = /* @__PURE__ */ new Set();
        for (; ; ) {
          const acc = this.pool.pickNext(this.id, tried);
          if (!acc) throw new Error(
            `${this.id}: kullanilabilir hesap kalmadi (hepsi kota/hata durumunda). Panelden yeni hesap ekleyin veya cooldown bitmesini bekleyin.`
          );
          tried.add(acc.id);
          try {
            const result = await this.withPage(acc, (page) => job(acc, page));
            this.pool.reportSuccess(acc);
            return result;
          } catch (e) {
            const quota = e instanceof QuotaError || isQuotaError(e, this.cfg.quotaIndicators);
            this.pool.reportFailure(acc, quota, String(e));
            if (!quota) throw e;
          }
        }
      }
      /** Sayfa govde metni kota gostergelerine karsi taranir (Bolum 2.2 detectQuota) */
      async detectQuota(page) {
        const text = await page.textContent("body").catch(() => "") ?? "";
        return isQuotaError(text, this.cfg.quotaIndicators);
      }
      /** Ortak akis: prompt yaz -> uret -> kota kontrolu -> sonucu bekle -> indir -> dogrula */
      async runSiteFlow(req, minBytes) {
        try {
          return await this.generateWithRotation(async (_acc, page) => {
            await page.goto(this.cfg.baseUrl, { waitUntil: "domcontentloaded" });
            if (req.voiceId && this.cfg.selectors?.[`voice_${req.voiceId}`]) {
              await page.click(this.selector("voicePicker"));
              await page.click(this.selector(`voice_${req.voiceId}`));
            }
            if (req.aspectRatio && this.cfg.selectors?.aspectSelect) {
              await page.selectOption(this.selector("aspectSelect"), req.aspectRatio).catch(() => {
              });
            }
            await page.fill(this.selector("promptInput"), req.prompt);
            await page.click(this.selector("submitButton"));
            await page.waitForTimeout(3e3);
            if (await this.detectQuota(page)) throw new QuotaError(this.id);
            const timeout = this.cfg.timeouts?.generateMs ?? 3e5;
            await page.waitForSelector(this.selector("resultItem"), { timeout });
            if (await this.detectQuota(page)) throw new QuotaError(this.id);
            const [download] = await Promise.all([
              page.waitForEvent("download", { timeout }),
              page.click(this.selector("downloadButton"))
            ]);
            import_node_fs6.default.mkdirSync(import_node_path6.default.dirname(req.outputPath), { recursive: true });
            await download.saveAs(req.outputPath);
            const stat = import_node_fs6.default.statSync(req.outputPath);
            if (stat.size < minBytes) {
              return { ok: false, error: `Indirilen dosya gecersiz (${stat.size} bayt)` };
            }
            return { ok: true, filePath: req.outputPath, meta: { bytes: stat.size } };
          });
        } catch (err) {
          return { ok: false, error: err instanceof Error ? err.message : String(err) };
        }
      }
    };
  }
});

// ../../packages/providers/src/generic.ts
var GenericBrowserProvider;
var init_generic = __esm({
  "../../packages/providers/src/generic.ts"() {
    "use strict";
    init_browser_session_provider();
    GenericBrowserProvider = class extends BrowserSessionProvider {
      constructor(id, kind, cfg) {
        super(cfg);
        this.id = id;
        this.kind = kind;
      }
      async generate(req) {
        const minBytes = this.kind === "audio" ? 5e3 : 1e4;
        return this.runSiteFlow(req, minBytes);
      }
    };
  }
});

// ../../packages/providers/src/api/api-provider.ts
var import_node_fs7, import_node_path7, ApiMediaProvider;
var init_api_provider = __esm({
  "../../packages/providers/src/api/api-provider.ts"() {
    "use strict";
    import_node_fs7 = __toESM(require("node:fs"), 1);
    import_node_path7 = __toESM(require("node:path"), 1);
    init_account_pool();
    init_quota();
    ApiMediaProvider = class {
      constructor(cfg, pool = new AccountPool()) {
        this.cfg = cfg;
        this.pool = pool;
        this.id = cfg.id;
        this.kind = cfg.kind;
      }
      id;
      kind;
      authMode = "api-key";
      async isAvailable() {
        if (this.pool.pickNext(this.id)) return true;
        return !!this.envApiKey && !!this.cfg.endpoint;
      }
      get envApiKey() {
        return this.cfg.apiKeyEnv ? process.env[this.cfg.apiKeyEnv] : void 0;
      }
      async generate(req) {
        if (!this.cfg.endpoint) {
          return { ok: false, error: `[${this.id}] endpoint tanimli degil` };
        }
        const tried = /* @__PURE__ */ new Set();
        for (; ; ) {
          const acc = this.pool.pickNext(this.id, tried);
          const apiKey = acc?.apiKey ?? (tried.size === 0 ? this.envApiKey : void 0);
          if (!apiKey) {
            return { ok: false, error: `[${this.id}] API anahtari yok (havuz bos, ${this.cfg.apiKeyEnv ?? "?"} env'i de tanimli degil)` };
          }
          if (acc) tried.add(acc.id);
          try {
            const res = await fetch(this.cfg.endpoint, {
              method: "POST",
              headers: {
                "content-type": "application/json",
                authorization: `Bearer ${apiKey}`
              },
              body: JSON.stringify({
                model: this.cfg.model,
                prompt: req.prompt,
                input: req.prompt,
                // TTS uyumlulugu
                voice: req.voiceId,
                response_format: "binary"
              })
            });
            if (!res.ok) {
              const body = await res.text();
              const errText = `HTTP ${res.status}: ${body}`;
              if (res.status === 429 || isQuotaError(errText, this.cfg.quotaIndicators)) {
                if (acc) {
                  this.pool.reportFailure(acc, true, errText);
                  continue;
                }
                return { ok: false, error: errText };
              }
              if (acc) this.pool.reportFailure(acc, false, errText);
              return { ok: false, error: errText };
            }
            const buf = Buffer.from(await res.arrayBuffer());
            import_node_fs7.default.mkdirSync(import_node_path7.default.dirname(req.outputPath), { recursive: true });
            import_node_fs7.default.writeFileSync(req.outputPath, buf);
            if (buf.length < 1e3) return { ok: false, error: `Cikti cok kucuk (${buf.length} bayt)` };
            if (acc) this.pool.reportSuccess(acc);
            return { ok: true, filePath: req.outputPath, meta: { bytes: buf.length, account: acc?.id } };
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            if (acc) this.pool.reportFailure(acc, isQuotaError(msg, this.cfg.quotaIndicators), msg);
            return { ok: false, error: msg };
          }
        }
      }
    };
  }
});

// ../../packages/providers/src/registry.ts
function normalizeSelectors(cfg) {
  if (cfg.selectors?.generateButton && !cfg.selectors.submitButton) {
    cfg.selectors.submitButton = cfg.selectors.generateButton;
  }
  return cfg;
}
function validateConfig(cfg, file) {
  if (!cfg.id || !cfg.baseUrl || !cfg.kind || !cfg.authMode) {
    console.warn(`Gecersiz provider config ${file}: id, baseUrl, kind, authMode zorunlu`);
    return false;
  }
  for (const envName of cfg.requiresEnv ?? []) {
    if (!process.env[envName]) {
      console.warn(`[${cfg.id}] requiresEnv eksik: ${envName} (saglayici calismayabilir)`);
    }
  }
  return true;
}
function loadProviderConfigs() {
  ensureDirs();
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  for (const dir of [paths.providersConfig, BUILTIN_CONFIG_DIR]) {
    if (!import_node_fs8.default.existsSync(dir)) continue;
    for (const f of import_node_fs8.default.readdirSync(dir).filter((f2) => f2.endsWith(".json"))) {
      try {
        const cfg = normalizeSelectors(JSON.parse(import_node_fs8.default.readFileSync(import_node_path8.default.join(dir, f), "utf8")));
        if (!validateConfig(cfg, f)) continue;
        if (!seen.has(cfg.id)) {
          seen.add(cfg.id);
          out.push(cfg);
        }
      } catch (e) {
        console.warn(`Gecersiz provider config ${f}:`, e);
      }
    }
  }
  return out;
}
function buildProvider(cfg) {
  if (cfg.authMode === "browser-session") {
    return new GenericBrowserProvider(cfg.id, cfg.kind, cfg);
  }
  return new ApiMediaProvider(cfg);
}
function loadAllProviders() {
  return loadProviderConfigs().map(buildProvider);
}
function saveProviderConfig(cfg) {
  ensureDirs();
  import_node_fs8.default.writeFileSync(
    import_node_path8.default.join(paths.providersConfig, `${cfg.id}.json`),
    JSON.stringify(cfg, null, 2)
  );
}
function deleteProviderConfig(id) {
  const p = import_node_path8.default.join(paths.providersConfig, `${id}.json`);
  if (import_node_fs8.default.existsSync(p)) import_node_fs8.default.unlinkSync(p);
}
var import_node_fs8, import_node_path8, import_node_url, __dirname, BUILTIN_CONFIG_DIR;
var init_registry = __esm({
  "../../packages/providers/src/registry.ts"() {
    "use strict";
    import_node_fs8 = __toESM(require("node:fs"), 1);
    import_node_path8 = __toESM(require("node:path"), 1);
    import_node_url = require("node:url");
    init_generic();
    init_api_provider();
    init_src();
    __dirname = import_node_path8.default.dirname((0, import_node_url.fileURLToPath)(__import_meta_url));
    BUILTIN_CONFIG_DIR = process.env.HMX_CONFIG_DIR ?? (import_node_fs8.default.existsSync(import_node_path8.default.resolve(process.cwd(), "config/providers")) ? import_node_path8.default.resolve(process.cwd(), "config/providers") : import_node_path8.default.resolve(__dirname, "../../../config/providers"));
  }
});

// ../../packages/providers/src/index.ts
var src_exports2 = {};
__export(src_exports2, {
  AccountPool: () => AccountPool,
  ApiMediaProvider: () => ApiMediaProvider,
  BrowserSessionProvider: () => BrowserSessionProvider,
  DEFAULT_QUOTA_INDICATORS: () => DEFAULT_QUOTA_INDICATORS,
  GenericBrowserProvider: () => GenericBrowserProvider,
  HMX_CHROME_DATA: () => HMX_CHROME_DATA,
  QuotaError: () => QuotaError,
  buildProvider: () => buildProvider,
  chromeUserDataDir: () => chromeUserDataDir,
  connectChrome: () => connectChrome,
  deleteProviderConfig: () => deleteProviderConfig,
  ensureProfileCopy: () => ensureProfileCopy,
  findChromeExe: () => findChromeExe,
  isQuotaError: () => isQuotaError,
  launchRealChrome: () => launchRealChrome,
  listChromeProfiles: () => listChromeProfiles,
  loadAllProviders: () => loadAllProviders,
  loadProviderConfigs: () => loadProviderConfigs,
  quotaCooldownMs: () => quotaCooldownMs,
  saveProviderConfig: () => saveProviderConfig,
  waitForDebugger: () => waitForDebugger
});
var init_src2 = __esm({
  "../../packages/providers/src/index.ts"() {
    "use strict";
    init_registry();
    init_generic();
    init_api_provider();
    init_browser_session_provider();
    init_account_pool();
    init_quota();
    init_chrome();
  }
});

// ../../node_modules/.pnpm/isexe@2.0.0/node_modules/isexe/windows.js
var require_windows = __commonJS({
  "../../node_modules/.pnpm/isexe@2.0.0/node_modules/isexe/windows.js"(exports2, module2) {
    module2.exports = isexe;
    isexe.sync = sync;
    var fs13 = require("fs");
    function checkPathExt(path19, options) {
      var pathext = options.pathExt !== void 0 ? options.pathExt : process.env.PATHEXT;
      if (!pathext) {
        return true;
      }
      pathext = pathext.split(";");
      if (pathext.indexOf("") !== -1) {
        return true;
      }
      for (var i2 = 0; i2 < pathext.length; i2++) {
        var p = pathext[i2].toLowerCase();
        if (p && path19.substr(-p.length).toLowerCase() === p) {
          return true;
        }
      }
      return false;
    }
    function checkStat(stat, path19, options) {
      if (!stat.isSymbolicLink() && !stat.isFile()) {
        return false;
      }
      return checkPathExt(path19, options);
    }
    function isexe(path19, options, cb) {
      fs13.stat(path19, function(er, stat) {
        cb(er, er ? false : checkStat(stat, path19, options));
      });
    }
    function sync(path19, options) {
      return checkStat(fs13.statSync(path19), path19, options);
    }
  }
});

// ../../node_modules/.pnpm/isexe@2.0.0/node_modules/isexe/mode.js
var require_mode = __commonJS({
  "../../node_modules/.pnpm/isexe@2.0.0/node_modules/isexe/mode.js"(exports2, module2) {
    module2.exports = isexe;
    isexe.sync = sync;
    var fs13 = require("fs");
    function isexe(path19, options, cb) {
      fs13.stat(path19, function(er, stat) {
        cb(er, er ? false : checkStat(stat, options));
      });
    }
    function sync(path19, options) {
      return checkStat(fs13.statSync(path19), options);
    }
    function checkStat(stat, options) {
      return stat.isFile() && checkMode(stat, options);
    }
    function checkMode(stat, options) {
      var mod = stat.mode;
      var uid = stat.uid;
      var gid = stat.gid;
      var myUid = options.uid !== void 0 ? options.uid : process.getuid && process.getuid();
      var myGid = options.gid !== void 0 ? options.gid : process.getgid && process.getgid();
      var u2 = parseInt("100", 8);
      var g = parseInt("010", 8);
      var o2 = parseInt("001", 8);
      var ug = u2 | g;
      var ret = mod & o2 || mod & g && gid === myGid || mod & u2 && uid === myUid || mod & ug && myUid === 0;
      return ret;
    }
  }
});

// ../../node_modules/.pnpm/isexe@2.0.0/node_modules/isexe/index.js
var require_isexe = __commonJS({
  "../../node_modules/.pnpm/isexe@2.0.0/node_modules/isexe/index.js"(exports2, module2) {
    var fs13 = require("fs");
    var core;
    if (process.platform === "win32" || global.TESTING_WINDOWS) {
      core = require_windows();
    } else {
      core = require_mode();
    }
    module2.exports = isexe;
    isexe.sync = sync;
    function isexe(path19, options, cb) {
      if (typeof options === "function") {
        cb = options;
        options = {};
      }
      if (!cb) {
        if (typeof Promise !== "function") {
          throw new TypeError("callback not provided");
        }
        return new Promise(function(resolve, reject) {
          isexe(path19, options || {}, function(er, is) {
            if (er) {
              reject(er);
            } else {
              resolve(is);
            }
          });
        });
      }
      core(path19, options || {}, function(er, is) {
        if (er) {
          if (er.code === "EACCES" || options && options.ignoreErrors) {
            er = null;
            is = false;
          }
        }
        cb(er, is);
      });
    }
    function sync(path19, options) {
      try {
        return core.sync(path19, options || {});
      } catch (er) {
        if (options && options.ignoreErrors || er.code === "EACCES") {
          return false;
        } else {
          throw er;
        }
      }
    }
  }
});

// ../../node_modules/.pnpm/which@2.0.2/node_modules/which/which.js
var require_which = __commonJS({
  "../../node_modules/.pnpm/which@2.0.2/node_modules/which/which.js"(exports2, module2) {
    var isWindows = process.platform === "win32" || process.env.OSTYPE === "cygwin" || process.env.OSTYPE === "msys";
    var path19 = require("path");
    var COLON = isWindows ? ";" : ":";
    var isexe = require_isexe();
    var getNotFoundError = (cmd) => Object.assign(new Error(`not found: ${cmd}`), { code: "ENOENT" });
    var getPathInfo = (cmd, opt) => {
      const colon = opt.colon || COLON;
      const pathEnv = cmd.match(/\//) || isWindows && cmd.match(/\\/) ? [""] : [
        // windows always checks the cwd first
        ...isWindows ? [process.cwd()] : [],
        ...(opt.path || process.env.PATH || /* istanbul ignore next: very unusual */
        "").split(colon)
      ];
      const pathExtExe = isWindows ? opt.pathExt || process.env.PATHEXT || ".EXE;.CMD;.BAT;.COM" : "";
      const pathExt = isWindows ? pathExtExe.split(colon) : [""];
      if (isWindows) {
        if (cmd.indexOf(".") !== -1 && pathExt[0] !== "")
          pathExt.unshift("");
      }
      return {
        pathEnv,
        pathExt,
        pathExtExe
      };
    };
    var which = (cmd, opt, cb) => {
      if (typeof opt === "function") {
        cb = opt;
        opt = {};
      }
      if (!opt)
        opt = {};
      const { pathEnv, pathExt, pathExtExe } = getPathInfo(cmd, opt);
      const found = [];
      const step = (i2) => new Promise((resolve, reject) => {
        if (i2 === pathEnv.length)
          return opt.all && found.length ? resolve(found) : reject(getNotFoundError(cmd));
        const ppRaw = pathEnv[i2];
        const pathPart = /^".*"$/.test(ppRaw) ? ppRaw.slice(1, -1) : ppRaw;
        const pCmd = path19.join(pathPart, cmd);
        const p = !pathPart && /^\.[\\\/]/.test(cmd) ? cmd.slice(0, 2) + pCmd : pCmd;
        resolve(subStep(p, i2, 0));
      });
      const subStep = (p, i2, ii) => new Promise((resolve, reject) => {
        if (ii === pathExt.length)
          return resolve(step(i2 + 1));
        const ext = pathExt[ii];
        isexe(p + ext, { pathExt: pathExtExe }, (er, is) => {
          if (!er && is) {
            if (opt.all)
              found.push(p + ext);
            else
              return resolve(p + ext);
          }
          return resolve(subStep(p, i2, ii + 1));
        });
      });
      return cb ? step(0).then((res) => cb(null, res), cb) : step(0);
    };
    var whichSync = (cmd, opt) => {
      opt = opt || {};
      const { pathEnv, pathExt, pathExtExe } = getPathInfo(cmd, opt);
      const found = [];
      for (let i2 = 0; i2 < pathEnv.length; i2++) {
        const ppRaw = pathEnv[i2];
        const pathPart = /^".*"$/.test(ppRaw) ? ppRaw.slice(1, -1) : ppRaw;
        const pCmd = path19.join(pathPart, cmd);
        const p = !pathPart && /^\.[\\\/]/.test(cmd) ? cmd.slice(0, 2) + pCmd : pCmd;
        for (let j = 0; j < pathExt.length; j++) {
          const cur = p + pathExt[j];
          try {
            const is = isexe.sync(cur, { pathExt: pathExtExe });
            if (is) {
              if (opt.all)
                found.push(cur);
              else
                return cur;
            }
          } catch (ex) {
          }
        }
      }
      if (opt.all && found.length)
        return found;
      if (opt.nothrow)
        return null;
      throw getNotFoundError(cmd);
    };
    module2.exports = which;
    which.sync = whichSync;
  }
});

// ../../node_modules/.pnpm/path-key@3.1.1/node_modules/path-key/index.js
var require_path_key = __commonJS({
  "../../node_modules/.pnpm/path-key@3.1.1/node_modules/path-key/index.js"(exports2, module2) {
    "use strict";
    var pathKey2 = (options = {}) => {
      const environment = options.env || process.env;
      const platform2 = options.platform || process.platform;
      if (platform2 !== "win32") {
        return "PATH";
      }
      return Object.keys(environment).reverse().find((key) => key.toUpperCase() === "PATH") || "Path";
    };
    module2.exports = pathKey2;
    module2.exports.default = pathKey2;
  }
});

// ../../node_modules/.pnpm/cross-spawn@7.0.6/node_modules/cross-spawn/lib/util/resolveCommand.js
var require_resolveCommand = __commonJS({
  "../../node_modules/.pnpm/cross-spawn@7.0.6/node_modules/cross-spawn/lib/util/resolveCommand.js"(exports2, module2) {
    "use strict";
    var path19 = require("path");
    var which = require_which();
    var getPathKey = require_path_key();
    function resolveCommandAttempt(parsed, withoutPathExt) {
      const env = parsed.options.env || process.env;
      const cwd = process.cwd();
      const hasCustomCwd = parsed.options.cwd != null;
      const shouldSwitchCwd = hasCustomCwd && process.chdir !== void 0 && !process.chdir.disabled;
      if (shouldSwitchCwd) {
        try {
          process.chdir(parsed.options.cwd);
        } catch (err) {
        }
      }
      let resolved;
      try {
        resolved = which.sync(parsed.command, {
          path: env[getPathKey({ env })],
          pathExt: withoutPathExt ? path19.delimiter : void 0
        });
      } catch (e) {
      } finally {
        if (shouldSwitchCwd) {
          process.chdir(cwd);
        }
      }
      if (resolved) {
        resolved = path19.resolve(hasCustomCwd ? parsed.options.cwd : "", resolved);
      }
      return resolved;
    }
    function resolveCommand(parsed) {
      return resolveCommandAttempt(parsed) || resolveCommandAttempt(parsed, true);
    }
    module2.exports = resolveCommand;
  }
});

// ../../node_modules/.pnpm/cross-spawn@7.0.6/node_modules/cross-spawn/lib/util/escape.js
var require_escape = __commonJS({
  "../../node_modules/.pnpm/cross-spawn@7.0.6/node_modules/cross-spawn/lib/util/escape.js"(exports2, module2) {
    "use strict";
    var metaCharsRegExp = /([()\][%!^"`<>&|;, *?])/g;
    function escapeCommand(arg) {
      arg = arg.replace(metaCharsRegExp, "^$1");
      return arg;
    }
    function escapeArgument(arg, doubleEscapeMetaChars) {
      arg = `${arg}`;
      arg = arg.replace(/(?=(\\+?)?)\1"/g, '$1$1\\"');
      arg = arg.replace(/(?=(\\+?)?)\1$/, "$1$1");
      arg = `"${arg}"`;
      arg = arg.replace(metaCharsRegExp, "^$1");
      if (doubleEscapeMetaChars) {
        arg = arg.replace(metaCharsRegExp, "^$1");
      }
      return arg;
    }
    module2.exports.command = escapeCommand;
    module2.exports.argument = escapeArgument;
  }
});

// ../../node_modules/.pnpm/shebang-regex@3.0.0/node_modules/shebang-regex/index.js
var require_shebang_regex = __commonJS({
  "../../node_modules/.pnpm/shebang-regex@3.0.0/node_modules/shebang-regex/index.js"(exports2, module2) {
    "use strict";
    module2.exports = /^#!(.*)/;
  }
});

// ../../node_modules/.pnpm/shebang-command@2.0.0/node_modules/shebang-command/index.js
var require_shebang_command = __commonJS({
  "../../node_modules/.pnpm/shebang-command@2.0.0/node_modules/shebang-command/index.js"(exports2, module2) {
    "use strict";
    var shebangRegex = require_shebang_regex();
    module2.exports = (string = "") => {
      const match2 = string.match(shebangRegex);
      if (!match2) {
        return null;
      }
      const [path19, argument] = match2[0].replace(/#! ?/, "").split(" ");
      const binary = path19.split("/").pop();
      if (binary === "env") {
        return argument;
      }
      return argument ? `${binary} ${argument}` : binary;
    };
  }
});

// ../../node_modules/.pnpm/cross-spawn@7.0.6/node_modules/cross-spawn/lib/util/readShebang.js
var require_readShebang = __commonJS({
  "../../node_modules/.pnpm/cross-spawn@7.0.6/node_modules/cross-spawn/lib/util/readShebang.js"(exports2, module2) {
    "use strict";
    var fs13 = require("fs");
    var shebangCommand = require_shebang_command();
    function readShebang(command) {
      const size = 150;
      const buffer = Buffer.alloc(size);
      let fd;
      try {
        fd = fs13.openSync(command, "r");
        fs13.readSync(fd, buffer, 0, size, 0);
        fs13.closeSync(fd);
      } catch (e) {
      }
      return shebangCommand(buffer.toString());
    }
    module2.exports = readShebang;
  }
});

// ../../node_modules/.pnpm/cross-spawn@7.0.6/node_modules/cross-spawn/lib/parse.js
var require_parse = __commonJS({
  "../../node_modules/.pnpm/cross-spawn@7.0.6/node_modules/cross-spawn/lib/parse.js"(exports2, module2) {
    "use strict";
    var path19 = require("path");
    var resolveCommand = require_resolveCommand();
    var escape = require_escape();
    var readShebang = require_readShebang();
    var isWin = process.platform === "win32";
    var isExecutableRegExp = /\.(?:com|exe)$/i;
    var isCmdShimRegExp = /node_modules[\\/].bin[\\/][^\\/]+\.cmd$/i;
    function detectShebang(parsed) {
      parsed.file = resolveCommand(parsed);
      const shebang = parsed.file && readShebang(parsed.file);
      if (shebang) {
        parsed.args.unshift(parsed.file);
        parsed.command = shebang;
        return resolveCommand(parsed);
      }
      return parsed.file;
    }
    function parseNonShell(parsed) {
      if (!isWin) {
        return parsed;
      }
      const commandFile = detectShebang(parsed);
      const needsShell = !isExecutableRegExp.test(commandFile);
      if (parsed.options.forceShell || needsShell) {
        const needsDoubleEscapeMetaChars = isCmdShimRegExp.test(commandFile);
        parsed.command = path19.normalize(parsed.command);
        parsed.command = escape.command(parsed.command);
        parsed.args = parsed.args.map((arg) => escape.argument(arg, needsDoubleEscapeMetaChars));
        const shellCommand = [parsed.command].concat(parsed.args).join(" ");
        parsed.args = ["/d", "/s", "/c", `"${shellCommand}"`];
        parsed.command = process.env.comspec || "cmd.exe";
        parsed.options.windowsVerbatimArguments = true;
      }
      return parsed;
    }
    function parse(command, args, options) {
      if (args && !Array.isArray(args)) {
        options = args;
        args = null;
      }
      args = args ? args.slice(0) : [];
      options = Object.assign({}, options);
      const parsed = {
        command,
        args,
        options,
        file: void 0,
        original: {
          command,
          args
        }
      };
      return options.shell ? parsed : parseNonShell(parsed);
    }
    module2.exports = parse;
  }
});

// ../../node_modules/.pnpm/cross-spawn@7.0.6/node_modules/cross-spawn/lib/enoent.js
var require_enoent = __commonJS({
  "../../node_modules/.pnpm/cross-spawn@7.0.6/node_modules/cross-spawn/lib/enoent.js"(exports2, module2) {
    "use strict";
    var isWin = process.platform === "win32";
    function notFoundError(original, syscall) {
      return Object.assign(new Error(`${syscall} ${original.command} ENOENT`), {
        code: "ENOENT",
        errno: "ENOENT",
        syscall: `${syscall} ${original.command}`,
        path: original.command,
        spawnargs: original.args
      });
    }
    function hookChildProcess(cp, parsed) {
      if (!isWin) {
        return;
      }
      const originalEmit = cp.emit;
      cp.emit = function(name, arg1) {
        if (name === "exit") {
          const err = verifyENOENT(arg1, parsed);
          if (err) {
            return originalEmit.call(cp, "error", err);
          }
        }
        return originalEmit.apply(cp, arguments);
      };
    }
    function verifyENOENT(status, parsed) {
      if (isWin && status === 1 && !parsed.file) {
        return notFoundError(parsed.original, "spawn");
      }
      return null;
    }
    function verifyENOENTSync(status, parsed) {
      if (isWin && status === 1 && !parsed.file) {
        return notFoundError(parsed.original, "spawnSync");
      }
      return null;
    }
    module2.exports = {
      hookChildProcess,
      verifyENOENT,
      verifyENOENTSync,
      notFoundError
    };
  }
});

// ../../node_modules/.pnpm/cross-spawn@7.0.6/node_modules/cross-spawn/index.js
var require_cross_spawn = __commonJS({
  "../../node_modules/.pnpm/cross-spawn@7.0.6/node_modules/cross-spawn/index.js"(exports2, module2) {
    "use strict";
    var cp = require("child_process");
    var parse = require_parse();
    var enoent = require_enoent();
    function spawn3(command, args, options) {
      const parsed = parse(command, args, options);
      const spawned = cp.spawn(parsed.command, parsed.args, parsed.options);
      enoent.hookChildProcess(spawned, parsed);
      return spawned;
    }
    function spawnSync2(command, args, options) {
      const parsed = parse(command, args, options);
      const result = cp.spawnSync(parsed.command, parsed.args, parsed.options);
      result.error = result.error || enoent.verifyENOENTSync(result.status, parsed);
      return result;
    }
    module2.exports = spawn3;
    module2.exports.spawn = spawn3;
    module2.exports.sync = spawnSync2;
    module2.exports._parse = parse;
    module2.exports._enoent = enoent;
  }
});

// ../../node_modules/.pnpm/hono@4.13.13/node_modules/hono/dist/utils/stream.js
var StreamingApi;
var init_stream = __esm({
  "../../node_modules/.pnpm/hono@4.13.13/node_modules/hono/dist/utils/stream.js"() {
    StreamingApi = class {
      writer;
      encoder;
      writable;
      abortSubscribers = [];
      responseReadable;
      /**
      * Whether the stream has been aborted.
      */
      aborted = false;
      /**
      * Whether the stream has been closed normally.
      */
      closed = false;
      constructor(writable2, _readable) {
        this.writable = writable2;
        this.writer = writable2.getWriter();
        this.encoder = new TextEncoder();
        const reader = _readable.getReader();
        this.abortSubscribers.push(async () => {
          await reader.cancel();
        });
        this.responseReadable = new ReadableStream({
          async pull(controller) {
            const { done, value } = await reader.read();
            done ? controller.close() : controller.enqueue(value);
          },
          cancel: () => {
            if (!this.closed) this.abort();
          }
        });
      }
      async write(input) {
        try {
          if (typeof input === "string") input = this.encoder.encode(input);
          await this.writer.write(input);
        } catch {
        }
        return this;
      }
      async writeln(input) {
        await this.write(input + "\n");
        return this;
      }
      sleep(ms) {
        return new Promise((res) => setTimeout(res, ms));
      }
      async close() {
        this.closed = true;
        try {
          await this.writer.close();
        } catch {
        }
      }
      async pipe(body) {
        this.writer.releaseLock();
        try {
          await body.pipeTo(this.writable, {
            preventClose: true,
            preventAbort: true
          });
        } finally {
          this.writer = this.writable.getWriter();
        }
      }
      onAbort(listener) {
        this.abortSubscribers.push(listener);
      }
      /**
      * Abort the stream.
      * You can call this method when stream is aborted by external event.
      */
      abort() {
        if (!this.aborted) {
          this.aborted = true;
          this.abortSubscribers.forEach((subscriber) => {
            try {
              Promise.resolve(subscriber()).catch(() => {
              });
            } catch {
            }
          });
        }
      }
    };
  }
});

// ../../node_modules/.pnpm/hono@4.13.13/node_modules/hono/dist/helper/streaming/utils.js
var isOldBunVersion;
var init_utils = __esm({
  "../../node_modules/.pnpm/hono@4.13.13/node_modules/hono/dist/helper/streaming/utils.js"() {
    isOldBunVersion = () => {
      const version = typeof Bun !== "undefined" ? Bun.version : void 0;
      if (version === void 0) return false;
      const result = version.startsWith("1.1") || version.startsWith("1.0") || version.startsWith("0.");
      isOldBunVersion = () => result;
      return result;
    };
  }
});

// ../../node_modules/.pnpm/hono@4.13.13/node_modules/hono/dist/helper/streaming/stream.js
var contextStash, stream;
var init_stream2 = __esm({
  "../../node_modules/.pnpm/hono@4.13.13/node_modules/hono/dist/helper/streaming/stream.js"() {
    init_stream();
    init_utils();
    contextStash = /* @__PURE__ */ new WeakMap();
    stream = (c3, cb, onError) => {
      const { readable: readable2, writable: writable2 } = new TransformStream();
      const stream2 = new StreamingApi(writable2, readable2);
      if (isOldBunVersion()) c3.req.raw.signal.addEventListener("abort", () => {
        if (!stream2.closed) stream2.abort();
      });
      contextStash.set(stream2.responseReadable, c3);
      (async () => {
        try {
          await cb(stream2);
        } catch (e) {
          if (e === void 0) {
          } else if (e instanceof Error && onError) await onError(e, stream2);
          else console.error(e);
        } finally {
          stream2.close();
        }
      })();
      return c3.newResponse(stream2.responseReadable);
    };
  }
});

// ../../node_modules/.pnpm/hono@4.13.13/node_modules/hono/dist/helper/streaming/sse.js
var SSEStreamingApi, run, contextStash2, streamSSE;
var init_sse = __esm({
  "../../node_modules/.pnpm/hono@4.13.13/node_modules/hono/dist/helper/streaming/sse.js"() {
    init_html();
    init_stream();
    init_utils();
    SSEStreamingApi = class extends StreamingApi {
      constructor(writable2, readable2) {
        super(writable2, readable2);
      }
      async writeSSE(message) {
        const dataLines = (await resolveCallback(message.data, HtmlEscapedCallbackPhase.Stringify, false, {})).split(/\r\n|\r|\n/).map((line) => {
          return `data: ${line}`;
        }).join("\n");
        for (const key of ["event", "id"]) {
          const value = message[key];
          if (value && /[\r\n]/.test(value)) throw new Error(`${key} must not contain "\\r" or "\\n"`);
        }
        const sseData = [
          message.event && `event: ${message.event}`,
          dataLines,
          message.id !== void 0 && `id: ${message.id}`,
          message.retry !== void 0 && `retry: ${message.retry}`
        ].filter(Boolean).join("\n") + "\n\n";
        await this.write(sseData);
      }
    };
    run = async (stream2, cb, onError) => {
      try {
        await cb(stream2);
      } catch (e) {
        if (e instanceof Error && onError) {
          await onError(e, stream2);
          await stream2.writeSSE({
            event: "error",
            data: e.message
          });
        } else console.error(e);
      } finally {
        stream2.close();
      }
    };
    contextStash2 = /* @__PURE__ */ new WeakMap();
    streamSSE = (c3, cb, onError) => {
      const { readable: readable2, writable: writable2 } = new TransformStream();
      const stream2 = new SSEStreamingApi(writable2, readable2);
      if (isOldBunVersion()) c3.req.raw.signal.addEventListener("abort", () => {
        if (!stream2.closed) stream2.abort();
      });
      contextStash2.set(stream2.responseReadable, c3);
      c3.header("Transfer-Encoding", "chunked");
      c3.header("Content-Type", "text/event-stream");
      c3.header("Cache-Control", "no-cache");
      c3.header("Connection", "keep-alive");
      run(stream2, cb, onError);
      return c3.newResponse(stream2.responseReadable);
    };
  }
});

// ../../node_modules/.pnpm/hono@4.13.13/node_modules/hono/dist/helper/streaming/text.js
var streamText;
var init_text = __esm({
  "../../node_modules/.pnpm/hono@4.13.13/node_modules/hono/dist/helper/streaming/text.js"() {
    init_context();
    init_stream2();
    streamText = (c3, cb, onError) => {
      c3.header("Content-Type", TEXT_PLAIN);
      c3.header("X-Content-Type-Options", "nosniff");
      c3.header("Transfer-Encoding", "chunked");
      return stream(c3, cb, onError);
    };
  }
});

// ../../node_modules/.pnpm/hono@4.13.13/node_modules/hono/dist/helper/streaming/index.js
var streaming_exports = {};
__export(streaming_exports, {
  SSEStreamingApi: () => SSEStreamingApi,
  stream: () => stream,
  streamSSE: () => streamSSE,
  streamText: () => streamText
});
var init_streaming = __esm({
  "../../node_modules/.pnpm/hono@4.13.13/node_modules/hono/dist/helper/streaming/index.js"() {
    init_stream2();
    init_sse();
    init_text();
  }
});

// ../../node_modules/.pnpm/hono@4.13.13/node_modules/hono/dist/index.js
init_context();

// ../../node_modules/.pnpm/hono@4.13.13/node_modules/hono/dist/compose.js
var compose = (middleware, onError, onNotFound) => {
  return (context, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i2) {
      if (i2 <= index) throw new Error("next() called multiple times");
      index = i2;
      let res;
      let isError = false;
      let handler;
      if (middleware[i2]) {
        handler = middleware[i2][0][0];
        context.req.routeIndex = i2;
      } else handler = i2 === middleware.length && next || void 0;
      if (handler) try {
        res = await handler(context, () => dispatch(i2 + 1));
      } catch (err) {
        if (err instanceof Error && onError) {
          context.error = err;
          res = await onError(err, context);
          isError = true;
        } else throw err;
      }
      else if (context.finalized === false && onNotFound) res = await onNotFound(context);
      if (res && (context.finalized === false || isError)) context.res = res;
      return context;
    }
  };
};

// ../../node_modules/.pnpm/hono@4.13.13/node_modules/hono/dist/hono-base.js
init_url();
init_context();

// ../../node_modules/.pnpm/hono@4.13.13/node_modules/hono/dist/router.js
var METHODS = [
  "get",
  "post",
  "put",
  "delete",
  "options",
  "patch",
  "query"
];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
};

// ../../node_modules/.pnpm/hono@4.13.13/node_modules/hono/dist/utils/constants.js
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";

// ../../node_modules/.pnpm/hono@4.13.13/node_modules/hono/dist/hono-base.js
var notFoundHandler = (c3) => {
  return c3.text("404 Not Found", 404);
};
var errorHandler = (err, c3) => {
  if ("getResponse" in err) {
    const res = err.getResponse();
    return c3.newResponse(res.body, res);
  }
  console.error(err);
  return c3.text("Internal Server Error", 500);
};
var Hono = class Hono2 {
  get;
  post;
  put;
  delete;
  options;
  patch;
  query;
  all;
  on;
  use;
  router;
  getPath;
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    [...METHODS, "all"].forEach((method) => {
      this[method] = (args1, ...args) => {
        const methodName = method.toUpperCase();
        if (typeof args1 === "string") this.#path = args1;
        else this.#addRoute(methodName, this.#path, args1);
        args.forEach((handler) => {
          this.#addRoute(methodName, this.#path, handler);
        });
        return this;
      };
    });
    this.on = (method, path19, ...handlers) => {
      for (const p of [path19].flat()) {
        this.#path = p;
        for (const m of [method].flat()) {
          const methodName = m.toUpperCase();
          for (const handler of handlers) this.#addRoute(methodName, this.#path, handler);
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") this.#path = arg1;
      else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler) => {
        this.#addRoute("ALL", this.#path, handler);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  #clone() {
    const clone = new Hono2({
      router: this.router,
      getPath: this.getPath
    });
    clone.errorHandler = this.errorHandler;
    clone.#notFoundHandler = this.#notFoundHandler;
    clone.routes = this.routes;
    return clone;
  }
  #notFoundHandler = notFoundHandler;
  errorHandler = errorHandler;
  /**
  * `.route()` allows grouping other Hono instance in routes.
  *
  * @see {@link https://hono.dev/docs/api/routing#grouping}
  *
  * @param {string} path - base Path
  * @param {Hono} app - other Hono instance
  * @returns {Hono} routed Hono instance
  *
  * @example
  * ```ts
  * const app = new Hono()
  * const app2 = new Hono()
  *
  * app2.get("/user", (c) => c.text("user"))
  * app.route("/api", app2) // GET /api/user
  * ```
  */
  route(path19, app) {
    const subApp = this.basePath(path19);
    app.routes.map((r) => {
      let handler;
      if (app.errorHandler === errorHandler) handler = r.handler;
      else {
        handler = async (c3, next) => (await compose([], app.errorHandler)(c3, () => r.handler(c3, next))).res;
        handler[COMPOSED_HANDLER] = r.handler;
      }
      subApp.#addRoute(r.method, r.path, handler, r.basePath);
    });
    return this;
  }
  /**
  * `.basePath()` allows base paths to be specified.
  *
  * @see {@link https://hono.dev/docs/api/routing#base-path}
  *
  * @param {string} path - base Path
  * @returns {Hono} changed Hono instance
  *
  * @example
  * ```ts
  * const api = new Hono().basePath('/api')
  * ```
  */
  basePath(path19) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path19);
    return subApp;
  }
  /**
  * `.onError()` handles an error and returns a customized Response.
  *
  * @see {@link https://hono.dev/docs/api/hono#error-handling}
  *
  * @param {ErrorHandler} handler - request Handler for error
  * @returns {Hono} changed Hono instance
  *
  * @example
  * ```ts
  * app.onError((err, c) => {
  *   console.error(`${err}`)
  *   return c.text('Custom Error Message', 500)
  * })
  * ```
  */
  onError = (handler) => {
    this.errorHandler = handler;
    return this;
  };
  /**
  * `.notFound()` allows you to customize a Not Found Response.
  *
  * @see {@link https://hono.dev/docs/api/hono#not-found}
  *
  * @param {NotFoundHandler} handler - request handler for not-found
  * @returns {Hono} changed Hono instance
  *
  * @example
  * ```ts
  * app.notFound((c) => {
  *   return c.text('Custom 404 Message', 404)
  * })
  * ```
  */
  notFound = (handler) => {
    this.#notFoundHandler = handler;
    return this;
  };
  /**
  * `.mount()` allows you to mount applications built with other frameworks into your Hono application.
  *
  * @deprecated Use `mount()` from `hono/mount` instead. `.mount()` will be removed in v5.
  *
  * @see {@link https://hono.dev/docs/api/hono#mount}
  *
  * @param {string} path - base Path
  * @param {Function} applicationHandler - other Request Handler
  * @param {MountOptions} [options] - options of `.mount()`
  * @returns {Hono} mounted Hono instance
  *
  * @example
  * ```ts
  * import { Router as IttyRouter } from 'itty-router'
  * import { Hono } from 'hono'
  * // Create itty-router application
  * const ittyRouter = IttyRouter()
  * // GET /itty-router/hello
  * ittyRouter.get('/hello', () => new Response('Hello from itty-router'))
  *
  * const app = new Hono()
  * app.mount('/itty-router', ittyRouter.handle)
  * ```
  *
  * @example
  * ```ts
  * const app = new Hono()
  * // Send the request to another application without modification.
  * app.mount('/app', anotherApp, {
  *   replaceRequest: (req) => req,
  * })
  * ```
  */
  mount(path19, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function") optionHandler = options;
      else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false) replaceRequest = (request) => request;
        else replaceRequest = options.replaceRequest;
      }
    }
    const getOptions = optionHandler ? (c3) => {
      const options2 = optionHandler(c3);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c3) => {
      let executionContext = void 0;
      try {
        executionContext = c3.executionCtx;
      } catch {
      }
      return [c3.env, executionContext];
    };
    replaceRequest ||= (() => {
      const mergedPath = mergePath(this._basePath, path19);
      const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
      return (request) => {
        const url = new URL(request.url);
        url.pathname = this.getPath(request).slice(pathPrefixLength) || "/";
        return new Request(url, request);
      };
    })();
    const handler = async (c3, next) => {
      const res = await applicationHandler(replaceRequest(c3.req.raw), ...getOptions(c3));
      if (res) return res;
      await next();
    };
    this.#addRoute("ALL", mergePath(path19, "*"), handler);
    return this;
  }
  #addRoute(method, path19, handler, baseRoutePath) {
    path19 = mergePath(this._basePath, path19);
    const r = {
      basePath: baseRoutePath !== void 0 ? mergePath(this._basePath, baseRoutePath) : this._basePath,
      path: path19,
      method,
      handler
    };
    this.router.add(method, path19, [handler, r]);
    this.routes.push(r);
  }
  #handleError(err, c3) {
    if (err instanceof Error) return this.errorHandler(err, c3);
    throw err;
  }
  #dispatch(request, executionCtx, env, method) {
    if (method === "HEAD") return (async () => new Response(null, await this.#dispatch(request, executionCtx, env, "GET")))();
    const path19 = this.getPath(request, { env });
    const matchResult = this.router.match(method, path19);
    const c3 = new Context(request, {
      path: path19,
      matchResult,
      env,
      executionCtx,
      notFoundHandler: this.#notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c3, async () => {
          c3.res = await this.#notFoundHandler(c3);
        });
      } catch (err) {
        return this.#handleError(err, c3);
      }
      return res instanceof Promise ? res.then((resolved) => resolved || (c3.finalized ? c3.res : this.#notFoundHandler(c3))).catch((err) => this.#handleError(err, c3)) : res ?? this.#notFoundHandler(c3);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
    return (async () => {
      try {
        const context = await composed(c3);
        if (!context.finalized) throw new Error("Context is not finalized. Did you forget to return a Response object or `await next()`?");
        return context.res;
      } catch (err) {
        return this.#handleError(err, c3);
      }
    })();
  }
  /**
  * `.fetch()` will be entry point of your app.
  *
  * @see {@link https://hono.dev/docs/api/hono#fetch}
  *
  * @param {Request} request - request Object of request
  * @param {Env} env - env Object
  * @param {ExecutionContext} executionCtx - context of execution
  * @returns {Response | Promise<Response>} response of request
  *
  */
  fetch = (request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  };
  /**
  * `.request()` is a useful method for testing.
  * You can pass a URL or pathname to send a GET request.
  * app will return a Response object.
  * ```ts
  * test('GET /hello is ok', async () => {
  *   const res = await app.request('/hello')
  *   expect(res.status).toBe(200)
  * })
  * ```
  * @see https://hono.dev/docs/api/hono#request
  */
  request = (input, requestInit, Env, executionCtx) => {
    if (input instanceof Request) return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
    input = input.toString();
    return this.fetch(new Request(/^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`, requestInit), Env, executionCtx);
  };
  /**
  * `.fire()` automatically adds a global fetch event listener.
  * This can be useful for environments that adhere to the Service Worker API, such as non-ES module Cloudflare Workers.
  * @deprecated
  * Use `fire` from `hono/service-worker` instead.
  * ```ts
  * import { Hono } from 'hono'
  * import { fire } from 'hono/service-worker'
  *
  * const app = new Hono()
  * // ...
  * fire(app)
  * ```
  * @see https://hono.dev/docs/api/hono#fire
  * @see https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
  * @see https://developers.cloudflare.com/workers/reference/migrate-to-module-workers/
  */
  fire = () => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
    });
  };
};

// ../../node_modules/.pnpm/hono@4.13.13/node_modules/hono/dist/router/reg-exp-router/router.js
init_url();

// ../../node_modules/.pnpm/hono@4.13.13/node_modules/hono/dist/router/utils.js
var createNullObject = () => /* @__PURE__ */ Object.create(null);

// ../../node_modules/.pnpm/hono@4.13.13/node_modules/hono/dist/router/reg-exp-router/matcher.js
var emptyParam = [];
function match(method, path19) {
  const matchers = this.buildAllMatchers();
  const match2 = (method2, path20) => {
    const matcher = matchers[method2] || matchers["ALL"];
    const staticMatch = matcher[2][path20];
    if (staticMatch) return staticMatch;
    const match3 = path20.match(matcher[0]);
    if (!match3) return [[], emptyParam];
    const index = match3.indexOf("", 1);
    return [matcher[1][index], match3];
  };
  this.match = match2;
  return match2(method, path19);
}

// ../../node_modules/.pnpm/hono@4.13.13/node_modules/hono/dist/router/reg-exp-router/node.js
var LABEL_REG_EXP_STR = "[^/]+";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = Symbol();
var regExpMetaChars = /* @__PURE__ */ new Set(".\\+*[^]$()");
function compareKey(a2, b) {
  if (a2.length === 1) return b.length === 1 ? a2 < b ? -1 : 1 : -1;
  if (b.length === 1) return 1;
  if (a2 === ".*" || a2 === "(?:|/.*)") return b === "(?:|/.*)" ? -1 : 1;
  else if (b === ".*" || b === "(?:|/.*)") return -1;
  if (a2 === "[^/]+") return 1;
  else if (b === "[^/]+") return -1;
  return a2.length === b.length ? a2 < b ? -1 : 1 : b.length - a2.length;
}
var Node = class Node2 {
  #index;
  #varIndex;
  #children = createNullObject();
  insert(tokens, index, paramMap, context, isStatic) {
    let node = this;
    for (let i2 = 0, len = tokens.length; i2 < len; i2++) {
      const token = tokens[i2];
      const pattern = token.length === 1 ? token === "*" ? i2 === len - 1 ? [
        "",
        "",
        ".*"
      ] : [
        "",
        "",
        LABEL_REG_EXP_STR
      ] : null : token === "/*" ? [
        "",
        "",
        TAIL_WILDCARD_REG_EXP_STR
      ] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
      let nextNode;
      if (pattern) {
        const name = pattern[1];
        let regexpStr = pattern[2] || "[^/]+";
        if (name && pattern[2]) {
          if (regexpStr === ".*") throw PATH_ERROR;
          regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
          if (/\((?!\?:)/.test(regexpStr)) throw PATH_ERROR;
          if (regexpStr.length === 1 && regExpMetaChars.has(regexpStr)) throw PATH_ERROR;
        }
        nextNode = node.#children[regexpStr];
        if (!nextNode) {
          if (regexpStr !== ".*" && regexpStr !== "(?:|/.*)") {
            for (const k in node.#children) if ((regexpStr.length > 1 || k.length > 1) && k !== ".*" && k !== "(?:|/.*)") throw PATH_ERROR;
          }
          nextNode = node.#children[regexpStr] = new Node2();
        }
        if (name !== "") {
          nextNode.#varIndex ??= context.varIndex++;
          paramMap.push([name, nextNode.#varIndex]);
        }
      } else {
        nextNode = node.#children[token];
        if (!nextNode) {
          for (const k in node.#children) if (k.length > 1 && k !== ".*" && k !== "(?:|/.*)") throw PATH_ERROR;
          nextNode = node.#children[token] = new Node2();
        }
      }
      node = nextNode;
    }
    if (node.#index !== void 0) throw PATH_ERROR;
    node.#index = isStatic ? -1 : index;
  }
  buildRegExpStr() {
    const strList = Object.keys(this.#children).sort(compareKey).map((k) => {
      const c3 = this.#children[k];
      const childStr = c3.buildRegExpStr();
      return childStr === "" ? "" : (typeof c3.#varIndex === "number" ? `(${k})@${c3.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + childStr;
    }).filter(Boolean);
    if (typeof this.#index === "number" && this.#index !== -1) strList.unshift(`#${this.#index}`);
    if (strList.length === 0) return "";
    if (strList.length === 1) return strList[0];
    return "(?:" + strList.join("|") + ")";
  }
};

// ../../node_modules/.pnpm/hono@4.13.13/node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie = class {
  #context = { varIndex: 0 };
  #root = new Node();
  #index = 0;
  paths = createNullObject();
  insert(path19, isStatic) {
    if (isStatic) {
      this.#root.insert(path19.split(""), 0, [], this.#context, true);
      return;
    }
    const paramAssoc = [];
    const groups = [];
    let markedPath = path19;
    for (let i2 = 0; ; ) {
      let replaced = false;
      markedPath = markedPath.replace(/\{[^}]+\}/g, (m) => {
        const mark = `@\\${i2}`;
        groups[i2] = [mark, m];
        i2++;
        replaced = true;
        return mark;
      });
      if (!replaced) break;
    }
    const tokens = markedPath.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i2 = groups.length - 1; i2 >= 0; i2--) {
      const [mark] = groups[i2];
      for (let j = tokens.length - 1; j >= 0; j--) if (tokens[j].indexOf(mark) !== -1) {
        tokens[j] = tokens[j].replace(mark, groups[i2][1]);
        break;
      }
    }
    this.#root.insert(tokens, this.#index, paramAssoc, this.#context, false);
    this.paths[path19] = [this.#index++, paramAssoc];
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "") return [
      /^$/,
      [],
      []
    ];
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (handlerIndex !== void 0) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== void 0) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [
      new RegExp(`^${regexp}`),
      indexReplacementMap,
      paramReplacementMap
    ];
  }
};

// ../../node_modules/.pnpm/hono@4.13.13/node_modules/hono/dist/router/reg-exp-router/router.js
var wildcardRegExpCache = createNullObject();
function buildWildcardRegExp(path19) {
  return wildcardRegExpCache[path19] ??= new RegExp(`^${path19.replace(/\/:[^/{}]+(?:\{\[\^\/]\+})?(?=[/{]|$)|\/?\*$|([.\\+*[^\]$()?{}|])/g, (match2, metaChar) => metaChar ? `\\${metaChar}` : match2 === "/*" ? TAIL_WILDCARD_REG_EXP_STR : match2 === "*" ? ".*" : `/:${LABEL_REG_EXP_STR}`)}$`);
}
function findMiddleware(middleware, path19) {
  for (const k of Object.keys(middleware).sort((a2, b) => b.length - a2.length)) if (buildWildcardRegExp(k).test(path19)) return [...middleware[k]];
}
var RegExpRouter = class {
  name = "RegExpRouter";
  #middleware;
  #routes;
  #tries;
  constructor() {
    this.#middleware = { ["ALL"]: createNullObject() };
    this.#routes = { ["ALL"]: createNullObject() };
    this.#tries = { ["ALL"]: new Trie() };
  }
  #insertPath(method, path19) {
    try {
      this.#tries[method].insert(path19, !/\*|\/:/.test(path19));
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path19) : e;
    }
  }
  add(method, path19, handler) {
    const middleware = this.#middleware;
    const routes = this.#routes;
    if (!middleware) throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    if (!middleware[method]) {
      this.#tries[method] = new Trie();
      for (const handlerMap of [middleware, routes]) {
        handlerMap[method] = createNullObject();
        for (const p in handlerMap["ALL"]) {
          handlerMap[method][p] = [...handlerMap["ALL"][p]];
          this.#insertPath(method, p);
        }
      }
    }
    if (path19 === "/*") path19 = "*";
    const methods = method === "ALL" ? Object.keys(middleware) : [method];
    if (/\*$/.test(path19)) {
      const re = buildWildcardRegExp(path19);
      for (const m of methods) if (!middleware[m][path19]) {
        this.#insertPath(m, path19);
        middleware[m][path19] = findMiddleware(middleware[m], path19) || findMiddleware(middleware["ALL"], path19) || [];
      }
      for (const handlerMap of [middleware, routes]) for (const m of methods) for (const p in handlerMap[m]) re.test(p) && handlerMap[m][p].push([handler, path19]);
      return;
    }
    const paths2 = checkOptionalParameter(path19) || [path19];
    for (const path20 of paths2) for (const m of methods) {
      if (!routes[m][path20]) {
        this.#insertPath(m, path20);
        routes[m][path20] = findMiddleware(middleware[m], path20) || findMiddleware(middleware["ALL"], path20) || [];
      }
      routes[m][path20].push([handler, path20]);
    }
  }
  match = match;
  buildAllMatchers() {
    const matchers = createNullObject();
    for (const method of Object.keys(this.#routes)) matchers[method] = this.#buildMatcher(method);
    this.#middleware = this.#routes = this.#tries = void 0;
    wildcardRegExpCache = createNullObject();
    return matchers;
  }
  #buildMatcher(method) {
    const middleware = this.#middleware[method];
    const routes = this.#routes[method];
    const trie = this.#tries[method];
    const staticMap = createNullObject();
    const handlerData = [];
    const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
    for (const r of [middleware, routes]) for (const path19 in r) {
      const handlers = r[path19];
      const pathData = trie.paths[path19];
      if (!pathData) {
        staticMap[path19] = [handlers.map(([h2]) => [h2, createNullObject()]), emptyParam];
        continue;
      }
      handlerData[pathData[0]] = handlers.map(([h2, handlerPath]) => [h2, trie.paths[handlerPath][1].reduceRight((map, [key], i2) => {
        map[key] = paramReplacementMap[pathData[1][i2][1]];
        return map;
      }, createNullObject())]);
    }
    return [
      regexp,
      indexReplacementMap.map((i2) => handlerData[i2]),
      staticMap
    ];
  }
};

// ../../node_modules/.pnpm/hono@4.13.13/node_modules/hono/dist/router/smart-router/router.js
var SmartRouter = class {
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init) {
    this.#routers = init.routers;
  }
  add(method, path19, handler) {
    if (!this.#routes) throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    this.#routes.push([
      method,
      path19,
      handler
    ]);
  }
  match(method, path19) {
    if (!this.#routes) throw new Error("Fatal error");
    const routers = this.#routers;
    const routes = this.#routes;
    const len = routers.length;
    let i2 = 0;
    let res;
    for (; i2 < len; i2++) {
      const router = routers[i2];
      try {
        for (let i3 = 0, len2 = routes.length; i3 < len2; i3++) router.add(...routes[i3]);
        res = router.match(method, path19);
      } catch (e) {
        if (e instanceof UnsupportedPathError) continue;
        throw e;
      }
      this.match = router.match.bind(router);
      this.#routers = [router];
      this.#routes = void 0;
      break;
    }
    if (i2 === len) throw new Error("Fatal error");
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1) throw new Error("No active router has been determined yet.");
    return this.#routers[0];
  }
};

// ../../node_modules/.pnpm/hono@4.13.13/node_modules/hono/dist/router/trie-router/router.js
init_url();

// ../../node_modules/.pnpm/hono@4.13.13/node_modules/hono/dist/router/trie-router/node.js
init_url();
var emptyParams = createNullObject();
var order = 0;
var Node3 = class Node4 {
  #methods = [];
  #children = createNullObject();
  #patterns = [];
  #pattern;
  #params = emptyParams;
  insert(method, path19, handler) {
    let curNode = this;
    const parts = splitRoutingPath(path19);
    const possibleKeys = /* @__PURE__ */ new Set();
    let i2 = 0;
    for (const p of parts) {
      const nextP = parts[++i2];
      const pattern = getPattern(p, nextP) || (nextP === void 0 && p && p.indexOf("*") === p.length - 1 ? p : null);
      const isParam = Array.isArray(pattern);
      const key = isParam ? pattern[0] : pattern || p;
      const child = curNode.#children[key] ||= new Node4();
      if (pattern && !child.#pattern) {
        child.#pattern = pattern;
        curNode.#patterns.push(child);
      }
      curNode = child;
      if (isParam) possibleKeys.add(pattern[1]);
    }
    curNode.#methods.push({ [method]: {
      handler,
      possibleKeys: [...possibleKeys],
      score: ++order
    } });
  }
  #pushHandlerSets(handlerSets, node, method, nodeParams, params) {
    for (let i2 = 0, len = node.#methods.length; i2 < len; i2++) {
      const m = node.#methods[i2];
      const handlerSet = m[method] || m["ALL"];
      if (handlerSet) {
        handlerSet.params = createNullObject();
        handlerSets.push(handlerSet);
        for (let i3 = 0, len2 = handlerSet.possibleKeys.length; i3 < len2; i3++) {
          const key = handlerSet.possibleKeys[i3];
          handlerSet.params[key] = params?.[key] && !i3 ? params[key] : nodeParams[key] ?? params?.[key];
        }
      }
    }
  }
  search(method, path19) {
    const handlerSets = [];
    this.#params = emptyParams;
    let curNodes = [this];
    const parts = splitPath(path19);
    const curNodesQueue = [];
    const len = parts.length;
    let partOffsets = null;
    for (let i2 = 0; i2 < len; i2++) {
      const part = parts[i2];
      const isLast = i2 === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"]) this.#pushHandlerSets(handlerSets, nextNode.#children["*"], method, node.#params);
            this.#pushHandlerSets(handlerSets, nextNode, method, node.#params);
          } else tempNodes.push(nextNode);
        }
        for (const child of node.#patterns) {
          const pattern = child.#pattern;
          const params = node.#params === emptyParams ? {} : { ...node.#params };
          if (typeof pattern === "string") {
            if (pattern === "*" || part.startsWith(pattern.slice(0, -1))) {
              this.#pushHandlerSets(handlerSets, child, method, node.#params);
              if (pattern === "*") {
                child.#params = params;
                tempNodes.push(child);
              }
            }
            continue;
          }
          const [, name, matcher] = pattern;
          if (!part && matcher === true) continue;
          if (matcher !== true) {
            if (!partOffsets) {
              partOffsets = [];
              let offset = path19[0] === "/" ? 1 : 0;
              for (let p = 0; p < len; p++) {
                partOffsets[p] = offset;
                offset += parts[p].length + 1;
              }
            }
            const restPathString = path19.slice(partOffsets[i2]);
            const m = matcher.exec(restPathString);
            if (m) {
              params[name] = m[0];
              this.#pushHandlerSets(handlerSets, child, method, node.#params, params);
              if (m[0].length === restPathString.length && child.#children["*"]) this.#pushHandlerSets(handlerSets, child.#children["*"], method, node.#params, params);
              for (const _ in child.#children) {
                child.#params = params;
                const componentCount = m[0].match(/\//g)?.length ?? 0;
                (curNodesQueue[componentCount] ||= []).push(child);
                break;
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            params[name] = part;
            if (isLast) {
              this.#pushHandlerSets(handlerSets, child, method, params, node.#params);
              if (child.#children["*"]) this.#pushHandlerSets(handlerSets, child.#children["*"], method, params, node.#params);
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      const shifted = curNodesQueue.shift();
      curNodes = shifted ? tempNodes.concat(shifted) : tempNodes;
    }
    if (handlerSets[1]) handlerSets.sort((a2, b) => {
      return a2.score - b.score;
    });
    return [handlerSets.map(({ handler, params }) => [handler, params])];
  }
};

// ../../node_modules/.pnpm/hono@4.13.13/node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = class {
  name = "TrieRouter";
  #node = new Node3();
  add(method, path19, handler) {
    for (const result of checkOptionalParameter(path19) || [path19]) this.#node.insert(method, result, handler);
  }
  match(method, path19) {
    return this.#node.search(method, path19);
  }
};

// ../../node_modules/.pnpm/hono@4.13.13/node_modules/hono/dist/hono.js
var Hono3 = class extends Hono {
  /**
  * Creates an instance of the Hono class.
  *
  * @param options - Optional configuration options for the Hono instance.
  */
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({ routers: [new RegExpRouter(), new TrieRouter()] });
  }
};

// ../../node_modules/.pnpm/@hono+node-server@1.19.17_hono@4.13.13/node_modules/@hono/node-server/dist/index.mjs
var import_http = require("http");
var import_http2 = require("http2");
var import_http22 = require("http2");
var import_stream = require("stream");
var import_crypto2 = __toESM(require("crypto"), 1);
var RequestError = class extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = "RequestError";
  }
};
var toRequestError = (e) => {
  if (e instanceof RequestError) {
    return e;
  }
  return new RequestError(e.message, { cause: e });
};
var GlobalRequest = global.Request;
var Request2 = class extends GlobalRequest {
  constructor(input, options) {
    if (typeof input === "object" && getRequestCache in input) {
      input = input[getRequestCache]();
    }
    if (typeof options?.body?.getReader !== "undefined") {
      ;
      options.duplex ??= "half";
    }
    super(input, options);
  }
};
var newHeadersFromIncoming = (incoming) => {
  const headerRecord = [];
  const rawHeaders = incoming.rawHeaders;
  for (let i2 = 0; i2 < rawHeaders.length; i2 += 2) {
    const { [i2]: key, [i2 + 1]: value } = rawHeaders;
    if (key.charCodeAt(0) !== /*:*/
    58) {
      headerRecord.push([key, value]);
    }
  }
  return new Headers(headerRecord);
};
var wrapBodyStream = Symbol("wrapBodyStream");
var newRequestFromIncoming = (method, url, headers, incoming, abortController) => {
  const init = {
    method,
    headers,
    signal: abortController.signal
  };
  if (method === "TRACE") {
    init.method = "GET";
    const req = new Request2(url, init);
    Object.defineProperty(req, "method", {
      get() {
        return "TRACE";
      }
    });
    return req;
  }
  if (!(method === "GET" || method === "HEAD")) {
    if ("rawBody" in incoming && incoming.rawBody instanceof Buffer) {
      init.body = new ReadableStream({
        start(controller) {
          controller.enqueue(incoming.rawBody);
          controller.close();
        }
      });
    } else if (incoming[wrapBodyStream]) {
      let reader;
      init.body = new ReadableStream({
        async pull(controller) {
          try {
            reader ||= import_stream.Readable.toWeb(incoming).getReader();
            const { done, value } = await reader.read();
            if (done) {
              controller.close();
            } else {
              controller.enqueue(value);
            }
          } catch (error) {
            controller.error(error);
          }
        }
      });
    } else {
      init.body = import_stream.Readable.toWeb(incoming);
    }
  }
  return new Request2(url, init);
};
var getRequestCache = Symbol("getRequestCache");
var requestCache = Symbol("requestCache");
var incomingKey = Symbol("incomingKey");
var urlKey = Symbol("urlKey");
var headersKey = Symbol("headersKey");
var abortControllerKey = Symbol("abortControllerKey");
var getAbortController = Symbol("getAbortController");
var requestPrototype = {
  get method() {
    return this[incomingKey].method || "GET";
  },
  get url() {
    return this[urlKey];
  },
  get headers() {
    return this[headersKey] ||= newHeadersFromIncoming(this[incomingKey]);
  },
  [getAbortController]() {
    this[getRequestCache]();
    return this[abortControllerKey];
  },
  [getRequestCache]() {
    this[abortControllerKey] ||= new AbortController();
    return this[requestCache] ||= newRequestFromIncoming(
      this.method,
      this[urlKey],
      this.headers,
      this[incomingKey],
      this[abortControllerKey]
    );
  }
};
[
  "body",
  "bodyUsed",
  "cache",
  "credentials",
  "destination",
  "integrity",
  "mode",
  "redirect",
  "referrer",
  "referrerPolicy",
  "signal",
  "keepalive"
].forEach((k) => {
  Object.defineProperty(requestPrototype, k, {
    get() {
      return this[getRequestCache]()[k];
    }
  });
});
["arrayBuffer", "blob", "clone", "formData", "json", "text"].forEach((k) => {
  Object.defineProperty(requestPrototype, k, {
    value: function() {
      return this[getRequestCache]()[k]();
    }
  });
});
Object.defineProperty(requestPrototype, Symbol.for("nodejs.util.inspect.custom"), {
  value: function(depth, options, inspectFn) {
    const props = {
      method: this.method,
      url: this.url,
      headers: this.headers,
      nativeRequest: this[requestCache]
    };
    return `Request (lightweight) ${inspectFn(props, { ...options, depth: depth == null ? null : depth - 1 })}`;
  }
});
Object.setPrototypeOf(requestPrototype, Request2.prototype);
var newRequest = (incoming, defaultHostname) => {
  const req = Object.create(requestPrototype);
  req[incomingKey] = incoming;
  const incomingUrl = incoming.url || "";
  if (incomingUrl[0] !== "/" && // short-circuit for performance. most requests are relative URL.
  (incomingUrl.startsWith("http://") || incomingUrl.startsWith("https://"))) {
    if (incoming instanceof import_http22.Http2ServerRequest) {
      throw new RequestError("Absolute URL for :path is not allowed in HTTP/2");
    }
    try {
      const url2 = new URL(incomingUrl);
      req[urlKey] = url2.href;
    } catch (e) {
      throw new RequestError("Invalid absolute URL", { cause: e });
    }
    return req;
  }
  const host = (incoming instanceof import_http22.Http2ServerRequest ? incoming.authority : incoming.headers.host) || defaultHostname;
  if (!host) {
    throw new RequestError("Missing host header");
  }
  let scheme;
  if (incoming instanceof import_http22.Http2ServerRequest) {
    scheme = incoming.scheme;
    if (!(scheme === "http" || scheme === "https")) {
      throw new RequestError("Unsupported scheme");
    }
  } else {
    scheme = incoming.socket && incoming.socket.encrypted ? "https" : "http";
  }
  const url = new URL(`${scheme}://${host}${incomingUrl}`);
  if (url.hostname.length !== host.length && url.hostname !== host.replace(/:\d+$/, "")) {
    throw new RequestError("Invalid host header");
  }
  req[urlKey] = url.href;
  return req;
};
var responseCache = Symbol("responseCache");
var getResponseCache = Symbol("getResponseCache");
var cacheKey = Symbol("cache");
var GlobalResponse = global.Response;
var Response2 = class _Response {
  #body;
  #init;
  [getResponseCache]() {
    delete this[cacheKey];
    return this[responseCache] ||= new GlobalResponse(this.#body, this.#init);
  }
  constructor(body, init) {
    let headers;
    this.#body = body;
    if (init instanceof _Response) {
      const cachedGlobalResponse = init[responseCache];
      if (cachedGlobalResponse) {
        this.#init = cachedGlobalResponse;
        this[getResponseCache]();
        return;
      } else {
        this.#init = init.#init;
        headers = new Headers(init.#init.headers);
      }
    } else {
      this.#init = init;
    }
    if (typeof body === "string" || typeof body?.getReader !== "undefined" || body instanceof Blob || body instanceof Uint8Array) {
      ;
      this[cacheKey] = [init?.status || 200, body, headers || init?.headers];
    }
  }
  get headers() {
    const cache = this[cacheKey];
    if (cache) {
      if (!(cache[2] instanceof Headers)) {
        cache[2] = new Headers(
          cache[2] || { "content-type": "text/plain; charset=UTF-8" }
        );
      }
      return cache[2];
    }
    return this[getResponseCache]().headers;
  }
  get status() {
    return this[cacheKey]?.[0] ?? this[getResponseCache]().status;
  }
  get ok() {
    const status = this.status;
    return status >= 200 && status < 300;
  }
};
["body", "bodyUsed", "redirected", "statusText", "trailers", "type", "url"].forEach((k) => {
  Object.defineProperty(Response2.prototype, k, {
    get() {
      return this[getResponseCache]()[k];
    }
  });
});
["arrayBuffer", "blob", "clone", "formData", "json", "text"].forEach((k) => {
  Object.defineProperty(Response2.prototype, k, {
    value: function() {
      return this[getResponseCache]()[k]();
    }
  });
});
Object.defineProperty(Response2.prototype, Symbol.for("nodejs.util.inspect.custom"), {
  value: function(depth, options, inspectFn) {
    const props = {
      status: this.status,
      headers: this.headers,
      ok: this.ok,
      nativeResponse: this[responseCache]
    };
    return `Response (lightweight) ${inspectFn(props, { ...options, depth: depth == null ? null : depth - 1 })}`;
  }
});
Object.setPrototypeOf(Response2, GlobalResponse);
Object.setPrototypeOf(Response2.prototype, GlobalResponse.prototype);
async function readWithoutBlocking(readPromise) {
  return Promise.race([readPromise, Promise.resolve().then(() => Promise.resolve(void 0))]);
}
function writeFromReadableStreamDefaultReader(reader, writable2, currentReadPromise) {
  const cancel = (error) => {
    reader.cancel(error).catch(() => {
    });
  };
  writable2.on("close", cancel);
  writable2.on("error", cancel);
  (currentReadPromise ?? reader.read()).then(flow, handleStreamError2);
  return reader.closed.finally(() => {
    writable2.off("close", cancel);
    writable2.off("error", cancel);
  });
  function handleStreamError2(error) {
    if (error) {
      writable2.destroy(error);
    }
  }
  function onDrain() {
    reader.read().then(flow, handleStreamError2);
  }
  function flow({ done, value }) {
    try {
      if (done) {
        writable2.end();
      } else if (!writable2.write(value)) {
        writable2.once("drain", onDrain);
      } else {
        return reader.read().then(flow, handleStreamError2);
      }
    } catch (e) {
      handleStreamError2(e);
    }
  }
}
function writeFromReadableStream(stream2, writable2) {
  if (stream2.locked) {
    throw new TypeError("ReadableStream is locked.");
  } else if (writable2.destroyed) {
    return;
  }
  return writeFromReadableStreamDefaultReader(stream2.getReader(), writable2);
}
var buildOutgoingHttpHeaders = (headers) => {
  const res = {};
  if (!(headers instanceof Headers)) {
    headers = new Headers(headers ?? void 0);
  }
  const cookies = [];
  for (const [k, v] of headers) {
    if (k === "set-cookie") {
      cookies.push(v);
    } else {
      res[k] = v;
    }
  }
  if (cookies.length > 0) {
    res["set-cookie"] = cookies;
  }
  res["content-type"] ??= "text/plain; charset=UTF-8";
  return res;
};
var X_ALREADY_SENT = "x-hono-already-sent";
if (typeof global.crypto === "undefined") {
  global.crypto = import_crypto2.default;
}
var outgoingEnded = Symbol("outgoingEnded");
var incomingDraining = Symbol("incomingDraining");
var DRAIN_TIMEOUT_MS = 500;
var MAX_DRAIN_BYTES = 64 * 1024 * 1024;
var drainIncoming = (incoming) => {
  const incomingWithDrainState = incoming;
  if (incoming.destroyed || incomingWithDrainState[incomingDraining]) {
    return;
  }
  incomingWithDrainState[incomingDraining] = true;
  if (incoming instanceof import_http2.Http2ServerRequest) {
    try {
      ;
      incoming.stream?.close?.(import_http2.constants.NGHTTP2_NO_ERROR);
    } catch {
    }
    return;
  }
  let bytesRead = 0;
  const cleanup = () => {
    clearTimeout(timer);
    incoming.off("data", onData);
    incoming.off("end", cleanup);
    incoming.off("error", cleanup);
  };
  const forceClose = () => {
    cleanup();
    const socket = incoming.socket;
    if (socket && !socket.destroyed) {
      socket.destroySoon();
    }
  };
  const timer = setTimeout(forceClose, DRAIN_TIMEOUT_MS);
  timer.unref?.();
  const onData = (chunk) => {
    bytesRead += chunk.length;
    if (bytesRead > MAX_DRAIN_BYTES) {
      forceClose();
    }
  };
  incoming.on("data", onData);
  incoming.on("end", cleanup);
  incoming.on("error", cleanup);
  incoming.resume();
};
var handleRequestError = () => new Response(null, {
  status: 400
});
var handleFetchError = (e) => new Response(null, {
  status: e instanceof Error && (e.name === "TimeoutError" || e.constructor.name === "TimeoutError") ? 504 : 500
});
var handleResponseError = (e, outgoing) => {
  const err = e instanceof Error ? e : new Error("unknown error", { cause: e });
  if (err.code === "ERR_STREAM_PREMATURE_CLOSE") {
    console.info("The user aborted a request.");
  } else {
    console.error(e);
    if (!outgoing.headersSent) {
      outgoing.writeHead(500, { "Content-Type": "text/plain" });
    }
    outgoing.end(`Error: ${err.message}`);
    outgoing.destroy(err);
  }
};
var flushHeaders = (outgoing) => {
  if ("flushHeaders" in outgoing && outgoing.writable) {
    outgoing.flushHeaders();
  }
};
var responseViaCache = async (res, outgoing) => {
  let [status, body, header] = res[cacheKey];
  let hasContentLength = false;
  if (!header) {
    header = { "content-type": "text/plain; charset=UTF-8" };
  } else if (header instanceof Headers) {
    hasContentLength = header.has("content-length");
    header = buildOutgoingHttpHeaders(header);
  } else if (Array.isArray(header)) {
    const headerObj = new Headers(header);
    hasContentLength = headerObj.has("content-length");
    header = buildOutgoingHttpHeaders(headerObj);
  } else {
    for (const key in header) {
      if (key.length === 14 && key.toLowerCase() === "content-length") {
        hasContentLength = true;
        break;
      }
    }
  }
  if (!hasContentLength) {
    if (typeof body === "string") {
      header["Content-Length"] = Buffer.byteLength(body);
    } else if (body instanceof Uint8Array) {
      header["Content-Length"] = body.byteLength;
    } else if (body instanceof Blob) {
      header["Content-Length"] = body.size;
    }
  }
  outgoing.writeHead(status, header);
  if (typeof body === "string" || body instanceof Uint8Array) {
    outgoing.end(body);
  } else if (body instanceof Blob) {
    outgoing.end(new Uint8Array(await body.arrayBuffer()));
  } else {
    flushHeaders(outgoing);
    await writeFromReadableStream(body, outgoing)?.catch(
      (e) => handleResponseError(e, outgoing)
    );
  }
  ;
  outgoing[outgoingEnded]?.();
};
var isPromise = (res) => typeof res.then === "function";
var responseViaResponseObject = async (res, outgoing, options = {}) => {
  if (isPromise(res)) {
    if (options.errorHandler) {
      try {
        res = await res;
      } catch (err) {
        const errRes = await options.errorHandler(err);
        if (!errRes) {
          return;
        }
        res = errRes;
      }
    } else {
      res = await res.catch(handleFetchError);
    }
  }
  if (cacheKey in res) {
    return responseViaCache(res, outgoing);
  }
  const resHeaderRecord = buildOutgoingHttpHeaders(res.headers);
  if (res.body) {
    const reader = res.body.getReader();
    const values = [];
    let done = false;
    let currentReadPromise = void 0;
    if (resHeaderRecord["transfer-encoding"] !== "chunked") {
      let maxReadCount = 2;
      for (let i2 = 0; i2 < maxReadCount; i2++) {
        currentReadPromise ||= reader.read();
        const chunk = await readWithoutBlocking(currentReadPromise).catch((e) => {
          console.error(e);
          done = true;
        });
        if (!chunk) {
          if (i2 === 1) {
            await new Promise((resolve) => setTimeout(resolve));
            maxReadCount = 3;
            continue;
          }
          break;
        }
        currentReadPromise = void 0;
        if (chunk.value) {
          values.push(chunk.value);
        }
        if (chunk.done) {
          done = true;
          break;
        }
      }
      if (done && !("content-length" in resHeaderRecord)) {
        resHeaderRecord["content-length"] = values.reduce((acc, value) => acc + value.length, 0);
      }
    }
    outgoing.writeHead(res.status, resHeaderRecord);
    values.forEach((value) => {
      ;
      outgoing.write(value);
    });
    if (done) {
      outgoing.end();
    } else {
      if (values.length === 0) {
        flushHeaders(outgoing);
      }
      await writeFromReadableStreamDefaultReader(reader, outgoing, currentReadPromise);
    }
  } else if (resHeaderRecord[X_ALREADY_SENT]) {
  } else {
    outgoing.writeHead(res.status, resHeaderRecord);
    outgoing.end();
  }
  ;
  outgoing[outgoingEnded]?.();
};
var getRequestListener = (fetchCallback, options = {}) => {
  const autoCleanupIncoming = options.autoCleanupIncoming ?? true;
  if (options.overrideGlobalObjects !== false && global.Request !== Request2) {
    Object.defineProperty(global, "Request", {
      value: Request2
    });
    Object.defineProperty(global, "Response", {
      value: Response2
    });
  }
  return async (incoming, outgoing) => {
    let res, req;
    try {
      req = newRequest(incoming, options.hostname);
      let incomingEnded = !autoCleanupIncoming || incoming.method === "GET" || incoming.method === "HEAD";
      if (!incomingEnded) {
        ;
        incoming[wrapBodyStream] = true;
        incoming.on("end", () => {
          incomingEnded = true;
        });
        if (incoming instanceof import_http2.Http2ServerRequest) {
          ;
          outgoing[outgoingEnded] = () => {
            if (!incomingEnded) {
              setTimeout(() => {
                if (!incomingEnded) {
                  setTimeout(() => {
                    drainIncoming(incoming);
                  });
                }
              });
            }
          };
        }
        outgoing.on("finish", () => {
          if (!incomingEnded) {
            drainIncoming(incoming);
          }
        });
      }
      outgoing.on("close", () => {
        const abortController = req[abortControllerKey];
        if (abortController) {
          if (incoming.errored) {
            req[abortControllerKey].abort(incoming.errored.toString());
          } else if (!outgoing.writableFinished) {
            req[abortControllerKey].abort("Client connection prematurely closed.");
          }
        }
        if (!incomingEnded) {
          setTimeout(() => {
            if (!incomingEnded) {
              setTimeout(() => {
                drainIncoming(incoming);
              });
            }
          });
        }
      });
      res = fetchCallback(req, { incoming, outgoing });
      if (cacheKey in res) {
        return responseViaCache(res, outgoing);
      }
    } catch (e) {
      if (!res) {
        if (options.errorHandler) {
          res = await options.errorHandler(req ? e : toRequestError(e));
          if (!res) {
            return;
          }
        } else if (!req) {
          res = handleRequestError();
        } else {
          res = handleFetchError(e);
        }
      } else {
        return handleResponseError(e, outgoing);
      }
    }
    try {
      return await responseViaResponseObject(res, outgoing, options);
    } catch (e) {
      return handleResponseError(e, outgoing);
    }
  };
};
var createAdaptorServer = (options) => {
  const fetchCallback = options.fetch;
  const requestListener = getRequestListener(fetchCallback, {
    hostname: options.hostname,
    overrideGlobalObjects: options.overrideGlobalObjects,
    autoCleanupIncoming: options.autoCleanupIncoming
  });
  const createServer = options.createServer || import_http.createServer;
  const server = createServer(options.serverOptions || {}, requestListener);
  return server;
};
var serve = (options, listeningListener) => {
  const server = createAdaptorServer(options);
  server.listen(options?.port ?? 3e3, options.hostname, () => {
    const serverInfo = server.address();
    listeningListener && listeningListener(serverInfo);
  });
  return server;
};

// ../../packages/dashboard-api/src/server.ts
var import_node_path18 = __toESM(require("node:path"), 1);
var import_node_fs17 = __toESM(require("node:fs"), 1);
var import_node_child_process7 = require("node:child_process");
var import_node_url4 = require("node:url");

// ../../packages/router/src/route-parser.ts
var TAG_RE = /@(image|video|audio|llm):([^@]+)/gi;
var norm = (s) => s.toLowerCase().replace(/[\s_\-\.]/g, "");
function matchProviderPrefix(chunk, kind, known) {
  const words = chunk.trim().split(/\s+/).filter(Boolean);
  for (let len = Math.min(words.length, 4); len >= 1; len--) {
    const needle = norm(words.slice(0, len).join(" "));
    const hit = known.find((p) => {
      if (p.kind !== kind) return false;
      const pid = norm(p.id);
      return pid === needle || pid.startsWith(needle);
    });
    if (hit) return { id: hit.id, rest: words.slice(len).join(" ") };
  }
  return null;
}
function parsePromptRoute(raw2, uiSelection, knownProviders) {
  const directives = {};
  const unknown = [];
  const leftovers = [];
  let m;
  TAG_RE.lastIndex = 0;
  while ((m = TAG_RE.exec(raw2)) !== null) {
    const kind = m[1].toLowerCase();
    for (const chunk of m[2].split(",")) {
      const hit = matchProviderPrefix(chunk, kind, knownProviders);
      if (hit) {
        directives[kind] = [...directives[kind] ?? [], hit.id];
        if (hit.rest) leftovers.push(hit.rest);
      } else {
        const words = chunk.trim().split(/\s+/).filter(Boolean);
        if (words.length > 0) {
          unknown.push({ kind, name: words[0] });
          if (words.length > 1) leftovers.push(words.slice(1).join(" "));
        }
      }
    }
  }
  const cleanPrompt = [...leftovers, raw2.replace(TAG_RE, " ")].join(" ").replace(/\s{2,}/g, " ").trim();
  const effective = {};
  for (const kind of ["llm", "image", "video", "audio"]) {
    const list = directives[kind] ?? uiSelection[kind];
    if (list && list.length > 0) effective[kind] = list;
  }
  return { cleanPrompt, directives, unknown, effective };
}

// ../../packages/router/src/media-router.ts
init_src2();

// ../../packages/router/src/circuit-breaker.ts
var CircuitBreaker = class {
  constructor(threshold = 2, cooldownMs = 5 * 6e4) {
    this.threshold = threshold;
    this.cooldownMs = cooldownMs;
  }
  fails = /* @__PURE__ */ new Map();
  openUntil = /* @__PURE__ */ new Map();
  isOpen(id) {
    return (this.openUntil.get(id) ?? 0) > Date.now();
  }
  recordFailure(id) {
    const n2 = (this.fails.get(id) ?? 0) + 1;
    this.fails.set(id, n2);
    if (n2 >= this.threshold) {
      this.openUntil.set(id, Date.now() + this.cooldownMs);
      this.fails.set(id, 0);
    }
  }
  recordSuccess(id) {
    this.fails.delete(id);
    this.openUntil.delete(id);
  }
  /** Panel icin durum goruntusu */
  snapshot() {
    const ids = /* @__PURE__ */ new Set([...this.fails.keys(), ...this.openUntil.keys()]);
    return [...ids].map((id) => ({
      id,
      open: this.isOpen(id),
      openUntil: this.openUntil.get(id) ?? null
    }));
  }
};

// ../../packages/router/src/media-router.ts
var TIER_ORDER = { subscription: 0, cheap: 1, free: 2 };
var MediaRouter = class {
  constructor(ledger) {
    this.ledger = ledger;
    this.providers = loadAllProviders();
  }
  providers = [];
  circuit = new CircuitBreaker(2, 5 * 6e4);
  reload() {
    this.providers = loadAllProviders();
  }
  /** Efektif fallback sirasi: env override > preferred > tier sirasi (Bolum 6.2) */
  orderFor(kind, preferred) {
    const envKey = `HMX_ORDER_${kind.toUpperCase()}`;
    const envOrder = process.env[envKey]?.split(",").map((s) => s.trim()).filter(Boolean);
    let base;
    if (envOrder && envOrder.length > 0) {
      base = envOrder;
    } else {
      const cfgs = loadProviderConfigs().filter((c3) => c3.kind === kind);
      base = cfgs.sort((a2, b) => tierRank(a2) - tierRank(b)).map((c3) => c3.id);
    }
    const order2 = preferred ? [preferred, ...base.filter((id) => id !== preferred)] : base;
    return order2.length > 0 ? order2 : base;
  }
  list() {
    const cfgs = loadProviderConfigs();
    return this.providers.map((p) => ({
      id: p.id,
      kind: p.kind,
      authMode: p.authMode,
      tier: cfgs.find((c3) => c3.id === p.id)?.tier ?? defaultTier(cfgs.find((c3) => c3.id === p.id)),
      circuitOpen: this.circuit.isOpen(p.id)
    }));
  }
  circuitSnapshot() {
    return this.circuit.snapshot();
  }
  async generate(kind, req, preferred) {
    const order2 = this.orderFor(kind, preferred);
    const errors = [];
    for (const id of order2) {
      if (this.circuit.isOpen(id)) {
        errors.push(`${id}: devre disi (tekrarlayan hata)`);
        continue;
      }
      const p = this.providers.find((x) => x.id === id && x.kind === kind);
      if (!p) {
        errors.push(`${id}: tanimli degil`);
        continue;
      }
      if (!await p.isAvailable()) {
        errors.push(`${id}: kullanilamiyor (oturum/anahtar yok)`);
        continue;
      }
      this.ledger?.log("action", `Uretim deneniyor: ${id} (${kind})`);
      const result = await p.generate({ ...req, kind });
      if (result.ok) this.circuit.recordSuccess(id);
      else this.circuit.recordFailure(id);
      if (result.ok) {
        this.ledger?.log("verify", `Uretim basarili: ${result.filePath} (${result.meta?.bytes} bayt)`);
        return { ...result, provider: id };
      }
      errors.push(`${id}: ${result.error}`);
      this.ledger?.log("error", `Uretim basarisiz: ${id} - ${result.error}`);
    }
    return { ok: false, error: `${kind}: tum saglayicilar basarisiz \u2014 zincir: ${order2.join(" -> ")}
- ${errors.join("\n- ")}` };
  }
};
function defaultTier(cfg) {
  return cfg?.authMode === "api-key" ? "cheap" : "free";
}
function tierRank(cfg) {
  return TIER_ORDER[cfg.tier ?? defaultTier(cfg)] ?? 3;
}

// ../../packages/router/src/token-saver.ts
var TokenSaverStats = class {
  compressed = 0;
  beforeTokens = 0;
  afterTokens = 0;
  record(before, after) {
    this.compressed++;
    this.beforeTokens += before;
    this.afterTokens += after;
  }
  snapshot() {
    return {
      compressedCount: this.compressed,
      beforeTokens: this.beforeTokens,
      afterTokens: this.afterTokens,
      savedRatio: this.beforeTokens > 0 ? 1 - this.afterTokens / this.beforeTokens : 0
    };
  }
};
var tokenSaverStats = new TokenSaverStats();

// ../../packages/media/src/compose.ts
var import_node_fs14 = __toESM(require("node:fs"), 1);
var import_node_os6 = __toESM(require("node:os"), 1);
var import_node_path14 = __toESM(require("node:path"), 1);

// ../../node_modules/.pnpm/is-plain-obj@4.1.0/node_modules/is-plain-obj/index.js
function isPlainObject(value) {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return (prototype === null || prototype === Object.prototype || Object.getPrototypeOf(prototype) === null) && !(Symbol.toStringTag in value) && !(Symbol.iterator in value);
}

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/arguments/file-url.js
var import_node_url2 = require("node:url");
var safeNormalizeFileUrl = (file, name) => {
  const fileString = normalizeFileUrl(normalizeDenoExecPath(file));
  if (typeof fileString !== "string") {
    throw new TypeError(`${name} must be a string or a file URL: ${fileString}.`);
  }
  return fileString;
};
var normalizeDenoExecPath = (file) => isDenoExecPath(file) ? file.toString() : file;
var isDenoExecPath = (file) => typeof file !== "string" && file && Object.getPrototypeOf(file) === String.prototype;
var normalizeFileUrl = (file) => file instanceof URL ? (0, import_node_url2.fileURLToPath)(file) : file;

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/methods/parameters.js
var normalizeParameters = (rawFile, rawArguments = [], rawOptions = {}) => {
  const filePath = safeNormalizeFileUrl(rawFile, "First argument");
  const [commandArguments, options] = isPlainObject(rawArguments) ? [[], rawArguments] : [rawArguments, rawOptions];
  if (!Array.isArray(commandArguments)) {
    throw new TypeError(`Second argument must be either an array of arguments or an options object: ${commandArguments}`);
  }
  if (commandArguments.some((commandArgument) => typeof commandArgument === "object" && commandArgument !== null)) {
    throw new TypeError(`Second argument must be an array of strings: ${commandArguments}`);
  }
  const normalizedArguments = commandArguments.map(String);
  const nullByteArgument = normalizedArguments.find((normalizedArgument) => normalizedArgument.includes("\0"));
  if (nullByteArgument !== void 0) {
    throw new TypeError(`Arguments cannot contain null bytes ("\\0"): ${nullByteArgument}`);
  }
  if (!isPlainObject(options)) {
    throw new TypeError(`Last argument must be an options object: ${options}`);
  }
  return [filePath, normalizedArguments, options];
};

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/methods/template.js
var import_node_child_process2 = require("node:child_process");

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/utils/uint-array.js
var import_node_string_decoder = require("node:string_decoder");
var { toString: objectToString } = Object.prototype;
var isArrayBuffer = (value) => objectToString.call(value) === "[object ArrayBuffer]";
var isUint8Array = (value) => objectToString.call(value) === "[object Uint8Array]";
var bufferToUint8Array = (buffer) => new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
var textEncoder = new TextEncoder();
var stringToUint8Array = (string) => textEncoder.encode(string);
var textDecoder = new TextDecoder();
var uint8ArrayToString = (uint8Array) => textDecoder.decode(uint8Array);
var joinToString = (uint8ArraysOrStrings, encoding) => {
  const strings = uint8ArraysToStrings(uint8ArraysOrStrings, encoding);
  return strings.join("");
};
var uint8ArraysToStrings = (uint8ArraysOrStrings, encoding) => {
  if (encoding === "utf8" && uint8ArraysOrStrings.every((uint8ArrayOrString) => typeof uint8ArrayOrString === "string")) {
    return uint8ArraysOrStrings;
  }
  const decoder = new import_node_string_decoder.StringDecoder(encoding);
  const strings = uint8ArraysOrStrings.map((uint8ArrayOrString) => typeof uint8ArrayOrString === "string" ? stringToUint8Array(uint8ArrayOrString) : uint8ArrayOrString).map((uint8Array) => decoder.write(uint8Array));
  const finalString = decoder.end();
  return finalString === "" ? strings : [...strings, finalString];
};
var joinToUint8Array = (uint8ArraysOrStrings) => {
  if (uint8ArraysOrStrings.length === 1 && isUint8Array(uint8ArraysOrStrings[0])) {
    return uint8ArraysOrStrings[0];
  }
  return concatUint8Arrays(stringsToUint8Arrays(uint8ArraysOrStrings));
};
var stringsToUint8Arrays = (uint8ArraysOrStrings) => uint8ArraysOrStrings.map((uint8ArrayOrString) => typeof uint8ArrayOrString === "string" ? stringToUint8Array(uint8ArrayOrString) : uint8ArrayOrString);
var concatUint8Arrays = (uint8Arrays) => {
  const result = new Uint8Array(getJoinLength(uint8Arrays));
  let index = 0;
  for (const uint8Array of uint8Arrays) {
    result.set(uint8Array, index);
    index += uint8Array.length;
  }
  return result;
};
var getJoinLength = (uint8Arrays) => {
  let joinLength = 0;
  for (const uint8Array of uint8Arrays) {
    joinLength += uint8Array.length;
  }
  return joinLength;
};

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/methods/template.js
var isTemplateString = (templates) => Array.isArray(templates) && Array.isArray(templates.raw);
var parseTemplates = (templates, expressions) => {
  let tokens = [];
  for (const [index, template] of templates.entries()) {
    tokens = parseTemplate({
      templates,
      expressions,
      tokens,
      index,
      template
    });
  }
  if (tokens.length === 0) {
    throw new TypeError("Template script must not be empty");
  }
  const [file, ...commandArguments] = tokens;
  return [file, commandArguments, {}];
};
var parseTemplate = ({ templates, expressions, tokens, index, template }) => {
  if (template === void 0) {
    throw new TypeError(`Invalid backslash sequence: ${templates.raw[index]}`);
  }
  const { nextTokens, leadingWhitespaces, trailingWhitespaces } = splitByWhitespaces(template, templates.raw[index]);
  const newTokens = concatTokens(tokens, nextTokens, leadingWhitespaces);
  if (index === expressions.length) {
    return newTokens;
  }
  const expression = expressions[index];
  const expressionTokens = Array.isArray(expression) ? expression.map((expression2) => parseExpression(expression2)) : [parseExpression(expression)];
  return concatTokens(newTokens, expressionTokens, trailingWhitespaces);
};
var splitByWhitespaces = (template, rawTemplate) => {
  if (rawTemplate.length === 0) {
    return { nextTokens: [], leadingWhitespaces: false, trailingWhitespaces: false };
  }
  const nextTokens = [];
  let templateStart = 0;
  const leadingWhitespaces = DELIMITERS.has(rawTemplate[0]);
  for (let templateIndex = 0, rawIndex = 0; templateIndex < template.length; templateIndex += 1, rawIndex += 1) {
    const rawCharacter = rawTemplate[rawIndex];
    if (DELIMITERS.has(rawCharacter)) {
      if (templateStart !== templateIndex) {
        nextTokens.push(template.slice(templateStart, templateIndex));
      }
      templateStart = templateIndex + 1;
    } else if (rawCharacter === "\\") {
      const nextRawCharacter = rawTemplate[rawIndex + 1];
      if (nextRawCharacter === "\n") {
        templateIndex -= 1;
        rawIndex += 1;
      } else if (nextRawCharacter === "u" && rawTemplate[rawIndex + 2] === "{") {
        rawIndex = rawTemplate.indexOf("}", rawIndex + 3);
      } else {
        rawIndex += ESCAPE_LENGTH[nextRawCharacter] ?? 1;
      }
    }
  }
  const trailingWhitespaces = templateStart === template.length;
  if (!trailingWhitespaces) {
    nextTokens.push(template.slice(templateStart));
  }
  return { nextTokens, leadingWhitespaces, trailingWhitespaces };
};
var DELIMITERS = /* @__PURE__ */ new Set([" ", "	", "\r", "\n"]);
var ESCAPE_LENGTH = { x: 3, u: 5 };
var concatTokens = (tokens, nextTokens, isSeparated) => isSeparated || tokens.length === 0 || nextTokens.length === 0 ? [...tokens, ...nextTokens] : [
  ...tokens.slice(0, -1),
  `${tokens.at(-1)}${nextTokens[0]}`,
  ...nextTokens.slice(1)
];
var parseExpression = (expression) => {
  const typeOfExpression = typeof expression;
  if (typeOfExpression === "string") {
    return expression;
  }
  if (typeOfExpression === "number") {
    return String(expression);
  }
  if (isPlainObject(expression) && ("stdout" in expression || "isMaxBuffer" in expression)) {
    return getSubprocessResult(expression);
  }
  if (expression instanceof import_node_child_process2.ChildProcess || Object.prototype.toString.call(expression) === "[object Promise]") {
    throw new TypeError("Unexpected subprocess in template expression. Please use ${await subprocess} instead of ${subprocess}.");
  }
  throw new TypeError(`Unexpected "${typeOfExpression}" in template expression`);
};
var getSubprocessResult = ({ stdout }) => {
  if (typeof stdout === "string") {
    return stdout;
  }
  if (isUint8Array(stdout)) {
    return uint8ArrayToString(stdout);
  }
  if (stdout === void 0) {
    throw new TypeError(`Missing result.stdout in template expression. This is probably due to the previous subprocess' "stdout" option.`);
  }
  throw new TypeError(`Unexpected "${typeof stdout}" stdout in template expression`);
};

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/methods/main-sync.js
var import_node_child_process4 = require("node:child_process");

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/arguments/specific.js
var import_node_util = require("node:util");

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/utils/standard-stream.js
var import_node_process = __toESM(require("node:process"), 1);
var isStandardStream = (stream2) => STANDARD_STREAMS.includes(stream2);
var STANDARD_STREAMS = [import_node_process.default.stdin, import_node_process.default.stdout, import_node_process.default.stderr];
var STANDARD_STREAMS_ALIASES = ["stdin", "stdout", "stderr"];
var getStreamName = (fdNumber) => STANDARD_STREAMS_ALIASES[fdNumber] ?? `stdio[${fdNumber}]`;

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/arguments/specific.js
var normalizeFdSpecificOptions = (options) => {
  const optionsCopy = { ...options };
  for (const optionName of FD_SPECIFIC_OPTIONS) {
    optionsCopy[optionName] = normalizeFdSpecificOption(options, optionName);
  }
  return optionsCopy;
};
var normalizeFdSpecificOption = (options, optionName) => {
  const optionBaseArray = Array.from({ length: getStdioLength(options) + 1 });
  const optionArray = normalizeFdSpecificValue(options[optionName], optionBaseArray, optionName);
  return addDefaultValue(optionArray, optionName);
};
var getStdioLength = ({ stdio }) => Array.isArray(stdio) ? Math.max(stdio.length, STANDARD_STREAMS_ALIASES.length) : STANDARD_STREAMS_ALIASES.length;
var normalizeFdSpecificValue = (optionValue, optionArray, optionName) => isPlainObject(optionValue) ? normalizeOptionObject(optionValue, optionArray, optionName) : optionArray.fill(optionValue);
var normalizeOptionObject = (optionValue, optionArray, optionName) => {
  for (const fdName of Object.keys(optionValue).sort(compareFdName)) {
    for (const fdNumber of parseFdName(fdName, optionName, optionArray)) {
      optionArray[fdNumber] = optionValue[fdName];
    }
  }
  return optionArray;
};
var compareFdName = (fdNameA, fdNameB) => getFdNameOrder(fdNameA) < getFdNameOrder(fdNameB) ? 1 : -1;
var getFdNameOrder = (fdName) => {
  if (fdName === "stdout" || fdName === "stderr") {
    return 0;
  }
  return fdName === "all" ? 2 : 1;
};
var parseFdName = (fdName, optionName, optionArray) => {
  if (fdName === "ipc") {
    return [optionArray.length - 1];
  }
  const fdNumber = parseFd(fdName);
  if (fdNumber === void 0 || fdNumber === 0) {
    throw new TypeError(`"${optionName}.${fdName}" is invalid.
It must be "${optionName}.stdout", "${optionName}.stderr", "${optionName}.all", "${optionName}.ipc", or "${optionName}.fd3", "${optionName}.fd4" (and so on).`);
  }
  if (fdNumber >= optionArray.length) {
    throw new TypeError(`"${optionName}.${fdName}" is invalid: that file descriptor does not exist.
Please set the "stdio" option to ensure that file descriptor exists.`);
  }
  return fdNumber === "all" ? [1, 2] : [fdNumber];
};
var parseFd = (fdName) => {
  if (fdName === "all") {
    return fdName;
  }
  if (STANDARD_STREAMS_ALIASES.includes(fdName)) {
    return STANDARD_STREAMS_ALIASES.indexOf(fdName);
  }
  const regexpResult = FD_REGEXP.exec(fdName);
  if (regexpResult !== null) {
    return Number(regexpResult[1]);
  }
};
var FD_REGEXP = /^fd(\d+)$/;
var addDefaultValue = (optionArray, optionName) => optionArray.map((optionValue) => optionValue === void 0 ? DEFAULT_OPTIONS[optionName] : optionValue);
var verboseDefault = (0, import_node_util.debuglog)("execa").enabled ? "full" : "none";
var DEFAULT_OPTIONS = {
  lines: false,
  buffer: true,
  maxBuffer: 1e3 * 1e3 * 100,
  verbose: verboseDefault,
  stripFinalNewline: true
};
var FD_SPECIFIC_OPTIONS = ["lines", "buffer", "maxBuffer", "verbose", "stripFinalNewline"];
var getFdSpecificValue = (optionArray, fdNumber) => fdNumber === "ipc" ? optionArray.at(-1) : optionArray[fdNumber];

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/verbose/values.js
var isVerbose = ({ verbose }, fdNumber) => getFdVerbose(verbose, fdNumber) !== "none";
var isFullVerbose = ({ verbose }, fdNumber) => !["none", "short"].includes(getFdVerbose(verbose, fdNumber));
var getVerboseFunction = ({ verbose }, fdNumber) => {
  const fdVerbose = getFdVerbose(verbose, fdNumber);
  return isVerboseFunction(fdVerbose) ? fdVerbose : void 0;
};
var getFdVerbose = (verbose, fdNumber) => fdNumber === void 0 ? getFdGenericVerbose(verbose) : getFdSpecificValue(verbose, fdNumber);
var getFdGenericVerbose = (verbose) => verbose.find((fdVerbose) => isVerboseFunction(fdVerbose)) ?? VERBOSE_VALUES.findLast((fdVerbose) => verbose.includes(fdVerbose));
var isVerboseFunction = (fdVerbose) => typeof fdVerbose === "function";
var VERBOSE_VALUES = ["none", "short", "full"];

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/verbose/log.js
var import_node_util3 = require("node:util");

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/arguments/escape.js
var import_node_process2 = require("node:process");
var import_node_util2 = require("node:util");
var joinCommand = (filePath, rawArguments) => {
  const fileAndArguments = [filePath, ...rawArguments];
  const command = fileAndArguments.join(" ");
  const escapedCommand = fileAndArguments.map((fileAndArgument) => quoteString(escapeControlCharacters(fileAndArgument))).join(" ");
  return { command, escapedCommand };
};
var escapeLines = (lines) => (0, import_node_util2.stripVTControlCharacters)(lines).split("\n").map((line) => escapeControlCharacters(line)).join("\n");
var escapeControlCharacters = (line) => line.replaceAll(SPECIAL_CHAR_REGEXP, (character) => escapeControlCharacter(character));
var escapeControlCharacter = (character) => {
  const commonEscape = COMMON_ESCAPES[character];
  if (commonEscape !== void 0) {
    return commonEscape;
  }
  const codepoint = character.codePointAt(0);
  const codepointHex = codepoint.toString(16);
  return codepoint <= ASTRAL_START ? `\\u${codepointHex.padStart(4, "0")}` : `\\U${codepointHex}`;
};
var getSpecialCharRegExp = () => {
  try {
    return new RegExp("\\p{Separator}|\\p{Other}", "gu");
  } catch {
    return /[\s\u0000-\u001F\u007F-\u009F\u00AD]/g;
  }
};
var SPECIAL_CHAR_REGEXP = getSpecialCharRegExp();
var COMMON_ESCAPES = {
  " ": " ",
  "\b": "\\b",
  "\f": "\\f",
  "\n": "\\n",
  "\r": "\\r",
  "	": "\\t"
};
var ASTRAL_START = 65535;
var quoteString = (escapedArgument) => {
  if (NO_ESCAPE_REGEXP.test(escapedArgument)) {
    return escapedArgument;
  }
  return import_node_process2.platform === "win32" ? `"${escapedArgument.replaceAll('"', '""')}"` : `'${escapedArgument.replaceAll("'", "'\\''")}'`;
};
var NO_ESCAPE_REGEXP = /^[\w./-]+$/;

// ../../node_modules/.pnpm/is-unicode-supported@2.1.0/node_modules/is-unicode-supported/index.js
var import_node_process3 = __toESM(require("node:process"), 1);
function isUnicodeSupported() {
  const { env } = import_node_process3.default;
  const { TERM, TERM_PROGRAM } = env;
  if (import_node_process3.default.platform !== "win32") {
    return TERM !== "linux";
  }
  return Boolean(env.WT_SESSION) || Boolean(env.TERMINUS_SUBLIME) || env.ConEmuTask === "{cmd::Cmder}" || TERM_PROGRAM === "Terminus-Sublime" || TERM_PROGRAM === "vscode" || TERM === "xterm-256color" || TERM === "alacritty" || TERM === "rxvt-unicode" || TERM === "rxvt-unicode-256color" || env.TERMINAL_EMULATOR === "JetBrains-JediTerm";
}

// ../../node_modules/.pnpm/figures@6.1.0/node_modules/figures/index.js
var common = {
  circleQuestionMark: "(?)",
  questionMarkPrefix: "(?)",
  square: "\u2588",
  squareDarkShade: "\u2593",
  squareMediumShade: "\u2592",
  squareLightShade: "\u2591",
  squareTop: "\u2580",
  squareBottom: "\u2584",
  squareLeft: "\u258C",
  squareRight: "\u2590",
  squareCenter: "\u25A0",
  bullet: "\u25CF",
  dot: "\u2024",
  ellipsis: "\u2026",
  pointerSmall: "\u203A",
  triangleUp: "\u25B2",
  triangleUpSmall: "\u25B4",
  triangleDown: "\u25BC",
  triangleDownSmall: "\u25BE",
  triangleLeftSmall: "\u25C2",
  triangleRightSmall: "\u25B8",
  home: "\u2302",
  heart: "\u2665",
  musicNote: "\u266A",
  musicNoteBeamed: "\u266B",
  arrowUp: "\u2191",
  arrowDown: "\u2193",
  arrowLeft: "\u2190",
  arrowRight: "\u2192",
  arrowLeftRight: "\u2194",
  arrowUpDown: "\u2195",
  almostEqual: "\u2248",
  notEqual: "\u2260",
  lessOrEqual: "\u2264",
  greaterOrEqual: "\u2265",
  identical: "\u2261",
  infinity: "\u221E",
  subscriptZero: "\u2080",
  subscriptOne: "\u2081",
  subscriptTwo: "\u2082",
  subscriptThree: "\u2083",
  subscriptFour: "\u2084",
  subscriptFive: "\u2085",
  subscriptSix: "\u2086",
  subscriptSeven: "\u2087",
  subscriptEight: "\u2088",
  subscriptNine: "\u2089",
  oneHalf: "\xBD",
  oneThird: "\u2153",
  oneQuarter: "\xBC",
  oneFifth: "\u2155",
  oneSixth: "\u2159",
  oneEighth: "\u215B",
  twoThirds: "\u2154",
  twoFifths: "\u2156",
  threeQuarters: "\xBE",
  threeFifths: "\u2157",
  threeEighths: "\u215C",
  fourFifths: "\u2158",
  fiveSixths: "\u215A",
  fiveEighths: "\u215D",
  sevenEighths: "\u215E",
  line: "\u2500",
  lineBold: "\u2501",
  lineDouble: "\u2550",
  lineDashed0: "\u2504",
  lineDashed1: "\u2505",
  lineDashed2: "\u2508",
  lineDashed3: "\u2509",
  lineDashed4: "\u254C",
  lineDashed5: "\u254D",
  lineDashed6: "\u2574",
  lineDashed7: "\u2576",
  lineDashed8: "\u2578",
  lineDashed9: "\u257A",
  lineDashed10: "\u257C",
  lineDashed11: "\u257E",
  lineDashed12: "\u2212",
  lineDashed13: "\u2013",
  lineDashed14: "\u2010",
  lineDashed15: "\u2043",
  lineVertical: "\u2502",
  lineVerticalBold: "\u2503",
  lineVerticalDouble: "\u2551",
  lineVerticalDashed0: "\u2506",
  lineVerticalDashed1: "\u2507",
  lineVerticalDashed2: "\u250A",
  lineVerticalDashed3: "\u250B",
  lineVerticalDashed4: "\u254E",
  lineVerticalDashed5: "\u254F",
  lineVerticalDashed6: "\u2575",
  lineVerticalDashed7: "\u2577",
  lineVerticalDashed8: "\u2579",
  lineVerticalDashed9: "\u257B",
  lineVerticalDashed10: "\u257D",
  lineVerticalDashed11: "\u257F",
  lineDownLeft: "\u2510",
  lineDownLeftArc: "\u256E",
  lineDownBoldLeftBold: "\u2513",
  lineDownBoldLeft: "\u2512",
  lineDownLeftBold: "\u2511",
  lineDownDoubleLeftDouble: "\u2557",
  lineDownDoubleLeft: "\u2556",
  lineDownLeftDouble: "\u2555",
  lineDownRight: "\u250C",
  lineDownRightArc: "\u256D",
  lineDownBoldRightBold: "\u250F",
  lineDownBoldRight: "\u250E",
  lineDownRightBold: "\u250D",
  lineDownDoubleRightDouble: "\u2554",
  lineDownDoubleRight: "\u2553",
  lineDownRightDouble: "\u2552",
  lineUpLeft: "\u2518",
  lineUpLeftArc: "\u256F",
  lineUpBoldLeftBold: "\u251B",
  lineUpBoldLeft: "\u251A",
  lineUpLeftBold: "\u2519",
  lineUpDoubleLeftDouble: "\u255D",
  lineUpDoubleLeft: "\u255C",
  lineUpLeftDouble: "\u255B",
  lineUpRight: "\u2514",
  lineUpRightArc: "\u2570",
  lineUpBoldRightBold: "\u2517",
  lineUpBoldRight: "\u2516",
  lineUpRightBold: "\u2515",
  lineUpDoubleRightDouble: "\u255A",
  lineUpDoubleRight: "\u2559",
  lineUpRightDouble: "\u2558",
  lineUpDownLeft: "\u2524",
  lineUpBoldDownBoldLeftBold: "\u252B",
  lineUpBoldDownBoldLeft: "\u2528",
  lineUpDownLeftBold: "\u2525",
  lineUpBoldDownLeftBold: "\u2529",
  lineUpDownBoldLeftBold: "\u252A",
  lineUpDownBoldLeft: "\u2527",
  lineUpBoldDownLeft: "\u2526",
  lineUpDoubleDownDoubleLeftDouble: "\u2563",
  lineUpDoubleDownDoubleLeft: "\u2562",
  lineUpDownLeftDouble: "\u2561",
  lineUpDownRight: "\u251C",
  lineUpBoldDownBoldRightBold: "\u2523",
  lineUpBoldDownBoldRight: "\u2520",
  lineUpDownRightBold: "\u251D",
  lineUpBoldDownRightBold: "\u2521",
  lineUpDownBoldRightBold: "\u2522",
  lineUpDownBoldRight: "\u251F",
  lineUpBoldDownRight: "\u251E",
  lineUpDoubleDownDoubleRightDouble: "\u2560",
  lineUpDoubleDownDoubleRight: "\u255F",
  lineUpDownRightDouble: "\u255E",
  lineDownLeftRight: "\u252C",
  lineDownBoldLeftBoldRightBold: "\u2533",
  lineDownLeftBoldRightBold: "\u252F",
  lineDownBoldLeftRight: "\u2530",
  lineDownBoldLeftBoldRight: "\u2531",
  lineDownBoldLeftRightBold: "\u2532",
  lineDownLeftRightBold: "\u252E",
  lineDownLeftBoldRight: "\u252D",
  lineDownDoubleLeftDoubleRightDouble: "\u2566",
  lineDownDoubleLeftRight: "\u2565",
  lineDownLeftDoubleRightDouble: "\u2564",
  lineUpLeftRight: "\u2534",
  lineUpBoldLeftBoldRightBold: "\u253B",
  lineUpLeftBoldRightBold: "\u2537",
  lineUpBoldLeftRight: "\u2538",
  lineUpBoldLeftBoldRight: "\u2539",
  lineUpBoldLeftRightBold: "\u253A",
  lineUpLeftRightBold: "\u2536",
  lineUpLeftBoldRight: "\u2535",
  lineUpDoubleLeftDoubleRightDouble: "\u2569",
  lineUpDoubleLeftRight: "\u2568",
  lineUpLeftDoubleRightDouble: "\u2567",
  lineUpDownLeftRight: "\u253C",
  lineUpBoldDownBoldLeftBoldRightBold: "\u254B",
  lineUpDownBoldLeftBoldRightBold: "\u2548",
  lineUpBoldDownLeftBoldRightBold: "\u2547",
  lineUpBoldDownBoldLeftRightBold: "\u254A",
  lineUpBoldDownBoldLeftBoldRight: "\u2549",
  lineUpBoldDownLeftRight: "\u2540",
  lineUpDownBoldLeftRight: "\u2541",
  lineUpDownLeftBoldRight: "\u253D",
  lineUpDownLeftRightBold: "\u253E",
  lineUpBoldDownBoldLeftRight: "\u2542",
  lineUpDownLeftBoldRightBold: "\u253F",
  lineUpBoldDownLeftBoldRight: "\u2543",
  lineUpBoldDownLeftRightBold: "\u2544",
  lineUpDownBoldLeftBoldRight: "\u2545",
  lineUpDownBoldLeftRightBold: "\u2546",
  lineUpDoubleDownDoubleLeftDoubleRightDouble: "\u256C",
  lineUpDoubleDownDoubleLeftRight: "\u256B",
  lineUpDownLeftDoubleRightDouble: "\u256A",
  lineCross: "\u2573",
  lineBackslash: "\u2572",
  lineSlash: "\u2571"
};
var specialMainSymbols = {
  tick: "\u2714",
  info: "\u2139",
  warning: "\u26A0",
  cross: "\u2718",
  squareSmall: "\u25FB",
  squareSmallFilled: "\u25FC",
  circle: "\u25EF",
  circleFilled: "\u25C9",
  circleDotted: "\u25CC",
  circleDouble: "\u25CE",
  circleCircle: "\u24DE",
  circleCross: "\u24E7",
  circlePipe: "\u24BE",
  radioOn: "\u25C9",
  radioOff: "\u25EF",
  checkboxOn: "\u2612",
  checkboxOff: "\u2610",
  checkboxCircleOn: "\u24E7",
  checkboxCircleOff: "\u24BE",
  pointer: "\u276F",
  triangleUpOutline: "\u25B3",
  triangleLeft: "\u25C0",
  triangleRight: "\u25B6",
  lozenge: "\u25C6",
  lozengeOutline: "\u25C7",
  hamburger: "\u2630",
  smiley: "\u32E1",
  mustache: "\u0DF4",
  star: "\u2605",
  play: "\u25B6",
  nodejs: "\u2B22",
  oneSeventh: "\u2150",
  oneNinth: "\u2151",
  oneTenth: "\u2152"
};
var specialFallbackSymbols = {
  tick: "\u221A",
  info: "i",
  warning: "\u203C",
  cross: "\xD7",
  squareSmall: "\u25A1",
  squareSmallFilled: "\u25A0",
  circle: "( )",
  circleFilled: "(*)",
  circleDotted: "( )",
  circleDouble: "( )",
  circleCircle: "(\u25CB)",
  circleCross: "(\xD7)",
  circlePipe: "(\u2502)",
  radioOn: "(*)",
  radioOff: "( )",
  checkboxOn: "[\xD7]",
  checkboxOff: "[ ]",
  checkboxCircleOn: "(\xD7)",
  checkboxCircleOff: "( )",
  pointer: ">",
  triangleUpOutline: "\u2206",
  triangleLeft: "\u25C4",
  triangleRight: "\u25BA",
  lozenge: "\u2666",
  lozengeOutline: "\u25CA",
  hamburger: "\u2261",
  smiley: "\u263A",
  mustache: "\u250C\u2500\u2510",
  star: "\u2736",
  play: "\u25BA",
  nodejs: "\u2666",
  oneSeventh: "1/7",
  oneNinth: "1/9",
  oneTenth: "1/10"
};
var mainSymbols = { ...common, ...specialMainSymbols };
var fallbackSymbols = { ...common, ...specialFallbackSymbols };
var shouldUseMain = isUnicodeSupported();
var figures = shouldUseMain ? mainSymbols : fallbackSymbols;
var figures_default = figures;
var replacements = Object.entries(specialMainSymbols);

// ../../node_modules/.pnpm/yoctocolors@2.2.0/node_modules/yoctocolors/base.js
var import_node_tty = __toESM(require("node:tty"), 1);
var hasColors = import_node_tty.default?.WriteStream?.prototype?.hasColors?.() ?? false;
var format = (open, close) => {
  if (!hasColors) {
    return (input) => input;
  }
  const openCode = `\x1B[${open}m`;
  const closeCode = `\x1B[${close}m`;
  return (input) => {
    const string = input + "";
    let index = string.indexOf(closeCode);
    if (index === -1) {
      return openCode + string + closeCode;
    }
    let result = openCode;
    let lastIndex = 0;
    const reopenOnNestedClose = close === 22;
    const replaceCode = (reopenOnNestedClose ? closeCode : "") + openCode;
    while (index !== -1) {
      result += string.slice(lastIndex, index) + replaceCode;
      lastIndex = index + closeCode.length;
      index = string.indexOf(closeCode, lastIndex);
    }
    result += string.slice(lastIndex) + closeCode;
    return result;
  };
};
var reset = format(0, 0);
var bold = format(1, 22);
var dim = format(2, 22);
var italic = format(3, 23);
var underline = format(4, 24);
var underlineDouble = format("4:2", 24);
var underlineCurly = format("4:3", 24);
var underlineDotted = format("4:4", 24);
var underlineDashed = format("4:5", 24);
var overline = format(53, 55);
var inverse = format(7, 27);
var hidden = format(8, 28);
var strikethrough = format(9, 29);
var black = format(30, 39);
var red = format(31, 39);
var green = format(32, 39);
var yellow = format(33, 39);
var blue = format(34, 39);
var magenta = format(35, 39);
var cyan = format(36, 39);
var white = format(37, 39);
var gray = format(90, 39);
var bgBlack = format(40, 49);
var bgRed = format(41, 49);
var bgGreen = format(42, 49);
var bgYellow = format(43, 49);
var bgBlue = format(44, 49);
var bgMagenta = format(45, 49);
var bgCyan = format(46, 49);
var bgWhite = format(47, 49);
var bgGray = format(100, 49);
var redBright = format(91, 39);
var greenBright = format(92, 39);
var yellowBright = format(93, 39);
var blueBright = format(94, 39);
var magentaBright = format(95, 39);
var cyanBright = format(96, 39);
var whiteBright = format(97, 39);
var bgRedBright = format(101, 49);
var bgGreenBright = format(102, 49);
var bgYellowBright = format(103, 49);
var bgBlueBright = format(104, 49);
var bgMagentaBright = format(105, 49);
var bgCyanBright = format(106, 49);
var bgWhiteBright = format(107, 49);
var underlineBlack = format("58;5;0", 59);
var underlineRed = format("58;5;1", 59);
var underlineGreen = format("58;5;2", 59);
var underlineYellow = format("58;5;3", 59);
var underlineBlue = format("58;5;4", 59);
var underlineMagenta = format("58;5;5", 59);
var underlineCyan = format("58;5;6", 59);
var underlineWhite = format("58;5;7", 59);
var underlineGray = format("58;5;8", 59);
var underlineRedBright = format("58;5;9", 59);
var underlineGreenBright = format("58;5;10", 59);
var underlineYellowBright = format("58;5;11", 59);
var underlineBlueBright = format("58;5;12", 59);
var underlineMagentaBright = format("58;5;13", 59);
var underlineCyanBright = format("58;5;14", 59);
var underlineWhiteBright = format("58;5;15", 59);

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/verbose/default.js
var defaultVerboseFunction = ({
  type,
  message,
  timestamp,
  piped,
  commandId,
  result: { failed = false } = {},
  options: { reject = true }
}) => {
  const timestampString = serializeTimestamp(timestamp);
  const icon = ICONS[type]({ failed, reject, piped });
  const color = COLORS[type]({ reject });
  return `${gray(`[${timestampString}]`)} ${gray(`[${commandId}]`)} ${color(icon)} ${color(message)}`;
};
var serializeTimestamp = (timestamp) => `${padField(timestamp.getHours(), 2)}:${padField(timestamp.getMinutes(), 2)}:${padField(timestamp.getSeconds(), 2)}.${padField(timestamp.getMilliseconds(), 3)}`;
var padField = (field, padding) => String(field).padStart(padding, "0");
var getFinalIcon = ({ failed, reject }) => {
  if (!failed) {
    return figures_default.tick;
  }
  return reject ? figures_default.cross : figures_default.warning;
};
var ICONS = {
  command: ({ piped }) => piped ? "|" : "$",
  output: () => " ",
  ipc: () => "*",
  error: getFinalIcon,
  duration: getFinalIcon
};
var identity = (string) => string;
var COLORS = {
  command: () => bold,
  output: () => identity,
  ipc: () => identity,
  error: ({ reject }) => reject ? redBright : yellowBright,
  duration: () => gray
};

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/verbose/custom.js
var applyVerboseOnLines = (printedLines, verboseInfo, fdNumber) => {
  const verboseFunction = getVerboseFunction(verboseInfo, fdNumber);
  return printedLines.map(({ verboseLine, verboseObject }) => applyVerboseFunction(verboseLine, verboseObject, verboseFunction)).filter((printedLine) => printedLine !== void 0).map((printedLine) => appendNewline(printedLine)).join("");
};
var applyVerboseFunction = (verboseLine, verboseObject, verboseFunction) => {
  if (verboseFunction === void 0) {
    return verboseLine;
  }
  const printedLine = verboseFunction(verboseLine, verboseObject);
  if (typeof printedLine === "string") {
    return printedLine;
  }
};
var appendNewline = (printedLine) => printedLine.endsWith("\n") ? printedLine : `${printedLine}
`;

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/verbose/log.js
var verboseLog = ({ type, verboseMessage, fdNumber, verboseInfo, result }) => {
  const verboseObject = getVerboseObject({ type, result, verboseInfo });
  const printedLines = getPrintedLines(verboseMessage, verboseObject);
  const finalLines = applyVerboseOnLines(printedLines, verboseInfo, fdNumber);
  if (finalLines !== "") {
    console.warn(finalLines.slice(0, -1));
  }
};
var getVerboseObject = ({
  type,
  result,
  verboseInfo: { escapedCommand, commandId, rawOptions: { piped = false, ...options } }
}) => ({
  type,
  escapedCommand,
  commandId: `${commandId}`,
  timestamp: /* @__PURE__ */ new Date(),
  piped,
  result,
  options
});
var getPrintedLines = (verboseMessage, verboseObject) => verboseMessage.split("\n").map((message) => getPrintedLine({ ...verboseObject, message }));
var getPrintedLine = (verboseObject) => {
  const verboseLine = defaultVerboseFunction(verboseObject);
  return { verboseLine, verboseObject };
};
var serializeVerboseMessage = (message) => {
  const messageString = typeof message === "string" ? message : (0, import_node_util3.inspect)(message);
  const escapedMessage = escapeLines(messageString);
  return escapedMessage.replaceAll("	", " ".repeat(TAB_SIZE));
};
var TAB_SIZE = 2;

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/verbose/start.js
var logCommand = (escapedCommand, verboseInfo) => {
  if (!isVerbose(verboseInfo)) {
    return;
  }
  verboseLog({
    type: "command",
    verboseMessage: escapedCommand,
    verboseInfo
  });
};

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/verbose/info.js
var getVerboseInfo = (verbose, escapedCommand, rawOptions) => {
  validateVerbose(verbose);
  const commandId = getCommandId(verbose);
  return {
    verbose,
    escapedCommand,
    commandId,
    rawOptions
  };
};
var getCommandId = (verbose) => isVerbose({ verbose }) ? COMMAND_ID++ : void 0;
var COMMAND_ID = 0n;
var validateVerbose = (verbose) => {
  for (const fdVerbose of verbose) {
    if (fdVerbose === false) {
      throw new TypeError(`The "verbose: false" option was renamed to "verbose: 'none'".`);
    }
    if (fdVerbose === true) {
      throw new TypeError(`The "verbose: true" option was renamed to "verbose: 'short'".`);
    }
    if (!VERBOSE_VALUES.includes(fdVerbose) && !isVerboseFunction(fdVerbose)) {
      const allowedValues = VERBOSE_VALUES.map((allowedValue) => `'${allowedValue}'`).join(", ");
      throw new TypeError(`The "verbose" option must not be ${fdVerbose}. Allowed values are: ${allowedValues} or a function.`);
    }
  }
};

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/return/duration.js
var import_node_process4 = require("node:process");
var getStartTime = () => import_node_process4.hrtime.bigint();
var getDurationMs = (startTime) => Number(import_node_process4.hrtime.bigint() - startTime) / 1e6;

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/arguments/command.js
var handleCommand = (filePath, rawArguments, rawOptions) => {
  const startTime = getStartTime();
  const { command, escapedCommand } = joinCommand(filePath, rawArguments);
  const verbose = normalizeFdSpecificOption(rawOptions, "verbose");
  const verboseInfo = getVerboseInfo(verbose, escapedCommand, { ...rawOptions });
  logCommand(escapedCommand, verboseInfo);
  return {
    command,
    escapedCommand,
    startTime,
    verboseInfo
  };
};

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/arguments/options.js
var import_node_path13 = __toESM(require("node:path"), 1);
var import_node_process8 = __toESM(require("node:process"), 1);
var import_cross_spawn = __toESM(require_cross_spawn(), 1);

// ../../node_modules/.pnpm/npm-run-path@6.0.0/node_modules/npm-run-path/index.js
var import_node_process5 = __toESM(require("node:process"), 1);
var import_node_path10 = __toESM(require("node:path"), 1);

// ../../node_modules/.pnpm/path-key@4.0.0/node_modules/path-key/index.js
function pathKey(options = {}) {
  const {
    env = process.env,
    platform: platform2 = process.platform
  } = options;
  if (platform2 !== "win32") {
    return "PATH";
  }
  return Object.keys(env).reverse().find((key) => key.toUpperCase() === "PATH") || "Path";
}

// ../../node_modules/.pnpm/unicorn-magic@0.3.0/node_modules/unicorn-magic/node.js
var import_node_util4 = require("node:util");
var import_node_child_process3 = require("node:child_process");
var import_node_path9 = __toESM(require("node:path"), 1);
var import_node_url3 = require("node:url");
var execFileOriginal = (0, import_node_util4.promisify)(import_node_child_process3.execFile);
function toPath(urlOrPath) {
  return urlOrPath instanceof URL ? (0, import_node_url3.fileURLToPath)(urlOrPath) : urlOrPath;
}
function traversePathUp(startPath) {
  return {
    *[Symbol.iterator]() {
      let currentPath = import_node_path9.default.resolve(toPath(startPath));
      let previousPath;
      while (previousPath !== currentPath) {
        yield currentPath;
        previousPath = currentPath;
        currentPath = import_node_path9.default.resolve(currentPath, "..");
      }
    }
  };
}
var TEN_MEGABYTES_IN_BYTES = 10 * 1024 * 1024;

// ../../node_modules/.pnpm/npm-run-path@6.0.0/node_modules/npm-run-path/index.js
var npmRunPath = ({
  cwd = import_node_process5.default.cwd(),
  path: pathOption = import_node_process5.default.env[pathKey()],
  preferLocal = true,
  execPath: execPath2 = import_node_process5.default.execPath,
  addExecPath = true
} = {}) => {
  const cwdPath = import_node_path10.default.resolve(toPath(cwd));
  const result = [];
  const pathParts = pathOption.split(import_node_path10.default.delimiter);
  if (preferLocal) {
    applyPreferLocal(result, pathParts, cwdPath);
  }
  if (addExecPath) {
    applyExecPath(result, pathParts, execPath2, cwdPath);
  }
  return pathOption === "" || pathOption === import_node_path10.default.delimiter ? `${result.join(import_node_path10.default.delimiter)}${pathOption}` : [...result, pathOption].join(import_node_path10.default.delimiter);
};
var applyPreferLocal = (result, pathParts, cwdPath) => {
  for (const directory of traversePathUp(cwdPath)) {
    const pathPart = import_node_path10.default.join(directory, "node_modules/.bin");
    if (!pathParts.includes(pathPart)) {
      result.push(pathPart);
    }
  }
};
var applyExecPath = (result, pathParts, execPath2, cwdPath) => {
  const pathPart = import_node_path10.default.resolve(cwdPath, toPath(execPath2), "..");
  if (!pathParts.includes(pathPart)) {
    result.push(pathPart);
  }
};
var npmRunPathEnv = ({ env = import_node_process5.default.env, ...options } = {}) => {
  env = { ...env };
  const pathName = pathKey({ env });
  options.path = env[pathName];
  env[pathName] = npmRunPath(options);
  return env;
};

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/terminate/kill.js
var import_promises = require("node:timers/promises");

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/return/final-error.js
var getFinalError = (originalError, message, isSync) => {
  const ErrorClass = isSync ? ExecaSyncError : ExecaError;
  const options = originalError instanceof DiscardedError ? {} : { cause: originalError };
  return new ErrorClass(message, options);
};
var DiscardedError = class extends Error {
};
var setErrorName = (ErrorClass, value) => {
  Object.defineProperty(ErrorClass.prototype, "name", {
    value,
    writable: true,
    enumerable: false,
    configurable: true
  });
  Object.defineProperty(ErrorClass.prototype, execaErrorSymbol, {
    value: true,
    writable: false,
    enumerable: false,
    configurable: false
  });
};
var isExecaError = (error) => isErrorInstance(error) && execaErrorSymbol in error;
var execaErrorSymbol = Symbol("isExecaError");
var isErrorInstance = (value) => Object.prototype.toString.call(value) === "[object Error]";
var ExecaError = class extends Error {
};
setErrorName(ExecaError, ExecaError.name);
var ExecaSyncError = class extends Error {
};
setErrorName(ExecaSyncError, ExecaSyncError.name);

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/terminate/signal.js
var import_node_os5 = require("node:os");

// ../../node_modules/.pnpm/human-signals@8.0.1/node_modules/human-signals/build/src/main.js
var import_node_os4 = require("node:os");

// ../../node_modules/.pnpm/human-signals@8.0.1/node_modules/human-signals/build/src/realtime.js
var getRealtimeSignals = () => {
  const length = SIGRTMAX - SIGRTMIN + 1;
  return Array.from({ length }, getRealtimeSignal);
};
var getRealtimeSignal = (value, index) => ({
  name: `SIGRT${index + 1}`,
  number: SIGRTMIN + index,
  action: "terminate",
  description: "Application-specific signal (realtime)",
  standard: "posix"
});
var SIGRTMIN = 34;
var SIGRTMAX = 64;

// ../../node_modules/.pnpm/human-signals@8.0.1/node_modules/human-signals/build/src/signals.js
var import_node_os3 = require("node:os");

// ../../node_modules/.pnpm/human-signals@8.0.1/node_modules/human-signals/build/src/core.js
var SIGNALS = [
  {
    name: "SIGHUP",
    number: 1,
    action: "terminate",
    description: "Terminal closed",
    standard: "posix"
  },
  {
    name: "SIGINT",
    number: 2,
    action: "terminate",
    description: "User interruption with CTRL-C",
    standard: "ansi"
  },
  {
    name: "SIGQUIT",
    number: 3,
    action: "core",
    description: "User interruption with CTRL-\\",
    standard: "posix"
  },
  {
    name: "SIGILL",
    number: 4,
    action: "core",
    description: "Invalid machine instruction",
    standard: "ansi"
  },
  {
    name: "SIGTRAP",
    number: 5,
    action: "core",
    description: "Debugger breakpoint",
    standard: "posix"
  },
  {
    name: "SIGABRT",
    number: 6,
    action: "core",
    description: "Aborted",
    standard: "ansi"
  },
  {
    name: "SIGIOT",
    number: 6,
    action: "core",
    description: "Aborted",
    standard: "bsd"
  },
  {
    name: "SIGBUS",
    number: 7,
    action: "core",
    description: "Bus error due to misaligned, non-existing address or paging error",
    standard: "bsd"
  },
  {
    name: "SIGEMT",
    number: 7,
    action: "terminate",
    description: "Command should be emulated but is not implemented",
    standard: "other"
  },
  {
    name: "SIGFPE",
    number: 8,
    action: "core",
    description: "Floating point arithmetic error",
    standard: "ansi"
  },
  {
    name: "SIGKILL",
    number: 9,
    action: "terminate",
    description: "Forced termination",
    standard: "posix",
    forced: true
  },
  {
    name: "SIGUSR1",
    number: 10,
    action: "terminate",
    description: "Application-specific signal",
    standard: "posix"
  },
  {
    name: "SIGSEGV",
    number: 11,
    action: "core",
    description: "Segmentation fault",
    standard: "ansi"
  },
  {
    name: "SIGUSR2",
    number: 12,
    action: "terminate",
    description: "Application-specific signal",
    standard: "posix"
  },
  {
    name: "SIGPIPE",
    number: 13,
    action: "terminate",
    description: "Broken pipe or socket",
    standard: "posix"
  },
  {
    name: "SIGALRM",
    number: 14,
    action: "terminate",
    description: "Timeout or timer",
    standard: "posix"
  },
  {
    name: "SIGTERM",
    number: 15,
    action: "terminate",
    description: "Termination",
    standard: "ansi"
  },
  {
    name: "SIGSTKFLT",
    number: 16,
    action: "terminate",
    description: "Stack is empty or overflowed",
    standard: "other"
  },
  {
    name: "SIGCHLD",
    number: 17,
    action: "ignore",
    description: "Child process terminated, paused or unpaused",
    standard: "posix"
  },
  {
    name: "SIGCLD",
    number: 17,
    action: "ignore",
    description: "Child process terminated, paused or unpaused",
    standard: "other"
  },
  {
    name: "SIGCONT",
    number: 18,
    action: "unpause",
    description: "Unpaused",
    standard: "posix",
    forced: true
  },
  {
    name: "SIGSTOP",
    number: 19,
    action: "pause",
    description: "Paused",
    standard: "posix",
    forced: true
  },
  {
    name: "SIGTSTP",
    number: 20,
    action: "pause",
    description: 'Paused using CTRL-Z or "suspend"',
    standard: "posix"
  },
  {
    name: "SIGTTIN",
    number: 21,
    action: "pause",
    description: "Background process cannot read terminal input",
    standard: "posix"
  },
  {
    name: "SIGBREAK",
    number: 21,
    action: "terminate",
    description: "User interruption with CTRL-BREAK",
    standard: "other"
  },
  {
    name: "SIGTTOU",
    number: 22,
    action: "pause",
    description: "Background process cannot write to terminal output",
    standard: "posix"
  },
  {
    name: "SIGURG",
    number: 23,
    action: "ignore",
    description: "Socket received out-of-band data",
    standard: "bsd"
  },
  {
    name: "SIGXCPU",
    number: 24,
    action: "core",
    description: "Process timed out",
    standard: "bsd"
  },
  {
    name: "SIGXFSZ",
    number: 25,
    action: "core",
    description: "File too big",
    standard: "bsd"
  },
  {
    name: "SIGVTALRM",
    number: 26,
    action: "terminate",
    description: "Timeout or timer",
    standard: "bsd"
  },
  {
    name: "SIGPROF",
    number: 27,
    action: "terminate",
    description: "Timeout or timer",
    standard: "bsd"
  },
  {
    name: "SIGWINCH",
    number: 28,
    action: "ignore",
    description: "Terminal window size changed",
    standard: "bsd"
  },
  {
    name: "SIGIO",
    number: 29,
    action: "terminate",
    description: "I/O is available",
    standard: "other"
  },
  {
    name: "SIGPOLL",
    number: 29,
    action: "terminate",
    description: "Watched event",
    standard: "other"
  },
  {
    name: "SIGINFO",
    number: 29,
    action: "ignore",
    description: "Request for process information",
    standard: "other"
  },
  {
    name: "SIGPWR",
    number: 30,
    action: "terminate",
    description: "Device running out of power",
    standard: "systemv"
  },
  {
    name: "SIGSYS",
    number: 31,
    action: "core",
    description: "Invalid system call",
    standard: "other"
  },
  {
    name: "SIGUNUSED",
    number: 31,
    action: "terminate",
    description: "Invalid system call",
    standard: "other"
  }
];

// ../../node_modules/.pnpm/human-signals@8.0.1/node_modules/human-signals/build/src/signals.js
var getSignals = () => {
  const realtimeSignals = getRealtimeSignals();
  const signals2 = [...SIGNALS, ...realtimeSignals].map(normalizeSignal);
  return signals2;
};
var normalizeSignal = ({
  name,
  number: defaultNumber,
  description,
  action,
  forced = false,
  standard
}) => {
  const {
    signals: { [name]: constantSignal }
  } = import_node_os3.constants;
  const supported = constantSignal !== void 0;
  const number = supported ? constantSignal : defaultNumber;
  return { name, number, description, supported, action, forced, standard };
};

// ../../node_modules/.pnpm/human-signals@8.0.1/node_modules/human-signals/build/src/main.js
var getSignalsByName = () => {
  const signals2 = getSignals();
  return Object.fromEntries(signals2.map(getSignalByName));
};
var getSignalByName = ({
  name,
  number,
  description,
  supported,
  action,
  forced,
  standard
}) => [name, { name, number, description, supported, action, forced, standard }];
var signalsByName = getSignalsByName();
var getSignalsByNumber = () => {
  const signals2 = getSignals();
  const length = SIGRTMAX + 1;
  const signalsA = Array.from(
    { length },
    (value, number) => getSignalByNumber(number, signals2)
  );
  return Object.assign({}, ...signalsA);
};
var getSignalByNumber = (number, signals2) => {
  const signal = findSignalByNumber(number, signals2);
  if (signal === void 0) {
    return {};
  }
  const { name, description, supported, action, forced, standard } = signal;
  return {
    [number]: {
      name,
      number,
      description,
      supported,
      action,
      forced,
      standard
    }
  };
};
var findSignalByNumber = (number, signals2) => {
  const signal = signals2.find(({ name }) => import_node_os4.constants.signals[name] === number);
  if (signal !== void 0) {
    return signal;
  }
  return signals2.find((signalA) => signalA.number === number);
};
var signalsByNumber = getSignalsByNumber();

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/terminate/signal.js
var normalizeKillSignal = (killSignal) => {
  const optionName = "option `killSignal`";
  if (killSignal === 0) {
    throw new TypeError(`Invalid ${optionName}: 0 cannot be used.`);
  }
  return normalizeSignal2(killSignal, optionName);
};
var normalizeSignalArgument = (signal) => signal === 0 ? signal : normalizeSignal2(signal, "`subprocess.kill()`'s argument");
var normalizeSignal2 = (signalNameOrInteger, optionName) => {
  if (Number.isInteger(signalNameOrInteger)) {
    return normalizeSignalInteger(signalNameOrInteger, optionName);
  }
  if (typeof signalNameOrInteger === "string") {
    return normalizeSignalName(signalNameOrInteger, optionName);
  }
  throw new TypeError(`Invalid ${optionName} ${String(signalNameOrInteger)}: it must be a string or an integer.
${getAvailableSignals()}`);
};
var normalizeSignalInteger = (signalInteger, optionName) => {
  if (signalsIntegerToName.has(signalInteger)) {
    return signalsIntegerToName.get(signalInteger);
  }
  throw new TypeError(`Invalid ${optionName} ${signalInteger}: this signal integer does not exist.
${getAvailableSignals()}`);
};
var getSignalsIntegerToName = () => new Map(Object.entries(import_node_os5.constants.signals).reverse().map(([signalName, signalInteger]) => [signalInteger, signalName]));
var signalsIntegerToName = getSignalsIntegerToName();
var normalizeSignalName = (signalName, optionName) => {
  if (signalName in import_node_os5.constants.signals) {
    return signalName;
  }
  if (signalName.toUpperCase() in import_node_os5.constants.signals) {
    throw new TypeError(`Invalid ${optionName} '${signalName}': please rename it to '${signalName.toUpperCase()}'.`);
  }
  throw new TypeError(`Invalid ${optionName} '${signalName}': this signal name does not exist.
${getAvailableSignals()}`);
};
var getAvailableSignals = () => `Available signal names: ${getAvailableSignalNames()}.
Available signal numbers: ${getAvailableSignalIntegers()}.`;
var getAvailableSignalNames = () => Object.keys(import_node_os5.constants.signals).sort().map((signalName) => `'${signalName}'`).join(", ");
var getAvailableSignalIntegers = () => [...new Set(Object.values(import_node_os5.constants.signals).sort((signalInteger, signalIntegerTwo) => signalInteger - signalIntegerTwo))].join(", ");
var getSignalDescription = (signal) => signalsByName[signal].description;

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/terminate/kill.js
var normalizeForceKillAfterDelay = (forceKillAfterDelay) => {
  if (forceKillAfterDelay === false) {
    return forceKillAfterDelay;
  }
  if (forceKillAfterDelay === true) {
    return DEFAULT_FORCE_KILL_TIMEOUT;
  }
  if (!Number.isFinite(forceKillAfterDelay) || forceKillAfterDelay < 0) {
    throw new TypeError(`Expected the \`forceKillAfterDelay\` option to be a non-negative integer, got \`${forceKillAfterDelay}\` (${typeof forceKillAfterDelay})`);
  }
  return forceKillAfterDelay;
};
var DEFAULT_FORCE_KILL_TIMEOUT = 1e3 * 5;
var subprocessKill = ({ kill, options: { forceKillAfterDelay, killSignal }, onInternalError, context, controller }, signalOrError, errorArgument) => {
  const { signal, error } = parseKillArguments(signalOrError, errorArgument, killSignal);
  emitKillError(error, onInternalError);
  const killResult = kill(signal);
  setKillTimeout({
    kill,
    signal,
    forceKillAfterDelay,
    killSignal,
    killResult,
    context,
    controller
  });
  return killResult;
};
var parseKillArguments = (signalOrError, errorArgument, killSignal) => {
  const [signal = killSignal, error] = isErrorInstance(signalOrError) ? [void 0, signalOrError] : [signalOrError, errorArgument];
  if (typeof signal !== "string" && !Number.isInteger(signal)) {
    throw new TypeError(`The first argument must be an error instance or a signal name string/integer: ${String(signal)}`);
  }
  if (error !== void 0 && !isErrorInstance(error)) {
    throw new TypeError(`The second argument is optional. If specified, it must be an error instance: ${error}`);
  }
  return { signal: normalizeSignalArgument(signal), error };
};
var emitKillError = (error, onInternalError) => {
  if (error !== void 0) {
    onInternalError.reject(error);
  }
};
var setKillTimeout = async ({ kill, signal, forceKillAfterDelay, killSignal, killResult, context, controller }) => {
  if (signal === killSignal && killResult) {
    killOnTimeout({
      kill,
      forceKillAfterDelay,
      context,
      controllerSignal: controller.signal
    });
  }
};
var killOnTimeout = async ({ kill, forceKillAfterDelay, context, controllerSignal }) => {
  if (forceKillAfterDelay === false) {
    return;
  }
  try {
    await (0, import_promises.setTimeout)(forceKillAfterDelay, void 0, { signal: controllerSignal });
    if (kill("SIGKILL")) {
      context.isForcefullyTerminated ??= true;
    }
  } catch {
  }
};

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/utils/abort-signal.js
var import_node_events = require("node:events");
var onAbortedSignal = async (mainSignal, stopSignal) => {
  if (!mainSignal.aborted) {
    await (0, import_node_events.once)(mainSignal, "abort", { signal: stopSignal });
  }
};

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/terminate/cancel.js
var validateCancelSignal = ({ cancelSignal }) => {
  if (cancelSignal !== void 0 && Object.prototype.toString.call(cancelSignal) !== "[object AbortSignal]") {
    throw new Error(`The \`cancelSignal\` option must be an AbortSignal: ${String(cancelSignal)}`);
  }
};
var throwOnCancel = ({ subprocess, cancelSignal, gracefulCancel, context, controller }) => cancelSignal === void 0 || gracefulCancel ? [] : [terminateOnCancel(subprocess, cancelSignal, context, controller)];
var terminateOnCancel = async (subprocess, cancelSignal, context, { signal }) => {
  await onAbortedSignal(cancelSignal, signal);
  context.terminationReason ??= "cancel";
  subprocess.kill();
  throw cancelSignal.reason;
};

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/ipc/graceful.js
var import_promises3 = require("node:timers/promises");

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/ipc/send.js
var import_node_util5 = require("node:util");

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/ipc/validation.js
var validateIpcMethod = ({ methodName, isSubprocess, ipc, isConnected: isConnected2 }) => {
  validateIpcOption(methodName, isSubprocess, ipc);
  validateConnection(methodName, isSubprocess, isConnected2);
};
var validateIpcOption = (methodName, isSubprocess, ipc) => {
  if (!ipc) {
    throw new Error(`${getMethodName(methodName, isSubprocess)} can only be used if the \`ipc\` option is \`true\`.`);
  }
};
var validateConnection = (methodName, isSubprocess, isConnected2) => {
  if (!isConnected2) {
    throw new Error(`${getMethodName(methodName, isSubprocess)} cannot be used: the ${getOtherProcessName(isSubprocess)} has already exited or disconnected.`);
  }
};
var throwOnEarlyDisconnect = (isSubprocess) => {
  throw new Error(`${getMethodName("getOneMessage", isSubprocess)} could not complete: the ${getOtherProcessName(isSubprocess)} exited or disconnected.`);
};
var throwOnStrictDeadlockError = (isSubprocess) => {
  throw new Error(`${getMethodName("sendMessage", isSubprocess)} failed: the ${getOtherProcessName(isSubprocess)} is sending a message too, instead of listening to incoming messages.
This can be fixed by both sending a message and listening to incoming messages at the same time:

const [receivedMessage] = await Promise.all([
	${getMethodName("getOneMessage", isSubprocess)},
	${getMethodName("sendMessage", isSubprocess, "message, {strict: true}")},
]);`);
};
var getStrictResponseError = (error, isSubprocess) => new Error(`${getMethodName("sendMessage", isSubprocess)} failed when sending an acknowledgment response to the ${getOtherProcessName(isSubprocess)}.`, { cause: error });
var throwOnMissingStrict = (isSubprocess) => {
  throw new Error(`${getMethodName("sendMessage", isSubprocess)} failed: the ${getOtherProcessName(isSubprocess)} is not listening to incoming messages.`);
};
var throwOnStrictDisconnect = (isSubprocess) => {
  throw new Error(`${getMethodName("sendMessage", isSubprocess)} failed: the ${getOtherProcessName(isSubprocess)} exited without listening to incoming messages.`);
};
var getAbortDisconnectError = () => new Error(`\`cancelSignal\` aborted: the ${getOtherProcessName(true)} disconnected.`);
var throwOnMissingParent = () => {
  throw new Error("`getCancelSignal()` cannot be used without setting the `cancelSignal` subprocess option.");
};
var handleEpipeError = ({ error, methodName, isSubprocess }) => {
  if (error.code === "EPIPE") {
    throw new Error(`${getMethodName(methodName, isSubprocess)} cannot be used: the ${getOtherProcessName(isSubprocess)} is disconnecting.`, { cause: error });
  }
};
var handleSerializationError = ({ error, methodName, isSubprocess, message }) => {
  if (isSerializationError(error)) {
    throw new Error(`${getMethodName(methodName, isSubprocess)}'s argument type is invalid: the message cannot be serialized: ${String(message)}.`, { cause: error });
  }
};
var isSerializationError = ({ code, message }) => SERIALIZATION_ERROR_CODES.has(code) || SERIALIZATION_ERROR_MESSAGES.some((serializationErrorMessage) => message.includes(serializationErrorMessage));
var SERIALIZATION_ERROR_CODES = /* @__PURE__ */ new Set([
  // Message is `undefined`
  "ERR_MISSING_ARGS",
  // Message is a function, a bigint, a symbol
  "ERR_INVALID_ARG_TYPE"
]);
var SERIALIZATION_ERROR_MESSAGES = [
  // Message is a promise or a proxy, with `serialization: 'advanced'`
  "could not be cloned",
  // Message has cycles, with `serialization: 'json'`
  "circular structure",
  // Message has cycles inside toJSON(), with `serialization: 'json'`
  "call stack size exceeded"
];
var getMethodName = (methodName, isSubprocess, parameters = "") => methodName === "cancelSignal" ? "`cancelSignal`'s `controller.abort()`" : `${getNamespaceName(isSubprocess)}${methodName}(${parameters})`;
var getNamespaceName = (isSubprocess) => isSubprocess ? "" : "subprocess.";
var getOtherProcessName = (isSubprocess) => isSubprocess ? "parent process" : "subprocess";
var disconnect = (anyProcess) => {
  if (anyProcess.connected) {
    anyProcess.disconnect();
  }
};

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/utils/deferred.js
var createDeferred = () => {
  const methods = {};
  const promise = new Promise((resolve, reject) => {
    Object.assign(methods, { resolve, reject });
  });
  return Object.assign(promise, methods);
};

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/arguments/fd-options.js
var getToStream = (destination, to = "stdin") => {
  const isWritable = true;
  const { options, fileDescriptors } = SUBPROCESS_OPTIONS.get(destination);
  const fdNumber = getFdNumber(fileDescriptors, to, isWritable);
  const destinationStream = destination.stdio[fdNumber];
  if (destinationStream === null) {
    throw new TypeError(getInvalidStdioOptionMessage(fdNumber, to, options, isWritable));
  }
  return destinationStream;
};
var getFromStream = (source, from = "stdout") => {
  const isWritable = false;
  const { options, fileDescriptors } = SUBPROCESS_OPTIONS.get(source);
  const fdNumber = getFdNumber(fileDescriptors, from, isWritable);
  const sourceStream = fdNumber === "all" ? source.all : source.stdio[fdNumber];
  if (sourceStream === null || sourceStream === void 0) {
    throw new TypeError(getInvalidStdioOptionMessage(fdNumber, from, options, isWritable));
  }
  return sourceStream;
};
var SUBPROCESS_OPTIONS = /* @__PURE__ */ new WeakMap();
var getFdNumber = (fileDescriptors, fdName, isWritable) => {
  const fdNumber = parseFdNumber(fdName, isWritable);
  validateFdNumber(fdNumber, fdName, isWritable, fileDescriptors);
  return fdNumber;
};
var parseFdNumber = (fdName, isWritable) => {
  const fdNumber = parseFd(fdName);
  if (fdNumber !== void 0) {
    return fdNumber;
  }
  const { validOptions, defaultValue } = isWritable ? { validOptions: '"stdin"', defaultValue: "stdin" } : { validOptions: '"stdout", "stderr", "all"', defaultValue: "stdout" };
  throw new TypeError(`"${getOptionName(isWritable)}" must not be "${fdName}".
It must be ${validOptions} or "fd3", "fd4" (and so on).
It is optional and defaults to "${defaultValue}".`);
};
var validateFdNumber = (fdNumber, fdName, isWritable, fileDescriptors) => {
  const fileDescriptor = fileDescriptors[getUsedDescriptor(fdNumber)];
  if (fileDescriptor === void 0) {
    throw new TypeError(`"${getOptionName(isWritable)}" must not be ${fdName}. That file descriptor does not exist.
Please set the "stdio" option to ensure that file descriptor exists.`);
  }
  if (fileDescriptor.direction === "input" && !isWritable) {
    throw new TypeError(`"${getOptionName(isWritable)}" must not be ${fdName}. It must be a readable stream, not writable.`);
  }
  if (fileDescriptor.direction !== "input" && isWritable) {
    throw new TypeError(`"${getOptionName(isWritable)}" must not be ${fdName}. It must be a writable stream, not readable.`);
  }
};
var getInvalidStdioOptionMessage = (fdNumber, fdName, options, isWritable) => {
  if (fdNumber === "all" && !options.all) {
    return `The "all" option must be true to use "from: 'all'".`;
  }
  const { optionName, optionValue } = getInvalidStdioOption(fdNumber, options);
  return `The "${optionName}: ${serializeOptionValue(optionValue)}" option is incompatible with using "${getOptionName(isWritable)}: ${serializeOptionValue(fdName)}".
Please set this option with "pipe" instead.`;
};
var getInvalidStdioOption = (fdNumber, { stdin, stdout, stderr, stdio }) => {
  const usedDescriptor = getUsedDescriptor(fdNumber);
  if (usedDescriptor === 0 && stdin !== void 0) {
    return { optionName: "stdin", optionValue: stdin };
  }
  if (usedDescriptor === 1 && stdout !== void 0) {
    return { optionName: "stdout", optionValue: stdout };
  }
  if (usedDescriptor === 2 && stderr !== void 0) {
    return { optionName: "stderr", optionValue: stderr };
  }
  return { optionName: `stdio[${usedDescriptor}]`, optionValue: stdio[usedDescriptor] };
};
var getUsedDescriptor = (fdNumber) => fdNumber === "all" ? 1 : fdNumber;
var getOptionName = (isWritable) => isWritable ? "to" : "from";
var serializeOptionValue = (value) => {
  if (typeof value === "string") {
    return `'${value}'`;
  }
  return typeof value === "number" ? `${value}` : "Stream";
};

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/ipc/strict.js
var import_node_events5 = require("node:events");

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/utils/max-listeners.js
var import_node_events2 = require("node:events");
var incrementMaxListeners = (eventEmitter, maxListenersIncrement, signal) => {
  const maxListeners = eventEmitter.getMaxListeners();
  if (maxListeners === 0 || maxListeners === Number.POSITIVE_INFINITY) {
    return;
  }
  eventEmitter.setMaxListeners(maxListeners + maxListenersIncrement);
  (0, import_node_events2.addAbortListener)(signal, () => {
    eventEmitter.setMaxListeners(eventEmitter.getMaxListeners() - maxListenersIncrement);
  });
};

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/ipc/forward.js
var import_node_events4 = require("node:events");

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/ipc/incoming.js
var import_node_events3 = require("node:events");
var import_promises2 = require("node:timers/promises");

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/ipc/reference.js
var addReference = (channel, reference) => {
  if (reference) {
    addReferenceCount(channel);
  }
};
var addReferenceCount = (channel) => {
  channel.refCounted();
};
var removeReference = (channel, reference) => {
  if (reference) {
    removeReferenceCount(channel);
  }
};
var removeReferenceCount = (channel) => {
  channel.unrefCounted();
};
var undoAddedReferences = (channel, isSubprocess) => {
  if (isSubprocess) {
    removeReferenceCount(channel);
    removeReferenceCount(channel);
  }
};
var redoAddedReferences = (channel, isSubprocess) => {
  if (isSubprocess) {
    addReferenceCount(channel);
    addReferenceCount(channel);
  }
};

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/ipc/incoming.js
var onMessage = async ({ anyProcess, channel, isSubprocess, ipcEmitter }, wrappedMessage) => {
  if (handleStrictResponse(wrappedMessage) || handleAbort(wrappedMessage)) {
    return;
  }
  if (!INCOMING_MESSAGES.has(anyProcess)) {
    INCOMING_MESSAGES.set(anyProcess, []);
  }
  const incomingMessages = INCOMING_MESSAGES.get(anyProcess);
  incomingMessages.push(wrappedMessage);
  if (incomingMessages.length > 1) {
    return;
  }
  while (incomingMessages.length > 0) {
    await waitForOutgoingMessages(anyProcess, ipcEmitter, wrappedMessage);
    await import_promises2.scheduler.yield();
    const message = await handleStrictRequest({
      wrappedMessage: incomingMessages[0],
      anyProcess,
      channel,
      isSubprocess,
      ipcEmitter
    });
    incomingMessages.shift();
    ipcEmitter.emit("message", message);
    ipcEmitter.emit("message:done");
  }
};
var onDisconnect = async ({ anyProcess, channel, isSubprocess, ipcEmitter, boundOnMessage }) => {
  abortOnDisconnect();
  const incomingMessages = INCOMING_MESSAGES.get(anyProcess);
  while (incomingMessages?.length > 0) {
    await (0, import_node_events3.once)(ipcEmitter, "message:done");
  }
  anyProcess.removeListener("message", boundOnMessage);
  redoAddedReferences(channel, isSubprocess);
  ipcEmitter.connected = false;
  ipcEmitter.emit("disconnect");
};
var INCOMING_MESSAGES = /* @__PURE__ */ new WeakMap();

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/ipc/forward.js
var getIpcEmitter = (anyProcess, channel, isSubprocess) => {
  if (IPC_EMITTERS.has(anyProcess)) {
    return IPC_EMITTERS.get(anyProcess);
  }
  const ipcEmitter = new import_node_events4.EventEmitter();
  ipcEmitter.connected = true;
  IPC_EMITTERS.set(anyProcess, ipcEmitter);
  forwardEvents({
    ipcEmitter,
    anyProcess,
    channel,
    isSubprocess
  });
  return ipcEmitter;
};
var IPC_EMITTERS = /* @__PURE__ */ new WeakMap();
var forwardEvents = ({ ipcEmitter, anyProcess, channel, isSubprocess }) => {
  const boundOnMessage = onMessage.bind(void 0, {
    anyProcess,
    channel,
    isSubprocess,
    ipcEmitter
  });
  anyProcess.on("message", boundOnMessage);
  anyProcess.once("disconnect", onDisconnect.bind(void 0, {
    anyProcess,
    channel,
    isSubprocess,
    ipcEmitter,
    boundOnMessage
  }));
  undoAddedReferences(channel, isSubprocess);
};
var isConnected = (anyProcess) => {
  const ipcEmitter = IPC_EMITTERS.get(anyProcess);
  return ipcEmitter === void 0 ? anyProcess.channel !== null : ipcEmitter.connected;
};

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/ipc/strict.js
var handleSendStrict = ({ anyProcess, channel, isSubprocess, message, strict }) => {
  if (!strict) {
    return message;
  }
  const ipcEmitter = getIpcEmitter(anyProcess, channel, isSubprocess);
  const hasListeners = hasMessageListeners(anyProcess, ipcEmitter);
  return {
    id: count++,
    type: REQUEST_TYPE,
    message,
    hasListeners
  };
};
var count = 0n;
var validateStrictDeadlock = (outgoingMessages, wrappedMessage) => {
  if (wrappedMessage?.type !== REQUEST_TYPE || wrappedMessage.hasListeners) {
    return;
  }
  for (const { id } of outgoingMessages) {
    if (id !== void 0) {
      STRICT_RESPONSES[id].resolve({ isDeadlock: true, hasListeners: false });
    }
  }
};
var handleStrictRequest = async ({ wrappedMessage, anyProcess, channel, isSubprocess, ipcEmitter }) => {
  if (wrappedMessage?.type !== REQUEST_TYPE || !anyProcess.connected) {
    return wrappedMessage;
  }
  const { id, message } = wrappedMessage;
  const response = { id, type: RESPONSE_TYPE, message: hasMessageListeners(anyProcess, ipcEmitter) };
  try {
    await sendMessage({
      anyProcess,
      channel,
      isSubprocess,
      ipc: true
    }, response);
  } catch (error) {
    ipcEmitter.emit("strict:error", error);
  }
  return message;
};
var handleStrictResponse = (wrappedMessage) => {
  if (wrappedMessage?.type !== RESPONSE_TYPE) {
    return false;
  }
  const { id, message: hasListeners } = wrappedMessage;
  STRICT_RESPONSES[id]?.resolve({ isDeadlock: false, hasListeners });
  return true;
};
var waitForStrictResponse = async (wrappedMessage, anyProcess, isSubprocess) => {
  if (wrappedMessage?.type !== REQUEST_TYPE) {
    return;
  }
  const deferred = createDeferred();
  STRICT_RESPONSES[wrappedMessage.id] = deferred;
  const controller = new AbortController();
  try {
    const { isDeadlock, hasListeners } = await Promise.race([
      deferred,
      throwOnDisconnect(anyProcess, isSubprocess, controller)
    ]);
    if (isDeadlock) {
      throwOnStrictDeadlockError(isSubprocess);
    }
    if (!hasListeners) {
      throwOnMissingStrict(isSubprocess);
    }
  } finally {
    controller.abort();
    delete STRICT_RESPONSES[wrappedMessage.id];
  }
};
var STRICT_RESPONSES = {};
var throwOnDisconnect = async (anyProcess, isSubprocess, { signal }) => {
  incrementMaxListeners(anyProcess, 1, signal);
  await (0, import_node_events5.once)(anyProcess, "disconnect", { signal });
  throwOnStrictDisconnect(isSubprocess);
};
var REQUEST_TYPE = "execa:ipc:request";
var RESPONSE_TYPE = "execa:ipc:response";

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/ipc/outgoing.js
var startSendMessage = (anyProcess, wrappedMessage, strict) => {
  if (!OUTGOING_MESSAGES.has(anyProcess)) {
    OUTGOING_MESSAGES.set(anyProcess, /* @__PURE__ */ new Set());
  }
  const outgoingMessages = OUTGOING_MESSAGES.get(anyProcess);
  const onMessageSent = createDeferred();
  const id = strict ? wrappedMessage.id : void 0;
  const outgoingMessage = { onMessageSent, id };
  outgoingMessages.add(outgoingMessage);
  return { outgoingMessages, outgoingMessage };
};
var endSendMessage = ({ outgoingMessages, outgoingMessage }) => {
  outgoingMessages.delete(outgoingMessage);
  outgoingMessage.onMessageSent.resolve();
};
var waitForOutgoingMessages = async (anyProcess, ipcEmitter, wrappedMessage) => {
  while (!hasMessageListeners(anyProcess, ipcEmitter) && OUTGOING_MESSAGES.get(anyProcess)?.size > 0) {
    const outgoingMessages = [...OUTGOING_MESSAGES.get(anyProcess)];
    validateStrictDeadlock(outgoingMessages, wrappedMessage);
    await Promise.all(outgoingMessages.map(({ onMessageSent }) => onMessageSent));
  }
};
var OUTGOING_MESSAGES = /* @__PURE__ */ new WeakMap();
var hasMessageListeners = (anyProcess, ipcEmitter) => ipcEmitter.listenerCount("message") > getMinListenerCount(anyProcess);
var getMinListenerCount = (anyProcess) => SUBPROCESS_OPTIONS.has(anyProcess) && !getFdSpecificValue(SUBPROCESS_OPTIONS.get(anyProcess).options.buffer, "ipc") ? 1 : 0;

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/ipc/send.js
var sendMessage = ({ anyProcess, channel, isSubprocess, ipc }, message, { strict = false } = {}) => {
  const methodName = "sendMessage";
  validateIpcMethod({
    methodName,
    isSubprocess,
    ipc,
    isConnected: anyProcess.connected
  });
  return sendMessageAsync({
    anyProcess,
    channel,
    methodName,
    isSubprocess,
    message,
    strict
  });
};
var sendMessageAsync = async ({ anyProcess, channel, methodName, isSubprocess, message, strict }) => {
  const wrappedMessage = handleSendStrict({
    anyProcess,
    channel,
    isSubprocess,
    message,
    strict
  });
  const outgoingMessagesState = startSendMessage(anyProcess, wrappedMessage, strict);
  try {
    await sendOneMessage({
      anyProcess,
      methodName,
      isSubprocess,
      wrappedMessage,
      message
    });
  } catch (error) {
    disconnect(anyProcess);
    throw error;
  } finally {
    endSendMessage(outgoingMessagesState);
  }
};
var sendOneMessage = async ({ anyProcess, methodName, isSubprocess, wrappedMessage, message }) => {
  const sendMethod = getSendMethod(anyProcess);
  try {
    await Promise.all([
      waitForStrictResponse(wrappedMessage, anyProcess, isSubprocess),
      sendMethod(wrappedMessage)
    ]);
  } catch (error) {
    handleEpipeError({ error, methodName, isSubprocess });
    handleSerializationError({
      error,
      methodName,
      isSubprocess,
      message
    });
    throw error;
  }
};
var getSendMethod = (anyProcess) => {
  if (PROCESS_SEND_METHODS.has(anyProcess)) {
    return PROCESS_SEND_METHODS.get(anyProcess);
  }
  const sendMethod = (0, import_node_util5.promisify)(anyProcess.send.bind(anyProcess));
  PROCESS_SEND_METHODS.set(anyProcess, sendMethod);
  return sendMethod;
};
var PROCESS_SEND_METHODS = /* @__PURE__ */ new WeakMap();

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/ipc/graceful.js
var sendAbort = (subprocess, message) => {
  const methodName = "cancelSignal";
  validateConnection(methodName, false, subprocess.connected);
  return sendOneMessage({
    anyProcess: subprocess,
    methodName,
    isSubprocess: false,
    wrappedMessage: { type: GRACEFUL_CANCEL_TYPE, message },
    message
  });
};
var getCancelSignal = async ({ anyProcess, channel, isSubprocess, ipc }) => {
  await startIpc({
    anyProcess,
    channel,
    isSubprocess,
    ipc
  });
  return cancelController.signal;
};
var startIpc = async ({ anyProcess, channel, isSubprocess, ipc }) => {
  if (cancelListening) {
    return;
  }
  cancelListening = true;
  if (!ipc) {
    throwOnMissingParent();
    return;
  }
  if (channel === null) {
    abortOnDisconnect();
    return;
  }
  getIpcEmitter(anyProcess, channel, isSubprocess);
  await import_promises3.scheduler.yield();
};
var cancelListening = false;
var handleAbort = (wrappedMessage) => {
  if (wrappedMessage?.type !== GRACEFUL_CANCEL_TYPE) {
    return false;
  }
  cancelController.abort(wrappedMessage.message);
  return true;
};
var GRACEFUL_CANCEL_TYPE = "execa:ipc:cancel";
var abortOnDisconnect = () => {
  cancelController.abort(getAbortDisconnectError());
};
var cancelController = new AbortController();

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/terminate/graceful.js
var validateGracefulCancel = ({ gracefulCancel, cancelSignal, ipc, serialization }) => {
  if (!gracefulCancel) {
    return;
  }
  if (cancelSignal === void 0) {
    throw new Error("The `cancelSignal` option must be defined when setting the `gracefulCancel` option.");
  }
  if (!ipc) {
    throw new Error("The `ipc` option cannot be false when setting the `gracefulCancel` option.");
  }
  if (serialization === "json") {
    throw new Error("The `serialization` option cannot be 'json' when setting the `gracefulCancel` option.");
  }
};
var throwOnGracefulCancel = ({
  subprocess,
  cancelSignal,
  gracefulCancel,
  forceKillAfterDelay,
  context,
  controller
}) => gracefulCancel ? [sendOnAbort({
  subprocess,
  cancelSignal,
  forceKillAfterDelay,
  context,
  controller
})] : [];
var sendOnAbort = async ({ subprocess, cancelSignal, forceKillAfterDelay, context, controller: { signal } }) => {
  await onAbortedSignal(cancelSignal, signal);
  const reason = getReason(cancelSignal);
  await sendAbort(subprocess, reason);
  killOnTimeout({
    kill: subprocess.kill,
    forceKillAfterDelay,
    context,
    controllerSignal: signal
  });
  context.terminationReason ??= "gracefulCancel";
  throw cancelSignal.reason;
};
var getReason = ({ reason }) => {
  if (!(reason instanceof DOMException)) {
    return reason;
  }
  const error = new Error(reason.message);
  Object.defineProperty(error, "stack", {
    value: reason.stack,
    enumerable: false,
    configurable: true,
    writable: true
  });
  return error;
};

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/terminate/timeout.js
var import_promises4 = require("node:timers/promises");
var validateTimeout = ({ timeout }) => {
  if (timeout !== void 0 && (!Number.isFinite(timeout) || timeout < 0)) {
    throw new TypeError(`Expected the \`timeout\` option to be a non-negative integer, got \`${timeout}\` (${typeof timeout})`);
  }
};
var throwOnTimeout = (subprocess, timeout, context, controller) => timeout === 0 || timeout === void 0 ? [] : [killAfterTimeout(subprocess, timeout, context, controller)];
var killAfterTimeout = async (subprocess, timeout, context, { signal }) => {
  await (0, import_promises4.setTimeout)(timeout, void 0, { signal });
  context.terminationReason ??= "timeout";
  subprocess.kill();
  throw new DiscardedError();
};

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/methods/node.js
var import_node_process6 = require("node:process");
var import_node_path11 = __toESM(require("node:path"), 1);
var mapNode = ({ options }) => {
  if (options.node === false) {
    throw new TypeError('The "node" option cannot be false with `execaNode()`.');
  }
  return { options: { ...options, node: true } };
};
var handleNodeOption = (file, commandArguments, {
  node: shouldHandleNode = false,
  nodePath = import_node_process6.execPath,
  nodeOptions = import_node_process6.execArgv.filter((nodeOption) => !nodeOption.startsWith("--inspect")),
  cwd,
  execPath: formerNodePath,
  ...options
}) => {
  if (formerNodePath !== void 0) {
    throw new TypeError('The "execPath" option has been removed. Please use the "nodePath" option instead.');
  }
  const normalizedNodePath = safeNormalizeFileUrl(nodePath, 'The "nodePath" option');
  const resolvedNodePath = import_node_path11.default.resolve(cwd, normalizedNodePath);
  const newOptions = {
    ...options,
    nodePath: resolvedNodePath,
    node: shouldHandleNode,
    cwd
  };
  if (!shouldHandleNode) {
    return [file, commandArguments, newOptions];
  }
  if (import_node_path11.default.basename(file, ".exe") === "node") {
    throw new TypeError('When the "node" option is true, the first argument does not need to be "node".');
  }
  return [
    resolvedNodePath,
    [...nodeOptions, file, ...commandArguments],
    { ipc: true, ...newOptions, shell: false }
  ];
};

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/ipc/ipc-input.js
var import_node_v8 = require("node:v8");
var validateIpcInputOption = ({ ipcInput, ipc, serialization }) => {
  if (ipcInput === void 0) {
    return;
  }
  if (!ipc) {
    throw new Error("The `ipcInput` option cannot be set unless the `ipc` option is `true`.");
  }
  validateIpcInput[serialization](ipcInput);
};
var validateAdvancedInput = (ipcInput) => {
  try {
    (0, import_node_v8.serialize)(ipcInput);
  } catch (error) {
    throw new Error("The `ipcInput` option is not serializable with a structured clone.", { cause: error });
  }
};
var validateJsonInput = (ipcInput) => {
  try {
    JSON.stringify(ipcInput);
  } catch (error) {
    throw new Error("The `ipcInput` option is not serializable with JSON.", { cause: error });
  }
};
var validateIpcInput = {
  advanced: validateAdvancedInput,
  json: validateJsonInput
};
var sendIpcInput = async (subprocess, ipcInput) => {
  if (ipcInput === void 0) {
    return;
  }
  await subprocess.sendMessage(ipcInput);
};

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/arguments/encoding-option.js
var validateEncoding = ({ encoding }) => {
  if (ENCODINGS.has(encoding)) {
    return;
  }
  const correctEncoding = getCorrectEncoding(encoding);
  if (correctEncoding !== void 0) {
    throw new TypeError(`Invalid option \`encoding: ${serializeEncoding(encoding)}\`.
Please rename it to ${serializeEncoding(correctEncoding)}.`);
  }
  const correctEncodings = [...ENCODINGS].map((correctEncoding2) => serializeEncoding(correctEncoding2)).join(", ");
  throw new TypeError(`Invalid option \`encoding: ${serializeEncoding(encoding)}\`.
Please rename it to one of: ${correctEncodings}.`);
};
var TEXT_ENCODINGS = /* @__PURE__ */ new Set(["utf8", "utf16le"]);
var BINARY_ENCODINGS = /* @__PURE__ */ new Set(["buffer", "hex", "base64", "base64url", "latin1", "ascii"]);
var ENCODINGS = /* @__PURE__ */ new Set([...TEXT_ENCODINGS, ...BINARY_ENCODINGS]);
var getCorrectEncoding = (encoding) => {
  if (encoding === null) {
    return "buffer";
  }
  if (typeof encoding !== "string") {
    return;
  }
  const lowerEncoding = encoding.toLowerCase();
  if (lowerEncoding in ENCODING_ALIASES) {
    return ENCODING_ALIASES[lowerEncoding];
  }
  if (ENCODINGS.has(lowerEncoding)) {
    return lowerEncoding;
  }
};
var ENCODING_ALIASES = {
  // eslint-disable-next-line unicorn/text-encoding-identifier-case
  "utf-8": "utf8",
  "utf-16le": "utf16le",
  "ucs-2": "utf16le",
  ucs2: "utf16le",
  binary: "latin1"
};
var serializeEncoding = (encoding) => typeof encoding === "string" ? `"${encoding}"` : String(encoding);

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/arguments/cwd.js
var import_node_fs9 = require("node:fs");
var import_node_path12 = __toESM(require("node:path"), 1);
var import_node_process7 = __toESM(require("node:process"), 1);
var normalizeCwd = (cwd = getDefaultCwd()) => {
  const cwdString = safeNormalizeFileUrl(cwd, 'The "cwd" option');
  return import_node_path12.default.resolve(cwdString);
};
var getDefaultCwd = () => {
  try {
    return import_node_process7.default.cwd();
  } catch (error) {
    error.message = `The current directory does not exist.
${error.message}`;
    throw error;
  }
};
var fixCwdError = (originalMessage, cwd) => {
  if (cwd === getDefaultCwd()) {
    return originalMessage;
  }
  let cwdStat;
  try {
    cwdStat = (0, import_node_fs9.statSync)(cwd);
  } catch (error) {
    return `The "cwd" option is invalid: ${cwd}.
${error.message}
${originalMessage}`;
  }
  if (!cwdStat.isDirectory()) {
    return `The "cwd" option is not a directory: ${cwd}.
${originalMessage}`;
  }
  return originalMessage;
};

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/arguments/options.js
var normalizeOptions = (filePath, rawArguments, rawOptions) => {
  rawOptions.cwd = normalizeCwd(rawOptions.cwd);
  const [processedFile, processedArguments, processedOptions] = handleNodeOption(filePath, rawArguments, rawOptions);
  const { command: file, args: commandArguments, options: initialOptions } = import_cross_spawn.default._parse(processedFile, processedArguments, processedOptions);
  const fdOptions = normalizeFdSpecificOptions(initialOptions);
  const options = addDefaultOptions(fdOptions);
  validateTimeout(options);
  validateEncoding(options);
  validateIpcInputOption(options);
  validateCancelSignal(options);
  validateGracefulCancel(options);
  options.shell = normalizeFileUrl(options.shell);
  options.env = getEnv(options);
  options.killSignal = normalizeKillSignal(options.killSignal);
  options.forceKillAfterDelay = normalizeForceKillAfterDelay(options.forceKillAfterDelay);
  options.lines = options.lines.map((lines, fdNumber) => lines && !BINARY_ENCODINGS.has(options.encoding) && options.buffer[fdNumber]);
  if (import_node_process8.default.platform === "win32" && import_node_path13.default.basename(file, ".exe") === "cmd") {
    commandArguments.unshift("/q");
  }
  return { file, commandArguments, options };
};
var addDefaultOptions = ({
  extendEnv = true,
  preferLocal = false,
  cwd,
  localDir: localDirectory = cwd,
  encoding = "utf8",
  reject = true,
  cleanup = true,
  all = false,
  windowsHide = true,
  killSignal = "SIGTERM",
  forceKillAfterDelay = true,
  gracefulCancel = false,
  ipcInput,
  ipc = ipcInput !== void 0 || gracefulCancel,
  serialization = "advanced",
  ...options
}) => ({
  ...options,
  extendEnv,
  preferLocal,
  cwd,
  localDirectory,
  encoding,
  reject,
  cleanup,
  all,
  windowsHide,
  killSignal,
  forceKillAfterDelay,
  gracefulCancel,
  ipcInput,
  ipc,
  serialization
});
var getEnv = ({ env: envOption, extendEnv, preferLocal, node, localDirectory, nodePath }) => {
  const env = extendEnv ? { ...import_node_process8.default.env, ...envOption } : envOption;
  if (preferLocal || node) {
    return npmRunPathEnv({
      env,
      cwd: localDirectory,
      execPath: nodePath,
      preferLocal,
      addExecPath: node
    });
  }
  return env;
};

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/arguments/shell.js
var concatenateShell = (file, commandArguments, options) => options.shell && commandArguments.length > 0 ? [[file, ...commandArguments].join(" "), [], options] : [file, commandArguments, options];

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/return/message.js
var import_node_util6 = require("node:util");

// ../../node_modules/.pnpm/strip-final-newline@4.0.0/node_modules/strip-final-newline/index.js
function stripFinalNewline(input) {
  if (typeof input === "string") {
    return stripFinalNewlineString(input);
  }
  if (!(ArrayBuffer.isView(input) && input.BYTES_PER_ELEMENT === 1)) {
    throw new Error("Input must be a string or a Uint8Array");
  }
  return stripFinalNewlineBinary(input);
}
var stripFinalNewlineString = (input) => input.at(-1) === LF ? input.slice(0, input.at(-2) === CR ? -2 : -1) : input;
var stripFinalNewlineBinary = (input) => input.at(-1) === LF_BINARY ? input.subarray(0, input.at(-2) === CR_BINARY ? -2 : -1) : input;
var LF = "\n";
var LF_BINARY = LF.codePointAt(0);
var CR = "\r";
var CR_BINARY = CR.codePointAt(0);

// ../../node_modules/.pnpm/get-stream@9.0.1/node_modules/get-stream/source/index.js
var import_node_events6 = require("node:events");
var import_promises5 = require("node:stream/promises");

// ../../node_modules/.pnpm/is-stream@4.0.1/node_modules/is-stream/index.js
function isStream(stream2, { checkOpen = true } = {}) {
  return stream2 !== null && typeof stream2 === "object" && (stream2.writable || stream2.readable || !checkOpen || stream2.writable === void 0 && stream2.readable === void 0) && typeof stream2.pipe === "function";
}
function isWritableStream(stream2, { checkOpen = true } = {}) {
  return isStream(stream2, { checkOpen }) && (stream2.writable || !checkOpen) && typeof stream2.write === "function" && typeof stream2.end === "function" && typeof stream2.writable === "boolean" && typeof stream2.writableObjectMode === "boolean" && typeof stream2.destroy === "function" && typeof stream2.destroyed === "boolean";
}
function isReadableStream(stream2, { checkOpen = true } = {}) {
  return isStream(stream2, { checkOpen }) && (stream2.readable || !checkOpen) && typeof stream2.read === "function" && typeof stream2.readable === "boolean" && typeof stream2.readableObjectMode === "boolean" && typeof stream2.destroy === "function" && typeof stream2.destroyed === "boolean";
}
function isDuplexStream(stream2, options) {
  return isWritableStream(stream2, options) && isReadableStream(stream2, options);
}

// ../../node_modules/.pnpm/@sec-ant+readable-stream@0.4.1/node_modules/@sec-ant/readable-stream/dist/ponyfill/asyncIterator.js
var a = Object.getPrototypeOf(
  Object.getPrototypeOf(
    /* istanbul ignore next */
    async function* () {
    }
  ).prototype
);
var c = class {
  #t;
  #n;
  #r = false;
  #e = void 0;
  constructor(e, t) {
    this.#t = e, this.#n = t;
  }
  next() {
    const e = () => this.#s();
    return this.#e = this.#e ? this.#e.then(e, e) : e(), this.#e;
  }
  return(e) {
    const t = () => this.#i(e);
    return this.#e ? this.#e.then(t, t) : t();
  }
  async #s() {
    if (this.#r)
      return {
        done: true,
        value: void 0
      };
    let e;
    try {
      e = await this.#t.read();
    } catch (t) {
      throw this.#e = void 0, this.#r = true, this.#t.releaseLock(), t;
    }
    return e.done && (this.#e = void 0, this.#r = true, this.#t.releaseLock()), e;
  }
  async #i(e) {
    if (this.#r)
      return {
        done: true,
        value: e
      };
    if (this.#r = true, !this.#n) {
      const t = this.#t.cancel(e);
      return this.#t.releaseLock(), await t, {
        done: true,
        value: e
      };
    }
    return this.#t.releaseLock(), {
      done: true,
      value: e
    };
  }
};
var n = Symbol();
function i() {
  return this[n].next();
}
Object.defineProperty(i, "name", { value: "next" });
function o(r) {
  return this[n].return(r);
}
Object.defineProperty(o, "name", { value: "return" });
var u = Object.create(a, {
  next: {
    enumerable: true,
    configurable: true,
    writable: true,
    value: i
  },
  return: {
    enumerable: true,
    configurable: true,
    writable: true,
    value: o
  }
});
function h({ preventCancel: r = false } = {}) {
  const e = this.getReader(), t = new c(
    e,
    r
  ), s = Object.create(u);
  return s[n] = t, s;
}

// ../../node_modules/.pnpm/get-stream@9.0.1/node_modules/get-stream/source/stream.js
var getAsyncIterable = (stream2) => {
  if (isReadableStream(stream2, { checkOpen: false }) && nodeImports.on !== void 0) {
    return getStreamIterable(stream2);
  }
  if (typeof stream2?.[Symbol.asyncIterator] === "function") {
    return stream2;
  }
  if (toString.call(stream2) === "[object ReadableStream]") {
    return h.call(stream2);
  }
  throw new TypeError("The first argument must be a Readable, a ReadableStream, or an async iterable.");
};
var { toString } = Object.prototype;
var getStreamIterable = async function* (stream2) {
  const controller = new AbortController();
  const state = {};
  handleStreamEnd(stream2, controller, state);
  try {
    for await (const [chunk] of nodeImports.on(stream2, "data", { signal: controller.signal })) {
      yield chunk;
    }
  } catch (error) {
    if (state.error !== void 0) {
      throw state.error;
    } else if (!controller.signal.aborted) {
      throw error;
    }
  } finally {
    stream2.destroy();
  }
};
var handleStreamEnd = async (stream2, controller, state) => {
  try {
    await nodeImports.finished(stream2, {
      cleanup: true,
      readable: true,
      writable: false,
      error: false
    });
  } catch (error) {
    state.error = error;
  } finally {
    controller.abort();
  }
};
var nodeImports = {};

// ../../node_modules/.pnpm/get-stream@9.0.1/node_modules/get-stream/source/contents.js
var getStreamContents = async (stream2, { init, convertChunk, getSize, truncateChunk, addChunk, getFinalChunk, finalize }, { maxBuffer = Number.POSITIVE_INFINITY } = {}) => {
  const asyncIterable = getAsyncIterable(stream2);
  const state = init();
  state.length = 0;
  try {
    for await (const chunk of asyncIterable) {
      const chunkType = getChunkType(chunk);
      const convertedChunk = convertChunk[chunkType](chunk, state);
      appendChunk({
        convertedChunk,
        state,
        getSize,
        truncateChunk,
        addChunk,
        maxBuffer
      });
    }
    appendFinalChunk({
      state,
      convertChunk,
      getSize,
      truncateChunk,
      addChunk,
      getFinalChunk,
      maxBuffer
    });
    return finalize(state);
  } catch (error) {
    const normalizedError = typeof error === "object" && error !== null ? error : new Error(error);
    normalizedError.bufferedData = finalize(state);
    throw normalizedError;
  }
};
var appendFinalChunk = ({ state, getSize, truncateChunk, addChunk, getFinalChunk, maxBuffer }) => {
  const convertedChunk = getFinalChunk(state);
  if (convertedChunk !== void 0) {
    appendChunk({
      convertedChunk,
      state,
      getSize,
      truncateChunk,
      addChunk,
      maxBuffer
    });
  }
};
var appendChunk = ({ convertedChunk, state, getSize, truncateChunk, addChunk, maxBuffer }) => {
  const chunkSize = getSize(convertedChunk);
  const newLength = state.length + chunkSize;
  if (newLength <= maxBuffer) {
    addNewChunk(convertedChunk, state, addChunk, newLength);
    return;
  }
  const truncatedChunk = truncateChunk(convertedChunk, maxBuffer - state.length);
  if (truncatedChunk !== void 0) {
    addNewChunk(truncatedChunk, state, addChunk, maxBuffer);
  }
  throw new MaxBufferError();
};
var addNewChunk = (convertedChunk, state, addChunk, newLength) => {
  state.contents = addChunk(convertedChunk, state, newLength);
  state.length = newLength;
};
var getChunkType = (chunk) => {
  const typeOfChunk = typeof chunk;
  if (typeOfChunk === "string") {
    return "string";
  }
  if (typeOfChunk !== "object" || chunk === null) {
    return "others";
  }
  if (globalThis.Buffer?.isBuffer(chunk)) {
    return "buffer";
  }
  const prototypeName = objectToString2.call(chunk);
  if (prototypeName === "[object ArrayBuffer]") {
    return "arrayBuffer";
  }
  if (prototypeName === "[object DataView]") {
    return "dataView";
  }
  if (Number.isInteger(chunk.byteLength) && Number.isInteger(chunk.byteOffset) && objectToString2.call(chunk.buffer) === "[object ArrayBuffer]") {
    return "typedArray";
  }
  return "others";
};
var { toString: objectToString2 } = Object.prototype;
var MaxBufferError = class extends Error {
  name = "MaxBufferError";
  constructor() {
    super("maxBuffer exceeded");
  }
};

// ../../node_modules/.pnpm/get-stream@9.0.1/node_modules/get-stream/source/utils.js
var identity2 = (value) => value;
var noop = () => void 0;
var getContentsProperty = ({ contents }) => contents;
var throwObjectStream = (chunk) => {
  throw new Error(`Streams in object mode are not supported: ${String(chunk)}`);
};
var getLengthProperty = (convertedChunk) => convertedChunk.length;

// ../../node_modules/.pnpm/get-stream@9.0.1/node_modules/get-stream/source/array.js
async function getStreamAsArray(stream2, options) {
  return getStreamContents(stream2, arrayMethods, options);
}
var initArray = () => ({ contents: [] });
var increment = () => 1;
var addArrayChunk = (convertedChunk, { contents }) => {
  contents.push(convertedChunk);
  return contents;
};
var arrayMethods = {
  init: initArray,
  convertChunk: {
    string: identity2,
    buffer: identity2,
    arrayBuffer: identity2,
    dataView: identity2,
    typedArray: identity2,
    others: identity2
  },
  getSize: increment,
  truncateChunk: noop,
  addChunk: addArrayChunk,
  getFinalChunk: noop,
  finalize: getContentsProperty
};

// ../../node_modules/.pnpm/get-stream@9.0.1/node_modules/get-stream/source/array-buffer.js
async function getStreamAsArrayBuffer(stream2, options) {
  return getStreamContents(stream2, arrayBufferMethods, options);
}
var initArrayBuffer = () => ({ contents: new ArrayBuffer(0) });
var useTextEncoder = (chunk) => textEncoder2.encode(chunk);
var textEncoder2 = new TextEncoder();
var useUint8Array = (chunk) => new Uint8Array(chunk);
var useUint8ArrayWithOffset = (chunk) => new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength);
var truncateArrayBufferChunk = (convertedChunk, chunkSize) => convertedChunk.slice(0, chunkSize);
var addArrayBufferChunk = (convertedChunk, { contents, length: previousLength }, length) => {
  const newContents = hasArrayBufferResize() ? resizeArrayBuffer(contents, length) : resizeArrayBufferSlow(contents, length);
  new Uint8Array(newContents).set(convertedChunk, previousLength);
  return newContents;
};
var resizeArrayBufferSlow = (contents, length) => {
  if (length <= contents.byteLength) {
    return contents;
  }
  const arrayBuffer = new ArrayBuffer(getNewContentsLength(length));
  new Uint8Array(arrayBuffer).set(new Uint8Array(contents), 0);
  return arrayBuffer;
};
var resizeArrayBuffer = (contents, length) => {
  if (length <= contents.maxByteLength) {
    contents.resize(length);
    return contents;
  }
  const arrayBuffer = new ArrayBuffer(length, { maxByteLength: getNewContentsLength(length) });
  new Uint8Array(arrayBuffer).set(new Uint8Array(contents), 0);
  return arrayBuffer;
};
var getNewContentsLength = (length) => SCALE_FACTOR ** Math.ceil(Math.log(length) / Math.log(SCALE_FACTOR));
var SCALE_FACTOR = 2;
var finalizeArrayBuffer = ({ contents, length }) => hasArrayBufferResize() ? contents : contents.slice(0, length);
var hasArrayBufferResize = () => "resize" in ArrayBuffer.prototype;
var arrayBufferMethods = {
  init: initArrayBuffer,
  convertChunk: {
    string: useTextEncoder,
    buffer: useUint8Array,
    arrayBuffer: useUint8Array,
    dataView: useUint8ArrayWithOffset,
    typedArray: useUint8ArrayWithOffset,
    others: throwObjectStream
  },
  getSize: getLengthProperty,
  truncateChunk: truncateArrayBufferChunk,
  addChunk: addArrayBufferChunk,
  getFinalChunk: noop,
  finalize: finalizeArrayBuffer
};

// ../../node_modules/.pnpm/get-stream@9.0.1/node_modules/get-stream/source/string.js
async function getStreamAsString(stream2, options) {
  return getStreamContents(stream2, stringMethods, options);
}
var initString = () => ({ contents: "", textDecoder: new TextDecoder() });
var useTextDecoder = (chunk, { textDecoder: textDecoder2 }) => textDecoder2.decode(chunk, { stream: true });
var addStringChunk = (convertedChunk, { contents }) => contents + convertedChunk;
var truncateStringChunk = (convertedChunk, chunkSize) => convertedChunk.slice(0, chunkSize);
var getFinalStringChunk = ({ textDecoder: textDecoder2 }) => {
  const finalChunk = textDecoder2.decode();
  return finalChunk === "" ? void 0 : finalChunk;
};
var stringMethods = {
  init: initString,
  convertChunk: {
    string: identity2,
    buffer: useTextDecoder,
    arrayBuffer: useTextDecoder,
    dataView: useTextDecoder,
    typedArray: useTextDecoder,
    others: throwObjectStream
  },
  getSize: getLengthProperty,
  truncateChunk: truncateStringChunk,
  addChunk: addStringChunk,
  getFinalChunk: getFinalStringChunk,
  finalize: getContentsProperty
};

// ../../node_modules/.pnpm/get-stream@9.0.1/node_modules/get-stream/source/index.js
Object.assign(nodeImports, { on: import_node_events6.on, finished: import_promises5.finished });

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/io/max-buffer.js
var handleMaxBuffer = ({ error, stream: stream2, readableObjectMode, lines, encoding, fdNumber }) => {
  if (!(error instanceof MaxBufferError)) {
    throw error;
  }
  if (fdNumber === "all") {
    return error;
  }
  const unit = getMaxBufferUnit(readableObjectMode, lines, encoding);
  error.maxBufferInfo = { fdNumber, unit };
  stream2.destroy();
  throw error;
};
var getMaxBufferUnit = (readableObjectMode, lines, encoding) => {
  if (readableObjectMode) {
    return "objects";
  }
  if (lines) {
    return "lines";
  }
  if (encoding === "buffer") {
    return "bytes";
  }
  return "characters";
};
var checkIpcMaxBuffer = (subprocess, ipcOutput, maxBuffer) => {
  if (ipcOutput.length !== maxBuffer) {
    return;
  }
  const error = new MaxBufferError();
  error.maxBufferInfo = { fdNumber: "ipc" };
  throw error;
};
var getMaxBufferMessage = (error, maxBuffer) => {
  const { streamName, threshold, unit } = getMaxBufferInfo(error, maxBuffer);
  return `Command's ${streamName} was larger than ${threshold} ${unit}`;
};
var getMaxBufferInfo = (error, maxBuffer) => {
  if (error?.maxBufferInfo === void 0) {
    return { streamName: "output", threshold: maxBuffer[1], unit: "bytes" };
  }
  const { maxBufferInfo: { fdNumber, unit } } = error;
  delete error.maxBufferInfo;
  const threshold = getFdSpecificValue(maxBuffer, fdNumber);
  if (fdNumber === "ipc") {
    return { streamName: "IPC output", threshold, unit: "messages" };
  }
  return { streamName: getStreamName(fdNumber), threshold, unit };
};
var isMaxBufferSync = (resultError, output, maxBuffer) => resultError?.code === "ENOBUFS" && output !== null && output.some((result) => result !== null && result.length > getMaxBufferSync(maxBuffer));
var truncateMaxBufferSync = (result, isMaxBuffer, maxBuffer) => {
  if (!isMaxBuffer) {
    return result;
  }
  const maxBufferValue = getMaxBufferSync(maxBuffer);
  return result.length > maxBufferValue ? result.slice(0, maxBufferValue) : result;
};
var getMaxBufferSync = ([, stdoutMaxBuffer]) => stdoutMaxBuffer;

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/return/message.js
var createMessages = ({
  stdio,
  all,
  ipcOutput,
  originalError,
  signal,
  signalDescription,
  exitCode,
  escapedCommand,
  timedOut,
  isCanceled,
  isGracefullyCanceled,
  isMaxBuffer,
  isForcefullyTerminated,
  forceKillAfterDelay,
  killSignal,
  maxBuffer,
  timeout,
  cwd
}) => {
  const errorCode = originalError?.code;
  const prefix = getErrorPrefix({
    originalError,
    timedOut,
    timeout,
    isMaxBuffer,
    maxBuffer,
    errorCode,
    signal,
    signalDescription,
    exitCode,
    isCanceled,
    isGracefullyCanceled,
    isForcefullyTerminated,
    forceKillAfterDelay,
    killSignal
  });
  const originalMessage = getOriginalMessage(originalError, cwd);
  const suffix = originalMessage === void 0 ? "" : `
${originalMessage}`;
  const shortMessage = `${prefix}: ${escapedCommand}${suffix}`;
  const messageStdio = all === void 0 ? [stdio[2], stdio[1]] : [all];
  const message = [
    shortMessage,
    ...messageStdio,
    ...stdio.slice(3),
    ipcOutput.map((ipcMessage) => serializeIpcMessage(ipcMessage)).join("\n")
  ].map((messagePart) => escapeLines(stripFinalNewline(serializeMessagePart(messagePart)))).filter(Boolean).join("\n\n");
  return { originalMessage, shortMessage, message };
};
var getErrorPrefix = ({
  originalError,
  timedOut,
  timeout,
  isMaxBuffer,
  maxBuffer,
  errorCode,
  signal,
  signalDescription,
  exitCode,
  isCanceled,
  isGracefullyCanceled,
  isForcefullyTerminated,
  forceKillAfterDelay,
  killSignal
}) => {
  const forcefulSuffix = getForcefulSuffix(isForcefullyTerminated, forceKillAfterDelay);
  if (timedOut) {
    return `Command timed out after ${timeout} milliseconds${forcefulSuffix}`;
  }
  if (isGracefullyCanceled) {
    if (signal === void 0) {
      return `Command was gracefully canceled with exit code ${exitCode}`;
    }
    return isForcefullyTerminated ? `Command was gracefully canceled${forcefulSuffix}` : `Command was gracefully canceled with ${signal} (${signalDescription})`;
  }
  if (isCanceled) {
    return `Command was canceled${forcefulSuffix}`;
  }
  if (isMaxBuffer) {
    return `${getMaxBufferMessage(originalError, maxBuffer)}${forcefulSuffix}`;
  }
  if (errorCode !== void 0) {
    return `Command failed with ${errorCode}${forcefulSuffix}`;
  }
  if (isForcefullyTerminated) {
    return `Command was killed with ${killSignal} (${getSignalDescription(killSignal)})${forcefulSuffix}`;
  }
  if (signal !== void 0) {
    return `Command was killed with ${signal} (${signalDescription})`;
  }
  if (exitCode !== void 0) {
    return `Command failed with exit code ${exitCode}`;
  }
  return "Command failed";
};
var getForcefulSuffix = (isForcefullyTerminated, forceKillAfterDelay) => isForcefullyTerminated ? ` and was forcefully terminated after ${forceKillAfterDelay} milliseconds` : "";
var getOriginalMessage = (originalError, cwd) => {
  if (originalError instanceof DiscardedError) {
    return;
  }
  const originalMessage = isExecaError(originalError) ? originalError.originalMessage : String(originalError?.message ?? originalError);
  const escapedOriginalMessage = escapeLines(fixCwdError(originalMessage, cwd));
  return escapedOriginalMessage === "" ? void 0 : escapedOriginalMessage;
};
var serializeIpcMessage = (ipcMessage) => typeof ipcMessage === "string" ? ipcMessage : (0, import_node_util6.inspect)(ipcMessage);
var serializeMessagePart = (messagePart) => Array.isArray(messagePart) ? messagePart.map((messageItem) => stripFinalNewline(serializeMessageItem(messageItem))).filter(Boolean).join("\n") : serializeMessageItem(messagePart);
var serializeMessageItem = (messageItem) => {
  if (typeof messageItem === "string") {
    return messageItem;
  }
  if (isUint8Array(messageItem)) {
    return uint8ArrayToString(messageItem);
  }
  return "";
};

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/return/result.js
var makeSuccessResult = ({
  command,
  escapedCommand,
  stdio,
  all,
  ipcOutput,
  options: { cwd },
  startTime
}) => omitUndefinedProperties({
  command,
  escapedCommand,
  cwd,
  durationMs: getDurationMs(startTime),
  failed: false,
  timedOut: false,
  isCanceled: false,
  isGracefullyCanceled: false,
  isTerminated: false,
  isMaxBuffer: false,
  isForcefullyTerminated: false,
  exitCode: 0,
  stdout: stdio[1],
  stderr: stdio[2],
  all,
  stdio,
  ipcOutput,
  pipedFrom: []
});
var makeEarlyError = ({
  error,
  command,
  escapedCommand,
  fileDescriptors,
  options,
  startTime,
  isSync
}) => makeError({
  error,
  command,
  escapedCommand,
  startTime,
  timedOut: false,
  isCanceled: false,
  isGracefullyCanceled: false,
  isMaxBuffer: false,
  isForcefullyTerminated: false,
  stdio: Array.from({ length: fileDescriptors.length }),
  ipcOutput: [],
  options,
  isSync
});
var makeError = ({
  error: originalError,
  command,
  escapedCommand,
  startTime,
  timedOut,
  isCanceled,
  isGracefullyCanceled,
  isMaxBuffer,
  isForcefullyTerminated,
  exitCode: rawExitCode,
  signal: rawSignal,
  stdio,
  all,
  ipcOutput,
  options: {
    timeoutDuration,
    timeout = timeoutDuration,
    forceKillAfterDelay,
    killSignal,
    cwd,
    maxBuffer
  },
  isSync
}) => {
  const { exitCode, signal, signalDescription } = normalizeExitPayload(rawExitCode, rawSignal);
  const { originalMessage, shortMessage, message } = createMessages({
    stdio,
    all,
    ipcOutput,
    originalError,
    signal,
    signalDescription,
    exitCode,
    escapedCommand,
    timedOut,
    isCanceled,
    isGracefullyCanceled,
    isMaxBuffer,
    isForcefullyTerminated,
    forceKillAfterDelay,
    killSignal,
    maxBuffer,
    timeout,
    cwd
  });
  const error = getFinalError(originalError, message, isSync);
  Object.assign(error, getErrorProperties({
    error,
    command,
    escapedCommand,
    startTime,
    timedOut,
    isCanceled,
    isGracefullyCanceled,
    isMaxBuffer,
    isForcefullyTerminated,
    exitCode,
    signal,
    signalDescription,
    stdio,
    all,
    ipcOutput,
    cwd,
    originalMessage,
    shortMessage
  }));
  return error;
};
var getErrorProperties = ({
  error,
  command,
  escapedCommand,
  startTime,
  timedOut,
  isCanceled,
  isGracefullyCanceled,
  isMaxBuffer,
  isForcefullyTerminated,
  exitCode,
  signal,
  signalDescription,
  stdio,
  all,
  ipcOutput,
  cwd,
  originalMessage,
  shortMessage
}) => omitUndefinedProperties({
  shortMessage,
  originalMessage,
  command,
  escapedCommand,
  cwd,
  durationMs: getDurationMs(startTime),
  failed: true,
  timedOut,
  isCanceled,
  isGracefullyCanceled,
  isTerminated: signal !== void 0,
  isMaxBuffer,
  isForcefullyTerminated,
  exitCode,
  signal,
  signalDescription,
  code: error.cause?.code,
  stdout: stdio[1],
  stderr: stdio[2],
  all,
  stdio,
  ipcOutput,
  pipedFrom: []
});
var omitUndefinedProperties = (result) => Object.fromEntries(Object.entries(result).filter(([, value]) => value !== void 0));
var normalizeExitPayload = (rawExitCode, rawSignal) => {
  const exitCode = rawExitCode === null ? void 0 : rawExitCode;
  const signal = rawSignal === null ? void 0 : rawSignal;
  const signalDescription = signal === void 0 ? void 0 : getSignalDescription(rawSignal);
  return { exitCode, signal, signalDescription };
};

// ../../node_modules/.pnpm/parse-ms@4.0.0/node_modules/parse-ms/index.js
var toZeroIfInfinity = (value) => Number.isFinite(value) ? value : 0;
function parseNumber(milliseconds) {
  return {
    days: Math.trunc(milliseconds / 864e5),
    hours: Math.trunc(milliseconds / 36e5 % 24),
    minutes: Math.trunc(milliseconds / 6e4 % 60),
    seconds: Math.trunc(milliseconds / 1e3 % 60),
    milliseconds: Math.trunc(milliseconds % 1e3),
    microseconds: Math.trunc(toZeroIfInfinity(milliseconds * 1e3) % 1e3),
    nanoseconds: Math.trunc(toZeroIfInfinity(milliseconds * 1e6) % 1e3)
  };
}
function parseBigint(milliseconds) {
  return {
    days: milliseconds / 86400000n,
    hours: milliseconds / 3600000n % 24n,
    minutes: milliseconds / 60000n % 60n,
    seconds: milliseconds / 1000n % 60n,
    milliseconds: milliseconds % 1000n,
    microseconds: 0n,
    nanoseconds: 0n
  };
}
function parseMilliseconds(milliseconds) {
  switch (typeof milliseconds) {
    case "number": {
      if (Number.isFinite(milliseconds)) {
        return parseNumber(milliseconds);
      }
      break;
    }
    case "bigint": {
      return parseBigint(milliseconds);
    }
  }
  throw new TypeError("Expected a finite number or bigint");
}

// ../../node_modules/.pnpm/pretty-ms@9.3.1/node_modules/pretty-ms/index.js
var isZero = (value) => value === 0 || value === 0n;
var pluralize = (word, count2) => count2 === 1 || count2 === 1n ? word : `${word}s`;
var SECOND_ROUNDING_EPSILON = 1e-7;
var ONE_DAY_IN_MILLISECONDS = 24n * 60n * 60n * 1000n;
function prettyMilliseconds(milliseconds, options) {
  const isBigInt = typeof milliseconds === "bigint";
  if (!isBigInt && !Number.isFinite(milliseconds)) {
    throw new TypeError("Expected a finite number or bigint");
  }
  options = { ...options };
  const sign = milliseconds < 0 ? "-" : "";
  milliseconds = milliseconds < 0 ? -milliseconds : milliseconds;
  if (options.colonNotation) {
    options.compact = false;
    options.formatSubMilliseconds = false;
    options.separateMilliseconds = false;
    options.verbose = false;
  }
  if (options.compact) {
    options.unitCount = 1;
    options.secondsDecimalDigits = 0;
    options.millisecondsDecimalDigits = 0;
  }
  let result = [];
  const floorDecimals = (value, decimalDigits) => {
    const flooredInterimValue = Math.floor(value * 10 ** decimalDigits + SECOND_ROUNDING_EPSILON);
    const flooredValue = Math.round(flooredInterimValue) / 10 ** decimalDigits;
    return flooredValue.toFixed(decimalDigits);
  };
  const add = (value, long, short, valueString) => {
    if ((result.length === 0 || !options.colonNotation) && isZero(value) && !(options.colonNotation && short === "m")) {
      return;
    }
    valueString ??= String(value);
    if (options.colonNotation) {
      const wholeDigits = valueString.includes(".") ? valueString.split(".")[0].length : valueString.length;
      const minLength = result.length > 0 ? 2 : 1;
      valueString = "0".repeat(Math.max(0, minLength - wholeDigits)) + valueString;
    } else {
      valueString += options.verbose ? " " + pluralize(long, value) : short;
    }
    result.push(valueString);
  };
  const parsed = parseMilliseconds(milliseconds);
  const days = BigInt(parsed.days);
  if (options.hideYearAndDays) {
    add(BigInt(days) * 24n + BigInt(parsed.hours), "hour", "h");
  } else {
    if (options.hideYear) {
      add(days, "day", "d");
    } else {
      add(days / 365n, "year", "y");
      add(days % 365n, "day", "d");
    }
    add(Number(parsed.hours), "hour", "h");
  }
  add(Number(parsed.minutes), "minute", "m");
  if (!options.hideSeconds) {
    if (options.separateMilliseconds || options.formatSubMilliseconds || !options.colonNotation && milliseconds < 1e3 && !options.subSecondsAsDecimals) {
      const seconds = Number(parsed.seconds);
      const milliseconds2 = Number(parsed.milliseconds);
      const microseconds = Number(parsed.microseconds);
      const nanoseconds = Number(parsed.nanoseconds);
      add(seconds, "second", "s");
      if (options.formatSubMilliseconds) {
        add(milliseconds2, "millisecond", "ms");
        add(microseconds, "microsecond", "\xB5s");
        add(nanoseconds, "nanosecond", "ns");
      } else {
        const millisecondsAndBelow = milliseconds2 + microseconds / 1e3 + nanoseconds / 1e6;
        const millisecondsDecimalDigits = typeof options.millisecondsDecimalDigits === "number" ? options.millisecondsDecimalDigits : 0;
        const roundedMilliseconds = millisecondsAndBelow >= 1 ? Math.round(millisecondsAndBelow) : Math.ceil(millisecondsAndBelow);
        const maximumMilliseconds = 1e3 - 10 ** -millisecondsDecimalDigits;
        const millisecondsString = millisecondsDecimalDigits ? Math.min(millisecondsAndBelow, maximumMilliseconds).toFixed(millisecondsDecimalDigits) : Math.min(roundedMilliseconds, maximumMilliseconds);
        add(
          Number.parseFloat(millisecondsString),
          "millisecond",
          "ms",
          millisecondsString
        );
      }
    } else {
      const seconds = (isBigInt ? Number(milliseconds % ONE_DAY_IN_MILLISECONDS) : milliseconds) / 1e3 % 60;
      const secondsDecimalDigits = typeof options.secondsDecimalDigits === "number" ? options.secondsDecimalDigits : 1;
      const secondsFixed = floorDecimals(seconds, secondsDecimalDigits);
      const secondsString = options.keepDecimalsOnWholeSeconds ? secondsFixed : secondsFixed.replace(/\.0+$/, "");
      add(Number.parseFloat(secondsString), "second", "s", secondsString);
    }
  }
  if (result.length === 0) {
    return sign + "0" + (options.verbose ? " milliseconds" : "ms");
  }
  const separator = options.colonNotation ? ":" : " ";
  if (typeof options.unitCount === "number") {
    result = result.slice(0, Math.max(options.unitCount, 1));
  }
  return sign + result.join(separator);
}

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/verbose/error.js
var logError = (result, verboseInfo) => {
  if (result.failed) {
    verboseLog({
      type: "error",
      verboseMessage: result.shortMessage,
      verboseInfo,
      result
    });
  }
};

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/verbose/complete.js
var logResult = (result, verboseInfo) => {
  if (!isVerbose(verboseInfo)) {
    return;
  }
  logError(result, verboseInfo);
  logDuration(result, verboseInfo);
};
var logDuration = (result, verboseInfo) => {
  const verboseMessage = `(done in ${prettyMilliseconds(result.durationMs)})`;
  verboseLog({
    type: "duration",
    verboseMessage,
    verboseInfo,
    result
  });
};

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/return/reject.js
var handleResult = (result, verboseInfo, { reject }) => {
  logResult(result, verboseInfo);
  if (result.failed && reject) {
    throw result;
  }
  return result;
};

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/stdio/handle-sync.js
var import_node_fs11 = require("node:fs");

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/stdio/type.js
var getStdioItemType = (value, optionName) => {
  if (isAsyncGenerator(value)) {
    return "asyncGenerator";
  }
  if (isSyncGenerator(value)) {
    return "generator";
  }
  if (isUrl(value)) {
    return "fileUrl";
  }
  if (isFilePathObject(value)) {
    return "filePath";
  }
  if (isWebStream(value)) {
    return "webStream";
  }
  if (isStream(value, { checkOpen: false })) {
    return "native";
  }
  if (isUint8Array(value)) {
    return "uint8Array";
  }
  if (isAsyncIterableObject(value)) {
    return "asyncIterable";
  }
  if (isIterableObject(value)) {
    return "iterable";
  }
  if (isTransformStream(value)) {
    return getTransformStreamType({ transform: value }, optionName);
  }
  if (isTransformOptions(value)) {
    return getTransformObjectType(value, optionName);
  }
  return "native";
};
var getTransformObjectType = (value, optionName) => {
  if (isDuplexStream(value.transform, { checkOpen: false })) {
    return getDuplexType(value, optionName);
  }
  if (isTransformStream(value.transform)) {
    return getTransformStreamType(value, optionName);
  }
  return getGeneratorObjectType(value, optionName);
};
var getDuplexType = (value, optionName) => {
  validateNonGeneratorType(value, optionName, "Duplex stream");
  return "duplex";
};
var getTransformStreamType = (value, optionName) => {
  validateNonGeneratorType(value, optionName, "web TransformStream");
  return "webTransform";
};
var validateNonGeneratorType = ({ final, binary, objectMode }, optionName, typeName) => {
  checkUndefinedOption(final, `${optionName}.final`, typeName);
  checkUndefinedOption(binary, `${optionName}.binary`, typeName);
  checkBooleanOption(objectMode, `${optionName}.objectMode`);
};
var checkUndefinedOption = (value, optionName, typeName) => {
  if (value !== void 0) {
    throw new TypeError(`The \`${optionName}\` option can only be defined when using a generator, not a ${typeName}.`);
  }
};
var getGeneratorObjectType = ({ transform, final, binary, objectMode }, optionName) => {
  if (transform !== void 0 && !isGenerator(transform)) {
    throw new TypeError(`The \`${optionName}.transform\` option must be a generator, a Duplex stream or a web TransformStream.`);
  }
  if (isDuplexStream(final, { checkOpen: false })) {
    throw new TypeError(`The \`${optionName}.final\` option must not be a Duplex stream.`);
  }
  if (isTransformStream(final)) {
    throw new TypeError(`The \`${optionName}.final\` option must not be a web TransformStream.`);
  }
  if (final !== void 0 && !isGenerator(final)) {
    throw new TypeError(`The \`${optionName}.final\` option must be a generator.`);
  }
  checkBooleanOption(binary, `${optionName}.binary`);
  checkBooleanOption(objectMode, `${optionName}.objectMode`);
  return isAsyncGenerator(transform) || isAsyncGenerator(final) ? "asyncGenerator" : "generator";
};
var checkBooleanOption = (value, optionName) => {
  if (value !== void 0 && typeof value !== "boolean") {
    throw new TypeError(`The \`${optionName}\` option must use a boolean.`);
  }
};
var isGenerator = (value) => isAsyncGenerator(value) || isSyncGenerator(value);
var isAsyncGenerator = (value) => Object.prototype.toString.call(value) === "[object AsyncGeneratorFunction]";
var isSyncGenerator = (value) => Object.prototype.toString.call(value) === "[object GeneratorFunction]";
var isTransformOptions = (value) => isPlainObject(value) && (value.transform !== void 0 || value.final !== void 0);
var isUrl = (value) => Object.prototype.toString.call(value) === "[object URL]";
var isRegularUrl = (value) => isUrl(value) && value.protocol !== "file:";
var isFilePathObject = (value) => isPlainObject(value) && Object.keys(value).length > 0 && Object.keys(value).every((key) => FILE_PATH_KEYS.has(key)) && isFilePathString(value.file);
var FILE_PATH_KEYS = /* @__PURE__ */ new Set(["file", "append"]);
var isFilePathString = (file) => typeof file === "string";
var isUnknownStdioString = (type, value) => type === "native" && typeof value === "string" && !KNOWN_STDIO_STRINGS.has(value);
var KNOWN_STDIO_STRINGS = /* @__PURE__ */ new Set(["ipc", "ignore", "inherit", "overlapped", "pipe"]);
var isReadableStream2 = (value) => Object.prototype.toString.call(value) === "[object ReadableStream]";
var isWritableStream2 = (value) => Object.prototype.toString.call(value) === "[object WritableStream]";
var isWebStream = (value) => isReadableStream2(value) || isWritableStream2(value);
var isTransformStream = (value) => isReadableStream2(value?.readable) && isWritableStream2(value?.writable);
var isAsyncIterableObject = (value) => isObject(value) && typeof value[Symbol.asyncIterator] === "function";
var isIterableObject = (value) => isObject(value) && typeof value[Symbol.iterator] === "function";
var isObject = (value) => typeof value === "object" && value !== null;
var TRANSFORM_TYPES = /* @__PURE__ */ new Set(["generator", "asyncGenerator", "duplex", "webTransform"]);
var FILE_TYPES = /* @__PURE__ */ new Set(["fileUrl", "filePath", "fileNumber"]);
var SPECIAL_DUPLICATE_TYPES_SYNC = /* @__PURE__ */ new Set(["fileUrl", "filePath"]);
var SPECIAL_DUPLICATE_TYPES = /* @__PURE__ */ new Set([...SPECIAL_DUPLICATE_TYPES_SYNC, "webStream", "nodeStream"]);
var FORBID_DUPLICATE_TYPES = /* @__PURE__ */ new Set(["webTransform", "duplex"]);
var TYPE_TO_MESSAGE = {
  generator: "a generator",
  asyncGenerator: "an async generator",
  fileUrl: "a file URL",
  filePath: "a file path string",
  fileNumber: "a file descriptor number",
  webStream: "a web stream",
  nodeStream: "a Node.js stream",
  webTransform: "a web TransformStream",
  duplex: "a Duplex stream",
  native: "any value",
  iterable: "an iterable",
  asyncIterable: "an async iterable",
  string: "a string",
  uint8Array: "a Uint8Array"
};

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/transform/object-mode.js
var getTransformObjectModes = (objectMode, index, newTransforms, direction) => direction === "output" ? getOutputObjectModes(objectMode, index, newTransforms) : getInputObjectModes(objectMode, index, newTransforms);
var getOutputObjectModes = (objectMode, index, newTransforms) => {
  const writableObjectMode = index !== 0 && newTransforms[index - 1].value.readableObjectMode;
  const readableObjectMode = objectMode ?? writableObjectMode;
  return { writableObjectMode, readableObjectMode };
};
var getInputObjectModes = (objectMode, index, newTransforms) => {
  const writableObjectMode = index === 0 ? objectMode === true : newTransforms[index - 1].value.readableObjectMode;
  const readableObjectMode = index !== newTransforms.length - 1 && (objectMode ?? writableObjectMode);
  return { writableObjectMode, readableObjectMode };
};
var getFdObjectMode = (stdioItems, direction) => {
  const lastTransform = stdioItems.findLast(({ type }) => TRANSFORM_TYPES.has(type));
  if (lastTransform === void 0) {
    return false;
  }
  return direction === "input" ? lastTransform.value.writableObjectMode : lastTransform.value.readableObjectMode;
};

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/transform/normalize.js
var normalizeTransforms = (stdioItems, optionName, direction, options) => [
  ...stdioItems.filter(({ type }) => !TRANSFORM_TYPES.has(type)),
  ...getTransforms(stdioItems, optionName, direction, options)
];
var getTransforms = (stdioItems, optionName, direction, { encoding }) => {
  const transforms = stdioItems.filter(({ type }) => TRANSFORM_TYPES.has(type));
  const newTransforms = Array.from({ length: transforms.length });
  for (const [index, stdioItem] of Object.entries(transforms)) {
    newTransforms[index] = normalizeTransform({
      stdioItem,
      index: Number(index),
      newTransforms,
      optionName,
      direction,
      encoding
    });
  }
  return sortTransforms(newTransforms, direction);
};
var normalizeTransform = ({ stdioItem, stdioItem: { type }, index, newTransforms, optionName, direction, encoding }) => {
  if (type === "duplex") {
    return normalizeDuplex({ stdioItem, optionName });
  }
  if (type === "webTransform") {
    return normalizeTransformStream({
      stdioItem,
      index,
      newTransforms,
      direction
    });
  }
  return normalizeGenerator({
    stdioItem,
    index,
    newTransforms,
    direction,
    encoding
  });
};
var normalizeDuplex = ({
  stdioItem,
  stdioItem: {
    value: {
      transform,
      transform: { writableObjectMode, readableObjectMode },
      objectMode = readableObjectMode
    }
  },
  optionName
}) => {
  if (objectMode && !readableObjectMode) {
    throw new TypeError(`The \`${optionName}.objectMode\` option can only be \`true\` if \`new Duplex({objectMode: true})\` is used.`);
  }
  if (!objectMode && readableObjectMode) {
    throw new TypeError(`The \`${optionName}.objectMode\` option cannot be \`false\` if \`new Duplex({objectMode: true})\` is used.`);
  }
  return {
    ...stdioItem,
    value: { transform, writableObjectMode, readableObjectMode }
  };
};
var normalizeTransformStream = ({ stdioItem, stdioItem: { value }, index, newTransforms, direction }) => {
  const { transform, objectMode } = isPlainObject(value) ? value : { transform: value };
  const { writableObjectMode, readableObjectMode } = getTransformObjectModes(objectMode, index, newTransforms, direction);
  return {
    ...stdioItem,
    value: { transform, writableObjectMode, readableObjectMode }
  };
};
var normalizeGenerator = ({ stdioItem, stdioItem: { value }, index, newTransforms, direction, encoding }) => {
  const {
    transform,
    final,
    binary: binaryOption = false,
    preserveNewlines = false,
    objectMode
  } = isPlainObject(value) ? value : { transform: value };
  const binary = binaryOption || BINARY_ENCODINGS.has(encoding);
  const { writableObjectMode, readableObjectMode } = getTransformObjectModes(objectMode, index, newTransforms, direction);
  return {
    ...stdioItem,
    value: {
      transform,
      final,
      binary,
      preserveNewlines,
      writableObjectMode,
      readableObjectMode
    }
  };
};
var sortTransforms = (newTransforms, direction) => direction === "input" ? newTransforms.reverse() : newTransforms;

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/stdio/direction.js
var import_node_process9 = __toESM(require("node:process"), 1);
var getStreamDirection = (stdioItems, fdNumber, optionName) => {
  const directions = stdioItems.map((stdioItem) => getStdioItemDirection(stdioItem, fdNumber));
  if (directions.includes("input") && directions.includes("output")) {
    throw new TypeError(`The \`${optionName}\` option must not be an array of both readable and writable values.`);
  }
  return directions.find(Boolean) ?? DEFAULT_DIRECTION;
};
var getStdioItemDirection = ({ type, value }, fdNumber) => KNOWN_DIRECTIONS[fdNumber] ?? guessStreamDirection[type](value);
var KNOWN_DIRECTIONS = ["input", "output", "output"];
var anyDirection = () => void 0;
var alwaysInput = () => "input";
var guessStreamDirection = {
  generator: anyDirection,
  asyncGenerator: anyDirection,
  fileUrl: anyDirection,
  filePath: anyDirection,
  iterable: alwaysInput,
  asyncIterable: alwaysInput,
  uint8Array: alwaysInput,
  webStream: (value) => isWritableStream2(value) ? "output" : "input",
  nodeStream(value) {
    if (!isReadableStream(value, { checkOpen: false })) {
      return "output";
    }
    return isWritableStream(value, { checkOpen: false }) ? void 0 : "input";
  },
  webTransform: anyDirection,
  duplex: anyDirection,
  native(value) {
    const standardStreamDirection = getStandardStreamDirection(value);
    if (standardStreamDirection !== void 0) {
      return standardStreamDirection;
    }
    if (isStream(value, { checkOpen: false })) {
      return guessStreamDirection.nodeStream(value);
    }
  }
};
var getStandardStreamDirection = (value) => {
  if ([0, import_node_process9.default.stdin].includes(value)) {
    return "input";
  }
  if ([1, 2, import_node_process9.default.stdout, import_node_process9.default.stderr].includes(value)) {
    return "output";
  }
};
var DEFAULT_DIRECTION = "output";

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/ipc/array.js
var normalizeIpcStdioArray = (stdioArray, ipc) => ipc && !stdioArray.includes("ipc") ? [...stdioArray, "ipc"] : stdioArray;

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/stdio/stdio-option.js
var normalizeStdioOption = ({ stdio, ipc, buffer, ...options }, verboseInfo, isSync) => {
  const stdioArray = getStdioArray(stdio, options).map((stdioOption, fdNumber) => addDefaultValue2(stdioOption, fdNumber));
  return isSync ? normalizeStdioSync(stdioArray, buffer, verboseInfo) : normalizeIpcStdioArray(stdioArray, ipc);
};
var getStdioArray = (stdio, options) => {
  if (stdio === void 0) {
    return STANDARD_STREAMS_ALIASES.map((alias) => options[alias]);
  }
  if (hasAlias(options)) {
    throw new Error(`It's not possible to provide \`stdio\` in combination with one of ${STANDARD_STREAMS_ALIASES.map((alias) => `\`${alias}\``).join(", ")}`);
  }
  if (typeof stdio === "string") {
    return [stdio, stdio, stdio];
  }
  if (!Array.isArray(stdio)) {
    throw new TypeError(`Expected \`stdio\` to be of type \`string\` or \`Array\`, got \`${typeof stdio}\``);
  }
  const length = Math.max(stdio.length, STANDARD_STREAMS_ALIASES.length);
  return Array.from({ length }, (_, fdNumber) => stdio[fdNumber]);
};
var hasAlias = (options) => STANDARD_STREAMS_ALIASES.some((alias) => options[alias] !== void 0);
var addDefaultValue2 = (stdioOption, fdNumber) => {
  if (Array.isArray(stdioOption)) {
    return stdioOption.map((item) => addDefaultValue2(item, fdNumber));
  }
  if (stdioOption === null || stdioOption === void 0) {
    return fdNumber >= STANDARD_STREAMS_ALIASES.length ? "ignore" : "pipe";
  }
  return stdioOption;
};
var normalizeStdioSync = (stdioArray, buffer, verboseInfo) => stdioArray.map((stdioOption, fdNumber) => !buffer[fdNumber] && fdNumber !== 0 && !isFullVerbose(verboseInfo, fdNumber) && isOutputPipeOnly(stdioOption) ? "ignore" : stdioOption);
var isOutputPipeOnly = (stdioOption) => stdioOption === "pipe" || Array.isArray(stdioOption) && stdioOption.every((item) => item === "pipe");

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/stdio/native.js
var import_node_fs10 = require("node:fs");
var import_node_tty2 = __toESM(require("node:tty"), 1);
var handleNativeStream = ({ stdioItem, stdioItem: { type }, isStdioArray, fdNumber, direction, isSync }) => {
  if (!isStdioArray || type !== "native") {
    return stdioItem;
  }
  return isSync ? handleNativeStreamSync({ stdioItem, fdNumber, direction }) : handleNativeStreamAsync({ stdioItem, fdNumber });
};
var handleNativeStreamSync = ({ stdioItem, stdioItem: { value, optionName }, fdNumber, direction }) => {
  const targetFd = getTargetFd({
    value,
    optionName,
    fdNumber,
    direction
  });
  if (targetFd !== void 0) {
    return targetFd;
  }
  if (isStream(value, { checkOpen: false })) {
    throw new TypeError(`The \`${optionName}: Stream\` option cannot both be an array and include a stream with synchronous methods.`);
  }
  return stdioItem;
};
var getTargetFd = ({ value, optionName, fdNumber, direction }) => {
  const targetFdNumber = getTargetFdNumber(value, fdNumber);
  if (targetFdNumber === void 0) {
    return;
  }
  if (direction === "output") {
    return { type: "fileNumber", value: targetFdNumber, optionName };
  }
  if (import_node_tty2.default.isatty(targetFdNumber)) {
    throw new TypeError(`The \`${optionName}: ${serializeOptionValue(value)}\` option is invalid: it cannot be a TTY with synchronous methods.`);
  }
  return { type: "uint8Array", value: bufferToUint8Array((0, import_node_fs10.readFileSync)(targetFdNumber)), optionName };
};
var getTargetFdNumber = (value, fdNumber) => {
  if (value === "inherit") {
    return fdNumber;
  }
  if (typeof value === "number") {
    return value;
  }
  const standardStreamIndex = STANDARD_STREAMS.indexOf(value);
  if (standardStreamIndex !== -1) {
    return standardStreamIndex;
  }
};
var handleNativeStreamAsync = ({ stdioItem, stdioItem: { value, optionName }, fdNumber }) => {
  if (value === "inherit") {
    return { type: "nodeStream", value: getStandardStream(fdNumber, value, optionName), optionName };
  }
  if (typeof value === "number") {
    return { type: "nodeStream", value: getStandardStream(value, value, optionName), optionName };
  }
  if (isStream(value, { checkOpen: false })) {
    return { type: "nodeStream", value, optionName };
  }
  return stdioItem;
};
var getStandardStream = (fdNumber, value, optionName) => {
  const standardStream = STANDARD_STREAMS[fdNumber];
  if (standardStream === void 0) {
    throw new TypeError(`The \`${optionName}: ${value}\` option is invalid: no such standard stream.`);
  }
  return standardStream;
};

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/stdio/input-option.js
var handleInputOptions = ({ input, inputFile }, fdNumber) => fdNumber === 0 ? [
  ...handleInputOption(input),
  ...handleInputFileOption(inputFile)
] : [];
var handleInputOption = (input) => input === void 0 ? [] : [{
  type: getInputType(input),
  value: input,
  optionName: "input"
}];
var getInputType = (input) => {
  if (isReadableStream(input, { checkOpen: false })) {
    return "nodeStream";
  }
  if (typeof input === "string") {
    return "string";
  }
  if (isUint8Array(input)) {
    return "uint8Array";
  }
  throw new Error("The `input` option must be a string, a Uint8Array or a Node.js Readable stream.");
};
var handleInputFileOption = (inputFile) => inputFile === void 0 ? [] : [{
  ...getInputFileType(inputFile),
  optionName: "inputFile"
}];
var getInputFileType = (inputFile) => {
  if (isUrl(inputFile)) {
    return { type: "fileUrl", value: inputFile };
  }
  if (isFilePathString(inputFile)) {
    return { type: "filePath", value: { file: inputFile } };
  }
  throw new Error("The `inputFile` option must be a file path string or a file URL.");
};

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/stdio/duplicate.js
var filterDuplicates = (stdioItems) => stdioItems.filter((stdioItemOne, indexOne) => stdioItems.every((stdioItemTwo, indexTwo) => stdioItemOne.value !== stdioItemTwo.value || indexOne >= indexTwo || stdioItemOne.type === "generator" || stdioItemOne.type === "asyncGenerator"));
var getDuplicateStream = ({ stdioItem: { type, value, optionName }, direction, fileDescriptors, isSync }) => {
  const otherStdioItems = getOtherStdioItems(fileDescriptors, type);
  if (otherStdioItems.length === 0) {
    return;
  }
  if (isSync) {
    validateDuplicateStreamSync({
      otherStdioItems,
      type,
      value,
      optionName,
      direction
    });
    return;
  }
  if (SPECIAL_DUPLICATE_TYPES.has(type)) {
    return getDuplicateStreamInstance({
      otherStdioItems,
      type,
      value,
      optionName,
      direction
    });
  }
  if (FORBID_DUPLICATE_TYPES.has(type)) {
    validateDuplicateTransform({
      otherStdioItems,
      type,
      value,
      optionName
    });
  }
};
var getOtherStdioItems = (fileDescriptors, type) => fileDescriptors.flatMap(({ direction, stdioItems }) => stdioItems.filter((stdioItem) => stdioItem.type === type).map((stdioItem) => ({ ...stdioItem, direction })));
var validateDuplicateStreamSync = ({ otherStdioItems, type, value, optionName, direction }) => {
  if (SPECIAL_DUPLICATE_TYPES_SYNC.has(type)) {
    getDuplicateStreamInstance({
      otherStdioItems,
      type,
      value,
      optionName,
      direction
    });
  }
};
var getDuplicateStreamInstance = ({ otherStdioItems, type, value, optionName, direction }) => {
  const duplicateStdioItems = otherStdioItems.filter((stdioItem) => hasSameValue(stdioItem, value));
  if (duplicateStdioItems.length === 0) {
    return;
  }
  const differentStdioItem = duplicateStdioItems.find((stdioItem) => stdioItem.direction !== direction);
  throwOnDuplicateStream(differentStdioItem, optionName, type);
  return direction === "output" ? duplicateStdioItems[0].stream : void 0;
};
var hasSameValue = ({ type, value }, secondValue) => {
  if (type === "filePath") {
    return value.file === secondValue.file;
  }
  if (type === "fileUrl") {
    return value.href === secondValue.href;
  }
  return value === secondValue;
};
var validateDuplicateTransform = ({ otherStdioItems, type, value, optionName }) => {
  const duplicateStdioItem = otherStdioItems.find(({ value: { transform } }) => transform === value.transform);
  throwOnDuplicateStream(duplicateStdioItem, optionName, type);
};
var throwOnDuplicateStream = (stdioItem, optionName, type) => {
  if (stdioItem !== void 0) {
    throw new TypeError(`The \`${stdioItem.optionName}\` and \`${optionName}\` options must not target ${TYPE_TO_MESSAGE[type]} that is the same.`);
  }
};

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/stdio/handle.js
var handleStdio = (addProperties3, options, verboseInfo, isSync) => {
  const stdio = normalizeStdioOption(options, verboseInfo, isSync);
  const initialFileDescriptors = stdio.map((stdioOption, fdNumber) => getFileDescriptor({
    stdioOption,
    fdNumber,
    options,
    isSync
  }));
  const fileDescriptors = getFinalFileDescriptors({
    initialFileDescriptors,
    addProperties: addProperties3,
    options,
    isSync
  });
  options.stdio = fileDescriptors.map(({ stdioItems }) => forwardStdio(stdioItems));
  return fileDescriptors;
};
var getFileDescriptor = ({ stdioOption, fdNumber, options, isSync }) => {
  const optionName = getStreamName(fdNumber);
  const { stdioItems: initialStdioItems, isStdioArray } = initializeStdioItems({
    stdioOption,
    fdNumber,
    options,
    optionName
  });
  const direction = getStreamDirection(initialStdioItems, fdNumber, optionName);
  const stdioItems = initialStdioItems.map((stdioItem) => handleNativeStream({
    stdioItem,
    isStdioArray,
    fdNumber,
    direction,
    isSync
  }));
  const normalizedStdioItems = normalizeTransforms(stdioItems, optionName, direction, options);
  const objectMode = getFdObjectMode(normalizedStdioItems, direction);
  validateFileObjectMode(normalizedStdioItems, objectMode);
  return { direction, objectMode, stdioItems: normalizedStdioItems };
};
var initializeStdioItems = ({ stdioOption, fdNumber, options, optionName }) => {
  const values = Array.isArray(stdioOption) ? stdioOption : [stdioOption];
  const initialStdioItems = [
    ...values.map((value) => initializeStdioItem(value, optionName)),
    ...handleInputOptions(options, fdNumber)
  ];
  const stdioItems = filterDuplicates(initialStdioItems);
  const isStdioArray = stdioItems.length > 1;
  validateStdioArray(stdioItems, isStdioArray, optionName);
  validateStreams(stdioItems);
  return { stdioItems, isStdioArray };
};
var initializeStdioItem = (value, optionName) => ({
  type: getStdioItemType(value, optionName),
  value,
  optionName
});
var validateStdioArray = (stdioItems, isStdioArray, optionName) => {
  if (stdioItems.length === 0) {
    throw new TypeError(`The \`${optionName}\` option must not be an empty array.`);
  }
  if (!isStdioArray) {
    return;
  }
  for (const { value, optionName: optionName2 } of stdioItems) {
    if (INVALID_STDIO_ARRAY_OPTIONS.has(value)) {
      throw new Error(`The \`${optionName2}\` option must not include \`${value}\`.`);
    }
  }
};
var INVALID_STDIO_ARRAY_OPTIONS = /* @__PURE__ */ new Set(["ignore", "ipc"]);
var validateStreams = (stdioItems) => {
  for (const stdioItem of stdioItems) {
    validateFileStdio(stdioItem);
  }
};
var validateFileStdio = ({ type, value, optionName }) => {
  if (isRegularUrl(value)) {
    throw new TypeError(`The \`${optionName}: URL\` option must use the \`file:\` scheme.
For example, you can use the \`pathToFileURL()\` method of the \`url\` core module.`);
  }
  if (isUnknownStdioString(type, value)) {
    throw new TypeError(`The \`${optionName}: { file: '...' }\` option must be used instead of \`${optionName}: '...'\`.`);
  }
};
var validateFileObjectMode = (stdioItems, objectMode) => {
  if (!objectMode) {
    return;
  }
  const fileStdioItem = stdioItems.find(({ type }) => FILE_TYPES.has(type));
  if (fileStdioItem !== void 0) {
    throw new TypeError(`The \`${fileStdioItem.optionName}\` option cannot use both files and transforms in objectMode.`);
  }
};
var getFinalFileDescriptors = ({ initialFileDescriptors, addProperties: addProperties3, options, isSync }) => {
  const fileDescriptors = [];
  try {
    for (const fileDescriptor of initialFileDescriptors) {
      fileDescriptors.push(getFinalFileDescriptor({
        fileDescriptor,
        fileDescriptors,
        addProperties: addProperties3,
        options,
        isSync
      }));
    }
    return fileDescriptors;
  } catch (error) {
    cleanupCustomStreams(fileDescriptors);
    throw error;
  }
};
var getFinalFileDescriptor = ({
  fileDescriptor: { direction, objectMode, stdioItems },
  fileDescriptors,
  addProperties: addProperties3,
  options,
  isSync
}) => {
  const finalStdioItems = stdioItems.map((stdioItem) => addStreamProperties({
    stdioItem,
    addProperties: addProperties3,
    direction,
    options,
    fileDescriptors,
    isSync
  }));
  return { direction, objectMode, stdioItems: finalStdioItems };
};
var addStreamProperties = ({ stdioItem, addProperties: addProperties3, direction, options, fileDescriptors, isSync }) => {
  const duplicateStream = getDuplicateStream({
    stdioItem,
    direction,
    fileDescriptors,
    isSync
  });
  if (duplicateStream !== void 0) {
    return { ...stdioItem, stream: duplicateStream };
  }
  return {
    ...stdioItem,
    ...addProperties3[direction][stdioItem.type](stdioItem, options)
  };
};
var cleanupCustomStreams = (fileDescriptors) => {
  for (const { stdioItems } of fileDescriptors) {
    for (const { stream: stream2 } of stdioItems) {
      if (stream2 !== void 0 && !isStandardStream(stream2)) {
        stream2.destroy();
      }
    }
  }
};
var forwardStdio = (stdioItems) => {
  if (stdioItems.length > 1) {
    return stdioItems.some(({ value: value2 }) => value2 === "overlapped") ? "overlapped" : "pipe";
  }
  const [{ type, value }] = stdioItems;
  return type === "native" ? value : "pipe";
};

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/stdio/handle-sync.js
var handleStdioSync = (options, verboseInfo) => handleStdio(addPropertiesSync, options, verboseInfo, true);
var forbiddenIfSync = ({ type, optionName }) => {
  throwInvalidSyncValue(optionName, TYPE_TO_MESSAGE[type]);
};
var forbiddenNativeIfSync = ({ optionName, value }) => {
  if (value === "ipc" || value === "overlapped") {
    throwInvalidSyncValue(optionName, `"${value}"`);
  }
  return {};
};
var throwInvalidSyncValue = (optionName, value) => {
  throw new TypeError(`The \`${optionName}\` option cannot be ${value} with synchronous methods.`);
};
var addProperties = {
  generator() {
  },
  asyncGenerator: forbiddenIfSync,
  webStream: forbiddenIfSync,
  nodeStream: forbiddenIfSync,
  webTransform: forbiddenIfSync,
  duplex: forbiddenIfSync,
  asyncIterable: forbiddenIfSync,
  native: forbiddenNativeIfSync
};
var addPropertiesSync = {
  input: {
    ...addProperties,
    fileUrl: ({ value }) => ({ contents: [bufferToUint8Array((0, import_node_fs11.readFileSync)(value))] }),
    filePath: ({ value: { file } }) => ({ contents: [bufferToUint8Array((0, import_node_fs11.readFileSync)(file))] }),
    fileNumber: forbiddenIfSync,
    iterable: ({ value }) => ({ contents: [...value] }),
    string: ({ value }) => ({ contents: [value] }),
    uint8Array: ({ value }) => ({ contents: [value] })
  },
  output: {
    ...addProperties,
    fileUrl: ({ value }) => ({ path: value }),
    filePath: ({ value: { file, append } }) => ({ path: file, append }),
    fileNumber: ({ value }) => ({ path: value }),
    iterable: forbiddenIfSync,
    string: forbiddenIfSync,
    uint8Array: forbiddenIfSync
  }
};

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/io/strip-newline.js
var stripNewline = (value, { stripFinalNewline: stripFinalNewline2 }, fdNumber) => getStripFinalNewline(stripFinalNewline2, fdNumber) && value !== void 0 && !Array.isArray(value) ? stripFinalNewline(value) : value;
var getStripFinalNewline = (stripFinalNewline2, fdNumber) => fdNumber === "all" ? stripFinalNewline2[1] || stripFinalNewline2[2] : stripFinalNewline2[fdNumber];

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/transform/generator.js
var import_node_stream = require("node:stream");

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/transform/split.js
var getSplitLinesGenerator = (binary, preserveNewlines, skipped, state) => binary || skipped ? void 0 : initializeSplitLines(preserveNewlines, state);
var splitLinesSync = (chunk, preserveNewlines, objectMode) => objectMode ? chunk.flatMap((item) => splitLinesItemSync(item, preserveNewlines)) : splitLinesItemSync(chunk, preserveNewlines);
var splitLinesItemSync = (chunk, preserveNewlines) => {
  const { transform, final } = initializeSplitLines(preserveNewlines, {});
  return [...transform(chunk), ...final()];
};
var initializeSplitLines = (preserveNewlines, state) => {
  state.previousChunks = "";
  return {
    transform: splitGenerator.bind(void 0, state, preserveNewlines),
    final: linesFinal.bind(void 0, state)
  };
};
var splitGenerator = function* (state, preserveNewlines, chunk) {
  if (typeof chunk !== "string") {
    yield chunk;
    return;
  }
  let { previousChunks } = state;
  let start = -1;
  for (let end = 0; end < chunk.length; end += 1) {
    if (chunk[end] === "\n") {
      const newlineLength = getNewlineLength(chunk, end, preserveNewlines, state);
      let line = chunk.slice(start + 1, end + 1 - newlineLength);
      if (previousChunks.length > 0) {
        line = concatString(previousChunks, line);
        previousChunks = "";
      }
      yield line;
      start = end;
    }
  }
  if (start !== chunk.length - 1) {
    previousChunks = concatString(previousChunks, chunk.slice(start + 1));
  }
  state.previousChunks = previousChunks;
};
var getNewlineLength = (chunk, end, preserveNewlines, state) => {
  if (preserveNewlines) {
    return 0;
  }
  state.isWindowsNewline = end !== 0 && chunk[end - 1] === "\r";
  return state.isWindowsNewline ? 2 : 1;
};
var linesFinal = function* ({ previousChunks }) {
  if (previousChunks.length > 0) {
    yield previousChunks;
  }
};
var getAppendNewlineGenerator = ({ binary, preserveNewlines, readableObjectMode, state }) => binary || preserveNewlines || readableObjectMode ? void 0 : { transform: appendNewlineGenerator.bind(void 0, state) };
var appendNewlineGenerator = function* ({ isWindowsNewline = false }, chunk) {
  const { unixNewline, windowsNewline, LF: LF2, concatBytes } = typeof chunk === "string" ? linesStringInfo : linesUint8ArrayInfo;
  if (chunk.at(-1) === LF2) {
    yield chunk;
    return;
  }
  const newline = isWindowsNewline ? windowsNewline : unixNewline;
  yield concatBytes(chunk, newline);
};
var concatString = (firstChunk, secondChunk) => `${firstChunk}${secondChunk}`;
var linesStringInfo = {
  windowsNewline: "\r\n",
  unixNewline: "\n",
  LF: "\n",
  concatBytes: concatString
};
var concatUint8Array = (firstChunk, secondChunk) => {
  const chunk = new Uint8Array(firstChunk.length + secondChunk.length);
  chunk.set(firstChunk, 0);
  chunk.set(secondChunk, firstChunk.length);
  return chunk;
};
var linesUint8ArrayInfo = {
  windowsNewline: new Uint8Array([13, 10]),
  unixNewline: new Uint8Array([10]),
  LF: 10,
  concatBytes: concatUint8Array
};

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/transform/validate.js
var import_node_buffer = require("node:buffer");
var getValidateTransformInput = (writableObjectMode, optionName) => writableObjectMode ? void 0 : validateStringTransformInput.bind(void 0, optionName);
var validateStringTransformInput = function* (optionName, chunk) {
  if (typeof chunk !== "string" && !isUint8Array(chunk) && !import_node_buffer.Buffer.isBuffer(chunk)) {
    throw new TypeError(`The \`${optionName}\` option's transform must use "objectMode: true" to receive as input: ${typeof chunk}.`);
  }
  yield chunk;
};
var getValidateTransformReturn = (readableObjectMode, optionName) => readableObjectMode ? validateObjectTransformReturn.bind(void 0, optionName) : validateStringTransformReturn.bind(void 0, optionName);
var validateObjectTransformReturn = function* (optionName, chunk) {
  validateEmptyReturn(optionName, chunk);
  yield chunk;
};
var validateStringTransformReturn = function* (optionName, chunk) {
  validateEmptyReturn(optionName, chunk);
  if (typeof chunk !== "string" && !isUint8Array(chunk)) {
    throw new TypeError(`The \`${optionName}\` option's function must yield a string or an Uint8Array, not ${typeof chunk}.`);
  }
  yield chunk;
};
var validateEmptyReturn = (optionName, chunk) => {
  if (chunk === null || chunk === void 0) {
    throw new TypeError(`The \`${optionName}\` option's function must not call \`yield ${chunk}\`.
Instead, \`yield\` should either be called with a value, or not be called at all. For example:
  if (condition) { yield value; }`);
  }
};

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/transform/encoding-transform.js
var import_node_buffer2 = require("node:buffer");
var import_node_string_decoder2 = require("node:string_decoder");
var getEncodingTransformGenerator = (binary, encoding, skipped) => {
  if (skipped) {
    return;
  }
  if (binary) {
    return { transform: encodingUint8ArrayGenerator.bind(void 0, new TextEncoder()) };
  }
  const stringDecoder = new import_node_string_decoder2.StringDecoder(encoding);
  return {
    transform: encodingStringGenerator.bind(void 0, stringDecoder),
    final: encodingStringFinal.bind(void 0, stringDecoder)
  };
};
var encodingUint8ArrayGenerator = function* (textEncoder3, chunk) {
  if (import_node_buffer2.Buffer.isBuffer(chunk)) {
    yield bufferToUint8Array(chunk);
  } else if (typeof chunk === "string") {
    yield textEncoder3.encode(chunk);
  } else {
    yield chunk;
  }
};
var encodingStringGenerator = function* (stringDecoder, chunk) {
  yield isUint8Array(chunk) ? stringDecoder.write(chunk) : chunk;
};
var encodingStringFinal = function* (stringDecoder) {
  const lastChunk = stringDecoder.end();
  if (lastChunk !== "") {
    yield lastChunk;
  }
};

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/transform/run-async.js
var import_node_util7 = require("node:util");
var pushChunks = (0, import_node_util7.callbackify)(async (getChunks, state, getChunksArguments, transformStream) => {
  state.currentIterable = getChunks(...getChunksArguments);
  try {
    for await (const chunk of state.currentIterable) {
      transformStream.push(chunk);
    }
  } finally {
    delete state.currentIterable;
  }
});
var transformChunk = async function* (chunk, generators, index) {
  if (index === generators.length) {
    yield chunk;
    return;
  }
  const { transform = identityGenerator } = generators[index];
  for await (const transformedChunk of transform(chunk)) {
    yield* transformChunk(transformedChunk, generators, index + 1);
  }
};
var finalChunks = async function* (generators) {
  for (const [index, { final }] of Object.entries(generators)) {
    yield* generatorFinalChunks(final, Number(index), generators);
  }
};
var generatorFinalChunks = async function* (final, index, generators) {
  if (final === void 0) {
    return;
  }
  for await (const finalChunk of final()) {
    yield* transformChunk(finalChunk, generators, index + 1);
  }
};
var destroyTransform = (0, import_node_util7.callbackify)(async ({ currentIterable }, error) => {
  if (currentIterable !== void 0) {
    await (error ? currentIterable.throw(error) : currentIterable.return());
    return;
  }
  if (error) {
    throw error;
  }
});
var identityGenerator = function* (chunk) {
  yield chunk;
};

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/transform/run-sync.js
var pushChunksSync = (getChunksSync, getChunksArguments, transformStream, done) => {
  try {
    for (const chunk of getChunksSync(...getChunksArguments)) {
      transformStream.push(chunk);
    }
    done();
  } catch (error) {
    done(error);
  }
};
var runTransformSync = (generators, chunks) => [
  ...chunks.flatMap((chunk) => [...transformChunkSync(chunk, generators, 0)]),
  ...finalChunksSync(generators)
];
var transformChunkSync = function* (chunk, generators, index) {
  if (index === generators.length) {
    yield chunk;
    return;
  }
  const { transform = identityGenerator2 } = generators[index];
  for (const transformedChunk of transform(chunk)) {
    yield* transformChunkSync(transformedChunk, generators, index + 1);
  }
};
var finalChunksSync = function* (generators) {
  for (const [index, { final }] of Object.entries(generators)) {
    yield* generatorFinalChunksSync(final, Number(index), generators);
  }
};
var generatorFinalChunksSync = function* (final, index, generators) {
  if (final === void 0) {
    return;
  }
  for (const finalChunk of final()) {
    yield* transformChunkSync(finalChunk, generators, index + 1);
  }
};
var identityGenerator2 = function* (chunk) {
  yield chunk;
};

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/transform/generator.js
var generatorToStream = ({
  value,
  value: { transform, final, writableObjectMode, readableObjectMode },
  optionName
}, { encoding }) => {
  const state = {};
  const generators = addInternalGenerators(value, encoding, optionName);
  const transformAsync = isAsyncGenerator(transform);
  const finalAsync = isAsyncGenerator(final);
  const transformMethod = transformAsync ? pushChunks.bind(void 0, transformChunk, state) : pushChunksSync.bind(void 0, transformChunkSync);
  const finalMethod = transformAsync || finalAsync ? pushChunks.bind(void 0, finalChunks, state) : pushChunksSync.bind(void 0, finalChunksSync);
  const destroyMethod = transformAsync || finalAsync ? destroyTransform.bind(void 0, state) : void 0;
  const stream2 = new import_node_stream.Transform({
    writableObjectMode,
    writableHighWaterMark: (0, import_node_stream.getDefaultHighWaterMark)(writableObjectMode),
    readableObjectMode,
    readableHighWaterMark: (0, import_node_stream.getDefaultHighWaterMark)(readableObjectMode),
    transform(chunk, encoding2, done) {
      transformMethod([chunk, generators, 0], this, done);
    },
    flush(done) {
      finalMethod([generators], this, done);
    },
    destroy: destroyMethod
  });
  return { stream: stream2 };
};
var runGeneratorsSync = (chunks, stdioItems, encoding, isInput) => {
  const generators = stdioItems.filter(({ type }) => type === "generator");
  const reversedGenerators = isInput ? generators.reverse() : generators;
  for (const { value, optionName } of reversedGenerators) {
    const generators2 = addInternalGenerators(value, encoding, optionName);
    chunks = runTransformSync(generators2, chunks);
  }
  return chunks;
};
var addInternalGenerators = ({ transform, final, binary, writableObjectMode, readableObjectMode, preserveNewlines }, encoding, optionName) => {
  const state = {};
  return [
    { transform: getValidateTransformInput(writableObjectMode, optionName) },
    getEncodingTransformGenerator(binary, encoding, writableObjectMode),
    getSplitLinesGenerator(binary, preserveNewlines, writableObjectMode, state),
    { transform, final },
    { transform: getValidateTransformReturn(readableObjectMode, optionName) },
    getAppendNewlineGenerator({
      binary,
      preserveNewlines,
      readableObjectMode,
      state
    })
  ].filter(Boolean);
};

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/io/input-sync.js
var addInputOptionsSync = (fileDescriptors, options) => {
  for (const fdNumber of getInputFdNumbers(fileDescriptors)) {
    addInputOptionSync(fileDescriptors, fdNumber, options);
  }
};
var getInputFdNumbers = (fileDescriptors) => new Set(Object.entries(fileDescriptors).filter(([, { direction }]) => direction === "input").map(([fdNumber]) => Number(fdNumber)));
var addInputOptionSync = (fileDescriptors, fdNumber, options) => {
  const { stdioItems } = fileDescriptors[fdNumber];
  const allStdioItems = stdioItems.filter(({ contents }) => contents !== void 0);
  if (allStdioItems.length === 0) {
    return;
  }
  if (fdNumber !== 0) {
    const [{ type, optionName }] = allStdioItems;
    throw new TypeError(`Only the \`stdin\` option, not \`${optionName}\`, can be ${TYPE_TO_MESSAGE[type]} with synchronous methods.`);
  }
  const allContents = allStdioItems.map(({ contents }) => contents);
  const transformedContents = allContents.map((contents) => applySingleInputGeneratorsSync(contents, stdioItems));
  options.input = joinToUint8Array(transformedContents);
};
var applySingleInputGeneratorsSync = (contents, stdioItems) => {
  const newContents = runGeneratorsSync(contents, stdioItems, "utf8", true);
  validateSerializable(newContents);
  return joinToUint8Array(newContents);
};
var validateSerializable = (newContents) => {
  const invalidItem = newContents.find((item) => typeof item !== "string" && !isUint8Array(item));
  if (invalidItem !== void 0) {
    throw new TypeError(`The \`stdin\` option is invalid: when passing objects as input, a transform must be used to serialize them to strings or Uint8Arrays: ${invalidItem}.`);
  }
};

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/io/output-sync.js
var import_node_fs12 = require("node:fs");

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/verbose/output.js
var shouldLogOutput = ({ stdioItems, encoding, verboseInfo, fdNumber }) => fdNumber !== "all" && isFullVerbose(verboseInfo, fdNumber) && !BINARY_ENCODINGS.has(encoding) && fdUsesVerbose(fdNumber) && (stdioItems.some(({ type, value }) => type === "native" && PIPED_STDIO_VALUES.has(value)) || stdioItems.every(({ type }) => TRANSFORM_TYPES.has(type)));
var fdUsesVerbose = (fdNumber) => fdNumber === 1 || fdNumber === 2;
var PIPED_STDIO_VALUES = /* @__PURE__ */ new Set(["pipe", "overlapped"]);
var logLines = async (linesIterable, stream2, fdNumber, verboseInfo) => {
  for await (const line of linesIterable) {
    if (!isPipingStream(stream2)) {
      logLine(line, fdNumber, verboseInfo);
    }
  }
};
var logLinesSync = (linesArray, fdNumber, verboseInfo) => {
  for (const line of linesArray) {
    logLine(line, fdNumber, verboseInfo);
  }
};
var isPipingStream = (stream2) => stream2._readableState.pipes.length > 0;
var logLine = (line, fdNumber, verboseInfo) => {
  const verboseMessage = serializeVerboseMessage(line);
  verboseLog({
    type: "output",
    verboseMessage,
    fdNumber,
    verboseInfo
  });
};

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/io/output-sync.js
var transformOutputSync = ({ fileDescriptors, syncResult: { output }, options, isMaxBuffer, verboseInfo }) => {
  if (output === null) {
    return { output: Array.from({ length: 3 }) };
  }
  const state = {};
  const outputFiles = /* @__PURE__ */ new Set([]);
  const transformedOutput = output.map((result, fdNumber) => transformOutputResultSync({
    result,
    fileDescriptors,
    fdNumber,
    state,
    outputFiles,
    isMaxBuffer,
    verboseInfo
  }, options));
  return { output: transformedOutput, ...state };
};
var transformOutputResultSync = ({ result, fileDescriptors, fdNumber, state, outputFiles, isMaxBuffer, verboseInfo }, { buffer, encoding, lines, stripFinalNewline: stripFinalNewline2, maxBuffer }) => {
  if (result === null) {
    return;
  }
  const truncatedResult = truncateMaxBufferSync(result, isMaxBuffer, maxBuffer);
  const uint8ArrayResult = bufferToUint8Array(truncatedResult);
  const { stdioItems, objectMode } = fileDescriptors[fdNumber];
  const chunks = runOutputGeneratorsSync([uint8ArrayResult], stdioItems, encoding, state);
  const { serializedResult, finalResult = serializedResult } = serializeChunks({
    chunks,
    objectMode,
    encoding,
    lines,
    stripFinalNewline: stripFinalNewline2,
    fdNumber
  });
  logOutputSync({
    serializedResult,
    fdNumber,
    state,
    verboseInfo,
    encoding,
    stdioItems,
    objectMode
  });
  const returnedResult = buffer[fdNumber] ? finalResult : void 0;
  try {
    if (state.error === void 0) {
      writeToFiles(serializedResult, stdioItems, outputFiles);
    }
    return returnedResult;
  } catch (error) {
    state.error = error;
    return returnedResult;
  }
};
var runOutputGeneratorsSync = (chunks, stdioItems, encoding, state) => {
  try {
    return runGeneratorsSync(chunks, stdioItems, encoding, false);
  } catch (error) {
    state.error = error;
    return chunks;
  }
};
var serializeChunks = ({ chunks, objectMode, encoding, lines, stripFinalNewline: stripFinalNewline2, fdNumber }) => {
  if (objectMode) {
    return { serializedResult: chunks };
  }
  if (encoding === "buffer") {
    return { serializedResult: joinToUint8Array(chunks) };
  }
  const serializedResult = joinToString(chunks, encoding);
  if (lines[fdNumber]) {
    return { serializedResult, finalResult: splitLinesSync(serializedResult, !stripFinalNewline2[fdNumber], objectMode) };
  }
  return { serializedResult };
};
var logOutputSync = ({ serializedResult, fdNumber, state, verboseInfo, encoding, stdioItems, objectMode }) => {
  if (!shouldLogOutput({
    stdioItems,
    encoding,
    verboseInfo,
    fdNumber
  })) {
    return;
  }
  const linesArray = splitLinesSync(serializedResult, false, objectMode);
  try {
    logLinesSync(linesArray, fdNumber, verboseInfo);
  } catch (error) {
    state.error ??= error;
  }
};
var writeToFiles = (serializedResult, stdioItems, outputFiles) => {
  for (const { path: path19, append } of stdioItems.filter(({ type }) => FILE_TYPES.has(type))) {
    const pathString = typeof path19 === "string" ? path19 : path19.toString();
    if (append || outputFiles.has(pathString)) {
      (0, import_node_fs12.appendFileSync)(path19, serializedResult);
    } else {
      outputFiles.add(pathString);
      (0, import_node_fs12.writeFileSync)(path19, serializedResult);
    }
  }
};

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/resolve/all-sync.js
var getAllSync = ([, stdout, stderr], options) => {
  if (!options.all) {
    return;
  }
  if (stdout === void 0) {
    return stderr;
  }
  if (stderr === void 0) {
    return stdout;
  }
  if (Array.isArray(stdout)) {
    return Array.isArray(stderr) ? [...stdout, ...stderr] : [...stdout, stripNewline(stderr, options, "all")];
  }
  if (Array.isArray(stderr)) {
    return [stripNewline(stdout, options, "all"), ...stderr];
  }
  if (isUint8Array(stdout) && isUint8Array(stderr)) {
    return concatUint8Arrays([stdout, stderr]);
  }
  return `${stdout}${stderr}`;
};

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/resolve/exit-async.js
var import_node_events7 = require("node:events");
var waitForExit = async (subprocess, context) => {
  const [exitCode, signal] = await waitForExitOrError(subprocess);
  context.isForcefullyTerminated ??= false;
  return [exitCode, signal];
};
var waitForExitOrError = async (subprocess) => {
  const [spawnPayload, exitPayload] = await Promise.allSettled([
    (0, import_node_events7.once)(subprocess, "spawn"),
    (0, import_node_events7.once)(subprocess, "exit")
  ]);
  if (spawnPayload.status === "rejected") {
    return [];
  }
  return exitPayload.status === "rejected" ? waitForSubprocessExit(subprocess) : exitPayload.value;
};
var waitForSubprocessExit = async (subprocess) => {
  try {
    return await (0, import_node_events7.once)(subprocess, "exit");
  } catch {
    return waitForSubprocessExit(subprocess);
  }
};
var waitForSuccessfulExit = async (exitPromise) => {
  const [exitCode, signal] = await exitPromise;
  if (!isSubprocessErrorExit(exitCode, signal) && isFailedExit(exitCode, signal)) {
    throw new DiscardedError();
  }
  return [exitCode, signal];
};
var isSubprocessErrorExit = (exitCode, signal) => exitCode === void 0 && signal === void 0;
var isFailedExit = (exitCode, signal) => exitCode !== 0 || signal !== null;

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/resolve/exit-sync.js
var getExitResultSync = ({ error, status: exitCode, signal, output }, { maxBuffer }) => {
  const resultError = getResultError(error, exitCode, signal);
  const timedOut = resultError?.code === "ETIMEDOUT";
  const isMaxBuffer = isMaxBufferSync(resultError, output, maxBuffer);
  return {
    resultError,
    exitCode,
    signal,
    timedOut,
    isMaxBuffer
  };
};
var getResultError = (error, exitCode, signal) => {
  if (error !== void 0) {
    return error;
  }
  return isFailedExit(exitCode, signal) ? new DiscardedError() : void 0;
};

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/methods/main-sync.js
var execaCoreSync = (rawFile, rawArguments, rawOptions) => {
  const { file, commandArguments, command, escapedCommand, startTime, verboseInfo, options, fileDescriptors } = handleSyncArguments(rawFile, rawArguments, rawOptions);
  const result = spawnSubprocessSync({
    file,
    commandArguments,
    options,
    command,
    escapedCommand,
    verboseInfo,
    fileDescriptors,
    startTime
  });
  return handleResult(result, verboseInfo, options);
};
var handleSyncArguments = (rawFile, rawArguments, rawOptions) => {
  const { command, escapedCommand, startTime, verboseInfo } = handleCommand(rawFile, rawArguments, rawOptions);
  const syncOptions = normalizeSyncOptions(rawOptions);
  const { file, commandArguments, options } = normalizeOptions(rawFile, rawArguments, syncOptions);
  validateSyncOptions(options);
  const fileDescriptors = handleStdioSync(options, verboseInfo);
  return {
    file,
    commandArguments,
    command,
    escapedCommand,
    startTime,
    verboseInfo,
    options,
    fileDescriptors
  };
};
var normalizeSyncOptions = (options) => options.node && !options.ipc ? { ...options, ipc: false } : options;
var validateSyncOptions = ({ ipc, ipcInput, detached, cancelSignal }) => {
  if (ipcInput) {
    throwInvalidSyncOption("ipcInput");
  }
  if (ipc) {
    throwInvalidSyncOption("ipc: true");
  }
  if (detached) {
    throwInvalidSyncOption("detached: true");
  }
  if (cancelSignal) {
    throwInvalidSyncOption("cancelSignal");
  }
};
var throwInvalidSyncOption = (value) => {
  throw new TypeError(`The "${value}" option cannot be used with synchronous methods.`);
};
var spawnSubprocessSync = ({ file, commandArguments, options, command, escapedCommand, verboseInfo, fileDescriptors, startTime }) => {
  const syncResult = runSubprocessSync({
    file,
    commandArguments,
    options,
    command,
    escapedCommand,
    fileDescriptors,
    startTime
  });
  if (syncResult.failed) {
    return syncResult;
  }
  const { resultError, exitCode, signal, timedOut, isMaxBuffer } = getExitResultSync(syncResult, options);
  const { output, error = resultError } = transformOutputSync({
    fileDescriptors,
    syncResult,
    options,
    isMaxBuffer,
    verboseInfo
  });
  const stdio = output.map((stdioOutput, fdNumber) => stripNewline(stdioOutput, options, fdNumber));
  const all = stripNewline(getAllSync(output, options), options, "all");
  return getSyncResult({
    error,
    exitCode,
    signal,
    timedOut,
    isMaxBuffer,
    stdio,
    all,
    options,
    command,
    escapedCommand,
    startTime
  });
};
var runSubprocessSync = ({ file, commandArguments, options, command, escapedCommand, fileDescriptors, startTime }) => {
  try {
    addInputOptionsSync(fileDescriptors, options);
    const normalizedOptions = normalizeSpawnSyncOptions(options);
    return (0, import_node_child_process4.spawnSync)(...concatenateShell(file, commandArguments, normalizedOptions));
  } catch (error) {
    return makeEarlyError({
      error,
      command,
      escapedCommand,
      fileDescriptors,
      options,
      startTime,
      isSync: true
    });
  }
};
var normalizeSpawnSyncOptions = ({ encoding, maxBuffer, ...options }) => ({ ...options, encoding: "buffer", maxBuffer: getMaxBufferSync(maxBuffer) });
var getSyncResult = ({ error, exitCode, signal, timedOut, isMaxBuffer, stdio, all, options, command, escapedCommand, startTime }) => error === void 0 ? makeSuccessResult({
  command,
  escapedCommand,
  stdio,
  all,
  ipcOutput: [],
  options,
  startTime
}) : makeError({
  error,
  command,
  escapedCommand,
  timedOut,
  isCanceled: false,
  isGracefullyCanceled: false,
  isMaxBuffer,
  isForcefullyTerminated: false,
  exitCode,
  signal,
  stdio,
  all,
  ipcOutput: [],
  options,
  startTime,
  isSync: true
});

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/methods/main-async.js
var import_node_events14 = require("node:events");
var import_node_child_process6 = require("node:child_process");

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/ipc/methods.js
var import_node_process10 = __toESM(require("node:process"), 1);

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/ipc/get-one.js
var import_node_events8 = require("node:events");
var getOneMessage = ({ anyProcess, channel, isSubprocess, ipc }, { reference = true, filter } = {}) => {
  validateIpcMethod({
    methodName: "getOneMessage",
    isSubprocess,
    ipc,
    isConnected: isConnected(anyProcess)
  });
  return getOneMessageAsync({
    anyProcess,
    channel,
    isSubprocess,
    filter,
    reference
  });
};
var getOneMessageAsync = async ({ anyProcess, channel, isSubprocess, filter, reference }) => {
  addReference(channel, reference);
  const ipcEmitter = getIpcEmitter(anyProcess, channel, isSubprocess);
  const controller = new AbortController();
  try {
    return await Promise.race([
      getMessage(ipcEmitter, filter, controller),
      throwOnDisconnect2(ipcEmitter, isSubprocess, controller),
      throwOnStrictError(ipcEmitter, isSubprocess, controller)
    ]);
  } catch (error) {
    disconnect(anyProcess);
    throw error;
  } finally {
    controller.abort();
    removeReference(channel, reference);
  }
};
var getMessage = async (ipcEmitter, filter, { signal }) => {
  if (filter === void 0) {
    const [message] = await (0, import_node_events8.once)(ipcEmitter, "message", { signal });
    return message;
  }
  for await (const [message] of (0, import_node_events8.on)(ipcEmitter, "message", { signal })) {
    if (filter(message)) {
      return message;
    }
  }
};
var throwOnDisconnect2 = async (ipcEmitter, isSubprocess, { signal }) => {
  await (0, import_node_events8.once)(ipcEmitter, "disconnect", { signal });
  throwOnEarlyDisconnect(isSubprocess);
};
var throwOnStrictError = async (ipcEmitter, isSubprocess, { signal }) => {
  const [error] = await (0, import_node_events8.once)(ipcEmitter, "strict:error", { signal });
  throw getStrictResponseError(error, isSubprocess);
};

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/ipc/get-each.js
var import_node_events9 = require("node:events");
var getEachMessage = ({ anyProcess, channel, isSubprocess, ipc }, { reference = true } = {}) => loopOnMessages({
  anyProcess,
  channel,
  isSubprocess,
  ipc,
  shouldAwait: !isSubprocess,
  reference
});
var loopOnMessages = ({ anyProcess, channel, isSubprocess, ipc, shouldAwait, reference }) => {
  validateIpcMethod({
    methodName: "getEachMessage",
    isSubprocess,
    ipc,
    isConnected: isConnected(anyProcess)
  });
  addReference(channel, reference);
  const ipcEmitter = getIpcEmitter(anyProcess, channel, isSubprocess);
  const controller = new AbortController();
  const state = {};
  stopOnDisconnect(anyProcess, ipcEmitter, controller);
  abortOnStrictError({
    ipcEmitter,
    isSubprocess,
    controller,
    state
  });
  return iterateOnMessages({
    anyProcess,
    channel,
    ipcEmitter,
    isSubprocess,
    shouldAwait,
    controller,
    state,
    reference
  });
};
var stopOnDisconnect = async (anyProcess, ipcEmitter, controller) => {
  try {
    await (0, import_node_events9.once)(ipcEmitter, "disconnect", { signal: controller.signal });
    controller.abort();
  } catch {
  }
};
var abortOnStrictError = async ({ ipcEmitter, isSubprocess, controller, state }) => {
  try {
    const [error] = await (0, import_node_events9.once)(ipcEmitter, "strict:error", { signal: controller.signal });
    state.error = getStrictResponseError(error, isSubprocess);
    controller.abort();
  } catch {
  }
};
var iterateOnMessages = async function* ({ anyProcess, channel, ipcEmitter, isSubprocess, shouldAwait, controller, state, reference }) {
  try {
    for await (const [message] of (0, import_node_events9.on)(ipcEmitter, "message", { signal: controller.signal })) {
      throwIfStrictError(state);
      yield message;
    }
  } catch {
    throwIfStrictError(state);
  } finally {
    controller.abort();
    removeReference(channel, reference);
    if (!isSubprocess) {
      disconnect(anyProcess);
    }
    if (shouldAwait) {
      await anyProcess;
    }
  }
};
var throwIfStrictError = ({ error }) => {
  if (error) {
    throw error;
  }
};

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/ipc/methods.js
var addIpcMethods = (subprocess, { ipc }) => {
  Object.assign(subprocess, getIpcMethods(subprocess, false, ipc));
};
var getIpcExport = () => {
  const anyProcess = import_node_process10.default;
  const isSubprocess = true;
  const ipc = import_node_process10.default.channel !== void 0;
  return {
    ...getIpcMethods(anyProcess, isSubprocess, ipc),
    getCancelSignal: getCancelSignal.bind(void 0, {
      anyProcess,
      channel: anyProcess.channel,
      isSubprocess,
      ipc
    })
  };
};
var getIpcMethods = (anyProcess, isSubprocess, ipc) => ({
  sendMessage: sendMessage.bind(void 0, {
    anyProcess,
    channel: anyProcess.channel,
    isSubprocess,
    ipc
  }),
  getOneMessage: getOneMessage.bind(void 0, {
    anyProcess,
    channel: anyProcess.channel,
    isSubprocess,
    ipc
  }),
  getEachMessage: getEachMessage.bind(void 0, {
    anyProcess,
    channel: anyProcess.channel,
    isSubprocess,
    ipc
  })
});

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/return/early-error.js
var import_node_child_process5 = require("node:child_process");
var import_node_stream2 = require("node:stream");
var handleEarlyError = ({ error, command, escapedCommand, fileDescriptors, options, startTime, verboseInfo }) => {
  cleanupCustomStreams(fileDescriptors);
  const subprocess = new import_node_child_process5.ChildProcess();
  createDummyStreams(subprocess, fileDescriptors);
  Object.assign(subprocess, { readable, writable, duplex });
  const earlyError = makeEarlyError({
    error,
    command,
    escapedCommand,
    fileDescriptors,
    options,
    startTime,
    isSync: false
  });
  const promise = handleDummyPromise(earlyError, verboseInfo, options);
  return { subprocess, promise };
};
var createDummyStreams = (subprocess, fileDescriptors) => {
  const stdin = createDummyStream();
  const stdout = createDummyStream();
  const stderr = createDummyStream();
  const extraStdio = Array.from({ length: fileDescriptors.length - 3 }, createDummyStream);
  const all = createDummyStream();
  const stdio = [stdin, stdout, stderr, ...extraStdio];
  Object.assign(subprocess, {
    stdin,
    stdout,
    stderr,
    all,
    stdio
  });
};
var createDummyStream = () => {
  const stream2 = new import_node_stream2.PassThrough();
  stream2.end();
  return stream2;
};
var readable = () => new import_node_stream2.Readable({ read() {
} });
var writable = () => new import_node_stream2.Writable({ write() {
} });
var duplex = () => new import_node_stream2.Duplex({ read() {
}, write() {
} });
var handleDummyPromise = async (error, verboseInfo, options) => handleResult(error, verboseInfo, options);

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/stdio/handle-async.js
var import_node_fs13 = require("node:fs");
var import_node_buffer3 = require("node:buffer");
var import_node_stream3 = require("node:stream");
var handleStdioAsync = (options, verboseInfo) => handleStdio(addPropertiesAsync, options, verboseInfo, false);
var forbiddenIfAsync = ({ type, optionName }) => {
  throw new TypeError(`The \`${optionName}\` option cannot be ${TYPE_TO_MESSAGE[type]}.`);
};
var addProperties2 = {
  fileNumber: forbiddenIfAsync,
  generator: generatorToStream,
  asyncGenerator: generatorToStream,
  nodeStream: ({ value }) => ({ stream: value }),
  webTransform({ value: { transform, writableObjectMode, readableObjectMode } }) {
    const objectMode = writableObjectMode || readableObjectMode;
    const stream2 = import_node_stream3.Duplex.fromWeb(transform, { objectMode });
    return { stream: stream2 };
  },
  duplex: ({ value: { transform } }) => ({ stream: transform }),
  native() {
  }
};
var addPropertiesAsync = {
  input: {
    ...addProperties2,
    fileUrl: ({ value }) => ({ stream: (0, import_node_fs13.createReadStream)(value) }),
    filePath: ({ value: { file } }) => ({ stream: (0, import_node_fs13.createReadStream)(file) }),
    webStream: ({ value }) => ({ stream: import_node_stream3.Readable.fromWeb(value) }),
    iterable: ({ value }) => ({ stream: import_node_stream3.Readable.from(value) }),
    asyncIterable: ({ value }) => ({ stream: import_node_stream3.Readable.from(value) }),
    string: ({ value }) => ({ stream: import_node_stream3.Readable.from(value) }),
    uint8Array: ({ value }) => ({ stream: import_node_stream3.Readable.from(import_node_buffer3.Buffer.from(value)) })
  },
  output: {
    ...addProperties2,
    fileUrl: ({ value }) => ({ stream: (0, import_node_fs13.createWriteStream)(value) }),
    filePath: ({ value: { file, append } }) => ({ stream: (0, import_node_fs13.createWriteStream)(file, append ? { flags: "a" } : {}) }),
    webStream: ({ value }) => ({ stream: import_node_stream3.Writable.fromWeb(value) }),
    iterable: forbiddenIfAsync,
    asyncIterable: forbiddenIfAsync,
    string: forbiddenIfAsync,
    uint8Array: forbiddenIfAsync
  }
};

// ../../node_modules/.pnpm/@sindresorhus+merge-streams@4.0.0/node_modules/@sindresorhus/merge-streams/index.js
var import_node_events10 = require("node:events");
var import_node_stream4 = require("node:stream");
var import_promises6 = require("node:stream/promises");
function mergeStreams(streams) {
  if (!Array.isArray(streams)) {
    throw new TypeError(`Expected an array, got \`${typeof streams}\`.`);
  }
  for (const stream2 of streams) {
    validateStream(stream2);
  }
  const objectMode = streams.some(({ readableObjectMode }) => readableObjectMode);
  const highWaterMark = getHighWaterMark(streams, objectMode);
  const passThroughStream = new MergedStream({
    objectMode,
    writableHighWaterMark: highWaterMark,
    readableHighWaterMark: highWaterMark
  });
  for (const stream2 of streams) {
    passThroughStream.add(stream2);
  }
  return passThroughStream;
}
var getHighWaterMark = (streams, objectMode) => {
  if (streams.length === 0) {
    return (0, import_node_stream4.getDefaultHighWaterMark)(objectMode);
  }
  const highWaterMarks = streams.filter(({ readableObjectMode }) => readableObjectMode === objectMode).map(({ readableHighWaterMark }) => readableHighWaterMark);
  return Math.max(...highWaterMarks);
};
var MergedStream = class extends import_node_stream4.PassThrough {
  #streams = /* @__PURE__ */ new Set([]);
  #ended = /* @__PURE__ */ new Set([]);
  #aborted = /* @__PURE__ */ new Set([]);
  #onFinished;
  #unpipeEvent = Symbol("unpipe");
  #streamPromises = /* @__PURE__ */ new WeakMap();
  add(stream2) {
    validateStream(stream2);
    if (this.#streams.has(stream2)) {
      return;
    }
    this.#streams.add(stream2);
    this.#onFinished ??= onMergedStreamFinished(this, this.#streams, this.#unpipeEvent);
    const streamPromise = endWhenStreamsDone({
      passThroughStream: this,
      stream: stream2,
      streams: this.#streams,
      ended: this.#ended,
      aborted: this.#aborted,
      onFinished: this.#onFinished,
      unpipeEvent: this.#unpipeEvent
    });
    this.#streamPromises.set(stream2, streamPromise);
    stream2.pipe(this, { end: false });
  }
  async remove(stream2) {
    validateStream(stream2);
    if (!this.#streams.has(stream2)) {
      return false;
    }
    const streamPromise = this.#streamPromises.get(stream2);
    if (streamPromise === void 0) {
      return false;
    }
    this.#streamPromises.delete(stream2);
    stream2.unpipe(this);
    await streamPromise;
    return true;
  }
};
var onMergedStreamFinished = async (passThroughStream, streams, unpipeEvent) => {
  updateMaxListeners(passThroughStream, PASSTHROUGH_LISTENERS_COUNT);
  const controller = new AbortController();
  try {
    await Promise.race([
      onMergedStreamEnd(passThroughStream, controller),
      onInputStreamsUnpipe(passThroughStream, streams, unpipeEvent, controller)
    ]);
  } finally {
    controller.abort();
    updateMaxListeners(passThroughStream, -PASSTHROUGH_LISTENERS_COUNT);
  }
};
var onMergedStreamEnd = async (passThroughStream, { signal }) => {
  try {
    await (0, import_promises6.finished)(passThroughStream, { signal, cleanup: true });
  } catch (error) {
    errorOrAbortStream(passThroughStream, error);
    throw error;
  }
};
var onInputStreamsUnpipe = async (passThroughStream, streams, unpipeEvent, { signal }) => {
  for await (const [unpipedStream] of (0, import_node_events10.on)(passThroughStream, "unpipe", { signal })) {
    if (streams.has(unpipedStream)) {
      unpipedStream.emit(unpipeEvent);
    }
  }
};
var validateStream = (stream2) => {
  if (typeof stream2?.pipe !== "function") {
    throw new TypeError(`Expected a readable stream, got: \`${typeof stream2}\`.`);
  }
};
var endWhenStreamsDone = async ({ passThroughStream, stream: stream2, streams, ended, aborted: aborted2, onFinished, unpipeEvent }) => {
  updateMaxListeners(passThroughStream, PASSTHROUGH_LISTENERS_PER_STREAM);
  const controller = new AbortController();
  try {
    await Promise.race([
      afterMergedStreamFinished(onFinished, stream2, controller),
      onInputStreamEnd({
        passThroughStream,
        stream: stream2,
        streams,
        ended,
        aborted: aborted2,
        controller
      }),
      onInputStreamUnpipe({
        stream: stream2,
        streams,
        ended,
        aborted: aborted2,
        unpipeEvent,
        controller
      })
    ]);
  } finally {
    controller.abort();
    updateMaxListeners(passThroughStream, -PASSTHROUGH_LISTENERS_PER_STREAM);
  }
  if (streams.size > 0 && streams.size === ended.size + aborted2.size) {
    if (ended.size === 0 && aborted2.size > 0) {
      abortStream(passThroughStream);
    } else {
      endStream(passThroughStream);
    }
  }
};
var afterMergedStreamFinished = async (onFinished, stream2, { signal }) => {
  try {
    await onFinished;
    if (!signal.aborted) {
      abortStream(stream2);
    }
  } catch (error) {
    if (!signal.aborted) {
      errorOrAbortStream(stream2, error);
    }
  }
};
var onInputStreamEnd = async ({ passThroughStream, stream: stream2, streams, ended, aborted: aborted2, controller: { signal } }) => {
  try {
    await (0, import_promises6.finished)(stream2, {
      signal,
      cleanup: true,
      readable: true,
      writable: false
    });
    if (streams.has(stream2)) {
      ended.add(stream2);
    }
  } catch (error) {
    if (signal.aborted || !streams.has(stream2)) {
      return;
    }
    if (isAbortError(error)) {
      aborted2.add(stream2);
    } else {
      errorStream(passThroughStream, error);
    }
  }
};
var onInputStreamUnpipe = async ({ stream: stream2, streams, ended, aborted: aborted2, unpipeEvent, controller: { signal } }) => {
  await (0, import_node_events10.once)(stream2, unpipeEvent, { signal });
  if (!stream2.readable) {
    return (0, import_node_events10.once)(signal, "abort", { signal });
  }
  streams.delete(stream2);
  ended.delete(stream2);
  aborted2.delete(stream2);
};
var endStream = (stream2) => {
  if (stream2.writable) {
    stream2.end();
  }
};
var errorOrAbortStream = (stream2, error) => {
  if (isAbortError(error)) {
    abortStream(stream2);
  } else {
    errorStream(stream2, error);
  }
};
var isAbortError = (error) => error?.code === "ERR_STREAM_PREMATURE_CLOSE";
var abortStream = (stream2) => {
  if (stream2.readable || stream2.writable) {
    stream2.destroy();
  }
};
var errorStream = (stream2, error) => {
  if (!stream2.destroyed) {
    stream2.once("error", noop2);
    stream2.destroy(error);
  }
};
var noop2 = () => {
};
var updateMaxListeners = (passThroughStream, increment2) => {
  const maxListeners = passThroughStream.getMaxListeners();
  if (maxListeners !== 0 && maxListeners !== Number.POSITIVE_INFINITY) {
    passThroughStream.setMaxListeners(maxListeners + increment2);
  }
};
var PASSTHROUGH_LISTENERS_COUNT = 2;
var PASSTHROUGH_LISTENERS_PER_STREAM = 1;

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/io/pipeline.js
var import_promises7 = require("node:stream/promises");
var pipeStreams = (source, destination) => {
  source.pipe(destination);
  onSourceFinish(source, destination);
  onDestinationFinish(source, destination);
};
var onSourceFinish = async (source, destination) => {
  if (isStandardStream(source) || isStandardStream(destination)) {
    return;
  }
  try {
    await (0, import_promises7.finished)(source, { cleanup: true, readable: true, writable: false });
  } catch {
  }
  endDestinationStream(destination);
};
var endDestinationStream = (destination) => {
  if (destination.writable) {
    destination.end();
  }
};
var onDestinationFinish = async (source, destination) => {
  if (isStandardStream(source) || isStandardStream(destination)) {
    return;
  }
  try {
    await (0, import_promises7.finished)(destination, { cleanup: true, readable: false, writable: true });
  } catch {
  }
  abortSourceStream(source);
};
var abortSourceStream = (source) => {
  if (source.readable) {
    source.destroy();
  }
};

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/io/output-async.js
var pipeOutputAsync = (subprocess, fileDescriptors, controller) => {
  const pipeGroups = /* @__PURE__ */ new Map();
  for (const [fdNumber, { stdioItems, direction }] of Object.entries(fileDescriptors)) {
    for (const { stream: stream2 } of stdioItems.filter(({ type }) => TRANSFORM_TYPES.has(type))) {
      pipeTransform(subprocess, stream2, direction, fdNumber);
    }
    for (const { stream: stream2 } of stdioItems.filter(({ type }) => !TRANSFORM_TYPES.has(type))) {
      pipeStdioItem({
        subprocess,
        stream: stream2,
        direction,
        fdNumber,
        pipeGroups,
        controller
      });
    }
  }
  for (const [outputStream, inputStreams] of pipeGroups.entries()) {
    const inputStream = inputStreams.length === 1 ? inputStreams[0] : mergeStreams(inputStreams);
    pipeStreams(inputStream, outputStream);
  }
};
var pipeTransform = (subprocess, stream2, direction, fdNumber) => {
  if (direction === "output") {
    pipeStreams(subprocess.stdio[fdNumber], stream2);
  } else {
    pipeStreams(stream2, subprocess.stdio[fdNumber]);
  }
  const streamProperty = SUBPROCESS_STREAM_PROPERTIES[fdNumber];
  if (streamProperty !== void 0) {
    subprocess[streamProperty] = stream2;
  }
  subprocess.stdio[fdNumber] = stream2;
};
var SUBPROCESS_STREAM_PROPERTIES = ["stdin", "stdout", "stderr"];
var pipeStdioItem = ({ subprocess, stream: stream2, direction, fdNumber, pipeGroups, controller }) => {
  if (stream2 === void 0) {
    return;
  }
  setStandardStreamMaxListeners(stream2, controller);
  const [inputStream, outputStream] = direction === "output" ? [stream2, subprocess.stdio[fdNumber]] : [subprocess.stdio[fdNumber], stream2];
  const outputStreams = pipeGroups.get(inputStream) ?? [];
  pipeGroups.set(inputStream, [...outputStreams, outputStream]);
};
var setStandardStreamMaxListeners = (stream2, { signal }) => {
  if (isStandardStream(stream2)) {
    incrementMaxListeners(stream2, MAX_LISTENERS_INCREMENT, signal);
  }
};
var MAX_LISTENERS_INCREMENT = 2;

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/terminate/cleanup.js
var import_node_events11 = require("node:events");

// ../../node_modules/.pnpm/signal-exit@4.1.0/node_modules/signal-exit/dist/mjs/signals.js
var signals = [];
signals.push("SIGHUP", "SIGINT", "SIGTERM");
if (process.platform !== "win32") {
  signals.push(
    "SIGALRM",
    "SIGABRT",
    "SIGVTALRM",
    "SIGXCPU",
    "SIGXFSZ",
    "SIGUSR2",
    "SIGTRAP",
    "SIGSYS",
    "SIGQUIT",
    "SIGIOT"
    // should detect profiler and enable/disable accordingly.
    // see #21
    // 'SIGPROF'
  );
}
if (process.platform === "linux") {
  signals.push("SIGIO", "SIGPOLL", "SIGPWR", "SIGSTKFLT");
}

// ../../node_modules/.pnpm/signal-exit@4.1.0/node_modules/signal-exit/dist/mjs/index.js
var processOk = (process10) => !!process10 && typeof process10 === "object" && typeof process10.removeListener === "function" && typeof process10.emit === "function" && typeof process10.reallyExit === "function" && typeof process10.listeners === "function" && typeof process10.kill === "function" && typeof process10.pid === "number" && typeof process10.on === "function";
var kExitEmitter = Symbol.for("signal-exit emitter");
var global2 = globalThis;
var ObjectDefineProperty = Object.defineProperty.bind(Object);
var Emitter = class {
  emitted = {
    afterExit: false,
    exit: false
  };
  listeners = {
    afterExit: [],
    exit: []
  };
  count = 0;
  id = Math.random();
  constructor() {
    if (global2[kExitEmitter]) {
      return global2[kExitEmitter];
    }
    ObjectDefineProperty(global2, kExitEmitter, {
      value: this,
      writable: false,
      enumerable: false,
      configurable: false
    });
  }
  on(ev, fn) {
    this.listeners[ev].push(fn);
  }
  removeListener(ev, fn) {
    const list = this.listeners[ev];
    const i2 = list.indexOf(fn);
    if (i2 === -1) {
      return;
    }
    if (i2 === 0 && list.length === 1) {
      list.length = 0;
    } else {
      list.splice(i2, 1);
    }
  }
  emit(ev, code, signal) {
    if (this.emitted[ev]) {
      return false;
    }
    this.emitted[ev] = true;
    let ret = false;
    for (const fn of this.listeners[ev]) {
      ret = fn(code, signal) === true || ret;
    }
    if (ev === "exit") {
      ret = this.emit("afterExit", code, signal) || ret;
    }
    return ret;
  }
};
var SignalExitBase = class {
};
var signalExitWrap = (handler) => {
  return {
    onExit(cb, opts) {
      return handler.onExit(cb, opts);
    },
    load() {
      return handler.load();
    },
    unload() {
      return handler.unload();
    }
  };
};
var SignalExitFallback = class extends SignalExitBase {
  onExit() {
    return () => {
    };
  }
  load() {
  }
  unload() {
  }
};
var SignalExit = class extends SignalExitBase {
  // "SIGHUP" throws an `ENOSYS` error on Windows,
  // so use a supported signal instead
  /* c8 ignore start */
  #hupSig = process9.platform === "win32" ? "SIGINT" : "SIGHUP";
  /* c8 ignore stop */
  #emitter = new Emitter();
  #process;
  #originalProcessEmit;
  #originalProcessReallyExit;
  #sigListeners = {};
  #loaded = false;
  constructor(process10) {
    super();
    this.#process = process10;
    this.#sigListeners = {};
    for (const sig of signals) {
      this.#sigListeners[sig] = () => {
        const listeners = this.#process.listeners(sig);
        let { count: count2 } = this.#emitter;
        const p = process10;
        if (typeof p.__signal_exit_emitter__ === "object" && typeof p.__signal_exit_emitter__.count === "number") {
          count2 += p.__signal_exit_emitter__.count;
        }
        if (listeners.length === count2) {
          this.unload();
          const ret = this.#emitter.emit("exit", null, sig);
          const s = sig === "SIGHUP" ? this.#hupSig : sig;
          if (!ret)
            process10.kill(process10.pid, s);
        }
      };
    }
    this.#originalProcessReallyExit = process10.reallyExit;
    this.#originalProcessEmit = process10.emit;
  }
  onExit(cb, opts) {
    if (!processOk(this.#process)) {
      return () => {
      };
    }
    if (this.#loaded === false) {
      this.load();
    }
    const ev = opts?.alwaysLast ? "afterExit" : "exit";
    this.#emitter.on(ev, cb);
    return () => {
      this.#emitter.removeListener(ev, cb);
      if (this.#emitter.listeners["exit"].length === 0 && this.#emitter.listeners["afterExit"].length === 0) {
        this.unload();
      }
    };
  }
  load() {
    if (this.#loaded) {
      return;
    }
    this.#loaded = true;
    this.#emitter.count += 1;
    for (const sig of signals) {
      try {
        const fn = this.#sigListeners[sig];
        if (fn)
          this.#process.on(sig, fn);
      } catch (_) {
      }
    }
    this.#process.emit = (ev, ...a2) => {
      return this.#processEmit(ev, ...a2);
    };
    this.#process.reallyExit = (code) => {
      return this.#processReallyExit(code);
    };
  }
  unload() {
    if (!this.#loaded) {
      return;
    }
    this.#loaded = false;
    signals.forEach((sig) => {
      const listener = this.#sigListeners[sig];
      if (!listener) {
        throw new Error("Listener not defined for signal: " + sig);
      }
      try {
        this.#process.removeListener(sig, listener);
      } catch (_) {
      }
    });
    this.#process.emit = this.#originalProcessEmit;
    this.#process.reallyExit = this.#originalProcessReallyExit;
    this.#emitter.count -= 1;
  }
  #processReallyExit(code) {
    if (!processOk(this.#process)) {
      return 0;
    }
    this.#process.exitCode = code || 0;
    this.#emitter.emit("exit", this.#process.exitCode, null);
    return this.#originalProcessReallyExit.call(this.#process, this.#process.exitCode);
  }
  #processEmit(ev, ...args) {
    const og = this.#originalProcessEmit;
    if (ev === "exit" && processOk(this.#process)) {
      if (typeof args[0] === "number") {
        this.#process.exitCode = args[0];
      }
      const ret = og.call(this.#process, ev, ...args);
      this.#emitter.emit("exit", this.#process.exitCode, null);
      return ret;
    } else {
      return og.call(this.#process, ev, ...args);
    }
  }
};
var process9 = globalThis.process;
var {
  /**
   * Called when the process is exiting, whether via signal, explicit
   * exit, or running out of stuff to do.
   *
   * If the global process object is not suitable for instrumentation,
   * then this will be a no-op.
   *
   * Returns a function that may be used to unload signal-exit.
   */
  onExit,
  /**
   * Load the listeners.  Likely you never need to call this, unless
   * doing a rather deep integration with signal-exit functionality.
   * Mostly exposed for the benefit of testing.
   *
   * @internal
   */
  load,
  /**
   * Unload the listeners.  Likely you never need to call this, unless
   * doing a rather deep integration with signal-exit functionality.
   * Mostly exposed for the benefit of testing.
   *
   * @internal
   */
  unload
} = signalExitWrap(processOk(process9) ? new SignalExit(process9) : new SignalExitFallback());

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/terminate/cleanup.js
var cleanupOnExit = (subprocess, { cleanup, detached }, { signal }) => {
  if (!cleanup || detached) {
    return;
  }
  const removeExitHandler = onExit(() => {
    subprocess.kill();
  });
  (0, import_node_events11.addAbortListener)(signal, () => {
    removeExitHandler();
  });
};

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/pipe/pipe-arguments.js
var normalizePipeArguments = ({ source, sourcePromise, boundOptions, createNested }, ...pipeArguments) => {
  const startTime = getStartTime();
  const {
    destination,
    destinationStream,
    destinationError,
    from,
    unpipeSignal
  } = getDestinationStream(boundOptions, createNested, pipeArguments);
  const { sourceStream, sourceError } = getSourceStream(source, from);
  const { options: sourceOptions, fileDescriptors } = SUBPROCESS_OPTIONS.get(source);
  return {
    sourcePromise,
    sourceStream,
    sourceOptions,
    sourceError,
    destination,
    destinationStream,
    destinationError,
    unpipeSignal,
    fileDescriptors,
    startTime
  };
};
var getDestinationStream = (boundOptions, createNested, pipeArguments) => {
  try {
    const {
      destination,
      pipeOptions: { from, to, unpipeSignal } = {}
    } = getDestination(boundOptions, createNested, ...pipeArguments);
    const destinationStream = getToStream(destination, to);
    return {
      destination,
      destinationStream,
      from,
      unpipeSignal
    };
  } catch (error) {
    return { destinationError: error };
  }
};
var getDestination = (boundOptions, createNested, firstArgument, ...pipeArguments) => {
  if (Array.isArray(firstArgument)) {
    const destination = createNested(mapDestinationArguments, boundOptions)(firstArgument, ...pipeArguments);
    return { destination, pipeOptions: boundOptions };
  }
  if (typeof firstArgument === "string" || firstArgument instanceof URL || isDenoExecPath(firstArgument)) {
    if (Object.keys(boundOptions).length > 0) {
      throw new TypeError('Please use .pipe("file", ..., options) or .pipe(execa("file", ..., options)) instead of .pipe(options)("file", ...).');
    }
    const [rawFile, rawArguments, rawOptions] = normalizeParameters(firstArgument, ...pipeArguments);
    const destination = createNested(mapDestinationArguments)(rawFile, rawArguments, rawOptions);
    return { destination, pipeOptions: rawOptions };
  }
  if (SUBPROCESS_OPTIONS.has(firstArgument)) {
    if (Object.keys(boundOptions).length > 0) {
      throw new TypeError("Please use .pipe(options)`command` or .pipe($(options)`command`) instead of .pipe(options)($`command`).");
    }
    return { destination: firstArgument, pipeOptions: pipeArguments[0] };
  }
  throw new TypeError(`The first argument must be a template string, an options object, or an Execa subprocess: ${firstArgument}`);
};
var mapDestinationArguments = ({ options }) => ({ options: { ...options, stdin: "pipe", piped: true } });
var getSourceStream = (source, from) => {
  try {
    const sourceStream = getFromStream(source, from);
    return { sourceStream };
  } catch (error) {
    return { sourceError: error };
  }
};

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/pipe/throw.js
var handlePipeArgumentsError = ({
  sourceStream,
  sourceError,
  destinationStream,
  destinationError,
  fileDescriptors,
  sourceOptions,
  startTime
}) => {
  const error = getPipeArgumentsError({
    sourceStream,
    sourceError,
    destinationStream,
    destinationError
  });
  if (error !== void 0) {
    throw createNonCommandError({
      error,
      fileDescriptors,
      sourceOptions,
      startTime
    });
  }
};
var getPipeArgumentsError = ({ sourceStream, sourceError, destinationStream, destinationError }) => {
  if (sourceError !== void 0 && destinationError !== void 0) {
    return destinationError;
  }
  if (destinationError !== void 0) {
    abortSourceStream(sourceStream);
    return destinationError;
  }
  if (sourceError !== void 0) {
    endDestinationStream(destinationStream);
    return sourceError;
  }
};
var createNonCommandError = ({ error, fileDescriptors, sourceOptions, startTime }) => makeEarlyError({
  error,
  command: PIPE_COMMAND_MESSAGE,
  escapedCommand: PIPE_COMMAND_MESSAGE,
  fileDescriptors,
  options: sourceOptions,
  startTime,
  isSync: false
});
var PIPE_COMMAND_MESSAGE = "source.pipe(destination)";

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/pipe/sequence.js
var waitForBothSubprocesses = async (subprocessPromises) => {
  const [
    { status: sourceStatus, reason: sourceReason, value: sourceResult = sourceReason },
    { status: destinationStatus, reason: destinationReason, value: destinationResult = destinationReason }
  ] = await subprocessPromises;
  if (!destinationResult.pipedFrom.includes(sourceResult)) {
    destinationResult.pipedFrom.push(sourceResult);
  }
  if (destinationStatus === "rejected") {
    throw destinationResult;
  }
  if (sourceStatus === "rejected") {
    throw sourceResult;
  }
  return destinationResult;
};

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/pipe/streaming.js
var import_promises8 = require("node:stream/promises");
var pipeSubprocessStream = (sourceStream, destinationStream, maxListenersController) => {
  const mergedStream = MERGED_STREAMS.has(destinationStream) ? pipeMoreSubprocessStream(sourceStream, destinationStream) : pipeFirstSubprocessStream(sourceStream, destinationStream);
  incrementMaxListeners(sourceStream, SOURCE_LISTENERS_PER_PIPE, maxListenersController.signal);
  incrementMaxListeners(destinationStream, DESTINATION_LISTENERS_PER_PIPE, maxListenersController.signal);
  cleanupMergedStreamsMap(destinationStream);
  return mergedStream;
};
var pipeFirstSubprocessStream = (sourceStream, destinationStream) => {
  const mergedStream = mergeStreams([sourceStream]);
  pipeStreams(mergedStream, destinationStream);
  MERGED_STREAMS.set(destinationStream, mergedStream);
  return mergedStream;
};
var pipeMoreSubprocessStream = (sourceStream, destinationStream) => {
  const mergedStream = MERGED_STREAMS.get(destinationStream);
  mergedStream.add(sourceStream);
  return mergedStream;
};
var cleanupMergedStreamsMap = async (destinationStream) => {
  try {
    await (0, import_promises8.finished)(destinationStream, { cleanup: true, readable: false, writable: true });
  } catch {
  }
  MERGED_STREAMS.delete(destinationStream);
};
var MERGED_STREAMS = /* @__PURE__ */ new WeakMap();
var SOURCE_LISTENERS_PER_PIPE = 2;
var DESTINATION_LISTENERS_PER_PIPE = 1;

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/pipe/abort.js
var import_node_util8 = require("node:util");
var unpipeOnAbort = (unpipeSignal, unpipeContext) => unpipeSignal === void 0 ? [] : [unpipeOnSignalAbort(unpipeSignal, unpipeContext)];
var unpipeOnSignalAbort = async (unpipeSignal, { sourceStream, mergedStream, fileDescriptors, sourceOptions, startTime }) => {
  await (0, import_node_util8.aborted)(unpipeSignal, sourceStream);
  await mergedStream.remove(sourceStream);
  const error = new Error("Pipe canceled by `unpipeSignal` option.");
  throw createNonCommandError({
    error,
    fileDescriptors,
    sourceOptions,
    startTime
  });
};

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/pipe/setup.js
var pipeToSubprocess = (sourceInfo, ...pipeArguments) => {
  if (isPlainObject(pipeArguments[0])) {
    return pipeToSubprocess.bind(void 0, {
      ...sourceInfo,
      boundOptions: { ...sourceInfo.boundOptions, ...pipeArguments[0] }
    });
  }
  const { destination, ...normalizedInfo } = normalizePipeArguments(sourceInfo, ...pipeArguments);
  const promise = handlePipePromise({ ...normalizedInfo, destination });
  promise.pipe = pipeToSubprocess.bind(void 0, {
    ...sourceInfo,
    source: destination,
    sourcePromise: promise,
    boundOptions: {}
  });
  return promise;
};
var handlePipePromise = async ({
  sourcePromise,
  sourceStream,
  sourceOptions,
  sourceError,
  destination,
  destinationStream,
  destinationError,
  unpipeSignal,
  fileDescriptors,
  startTime
}) => {
  const subprocessPromises = getSubprocessPromises(sourcePromise, destination);
  handlePipeArgumentsError({
    sourceStream,
    sourceError,
    destinationStream,
    destinationError,
    fileDescriptors,
    sourceOptions,
    startTime
  });
  const maxListenersController = new AbortController();
  try {
    const mergedStream = pipeSubprocessStream(sourceStream, destinationStream, maxListenersController);
    return await Promise.race([
      waitForBothSubprocesses(subprocessPromises),
      ...unpipeOnAbort(unpipeSignal, {
        sourceStream,
        mergedStream,
        sourceOptions,
        fileDescriptors,
        startTime
      })
    ]);
  } finally {
    maxListenersController.abort();
  }
};
var getSubprocessPromises = (sourcePromise, destination) => Promise.allSettled([sourcePromise, destination]);

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/io/contents.js
var import_promises9 = require("node:timers/promises");

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/io/iterate.js
var import_node_events12 = require("node:events");
var import_node_stream5 = require("node:stream");
var iterateOnSubprocessStream = ({ subprocessStdout, subprocess, binary, shouldEncode, encoding, preserveNewlines }) => {
  const controller = new AbortController();
  stopReadingOnExit(subprocess, controller);
  return iterateOnStream({
    stream: subprocessStdout,
    controller,
    binary,
    shouldEncode: !subprocessStdout.readableObjectMode && shouldEncode,
    encoding,
    shouldSplit: !subprocessStdout.readableObjectMode,
    preserveNewlines
  });
};
var stopReadingOnExit = async (subprocess, controller) => {
  try {
    await subprocess;
  } catch {
  } finally {
    controller.abort();
  }
};
var iterateForResult = ({ stream: stream2, onStreamEnd, lines, encoding, stripFinalNewline: stripFinalNewline2, allMixed }) => {
  const controller = new AbortController();
  stopReadingOnStreamEnd(onStreamEnd, controller, stream2);
  const objectMode = stream2.readableObjectMode && !allMixed;
  return iterateOnStream({
    stream: stream2,
    controller,
    binary: encoding === "buffer",
    shouldEncode: !objectMode,
    encoding,
    shouldSplit: !objectMode && lines,
    preserveNewlines: !stripFinalNewline2
  });
};
var stopReadingOnStreamEnd = async (onStreamEnd, controller, stream2) => {
  try {
    await onStreamEnd;
  } catch {
    stream2.destroy();
  } finally {
    controller.abort();
  }
};
var iterateOnStream = ({ stream: stream2, controller, binary, shouldEncode, encoding, shouldSplit, preserveNewlines }) => {
  const onStdoutChunk = (0, import_node_events12.on)(stream2, "data", {
    signal: controller.signal,
    highWaterMark: HIGH_WATER_MARK,
    // Backward compatibility with older name for this option
    // See https://github.com/nodejs/node/pull/52080#discussion_r1525227861
    // @todo Remove after removing support for Node 21
    highWatermark: HIGH_WATER_MARK
  });
  return iterateOnData({
    onStdoutChunk,
    controller,
    binary,
    shouldEncode,
    encoding,
    shouldSplit,
    preserveNewlines
  });
};
var DEFAULT_OBJECT_HIGH_WATER_MARK = (0, import_node_stream5.getDefaultHighWaterMark)(true);
var HIGH_WATER_MARK = DEFAULT_OBJECT_HIGH_WATER_MARK;
var iterateOnData = async function* ({ onStdoutChunk, controller, binary, shouldEncode, encoding, shouldSplit, preserveNewlines }) {
  const generators = getGenerators({
    binary,
    shouldEncode,
    encoding,
    shouldSplit,
    preserveNewlines
  });
  try {
    for await (const [chunk] of onStdoutChunk) {
      yield* transformChunkSync(chunk, generators, 0);
    }
  } catch (error) {
    if (!controller.signal.aborted) {
      throw error;
    }
  } finally {
    yield* finalChunksSync(generators);
  }
};
var getGenerators = ({ binary, shouldEncode, encoding, shouldSplit, preserveNewlines }) => [
  getEncodingTransformGenerator(binary, encoding, !shouldEncode),
  getSplitLinesGenerator(binary, preserveNewlines, !shouldSplit, {})
].filter(Boolean);

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/io/contents.js
var getStreamOutput = async ({ stream: stream2, onStreamEnd, fdNumber, encoding, buffer, maxBuffer, lines, allMixed, stripFinalNewline: stripFinalNewline2, verboseInfo, streamInfo }) => {
  const logPromise = logOutputAsync({
    stream: stream2,
    onStreamEnd,
    fdNumber,
    encoding,
    allMixed,
    verboseInfo,
    streamInfo
  });
  if (!buffer) {
    await Promise.all([resumeStream(stream2), logPromise]);
    return;
  }
  const stripFinalNewlineValue = getStripFinalNewline(stripFinalNewline2, fdNumber);
  const iterable = iterateForResult({
    stream: stream2,
    onStreamEnd,
    lines,
    encoding,
    stripFinalNewline: stripFinalNewlineValue,
    allMixed
  });
  const [output] = await Promise.all([
    getStreamContents2({
      stream: stream2,
      iterable,
      fdNumber,
      encoding,
      maxBuffer,
      lines
    }),
    logPromise
  ]);
  return output;
};
var logOutputAsync = async ({ stream: stream2, onStreamEnd, fdNumber, encoding, allMixed, verboseInfo, streamInfo: { fileDescriptors } }) => {
  if (!shouldLogOutput({
    stdioItems: fileDescriptors[fdNumber]?.stdioItems,
    encoding,
    verboseInfo,
    fdNumber
  })) {
    return;
  }
  const linesIterable = iterateForResult({
    stream: stream2,
    onStreamEnd,
    lines: true,
    encoding,
    stripFinalNewline: true,
    allMixed
  });
  await logLines(linesIterable, stream2, fdNumber, verboseInfo);
};
var resumeStream = async (stream2) => {
  await (0, import_promises9.setImmediate)();
  if (stream2.readableFlowing === null) {
    stream2.resume();
  }
};
var getStreamContents2 = async ({ stream: stream2, stream: { readableObjectMode }, iterable, fdNumber, encoding, maxBuffer, lines }) => {
  try {
    if (readableObjectMode || lines) {
      return await getStreamAsArray(iterable, { maxBuffer });
    }
    if (encoding === "buffer") {
      return new Uint8Array(await getStreamAsArrayBuffer(iterable, { maxBuffer }));
    }
    return await getStreamAsString(iterable, { maxBuffer });
  } catch (error) {
    return handleBufferedData(handleMaxBuffer({
      error,
      stream: stream2,
      readableObjectMode,
      lines,
      encoding,
      fdNumber
    }));
  }
};
var getBufferedData = async (streamPromise) => {
  try {
    return await streamPromise;
  } catch (error) {
    return handleBufferedData(error);
  }
};
var handleBufferedData = ({ bufferedData }) => isArrayBuffer(bufferedData) ? new Uint8Array(bufferedData) : bufferedData;

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/resolve/wait-stream.js
var import_promises10 = require("node:stream/promises");
var waitForStream = async (stream2, fdNumber, streamInfo, { isSameDirection, stopOnExit = false } = {}) => {
  const state = handleStdinDestroy(stream2, streamInfo);
  const abortController = new AbortController();
  try {
    await Promise.race([
      ...stopOnExit ? [streamInfo.exitPromise] : [],
      (0, import_promises10.finished)(stream2, { cleanup: true, signal: abortController.signal })
    ]);
  } catch (error) {
    if (!state.stdinCleanedUp) {
      handleStreamError(error, fdNumber, streamInfo, isSameDirection);
    }
  } finally {
    abortController.abort();
  }
};
var handleStdinDestroy = (stream2, { originalStreams: [originalStdin], subprocess }) => {
  const state = { stdinCleanedUp: false };
  if (stream2 === originalStdin) {
    spyOnStdinDestroy(stream2, subprocess, state);
  }
  return state;
};
var spyOnStdinDestroy = (subprocessStdin, subprocess, state) => {
  const { _destroy } = subprocessStdin;
  subprocessStdin._destroy = (...destroyArguments) => {
    setStdinCleanedUp(subprocess, state);
    _destroy.call(subprocessStdin, ...destroyArguments);
  };
};
var setStdinCleanedUp = ({ exitCode, signalCode }, state) => {
  if (exitCode !== null || signalCode !== null) {
    state.stdinCleanedUp = true;
  }
};
var handleStreamError = (error, fdNumber, streamInfo, isSameDirection) => {
  if (!shouldIgnoreStreamError(error, fdNumber, streamInfo, isSameDirection)) {
    throw error;
  }
};
var shouldIgnoreStreamError = (error, fdNumber, streamInfo, isSameDirection = true) => {
  if (streamInfo.propagating) {
    return isStreamEpipe(error) || isStreamAbort(error);
  }
  streamInfo.propagating = true;
  return isInputFileDescriptor(streamInfo, fdNumber) === isSameDirection ? isStreamEpipe(error) : isStreamAbort(error);
};
var isInputFileDescriptor = ({ fileDescriptors }, fdNumber) => fdNumber !== "all" && fileDescriptors[fdNumber].direction === "input";
var isStreamAbort = (error) => error?.code === "ERR_STREAM_PREMATURE_CLOSE";
var isStreamEpipe = (error) => error?.code === "EPIPE";

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/resolve/stdio.js
var waitForStdioStreams = ({ subprocess, encoding, buffer, maxBuffer, lines, stripFinalNewline: stripFinalNewline2, verboseInfo, streamInfo }) => subprocess.stdio.map((stream2, fdNumber) => waitForSubprocessStream({
  stream: stream2,
  fdNumber,
  encoding,
  buffer: buffer[fdNumber],
  maxBuffer: maxBuffer[fdNumber],
  lines: lines[fdNumber],
  allMixed: false,
  stripFinalNewline: stripFinalNewline2,
  verboseInfo,
  streamInfo
}));
var waitForSubprocessStream = async ({ stream: stream2, fdNumber, encoding, buffer, maxBuffer, lines, allMixed, stripFinalNewline: stripFinalNewline2, verboseInfo, streamInfo }) => {
  if (!stream2) {
    return;
  }
  const onStreamEnd = waitForStream(stream2, fdNumber, streamInfo);
  if (isInputFileDescriptor(streamInfo, fdNumber)) {
    await onStreamEnd;
    return;
  }
  const [output] = await Promise.all([
    getStreamOutput({
      stream: stream2,
      onStreamEnd,
      fdNumber,
      encoding,
      buffer,
      maxBuffer,
      lines,
      allMixed,
      stripFinalNewline: stripFinalNewline2,
      verboseInfo,
      streamInfo
    }),
    onStreamEnd
  ]);
  return output;
};

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/resolve/all-async.js
var makeAllStream = ({ stdout, stderr }, { all }) => all && (stdout || stderr) ? mergeStreams([stdout, stderr].filter(Boolean)) : void 0;
var waitForAllStream = ({ subprocess, encoding, buffer, maxBuffer, lines, stripFinalNewline: stripFinalNewline2, verboseInfo, streamInfo }) => waitForSubprocessStream({
  ...getAllStream(subprocess, buffer),
  fdNumber: "all",
  encoding,
  maxBuffer: maxBuffer[1] + maxBuffer[2],
  lines: lines[1] || lines[2],
  allMixed: getAllMixed(subprocess),
  stripFinalNewline: stripFinalNewline2,
  verboseInfo,
  streamInfo
});
var getAllStream = ({ stdout, stderr, all }, [, bufferStdout, bufferStderr]) => {
  const buffer = bufferStdout || bufferStderr;
  if (!buffer) {
    return { stream: all, buffer };
  }
  if (!bufferStdout) {
    return { stream: stderr, buffer };
  }
  if (!bufferStderr) {
    return { stream: stdout, buffer };
  }
  return { stream: all, buffer };
};
var getAllMixed = ({ all, stdout, stderr }) => all && stdout && stderr && stdout.readableObjectMode !== stderr.readableObjectMode;

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/resolve/wait-subprocess.js
var import_node_events13 = require("node:events");

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/verbose/ipc.js
var shouldLogIpc = (verboseInfo) => isFullVerbose(verboseInfo, "ipc");
var logIpcOutput = (message, verboseInfo) => {
  const verboseMessage = serializeVerboseMessage(message);
  verboseLog({
    type: "ipc",
    verboseMessage,
    fdNumber: "ipc",
    verboseInfo
  });
};

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/ipc/buffer-messages.js
var waitForIpcOutput = async ({
  subprocess,
  buffer: bufferArray,
  maxBuffer: maxBufferArray,
  ipc,
  ipcOutput,
  verboseInfo
}) => {
  if (!ipc) {
    return ipcOutput;
  }
  const isVerbose2 = shouldLogIpc(verboseInfo);
  const buffer = getFdSpecificValue(bufferArray, "ipc");
  const maxBuffer = getFdSpecificValue(maxBufferArray, "ipc");
  for await (const message of loopOnMessages({
    anyProcess: subprocess,
    channel: subprocess.channel,
    isSubprocess: false,
    ipc,
    shouldAwait: false,
    reference: true
  })) {
    if (buffer) {
      checkIpcMaxBuffer(subprocess, ipcOutput, maxBuffer);
      ipcOutput.push(message);
    }
    if (isVerbose2) {
      logIpcOutput(message, verboseInfo);
    }
  }
  return ipcOutput;
};
var getBufferedIpcOutput = async (ipcOutputPromise, ipcOutput) => {
  await Promise.allSettled([ipcOutputPromise]);
  return ipcOutput;
};

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/resolve/wait-subprocess.js
var waitForSubprocessResult = async ({
  subprocess,
  options: {
    encoding,
    buffer,
    maxBuffer,
    lines,
    timeoutDuration: timeout,
    cancelSignal,
    gracefulCancel,
    forceKillAfterDelay,
    stripFinalNewline: stripFinalNewline2,
    ipc,
    ipcInput
  },
  context,
  verboseInfo,
  fileDescriptors,
  originalStreams,
  onInternalError,
  controller
}) => {
  const exitPromise = waitForExit(subprocess, context);
  const streamInfo = {
    originalStreams,
    fileDescriptors,
    subprocess,
    exitPromise,
    propagating: false
  };
  const stdioPromises = waitForStdioStreams({
    subprocess,
    encoding,
    buffer,
    maxBuffer,
    lines,
    stripFinalNewline: stripFinalNewline2,
    verboseInfo,
    streamInfo
  });
  const allPromise = waitForAllStream({
    subprocess,
    encoding,
    buffer,
    maxBuffer,
    lines,
    stripFinalNewline: stripFinalNewline2,
    verboseInfo,
    streamInfo
  });
  const ipcOutput = [];
  const ipcOutputPromise = waitForIpcOutput({
    subprocess,
    buffer,
    maxBuffer,
    ipc,
    ipcOutput,
    verboseInfo
  });
  const originalPromises = waitForOriginalStreams(originalStreams, subprocess, streamInfo);
  const customStreamsEndPromises = waitForCustomStreamsEnd(fileDescriptors, streamInfo);
  try {
    return await Promise.race([
      Promise.all([
        {},
        waitForSuccessfulExit(exitPromise),
        Promise.all(stdioPromises),
        allPromise,
        ipcOutputPromise,
        sendIpcInput(subprocess, ipcInput),
        ...originalPromises,
        ...customStreamsEndPromises
      ]),
      onInternalError,
      throwOnSubprocessError(subprocess, controller),
      ...throwOnTimeout(subprocess, timeout, context, controller),
      ...throwOnCancel({
        subprocess,
        cancelSignal,
        gracefulCancel,
        context,
        controller
      }),
      ...throwOnGracefulCancel({
        subprocess,
        cancelSignal,
        gracefulCancel,
        forceKillAfterDelay,
        context,
        controller
      })
    ]);
  } catch (error) {
    context.terminationReason ??= "other";
    return Promise.all([
      { error },
      exitPromise,
      Promise.all(stdioPromises.map((stdioPromise) => getBufferedData(stdioPromise))),
      getBufferedData(allPromise),
      getBufferedIpcOutput(ipcOutputPromise, ipcOutput),
      Promise.allSettled(originalPromises),
      Promise.allSettled(customStreamsEndPromises)
    ]);
  }
};
var waitForOriginalStreams = (originalStreams, subprocess, streamInfo) => originalStreams.map((stream2, fdNumber) => stream2 === subprocess.stdio[fdNumber] ? void 0 : waitForStream(stream2, fdNumber, streamInfo));
var waitForCustomStreamsEnd = (fileDescriptors, streamInfo) => fileDescriptors.flatMap(({ stdioItems }, fdNumber) => stdioItems.filter(({ value, stream: stream2 = value }) => isStream(stream2, { checkOpen: false }) && !isStandardStream(stream2)).map(({ type, value, stream: stream2 = value }) => waitForStream(stream2, fdNumber, streamInfo, {
  isSameDirection: TRANSFORM_TYPES.has(type),
  stopOnExit: type === "native"
})));
var throwOnSubprocessError = async (subprocess, { signal }) => {
  const [error] = await (0, import_node_events13.once)(subprocess, "error", { signal });
  throw error;
};

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/convert/concurrent.js
var initializeConcurrentStreams = () => ({
  readableDestroy: /* @__PURE__ */ new WeakMap(),
  writableFinal: /* @__PURE__ */ new WeakMap(),
  writableDestroy: /* @__PURE__ */ new WeakMap()
});
var addConcurrentStream = (concurrentStreams, stream2, waitName) => {
  const weakMap = concurrentStreams[waitName];
  if (!weakMap.has(stream2)) {
    weakMap.set(stream2, []);
  }
  const promises = weakMap.get(stream2);
  const promise = createDeferred();
  promises.push(promise);
  const resolve = promise.resolve.bind(promise);
  return { resolve, promises };
};
var waitForConcurrentStreams = async ({ resolve, promises }, subprocess) => {
  resolve();
  const [isSubprocessExit] = await Promise.race([
    Promise.allSettled([true, subprocess]),
    Promise.all([false, ...promises])
  ]);
  return !isSubprocessExit;
};

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/convert/readable.js
var import_node_stream6 = require("node:stream");
var import_node_util9 = require("node:util");

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/convert/shared.js
var import_promises11 = require("node:stream/promises");
var safeWaitForSubprocessStdin = async (subprocessStdin) => {
  if (subprocessStdin === void 0) {
    return;
  }
  try {
    await waitForSubprocessStdin(subprocessStdin);
  } catch {
  }
};
var safeWaitForSubprocessStdout = async (subprocessStdout) => {
  if (subprocessStdout === void 0) {
    return;
  }
  try {
    await waitForSubprocessStdout(subprocessStdout);
  } catch {
  }
};
var waitForSubprocessStdin = async (subprocessStdin) => {
  await (0, import_promises11.finished)(subprocessStdin, { cleanup: true, readable: false, writable: true });
};
var waitForSubprocessStdout = async (subprocessStdout) => {
  await (0, import_promises11.finished)(subprocessStdout, { cleanup: true, readable: true, writable: false });
};
var waitForSubprocess = async (subprocess, error) => {
  await subprocess;
  if (error) {
    throw error;
  }
};
var destroyOtherStream = (stream2, isOpen, error) => {
  if (error && !isStreamAbort(error)) {
    stream2.destroy(error);
  } else if (isOpen) {
    stream2.destroy();
  }
};

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/convert/readable.js
var createReadable = ({ subprocess, concurrentStreams, encoding }, { from, binary: binaryOption = true, preserveNewlines = true } = {}) => {
  const binary = binaryOption || BINARY_ENCODINGS.has(encoding);
  const { subprocessStdout, waitReadableDestroy } = getSubprocessStdout(subprocess, from, concurrentStreams);
  const { readableEncoding, readableObjectMode, readableHighWaterMark } = getReadableOptions(subprocessStdout, binary);
  const { read, onStdoutDataDone } = getReadableMethods({
    subprocessStdout,
    subprocess,
    binary,
    encoding,
    preserveNewlines
  });
  const readable2 = new import_node_stream6.Readable({
    read,
    destroy: (0, import_node_util9.callbackify)(onReadableDestroy.bind(void 0, { subprocessStdout, subprocess, waitReadableDestroy })),
    highWaterMark: readableHighWaterMark,
    objectMode: readableObjectMode,
    encoding: readableEncoding
  });
  onStdoutFinished({
    subprocessStdout,
    onStdoutDataDone,
    readable: readable2,
    subprocess
  });
  return readable2;
};
var getSubprocessStdout = (subprocess, from, concurrentStreams) => {
  const subprocessStdout = getFromStream(subprocess, from);
  const waitReadableDestroy = addConcurrentStream(concurrentStreams, subprocessStdout, "readableDestroy");
  return { subprocessStdout, waitReadableDestroy };
};
var getReadableOptions = ({ readableEncoding, readableObjectMode, readableHighWaterMark }, binary) => binary ? { readableEncoding, readableObjectMode, readableHighWaterMark } : { readableEncoding, readableObjectMode: true, readableHighWaterMark: DEFAULT_OBJECT_HIGH_WATER_MARK };
var getReadableMethods = ({ subprocessStdout, subprocess, binary, encoding, preserveNewlines }) => {
  const onStdoutDataDone = createDeferred();
  const onStdoutData = iterateOnSubprocessStream({
    subprocessStdout,
    subprocess,
    binary,
    shouldEncode: !binary,
    encoding,
    preserveNewlines
  });
  return {
    read() {
      onRead(this, onStdoutData, onStdoutDataDone);
    },
    onStdoutDataDone
  };
};
var onRead = async (readable2, onStdoutData, onStdoutDataDone) => {
  try {
    const { value, done } = await onStdoutData.next();
    if (done) {
      onStdoutDataDone.resolve();
    } else {
      readable2.push(value);
    }
  } catch {
  }
};
var onStdoutFinished = async ({ subprocessStdout, onStdoutDataDone, readable: readable2, subprocess, subprocessStdin }) => {
  try {
    await waitForSubprocessStdout(subprocessStdout);
    await subprocess;
    await safeWaitForSubprocessStdin(subprocessStdin);
    await onStdoutDataDone;
    if (readable2.readable) {
      readable2.push(null);
    }
  } catch (error) {
    await safeWaitForSubprocessStdin(subprocessStdin);
    destroyOtherReadable(readable2, error);
  }
};
var onReadableDestroy = async ({ subprocessStdout, subprocess, waitReadableDestroy }, error) => {
  if (await waitForConcurrentStreams(waitReadableDestroy, subprocess)) {
    destroyOtherReadable(subprocessStdout, error);
    await waitForSubprocess(subprocess, error);
  }
};
var destroyOtherReadable = (stream2, error) => {
  destroyOtherStream(stream2, stream2.readable, error);
};

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/convert/writable.js
var import_node_stream7 = require("node:stream");
var import_node_util10 = require("node:util");
var createWritable = ({ subprocess, concurrentStreams }, { to } = {}) => {
  const { subprocessStdin, waitWritableFinal, waitWritableDestroy } = getSubprocessStdin(subprocess, to, concurrentStreams);
  const writable2 = new import_node_stream7.Writable({
    ...getWritableMethods(subprocessStdin, subprocess, waitWritableFinal),
    destroy: (0, import_node_util10.callbackify)(onWritableDestroy.bind(void 0, {
      subprocessStdin,
      subprocess,
      waitWritableFinal,
      waitWritableDestroy
    })),
    highWaterMark: subprocessStdin.writableHighWaterMark,
    objectMode: subprocessStdin.writableObjectMode
  });
  onStdinFinished(subprocessStdin, writable2);
  return writable2;
};
var getSubprocessStdin = (subprocess, to, concurrentStreams) => {
  const subprocessStdin = getToStream(subprocess, to);
  const waitWritableFinal = addConcurrentStream(concurrentStreams, subprocessStdin, "writableFinal");
  const waitWritableDestroy = addConcurrentStream(concurrentStreams, subprocessStdin, "writableDestroy");
  return { subprocessStdin, waitWritableFinal, waitWritableDestroy };
};
var getWritableMethods = (subprocessStdin, subprocess, waitWritableFinal) => ({
  write: onWrite.bind(void 0, subprocessStdin),
  final: (0, import_node_util10.callbackify)(onWritableFinal.bind(void 0, subprocessStdin, subprocess, waitWritableFinal))
});
var onWrite = (subprocessStdin, chunk, encoding, done) => {
  if (subprocessStdin.write(chunk, encoding)) {
    done();
  } else {
    subprocessStdin.once("drain", done);
  }
};
var onWritableFinal = async (subprocessStdin, subprocess, waitWritableFinal) => {
  if (await waitForConcurrentStreams(waitWritableFinal, subprocess)) {
    if (subprocessStdin.writable) {
      subprocessStdin.end();
    }
    await subprocess;
  }
};
var onStdinFinished = async (subprocessStdin, writable2, subprocessStdout) => {
  try {
    await waitForSubprocessStdin(subprocessStdin);
    if (writable2.writable) {
      writable2.end();
    }
  } catch (error) {
    await safeWaitForSubprocessStdout(subprocessStdout);
    destroyOtherWritable(writable2, error);
  }
};
var onWritableDestroy = async ({ subprocessStdin, subprocess, waitWritableFinal, waitWritableDestroy }, error) => {
  await waitForConcurrentStreams(waitWritableFinal, subprocess);
  if (await waitForConcurrentStreams(waitWritableDestroy, subprocess)) {
    destroyOtherWritable(subprocessStdin, error);
    await waitForSubprocess(subprocess, error);
  }
};
var destroyOtherWritable = (stream2, error) => {
  destroyOtherStream(stream2, stream2.writable, error);
};

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/convert/duplex.js
var import_node_stream8 = require("node:stream");
var import_node_util11 = require("node:util");
var createDuplex = ({ subprocess, concurrentStreams, encoding }, { from, to, binary: binaryOption = true, preserveNewlines = true } = {}) => {
  const binary = binaryOption || BINARY_ENCODINGS.has(encoding);
  const { subprocessStdout, waitReadableDestroy } = getSubprocessStdout(subprocess, from, concurrentStreams);
  const { subprocessStdin, waitWritableFinal, waitWritableDestroy } = getSubprocessStdin(subprocess, to, concurrentStreams);
  const { readableEncoding, readableObjectMode, readableHighWaterMark } = getReadableOptions(subprocessStdout, binary);
  const { read, onStdoutDataDone } = getReadableMethods({
    subprocessStdout,
    subprocess,
    binary,
    encoding,
    preserveNewlines
  });
  const duplex2 = new import_node_stream8.Duplex({
    read,
    ...getWritableMethods(subprocessStdin, subprocess, waitWritableFinal),
    destroy: (0, import_node_util11.callbackify)(onDuplexDestroy.bind(void 0, {
      subprocessStdout,
      subprocessStdin,
      subprocess,
      waitReadableDestroy,
      waitWritableFinal,
      waitWritableDestroy
    })),
    readableHighWaterMark,
    writableHighWaterMark: subprocessStdin.writableHighWaterMark,
    readableObjectMode,
    writableObjectMode: subprocessStdin.writableObjectMode,
    encoding: readableEncoding
  });
  onStdoutFinished({
    subprocessStdout,
    onStdoutDataDone,
    readable: duplex2,
    subprocess,
    subprocessStdin
  });
  onStdinFinished(subprocessStdin, duplex2, subprocessStdout);
  return duplex2;
};
var onDuplexDestroy = async ({ subprocessStdout, subprocessStdin, subprocess, waitReadableDestroy, waitWritableFinal, waitWritableDestroy }, error) => {
  await Promise.all([
    onReadableDestroy({ subprocessStdout, subprocess, waitReadableDestroy }, error),
    onWritableDestroy({
      subprocessStdin,
      subprocess,
      waitWritableFinal,
      waitWritableDestroy
    }, error)
  ]);
};

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/convert/iterable.js
var createIterable = (subprocess, encoding, {
  from,
  binary: binaryOption = false,
  preserveNewlines = false
} = {}) => {
  const binary = binaryOption || BINARY_ENCODINGS.has(encoding);
  const subprocessStdout = getFromStream(subprocess, from);
  const onStdoutData = iterateOnSubprocessStream({
    subprocessStdout,
    subprocess,
    binary,
    shouldEncode: true,
    encoding,
    preserveNewlines
  });
  return iterateOnStdoutData(onStdoutData, subprocessStdout, subprocess);
};
var iterateOnStdoutData = async function* (onStdoutData, subprocessStdout, subprocess) {
  try {
    yield* onStdoutData;
  } finally {
    if (subprocessStdout.readable) {
      subprocessStdout.destroy();
    }
    await subprocess;
  }
};

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/convert/add.js
var addConvertedStreams = (subprocess, { encoding }) => {
  const concurrentStreams = initializeConcurrentStreams();
  subprocess.readable = createReadable.bind(void 0, { subprocess, concurrentStreams, encoding });
  subprocess.writable = createWritable.bind(void 0, { subprocess, concurrentStreams });
  subprocess.duplex = createDuplex.bind(void 0, { subprocess, concurrentStreams, encoding });
  subprocess.iterable = createIterable.bind(void 0, subprocess, encoding);
  subprocess[Symbol.asyncIterator] = createIterable.bind(void 0, subprocess, encoding, {});
};

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/methods/promise.js
var mergePromise = (subprocess, promise) => {
  for (const [property, descriptor] of descriptors) {
    const value = descriptor.value.bind(promise);
    Reflect.defineProperty(subprocess, property, { ...descriptor, value });
  }
};
var nativePromisePrototype = (async () => {
})().constructor.prototype;
var descriptors = ["then", "catch", "finally"].map((property) => [
  property,
  Reflect.getOwnPropertyDescriptor(nativePromisePrototype, property)
]);

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/methods/main-async.js
var execaCoreAsync = (rawFile, rawArguments, rawOptions, createNested) => {
  const { file, commandArguments, command, escapedCommand, startTime, verboseInfo, options, fileDescriptors } = handleAsyncArguments(rawFile, rawArguments, rawOptions);
  const { subprocess, promise } = spawnSubprocessAsync({
    file,
    commandArguments,
    options,
    startTime,
    verboseInfo,
    command,
    escapedCommand,
    fileDescriptors
  });
  subprocess.pipe = pipeToSubprocess.bind(void 0, {
    source: subprocess,
    sourcePromise: promise,
    boundOptions: {},
    createNested
  });
  mergePromise(subprocess, promise);
  SUBPROCESS_OPTIONS.set(subprocess, { options, fileDescriptors });
  return subprocess;
};
var handleAsyncArguments = (rawFile, rawArguments, rawOptions) => {
  const { command, escapedCommand, startTime, verboseInfo } = handleCommand(rawFile, rawArguments, rawOptions);
  const { file, commandArguments, options: normalizedOptions } = normalizeOptions(rawFile, rawArguments, rawOptions);
  const options = handleAsyncOptions(normalizedOptions);
  const fileDescriptors = handleStdioAsync(options, verboseInfo);
  return {
    file,
    commandArguments,
    command,
    escapedCommand,
    startTime,
    verboseInfo,
    options,
    fileDescriptors
  };
};
var handleAsyncOptions = ({ timeout, signal, ...options }) => {
  if (signal !== void 0) {
    throw new TypeError('The "signal" option has been renamed to "cancelSignal" instead.');
  }
  return { ...options, timeoutDuration: timeout };
};
var spawnSubprocessAsync = ({ file, commandArguments, options, startTime, verboseInfo, command, escapedCommand, fileDescriptors }) => {
  let subprocess;
  try {
    subprocess = (0, import_node_child_process6.spawn)(...concatenateShell(file, commandArguments, options));
  } catch (error) {
    return handleEarlyError({
      error,
      command,
      escapedCommand,
      fileDescriptors,
      options,
      startTime,
      verboseInfo
    });
  }
  const controller = new AbortController();
  (0, import_node_events14.setMaxListeners)(Number.POSITIVE_INFINITY, controller.signal);
  const originalStreams = [...subprocess.stdio];
  pipeOutputAsync(subprocess, fileDescriptors, controller);
  cleanupOnExit(subprocess, options, controller);
  const context = {};
  const onInternalError = createDeferred();
  subprocess.kill = subprocessKill.bind(void 0, {
    kill: subprocess.kill.bind(subprocess),
    options,
    onInternalError,
    context,
    controller
  });
  subprocess.all = makeAllStream(subprocess, options);
  addConvertedStreams(subprocess, options);
  addIpcMethods(subprocess, options);
  const promise = handlePromise({
    subprocess,
    options,
    startTime,
    verboseInfo,
    fileDescriptors,
    originalStreams,
    command,
    escapedCommand,
    context,
    onInternalError,
    controller
  });
  return { subprocess, promise };
};
var handlePromise = async ({ subprocess, options, startTime, verboseInfo, fileDescriptors, originalStreams, command, escapedCommand, context, onInternalError, controller }) => {
  const [
    errorInfo,
    [exitCode, signal],
    stdioResults,
    allResult,
    ipcOutput
  ] = await waitForSubprocessResult({
    subprocess,
    options,
    context,
    verboseInfo,
    fileDescriptors,
    originalStreams,
    onInternalError,
    controller
  });
  controller.abort();
  onInternalError.resolve();
  const stdio = stdioResults.map((stdioResult, fdNumber) => stripNewline(stdioResult, options, fdNumber));
  const all = stripNewline(allResult, options, "all");
  const result = getAsyncResult({
    errorInfo,
    exitCode,
    signal,
    stdio,
    all,
    ipcOutput,
    context,
    options,
    command,
    escapedCommand,
    startTime
  });
  return handleResult(result, verboseInfo, options);
};
var getAsyncResult = ({ errorInfo, exitCode, signal, stdio, all, ipcOutput, context, options, command, escapedCommand, startTime }) => "error" in errorInfo ? makeError({
  error: errorInfo.error,
  command,
  escapedCommand,
  timedOut: context.terminationReason === "timeout",
  isCanceled: context.terminationReason === "cancel" || context.terminationReason === "gracefulCancel",
  isGracefullyCanceled: context.terminationReason === "gracefulCancel",
  isMaxBuffer: errorInfo.error instanceof MaxBufferError,
  isForcefullyTerminated: context.isForcefullyTerminated,
  exitCode,
  signal,
  stdio,
  all,
  ipcOutput,
  options,
  startTime,
  isSync: false
}) : makeSuccessResult({
  command,
  escapedCommand,
  stdio,
  all,
  ipcOutput,
  options,
  startTime
});

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/methods/bind.js
var mergeOptions = (boundOptions, options) => {
  const newOptions = Object.fromEntries(
    Object.entries(options).map(([optionName, optionValue]) => [
      optionName,
      mergeOption(optionName, boundOptions[optionName], optionValue)
    ])
  );
  return { ...boundOptions, ...newOptions };
};
var mergeOption = (optionName, boundOptionValue, optionValue) => {
  if (DEEP_OPTIONS.has(optionName) && isPlainObject(boundOptionValue) && isPlainObject(optionValue)) {
    return { ...boundOptionValue, ...optionValue };
  }
  return optionValue;
};
var DEEP_OPTIONS = /* @__PURE__ */ new Set(["env", ...FD_SPECIFIC_OPTIONS]);

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/methods/create.js
var createExeca = (mapArguments, boundOptions, deepOptions, setBoundExeca) => {
  const createNested = (mapArguments2, boundOptions2, setBoundExeca2) => createExeca(mapArguments2, boundOptions2, deepOptions, setBoundExeca2);
  const boundExeca = (...execaArguments) => callBoundExeca({
    mapArguments,
    deepOptions,
    boundOptions,
    setBoundExeca,
    createNested
  }, ...execaArguments);
  if (setBoundExeca !== void 0) {
    setBoundExeca(boundExeca, createNested, boundOptions);
  }
  return boundExeca;
};
var callBoundExeca = ({ mapArguments, deepOptions = {}, boundOptions = {}, setBoundExeca, createNested }, firstArgument, ...nextArguments) => {
  if (isPlainObject(firstArgument)) {
    return createNested(mapArguments, mergeOptions(boundOptions, firstArgument), setBoundExeca);
  }
  const { file, commandArguments, options, isSync } = parseArguments({
    mapArguments,
    firstArgument,
    nextArguments,
    deepOptions,
    boundOptions
  });
  return isSync ? execaCoreSync(file, commandArguments, options) : execaCoreAsync(file, commandArguments, options, createNested);
};
var parseArguments = ({ mapArguments, firstArgument, nextArguments, deepOptions, boundOptions }) => {
  const callArguments = isTemplateString(firstArgument) ? parseTemplates(firstArgument, nextArguments) : [firstArgument, ...nextArguments];
  const [initialFile, initialArguments, initialOptions] = normalizeParameters(...callArguments);
  const mergedOptions = mergeOptions(mergeOptions(deepOptions, boundOptions), initialOptions);
  const {
    file = initialFile,
    commandArguments = initialArguments,
    options = mergedOptions,
    isSync = false
  } = mapArguments({ file: initialFile, commandArguments: initialArguments, options: mergedOptions });
  return {
    file,
    commandArguments,
    options,
    isSync
  };
};

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/methods/command.js
var mapCommandAsync = ({ file, commandArguments }) => parseCommand(file, commandArguments);
var mapCommandSync = ({ file, commandArguments }) => ({ ...parseCommand(file, commandArguments), isSync: true });
var parseCommand = (command, unusedArguments) => {
  if (unusedArguments.length > 0) {
    throw new TypeError(`The command and its arguments must be passed as a single string: ${command} ${unusedArguments}.`);
  }
  const [file, ...commandArguments] = parseCommandString(command);
  return { file, commandArguments };
};
var parseCommandString = (command) => {
  if (typeof command !== "string") {
    throw new TypeError(`The command must be a string: ${String(command)}.`);
  }
  const trimmedCommand = command.trim();
  if (trimmedCommand === "") {
    return [];
  }
  const tokens = [];
  for (const token of trimmedCommand.split(SPACES_REGEXP)) {
    const previousToken = tokens.at(-1);
    if (previousToken && previousToken.endsWith("\\")) {
      tokens[tokens.length - 1] = `${previousToken.slice(0, -1)} ${token}`;
    } else {
      tokens.push(token);
    }
  }
  return tokens;
};
var SPACES_REGEXP = / +/g;

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/lib/methods/script.js
var setScriptSync = (boundExeca, createNested, boundOptions) => {
  boundExeca.sync = createNested(mapScriptSync, boundOptions);
  boundExeca.s = boundExeca.sync;
};
var mapScriptAsync = ({ options }) => getScriptOptions(options);
var mapScriptSync = ({ options }) => ({ ...getScriptOptions(options), isSync: true });
var getScriptOptions = (options) => ({ options: { ...getScriptStdinOption(options), ...options } });
var getScriptStdinOption = ({ input, inputFile, stdio }) => input === void 0 && inputFile === void 0 && stdio === void 0 ? { stdin: "inherit" } : {};
var deepScriptOptions = { preferLocal: true };

// ../../node_modules/.pnpm/execa@9.6.1/node_modules/execa/index.js
var execa = createExeca(() => ({}));
var execaSync = createExeca(() => ({ isSync: true }));
var execaCommand = createExeca(mapCommandAsync);
var execaCommandSync = createExeca(mapCommandSync);
var execaNode = createExeca(mapNode);
var $ = createExeca(mapScriptAsync, {}, deepScriptOptions, setScriptSync);
var {
  sendMessage: sendMessage2,
  getOneMessage: getOneMessage2,
  getEachMessage: getEachMessage2,
  getCancelSignal: getCancelSignal2
} = getIpcExport();

// ../../packages/media/src/compose.ts
async function probe(file) {
  const { stdout } = await execa("ffprobe", [
    "-v",
    "quiet",
    "-print_format",
    "json",
    "-show_format",
    "-show_streams",
    file
  ]);
  const data = JSON.parse(stdout);
  return {
    durationSec: Math.round(parseFloat(data.format?.duration ?? "0")),
    streams: (data.streams ?? []).length
  };
}
async function composeProject(opts) {
  if (opts.clips.length === 0) throw new Error("Birlestirilecek klip yok");
  for (const c3 of opts.clips) {
    if (!import_node_fs14.default.existsSync(c3)) throw new Error(`Klip bulunamadi: ${c3}`);
  }
  const tmp = import_node_fs14.default.mkdtempSync(import_node_path14.default.join(import_node_os6.default.tmpdir(), "hmx-"));
  const listFile = import_node_path14.default.join(tmp, "concat.txt");
  import_node_fs14.default.writeFileSync(listFile, opts.clips.map((c3) => `file '${c3.replaceAll("'", "'\\''")}'`).join("\n"));
  const merged = import_node_path14.default.join(tmp, "merged.mp4");
  await execa("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", listFile, "-c", "copy", merged]);
  const hasAudio = opts.voiceover || opts.music;
  if (!hasAudio) {
    import_node_fs14.default.copyFileSync(merged, opts.out);
  } else {
    const inputs = ["-i", merged];
    if (opts.voiceover) inputs.push("-i", opts.voiceover);
    if (opts.music) inputs.push("-i", opts.music);
    let filter;
    if (opts.voiceover && opts.music) {
      filter = "[1:a]volume=1.0[voice];[2:a]volume=0.25[music];[voice][music]amix=inputs=2:duration=first[a]";
    } else {
      filter = "[1:a]anull[a]";
    }
    await execa("ffmpeg", [
      "-y",
      ...inputs,
      "-filter_complex",
      filter,
      "-map",
      "0:v",
      "-map",
      "[a]",
      "-c:v",
      "copy",
      "-shortest",
      opts.out
    ]);
  }
  const info = await probe(opts.out);
  if (info.durationSec <= 0 || info.streams === 0) {
    throw new Error("Cikti dogrulanamadi: gecersiz video");
  }
  return { out: opts.out, durationSec: info.durationSec };
}

// ../../packages/media/src/asset-catalog.ts
var import_node_fs15 = __toESM(require("node:fs"), 1);
var import_node_path15 = __toESM(require("node:path"), 1);
var import_node_crypto2 = __toESM(require("node:crypto"), 1);
init_src();
var AssetCatalog = class {
  constructor(file = paths.catalogFile) {
    this.file = file;
    ensureDirs();
  }
  read() {
    if (!import_node_fs15.default.existsSync(this.file)) return { version: 1, assets: [] };
    try {
      return JSON.parse(import_node_fs15.default.readFileSync(this.file, "utf8"));
    } catch {
      return { version: 1, assets: [] };
    }
  }
  write(db) {
    import_node_fs15.default.mkdirSync(import_node_path15.default.dirname(this.file), { recursive: true });
    import_node_fs15.default.writeFileSync(this.file, JSON.stringify(db, null, 2));
  }
  register(input) {
    const stat = import_node_fs15.default.existsSync(input.filePath) ? import_node_fs15.default.statSync(input.filePath) : null;
    const asset = {
      ...input,
      id: `ast_${Date.now()}_${import_node_crypto2.default.randomBytes(2).toString("hex")}`,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      status: stat && stat.size > 0 ? "verified" : "missing",
      bytes: stat?.size
    };
    const db = this.read();
    db.assets.push(asset);
    this.write(db);
    return asset;
  }
  query(filter = {}) {
    return this.read().assets.filter((a2) => {
      if (filter.tag && !a2.tags.includes(filter.tag)) return false;
      return Object.entries(filter).every(([k, v]) => k === "tag" || a2[k] === v);
    });
  }
  /** Diskte kaybolan dosyalari missing olarak isaretle (dogrulama gecisi) */
  reverify() {
    const db = this.read();
    let verified = 0, missing = 0;
    for (const a2 of db.assets) {
      const ok = import_node_fs15.default.existsSync(a2.filePath) && import_node_fs15.default.statSync(a2.filePath).size > 0;
      a2.status = ok ? "verified" : "missing";
      ok ? verified++ : missing++;
    }
    this.write(db);
    return { verified, missing };
  }
};

// ../../packages/dashboard-api/src/server.ts
init_src2();

// ../../packages/agent-core/src/prompt.ts
var HMX_SYSTEM_PROMPT = `# HMX AGENT \u2014 CORE SYSTEM PROMPT v1.0

Sen HMX Agent'sin: disiplinli, dogrulama odakli bir otonom ajansin.
Kullanicinin hedefini HER ZAMAN eksiksiz ve dogru tamamlamak, hizli tamamlamaktan daha onemlidir.

## 1. ALTIN KURALLAR (asla ihlal etme)
1.1. HIZ DEGIL DOGRULUK: Bir adimi "muhtemelen dogru" diye gecme. Emin degilsen DUR, kontrol et.
1.2. KONUDAN SAPMA YASAK: Her eylemden once sor: "Bu eylem ANA hedefe hizmet ediyor mu?"
     Hedefi <goal> blogunda tut ve her 5 adimda bir kendine hatirlat.
1.3. PLAN ONCE, ICRA SONRA: Her gorevde once yazili plan cikar. 3'ten fazla ardisik
     degistirici eylem icin kullanici onayi al.
1.4. HER EYLEMDEN SONRA DOGRULA: Dosya yazdiysan oku/dogrula. Komut calistirdiysan ciktiyi
     ve exit code'u kontrol et. Uretim yaptiysan dosyanin varligini ve boyutunu dogrula.
1.5. HATA DURUMUNDA: Ayni basarisiz eylemi 2 kereden fazla korleme tekrarlama. Dur,
     kok nedeni analiz et, strateji degistir veya kullaniciya sor.
1.6. UYDURMA YOK: Bilmiyorsan "bilmiyorum" de. Dosya yolu, endpoint, flag uydurma.
1.7. KAPSAM KILIDI: Istenmeyen ozellik ekleme, istenmeyen dosyayi degistirme.

## 2. GOREV DONGUSU
ADIM 0 \u2014 <goal>: hedefi tek cumle + basari kriterleri madde madde.
ADIM 1 \u2014 KESIF: ortami anlamadan icra yok. Kritik belirsizlik varsa SOR.
ADIM 2 \u2014 <plan>: her adim -> beklenen sonuc -> nasil dogrulanacak.
ADIM 3 \u2014 ICRA: tek mantiksal adim, sonra dogrulama, sonra siradaki.
ADIM 4 \u2014 <verification>: her basari kriteri icin kanit (dosya yolu, cikti, boyut).
ADIM 5 \u2014 TESLIM: 3-5 maddelik ozet. Yapamadiklarini acikca soyle.

## 3. MEDYA URETIM MODU
- Uretim istegi gondermeden once promptu kullaniciya onaylat.
- Uretim tamamlanmadan "bitti" deme. Indirilen dosyanin boyutunu/formatini kontrol et.
- Her uretilen medyayi asset_catalog_register araci ile JSON kaydina isle. Kayit yoksa is bitmemistir.

## 4. YASAKLAR
- Onaysiz silme yok. Test edilmemis ciktiyi "calisiyor" diye sunma.
- Ayni anda birden fazla riskli islem baslatma.`;

// ../../packages/agent-core/src/ledger.ts
var import_node_fs16 = __toESM(require("node:fs"), 1);
var import_node_path16 = __toESM(require("node:path"), 1);
var import_node_crypto3 = __toESM(require("node:crypto"), 1);
init_src();
var TaskLedger = class {
  sessionId;
  file;
  step = 0;
  goal = null;
  constructor(sessionId) {
    ensureDirs();
    this.sessionId = sessionId ?? `ses_${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10).replaceAll("-", "")}_${import_node_crypto3.default.randomBytes(2).toString("hex")}`;
    this.file = import_node_path16.default.join(paths.logs, `${this.sessionId}.jsonl`);
  }
  log(type, summary, detail) {
    const ev = {
      ts: (/* @__PURE__ */ new Date()).toISOString(),
      sessionId: this.sessionId,
      step: ++this.step,
      type,
      summary,
      detail
    };
    import_node_fs16.default.appendFileSync(this.file, JSON.stringify(ev) + "\n");
    if (type === "goal") this.goal = summary;
    return ev;
  }
  /** Kural 1.2: her 5 adimda bir hedefi hatirlat */
  shouldReinjectGoal() {
    return this.step > 0 && this.step % 5 === 0 && this.goal !== null;
  }
  getGoal() {
    return this.goal;
  }
  getFile() {
    return this.file;
  }
};

// ../../packages/agent-core/src/agent.ts
init_src();

// ../../packages/agent-core/src/registry.ts
var import_node_path17 = __toESM(require("node:path"), 1);
init_src();
var BUILTIN_AGENTS = [
  {
    id: "hmx-default",
    name: "HMX Agent",
    category: "genel",
    description: "Disiplinli, dogrulama odakli varsayilan ajan",
    promptAddon: "",
    builtin: true,
    enabled: true
  },
  {
    id: "hmx-fast",
    name: "HMX Fast",
    category: "genel",
    description: "Hizli sohbet: minimum dogrulama, direkt cevap",
    promptAddon: "\n\nMOD: HIZLI SOHBET. Kisa ve direkt cevap ver; plan cikarma, onay isteme.",
    builtin: true,
    enabled: true
  },
  {
    id: "media-producer",
    name: "Medya Ureticisi",
    category: "medya",
    description: "Gorsel/video/ses uretimine odakli; prompt iyilestirir",
    promptAddon: "\n\nMOD: MEDYA URETIMI. Gorevleri uretim promptlarina donustur; cikti kalitesini dogrula.",
    builtin: true,
    enabled: true
  },
  {
    id: "browser-operator",
    name: "Tarayici Operatoru",
    category: "tarayici",
    description: "Sitelerde gezinen ve islem yapan ajan (browser_task)",
    promptAddon: "\n\nMOD: TARAYICI. Eylemleri kucuk ve dogrulanabilir tut; yikici islemde dur ve sor.",
    builtin: true,
    enabled: true
  }
];
var AGENTS_FILE = () => import_node_path17.default.join(paths.home, "agents.json");
var AgentRegistry = class {
  /** builtin + kullanici profilleri (kullanici ayni id ile builtin'i ezer) */
  list() {
    ensureDirs();
    const custom = readJson(AGENTS_FILE()) ?? [];
    const map = /* @__PURE__ */ new Map();
    for (const a2 of BUILTIN_AGENTS) map.set(a2.id, a2);
    for (const a2 of custom) map.set(a2.id, { ...a2, builtin: false });
    return [...map.values()];
  }
  get(id) {
    return this.list().find((a2) => a2.id === id) ?? null;
  }
  save(profile) {
    const custom = readJson(AGENTS_FILE()) ?? [];
    const full = { ...profile, builtin: false };
    const next = [...custom.filter((a2) => a2.id !== profile.id), full];
    writeJson(AGENTS_FILE(), next);
    return full;
  }
  remove(id) {
    const custom = readJson(AGENTS_FILE()) ?? [];
    const next = custom.filter((a2) => a2.id !== id);
    if (next.length === custom.length) return false;
    writeJson(AGENTS_FILE(), next);
    return true;
  }
};

// ../../packages/agent-core/src/agent.ts
var HmxAgent = class {
  constructor(llm = LlmClient.fromEnv(), agentId) {
    this.llm = llm;
    this.promptAddon = agentId ? new AgentRegistry().get(agentId)?.promptAddon ?? "" : "";
    this.history.push({ role: "system", content: HMX_SYSTEM_PROMPT + this.promptAddon });
  }
  ledger = new TaskLedger();
  history = [];
  lastError = null;
  errorStreak = 0;
  promptAddon;
  get sessionId() {
    return this.ledger.sessionId;
  }
  get currentModel() {
    return this.llm.model;
  }
  /** Session'i bozmadan model degistir (history ve hedef korunur) */
  setModel(model) {
    this.llm = this.llm.withModel(model);
  }
  /**
   * Direkt sohbet: plan/onay dongusune girmeden tek mesajlik yanit.
   * Streaming icin onToken ver; verilmezse tek parca doner.
   */
  async chat(userContent, onToken) {
    this.ledger.log("action", `chat: ${userContent.slice(0, 120)}`);
    const out = await this.safeChat(userContent, onToken);
    this.ledger.log("verify", out.slice(0, 500));
    return out;
  }
  /** Yeni gorev: once goal + plan urettir, kullaniciya goster. */
  async startTask(userRequest) {
    const goalPrompt = `Kullanici istegi: "${userRequest}"

Gorev dongusu ADIM 0 ve ADIM 2'yi uygula:
<goal> ... </goal>
<plan> ... </plan>
Sadece bu iki blogu yaz.`;
    this.ledger.log("goal", userRequest);
    const out = await this.safeChat(goalPrompt);
    this.ledger.log("plan", out);
    const goal = out.match(/<goal>([\s\S]*?)<\/goal>/)?.[1]?.trim() ?? userRequest;
    const plan = out.match(/<plan>([\s\S]*?)<\/plan>/)?.[1]?.trim() ?? out;
    return { goal, plan };
  }
  /** Bir icra adimi calistir. */
  async step(instruction) {
    if (this.ledger.shouldReinjectGoal()) {
      this.history.push({
        role: "system",
        content: `[HEDEF HATIRLATMA] Ana hedefin: ${this.ledger.getGoal()}. Bu adim bu hedefe hizmet ediyor mu?`
      });
    }
    this.ledger.log("action", instruction);
    const out = await this.safeChat(instruction);
    this.ledger.log("verify", out.slice(0, 500));
    return out;
  }
  async safeChat(userContent, onToken) {
    this.history.push({ role: "user", content: userContent });
    try {
      const reply = onToken ? await this.llm.chatStream(this.history, onToken) : await this.llm.chat(this.history);
      this.history.push({ role: "assistant", content: reply });
      this.errorStreak = 0;
      this.lastError = null;
      return reply;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (this.lastError === msg) {
        this.errorStreak++;
        if (this.errorStreak >= 2) {
          this.ledger.log("error", `Ayni hata 2+ kez: ${msg}. Duruldu, strateji degistirilmeli.`);
          throw new Error(`HMX DURDU: Ayni hata tekrarlandi (${msg}). Kok nedeni cozmeden devam etmiyorum.`);
        }
      } else {
        this.errorStreak = 1;
      }
      this.lastError = msg;
      this.ledger.log("error", msg);
      throw err;
    }
  }
  getLedgerFile() {
    return this.ledger.getFile();
  }
};

// ../../packages/agent-core/src/approval.ts
function shouldRequireApproval(risk, mode) {
  if (risk === "safe") return false;
  if (risk === "destructive") return true;
  return mode === "strict";
}
var TASK_MARKERS = [
  "olu\u015Ftur",
  "olustur",
  "\xFCret",
  "uret",
  "yap",
  "kur",
  "y\xFCkle",
  "yukle",
  "de\u011Fi\u015Ftir",
  "degistir",
  "d\xFCzenle",
  "duzenle",
  "g\xFCncelle",
  "guncelle",
  "\xE7iz",
  "ciz",
  "haz\u0131rla",
  "hazirla",
  "derle",
  "build",
  "generate",
  "create"
];
var DESTRUCTIVE_MARKERS = [
  "sil",
  "delete",
  "remove",
  "kald\u0131r",
  "kaldir",
  "s\u0131f\u0131rla",
  "sifirla",
  "reset",
  "\xFCzerine yaz",
  "overwrite",
  "deploy",
  "\xF6de",
  "ode",
  "pay",
  "g\xF6nder",
  "gonder",
  "send"
];
function classifyMessageRisk(message) {
  const m = message.toLowerCase();
  const words = new Set(m.split(/[^a-zçğıiöşü]+/).filter(Boolean));
  const has = (marker) => marker.includes(" ") ? m.includes(marker) : words.has(marker);
  if (DESTRUCTIVE_MARKERS.some(has)) return "destructive";
  if (TASK_MARKERS.some(has)) return "moderate";
  return "safe";
}

// ../../packages/agent-core/src/browser-task.ts
init_src();

// ../../packages/dashboard-api/src/server.ts
init_src();

// ../../packages/dashboard-api/src/quota-tracker.ts
init_src2();
function quotaSnapshot(router) {
  const pool = new AccountPool();
  const now = Date.now();
  return {
    accounts: pool.listAll().map((a2) => ({
      id: a2.id,
      provider: a2.providerId,
      label: a2.label,
      status: a2.status,
      failCount: a2.failCount,
      cooldownRemainingMs: a2.cooldownUntil ? Math.max(0, a2.cooldownUntil - now) : 0,
      lastUsedAt: a2.lastUsedAt ?? null,
      notes: a2.notes ?? null
    })),
    circuits: router.circuitSnapshot(),
    tokenSaver: tokenSaverStats.snapshot()
  };
}

// ../../packages/dashboard-api/src/html.ts
var DASHBOARD_HTML = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>HMX Agent Control Center</title>
<style>
  :root {
    --bg:#0a0e1a; --panel:#10152a; --panel2:#161c36; --border:#232b4d;
    --text:#e8ecf8; --muted:#8a93b8; --accent:#7c5cff; --accent2:#4f8cff;
    --ok:#22c55e; --err:#f85149; --warn:#f0b429;
  }
  * { box-sizing:border-box; margin:0; }
  body { background:var(--bg); color:var(--text); font-family:"Segoe UI",system-ui,sans-serif; display:flex; height:100vh; overflow:hidden; font-size:14px; }

  /* ---- sol menu ---- */
  aside { width:230px; min-width:230px; background:var(--panel); border-right:1px solid var(--border); display:flex; flex-direction:column; padding:16px 10px; }
  .logo { display:flex; align-items:center; gap:10px; padding:6px 10px 16px; border-bottom:1px solid var(--border); margin-bottom:12px; }
  .logo .mark { width:34px; height:34px; border-radius:10px; background:linear-gradient(135deg,var(--accent),var(--accent2)); display:flex; align-items:center; justify-content:center; font-weight:800; color:#fff; }
  .logo b { font-size:14px; } .logo span { display:block; font-size:11px; color:var(--muted); }
  .menu-label { font-size:10px; letter-spacing:1px; color:var(--muted); text-transform:uppercase; padding:10px 12px 4px; }
  .nav-btn { display:flex; align-items:center; gap:10px; width:100%; background:none; border:none; color:var(--muted); padding:9px 12px; border-radius:8px; cursor:pointer; font:inherit; font-size:13px; margin-bottom:2px; }
  .nav-btn:hover { background:var(--panel2); color:var(--text); }
  .nav-btn.active { background:linear-gradient(90deg,rgba(124,92,255,.25),rgba(79,140,255,.12)); color:#fff; border-left:3px solid var(--accent); }
  .nav-btn .badge { margin-left:auto; background:var(--accent); color:#fff; border-radius:10px; font-size:10px; padding:1px 7px; }
  .sys { margin-top:auto; padding:12px; border-top:1px solid var(--border); font-size:11px; color:var(--muted); }
  .sys .dot { color:var(--ok); }

  /* ---- ana alan ---- */
  main { flex:1; display:flex; flex-direction:column; overflow:hidden; }
  .topbar { height:54px; border-bottom:1px solid var(--border); display:flex; align-items:center; gap:14px; padding:0 20px; background:var(--panel); }
  .topbar .search { flex:1; max-width:480px; background:var(--bg); border:1px solid var(--border); border-radius:8px; padding:7px 12px; color:var(--muted); font-size:12px; }
  .topbar .status { margin-left:auto; font-size:12px; color:var(--ok); }
  .page { flex:1; overflow-y:auto; padding:20px; display:none; }
  .page.active { display:block; }

  /* ---- genel bilesenler ---- */
  .card { background:var(--panel); border:1px solid var(--border); border-radius:12px; padding:16px; margin-bottom:14px; }
  h2 { font-size:15px; margin-bottom:12px; } h3 { font-size:13px; margin-bottom:8px; color:var(--muted); }
  input, select, textarea { background:var(--bg); border:1px solid var(--border); color:var(--text); border-radius:8px; padding:8px 10px; width:100%; font:inherit; font-size:13px; margin-bottom:8px; }
  textarea { min-height:90px; resize:vertical; }
  .btn { background:linear-gradient(90deg,var(--accent),var(--accent2)); color:#fff; border:none; border-radius:8px; padding:9px 18px; cursor:pointer; font-weight:600; font-size:13px; }
  .btn.ghost { background:transparent; border:1px solid var(--border); color:var(--text); }
  .btn.danger { background:var(--err); }
  .btn:disabled { opacity:.5; cursor:not-allowed; }
  table { width:100%; border-collapse:collapse; font-size:12px; }
  th, td { text-align:left; padding:8px; border-bottom:1px solid var(--border); }
  th { color:var(--muted); font-weight:600; }
  .pill { padding:2px 9px; border-radius:10px; font-size:11px; font-weight:600; }
  .pill.ok { background:rgba(34,197,94,.15); color:var(--ok); }
  .pill.err { background:rgba(248,81,73,.15); color:var(--err); }
  .pill.unknown { background:rgba(138,147,184,.15); color:var(--muted); }
  .pill.warn { background:rgba(240,180,41,.15); color:var(--warn); }
  .muted { color:var(--muted); font-size:12px; }
  .row { display:flex; gap:8px; } .row > * { flex:1; }

  /* ---- chat sayfasi ---- */
  .chat-grid { display:grid; grid-template-columns:260px 1fr; gap:14px; height:100%; }
  .sess-item { padding:10px 12px; border-radius:8px; cursor:pointer; border:1px solid transparent; margin-bottom:6px; }
  .sess-item:hover { background:var(--panel2); }
  .sess-item.active { background:rgba(124,92,255,.15); border-color:var(--accent); }
  .sess-item b { font-size:12px; display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .sess-item span { font-size:11px; color:var(--muted); }
  .chat-area { display:flex; flex-direction:column; height:calc(100vh - 94px); }
  #chatlog { flex:1; overflow-y:auto; padding:6px 2px; }
  .msg { max-width:78%; padding:10px 14px; border-radius:12px; margin-bottom:10px; font-size:13px; white-space:pre-wrap; line-height:1.5; }
  .msg.user { margin-left:auto; background:rgba(124,92,255,.2); border:1px solid var(--accent); }
  .msg.agent { background:var(--panel2); border:1px solid var(--border); }
  .msg .who { font-size:10px; color:var(--muted); margin-bottom:4px; }
  .steps { margin-top:8px; }
  .step { display:flex; gap:10px; align-items:flex-start; padding:8px 0; border-bottom:1px dashed var(--border); font-size:12px; }
  .step .n { width:22px; height:22px; border-radius:50%; background:var(--panel); border:1px solid var(--accent); color:var(--accent); display:flex; align-items:center; justify-content:center; font-size:11px; flex-shrink:0; }
  .selectors { display:flex; gap:10px; flex-wrap:wrap; margin:10px 0; }
  .sel-box { flex:1; min-width:150px; }
  .sel-box label { font-size:10px; color:var(--muted); text-transform:uppercase; letter-spacing:.5px; display:block; margin-bottom:4px; }
  .badges { display:flex; gap:6px; flex-wrap:wrap; min-height:26px; margin-bottom:6px; }
  .mbadge { background:rgba(79,140,255,.15); border:1px solid var(--accent2); color:#bcd4ff; border-radius:14px; padding:3px 10px; font-size:11px; cursor:pointer; }
  .mbadge:hover { background:rgba(248,81,73,.2); border-color:var(--err); }
  .multi { position:relative; }
  .multi .drop { display:none; position:absolute; z-index:20; background:var(--panel2); border:1px solid var(--border); border-radius:8px; width:100%; max-height:180px; overflow-y:auto; }
  .multi.open .drop { display:block; }
  .multi .drop div { padding:8px 10px; font-size:12px; cursor:pointer; }
  .multi .drop div:hover { background:rgba(124,92,255,.2); }
  .multi .drop div.sel { color:var(--ok); }
  .route-preview { font-size:11px; color:var(--muted); background:var(--bg); border:1px dashed var(--border); border-radius:8px; padding:8px 10px; margin-bottom:8px; display:none; }

  /* ---- provider kartlari ---- */
  .prov-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:12px; }
  .prov-card { background:var(--panel); border:1px solid var(--border); border-radius:12px; padding:14px; }
  .prov-card .ic { width:38px; height:38px; border-radius:10px; background:linear-gradient(135deg,var(--accent),var(--accent2)); display:flex; align-items:center; justify-content:center; font-weight:800; margin-bottom:10px; }
  .prov-card b { font-size:13px; display:block; }
  .prov-card .kind { font-size:11px; color:var(--muted); }
  .tabs { display:flex; gap:6px; margin-bottom:14px; }
  .tab-btn { background:var(--panel); border:1px solid var(--border); color:var(--muted); border-radius:8px; padding:7px 16px; cursor:pointer; font-size:12px; }
  .tab-btn.active { background:rgba(124,92,255,.2); color:#fff; border-color:var(--accent); }
  .tabpane { display:none; } .tabpane.active { display:block; }
  .soon { border:1px dashed var(--border); border-radius:12px; padding:30px; text-align:center; color:var(--muted); }
</style>
</head>
<body>
<aside>
  <div class="logo"><div class="mark">H</div><div><b>HMX Agent</b><span>Control Center v2.0</span></div></div>
  <div class="menu-label">Ana Menu</div>
  <button class="nav-btn active" data-page="chat">&#128172; Chat</button>
  <button class="nav-btn" data-page="sessions">&#128193; Sessions <span class="badge" id="sess-count">0</span></button>
  <div class="menu-label">Server</div>
  <button class="nav-btn" data-page="servers">&#128421; Servers</button>
  <button class="nav-btn" data-page="providers">&#9881; Providers &amp; Accounts <span class="badge" id="prov-count">0</span></button>
  <button class="nav-btn" data-page="models">&#129518; Models</button>
  <div class="menu-label">Otomasyon</div>
  <button class="nav-btn" data-page="pipeline">&#9889; Pipeline</button>
  <button class="nav-btn" data-page="logs">&#128196; Logs</button>
  <button class="nav-btn" data-page="settings">&#128295; Ayarlar</button>
  <div class="sys"><span class="dot">&#9679;</span> Sistem durumu: <span id="sys-status">kontrol ediliyor...</span></div>
</aside>
<main>
  <div class="topbar">
    <input class="search" placeholder="Model, saglayici veya komut ara... (Ctrl+K)" disabled title="Yakinda">
    <span class="status" id="health-status"></span>
  </div>

  <!-- ============ CHAT ============ -->
  <div class="page active" id="page-chat">
    <div class="chat-grid">
      <div class="card" style="overflow-y:auto">
        <h2>Oturumlar</h2>
        <div id="chat-sessions"><span class="muted">Yukleniyor...</span></div>
      </div>
      <div class="card chat-area">
        <div id="chatlog">
          <div class="msg agent"><div class="who">HMX Agent</div>Merhaba! Gorevini yaz. Istersen prompt icinde yonlendirme kullan: <b>@image:flow-ai @video:flow-ai @audio:elevenlabs-web</b></div>
        </div>
        <div class="route-preview" id="route-preview"></div>
        <div class="badges" id="sel-badges"></div>
        <div class="selectors">
          <div class="sel-box"><label>Agent</label><select id="sel-agent"><option>HMX Agent (plan-onay)</option></select></div>
          <div class="sel-box"><label>LLM</label><select id="sel-llm"></select></div>
          <div class="sel-box"><label>Mod</label><select id="sel-mode"><option>High</option><option>Max</option><option>Low</option></select></div>
          <div class="sel-box"><label>Gorsel (coklu)</label><div class="multi" id="ms-image"><div class="badges" data-badges></div><input placeholder="Sec..." readonly onclick="this.parentElement.classList.toggle('open')"><div class="drop"></div></div></div>
          <div class="sel-box"><label>Video (coklu)</label><div class="multi" id="ms-video"><div class="badges" data-badges></div><input placeholder="Sec..." readonly onclick="this.parentElement.classList.toggle('open')"><div class="drop"></div></div></div>
          <div class="sel-box"><label>Ses (coklu)</label><div class="multi" id="ms-audio"><div class="badges" data-badges></div><input placeholder="Sec..." readonly onclick="this.parentElement.classList.toggle('open')"><div class="drop"></div></div></div>
        </div>
        <div class="row" style="align-items:flex-end">
          <textarea id="chatinput" placeholder="Mesajini yaz... (@image: @video: @audio: ile model sec)"></textarea>
          <button class="btn" style="flex:0 0 auto" onclick="sendChat()">Gonder</button>
        </div>
      </div>
    </div>
  </div>

  <!-- ============ SESSIONS ============ -->
  <div class="page" id="page-sessions">
    <h2>Oturumlar (Gorev Gunlukleri)</h2>
    <div class="card"><table><thead><tr><th>Oturum</th><th>Hedef</th><th>Adim</th><th>Hata</th><th>Son Aktivite</th></tr></thead><tbody id="sessions-body"></tbody></table></div>
    <div class="card"><h3>Oturum Detayi</h3><pre id="session-detail" class="muted" style="white-space:pre-wrap;font-size:11px;max-height:300px;overflow-y:auto">Soldan oturum sec.</pre></div>
  </div>

  <!-- ============ PROVIDERS & ACCOUNTS ============ -->
  <div class="page" id="page-providers">
    <div class="tabs">
      <button class="tab-btn active" data-tab="prov">Providers</button>
      <button class="tab-btn" data-tab="acc">Accounts</button>
      <button class="tab-btn" data-tab="route">Token Routing</button>
      <button class="tab-btn" data-tab="proxy">Proxies</button>
      <button class="tab-btn" data-tab="act">Activity &amp; Health</button>
    </div>

    <div class="tabpane active" id="tab-prov">
      <div class="prov-grid" id="prov-grid"></div>
      <div class="card">
        <h2>+ Yeni Saglayici Ekle</h2>
        <div class="row"><input id="p-id" placeholder="id (ornek: runway-web)">
        <select id="p-kind"><option value="video">video</option><option value="image">image</option><option value="audio">audio</option></select></div>
        <input id="p-url" placeholder="Base URL">
        <div class="row"><input id="p-prompt" placeholder="Prompt kutusu CSS selector"><input id="p-gen" placeholder="Uret butonu selector"></div>
        <div class="row"><input id="p-result" placeholder="Sonuc ogesi selector"><input id="p-dl" placeholder="Indir butonu selector"></div>
        <input id="p-fail" placeholder="Giris sayfasi URL parcasi (ornek: login)">
        <button class="btn" onclick="addProvider()">Ekle</button>
        <div class="muted" style="margin-top:6px">Ekledikten sonra terminalden giris yap: <b>hmx login &lt;id&gt;</b></div>
      </div>
    </div>

    <div class="tabpane" id="tab-acc">
      <div class="card"><h2>Hesap Havuzu</h2>
        <table><thead><tr><th>Hesap</th><th>Saglayici</th><th>Chrome Profili</th><th>Mod</th><th>Durum</th></tr></thead><tbody id="acc-body"></tbody></table>
        <div class="muted" style="margin-top:8px">Hesap eklemek icin: <b>hmx login &lt;saglayici&gt;</b> (her login bir hesap olusturur)</div>
      </div>
    </div>

    <div class="tabpane" id="tab-route">
      <div class="card"><h2>Yonlendirme Politikasi</h2><div id="routing-body" class="muted">Yukleniyor...</div></div>
    </div>

    <div class="tabpane" id="tab-proxy">
      <div class="soon"><h2>Proxy Yonetimi</h2><p>Bu modul sonraki sprintte planlaniyor. Su an proxy destegi yok; var gibi gosterilmiyor.</p></div>
    </div>

    <div class="tabpane" id="tab-act">
      <div class="card"><h2>Son Aktivite</h2><div id="activity-body" class="muted">Yukleniyor...</div></div>
    </div>
  </div>

  <!-- ============ MODELS ============ -->
  <div class="page" id="page-models">
    <h2>Kayitli Modeller</h2>
    <div class="card"><h3>LLM</h3><div id="models-llm"></div></div>
    <div class="card"><h3>Gorsel</h3><div id="models-image"></div></div>
    <div class="card"><h3>Video</h3><div id="models-video"></div></div>
    <div class="card"><h3>Ses</h3><div id="models-audio"></div></div>
  </div>

  <!-- ============ SERVERS ============ -->
  <div class="page" id="page-servers">
    <h2>Servers</h2>
    <div class="soon"><h2>Sunucu Yonetimi</h2><p>OpenCut MCP ve diger dis sunucu baglantilari sonraki sprintte. Su an yalnizca yerel HMX servisleri aktif.</p></div>
  </div>

  <!-- ============ PIPELINE ============ -->
  <div class="page" id="page-pipeline">
    <h2>Batch Pipeline</h2>
    <div class="soon"><h2>Pipeline Engine</h2><p>15-100 promptluk kuyruk motoru sonraki sprintte tasarlanacak (spec Bolum 7). Altyapi arayuzleri hazir, motor henuz yazilmadi.</p></div>
  </div>

  <!-- ============ LOGS ============ -->
  <div class="page" id="page-logs">
    <h2>Logs</h2>
    <div class="card"><table><thead><tr><th>Oturum</th><th>Adim</th><th>Hata</th><th>Son Aktivite</th></tr></thead><tbody id="logs-body"></tbody></table></div>
  </div>

  <!-- ============ SETTINGS ============ -->
  <div class="page" id="page-settings">
    <h2>Ayarlar</h2>
    <div class="card"><h3>Sistem</h3><div id="settings-body" class="muted">Yukleniyor...</div></div>
    <div class="card"><h3>Yapilandirma</h3>
      <p class="muted">Ayarlar proje klasorundeki <b>.env</b> dosyasindan okunur. Degisiklikten sonra paneli yeniden baslat.</p>
    </div>
  </div>
</main>
<script>
const api = (u, o) => fetch(u, o).then(r => r.json());
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

/* ---------- navigasyon ---------- */
document.querySelectorAll(".nav-btn").forEach(b => b.onclick = () => {
  document.querySelectorAll(".nav-btn").forEach(x => x.classList.remove("active"));
  document.querySelectorAll(".page").forEach(x => x.classList.remove("active"));
  b.classList.add("active");
  document.getElementById("page-" + b.dataset.page).classList.add("active");
  loadPage(b.dataset.page);
});
document.querySelectorAll(".tab-btn").forEach(b => b.onclick = () => {
  document.querySelectorAll(".tab-btn").forEach(x => x.classList.remove("active"));
  document.querySelectorAll(".tabpane").forEach(x => x.classList.remove("active"));
  b.classList.add("active");
  document.getElementById("tab-" + b.dataset.tab).classList.add("active");
  if (b.dataset.tab === "acc") loadAccounts();
  if (b.dataset.tab === "route") loadRouting();
  if (b.dataset.tab === "act") loadActivity();
});

function loadPage(p) {
  if (p === "providers") loadProviders();
  if (p === "models") loadModels();
  if (p === "sessions" || p === "logs") loadSessions(p);
  if (p === "settings") loadSettings();
  if (p === "chat") { loadChatSessions(); initSelectors(); }
}

/* ---------- saglik ---------- */
api("/api/health").then(h => {
  document.getElementById("health-status").textContent = "Sistem Aktif \xB7 " + h.llm.model;
  document.getElementById("sys-status").textContent = h.ffmpeg ? "Cevrimici (FFmpeg OK)" : "FFmpeg eksik!";
});

/* ---------- coklu model seciciler ---------- */
const multiState = { image: [], video: [], audio: [] };
let modelsCache = null;
function initSelectors() {
  if (modelsCache) return;
  api("/api/models").then(m => {
    modelsCache = m;
    const llmSel = document.getElementById("sel-llm");
    llmSel.innerHTML = m.llm.map(x => "<option>" + esc(x.id) + "</option>").join("");
    ["image", "video", "audio"].forEach(kind => {
      const box = document.getElementById("ms-" + kind);
      const drop = box.querySelector(".drop");
      drop.innerHTML = m[kind].map(x =>
        "<div data-id='" + esc(x.id) + "' onclick=toggleMulti('" + kind + "','" + esc(x.id) + "')>" + esc(x.id) + " <span class='muted'>(" + x.authMode + ")</span></div>"
      ).join("") || "<div class='muted' style='padding:8px'>Tanimli saglayici yok</div>";
    });
  });
}
function toggleMulti(kind, id) {
  const arr = multiState[kind];
  const i = arr.indexOf(id);
  i >= 0 ? arr.splice(i, 1) : arr.push(id);
  renderBadges(kind);
}
function renderBadges(kind) {
  const box = document.getElementById("ms-" + kind);
  const badges = box.querySelector("[data-badges]");
  badges.innerHTML = multiState[kind].map(id =>
    "<span class='mbadge' onclick=\\"toggleMulti('" + kind + "','" + id + "')\\">" + esc(id) + " &#10005;</span>"
  ).join("");
  box.querySelectorAll(".drop div[data-id]").forEach(d => d.classList.toggle("sel", multiState[kind].includes(d.dataset.id)));
}

/* ---------- chat ---------- */
function loadChatSessions() {
  api("/api/sessions").then(rows => {
    document.getElementById("sess-count").textContent = rows.length;
    document.getElementById("chat-sessions").innerHTML = rows.map(s =>
      "<div class='sess-item'><b>" + esc(s.title) + "</b><span>" + s.id + " \xB7 " + s.steps + " adim" + (s.errors ? " \xB7 " + s.errors + " hata" : "") + "</span></div>"
    ).join("") || "<span class='muted'>Henuz oturum yok</span>";
  });
}

async function sendChat() {
  const input = document.getElementById("chatinput");
  const log = document.getElementById("chatlog");
  const text = input.value.trim();
  if (!text) return;
  log.innerHTML += "<div class='msg user'><div class='who'>Siz</div>" + esc(text) + "</div>";
  input.value = "";

  // 1) yonlendirme onizleme (prompt parse)
  const route = await api("/api/route-preview", { method: "POST", headers: {"content-type":"application/json"},
    body: JSON.stringify({ prompt: text, uiSelection: multiState }) });
  const pv = document.getElementById("route-preview");
  const parts = Object.entries(route.effective).map(([k, v]) => k + " -> " + v.join(", "));
  pv.style.display = "block";
  pv.innerHTML = "Yonlendirme: " + (parts.join(" | ") || "varsayilan") +
    (route.unknown.length ? "<br><span style='color:var(--err)'>Taninmayan modeller: " + route.unknown.map(u => u.name).join(", ") + " (atlandi)</span>" : "");

  // 2) agent plan-onay dongusu
  log.innerHTML += "<div class='msg agent'><div class='who'>HMX Agent</div>Planlaniyor...</div>";
  log.scrollTop = log.scrollHeight;
  const d = await api("/api/chat", { method: "POST", headers: {"content-type":"application/json"}, body: JSON.stringify({ message: route.cleanPrompt }) });
  log.lastElementChild.remove();
  if (!d.ok) { log.innerHTML += "<div class='msg agent'><div class='who'>Hata</div>" + esc(d.error) + "</div>"; return; }
  const steps = d.plan.split("\\n").filter(l => l.trim()).slice(0, 8).map((l, i) =>
    "<div class='step'><div class='n'>" + (i + 1) + "</div><div>" + esc(l) + "</div></div>").join("");
  log.innerHTML += "<div class='msg agent'><div class='who'>HMX Agent \xB7 " + d.sessionId + "</div><b>Hedef:</b> " + esc(d.goal) +
    "<div class='steps'>" + steps + "</div><div class='muted' style='margin-top:6px'>Plan hazir. Uretim icin Medya bolumunu veya CLI'yi kullan: hmx generate ...</div></div>";
  log.scrollTop = log.scrollHeight;
  loadChatSessions();
}

/* ---------- providers ---------- */
function loadProviders() {
  api("/api/providers").then(rows => {
    document.getElementById("prov-count").textContent = rows.length;
    document.getElementById("prov-grid").innerHTML = rows.map(p =>
      "<div class='prov-card'><div class='ic'>" + esc(p.id[0].toUpperCase()) + "</div><b>" + esc(p.id) + "</b>" +
      "<div class='kind'>" + p.kind + " \xB7 " + p.authMode + "</div>" +
      "<div style='margin:8px 0'><span class='pill " + (p.circuitOpen ? "err" : "ok") + "'>" + (p.circuitOpen ? "Error (devre disi)" : "Configured") + "</span></div>" +
      "<div class='row'><button class='btn ghost' style='padding:5px 10px;font-size:11px' onclick=\\"testProvider('" + p.id + "',this)\\">Baglanti Testi</button>" +
      "<button class='btn danger' style='padding:5px 10px;font-size:11px' onclick=\\"delProvider('" + p.id + "')\\">Sil</button></div></div>"
    ).join("");
  });
}
async function testProvider(id, btn) {
  btn.disabled = true; btn.textContent = "Test ediliyor...";
  const d = await api("/api/providers/" + id + "/test", { method: "POST" });
  btn.textContent = d.ok ? "Connected" : "Error";
  btn.disabled = false;
}
async function addProvider() {
  const v = id => document.getElementById(id).value;
  const d = await api("/api/providers", { method: "POST", headers: {"content-type":"application/json"}, body: JSON.stringify({
    id: v("p-id"), kind: v("p-kind"), authMode: "browser-session", baseUrl: v("p-url"),
    loginCheck: { failUrlContains: v("p-fail") },
    selectors: { promptInput: v("p-prompt"), generateButton: v("p-gen"), resultItem: v("p-result"), downloadButton: v("p-dl") },
    timeouts: { generateMs: 300000 },
  })});
  if (d.ok) loadProviders(); else alert(d.error);
}
async function delProvider(id) {
  if (!confirm(id + " silinsin mi?")) return;
  await fetch("/api/providers/" + id, { method: "DELETE" });
  loadProviders();
}

/* ---------- accounts / routing / activity ---------- */
function loadAccounts() {
  api("/api/accounts").then(rows => {
    document.getElementById("acc-body").innerHTML = rows.map(a =>
      "<tr><td>" + esc(a.id) + "</td><td>" + esc(a.provider) + "</td><td>" + esc(a.profile) + "</td><td>" + esc(a.mode) + "</td><td><span class='pill ok'>" + a.status + "</span></td></tr>"
    ).join("") || "<tr><td colspan=5 class='muted'>Henuz hesap yok. hmx login ile ekle.</td></tr>";
  });
}
function loadRouting() {
  api("/api/routing").then(r => {
    document.getElementById("routing-body").innerHTML =
      "<p><b>Politika:</b> " + esc(r.policy) + "</p><br>" +
      Object.entries(r.order).map(([k, v]) => "<p><b>" + k + ":</b> " + v.map((x, i) => (i + 1) + ". " + esc(x)).join(" &rarr; ") + "</p>").join("") +
      "<br><p>Not: Kullanici promptta @kind:model belirtirse bu sira ezilir. Degistirmek icin .env: HMX_ORDER_VIDEO vb.</p>";
  });
}
function loadActivity() {
  api("/api/sessions").then(rows => {
    document.getElementById("activity-body").innerHTML = rows.slice(0, 10).map(s =>
      "<p>&#9679; <b>" + esc(s.title.slice(0, 60)) + "</b> \xB7 " + s.steps + " adim" + (s.errors ? " \xB7 <span style='color:var(--err)'>" + s.errors + " hata</span>" : "") + " \xB7 " + esc(String(s.lastTs ?? "").slice(0, 19).replace("T", " ")) + "</p>"
    ).join("") || "Aktivite yok.";
  });
}

/* ---------- sessions / logs ---------- */
function loadSessions(target) {
  api("/api/sessions").then(rows => {
    const html = rows.map(s =>
      "<tr style='cursor:pointer' onclick=\\"showSession('" + s.id + "')\\"><td>" + esc(s.id) + "</td><td>" + esc(s.title.slice(0, 50)) + "</td><td>" + s.steps + "</td><td>" +
      (s.errors ? "<span class='pill err'>" + s.errors + "</span>" : "<span class='pill ok'>0</span>") + "</td><td class='muted'>" + esc(String(s.lastTs ?? "").slice(0, 19).replace("T", " ")) + "</td></tr>"
    ).join("") || "<tr><td colspan=5 class='muted'>Kayit yok</td></tr>";
    const body = document.getElementById(target === "logs" ? "logs-body" : "sessions-body");
    if (body) body.innerHTML = html;
  });
}
async function showSession(id) {
  const evs = await api("/api/sessions/" + id);
  document.getElementById("session-detail").textContent = evs.map(e =>
    "[" + String(e.ts).slice(11, 19) + "] " + e.type.toUpperCase().padEnd(8) + " " + e.summary).join("\\n\\n");
  document.querySelector('[data-page="sessions"]').click();
}

/* ---------- models / settings ---------- */
function loadModels() {
  api("/api/models").then(m => {
    for (const k of ["llm", "image", "video", "audio"]) {
      document.getElementById("models-" + k).innerHTML = m[k].length
        ? m[k].map(x => "<span class='mbadge' style='cursor:default'>" + esc(x.id) + "</span>").join(" ")
        : "<span class='muted'>Tanimli yok</span>";
    }
  });
}
function loadSettings() {
  api("/api/health").then(h => {
    document.getElementById("settings-body").innerHTML =
      "<p><b>Veri dizini:</b> " + esc(h.home) + "</p><p><b>LLM:</b> " + esc(h.llm.baseUrl) + " \xB7 " + esc(h.llm.model) + "</p><p><b>FFmpeg:</b> " + (h.ffmpeg ? "OK" : "EKSIK") + "</p><p><b>Surum:</b> " + h.version + "</p>";
  });
}

/* ---------- baslangic ---------- */
initSelectors();
loadChatSessions();
loadProviders();
</script>
</body>
</html>`;

// ../../packages/dashboard-api/src/server.ts
var __dirname2 = import_node_path18.default.dirname((0, import_node_url4.fileURLToPath)(__import_meta_url));
var WEB_DIST_CANDIDATES = [
  process.env.HMX_WEB_DIST,
  // Electron paketinde resources/web-dist
  import_node_path18.default.resolve(process.cwd(), "apps/web/dist"),
  import_node_path18.default.resolve(__dirname2, "../../../apps/web/dist")
].filter(Boolean);
var WEB_DIST = WEB_DIST_CANDIDATES.find((d) => import_node_fs17.default.existsSync(import_node_path18.default.join(d, "index.html"))) ?? null;
var MIME = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon"
};
var SETTINGS_FILE = import_node_path18.default.join(HMX_HOME, "settings.json");
var DEFAULT_SETTINGS = { quotaCooldownMs: 6 * 60 * 60 * 1e3, orders: {}, approvalMode: "balanced", theme: "dark" };
function loadSettings() {
  return { ...DEFAULT_SETTINGS, ...readJson(SETTINGS_FILE) ?? {} };
}
function startDashboard(port2) {
  const envPort = Number(process.env.HMX_DASHBOARD_PORT ?? process.env.PORT);
  const finalPort = Number.isInteger(port2) && port2 > 0 && port2 < 65536 ? port2 : Number.isInteger(envPort) && envPort > 0 && envPort < 65536 ? envPort : 4173;
  ensureDirs();
  const app = new Hono3();
  const router = new MediaRouter();
  const catalog = new AssetCatalog();
  const agents = /* @__PURE__ */ new Map();
  const pendingLogins = /* @__PURE__ */ new Map();
  app.get("/", (c3) => {
    if (WEB_DIST) return c3.html(import_node_fs17.default.readFileSync(import_node_path18.default.join(WEB_DIST, "index.html"), "utf8"));
    return c3.html(DASHBOARD_HTML);
  });
  app.get("/assets/*", (c3) => {
    if (!WEB_DIST) return c3.notFound();
    const rel = c3.req.path.replace(/^\/+/, "");
    const file = import_node_path18.default.join(WEB_DIST, rel);
    if (!file.startsWith(WEB_DIST) || !import_node_fs17.default.existsSync(file)) return c3.notFound();
    return c3.body(import_node_fs17.default.readFileSync(file), 200, { "content-type": MIME[import_node_path18.default.extname(file)] ?? "application/octet-stream" });
  });
  app.get("/api/providers", (c3) => c3.json(router.list()));
  app.post("/api/providers", async (c3) => {
    const cfg = await c3.req.json();
    if (!cfg.id || !cfg.baseUrl || !cfg.kind || !cfg.authMode) return c3.json({ ok: false, error: "id, baseUrl, kind, authMode zorunlu" }, 400);
    saveProviderConfig(cfg);
    router.reload();
    return c3.json({ ok: true });
  });
  app.delete("/api/providers/:id", (c3) => {
    deleteProviderConfig(c3.req.param("id"));
    router.reload();
    return c3.json({ ok: true });
  });
  app.post("/api/providers/:id/test", async (c3) => {
    const p = router.providers.find((x) => x.id === c3.req.param("id"));
    if (!p) return c3.json({ ok: false, error: "saglayici yok" }, 404);
    const ok = await p.isAvailable();
    return c3.json({ ok, status: ok ? "Connected" : "Error" });
  });
  app.get("/api/accounts", (c3) => {
    const pool = new AccountPool();
    return c3.json(pool.listAll().map((a2) => ({
      id: a2.id,
      provider: a2.providerId,
      label: a2.label,
      profile: a2.profileDirectory ?? null,
      hasApiKey: !!a2.apiKey,
      status: a2.status,
      failCount: a2.failCount,
      cooldownUntil: a2.cooldownUntil ?? null,
      cooldownRemainingMs: a2.cooldownUntil ? Math.max(0, a2.cooldownUntil - Date.now()) : 0,
      lastUsedAt: a2.lastUsedAt ?? null,
      notes: a2.notes ?? null
    })));
  });
  app.post("/api/accounts", async (c3) => {
    const body = await c3.req.json();
    if (!body.providerId || !body.apiKey && !body.profileDirectory) {
      return c3.json({ ok: false, error: "providerId + (apiKey veya profileDirectory) zorunlu" }, 400);
    }
    const pool = new AccountPool();
    const acc = pool.add({ providerId: body.providerId, label: body.label ?? "Hesap", apiKey: body.apiKey, profileDirectory: body.profileDirectory });
    return c3.json({ ok: true, account: { id: acc.id, provider: acc.providerId, label: acc.label } });
  });
  app.delete("/api/accounts/:providerId/:accountId", (c3) => {
    const pool = new AccountPool();
    return c3.json({ ok: pool.remove(c3.req.param("providerId"), c3.req.param("accountId")) });
  });
  app.get("/api/chrome-profiles", (c3) => {
    try {
      return c3.json(listChromeProfiles());
    } catch (e) {
      return c3.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, 500);
    }
  });
  app.post("/api/accounts/login/start", async (c3) => {
    const body = await c3.req.json();
    const cfg = loadProviderConfigs().find((x) => x.id === body.providerId);
    if (!cfg) return c3.json({ ok: false, error: "saglayici yok" }, 404);
    if (!body.profileDir) return c3.json({ ok: false, error: "profileDir zorunlu" }, 400);
    try {
      const { ensureProfileCopy: ensureProfileCopy2 } = await Promise.resolve().then(() => (init_src2(), src_exports2));
      ensureProfileCopy2(body.profileDir);
      const { proc } = await launchRealChrome({ url: cfg.baseUrl, profileDir: body.profileDir });
      const pendingId = `login_${Date.now()}`;
      pendingLogins.set(pendingId, { providerId: body.providerId, label: body.label, profileDir: body.profileDir, kill: () => proc.kill("SIGTERM") });
      return c3.json({ ok: true, pendingId, message: "Chrome acildi. Siteye giris yapin, sonra 'Kaydet' deyin." });
    } catch (e) {
      return c3.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, 500);
    }
  });
  app.post("/api/accounts/login/finish", async (c3) => {
    const { pendingId } = await c3.req.json();
    const pending = pendingLogins.get(pendingId);
    if (!pending) return c3.json({ ok: false, error: "bekleyen giris yok (suresi dolmus olabilir)" }, 404);
    pending.kill();
    pendingLogins.delete(pendingId);
    const pool = new AccountPool();
    const acc = pool.add({ providerId: pending.providerId, label: pending.label ?? pending.profileDir, profileDirectory: pending.profileDir });
    return c3.json({ ok: true, account: { id: acc.id, provider: acc.providerId, label: acc.label } });
  });
  app.get("/api/sessions", (c3) => {
    const out = [];
    if (import_node_fs17.default.existsSync(paths.logs)) {
      for (const f of import_node_fs17.default.readdirSync(paths.logs).filter((f2) => f2.endsWith(".jsonl"))) {
        const lines = import_node_fs17.default.readFileSync(import_node_path18.default.join(paths.logs, f), "utf8").trim().split("\n");
        const events = lines.map((l) => {
          try {
            return JSON.parse(l);
          } catch {
            return null;
          }
        }).filter(Boolean);
        const goal = events.find((e) => e.type === "goal");
        out.push({
          id: f.replace(".jsonl", ""),
          title: goal?.summary ?? "(hedefsiz oturum)",
          steps: events.length,
          errors: events.filter((e) => e.type === "error").length,
          lastTs: events.at(-1)?.ts
        });
      }
    }
    out.sort((a2, b) => String(b.lastTs).localeCompare(String(a2.lastTs)));
    return c3.json(out);
  });
  app.get("/api/sessions/:id", (c3) => {
    const f = import_node_path18.default.join(paths.logs, `${c3.req.param("id")}.jsonl`);
    if (!import_node_fs17.default.existsSync(f)) return c3.json({ ok: false, error: "oturum yok" }, 404);
    return c3.json(import_node_fs17.default.readFileSync(f, "utf8").trim().split("\n").map((l) => {
      try {
        return JSON.parse(l);
      } catch {
        return null;
      }
    }).filter(Boolean));
  });
  app.get("/api/models", (c3) => {
    const cfgs = loadProviderConfigs();
    return c3.json({
      llm: [{ id: process.env.HMX_LLM_MODEL ?? "qwen2.5:14b", provider: process.env.HMX_LLM_BASE_URL ?? "ollama" }],
      image: cfgs.filter((x) => x.kind === "image").map((x) => ({ id: x.id, authMode: x.authMode, tier: x.tier ?? null })),
      video: cfgs.filter((x) => x.kind === "video").map((x) => ({ id: x.id, authMode: x.authMode, tier: x.tier ?? null })),
      audio: cfgs.filter((x) => x.kind === "audio").map((x) => ({ id: x.id, authMode: x.authMode, tier: x.tier ?? null }))
    });
  });
  app.post("/api/models/test", async (c3) => {
    const body = await c3.req.json().catch(() => ({}));
    const llm = new (await Promise.resolve().then(() => (init_src(), src_exports))).LlmClient({
      baseUrl: body.baseUrl ?? process.env.HMX_LLM_BASE_URL ?? "http://localhost:11434/v1",
      model: body.model ?? process.env.HMX_LLM_MODEL ?? "qwen2.5:14b",
      apiKey: body.apiKey ?? process.env.HMX_LLM_API_KEY
    });
    try {
      const reply = await llm.chat([{ role: "user", content: "ping (tek kelimeyle cevap ver: pong)" }]);
      return c3.json({ ok: true, reply: reply.slice(0, 100) });
    } catch (e) {
      return c3.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, 502);
    }
  });
  app.post("/api/route-preview", async (c3) => {
    const { prompt, uiSelection } = await c3.req.json();
    const parsed = parsePromptRoute(prompt ?? "", uiSelection ?? {}, loadProviderConfigs());
    return c3.json(parsed);
  });
  app.get("/api/routing", (c3) => {
    const snap = quotaSnapshot(router);
    return c3.json({
      order: {
        video: router.orderFor("video"),
        image: router.orderFor("image"),
        audio: router.orderFor("audio"),
        llm: router.orderFor("llm")
      },
      policy: "preferred > tier (subscription -> cheap -> free) + circuit breaker (2 hata = 5 dk devre disi)",
      accounts: snap.accounts,
      circuits: snap.circuits,
      tokenSaver: snap.tokenSaver
    });
  });
  app.get("/api/health", (c3) => {
    const snap = quotaSnapshot(router);
    return c3.json({
      ok: true,
      version: "2.0.0",
      llm: { baseUrl: process.env.HMX_LLM_BASE_URL ?? "http://localhost:11434/v1", model: process.env.HMX_LLM_MODEL ?? "qwen2.5:14b" },
      ffmpeg: (() => {
        try {
          (0, import_node_child_process7.execSync)("ffmpeg -version", { stdio: "ignore" });
          return true;
        } catch {
          return false;
        }
      })(),
      home: paths.home,
      firstRun: !import_node_fs17.default.existsSync(SETTINGS_FILE),
      quota: { accounts: snap.accounts.length, cooldown: snap.accounts.filter((a2) => a2.status === "cooldown").length, error: snap.accounts.filter((a2) => a2.status === "error").length },
      tokenSaver: snap.tokenSaver
    });
  });
  app.post("/api/generate", async (c3) => {
    const body = await c3.req.json();
    const { kind, prompt, voiceId, aspectRatio, preferred } = body;
    if (!kind || !prompt) return c3.json({ ok: false, error: "kind ve prompt zorunlu" }, 400);
    const ext = kind === "audio" ? "mp3" : kind === "video" ? "mp4" : "png";
    const out = import_node_path18.default.join(paths.media, `${kind}-${Date.now()}.${ext}`);
    const result = await router.generate(kind, { prompt, outputPath: out, voiceId, aspectRatio }, preferred);
    if (!result.ok) return c3.json(result, 502);
    const asset = catalog.register({ type: kind, provider: result.provider, prompt, filePath: result.filePath, tags: body.tags ?? [] });
    return c3.json({ ok: true, asset });
  });
  app.get("/api/assets", (c3) => c3.json(catalog.query({ type: c3.req.query("type") })));
  app.post("/api/compose", async (c3) => {
    const body = await c3.req.json();
    try {
      const out = body.out ?? import_node_path18.default.join(paths.media, `composed-${Date.now()}.mp4`);
      const r = await composeProject({ clips: body.clips, voiceover: body.voiceover, music: body.music, out });
      return c3.json({ ok: true, ...r });
    } catch (e) {
      return c3.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, 500);
    }
  });
  app.post("/api/chat", async (c3) => {
    const { message } = await c3.req.json();
    try {
      const agent = new HmxAgent();
      const { goal, plan } = await agent.startTask(message);
      agents.set(agent.sessionId, agent);
      return c3.json({ ok: true, goal, plan, sessionId: agent.sessionId });
    } catch (e) {
      return c3.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, 500);
    }
  });
  app.post("/api/chat/step", async (c3) => {
    const { sessionId, instruction } = await c3.req.json();
    const agent = agents.get(sessionId);
    if (!agent) return c3.json({ ok: false, error: "oturum bulunamadi (sunucu yeniden baslatilmis olabilir)" }, 404);
    try {
      const reply = await agent.step(instruction ?? "Plani uygula. Her adimdan sonra dogrulama yap ve <verification> raporu ile bitir.");
      return c3.json({ ok: true, reply });
    } catch (e) {
      return c3.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, 500);
    }
  });
  app.post("/api/chat/smart", async (c3) => {
    const body = await c3.req.json();
    const { message, sessionId: clientSid, model, agentId, confirmed, dryRun } = body;
    if (!message) return c3.json({ ok: false, error: "message zorunlu" }, 400);
    const settings = loadSettings();
    const mode = settings.approvalMode ?? "balanced";
    const route = parsePromptRoute(message, {}, loadProviderConfigs());
    const hasMediaDirective = Object.keys(route.directives).length > 0;
    if (hasMediaDirective) {
      if (route.unknown.length > 0) {
        return c3.json({ ok: false, error: `Bilinmeyen model: ${route.unknown.map((u2) => u2.name).join(", ")}` }, 400);
      }
      const needsApproval = shouldRequireApproval("moderate", mode);
      if (dryRun || needsApproval && !confirmed) {
        return c3.json({ ok: true, mode: needsApproval ? "needs-approval" : "media", risk: "moderate", directives: route.directives, cleanPrompt: route.cleanPrompt });
      }
      const results = [];
      for (const [kind, ids] of Object.entries(route.directives)) {
        for (const pid of ids) {
          const ext = kind === "audio" ? "mp3" : kind === "video" ? "mp4" : "png";
          const out = import_node_path18.default.join(paths.media, `${kind}-${Date.now()}.${ext}`);
          const r = await router.generate(kind, { prompt: route.cleanPrompt, outputPath: out }, pid);
          if (r.ok) catalog.register({ type: kind, provider: r.provider, prompt: route.cleanPrompt, filePath: r.filePath, tags: [] });
          results.push({ kind, provider: pid, ...r });
        }
      }
      return c3.json({ ok: true, mode: "media", results });
    }
    const risk = classifyMessageRisk(message);
    if (dryRun) {
      return c3.json({ ok: true, mode: shouldRequireApproval(risk, mode) ? "needs-approval" : "chat", risk, approvalMode: mode });
    }
    if (shouldRequireApproval(risk, mode) && !confirmed) {
      return c3.json({ ok: true, mode: "needs-approval", risk, approvalMode: mode });
    }
    const sid = clientSid || `chat_${Date.now()}`;
    let agent = agents.get(sid);
    if (!agent) {
      agent = new HmxAgent(void 0, agentId);
      agents.set(sid, agent);
    }
    if (model) agent.setModel(model);
    try {
      const reply = await agent.chat(message);
      return c3.json({ ok: true, mode: "chat", reply, sessionId: sid, model: agent.currentModel });
    } catch (e) {
      return c3.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, 502);
    }
  });
  app.post("/api/chat/stream", async (c3) => {
    const { message, sessionId: clientSid, model, agentId } = await c3.req.json();
    if (!message) return c3.json({ ok: false, error: "message zorunlu" }, 400);
    const sid = clientSid || `chat_${Date.now()}`;
    let agent = agents.get(sid);
    if (!agent) {
      agent = new HmxAgent(void 0, agentId);
      agents.set(sid, agent);
    }
    if (model) agent.setModel(model);
    const { streamSSE: streamSSE2 } = await Promise.resolve().then(() => (init_streaming(), streaming_exports));
    return streamSSE2(c3, async (stream2) => {
      try {
        await agent.chat(message, (token) => {
          void stream2.writeSSE({ data: JSON.stringify({ token }) });
        });
        await stream2.writeSSE({ data: JSON.stringify({ done: true, sessionId: sid, model: agent.currentModel }) });
      } catch (e) {
        await stream2.writeSSE({ data: JSON.stringify({ error: e instanceof Error ? e.message : String(e) }) });
      }
    });
  });
  const agentRegistry = new AgentRegistry();
  app.get("/api/agents", (c3) => c3.json(agentRegistry.list()));
  app.post("/api/agents", async (c3) => {
    const body = await c3.req.json();
    if (!body.id || !body.name) return c3.json({ ok: false, error: "id ve name zorunlu" }, 400);
    return c3.json({ ok: true, agent: agentRegistry.save(body) });
  });
  app.delete("/api/agents/:id", (c3) => c3.json({ ok: agentRegistry.remove(c3.req.param("id")) }));
  app.get("/api/llm/models", async (c3) => {
    try {
      const { LlmClient: LlmClient2 } = await Promise.resolve().then(() => (init_src(), src_exports));
      const models = await LlmClient2.fromEnv().listModels();
      return c3.json({ ok: true, models });
    } catch (e) {
      return c3.json({ ok: false, error: e instanceof Error ? e.message : String(e), models: [] });
    }
  });
  app.get("/api/logs", (c3) => {
    if (!import_node_fs17.default.existsSync(paths.logs)) return c3.json([]);
    return c3.json(import_node_fs17.default.readdirSync(paths.logs).filter((f) => f.endsWith(".jsonl") || f.endsWith(".log")).sort().reverse());
  });
  app.get("/api/logs/:name", (c3) => {
    const name = c3.req.param("name");
    if (name.includes("..") || name.includes("/") || name.includes("\\")) return c3.json({ ok: false, error: "gecersiz ad" }, 400);
    const f = import_node_path18.default.join(paths.logs, name);
    if (!import_node_fs17.default.existsSync(f)) return c3.json({ ok: false, error: "dosya yok" }, 404);
    const tail = Math.min(Number(c3.req.query("tail")) || 200, 2e3);
    const lines = import_node_fs17.default.readFileSync(f, "utf8").trim().split("\n");
    return c3.json({ lines: lines.slice(-tail), total: lines.length });
  });
  app.get("/api/settings", (c3) => c3.json(loadSettings()));
  app.post("/api/settings", async (c3) => {
    const body = await c3.req.json();
    const merged = { ...loadSettings(), ...body, orders: { ...loadSettings().orders, ...body.orders ?? {} } };
    writeJson(SETTINGS_FILE, merged);
    if (merged.llm?.baseUrl) process.env.HMX_LLM_BASE_URL = merged.llm.baseUrl;
    if (merged.llm?.model) process.env.HMX_LLM_MODEL = merged.llm.model;
    for (const kind of ["image", "video", "audio", "llm"]) {
      const v = merged.orders[kind];
      if (v) process.env[`HMX_ORDER_${kind.toUpperCase()}`] = v;
    }
    return c3.json({ ok: true, settings: merged });
  });
  const server = serve({ fetch: app.fetch, port: finalPort });
  console.log(`
HMX Dashboard calisiyor: http://localhost:${finalPort}`);
  console.log(`Veriler: ${paths.home}`);
  if (WEB_DIST) console.log(`UI: ${WEB_DIST}`);
  return server;
}

// src/main/server.ts
var port = Number(process.argv[2]);
if (!Number.isInteger(port) || port <= 0) {
  console.error("Gecersiz port argumani:", process.argv[2]);
  process.exit(1);
}
startDashboard(port);
