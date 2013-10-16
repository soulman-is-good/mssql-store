
/*!
 * Facecom - session - MSSQLStore
 * Copyright(c) 2013 Facecom, Maxim Savin
 */

/**
 * Module dependencies.
 */

var Store = require('connect/middleware/session/store');

/**
 * Initialize a new `MemoryStore`.
 *
 * @api public
 */

var MSSQLStore = module.exports = function MSSQLStore() {
  this.sessions = {};
  console.log(1);
};

/**
 * Inherit from `Store.prototype`.
 */

MSSQLStore.prototype.__proto__ = Store.prototype;

/**
 * Attempt to fetch session by the given `sid`.
 *
 * @param {String} sid
 * @param {Function} fn
 * @api public
 */

MSSQLStore.prototype.get = function(sid, fn){
  var self = this;
  console.log(2);
  process.nextTick(function(){
    var expires
      , sess = self.sessions[sid];
    if (sess) {
      sess = JSON.parse(sess);
      expires = 'string' == typeof sess.cookie.expires
        ? new Date(sess.cookie.expires)
        : sess.cookie.expires;
      if (!expires || new Date < expires) {
        fn(null, sess);
      } else {
        self.destroy(sid, fn);
      }
    } else {
      fn();
    }
  });
};

/**
 * Commit the given `sess` object associated with the given `sid`.
 *
 * @param {String} sid
 * @param {Session} sess
 * @param {Function} fn
 * @api public
 */

MSSQLStore.prototype.set = function(sid, sess, fn){
  var self = this;
  console.log(3);
  process.nextTick(function(){
    self.sessions[sid] = JSON.stringify(sess);
    fn && fn();
  });
};

/**
 * Destroy the session associated with the given `sid`.
 *
 * @param {String} sid
 * @api public
 */

MSSQLStore.prototype.destroy = function(sid, fn){
  var self = this;
  process.nextTick(function(){
    delete self.sessions[sid];
    fn && fn();
  });
};

/**
 * Invoke the given callback `fn` with all active sessions.
 *
 * @param {Function} fn
 * @api public
 */

MSSQLStore.prototype.all = function(fn){
  var arr = []
    , keys = Object.keys(this.sessions);
  for (var i = 0, len = keys.length; i < len; ++i) {
    arr.push(this.sessions[keys[i]]);
  }
  fn(null, arr);
};

/**
 * Clear all sessions.
 *
 * @param {Function} fn
 * @api public
 */

MSSQLStore.prototype.clear = function(fn){
  this.sessions = {};
  fn && fn();
};

/**
 * Fetch number of sessions.
 *
 * @param {Function} fn
 * @api public
 */

MSSQLStore.prototype.length = function(fn){
  fn(null, Object.keys(this.sessions).length);
};
