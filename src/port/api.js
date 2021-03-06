const querystring = require('querystring')
const request = require('request')

const baseUrl = 'https://www.pandora.com/'

/**
 * Requests the API.
 * @param {string} endpoint The endpoint you want to request for.
 * @param {Object} options The request options.
 * @param {string} [options.method='post'] The method you want the request to use.
 * @param {Object} options.query An object indicating the different queries.
 * @param {Object} options.headers An objects containing the headers you want to include.
 * @param {Object} options.content The body of the request
 * @param {boolean} [options.cookies=true] Whether or not to include cookies with the request.
 * @param {boolean} [options.auth=true] Whether ot not to include the authToken
 * @returns {Promise<Object>} The request response in JSON.
 */
const makeRequest = (endpoint, options) => {
  const url = `${baseUrl}api/${options.version || 'v1'}/${endpoint}${options.query
    ? `?${querystring.stringify(options.query)}`
    : ''
  }`

  const jar = request.jar()
  const cookies = jar.getCookies()

  const headers = {
    'Content-Type': 'application/json',
    'X-CsrfToken': cookies['csrftoken'],
    ...options.headers
  }

  if (options.cookies) {
    headers.Cookie = jar.getCookieString()
  }

  const reqOpts = {
    method: options.method || 'post',
    url,
    jar,
    headers
  }

  if (options.content) {
    reqOpts.body = JSON.stringify(options.content)
  }

  return new Promise((resolve, reject) => {
    request(reqOpts, (error, response, body) => {
      if (error) {
        reject(error)
      }

      setCookies(response, jar)

      resolve({ response, body })
    })
  })
}

/**
 * Calls the auth/login endpoint.
 * @param {String} username The username.
 * @param {String} password The password.
 * @returns {Promise<Object>}
 */
const login = async (username, password) => {
  await getCSRFToken()
  
  return new Promise((resolve, reject) => {
    makeRequest('auth/login', {
      content: { username, password }
    }).then(response => {
      resolve(response)
    }).catch(error => {
      reject(error)
    })
  })
}

/*
'set-cookie': [ 'v2regbstage=;Version=1;Path=/;Domain=.pandora.com;Expires=Thu, 01-Jan-1970 00:00:00 GMT;Max-Age=0',
     'csrftoken=3c9d209bafb5729b;Path=/;Domain=.pandora.com;Secure' ]
*/

/** Methods */
const getCSRFToken = () => {
  const jar = request.jar()

  return new Promise((resolve, reject) => {
    request.head(baseUrl, (error, response, body) => {
      if (error) {
        reject(error)
      }
      setCookies(response, jar)
      resolve(body)
    })
  })
}

const setCookies = (res, jar) => (res.headers['set-cookie'] || []).map(cookie => {
  Object.entries(cookie).forEach(([key, value]) => jar.setCookie(key, value))
})

module.exports = {
  login
}

// /**
//    * Calls the auth/login endpoint.
//    * @param {String} username The username.
//    * @param {String} password The password.
//    * @returns {Promise<Object>}
//    */
// export const login = async (username, password) => await request("auth/login", {
//   content: { username, password }
// })

// /**
//  * Handles all REST requests related to the API.
//  *
//  * @typedef {import('./Client.js')} Client
//  */
// class RESTManager {
//   /**
//    * @param {Client} client The client that runs the REST manager.
//    */
//   constructor(client) {
//     this.client = client;

//     /**
//      * The cookies for this REST manager.
//      * @type {Object}
//      */
//     this.cookies = {};

//     /**
//      * The Pandora Website URL
//      * @type {String}
//      */
//     this.url = "https://www.pandora.com/";

//     /**
//      * The user object gotten after login.
//      * @type {User|null}
//      */
//     this.user = null;
//   }

