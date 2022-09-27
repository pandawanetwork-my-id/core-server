'use strict'

const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const compression = require('compression')
const { name: appName, version: appVersion } = require('./package.json')
// const debug = require('debug')()
const router = express.Router()

class Server {
    /**
     * @param {Object} p - object parameters
     * @param {Array[]} p.globalMiddlewares
     * @param {Object} p.middlewares
     * @param {Array} p.routes Array[Object]
     * @param {Array} p.controllers Array[Function]
     * @param {Array} p.statics Array[String]
     */
    constructor ({ globalMiddlewares, middlewares, routes, controllers, statics, plugins, helpers }) {
        this.app = express()
        this.app.set('x-powered-by', false)
        this.config = {
            globalMiddlewares,
            middlewares,
            routes,
            controllers,
            statics,
            plugins,
            helpers
        }
    }

    setObject(key, value) {
        if (key) {
            this.config[key] = value
        }
    }

    registerDefaultMiddlewares() {
        this.app.use(bodyParser.json())
        this.app.use(bodyParser.urlencoded({extended: true}))
        this.app.use(compression())
        this.app.use(cors())
        return this
    }

    registerGlobalMiddlewares() {
        if (this.config.globalMiddlewares) {
            for(const md of this.config.globalMiddlewares) {
                this.app.use(md)
            }
        }
        return this
    }

    registerRoutes() {
        for (const route of this.config.routes) {
            let routePath = route.path
            const { ApiVersion } = this.config.config
            if (ApiVersion) routePath = routePath.replace('{api_version}', ApiVersion)
            const routeMethod = (route.method || 'ALL').toLowerCase()
            const controller = this.config.controllers[route.controller]
            const bindingModule = {
                plugins: this.config.plugins,
                helpers: this.config.helpers,
                config: this.config.config,
            }
            const middlewares = (route.middlewares || []).map(x => {
                if (typeof x === 'function') return x.bind(bindingModule)
                return this.config.middlewares[x].bind(bindingModule)
            })
            if (['get', 'post', 'put', 'all', 'delete'].indexOf(routeMethod) > -1) {
                console.log('registering route: ', routeMethod.toUpperCase(), routePath, ':: ' + route.controller, ':: middleware' + `[${route.middlewares.join(',')}]`)
                const handler = async (req, res, next) => {
                    try {
                        if (!controller) throw new Error('Invalid / Not Found Controller: ' + route.controller)
                        else
                            await controller.call(undefined, {
                                request: req,
                                response: res,
                                ...bindingModule,
                                next
                            })
                    } catch (err) {
                        next(err)
                    }
                }
                router[routeMethod](routePath, middlewares, handler)
            }
        }
        this.app.use(router)
        // if error
        this.app.use((err, req, res, next) => {
            if (err) {
                console.log(err)
                res.status(500).send({code: 500, message: err.message})
            }
        })
    }

    start({port, host}, callback) {
        this.registerDefaultMiddlewares()
        this.registerGlobalMiddlewares()
        this.registerRoutes()
        this.app.listen(port, host, 0, () => {
            const msg ='server publish on ' + 'http://'+host+':'+port
            // debug(msg)
            if (typeof callback === 'function') callback(msg)
        })
    }
}

module.exports = Server
