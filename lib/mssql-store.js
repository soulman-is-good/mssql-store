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
  , tedious = require('tedious')
  , TYPES = require('tedious').TYPES;

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
    var opts = options || {};
    callback = _default(callback);
    
    ops = extend({},{db:{server: '127.0.0.1', userName:'test', password: 'test', options: {port: 56056, database: 'dev'}},token:'',procedures:{init:'PostSession',write:'PostSessionData'}},ops);
    var db = null;
    var self = this;
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
    db = new tedious.Connection(ops.db);

    db.on('connect',function(err){
        if(err) {
            cb(err);
            console.log("Error connecting to MSSQL Server. Check config.",err);
        } else {
            var result = 0;
            var request = new tedious.Request(ops.procedures.init,function(err,rows){
            	db.close();
            	if(err) {
	            callback(err);
	        } else {
                    Store.call(self, ops);
                }
            });
            request.on('doneProc',function(rowCount,more,returnStatus){
            	result = returnStatus;
            });
            request.on('row',function(columns){
            	var i;
            	for(i in columns) {
         	    if(i === 'SessionData') {
         	    	self.data = JSON.parse(columns[i].value);
         	    }
            	}
            });
            request.on('returnValue',function(name, value, metadata){
            	self.id = value;
            });
            request.addParameter('SessionToken',TYPES.NVarChar,sid);
            request.addOutputParameter('SessionToken',TYPES.NVarChar);
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

     _collection.update({_id: sid}, update, {upsert: true}, function (err, data) {
	cb.apply(this, arguments);
     });
  
    db = new tedious.Connection(ops.db);

    db.on('connect',function(err){
        if(err) {
            callback(err);
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
            request.on('returnValue',function(name, value, metadata){
            	console.log(name,value);
            });
            request.addParameter('SessionToken',TYPES.NVarChar,self.id);
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
//  _collection.drop(_default(cb));
};