//   /** Util */
//   /**
//    * Requests the API.
//    * @param {string} endpoint The endpoint you want to request for.
//    * @param {Object} options The request options.
//    * @param {string} [options.method='post'] The method you want the request to use.
//    * @param {Object} options.query An object indicating the different queries.
//    * @param {Object} options.headers An objects containing the headers you want to include.
//    * @param {Snekfetch.Data} options.content The body of the request
//    * @param {boolean} [options.cookies=true] Whether or not to include cookies with the request.
//    * @param {boolean} [options.auth=true] Whether ot not to include the authToken if {@link RESTManager#user} is defined.
//    * @param {boolean} [options.raw=false] Set to true if you want to get the raw result from snekfetch, instead of attempting to parse it.
//    * @returns {Promise<Object>} The request response in JSON unless raw was defined.
//    */
//   async request(endpoint, options = {}) {
//     if (options.query) options.query = querystring.stringify(options.query);
//     options.url = `${this.url}api/${options.version || "v1"}/${endpoint}${options.query ? `?${options.query}` : ""}`;
//     this.client.debug(options.url);
//     let req = snekfetch[options.method || "post"](options.url)
//       .set("X-CsrfToken", this.cookies.csrftoken)
//       .set("Content-Type", "application/json");
//     if (this.client.user && options.user != false) req = req.set("X-AuthToken", this.client.user.token);
//     if (options.cookies != false) req = req.set("Cookie", this.getCookieString());
//     if (options.headers) req = req.set(options.headers);
//     if (options.content) req = req.send(options.content);
//     const res = await req;
//     if (res.headers["set-cookie"]) this.setCookies(res.headers["set-cookie"]);
//     if (options.raw) return res;
//     else return res.body;
//   }

//   /** Cookies */

//   /**
//    * Get the HTTP-serialized cookie string.
//    * @returns {String}
//    */
//   getCookieString() {
//     const arr = [];
//     Object.keys(this.cookies).forEach(key => {
//       arr.push(cookie.serialize(key, this.cookies[key]));
//     });
//     return arr.join(";");
//   }

//   /**
//    * Set the cookies from the HTTP-set-cookie header.
//    * @param {Array<String>} header An array of strings from the header.
//    * @returns {Object}
//    */
//   setCookies(header) {
//     header.map(cookie.parse.bind(this)).forEach(co => {
//       Object.keys(co).forEach(key => {
//         this.cookies[key] = co[key];
//       });
//     });
//     return this.cookies;
//   }

//   /** Methods */
//   async getCSRFToken() {
//     const res = await snekfetch.head(this.url);
//     this.setCookies(res.headers["set-cookie"] || []);
//     return res;
//   }

//   /**
//    * Calls the auth/login endpoint.
//    * @param {String} username The username.
//    * @param {String} password The password.
//    * @returns {Promise<Object>}
//    */
//   async authLogin(username, password) {
//     const res = await this.request("auth/login", {
//       content: { username, password }
//     });
//     return res;
//   }

//   /**
//    * Gets a list of stations.
//    * @param {Object} options
//    * @param {number} options.pageSize How big each page is.
//    */
//   async stationGetStations(options = {}) {
//     const res = await this.request("station/getStations", {
//       content: options
//     });
//     return res;
//   }

//   /**
//    * Calls the playlist/getFragment endpoint.
//    * @param {String} stationId The station id.
//    * @param {boolean} isStationStart Should be set to true if you're starting the station for the first time.
//    * @param {Object} options
//    * @param {string} options.audioFormat The audio format to use. Current types are unknown.
//    * @param {string} options.fragmentRequestReason Should be "Normal", other reasons currently unknown.
//    * @returns {Promise<Object>}
//    */
//   async playlistGetFragment(stationId, isStationStart, options = {}) {
//     const res = await this.request("playlist/getFragment", {
//       content: Object.assign({ stationId, isStationStart }, options)
//     });
//     return res;
//   }

//   /**
//    * Calls the search endpoint.
//    * @param {string} query The search query.
//    * @param {number} count The amount of results to recieve.
//    * @param {Array<String>} types The different types of things to search for.
//    * @param {Object} options
//    * @returns {Promise<Object>}
//    */
//   async sodSearch(query, count, types, options = {}) {
//     const res = await this.request("sod/search", {
//       content: Object.assign({ query, count, types }, options),
//       version: "v3"
//     });
//     return res;
//   }

//   /**
//    * Forces this client-session to be the active listener.
//    */
//   async forceActiveSession(options = {}) {
//     const res = await this.request("station/playbackResumed", {
//       content: Object.assign({ forceActive: true }, options)
//     });
//     return res;
//   }
// }

// module.exports = RESTManager;