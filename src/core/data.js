var _ = require('./utils');

/**
 * prefix data
 */
function _prefix(up, key, value) {
    if (+key + '' === key) key = +key;
    var options = {
        data: value,
        up: up,
        top: up._top,
        namespace: [up._namespace, key].join('.')
    };
    up[key] =
        (typeof value === 'object' && value !== null) ?
            _isArray(value) ?
                new DataArray(options) :
                    new Data(options) :
            value;
}

function _isArray(obj) {
    return Array.isArray(obj) || obj instanceof DataArray;
}

function _getLength(keys) {
    return keys.filter(function (key) {
        return +key + '' === key;
    }).length;
}

/**
 * Data
 * @class
 * @param {Object} options
 */
function Data(options) {
    var data = options.data,
        keys = Object.keys(options.data || {})
            .filter(function (key) { return key.indexOf('_') !== 0; }),
        self = this;
    _.extend(this, data);

    // all key need to traverse
    this._keys = keys;
    // parent data container
    this._up = options.up;
    // the most top parent data container
    this._top = options.top || this;
    // the namespace of data
    this._namespace = options.namespace || '';
    keys.forEach(function (key) {
        _prefix(self, key, data[key]);
    });
    // if it is a array
    (Array.isArray(data) || data instanceof DataArray) &&
        // fix the length
        (this.length = _getLength(keys));
}
_.extend(Data.prototype, {
    /**
     * get the namespace
     */
    $namespace: function (key) {
        return (
            key !== undefined ?
                [this._namespace, key].join('.') :
                this._namespace
        ).substring(1);
    },
    /**
     * set the value of the key
     */
    $set: function (key, value) {
        _prefix(this, key, value);
        this._top.$emit('data:' + this.$namespace(key), this[key]);
        return this;
    },
    /**
     * get the actual value
     */
    $get: function () {
        var res, keys = this._keys, self = this;
        if (this instanceof Data) {
            res = {};
        } else {
            res = [];
        }
        keys.forEach(function (key) {
            res[key] = self[key].$get ?
                self[key].$get() :
                self[key];
        });
        return res;
    }
});

function DataArray(options) {
    Data.call(this, options);
}
_.extend(DataArray.prototype, Data.prototype, {
    /**
     * push data
     */
    push: function (values) {
        values = _.slice.call(arguments, 0);
        var args = [];
        for (var i = 0, l = values.length; i < l; i++) {
            _prefix(this, this.length, values[i]);
            this._keys.push(this.length);
            args.push(this[this.length]);
            this.length++;
        }
        this._top.$emit('data:' + this.$namespace(), this, {
            method: 'push',
            args: args
        });

        return this;
    },
    /**
     * pop data
     */
    pop: function () {
        var res = this[--this.length];
        this[this.length] = null;
        delete this[this.length];
        this._keys.pop();
        this._top.$emit('data:' + this.$namespace(), this);
        return res;
    },
    /**
     * unshift
     */
    unshift: function (value) {
        this._keys.push(this.length);
        this.length++;
        for (var l = this.length; l--;) {
            this[l] = this[l - 1];
        }
        _prefix(this, 0, value);
        this._top.$emit('data:' + this.$namespace(), this);
        return this;
    },
    /**
     * shift
     */
    shift: function () {
        this.length--;
        var res = this[0];
        for (var i = 0, l = this.length; i < l; i++) {
            this[i] = this[i + 1];
        }
        this._keys.pop();
        this._top.$emit('data:' + this.$namespace(), this);
        return res;
    },
    /**
     * touch
     */
    touch: function (key) {
        this._top.$emit('data:' + this.$namespace(key), this);
    },
    /**
     * indexOf
     */
    indexOf: function (item) {
        for (var i = 0, l = this.length; i < l; i++) {
            if (this[i] === item) return i;
        }
        return -1;
    },
    /**
     * splice
     */
    splice: function (i, l /**, items support later **/) {
        for (var j = 0, k = l + i, z = this.length - l; i < z; i++, j++) {
            this[i] = this[k + j];
            this[i]._namespace = this[i]._namespace.replace(/\.(\d+?)$/, '.' + i);
        }
        for (;i < this.length; i++) {
            this[i] = null;
            delete this[i];
        }
        this.length -= l;
        this._keys.splice(this.length, l);
        this._top.$emit('data:' + this.$namespace(), this);
    },
    /**
     * forEach
     */
    forEach: function (foo) {
        for (var i = 0, l = this.length; i < l; i++) {
            foo(this[i], i);
        }
    },
    /**
     * filter
     */
    filter: function (foo) {
        var res = [];
        this.forEach(function (item, i) {
            if (foo(item)) res.push(item);
        });
        return res;
    }
});

module.exports = Data;
