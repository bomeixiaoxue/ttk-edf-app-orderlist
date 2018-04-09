import webapi from './webapi'

var _options = {
	webapi
}

function config(options) {
	if (options) {
		Object.assign(_options, options)
	}
}

config.current = _options

export default config

//对接口的扩展