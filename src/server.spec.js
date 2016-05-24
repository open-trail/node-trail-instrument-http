'use strict'

import {expect} from 'chai'
import sinon from 'sinon'
import cls from 'continuation-local-storage'
import agent from 'trail-agent'
import wrapListener from './server'

describe('http.Server wrap', () => {
    let ns = cls.getNamespace('trail')
    let sandbox
    let records

    beforeEach((done) => {
        ns.run(() => {
            records = []
            agent.setRecorder((span) => {
                records.push(span)
            })
            sandbox = sinon.sandbox.create()
            done()
        })
    })

    afterEach(() => {
        sandbox.restore()
    })

    it('should create session span via agent', () => {
        sandbox.spy(agent, 'start')

        let listener = wrapListener(() => {}, agent)
        listener({url: '/', headers: {}}, {once: () => {}})

        expect(agent.start).to.be.calledOnce
    })

    it('should record span during request life cycle', (done) => {
        let listener = wrapListener(() => {}, agent)
        let onFinish

        let request = {
            headers: {
                'user-agent': '007',
            },
            url: '/',
        }
        let response = {
            once(name, cb) {
                if (name === 'finish') {
                    onFinish = cb
                }
            },
            statusCode: 200,
        }

        listener(request, response)

        expect(records.length).to.eql(0)
        // Mimic finish event
        let delay = 10
        setTimeout(() => {
            onFinish()

            expect(records.length).to.eql(1)
            let [span] = records
            expect(span.operationName).to.eql('/')
            expect(span.tags.protocol).to.eql('http')
            expect(span.duration).to.not.below(delay)

            done()
        }, delay)
    })
})
