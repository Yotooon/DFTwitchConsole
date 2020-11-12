import React, {useState, useEffect} from 'react'
import regeneratorRuntime from "regenerator-runtime"
import Authentication from '../../util/Authentication/Authentication'

import './App.scss'
import Row from './Rows'
import NotifyLines from './NotifyLines'
import { unix2time } from '../../util/DateTime'
import Message from '../../partials/StatusMessages'

function Notifications({messages=[], setMessages, delay=2000}) {
    const msgs = [...messages]

    useEffect(() => {
        const timer = setTimeout(() => {
            if (msgs.length) {
                msgs.shift()
                setMessages(msgs)
            }
        }, delay)
        return () => clearTimeout(timer)
    }, [messages])

    return (
        <div>
            {messages.messages.map(msg => <div key={msg.id}>{msg.content}</div>)}
        </div>
    )
}

export default class App extends React.Component {
    constructor(props) {
        super(props)
        this.Authentication = new Authentication()

        // If the extension is running on twitch or dev rig, set the shorthand here. otherwise, set to null. 
        this.twitch = window.Twitch ? window.Twitch.ext : null

        // websocket server
        this.ws = null
        
        this.state = {
            finishedLoading: false,
            theme: 'light',
            isVisible: true,
            arePlayerControlsVisible: false,

            isOpen: false,
            twitchUser: {
                'id': 0,
                'opaque_id': null,
                'name': '',
            },

            // format {type: 'info|success|warning|error', 'message': '<string>'}
            status_message: null,
            messages: [],
            messages_notif: [],
        }

        // input element ref
        this.inputEl = React.createRef()
        this.scrollerEl = React.createRef()

        this.getTwitchUser = this.getTwitchUser.bind(this)

        this.toggleConsole = this.toggleConsole.bind(this)
        this.onKeyPress = this.onKeyPress.bind(this)
        this.submitMessage = this.submitMessage.bind(this)

        this.initWebsocket = this.initWebsocket.bind(this)
        this.onConsoleMessage = this.onConsoleMessage.bind(this)
        this.appendMessage = this.appendMessage.bind(this)

        // this.fetchMessages = this.fetchMessages.bind(this)
        // this.sendMessage = this.sendMessage.bind(this)
    }

    fetchMessages() {
        let date = new Date()

        fetch('http://localhost:5000/console')
        .then((data) => {
            if(data.ok) {
                return data.json()
            }
            throw new Error('Network response was not OK')
        })
        .then((data) => {
            data.forEach((el) => {
                el.time = unix2time(el.timestamp)
            })
            
            this.setState({
                messages: data
            })
        })
    }

    sendMessage(msg) {
        let full_msg = new FormData()
        full_msg.append('author', msg.author)
        full_msg.append('message', msg.message)

        if(msg.command !== 'undefined') {
            full_msg.append('command', msg.command)
        }

        fetch('http://localhost:5000/console/send', {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
                // 'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: full_msg
        })
        .then((data) => {
            if(data.ok) {
                return data.json()
            }
            throw new Error('Network response was not OK')
        })
        .then((data) => {
            console.log(data)
        })
    }

    initWebsocket() {
        this.ws = new WebSocket("ws://localhost:5005")
        this.ws.onmessage = this.onConsoleMessage
    }

    onConsoleMessage(ev) {
        let msg = JSON.parse(ev.data)

        if(msg.action === 'message') {
            msg.message.time = unix2time(msg.message.timestamp)
            this.appendMessage(msg.message)
        }
    }

    contextUpdate(context, delta) {
        if(delta.includes('theme')) {
            this.setState(() => {
                return { theme: context.theme }
            })
        } else if(delta.includes('arePlayerControlsVisible')) {
            this.setState(() => {
                return { arePlayerControlsVisible: context.arePlayerControlsVisible }
            })
        }
    }

    visibilityChanged(isVisible) {
        this.setState(() => {
            return {
                isVisible
            }
        })
    }

    toggleConsole(e) {
        this.setState({
            isOpen: !this.state.isOpen
        }, () => {
            if(this.state.isOpen) {
                // Focus on the input
                this.inputEl.current.focus()

                // Keep the scrollbar at the bottom
                this.scrollerEl.current.scrollTop = this.scrollerEl.current.scrollHeight - this.scrollerEl.current.clientHeight
            }
        })
    }

