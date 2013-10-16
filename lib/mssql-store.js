/*!
 * mssql-store
 * Copyright(c) 2013 Maxim Savin <soulman.is.good@gmail.com>
 * MIT Licensed
 */

var Store = require('connect').session.Store
  , tedious = require('tedious')
  , TYPES = require('tedious').TYPES;

function _default(callback) {
  callback = typeof(callback) === 'function' ? callback : function () { };
  return callback;
}

/**
 * Initialize MSSQLStore with the given `options`.
 *
 * @param {Object} options
 * @param {Function} callback
 * @api public
 */
var MSSQLSTORE = module.exports = function MSSQLStore(options, callback) {
    options = options || {db:{server: '127.0.0.1', userName:'test', password: 'test', options: {port: 56056, database: 'dev'}}};
    callback = _default(callback);

    var db = null;
    var self = this;

    db = new tedious.Connection(options.db);

    db.on('connect',function(err){
        if(err) {
            callback(err);
            console.log("Error connecting to MSSQL Server. Check config.",err);
        } else {
            Store.call(self, options);
        }
    });
};

MSSQLSTORE.prototype.__proto__ = Store.prototype;

/**
 * Attempt to fetch session by the given `sid`.
 *
 *   Old versions of this code used to store sessions in the database
 *   as a JSON string rather than as a structure.  For backwards
 *   compatibility, handle old sessions.
 *
 * @param {String} sid
 * @param {Function} cb
 * @api public
 */
MSSQLSTORE.prototype.get = function (sid, cb) {
    cb = _default(cb);
    var self = this;
    var request = new tedious.Request("Request");
    db.execSql(request);
};


/**
 * Commit the given `sess` object associated with the given `sid`.
 *
 * @param {String} sid
 * @param {Session} sess
 * @param {Function} cb
 * @api public
 */
MSSQLSTORE.prototype.set = function (sid, sess, cb) {
  cb = _default(cb);
  var update = {_id: sid, session: JSON.stringify(sess)};
  if (sess && sess.cookie && sess.cookie.expires) {
    update.expires = Date.parse(sess.cookie.expires);
  }

  _collection.update({_id: sid}, update, {upsert: true}, function (err, data) {
    cb.apply(this, arguments);
  });
};

/**
 * Destroy the session associated with the given `sid`.
 *
 * @param {String} sid
 * @api public
 */
MSSQLSTORE.prototype.destroy = function (sid, cb) {
  _collection.remove({_id: sid}, _default(cb));
};

/**
 * Fetch number of sessions.
 *
 * @param {Function} cb
 * @api public
 */
MSSQLSTORE.prototype.length = function (cb) {
  _collection.count({}, _default(cb));
};

/**
 * Clear all sessions.
 *
 * @param {Function} cb
 * @api public
 */
MSSQLSTORE.prototype.clear = function (cb) {
  _collection.drop(_default(cb));
};

/**
 * Get the collection
 *
 * @param
 * @api public
 */
MSSQLSTORE.prototype.getCollection = function () {
  return _collection;
};