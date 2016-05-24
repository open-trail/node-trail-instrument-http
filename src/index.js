'use strict'

import http from 'http'
import shimmer from 'shimmer'

let debug = require('debug')('trail')

const LISTEN_METHODS = ['on', 'addListener']

module.exports = {
    wrap(agent) {
        agent.bindEmitter(http.Server.prototype)

        LISTEN_METHODS.forEach((method) => {
            shimmer.wrap(http.Server.prototype, method, function (addListener) {
                return function (type, listener) {
                    if (type === 'request' && typeof listener === 'function') {
                        return addListener.call(
                            this, type, require('./server')(listener, agent))
                    }
                    return addListener.apply(this, arguments)
                }
            })
            debug(`Instrumented http.Server.prototype.${method}`)
        })

        shimmer.wrap(http, 'request', function (original) {
            return require('./request')(original, agent)
        })
        debug('Instrumented http.request')

        return http
    },
    unwrap() {
        LISTEN_METHODS.forEach((method) => {
            shimmer.unwrap(http.Server.prototype, method)
            debug(`Removed instrumentation from http.Server.prototype.${method}`) // eslint-disable-line
        })

        shimmer.unwrap(http, 'request')
        debug('Removed instrumentation from http.request')
    },
}