    appendMessage(new_msg) {
        this.state.messages.push(new_msg)
        this.setState({
            messages: this.state.messages
        }, () => {
            this.inputEl.current.value = ''
            this.scrollerEl.current.scrollTop = this.scrollerEl.current.scrollHeight - this.scrollerEl.current.clientHeight
        })

        // Notifications

        if(this.state.messages_notif.length >= 3) {
            this.state.messages_notif.shift()
        }

        this.state.messages_notif.push(new_msg)
        this.setState({
            messages_notif: this.state.messages_notif //.slice(Math.max(this.state.messages_notif.length - 3, 1))
        })
    }

    submitMessage(e, inputEl) {
        let me = this.state.twitchUser.name
        let msg = inputEl ? inputEl.value.trim() : this.inputEl.current.value.trim()
        let date = new Date()

        if(this.state.status_message !== null) {
            return false
        }

        if(msg === '') {
            this.setState({
                status_message: {
                    'type': 'warning',
                    'message': 'Your message cannot be blank',
                }
            }, () => {
                // Hide the message after X amount of time
                setTimeout(() => {
                    this.setState({ status_message: null })
                }, 3500)
            })
            return false
        }

        let new_msg = {
            'author': me,
            'message': msg,
        }

        if(msg.startsWith('!')) {
            if(!msg.startsWith('!login')) {
                new_msg['command'] = msg
            }
        }

        this.sendMessage(new_msg)

        this.inputEl.current.value = ''
        this.scrollerEl.current.scrollTop = this.scrollerEl.current.scrollHeight - this.scrollerEl.current.clientHeight

        return true
    }

    onKeyPress(e) {
        // '~' [key] = 'Backquote' [code]
        let key = e.code

        if(key === 'Backquote') {
            e.preventDefault()
            this.toggleConsole()
            return
        }

        // Send a new console message (if the input element is focused)
        if(this.state.isOpen) {
            if(this.inputEl.current === document.activeElement && (key === 'Enter' || key === 'NumpadEnter')) {
                e.preventDefault()
                this.submitMessage()
            }
        } else {
            if(key === 'KeyT') {
                console.log('say should open')
            }
        }
    }

    // auth obj = {channelId, clientId, token, userId}
    getTwitchUser(auth) {
        let twitchUser = this.state.twitchUser
        twitchUser.opaque_id = this.Authentication.getOpaqueId()
        twitchUser.id = this.Authentication.getUserId()

        if(this.Authentication.isLoggedIn()) {
            if(this.Authentication.hasSharedId()) {
                fetch(`https://api.twitch.tv/kraken/users/${this.Authentication.getUserId()}`, {
                headers: {
                    'Client-ID': auth.clientId,
                    'Accept': 'application/vnd.twitchtv.v5+json',
                }
                })
                .then(response => response.json())
                .then(data => {
                    twitchUser.name = data.display_name
                    this.setState({twitchUser})
                })
            } else {
                twitchUser.name = `User_${twitchUser.opaque_id.substring(1, 6)}`
                this.setState({twitchUser})
            }

            return
        }

        twitchUser.name = `Guest_${twitchUser.opaque_id.substring(1, 6)}`
        this.setState({twitchUser})
    }

    componentDidMount() {
        if(this.twitch) {
            this.twitch.onAuthorized((auth) => {
                this.Authentication.setToken(auth.token, auth.userId)

                if(!this.state.finishedLoading) {
                    // if the component hasn't finished loading (as in we've not set up after getting a token), let's set it up now.
                    this.getTwitchUser(auth)

                    // now we've done the setup for the component, let's set the state to true to force a rerender with the correct data.
                    this.setState(() => {
                        return { finishedLoading: true }
                    })
                }
            })

            this.twitch.listen('broadcast', (target, contentType, body) => {
                this.twitch.rig.log(`New PubSub message!\n${target}\n${contentType}\n${body}`)

                // now that you've got a listener, do something with the result... 
            })

            this.twitch.onVisibilityChanged((isVisible, _c) => {
                this.visibilityChanged(isVisible)
            })

            this.twitch.onContext((context, delta) => {
                this.contextUpdate(context, delta)
            })

            document.addEventListener('keypress', this.onKeyPress)

            this.initWebsocket()
            this.fetchMessages()
            // this.new_message_interval = setInterval(this.fetchMessages, 1000)
        }
    }

