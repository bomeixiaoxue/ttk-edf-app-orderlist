import config from './config'
import * as data from './data'

//app情况 每个app可单独使用
export default {
	name: "ttk-edf-app-orderlist",
	version: "1.0.7",
	description: "ttk-edf-app-orderlist",
	meta: data.getMeta(),
	components: [],
	dependencies:['mk-aar-grid'],
	config: config,
	load: (cb) => {
		require.ensure([], require => {
			cb(require('./component'), require('./action'), require('./reducer'))
		}, "ttk-edf-app-orderlist")
	}
}