'use strict'

function wrapListener(listener, agent) {
    return function (request, response) {
        let requestUrl = request.url.split('?')[0]
        let headers = request.headers

        let span = agent.start(requestUrl, agent.FORMAT_TEXT_MAP, headers)
        span.setTag('host', headers.host)
        span.setTag('protocol', 'http')

        response.once('finish', function instrumentedFinish() {
            let status = response.statusCode > 399 ? 1 : 0
            span.setTag('status', status)
            span.finish()
        })

        return listener.apply(this, arguments)
    }
}

module.exports = wrapListener