    componentWillUnmount() {
        if(this.twitch) {
            this.twitch.unlisten('broadcast', () => console.log('successfully unlistened'))

            document.removeEventListener('keypress', this.onKeyPress)
            // clearInterval(this.new_message_interval)
        }
    }
    
    render() {
        if(this.state.finishedLoading && this.state.isVisible) {
            let statusMessage = this.state.status_message !== null ? <Message type={this.state.status_message.type} message={this.state.status_message.message}/> : null
            let svgClose = <svg className="say-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><g clipRule="evenodd" fillRule="evenodd"><path d="M16 0C7.163 0 0 7.163 0 16c0 8.836 7.163 16 16 16 8.836 0 16-7.163 16-16S24.836 0 16 0zm0 30C8.268 30 2 23.732 2 16S8.268 2 16 2s14 6.268 14 14-6.268 14-14 14z"/><path d="M22.729 21.271l-5.268-5.269 5.238-5.195a.992.992 0 000-1.414 1.018 1.018 0 00-1.428 0l-5.231 5.188-5.309-5.31a1.007 1.007 0 00-1.428 0 1.015 1.015 0 000 1.432l5.301 5.302-5.331 5.287a.994.994 0 000 1.414 1.017 1.017 0 001.429 0l5.324-5.28 5.276 5.276a1.007 1.007 0 001.428 0 1.015 1.015 0 00-.001-1.431z"/></g></svg>

            return (
                <div className={`app-wrap theme-${this.state.theme} console-${this.state.isOpen ? 'opened' : 'closed'} controls-${this.state.arePlayerControlsVisible ? 'visible' : 'hidden'}`}>
                    <div className="console-button" onClick={this.toggleConsole}>~</div>
                    <div className="console-wrap">
                        <div className="console-content-wrap">
                            <div className="console-scroller" ref={this.scrollerEl}>
                                <div className="rows-wrap">
                                    <div className="row-intro">
                                        <div className="title">Welcome to the Twitch ✕ Defrag  Interactive Console!</div>
                                        It allows you to chat directly with the players and other viewers. Have fun!<br/>
                                        <div className="meta">There is limited moderation. Viewer discretion is advised.<br/></div>
                                    </div>
                                    {this.state.messages.map((val) => {
                                        return <Row key={val.id} data={val}/>
                                    })}
                                </div>
                            </div>
                        </div>
                        <div className="console-input-wrap">
                            <div className="close-console-button" onClick={this.toggleConsole}>{svgClose}</div>
                            <div className="input-element-wrap">
                                {statusMessage}
                                <input type="text" className="input" ref={this.inputEl}/>
                            </div>
                        </div>
                    </div>
                    <NotifyLines onSubmit={this.submitMessage} isConsoleOpened={this.state.isOpen} messages={this.state.messages_notif}/>
                </div>
            )
        } else {
            return (
                <div className="app-wrap"></div>
            )
        }

    }
}

// <NotifyLines onSubmit={this.submitMessage} isConsoleOpened={this.state.isOpen} messages={this.state.messages.slice(Math.max(this.state.messages.length - 3, 1))}/>

/*
<p>Hello world! <input type="button" value="Minimize" onClick={this.twitch.actions.minimize}/></p>
<p>IsVisible: {this.state.isVisible ? 'Yes': 'No'}</p>
<p>My token is: {this.Authentication.state.token}</p>
<p>My opaque ID is {this.Authentication.getOpaqueId()}.</p>
<div>{this.Authentication.isModerator() ? <p>I am currently a mod, and here's a special mod button <input value='mod button' type='button'/></p>  : 'I am currently not a mod.'}</div>
<p>I have {this.Authentication.hasSharedId() ? `shared my ID, and my user_id is ${this.Authentication.getUserId()}` : 'not shared my ID'}.</p>
*/