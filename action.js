import React from 'react'
import { action as MetaAction, AppLoader } from 'edf-meta-engine'
import { fromJS } from 'immutable'
import config from './config'
import moment from 'moment'
import utils from 'edf-utils'
import extend from './extend'

class action {
    constructor(option) {
        this.metaAction = option.metaAction
        this.extendAction = option.extendAction
        this.config = config.current
        this.webapi = this.config.webapi
    }

    onInit = ({ component, injections }) => {
        this.extendAction.gridAction.onInit({ component, injections })
        this.component = component
        this.injections = injections
        injections.reduce('init')

        const pagination = this.metaAction.gf('data.pagination').toJS() //分页
        const filter = this.metaAction.gf('data.filter').toJS() //过滤器
        this.load(pagination, filter) //加载数据
    }

    load = async (pagination, filter) => {
        const response = await this.webapi.deliverOrderList.init({ pagination, filter }) //调用接口
        response.filter = filter//条件
        this.injections.reduce('load', response) //调用reduce 把res给load方法实现更新state
    }

    //根据当前页及条件重新加载数据
    reload = async () => {
        const pagination = this.metaAction.gf('data.pagination').toJS() //获取分页
        const filter = this.metaAction.gf('data.filter').toJS() //获取过滤条件
        this.load(pagination, filter) //加载数据
    }

    //增加
    add = async () => {
        if (!this.config.apps['mk-app-delivery-order']) {
            throw '依赖mk-app-delivery-order app,请使用mk clone mk-app-delivery-order命令添加'
        }

        this.component.props.setPortalContent &&
            this.component.props.setPortalContent('销售出库单', 'mk-app-delivery-order')
    }
    //点击批量按钮
    batchMenuClick = (e) => {
        switch (e.key) {
            case 'del':
                this.batchDel()
                break
            case 'audit':
                this.batchAudit()
                break
        }
    }
    
    //批量删除
    batchDel = async () => {
        const lst = this.metaAction.gf('data.list') //列表

        if (!lst || lst.size == 0) {
            this.metaAction.toast('error', '请选中要删除的记录')
            return
        }

        const selectRows = lst.filter(o => o.get('selected')) //选中的列表
        
        if (!selectRows || selectRows.size == 0) {
            this.metaAction.toast('error', '请选中要删除的记录')
            return
        }
        
        //弹出modal
        const ret = await this.metaAction.modal('confirm', {
            title: '删除',
            content: '确认删除?'
        })

        if (!ret)
            return

        const ids = selectRows.map(o => o.get('id')).toJS() //选中数据的id
        await this.webapi.deliverOrderList.del({ ids }) //通过接口删除id
        this.metaAction.toast('success', '删除成功') //提示删除成功
        this.reload() //重新加载数据
    }

    //批量审核
    batchAudit = async () => {
        const lst = this.metaAction.gf('data.list') //全部列表元素
        console.log(lst);
        
        if (!lst || lst.size == 0) {
            this.metaAction.toast('error', '请选中要审核的记录')
            return
        }

        const selectRows = lst.filter(o => {console.log(o); o.get('selected')}) //选中的列表元素
       // console.log(selectRows);
        if (!selectRows || selectRows.size == 0) {
            this.metaAction.toast('error', '请选中要审核的记录')
            return
        }

        const ids = selectRows.map(o => o.get('id')).toJS()//获取选中的id集合
        await this.webapi.deliverOrderList.audit({ ids })//调用接口
        this.metaAction.toast('success', '审核成功') //提示成功
        this.reload() //重新加载页面
    }

    //审核一个
    audit = (id) => async () => {
        await this.webapi.deliverOrderList.audit({ ids: [id] })
        this.metaAction.toast('success', '审核成功')
        this.reload()
    }

    //反审核一个
    reject = (id) => async () => {
        await this.webapi.deliverOrderList.reject({ ids: [id] })
        this.metaAction.toast('success', '反审核成功')
        this.reload()
    }

    //删除一个
    del = (id) => async () => {

        //弹出confirm
        const ret = await this.metaAction.modal('confirm', {
            title: '删除',
            content: '确认删除?'
        })

        if (!ret)
            return

        await this.webapi.deliverOrderList.del({ ids: [id] }) //调用接口删除
        this.metaAction.toast('success', '删除成功')
        this.reload() //重新加载
    }

    modify = (id) => async () => {
        if (!this.config.apps['ttk-edf-app-orderlist']) {
            throw '依赖mk-app-delivery-order app,请使用mk clone mk-app-delivery-order命令添加'
        }
        this.component.props.setPortalContent &&
            this.component.props.setPortalContent('存货卡片', 'ttk-edf-app-orderlist', { deliveryOrderId: id })
    }

    toggleShowAdvanceFilter = () => {
        this.metaAction.sf('data.other.isFold', !this.metaAction.gf('data.other.isFold'))
    }

    commonFilterChange = async (e) => {

        const key = e.target.value

        const pagination = this.metaAction.gf('data.pagination').toJS(),
            filter = this.metaAction.gf('data.filter').toJS()

        filter.common = key
        const response = await this.webapi.deliverOrderList.query({ pagination, filter })

        response.filter = filter

        this.load(pagination, filter)
    }

    tabChange = async (key) => {
        const pagination = this.metaAction.gf('data.pagination').toJS(),
            filter = this.metaAction.gf('data.filter').toJS()

        filter.targetList = key
        const response = await this.webapi.deliverOrderList.query({ pagination, filter })
        response.filter = filter

        this.load(pagination, filter)
    }

    customerChange = (v) => {
        const ds = this.metaAction.gf('data.other.customers')
        const hit = ds.find(o => o.get('id') == v)
        this.metaAction.sf(`data.filter.customer`, hit)
    }

    search = () => {
        this.reload()
    }

    pageChanged = (current, pageSize) => {
        const filter = this.metaAction.gf('data.filter').toJS()
        this.load({ current, pageSize }, filter)
    }

    receipt = () => {
        throw '请实现收框功能'
    }

    print = () => {
        throw '请实现打印功能'
    }

    export = () => {
        throw '请实现导出功能'
    }

    setting = () => {
        throw '请实现设置功能'
    }

    numberFormat = utils.number.format
}


export default function creator(option) {
	const metaAction = new MetaAction(option),
		extendAction = extend.actionCreator({ ...option, metaAction }),
		o = new action({ ...option, metaAction, extendAction }),
		ret = { ...metaAction, ...extendAction.gridAction, ...o }
	//装饰器的使用 写在...o的前面
	metaAction.config({ metaHandlers: ret })
	
	return ret
}
