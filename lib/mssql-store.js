/**
 * mssql-store
 *
 * connect module for work with session on MSSQL Server
 * Needs two stored procedures. One for initialize session by token, that has input/output parameter @Token
 * and returns TDS with session data and second for posting session data by token.
 *
 * Copyright(c) 2013 Maxim Savin <soulman.is.good@gmail.com>
 * MIT Licensed
 */

var Store = require('connect').session.Store
  , Session = require('connect').session.Session
  , Cookie = require('connect').session.Cookie
  , tedious = require('tedious')
  , TYPES = require('tedious').TYPES
  , ops = {}
  , db = null;

function _default(callback) {
  callback = typeof(callback) === 'function' ? callback : function () { };
  return callback;
}
function extend(target) {
    var sources = [].slice.call(arguments, 1);
    sources.forEach(function (source) {
        for (var prop in source) {
            target[prop] = source[prop];
        }
    });
    return target;
}
/**
 * Initialize MSSQLStore with the given `options`.
 *
 * @param {Object} options
 * @param {Function} callback
 * @api public
 */
var MSSQLSTORE = module.exports = function MSSQLStore(options, callback) {
    ops = options || {};
    callback = _default(callback);

    ops = extend({},{db:{server: '127.0.0.1', userName:'test', password: 'test', options: {port: 56056, database: 'dev'}},procedures:{init:'PostSession',write:'PostSessionData'}},ops);
    Store.call(this, options, callback);
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
MSSQLSTORE.prototype.get = function (sid, cb, _i) {
    cb = _default(cb);
    var self = this;
    db = new tedious.Connection(ops.db);
    db.on('connect',function(err){
        if(err) {
            cb(err);
            console.log("Error connecting to MSSQL Server. Check config.",err);
        } else {
            var result = 0;
            var data = {};
            var request = new tedious.Request(ops.procedures.init,function(err,rows){
            	db.close();
            	if(err || result !== 0) {
            	    if(result === -3 && 'undefined' === typeof _i) {
            	        self.get("",cb,1);
            	    } else {
                        if(result !== 0) {
                            err = "SQL Server Error " + result;
                        }
                        throw new Error(err);
            	    }
                } else {
                    cb(null, sid, data);
                    Store.call(self, ops);
                }
            });
            request.on('doneProc',function(rowCount,more,returnStatus){
            	result = returnStatus<<16>>16;
            });
            request.on('row',function(columns){
            	var i;
            	for(i in columns) {
         	        if(columns[i].metadata.colName === 'SessionData') {
         	    	    data = columns[i].value!=''?JSON.parse(columns[i].value):{};
         	        }
            	}
            });
            request.on('returnValue',function(name, value, metadata){
            	sid = value;
            });
            request.addOutputParameter('SessionToken',TYPES.NVarChar,sid);
            db.callProcedure(request);
        }
    });
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
     var self = this;

    db = new tedious.Connection(ops.db);

    db.on('connect',function(err){
        if(err) {
            cb(err);
            console.log("Error connecting to MSSQL Server. Check config.",err);
        } else {
            var result = 0;
            var request = new tedious.Request(ops.procedures.write,function(err,rows){
            	db.close();
                cb.apply(this,arguments);
            });
            request.on('doneProc',function(rowCount,more,returnStatus){
            	result = returnStatus;
            });
            request.addParameter('SessionToken',TYPES.NVarChar,sid);
            if(sess.user_id > 0) {
                request.addParameter('SessionAccount',TYPES.NVarChar,sess.user_id);
            }
            request.addParameter('SessionData',TYPES.NVarChar, JSON.stringify(sess));
            db.callProcedure(request);
        }
    });
};

/**
 * Destroy the session associated with the given `sid`.
 *
 * @param {String} sid
 * @api public
 */
MSSQLSTORE.prototype.destroy = function (sid, cb) {
    _default(cb).call();
//  _collection.remove({_id: sid}, _default(cb));
};

/**
 * Fetch number of sessions.
 *
 * @param {Function} cb
 * @api public
 */
MSSQLSTORE.prototype.length = function (cb) {
	_default(cb).call(this,1);
//  _collection.count({}, _default(cb));
};

/**
 * Clear all sessions.
 *
 * @param {Function} cb
 * @api public
 */
MSSQLSTORE.prototype.clear = function (cb) {
    _default(cb).call();
//  _collection.drop(_default(cb));
};


/**
 * Generatesa new session
 *
 * @param {Request} req
 * @api public
 */
MSSQLSTORE.prototype.generate = function (req,cb) {
    var self = this;
    db = new tedious.Connection(ops.db);
    db.on('connect',function(err){
        if(err) {
            console.error("Error connecting to MSSQL Server. Check config.",err);
        } else {
            var result = 0;
            var sid = '';
            var data = {};
            var request = new tedious.Request(ops.procedures.init,function(err,rows){
            	db.close();
            	if(err || result !== 0) {
            	    if(result !== 0) {
            	        err = "SQL Server Error " + result;
            	    }
                    throw new Error(err);
                } else {
                    req.sessionID = sid;
                    req.session = new Session(req,data);
                    req.session.cookie = new Cookie(self.cookie);
                    Store.call(self, ops);
                    cb.call(self,sid);
                }
            });
            request.on('doneProc',function(rowCount,more,returnStatus){
            	result = returnStatus<<16>>16;
            });
            request.on('row',function(columns){
            	var i;
            	for(i in columns) {
         	        if(columns[i].metadata.colName === 'SessionData') {
         	    	    data = columns[i].value!=''?JSON.parse(columns[i].value):{};
         	        }
            	}
            });
            request.on('returnValue',function(name, value, metadata){
            	sid = value;
            });
            request.addOutputParameter('SessionToken',TYPES.NVarChar,sid);
            db.callProcedure(request);
        }
    });
};


/**
 * Create session from JSON `sess` data.
 *
 * @param {IncomingRequest} req
 * @param {Object} sess
 * @return {Session}
 * @api private
 */

MSSQLSTORE.prototype.createSession = function(req, sess){
  sess.cookie = new Cookie(sess.cookie);
  req.session = new Session(req, sess);
  return req.session;
};