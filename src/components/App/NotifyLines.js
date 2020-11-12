import React from 'react'

import { RowNotify } from './Rows'

export default class NotifyLines extends React.Component {
	constructor(props) {
		super(props)

		this.state = {
			isSayOpened: false,
			messages: []
		}

		// message timeout ids. key=message.id
		this.timeouts = new Map()

		this.inputEl = React.createRef()

		this.toggleSay = this.toggleSay.bind(this)
		this.onKeyPress = this.onKeyPress.bind(this)
	}

	arrIsEqual(arr1, arr2) {
		if (JSON.stringify(arr1) === JSON.stringify(arr2)) {
			return true
		}
		return false
	}

	toggleSay(e) {
        this.setState({
            isSayOpened: !this.state.isSayOpened
        }, () => {
            if(this.state.isSayOpened) {
				this.inputEl.current.focus()
				
            } else {
				this.inputEl.current.value = ''
			}
        })
	}
	
	onKeyPress(e) {
		// '~' [key] = 'Backquote' [code]
		let key = e.code

		if(this.state.isSayOpened) {
			if(key === 'Escape') {
				e.preventDefault()
				this.toggleSay()
				return
			}

			// Send a new console message (if the input element is focused)
			if(this.inputEl.current === document.activeElement && (key === 'Enter' || key === 'NumpadEnter')) {
				e.preventDefault()
				
				let ok = this.props.onSubmit(e, this.inputEl.current)
				if(ok) {
					this.inputEl.current.value = ''
					this.setState({
						isSayOpened: false,
					})
				}
			}
		} else {
			if(!this.props.isConsoleOpened) {
				if(key === 'KeyT') {
					e.preventDefault()
					this.toggleSay()
					return
				}
			}
		}
	}

	componentDidMount() {
		document.addEventListener('keydown', this.onKeyPress)
	}

	componentWillUnmount() {
		document.removeEventListener('keydown', this.onKeyPress)
	}

	// shouldComponentUpdate(nextProps, nextState) {
	// 	if(nextProps.length === 0) {
	// 		return false
	// 	}

	// 	if(this.arrIsEqual(this.props.messages, nextProps.messages)) {
	// 		return false
	// 	}

	// 	return true
	// }

	componentWillReceiveProps(nextProps) {
		if(nextProps.messages.length === 0) {
			return
		}

		if(this.state.messages.length === 0) {
			this.timeouts.clear()
		}

		let new_messages = []
		for(let i = 0; i <= nextProps.messages.length-1; i++) {
			if(!this.timeouts.has(nextProps.messages[i].id)) {
				new_messages.push(nextProps.messages[i])
				this.timeouts.set(nextProps.messages[i].id, setTimeout(() => {
					this.state.messages.shift()
					this.setState({
						messages: this.state.messages
					})
				}, 4500))
			}
		}

		this.setState({
			messages: nextProps.messages
		})

		// console.log('new props?', nextProps)
	}

	render() {
		let svgChat = <svg className="say-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M46.568 34.581v.015c-1.301.2-2.629.53-3.984.478-12.036-.75-19.873-8.212-20.379-17.122a14.979 14.979 0 011.045-5.986C9.787 14.332-.04 23.094-.04 33.57c0 6.962 4.177 13.177 11.123 17.258 1.573.924 1.752 7.861-7.097 12.05 0 0 12.529 1.976 20.473-8.067 1.964.282 3.996.883 6.075.883 14.557 0 24.237-7.162 26.776-16.896-2.531-.059-6.918-.737-10.39-4.308l-.352.091zm10.153-6.767c4.549-2.673 7.285-6.744 7.285-11.304 0-8.052-8.85-14.579-20.027-14.579-11.179 0-17.993 6.527-17.993 14.579s6.813 14.492 17.993 14.492c1.361 0 2.692-.394 3.979-.579 5.204 6.578 13.411 5.284 13.411 5.284-5.796-2.743-5.68-7.288-4.648-7.893z"/></svg>
		let svgClose = <svg className="say-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><g clipRule="evenodd" fillRule="evenodd"><path d="M16 0C7.163 0 0 7.163 0 16c0 8.836 7.163 16 16 16 8.836 0 16-7.163 16-16S24.836 0 16 0zm0 30C8.268 30 2 23.732 2 16S8.268 2 16 2s14 6.268 14 14-6.268 14-14 14z"/><path d="M22.729 21.271l-5.268-5.269 5.238-5.195a.992.992 0 000-1.414 1.018 1.018 0 00-1.428 0l-5.231 5.188-5.309-5.31a1.007 1.007 0 00-1.428 0 1.015 1.015 0 000 1.432l5.301 5.302-5.331 5.287a.994.994 0 000 1.414 1.017 1.017 0 001.429 0l5.324-5.28 5.276 5.276a1.007 1.007 0 001.428 0 1.015 1.015 0 00-.001-1.431z"/></g></svg>
		
		return (
			<div className={`notify-lines-wrap say-${this.state.isSayOpened ? 'opened' : 'closed'}`}>
				<div className="notify-lines">
					{this.state.messages.map((val) => {
						return <RowNotify key={val.id} data={val}/>
					})}
				</div>
				<div className="notify-input-area">
					<div className="say-button" onClick={this.toggleSay}>
						{this.state.isSayOpened ? svgClose : svgChat}
					</div>
					<div className="say-txt">Say:</div>
					<div className="notify-input-wrap"><input type="text" ref={this.inputEl} className="notify-input"/></div>
				</div>
			</div>
		)
	}
}