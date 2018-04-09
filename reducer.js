import { Map, fromJS } from 'immutable'
import { reducer as MetaReducer } from 'edf-meta-engine'
import config from './config'
import { getInitState } from './data'
import extend from './extend'
class reducer {
    constructor(option) {
        this.metaReducer = option.metaReducer
        this.extendReducer = option.extendReducer
        this.config = config.current
    }

    init = (state, option) => {
        const initState = getInitState()
        return this.metaReducer.init(state, initState)
    }

    load = (state, response) => {
        state = this.metaReducer.sf(state, 'data.list', fromJS(response.list)) //更新列表
        state = this.metaReducer.sf(state, 'data.pagination', fromJS(response.pagination)) //更新翻页
        state = this.metaReducer.sf(state, 'data.filter', fromJS(response.filter)) //更新过滤器
        state = this.metaReducer.sf(state, 'data.total', fromJS(response.total)) //更新总数
        if (response.customers)
            state = this.metaReducer.sf(state, 'data.other.customers', fromJS(response.customers))

        return state
    }
}

export default function creator(option) {
	const metaReducer = new MetaReducer(option),
		extendReducer = extend.reducerCreator({ ...option, metaReducer }),
		o = new reducer({ ...option, metaReducer, extendReducer }),
		ret = { ...metaReducer, ...extendReducer.gridReducer, ...o }
        //使用装饰器中的 gridreducer
	return { ...ret }
}