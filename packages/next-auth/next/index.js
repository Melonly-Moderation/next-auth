"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
exports.getServerSession = getServerSession;
exports.unstable_getServerSession = unstable_getServerSession;

var _core = require("../core");

var _utils = require("./utils");

async function NextAuthApiHandler(req, res, options) {
  var _options$secret, _options$jwt$secret, _options$jwt, _ref, _handler$status, _handler$cookies, _handler$headers;

  const {
    nextauth,
    ...query
  } = req.query;
  (_options$secret = options.secret) !== null && _options$secret !== void 0 ? _options$secret : options.secret = (_options$jwt$secret = (_options$jwt = options.jwt) === null || _options$jwt === void 0 ? void 0 : _options$jwt.secret) !== null && _options$jwt$secret !== void 0 ? _options$jwt$secret : process.env.NEXTAUTH_SECRET;
  const handler = await (0, _core.AuthHandler)({
    req: {
      body: req.body,
      query,
      cookies: req.cookies,
      headers: req.headers,
      method: req.method,
      action: nextauth === null || nextauth === void 0 ? void 0 : nextauth[0],
      providerId: nextauth === null || nextauth === void 0 ? void 0 : nextauth[1],
      error: (_ref = req.query.error) !== null && _ref !== void 0 ? _ref : nextauth === null || nextauth === void 0 ? void 0 : nextauth[1]
    },
    options
  });
  res.status((_handler$status = handler.status) !== null && _handler$status !== void 0 ? _handler$status : 200);
  (_handler$cookies = handler.cookies) === null || _handler$cookies === void 0 ? void 0 : _handler$cookies.forEach(cookie => (0, _utils.setCookie)(res, cookie));
  (_handler$headers = handler.headers) === null || _handler$headers === void 0 ? void 0 : _handler$headers.forEach(h => res.setHeader(h.key, h.value));

  if (handler.redirect) {
    var _req$body;

    if (((_req$body = req.body) === null || _req$body === void 0 ? void 0 : _req$body.json) !== "true") {
      res.status(302).setHeader("Location", handler.redirect);
      return res.end();
    }

    return res.json({
      url: handler.redirect
    });
  }

  return res.send(handler.body);
}

async function NextAuthRouteHandler(req, context, options) {
  var _options$secret2, _context$params, _query$error;

  (_options$secret2 = options.secret) !== null && _options$secret2 !== void 0 ? _options$secret2 : options.secret = process.env.NEXTAUTH_SECRET;

  const {
    headers,
    cookies
  } = require("next/headers");

  const nextauth = (_context$params = context.params) === null || _context$params === void 0 ? void 0 : _context$params.nextauth;
  const query = Object.fromEntries(req.nextUrl.searchParams);
  const body = await (0, _utils.getBody)(req);
  const internalResponse = await (0, _core.AuthHandler)({
    req: {
      body,
      query,
      cookies: Object.fromEntries(cookies().getAll().map(c => [c.name, c.value])),
      headers: Object.fromEntries(headers()),
      method: req.method,
      action: nextauth === null || nextauth === void 0 ? void 0 : nextauth[0],
      providerId: nextauth === null || nextauth === void 0 ? void 0 : nextauth[1],
      error: (_query$error = query.error) !== null && _query$error !== void 0 ? _query$error : nextauth === null || nextauth === void 0 ? void 0 : nextauth[1]
    },
    options
  });
  const response = (0, _utils.toResponse)(internalResponse);
  const redirect = response.headers.get("Location");

  if ((body === null || body === void 0 ? void 0 : body.json) === "true" && redirect) {
    response.headers.delete("Location");
    response.headers.set("Content-Type", "application/json");
    return new Response(JSON.stringify({
      url: redirect
    }), {
      headers: response.headers
    });
  }

  return response;
}

function NextAuth(...args) {
  var _args$;

  if (args.length === 1) {
    return async (req, res) => {
      if (res !== null && res !== void 0 && res.params) {
        return await NextAuthRouteHandler(req, res, args[0]);
      }

      return await NextAuthApiHandler(req, res, args[0]);
    };
  }

  if ((_args$ = args[1]) !== null && _args$ !== void 0 && _args$.params) {
    return NextAuthRouteHandler(...args);
  }

  return NextAuthApiHandler(...args);
}

var _default = NextAuth;
exports.default = _default;
let experimentalRSCWarningShown = false;

async function getServerSession(...args) {
  var _options, _options$secret3;

  const isRSC = args.length === 0 || args.length === 1;

  if (!experimentalRSCWarningShown && isRSC && process.env.NODE_ENV !== "production") {
    console.warn("[next-auth][warn][EXPERIMENTAL_API]", "\n`getServerSession` is used in a React Server Component.", `\nhttps://next-auth.js.org/configuration/nextjs#getServerSession}`, `\nhttps://next-auth.js.org/warnings#EXPERIMENTAL_API`);
    experimentalRSCWarningShown = true;
  }

  let req, res, options;

  if (isRSC) {
    options = Object.assign({}, args[0], {
      providers: []
    });

    const {
      headers,
      cookies
    } = require("next/headers");

    req = {
      headers: Object.fromEntries(headers()),
      cookies: Object.fromEntries(cookies().getAll().map(c => [c.name, c.value]))
    };
    res = {
      getHeader() {},

      setCookie() {},

      setHeader() {}

    };
  } else {
    req = args[0];
    res = args[1];
    options = Object.assign({}, args[2], {
      providers: []
    });
  }

  (_options$secret3 = (_options = options).secret) !== null && _options$secret3 !== void 0 ? _options$secret3 : _options.secret = process.env.NEXTAUTH_SECRET;
  const session = await (0, _core.AuthHandler)({
    options,
    req: {
      action: "session",
      method: "GET",
      cookies: req.cookies,
      headers: req.headers
    }
  });
  const {
    body,
    cookies,
    status = 200
  } = session;
  cookies === null || cookies === void 0 ? void 0 : cookies.forEach(cookie => (0, _utils.setCookie)(res, cookie));

  if (body && typeof body !== "string" && Object.keys(body).length) {
    if (status === 200) {
      if (isRSC) delete body.expires;
      return body;
    }

    throw new Error(body.message);
  }

  return null;
}

let deprecatedWarningShown = false;

async function unstable_getServerSession(...args) {
  if (!deprecatedWarningShown && process.env.NODE_ENV !== "production") {
    console.warn("`unstable_getServerSession` has been renamed to `getServerSession`.");
    deprecatedWarningShown = true;
  }

  return await getServerSession(...args);
}