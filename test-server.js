'use strict'

process.env.NODE_ENV = 'development'
process.env.DEBUG = 'server:1.0.0'

const Server = require('./index')

const routes = [
    {
        path: '/',
        method: 'GET',
        middlewares: ['auth', 'auth1'],
        controller: 'Home'
    }
]

const controllers = {
    Home: function (req, res) {
        console.log('controller')
        res.send('ok')
    }
}

const middlewares = {
    'auth': function (req, res, next) {
        console.log('Auth')
        next()
    },
    'auth1': function (req, res, next) {
        console.log('auth1')
        next()
    }
}

new Server({routes, controllers, middlewares})
    .start({
        port: '3009',
        host: 'localhost'
    }, console.log)