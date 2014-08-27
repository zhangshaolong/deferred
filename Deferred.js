/**
 * @file 异步调用处理
 * @author：张少龙（zhangshaolongjj@163.com）
 */
var Deferred = function () {
    // for fast find it
    var slice = Array.prototype.slice;
    // fix bind to ES5
    Function.prototype.bind = (Function.prototype.bind || function (context) {
        var me = this;
        var args = slice.call(arguments);
        return function () {
            return me.apply(context, args.slice(1));
        };
    });
    var Queue = function () {
        this.queue = [];
    };
    Queue.prototype.push = function (task) {
        this.queue.push(task);
        this.onaddqueue(task);
    };
    Queue.prototype.flush = function () {
        var tasks = this.queue.slice(0);
        this.clear();
        return tasks;
    };
    Queue.prototype.clear = function () {
        this.queue.length = 0;
        this.onclearqueue();
    };
    Queue.prototype.onaddqueue = function (task) {
    };
    Queue.prototype.onclearqueue = function () {
    };
    // promise`s then return deferred for chain call
    var Promise = function (deferred) {
        this.then = function (done, fail) {
            return deferred.then(done, fail);
        },
        this.done = function (done) {
            return deferred.done(done);
        },
        this.fail = function (fail) {
            return deferred.fail(fail);
        },
        this.ensure = function (done) {
            return deferred.ensure(done);
        },
        this.state = function () {
            return deferred.state;
        }
    };
    var Deferred = function () {
        this.state = 'pending';// pending;fulfilled;rejected
        this._args = null;
        this.fulfilledQueue = new Queue();
        this.rejectedQueue = new Queue();
        this.promise = new Promise(this);
    };
    var taskHandler = function (deferred, state, args) {
        if (deferred.state !== 'pending') {
            return;
        }
        deferred.state = state;
        var flushQueue = function () {
            var queue = deferred[state + 'Queue'].flush();
            for (var i = 0, len = queue.length; i< len; i++) {
                queue[i].apply(null, args);
            }
        };
        setTimeout(flushQueue, 0);
    };
    Deferred.prototype.resolve = function () {
        taskHandler(this, 'fulfilled', arguments);
    };
    Deferred.prototype.reject = function () {
        taskHandler(this, 'rejected', arguments);
    };
    Deferred.prototype.then = function (done, fail) {
        var deferred = new Deferred();
        var me = this;
        if (done) {
            this.fulfilledQueue.push(function () {
                var result = done.apply(me.promise, arguments);
                if (result && result.then) {
                    result.then(deferred.resolve.bind(deferred),
                            deferred.reject.bind(deferred));
                } else {
                    deferred.resolve(result);
                }
            });
        }
        if (fail) {
            this.rejectedQueue.push(function () {
                var result = fail.apply(me.promise, arguments);
                if (result && result.then) {
                    result.then(deferred.resolve.bind(deferred),
                            deferred.reject.bind(deferred));
                } else {
                    deferred.reject(result);
                }
            });
        }
        return deferred.promise;
    };
    Deferred.prototype.done = function (done) {
        return this.then(done);
    };
    Deferred.prototype.fail = function (fail) {
        return this.then(null, fail);
    };
    Deferred.prototype.ensure = function (done) {
        return this.then(done, done);
    };
    return Deferred;
}();